const fs=require('node:fs');
const lists=['products','customers','sales','suppliers','purchases','payables','expenses','quotes','cashSessions','stockMovements','stockEntries','auditLog','operationCommands','purchaseCommands','quoteCommands','cashCommands','inventories','reservations','tasks','hiddenOperations','priceLists','promotions','quarantineEntries','supplierReturns','storeCredits','deliveries','supplierQuotes','expenseCenters','expenseBudgets','families','positions','transfers','positionMovements','purchaseConferences','purchaseAmendments','purchaseOccurrences','agreements','recurringModels','recurringOccurrences','procedures','procedureExecutions','priceReviews'];
function validateDatabase(db){
 if(!db||typeof db!=='object'||Array.isArray(db))throw Error('Estrutura de dados inválida.');
 if(db.schemaVersion!==undefined&&(!Number.isSafeInteger(db.schemaVersion)||db.schemaVersion<1||db.schemaVersion>2))throw Error('Versão de dados não suportada.');
 for(const key of lists){const rows=db[key];if(rows===undefined&&!['products','customers','sales'].includes(key))continue;if(!Array.isArray(rows))throw Error('Lista inválida: '+key);const ids=new Set();for(const r of rows){if(!r||typeof r!=='object'||Array.isArray(r))throw Error('Registro inválido: '+key);if(['operationCommands','purchaseCommands','quoteCommands','cashCommands'].includes(key))continue;if(typeof r.id!=='string'||!r.id||ids.has(r.id))throw Error('Identificação inválida: '+key);ids.add(r.id);}}
 for(const p of db.products)if(!Number.isSafeInteger(p.stock)||p.stock<0||!Number.isSafeInteger(p.priceCents)||p.priceCents<0||typeof p.name!=='string')throw Error('Produto inválido.');
 for(const s of [...db.sales,...(db.quotes||[])])if(!Array.isArray(s.items)||!Number.isSafeInteger(s.totalCents)||s.totalCents<0||s.items.some(i=>!Number.isSafeInteger(i.quantity)||i.quantity<1||!Number.isSafeInteger(i.priceCents)||i.priceCents<0))throw Error('Venda ou orçamento inválido.');
 for(const e of db.expenses||[])if(!Number.isSafeInteger(e.amountCents)||e.amountCents<=0)throw Error('Despesa inválida.');
 for(const key of ['products','customers','suppliers'])for(const r of db[key]||[])if(typeof r.name!=='string'||r.version!==undefined&&(!Number.isSafeInteger(r.version)||r.version<1))throw Error('Cadastro inválido.');
 for(const p of db.purchases||[]){
  if(!Array.isArray(p.items)||!p.items.length||!Array.isArray(p.receipts)||!Number.isSafeInteger(p.totalCents)||p.totalCents<0||!Number.isSafeInteger(p.version)||p.version<1||p.items.some(i=>!Number.isSafeInteger(i.quantity)||i.quantity<1||!Number.isSafeInteger(i.unitCostCents)||i.unitCostCents<0)||p.items.reduce((n,i)=>n+i.quantity*i.unitCostCents,0)!==p.totalCents)throw Error('Compra inválida.');
  const totals=new Map();for(const r of p.receipts){if(!Array.isArray(r.items)||!r.items.length)throw Error('Entrega inválida.');for(const i of r.items){const ordered=p.items.find(o=>o.productId===i.productId);if(!ordered||!Number.isSafeInteger(i.quantity)||i.quantity<1||!Number.isSafeInteger(i.unitCostCents)||i.unitCostCents<0||!Number.isSafeInteger(i.quantity*i.unitCostCents)||(i.unitCostCents!==ordered.unitCostCents&&(!i.costReason||i.originalUnitCostCents!==ordered.unitCostCents)))throw Error('Item de entrega inválido.');totals.set(i.productId,(totals.get(i.productId)||0)+i.quantity);}}
  if(p.items.some(i=>(totals.get(i.productId)||0)>i.quantity))throw Error('Entrega acima da quantidade pedida.');
 }
 for(const p of db.payables||[]){
  if(!Array.isArray(p.installments)||!p.installments.length||p.installments.length>60||!Array.isArray(p.payments)||!Number.isSafeInteger(p.totalCents)||p.totalCents<1||p.installments.reduce((n,i)=>n+i.amountCents,0)!==p.totalCents)throw Error('Conta a pagar inválida.');
  const ids=new Set();for(const i of p.installments){if(typeof i.id!=='string'||ids.has(i.id)||!Number.isSafeInteger(i.amountCents)||i.amountCents<1)throw Error('Parcela inválida.');ids.add(i.id);}
  for(const r of p.payments){const e=db.expenses?.find(e=>e.id===r.expenseId);if(!Number.isSafeInteger(r.amountCents)||r.amountCents<=0||!p.installments.some(i=>i.id===r.installmentId)||!e||!(e.payableAllocations?e.payableAllocations.some(a=>a.payableId===p.id&&a.paymentId===r.id&&a.installmentId===r.installmentId&&a.amountCents===r.amountCents):e.payableId===p.id&&e.payablePaymentId===r.id&&e.amountCents===r.amountCents))throw Error('Pagamento ou despesa vinculada inválida.');}
  if(p.installments.some(i=>p.payments.filter(r=>r.installmentId===i.id).reduce((n,r)=>n+r.amountCents,0)>i.amountCents))throw Error('Pagamento acima do saldo da parcela.');
 }
 for(const c of db.cashSessions||[])if(!Number.isSafeInteger(c.openingCents)||c.openingCents<0||!Array.isArray(c.movements)||c.movements.some(m=>!Number.isSafeInteger(m.amountCents)||m.amountCents<=0))throw Error('Sessão de Caixa inválida.');
 require('./workflow-storage').validateWorkflowData(db);
 require('./advanced-storage').validateAdvancedData(db);
 require('./credit-storage').validateCreditData(db);
 require('./operations-storage').validateOperationsData(db);
 require('./round10-storage').validateRound10(db);
 return db;
}
function readDatabase(file,io=fs){return validateDatabase(io.existsSync(file)?JSON.parse(io.readFileSync(file,'utf8')):{products:[],customers:[],sales:[]});}
function persistDatabase(file,next,io=fs){const saved={...next,schemaVersion:2};validateDatabase(saved);const temp=file+'.tmp';try{io.writeFileSync(temp,JSON.stringify(saved,null,2));io.renameSync(temp,file);}catch(e){try{if(io.existsSync(temp))io.unlinkSync(temp);}catch{}throw Error('Não foi possível gravar os dados. Confira o espaço e o acesso à pasta; o preenchimento foi mantido para tentar novamente.');}return saved;}
module.exports={validateDatabase,readDatabase,persistDatabase,collections:Object.freeze([...lists])};
