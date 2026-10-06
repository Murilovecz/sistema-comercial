'use strict';
// Every database and identity below is synthetic and isolated in memory.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {randomUUID,createHash}=require('node:crypto');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {fixture,profile,Client,PASSWORD}=require('./http-fixture');
const {writeState,canonical}=require('./state-repository'),{loadState}=require('./scoped-state');
const {createCompany,createUnit}=require('./entities'),{grantCompanyAccess,grantUnitAccess}=require('./access');
const {createRole,assignRole,seedPermissions,PERMISSIONS}=require('./rbac');
const APPROVAL='/api/commercial/sales/inactive-approval',SALES='/api/commercial/sales',AUTHORIZE='sales.authorize_inactive';
const SELLER=['catalog.view','sales.view','sales.create'];
function base(){return{products:[{id:'inactive',name:'Produto desativado',stock:10,priceCents:1000,version:1,active:false},{id:'active',name:'Produto ativo',stock:10,priceCents:500,version:1,active:true}],customers:[{id:'customer',name:'Cliente sintético',version:1,active:true}],sales:[]};}
function draft(extra={}){return{requestId:randomUUID(),customerId:'customer',items:[{productId:'inactive',quantity:1,priceCents:1000}],paymentMethod:'pix',paymentStatus:'received',expectedCashSessionId:null,...extra};}
function get(f,scope=f.scope){return loadState(f.store,scope);}
function mutate(f,change,scope=f.scope){const current=get(f,scope),next=structuredClone(current.state);change(next);f.store.transaction(()=>writeState(f.store,scope,next,current.revision));}
function rejected(result,statuses=[400,401,403,409,422]){assert.ok(statuses.includes(result.status),result.text);assert.equal(typeof result.data.error,'string');assert.doesNotMatch(result.text,/SQLITE|FOREIGN KEY|argon2id|token_hash|password_hash|\bat .*\.js:\d+/i);}
async function scenario(t,options={}){const f=await fixture(t,options.runtime||{}),current=get(f);f.store.transaction(()=>writeState(f.store,f.scope,options.state||base(),current.revision));f.seller=await profile(f,options.sellerPermissions||SELLER,'inactive-seller');f.approver=await profile(f,options.approverPermissions||[AUTHORIZE],'inactive-approver');return f;}
async function grant(f,saleDraft=draft(),extra={},client=f.seller.client){const response=await client.call(APPROVAL,{saleDraft,approverLogin:f.approver.login,approverPassword:PASSWORD,reason:'  Item desativado conferido na loja  ',...extra});assert.equal(response.status,201,response.text);assert.match(response.data.approvalToken,/^[A-Za-z0-9_-]{43}$/);assert.equal(typeof response.data.approvalId,'string');assert.ok(Number.isFinite(Date.parse(response.data.expiresAt)));return response.data;}
function approval(f,id){return f.store.db.prepare('SELECT * FROM inactive_sale_approvals WHERE id=?').get(id);}
function saleInput(saleDraft,issued){return{...structuredClone(saleDraft),approvalToken:issued.approvalToken};}

