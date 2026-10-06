'use strict';
const {test} = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const {SqlStore} = require('./sql-store');
const {createCompany} = require('./entities');
const {verifyAuditChain} = require('./audit');
const {contents, digest, equivalence} = require('../scripts/stock-insert-equivalence');
const {MIGRATIONS, NAME, columns, approvedDDL, directory, prefix, c2Migrations, fixture, insert, rows, requireLegal, checksumList} = require('./legal-structure-test-fixture');

test('C2 catálogo histórico: cópia explícita contém exatamente 001–011 com bytes/checksums preservados', t => {
  assert.equal(typeof c2Migrations, 'function', 'helper do prefixo histórico C2 001–011 ainda inexistente');
  const copy = c2Migrations(t), copied = checksumList(copy);
  assert.notEqual(path.resolve(copy), path.resolve(MIGRATIONS));
  assert.deepEqual(copied.map(([file]) => Number(file.split('_')[0])), Array.from({length: 11}, (_, i) => i + 1));
  assert.equal(copied.at(-1)[0], NAME);
  for (const [file, checksum] of copied) {
    assert.equal(checksum, checksumList(MIGRATIONS).find(([name]) => name === file)[1]);
    assert.deepEqual(fs.readFileSync(path.join(copy, file)), fs.readFileSync(path.join(MIGRATIONS, file)));
  }
});

