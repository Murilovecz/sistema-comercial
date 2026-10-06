'use strict';
// Read-only checker: deliberately does not instantiate SqlStore (would migrate).
const path=require('node:path'),fs=require('node:fs');
const {DatabaseSync}=require('node:sqlite');
const {verifyCommercial}=require('../foundation/commercial-store');
function verifyFile(filename){
 if(!filename||!fs.existsSync(filename))throw Error('Informe um banco SQLite existente.');
 const db=new DatabaseSync(path.resolve(filename),{readOnly:true});
 try{db.exec('BEGIN');const report=verifyCommercial({db});db.exec('ROLLBACK');return report;}finally{db.close();}
}
if(require.main===module){try{const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--database')throw Error('Uso: node scripts/verify-commercial.js --database CAMINHO_SQLITE');process.stdout.write(JSON.stringify(verifyFile(args[1]),null,2)+'\n');}catch(error){process.stderr.write((error.code==='COMMERCIAL_DIVERGENCE'?error.message:'Não foi possível conferir o banco; verifique caminho, schema e equivalência.')+'\n');process.exitCode=1;}}
module.exports={verifyFile};
