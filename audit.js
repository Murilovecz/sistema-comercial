const {randomUUID}=require('node:crypto');
function catalogVersion(record,input){if(input.expectedVersion!==(record.version||0))throw Error('Este cadastro mudou em outra janela. Seu preenchimento foi mantido; confira a versão atual antes de salvar.');}
function audit(state,kind,record,before,input,date=new Date().toISOString()){
 const keys=Object.keys(record).filter(k=>!['version','updatedAt'].includes(k)&&JSON.stringify(record[k])!==JSON.stringify(before?.[k]));
 if(!keys.length)return;
 state.auditLog||=[];state.auditLog.push({id:randomUUID(),kind,recordId:record.id,name:record.name||record.description||String(record.number),date,responsible:String(input.responsible||'Não declarado').trim().slice(0,120),changes:keys.map(field=>({field,before:before?.[field]??null,after:record[field]??null}))});
}
module.exports={catalogVersion,audit};
