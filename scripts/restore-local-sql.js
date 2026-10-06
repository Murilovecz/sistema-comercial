'use strict';
const {restoreBackup}=require('../foundation/backup-service');
if(require.main===module){const [source,target,...extra]=process.argv.slice(2);if(!source||!target||extra.length){console.error('Uso: node scripts/restore-local-sql.js PASTA_DO_BACKUP DESTINO_NOVO.sqlite');process.exitCode=1;}else{try{console.log(JSON.stringify(restoreBackup(source,target)));}catch{console.error('Restauração recusada ou não concluída. Utilize backup válido e destino novo isolado; o banco operacional foi preservado.');process.exitCode=1;}}}
module.exports={restoreBackup};
