'use strict';
// Test-only helpers. All disk fixtures stay under the ignored, synthetic C2 directory.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const {SqlStore, hash} = require('./sql-store');
const {createCompany, createUnit} = require('./entities');
const {appendAudit} = require('./audit');
const MIGRATIONS = path.join(__dirname, 'migrations');
const NAME = '011_legal_entities.sql';
const columns = ['organization_id', 'id', 'legal_type', 'identity_ref', 'status', 'created_at',
  'created_by', 'creation_provenance', 'creation_evidence_ref', 'creation_audit_id'];
function approvedDDL() {
  const proposal = fs.readFileSync(path.join(__dirname, '../docs/atualizacoes/fase-c/C1_MINIMAL_DDL_PROPOSAL.md'), 'utf8');
  return proposal.match(/```sql\r?\n([\s\S]*?)\r?\n```/)[1].replaceAll('\r\n', '\n') + '\n';
}
function directory(t) {
  const root = path.resolve(__dirname, '../.qa/fase-c-c2');
  fs.mkdirSync(root, {recursive: true});
  const dir = fs.mkdtempSync(path.join(root, 'synthetic-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(dir)), root);
    fs.rmSync(dir, {recursive: true, force: true});
  });
  return dir;
}
function prefix(dir, last = 10) {
  const target = path.join(dir, 'migrations-' + last); fs.mkdirSync(target);
  const files = fs.readdirSync(MIGRATIONS).filter(f => /^\d+_.*\.sql$/.test(f) && Number(f.split('_')[0]) <= last).sort();
  assert.deepEqual(files.map(f => Number(f.split('_')[0])), Array.from({length: last}, (_, i) => i + 1));
  for (const file of files) {
    fs.copyFileSync(path.join(MIGRATIONS, file), path.join(target, file));
  }
  return target;
}
// C2 is a historical transition through 011, independent of later migrations.
function c2Migrations(t) {return prefix(directory(t), 11);}
function requireLegal(store) {
  assert.ok(store.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='legal_entities'").get(),
    'migration 011 precisa instalar legal_entities');
}
function fixture(t, {approvedOnly = false} = {}) {
  const store = new SqlStore(':memory:', {environment: 'test', migrationsDir: c2Migrations(t)}); t.after(() => store.close());
  if (approvedOnly && !store.db.prepare("SELECT name FROM sqlite_master WHERE name='legal_entities'").get()) store.db.exec(approvedDDL());
  requireLegal(store);
  const company = createCompany(store, {name: 'Org sintética A'}), other = createCompany(store, {name: 'Org sintética B'});
  const unit = createUnit(store, company.id, {name: 'Unidade sintética'});
  let auditId;
  store.transaction(() => {
    store.db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run('actor-test', 'Ator sintético', 'actor-test', 'synthetic-hash', 'active', '2026', '2026');
    auditId = appendAudit(store, {companyId: company.id, unitId: unit.id, action: 'SYNTHETIC', entity: 'test', recordId: 'fixture'});
  });
  const row = {organization_id: company.id, id: 'legal-test-001', legal_type: 'PF', identity_ref: 'identity-ref-test-001',
    status: 'PROVISIONED', created_at: '2026-10-06T12:00:00.000Z', created_by: null,
    creation_provenance: 'TECHNICAL', creation_evidence_ref: 'evidence-ref-test-001', creation_audit_id: auditId};
  return {store, company, other, row};
}
function insert(store, row, verb = 'INSERT', suffix = '') {
  return store.db.prepare(`${verb} INTO legal_entities (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')}) ${suffix}`)
    .run(...columns.map(c => row[c]));
}
function rows(store) {return store.db.prepare('SELECT * FROM legal_entities ORDER BY organization_id,id').all();}
function checksumList(dir = MIGRATIONS) {
  return fs.readdirSync(dir).filter(f => /^\d+_.*\.sql$/.test(f)).sort().map(f => [f, hash(fs.readFileSync(path.join(dir, f), 'utf8'))]);
}
module.exports = {MIGRATIONS, NAME, columns, approvedDDL, directory, prefix, c2Migrations, fixture, insert, rows, requireLegal, checksumList};
