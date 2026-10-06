'use strict';

const fs=require('node:fs'),path=require('node:path');
const {SqlStore}=require('../foundation/sql-store');
const {createCompany,createUnit}=require('../foundation/entities');
const {importLegacy}=require('../foundation/migration');
const {AppError}=require('../foundation/errors');
const {guardDatabasePath}=require('../foundation/config');

function options(argv) {
  const known=new Set(['source','database','company-name','unit-name']);
  const values={};
  for(let i=0;i<argv.length;i++) {
    const key=argv[i];
    if(!key.startsWith('--')||!known.has(key.slice(2))||Object.hasOwn(values,key.slice(2))) throw Error('Argumento desconhecido ou repetido. Use --source --database --company-name --unit-name.');
    const value=argv[++i];if(!value||value.startsWith('--')) throw Error('Informe um valor para '+key+'.');
    values[key.slice(2)]=value;
  }
  for(const key of known) if(!values[key]) throw Error('Informe --'+key+' explicitamente.');
  return values;
}
function migrate(argv) {
  const input=options(argv),source=path.resolve(input.source),database=path.resolve(input.database);
  if(!fs.existsSync(source)||!fs.statSync(source).isFile()) throw Error('Origem não encontrada ou não é um arquivo.');
  guardDatabasePath(database,'test');
  const sourceReal=fs.realpathSync(source),targetReal=fs.existsSync(database)?fs.realpathSync(database):database;
  const normalize=p=>process.platform==='win32'?p.toLowerCase():p;
  const sourceStat=fs.statSync(source),targetStat=fs.existsSync(database)?fs.statSync(database):null;
  if(normalize(sourceReal)===normalize(targetReal)||targetStat&&targetStat.dev===sourceStat.dev&&targetStat.ino===sourceStat.ino) throw Error('Origem e destino precisam ser arquivos diferentes.');
  const store=new SqlStore(database,{environment:'test'});
  try {
    return store.transaction(()=>{
      const companies=store.db.prepare('SELECT * FROM companies').all(),units=store.db.prepare('SELECT * FROM units').all();
      let company,unit;
      if(!companies.length&&!units.length) {
        if(store.db.prepare('SELECT count(*) n FROM users').get().n) throw new AppError(409,'MIGRATION_CONTEXT_REQUIRED','Banco com usuários requer seleção explícita de contexto, não criação automática.');
        company=createCompany(store,{name:input['company-name']});unit=createUnit(store,company.id,{name:input['unit-name']});
      } else {
        if(companies.length!==1||units.length!==1||companies[0].name!==input['company-name']||units[0].name!==input['unit-name']||units[0].company_id!==companies[0].id) throw new AppError(409,'MIGRATION_CONTEXT_REQUIRED','Banco com contexto diferente ou múltiplo exige revisão explícita.');
        company=companies[0];unit=units[0];
      }
      return importLegacy(store,{companyId:company.id,unitId:unit.id},source);
    });
  } finally {store.close();}
}
if(require.main===module) {
  try {process.stdout.write(JSON.stringify(migrate(process.argv.slice(2)),null,2)+'\n');}
  catch(error) {process.stderr.write(JSON.stringify({error:error.message,code:error.code||'MIGRATION_FAILED',status:error.status||422})+'\n');process.exitCode=1;}
}
module.exports={migrate,options};
