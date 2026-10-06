'use strict';
// Supplemental same-input proof in memory; initial visit counts on disposable QA copies.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../.qa/foundation-v1.2/stock-balances'),dir=path.resolve(process.argv[2]||'');
function guard(file){const p=path.resolve(file);assert(p.startsWith(ROOT+path.sep));return p;}
guard(dir);const baseline=fs.readFileSync(guard(path.join(dir,'inventory-baseline.js')),'utf8');
const candidate=require('./stock-balance-candidate').candidate(baseline);
assert.equal(candidate,fs.readFileSync(guard(path.join(dir,'inventory-candidate.js')),'utf8'));
const {SqlStore}=require('../foundation/sql-store'),{createCompany,createUnit}=require('../foundation/entities');
const {writeState}=require('../foundation/state-repository'),{loadState}=require('../foundation/scoped-state');
const {grantCompanyAccess,grantUnitAccess}=require('../foundation/access');
const {equivalence,digest,contents,compile}=require('./stock-insert-equivalence');
const store=new SqlStore(':memory:',{environment:'test'}),results=[];
try{
 const a=createCompany(store,{name:'Sintética A'}),b=createCompany(store,{name:'Sintética B'});
 const scopes=[createUnit(store,a.id,{name:'A1'}),createUnit(store,a.id,{name:'A2'}),createUnit(store,b.id,{name:'B1'})].map(u=>({companyId:u.company_id,unitId:u.id}));
 for(const id of ['executor','authorizer']){
  store.db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run(id,id,id,'synthetic-hash','active','2020','2020');
  for(const scope of scopes){grantCompanyAccess(store,id,scope.companyId);grantUnitAccess(store,id,scope.companyId,scope.unitId);}
 }
 const state={products:[{id:'a',name:'Antigo inativo',stock:19,priceCents:100,active:false,positionBalances:{dep:3}},
  {id:'b',name:'Sem movimentos',stock:7,priceCents:100,positionBalances:null},
  {id:'__proto__',name:'Exato',stock:Number.MAX_SAFE_INTEGER,priceCents:100,positionBalances:{}}],customers:[],sales:[],
  positions:[{id:'dep',code:'DEP',name:'Depósito',active:true,version:1,number:1,date:'2020',history:[]}],
  purchases:[{id:'purchase',version:2,totalCents:100,items:[{productId:'a',name:'Nome antigo',quantity:1,unitCostCents:100}],receipts:[{id:'receipt',date:'2020',items:[{productId:'a',name:'Nome antigo',quantity:1,unitCostCents:100}]}]}],
  stockEntries:[{id:'entry',productId:'__proto__',quantity:2,date:'2020',extra:{historical:true}}],
  stockMovements:[{id:'m0',productId:'a',quantity:2,type:'initial',referenceId:'a',date:'2020',extra:[null,'old']},
   {id:'m1',productId:'a',quantity:1,type:'purchase',purchaseId:'purchase',referenceId:'receipt',date:'2020',execution:{executedBy:'executor',authorizedBy:'authorizer',executorName:'executor',approverName:'authorizer',executedAt:'2020'}},
   {id:'m2',productId:'__proto__',quantity:2,type:'entry',referenceId:'entry',date:'2020',execution:null},
   {id:'m3',productId:'a',quantity:-1,type:'sale',referenceId:null,date:'2020',note:null}],
  positionMovements:[{id:'physical',productId:'a',quantity:2,from:'dep',to:'',type:'transfer',referenceId:'old-transfer',date:'2020'}]};
 for(const variant of ['history-auth-receipt-physical','absent-global','zero-global'])for(const scope of scopes){
  const input=structuredClone(state);if(variant==='absent-global')delete input.stockMovements;if(variant==='zero-global')input.stockMovements=[];
  const revision=store.db.prepare('SELECT revision FROM unit_states WHERE company_id=? AND unit_id=?').get(scope.companyId,scope.unitId)?.revision||0;
  store.transaction(()=>writeState(store,scope,input,revision));const current=loadState(store,scope);
  results.push({variant,scope,equivalence:equivalence(store,scope,current.state,current.revision,[baseline,candidate])});
 }
 const scope=scopes[0],current=loadState(store,scope);current.state.stockMovements=[{id:'bad',productId:'a',quantity:'0.125',date:'2020',type:'initial',referenceId:'a'}];
 const before=digest(contents(store));for(const source of [baseline,candidate]){
  assert.throws(()=>store.transaction(()=>compile(source).syncInventory(store,scope,current.state,current.revision)),/NOT NULL/);
  assert.equal(digest(contents(store)),before);
 }
}finally{store.close();}
const initialVisits=[];
for(const size of ['small','medium','large']){
 const source=guard(path.join(dir,size,'source.sqlite')),copy=guard(path.join(dir,size,'initial-visit-count.sqlite'));
 const originalHash=digest(fs.readFileSync(source).toString('base64'));fs.copyFileSync(source,copy);
 const isolated=new SqlStore(copy,{environment:'test',migrationsDir:guard(path.join(dir,'migrations-001-010'))});
 try{const row=isolated.db.prepare('SELECT company_id,unit_id,revision,payload FROM unit_states').get(),scope={companyId:row.company_id,unitId:row.unit_id},state=JSON.parse(row.payload);
  initialVisits.push({size,baseline:require('./stock-balance-candidate').visits(baseline,isolated,scope,state,row.revision,false),candidate:require('./stock-balance-candidate').visits(candidate,isolated,scope,state,row.revision,true)});
 }finally{isolated.close();}
 assert.equal(digest(fs.readFileSync(source).toString('base64')),originalHash);
 for(const suffix of ['','-wal','-shm'])if(fs.existsSync(copy+suffix))fs.unlinkSync(guard(copy+suffix));
}
const result={equivalenceCases:results.length,results,initialVisits,fractionalPersistence:'Rejected identically by both bodies; complete rollback. Arithmetic decimal characterization is separate, no fractional operation enabled.'};
fs.writeFileSync(guard(path.join(dir,'supplemental-validation.json')),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({cases:results.length,initialVisits}));
