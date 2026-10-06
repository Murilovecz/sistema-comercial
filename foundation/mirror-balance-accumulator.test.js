'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture,state,cases}=require('../scripts/mirror-balance-fixture');
const {contents,digest}=require('../scripts/stock-insert-equivalence');
const inventory=require('./inventory-store');
function verify(store,scope,input){const dbBefore=digest(contents(store)),inputBefore=digest(input);try{return inventory.verifyInventoryMirror(store,scope,input);}finally{assert.equal(digest(contents(store)),dbBefore);assert.equal(digest(input),inputBefore);}}
test('espelho global: histórico, âncoras, inativo, autoria, extras, posições e inteiro grande permanecem exatos',t=>{
 const {store,scopes,input}=fixture(t);for(const scope of scopes)assert.deepEqual(verify(store,scope,input),input);
 assert.equal(store.db.prepare("SELECT technical_anchor FROM commercial_stock_balances WHERE product_id='__proto__' LIMIT 1").get().technical_anchor,'9007199254740989');
 assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(),[]);assert.deepEqual(store.db.prepare('PRAGMA integrity_check').all().map(r=>r.integrity_check),['ok']);
});
for(const variant of ['absent','empty','null','many'])test('espelho global: coleção '+variant+' preserva semântica e ausência de escrita',t=>{
 const input=state();if(variant==='absent')delete input.stockMovements;else if(variant==='null')input.stockMovements=null;else if(variant==='empty')input.stockMovements=[];else for(let i=0;i<400;i++)input.stockMovements.push({id:'extra'+i,productId:i%2?'__proto__':'constructor',quantity:i%4<2?1:-1,date:'2020',type:'initial',referenceId:i%2?'__proto__':'constructor'});
 const seed=structuredClone(input);if(variant==='null')delete seed.stockMovements;
 const {store,scopes}=fixture(t,seed);assert.deepEqual(verify(store,scopes[0],input),input);
 if(variant==='null')assert.throws(()=>store.transaction(()=>require('./state-repository').writeState(store,scopes[0],input,1)),/Lista inválida: stockMovements/);
});
for(const corruption of cases)test('espelho global recusa: '+corruption.name,t=>{
 const {store,scopes,input}=fixture(t),scope=scopes[0];if(corruption.input)corruption.input(input);if(corruption.db)store.transaction(()=>corruption.db(store,scope));
 assert.throws(()=>verify(store,scope,input),e=>e.code===(corruption.code===null?undefined:'COMMERCIAL_DIVERGENCE')&&(!corruption.message||corruption.message.test(e.message)));
});
test('espelho global: chamada seguinte recalcula e não reutiliza acumulado de outro escopo',t=>{
 const {store,scopes,input}=fixture(t),next=structuredClone(input);next.products[0].stock=31;
 store.transaction(()=>require('./state-repository').writeState(store,scopes[1],next,1));
 assert.deepEqual(verify(store,scopes[1],next),next);assert.deepEqual(verify(store,scopes[0],input),input);
 assert.throws(()=>verify(store,scopes[1],input),e=>e.code==='COMMERCIAL_DIVERGENCE');
 assert.deepEqual(verify(store,scopes[2],input),input);
});
test('espelho global: ausência de marcador mantém o retorno transitório original; autorização permanece no chamador',t=>{
 const {store,input}=fixture(t),scope={companyId:'unprepared',unitId:'unprepared'};
 assert.equal(verify(store,scope,input),input);
 assert.throws(()=>require('./scoped-state').loadState(store,scope),e=>e.code==='FORBIDDEN_CONTEXT');
});
