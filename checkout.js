const {randomUUID}=require('crypto');
const {checkoutPreview}=require('./public/checkout-core');
const {validDay}=require('./public/reports');
function applyCheckout(s,input,date){
 if(input.pos!==undefined){if(!input.pos||typeof input.pos!=='object'||typeof input.pos.station!=='string'||typeof input.pos.shift!=='string'||input.pos.station.length>80||input.pos.shift.length>80)throw Error('Estação ou turno inválido.');s.pos={station:input.pos.station.trim(),shift:input.pos.shift.trim()};}
 if(input.checkoutPayments===undefined)return;
 if(typeof input.allowPending!=='boolean')throw Error('Escolha se o saldo ficará a receber.');
 const preview=checkoutPreview(s.totalCents,s.storeCreditCents||0,input.checkoutPayments,input.allowPending);
 if(preview.remainingCents&&!s.customerId)throw Error('Saldo a receber exige cliente identificado.');
 if(preview.remainingCents&&input.dueDate&&!validDay(input.dueDate))throw Error('Informe um vencimento real.');
 s.paymentStatus=preview.status;s.receivedAt=preview.status==='received'?date:null;s.dueDate=preview.remainingCents?input.dueDate||null:null;
 s.checkout={...preview,lines:undefined,recordedAt:date};
 s.receipts=preview.lines.map(line=>({id:randomUUID(),saleId:s.id,requestId:null,date,cashSessionId:null,...line}));s.checkout.receiptIds=s.receipts.map(r=>r.id);
}
module.exports={applyCheckout};