test('HTTP exceção: vendedor sem financeiro vende com liberação, cadastro permanece inativo e ativo não recebe exceção',async t=>{
 const f=await scenario(t),saleDraft=draft({items:[{productId:'inactive',quantity:2,priceCents:1000},{productId:'active',quantity:1,priceCents:500}]}),before=get(f),issued=await grant(f,saleDraft);
 assert.equal(canonical(get(f)),canonical(before));const row=approval(f,issued.approvalId);assert.equal(row.token_hash,createHash('sha256').update(issued.approvalToken).digest('hex'));assert.equal(row.consumed_at,null);
 const result=await f.seller.client.call(SALES,saleInput(saleDraft,issued));assert.equal(result.status,201,result.text);const saved=get(f).state,sale=saved.sales[0];assert.equal(result.data.sale.id,sale.id);assert.equal(saved.products[0].active,false);assert.equal(saved.products[0].stock,8);assert.equal(saved.products[1].stock,9);
 assert.equal(sale.execution.executedBy,f.seller.user.id);assert.equal(sale.execution.authorizedBy,f.approver.user.id);assert.equal(sale.execution.approvalId,issued.approvalId);assert.equal(sale.execution.approvalReason,'Item desativado conferido na loja');assert.deepEqual(sale.execution.inactiveProductIds,['inactive']);assert.deepEqual(sale.execution.approverRoles,[f.approver.role.name]);assert.deepEqual(result.data.sale.execution.approverRoles,[f.approver.role.name]);assert.deepEqual(JSON.parse(approval(f,issued.approvalId).authorizer_roles_json),[f.approver.role.name]);
 assert.equal(sale.items.find(i=>i.productId==='inactive').inactiveAtSale,true);assert.equal(sale.items.find(i=>i.productId==='active').inactiveAtSale,undefined);assert.equal(result.data.sale.items.find(i=>i.productId==='inactive').inactiveAtSale,true);assert.equal(result.data.sale.items.find(i=>i.productId==='active').inactiveAtSale,undefined);
 const inactiveMove=saved.stockMovements.find(m=>m.productId==='inactive'),activeMove=saved.stockMovements.find(m=>m.productId==='active');assert.equal(inactiveMove.execution.authorizedBy,f.approver.user.id);assert.equal(activeMove.execution.authorizedBy,null);assert.equal(inactiveMove.inactiveAtSale,true);assert.equal(activeMove.inactiveAtSale,undefined);
 assert.ok(approval(f,issued.approvalId).consumed_at);assert.equal(approval(f,issued.approvalId).sale_id,sale.id);assert.equal(result.data.sale.receipts,undefined);assert.equal(result.data.sale.paymentStatus,undefined);
 const audit=f.store.db.prepare("SELECT * FROM audit_events WHERE entity='sales' AND record_id=?").get(sale.id);assert.equal(audit.executed_by,f.seller.user.id);assert.equal(audit.authorized_by,f.approver.user.id);
 const stored=JSON.stringify({state:f.store.db.prepare('SELECT payload FROM unit_states').all(),audit:f.store.db.prepare('SELECT * FROM audit_events').all(),approvals:f.store.db.prepare('SELECT * FROM inactive_sale_approvals').all()});for(const secret of [PASSWORD,issued.approvalToken])assert.equal(stored.includes(secret),false);
 rejected(await f.seller.client.call('/api/state'),[403]);assert.equal(f.store.db.prepare('PRAGMA foreign_key_check').all().length,0);
});

test('HTTP venda ativa dispensa liberação; venda inativa e prova/identidade fornecida pelo cliente não concedem autoridade',async t=>{
 const f=await scenario(t),before=get(f),saleDraft=draft();
 for(const extra of [{},{approvalToken:'A'.repeat(43)},{approvalProof:{authorizedBy:f.ownerId,inactiveProductIds:['inactive']}},{proof:{authorizedBy:f.ownerId}},{authorizedBy:f.ownerId},{execution:{authorizedBy:f.ownerId}}]){rejected(await f.seller.client.call(SALES,{...saleDraft,...extra}),[403,409,422]);assert.equal(canonical(get(f)),canonical(before));}
 const result=await f.seller.client.call(SALES,draft({items:[{productId:'active',quantity:1,priceCents:500}]}));assert.equal(result.status,201,result.text);assert.equal(get(f).state.sales[0].execution.authorizedBy,null);
});

test('HTTP senha inválida, login inexistente/injeção, conta inativa e ausência de direito têm falha genérica sem emitir grant',async t=>{
 const f=await scenario(t),withoutRight=await profile(f,SELLER,'inactive-no-right'),saleDraft=draft(),input={saleDraft,reason:'Conferido',approverLogin:f.approver.login,approverPassword:PASSWORD};
 const results=[];for(const change of [{approverPassword:'Senha incorreta sintética 2026!'},{approverLogin:'unknown-approver'},{approverLogin:"nonexistent'OR'1'='1"},{approverLogin:withoutRight.login}])results.push(await f.seller.client.call(APPROVAL,{...input,...change}));
 f.store.db.prepare("UPDATE users SET status='inactive' WHERE id=?").run(f.approver.user.id);results.push(await f.seller.client.call(APPROVAL,input));
 for(const result of results){rejected(result,[401,403]);assert.equal(result.data.code,results[0].data.code);assert.equal(result.data.error,results[0].data.error);assert.equal(result.text.includes(PASSWORD),false);}assert.equal(f.store.db.prepare('SELECT count(*) n FROM inactive_sale_approvals').get().n,0);assert.equal(get(f).state.sales.length,0);
});

