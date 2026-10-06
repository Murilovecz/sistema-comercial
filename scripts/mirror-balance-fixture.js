'use strict';
// Shared synthetic fixture for verifier characterization and same-input corruption replay.
const {SqlStore}=require('../foundation/sql-store'),{createCompany,createUnit}=require('../foundation/entities');
const {writeState}=require('../foundation/state-repository');
const {grantCompanyAccess,grantUnitAccess}=require('../foundation/access');
function state(){return {products:[
 {id:'many',name:'Antigo inativo',stock:19,priceCents:100,active:false,positionBalances:{dep:3}},
 {id:'one',name:'Um movimento',stock:8,priceCents:100},
 {id:'none',name:'Sem movimentos',stock:7,priceCents:100},
 {id:'__proto__',name:'Inteiro exato',stock:Number.MAX_SAFE_INTEGER,priceCents:100},
 {id:'constructor',name:'ID especial',stock:0,priceCents:100},
 {id:'empty',name:'Posições vazias',stock:0,priceCents:100,positionBalances:{}},
 {id:'null',name:'Posições nulas',stock:0,priceCents:100,positionBalances:null}],customers:[],sales:[],
 positions:[{id:'dep',code:'DEP',name:'Depósito',active:true,version:1,number:1,date:'2020',history:[]}],
 purchases:[{id:'purchase',version:2,totalCents:100,items:[{productId:'many',name:'Nome antigo',quantity:1,unitCostCents:100}],receipts:[{id:'receipt',date:'2020',items:[{productId:'many',name:'Nome antigo',quantity:1,unitCostCents:100}]}]}],
 stockEntries:[{id:'entry',productId:'__proto__',quantity:2,date:'2020',historical:{keep:true}}],
 stockMovements:[{id:'m0',productId:'many',quantity:2,type:'initial',referenceId:'many',date:'2020',historical:[null,'old']},
  {id:'m1',productId:'one',quantity:3,type:'initial',referenceId:'one',date:'2020',execution:null},
  {id:'m2',productId:'many',quantity:1,type:'purchase',purchaseId:'purchase',referenceId:'receipt',date:'2020',execution:{executedBy:'executor',authorizedBy:'authorizer',executorName:'executor',approverName:'authorizer',executedAt:'2020'}},
  {id:'m3',productId:'__proto__',quantity:Number.MAX_SAFE_INTEGER,type:'initial',referenceId:'__proto__',date:'2020'},
  {id:'m4',productId:'many',quantity:-4,type:'sale',referenceId:null,date:'2020',note:null},
  {id:'m5',productId:'__proto__',quantity:2,type:'entry',referenceId:'entry',date:'2020'},
  {id:'m6',productId:'many',quantity:5,type:'initial',referenceId:'many',date:'2020'},
  {id:'m7',productId:'__proto__',quantity:-Number.MAX_SAFE_INTEGER,type:'sale',referenceId:null,date:'2020'}],
 positionMovements:[{id:'physical',productId:'many',quantity:2,from:'dep',to:'',type:'transfer',referenceId:'old-transfer',date:'2020',extra:{keep:true}}]};}
function fixture(t,input=state()){
 const store=new SqlStore(':memory:',{environment:'test'});if(t)t.after(()=>store.close());
 const a=createCompany(store,{name:'Sintética A'}),b=createCompany(store,{name:'Sintética B'});
 const scopes=[createUnit(store,a.id,{name:'A1'}),createUnit(store,a.id,{name:'A2'}),createUnit(store,b.id,{name:'B1'})].map(u=>({companyId:u.company_id,unitId:u.id}));
 for(const id of ['executor','authorizer']){store.db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run(id,id,id,'synthetic-hash','active','2020','2020');for(const scope of scopes){grantCompanyAccess(store,id,scope.companyId);grantUnitAccess(store,id,scope.companyId,scope.unitId);}}
 store.transaction(()=>{for(const scope of scopes)writeState(store,scope,input,0);});return {store,scopes,input};
}
const cases=[
 {name:'saldo declarado SQL divergente',db:(s,c)=>s.db.prepare("UPDATE commercial_stock_balances SET quantity='20' WHERE company_id=? AND unit_id=? AND product_id='many'").run(c.companyId,c.unitId)},
 {name:'âncora global divergente',db:(s,c)=>s.db.prepare("UPDATE commercial_stock_balances SET technical_anchor='16' WHERE company_id=? AND unit_id=? AND product_id='many'").run(c.companyId,c.unitId)},
 {name:'saldo declarado no estado divergente',input:s=>s.products[0].stock++},
 {name:'movimento SQL incompatível com espelho',db:(s,c)=>s.db.prepare("UPDATE commercial_stock_movements SET quantity='4' WHERE company_id=? AND unit_id=? AND id='m1'").run(c.companyId,c.unitId)},
 {name:'extra histórico incompatível',input:s=>s.stockMovements[0].historical.push('forged')},
 {name:'ordem histórica incompatível',input:s=>s.stockMovements.reverse()},
 {name:'produto correspondente ausente no estado',input:s=>s.products[0].id='missing'},
 {name:'produto ausente da lista de saldos',db:(s,c)=>s.db.prepare("DELETE FROM commercial_stock_balances WHERE company_id=? AND unit_id=? AND product_id='none'").run(c.companyId,c.unitId)},
 {name:'revisão do marcador divergente',db:(s,c)=>s.db.prepare("UPDATE commercial_normalizations SET source_revision=99 WHERE company_id=? AND unit_id=? AND aggregate='inventory'").run(c.companyId,c.unitId)},
 {name:'ausente versus coleção vazia',input:s=>delete s.stockEntries},
 {name:'presença da coleção adulterada',db:(s,c)=>s.setMeta('inventory-presence:'+c.companyId+':'+c.unitId,JSON.stringify({stockMovements:false,stockEntries:true,positionMovements:true}))},
 {name:'posição declarada divergente',input:s=>s.products[0].positionBalances.dep++},
 {name:'saldo físico SQL divergente',db:(s,c)=>s.db.prepare("UPDATE commercial_position_balances SET quantity='4' WHERE company_id=? AND unit_id=? AND product_id='many'").run(c.companyId,c.unitId)},
 {name:'âncora física divergente',db:(s,c)=>s.db.prepare("UPDATE commercial_position_balances SET technical_anchor='6' WHERE company_id=? AND unit_id=? AND product_id='many'").run(c.companyId,c.unitId)},
 {name:'movimento físico incompatível',input:s=>s.positionMovements[0].quantity++},
 {name:'posição null versus vazia',input:s=>s.products.find(p=>p.id==='null').positionBalances={}},
 {name:'autoria SQL incompatível com histórico',db:(s,c)=>s.db.prepare("UPDATE commercial_stock_movements SET executed_by='authorizer' WHERE company_id=? AND unit_id=? AND id='m2'").run(c.companyId,c.unitId)},
 {name:'quantidade SQL fracionada rejeitada pela hidratação',db:(s,c)=>s.db.prepare("UPDATE commercial_stock_movements SET quantity='0.125' WHERE company_id=? AND unit_id=? AND id='m1'").run(c.companyId,c.unitId),code:null,message:/fracionada/},
 {name:'quantidade SQL inválida rejeitada pela hidratação',db:(s,c)=>s.db.prepare("UPDATE commercial_stock_movements SET quantity='invalid' WHERE company_id=? AND unit_id=? AND id='m1'").run(c.companyId,c.unitId),code:null,message:/decimal inválida/}
];
module.exports={fixture,state,cases};
