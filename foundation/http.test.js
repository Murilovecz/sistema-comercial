'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {randomUUID,randomBytes}=require('node:crypto');
const http=require('node:http');
const {createServer}=require('../server');
const {createCompany,createUnit}=require('./entities');
const {createUser}=require('./identity');
const {grantCompanyAccess,grantUnitAccess}=require('./access');
const {PERMISSIONS,SNAPSHOT_READ,createRole,assignRole}=require('./rbac');
const {writeState,canonical}=require('./state-repository');
const {loadState}=require('./scoped-state');
const {verifyAuditChain}=require('./audit');
// Synthetic password exclusively for isolated fixtures; never an operational credential.
const password='Somente teste isolado 2026!';
class Client {
 constructor(origin){this.origin=origin;this.jar=new Map();this.csrf=null;}
 fork(){const c=new Client(this.origin);c.jar=new Map(this.jar);c.csrf=this.csrf;return c;}
 async request(url,body,options={}){
  const method=options.method||(body===undefined?'GET':'POST');
  const headers={cookie:[...this.jar].map(([k,v])=>k+'='+v).join('; ')};
  if(method!=='GET'){headers.origin=this.origin;headers['content-type']='application/json';if(this.csrf)headers['x-csrf-token']=this.csrf;}
  for(const[k,v]of Object.entries(options.headers||{})){if(v===null)delete headers[k.toLowerCase()];else headers[k.toLowerCase()]=v;}
  const response=await fetch(this.origin+url,{method,headers,body:method==='GET'?undefined:options.raw??JSON.stringify(body??{}),redirect:'manual'});
  for(const value of response.headers.getSetCookie()){const [pair]=value.split(';'),i=pair.indexOf('='),key=pair.slice(0,i),val=pair.slice(i+1);if(val)this.jar.set(key,val);else this.jar.delete(key);}
  const text=await response.text();let data;try{data=JSON.parse(text);}catch{data=text;}
  if(data?.csrfToken)this.csrf=data.csrfToken;
  return {status:response.status,data,text,headers:response.headers};
 }
 async login(login='owner',pass=password){await this.request('/api/auth/status');return this.request('/api/auth/login',{login,password:pass});}
 async context(scope){return this.request('/api/auth/context',{companyId:scope.companyId,unitId:scope.unitId});}
}
async function fixture(t,options={}){
 const pairingToken=randomBytes(32).toString('base64url');
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'foundation-http-'));
 const server=createServer({environment:'test',filename:':memory:',dataDir,importLegacy:false,pairingToken,...options});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const client=new Client('http://127.0.0.1:'+server.address().port),store=server.runtime.store;
 const status=await client.request('/api/auth/status');assert.equal(status.status,200);assert.equal(status.data.needsSetup,true);
 const setup=await client.request('/api/auth/setup',{name:'Proprietário de teste',login:'owner',password,pairingToken});assert.equal(setup.status,200,setup.text);
 return {server,store,client,owner:setup.data.user,scope:{companyId:setup.data.companyId,unitId:setup.data.unitId},pairingToken,dataDir};
}
function scopedState(f,scope=f.scope){return loadState(f.store,scope).state;}
function seed(f,scope,state){f.store.transaction(()=>writeState(f.store,scope,state,loadState(f.store,scope).revision));}
function product(id=randomUUID(),name='Produto A',stock=3){return {id,name,stock,priceCents:1990,version:1};}
function empty(products=[]){return {schemaVersion:2,products,customers:[],sales:[]};}
function secondScope(f,sharedOwner=true){
 let scope;
 f.store.transaction(()=>{const c=createCompany(f.store,{name:'Empresa B'}),u=createUnit(f.store,c.id,{name:'Loja B'});scope={companyId:c.id,unitId:u.id};if(sharedOwner){grantCompanyAccess(f.store,f.owner.id,c.id);grantUnitAccess(f.store,f.owner.id,c.id,u.id);const role=createRole(f.store,c.id,{name:'Administrador B',permissions:Object.keys(PERMISSIONS)});assignRole(f.store,f.owner.id,c.id,u.id,role.id);}});
 return scope;
}
async function member(f,permissions,login='limited'){
 const user=await createUser(f.store,{name:'Funcionário '+login,login,password});let role;
 f.store.transaction(()=>{grantCompanyAccess(f.store,user.id,f.scope.companyId);grantUnitAccess(f.store,user.id,f.scope.companyId,f.scope.unitId);role=createRole(f.store,f.scope.companyId,{name:'Papel '+login,permissions});assignRole(f.store,user.id,f.scope.companyId,f.scope.unitId,role.id);});
 const client=new Client(f.client.origin),response=await client.login(login);assert.equal(response.status,200,response.text);return {user,client,role};
}
function saleInput(id,extra={}){return {requestId:randomUUID(),paymentMethod:'pix',paymentStatus:'received',items:[{productId:id,quantity:1,priceCents:1990}],...extra};}
function rejected(response,status){if(status!==undefined)assert.equal(response.status,status,response.text);else assert.ok(response.status>=400,response.text);assert.ok(!response.data.products&&!response.data.users&&!response.data.password_hash,response.text);}

