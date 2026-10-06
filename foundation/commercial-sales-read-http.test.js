'use strict';
// Characterization/regression of existing Sales reads, with isolated synthetic data only.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {fixture, profile, Client, PASSWORD} = require('./http-fixture');
const {writeState, canonical} = require('./state-repository');
const {querySales, getSale} = require('./sales-store');
const {createCompany, createUnit} = require('./entities');
const {grantUnitAccess} = require('./access');
const {assignRole} = require('./rbac');

const BASE = '/api/commercial/sales';
const PRIVATE = 'SALES-READ-PRIVATE-MARKER';
const detailUrl = id => BASE + '/by-id?' + new URLSearchParams({id});
const listUrl = options => BASE + '?' + new URLSearchParams(options);
const ids = page => page.items.map(row => row.id);

function sale(id = 'sale-a', extra = {}) {
  return {
    id, code: 'SALE-001', number: 41, customerId: 'customer', customerName: 'Cliente histórico',
    date: '2026-10-02T15:00:00.000Z', subtotalCents: 200, discountCents: 0, totalCents: 200,
    items: [{id: 'line', productId: 'product', name: 'Nome histórico', code: 'OLD', quantity: 2,
      priceCents: 100, unit: 'un', measureUnit: null, unitCostCents: 77,
      packages: [{packageId: 'old-pack', name: 'Caixa histórica', factor: 2, count: 1, version: 1, private: PRIVATE}],
      stockSources: [{positionId: 'old-position', name: PRIVATE, quantity: 2}], private: PRIVATE}],
    paymentMethod: 'pix', paymentStatus: 'partial', dueDate: '2026-11-01', forgivenCents: 5,
    receipts: [{id: 'receipt', saleId: id, amountCents: 50, paymentMethod: 'pix',
      allocations: [{installmentId: 'installment', amountCents: 50, private: PRIVATE}], private: PRIVATE}],
    receivablePlan: [{id: 'installment', number: 1, amountCents: 200, dueDate: '2026-11-01', private: PRIVATE}],
    refunds: [{id: 'refund', amountCents: 10, paymentMethod: 'pix', private: PRIVATE}],
    storeCreditAllocations: [{creditId: 'credit', amountCents: 5, restoredCents: 0, private: PRIVATE}],
    forgiveness: [{date: '2026-10-03', amountCents: 5,
      allocations: [{installmentId: 'installment', amountCents: 5, private: PRIVATE}], private: PRIVATE}],
    execution: {executedBy: null, authorizedBy: null, executorName: 'Nome declarado antigo', private: PRIVATE},
    checkout: {status: 'partial', totalCents: 200, internalCents: 0, receivedCents: 50,
      remainingCents: 150, cashCents: 0, tenderedCents: 0, changeCents: 0, private: PRIVATE}, private: PRIVATE,
    ...extra
  };
}
function state(sales = [sale()]) {
  return {products: [{id: 'product', name: 'Nome atual', stock: 10, priceCents: 999, active: true}],
    customers: [{id: 'customer', name: 'Cliente atual'}, {id: 'other-customer', name: 'Outro cliente'}], sales};
}
function seed(f, value, scope = f.scope) {
  const revision = f.store.db.prepare('SELECT revision FROM unit_states WHERE company_id=? AND unit_id=?')
    .get(scope.companyId, scope.unitId)?.revision || 0;
  f.store.transaction(() => writeState(f.store, scope, value, revision));
}
async function scenario(t, sales = [sale()], permissions = ['sales.view']) {
  const f = await fixture(t);
  seed(f, state(sales));
  f.reader = await profile(f, permissions);
  return f;
}
function ok(response) {
  assert.equal(response.status, 200, response.text);
  return response.data;
}
function denied(response, status, code) {
  assert.equal(response.status, status, response.text);
  if (code) assert.equal(response.data.code, code);
  assert.equal(typeof response.data.error, 'string');
  assert.equal(response.data.sale, undefined);
  assert.equal(response.data.items, undefined);
  assert.doesNotMatch(response.text, /SQLITE|FOREIGN KEY|password_hash|token_hash|PRIVATE-MARKER/);
}
function absent(value, forbidden) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!forbidden.includes(key), 'Unexpected field: ' + key);
    absent(child, forbidden);
  }
}
async function trace(f, callback, forbidSnapshot = false) {
  const db = f.store.db, prepare = db.prepare, exec = db.exec, statements = [];
  db.prepare = function(sql) {
    statements.push(sql);
    if (forbidSnapshot && /\bunit_states\b/i.test(sql)) {
      assert.doesNotMatch(sql, /\bpayload\b|select\s+\*/i, 'Sales read materialized the snapshot');
    }
    return prepare.call(this, sql);
  };
  db.exec = function(sql) { statements.push(sql); return exec.call(this, sql); };
  try { await callback(statements); } finally { db.prepare = prepare; db.exec = exec; }
  return statements;
}
function persisted(f) {
  // All persistent tables except session activity, which authentication legitimately refreshes.
  const tables = f.store.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name!='sessions' ORDER BY name").all();
  return canonical(tables.map(({name}) => [name, f.store.db.prepare('SELECT * FROM "' + name.replaceAll('"', '""') + '"')
    .all().map(row => canonical(row)).sort()]));
}

