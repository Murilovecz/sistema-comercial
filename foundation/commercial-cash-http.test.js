'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {fixture,profile}=require('./http-fixture'),{loadState}=require('./scoped-state'),{canonical}=require('./state-repository');
const {SNAPSHOT_READ}=require('./rbac');
async function open(f){const r=await f.owner.call('/api/cash/open',{requestId:randomUUID(),openingValue:'0'});assert.equal(r.status,201,r.text);return loadState(f.store,f.scope).state.cashSessions[0].id;}
test('HTTP Caixa: campo moderno e legado equivalentes não duplicam entrada nem fechamento',async t=>{
 const f=await fixture(t),id=await open(f),input={requestId:randomUUID(),cashSessionId:id,value:'10.00',note:'Troco sintético',expectedCents:0};
 let r=await f.owner.call('/api/cash/supply',input);assert.equal(r.status,201,r.text);const before=canonical(loadState(f.store,f.scope));
 const legacy={...input,sessionId:id};delete legacy.cashSessionId;r=await f.owner.call('/api/cash/supply',legacy);assert.equal(r.status,201,r.text);assert.equal(canonical(loadState(f.store,f.scope)),before);
 const close={requestId:randomUUID(),cashSessionId:id,countedValue:'10.00',expectedCents:1000};r=await f.owner.call('/api/cash/close',close);assert.equal(r.status,201,r.text);
 const closed=canonical(loadState(f.store,f.scope));r=await f.owner.call('/api/cash/close',close);assert.equal(r.status,201,r.text);assert.equal(canonical(loadState(f.store,f.scope)),closed);
});
test('HTTP Caixa: identificadores ambíguos e sessão de login não operam caixa nem mudam identidade',async t=>{
 const f=await fixture(t),id=await open(f),before=canonical(loadState(f.store,f.scope)),input={requestId:randomUUID(),value:'1.00',note:'Sintético'};
 let r=await f.owner.call('/api/cash/supply',{...input,cashSessionId:id,sessionId:id});assert.equal(r.status,422);assert.equal(r.data.code,'AMBIGUOUS_CASH_SESSION');
 const loginSession=f.store.db.prepare('SELECT id FROM sessions LIMIT 1').get().id;
 r=await f.owner.call('/api/cash/supply',{...input,sessionId:loginSession});assert.ok([400,409,422].includes(r.status),r.text);assert.equal(canonical(loadState(f.store,f.scope)),before);
 r=await f.owner.call('/api/products',{name:'Não criar',price:'1',stock:0,sessionId:loginSession});assert.equal(r.status,422);assert.equal(r.data.code,'CLIENT_AUTHORITY');assert.equal(canonical(loadState(f.store,f.scope)),before);
});
test('HTTP Caixa: a compatibilidade não concede cash.manage e identificador desconhecido não grava',async t=>{
 const f=await fixture(t),id=await open(f),withoutRight=await profile(f,[...SNAPSHOT_READ]),before=canonical(loadState(f.store,f.scope));
 const input={requestId:randomUUID(),sessionId:id,value:'1.00',note:'Sintético'};let r=await withoutRight.client.call('/api/cash/supply',input);assert.equal(r.status,403,r.text);
 r=await f.owner.call('/api/cash/supply',{...input,sessionId:'caixa-de-outra-unidade'});assert.ok([400,409,422].includes(r.status),r.text);assert.equal(canonical(loadState(f.store,f.scope)),before);
});
