const {moneyCents}=require('./money');
const {linkExpense,validateKey}=require('./cash');
const {randomUUID}=require('node:crypto');
const {validDay,calendarDay}=require('./public/reports');
const {validateProductIdentifiers}=require('./public/product-lookup');
function optional(value,max=200){const text=String(value??'').trim();if(text.length>max)throw Error(`Use no máximo ${max} caracteres.`);return text;}
function productFields(state,product,input){
 const identifiers=validateProductIdentifiers(state.products,product,input);
 Object.assign(product,identifiers);product.category=input.category===undefined?(product.category||''):optional(input.category,60);
 const minimum=input.minStock===undefined?(product.minStock||0):Number(input.minStock);
 if(!Number.isSafeInteger(minimum)||minimum<0)throw Error('O estoque mínimo deve ser inteiro e não negativo.');product.minStock=minimum;
}
function movement(state,product,quantity,type,referenceId,note='',date=new Date().toISOString()){
 state.stockMovements ||= [];state.stockMovements.push({id:randomUUID(),productId:product.id,productName:product.name,quantity,type,referenceId,note,stockAfter:product.stock,date});
}
function dueDate(input){if(input.paymentStatus!=='pending'||!input.dueDate)return null;if(!validDay(input.dueDate))throw Error('Informe uma data de vencimento válida.');return input.dueDate;}
function expense(state,input){
 validateKey(input.requestId);
 const next=structuredClone(state);next.expenses ||= [];
 const prior=input.requestId&&next.expenses.find(e=>e.requestId===input.requestId);
 if(prior){if((prior.category||'')!==String(input.category||'').trim()||prior.description!==String(input.description).trim()||prior.amountCents!==moneyCents(input.value)||prior.paidDate!==input.paidDate||prior.note!==String(input.note||'').trim()||prior.paymentMethod!==input.paymentMethod||(prior.expenseCenterId||'')!==(input.expenseCenterId||'')||(prior.budgetExcessReason||'')!==(input.budgetExcessReason||'')||(prior.cashSessionId||null)!==(input.cashSessionId||null))throw Error('Esta confirmação de despesa já foi usada com outros dados.');return next;}
 const category=optional(input.category,60),description=optional(input.description,120),paidDate=input.paidDate,value=Number(input.value),amountCents=moneyCents(input.value);
 if(!description)throw Error('Informe a descrição da despesa.');
 if(!Number.isFinite(value)||!Number.isSafeInteger(amountCents)||amountCents<=0)throw Error('Informe um valor maior que zero.');
 if(!validDay(paidDate)||paidDate>calendarDay())throw Error('Informe a data do pagamento, sem usar uma data futura.');
 if(!['cash','pix','debit','credit','other'].includes(input.paymentMethod))throw Error('Selecione a forma de pagamento da despesa.');
 const e={id:randomUUID(),requestId:input.requestId||null,description,category,amountCents,paidDate,paymentMethod:input.paymentMethod,cashSessionId:null,note:optional(input.note,500),createdAt:new Date().toISOString()};
 require('./budgets').expenseBudgetFields(next,e,input);next.expenses.push(e);linkExpense(next,e,input);return next;
}
function cancelExpense(state,id){const next=structuredClone(state),e=(next.expenses||[]).find(e=>e.id===id);if(!e)throw Error('Despesa não encontrada.');if(e.payableId||e.payableAllocations?.length)throw Error('Esta despesa está vinculada a uma conta a pagar. Consulte a conta; cancelar a despesa isoladamente não é permitido.');if(e.cancelledAt)throw Error('Esta despesa já foi cancelada.');e.cancelledAt=new Date().toISOString();return next;}
function company(state,input){return {...structuredClone(state),company:{name:optional(input.name,120),contact:optional(input.contact,200)}};}
module.exports={optional,productFields,movement,dueDate,expense,cancelExpense,company};
