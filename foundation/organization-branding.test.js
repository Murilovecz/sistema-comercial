'use strict';
const {test} = require('node:test'), assert = require('node:assert/strict');
const {fixture, profile} = require('./http-fixture');
const {createCompany, createUnit, updateUnit} = require('./entities');
const {grantCompanyAccess, grantUnitAccess} = require('./access');
const {createRole, assignRole, setRolePermissions} = require('./rbac');
const {verifyAuditChain} = require('./audit');
const {contents, digest} = require('../scripts/stock-insert-equivalence');
const ROUTE = '/api/organization/branding';
const DEFAULT = {displayName: 'Sistema Comercial', primaryColor: '#17603C', accentColor: '#B88700', themeMode: 'LIGHT', revision: 0};
const input = (extra = {}) => ({displayName: 'Loja sintética A', primaryColor: '#123abc', accentColor: '#fedcba', themeMode: 'SYSTEM', expectedRevision: 0, ...extra});
function persisted(store) {return digest(contents(store).map(([name, rows]) => [name, name === 'sessions' ? rows.map(({last_seen_at, ...row}) => row) : rows]));}
async function read(client) {const r = await client.call(ROUTE); assert.equal(r.status, 200, r.text); return r.data;}
function requireSchema(store) {assert.ok(store.db.prepare("SELECT name FROM sqlite_master WHERE name='organization_branding'").get(), 'migration 012 / schema branding inexistente');}
function rawInsert(f, extra = {}) {
  const row = {organization_id: f.scope.companyId, display_name: 'Loja sintética', primary_color: '#123ABC', accent_color: '#FEDCBA', theme_mode: 'LIGHT', revision: 1, updated_at: '2026-10-06T12:00:00Z', updated_by: f.ownerId, ...extra};
  f.store.db.prepare('INSERT INTO organization_branding VALUES(?,?,?,?,?,?,?,?)').run(...Object.values(row));
}
test('BRAND banco: aditivo, vazio, uma configuração por Org, FKs e valores controlados', async t => {
  const f = await fixture(t); requireSchema(f.store);
  assert.equal(f.store.db.prepare('SELECT count(*) n FROM organization_branding').get().n, 0);
  assert.equal(f.store.db.prepare('PRAGMA table_list').all().find(r => r.name === 'organization_branding').strict, 1);
  assert.throws(() => rawInsert(f, {organization_id: 'missing'}), /FOREIGN KEY/);
  assert.throws(() => rawInsert(f, {updated_by: 'missing'}), /FOREIGN KEY/);
  for (const change of [{primary_color: 'url(x)'}, {accent_color: '#abcdef'}, {primary_color: '#FFFFF'}, {primary_color: '#123ABC\0x'}, {accent_color: '#FEDCBA\0'}, {theme_mode: 'AUTO'}, {revision: 0}, {revision: 1.5}, {display_name: ''}, {updated_at: ''}]) assert.throws(() => rawInsert(f, change), /CHECK|INT/);
  rawInsert(f); assert.throws(() => rawInsert(f), /UNIQUE/);
  assert.deepEqual(f.store.db.prepare('PRAGMA foreign_key_check').all(), []);
});
test('BRAND leitura: sem linha é default; DTO não expõe colunas internas', async t => {
  const f = await fixture(t); assert.deepEqual(await read(f.owner), DEFAULT);
  const r = await f.owner.call(ROUTE, input()); assert.equal(r.status, 200, r.text);
  assert.deepEqual(r.data, {displayName: 'Loja sintética A', primaryColor: '#123ABC', accentColor: '#FEDCBA', themeMode: 'SYSTEM', revision: 1});
  assert.deepEqual(await read(f.owner), r.data);
});
test('BRAND escrita: permission explícita, CSRF e valores controlados; nomes de papéis não concedem acesso', async t => {
  const f = await fixture(t), reader = await profile(f, [], 'branding-denied');
  assert.deepEqual(await read(reader.client), DEFAULT);
  assert.equal((await reader.client.call(ROUTE, input())).status, 403);
  assert.equal((await f.owner.call(ROUTE, input(), {'X-CSRF-Token': 'invalid'})).status, 403);
  const admin = await profile(f, ['companies.manage'], 'branding-manager');
  const before = persisted(f.store);
  for (const change of [{primaryColor: 'var(--x)'}, {primaryColor: 'url(x)'}, {primaryColor: 'calc(1)'}, {primaryColor: 'expression(x)'}, {accentColor: 'javascript:x'}, {themeMode: 'AUTO'}, {displayName: '   '}, {displayName: 'x'.repeat(81)}, {displayName: 'a\nb'}, {expectedRevision: -1}, {expectedRevision: 1.5}, {expectedRevision: undefined}, {css: 'body{}'}, {logoUrl: 'https://example.test/logo'}]) {
    assert.equal((await admin.client.call(ROUTE, input(change))).status, 422);
    assert.equal(persisted(f.store), before);
  }
  assert.equal((await admin.client.call(ROUTE, input())).status, 200);
});
test('BRAND isolamento: IDs e headers não permitem ler/escrever outra Org; duas Orgs usam configs independentes', async t => {
  const f = await fixture(t); assert.equal((await f.owner.call(ROUTE, input())).status, 200);
  const c = createCompany(f.store, {name: 'Org sintética B'}), u = createUnit(f.store, c.id, {name: 'Unidade B'}), other = {companyId: c.id, unitId: u.id};
  f.store.transaction(() => {grantCompanyAccess(f.store, f.ownerId, c.id); grantUnitAccess(f.store, f.ownerId, c.id, u.id); const role = createRole(f.store, c.id, {name: 'Sintético', permissions: ['companies.manage']}); assignRole(f.store, f.ownerId, c.id, u.id, role.id);});
  const aOnly = await profile(f, ['companies.manage'], 'branding-only-a');
  assert.equal((await aOnly.client.call('/api/auth/context', other)).status, 403);
  assert.equal((await aOnly.client.call(ROUTE, undefined, {'X-Company-ID': c.id, 'X-Unit-ID': u.id})).status, 409);
  assert.equal((await aOnly.client.call(ROUTE, input(), {'X-Company-ID': c.id, 'X-Unit-ID': u.id})).status, 409);
  assert.equal((await read(aOnly.client)).displayName, 'Loja sintética A');
  const before = persisted(f.store);
  for (const query of ['?companyId=' + c.id, '?organizationId=' + c.id]) assert.equal((await f.owner.call(ROUTE + query)).status, 422);
  assert.equal((await f.owner.call(ROUTE + '/' + c.id)).status, 404);
  assert.equal((await f.owner.call(ROUTE, input({companyId: c.id}))).status, 422);
  assert.equal((await f.owner.call(ROUTE, input(), {'X-Company-ID': c.id, 'X-Unit-ID': u.id})).status, 409);
  // Authentication legitimately updates session.last_seen_at, so compare business after rejected probes.
  assert.equal(f.store.db.prepare('SELECT count(*) n FROM organization_branding').get().n, 1);
  assert.equal(persisted(f.store), before);
  assert.equal((await f.owner.call('/api/auth/context', other)).status, 200);
  assert.deepEqual(await read(f.owner), DEFAULT);
  assert.equal((await f.owner.call(ROUTE, input({displayName: 'Org B', primaryColor: '#0000FF'}))).status, 200);
  assert.equal((await read(f.owner)).primaryColor, '#0000FF');
  assert.equal((await f.owner.call('/api/auth/context', f.scope)).status, 200);
  assert.equal((await read(f.owner)).primaryColor, '#123ABC');
  assert.equal(f.store.db.prepare('SELECT count(*) n FROM organization_branding').get().n, 2);
});
test('BRAND CAS e auditoria: concorrência não sobrescreve; rollback atômico; restore default mantém história', async t => {
  const f = await fixture(t); const first = await f.owner.call(ROUTE, input()); assert.equal(first.status, 200, first.text);
  const events = () => f.store.db.prepare("SELECT * FROM audit_events WHERE entity='organization_branding' ORDER BY sequence").all();
  assert.equal(events().length, 1); assert.equal(events()[0].user_id, f.ownerId); assert.equal(events()[0].company_id, f.scope.companyId);
  assert.deepEqual(JSON.parse(events()[0].after_json).changedFields, ['displayName', 'primaryColor', 'accentColor', 'themeMode']);
  const stale = await f.owner.call(ROUTE, input()); assert.equal(stale.status, 409); assert.equal(events().length, 1);
  f.store.db.exec("CREATE TRIGGER branding_fail BEFORE INSERT ON audit_events WHEN NEW.entity='organization_branding' BEGIN SELECT RAISE(ABORT,'synthetic audit failure'); END;");
  const old = await read(f.owner); assert.equal((await f.owner.call(ROUTE, input({expectedRevision: 1, displayName: 'Tentativa'}))).status, 500); assert.deepEqual(await read(f.owner), old);
  f.store.db.exec('DROP TRIGGER branding_fail');
  const reset = await f.owner.call(ROUTE, {...DEFAULT, expectedRevision: 1, revision: undefined}); assert.equal(reset.status, 200, reset.text); assert.equal(reset.data.revision, 2);
  assert.equal(events().length, 2); assert.equal(verifyAuditChain(f.store), true);
});
test('BRAND fallback: dado inválido no DB sintético produz default sem servir o branding anterior', async t => {
  const f = await fixture(t); requireSchema(f.store); rawInsert(f);
  f.store.db.exec("PRAGMA ignore_check_constraints=ON; UPDATE organization_branding SET primary_color='url(x)'; PRAGMA ignore_check_constraints=OFF;");
  assert.deepEqual(await read(f.owner), {...DEFAULT, revision: 1});
});

