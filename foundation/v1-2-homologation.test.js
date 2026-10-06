'use strict';
// Cross-flow gaps identified after the initial 608-test gate. Synthetic data only.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {randomUUID}=require('node:crypto');
const {fixture,Client,PASSWORD}=require('./http-fixture');
const {createServer}=require('../server');
const {createCompany,createUnit}=require('./entities');
const {grantCompanyAccess,grantUnitAccess}=require('./access');
const {createRole,assignRole,PERMISSIONS}=require('./rbac');
const {writeState,canonical}=require('./state-repository');
const {loadState}=require('./scoped-state');
const {appendAudit,verifyAuditChain}=require('./audit');
const {BackupService,validatePackage,restoreBackup}=require('./backup-service');
const {contents,digest}=require('../scripts/stock-insert-equivalence');
const {syntheticState}=require('../scripts/benchmark-foundation');

function isolated(name){
 const root=path.resolve(__dirname,'../.qa/foundation-v1.2/homologation/tests');
 fs.mkdirSync(root,{recursive:true});return fs.mkdtempSync(path.join(root,name+'-'));
}
async function start(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port;}
function checks(store){
 assert.equal(store.db.prepare('PRAGMA foreign_keys').get().foreign_keys,1);
 assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(),[]);
 assert.deepEqual(store.db.prepare('PRAGMA integrity_check').all().map(r=>r.integrity_check),['ok']);
 assert(verifyAuditChain(store));
}

test('homologação: backup/retenção/restore com login real preserva seis agregados e três escopos',async t=>{
 const dir=isolated('restore'),source=path.join(dir,'source.sqlite');
 const f=await fixture(t,{filename:source,dataDir:dir,backup:{enabled:false}});
 const sibling=createUnit(f.store,f.scope.companyId,{name:'A2 sintética'});
 const other=createCompany(f.store,{name:'B sintética'}),foreign=createUnit(f.store,other.id,{name:'B1 sintética'});
 const scopes=[f.scope,{companyId:f.scope.companyId,unitId:sibling.id},{companyId:other.id,unitId:foreign.id}];
 const states=scopes.map((scope,i)=>{
  let state=syntheticState(10);state.products[0].name='Produto exclusivo escopo '+i;
  state.products[0].custom={historical:true};state.customers[0].note=null;
  for(let j=0;j<state.purchases.length;j++){const purchase=state.purchases[j];purchase.confirmedAt='2026-09-02T15:00:00Z';state=require('../purchases').purchaseAction(state,'receive',{id:purchase.id,expectedVersion:1,requestId:'isolated-'+i+'-'+purchase.id,items:[{productId:purchase.items[0].productId,quantity:1}]});}
  f.store.transaction(()=>{
   grantCompanyAccess(f.store,f.ownerId,scope.companyId);grantUnitAccess(f.store,f.ownerId,scope.companyId,scope.unitId);
   const role=createRole(f.store,scope.companyId,{name:'Restore '+i,permissions:Object.keys(PERMISSIONS)});
   assignRole(f.store,f.ownerId,scope.companyId,scope.unitId,role.id);
   writeState(f.store,scope,state,loadState(f.store,scope).revision);
   appendAudit(f.store,{...scope,userId:f.ownerId,action:'SYNTHETIC_RESTORE_SEED',entity:'inventory',recordId:'p0',after:{scope:i}});
  });return state;
 });
 const before=digest(contents(f.store)),originalScopes=scopes.map(s=>loadState(f.store,s));
 const schema=f.store.db.prepare('SELECT version,checksum FROM schema_migrations ORDER BY version').all();
 const markers=f.store.db.prepare('SELECT * FROM commercial_normalizations ORDER BY company_id,unit_id,aggregate').all();
 let now=new Date('2026-10-01T00:00:00Z');
 const service=new BackupService({source,directory:path.join(dir,'backups'),environment:'test',enabled:false,retentionDays:1,minValid:2,now:()=>now});t.after(()=>service.stop());
 const first=await service.runNow();now=new Date('2026-10-02T00:00:00Z');const second=await service.runNow();now=new Date('2026-10-10T00:00:00Z');const latest=await service.runNow();
 assert.deepEqual(latest.retention.removed,[first.id]);assert.equal(latest.retention.validCount,2);
 assert(fs.existsSync(path.join(dir,'backups',second.id)));assert(!fs.existsSync(path.join(dir,'backups',first.id)));
 const pkg=path.join(dir,'backups',latest.id);assert.equal(validatePackage(pkg).manifest.validation.scopes,3);
 const target=path.join(dir,'restored','database.sqlite'),restored=restoreBackup(pkg,target);
 assert.equal(restored.validation.integrity,'ok');assert.equal(restored.validation.foreignKeys,'ok');
 assert.equal(digest(contents(f.store)),before,'Backup and restore must not mutate the live source');
 const server=createServer({environment:'test',filename:target,dataDir:path.dirname(target),importLegacy:false,backup:{enabled:false}});
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const origin=await start(server),store=server.runtime.store;
 assert.equal(digest(contents(store)),before,'All persisted rows restored before any fresh login');
 assert.deepEqual(store.db.prepare('SELECT version,checksum FROM schema_migrations ORDER BY version').all(),schema);
 assert.deepEqual(store.db.prepare('SELECT * FROM commercial_normalizations ORDER BY company_id,unit_id,aggregate').all(),markers);
 assert.deepEqual(scopes.map(s=>loadState(store,s)),originalScopes);checks(store);
 const client=new Client(origin);const me=await client.login('owner-fixture',PASSWORD);assert.equal(me.user.id,f.ownerId);
 for(let i=0;i<scopes.length;i++){
  assert.equal((await client.call('/api/auth/context',scopes[i])).status,200);
  const snapshot=await client.call('/api/state');assert.equal(snapshot.status,200);assert.equal(canonical(snapshot.data),canonical(states[i]));
  for(const [endpoint,n]of [['catalog',10],['customers',3],['suppliers',1],['inventory',10],['sales',20]]){
   const response=await client.call('/api/commercial/'+endpoint+'?pageSize=25');assert.equal(response.status,200);assert.equal(response.data.total,n);
  }
  const product=await client.call('/api/commercial/products/by-id?id=p0');assert.equal(product.status,200);assert.equal(product.data.record.name,states[i].products[0].name);
  const sale=await client.call('/api/commercial/sales/by-id?id=s0');assert.equal(sale.status,200);assert.equal(sale.data.sale.id,'s0');
  assert.equal(loadState(store,scopes[i]).revision,originalScopes[i].revision);
 }
 assert.equal((await new Client(origin).call('/api/commercial/sales')).status,401);checks(store);
 assert.equal(digest(contents(f.store)),before);
});

