const {randomUUID}=require('node:crypto');
const {command,expectedVersion,nextNumber,safe}=require('./commands');
const {moneyCents}=require('./money');
const {optional}=require('./domain');
const {validDay,calendarDay}=require('./public/reports');
const {isActive}=require('./public/quotes-core');
const {purchaseStatus}=require('./public/purchases-core');
const {installmentPaid,payableBalance,splitCents}=require('./public/payables-core');
const {openCash,cashSummary}=require('./public/cash-core');
const {linkExpense}=require('./cash');
const {audit}=require('./audit');
const methods=['cash','pix','debit','credit','other'];
function payableAction(state,action,input){return command(state,'payables',action,input,(next,date)=>{
 next.payables||=[];next.expenses||=[];
 const p=action==='create'?null:next.payables.find(p=>p.id===input.id);
 if(action!=='create')expectedVersion(p,input,'Esta conta');if(p?.activeAgreementId)throw Error('Saldo renegociado. Use o acordo para pagar ou cancele o acordo não pago antes de alterar a obrigação.');
 const before=p&&structuredClone(p);
 if(action==='create'||action==='edit'){
  if(p&&(p.cancelledAt||p.payments.length))throw Error('Somente contas sem pagamentos e sem cancelamento podem ser editadas.');
  const purchaseId=p?p.purchaseId:input.purchaseId||null,purchase=purchaseId&&(next.purchases||[]).find(p=>p.id===purchaseId);
  if(purchaseId&&(!purchase||!purchase.confirmedAt||purchaseStatus(purchase)==='cancelled'))throw Error('Selecione uma compra confirmada e não cancelada.');
  if(purchase&&input.expectedPurchaseVersion!==purchase.version)throw Error('A compra mudou. Confira os dados antes de criar ou editar a conta.');
  const supplier=next.suppliers?.find(s=>s.id===(purchase?.supplierId||input.supplierId));
  if(!supplier||(!purchase&&!isActive(supplier)&&(!p||p.supplierId!==supplier.id)))throw Error('Selecione um fornecedor ativo.');
  const totalCents=moneyCents(input.value),description=optional(input.description,120),reference=optional(input.reference,100),note=optional(input.note,1000),differenceReason=optional(input.differenceReason,500);
  if(!description)throw Error('Informe a descrição da conta.');
  if(purchase&&totalCents!==purchase.totalCents&&!differenceReason)throw Error('Explique a diferença entre o valor da compra e da conta.');
  const duplicate=reference&&next.payables.some(r=>r.id!==p?.id&&r.supplierId===supplier.id&&r.reference.toLocaleLowerCase()===reference.toLocaleLowerCase());
  const related=!p&&purchase&&next.payables.some(r=>r.purchaseId===purchase.id&&!r.cancelledAt);
  if((duplicate||related)&&input.acknowledgeDuplicate!==true)throw Error('Há uma conta com esta referência ou compra. Confira e reconheça o aviso de repetição.');
  if(!Array.isArray(input.dueDates)||!input.dueDates.length||input.dueDates.length>60)throw Error('Informe de 1 a 60 vencimentos.');
  const amounts=splitCents(totalCents,input.dueDates.length),installments=input.dueDates.map((d,i)=>{if(d&&!validDay(d))throw Error('Informe vencimentos reais.');return {id:randomUUID(),number:i+1,dueDate:d||null,amountCents:amounts[i]};});
  const fields={supplierId:supplier.id,supplierName:p?.supplierId===supplier.id?p.supplierName:purchase?.supplierName||supplier.name,description,reference,note,differenceReason,totalCents,purchaseId:purchase?.id||null,purchaseNumber:purchase?.number||null,purchaseTotalCents:purchase?.totalCents??null,installments,updatedAt:date};
  if(p){Object.assign(p,fields);p.version++;audit(next,'payable',p,before,input,date);}else next.payables.push({id:randomUUID(),number:nextNumber(next.payables),date,version:1,payments:[],...fields});
 }else if(action==='pay'||action==='link'){
  if(p.cancelledAt)throw Error('O saldo desta conta está cancelado.');
  const part=p.installments.find(i=>i.id===input.installmentId);if(!part)throw Error('Parcela não encontrada.');
  const remaining=part.amountCents-installmentPaid(p,part.id);
  let amountCents,paidDate,paymentMethod,cashSessionId=null,expenseRecord;
  const note=optional(input.note,500);
  if(action==='link'){
   expenseRecord=next.expenses.find(e=>e.id===input.expenseId);
   if(!expenseRecord||expenseRecord.cancelledAt||expenseRecord.payableId||expenseRecord.payablePaymentId)throw Error('Selecione uma despesa manual válida e ainda não vinculada.');
   if(input.acknowledgeSupplier!==true)throw Error('Confira e confirme que esta despesa foi paga a este fornecedor.');
   amountCents=expenseRecord.amountCents;paidDate=expenseRecord.paidDate;paymentMethod=expenseRecord.paymentMethod;cashSessionId=expenseRecord.cashSessionId||null;if(!validDay(paidDate)||paidDate>calendarDay()||!methods.includes(paymentMethod))throw Error('A despesa precisa ter data efetiva e forma de pagamento válidas.');
  }else{
   amountCents=moneyCents(input.value);paidDate=input.paidDate;paymentMethod=input.paymentMethod;
   if(!validDay(paidDate)||paidDate>calendarDay())throw Error('Informe uma data de pagamento real, sem usar data futura.');
   if(!methods.includes(paymentMethod))throw Error('Selecione a forma do pagamento.');
   if(input.cashSessionId){const c=openCash(next);if(!c||c.id!==input.cashSessionId)throw Error('O Caixa mudou. Confira antes de revisar novamente.');if(input.expectedCashCents!==cashSummary(c).expectedCents)throw Error('O saldo do Caixa mudou. Confira antes de revisar novamente.');cashSessionId=c.id;}
  }
  if(amountCents<=0||amountCents>remaining)throw Error('O pagamento ultrapassa o saldo da parcela ou é inválido.');
  const payment={id:randomUUID(),installmentId:part.id,amountCents,paidDate,paymentMethod,cashSessionId,note,date,requestId:input.requestId,linkedExisting:action==='link'};
  if(action==='pay'){
   expenseRecord={id:randomUUID(),description:'Pagamento de fornecedor: '+p.description,amountCents,paidDate,paymentMethod,cashSessionId:null,note,createdAt:date,requestId:null,category:p.expenseCategory||''};
   require('./budgets').expenseBudgetFields(next,expenseRecord,{...input,expenseCenterId:p.expenseCenterId||null},p.expenseCenterId);next.expenses.push(expenseRecord);linkExpense(next,expenseRecord,{cashSessionId});
  }
  expenseRecord.payableId=p.id;expenseRecord.payablePaymentId=payment.id;expenseRecord.supplierName=p.supplierName;payment.expenseId=expenseRecord.id;
  p.payments.push(payment);safe(payableBalance(p).paidCents);p.updatedAt=date;p.version++;
 }else if(action==='cancel'){
  if(p.cancelledAt||!payableBalance(p).remainingCents)throw Error('Esta conta não tem saldo aberto para cancelar.');
  const reason=optional(input.reason,500);if(!reason)throw Error('Informe o motivo do cancelamento do saldo.');
  p.cancelledCents=payableBalance(p).remainingCents;p.cancelledAt=date;p.cancelReason=reason;p.updatedAt=date;p.version++;audit(next,'payable',p,before,input,date);
 }else throw Error('Operação de conta a pagar inválida.');
 });}
module.exports={payableAction};
