const {test}=require('node:test'),assert=require('node:assert/strict');
const {productFields}=require('./domain');
test('código único ignora maiúsculas e categoria preserva texto',()=>{const state={products:[{id:'1',code:'ABC'}]};assert.throws(()=>productFields(state,{id:'2'},{code:'abc'}),/código/);const p={id:'1'};productFields(state,p,{code:'ABC',category:'Camisetas'});assert.equal(p.category,'Camisetas');});
test('mínimo exige inteiro não negativo e código remove espaços',()=>{const p={id:'1'};productFields({products:[]},p,{code:' ABC ',minStock:5});assert.equal(p.code,'ABC');assert.equal(p.minStock,5);for(const minStock of [-1,1.5])assert.throws(()=>productFields({products:[]},p,{minStock}));});
