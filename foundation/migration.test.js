'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const {SqlStore,hash} = require('./sql-store');
const {createCompany,createUnit} = require('./entities');
const {loadState} = require('./scoped-state');
const {writeState,canonical} = require('./state-repository');
const {verifyAuditChain} = require('./audit');
const {importLegacy,summarizeState} = require('./migration');

const qa = path.resolve(__dirname,'../.qa/foundation-v1');
function fixture(t, value) {
  fs.mkdirSync(qa,{recursive:true});
  const dir=fs.mkdtempSync(path.join(qa,'migration-copy-test-'));
  const file=path.join(dir,'legacy.json');
  const s=new SqlStore(':memory:',{environment:'test'});
  const c=createCompany(s,{name:'Empresa de teste'}),u=createUnit(s,c.id,{name:'Unidade de teste'});
  const scope={companyId:c.id,unitId:u.id};
  const data=value||{schemaVersion:1,company:{name:'Apresentação antiga',contact:'Histórico'},products:[{id:'legacy-p',name:'Produto',stock:3,priceCents:101,version:1,custom:{preserve:true}}],customers:[{id:'legacy-c',name:'Cliente',date:'2023-01-02T03:04:05.000Z'}],sales:[{id:'legacy-s',customerId:'legacy-c',customerName:'Snapshot anterior',date:'2024-02-29T12:00:00-03:00',items:[{productId:'legacy-p',name:'Nome histórico',quantity:1,priceCents:101}],totalCents:101}],unknownRoot:{nested:[{id:'arbitrary',amountCents:109,tag:'preservar'}]}};
  fs.writeFileSync(file,JSON.stringify(data,null,2));
  t.after(()=>{s.close();fs.unlinkSync(file);fs.rmdirSync(dir);});
  return {s,scope,file,data};
}
function emptyImport(s) {
  for(const table of ['unit_states','entity_index','import_runs','audit_events']) assert.equal(s.db.prepare('SELECT count(*) n FROM '+table).get().n,0,table+' must be empty after rollback');
}

