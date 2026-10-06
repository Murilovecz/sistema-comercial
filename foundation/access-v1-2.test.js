'use strict';
// All access and commercial data are synthetic, in memory.
const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {fixture,profile,Client,PASSWORD}=require('./http-fixture');
const {hash}=require('./sql-store'),{verifyPassword}=require('./identity'),{verifyAuditChain}=require('./audit');
const {createCompany,createUnit}=require('./entities'),{grantCompanyAccess,grantUnitAccess}=require('./access');
const {createRole,assignRole,setRolePermissions}=require('./rbac'),{writeState,canonical}=require('./state-repository'),{loadState}=require('./scoped-state');
const {maintainAuth,startMaintenance}=require('./auth-maintenance');
const NEW='Nova senha sintética 2026!';
const CHANGE='/api/auth/password/change',ISSUE='/api/foundation/password-reset',FINISH='/api/auth/password/reset';
async function context(t){let time=Date.parse('2026-10-02T12:00:00Z');const f=await fixture(t,{identity:{now:()=>time}});f.advance=n=>time+=n;return f;}
const change=()=>({currentPassword:PASSWORD,newPassword:NEW,confirmPassword:NEW});
async function reset(f,p,extras={}){const r=await f.owner.call(ISSUE,{id:p.user.id,operatorPassword:PASSWORD,reason:'Acesso perdido pelo usuário sintético',...extras});assert.equal(r.status,201,r.text);return r.data;}
async function finish(f,p,r,extras={}){const c=new Client(f.owner.origin);await c.call('/api/auth/status');return c.call(FINISH,{login:p.login,resetCode:r.resetCode,newPassword:NEW,confirmPassword:NEW,...extras});}
function rejected(r,status){assert.equal(r.status,status,r.text);assert.doesNotMatch(r.text,/password_hash|token_hash|argon2id|SQLITE|FOREIGN KEY/i);}
function auditRows(f){return JSON.stringify(f.store.db.prepare('SELECT * FROM audit_events').all());}
test('troca real revoga todas sessões, preserva perfil e exige login novo',async t=>{
 const f=await context(t),other=new Client(f.owner.origin);await other.login('owner-fixture');const oldHash=f.store.db.prepare('SELECT password_hash FROM users WHERE id=?').get(f.ownerId).password_hash;
 const r=await f.owner.call(CHANGE,change());assert.equal(r.status,200,r.text);assert.deepEqual(r.data,{changed:true,loggedOut:true});rejected(await other.call('/api/auth/me'),401);rejected(await f.owner.call('/api/auth/me'),401);
 const row=f.store.db.prepare('SELECT * FROM users WHERE id=?').get(f.ownerId);assert.notEqual(row.password_hash,oldHash);assert.equal(await verifyPassword(NEW,row.password_hash),true);
 await f.owner.call('/api/auth/status');rejected(await f.owner.call('/api/auth/login',{login:'owner-fixture',password:PASSWORD}),401);assert.equal((await f.owner.call('/api/auth/login',{login:'owner-fixture',password:NEW})).status,200);assert.equal(verifyAuditChain(f.store),true);assert.equal(auditRows(f).includes(NEW),false);
});
test('troca recusa senha errada, confirmação, política e campos extras sem efeito',async t=>{
 const f=await context(t),before=f.store.db.prepare('SELECT password_hash FROM users').get().password_hash;
 rejected(await f.owner.call(CHANGE,{...change(),currentPassword:'senha errada'}),403);rejected(await f.owner.call(CHANGE,{...change(),confirmPassword:'diferente'}),422);rejected(await f.owner.call(CHANGE,{...change(),newPassword:'curta',confirmPassword:'curta'}),422);rejected(await f.owner.call(CHANGE,{...change(),userId:'other'}),422);assert.equal(f.store.db.prepare('SELECT password_hash FROM users').get().password_hash,before);assert.equal((await f.owner.call('/api/auth/me')).status,200);
});
test('Origin/CSRF e método continuam obrigatórios nas novas rotas',async t=>{
 const f=await context(t);rejected(await f.owner.call(CHANGE,change(),{'X-CSRF-Token':'bad'}),403);rejected(await f.owner.call(CHANGE,change(),{Origin:'http://evil.invalid'}),403);rejected(await f.owner.call(CHANGE),404);rejected(await f.owner.call('/api/auth/sessions/revoke-others',{companyId:f.scope.companyId}),422);
});
test('troca revalida credencial e sessão após cálculo assíncrono',async t=>{
 const f=await context(t),identity=f.server.runtime.identity,orig=identity.kdf.bind(identity);identity.kdf=async fn=>{const out=await orig(fn);f.store.db.prepare('UPDATE sessions SET revoked_at=? WHERE user_id=?').run(identity.iso(),f.ownerId);return out;};rejected(await f.owner.call(CHANGE,change()),401);assert.equal(await verifyPassword(PASSWORD,f.store.db.prepare('SELECT password_hash FROM users').get().password_hash),true);
});
test('falha de auditoria desfaz troca e revogação',async t=>{
 const f=await context(t);f.store.db.exec("CREATE TRIGGER fail_password BEFORE INSERT ON audit_events WHEN NEW.action='PASSWORD_CHANGE' BEGIN SELECT RAISE(ABORT,'isolated rollback'); END;");rejected(await f.owner.call(CHANGE,change()),500);assert.equal((await f.owner.call('/api/auth/me')).status,200);assert.equal(await verifyPassword(PASSWORD,f.store.db.prepare('SELECT password_hash FROM users').get().password_hash),true);
});
test('reset hash-only e uso único: senha anterior/sessões caem e usuário escolhe credencial',async t=>{
 const f=await context(t),p=await profile(f,['catalog.view'],'recovery-user'),r=await reset(f,p);assert.match(r.resetCode,/^[A-Za-z0-9_-]{43}$/);const row=f.store.db.prepare('SELECT * FROM password_reset_grants WHERE id=?').get(r.resetId);assert.equal(row.code_hash,hash(r.resetCode));assert.equal(Date.parse(r.expiresAt)-Date.parse(row.created_at),900000);
 rejected(await p.client.call('/api/auth/me'),401);await p.client.call('/api/auth/status');rejected(await p.client.call('/api/auth/login',{login:p.login,password:PASSWORD}),401);assert.equal(auditRows(f).includes(r.resetCode),false);assert.equal(auditRows(f).includes(PASSWORD),false);
 const complete=await finish(f,p,r);assert.equal(complete.status,200,complete.text);assert.equal(complete.data.loggedOut,true);await p.client.login(p.login,NEW);rejected(await finish(f,p,r),403);assert.equal(verifyAuditChain(f.store),true);
});
test('reset exige direito específico, motivo e senha real do executor; próprio reset recusado',async t=>{
 const f=await context(t),p=await profile(f,['catalog.view'],'reset-target'),low=await profile(f,['users.manage','roles.manage'],'reset-low');rejected(await low.client.call(ISSUE,{id:p.user.id,operatorPassword:PASSWORD,reason:'Motivo'}),403);rejected(await f.owner.call(ISSUE,{id:p.user.id,operatorPassword:'wrong',reason:'Motivo'}),403);rejected(await f.owner.call(ISSUE,{id:p.user.id,operatorPassword:PASSWORD,reason:' '}),422);rejected(await f.owner.call(ISSUE,{id:f.ownerId,operatorPassword:PASSWORD,reason:'Motivo'}),403);assert.equal(f.store.db.prepare('SELECT count(*) n FROM password_reset_grants').get().n,0);
});
test('reset nega usuário global com vínculo em outra empresa ativa ou inativa',async t=>{
 const f=await context(t),p=await profile(f,['catalog.view'],'multi-target'),c=createCompany(f.store,{name:'Empresa isolada B'});grantCompanyAccess(f.store,p.user.id,c.id);
 for(const status of ['active','inactive']){f.store.db.prepare('UPDATE company_memberships SET status=? WHERE user_id=? AND company_id=?').run(status,p.user.id,c.id);rejected(await f.owner.call(ISSUE,{id:p.user.id,operatorPassword:PASSWORD,reason:'Motivo'}),403);}assert.equal((await p.client.call('/api/auth/me')).status,200);
});
test('reset nega ID externo ao contexto e alvo mais privilegiado em qualquer unidade',async t=>{
 const f=await context(t),p=await profile(f,['catalog.view'],'priv-target'),admin=await profile(f,['catalog.view','users.reset_password'],'limited-reset');const u=createUnit(f.store,f.scope.companyId,{name:'Outra unidade'});grantUnitAccess(f.store,p.user.id,f.scope.companyId,u.id);const role=createRole(f.store,f.scope.companyId,{name:'Privilégio maior',permissions:['financial.manage']});assignRole(f.store,p.user.id,f.scope.companyId,u.id,role.id);
 rejected(await admin.client.call(ISSUE,{id:p.user.id,operatorPassword:PASSWORD,reason:'Motivo'}),403);rejected(await f.owner.call(ISSUE,{id:'unknown-user',operatorPassword:PASSWORD,reason:'Motivo'}),404);
});
test('reset revalida tenant, direitos e senha do executor depois do await',async t=>{
 const f=await context(t),p=await profile(f,['catalog.view'],'reset-race'),identity=f.server.runtime.identity,original=identity.kdf.bind(identity);identity.kdf=async fn=>{const out=await original(fn);const c=createCompany(f.store,{name:'Vínculo novo B'});grantCompanyAccess(f.store,p.user.id,c.id);return out;};rejected(await f.owner.call(ISSUE,{id:p.user.id,operatorPassword:PASSWORD,reason:'Motivo'}),403);assert.equal(f.store.db.prepare('SELECT count(*) n FROM password_reset_grants').get().n,0);
});
test('convite vencido, alterado ou reemitido não recupera acesso',async t=>{
 const f=await context(t),p=await profile(f,['catalog.view'],'reset-expired'),old=await reset(f,p),fresh=await reset(f,p);rejected(await finish(f,p,old),403);rejected(await finish(f,p,fresh,{resetCode:'X'.repeat(43)}),403);f.advance(900000);rejected(await finish(f,p,fresh),403);assert.equal(f.store.db.prepare('SELECT count(*) n FROM password_reset_grants WHERE consumed_at IS NOT NULL').get().n,0);
});
test('novo vínculo multiempresa ou direito do emissor revogado invalida convite já emitido',async t=>{
 const f=await context(t),p=await profile(f,['catalog.view'],'reset-late-tenant'),r=await reset(f,p),c=createCompany(f.store,{name:'Nova empresa B'});grantCompanyAccess(f.store,p.user.id,c.id);rejected(await finish(f,p,r),403);f.store.db.prepare('DELETE FROM company_memberships WHERE user_id=? AND company_id=?').run(p.user.id,c.id);const roles=f.store.db.prepare('SELECT role_id FROM unit_roles WHERE user_id=?').all(f.ownerId);for(const row of roles)setRolePermissions(f.store,f.scope.companyId,row.role_id,['catalog.view']);rejected(await finish(f,p,r),403);
});
test('conclusão exige pré-login CSRF e senha confirmada, sem consumir convite',async t=>{
 const f=await context(t),p=await profile(f,['catalog.view'],'reset-input'),r=await reset(f,p),c=new Client(f.owner.origin);rejected(await c.call(FINISH,{login:p.login,resetCode:r.resetCode,newPassword:NEW,confirmPassword:NEW}),403);await c.call('/api/auth/status');rejected(await c.call(FINISH,{login:p.login,resetCode:r.resetCode,newPassword:NEW,confirmPassword:'wrong'}),422);assert.equal(f.store.db.prepare('SELECT consumed_at FROM password_reset_grants WHERE id=?').get(r.resetId).consumed_at,null);
});
test('dois consumos concorrentes de convite geram só uma alteração auditada',async t=>{
 const f=await context(t),p=await profile(f,['catalog.view'],'reset-concurrent'),r=await reset(f,p);const out=await Promise.all([finish(f,p,r),finish(f,p,r)]);assert.deepEqual(out.map(x=>x.status).sort(),[200,403]);assert.equal(f.store.db.prepare("SELECT count(*) n FROM audit_events WHERE action='PASSWORD_RESET_COMPLETED'").get().n,1);
});
test('auditoria falha no reset mantém senha anterior e sessões sem convite parcial',async t=>{
 const f=await context(t),p=await profile(f,['catalog.view'],'reset-rollback');f.store.db.exec("CREATE TRIGGER fail_reset BEFORE INSERT ON audit_events WHEN NEW.action='PASSWORD_RESET_ISSUED' BEGIN SELECT RAISE(ABORT,'isolated rollback'); END;");rejected(await f.owner.call(ISSUE,{id:p.user.id,operatorPassword:PASSWORD,reason:'Motivo'}),500);assert.equal((await p.client.call('/api/auth/me')).status,200);assert.equal(f.store.db.prepare('SELECT count(*) n FROM password_reset_grants').get().n,0);
});
test('auditoria falha na conclusão desfaz consumo e permite recuperar com mesmo código',async t=>{
 const f=await context(t),p=await profile(f,['catalog.view'],'finish-rollback'),r=await reset(f,p);f.store.db.exec("CREATE TRIGGER fail_finish BEFORE INSERT ON audit_events WHEN NEW.action='PASSWORD_RESET_COMPLETED' BEGIN SELECT RAISE(ABORT,'isolated rollback'); END;");rejected(await finish(f,p,r),500);assert.equal(f.store.db.prepare('SELECT consumed_at FROM password_reset_grants WHERE id=?').get(r.resetId).consumed_at,null);f.store.db.exec('DROP TRIGGER fail_finish');assert.equal((await finish(f,p,r)).status,200);
});
test('usuário global altera sua senha antes de escolher contexto e revoga todas empresas',async t=>{
 const f=await context(t),c=createCompany(f.store,{name:'Empresa própria B'}),u=createUnit(f.store,c.id,{name:'Unidade B'});grantCompanyAccess(f.store,f.ownerId,c.id);grantUnitAccess(f.store,f.ownerId,c.id,u.id);const a=new Client(f.owner.origin);const login=await a.login('owner-fixture');assert.equal(login.companyId,null);assert.equal((await a.call('/api/auth/sessions')).data.sessions.length,2);assert.equal((await a.call(CHANGE,change())).status,200);rejected(await f.owner.call('/api/auth/me'),401);assert.equal(verifyAuditChain(f.store),true);
});
test('sessões mostram somente usuário atual e revogação direta nega IDs alheios',async t=>{
 const f=await context(t),other=new Client(f.owner.origin);await other.login('owner-fixture');const p=await profile(f,['catalog.view'],'session-foreign'),foreign=(await p.client.call('/api/auth/me')).data.sessionId,list=await f.owner.call('/api/auth/sessions');assert.equal(list.status,200);assert.equal(list.data.sessions.length,2);assert.equal(list.data.sessions.filter(s=>s.current).length,1);assert.equal(list.text.includes(foreign),false);assert.doesNotMatch(list.text,/token|cookie|password_hash/i);rejected(await f.owner.call('/api/auth/sessions/revoke',{sessionId:foreign}),404);
 const target=list.data.sessions.find(s=>!s.current);assert.equal((await f.owner.call('/api/auth/sessions/revoke',{sessionId:target.id})).status,200);rejected(await other.call('/api/auth/me'),401);assert.equal((await f.owner.call('/api/auth/me')).status,200);
});
test('encerrar outras preserva atual; encerrar atual efetiva logout no servidor',async t=>{
 const f=await context(t),a=new Client(f.owner.origin),b=new Client(f.owner.origin);await a.login('owner-fixture');await b.login('owner-fixture');assert.equal((await f.owner.call('/api/auth/sessions/revoke-others',{})).data.count,2);rejected(await a.call('/api/auth/me'),401);rejected(await b.call('/api/auth/me'),401);const current=(await f.owner.call('/api/auth/me')).data.sessionId,r=await f.owner.call('/api/auth/sessions/revoke',{sessionId:current});assert.equal(r.data.loggedOut,true);rejected(await f.owner.call('/api/auth/me'),401);assert.equal(verifyAuditChain(f.store),true);
});
test('listagem omite sessões expiradas/inativas e não infere dispositivo confiável',async t=>{
 const f=await context(t),other=new Client(f.owner.origin);await other.login('owner-fixture');f.advance(30*60000);await f.owner.login('owner-fixture');const list=await f.owner.call('/api/auth/sessions');assert.equal(list.data.sessions.length,1);assert.equal(list.data.sessions[0].origin,'Local');assert.doesNotMatch(list.text,/trusted|confiável/i);
});
async function grantScenario(t){
 const f=await context(t),before=loadState(f.store,f.scope);f.store.transaction(()=>writeState(f.store,f.scope,{...before.state,products:[{id:'inactive',name:'Sintético inativo',priceCents:100,stock:3,version:1,active:false}],customers:[],sales:[]},before.revision));
 const draft={requestId:randomUUID(),items:[{productId:'inactive',quantity:1,priceCents:100}],paymentMethod:'pix',paymentStatus:'received',expectedCashSessionId:null};
 const r=await f.owner.call('/api/commercial/sales/inactive-approval',{saleDraft:draft,approverLogin:'owner-fixture',approverPassword:PASSWORD,reason:'Exceção sintética'});assert.equal(r.status,201,r.text);f.draft=draft;f.grant=r.data;return f;
}
test('purge de grant expirado conserva auditoria; retenção e lotes são conservadores',async t=>{
 const f=await grantScenario(t),audit=f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n;f.advance(120000);assert.equal(maintainAuth(f.server.runtime).unused,0);f.advance(86400000);assert.equal(maintainAuth(f.server.runtime).unused,1);assert.ok(f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n>=audit);assert.equal(verifyAuditChain(f.store),true);assert.throws(()=>maintainAuth(f.server.runtime,{unusedMs:0}),/Retenção/);
});
test('purge consumido conserva venda/movimentos/auditoria e reenvio idêntico continua único',async t=>{
 const f=await grantScenario(t),input={...f.draft,approvalToken:f.grant.approvalToken},sale=await f.owner.call('/api/commercial/sales',input);assert.equal(sale.status,201,sale.text);const current=loadState(f.store,f.scope);f.store.transaction(()=>require('./sales-store').normalizeSales(f.store,f.scope,current.state,current.revision));const before=canonical(loadState(f.store,f.scope));f.advance(7*86400000);const result=maintainAuth(f.server.runtime);assert.equal(result.consumed,1);assert.equal(canonical(loadState(f.store,f.scope)),before);assert.equal(verifyAuditChain(f.store),true);await f.owner.login('owner-fixture');const retry=await f.owner.call('/api/commercial/sales',input);assert.equal(retry.status,201,retry.text);assert.equal(retry.data.sale.id,sale.data.sale.id);assert.equal(loadState(f.store,f.scope).state.sales.length,1);rejected(await f.owner.call('/api/commercial/sales',{...input,items:[{productId:'inactive',quantity:2,priceCents:100}]}),409);
});
test('purge preserva grant consumido sem evidência permanente e reporta inconsistência',async t=>{
 const f=await grantScenario(t);f.store.db.prepare('UPDATE inactive_sale_approvals SET consumed_at=?,sale_id=? WHERE id=?').run(f.server.runtime.identity.iso(),'missing-sale',f.grant.approvalId);f.advance(7*86400000);const r=maintainAuth(f.server.runtime);assert.equal(r.consumed,0);assert.equal(r.inconsistent,1);assert.equal(f.store.db.prepare('SELECT count(*) n FROM inactive_sale_approvals').get().n,1);
});
test('revogação de sessão e troca invalidam grants pendentes sem eliminar auditoria',async t=>{
 const f=await grantScenario(t);assert.equal((await f.owner.call(CHANGE,change())).status,200);assert.equal(f.store.db.prepare('SELECT count(*) n FROM inactive_sale_approvals').get().n,0);assert.equal(f.store.db.prepare("SELECT count(*) n FROM audit_events WHERE action='INACTIVE_APPROVAL_GRANTED'").get().n,1);
});
test('purge de convites expirados e manutenção paramétrica não apagam evidências',async t=>{
 const f=await context(t),p=await profile(f,['catalog.view'],'purge-reset');await reset(f,p);f.advance(900000+86400000);assert.equal(maintainAuth(f.server.runtime).resets,1);assert.equal(f.store.db.prepare("SELECT count(*) n FROM audit_events WHERE action='PASSWORD_RESET_ISSUED'").get().n,1);const service=startMaintenance(f.server.runtime,{intervalMs:1000});assert.ok(service.status.lastRun);service.stop();const before=service.status.lastRun;service.run();assert.equal(service.status.lastRun,before);
});
test('upgrade008 concede reset só uma vez aos19 direitos explícitos e audita sem nome de cargo',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'reset-upgrade-isolated-')),migrations=path.join(__dirname,'migrations');t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));for(const file of fs.readdirSync(migrations).filter(n=>/^00[1-7]_/.test(n)))fs.copyFileSync(path.join(migrations,file),path.join(dir,file));
 const {SqlStore}=require('./sql-store'),{seedPermissions,PERMISSIONS}=require('./rbac'),s=new SqlStore(':memory:',{environment:'test',migrationsDir:dir});t.after(()=>s.close());const c=createCompany(s,{name:'Upgrade sintético'}),codes=['catalog.view','catalog.manage','inventory.view','inventory.adjust','sales.view','sales.create','sales.cancel','sales.authorize_inactive','purchases.manage','financial.view','financial.manage','cash.manage','operations.view','operations.manage','users.manage','roles.manage','companies.manage','units.manage','audit.view'];
 for(const code of codes)s.db.prepare('INSERT OR IGNORE INTO permissions VALUES(?,?)').run(code,PERMISSIONS[code]);const full=createRole(s,c.id,{name:'Nome qualquer',permissions:codes}),partial=createRole(s,c.id,{name:'Proprietário',permissions:codes.filter(c=>c!=='audit.view')});s.migrate(migrations);seedPermissions(s);seedPermissions(s);const has=id=>Boolean(s.db.prepare("SELECT 1 FROM role_permissions WHERE company_id=? AND role_id=? AND permission_code='users.reset_password'").get(c.id,id));assert.equal(has(full.id),true);assert.equal(has(partial.id),false);assert.equal(s.db.prepare("SELECT count(*) n FROM audit_events WHERE action='RESET_PERMISSION_UPGRADE'").get().n,1);setRolePermissions(s,c.id,full.id,codes);seedPermissions(s);s.migrate(migrations);assert.equal(has(full.id),false);assert.equal(verifyAuditChain(s),true);
});
async function consumedScenario(t){
 const f=await grantScenario(t),r=await f.owner.call('/api/commercial/sales',{...f.draft,approvalToken:f.grant.approvalToken});assert.equal(r.status,201,r.text);const current=loadState(f.store,f.scope);f.store.transaction(()=>require('./sales-store').normalizeSales(f.store,f.scope,current.state,current.revision));f.saleId=r.data.sale.id;f.advance(7*86400000);return f;
}
test('purge de consumidos lê autoridade SQL Vendas e exige espelho equivalente',async t=>{
 const f=await consumedScenario(t),repository=require('./sales-store'),original=repository.getSale;let called=0;repository.getSale=(store,scope,id,...rest)=>{called++;assert.equal(id,f.saleId);assert.equal(scope.companyId,f.scope.companyId);return original(store,scope,id,...rest);};try{const result=maintainAuth(f.server.runtime);assert.equal(result.consumed,1);assert.equal(called,1);}finally{repository.getSale=original;}
});
test('purge falha fechado com SQL, espelho ou marcador de Vendas inconsistente',async t=>{
 for(const kind of ['sql','mirror','stale-marker','missing-marker'])await t.test(kind,async sub=>{
  const f=await consumedScenario(sub);
  if(kind==='sql')f.store.db.prepare('UPDATE commercial_sales SET total_cents=total_cents+1 WHERE company_id=? AND unit_id=? AND id=?').run(f.scope.companyId,f.scope.unitId,f.saleId);
  else if(kind==='mirror'){const row=f.store.db.prepare('SELECT payload FROM unit_states WHERE company_id=? AND unit_id=?').get(f.scope.companyId,f.scope.unitId),state=JSON.parse(row.payload);state.sales[0].customerName='Espelho adulterado sintético';f.store.db.prepare('UPDATE unit_states SET payload=? WHERE company_id=? AND unit_id=?').run(JSON.stringify(state),f.scope.companyId,f.scope.unitId);}
  else if(kind==='stale-marker')f.store.db.prepare("UPDATE commercial_normalizations SET source_revision=source_revision+1 WHERE company_id=? AND unit_id=? AND aggregate='sales'").run(f.scope.companyId,f.scope.unitId);
  else f.store.db.prepare("DELETE FROM commercial_normalizations WHERE company_id=? AND unit_id=? AND aggregate='sales'").run(f.scope.companyId,f.scope.unitId);
  const count=f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n,result=maintainAuth(f.server.runtime);assert.equal(result.consumed,0);assert.equal(result.inconsistent,1);assert.equal(f.store.db.prepare('SELECT count(*) n FROM inactive_sale_approvals').get().n,1);assert.ok(f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n>=count);
 });
});
test('purge conserva fallback histórico exclusivamente em schema anterior à009',t=>{
 const {SqlStore}=require('./sql-store'),{Identity}=require('./identity'),{appendAudit}=require('./audit'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'purge-legacy-isolated-')),migrations=path.join(__dirname,'migrations');t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));for(const file of fs.readdirSync(migrations).filter(n=>/^00[1-8]_/.test(n)))fs.copyFileSync(path.join(migrations,file),path.join(dir,file));const store=new SqlStore(':memory:',{environment:'test',migrationsDir:dir});t.after(()=>store.close());const company=createCompany(store,{name:'Legacy sintético'}),unit=createUnit(store,company.id,{name:'Legacy sintético'}),scope={companyId:company.id,unitId:unit.id},date='2026-10-02T12:00:00.000Z',identity=new Identity(store,{now:()=>Date.parse(date)+8*86400000,audit:event=>appendAudit(store,event)});
 store.db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run('legacy-actor','Pessoa sintética','legacy-purge','synthetic-hash','active',date,date);grantCompanyAccess(store,'legacy-actor',scope.companyId);grantUnitAccess(store,'legacy-actor',scope.companyId,scope.unitId);store.db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?,?,?,?,NULL)').run('legacy-session',hash('synthetic-session'),'legacy-actor',scope.companyId,scope.unitId,date,date,date);
 const execution={executedBy:'legacy-actor',authorizedBy:'legacy-actor',approvalId:'legacy-grant',approverName:'Pessoa sintética',approverRoles:['Papel sintético'],approvalReason:'Exceção sintética',approvedAt:date},sale={id:'legacy-sale',items:[],totalCents:0,execution};store.db.prepare('INSERT INTO unit_states VALUES(?,?,?,?,?)').run(scope.companyId,scope.unitId,1,JSON.stringify({products:[],customers:[],sales:[sale]}),date);
 store.db.prepare('INSERT INTO inactive_sale_approvals VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('legacy-grant',hash('synthetic-approval'),'legacy-actor','legacy-session',scope.companyId,scope.unitId,'legacy-request',hash('draft'),'[]','legacy-actor','Pessoa sintética',JSON.stringify(execution.approverRoles),hash('synthetic-hash'),execution.approvalReason,date,date,date,sale.id);
 const payload={id:'legacy-audit',userId:'legacy-actor',companyId:scope.companyId,unitId:scope.unitId,sessionId:'legacy-session',action:'CREATE',entity:'sales',recordId:sale.id,before:null,after:sale,executedBy:'legacy-actor',authorizedBy:'legacy-actor',reason:'Exceção sintética',date,prevHash:''};store.db.prepare('INSERT INTO audit_events(id,user_id,company_id,unit_id,session_id,action,entity,record_id,before_json,after_json,executed_by,authorized_by,reason,date,prev_hash,entry_hash) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(payload.id,payload.userId,payload.companyId,payload.unitId,payload.sessionId,payload.action,payload.entity,payload.recordId,null,JSON.stringify(sale),payload.executedBy,payload.authorizedBy,payload.reason,date,'',hash(JSON.stringify(payload)));
 assert.equal(store.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='commercial_sales'").get(),undefined);assert.equal(maintainAuth({store,identity}).consumed,1);assert.equal(verifyAuditChain(store),true);assert.equal(JSON.parse(store.db.prepare('SELECT payload FROM unit_states').get().payload).sales[0].execution.approvalId,'legacy-grant');
});
