'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const {SqlStore, hash} = require('./sql-store');
const {createCompany, createUnit} = require('./entities');
const {writeState} = require('./state-repository');
const {loadState} = require('./scoped-state');
const MIGRATIONS = path.join(__dirname, 'migrations');
const NAME = 'stock_movements_scope_receipt';
function migrationPrefix(t, last = 9) {
  const root = path.resolve(__dirname, '../.qa/foundation-v1.2/receipt-fk');
  fs.mkdirSync(root, {recursive: true});
  const dir = fs.mkdtempSync(path.join(root, 'upgrade-test-'));
  const files = fs.readdirSync(MIGRATIONS).filter(f => /^\d+_.*\.sql$/.test(f) && Number(f.slice(0, 3)) <= last).sort();
  assert.equal(files.length, last);
  for (const file of files) fs.copyFileSync(path.join(MIGRATIONS, file), path.join(dir, file));
  t.after(() => {for (const file of files) fs.unlinkSync(path.join(dir, file)); fs.rmdirSync(dir);});
  return dir;
}
function source(purchaseId = 'purchase') {
  return {schemaVersion: 2, products: [{id: 'product', name: 'Nome histórico', stock: 10, priceCents: 100}],
    customers: [], sales: [], suppliers: [], purchases: [{id: purchaseId, version: 2, totalCents: 100,
      items: [{productId: 'product', name: 'Nome histórico', quantity: 1, unitCostCents: 100}],
      receipts: [{id: 'receipt', date: '2020-01-01', items: [{productId: 'product', name: 'Nome histórico', quantity: 1, unitCostCents: 100}]}]}],
    stockMovements: [{id: 'old-movement', productId: 'product', productName: 'Nome histórico', quantity: 1,
      stockAfter: 10, type: 'purchase', purchaseId, referenceId: 'receipt', date: '2020-01-01', custom: {keep: true}}]};
}
function fixture(t) {
  const store = new SqlStore(':memory:', {environment: 'test', migrationsDir: migrationPrefix(t)});
  t.after(() => store.close());
  const company = createCompany(store, {name: 'Empresa sintética A'}), unit = createUnit(store, company.id, {name: 'Unidade A'});
  const sibling = createUnit(store, company.id, {name: 'Unidade B'}), otherCompany = createCompany(store, {name: 'Empresa sintética B'});
  const otherUnit = createUnit(store, otherCompany.id, {name: 'Outra unidade'});
  const scope = {companyId: company.id, unitId: unit.id};
  const siblings = [{companyId: company.id, unitId: sibling.id}, {companyId: otherCompany.id, unitId: otherUnit.id}];
  store.transaction(() => {
    writeState(store, scope, source(), 0);
    for (const other of siblings) writeState(store, other, source('foreign-purchase'), 0);
    require('./audit').appendAudit(store, {...scope, action: 'SYNTHETIC_UPGRADE', entity: 'purchases',
      recordId: 'purchase', after: {id: 'purchase', preserved: true}});
  });
  return {store, scope, siblings};
}
function businessDigest(store) {
  return hash(JSON.stringify(store.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name!='schema_migrations' ORDER BY name").all()
    .map(({name}) => [name, store.db.prepare('SELECT * FROM "' + name + '" ORDER BY rowid').all()])));
}
function insertMovement(store, scope, change = {}) {
  const sourceRow = store.db.prepare('SELECT * FROM commercial_stock_movements WHERE company_id=? AND unit_id=?')
    .get(scope.companyId, scope.unitId);
  const row = {...sourceRow, id: 'new-movement', ordinal: 1, ...change}, columns = Object.keys(row);
  store.db.prepare('INSERT INTO commercial_stock_movements(' + columns.join(',') + ') VALUES(' + columns.map(() => '?').join(',') + ')')
    .run(...columns.map(column => row[column]));
}
test('índice FK: banco novo aplica migration uma vez, sem exigir relação exclusiva', t => {
  const migrations = migrationPrefix(t, 10);
  const store = new SqlStore(':memory:', {environment: 'test', migrationsDir: migrations}); t.after(() => store.close());
  const indexes = store.db.prepare('PRAGMA index_list(commercial_stock_movements)').all();
  assert.equal(indexes.find(index => index.name === NAME).unique, 0);
  assert(indexes.some(index => index.name === 'stock_movements_scope_product'));
  assert.deepEqual(store.db.prepare('PRAGMA index_info(' + NAME + ')').all().map(row => row.name),
    ['company_id', 'unit_id', 'purchase_id', 'receipt_ordinal']);
  const applied = store.db.prepare('SELECT version,checksum FROM schema_migrations ORDER BY version').all();
  assert(applied.some(row => row.version === '010_stock_receipt_fk_index.sql'));
  store.migrate(migrations);
  assert.deepEqual(store.db.prepare('SELECT version,checksum FROM schema_migrations ORDER BY version').all(), applied);
  assert.equal(store.db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  assert.deepEqual(store.db.prepare('PRAGMA integrity_check').all().map(row => row.integrity_check), ['ok']);
});
test('índice FK: upgrade 001–009 preserva dados, históricos, espelhos, revisões, markers e checksums anteriores', t => {
  const {store, scope, siblings} = fixture(t), before = businessDigest(store);
  const snapshots = [scope, ...siblings].map(ctx => loadState(store, ctx));
  const old = store.db.prepare('SELECT version,checksum FROM schema_migrations ORDER BY version').all();
  const tableSQL = store.db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' ORDER BY name").all();
  store.migrate(migrationPrefix(t, 10));
  assert.equal(businessDigest(store), before);
  assert.deepEqual([scope, ...siblings].map(ctx => loadState(store, ctx)), snapshots);
  assert.deepEqual(store.db.prepare('SELECT version,checksum FROM schema_migrations ORDER BY version LIMIT 9').all(), old);
  assert.deepEqual(store.db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' ORDER BY name").all(), tableSQL);
  assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.deepEqual(store.db.prepare('PRAGMA integrity_check').all().map(row => row.integrity_check), ['ok']);
});
test('índice FK: recibo continua aceitando múltiplos movimentos e relação diferida continua permitindo restauração atômica', t => {
  const {store, scope} = fixture(t); store.migrate(migrationPrefix(t, 10));
  // Valid shared receipt: the candidate must never become a UNIQUE constraint.
  store.transaction(() => insertMovement(store, scope));
  assert.equal(store.db.prepare('SELECT count(*) n FROM commercial_stock_movements').get().n, 4);
  const receipt = store.db.prepare('SELECT * FROM commercial_purchase_receipts WHERE company_id=? AND unit_id=?')
    .get(scope.companyId, scope.unitId);
  store.transaction(() => {
    store.db.prepare('DELETE FROM commercial_purchase_receipt_items WHERE company_id=? AND unit_id=?').run(scope.companyId, scope.unitId);
    store.db.prepare('DELETE FROM commercial_purchase_receipts WHERE company_id=? AND unit_id=?').run(scope.companyId, scope.unitId);
    const columns = Object.keys(receipt);
    store.db.prepare('INSERT INTO commercial_purchase_receipts(' + columns.join(',') + ') VALUES(' + columns.map(() => '?').join(',') + ')')
      .run(...columns.map(column => receipt[column]));
  });
  assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.deepEqual(store.db.prepare('PRAGMA integrity_check').all().map(row => row.integrity_check), ['ok']);
});
test('índice FK: vínculo ausente ou de outra empresa/unidade falha no commit e reverte a transação inteira', t => {
  const {store, scope, siblings} = fixture(t); store.migrate(migrationPrefix(t, 10));
  const before = businessDigest(store);
  for (const change of [{receipt_ordinal: 99}, {purchase_id: 'foreign-purchase'}]) {
    assert.throws(() => store.transaction(() => {
      store.setMeta('must-rollback', 'synthetic'); insertMovement(store, scope, change);
    }), /FOREIGN KEY/);
    assert.equal(businessDigest(store), before);
    assert.equal(store.meta('must-rollback'), undefined);
  }
  for (const other of siblings) assert.equal(store.db.prepare('SELECT count(*) n FROM commercial_purchase_receipts WHERE company_id=? AND unit_id=? AND purchase_id=?')
    .get(other.companyId, other.unitId, 'foreign-purchase').n, 1);
  assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(), []);
});
