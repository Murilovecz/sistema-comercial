'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {randomUUID,randomBytes}=require('node:crypto');
const {createServer}=require('../server');
const {createCompany,createUnit}=require('./entities');
const {createUser}=require('./identity');
const {grantCompanyAccess,grantUnitAccess}=require('./access');
const {PERMISSIONS,createRole,assignRole}=require('./rbac');
const {writeState,canonical}=require('./state-repository');
const {loadState}=require('./scoped-state');
const {verifyAuditChain}=require('./audit');
const {cashAction}=require('../cash');
const password='IDP-001 senha exclusivamente sintetica!';

class Client {
 constructor(origin){this.origin=origin;this.cookies=new Map();this.csrf=null;}
 async request(url,body){
  const headers={cookie:[...this.cookies].map(([k,v])=>k+'='+v).join('; ')};
  if(body!==undefined)Object.assign(headers,{origin:this.origin,'content-type':'application/json','x-csrf-token':this.csrf||''});
  const response=await fetch(this.origin+url,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});
  for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(';')[0],i=pair.indexOf('=');this.cookies.set(pair.slice(0,i),pair.slice(i+1));}
  const data=await response.json();if(data.csrfToken)this.csrf=data.csrfToken;return{status:response.status,data};
 }
}
async function fixture(t,{disk=false}={}){
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'idp-001-'));
 const options={environment:'test',dataDir,filename:disk?path.join(dataDir,'isolated.sqlite'):':memory:',importLegacy:false,pairingToken:randomBytes(32).toString('base64url'),backup:{enabled:false}};
 const servers=[];
 t.after(async()=>{
  for(const server of servers)if(server.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  assert.equal(path.dirname(dataDir),os.tmpdir());assert.ok(path.basename(dataDir).startsWith('idp-001-'));
  fs.rmSync(dataDir,{recursive:true,force:true});
 });
 async function start(){const server=createServer(options);servers.push(server);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return{server,client:new Client('http://127.0.0.1:'+server.address().port)};}
 const {server,client}=await start();await client.request('/api/auth/status');
 const setup=await client.request('/api/auth/setup',{name:'Owner sintético',login:'idp-owner',password,pairingToken:options.pairingToken});assert.equal(setup.status,200);
 const f={server,client,store:server.runtime.store,owner:setup.data.user,scope:{companyId:setup.data.companyId,unitId:setup.data.unitId},start};
 seed(f,f.scope,{schemaVersion:2,products:[{id:'p',name:'Produto sintético',stock:5,priceCents:1000,version:1}],customers:[{id:'c',name:'Cliente sintético',version:1}],sales:[]});
 return f;
}
function seed(f,scope,state){f.store.transaction(()=>writeState(f.store,scope,state,loadState(f.store,scope).revision));}
function input(extra={}){return{requestId:randomUUID(),items:[{productId:'p',quantity:1,priceCents:1000}],paymentMethod:'cash',paymentStatus:'received',...extra};}
function effects(f,scope=f.scope){
 const sql={};
 for(const table of ['commercial_sales','commercial_sale_items','commercial_sale_receipts','commercial_stock_balances','commercial_stock_movements','entity_index','audit_events'])sql[table]=f.store.db.prepare('SELECT * FROM '+table+' WHERE company_id=? AND unit_id=? ORDER BY rowid').all(scope.companyId,scope.unitId);
 return{...loadState(f.store,scope),sql};
}
function rejected(response,code){assert.ok(response.status>=400,JSON.stringify(response));if(code)assert.equal(response.data.code,code);assert.ok(!response.data.sales);}

