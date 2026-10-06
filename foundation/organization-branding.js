'use strict';
const {DEFAULT_BRANDING, parseBranding} = require('../shared/branding-core.mjs');
const {requestContext} = require('./request-context');
const {requirePermission} = require('./identity');
const {effectivePermissions} = require('./rbac');
const {appendAudit} = require('./audit');
const {AppError} = require('./errors');
const fields = ['displayName', 'primaryColor', 'accentColor', 'themeMode'];
const fail = (status, code, message) => new AppError(status, code, message);
function stored(store, organizationId) {return store.db.prepare('SELECT * FROM organization_branding WHERE organization_id=?').get(organizationId);}
function dto(row) {
  if (!row) return {...DEFAULT_BRANDING};
  const revision = Number.isSafeInteger(row.revision) && row.revision > 0 ? row.revision : 0;
  return parseBranding({displayName: row.display_name, primaryColor: row.primary_color, accentColor: row.accent_color, themeMode: row.theme_mode, revision}) || {...DEFAULT_BRANDING, revision};
}
function requireOrganizationReach(store, ctx) {
  requirePermission(ctx, 'companies.manage');
  // Operational scopes in v1 are active Units. Enumerate the Org, not user access.
  const units = store.db.prepare("SELECT id FROM units WHERE company_id=? AND status='active'").all(ctx.companyId);
  if (!units.length || units.some(unit => !effectivePermissions(store, ctx.userId, ctx.companyId, unit.id).includes('companies.manage')))
    throw fail(403, 'FORBIDDEN_BRANDING_SCOPE', 'Para alterar a aparência, você precisa gerenciar todas as unidades ativas desta organização.');
}
function handleBranding(runtime, req, raw) {
  const url = new URL(req.url, 'http://local');
  if (url.pathname !== '/api/organization/branding') return null;
  if (!['GET', 'POST'].includes(req.method)) throw fail(404, 'NOT_FOUND', 'Operação não encontrada.');
  const write = req.method === 'POST', {store, identity} = runtime;
  const authorize = () => {const ctx = requestContext(identity, req, {write}); if (write) requireOrganizationReach(store, ctx); return ctx;};
  const initial = authorize();
  if (url.search) throw fail(422, 'INVALID_BRANDING_INPUT', 'Use somente o contexto atual.');
  if (!write) return {status: 200, value: dto(stored(store, initial.companyId))};
  const input = identity.body(raw);
  if (Object.keys(input).some(key => ![...fields, 'expectedRevision'].includes(key))) throw fail(422, 'INVALID_BRANDING_INPUT', 'Informe somente os campos de aparência.');
  const branding = parseBranding({...input, revision: input.expectedRevision});
  if (!branding) throw fail(422, 'INVALID_BRANDING_INPUT', 'Confira nome, cores, tema e revisão da aparência.');
  return store.transaction(() => {
    const ctx = authorize(), old = stored(store, ctx.companyId), revision = old?.revision || 0;
    if (revision !== input.expectedRevision || !Number.isSafeInteger(revision + 1)) throw fail(409, 'STALE_BRANDING', 'A aparência mudou. Recarregue antes de salvar.');
    const next = {...branding, revision: revision + 1}, now = new Date().toISOString();
    if (old) {
      const result = store.db.prepare('UPDATE organization_branding SET display_name=?,primary_color=?,accent_color=?,theme_mode=?,revision=?,updated_at=?,updated_by=? WHERE organization_id=? AND revision=?')
        .run(next.displayName, next.primaryColor, next.accentColor, next.themeMode, next.revision, now, ctx.userId, ctx.companyId, revision);
      if (result.changes !== 1) throw fail(409, 'STALE_BRANDING', 'A aparência mudou. Recarregue antes de salvar.');
    } else store.db.prepare('INSERT INTO organization_branding VALUES(?,?,?,?,?,?,?,?)')
      .run(ctx.companyId, next.displayName, next.primaryColor, next.accentColor, next.themeMode, next.revision, now, ctx.userId);
    const before = dto(old), changedFields = fields.filter(field => before[field] !== next[field]);
    appendAudit(store, {userId: ctx.userId, companyId: ctx.companyId, unitId: ctx.unitId, sessionId: ctx.sessionId, executedBy: ctx.userId,
      action: old ? 'UPDATE' : 'CREATE', entity: 'organization_branding', recordId: ctx.companyId, before,
      after: {...next, changedFields}});
    return {status: 200, value: next};
  });
}
module.exports = {handleBranding};