test('HTTP grant exige motivo válido, requestId e senha; rejeita identidade/escopo do cliente',async t=>{
 const f=await scenario(t),input={saleDraft:draft(),reason:'Conferido',approverLogin:f.approver.login,approverPassword:PASSWORD};
 for(const change of [{reason:''},{reason:'   '},{reason:'x'.repeat(501)},{saleDraft:{...input.saleDraft,requestId:undefined}},{saleDraft:{...input.saleDraft,requestId:''}},{approverPassword:undefined},{authorizedBy:f.ownerId},{companyId:f.scope.companyId},{saleDraft:{...input.saleDraft,authorizedBy:f.ownerId}}])rejected(await f.seller.client.call(APPROVAL,{...input,...change}),[401,403,422]);
 assert.equal(f.store.db.prepare('SELECT count(*) n FROM inactive_sale_approvals').get().n,0);
});

test('HTTP executor precisa das três permissões e CSRF; autorizador não precisa assumir a sessão do vendedor',async t=>{
 const f=await scenario(t),saleDraft=draft(),input={saleDraft,approverLogin:f.approver.login,approverPassword:PASSWORD,reason:'Conferido'};
 for(const removed of SELLER){const restricted=await profile(f,SELLER.filter(p=>p!==removed),'without-'+removed.replace('.','-'));rejected(await restricted.client.call(APPROVAL,input),[403]);rejected(await restricted.client.call(SALES,saleDraft),[403]);}
 rejected(await f.seller.client.call(APPROVAL,input,{'X-CSRF-Token':'invalid'}),[403]);rejected(await f.seller.client.call(APPROVAL,input,{Origin:'https://foreign.invalid'}),[403]);
 const meBefore=await f.seller.client.call('/api/auth/me');await grant(f,saleDraft);const meAfter=await f.seller.client.call('/api/auth/me');assert.equal(meAfter.data.user.id,meBefore.data.user.id);assert.equal(meAfter.data.user.id,f.seller.user.id);
});

test('HTTP próprio executor pode liberar somente com direito explícito e nova confirmação de senha',async t=>{
 const f=await scenario(t,{sellerPermissions:[...SELLER,AUTHORIZE]}),saleDraft=draft(),issued=await grant(f,saleDraft,{approverLogin:f.seller.login});const result=await f.seller.client.call(SALES,saleInput(saleDraft,issued));assert.equal(result.status,201,result.text);const sale=get(f).state.sales[0];assert.equal(sale.execution.executedBy,f.seller.user.id);assert.equal(sale.execution.authorizedBy,f.seller.user.id);
});

test('HTTP grant não atravessa executor nem outra sessão do mesmo usuário',async t=>{
 const f=await scenario(t),saleDraft=draft(),issued=await grant(f,saleDraft),other=await profile(f,SELLER,'other-executor'),session=new Client(f.owner.origin);await session.login(f.seller.login);
 for(const client of [other.client,session])rejected(await client.call(SALES,saleInput(saleDraft,issued)),[403,409]);assert.equal(approval(f,issued.approvalId).consumed_at,null);
 assert.equal((await f.seller.client.call(SALES,saleInput(saleDraft,issued))).status,201);
});

test('HTTP grant e autorizador não atravessam empresa/unidade mesmo com IDs comerciais iguais',async t=>{
 const f=await scenario(t),saleDraft=draft(),issued=await grant(f,saleDraft),foreignCompany=createCompany(f.store,{name:'Outra empresa sintética'}),foreignUnit=createUnit(f.store,foreignCompany.id,{name:'Outra unidade'}),sibling=createUnit(f.store,f.scope.companyId,{name:'Unidade irmã'});
 for(const scope of [{companyId:foreignCompany.id,unitId:foreignUnit.id},{companyId:f.scope.companyId,unitId:sibling.id}]){
  f.store.transaction(()=>{writeState(f.store,scope,base(),0);grantCompanyAccess(f.store,f.seller.user.id,scope.companyId);grantUnitAccess(f.store,f.seller.user.id,scope.companyId,scope.unitId);const r=createRole(f.store,scope.companyId,{name:'Vendedor '+scope.unitId,permissions:SELLER});assignRole(f.store,f.seller.user.id,scope.companyId,scope.unitId,r.id);});
  const selected=await f.seller.client.call('/api/auth/context',scope);assert.equal(selected.status,200,selected.text);rejected(await f.seller.client.call(SALES,saleInput(saleDraft,issued)),[403,409]);
  rejected(await f.seller.client.call(APPROVAL,{saleDraft:draft(),approverLogin:f.approver.login,approverPassword:PASSWORD,reason:'Conferido'}),[401,403]);assert.equal(get(f,scope).state.sales.length,0);
 }
 const selected=await f.seller.client.call('/api/auth/context',f.scope);assert.equal(selected.status,200,selected.text);assert.equal((await f.seller.client.call(SALES,saleInput(saleDraft,issued))).status,201);
});

