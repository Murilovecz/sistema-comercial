'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const path=require('node:path');
const {fixture,profile}=require('./http-fixture');
const {loadState}=require('./scoped-state');
const {writeState,canonical}=require('./state-repository');
const {SNAPSHOT_READ,createRole,assignRole}=require('./rbac');
const {createCompany,createUnit}=require('./entities');
const {grantCompanyAccess,grantUnitAccess}=require('./access');
const {cashAction}=require('../cash');
const {sale,change}=require('../server');
const actions=['open','supply','withdraw','refund','close'];

async function prepare(t,action){
 const f=await fixture(t,{dataDir:path.join(process.cwd(),'.qa/retail-002a-red'),backup:{enabled:false}});
 let state={schemaVersion:2,products:[{id:'p',name:'Mercadoria sintética',priceCents:10000,stock:2,version:1}],customers:[],sales:[]};
 if(action!=='open'){
  state=cashAction(state,'open',{requestId:'fixture-'+randomUUID(),openingValue:'200',responsible:'Dono sintético'});
  state=sale(state,{requestId:randomUUID(),items:[{productId:'p',quantity:1}],paymentMethod:'cash',paymentStatus:'received'});
  state=change(state,'/api/sales/cancel',{id:state.sales[0].id});
 }
 f.store.transaction(()=>writeState(f.store,f.scope,state,loadState(f.store,f.scope).revision));
 f.input={requestId:randomUUID(),...(action==='open'?{openingValue:'200'}:{cashSessionId:state.cashSessions[0].id,expectedCents:30000,...(action==='close'?{countedValue:'300'}:{value:action==='supply'?'100':'50',note:'Intenção sintética',...(action==='refund'?{saleId:state.sales[0].id}:{})})})};
 f.effects=()=>canonical({business:loadState(f.store,f.scope),audit:f.store.db.prepare('SELECT sequence,entry_hash FROM audit_events WHERE company_id=? AND unit_id=? ORDER BY sequence').all(f.scope.companyId,f.scope.unitId)});
 return f;
}
function rejected(r){assert.ok(r.status>=400&&r.status<600,'Esperada rejeição sem efeitos; recebido HTTP '+r.status);}

for(const action of actions){
 test(`RETAIL-002A ${action}: requestId ausente não produz efeitos`,async t=>{
  const f=await prepare(t,action),before=f.effects(),input={...f.input};delete input.requestId;
  rejected(await f.owner.call('/api/cash/'+action,input));assert.equal(f.effects(),before);
 });
 test(`RETAIL-002A ${action}: requestId inválido não produz efeitos`,async t=>{
  const f=await prepare(t,action),before=f.effects();
  for(const requestId of ['', '   ',1,true,[],{},'x'.repeat(81),null]){
   rejected(await f.owner.call('/api/cash/'+action,{...f.input,requestId}));assert.equal(f.effects(),before);
  }
 });
 test(`RETAIL-002A ${action}: efeito único e payload alterado recusado`,async t=>{
  const f=await prepare(t,action),r=await f.owner.call('/api/cash/'+action,f.input);assert.equal(r.status,201,r.text);
  const after=f.effects();assert.equal((await f.owner.call('/api/cash/'+action,f.input)).status,201);assert.equal(f.effects(),after);
  rejected(await f.owner.call('/api/cash/'+action,{...f.input,note:'Outro motivo'}));assert.equal(f.effects(),after);
  const s=loadState(f.store,f.scope).state,c=s.cashSessions[0];
  if(action==='open')assert.equal(s.cashSessions.length,1);
  if(action==='supply')assert.equal(require('../public/cash-core').cashSummary(c).expectedCents,40000);
  if(action==='withdraw'||action==='refund')assert.equal(require('../public/cash-core').cashSummary(c).expectedCents,25000);
  if(action==='refund')assert.equal(s.sales[0].refunds.length,1);
  if(action==='close')assert.equal(c.closing.countedCents,30000);
 });
 test(`RETAIL-002A ${action}: outro ator com mesmo nome não reconhece intenção`,async t=>{
  const f=await prepare(t,action),other=await profile(f,[...SNAPSHOT_READ,'cash.manage']);
  f.store.db.prepare('UPDATE users SET name=? WHERE id=?').run('Dono sintético',other.user.id);
  assert.equal((await f.owner.call('/api/cash/'+action,f.input)).status,201);
  const after=f.effects();rejected(await other.client.call('/api/cash/'+action,f.input));assert.equal(f.effects(),after);
 });
 test(`RETAIL-002A ${action}: falha SQL/audit/domínio reverte e mesma intenção pode tentar novamente`,async t=>{
  const f=await prepare(t,action),before=f.effects(),valueField=action==='open'?'openingValue':action==='close'?'countedValue':'value';
  rejected(await f.owner.call('/api/cash/'+action,{...f.input,[valueField]:'-1'}));assert.equal(f.effects(),before);
  for(const [name,sql]of [
   ['retail_cash_sql',"CREATE TRIGGER retail_cash_sql BEFORE UPDATE ON unit_states BEGIN SELECT RAISE(ABORT,'synthetic SQL failure'); END;"],
   ['retail_cash_audit',"CREATE TRIGGER retail_cash_audit BEFORE INSERT ON audit_events WHEN NEW.entity='cashSessions' BEGIN SELECT RAISE(ABORT,'synthetic audit failure'); END;"]
  ]){
   f.store.db.exec(sql);
   try{rejected(await f.owner.call('/api/cash/'+action,f.input));assert.equal(f.effects(),before);}finally{f.store.db.exec('DROP TRIGGER '+name);}
  }
  assert.equal((await f.owner.call('/api/cash/'+action,f.input)).status,201);
  const after=f.effects();assert.equal((await f.owner.call('/api/cash/'+action,f.input)).status,201);assert.equal(f.effects(),after);
 });
 if(action!=='open')test(`RETAIL-002A ${action}: alteração de valor de conferência não é replay`,async t=>{
  const f=await prepare(t,action);assert.equal((await f.owner.call('/api/cash/'+action,f.input)).status,201);
  const after=f.effects();rejected(await f.owner.call('/api/cash/'+action,{...f.input,expectedCents:f.input.expectedCents+1}));assert.equal(f.effects(),after);
 });
}