test('Vendas HTTP: listagem padrão tem metadados e ordenação por cliente, com desempate por ID', async t => {
  const f = await scenario(t, [sale('z', {customerName: 'Álvaro'}), sale('b', {customerName: 'Beatriz'}),
    sale('a', {customerName: 'Alvaro'})]);
  const page = ok(await f.reader.client.call(BASE));
  assert.deepEqual(ids(page), ['a', 'z', 'b']);
  assert.deepEqual([page.page, page.pageSize, page.total, page.totalPages], [1, 50, 3, 1]);
  assert.equal(page.revision, f.store.db.prepare('SELECT revision FROM unit_states').get().revision);
});

test('Vendas HTTP: primeira página, páginas posteriores e página além do fim respeitam limites', async t => {
  const sales = Array.from({length: 53}, (_, i) => sale('s' + String(i).padStart(3, '0'))).reverse();
  const f = await scenario(t, sales);
  const first = ok(await f.reader.client.call(BASE)), second = ok(await f.reader.client.call(listUrl({page: 2})));
  assert.deepEqual(ids(first), Array.from({length: 50}, (_, i) => 's' + String(i).padStart(3, '0')));
  assert.deepEqual(ids(second), ['s050', 's051', 's052']);
  assert.equal(second.total, 53); assert.equal(second.totalPages, 2); assert.equal(second.page, 2);
  assert.deepEqual(ids(ok(await f.reader.client.call(listUrl({page: 3})))), []);
  assert.equal(ok(await f.reader.client.call(listUrl({pageSize: 100}))).items.length, 53);
});

test('Vendas HTTP: travessia determinística de todas as ordens não duplica nem perde registros', async t => {
  // Reverse insertion order and ties crossing page boundaries detect missing stable tiebreaks.
  const sales = [sale('f', {customerName: 'B', code: 'B', date: '2026-10-03T12:00:00Z'}),
    sale('e', {customerName: 'B', code: 'B', date: '2026-10-03T12:00:00Z'}),
    sale('d', {customerName: 'B', code: 'B', date: '2026-10-03T12:00:00Z'}),
    sale('c', {customerName: 'A', code: 'A', date: '2026-10-02T12:00:00Z'}),
    sale('b', {customerName: 'A', code: 'A', date: '2026-10-02T12:00:00Z'}),
    sale('a', {customerName: 'A', code: 'A', date: '2026-10-02T12:00:00Z'})];
  const f = await scenario(t, sales);
  for (const sort of ['name', 'date', 'code', 'id']) for (const direction of ['asc', 'desc']) {
    await t.test(sort + ' ' + direction, async () => {
      const expected = direction === 'asc' ? ['a', 'b', 'c', 'd', 'e', 'f'] :
        sort === 'id' ? ['f', 'e', 'd', 'c', 'b', 'a'] : ['d', 'e', 'f', 'a', 'b', 'c'];
      const gathered = [];
      for (let page = 1; page <= 3; page++) {
        const url = listUrl({sort, direction, page, pageSize: 2});
        const current = ok(await f.reader.client.call(url));
        assert.deepEqual(current, ok(await f.reader.client.call(url)), 'Repeat must return the same page');
        assert.equal(current.total, 6); assert.equal(current.totalPages, 3);
        gathered.push(...ids(current));
      }
      assert.deepEqual(gathered, expected);
      assert.equal(new Set(gathered).size, sales.length);
    });
  }
});