test('HTTP grant expira em até 120 segundos sem consumir estoque ou autorização',async t=>{
 let clock=Date.now();const f=await scenario(t,{runtime:{identity:{now:()=>clock}}}),saleDraft=draft(),issued=await grant(f,saleDraft);assert.ok(Date.parse(issued.expiresAt)<=clock+120000);assert.ok(Date.parse(issued.expiresAt)>clock);clock=Date.parse(issued.expiresAt);rejected(await f.seller.client.call(SALES,saleInput(saleDraft,issued)),[403,409]);assert.equal(approval(f,issued.approvalId).consumed_at,null);assert.equal(get(f).state.products[0].stock,10);
});

test('HTTP fingerprint vincula quantidade cliente preço embalagens pagamentos caixa e requestId; recusa não consome grant',async t=>{
 const f=await scenario(t),saleDraft=draft(),issued=await grant(f,saleDraft),changes=[d=>d.items[0].quantity=2,d=>d.customerId='',d=>d.items[0].priceCents=1,d=>d.items[0].packages=[{packageId:'fake',factor:1,count:1,version:1}],d=>d.checkoutPayments=[{paymentMethod:'cash',value:'10.00'}],d=>d.expectedCashSessionId='different-cash',d=>d.requestId=randomUUID(),d=>d.paymentStatus='pending',d=>d.discount='1.00',d=>d.sourcePositionId='changed'];
 for(const change of changes){const input=saleInput(saleDraft,issued);change(input);rejected(await f.seller.client.call(SALES,input),[409]);assert.equal(approval(f,issued.approvalId).consumed_at,null);assert.equal(get(f).state.sales.length,0);}
 assert.equal((await f.seller.client.call(SALES,saleInput(saleDraft,issued))).status,201);
});

test('HTTP versão/preço/situação atual do produto invalidam a liberação anterior',async t=>{
 for(const change of [p=>p.version++,p=>p.priceCents++,p=>p.active=true]){
  const f=await scenario(t),saleDraft=draft(),issued=await grant(f,saleDraft);mutate(f,state=>change(state.products[0]));const before=get(f);rejected(await f.seller.client.call(SALES,saleInput(saleDraft,issued)),[403,409]);assert.equal(canonical(get(f)),canonical(before));assert.equal(approval(f,issued.approvalId).consumed_at,null);
 }
});

test('HTTP revogação do autorizador após grant impede consumo por direito vínculo ou conta',async t=>{
 for(const revoke of [f=>f.store.db.prepare('DELETE FROM role_permissions WHERE company_id=? AND role_id=? AND permission_code=?').run(f.scope.companyId,f.approver.role.id,AUTHORIZE),f=>f.store.db.prepare("UPDATE unit_memberships SET status='inactive' WHERE user_id=? AND company_id=? AND unit_id=?").run(f.approver.user.id,f.scope.companyId,f.scope.unitId),f=>f.store.db.prepare("UPDATE users SET status='inactive' WHERE id=?").run(f.approver.user.id)]){
  const f=await scenario(t),saleDraft=draft(),issued=await grant(f,saleDraft);revoke(f);rejected(await f.seller.client.call(SALES,saleInput(saleDraft,issued)),[401,403,409]);assert.equal(approval(f,issued.approvalId).consumed_at,null);assert.equal(get(f).state.sales.length,0);
 }
});

test('HTTP revogação do executor após grant impede venda e logout invalida a sessão vinculada',async t=>{
 const f=await scenario(t),saleDraft=draft(),issued=await grant(f,saleDraft);f.store.db.prepare('DELETE FROM role_permissions WHERE company_id=? AND role_id=? AND permission_code=?').run(f.scope.companyId,f.seller.role.id,'sales.create');rejected(await f.seller.client.call(SALES,saleInput(saleDraft,issued)),[403]);assert.equal(approval(f,issued.approvalId).consumed_at,null);
 assert.equal((await f.seller.client.call('/api/auth/logout',{})).status,200);rejected(await f.seller.client.call(SALES,saleInput(saleDraft,issued)),[401]);
});

