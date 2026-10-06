const {test}=require('node:test'),assert=require('node:assert/strict');
const {quoteAction,activeAction}=require('./quotes'),{sale,change}=require('./server');
const {quoteStatus}=require('./public/quotes-core'),{cashAction}=require('./cash'),{cashSummary}=require('./public/cash-core'),{exportCsv}=require('./export');
const initial=()=>({products:[{id:'p',name:'Produto original',stock:5,priceCents:1990}],customers:[{id:'c',name:'Cliente original'}],sales:[]});
const create=(db,input={})=>quoteAction(db,'create',{customerId:'c',items:[{productId:'p',quantity:2}],...input},sale);
const action=(db,a,input={})=>quoteAction(db,a,{id:db.quotes[0].id,expectedVersion:db.quotes[0].version,...input},sale);
test('cadastros antigos ativos, desativação impede novas operações e não altera histórico',()=>{
 const sold=sale(initial(),{customerId:'c',items:[{productId:'p',quantity:1}],paymentMethod:'cash',paymentStatus:'pending'});
 const inactive=activeAction(sold,'products',{id:'p',active:false,expectedVersion:0});assert.throws(()=>create(inactive),/inativo/);assert.throws(()=>sale(inactive,{items:[{productId:'p',quantity:1}],paymentMethod:'cash',paymentStatus:'pending'}),/inativo/);assert.equal(inactive.sales[0].items[0].name,'Produto original');
 const inactiveCustomer=activeAction(sold,'customers',{id:'c',active:false,expectedVersion:0});assert.throws(()=>create(inactiveCustomer),/inativo/);assert.equal(create(activeAction(inactiveCustomer,'customers',{id:'c',active:true,expectedVersion:1})).quotes.length,1);
});
test('orçamento sem estoque disponível preserva centavos e não movimenta estoque ou dinheiro',()=>{
 const db=initial(),next=create(db,{items:[{productId:'p',quantity:8}],note:'=Observação',validUntil:'2027-01-30',requestId:'create'});assert.equal(next.quotes[0].totalCents,15920);assert.equal(next.products[0].stock,5);assert.deepEqual(next.sales,[]);assert.equal(next.stockMovements,undefined);assert.equal(db.quotes,undefined);assert.deepEqual(create(next,{items:[{productId:'p',quantity:8}],note:'=Observação',validUntil:'2027-01-30',requestId:'create'}),next);
 assert.throws(()=>create(next,{requestId:'create'}),/outros dados/);
});
test('edição preserva snapshots e data original; preço só muda por confirmação explícita',()=>{
 let db=create(initial());db.products[0].priceCents=2500;db.products[0].name='Nome novo';const original=db.quotes[0];db=action(db,'edit',{customerId:'c',items:[{productId:'p',quantity:3,priceCents:1990}],note:'Revisto',validUntil:'2027-02-01'});assert.equal(db.quotes[0].totalCents,5970);assert.equal(db.quotes[0].date,original.date);assert.equal(db.quotes[0].items[0].name,'Produto original');assert.equal(db.quotes[0].version,2);
 assert.throws(()=>action(db,'edit',{items:[{productId:'p',quantity:1,priceCents:1}]}),/preço/);assert.throws(()=>action(db,'prices',{expectedPrices:[{productId:'p',priceCents:2490}]}),/preços/);
 const input={expectedPrices:[{productId:'p',priceCents:2500}],requestId:'price'};const priced=action(db,'prices',input);assert.equal(priced.quotes[0].totalCents,7500);assert.deepEqual(quoteAction(priced,'prices',{id:original.id,expectedVersion:2,...input},sale),priced);
});
test('datas, quantidades, totais e versões inválidos são recusados sem alterar estado',()=>{
 const db=create(initial());for(const input of [{validUntil:'2026-02-30'},{items:[]},{items:[{productId:'p',quantity:1.5}]},{items:[{productId:'p',quantity:Number.MAX_SAFE_INTEGER}]},{items:[{productId:'p',quantity:1},{productId:'p',quantity:2}]}])assert.throws(()=>create(db,input));assert.throws(()=>action(db,'edit',{expectedVersion:0,items:[{productId:'p',quantity:1}]}),/outra janela/);assert.equal(db.quotes[0].version,1);
});
test('vencimento deriva da data local; renovar permite converter',()=>{
 let db=create(initial(),{validUntil:'2000-01-01'});assert.equal(quoteStatus(db.quotes[0]),'expired');assert.throws(()=>action(db,'convert',{paymentMethod:'pix',paymentStatus:'received'}),/vencido/);db=action(db,'edit',{customerId:'c',items:[{productId:'p',quantity:2}],validUntil:'2099-01-01'});assert.equal(quoteStatus(db.quotes[0]),'open');assert.equal(action(db,'convert',{paymentMethod:'pix',paymentStatus:'pending'}).sales.length,1);
});
test('cancelamento idempotente preserva conteúdo e bloqueia alterações; cópia recebe nova identidade',()=>{
 const db=create(initial()),cancelled=action(db,'cancel');assert.deepEqual(action(cancelled,'cancel',{expectedVersion:1}),cancelled);assert.equal(cancelled.products[0].stock,5);assert.throws(()=>action(cancelled,'edit',{items:[{productId:'p',quantity:1}]}));assert.throws(()=>action(cancelled,'convert',{paymentMethod:'pix',paymentStatus:'received'}));
 const copy=create(cancelled,{sourceId:cancelled.quotes[0].id,sourceVersion:2,validUntil:'2099-01-01'});assert.equal(copy.quotes[1].number,2);assert.notEqual(copy.quotes[1].id,copy.quotes[0].id);assert.equal(copy.quotes[1].version,1);assert.equal(copy.quotes[1].cancelledAt,undefined);assert.equal(copy.quotes[1].saleId,undefined);assert.throws(()=>create(cancelled,{sourceId:cancelled.quotes[0].id,sourceVersion:1}),/origem mudou/);
});
test('conversão honra preço negociado e cria venda, movimentos e recebimento uma única vez',()=>{
 let db=cashAction(initial(),'open',{responsible:'Loja',openingValue:'100.00'});db=create(db);db.products[0].priceCents=5000;db.products[0].name='Nome alterado';db.customers[0].name='Cliente alterado';const quote=db.quotes[0];const input={paymentMethod:'cash',paymentStatus:'received',expectedCashSessionId:db.cashSessions[0].id,requestId:'convert'};
 const converted=action(db,'convert',input);assert.equal(converted.products[0].stock,3);assert.equal(converted.sales[0].totalCents,3980);assert.equal(converted.sales[0].items[0].name,'Produto original');assert.equal(converted.sales[0].customerName,'Cliente original');assert.equal(converted.sales[0].quoteId,quote.id);assert.equal(converted.quotes[0].saleId,converted.sales[0].id);assert.equal(converted.sales[0].receipts.length,1);assert.equal(cashSummary(converted.cashSessions[0]).expectedCents,13980);assert.deepEqual(quoteAction(converted,'convert',{id:quote.id,expectedVersion:1,...input},sale),converted);assert.deepEqual(action(converted,'convert',{expectedVersion:1,paymentMethod:'pix',paymentStatus:'pending'}),converted);
 const cancelled=change(converted,'/api/sales/cancel',{id:converted.sales[0].id});assert.equal(cancelled.products[0].stock,5);assert.equal(quoteStatus(cancelled.quotes[0]),'converted');assert.equal(cashSummary(cancelled.cashSessions[0]).expectedCents,13980);
});
test('falha na conversão é atômica; desativação, estoque, Caixa, versão e pagamento são conferidos',()=>{
 const db=create(initial()),before=structuredClone(db);for(const input of [{paymentMethod:'invalid',paymentStatus:'received'},{paymentMethod:'cash',paymentStatus:'bad'},{paymentMethod:'pix',paymentStatus:'pending',dueDate:'2026-02-30'},{paymentMethod:'cash',paymentStatus:'received',expectedCashSessionId:'closed'},{expectedVersion:0,paymentMethod:'pix',paymentStatus:'received'}])assert.throws(()=>action(db,'convert',input));assert.deepEqual(db,before);
 for(const changed of [activeAction(db,'products',{id:'p',active:false,expectedVersion:0}),activeAction(db,'customers',{id:'c',active:false,expectedVersion:0}),{...db,products:[{...db.products[0],stock:1}]}])assert.throws(()=>action(changed,'convert',{paymentMethod:'cash',paymentStatus:'received'}));
});
test('conversão pendente mantém vencimento; CSV filtra situação e protege observações',()=>{
 const db=create(initial(),{note:'=SUM(A1)'}),next=action(db,'convert',{paymentMethod:'pix',paymentStatus:'pending',dueDate:'2027-03-01'});assert.equal(next.sales[0].dueDate,'2027-03-01');assert.deepEqual(next.sales[0].receipts,[]);const csv=exportCsv(next,'quotes',[next.quotes[0].id]).body;assert.ok(csv.includes('Convertido'));assert.ok(csv.includes("'=SUM(A1)"));assert.equal(exportCsv(next,'quotes',[]).body.includes('ORC-'),false);
});
