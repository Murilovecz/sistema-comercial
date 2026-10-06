'use strict';
const {test} = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const {randomUUID} = require('node:crypto');
const {SqlStore} = require('./sql-store');
const {createServer} = require('../server');
const {Client, fixture: httpFixture, profile} = require('./http-fixture');
const {createCompany, createUnit} = require('./entities');
const {writeState, canonical} = require('./state-repository');
const {loadState} = require('./scoped-state');
const {appendAudit, verifyAuditChain} = require('./audit');
const {BackupService, validatePackage, restoreBackup} = require('./backup-service');
const {contents, digest} = require('../scripts/stock-insert-equivalence');
const {MIGRATIONS, NAME, directory, prefix, c2Migrations, requireLegal, rows, insert} = require('./legal-structure-test-fixture');
const closeServer = server => server?.listening ? new Promise(resolve => {server.close(resolve); server.closeAllConnections();}) : Promise.resolve();
async function start(store, dir) {
  const server = createServer({store, environment: 'test', filename: store.filename, dataDir: dir, importLegacy: false, backup: {enabled: false}});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {server, client: new Client('http://127.0.0.1:' + server.address().port)};
}
async function ok(client, route, input, expected = 201) {
  const response = await client.call(route, input); assert.equal(response.status, expected, response.text); return response.data;
}
function seedOld(store) {
  const company = createCompany(store, {name: 'Org histórica sintética'}), unit = createUnit(store, company.id, {name: 'Unidade histórica sintética'});
  const scope = {companyId: company.id, unitId: unit.id};
  store.transaction(() => {
    writeState(store, scope, {schemaVersion: 2, products: [{id: 'p', name: 'Produto histórico sintético', priceCents: 1000, stock: 5, version: 1}], customers: [], suppliers: [], purchases: [], sales: []}, 0);
    appendAudit(store, {...scope, action: 'SYNTHETIC_SEED', entity: 'test', recordId: 'old-state'});
  });
  return scope;
}

