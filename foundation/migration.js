'use strict';

const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { validateDatabase } = require('../storage');
const { canonical, writeState } = require('./state-repository');
const { assertScope, loadState } = require('./scoped-state');
const { appendAudit } = require('./audit');
const { hash } = require('./sql-store');
const { AppError } = require('./errors');

const COLLECTIONS = ['products','customers','sales','suppliers','purchases','payables','expenses','quotes','cashSessions','stockMovements','stockEntries','auditLog','operationCommands','purchaseCommands','quoteCommands','cashCommands','inventories','reservations','tasks','hiddenOperations','priceLists','promotions','quarantineEntries','supplierReturns','storeCredits','deliveries','supplierQuotes','expenseCenters','expenseBudgets','families','positions','transfers','positionMovements','purchaseConferences','purchaseAmendments','purchaseOccurrences','agreements','recurringModels','recurringOccurrences','procedures','procedureExecutions','priceReviews'];

function invalid(code, message) { return new AppError(422, code, message); }

// Validate references that are actually recorded; missing legacy fields are not invented.
// Unknown fields/collections remain opaque and are preserved, not reinterpreted.
function validateLegacyReferences(state) {
  const ids = new Map(COLLECTIONS.map(kind => [kind, new Set((state[kind] || []).map(row => row.id).filter(Boolean))]));
  function ref(kind, id, location) {
    if (id === undefined || id === null || id === '') return;
    if (typeof id !== 'string' || !ids.get(kind)?.has(id)) throw invalid('LEGACY_REFERENCE_INVALID', 'Vínculo legado inválido em ' + location + '. A origem foi preservada.');
  }
  function nested(kind, id, rows, location) {
    if (id === undefined || id === null || id === '') return;
    if (typeof id !== 'string' || !rows?.some(row => row.id === id)) throw invalid('LEGACY_REFERENCE_INVALID', 'Vínculo legado inválido em ' + location + '. A origem foi preservada.');
  }
  function link(value, location) {
    if (!value) return;
    if (!COLLECTIONS.includes(value.kind)) throw invalid('LEGACY_REFERENCE_INVALID', 'Tipo de vínculo legado inválido em ' + location + '.');
    ref(value.kind, value.id, location);
    if (value.installmentId) {
      const document = (state[value.kind] || []).find(row => row.id === value.id);
      const rows = value.kind === 'sales' ? require('../public/accounts-core').receivableRows(document, true) : value.kind === 'payables' ? document.installments : [];
      nested(value.kind, value.installmentId, rows, location + '.installmentId');
    }
  }
  for (const product of state.products) {
    ref('families', product.familyId, 'products.familyId');
    for (const alternate of product.substitutes || []) ref('products', alternate.productId, 'products.substitutes.productId');
  }
  for (const customer of state.customers) ref('priceLists', customer.preferredPriceListId, 'customers.preferredPriceListId');
  for (const kind of ['sales','quotes','reservations']) for (const row of state[kind] || []) {
    ref('customers', row.customerId, kind + '.customerId');
    for (const item of row.items || []) ref('products', item.productId, kind + '.items.productId');
    ref('sales', row.saleId, kind + '.saleId');
    ref('quotes', row.quoteId, kind + '.quoteId');
    ref('reservations', row.reservationId, kind + '.reservationId');
    ref('agreements', row.activeAgreementId, kind + '.activeAgreementId');
    if (kind === 'quotes') ref('quotes', row.sourceId, 'quotes.sourceId');
    for (const receipt of row.receipts || []) {
      ref('cashSessions', receipt.cashSessionId, kind + '.receipts.cashSessionId');
      ref('agreements', receipt.agreementId, kind + '.receipts.agreementId');
    }
    for (const refund of row.refunds || []) ref('cashSessions', refund.cashSessionId, kind + '.refunds.cashSessionId');
  }
  for (const purchase of state.purchases || []) {
    ref('suppliers', purchase.supplierId, 'purchases.supplierId');
    ref('purchases', purchase.sourceId, 'purchases.sourceId');
    ref('supplierQuotes', purchase.supplierQuoteId, 'purchases.supplierQuoteId');
    for (const item of purchase.items) ref('products', item.productId, 'purchases.items.productId');
    for (const receipt of purchase.receipts) ref('purchaseConferences', receipt.conferenceId, 'purchases.receipts.conferenceId');
    for (const id of purchase.amendmentIds || []) ref('purchaseAmendments', id, 'purchases.amendmentIds');
  }
  for (const payable of state.payables || []) {
    ref('suppliers', payable.supplierId, 'payables.supplierId');
    ref('purchases', payable.purchaseId, 'payables.purchaseId');
    ref('agreements', payable.activeAgreementId, 'payables.activeAgreementId');
  }
  for (const expense of state.expenses || []) {
    ref('payables', expense.payableId, 'expenses.payableId');
    ref('cashSessions', expense.cashSessionId, 'expenses.cashSessionId');
    ref('agreements', expense.agreementId, 'expenses.agreementId');
    ref('recurringOccurrences', expense.recurringOccurrenceId, 'expenses.recurringOccurrenceId');
  }
  for (const kind of ['stockMovements','stockEntries','positionMovements']) for (const row of state[kind] || []) {
    ref('products', row.productId, kind + '.productId');
    ref('purchases', row.purchaseId, kind + '.purchaseId');
    ref('sales', row.saleId, kind + '.saleId');
  }
  for (const inventory of state.inventories || []) for (const item of inventory.items) ref('products', item.productId, 'inventories.items.productId');
  for (const task of state.tasks || []) link(task.link, 'tasks.link');
  for (const list of state.priceLists || []) for (const item of list.items) ref('products', item.productId, 'priceLists.items.productId');
  for (const promotion of state.promotions || []) for (const id of promotion.productIds) ref('products', id, 'promotions.productIds');
  for (const returned of state.supplierReturns || []) {
    ref('purchases', returned.purchaseId, 'supplierReturns.purchaseId');
    ref('suppliers', returned.supplierId, 'supplierReturns.supplierId');
    const purchase = (state.purchases || []).find(row => row.id === returned.purchaseId);
    nested('purchases', returned.receiptId, purchase?.receipts, 'supplierReturns.receiptId');
    for (const item of returned.items) { ref('products', item.productId, 'supplierReturns.items.productId'); ref('quarantineEntries', item.quarantineEntryId, 'supplierReturns.items.quarantineEntryId'); }
  }
  for (const quote of state.supplierQuotes || []) for (const supplier of quote.suppliers) ref('suppliers', supplier.id, 'supplierQuotes.suppliers.id');
  for (const kind of ['purchaseConferences','purchaseAmendments','purchaseOccurrences']) for (const row of state[kind] || []) {
    ref('purchases', row.purchaseId, kind + '.purchaseId');
    ref('suppliers', row.supplierId, kind + '.supplierId');
    ref('tasks', row.taskId, kind + '.taskId');
    if (row.receiptId) nested('purchases', row.receiptId, (state.purchases || []).find(p => p.id === row.purchaseId)?.receipts, kind + '.receiptId');
  }
  for (const agreement of state.agreements || []) ref(agreement.side === 'receive' ? 'customers' : 'suppliers', agreement.counterpartyId, 'agreements.counterpartyId');
  for (const model of state.recurringModels || []) for (const revision of model.revisions) { ref('suppliers', revision.supplierId, 'recurringModels.revisions.supplierId'); ref('expenseCenters', revision.expenseCenterId, 'recurringModels.revisions.expenseCenterId'); }
  for (const occurrence of state.recurringOccurrences || []) ref('payables', occurrence.relatedPayableId, 'recurringOccurrences.relatedPayableId');
  for (const execution of state.procedureExecutions || []) {
    ref('procedures', execution.procedureId, 'procedureExecutions.procedureId');
    link(execution.link, 'procedureExecutions.link');
    for (const step of execution.steps) { ref('tasks', step.taskId, 'procedureExecutions.steps.taskId'); for (const reference of step.references) link(reference, 'procedureExecutions.steps.references'); }
  }
  for (const review of state.priceReviews || []) { ref('priceLists', review.listId, 'priceReviews.listId'); ref('priceReviews', review.reversalOf, 'priceReviews.reversalOf'); }
  return state;
}