test('Vendas HTTP: período inclusivo usa dia civil São Paulo e exclui registros sem data', async t => {
  const f = await scenario(t, [sale('before', {date: '2026-10-02T01:30:00Z'}),
    sale('after', {date: '2026-10-02T03:00:00Z'}), sale('later', {date: '2026-10-03T03:00:00Z'}),
    sale('undated', {date: undefined})]);
  for (const [options, expected] of [
    [{from: '2026-10-01', to: '2026-10-01'}, ['before']],
    [{from: '2026-10-02', to: '2026-10-02'}, ['after']],
    [{from: '2026-10-02'}, ['after', 'later']], [{to: '2026-10-02'}, ['after', 'before']]
  ]) assert.deepEqual(ids(ok(await f.reader.client.call(listUrl(options)))), expected);
});

test('Vendas HTTP: situação legada e cancelamento são filtros distintos aplicados antes da paginação', async t => {
  const f = await scenario(t, [sale('missing'), sale('active', {active: true}),
    sale('inactive', {active: false}), sale('cancelled', {cancelledAt: '2026-10-03T12:00:00Z'})]);
  for (const [options, expected] of [
    [{status: 'active'}, ['active', 'cancelled', 'missing']], [{status: 'inactive'}, ['inactive']],
    [{cancelled: 'cancelled'}, ['cancelled']], [{cancelled: 'registered'}, ['active', 'inactive', 'missing']],
    [{status: 'inactive', cancelled: 'cancelled'}, []]
  ]) {
    const page = ok(await f.reader.client.call(listUrl({...options, pageSize: 1})));
    assert.equal(page.total, expected.length);
    assert.deepEqual(ids(page), expected.slice(0, 1));
  }
});

test('Vendas HTTP: cliente, executor real e unidade selecionada combinam filtros e contagem', async t => {
  const f = await scenario(t);
  seed(f, state([sale('mine', {execution: {executedBy: f.reader.user.id, executorName: 'Executor histórico'}}),
    sale('other-client', {customerId: 'other-customer', execution: {executedBy: f.reader.user.id}}),
    sale('other-executor', {execution: {executedBy: f.ownerId}}), sale('legacy', {execution: undefined})]));
  const options = {customerId: 'customer', executorId: f.reader.user.id, unitId: f.scope.unitId};
  assert.deepEqual(ids(ok(await f.reader.client.call(listUrl(options)))), ['mine']);
  assert.equal(ok(await f.reader.client.call(listUrl({executorId: f.reader.user.id}))).total, 2);
  assert.equal(ok(await f.reader.client.call(listUrl({customerId: 'unknown'}))).total, 0);
  assert.equal(ok(await f.reader.client.call(listUrl({executorId: 'unknown'}))).total, 0);
  denied(await f.reader.client.call(listUrl({unitId: 'another-unit'})), 403, 'FORBIDDEN_CONTEXT');
});

test('Vendas HTTP: busca por ID, código, número e nome conserva zeros, acentos e caracteres literais', async t => {
  const f = await scenario(t, [sale('opaque-id-001', {code: '0007', number: 42819, customerName: 'João'}),
    sale('literal%_\\', {code: 'SPECIAL', number: 2, customerName: 'Outra'})]);
  for (const q of ['opaque-id-001', '0007', '42819', 'joao'])
    assert.deepEqual(ids(ok(await f.reader.client.call(listUrl({q})))), ['opaque-id-001']);
  for (const q of ['%', '_', '\\'])
    assert.deepEqual(ids(ok(await f.reader.client.call(listUrl({q})))), ['literal%_\\']);
  assert.equal(ok(await f.reader.client.call(detailUrl('literal%_\\'))).sale.id, 'literal%_\\');
  assert.equal(ok(await f.reader.client.call(listUrl({q: "' OR 1=1 --"}))).total, 0);
});

test('Vendas HTTP: resultado vazio e ID inexistente mantêm contratos diferentes', async t => {
  const f = await scenario(t, []);
  const page = ok(await f.reader.client.call(BASE));
  assert.deepEqual([page.items, page.total, page.totalPages, page.page], [[], 0, 0, 1]);
  denied(await f.reader.client.call(detailUrl('missing')), 404, 'NOT_FOUND');
});

