const {randomUUID}=require('node:crypto');
const {moneyCents}=require('./money');
const {receiptList,paymentBalance}=require('./public/payments');
const {linkReceipt,assertCashState,validateKey}=require('./cash');
const methods=['cash','pix','debit','credit','other'];
function receive(state,input){
 validateKey(input.requestId);
 const next=structuredClone(state),s=next.sales.find(s=>s.id===input.id);
 if(!s)throw Error('Venda não encontrada.');
 const previous=input.requestId&&next.sales.flatMap(s=>s.receipts||[]).find(r=>r.requestId===input.requestId);
 if(previous){if(previous.saleId!==s.id||previous.amountCents!==(input.value===undefined?previous.amountCents:moneyCents(input.value))||previous.paymentMethod!==(input.paymentMethod||s.paymentMethod))throw Error('Esta confirmação já foi usada com outros dados.');return next;}
 if(s.activeAgreementId)throw Error('Saldo renegociado. Receba pelo acordo.');
 if(s.receivablePlan)throw Error('Esta venda tem parcelas. Use Contas a receber e revise a alocação do recebimento.');
 if(s.cancelledAt)throw Error('Não é possível receber uma venda cancelada.');
 assertCashState(next,input.expectedCashSessionId);
 const balance=paymentBalance(s);
 if(input.expectedRemainingCents!==undefined&&input.expectedRemainingCents!==balance.remainingCents)throw Error('O saldo da venda mudou. Atualize e revise o recebimento.');
 if(!balance.known)throw Error('Esta venda não tem uma pendência de pagamento registrada.');
 if(s.paymentStatus==='received'&&input.value===undefined)return next;
 const amountCents=input.value===undefined?balance.remainingCents:moneyCents(input.value);
 const paymentMethod=input.paymentMethod||s.paymentMethod;
 if(!methods.includes(paymentMethod))throw Error('Selecione uma forma de pagamento válida.');
 if(!Number.isSafeInteger(amountCents)||amountCents<=0||amountCents>balance.remainingCents)throw Error('O recebimento deve ser maior que zero e não ultrapassar o saldo restante. Atualize e revise os valores.');
 s.receipts=receiptList(s);const date=new Date().toISOString();
 const r={id:randomUUID(),saleId:s.id,requestId:input.requestId||null,amountCents,paymentMethod,date,cashSessionId:null};s.receipts.push(r);
 linkReceipt(next,s,r);
 s.paymentStatus=amountCents===balance.remainingCents?'received':'partial';s.receivedAt=s.paymentStatus==='received'?date:null;
 return next;
}
module.exports={receive,methods};
