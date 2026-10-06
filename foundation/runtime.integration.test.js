'use strict';

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {randomUUID,randomBytes}=require('node:crypto');
const {createRuntime}=require('./runtime');
const {createServer}=require('../server');
const {SqlStore,hash}=require('./sql-store');
const {canonical,writeState}=require('./state-repository');
const {loadState}=require('./scoped-state');
const {summarizeState}=require('./migration');
const {verifyAuditChain}=require('./audit');

const qa=path.resolve(__dirname,'../.qa/foundation-v1');
function files() {
  fs.mkdirSync(qa,{recursive:true});
  const dir=fs.mkdtempSync(path.join(qa,'migration-copy-runtime-'));
  const legacyFile=path.join(dir,'legacy.json'),filename=path.join(dir,'foundation.sqlite');
  const state={schemaVersion:1,company:{name:'Empresa sintética de runtime',contact:'Contato histórico sintético'},products:[{id:'sku-old',name:'Produto histórico',stock:1,priceCents:101}],customers:[],sales:[],unknownCollection:[{id:'repeated',amountCents:12},{id:'repeated',amountCents:13}],unknownSettings:{nested:{preserve:true},date:'2020-02-29'}};
  fs.writeFileSync(legacyFile,JSON.stringify(state,null,2));
  const options={environment:'test',dataDir:dir,filename,legacyFile,pairingToken:randomBytes(32).toString('base64url')};
  return {dir,legacyFile,filename,state,options,cleanup(){
    // Only files in the directory created by this fixture; never recurse or touch data/.
    assert.equal(path.dirname(dir),qa);
    for(const name of fs.readdirSync(dir))fs.unlinkSync(path.join(dir,name));
    fs.rmdirSync(dir);
  }};
}
function scope(store) {const unit=store.db.prepare('SELECT company_id,id FROM units').get();return {companyId:unit.company_id,unitId:unit.id};}

test('runtime: primeira abertura importa cópia, confirma meta e relatório de preservação',()=>{
  const f=files();let runtime;
  try {
    const initialHash=hash(fs.readFileSync(f.legacyFile));runtime=createRuntime(f.options);const ctx=scope(runtime.store);
    const current=loadState(runtime.store,ctx),row=runtime.store.db.prepare('SELECT * FROM import_runs').get(),report=JSON.parse(row.report_json);
    assert.equal(runtime.store.meta('initial_import_complete'),'1');assert.equal(current.revision,1);assert.equal(canonical(current.state),canonical(f.state));
    assert.equal(row.source_hash,initialHash);assert.equal(hash(fs.readFileSync(f.legacyFile)),initialHash);
    assert.equal(report.canonicalSHA256,summarizeState(f.state).canonicalSHA256);assert.deepEqual(report.counts,summarizeState(f.state).counts);assert.deepEqual(report.topLevelIdDigests,summarizeState(f.state).topLevelIdDigests);assert.deepEqual(report.centsByPath,summarizeState(f.state).centsByPath);
    assert.equal(report.centsByPath['unknownCollection[].amountCents'],'25');assert.equal(runtime.store.db.prepare("SELECT count(*) n FROM entity_index WHERE kind='unknownCollection'").get().n,0);
    assert.equal(runtime.store.db.prepare("SELECT count(*) n FROM audit_events WHERE action='IMPORT'").get().n,1);assert.equal(verifyAuditChain(runtime.store),true);
  } finally {runtime?.close();f.cleanup();}
});
test('runtime: reinício conserva SQL evoluído mesmo se JSON antigo mudou ou ficou inválido',()=>{
  const f=files();let runtime;
  try {
    runtime=createRuntime(f.options);const ctx=scope(runtime.store),current=loadState(runtime.store,ctx),next=structuredClone(current.state);
    next.products[0].stock=0;next.unknownSettings.modifiedInSql=true;runtime.store.transaction(()=>writeState(runtime.store,ctx,next,current.revision));runtime.close();runtime=null;
    fs.writeFileSync(f.legacyFile,JSON.stringify({...f.state,products:[{...f.state.products[0],stock:100}]}));const changedHash=hash(fs.readFileSync(f.legacyFile));
    runtime=createRuntime(f.options);assert.equal(loadState(runtime.store,ctx).revision,2);assert.equal(canonical(loadState(runtime.store,ctx).state),canonical(next));assert.equal(hash(fs.readFileSync(f.legacyFile)),changedHash);runtime.close();runtime=null;
    fs.writeFileSync(f.legacyFile,'invalid JSON after import');const invalidHash=hash(fs.readFileSync(f.legacyFile));
    runtime=createRuntime(f.options);assert.equal(canonical(loadState(runtime.store,ctx).state),canonical(next));assert.equal(runtime.store.db.prepare('SELECT count(*) n FROM import_runs').get().n,1);assert.equal(runtime.store.db.prepare("SELECT count(*) n FROM audit_events WHERE action='IMPORT'").get().n,1);assert.equal(hash(fs.readFileSync(f.legacyFile)),invalidHash);
  } finally {runtime?.close();f.cleanup();}
});
test('runtime: origem inválida na primeira abertura não deixa importação, estado ou contexto',()=>{
  const f=files();let store;
  try {
    f.state.sales=[{id:'invalid-sale',customerId:'missing',items:[{productId:'sku-old',quantity:1,priceCents:101}],totalCents:101}];fs.writeFileSync(f.legacyFile,JSON.stringify(f.state));const before=hash(fs.readFileSync(f.legacyFile));
    assert.throws(()=>createRuntime(f.options),e=>e.code==='LEGACY_REFERENCE_INVALID');
    store=new SqlStore(f.filename,{environment:'test'});
    for(const table of ['companies','units','unit_states','entity_index','import_runs','audit_events','users'])assert.equal(store.db.prepare('SELECT count(*) n FROM '+table).get().n,0,table);
    assert.equal(store.meta('initial_import_complete'),undefined);assert.equal(hash(fs.readFileSync(f.legacyFile)),before);
  } finally {store?.close();f.cleanup();}
});