test('C2 schema: DDL aprovado exato, STRICT, WITHOUT ROWID, nullability, PK, UNIQUE, CHECKs, FKs e triggers', t => {
  assert.ok(fs.existsSync(path.join(MIGRATIONS, NAME)), 'migration 011 inexistente');
  const sql = fs.readFileSync(path.join(MIGRATIONS, NAME), 'utf8').replaceAll('\r\n', '\n');
  assert.equal(sql, approvedDDL());
  assert.equal((sql.match(/\bCHECK\s*\(/g) || []).length, 8);
  assert.equal((sql.match(/CREATE TABLE/g) || []).length, 1);
  assert.equal((sql.match(/CREATE TRIGGER/g) || []).length, 3);
  assert.doesNotMatch(sql, /CREATE INDEX|IF NOT EXISTS|\bPRAGMA\b|\bALTER\b|\bINSERT INTO\b/);
  const {store} = fixture(t), info = store.db.prepare('PRAGMA table_info(legal_entities)').all();
  assert.deepEqual(info.map(r => r.name), columns);
  assert.deepEqual(info.map(r => r.type), columns.map(() => 'TEXT'));
  assert.deepEqual(info.map(r => r.notnull), columns.map(c => c === 'created_by' ? 0 : 1));
  assert.deepEqual(info.map(r => r.pk), [1, 2, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(info[4].dflt_value, "'PROVISIONED'");
  assert.equal(info.filter(r => r.dflt_value !== null).length, 1);
  const table = store.db.prepare('PRAGMA table_list').all().find(r => r.name === 'legal_entities');
  assert.equal(table.strict, 1); assert.equal(table.wr, 1); assert.equal(table.ncol, 10);
  assert.throws(() => store.db.prepare('SELECT rowid FROM legal_entities').all(), /no such column/);
  const indexes = store.db.prepare('PRAGMA index_list(legal_entities)').all();
  assert.equal(indexes.length, 2);
  assert.deepEqual(indexes.map(i => [i.origin, i.unique, store.db.prepare(`PRAGMA index_info("${i.name}")`).all().map(r => r.name)]).sort(),
    [['pk', 1, ['organization_id', 'id']], ['u', 1, ['id']]]);
  const fks = store.db.prepare('PRAGMA foreign_key_list(legal_entities)').all();
  assert.deepEqual(fks.map(r => [r.from, r.table, r.to, r.on_update, r.on_delete]).sort(),
    [['created_by', 'users', 'id', 'NO ACTION', 'NO ACTION'], ['creation_audit_id', 'audit_events', 'id', 'NO ACTION', 'NO ACTION'], ['organization_id', 'companies', 'id', 'NO ACTION', 'NO ACTION']]);
  const schema = store.db.prepare("SELECT type,name,sql FROM sqlite_master WHERE tbl_name='legal_entities' AND sql IS NOT NULL ORDER BY name").all();
  for (const object of schema) assert.ok(sql.includes(object.sql + ';'), 'schema instalado corresponde ao DDL aprovado: ' + object.name);
  assert.equal(schema.length, 4); assert.deepEqual(rows(store), []);
});

test('C2 integridade: tenant e auditoria existentes obrigatórios; campos NOT NULL e referências não vazias', t => {
  const {store, row} = fixture(t);
  for (const change of [{organization_id: 'missing-org'}, {creation_audit_id: 'missing-audit'}]) assert.throws(() => insert(store, {...row, ...change}), /FOREIGN KEY/);
  for (const column of columns.filter(c => c !== 'created_by')) assert.throws(() => insert(store, {...row, [column]: null}), /NOT NULL/);
  for (const column of ['id', 'identity_ref', 'created_at', 'creation_evidence_ref']) assert.throws(() => insert(store, {...row, [column]: '  '}), /CHECK/);
  for (const change of [{legal_type: 'UNKNOWN'}, {creation_provenance: 'UNKNOWN'}, {identity_ref: Buffer.from('ref')}]) assert.throws(() => insert(store, {...row, ...change}), /CHECK|BLOB/);
  assert.deepEqual(rows(store), []);
});

test('C2 tipos/estado: PF e PJ PROVISIONED aceitos; demais estados e estado desconhecido recusados', t => {
  const {store, row} = fixture(t);
  for (const status of ['ACTIVE', 'SUSPENDED', 'CLOSED', 'UNKNOWN']) assert.throws(() => insert(store, {...row, status}), /LEGAL_NOT_PROVISIONED/);
  insert(store, row); insert(store, {...row, id: 'legal-test-002', legal_type: 'PJ'});
  assert.deepEqual(rows(store).map(r => [r.legal_type, r.status]), [['PF', 'PROVISIONED'], ['PJ', 'PROVISIONED']]);
});

test('C2 proveniência: USER exige ator existente; TECHNICAL admite ator nulo ou existente sem provar autorização', t => {
  const {store, row} = fixture(t);
  assert.throws(() => insert(store, {...row, creation_provenance: 'USER'}), /CHECK/);
  for (const creation_provenance of ['USER', 'TECHNICAL']) assert.throws(() => insert(store, {...row, creation_provenance, created_by: 'missing-user'}), /FOREIGN KEY/);
  insert(store, {...row, id: 'technical-null'});
  insert(store, {...row, id: 'technical-actor', created_by: 'actor-test'});
  insert(store, {...row, id: 'user-actor', creation_provenance: 'USER', created_by: 'actor-test'});
  assert.equal(rows(store).length, 3);
});

test('C2 limite explícito: FK de auditoria/ator prova existência, não mesma Org, causa ou autorização', t => {
  const {store, row, other} = fixture(t);
  // Deliberately references an event belonging to A and an actor without B membership.
  // Accepted structurally: a future writer must reject invalid semantic contexts.
  insert(store, {...row, organization_id: other.id, creation_provenance: 'USER', created_by: 'actor-test'});
  assert.equal(rows(store)[0].organization_id, other.id);
  assert.equal(rows(store)[0].creation_audit_id, row.creation_audit_id);
  assert.equal(verifyAuditChain(store), true);
});

for (const recursive of [0, 1]) {
  test(`C2 imutabilidade e conflitos: UPDATE/DELETE/REPLACE/UPSERT/IGNORE/multirow/cross-Org; recursive=${recursive}`, t => {
    const {store, row, other} = fixture(t); store.db.exec('PRAGMA recursive_triggers=' + recursive); insert(store, row);
    const before = rows(store), allBefore = digest(contents(store));
    for (const column of columns) {
      const value = column === 'created_by' ? 'actor-test' : column === 'organization_id' ? other.id : 'changed';
      assert.throws(() => store.db.prepare(`UPDATE legal_entities SET ${column}=?`).run(value), /LEGAL_CANDIDATE_IMMUTABLE/);
    }
    assert.throws(() => store.db.exec('UPDATE legal_entities SET id=id'), /LEGAL_CANDIDATE_IMMUTABLE/);
    assert.throws(() => store.db.exec('DELETE FROM legal_entities'), /LEGAL_CANDIDATE_IMMUTABLE/);
    for (const organization_id of [row.organization_id, other.id]) {
      const candidate = {...row, organization_id, identity_ref: 'identity-ref-test-replacement'};
      for (const verb of ['INSERT', 'INSERT OR REPLACE', 'INSERT OR IGNORE', 'REPLACE']) assert.throws(() => insert(store, candidate, verb), /LEGAL_ID_ALREADY_EXISTS/);
      for (const suffix of ['ON CONFLICT(id) DO UPDATE SET identity_ref=excluded.identity_ref', 'ON CONFLICT(organization_id,id) DO UPDATE SET id=excluded.id', 'ON CONFLICT DO NOTHING']) assert.throws(() => insert(store, candidate, 'INSERT', suffix), /LEGAL_ID_ALREADY_EXISTS/);
    }
    const values = '(' + columns.map(() => '?').join(',') + ')';
    for (const verb of ['INSERT', 'INSERT OR REPLACE', 'INSERT OR IGNORE']) {
      assert.throws(() => store.db.prepare(`${verb} INTO legal_entities (${columns.join(',')}) VALUES ${values},${values}`)
        .run(...columns.map(c => ({...row, id: 'new-before-conflict'})[c]), ...columns.map(c => row[c])), /LEGAL_ID_ALREADY_EXISTS/);
    }
    assert.throws(() => store.db.prepare('INSERT OR REPLACE INTO legal_entities(rowid,id) VALUES(1,?)').run('new-id'), /no column named rowid/);
    assert.deepEqual(rows(store), before); assert.equal(digest(contents(store)), allBefore);
  });
}

test('C2 tooling: snapshot completo ordena WITHOUT ROWID por PK e detecta diferenças; replay conserva todas as tabelas', t => {
  const {store, row, other} = fixture(t, {approvedOnly: true});
  insert(store, {...row, id: 'z'}); insert(store, {...row, id: 'a'}); insert(store, {...row, organization_id: other.id, id: 'b'});
  const before = contents(store), expected = rows(store);
  assert.deepEqual(before.find(([name]) => name === 'legal_entities')[1], expected);
  assert.equal(expected.length, 3);
  const unit = require('./entities').createUnit(store, row.organization_id, {name: 'Replay sintético'});
  const scope = {companyId: row.organization_id, unitId: unit.id}, initial = {schemaVersion: 2, products: [], customers: [], sales: [], stockMovements: []};
  store.transaction(() => require('./state-repository').writeState(store, scope, initial, 0));
  const {state, revision} = require('./scoped-state').loadState(store, scope);
  const source = fs.readFileSync(path.join(__dirname, 'inventory-store.js'), 'utf8');
  const result = equivalence(store, scope, state, revision, [source, source]);
  assert.equal(result.equal, true); assert.equal(result.tables.find(r => r.name === 'legal_entities').rows, 3);
  const saved = digest(contents(store)); insert(store, {...row, id: 'another'});
  assert.notEqual(digest(contents(store)), saved); assert.deepEqual(rows(store).filter(r => r.id !== 'another'), expected);
});

test('C2 migration: upgrade preserva cada tabela antiga e checksum; 011 vazia aplicada uma vez, migrate/reabertura no-op', t => {
  const dir = directory(t), oldDir = prefix(dir), migrations = c2Migrations(t), filename = path.join(dir, 'isolated.sqlite');
  let store = new SqlStore(filename, {environment: 'test', migrationsDir: oldDir});
  try {
    createCompany(store, {name: 'Histórico sintético'});
    const before = contents(store), old = checksumList(oldDir), catalog = store.db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY name").all();
    store.migrate(migrations); requireLegal(store);
    assert.deepEqual(contents(store).filter(([name]) => name !== 'legal_entities' && name !== 'schema_migrations'), before.filter(([name]) => name !== 'schema_migrations'));
    assert.deepEqual(checksumList(migrations).slice(0, 10), old);
    const added = store.db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY name").all();
    assert.deepEqual(added.filter(r => r.tbl_name !== 'legal_entities'), catalog);
    assert.equal(added.length - catalog.length, 5); // Table, global UNIQUE autoindex, three triggers.
    assert.deepEqual(rows(store), []);
    const once = contents(store); assert.equal(once.find(([n]) => n === 'schema_migrations')[1].length, 11);
    store.migrate(migrations); assert.deepEqual(contents(store), once);
    store.close(); store = new SqlStore(filename, {environment: 'test', migrationsDir: migrations});
    assert.deepEqual(contents(store), once);
  } finally {store.close();}
});

test('C2 migrador: checksum alterado continua recusado sem mudar registro nem dados', t => {
  const dir = directory(t), copy = prefix(dir, 11), store = new SqlStore(':memory:', {environment: 'test', migrationsDir: copy}); t.after(() => store.close());
  requireLegal(store); const before = digest(contents(store));
  fs.appendFileSync(path.join(copy, NAME), '\n-- synthetic checksum mismatch\n');
  assert.throws(() => store.migrate(copy), /alterada/);
  assert.equal(digest(contents(store)), before);
});

test('C2 atomicidade: falha intermediária reverte tabela, triggers, registro e escrita antiga na mesma migration', t => {
  const dir = directory(t), copy = prefix(dir), store = new SqlStore(':memory:', {environment: 'test', migrationsDir: copy}); t.after(() => store.close());
  const company = createCompany(store, {name: 'Histórico sintético'}), before = digest(contents(store));
  const ddl = approvedDDL(), triggerEnd = ddl.indexOf('END;') + 4;
  fs.writeFileSync(path.join(copy, NAME), ddl.slice(0, triggerEnd) + "\nUPDATE companies SET name='attempted' WHERE id='" + company.id + "';\nSELECT * FROM intentional_missing_c2_table;\n" + ddl.slice(triggerEnd));
  assert.throws(() => store.migrate(copy), /intentional_missing_c2_table/);
  assert.equal(digest(contents(store)), before);
  assert.deepEqual(store.db.prepare("SELECT name FROM sqlite_master WHERE name LIKE 'legal_entities%'").all(), []);
  assert.equal(store.db.prepare('SELECT count(*) n FROM schema_migrations').get().n, 10);
});
