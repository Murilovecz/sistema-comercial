'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),{createHash}=require('node:crypto');
const {SqlStore}=require('./sql-store'),{DatabaseSync}=require('node:sqlite');
const {createCompany,createUnit}=require('./entities'),{writeState}=require('./state-repository'),{appendAudit,verifyAuditChain}=require('./audit');
const {verifyFile}=require('../scripts/verify-commercial');
const {BackupService,backupConfiguration,validatePackage,restoreBackup}=require('./backup-service');
function fixture(t,extra={}){
 const parent=path.join(__dirname,'../.qa/foundation-v1-2/backup-tests');fs.mkdirSync(parent,{recursive:true});
 const dir=fs.mkdtempSync(path.join(parent,'synthetic-')),source=path.join(dir,'source.sqlite'),directory=path.join(dir,'backups'),store=new SqlStore(source,{environment:'test'});
 const company=createCompany(store,{name:'Empresa sintética'}),unit=createUnit(store,company.id,{name:'Unidade sintética'}),scope={companyId:company.id,unitId:unit.id};
 store.transaction(()=>{writeState(store,scope,{products:[{id:'p',name:'Produto sintético',stock:2,priceCents:123,custom:{preserve:true}}],customers:[{id:'c',name:'Cliente sintético',note:null}],suppliers:[],purchases:[],sales:[]},0);store.db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run('actor','Pessoa sintética','backup-actor','synthetic-hash','active','2026','2026');appendAudit(store,{...scope,userId:'actor',action:'test.backup',entity:'products',recordId:'p',after:{stock:2},reason:'Ensaio sintético'});});
 const service=new BackupService({source,directory,environment:'test',enabled:false,...extra});t.after(()=>{service.stop();store.close();});return {dir,source,directory,store,scope,service};
}
test('configuração valida limites, testes desabilitados e pasta isolada',()=>{
 const config=backupConfiguration({},'test',path.join(__dirname,'../.qa/foundation-v1-2'));assert.equal(config.enabled,false);assert.equal(config.intervalMs,21600000);assert.equal(config.retentionDays,30);assert.equal(config.minValid,3);
 for(const backup of [{minValid:0},{intervalMs:0},{retentionDays:0},{enabled:'yes'}])assert.throws(()=>backupConfiguration({backup},'test',path.join(__dirname,'../.qa/foundation-v1-2')));
 assert.throws(()=>backupConfiguration({backup:{enabled:true,directory:path.join(__dirname,'../data/backups')}},'test'),/operacional/);
 const service=new BackupService({source:':memory:',directory:path.join(__dirname,'../.qa/foundation-v1-2/memory'),environment:'test',enabled:true});assert.equal(service.status().enabled,false);service.start();assert.equal(service.timer,null);
});
test('backup publicado captura WAL e preserva schema, hash, escopo e audit chain',async t=>{
 const f=fixture(t);assert.ok(fs.existsSync(f.source+'-wal'));const result=await f.service.runNow(),pkg=validatePackage(path.join(f.directory,result.id));assert.equal(pkg.manifest.formatVersion,1);assert.equal(pkg.manifest.validation.scopes,1);assert.ok(pkg.manifest.schema.length>=7);assert.equal(f.service.status().lastError,null);assert.equal(f.service.status().validCount,1);assert.equal(fs.existsSync(path.join(f.directory,'.backup.lock')),false);
 const copy=new DatabaseSync(pkg.databaseFile,{readOnly:true});try{for(const table of ['unit_states','users','commercial_products','commercial_customers','audit_events'])assert.deepEqual(copy.prepare('SELECT * FROM '+table).all(),f.store.db.prepare('SELECT * FROM '+table).all());assert.equal(verifyAuditChain({db:copy}),true);}finally{copy.close();}
});
test('restore real isolado verifica equivalência e identidade sem mudar original',async t=>{
 const f=fixture(t),result=await f.service.runNow(),pkg=path.join(f.directory,result.id),target=path.join(f.dir,'restored','foundation.sqlite'),report=restoreBackup(pkg,target);
 assert.equal(report.isolated,true);assert.equal(report.validation.integrity,'ok');assert.equal(report.validation.foreignKeys,'ok');assert.equal(verifyFile(target).units[0].equivalent,true);assert.ok(fs.existsSync(target+'.restore-report.json'));
 const copy=new DatabaseSync(target,{readOnly:true});try{assert.equal(copy.prepare('SELECT login FROM users').get().login,'backup-actor');assert.equal(verifyAuditChain({db:copy}),true);assert.deepEqual(copy.prepare('SELECT payload FROM unit_states').all(),f.store.db.prepare('SELECT payload FROM unit_states').all());}finally{copy.close();}
 const output=spawnSync(process.execPath,[path.join(__dirname,'../scripts/restore-local-sql.js'),pkg,path.join(f.dir,'cli-restore.sqlite')],{encoding:'utf8'});assert.equal(output.status,0,output.stderr);assert.equal(JSON.parse(output.stdout).validation.integrity,'ok');
});
test('restore recusa destino existente, pacote e dados operacionais',async t=>{
 const f=fixture(t),result=await f.service.runNow(),pkg=path.join(f.directory,result.id),before=f.store.db.prepare('SELECT payload FROM unit_states').get().payload;
 for(const target of [f.source,path.join(pkg,'other.sqlite'),path.join(__dirname,'../data/forbidden-v12-restore.sqlite')])assert.throws(()=>restoreBackup(pkg,target),/isolado/);
 assert.equal(f.store.db.prepare('SELECT payload FROM unit_states').get().payload,before);assert.equal(fs.existsSync(path.join(__dirname,'../data/forbidden-v12-restore.sqlite')),false);
});
test('checksum e manifest adulterados recusam restore sem publicar destino',async t=>{
 const f=fixture(t),result=await f.service.runNow(),pkg=path.join(f.directory,result.id),file=path.join(pkg,'manifest.json'),original=fs.readFileSync(file,'utf8'),manifest=JSON.parse(original);manifest.database.sha256='0'.repeat(64);fs.writeFileSync(file,JSON.stringify(manifest));assert.throws(()=>restoreBackup(pkg,path.join(f.dir,'invalid.sqlite')));assert.equal(fs.existsSync(path.join(f.dir,'invalid.sqlite')),false);fs.writeFileSync(file,original);fs.appendFileSync(path.join(pkg,'database.sqlite'),'corruption');assert.throws(()=>validatePackage(pkg));
});
test('schema divergente no manifest e schema desconhecido no banco são recusados',async t=>{
 const f=fixture(t),result=await f.service.runNow(),pkg=path.join(f.directory,result.id),file=path.join(pkg,'manifest.json'),original=fs.readFileSync(file,'utf8'),manifest=JSON.parse(original);manifest.schema[0].checksum='bad';fs.writeFileSync(file,JSON.stringify(manifest));assert.throws(()=>validatePackage(pkg));fs.writeFileSync(file,original);
 f.store.db.prepare("UPDATE schema_migrations SET checksum='bad' WHERE version=(SELECT min(version) FROM schema_migrations)").run();await assert.rejects(f.service.runNow());assert.equal(fs.readdirSync(f.directory).filter(n=>n.endsWith('.tmp')).length,1);assert.equal(fs.readdirSync(f.directory).filter(n=>/^bkp-/.test(n)&&!n.endsWith('.tmp')).length,1);
});
test('restore preserva sidecars preexistentes e recusa aliases auxiliares',async t=>{
 const f=fixture(t),result=await f.service.runNow(),pkg=path.join(f.directory,result.id);
 for(const suffix of ['-wal','-shm','-journal']){const target=path.join(f.dir,'existing'+suffix+'.sqlite'),sidecar=target+suffix;fs.writeFileSync(sidecar,'sentinel sintético');assert.throws(()=>restoreBackup(pkg,target),/auxiliares/);assert.equal(fs.readFileSync(sidecar,'utf8'),'sentinel sintético');assert.equal(fs.existsSync(target),false);}
 const target=path.join(f.dir,'auxiliary-alias.sqlite'),other=path.join(f.dir,'synthetic-sidecar-dir');fs.mkdirSync(other);fs.symlinkSync(other,target+'-wal','junction');t.after(()=>fs.rmdirSync(target+'-wal'));assert.throws(()=>restoreBackup(pkg,target),/Links/);assert.equal(fs.existsSync(target),false);
});
test('erro anterior à aquisição do lock é observável sem apagar conteúdo',async t=>{
 const events=[],f=fixture(t,{onEvent:event=>events.push(event)});fs.writeFileSync(f.directory,'Arquivo sintético preservado');await assert.rejects(f.service.runNow(),/indisponível/);assert.ok(f.service.status().lastFailureAt);assert.ok(events.some(e=>e.type==='backup.failed'));assert.equal(fs.readFileSync(f.directory,'utf8'),'Arquivo sintético preservado');
});
test('pacote selado recusa sidecar extra e alias antes de abrir SQLite',async t=>{
 const f=fixture(t),result=await f.service.runNow(),pkg=path.join(f.directory,result.id);
 for(const suffix of ['-wal','-shm','-journal']){const sidecar=path.join(pkg,'database.sqlite'+suffix);fs.writeFileSync(sidecar,'Sentinel sintético');assert.throws(()=>validatePackage(pkg));assert.equal(fs.readFileSync(sidecar,'utf8'),'Sentinel sintético');fs.unlinkSync(sidecar);}
 const alias=path.join(pkg,'database.sqlite-wal'),target=path.join(f.dir,'isolated-alias');fs.mkdirSync(target);fs.symlinkSync(target,alias,'junction');t.after(()=>fs.rmdirSync(alias));assert.throws(()=>validatePackage(pkg),/Links/);
});
test('raiz Windows indisponível falha sem loop de resolução',t=>{
 if(process.platform!=='win32')return;const drive=['Z:','Y:','X:'].find(d=>!fs.existsSync(d+path.sep));if(!drive)return;assert.throws(()=>backupConfiguration({backup:{directory:drive+path.sep+'synthetic-backup'}},'test'),/raiz acessível/);
});
test('foreign keys inválidas são recusadas mesmo com checksum recalculado',async t=>{
 const f=fixture(t),result=await f.service.runNow(),pkg=path.join(f.directory,result.id),file=path.join(pkg,'manifest.json'),database=path.join(pkg,'database.sqlite'),manifest=JSON.parse(fs.readFileSync(file,'utf8')),db=new DatabaseSync(database);try{db.exec('PRAGMA foreign_keys=OFF; DELETE FROM companies;');}finally{db.close();}manifest.database.sha256=createHash('sha256').update(fs.readFileSync(database)).digest('hex');manifest.database.sizeBytes=fs.statSync(database).size;fs.writeFileSync(file,JSON.stringify(manifest));assert.throws(()=>validatePackage(pkg));assert.throws(()=>restoreBackup(pkg,path.join(f.dir,'foreign-restore.sqlite')));assert.equal(fs.existsSync(path.join(f.dir,'foreign-restore.sqlite')),false);
});
test('pacote não pode depender de WAL externo fora do checksum',async t=>{
 const f=fixture(t),result=await f.service.runNow(),pkg=path.join(f.directory,result.id),database=path.join(pkg,'database.sqlite'),file=path.join(pkg,'manifest.json'),db=new DatabaseSync(database);try{db.exec('PRAGMA journal_mode=WAL;');}finally{db.close();}const manifest=JSON.parse(fs.readFileSync(file,'utf8'));manifest.database.sha256=createHash('sha256').update(fs.readFileSync(database)).digest('hex');manifest.database.sizeBytes=fs.statSync(database).size;fs.writeFileSync(file,JSON.stringify(manifest));assert.throws(()=>validatePackage(pkg));
});
test('retenção conta só válidos, preserva mínimo e ignora pacote inválido',async t=>{
 let now=new Date('2026-01-01T00:00:00Z');const f=fixture(t,{now:()=>now,minValid:2,retentionDays:1});const ids=[];
 for(let i=0;i<4;i++){ids.push((await f.service.runNow()).id);now=new Date(now.getTime()+1000);}
 const bad=path.join(f.directory,ids[0],'manifest.json');fs.writeFileSync(bad,'{}');now=new Date('2026-03-01T00:00:00Z');const purge=await f.service.purge();assert.equal(purge.validCount,2);assert.equal(purge.removed.length,1);assert.deepEqual(purge.invalid,[ids[0]]);assert.ok(fs.existsSync(bad));assert.equal(fs.existsSync(path.join(f.directory,ids[1])),false);
});
test('retenção jamais remove único backup válido e não apaga conteúdo desconhecido',async t=>{
 let now=new Date('2026-01-01T00:00:00Z');const f=fixture(t,{now:()=>now,minValid:1,retentionDays:1}),first=await f.service.runNow();now=new Date('2026-03-01T00:00:00Z');assert.equal((await f.service.purge()).removed.length,0);
 fs.writeFileSync(path.join(f.directory,first.id,'keep.txt'),'Arquivo não gerenciado');const second=await f.service.runNow();assert.ok(fs.existsSync(path.join(f.directory,first.id,'keep.txt')));assert.ok(fs.existsSync(path.join(f.directory,second.id)));assert.equal(f.service.status().validCount,2);
});
test('lock protege geração e purge concorrentes, com falha observável',async t=>{
 const events=[],f=fixture(t,{onEvent:e=>events.push(e)}),pending=f.service.runNow();await assert.rejects(f.service.purge(),/ocupada/);await assert.rejects(f.service.runNow(),/ocupada/);await pending;assert.ok(events.some(e=>e.type==='backup.failed'));assert.equal(fs.existsSync(path.join(f.directory,'.backup.lock')),false);
});
test('falha de origem preserva backups existentes e libera lock',async t=>{
 const f=fixture(t),first=await f.service.runNow(),missing=new BackupService({source:path.join(f.dir,'missing.sqlite'),directory:f.directory,environment:'test'});await assert.rejects(missing.runNow());assert.ok(validatePackage(path.join(f.directory,first.id)));assert.equal(missing.status().lastSuccessAt,null);assert.ok(missing.status().lastFailureAt);assert.equal(fs.existsSync(path.join(f.directory,'.backup.lock')),false);
});
test('agendamento inicial roda fora da criação e stop cancela próximas execuções',async t=>{
 let signal,timeout;const done=new Promise(resolve=>signal=resolve),f=fixture(t,{enabled:true,onEvent:event=>{if(event.type==='backup.created')signal(event);}});t.after(()=>clearTimeout(timeout));f.service.start();assert.equal(f.service.status().running,false);const event=await Promise.race([done,new Promise((_,reject)=>timeout=setTimeout(()=>reject(Error('Backup inicial ausente')),5000))]);clearTimeout(timeout);assert.equal(event.type,'backup.created');f.service.stop();assert.equal(f.service.timer,null);assert.equal(f.service.initial,null);
});
test('junction para dados operacionais ou pacote é recusada antes de gravação',async t=>{
 const f=fixture(t),link=path.join(f.dir,'alias'),synthetic=path.join(f.dir,'synthetic-link-target');fs.mkdirSync(synthetic);fs.symlinkSync(synthetic,link,'junction');t.after(()=>fs.rmdirSync(link));assert.throws(()=>new BackupService({source:f.source,directory:path.join(link,'backups'),environment:'test',enabled:true}),/Links/);
 const result=await f.service.runNow();assert.throws(()=>restoreBackup(path.join(f.directory,result.id),path.join(link,'new.sqlite')),/Links/);
});
