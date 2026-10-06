const {test}=require('node:test'),assert=require('node:assert/strict');
const {financialSummary}=require('./public/finance');
test('financeiro exclui canceladas e não presume pagamento de registros antigos',()=>{
 const sales=[{paymentStatus:'received',totalCents:100},{paymentStatus:'pending',totalCents:200},{totalCents:999},{paymentStatus:'received',totalCents:800,cancelledAt:'date'}];
 const before=structuredClone(sales);assert.deepEqual(financialSummary(sales),{receivedCents:100,pendingCents:200,unknownCount:1});assert.deepEqual(sales,before);
});