for(const otherOrg of [false,true])test(`RETAIL-002A open: mesma key em outra ${otherOrg?'Organization':'Unit'} não abre novo caixa`,async t=>{
 const f=await prepare(t,'open');assert.equal((await f.owner.call('/api/cash/open',f.input)).status,201);
 let scope;
 f.store.transaction(()=>{
  const companyId=otherOrg?createCompany(f.store,{name:'Outra Org sintética'}).id:f.scope.companyId;
  const unit=createUnit(f.store,companyId,{name:'Outra Unit sintética'});scope={companyId,unitId:unit.id};
  grantCompanyAccess(f.store,f.ownerId,companyId);grantUnitAccess(f.store,f.ownerId,companyId,unit.id);
  const role=createRole(f.store,companyId,{name:'Caixa sintético '+unit.id,permissions:[...SNAPSHOT_READ,'cash.manage']});assignRole(f.store,f.ownerId,companyId,unit.id,role.id);
 });
 assert.equal((await f.owner.call('/api/auth/context',scope)).status,200);
 const original=f.effects(),otherBefore=canonical(loadState(f.store,scope));
 rejected(await f.owner.call('/api/cash/open',f.input));
 assert.equal(f.effects(),original);assert.equal(canonical(loadState(f.store,scope)),otherBefore);
});

test('RETAIL-002A open: retry histórico depois de fechar não abre outra sessão',async t=>{
 const f=await prepare(t,'open');assert.equal((await f.owner.call('/api/cash/open',f.input)).status,201);
 const id=loadState(f.store,f.scope).state.cashSessions[0].id;
 assert.equal((await f.owner.call('/api/cash/close',{requestId:randomUUID(),cashSessionId:id,countedValue:'200',expectedCents:20000})).status,201);
 const after=f.effects();assert.equal((await f.owner.call('/api/cash/open',f.input)).status,201);assert.equal(f.effects(),after);
});
test('RETAIL-002A close: retry depois de abrir outro caixa preserva os dois históricos',async t=>{
 const f=await prepare(t,'close');assert.equal((await f.owner.call('/api/cash/close',f.input)).status,201);
 assert.equal((await f.owner.call('/api/cash/open',{requestId:randomUUID(),openingValue:'20'})).status,201);
 const after=f.effects();assert.equal((await f.owner.call('/api/cash/close',f.input)).status,201);assert.equal(f.effects(),after);
});

test('RETAIL-002A UI: timeout preserva key e payload de conferência preparado',async()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 const listeners=new Map(),button={disabled:false},requests=[];
 const latest={cashSessions:[{id:'cash-synthetic',openingCents:10000,closedAt:null,movements:[]}],cashCommands:[]};
 const form={dataset:{},elements:{},closest:()=>null,querySelector:()=>button,addEventListener:(type,handler)=>listeners.set(type,handler),dispatchEvent:event=>listeners.get(event.type)?.(event)};
 let identities=0;
 const sandbox={crypto:{randomUUID:()=> 'ui-synthetic-'+(++identities)},Event,document:{querySelector:()=>null},cashSummary:require('../public/cash-core').cashSummary,openCash:require('../public/cash-core').openCash,money:String,formError(){},api:async(url,input)=>{
  if(!input)return latest;
  requests.push(structuredClone(input));
  if(requests.length===1)latest.cashCommands.push({requestId:input.requestId});
  throw Error('Timeout sintético depois de confirmar; resposta perdida');
 }};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/cash-ui.js'),'utf8'),sandbox);
 sandbox.bindCashForm(form,'supply',()=>({cashSessionId:'cash-synthetic',value:'100',note:'Suprimento sintético',expectedCents:0}));
 const event={preventDefault(){}};
 await form.onsubmit(event); // Revisão explícita de saldo antes da primeira submissão.
 assert.equal(requests.length,0);
 await form.onsubmit(event); // Confirmado; simulação perde somente a resposta.
 await form.onsubmit(event); // Retry da mesma intenção.
 assert.equal(requests.length,2);assert.equal(requests[0].requestId,requests[1].requestId);
 assert.equal(requests[0].expectedCents,10000);assert.deepEqual(requests[1],requests[0]);
});