test('homologação: duas vendas HTTP simultâneas de produtos distintos preservam revisão, auditoria e replay',async t=>{
 const f=await fixture(t),state=syntheticState(2);state.sales=[];state.stockMovements=[];
 f.store.transaction(()=>writeState(f.store,f.scope,state,loadState(f.store,f.scope).revision));
 const peer=new Client(f.owner.origin);await peer.login('owner-fixture');
 const initial=loadState(f.store,f.scope),auditStart=f.store.db.prepare('SELECT max(sequence) n FROM audit_events').get().n;
 const bodies=['p0','p1'].map(productId=>({requestId:randomUUID(),customerId:'c0',items:[{productId,quantity:1,priceCents:1237}],paymentMethod:'pix',paymentStatus:'received',expectedCashSessionId:null}));
 const results=await Promise.all([f.owner.call('/api/commercial/sales',bodies[0]),peer.call('/api/commercial/sales',bodies[1])]);
 assert.deepEqual(results.map(r=>r.status),[201,201]);assert.equal(new Set(results.map(r=>r.data.sale.id)).size,2);
 const final=loadState(f.store,f.scope);assert.equal(final.revision,initial.revision+2);
 assert.deepEqual(final.state.products.map(p=>p.stock),[99,99]);assert.equal(final.state.sales.length,2);assert.equal(final.state.stockMovements.length,2);
 for(const result of results){
  const id=result.data.sale.id;assert.equal(final.state.sales.find(s=>s.id===id).execution.executedBy,f.ownerId);
  const audit=f.store.db.prepare("SELECT * FROM audit_events WHERE sequence>? AND entity='sales' AND record_id=?").all(auditStart,id);
  assert.equal(audit.length,1);assert.equal(audit[0].executed_by,f.ownerId);assert.equal(audit[0].company_id,f.scope.companyId);assert.equal(audit[0].unit_id,f.scope.unitId);
 }
 const saved=canonical(final),audits=f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n;
 const replay=await Promise.all([f.owner.call('/api/commercial/sales',bodies[0]),peer.call('/api/commercial/sales',bodies[1])]);
 assert.deepEqual(replay.map(r=>r.status),[201,201]);assert.deepEqual(replay.map(r=>r.data.sale.id),results.map(r=>r.data.sale.id));
 assert.equal(canonical(loadState(f.store,f.scope)),saved);assert.equal(f.store.db.prepare('SELECT count(*) n FROM audit_events').get().n,audits);checks(f.store);
});
