'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {randomBytes}=require('node:crypto');
const {createServer}=require('../server'),{writeState,canonical}=require('./state-repository'),{loadState}=require('./scoped-state');
const {latestPurchaseCosts}=require('../public/purchases-core');
async function fixture(t){
 const pairingToken=randomBytes(32).toString('base64url'),server=createServer({environment:'test',filename:':memory:',importLegacy:false,pairingToken});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const origin='http://127.0.0.1:'+server.address().port,cookies=new Map();let csrf='';
 async function call(url,input){const response=await fetch(origin+url,{headers:{cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),...(input===undefined?{}:{Origin:origin,'Content-Type':'application/json','X-CSRF-Token':csrf})},...(input===undefined?{}:{method:'POST',body:JSON.stringify(input)})});for(const value of response.headers.getSetCookie()){const pair=value.split(';')[0],index=pair.indexOf('=');cookies.set(pair.slice(0,index),pair.slice(index+1));}const data=await response.json();if(data.csrfToken)csrf=data.csrfToken;return{status:response.status,data};}
 await call('/api/auth/status');const setup=await call('/api/auth/setup',{pairingToken,name:'Dono sintético',login:'purchase-owner',password:'Compra em teste isolado 2026!'});assert.equal(setup.status,200);
 const scope={companyId:setup.data.companyId,unitId:setup.data.unitId},store=server.runtime.store;
 const state={products:[{id:'product',name:'Produto sintético',stock:5,priceCents:1000,active:true,version:1}],customers:[],sales:[],suppliers:[{id:'supplier',name:'Fornecedor sintético',active:true,version:1}],purchases:[]};
 store.transaction(()=>writeState(store,scope,state,0));
 return{store,scope,call,get:()=>loadState(store,scope)};
}
test('HTTP compra: falha de auditoria desfaz recebimento, estoque, custo e SQL; retry e parcial não duplicam',async t=>{
 const f=await fixture(t);
 let result=await f.call('/api/purchases/create',{requestId:'create-http-purchase',supplierId:'supplier',items:[{productId:'product',quantity:4,unitCost:'6.25'}]});assert.equal(result.status,201,JSON.stringify(result));
 let purchase=f.get().state.purchases[0];
 result=await f.call('/api/purchases/confirm',{id:purchase.id,expectedVersion:purchase.version,requestId:'confirm-http-purchase'});assert.equal(result.status,201,JSON.stringify(result));purchase=f.get().state.purchases[0];
 const input={id:purchase.id,expectedVersion:purchase.version,requestId:'receive-http-purchase',items:[{productId:'product',quantity:2}]},before=f.get(),events=f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n;
 f.store.db.exec("CREATE TRIGGER deny_purchase_audit BEFORE INSERT ON audit_events WHEN NEW.entity='purchases' BEGIN SELECT RAISE(ABORT,'purchase audit failure'); END;");
 result=await f.call('/api/purchases/receive',input);assert.equal(result.status,500);assert.equal(canonical(f.get()),canonical(before));assert.equal(f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n,events);assert.deepEqual(latestPurchaseCosts(f.get().state.purchases),[]);
 f.store.db.exec('DROP TRIGGER deny_purchase_audit');
 result=await f.call('/api/purchases/receive',input);assert.equal(result.status,201,JSON.stringify(result));const saved=f.get();assert.equal(saved.state.products[0].stock,7);assert.equal(saved.state.purchases[0].receipts.length,1);assert.equal(saved.state.stockMovements.length,1);assert.equal(latestPurchaseCosts(saved.state.purchases)[0].unitCostCents,625);assert.equal(saved.state.stockMovements[0].purchaseId,purchase.id);assert.equal(saved.state.stockMovements[0].referenceId,saved.state.purchases[0].receipts[0].id);assert.equal(saved.state.stockMovements[0].execution.executorName,'Dono sintético');
 result=await f.call('/api/purchases/receive',input);assert.equal(result.status,201);assert.equal(canonical(f.get()),canonical(saved));
 result=await f.call('/api/purchases/receive',{...input,requestId:'competing-http-purchase'});assert.equal(result.status,400);assert.equal(canonical(f.get()),canonical(saved));
 const finalInput={...input,expectedVersion:saved.state.purchases[0].version,requestId:'remaining-http-purchase'};
 f.store.db.exec("CREATE TRIGGER deny_receipt_item BEFORE INSERT ON commercial_purchase_receipt_items BEGIN SELECT RAISE(ABORT,'receipt SQL failure'); END;");
 result=await f.call('/api/purchases/receive',finalInput);assert.equal(result.status,500);assert.equal(canonical(f.get()),canonical(saved));assert.equal(f.store.db.prepare('SELECT count(*) n FROM commercial_purchase_receipt_items').get().n,1);
 f.store.db.exec('DROP TRIGGER deny_receipt_item');
 result=await f.call('/api/purchases/receive',finalInput);assert.equal(result.status,201);assert.equal(f.get().state.products[0].stock,9);assert.equal(f.get().state.purchases[0].receipts.length,2);assert.equal(f.get().state.stockMovements.length,2);assert.equal(latestPurchaseCosts(f.get().state.purchases).length,1);assert.equal(f.store.db.prepare('SELECT count(*) n FROM commercial_purchase_receipt_items').get().n,2);
 assert.equal(f.store.db.prepare('PRAGMA foreign_key_check').all().length,0);
});
