'use strict';
const {test} = require('node:test'), assert = require('node:assert/strict');
const {SqlStore} = require('./sql-store'), {createCompany, createUnit} = require('./entities');
const {grantCompanyAccess, grantUnitAccess} = require('./access');
const {writeState} = require('./state-repository'), {loadState} = require('./scoped-state');
const {contents, digest} = require('../scripts/stock-insert-equivalence');
const inventory = require('./inventory-store');
function state() {
  return {schemaVersion: 2, products: [
    {id: 'a', name: 'Produto A', stock: 10, priceCents: 100, positionBalances: {dep: 3}},
    {id: 'b', name: 'Produto B', stock: Number.MAX_SAFE_INTEGER, priceCents: 200},
    {id: 'null', name: 'Nulo', stock: 0, priceCents: 1, positionBalances: null},
    {id: 'empty', name: 'Vazio', stock: 0, priceCents: 1, positionBalances: {}}], customers: [], sales: [],
    positions: [{id: 'dep', code: 'DEP', name: 'Depósito', active: true, version: 1, number: 1, date: '2020', history: []}],
    purchases: [{id: 'purchase', version: 2, totalCents: 300, items: [{productId: 'a', name: 'Produto A', quantity: 3, unitCostCents: 100}],
      receipts: [{id: 'receipt', date: '2020', items: [{productId: 'a', name: 'Produto A', quantity: 1, unitCostCents: 100}]}]}],
    stockMovements: [
      {id: 'm0', productId: 'a', productName: 'Nome antigo', quantity: 2, stockAfter: 2, type: 'initial', referenceId: 'a', date: '2020', custom: {keep: true}},
      {id: 'm1', productId: 'a', quantity: 1, stockAfter: 10, type: 'purchase', purchaseId: 'purchase', referenceId: 'receipt', date: '2020',
        execution: {executedBy: 'executor', authorizedBy: 'approver', executorName: 'Executor', approverName: 'Aprovador', executedAt: '2020'}},
      {id: 'm2', productId: 'b', productName: null, quantity: 4, stockAfter: Number.MAX_SAFE_INTEGER, type: 'entry', referenceId: 'entry', note: null, date: '2020', execution: null},
      {id: 'm3', productId: 'a', quantity: -1, stockAfter: 10, type: 'sale', referenceId: null, date: '2020', custom: ['legacy', null]}],
    stockEntries: [{id: 'entry', productId: 'b', quantity: 4, date: '2020', custom: {legacy: true}}],
    positionMovements: [{id: 'physical', productId: 'a', quantity: 2, from: 'dep', to: '', type: 'transfer', referenceId: 'old-transfer', date: '2020'}]};
}
function fixture(t) {
  const store = new SqlStore(':memory:', {environment: 'test'}); t.after(() => store.close());
  const a = createCompany(store, {name: 'Sintética A'}), b = createCompany(store, {name: 'Sintética B'});
  const scopes = [createUnit(store, a.id, {name: 'A1'}), createUnit(store, a.id, {name: 'A2'}), createUnit(store, b.id, {name: 'B1'})]
    .map(u => ({companyId: u.company_id, unitId: u.id}));
  // Historical verified identities in a synthetic fixture, never an operational credential.
  for (const [id, name] of [['executor', 'Executor'], ['approver', 'Aprovador']]) {
    store.db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run(id, name, id, 'synthetic-hash', 'active', '2020', '2020');
    for (const scope of scopes) {grantCompanyAccess(store, id, scope.companyId); grantUnitAccess(store, id, scope.companyId, scope.unitId);}
  }
  store.transaction(() => {for (const scope of scopes) writeState(store, scope, state(), 0);});
  return {store, scopes};
}
function trace(store) {
  const original = store.db.prepare.bind(store.db), prepared = [];
  store.db.prepare = sql => {const statement = original(sql); if (/^INSERT INTO commercial_stock_movements\(/.test(sql)) prepared.push(statement); return statement;};
  return prepared;
}
test('INSERT local: alternar bindings conserva conteúdo, nulls, autoria, recibo e precisão exata', t => {
  const {store, scopes} = fixture(t), scope = scopes[0], before = loadState(store, scope), prepared = trace(store);
  const rows = store.db.prepare('SELECT * FROM commercial_stock_movements WHERE company_id=? AND unit_id=? ORDER BY ordinal').all(scope.companyId, scope.unitId);
  store.transaction(() => inventory.syncInventory(store, scope, before.state, before.revision));
  assert.deepEqual(store.db.prepare('SELECT * FROM commercial_stock_movements WHERE company_id=? AND unit_id=? ORDER BY ordinal').all(scope.companyId, scope.unitId), rows);
  assert.deepEqual(loadState(store, scope), before);
  assert.equal(prepared.length, 1);
  assert.equal(rows[1].receipt_ordinal, 0); assert.equal(rows[1].authorized_by, 'approver');
  assert.equal(rows[2].receipt_ordinal, null); assert.equal(rows[2].executed_by, null); assert.equal(rows[3].purchase_id, null);
  assert.equal(store.db.prepare("SELECT quantity FROM commercial_stock_balances WHERE company_id=? AND unit_id=? AND product_id='b'").get(scope.companyId, scope.unitId).quantity, '9007199254740991');
  assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(), []);
});
test('INSERT local: identidade do statement muda entre chamadas, unidades, empresas e conexões', t => {
  const a = fixture(t), b = fixture(t), left = trace(a.store), right = trace(b.store);
  for (const scope of [a.scopes[0], a.scopes[0], a.scopes[1], a.scopes[2]]) {
    const current = loadState(a.store, scope);
    a.store.transaction(() => inventory.syncInventory(a.store, scope, current.state, current.revision));
    assert.deepEqual(loadState(a.store, scope), current);
  }
  const current = loadState(b.store, b.scopes[0]); b.store.transaction(() => inventory.syncInventory(b.store, b.scopes[0], current.state, current.revision));
  assert.equal(left.length, 4); assert.equal(new Set(left).size, 4); assert.equal(right.length, 1);
  assert(!left.includes(right[0]));
});
test('INSERT local: falha no segundo movimento desfaz tudo e nova chamada prepara outro statement', t => {
  const {store, scopes} = fixture(t), scope = scopes[0], current = loadState(store, scope), prepared = trace(store);
  store.db.exec("CREATE TRIGGER fail_second_stock_insert BEFORE INSERT ON commercial_stock_movements WHEN NEW.id='m1' BEGIN SELECT RAISE(ABORT,'synthetic second insert'); END;");
  const before = digest(contents(store));
  assert.throws(() => store.transaction(() => inventory.syncInventory(store, scope, current.state, current.revision)), /synthetic second insert/);
  assert.equal(digest(contents(store)), before); assert.equal(store.inTransaction, false);
  store.db.exec('DROP TRIGGER fail_second_stock_insert');
  store.transaction(() => inventory.syncInventory(store, scope, current.state, current.revision));
  assert.equal(prepared.length, 2); assert.notEqual(prepared[0], prepared[1]);
  assert.deepEqual(loadState(store, scope), current);
  assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.deepEqual(store.db.prepare('PRAGMA integrity_check').all().map(r => r.integrity_check), ['ok']);
});
test('INSERT local: sem movimentos globais não prepara INSERT e preserva entradas/posições', t => {
  const {store, scopes} = fixture(t), scope = scopes[0], next = state(); delete next.stockMovements;
  store.transaction(() => writeState(store, scope, next, 1)); const before = loadState(store, scope), prepared = trace(store);
  const tables = ['commercial_stock_entries', 'commercial_position_movements', 'commercial_position_balances'];
  const rows = tables.map(table => store.db.prepare('SELECT * FROM ' + table + ' ORDER BY rowid').all());
  store.transaction(() => inventory.syncInventory(store, scope, before.state, before.revision));
  assert.equal(prepared.length, 0); assert.deepEqual(loadState(store, scope), before);
  assert.deepEqual(tables.map(table => store.db.prepare('SELECT * FROM ' + table + ' ORDER BY rowid').all()), rows);
});
test('INSERT local: transação continua obrigatória e a recusa não prepara statement', t => {
  const {store, scopes} = fixture(t), prepared = trace(store), before = digest(contents(store));
  assert.throws(() => inventory.syncInventory(store, scopes[0], state(), 1), /transação/);
  assert.equal(prepared.length, 0); assert.equal(digest(contents(store)), before);
});