test('Vendas HTTP: rejeita filtros inexistentes, repetidos, intervalos inválidos e limites adulterados', async t => {
  const f = await scenario(t);
  const invalid = ['page=0', 'page=-1', 'page=1.5', 'page=01', 'page=1000001', 'pageSize=0', 'pageSize=101',
    'page=1&page=2', 'q=a&q=b', 'from=2026-10-01&from=2026-10-02', 'executorId=a&executorId=b',
    'customerId=a&customerId=b', 'unitId=a&unitId=b', 'status=paid', 'cancelled=all&cancelled=all',
    'cancelled=unknown', 'direction=sideways', 'sort=totalCents', 'paymentStatus=received',
    'companyId=' + f.scope.companyId, 'from=2026-02-30', 'to=not-a-date', 'from=2026-10-03&to=2026-10-02'];
  for (const query of invalid) denied(await f.reader.client.call(BASE + '?' + query), 422, 'INVALID_QUERY');
  for (const key of ['q', 'customerId', 'executorId', 'unitId'])
    denied(await f.reader.client.call(listUrl({[key]: 'a'.repeat(121)})), 422, 'INVALID_QUERY');
});

test('Vendas HTTP: detalhe valida ID e não permite forçar financeiro ou escopo por parâmetros', async t => {
  const f = await scenario(t);
  for (const query of ['', '?id=', '?id=sale-a&id=sale-a', '?id=' + 'a'.repeat(121),
    '?id=sale-a&financial=true', '?id=sale-a&unitId=' + f.scope.unitId, '?id=sale-a&companyId=' + f.scope.companyId])
    denied(await f.reader.client.call(BASE + '/by-id' + query), 422, 'INVALID_QUERY');
  denied(await f.reader.client.call(detailUrl("sale-a' OR 1=1 --")), 404, 'NOT_FOUND');
});

test('Vendas HTTP: IDs iguais e IDs exclusivos de outra empresa/unidade nunca atravessam o contexto', async t => {
  const f = await scenario(t, [sale('shared', {customerName: 'Local'})]);
  const company = createCompany(f.store, {name: 'Outra empresa sintética'});
  const otherUnit = createUnit(f.store, company.id, {name: 'Outra unidade sintética'});
  const sister = createUnit(f.store, f.scope.companyId, {name: 'Unidade irmã sintética'});
  const scopes = [{companyId: company.id, unitId: otherUnit.id}, {...f.scope, unitId: sister.id}];
  for (let i = 0; i < scopes.length; i++) {
    seed(f, state([sale('shared', {customerName: 'FORBIDDEN-' + i}), sale('foreign-' + i)]), scopes[i]);
    denied(await f.reader.client.call(detailUrl('foreign-' + i)), 404, 'NOT_FOUND');
    denied(await f.reader.client.call(listUrl({unitId: scopes[i].unitId})), 403, 'FORBIDDEN_CONTEXT');
    denied(await f.reader.client.call(detailUrl('shared'), undefined,
      {'x-company-id': scopes[i].companyId, 'x-unit-id': scopes[i].unitId}), 409, 'CONTEXT_CHANGED');
  }
  assert.deepEqual(ids(ok(await f.reader.client.call(BASE))), ['shared']);
  assert.equal(ok(await f.reader.client.call(detailUrl('shared'))).sale.customerName, 'Local');
  const full = ok(await f.owner.call(detailUrl('shared'))).sale;
  assert.equal(full.customerName, 'Local');
  assert.deepEqual(full.receipts, [{id: 'receipt', saleId: 'shared', amountCents: 50, paymentMethod: 'pix',
    allocations: [{installmentId: 'installment', amountCents: 50}]}]);
  // Even an accessible second unit needs an explicit authenticated context switch.
  grantUnitAccess(f.store, f.reader.user.id, f.scope.companyId, sister.id);
  assignRole(f.store, f.reader.user.id, f.scope.companyId, sister.id, f.reader.role.id);
  denied(await f.reader.client.call(listUrl({unitId: sister.id})), 403);
  const switched = await f.reader.client.call('/api/auth/context', {...f.scope, unitId: sister.id});
  assert.equal(switched.status, 200, switched.text);
  assert.deepEqual(ids(ok(await f.reader.client.call(BASE))), ['foreign-1', 'shared']);
  assert.equal(ok(await f.reader.client.call(detailUrl('shared'))).sale.customerName, 'FORBIDDEN-1');
});