test('HTTP: instalação única, cookies protegidos, identidade real e snapshots sem secrets',async t=>{
 const f=await fixture(t),me=await f.client.request('/api/auth/me');assert.equal(me.status,200);assert.equal(me.data.user.id,f.owner.id);assert.ok(me.data.permissions.includes('users.manage'));
 assert.ok(!/password_hash|token_hash|pairingToken/.test(me.text));
 assert.equal((await f.client.request('/api/auth/status')).data.needsSetup,false);
 const secondSetup=new Client(f.client.origin);await secondSetup.request('/api/auth/status');rejected(await secondSetup.request('/api/auth/setup',{name:'Outro',login:'other',password,pairingToken:f.pairingToken}),409);
 assert.equal(f.store.db.prepare('SELECT count(*) n FROM users').get().n,1);
 const state=await f.client.request('/api/state');assert.equal(state.status,200);assert.deepEqual(state.data.products,[]);assert.ok(!/password_hash|token_hash|pairingToken/.test(state.text));
 const anonymous=new Client(f.client.origin);rejected(await anonymous.request('/api/state'),401);
 assert.equal(state.headers.get('cache-control'),'no-store');assert.equal(state.headers.get('x-content-type-options'),'nosniff');
 const login=new Client(f.client.origin),res=await login.login();assert.equal(res.status,200);const cookies=res.headers.getSetCookie().join(';');assert.match(cookies,/HttpOnly/);assert.match(cookies,/SameSite=Strict/);
});
test('HTTP: senha errada, inexistente e usuário desativado têm erro genérico igual',async t=>{
 const f=await fixture(t),c=new Client(f.client.origin);
 const wrong=await c.login('owner','Senha incorreta sintética'),missing=await c.login('not-existing',password);rejected(wrong,401);rejected(missing,401);assert.deepEqual(wrong.data,missing.data);
 f.store.db.prepare("UPDATE users SET status='inactive' WHERE id=?").run(f.owner.id);
 const inactive=await c.login();rejected(inactive,401);assert.deepEqual(inactive.data,wrong.data);rejected(await f.client.request('/api/state'),401);
});
test('HTTP: logout invalida cookie anterior, sessões inválidas, expiradas e inativas são negadas',async t=>{
 let now=Date.parse('2026-10-02T03:00:00Z');const f=await fixture(t,{identity:{now:()=>now,idleMs:5000,sessionLifetimeMs:20000}}),old=f.client.fork();
 assert.equal((await f.client.request('/api/auth/logout',{})).status,200);rejected(await old.request('/api/state'),401);
 const invalid=new Client(f.client.origin);invalid.jar.set('foundation_session',randomBytes(32).toString('base64url'));rejected(await invalid.request('/api/auth/me'),401);
 assert.equal((await f.client.login()).status,200);now+=5001;rejected(await f.client.request('/api/state'),401);
 assert.equal((await f.client.login()).status,200);now+=20001;rejected(await f.client.request('/api/state'),401);
});
test('HTTP: CSRF, Origin, Content-Type e Host bloqueiam escrita antes de modificar estado',async t=>{
 const f=await fixture(t),before=canonical(scopedState(f));
 const input={name:'Bloqueado',stock:1,price:'10.00'};
 for(const [headers,status]of [[{'x-csrf-token':null},403],[{'x-csrf-token':'forged'},403],[{origin:'http://untrusted.example'},403],[{origin:null},403],[{'content-type':'text/plain'},415]])rejected(await f.client.request('/api/products',input,{headers}),status);
 // Native HTTP preserves a deliberately forged Host; fetch normalizes it.
 const badHost=await new Promise((resolve,reject)=>{const req=http.get(f.client.origin+'/api/state',{headers:{Host:'untrusted.example'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);});assert.equal(badHost,403);
 assert.equal(canonical(scopedState(f)),before);
});
test('HTTP: redução de papel e revogação de vínculos atingem sessão já aberta',async t=>{
 const f=await fixture(t),p=product();seed(f,f.scope,empty([p]));const m=await member(f,[...SNAPSHOT_READ,'sales.create']);assert.equal((await m.client.request('/api/state')).status,200);
 f.store.db.prepare("DELETE FROM role_permissions WHERE company_id=? AND role_id=? AND permission_code='sales.create'").run(f.scope.companyId,m.role.id);
 rejected(await m.client.request('/api/sales',saleInput(p.id)),403);assert.equal(scopedState(f).sales.length,0);
 f.store.db.prepare("UPDATE unit_memberships SET status='inactive' WHERE user_id=? AND company_id=? AND unit_id=?").run(m.user.id,f.scope.companyId,f.scope.unitId);
 rejected(await m.client.request('/api/state'),401);
 f.store.db.prepare("UPDATE unit_memberships SET status='active' WHERE user_id=? AND company_id=? AND unit_id=?").run(m.user.id,f.scope.companyId,f.scope.unitId);
 f.store.db.prepare("UPDATE company_memberships SET status='inactive' WHERE user_id=? AND company_id=?").run(m.user.id,f.scope.companyId);
 rejected(await m.client.request('/api/state'),401);
});
test('HTTP: financeiro oculto nega snapshot, mutação com resposta inteira e exportação',async t=>{
 const f=await fixture(t),p=product();seed(f,f.scope,empty([p]));const m=await member(f,[...SNAPSHOT_READ.filter(c=>c!=='financial.view'),'sales.create','catalog.manage']);
 rejected(await m.client.request('/api/state'),403);rejected(await m.client.request('/api/sales',saleInput(p.id)),403);rejected(await m.client.request('/api/products',{name:'Negado',stock:1,price:10}),403);
 rejected(await m.client.request('/api/exports',{kind:'products',ids:[p.id]}),403);rejected(await m.client.request('/api/export?kind=products&id='+p.id),403);
 assert.equal(scopedState(f).sales.length,0);assert.equal(scopedState(f).products.length,1);
});
test('HTTP: leitura sem ação não cria venda, ajusta estoque, cancela ou administra acessos',async t=>{
 const f=await fixture(t),p=product();seed(f,f.scope,empty([p]));const m=await member(f,SNAPSHOT_READ);
 assert.equal((await m.client.request('/api/state')).status,200);
 for(const [url,input]of [['/api/sales',saleInput(p.id)],['/api/stock',{id:p.id,quantity:1}],['/api/sales/cancel',{id:'missing'}],['/api/foundation/admin',undefined],['/api/foundation/roles',{name:'Escalada',permissions:['users.manage']}],['/api/foundation/users',{name:'Escalada',login:'escalation',password,unitId:f.scope.unitId,roleIds:[]}]])rejected(await m.client.request(url,input),403);
 assert.equal(scopedState(f).products[0].stock,3);assert.equal(f.store.db.prepare('SELECT count(*) n FROM users').get().n,2);
});
test('HTTP: empresa não autorizada, headers manipulados e IDs iguais permanecem isolados',async t=>{
 const f=await fixture(t),b=secondScope(f,false),id=randomUUID();seed(f,f.scope,empty([product(id,'A privada',3)]));seed(f,b,empty([product(id,'B privada',8)]));
 const state=await f.client.request('/api/state');assert.equal(state.data.products[0].name,'A privada');assert.ok(!state.text.includes('B privada'));
 rejected(await f.client.context(b),403);rejected(await f.client.request('/api/state',undefined,{headers:{'x-company-id':b.companyId,'x-unit-id':b.unitId}}),409);
 const edited=await f.client.request('/api/products/edit',{id,name:'A alterada',price:'19.90',expectedVersion:1});assert.equal(edited.status,201);assert.equal(scopedState(f,b).products[0].name,'B privada');
 assert.equal((await f.client.request('/api/products/active',{id,expectedVersion:2,active:false})).status,201);assert.notEqual(scopedState(f,b).products[0].active,false);
 rejected(await f.client.request('/api/products/'+id,{}, {method:'DELETE'}),404);assert.equal(scopedState(f,b).products.length,1);
});
test('HTTP: IDs exclusivamente de outra empresa não editam/desativam/excluem nem entram em venda',async t=>{
 const f=await fixture(t),b=secondScope(f,false),foreign=product();seed(f,b,empty([foreign]));const before=canonical(scopedState(f,b));
 rejected(await f.client.request('/api/products/edit',{id:foreign.id,name:'Invadido',price:'19.90',expectedVersion:1}));
 rejected(await f.client.request('/api/products/active',{id:foreign.id,active:false,expectedVersion:1}));
 rejected(await f.client.request('/api/products/'+foreign.id,{}, {method:'DELETE'}),404);
 rejected(await f.client.request('/api/sales',saleInput(foreign.id)));
 rejected(await f.client.request('/api/stock',{id:foreign.id,quantity:1,requestId:randomUUID()}));
 rejected(await f.client.request('/api/exports',{kind:'products',ids:[foreign.id]}),404);
 rejected(await f.client.request('/api/export?kind=products&id='+foreign.id),404);
 assert.equal(canonical(scopedState(f,b)),before);assert.equal(scopedState(f).sales.length,0);
});
test('HTTP: referências a cliente/fornecedor de outra empresa falham sem criar operação',async t=>{
 const f=await fixture(t),b=secondScope(f,false),p=product(),customer=randomUUID(),supplier=randomUUID();seed(f,f.scope,empty([p]));seed(f,b,{...empty(),customers:[{id:customer,name:'Cliente B'}],suppliers:[{id:supplier,name:'Fornecedor B'}]});
 rejected(await f.client.request('/api/sales',saleInput(p.id,{customerId:customer})));
 rejected(await f.client.request('/api/purchases/create',{requestId:randomUUID(),supplierId:supplier,items:[{productId:p.id,quantity:1,unitCost:'1.00'}]}));
 assert.equal(scopedState(f).sales.length,0);assert.equal((scopedState(f).purchases||[]).length,0);assert.equal(scopedState(f).products[0].stock,3);
});
test('HTTP: mudança autorizada de contexto troca CSRF e rejeita janela anterior',async t=>{
 const f=await fixture(t),b=secondScope(f),oldToken=f.client.csrf;seed(f,f.scope,empty([product(undefined,'A')]));seed(f,b,empty([product(undefined,'B')]));
 const moved=await f.client.context(b);assert.equal(moved.status,200);assert.notEqual(moved.data.csrfToken,oldToken);assert.equal((await f.client.request('/api/state')).data.products[0].name,'B');
 rejected(await f.client.request('/api/products',{name:'Antiga janela',stock:1,price:10},{headers:{'x-csrf-token':oldToken}}),403);
 rejected(await f.client.request('/api/state',undefined,{headers:{'x-company-id':f.scope.companyId,'x-unit-id':f.scope.unitId}}),409);
 assert.equal(scopedState(f,b).products.length,1);
});
test('HTTP: exportação pertence à sessão e unidade; conhecimento do token não concede acesso',async t=>{
 const f=await fixture(t),p=product(),b=secondScope(f);seed(f,f.scope,empty([p]));seed(f,b,empty([product(undefined,'B privada')]));
 const prepared=await f.client.request('/api/exports',{kind:'products',ids:[p.id]});assert.equal(prepared.status,201);const url=prepared.data.url;
 assert.equal((await f.client.request(url)).status,200);
 const otherSession=new Client(f.client.origin);assert.equal((await otherSession.login()).status,200);assert.equal((await otherSession.context(f.scope)).status,200);rejected(await otherSession.request(url),404);
 assert.equal((await f.client.context(b)).status,200);rejected(await f.client.request(url),404);assert.equal((await f.client.context(f.scope)).status,200);assert.equal((await f.client.request(url)).status,200);
 const anonymous=new Client(f.client.origin);rejected(await anonymous.request(url),401);
});
test('HTTP: corpo não pode forjar empresa, executor, autorizador ou permissões',async t=>{
 const f=await fixture(t);
 for(const key of ['companyId','unitId','tenantId','empresa_id','unidade_id','userId','user_id','sessionId','permissions','executedBy','authorizedBy','authorized_by','approvedBy','admin'])rejected(await f.client.request('/api/products',{name:'Tentativa',stock:1,price:10,[key]:'forged'}),422);
 assert.equal(scopedState(f).products.length,0);
 const created=await f.client.request('/api/products',{name:'Rastreável',stock:1,price:10,responsible:'Dono falso'});assert.equal(created.status,201);const movement=created.data.stockMovements.at(-1);assert.equal(movement.execution.executedBy,f.owner.id);assert.equal(movement.execution.authorizedBy,null);
 const p=created.data.products[0];const edited=await f.client.request('/api/products/edit',{id:p.id,name:'Editado',price:'10.00',expectedVersion:1,responsible:'Dono falso'});assert.equal(edited.status,201);assert.equal(edited.data.auditLog.at(-1).responsible,f.owner.name);
 assert.equal(verifyAuditChain(f.store),true);
});
test('HTTP: falha SQL na auditoria reverte estoque, venda, índice e revisão sem sucesso prematuro',async t=>{
 const f=await fixture(t),p=product();seed(f,f.scope,empty([p]));const before=loadState(f.store,f.scope),index=f.store.db.prepare('SELECT count(*) n FROM entity_index').get().n,audit=f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n;
 f.store.db.exec("CREATE TRIGGER qa_fail_audit BEFORE INSERT ON audit_events BEGIN SELECT RAISE(ABORT,'synthetic SQL detail must stay private'); END;");
 const response=await f.client.request('/api/sales',saleInput(p.id));rejected(response,500);assert.equal(response.data.code,'INTERNAL_ERROR');assert.ok(!response.text.includes('synthetic SQL'));
 const after=loadState(f.store,f.scope);assert.equal(after.revision,before.revision);assert.equal(canonical(after.state),canonical(before.state));assert.equal(f.store.db.prepare('SELECT count(*) n FROM entity_index').get().n,index);assert.equal(f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n,audit);
 f.store.db.exec('DROP TRIGGER qa_fail_audit');assert.equal((await f.client.request('/api/sales',saleInput(p.id))).status,201);
});
test('HTTP: duas vendas concorrentes da última unidade deixam apenas uma venda integral',async t=>{
 const f=await fixture(t),p=product(undefined,'Última unidade',1);seed(f,f.scope,empty([p]));
 const results=await Promise.all([f.client.request('/api/sales',saleInput(p.id)),f.client.request('/api/sales',saleInput(p.id))]);assert.deepEqual(results.map(r=>r.status).sort(),[201,400]);
 const state=scopedState(f);assert.equal(state.products[0].stock,0);assert.equal(state.sales.length,1);assert.equal(state.sales[0].totalCents,1990);assert.equal(state.sales[0].receipts[0].amountCents,1990);assert.equal(state.stockMovements.length,1);assert.equal(state.sales[0].execution.executedBy,f.owner.id);
});
test('HTTP: reenvio idêntico é idempotente em estoque, vendas, financeiro e auditoria',async t=>{
 const f=await fixture(t),p=product();seed(f,f.scope,empty([p]));const input=saleInput(p.id);
 const first=await f.client.request('/api/sales',input);assert.equal(first.status,201);const before=loadState(f.store,f.scope),events=f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n;
 const second=await f.client.request('/api/sales',input);assert.equal(second.status,201);assert.equal(canonical(second.data),canonical(first.data));assert.equal(loadState(f.store,f.scope).revision,before.revision);assert.equal(f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n,events);
 rejected(await f.client.request('/api/sales',{...input,items:[{productId:p.id,quantity:2}]}));assert.equal(scopedState(f).sales.length,1);
});
test('HTTP: papel inválido e unidade estrangeira não deixam usuário órfão',async t=>{
 const f=await fixture(t),b=secondScope(f,false),count=f.store.db.prepare('SELECT count(*) n FROM users').get().n;
 rejected(await f.client.request('/api/foundation/users',{name:'Sem papel',login:'orphan-one',password,unitId:f.scope.unitId,roleIds:[randomUUID()]}),404);
 const ownRole=f.store.db.prepare('SELECT role_id FROM unit_roles WHERE user_id=?').get(f.owner.id).role_id;
 rejected(await f.client.request('/api/foundation/users',{name:'Unidade externa',login:'orphan-two',password,unitId:b.unitId,roleIds:[ownRole]}),404);
 assert.equal(f.store.db.prepare('SELECT count(*) n FROM users').get().n,count);assert.equal(f.store.db.prepare("SELECT count(*) n FROM users WHERE login LIKE 'orphan-%'").get().n,0);
});
test('HTTP: gestão cria papéis/usuários reais e permissão concedida vale somente no contexto',async t=>{
 const f=await fixture(t),created=await f.client.request('/api/foundation/roles',{name:'Leitor de teste',permissions:SNAPSHOT_READ});assert.equal(created.status,201);const id=created.data.result.id;
 const u=await f.client.request('/api/foundation/users',{name:'Leitor',login:'reader',password,unitId:f.scope.unitId,roleIds:[id]});assert.equal(u.status,201);assert.ok(!u.text.includes('password'));
 const client=new Client(f.client.origin);assert.equal((await client.login('reader')).status,200);assert.equal((await client.request('/api/state')).status,200);rejected(await client.request('/api/foundation/admin'),403);
 assert.equal((await f.client.request('/api/foundation/access',{id:u.data.result.id,unitId:f.scope.unitId,status:'inactive',roleIds:[]})).status,201);rejected(await client.request('/api/state'),401);
});
test('HTTP: rotas desconhecidas, queries e caminhos manipulados não burlam autorização',async t=>{
 const f=await fixture(t),m=await member(f,[]);
 for(const url of ['/api/state?companyId=forged','/api/export?kind=products&id=forged','/api/sales?ignored=1'])rejected(await m.client.request(url,url.includes('sales')?saleInput('forged'):undefined),403);
 rejected(await f.client.request('/api/sales?ignored=1',saleInput('forged')),404);
 rejected(await f.client.request('/api/not-a-route'),404);rejected(await f.client.request('/api/%73tate'),404);
 const malformed=await f.client.request('/api/products',{}, {raw:'{'});rejected(malformed,400);assert.ok(!/SyntaxError|Unexpected|server\.js|node:/.test(malformed.text));
 rejected(await f.client.request('/api/products',[],{}),422);rejected(await f.client.request('/api/products',{}, {raw:'x'.repeat(1048577)}),413);
 assert.equal(scopedState(f).products.length,0);
});
test('HTTP: interface e assets principais continuam servidos; banco/configuração são privados',async t=>{
 const f=await fixture(t);
 for(const url of ['/','/style.css','/app.js','/startup.js','/navigation.js','/foundation-ui.js','/foundation-storage.js']){const response=await f.client.request(url);assert.equal(response.status,200,url);assert.ok(response.text.length>0,url);}
 for(const url of ['/data/database.json','/data/foundation.sqlite','/data/PRIMEIRO-ACESSO.txt','/foundation/identity.js','/.env'])rejected(await f.client.request(url),404);
 const health=await f.client.request('/api/health');assert.equal(health.status,200);assert.equal(health.data.ready,true);
});
test('HTTP: editar próprio papel/acesso não elimina administração; rejeição faz rollback',async t=>{
 const f=await fixture(t),role=f.store.db.prepare('SELECT role_id id FROM unit_roles WHERE user_id=? AND company_id=? AND unit_id=?').get(f.owner.id,f.scope.companyId,f.scope.unitId);
 const before=f.store.db.prepare('SELECT permission_code FROM role_permissions WHERE company_id=? AND role_id=? ORDER BY permission_code').all(f.scope.companyId,role.id);
 for(const removed of ['users.manage','roles.manage']){
  rejected(await f.client.request('/api/foundation/roles',{id:role.id,name:'Não deve persistir',permissions:Object.keys(PERMISSIONS).filter(p=>p!==removed)}),409);
  assert.deepEqual(f.store.db.prepare('SELECT permission_code FROM role_permissions WHERE company_id=? AND role_id=? ORDER BY permission_code').all(f.scope.companyId,role.id),before);
  assert.equal((await f.client.request('/api/foundation/admin')).status,200);
 }
 const onlyUsers=await f.client.request('/api/foundation/roles',{name:'Administração incompleta',permissions:['users.manage']});assert.equal(onlyUsers.status,201);
 rejected(await f.client.request('/api/foundation/access',{id:f.owner.id,unitId:f.scope.unitId,status:'active',roleIds:[onlyUsers.data.result.id]}),409);
 const rows=f.store.db.prepare('SELECT role_id FROM unit_roles WHERE user_id=? AND company_id=? AND unit_id=?').all(f.owner.id,f.scope.companyId,f.scope.unitId);assert.deepEqual(rows.map(r=>r.role_id),[role.id]);assert.equal((await f.client.request('/api/foundation/admin')).status,200);
});
test('HTTP: papéis de outra empresa não são concedidos mesmo com roleId conhecido',async t=>{
 const f=await fixture(t),b=secondScope(f),foreign=f.store.db.prepare('SELECT id FROM roles WHERE company_id=?').get(b.companyId),count=f.store.db.prepare('SELECT count(*) n FROM users').get().n;
 rejected(await f.client.request('/api/foundation/users',{name:'Não criar',login:'cross-role',password,unitId:f.scope.unitId,roleIds:[foreign.id]}),404);assert.equal(f.store.db.prepare('SELECT count(*) n FROM users').get().n,count);
 rejected(await f.client.request('/api/foundation/roles',{id:foreign.id,permissions:SNAPSHOT_READ}),404);
 assert.equal(f.store.db.prepare('SELECT count(*) n FROM role_permissions WHERE company_id=? AND role_id=?').get(b.companyId,foreign.id).n,Object.keys(PERMISSIONS).length);
});
test('HTTP: unidades da mesma empresa isolam cadastros, estoque e exportações',async t=>{
 const f=await fixture(t),created=await f.client.request('/api/foundation/units',{name:'Unidade de teste 2'});assert.equal(created.status,201);const b={companyId:f.scope.companyId,unitId:created.data.result.id},id=randomUUID();
 seed(f,f.scope,empty([product(id,'Unidade A',2)]));seed(f,b,empty([product(id,'Unidade B',7)]));
 const prepared=await f.client.request('/api/exports',{kind:'products',ids:[id]});assert.equal(prepared.status,201);
 assert.equal((await f.client.context(b)).status,200);assert.equal((await f.client.request('/api/state')).data.products[0].name,'Unidade B');rejected(await f.client.request(prepared.data.url),404);
 assert.equal((await f.client.request('/api/stock',{id,quantity:1,requestId:randomUUID()})).status,201);assert.equal(scopedState(f).products[0].stock,2);assert.equal(scopedState(f,b).products[0].stock,8);
});
test('HTTP: unidade e empresa desativadas invalidam sessão existente imediatamente',async t=>{
 const f=await fixture(t);
 f.store.db.prepare("UPDATE units SET status='inactive' WHERE company_id=? AND id=?").run(f.scope.companyId,f.scope.unitId);rejected(await f.client.request('/api/state'),401);
 f.store.db.prepare("UPDATE units SET status='active' WHERE company_id=? AND id=?").run(f.scope.companyId,f.scope.unitId);assert.equal((await f.client.request('/api/state')).status,200);
 f.store.db.prepare("UPDATE companies SET status='inactive' WHERE id=?").run(f.scope.companyId);rejected(await f.client.request('/api/state'),401);
});
test('HTTP: compra recebida mantém custo/estoque/histórico e falha auditada reverte tudo',async t=>{
 const f=await fixture(t),p=product(undefined,'Compra de teste',0),supplier=randomUUID();seed(f,f.scope,{...empty([p]),suppliers:[{id:supplier,name:'Fornecedor fixture'}]});
 const ordered=await f.client.request('/api/purchases/create',{requestId:randomUUID(),supplierId:supplier,items:[{productId:p.id,quantity:2,unitCost:'7.50'}]});assert.equal(ordered.status,201,ordered.text);let purchase=ordered.data.purchases[0];
 const confirmed=await f.client.request('/api/purchases/confirm',{id:purchase.id,expectedVersion:purchase.version,requestId:randomUUID()});assert.equal(confirmed.status,201,confirmed.text);purchase=confirmed.data.purchases[0];
 const input={id:purchase.id,expectedVersion:purchase.version,requestId:randomUUID(),items:[{productId:p.id,quantity:1}]},before=loadState(f.store,f.scope);
 f.store.db.exec("CREATE TRIGGER qa_purchase_audit_fail BEFORE INSERT ON audit_events BEGIN SELECT RAISE(ABORT,'private rollback fixture'); END;");
 rejected(await f.client.request('/api/purchases/receive',input),500);assert.equal(canonical(scopedState(f)),canonical(before.state));assert.equal(loadState(f.store,f.scope).revision,before.revision);
 f.store.db.exec('DROP TRIGGER qa_purchase_audit_fail');const received=await f.client.request('/api/purchases/receive',input);assert.equal(received.status,201,received.text);assert.equal(received.data.products[0].stock,1);assert.equal(received.data.purchases[0].receipts[0].items[0].unitCostCents,750);assert.equal(received.data.purchases[0].receipts[0].execution.executedBy,f.owner.id);
 assert.equal(received.data.products[0].priceCents,1990);assert.equal((received.data.expenses||[]).length,0);
 const replay=await f.client.request('/api/purchases/receive',input);assert.equal(replay.status,201);assert.equal(canonical(replay.data),canonical(received.data));
});
test('HTTP: produto inativo não ganha liberação inventada e auditoria tem identidade/escopo reais',async t=>{
 const f=await fixture(t),p=product();seed(f,f.scope,empty([p]));const inactive=await f.client.request('/api/products/active',{id:p.id,active:false,expectedVersion:1});assert.equal(inactive.status,201);
 rejected(await f.client.request('/api/sales',saleInput(p.id)));rejected(await f.client.request('/api/sales',saleInput(p.id,{authorizedBy:f.owner.id})),422);assert.equal(scopedState(f).sales.length,0);
 const audit=await f.client.request('/api/foundation/audit');assert.equal(audit.status,200);const event=audit.data.events.find(e=>e.action==='DEACTIVATE'&&e.recordId===p.id);assert.ok(event);assert.equal(event.executedBy,f.owner.id);assert.equal(event.authorizedBy,null);assert.equal(event.before.active,undefined);assert.equal(event.after.active,false);assert.equal(verifyAuditChain(f.store),true);
 const b=secondScope(f);assert.equal((await f.client.context(b)).status,200);const other=await f.client.request('/api/foundation/audit');assert.equal(other.status,200);assert.ok(!other.data.events.some(e=>e.recordId===p.id));
});
test('HTTP: link CSV antigo compara escopo verificado mesmo com IDs iguais em outra unidade',async t=>{
 const f=await fixture(t),b=secondScope(f),id=randomUUID(),cashId=randomUUID();
 const cash=name=>({id:cashId,openedAt:new Date().toISOString(),openedBy:name,openingCents:0,closedAt:null,movements:[]});
 seed(f,f.scope,{...empty([product(id,'Empresa A privada')]),cashSessions:[cash('Caixa A')]});seed(f,b,{...empty([product(id,'Empresa B privada')]),cashSessions:[cash('Caixa B')]});
 const expected='&expectedCompanyId='+f.scope.companyId+'&expectedUnitId='+f.scope.unitId;
 const productUrl='/api/export?kind=products&id='+id+expected,cashUrl='/api/cash/export?id='+cashId+expected;
 assert.equal((await f.client.request(productUrl)).status,200);assert.equal((await f.client.request(cashUrl)).status,200);
 assert.equal((await f.client.context(b)).status,200);rejected(await f.client.request(productUrl),409);rejected(await f.client.request(cashUrl),409);
 const fresh='/api/export?kind=products&id='+id+'&expectedCompanyId='+b.companyId+'&expectedUnitId='+b.unitId,response=await f.client.request(fresh);assert.equal(response.status,200);assert.ok(response.text.includes('Empresa B privada'));assert.ok(!response.text.includes('Empresa A privada'));
});