test('HTTP revalida direito do autorizador depois do await Argon2 antes de emitir grant',async t=>{
 const f=await scenario(t),identity=f.server.runtime.identity,original=identity.kdf.bind(identity);let intercepted=false;
 identity.kdf=async fn=>{const result=await original(fn);assert.equal(f.store.inTransaction,false);f.store.db.prepare('DELETE FROM role_permissions WHERE company_id=? AND role_id=? AND permission_code=?').run(f.scope.companyId,f.approver.role.id,AUTHORIZE);intercepted=true;return result;};
 const result=await f.seller.client.call(APPROVAL,{saleDraft:draft(),approverLogin:f.approver.login,approverPassword:PASSWORD,reason:'Conferido'});assert.equal(intercepted,true);rejected(result,[401,403]);assert.equal(f.store.db.prepare('SELECT count(*) n FROM inactive_sale_approvals').get().n,0);
});

test('HTTP revalida contexto/sessão do executor se muda durante a confirmação de senha',async t=>{
 const f=await scenario(t),u=createUnit(f.store,f.scope.companyId,{name:'Outra unidade de teste'}),other={companyId:f.scope.companyId,unitId:u.id};f.store.transaction(()=>{grantUnitAccess(f.store,f.seller.user.id,other.companyId,other.unitId);writeState(f.store,other,base(),0);assignRole(f.store,f.seller.user.id,other.companyId,other.unitId,f.seller.role.id);});
 const identity=f.server.runtime.identity,original=identity.kdf.bind(identity);let intercepted=false;identity.kdf=async fn=>{const result=await original(fn);assert.equal(f.store.inTransaction,false);f.store.db.prepare('UPDATE sessions SET unit_id=? WHERE user_id=? AND revoked_at IS NULL').run(other.unitId,f.seller.user.id);intercepted=true;return result;};
 const result=await f.seller.client.call(APPROVAL,{saleDraft:draft(),approverLogin:f.approver.login,approverPassword:PASSWORD,reason:'Conferido'});assert.equal(intercepted,true);rejected(result,[401,403,409]);assert.equal(f.store.db.prepare('SELECT count(*) n FROM inactive_sale_approvals').get().n,0);assert.equal(get(f,other).state.sales.length,0);
});

test('HTTP erro de auditoria desfaz venda estoque recebimento revisão e consumo; retry usa a mesma autorização',async t=>{
 const f=await scenario(t),saleDraft=draft(),issued=await grant(f,saleDraft),before=get(f),events=f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n;
 f.store.db.exec("CREATE TRIGGER deny_exception_audit BEFORE INSERT ON audit_events WHEN NEW.entity='sales' BEGIN SELECT RAISE(ABORT,'synthetic approval audit failure'); END;");
 const failed=await f.seller.client.call(SALES,saleInput(saleDraft,issued));rejected(failed,[500]);assert.equal(canonical(get(f)),canonical(before));assert.equal(approval(f,issued.approvalId).consumed_at,null);assert.equal(approval(f,issued.approvalId).sale_id,null);assert.equal(f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n,events);
 f.store.db.exec('DROP TRIGGER deny_exception_audit');assert.equal((await f.seller.client.call(SALES,saleInput(saleDraft,issued))).status,201);assert.equal(get(f).state.sales.length,1);assert.equal(get(f).state.products[0].stock,9);assert.ok(approval(f,issued.approvalId).consumed_at);
});

test('HTTP duas confirmações concorrentes e replay não duplicam venda nem movimento; conteúdo diferente retorna409',async t=>{
 const f=await scenario(t),saleDraft=draft(),issued=await grant(f,saleDraft),input=saleInput(saleDraft,issued),responses=await Promise.all([f.seller.client.call(SALES,input),f.seller.client.call(SALES,input)]);
 for(const result of responses)assert.equal(result.status,201,result.text);assert.equal(responses[0].data.sale.id,responses[1].data.sale.id);const saved=get(f);assert.equal(saved.state.sales.length,1);assert.equal(saved.state.stockMovements.length,1);assert.equal(saved.state.products[0].stock,9);
 const replay=await f.seller.client.call(SALES,input);assert.equal(replay.status,201,replay.text);assert.equal(canonical(get(f)),canonical(saved));rejected(await f.seller.client.call(SALES,{...input,items:[{productId:'inactive',quantity:2,priceCents:1000}]}),[409]);rejected(await f.seller.client.call(SALES,{...input,expectedCashSessionId:'other-cash'}),[409]);assert.equal(canonical(get(f)),canonical(saved));
});

