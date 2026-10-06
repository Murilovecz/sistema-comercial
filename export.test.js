const test=require('node:test'),assert=require('node:assert/strict');
const {exportCsv}=require('./export');
test('CSV preserva seleção filtrada, valores e proteção de fórmulas',()=>{
 const state={products:[{id:'a',name:'=teste',priceCents:1590,stock:2},{id:'b',name:'Fora do filtro',priceCents:200,stock:1}]};
 const selected=exportCsv(state,'products',['a']);
 assert.ok(selected.body.startsWith('\uFEFF'));assert.ok(selected.body.includes("'=teste"));assert.ok(selected.body.includes('15,90'));assert.ok(!selected.body.includes('Fora do filtro'));
 assert.equal(exportCsv(state,'products',[]).body.split('\r\n').length,1);
 assert.throws(()=>exportCsv(state,'__proto__',[]),/inválida/);
});
