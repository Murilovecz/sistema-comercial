'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {SqlStore}=require('./sql-store'),{createCompany,createUnit}=require('./entities'),{writeState}=require('./state-repository');
const {DatabaseSync}=require('node:sqlite'),{backupLocal}=require('../scripts/backup-local-sql');
test('cópia consistente captura WAL e recusa sobrescrever origem ou destino',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'v11-backup-')),source=path.join(dir,'source.sqlite'),target=path.join(dir,'copy.sqlite'),store=new SqlStore(source,{environment:'test'});
 try{
  store.transaction(()=>{const c=createCompany(store,{name:'Sintética'}),u=createUnit(store,c.id,{name:'Loja'});writeState(store,{companyId:c.id,unitId:u.id},{products:[{id:'p',name:'Produto',stock:2,priceCents:100}],customers:[],sales:[]},0);});
  const report=await backupLocal(source,target);assert.equal(report.integrity,'ok');assert.equal(report.scopes,1);
  const copy=new DatabaseSync(target,{readOnly:true});try{assert.deepEqual(copy.prepare('SELECT payload FROM unit_states').all(),store.db.prepare('SELECT payload FROM unit_states').all());}finally{copy.close();}
  await assert.rejects(backupLocal(source,target));await assert.rejects(backupLocal(source,source));
 }finally{store.close();}
});
