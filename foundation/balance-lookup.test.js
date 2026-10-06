'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('../scripts/mirror-balance-fixture');
const {contents,digest}=require('../scripts/stock-insert-equivalence');
const inventory=require('./inventory-store');
function verify(store,scope,state){const db=digest(contents(store)),input=digest(state);try{return inventory.verifyInventoryMirror(store,scope,state);}finally{assert.equal(digest(contents(store)),db);assert.equal(digest(state),input);}}
test('lookup saldo: PK composta impede duplicidade sem alterar linhas, e IDs iguais existem em escopos distintos',t=>{
 const {store,scopes}=fixture(t),scope=scopes[0],before=digest(contents(store));
 assert.deepEqual(store.db.prepare("PRAGMA table_info('commercial_stock_balances')").all().filter(r=>r.pk).map(r=>[r.name,r.pk,r.notnull]),[['company_id',1,1],['unit_id',2,1],['product_id',3,1]]);
 assert.throws(()=>store.transaction(()=>store.db.prepare('INSERT INTO commercial_stock_balances SELECT * FROM commercial_stock_balances WHERE company_id=? AND unit_id=? AND product_id=?').run(scope.companyId,scope.unitId,'none')),e=>e.errcode===1555&&/UNIQUE constraint failed: commercial_stock_balances.company_id, commercial_stock_balances.unit_id, commercial_stock_balances.product_id/.test(e.message));
 assert.equal(digest(contents(store)),before);assert.equal(store.db.prepare("SELECT count(*) n FROM commercial_stock_balances WHERE product_id='none'").get().n,3);
});
test('lookup saldo: FK composta rejeita saldo de produto inexistente com rollback',t=>{
 const {store,scopes}=fixture(t),scope=scopes[0],before=digest(contents(store));
 assert.throws(()=>store.transaction(()=>store.db.prepare('INSERT INTO commercial_stock_balances VALUES(?,?,?,?,?,?)').run(scope.companyId,scope.unitId,'missing','0','0',0)),/FOREIGN KEY/);
 assert.equal(digest(contents(store)),before);
});
test('lookup saldo: ordem de produtos independente conserva conteúdo, IDs especiais, autoria e posições',t=>{
 const {store,scopes,input}=fixture(t);input.products.reverse();for(const scope of scopes)assert.deepEqual(verify(store,scope,input),input);
 assert.equal(input.products.find(p=>p.id==='__proto__').stock,Number.MAX_SAFE_INTEGER);
});
test('lookup saldo: falta de saldo continua recusada pela cardinalidade',t=>{
 const {store,scopes,input}=fixture(t),scope=scopes[0];store.db.prepare("DELETE FROM commercial_stock_balances WHERE company_id=? AND unit_id=? AND product_id='none'").run(scope.companyId,scope.unitId);
 assert.throws(()=>verify(store,scope,input),e=>e.code==='COMMERCIAL_DIVERGENCE'&&e.status===500);
});
test('lookup saldo: saldo inesperado no estado com mesma cardinalidade não esconde produto sem saldo',t=>{
 const {store,scopes,input}=fixture(t);input.products.find(p=>p.id==='none').id='unexpected';
 assert.throws(()=>verify(store,scopes[0],input),e=>e.code==='COMMERCIAL_DIVERGENCE'&&e.status===500);
});
test('lookup saldo: saldo SQL excedente em relação ao estado continua recusado',t=>{
 const {store,scopes,input}=fixture(t);input.products=input.products.filter(p=>p.id!=='none');
 assert.throws(()=>verify(store,scopes[0],input),e=>e.code==='COMMERCIAL_DIVERGENCE'&&e.status===500);
});
test('lookup saldo: alteração SQL entre chamadas é vista e rollback elimina a corrupção sem cache',t=>{
 const {store,scopes,input}=fixture(t),scope=scopes[0];assert.deepEqual(verify(store,scope,input),input);const before=digest(contents(store)),stop=new Error('Synthetic rollback');
 try{store.transaction(()=>{store.db.prepare("UPDATE commercial_stock_balances SET quantity='99' WHERE company_id=? AND unit_id=? AND product_id='none'").run(scope.companyId,scope.unitId);assert.throws(()=>verify(store,scope,input),e=>e.code==='COMMERCIAL_DIVERGENCE');throw stop;});}catch(e){if(e!==stop)throw e;}
 assert.equal(digest(contents(store)),before);assert.deepEqual(verify(store,scope,input),input);assert.deepEqual(verify(store,scopes[2],input),input);
 assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(),[]);assert.deepEqual(store.db.prepare('PRAGMA integrity_check').all().map(r=>r.integrity_check),['ok']);
});
