'use strict';
const path=require('node:path');
const fs=require('node:fs');
function resolvedPath(value){let current=path.resolve(value),suffix=[];while(!fs.existsSync(current)){suffix.unshift(path.basename(current));const parent=path.dirname(current);if(parent===current)break;current=parent;}const result=path.join(fs.existsSync(current)?fs.realpathSync(current):current,...suffix);return process.platform==='win32'?result.toLowerCase():result;}
function guardDatabasePath(filename,environment){
 if(filename===':memory:')return;
 const operational=resolvedPath(path.join(__dirname,'../data')),target=resolvedPath(filename);
 if(environment==='test'&&(target===operational||target.startsWith(operational+path.sep)))throw Error('Testes não podem abrir a pasta operacional.');
}
function configuration(options={}) {
 const environment=options.environment||process.env.APP_ENV||process.env.NODE_ENV||'development';
 if(!['development','test'].includes(environment))throw Error('Fundação V1 é local; ambiente de produção ainda não habilitado.');
 const dataDir=path.resolve(options.dataDir||process.env.DATA_DIR||path.join(__dirname,'../data'));
 const filename=options.filename||process.env.SQL_FILE||path.join(dataDir,'foundation.sqlite');
 if(environment==='test'&&!options.filename&&!process.env.SQL_FILE&&!options.dataDir&&!process.env.DATA_DIR)throw Error('Testes exigem configuração explícita de banco isolado.');
 guardDatabasePath(filename,environment);
 return {environment,dataDir,filename,legacyFile:path.join(dataDir,'database.json')};
}
module.exports={configuration,guardDatabasePath};