test('Vendas HTTP: sessão, permissão e vínculos são revalidados em lista e detalhe', async t => {
  const f = await scenario(t), anonymous = new Client(f.owner.origin);
  const withoutSales = await profile(f, ['financial.view', 'inventory.view']);
  for (const url of [BASE, detailUrl('sale-a')]) {
    denied(await anonymous.call(url), 401);
    denied(await withoutSales.client.call(url), 403);
  }
  const mutations = p => [
    ["DELETE FROM role_permissions WHERE company_id=? AND role_id=? AND permission_code='sales.view'",
      [f.scope.companyId, p.role.id], 403],
    ["UPDATE unit_memberships SET status='inactive' WHERE user_id=? AND unit_id=?", [p.user.id, f.scope.unitId], 401],
    ["UPDATE company_memberships SET status='inactive' WHERE user_id=? AND company_id=?", [p.user.id, f.scope.companyId], 401],
    ["UPDATE users SET status='inactive' WHERE id=?", [p.user.id], 401],
    ["UPDATE sessions SET revoked_at='2026-10-03T00:00:00Z' WHERE user_id=?", [p.user.id], 401],
    ["UPDATE sessions SET expires_at='2000-01-01T00:00:00Z' WHERE user_id=?", [p.user.id], 401]
  ];
  for (let index = 0; index < 6; index++) {
    const p = await profile(f, ['sales.view']);
    for (const url of [BASE, detailUrl('sale-a')]) ok(await p.client.call(url));
    const [sql, args, status] = mutations(p)[index];
    f.store.db.prepare(sql).run(...args);
    for (const url of [BASE, detailUrl('sale-a')]) denied(await p.client.call(url), status);
  }
  for (const [table, id] of [['units', f.scope.unitId], ['companies', f.scope.companyId]]) {
    f.store.db.prepare('UPDATE ' + table + " SET status='inactive' WHERE id=?").run(id);
    try {
      for (const url of [BASE, detailUrl('sale-a')]) denied(await f.reader.client.call(url), 401);
    } finally {
      f.store.db.prepare('UPDATE ' + table + " SET status='active' WHERE id=?").run(id);
    }
  }
});

test('Vendas HTTP: vendedor lê histórico e detalhe consistente sem dados financeiros, estoque ou extras', async t => {
  const f = await scenario(t), page = ok(await f.reader.client.call(BASE));
  const detail = ok(await f.reader.client.call(detailUrl('sale-a')));
  assert.equal(detail.revision, page.revision);
  const common = ({items, ...head}) => ({...head, items: items.map(({productId, name, quantity, priceCents}) =>
    ({productId, name, quantity, priceCents}))});
  const {code, number, ...shared} = detail.sale;
  assert.deepEqual(common(shared), common(page.items[0]));
  assert.equal(detail.sale.items[0].name, 'Nome histórico');
  assert.equal(detail.sale.customerName, 'Cliente histórico');
  assert.equal(detail.sale.items[0].priceCents, 100);
  assert.deepEqual(detail.sale.items[0].packages, [{packageId: 'old-pack', name: 'Caixa histórica', factor: 2, count: 1, version: 1}]);
  for (const response of [page, detail]) {
    assert.equal(JSON.stringify(response).includes(PRIVATE), false);
    absent(response, ['receipts', 'refunds', 'receivablePlan', 'forgiveness', 'storeCreditAllocations',
      'paymentStatus', 'paymentMethod', 'dueDate', 'checkout', 'unitCostCents', 'costCents', 'stockSources', 'stock', 'private']);
  }
  denied(await f.reader.client.call('/api/state'), 403);
});

