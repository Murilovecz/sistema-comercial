'use strict';
const {test} = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const {SqlStore} = require('./sql-store');
const {fixture: httpFixture} = require('./http-fixture');
const {contents, digest} = require('../scripts/stock-insert-equivalence');
const {directory, prefix, MIGRATIONS, checksumList} = require('./legal-structure-test-fixture');
const {BackupService, validatePackage, restoreBackup} = require('./backup-service');
const {verifyAuditChain} = require('./audit');
const {loadState} = require('./scoped-state');
const {canonical} = require('./state-repository');
const closeServer = server => new Promise(resolve => {server.close(resolve); server.closeAllConnections();});
const priorRows = store => contents(store).filter(([n]) => !['schema_migrations', 'organization_branding'].includes(n));
const ddl = store => store.db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all();

test('BRAND 011→012: DDL/dados anteriores e checksums intactos; aditiva/vazia; reaplicação é no-op', async t => {
  const dir = directory(t), migrations11 = prefix(dir, 11), store = new SqlStore(':memory:', {environment: 'test', migrationsDir: migrations11});
  const f = await httpFixture(t, {store, backup: {enabled: false}});
  try {
  const product = await f.owner.call('/api/commercial/products', {requestId: 'brand-historical-product', name: 'Produto sintético', price: '10.00', stock: 5});
  assert.equal(product.status, 201, product.text);
  const sale = {requestId: 'brand-historical-sale', items: [{productId: product.data.record.id, quantity: 1, priceCents: 1000}], paymentMethod: 'pix', paymentStatus: 'received'};
  assert.equal((await f.owner.call('/api/sales', sale)).status, 201);
  const rows = priorRows(store), schema = ddl(store), registry = store.db.prepare('SELECT * FROM schema_migrations ORDER BY version').all();
  store.migrate(MIGRATIONS);
  assert.deepEqual(priorRows(store), rows);
  assert.deepEqual(ddl(store).filter(r => r.tbl_name !== 'organization_branding'), schema);
  assert.deepEqual(store.db.prepare('SELECT * FROM schema_migrations ORDER BY version').all().slice(0, 11), registry);
  assert.deepEqual(checksumList(migrations11), checksumList().slice(0, 11));
  assert.equal(store.db.prepare('SELECT count(*) n FROM organization_branding').get().n, 0);
  const snapshot = contents(store); store.migrate(MIGRATIONS); assert.deepEqual(contents(store), snapshot);
  const before = canonical(loadState(store, f.scope));
  assert.equal((await f.owner.call('/api/sales', sale)).status, 201);
  assert.equal(canonical(loadState(store, f.scope)), before);
  const r = await f.owner.call('/api/organization/branding', {displayName: 'Marca isolada', primaryColor: '#FFFFFF', accentColor: '#000000', themeMode: 'DARK', expectedRevision: 0});
  assert.equal(r.status, 200, r.text); assert.equal(canonical(loadState(store, f.scope)), before);
  assert.equal(verifyAuditChain(store), true); assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally {await closeServer(f.server); store.close();}
});

// Runs the unchanged validator against exactly the historical catalog through 011.
function validator11() {
  const filename = path.join(__dirname, 'backup-service.js'), actual = Module.createRequire(filename), view = Object.create(fs);
  view.readdirSync = (dir, ...args) => path.resolve(dir) === path.resolve(MIGRATIONS)
    ? fs.readdirSync(dir, ...args).filter(name => /^\d+_/.test(name) && Number(name.slice(0, 3)) <= 11)
    : fs.readdirSync(dir, ...args);
  const mod = new Module(filename, module); mod.filename = filename; mod.paths = Module._nodeModulePaths(__dirname);
  mod.require = id => id === 'node:fs' ? view : actual(id);
  mod._compile(fs.readFileSync(filename, 'utf8'), filename); return mod.exports;
}
test('BRAND backup: pré-012 restaura/atualiza; pós-012 preserva config/audit/dados; catálogo 011 recusa schema futuro', async t => {
  const dir = directory(t), old = prefix(dir, 11), source = path.join(dir, 'synthetic-brand.sqlite');
  const store = new SqlStore(source, {environment: 'test', migrationsDir: old});
  const f = await httpFixture(t, {store, filename: source, dataDir: dir, backup: {enabled: false}});
  let restored;
  try {
  const service = new BackupService({source, directory: path.join(dir, 'backups'), environment: 'test', enabled: false});
  const pre = await service.runNow(), prePkg = path.join(dir, 'backups', pre.id), preRows = priorRows(store);
  assert.equal(validatePackage(prePkg).manifest.schema.length, 11);
  const firstTarget = path.join(dir, 'pre-restored.sqlite'); restoreBackup(prePkg, firstTarget);
  restored = new SqlStore(firstTarget, {environment: 'test'});
  assert.deepEqual(priorRows(restored), preRows);
  assert.equal(restored.db.prepare('SELECT count(*) n FROM organization_branding').get().n, 0);
  restored.close(); restored = null;
  store.migrate(MIGRATIONS);
  const branding = await f.owner.call('/api/organization/branding', {displayName: 'Marca do backup', primaryColor: '#123ABC', accentColor: '#FEDCBA', themeMode: 'SYSTEM', expectedRevision: 0});
  assert.equal(branding.status, 200, branding.text);
  const saved = contents(store), post = await service.runNow(), pkg = path.join(dir, 'backups', post.id);
  assert.equal(validatePackage(pkg).manifest.schema.at(-1).version, '012_organization_branding.sql');
  const target = path.join(dir, 'post-restored.sqlite'); restoreBackup(pkg, target);
  restored = new SqlStore(target, {environment: 'test'});
  assert.deepEqual(contents(restored), saved); assert.equal(verifyAuditChain(restored), true);
  assert.deepEqual(restored.db.prepare('PRAGMA foreign_key_check').all(), []);
  const fingerprint = digest(contents(store));
  assert.throws(() => store.migrate(old), /ausente, desconhecida ou fora de ordem.*012/);
  assert.throws(() => new SqlStore(source, {environment: 'test', migrationsDir: old}), /ausente, desconhecida ou fora de ordem.*012/);
  const historical = validator11(), rejected = path.join(dir, 'must-not-exist.sqlite');
  assert.throws(() => historical.validatePackage(pkg), /Schema de backup desconhecido ou incompatível/);
  assert.throws(() => historical.restoreBackup(pkg, rejected), /Schema de backup desconhecido ou incompatível/);
  assert.equal(fs.existsSync(rejected), false); assert.equal(digest(contents(store)), fingerprint);
  } finally {await closeServer(f.server); restored?.close(); store.close();}
});
