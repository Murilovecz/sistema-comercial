'use strict';
const fs=require('node:fs');const path=require('node:path');const{randomBytes}=require('node:crypto');
const{configuration}=require('./config');const{SqlStore}=require('./sql-store');const{seedPermissions}=require('./rbac');
const{createCompany,createUnit}=require('./entities');const{readDatabase}=require('../storage');const{Identity}=require('./identity');const{appendAudit}=require('./audit');
function createRuntime(options={}){
 const config=configuration(options),store=options.store||new SqlStore(config.filename,{environment:config.environment});
 try{
  seedPermissions(store);
  if(options.importLegacy!==false&&!store.meta('initial_import_complete')){
   const source=readDatabase(options.legacyFile||config.legacyFile);
   store.transaction(()=>{
    if(store.db.prepare('SELECT count(*) n FROM companies').get().n)throw Error('A importação inicial exige um banco novo; use a ferramenta explícita para outro contexto.');
    const c=createCompany(store,{name:source.company?.name||'Minha empresa'}),u=createUnit(store,c.id,{name:'Unidade inicial'});
    if(fs.existsSync(options.legacyFile||config.legacyFile))require('./migration').importLegacy(store,{companyId:c.id,unitId:u.id},options.legacyFile||config.legacyFile);
    else require('./state-repository').writeState(store,{companyId:c.id,unitId:u.id},source,0);
    store.setMeta('initial_import_complete','1');
   });
  }
  // Prepare existing unit snapshots before the server can accept any request.
  // This never refreshes SQL from an already normalized, divergent mirror.
  require('./commercial-store').normalizeAllCommercial(store);
  let pairingToken=options.pairingToken;
  if(!store.db.prepare('SELECT count(*) n FROM users').get().n&&!pairingToken){
   if(config.environment==='test')throw Error('Testes precisam de código de instalação explícito.');
   pairingToken=randomBytes(32).toString('base64url');fs.mkdirSync(config.dataDir,{recursive:true});
   fs.writeFileSync(path.join(config.dataDir,'PRIMEIRO-ACESSO.txt'),'Código de instalação (privado):\n'+pairingToken+'\n\nAbra o sistema neste computador e use este código para criar seu login e sua senha.\nO código muda ao reiniciar antes da configuração. Não publique este arquivo.\n',{mode:0o600});
  }
  const identity=new Identity(store,{...options.identity,pairingToken,audit:event=>appendAudit(store,event)});
  require('./inactive-sale-approval').registerApprovalIdentity(store,identity);
  const runtime={config,store,identity};
  const {BackupService,backupConfiguration}=require('./backup-service');
  config.backup=backupConfiguration(options,config.environment,config.dataDir);
  runtime.backupService=new BackupService({source:config.filename,...config.backup,onEvent:event=>{
   if(event.type==='backup.failed')console.error('Backup local falhou; confira o estado operacional e a pasta de backups.');
   if(options.onBackupEvent)options.onBackupEvent(event);
  }});
  runtime.authMaintenance=require('./auth-maintenance').startMaintenance(runtime,options.authMaintenance||{});
  runtime.backupService.start();
  runtime.close=()=>{runtime.authMaintenance.stop();runtime.backupService.stop();if(!options.store)store.close();};
  return runtime;
 }catch(error){if(!options.store)store.close();throw error;}
}
module.exports={createRuntime};
