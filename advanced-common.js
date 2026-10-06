const {randomUUID}=require('node:crypto');
const {command,expectedVersion,nextNumber,safe}=require('./commands');
const {optional}=require('./domain');
const {validDay}=require('./public/reports');
const {moneyCents}=require('./money');

function text(value,max,label,required=false){
 if(value!==undefined&&value!==null&&typeof value!=='string')throw Error(label+' deve ser um texto.');
 const result=optional(value,max);if(required&&!result)throw Error('Informe '+label.toLowerCase()+'.');return result;
}
function integer(value,label,min=1,max=Number.MAX_SAFE_INTEGER){
 if(!['string','number'].includes(typeof value)||typeof value==='string'&&!/^\d+$/.test(value.trim()))throw Error(label+' deve ser inteiro.');
 const result=Number(value);if(!Number.isSafeInteger(result)||result<min||result>max)throw Error(label+' fora do intervalo permitido.');return result;
}
function dateOnly(value,label,required=false){const result=text(value,10,label,required);if(result&&!validDay(result))throw Error(label+' deve ser uma data real.');return result||null;}
function items(value,key='productId',limit=500){
 if(!Array.isArray(value)||!value.length||value.length>limit)throw Error('Selecione de 1 a '+limit+' itens.');
 const seen=new Set();for(const row of value){if(!row||typeof row[key]!=='string'||!row[key]||seen.has(row[key]))throw Error('Item repetido ou inválido.');seen.add(row[key]);}return value;
}
function record(state,kind,id,active=false){const result=(state[kind]||[]).find(row=>row.id===id);if(!result||active&&result.active===false)throw Error('Cadastro não encontrado ou inativo: '+kind);return result;}
function reason(input){return text(input.reason,1000,'Motivo',true);}
function baseRecord(state,kind,date,input,fields){return {id:randomUUID(),number:nextNumber(state[kind]||[]),version:1,date,updatedAt:date,responsible:text(input.responsible,120,'Responsável'),history:[{date,action:'create',responsible:text(input.responsible,120,'Responsável')}],...fields};}
function touch(row,date,action,input,details={}){row.version++;row.updatedAt=date;row.history||=[];row.history.push({date,action,responsible:text(input.responsible,120,'Responsável'),reason:input.reason?reason(input):'',...details});}
function expected(row,input){expectedVersion(row,input,'Este registro');}
function cents(value,zero=false){return moneyCents(value,zero);}
function run(state,kind,action,input,fn){return command(state,'advanced/'+kind,action,input,(next,date)=>{next[kind]||=[];fn(next,date);});}
module.exports={text,integer,dateOnly,items,record,reason,baseRecord,touch,expected,cents,run,safe};