// These are verification aggregates per field path, not new accounting balances.
// BigInt accumulators and decimal strings avoid overflow when many safe values are added.
function summarizeState(state) {
  const counts = Object.fromEntries(COLLECTIONS.map(kind => [kind, (state[kind] || []).length]));
  const presentCollections = COLLECTIONS.filter(kind => Object.hasOwn(state, kind));
  const topLevelIdDigests = {}, nestedIds = new Map(), cents = new Map();
  for (const [kind, rows] of Object.entries(state)) if (Array.isArray(rows)) {
    if (!COLLECTIONS.includes(kind)) counts[kind] = rows.length;
    const ids = rows.filter(row => row && typeof row.id === 'string').map(row => row.id).sort();
    topLevelIdDigests[kind] = {count: ids.length, sha256: hash(JSON.stringify(ids))};
  }
  function walk(value, location) {
    if (Array.isArray(value)) { for (const item of value) walk(item, location + '[]'); return; }
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      const field = location ? location + '.' + key : key;
      if (key === 'id' && typeof child === 'string') { let values = nestedIds.get(field); if (!values) nestedIds.set(field, values = []); values.push(child); }
      if (key.endsWith('Cents') && Number.isSafeInteger(child)) cents.set(field, (cents.get(field) || 0n) + BigInt(child));
      walk(child, field);
    }
  }
  walk(state, '');
  return {
    presentCollections, counts,
    topLevelIdDigests,
    nestedIdDigests: Object.fromEntries([...nestedIds].sort(([a],[b]) => a.localeCompare(b)).map(([field, values]) => [field, {count: values.length, sha256: hash(JSON.stringify(values.sort()))}])),
    centsByPath: Object.fromEntries([...cents].sort(([a],[b]) => a.localeCompare(b)).map(([field, value]) => [field, value.toString()])),
    canonicalSHA256: hash(canonical(state))
  };
}