test('BRAND Org-wide: manage em uma de duas Units nega escrita, preserva leitura e dados/audit', async t => {
  const f = await fixture(t), manager = await profile(f, ['companies.manage'], 'brand-partial-manager');
  createUnit(f.store, f.scope.companyId, {name: 'Segunda Unit ativa'});
  const before = persisted(f.store);
  const response = await manager.client.call(ROUTE, input());
  assert.equal(response.status, 403, response.text); assert.equal(persisted(f.store), before);
  assert.deepEqual(await read(manager.client), DEFAULT);
});
test('BRAND Org-wide: manage efetiva nas duas Units permite; revogação e vínculo inativo voltam a negar', async t => {
  const f = await fixture(t), manager = await profile(f, ['companies.manage'], 'brand-full-manager');
  const unit = createUnit(f.store, f.scope.companyId, {name: 'Segunda Unit ativa'});
  let otherRole;
  f.store.transaction(() => {grantUnitAccess(f.store, manager.user.id, f.scope.companyId, unit.id);
    otherRole = createRole(f.store, f.scope.companyId, {name: 'Direito explícito segundo scope', permissions: ['companies.manage']});
    assignRole(f.store, manager.user.id, f.scope.companyId, unit.id, otherRole.id);});
  assert.equal((await manager.client.call(ROUTE, input())).status, 200);
  setRolePermissions(f.store, f.scope.companyId, otherRole.id, []);
  let before = persisted(f.store);
  assert.equal((await manager.client.call(ROUTE, input({expectedRevision: 1}))).status, 403); assert.equal(persisted(f.store), before);
  setRolePermissions(f.store, f.scope.companyId, otherRole.id, ['companies.manage']);
  grantUnitAccess(f.store, manager.user.id, f.scope.companyId, unit.id, 'inactive'); before = persisted(f.store);
  assert.equal((await manager.client.call(ROUTE, input({expectedRevision: 1}))).status, 403); assert.equal(persisted(f.store), before);
});
test('BRAND Org-wide: sem manage nas Units nega, sem criar permission ou grants', async t => {
  const f = await fixture(t), reader = await profile(f, [], 'brand-no-manage');
  const unit = createUnit(f.store, f.scope.companyId, {name: 'Segunda Unit ativa'});
  grantUnitAccess(f.store, reader.user.id, f.scope.companyId, unit.id);
  assignRole(f.store, reader.user.id, f.scope.companyId, unit.id, reader.role.id);
  const before = persisted(f.store);
  assert.equal((await reader.client.call(ROUTE, input())).status, 403); assert.equal(persisted(f.store), before);
  assert.deepEqual(await read(reader.client), DEFAULT);
});
test('BRAND Org-wide: nova Unit ativa sem grant remove alcance; Unit inativa não é operacional', async t => {
  const f = await fixture(t), manager = await profile(f, ['companies.manage'], 'brand-new-unit');
  assert.equal((await manager.client.call(ROUTE, input())).status, 200);
  const unit = createUnit(f.store, f.scope.companyId, {name: 'Nova Unit ativa'}), before = persisted(f.store);
  assert.equal((await manager.client.call(ROUTE, input({expectedRevision: 1}))).status, 403); assert.equal(persisted(f.store), before);
  updateUnit(f.store, f.scope.companyId, unit.id, {status: 'inactive'});
  assert.equal((await manager.client.call(ROUTE, input({expectedRevision: 1}))).status, 200);
  updateUnit(f.store, f.scope.companyId, unit.id, {status: 'active'});
  assert.equal((await manager.client.call(ROUTE, input({expectedRevision: 2}))).status, 403);
});
test('BRAND Org-wide: grants em outra Organization não suprem uma Unit ausente na atual', async t => {
  const f = await fixture(t), manager = await profile(f, ['companies.manage'], 'brand-other-org');
  const unit = createUnit(f.store, f.scope.companyId, {name: 'Unit A sem grant'});
  // Even an equal Unit ID in another Org cannot satisfy the missing local scope.
  const company = createCompany(f.store, {name: 'Outra Org sintética'});
  f.store.transaction(() => {
    f.store.db.prepare('INSERT INTO units VALUES(?,?,?,?,?,?)').run(company.id, unit.id, 'Unit B com ID igual', 'active', '2026', '2026');
    grantCompanyAccess(f.store, manager.user.id, company.id); grantUnitAccess(f.store, manager.user.id, company.id, unit.id);
    const role = createRole(f.store, company.id, {name: 'Direito explícito B', permissions: ['companies.manage']}); assignRole(f.store, manager.user.id, company.id, unit.id, role.id);
  });
  const before = persisted(f.store);
  assert.equal((await manager.client.call(ROUTE, input())).status, 403); assert.equal(persisted(f.store), before);
});
test('BRAND Org-wide: alcance é revalidado na transação depois da autorização inicial', async t => {
  const f = await fixture(t), manager = await profile(f, ['companies.manage'], 'brand-revalidate-reach');
  const unit = createUnit(f.store, f.scope.companyId, {name: 'Outra Unit operacional'});
  let role;
  f.store.transaction(() => {grantUnitAccess(f.store, manager.user.id, f.scope.companyId, unit.id);
    role = createRole(f.store, f.scope.companyId, {name: 'Direito revogável', permissions: ['companies.manage']});
    assignRole(f.store, manager.user.id, f.scope.companyId, unit.id, role.id);});
  const branding = await read(manager.client), audit = f.store.db.prepare('SELECT * FROM audit_events ORDER BY sequence').all();
  const transaction = f.store.transaction.bind(f.store); let armed = true;
  f.store.transaction = fn => {
    if (armed) {armed = false; setRolePermissions(f.store, f.scope.companyId, role.id, []);}
    return transaction(fn);
  };
  try {
    assert.equal((await manager.client.call(ROUTE, input())).status, 403);
    assert.equal(armed, false); assert.deepEqual(await read(manager.client), branding);
    assert.deepEqual(f.store.db.prepare('SELECT * FROM audit_events ORDER BY sequence').all(), audit);
  } finally {f.store.transaction = transaction;}
});
