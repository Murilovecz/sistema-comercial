'use strict';
const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync,backup}=require('node:sqlite');
const {createHash}=require('node:crypto');
async function backupLocal(source,target){
 const original=path.resolve(source),destination=path.resolve(target);
 if(original.toLowerCase()===destination.toLowerCase()||!fs.existsSync(original)||fs.existsSync(destination))throw Error('Informe origem existente e destino novo, diferentes.');
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 const db=new DatabaseSync(original,{readOnly:true});
 try{await backup(db,destination);}finally{db.close();}
 const copy=new DatabaseSync(destination,{readOnly:true});
 try{
  const check=copy.prepare('PRAGMA integrity_check').all();if(check.length!==1||Object.values(check[0])[0]!=='ok')throw Error('Cópia SQL não passou na conferência de integridade.');
  if(copy.prepare('PRAGMA foreign_key_check').all().length)throw Error('Cópia SQL possui referências inválidas.');
  return{date:new Date().toISOString(),integrity:'ok',foreignKeys:'ok',sha256:createHash('sha256').update(fs.readFileSync(destination)).digest('hex'),migrations:copy.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(r=>r.version),scopes:copy.prepare('SELECT count(*) n FROM unit_states').get().n};
 }finally{copy.close();}
}
if(require.main===module){const [source,target]=process.argv.slice(2);if(!source||!target){console.error('Uso: node scripts/backup-local-sql.js ORIGEM DESTINO_NOVO');process.exitCode=1;}else backupLocal(source,target).then(report=>{fs.writeFileSync(target+'.report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}).catch(()=>{console.error('Não foi possível concluir e conferir a cópia SQL. A origem foi preservada.');process.exitCode=1;});}
module.exports={backupLocal};