function readSource(file) {
  let bytes;
  try { bytes = fs.readFileSync(file); } catch { throw invalid('LEGACY_SOURCE_UNREADABLE', 'Não foi possível ler a origem legada. Nenhum dado foi importado.'); }
  let state;
  try {
    const text = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
    state = JSON.parse(text, (key, value) => {
      if (typeof value === 'number' && (!Number.isFinite(value) || Number.isInteger(value) && !Number.isSafeInteger(value))) throw invalid('LEGACY_NUMBER_UNSAFE', 'O legado contém número fora da precisão segura. Revise a origem; nenhum valor foi arredondado na importação.');
      return value;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw invalid('LEGACY_JSON_INVALID', 'O arquivo legado não contém JSON UTF-8 válido. A origem foi preservada.');
  }
  try { validateDatabase(state); validateLegacyReferences(state); }
  catch (error) { if (error instanceof AppError) throw error; throw invalid('LEGACY_DATA_INVALID', 'A estrutura ou integridade do legado é inválida. A origem foi preservada.'); }
  return {state, sourceHash: hash(bytes)};
}

function assertSourceUnchanged(file, sourceHash) {
  let after;
  try { after = hash(fs.readFileSync(file)); } catch { throw invalid('LEGACY_SOURCE_CHANGED', 'A origem não pôde ser conferida após a importação. A transação foi desfeita.'); }
  if (after !== sourceHash) throw new AppError(409, 'LEGACY_SOURCE_CHANGED', 'A origem mudou durante a importação. A transação foi desfeita.');
  return after;
}

function performImport(store, scope, legacyFile) {
  store.requireTransaction(); assertScope(store, scope);
  const {state, sourceHash} = readSource(legacyFile);
  const previous = store.db.prepare('SELECT source_hash,report_json FROM import_runs WHERE company_id=? AND unit_id=?').get(scope.companyId, scope.unitId);
  if (previous) {
    if (previous.source_hash !== sourceHash) throw new AppError(409, 'LEGACY_ALREADY_IMPORTED', 'Esta unidade já recebeu outra origem. Revise a migração; os dados atuais não foram substituídos.');
    assertSourceUnchanged(legacyFile, sourceHash);
    return {...JSON.parse(previous.report_json), alreadyImported: true};
  }
  if (loadState(store, scope).revision !== 0) throw new AppError(409, 'LEGACY_STATE_EXISTS', 'Esta unidade já possui dados sem esta importação. Os dados atuais não foram substituídos.');
  const before = summarizeState(state);
  const revision = writeState(store, scope, state, 0);
  const reloaded = loadState(store, scope);
  const after = summarizeState(reloaded.state);
  if (canonical(state) !== canonical(reloaded.state) || canonical(before) !== canonical(after)) throw new AppError(500, 'LEGACY_VERIFICATION_FAILED', 'A conferência da importação falhou. A transação foi desfeita.');
  const sourceHashAfter = assertSourceUnchanged(legacyFile, sourceHash);
  const report = {
    formatVersion: 1, companyId: scope.companyId, unitId: scope.unitId,
    importedAt: new Date().toISOString(), importedRevision: revision,
    sourceHash, sourceHashAfter, sourceUnchanged: true,
    schemaVersionPresent: Object.hasOwn(state, 'schemaVersion'), schemaVersion: state.schemaVersion ?? null,
    verification: {canonicalEqual: true, countsEqual: true, idsEqual: true, centsEqual: true},
    ...before,
    notes: ['Payload histórico preservado integralmente; não atribui usuário a responsáveis declarados.', 'Agregados por caminho servem à conferência, não representam saldos contábeis somáveis entre caminhos.']
  };
  store.db.prepare('INSERT INTO import_runs VALUES(?,?,?,?,?)').run(scope.companyId, scope.unitId, sourceHash, JSON.stringify(report), report.importedAt);
  appendAudit(store, {userId: null, executedBy: null, companyId: scope.companyId, unitId: scope.unitId, action: 'IMPORT', entity: 'legacy_state', recordId: scope.unitId, after: report, reason: 'Importação técnica conferida; identidade histórica mantida como declarada.'});
  // Check after audit too: a failure anywhere still rolls back state, index and import record.
  assertSourceUnchanged(legacyFile, sourceHash);
  return {...report, alreadyImported: false};
}

function importLegacy(store, scope, legacyFile) {
  if (typeof legacyFile !== 'string' || !legacyFile) throw invalid('LEGACY_SOURCE_REQUIRED', 'Informe explicitamente a origem legada.');
  if (!store.inTransaction) return store.transaction(() => performImport(store, scope, legacyFile));
  // Keep an outer transaction usable even if its caller catches this import error.
  const savepoint = 'legacy_import_' + randomUUID().replaceAll('-', '');
  store.db.exec('SAVEPOINT ' + savepoint);
  try { const report = performImport(store, scope, legacyFile); store.db.exec('RELEASE SAVEPOINT ' + savepoint); return report; }
  catch (error) { store.db.exec('ROLLBACK TO SAVEPOINT ' + savepoint); store.db.exec('RELEASE SAVEPOINT ' + savepoint); throw error; }
}

module.exports = {importLegacy, summarizeState, validateLegacyReferences, COLLECTIONS};