test('Vendas HTTP: financeiro amplia somente detalhe autorizado e não libera custos, estoque ou extras', async t => {
  const f = await scenario(t, [sale()], ['sales.view', 'financial.view']);
  const page = ok(await f.reader.client.call(BASE)), detail = ok(await f.reader.client.call(detailUrl('sale-a')));
  absent(page, ['receipts', 'paymentStatus', 'paymentMethod']);
  assert.equal(detail.sale.paymentStatus, 'partial');
  assert.deepEqual(detail.sale.receipts, [{id: 'receipt', saleId: 'sale-a', amountCents: 50, paymentMethod: 'pix',
    allocations: [{installmentId: 'installment', amountCents: 50}]}]);
  assert.deepEqual(detail.sale.receivablePlan, [{id: 'installment', number: 1, amountCents: 200, dueDate: '2026-11-01'}]);
  assert.deepEqual(detail.sale.refunds, [{id: 'refund', amountCents: 10, paymentMethod: 'pix'}]);
  assert.deepEqual(detail.sale.storeCreditAllocations, [{creditId: 'credit', amountCents: 5, restoredCents: 0}]);
  assert.deepEqual(detail.sale.forgiveness, [{date: '2026-10-03', amountCents: 5,
    allocations: [{installmentId: 'installment', amountCents: 5}]}]);
  assert.equal(JSON.stringify(detail).includes(PRIVATE), false);
  absent(detail, ['unitCostCents', 'costCents', 'stockSources', 'stock', 'checkout', 'private']);
  denied(await f.reader.client.call('/api/commercial/inventory'), 403);
  // Financial permission is checked again on each detail request, with no stale enriched response.
  f.store.db.prepare("DELETE FROM role_permissions WHERE company_id=? AND role_id=? AND permission_code='financial.view'")
    .run(f.scope.companyId, f.reader.role.id);
  absent(ok(await f.reader.client.call(detailUrl('sale-a'))), ['receipts', 'paymentStatus', 'forgiveness']);
});

test('Vendas HTTP: venda antiga normalizada preserva ausências e não inventa executor, recibos ou datas', async t => {
  const old = {id: 'old', items: [{productId: 'product', quantity: 1, priceCents: 0}], totalCents: 0};
  const f = await scenario(t, [old], ['sales.view', 'financial.view']);
  const detail = ok(await f.reader.client.call(detailUrl('old'))).sale;
  assert.deepEqual(detail, {...old, execution: {}});
  assert.deepEqual(ok(await f.reader.client.call(BASE)).items, [detail]);
  assert.equal(f.store.db.prepare('SELECT count(*) n FROM commercial_sale_receipts').get().n, 0);
});

test('Vendas HTTP: listagem e detalhe de exceção real preservam executor/autorizador e item inativo', async t => {
  const f = await scenario(t, [], ['catalog.view', 'sales.view', 'sales.create']);
  const source = state([]);
  source.products[0].active = false;
  source.products.push({id: 'active-product', name: 'Ativo', stock: 10, priceCents: 100, active: true});
  seed(f, source);
  const approver = await profile(f, ['sales.authorize_inactive']);
  const draft = {requestId: randomUUID(), customerId: 'customer', paymentMethod: 'pix', paymentStatus: 'received',
    expectedCashSessionId: null, items: [{productId: 'product', quantity: 1, priceCents: 999},
      {productId: 'active-product', quantity: 1, priceCents: 100}]};
  const issued = await f.reader.client.call(BASE + '/inactive-approval', {saleDraft: draft, approverLogin: approver.login,
    approverPassword: PASSWORD, reason: 'Item conferido'});
  assert.equal(issued.status, 201, issued.text);
  const created = await f.reader.client.call(BASE, {...draft, approvalToken: issued.data.approvalToken});
  assert.equal(created.status, 201, created.text);
  const approvalBefore = canonical(f.store.db.prepare('SELECT * FROM inactive_sale_approvals').all());
  for (const row of [ok(await f.reader.client.call(BASE)).items[0],
    ok(await f.reader.client.call(detailUrl(created.data.sale.id))).sale]) {
    assert.equal(row.execution.executedBy, f.reader.user.id);
    assert.equal(row.execution.authorizedBy, approver.user.id);
    assert.equal(row.execution.approvalId, issued.data.approvalId);
    assert.equal(row.execution.approvalReason, 'Item conferido');
    assert.deepEqual(row.execution.approverRoles, [approver.role.name]);
    assert.equal(row.items[0].inactiveAtSale, true);
    assert.equal(row.items[1].inactiveAtSale, undefined);
    assert.equal(JSON.stringify(row).includes(issued.data.approvalToken), false);
    assert.equal(JSON.stringify(row).includes(PASSWORD), false);
    absent(row, ['receipts', 'stockSources', 'unitCostCents']);
  }
  assert.equal(canonical(f.store.db.prepare('SELECT * FROM inactive_sale_approvals').all()), approvalBefore);
});