test('C2 v1: 001–010 → snapshot → 011 → autenticação/contexto/RBAC/cadastros/compra/estoque/venda/caixa, Legal vazia e fingerprint antigo preservado', async t => {
  const dir = directory(t), oldDir = prefix(dir), migrations = c2Migrations(t), store = new SqlStore(path.join(dir, 'v1.sqlite'), {environment: 'test', migrationsDir: oldDir});
  let server;
  try {
    const f = await httpFixture(t, {store, filename: store.filename, dataDir: dir, backup: {enabled: false}}); server = f.server;
    const product = (await ok(f.owner, '/api/commercial/products', {requestId: randomUUID(), name: 'Produto sintético', price: '10.00', stock: 5})).record;
    const body = {requestId: 'c2-synthetic-sale-intent', items: [{productId: product.id, quantity: 1, priceCents: 1000}], paymentMethod: 'pix', paymentStatus: 'received'};
    const first = await ok(f.owner, '/api/sales', body), originalSale = first.sales[0];
    assert.equal(rowsIfPresent(store), null); // This sale was actually written before migration 011.
    await closeServer(server); server = null;
    const before = contents(store), oldSale = store.db.prepare('SELECT * FROM commercial_sales').all();
    store.migrate(migrations); requireLegal(store);
    assert.deepEqual(contents(store).filter(([n]) => !['legal_entities', 'schema_migrations'].includes(n)), before.filter(([n]) => n !== 'schema_migrations'));
    assert.deepEqual(store.db.prepare('SELECT * FROM commercial_sales').all(), oldSale);
    const restarted = await start(store, dir); server = restarted.server; const client = restarted.client;
    const me = await client.login('owner-fixture');
    assert.equal(me.companyId, f.scope.companyId); assert.equal(me.unitId, f.scope.unitId);
    const prior = canonical(loadState(store, f.scope)), events = store.db.prepare('SELECT count(*) n FROM audit_events').get().n;
    const retry = await ok(client, '/api/sales', body); assert.deepEqual(retry.sales[0], originalSale);
    assert.equal(canonical(loadState(store, f.scope)), prior); assert.equal(store.db.prepare('SELECT count(*) n FROM audit_events').get().n, events);
    assert.deepEqual(store.db.prepare('SELECT * FROM commercial_sales').all(), oldSale);
    await ok(client, '/api/auth/context', f.scope, 200);
    const reader = await profile({...f, owner: client}, [], 'c2-no-permission');
    assert.equal((await reader.client.call('/api/commercial/products')).status, 403);
    assert.equal((await reader.client.call('/api/sales', {...body, requestId: 'denied-intent'})).status, 403);
    await ok(client, '/api/commercial/products', undefined, 200);
    await ok(client, '/api/commercial/customers', {requestId: randomUUID(), name: 'Cliente sintético'});
    const supplier = (await ok(client, '/api/commercial/suppliers/create', {requestId: randomUUID(), name: 'Fornecedor sintético'})).record;
    await ok(client, '/api/purchases/create', {requestId: randomUUID(), supplierId: supplier.id, items: [{productId: product.id, quantity: 2, unitCost: '6.25'}]});
    let purchase = loadState(store, f.scope).state.purchases[0];
    await ok(client, '/api/purchases/confirm', {id: purchase.id, expectedVersion: purchase.version, requestId: randomUUID()});
    purchase = loadState(store, f.scope).state.purchases[0];
    await ok(client, '/api/purchases/receive', {id: purchase.id, expectedVersion: purchase.version, requestId: randomUUID(), items: [{productId: product.id, quantity: 2}]});
    await ok(client, '/api/cash/open', {requestId: randomUUID(), openingValue: '0'});
    const cashId = loadState(store, f.scope).state.cashSessions[0].id;
    await ok(client, '/api/sales', {...body, requestId: 'c2-new-sale-intent', paymentMethod: 'cash', expectedCashSessionId: cashId});
    const state = loadState(store, f.scope).state;
    assert.equal(state.products[0].stock, 5); assert.equal(state.sales.length, 2);
    assert.equal(state.purchases[0].receipts.length, 1); assert.equal(state.sales[1].receipts.length, 1);
    assert.equal(state.cashSessions[0].movements.length, 1); assert.equal(state.cashSessions[0].movements[0].amountCents, 1000);
    await ok(client, '/api/cash/close', {requestId: randomUUID(), cashSessionId: cashId, countedValue: '10.00', expectedCents: 1000});
    for (const route of ['/api/legal', '/api/legal_entities', '/api/commercial/legal_entities', '/api/organizations/legal']) assert.equal((await client.call(route)).status, 404);
    assert.deepEqual(rows(store), []); assert.equal(verifyAuditChain(store), true);
    assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(), []);
    await ok(client, '/api/auth/logout', {}, 200); assert.equal((await client.call('/api/auth/me')).status, 401);
    await client.login('owner-fixture'); assert.deepEqual(rows(store), []);
  } finally {await closeServer(server); store.close();}
});
function rowsIfPresent(store) {return store.db.prepare("SELECT name FROM sqlite_master WHERE name='legal_entities'").get() ? rows(store) : null;}

test('C2 backup A: pré-011 restaura com catálogo novo, upgrade conserva dados e runtime v1 faz setup/login/venda sem Legal', async t => {
  const dir = directory(t), oldDir = prefix(dir), migrations = c2Migrations(t), source = path.join(dir, 'pre.sqlite'), store = new SqlStore(source, {environment: 'test', migrationsDir: oldDir});
  let restored, server;
  try {
    const scope = seedOld(store), before = contents(store);
    const service = new BackupService({source, directory: path.join(dir, 'backups'), environment: 'test', enabled: false});
    const result = await service.runNow(), pkg = path.join(dir, 'backups', result.id);
    assert.equal(validatePackage(pkg).manifest.schema.length, 10);
    const target = path.join(dir, 'restored.sqlite'), report = restoreBackup(pkg, target);
    assert.equal(report.isolated, true);
    restored = new SqlStore(target, {environment: 'test', migrationsDir: migrations}); requireLegal(restored);
    assert.deepEqual(contents(restored).filter(([n]) => !['schema_migrations', 'legal_entities'].includes(n)), before.filter(([n]) => n !== 'schema_migrations'));
    const f = await httpFixture(t, {store: restored, filename: target, dataDir: dir, backup: {enabled: false}}); server = f.server;
    assert.deepEqual(f.scope, scope);
    await ok(f.owner, '/api/sales', {requestId: 'restore-sale-test', items: [{productId: 'p', quantity: 1, priceCents: 1000}], paymentMethod: 'pix', paymentStatus: 'received'});
    assert.equal(loadState(restored, scope).state.products[0].stock, 4); assert.deepEqual(rows(restored), []);
    assert.equal(verifyAuditChain(restored), true); assert.deepEqual(contents(store), before);
  } finally {await closeServer(server); restored?.close(); store.close();}
});