test('HTTP autorizações distintas concorrendo pelo último estoque confirmam somente uma venda',async t=>{
 const f=await scenario(t),first=draft({items:[{productId:'inactive',quantity:6,priceCents:1000}]}),second=draft({items:[{productId:'inactive',quantity:6,priceCents:1000}]}),a=await grant(f,first),b=await grant(f,second),results=await Promise.all([f.seller.client.call(SALES,saleInput(first,a)),f.seller.client.call(SALES,saleInput(second,b))]);
 assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);const saved=get(f).state;assert.equal(saved.products[0].stock,4);assert.equal(saved.sales.length,1);assert.equal(saved.stockMovements.length,1);assert.equal([approval(f,a.approvalId),approval(f,b.approvalId)].filter(r=>r.consumed_at).length,1);
});

test('HTTP liberação não dispensa estoque preço cliente ou embalagens; nenhuma regra inválida confirma venda',async t=>{
 const f=await scenario(t),invalid=[draft({items:[{productId:'inactive',quantity:11,priceCents:1000}]}),draft({items:[{productId:'inactive',quantity:1,priceCents:1}]}),draft({customerId:'missing'}),draft({items:[{productId:'inactive',quantity:1,priceCents:1000,packages:[{packageId:'missing',factor:1,count:1,version:1}]}]})];
 for(const saleDraft of invalid){const response=await f.seller.client.call(APPROVAL,{saleDraft,approverLogin:f.approver.login,approverPassword:PASSWORD,reason:'Conferido'});if(response.status===201){const result=await f.seller.client.call(SALES,{...saleDraft,approvalToken:response.data.approvalToken});rejected(result,[400,409,422]);assert.equal(approval(f,response.data.approvalId).consumed_at,null);}else rejected(response,[400,409,422]);assert.equal(get(f).state.sales.length,0);assert.equal(get(f).state.products[0].stock,10);}
});

test('HTTP Caixa trocado depois de aprovar mantém grant intacto e não lança recebimento em outra sessão',async t=>{
 const f=await scenario(t),opened=await f.owner.call('/api/cash/open',{requestId:randomUUID(),openingValue:'0',responsible:'Sintético'});assert.equal(opened.status,201,opened.text);const cash=get(f).state.cashSessions[0],saleDraft=draft({expectedCashSessionId:cash.id}),issued=await grant(f,saleDraft);
 const closed=await f.owner.call('/api/cash/close',{requestId:randomUUID(),sessionId:cash.id,countedValue:'0',expectedCents:0,responsible:'Sintético'});assert.equal(closed.status,201,closed.text);const before=get(f);rejected(await f.seller.client.call(SALES,saleInput(saleDraft,issued)),[400,409,422]);assert.equal(canonical(get(f)),canonical(before));assert.equal(approval(f,issued.approvalId).consumed_at,null);
});

test('migration007 concede novo direito só aos antigos18 completos e nunca repõe revogação',t=>{
 const migrations=path.join(__dirname,'migrations'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'inactive-migration-isolated-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));for(const file of fs.readdirSync(migrations).filter(n=>/^00[1-6]_/.test(n)))fs.copyFileSync(path.join(migrations,file),path.join(dir,file));
 const {SqlStore}=require('./sql-store'),s=new SqlStore(':memory:',{environment:'test',migrationsDir:dir});t.after(()=>s.close());const c=createCompany(s,{name:'Migração sintética'}),oldCodes=['catalog.view','catalog.manage','inventory.view','inventory.adjust','sales.view','sales.create','sales.cancel','purchases.manage','financial.view','financial.manage','cash.manage','operations.view','operations.manage','users.manage','roles.manage','companies.manage','units.manage','audit.view'];assert.equal(oldCodes.length,18);for(const code of oldCodes)s.db.prepare('INSERT INTO permissions VALUES(?,?)').run(code,PERMISSIONS[code]);
 const complete=createRole(s,c.id,{name:'Antigo completo',permissions:oldCodes}),partial=createRole(s,c.id,{name:'Antigo parcial',permissions:oldCodes.filter(p=>p!=='roles.manage')});s.migrate(migrations);
 const has=role=>Boolean(s.db.prepare('SELECT 1 FROM role_permissions WHERE company_id=? AND role_id=? AND permission_code=?').get(c.id,role.id,AUTHORIZE));assert.equal(has(complete),true);assert.equal(has(partial),false);s.db.prepare('DELETE FROM role_permissions WHERE company_id=? AND role_id=? AND permission_code=?').run(c.id,complete.id,AUTHORIZE);s.migrate(migrations);seedPermissions(s);assert.equal(has(complete),false);
});