test('importação preserva IDs, datas, snapshots, centavos, versão e campos desconhecidos',t=>{
  const {s,scope,file,data}=fixture(t),before=hash(fs.readFileSync(file));
  const report=importLegacy(s,scope,file),saved=loadState(s,scope);
  assert.deepEqual(saved.state,data);assert.equal(saved.revision,1);assert.equal(report.schemaVersion,1);
  assert.equal(report.sourceHash,before);assert.equal(hash(fs.readFileSync(file)),before);
  assert.equal(report.sourceUnchanged,true);assert.deepEqual(report.verification,{canonicalEqual:true,countsEqual:true,idsEqual:true,centsEqual:true});
  assert.equal(report.counts.products,1);assert.equal(report.counts.cashSessions,0);assert.equal(report.centsByPath['products[].priceCents'],'101');
  assert.equal(report.alreadyImported,false);assert.equal(s.db.prepare('SELECT count(*) n FROM import_runs').get().n,1);
  assert.equal(s.db.prepare('SELECT count(*) n FROM entity_index').get().n,3);
  const event=s.db.prepare('SELECT * FROM audit_events').get();assert.equal(event.action,'IMPORT');assert.equal(event.user_id,null);assert.equal(event.executed_by,null);assert.equal(event.authorized_by,null);assert.equal(event.company_id,scope.companyId);
  assert.equal(verifyAuditChain(s),true);assert.doesNotMatch(event.after_json,/Snapshot anterior|Nome histórico|arbitrary/);
});
test('JSON malformado interrompe importação sem registros parciais',t=>{
  const {s,scope,file}=fixture(t);fs.writeFileSync(file,'{"products":');const before=hash(fs.readFileSync(file));
  assert.throws(()=>importLegacy(s,scope,file),e=>e.code==='LEGACY_JSON_INVALID'&&e.status===422);emptyImport(s);assert.equal(hash(fs.readFileSync(file)),before);
});
test('estrutura inválida interrompe importação e conserva origem',t=>{
  const {s,scope,file}=fixture(t);fs.writeFileSync(file,JSON.stringify({products:[],customers:[],sales:[],schemaVersion:99}));const before=hash(fs.readFileSync(file));
  assert.throws(()=>importLegacy(s,scope,file),e=>e.code==='LEGACY_DATA_INVALID');emptyImport(s);assert.equal(hash(fs.readFileSync(file)),before);
});
test('referência registrada a cliente inexistente não atravessa importação',t=>{
  const {s,scope,file,data}=fixture(t);data.sales[0].customerId='missing';fs.writeFileSync(file,JSON.stringify(data));
  assert.throws(()=>importLegacy(s,scope,file),e=>e.code==='LEGACY_REFERENCE_INVALID');emptyImport(s);
});
test('referência registrada a SKU inexistente não atravessa importação',t=>{
  const {s,scope,file,data}=fixture(t);data.sales[0].items[0].productId='missing';fs.writeFileSync(file,JSON.stringify(data));
  assert.throws(()=>importLegacy(s,scope,file),e=>e.code==='LEGACY_REFERENCE_INVALID');emptyImport(s);
});
test('legado sem schemaVersion nem cliente vinculado permanece assim no SQL',t=>{
  const {s,scope,file,data}=fixture(t);delete data.schemaVersion;delete data.sales[0].customerId;fs.writeFileSync(file,JSON.stringify(data));
  const report=importLegacy(s,scope,file);assert.equal(report.schemaVersionPresent,false);assert.equal(report.schemaVersion,null);assert.equal(Object.hasOwn(loadState(s,scope).state,'schemaVersion'),false);assert.deepEqual(loadState(s,scope).state,data);
});
test('reenvio da mesma origem retorna relatório salvo e não duplica auditoria/estado',t=>{
  const {s,scope,file}=fixture(t),first=importLegacy(s,scope,file),again=importLegacy(s,scope,file);
  assert.deepEqual(again,{...first,alreadyImported:true});assert.equal(loadState(s,scope).revision,1);assert.equal(s.db.prepare('SELECT count(*) n FROM audit_events').get().n,1);
});
test('reimportação idêntica não repõe dados SQL que evoluíram depois da migração',t=>{
  const {s,scope,file}=fixture(t),first=importLegacy(s,scope,file),next=loadState(s,scope).state;
  next.products[0].stock=2;s.transaction(()=>writeState(s,scope,next,1));
  const again=importLegacy(s,scope,file);assert.equal(again.alreadyImported,true);assert.equal(again.importedRevision,first.importedRevision);assert.equal(loadState(s,scope).revision,2);assert.equal(loadState(s,scope).state.products[0].stock,2);assert.equal(s.db.prepare('SELECT count(*) n FROM audit_events').get().n,1);
});
test('outra origem para a unidade já importada retorna409 sem substituir SQL',t=>{
  const {s,scope,file,data}=fixture(t);importLegacy(s,scope,file);const before=canonical(loadState(s,scope));data.products[0].stock=30;fs.writeFileSync(file,JSON.stringify(data));
  assert.throws(()=>importLegacy(s,scope,file),e=>e.status===409&&e.code==='LEGACY_ALREADY_IMPORTED');assert.equal(canonical(loadState(s,scope)),before);assert.equal(s.db.prepare('SELECT count(*) n FROM audit_events').get().n,1);
});
test('estado existente sem import_runs bloqueia importação com409',t=>{
  const {s,scope,file,data}=fixture(t);s.transaction(()=>writeState(s,scope,data,0));const before=canonical(loadState(s,scope));
  assert.throws(()=>importLegacy(s,scope,file),e=>e.status===409&&e.code==='LEGACY_STATE_EXISTS');assert.equal(canonical(loadState(s,scope)),before);assert.equal(s.db.prepare('SELECT count(*) n FROM import_runs').get().n,0);
});
test('falha na auditoria desfaz snapshot, índice e relatório de importação',t=>{
  const {s,scope,file}=fixture(t);s.db.exec("CREATE TRIGGER migration_fail BEFORE INSERT ON audit_events BEGIN SELECT RAISE(ABORT,'injected import'); END;");
  assert.throws(()=>importLegacy(s,scope,file),/injected import/);emptyImport(s);
});
test('importação participa da transação externa e rollback externo desfaz tudo',t=>{
  const {s,scope,file}=fixture(t);
  assert.throws(()=>s.transaction(()=>{importLegacy(s,scope,file);throw Error('rollback outer');}),/rollback outer/);emptyImport(s);
});
test('savepoint impede gravação parcial se transação externa captura falha',t=>{
  const {s,scope,file}=fixture(t);s.db.exec("CREATE TRIGGER migration_fail BEFORE INSERT ON audit_events BEGIN SELECT RAISE(ABORT,'injected import'); END;");
  s.transaction(()=>assert.throws(()=>importLegacy(s,scope,file),/injected import/));emptyImport(s);
});
test('agregados de muitos centavos seguros conservam precisão acima deMAX_SAFE_INTEGER',()=>{
  const state={products:[{id:'a',priceCents:Number.MAX_SAFE_INTEGER},{id:'b',priceCents:Number.MAX_SAFE_INTEGER}],customers:[],sales:[]};
  const report=summarizeState(state);assert.equal(report.centsByPath['products[].priceCents'],'18014398509481982');assert.equal(report.topLevelIdDigests.products.count,2);
});
test('mudança externa na origem durante importação é detectada e SQL é revertido',t=>{
  const {s,scope,file,data}=fixture(t);s.db.function('modify_fixture',()=>{fs.writeFileSync(file,JSON.stringify({...data,externalChange:true}));return 1;});
  s.db.exec('CREATE TRIGGER change_source BEFORE INSERT ON audit_events BEGIN SELECT modify_fixture(); END;');
  assert.throws(()=>importLegacy(s,scope,file),e=>e.status===409&&e.code==='LEGACY_SOURCE_CHANGED');emptyImport(s);
});
test('escopo de outra empresa não importa dados na unidade alheia',t=>{
  const {s,scope,file}=fixture(t);const company=createCompany(s,{name:'Outra empresa'});
  assert.throws(()=>importLegacy(s,{companyId:company.id,unitId:scope.unitId},file),e=>e.status===403);emptyImport(s);
});
test('CLI cria contexto técnico explícito em banco isolado e aceita replay',t=>{
  const {file,data}=fixture(t),database=path.join(path.dirname(file),'copy.sqlite');
  const {migrate}=require('../scripts/migrate-legacy');
  const args=['--source',file,'--database',database,'--company-name','Empresa técnica','--unit-name','Unidade técnica'];
  try {
    const first=migrate(args),again=migrate(args);assert.equal(first.alreadyImported,false);assert.equal(again.alreadyImported,true);
    const copy=new SqlStore(database,{environment:'test'});
    try {assert.deepEqual(loadState(copy,first).state,data);assert.equal(copy.db.prepare('SELECT count(*) n FROM users').get().n,0);assert.equal(copy.db.prepare('SELECT name FROM companies').get().name,'Empresa técnica');}
    finally {copy.close();}
  } finally {if(fs.existsSync(database))fs.unlinkSync(database);}
});
test('CLI não aceita destino na pasta operacional nem sobrescreve a origem',t=>{
  const {file}=fixture(t),{migrate}=require('../scripts/migrate-legacy'),before=hash(fs.readFileSync(file));
  const tail=['--company-name','Teste','--unit-name','Teste'];
  assert.throws(()=>migrate(['--source',file,'--database',file,...tail]),/arquivos diferentes/);
  assert.throws(()=>migrate(['--source',file,'--database',path.resolve(__dirname,'../data/must-not-open.sqlite'),...tail]),/pasta operacional/);
  assert.equal(hash(fs.readFileSync(file)),before);
});
test('CLI desfaz criação de empresa e unidade se legado falha na validação',t=>{
  const {file}=fixture(t),database=path.join(path.dirname(file),'copy.sqlite'),{migrate}=require('../scripts/migrate-legacy');fs.writeFileSync(file,'invalid');
  try {
    assert.throws(()=>migrate(['--source',file,'--database',database,'--company-name','Teste','--unit-name','Teste']),e=>e.code==='LEGACY_JSON_INVALID');
    const copy=new SqlStore(database,{environment:'test'});
    try {assert.equal(copy.db.prepare('SELECT count(*) n FROM companies').get().n,0);assert.equal(copy.db.prepare('SELECT count(*) n FROM units').get().n,0);emptyImport(copy);}
    finally {copy.close();}
  } finally {if(fs.existsSync(database))fs.unlinkSync(database);}
});
test('número desconhecido sem precisão segura não é convertido silenciosamente',t=>{
  const {s,scope,file}=fixture(t);fs.writeFileSync(file,'{"products":[],"customers":[],"sales":[],"unknown":9007199254740993}');const before=hash(fs.readFileSync(file));
  assert.throws(()=>importLegacy(s,scope,file),e=>e.code==='LEGACY_NUMBER_UNSAFE');emptyImport(s);assert.equal(hash(fs.readFileSync(file)),before);
});
test('UTF-8 inválido é rejeitado antes de substituir caractere do histórico',t=>{
  const {s,scope,file}=fixture(t);fs.writeFileSync(file,Buffer.concat([Buffer.from('{"products":[],"customers":[],"sales":[],"unknown":"'),Buffer.from([0xff]),Buffer.from('"}')]));
  assert.throws(()=>importLegacy(s,scope,file),e=>e.code==='LEGACY_JSON_INVALID');emptyImport(s);
});
test('lista desconhecida preserva IDs repetidos sem impor unicidade nem criar índice',t=>{
  const {s,scope,file,data}=fixture(t);
  data.unknownCollection=[{id:'same',amountCents:7,unknown:{preserve:true}},{id:'same',amountCents:9,unknown:{preserve:false}}];
  fs.writeFileSync(file,JSON.stringify(data));const report=importLegacy(s,scope,file);
  assert.equal(canonical(loadState(s,scope).state),canonical(data));
  assert.equal(report.counts.unknownCollection,2);assert.equal(report.topLevelIdDigests.unknownCollection.count,2);
  assert.equal(report.centsByPath['unknownCollection[].amountCents'],'16');
  assert.equal(s.db.prepare("SELECT count(*) n FROM entity_index WHERE kind='unknownCollection'").get().n,0);
});