test('IDP-001 A: identidade ausente, nula ou inválida rejeita antes de qualquer efeito',async t=>{
 const f=await fixture(t),before=effects(f);
 for(const key of [undefined,null,'','   ',1,'x'.repeat(81)]){
  rejected(await f.client.request('/api/sales',input({requestId:key})));
  assert.deepEqual(effects(f),before);
 }
});
test('IDP-001 B/C: criação e replay produzem uma venda, baixa, recebimento e auditoria únicos',async t=>{
 const f=await fixture(t);seed(f,f.scope,cashAction(loadState(f.store,f.scope).state,'open',{openingValue:'0',responsible:'Fixture'}));
 const body=input({expectedCashSessionId:loadState(f.store,f.scope).state.cashSessions[0].id});
 const first=await f.client.request('/api/sales',body);assert.equal(first.status,201);
 const before=effects(f),sale=first.data.sales[0];assert.equal(before.state.products[0].stock,4);assert.equal(before.state.sales.length,1);assert.equal(before.state.stockMovements.length,1);
 assert.equal(sale.receipts.length,1);assert.equal(sale.receipts[0].amountCents,1000);assert.equal(before.state.cashSessions[0].movements.length,1);
 assert.equal(before.sql.audit_events.filter(e=>e.entity==='sales'&&e.action==='CREATE').length,1);
 const again=await f.client.request('/api/sales',body);assert.equal(again.status,201);assert.deepEqual(again.data.sales[0],sale);assert.deepEqual(effects(f),before);assert.equal(verifyAuditChain(f.store),true);
 // New intent with identical commercial content has a new key and is a second legitimate sale.
 const other=await f.client.request('/api/sales',{...body,requestId:randomUUID()});assert.equal(other.status,201);assert.equal(other.data.sales.length,2);assert.equal(other.data.products[0].stock,3);
});
test('IDP-001 C: ordem das propriedades não muda a operação; sessão/nome não são identidade comercial',async t=>{
 const f=await fixture(t),body=input({pos:{station:'balcao',shift:'dia'}}),first=await f.client.request('/api/sales',body);assert.equal(first.status,201);
 const reordered={...Object.fromEntries(Object.entries(body).reverse()),items:[{priceCents:1000,quantity:1,productId:'p'}],pos:{shift:'dia',station:'balcao'}};
 f.store.db.prepare('UPDATE users SET name=? WHERE id=?').run('Nome atualizado',f.owner.id);
 const relogin=new Client(f.client.origin);await relogin.request('/api/auth/status');assert.equal((await relogin.request('/api/auth/login',{login:'idp-owner',password})).status,200);
 const before=effects(f); // Login has its own valid audit event; the retry must add none.
 const again=await relogin.request('/api/sales',reordered);assert.equal(again.status,201);assert.deepEqual(again.data.sales[0],first.data.sales[0]);assert.deepEqual(effects(f),before);
});
test('IDP-001 D: chave reutilizada com conteúdo relevante diferente é rejeitada sem efeitos',async t=>{
 const f=await fixture(t),body=input({customerId:'c',expectedCashSessionId:null});assert.equal((await f.client.request('/api/sales',body)).status,201);const before=effects(f);
 for(const change of [{expectedCashSessionId:'other-cash'},{items:[{productId:'p',quantity:2,priceCents:1000}]},{customerId:''},{paymentMethod:'pix'},{paymentStatus:'pending'},{discount:'1',discountReason:'Mudou'},{sourcePositionId:'other-position'},{expectedPositions:{p:'other-token'}}]){
  rejected(await f.client.request('/api/sales',{...body,...change}),'REPLAY_CHANGED');assert.deepEqual(effects(f),before);
 }
});
test('IDP-001 E: outro executor não reconhece a chave do primeiro nem grava efeitos',async t=>{
 const f=await fixture(t),body=input();assert.equal((await f.client.request('/api/sales',body)).status,201);
 const user=await createUser(f.store,{name:'Outro sintético',login:'idp-other',password});
 f.store.transaction(()=>{grantCompanyAccess(f.store,user.id,f.scope.companyId);grantUnitAccess(f.store,user.id,f.scope.companyId,f.scope.unitId);const role=createRole(f.store,f.scope.companyId,{name:'Fixture todos',permissions:Object.keys(PERMISSIONS)});assignRole(f.store,user.id,f.scope.companyId,f.scope.unitId,role.id);});
 const client=new Client(f.client.origin);await client.request('/api/auth/status');assert.equal((await client.request('/api/auth/login',{login:'idp-other',password})).status,200);const before=effects(f);
 rejected(await client.request('/api/sales',body),'REPLAY_CHANGED');assert.deepEqual(effects(f),before);
});
test('IDP-001 E: empresa/unidade vêm da sessão e chaves iguais são independentes por unidade',async t=>{
 const f=await fixture(t),body=input();const a=await f.client.request('/api/sales',body);assert.equal(a.status,201);const original=effects(f),scopes=[];
 f.store.transaction(()=>{
  const c=createCompany(f.store,{name:'Empresa sintética B'});grantCompanyAccess(f.store,f.owner.id,c.id);
  for(const companyId of [f.scope.companyId,c.id]){const u=createUnit(f.store,companyId,{name:'Outra unidade'}),role=createRole(f.store,companyId,{name:'IDP todos '+u.id,permissions:Object.keys(PERMISSIONS)});grantUnitAccess(f.store,f.owner.id,companyId,u.id);assignRole(f.store,f.owner.id,companyId,u.id,role.id);scopes.push({companyId,unitId:u.id});}
 });
 for(const scope of scopes){
  seed(f,scope,{schemaVersion:2,products:[{id:'p',name:'Produto outro contexto',stock:2,priceCents:1000}],customers:[],sales:[]});
  assert.equal((await f.client.request('/api/auth/context',scope)).status,200);
  const first=await f.client.request('/api/sales',body);assert.equal(first.status,201);assert.notEqual(first.data.sales[0].id,a.data.sales[0].id);const before=effects(f,scope);
  assert.equal((await f.client.request('/api/sales',body)).status,201);assert.deepEqual(effects(f,scope),before);assert.deepEqual(effects(f),original);
  rejected(await f.client.request('/api/sales',{...body,...f.scope}),'CLIENT_AUTHORITY');assert.deepEqual(effects(f,scope),before);
 }
});
test('IDP-001 F: falha após escrita SQL/auditoria reverte tudo e permite retry da mesma chave',async t=>{
 const f=await fixture(t);seed(f,f.scope,cashAction(loadState(f.store,f.scope).state,'open',{openingValue:'0',responsible:'Fixture'}));
 const body=input(),before=effects(f);
 f.store.db.exec("CREATE TRIGGER idp_fail BEFORE INSERT ON audit_events WHEN NEW.entity='sales' BEGIN SELECT RAISE(ABORT,'idp injected after SQL'); END;");
 const failed=await f.client.request('/api/sales',body);assert.equal(failed.status,500);assert.deepEqual(effects(f),before);
 f.store.db.exec('DROP TRIGGER idp_fail');const succeeded=await f.client.request('/api/sales',body);assert.equal(succeeded.status,201);const after=effects(f);
 assert.equal(after.state.sales.length,1);assert.equal(after.state.cashSessions[0].movements.length,1);assert.equal((await f.client.request('/api/sales',body)).status,201);assert.deepEqual(effects(f),after);
});
test('IDP-001 F: falha de domínio depois de trabalhar itens não reserva a chave',async t=>{
 const f=await fixture(t),body=input({items:[{productId:'p',quantity:1},{productId:'missing',quantity:1}]}),before=effects(f);
 rejected(await f.client.request('/api/sales',body));assert.deepEqual(effects(f),before);
 const valid={...body,items:[{productId:'p',quantity:1}]};assert.equal((await f.client.request('/api/sales',valid)).status,201);assert.equal(loadState(f.store,f.scope).state.sales.length,1);
});
test('IDP-001 G: requisições simultâneas da mesma chave criam apenas um efeito',async t=>{
 const f=await fixture(t),body=input();const responses=await Promise.all(Array.from({length:4},()=>f.client.request('/api/sales',body)));
 assert.deepEqual(responses.map(r=>r.status),[201,201,201,201]);assert.equal(new Set(responses.map(r=>r.data.sales[0].id)).size,1);
 const after=effects(f);assert.equal(after.state.sales.length,1);assert.equal(after.state.products[0].stock,4);assert.equal(after.state.stockMovements.length,1);assert.equal(after.sql.audit_events.filter(e=>e.entity==='sales'&&e.action==='CREATE').length,1);
});
test('IDP-001 G: duas conexões SQLite e reinício reconhecem o resultado durável',async t=>{
 const f=await fixture(t,{disk:true}),second=await f.start();second.client.cookies=new Map(f.client.cookies);assert.equal((await second.client.request('/api/auth/me')).status,200);
 const body=input(),results=await Promise.all([f.client.request('/api/sales',body),second.client.request('/api/sales',body)]);assert.deepEqual(results.map(r=>r.status),[201,201]);assert.equal(results[0].data.sales[0].id,results[1].data.sales[0].id);
 const after=effects(f);assert.equal(after.state.sales.length,1);assert.equal(after.state.products[0].stock,4);assert.equal(canonical(loadState(second.server.runtime.store,f.scope)),canonical(loadState(f.store,f.scope)));
 await new Promise(resolve=>{second.server.close(resolve);second.server.closeAllConnections();});
 const restarted=await f.start();restarted.client.cookies=new Map(f.client.cookies);assert.equal((await restarted.client.request('/api/auth/me')).status,200);assert.equal((await restarted.client.request('/api/sales',body)).status,201);assert.deepEqual(effects(f),after);
});
test('IDP-001: recebimento misto e crédito interno não são consumidos novamente no retry',async t=>{
 const f=await fixture(t);let state=require('../server').sale(loadState(f.store,f.scope).state,input({customerId:'c'}));const original=state.sales[0];
 state=require('../workflows').returnAction(state,'create',{saleId:original.id,expectedVersion:0,items:[{productId:'p',quantity:1,restockQuantity:1}],reason:'Troca sintética',requestId:randomUUID()});
 state=require('../store-credits').storeCreditAction(state,'issue',{saleId:original.id,returnId:state.sales[0].returns[0].id,expectedVersion:1,expectedRefundCents:1000,value:'2',reason:'Crédito sintético',requestId:randomUUID()});
 state=cashAction(state,'open',{openingValue:'0',responsible:'Fixture'});seed(f,f.scope,state);
 const body=input({customerId:'c',storeCreditValue:'2',expectedStoreCreditCents:200,checkoutPayments:[{paymentMethod:'cash',value:'3',tendered:'5'},{paymentMethod:'pix',value:'5'}],allowPending:false});
 const first=await f.client.request('/api/sales',body);assert.equal(first.status,201);const before=effects(f),s=before.state.sales.at(-1);assert.equal(s.receipts.length,2);assert.equal(s.storeCreditCents,200);assert.equal(s.receipts.reduce((n,r)=>n+r.amountCents,0),800);assert.equal(before.state.storeCredits[0].remainingCents,0);assert.equal(before.state.storeCredits[0].events.length,2);assert.equal(before.state.cashSessions[0].movements.length,2);
 assert.equal((await f.client.request('/api/sales',body)).status,201);assert.deepEqual(effects(f),before);
});
test('IDP-001: histórico sem chave ou sem prova completa permanece intacto',async t=>{
 const f=await fixture(t),state=loadState(f.store,f.scope).state;
 const old={id:'old',date:'2020-01-01T00:00:00Z',items:[{productId:'p',name:'Nome histórico',quantity:1,priceCents:500}],totalCents:500,paymentMethod:'cash',paymentStatus:'received',receipts:[]};
 state.sales=[old,{...structuredClone(old),id:'old-key',requestId:'historical-key'},{...structuredClone(old),id:'old-null',requestId:null}];
 const legacyInput=input({requestId:'historical-fingerprint'}),historical=require('../server').sale(state,legacyInput);seed(f,f.scope,historical);
 const before=effects(f);
 for(const body of [input({requestId:'historical-key'}),legacyInput]){rejected(await f.client.request('/api/sales',body),'REPLAY_CHANGED');assert.deepEqual(effects(f),before);}
 assert.equal((await f.client.request('/api/sales',input())).status,201);const saved=loadState(f.store,f.scope).state.sales;assert.deepEqual(saved.slice(0,4),historical.sales);assert.equal(Object.hasOwn(saved[0],'requestId'),false);assert.equal(Object.hasOwn(saved[1],'requestFingerprint'),false);assert.equal(saved[2].requestId,null);assert.match(saved[3].requestFingerprint,/^[a-f0-9]{64}$/);
});
