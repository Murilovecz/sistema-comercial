'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture,profile}=require('./http-fixture'),{SNAPSHOT_READ,setRolePermissions}=require('./rbac'),{loadState}=require('./scoped-state');
test('HTTP estoque inicial positivo exige inventory.adjust; cadastro vazio não concede ajuste',async t=>{
 const f=await fixture(t),permissions=[...SNAPSHOT_READ,'catalog.manage'],p=await profile(f,permissions),input={name:'Cadastro sintético',price:'12.50',stock:2};
 let r=await p.client.call('/api/products',input);assert.equal(r.status,403,r.text);assert.equal(loadState(f.store,f.scope).state.products.length,0);
 r=await p.client.call('/api/products',{...input,stock:0});assert.equal(r.status,201,r.text);const saved=loadState(f.store,f.scope);assert.equal(saved.state.products[0].stock,0);assert.equal(saved.state.stockMovements[0].quantity,0);assert.equal(saved.state.stockMovements[0].execution.executedBy,p.user.id);
 setRolePermissions(f.store,f.scope.companyId,p.role.id,[...permissions,'inventory.adjust']);r=await p.client.call('/api/products',{...input,name:'Cadastro com saldo'});assert.equal(r.status,201,r.text);const next=loadState(f.store,f.scope);assert.equal(next.state.products[1].stock,2);assert.equal(next.state.stockMovements[1].referenceId,next.state.products[1].id);assert.equal(next.state.stockMovements[1].type,'initial');assert.equal(next.state.stockMovements[1].execution.authorizedBy,null);
});