// Test-only old catalog view: executes the unchanged backup validator with precisely
// 001–010 visible through readdirSync. No compatibility/deployment package is created.
function oldBackupValidator() {
  const filename = path.join(__dirname, 'backup-service.js'), actualRequire = Module.createRequire(filename);
  const oldFs = Object.create(fs);
  oldFs.readdirSync = (dir, ...args) => path.resolve(dir) === path.resolve(MIGRATIONS)
    ? fs.readdirSync(dir, ...args).filter(name => /^\d+_/.test(name) && Number(name.slice(0, 3)) <= 10)
    : fs.readdirSync(dir, ...args);
  const mod = new Module(filename, module); mod.filename = filename; mod.paths = Module._nodeModulePaths(__dirname);
  mod.require = id => id === 'node:fs' ? oldFs : actualRequire(id);
  mod._compile(fs.readFileSync(filename, 'utf8'), filename); return mod.exports;
}

test('C2 backup B/C: pós-011 preserva candidata/DDL/auditoria no restore; catálogo antigo recusa backup e DB sem efeitos', async t => {
  const dir = directory(t), oldDir = prefix(dir), migrations = c2Migrations(t), source = path.join(dir, 'post.sqlite'), store = new SqlStore(source, {environment: 'test', migrationsDir: migrations});
  let restored;
  try {
    requireLegal(store); const scope = seedOld(store), auditId = store.db.prepare('SELECT id FROM audit_events').get().id;
    insert(store, {organization_id: scope.companyId, id: 'legal-backup-test', legal_type: 'PJ', identity_ref: 'identity-ref-test-backup', status: 'PROVISIONED',
      created_at: '2026-10-06', created_by: null, creation_provenance: 'TECHNICAL', creation_evidence_ref: 'evidence-ref-test-backup', creation_audit_id: auditId});
    const before = contents(store), service = new BackupService({source, directory: path.join(dir, 'backups'), environment: 'test', enabled: false});
    const result = await service.runNow(), pkg = path.join(dir, 'backups', result.id);
    assert.equal(validatePackage(pkg).manifest.schema.at(-1).version, NAME);
    const target = path.join(dir, 'restored.sqlite'); restoreBackup(pkg, target); restored = new SqlStore(target, {environment: 'test', migrationsDir: migrations});
    assert.deepEqual(contents(restored), before); assert.equal(verifyAuditChain(restored), true);
    assert.equal(restored.db.prepare('PRAGMA table_list').all().find(r => r.name === 'legal_entities').wr, 1);
    const saved = digest(contents(store));
    assert.throws(() => store.migrate(oldDir), /ausente, desconhecida ou fora de ordem.*011/);
    assert.throws(() => new SqlStore(source, {environment: 'test', migrationsDir: oldDir}), /ausente, desconhecida ou fora de ordem.*011/);
    const old = oldBackupValidator(), rejectedTarget = path.join(dir, 'must-not-exist.sqlite');
    assert.throws(() => old.validatePackage(pkg), /Schema de backup desconhecido ou incompatível/);
    assert.throws(() => old.restoreBackup(pkg, rejectedTarget), /Schema de backup desconhecido ou incompatível/);
    assert.equal(fs.existsSync(rejectedTarget), false); assert.equal(digest(contents(store)), saved);
  } finally {restored?.close(); store.close();}
});
