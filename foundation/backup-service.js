'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createHash,randomUUID}=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const {backupLocal}=require('../scripts/backup-local-sql');
const {guardDatabasePath}=require('./config');
const PACKAGE=/^bkp-\d{14}-[a-f0-9-]{36}$/;
const failure=()=>new Error('Não foi possível criar ou validar o backup local. Confira a configuração e os arquivos isolados.');
function same(a,b){return process.platform==='win32'?a.toLowerCase()===b.toLowerCase():a===b;}
function inside(child,parent){const relative=path.relative(parent,child);return !relative||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative));}
function safePath(value){
 if(typeof value!=='string'||!value.trim())throw Error('Informe um caminho local explícito.');
 const absolute=path.resolve(value);let current=absolute;
 while(true){let stat;try{stat=fs.lstatSync(current);}catch(error){if(error.code!=='ENOENT')throw error;}if(stat?.isSymbolicLink())throw Error('Links simbólicos e junctions não são permitidos na recuperação.');const parent=path.dirname(current);if(parent===current)break;current=parent;}
 // Resolve existing ancestors, including Windows canonical casing.
 current=absolute;const suffix=[];while(!fs.existsSync(current)){const parent=path.dirname(current);if(parent===current)throw Error('O caminho local não possui raiz acessível.');suffix.unshift(path.basename(current));current=parent;}
 return path.join(fs.realpathSync(current),...suffix);
}
function number(value,defaultValue,min,max,label){const n=value===undefined?defaultValue:Number(value);if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('Configuração de backup inválida: '+label+'.');return n;}
function boolean(value,fallback){if(value===undefined)return fallback;if(value===true||value==='true'||value==='1')return true;if(value===false||value==='false'||value==='0')return false;throw Error('Habilitação do backup inválida.');}
function backupConfiguration(options={},environment='development',dataDir=path.join(__dirname,'../data')){
 const input=options.backup||{};if(typeof input!=='object'||Array.isArray(input))throw Error('Configuração de backup inválida.');
 const directory=safePath(input.directory??process.env.BACKUP_DIR??path.join(dataDir,'backups'));
 const enabled=boolean(input.enabled??process.env.BACKUP_ENABLED,environment!=='test');
 if(environment==='test'&&enabled)guardDatabasePath(directory,'test');
 return {enabled,directory,intervalMs:number(input.intervalMs??process.env.BACKUP_INTERVAL_MS,21600000,1000,2147483647,'intervalo'),retentionDays:number(input.retentionDays??process.env.BACKUP_RETENTION_DAYS,30,1,36500,'retenção'),minValid:number(input.minValid??process.env.BACKUP_MIN_VALID,3,1,10000,'mínimo válido'),environment};
}
function hashFile(filename){const fd=fs.openSync(filename,'r'),hash=createHash('sha256'),buffer=Buffer.allocUnsafe(1024*1024);try{let size;while((size=fs.readSync(fd,buffer,0,buffer.length,null)))hash.update(buffer.subarray(0,size));return hash.digest('hex');}finally{fs.closeSync(fd);}}
function schemaRows(db){return db.prepare('SELECT version,checksum FROM schema_migrations ORDER BY version').all().map(r=>({version:r.version,checksum:r.checksum}));}
function verifySchema(schema){
 if(!Array.isArray(schema)||!schema.length)throw failure();
 const root=path.join(__dirname,'migrations'),known=fs.readdirSync(root).filter(n=>/^\d+_[a-z0-9_]+\.sql$/.test(n)).sort();
 for(let i=0;i<schema.length;i++){const r=schema[i];if(!r||r.version!==known[i]||r.checksum!==createHash('sha256').update(fs.readFileSync(path.join(root,r.version),'utf8')).digest('hex'))throw Error('Schema de backup desconhecido ou incompatível.');}
}
function inspectDatabase(filename){
 const db=new DatabaseSync(filename,{readOnly:true});
 try{if(db.prepare('PRAGMA journal_mode').get().journal_mode!=='delete')throw failure();const integrity=db.prepare('PRAGMA integrity_check').all();if(integrity.length!==1||Object.values(integrity[0])[0]!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw failure();const schema=schemaRows(db);verifySchema(schema);return {schema,validation:{integrity:'ok',foreignKeys:'ok',scopes:db.prepare('SELECT count(*) n FROM unit_states').get().n}};}finally{db.close();}
}
function validatePackage(packageDir,options={}){
 const directory=safePath(packageDir),id=options.expectedId||path.basename(directory);
 if(!PACKAGE.test(id)||!fs.statSync(directory).isDirectory())throw failure();
 const manifestFile=safePath(path.join(directory,'manifest.json')),databaseFile=safePath(path.join(directory,'database.sqlite'));
 for(const suffix of ['-wal','-shm','-journal'])if(fs.existsSync(safePath(databaseFile+suffix)))throw failure();
 if(!fs.statSync(manifestFile).isFile()||fs.statSync(manifestFile).size>1024*1024||!fs.statSync(databaseFile).isFile())throw failure();
 const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
 if(manifest.formatVersion!==1||manifest.id!==id||typeof manifest.appVersion!=='string'||!Number.isFinite(Date.parse(manifest.createdAt))||!id.startsWith('bkp-'+new Date(manifest.createdAt).toISOString().replace(/\D/g,'').slice(0,14)+'-')||manifest.database?.filename!=='database.sqlite'||manifest.database.sizeBytes!==fs.statSync(databaseFile).size||manifest.database.sha256!==hashFile(databaseFile))throw failure();
 const checked=inspectDatabase(databaseFile);
 if(JSON.stringify(checked.schema)!==JSON.stringify(manifest.schema)||JSON.stringify(checked.validation)!==JSON.stringify(manifest.validation))throw failure();
 return {directory,databaseFile,manifest};
}
class BackupService{
 constructor(options){
  this.source=options.source===':memory:'?':memory:':safePath(options.source);
  this.config=backupConfiguration({backup:options},options.environment||'development',path.dirname(this.source));
  if(this.source===':memory:')this.config.enabled=false;
  if(this.config.environment==='test'&&this.source!==':memory:')guardDatabasePath(this.source,'test');
  if(same(this.source,this.config.directory)||inside(this.source,this.config.directory))throw Error('A pasta de backup não pode conter o banco de origem.');
  this.onEvent=typeof options.onEvent==='function'?options.onEvent:()=>{};this.now=options.now||(()=>new Date());
  this.last={running:false,lastSuccessAt:null,lastFailureAt:null,lastError:null,validCount:0};this.timer=null;this.initial=null;
 }
 status(){return {...this.last,enabled:this.config.enabled};}
 event(type,value){try{this.onEvent({type,...value});}catch{/* Observer failure cannot invalidate a completed backup. */}}
 start(){if(!this.config.enabled||this.timer)return;this.initial=setImmediate(()=>{this.initial=null;void this.runNow().catch(()=>{});});this.initial.unref();this.timer=setInterval(()=>void this.runNow().catch(()=>{}),this.config.intervalMs);this.timer.unref();}
 stop(){if(this.timer)clearInterval(this.timer);if(this.initial)clearImmediate(this.initial);this.timer=null;this.initial=null;}
 async locked(action){
  if(this.source===':memory:')throw Error('Banco em memória não possui backup operacional.');
  let root,lock,fd;try{root=safePath(this.config.directory);fs.mkdirSync(root,{recursive:true});lock=path.join(root,'.backup.lock');safePath(lock);fd=fs.openSync(lock,'wx',0o600);}catch{this.last.lastFailureAt=this.now().toISOString();this.last.lastError='Pasta de backup ocupada ou indisponível.';this.event('backup.failed',{at:this.last.lastFailureAt,error:this.last.lastError});throw Error(this.last.lastError);}
  try{fs.writeFileSync(fd,JSON.stringify({pid:process.pid,createdAt:this.now().toISOString()}));this.last.running=true;return await action(root);}catch{this.last.lastFailureAt=this.now().toISOString();this.last.lastError='Falha na geração, retenção ou validação do backup local.';this.event('backup.failed',{at:this.last.lastFailureAt,error:this.last.lastError});throw failure();}finally{this.last.running=false;fs.closeSync(fd);fs.unlinkSync(lock);}
 }
 async runNow(){return this.locked(async root=>{
  const at=this.now().toISOString(),id='bkp-'+at.replace(/\D/g,'').slice(0,14)+'-'+randomUUID(),temporary=path.join(root,id+'.tmp'),final=path.join(root,id);
  fs.mkdirSync(temporary,{mode:0o700});
  try{
   const database=path.join(temporary,'database.sqlite');await backupLocal(safePath(this.source),database);
   // The live source stays in WAL. Seal only the standalone copy so validation
   // never depends on mutable sidecars outside the checksummed database file.
   const sealed=new DatabaseSync(database);try{sealed.exec('PRAGMA journal_mode=DELETE;');}finally{sealed.close();}
   const checked=inspectDatabase(database),manifest={formatVersion:1,id,createdAt:at,appVersion:require('../package.json').version,database:{filename:'database.sqlite',sizeBytes:fs.statSync(database).size,sha256:hashFile(database)},...checked};
   fs.writeFileSync(path.join(temporary,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx',mode:0o600});validatePackage(temporary,{expectedId:id});
   fs.renameSync(temporary,final);this.last.lastSuccessAt=at;this.last.lastError=null;this.event('backup.created',{at,id});
   const retention=this.purgeLocked(root);return {id,createdAt:at,manifest,retention};
  }catch(error){this.event('backup.incomplete',{at,id});throw error;}
 });}
 purgeLocked(root){
  const valid=[],invalid=[];for(const name of fs.readdirSync(root)){if(!PACKAGE.test(name))continue;try{const value=validatePackage(path.join(root,name));valid.push(value);}catch{invalid.push(name);}}
  valid.sort((a,b)=>Date.parse(b.manifest.createdAt)-Date.parse(a.manifest.createdAt)||b.manifest.id.localeCompare(a.manifest.id));
  const cutoff=this.now().getTime()-this.config.retentionDays*86400000,removed=[];
  for(let i=this.config.minValid;i<valid.length;i++){
   const entry=valid[i];if(Date.parse(entry.manifest.createdAt)>=cutoff)continue;
   // Only exact owned files: never recursively delete directories or unknown contents.
   const directory=safePath(entry.directory);if(!inside(directory,root)||same(directory,root))throw failure();
   const files=fs.readdirSync(directory);if(files.some(n=>!['database.sqlite','manifest.json'].includes(n)))continue;
   validatePackage(directory);for(const name of ['database.sqlite','manifest.json']){const target=safePath(path.join(directory,name));if(!inside(target,root))throw failure();fs.unlinkSync(target);}fs.rmdirSync(directory);removed.push(entry.manifest.id);
  }
  this.last.validCount=valid.length-removed.length;
  this.event('backup.retention',{at:this.now().toISOString(),removed:removed.length,invalid:invalid.length,valid:this.last.validCount});return {removed,invalid,validCount:this.last.validCount};
 }
 async purge(){return this.locked(root=>this.purgeLocked(root));}
}
function restoreBackup(packageDir,target){
 const source=validatePackage(packageDir),destination=safePath(target),operational=safePath(path.join(__dirname,'../data')),reportFile=safePath(destination+'.restore-report.json');
 if(inside(destination,operational)||(process.env.DATA_DIR&&inside(destination,safePath(process.env.DATA_DIR)))||inside(destination,source.directory)||fs.existsSync(reportFile)||same(destination,source.databaseFile))throw Error('Restore exige destino novo e isolado, fora dos dados operacionais.');
 for(const suffix of ['','-wal','-shm','-journal'])if(fs.existsSync(safePath(destination+suffix)))throw Error('Restore exige destino novo e isolado, incluindo seus arquivos auxiliares.');
 fs.mkdirSync(path.dirname(destination),{recursive:true});let created=false;
 try{
  fs.copyFileSync(source.databaseFile,destination,fs.constants.COPYFILE_EXCL);created=true;
  if(hashFile(destination)!==source.manifest.database.sha256)throw failure();const checked=inspectDatabase(destination);
  if(JSON.stringify(checked.schema)!==JSON.stringify(source.manifest.schema)||JSON.stringify(checked.validation)!==JSON.stringify(source.manifest.validation))throw failure();
  const report={formatVersion:1,restoredAt:new Date().toISOString(),backupId:source.manifest.id,appVersion:source.manifest.appVersion,sha256:hashFile(destination),...checked,isolated:true};
  fs.writeFileSync(reportFile,JSON.stringify(report,null,2),{flag:'wx',mode:0o600});return report;
 }catch(error){if(created)fs.unlinkSync(destination);throw error;}
}
module.exports={BackupService,backupConfiguration,validatePackage,restoreBackup};
