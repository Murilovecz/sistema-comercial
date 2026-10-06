'use strict';
// Acceptance and rejection equivalence, read-only effects, and actual untimed loop visits.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../.qa/foundation-v1.2/mirror-balances'),dir=path.resolve(process.argv[2]||'');
function guard(file){const p=path.resolve(file);assert(p.startsWith(ROOT+path.sep));return p;}guard(dir);
const baseline=fs.readFileSync(guard(path.join(dir,'inventory-baseline.js')),'utf8'),candidate=require('./mirror-balance-candidate').candidate(baseline);
assert.equal(candidate,fs.readFileSync(guard(path.join(dir,'inventory-candidate.js')),'utf8'));
const {fixture,state,cases}=require('./mirror-balance-fixture'),{equivalence}=require('./mirror-balance-equivalence');
const {contents,digest}=require('./stock-insert-equivalence'),results=[];
for(const variant of ['normal','absent','empty','null','many']){
 const input=state();if(variant==='absent')delete input.stockMovements;else if(variant==='empty')input.stockMovements=[];else if(variant==='null')input.stockMovements=null;else if(variant==='many')for(let i=0;i<400;i++)input.stockMovements.push({id:'extra'+i,productId:i%2?'__proto__':'constructor',quantity:i%4<2?1:-1,type:'initial',referenceId:i%2?'__proto__':'constructor',date:'2020'});
 const seed=structuredClone(input);if(variant==='null')delete seed.stockMovements;
 const {store,scopes}=fixture(null,seed);
 try{for(const scope of scopes){const proof=equivalence(store,scope,input,[baseline,candidate]);assert(proof.accepted);results.push({name:variant,scope,proof});}
  assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(),[]);assert.deepEqual(store.db.prepare('PRAGMA integrity_check').all().map(r=>r.integrity_check),['ok']);
 }finally{store.close();}
}
const {store,scopes,input}=fixture();
try{
 for(const corruption of cases)for(const scope of scopes){
  const altered=structuredClone(input);if(corruption.input)corruption.input(altered);
  const before=digest(contents(store)),stop=new Error('Synthetic corruption rollback');
  try{store.transaction(()=>{if(corruption.db)corruption.db(store,scope);
   const proof=equivalence(store,scope,altered,[baseline,candidate]);assert(!proof.accepted);
   assert.equal(proof.error.code,corruption.code===null?null:'COMMERCIAL_DIVERGENCE');if(corruption.message)assert(corruption.message.test(proof.error.message));
   results.push({name:corruption.name,scope,proof});throw stop;
  });}catch(error){if(error!==stop)throw error;}
  assert.equal(digest(contents(store)),before);
 }
 const changed=structuredClone(input);changed.products[0].stock=31;
 store.transaction(()=>require('../foundation/state-repository').writeState(store,scopes[1],changed,1));
 for(const [scope,expected]of [[scopes[0],true],[scopes[1],false],[scopes[2],true]]){const proof=equivalence(store,scope,input,[baseline,candidate]);assert.equal(proof.accepted,expected);results.push({name:'different-unit-same-IDs',scope,proof});}
 const unprepared={companyId:'unprepared',unitId:'unprepared'},proof=equivalence(store,unprepared,input,[baseline,candidate]);assert(proof.accepted&&proof.sameReference);results.push({name:'marker-absent-original-bypass',proof});
 assert.throws(()=>require('../foundation/scoped-state').loadState(store,unprepared),e=>e.code==='FORBIDDEN_CONTEXT');
 assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(),[]);assert.deepEqual(store.db.prepare('PRAGMA integrity_check').all().map(r=>r.integrity_check),['ok']);
}finally{store.close();}
const initialVisits=[];
for(const size of ['small','medium','large']){
 const original=guard(path.join(dir,size,'source.sqlite')),copy=guard(path.join(dir,size,'initial-visit-count.sqlite'));
 const hash=digest(fs.readFileSync(original).toString('base64'));fs.copyFileSync(original,copy);
 const isolated=new(require('../foundation/sql-store').SqlStore)(copy,{environment:'test',migrationsDir:guard(path.join(dir,'migrations-001-010'))});
 try{const row=isolated.db.prepare('SELECT company_id,unit_id,payload FROM unit_states').get(),scope={companyId:row.company_id,unitId:row.unit_id},state=JSON.parse(row.payload);
  initialVisits.push({size,baseline:require('./mirror-balance-candidate').visits(baseline,isolated,scope,state,false),candidate:require('./mirror-balance-candidate').visits(candidate,isolated,scope,state,true)});
 }finally{isolated.close();}
 assert.equal(digest(fs.readFileSync(original).toString('base64')),hash);
 for(const suffix of ['','-wal','-shm'])if(fs.existsSync(copy+suffix))fs.unlinkSync(guard(copy+suffix));
}
const report={cases:results.length,accepted:results.filter(r=>r.proof.accepted).length,rejected:results.filter(r=>!r.proof.accepted).length,results,initialVisits};
fs.writeFileSync(guard(path.join(dir,'supplemental-validation.json')),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:report.cases,accepted:report.accepted,rejected:report.rejected,initialVisits}));