class Client {
  constructor(origin) {this.origin=origin;this.cookies=new Map();this.csrf=null;}
  async request(url,body) {
    const method=body===undefined?'GET':'POST',headers={cookie:[...this.cookies].map(([k,v])=>k+'='+v).join('; ')};
    if(method==='POST')Object.assign(headers,{origin:this.origin,'content-type':'application/json','x-csrf-token':this.csrf});
    const response=await fetch(this.origin+url,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
    for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(';')[0],index=pair.indexOf('='),key=pair.slice(0,index),value=pair.slice(index+1);if(value)this.cookies.set(key,value);else this.cookies.delete(key);}
    const data=await response.json();if(data.csrfToken)this.csrf=data.csrfToken;return {status:response.status,data};
  }
}
async function listen(server) {await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});return 'http://127.0.0.1:'+server.address().port;}
async function stop(server) {if(!server)return;if(!server.listening){server.runtime.close();return;}await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});}

test('HTTP: duas instâncias SQLite vendem a última unidade uma vez, lendo estado atualizado',async()=>{
  const f=files();let first,second;
  try {
    first=createServer(f.options);const a=new Client(await listen(first));assert.equal((await a.request('/api/auth/status')).status,200);
    // Synthetic credential used only in this isolated fixture, never operational setup.
    const setup=await a.request('/api/auth/setup',{pairingToken:f.options.pairingToken,name:'Proprietário sintético',login:'owner-runtime',password:'Senha somente fixture 2026!'});assert.equal(setup.status,200,JSON.stringify(setup.data));
    second=createServer(f.options);const b=new Client(await listen(second));b.cookies=new Map(a.cookies);
    const meA=await a.request('/api/auth/me'),meB=await b.request('/api/auth/me');assert.equal(meA.status,200);assert.equal(meB.status,200);assert.equal(meA.data.user.id,meB.data.user.id);assert.notEqual(a.csrf,b.csrf);
    const input=()=>({requestId:randomUUID(),paymentMethod:'pix',paymentStatus:'received',items:[{productId:'sku-old',quantity:1,priceCents:101}]});
    const responses=await Promise.all([a.request('/api/sales',input()),b.request('/api/sales',input())]);
    assert.deepEqual(responses.map(r=>r.status).sort((x,y)=>x-y),[201,400]);
    assert.match(responses.find(r=>r.status===400).data.error,/Estoque insuficiente/);
    const ctx={companyId:setup.data.companyId,unitId:setup.data.unitId},stateA=loadState(first.runtime.store,ctx),stateB=loadState(second.runtime.store,ctx);
    assert.equal(canonical(stateA),canonical(stateB));assert.equal(stateA.revision,2);assert.equal(stateA.state.products[0].stock,0);assert.equal(stateA.state.sales.length,1);assert.equal(stateA.state.sales[0].receipts.length,1);assert.equal(stateA.state.sales[0].totalCents,101);
    assert.equal(stateA.state.stockMovements.filter(m=>m.type==='sale').length,1);assert.equal(verifyAuditChain(first.runtime.store),true);assert.equal(verifyAuditChain(second.runtime.store),true);
    assert.equal((await a.request('/api/state')).data.sales.length,1);assert.equal((await b.request('/api/state')).data.products[0].stock,0);
    assert.equal(hash(fs.readFileSync(f.legacyFile)),hash(Buffer.from(JSON.stringify(f.state,null,2))));
  } finally {await stop(second);await stop(first);f.cleanup();}
});