test('Vendas HTTP: lista e detalhes comercial/financeiro funcionam sem snapshot comercial válido', async t => {
  const f = await scenario(t), financial = await profile(f, ['sales.view', 'financial.view']);
  const expectedList = ok(await f.reader.client.call(BASE));
  const expectedCommercial = ok(await f.reader.client.call(detailUrl('sale-a')));
  const expectedFinancial = ok(await financial.client.call(detailUrl('sale-a')));
  f.store.db.prepare('UPDATE unit_states SET payload=?').run('{}');
  assert.throws(() => require('./scoped-state').loadState(f.store, f.scope), /Lista inválida: products/);
  const statements = await trace(f, async () => {
    assert.deepEqual(ok(await f.reader.client.call(BASE)), expectedList);
    assert.deepEqual(ok(await f.reader.client.call(detailUrl('sale-a'))), expectedCommercial);
    assert.deepEqual(ok(await financial.client.call(detailUrl('sale-a'))), expectedFinancial);
  }, true);
  assert.ok(statements.some(sql => /FROM commercial_sales\b/.test(sql)));
  assert.ok(statements.some(sql => /FROM commercial_sale_receipts\b/.test(sql)));
  assert.equal(statements.some(sql => /FROM commercial_products\b|FROM commercial_stock|\bpayload\b/i.test(sql)), false);
});

test('Vendas: consultas não modificam dados, revisão, marcadores, autorizações ou auditoria', async t => {
  const f = await scenario(t), before = persisted(f);
  const changes = () => f.store.db.prepare('SELECT total_changes() n').get().n;
  const totalBefore = changes();
  querySales(f.store, f.scope);
  getSale(f.store, f.scope, 'sale-a', {financial: false});
  getSale(f.store, f.scope, 'sale-a', {financial: true});
  assert.throws(() => getSale(f.store, f.scope, 'missing'), error => error.status === 404);
  assert.equal(changes(), totalBefore, 'Repository must be strictly read-only, including no-op writes');
  const statements = await trace(f, async () => {
    ok(await f.reader.client.call(BASE));
    ok(await f.reader.client.call(detailUrl('sale-a')));
    ok(await f.owner.call(detailUrl('sale-a')));
    ok(await f.reader.client.call(listUrl({q: 'missing'})));
    denied(await f.reader.client.call(detailUrl('missing')), 404);
    denied(await f.reader.client.call(listUrl({page: 0})), 422);
    denied(await f.reader.client.call(listUrl({unitId: 'foreign'})), 403);
    denied(await new Client(f.owner.origin).call(detailUrl('sale-a')), 401);
  });
  assert.equal(persisted(f), before);
  const writes = statements.filter(sql => /^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(sql));
  assert.ok(writes.length > 0, 'HTTP authentication refreshes session activity');
  for (const sql of writes) assert.match(sql, /^UPDATE sessions SET last_seen_at=\? WHERE id=\?$/);
});

test('Vendas HTTP: revisão/marcador inconsistente bloqueia lista e detalhe sem reparar dados', async t => {
  const f = await scenario(t);
  f.store.db.prepare("DELETE FROM commercial_normalizations WHERE aggregate='sales'").run();
  const before = persisted(f);
  for (const url of [BASE, detailUrl('sale-a')]) denied(await f.reader.client.call(url), 503, 'NORMALIZATION_REQUIRED');
  assert.equal(persisted(f), before);
  f.store.db.prepare("INSERT INTO commercial_normalizations(company_id,unit_id,aggregate,source_revision,normalized_at) VALUES(?,?,?,?,?)")
    .run(f.scope.companyId, f.scope.unitId, 'sales', 999, '2026-10-03');
  const mismatched = persisted(f);
  for (const url of [BASE, detailUrl('sale-a')]) denied(await f.reader.client.call(url), 500, 'COMMERCIAL_DIVERGENCE');
  assert.equal(persisted(f), mismatched);
});
