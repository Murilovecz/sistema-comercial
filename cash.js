const {randomUUID}=require('node:crypto');
const {moneyCents}=require('./money');
const {cashSummary,openCash}=require('./public/cash-core');
const {receiptList}=require('./public/payments');
function text(value,max=200){const v=String(value??'').trim();if(v.length>max)throw Error('Texto muito longo.');return v;}
function validateKey(key){if(key!==undefined&&key!==null&&(typeof key!=='string'||!key.trim()||key.length>80))throw Error('Identificação da confirmação inválida.');}
function checkCash(session){const summary=cashSummary(session);if(!Number.isSafeInteger(summary.expectedCents)||summary.expectedCents<0||!Number.isSafeInteger(summary.entriesCents)||!Number.isSafeInteger(summary.exitsCents)||Object.values(summary.totals).some(v=>!Number.isSafeInteger(v)))throw Error('Valor do Caixa fora do limite permitido.');}
function assertCashState(state,expected){const current=openCash(state)?.id||null;if(expected!==undefined&&expected!==current)throw Error('O Caixa mudou. Atualize e revise a operação.');}
function linkReceipt(state,s,r){const c=openCash(state);if(!c)return;r.cashSessionId=c.id;c.movements.push({id:randomUUID(),type:'receipt',paymentMethod:r.paymentMethod,amountCents:r.amountCents,date:r.date,referenceId:s.id,receiptId:r.id,note:'Recebimento de '+s.customerName});checkCash(c);}
function linkExpense(state,e,input){
 if(!input.cashSessionId)return;
 const c=openCash(state);if(!c||c.id!==input.cashSessionId)throw Error('O Caixa mudou. Atualize e revise a despesa.');
 const {calendarDay}=require('./public/reports');
 if(e.paymentMethod!=='cash'||e.paidDate!==calendarDay())throw Error('Somente despesa em dinheiro paga hoje pode sair deste Caixa.');
 if(e.amountCents>cashSummary(c).expectedCents)throw Error('Dinheiro insuficiente no Caixa.');
 e.cashSessionId=c.id;c.movements.push({id:randomUUID(),type:'expense',paymentMethod:'cash',amountCents:e.amountCents,date:e.createdAt,referenceId:e.id,note:e.description});checkCash(c);
}
function cashAction(state,route,input){
 validateKey(input.requestId);const next=structuredClone(state);next.cashSessions||=[];next.cashCommands||=[];
 const amountCents=moneyCents(route==='open'?input.openingValue:route==='close'?input.countedValue:input.value,route==='open'||route==='close');
 const note=text(input.note,500),responsible=text(input.responsible,120);
 const signature=JSON.stringify({route,sessionId:(input.cashSessionId??input.sessionId)||null,amountCents,note,responsible,saleId:input.saleId||null});
 const prior=input.requestId&&next.cashCommands.find(c=>c.requestId===input.requestId);
 if(prior){if(prior.signature!==signature)throw Error('Esta confirmação já foi usada com outros dados.');return next;}
 const date=new Date().toISOString();
 if(route==='open'){
  if(openCash(next))throw Error('Já existe um Caixa aberto.');if(!responsible)throw Error('Informe o responsável pela abertura.');
  next.cashSessions.push({id:randomUUID(),openedAt:date,openedBy:responsible,openingCents:amountCents,closedAt:null,movements:[]});
 }else{
  const c=next.cashSessions.find(c=>c.id===(input.cashSessionId??input.sessionId));if(!c||c.closedAt)throw Error('Este Caixa está fechado ou não existe. Atualize os dados.');
  const summary=cashSummary(c);
  if(input.expectedCents!==undefined&&input.expectedCents!==summary.expectedCents)throw Error('O saldo do Caixa mudou. Atualize e revise a operação.');
  if(route==='close'){
   const differenceCents=amountCents-summary.expectedCents;if(differenceCents&&!note)throw Error('Explique a diferença entre o dinheiro contado e esperado.');if(!responsible)throw Error('Informe o responsável pelo fechamento.');
   c.closedAt=date;c.closedBy=responsible;c.closing={expectedCents:summary.expectedCents,countedCents:amountCents,differenceCents,note,totals:summary.totals};
  }else{
   if(!['supply','withdraw','refund'].includes(route))throw Error('Operação de Caixa inválida.');
   if(!note)throw Error('Informe o motivo da movimentação.');
   if(route!=='supply'&&amountCents>summary.expectedCents)throw Error('Dinheiro insuficiente no Caixa.');
   const m={id:randomUUID(),type:route,paymentMethod:'cash',amountCents,date,note,referenceId:null};
   if(route==='refund'){
    const sale=next.sales.find(s=>s.id===input.saleId);if(!sale?.cancelledAt)throw Error('Selecione uma venda cancelada.');
    const cashReceived=receiptList(sale).filter(r=>r.paymentMethod==='cash').reduce((sum,r)=>sum+r.amountCents,0),refunded=(sale.refunds||[]).reduce((sum,r)=>sum+r.amountCents,0);
    if(amountCents>cashReceived-refunded)throw Error('A devolução ultrapassa o dinheiro recebido ainda não devolvido.');
    m.referenceId=sale.id;sale.refunds||=[];sale.refunds.push({id:m.id,amountCents,paymentMethod:'cash',date,cashSessionId:c.id,note});
   }
   c.movements.push(m);checkCash(c);
  }
 }
 if(input.requestId)next.cashCommands.push({requestId:input.requestId,signature,date});
 return next;
}
module.exports={cashAction,linkReceipt,linkExpense,assertCashState,validateKey};
