const test=require('node:test'),assert=require('node:assert/strict');
const {receive}=require('./payments'),{paymentBalance,receiptList}=require('./public/payments'),{moneyCents}=require('./money'),{financialSummary}=require('./public/finance'),{movementSummary}=require('./public/reports');
const initial=()=>({sales:[{id:'s',date:'2026-01-01T12:00:00Z',totalCents:1000,paymentStatus:'pending',paymentMethod:'pix',customerName:'C'}]});
test('parcial, quitação, formas efetivas e replay preservam parcelas',()=>{
 const input={id:'s',value:'3.25',paymentMethod:'cash',requestId:'r'};const a=receive(initial(),input);assert.equal(a.sales[0].paymentStatus,'partial');assert.deepEqual(paymentBalance(a.sales[0]),{known:true,receivedCents:325,remainingCents:675});assert.deepEqual(receive(a,input),a);assert.throws(()=>receive(a,{...input,value:'3.26'}),/outros dados/);
 const b=receive(a,{id:'s',value:'6.75',paymentMethod:'pix',requestId:'r2'});assert.equal(b.sales[0].paymentStatus,'received');assert.equal(receiptList(b.sales[0]).length,2);assert.deepEqual(financialSummary(b.sales),{receivedCents:1000,pendingCents:0,unknownCount:0});assert.throws(()=>receive(b,{id:'s',value:1,paymentMethod:'cash'}));
});
test('legado conserva recebimento conhecido sem inventar data, forma ou vínculo',()=>{
 const s={id:'old',paymentStatus:'received',totalCents:200};assert.equal(receiptList(s)[0].date,null);assert.equal(receiptList(s)[0].paymentMethod,null);assert.equal(receiptList(s)[0].cashSessionId,null);assert.equal(movementSummary([s],[]).missingDates,1);assert.deepEqual(s,{id:'old',paymentStatus:'received',totalCents:200});
 const key={id:'s',requestId:'full'};const a=receive(initial(),key);assert.deepEqual(receive(a,key),a);
});
test('não recebe mais que saldo, venda cancelada ou valores arredondados silenciosamente',()=>{
 for(const value of ['1.999','1e2','',null,true,[],0,-1,'10.01'])assert.throws(()=>receive(initial(),{id:'s',value,paymentMethod:'cash'}));const state=initial();state.sales[0].cancelledAt='x';assert.throws(()=>receive(state,{id:'s',value:1,paymentMethod:'cash'}));assert.equal(moneyCents('0.10'),10);assert.equal(moneyCents('0',true),0);
});
test('resumo de parcelas mantém datas efetivas depois de cancelamento',()=>{
 const state=initial();state.sales[0].paymentStatus='partial';state.sales[0].receipts=[{amountCents:300,paymentMethod:'pix',date:'2026-02-02T12:00:00Z'},{amountCents:200,paymentMethod:'cash',date:'2026-03-02T12:00:00Z'}];state.sales[0].cancelledAt='x';assert.equal(movementSummary(state.sales,[],'2026-02-01','2026-02-28').incomeCents,300);assert.equal(financialSummary(state.sales).receivedCents,0);
});
