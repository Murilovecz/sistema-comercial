const {randomUUID,createHash}=require('node:crypto');
const {validateKey}=require('./cash');
function command(state,scope,action,input,execute){
 validateKey(input.requestId);if(!input.requestId)throw Error('Revise esta operação antes de confirmar.');
 const next=structuredClone(state);next.operationCommands||=[];
 const signature=createHash('sha256').update(JSON.stringify({scope,action,input})).digest('hex');
 const prior=next.operationCommands.find(c=>c.requestId===input.requestId);
 if(prior){if(prior.signature!==signature)throw Error('Esta confirmação já foi usada com outros dados.');return next;}
 execute(next,new Date().toISOString());
 next.operationCommands.push({id:randomUUID(),requestId:input.requestId,signature,scope,action,date:new Date().toISOString()});
 return next;
}
function expectedVersion(record,input,label='Este registro'){
 if(!record)throw Error(label+' não encontrado.');
 if(record.version!==input.expectedVersion)throw Error(label+' mudou em outra janela. Seu preenchimento foi mantido; atualize os dados e revise novamente.');
}
function nextNumber(records){const number=records.reduce((n,r)=>Math.max(n,r.number||0),0)+1;if(!Number.isSafeInteger(number))throw Error('Limite de identificação atingido.');return number;}
function safe(value,label='Valor'){if(!Number.isSafeInteger(value))throw Error(label+' fora do limite permitido.');return value;}
module.exports={command,expectedVersion,nextNumber,safe};
