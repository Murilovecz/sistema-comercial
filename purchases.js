const {randomUUID,createHash}=require('node:crypto');
const {moneyCents}=require('./money');
const {optional,movement}=require('./domain');
const {validateKey}=require('./cash');
const {validDay}=require('./public/reports');
const {isActive}=require('./public/quotes-core');
const {purchasedQuantity,purchaseSummary,purchaseStatus}=require('./public/purchases-core');
const {catalogVersion,audit}=require('./audit');
function signature(action,input){return createHash('sha256').update(JSON.stringify({action,input})).digest('hex');}
function replay(next,input,hash){const prior=input.requestId&&(next.purchaseCommands||[]).find(c=>c.requestId===input.requestId);if(prior&&prior.signature!==hash)throw Error('Esta confirmação já foi usada com outros dados.');return !!prior;}
function record(next,input,hash){if(input.requestId){next.purchaseCommands||=[];next.purchaseCommands.push({requestId:input.requestId,signature:hash,date:new Date().toISOString()});}return next;}
function supplierAction(state,action,input){
 validateKey(input.requestId);const next=structuredClone(state);next.suppliers||=[];const hash=signature('supplier/'+action,input);if(replay(next,input,hash))return next;
 const supplier=action==='create'?null:next.suppliers.find(s=>s.id===input.id);if(action!=='create'&&!supplier)throw Error('Fornecedor não encontrado.');
 const before=supplier&&structuredClone(supplier);if(supplier)catalogVersion(supplier,input);
 if(action==='active'){if(typeof input.active!=='boolean')throw Error('Informe a situação do fornecedor.');supplier.active=input.active;}
 else if(action==='create'||action==='edit'){
  const name=optional(input.name,120),phone=optional(input.phone,40),email=optional(input.email,150),notes=optional(input.notes,1000);if(!name)throw Error('Informe o nome do fornecedor.');if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Informe um e-mail válido.');
  const fields={name,phone,email,notes,updatedAt:new Date().toISOString()};if(supplier)Object.assign(supplier,fields);else next.suppliers.push({id:randomUUID(),active:true,version:1,date:new Date().toISOString(),...fields});
 }else throw Error('Ação de fornecedor inválida.');if(supplier){supplier.version=(supplier.version||0)+1;supplier.updatedAt=new Date().toISOString();audit(next,'suppliers',supplier,before,input);}return record(next,input,hash);
}
function assertVersion(p,input){if(p.version!==input.expectedVersion)throw Error('Este pedido mudou em outra janela. O preenchimento foi mantido; confira a versão atual e revise o saldo antes de confirmar.');}
function purchaseAction(state,action,input){
 validateKey(input.requestId);const next=structuredClone(state);next.purchases||=[];const hash=signature(action,input);if(replay(next,input,hash))return next;
 const p=action==='create'?null:next.purchases.find(p=>p.id===input.id);if(action!=='create'&&!p)throw Error('Pedido de compra não encontrado.');if(p)assertVersion(p,input);
 const date=new Date().toISOString();
 if(action==='create'||action==='edit'){
  if(p&&purchaseStatus(p)!=='draft')throw Error('Somente pedidos em preparação podem ser editados.');
  const supplier=next.suppliers?.find(s=>s.id===input.supplierId);if(!isActive(supplier))throw Error('Selecione um fornecedor ativo.');
  if(!Array.isArray(input.items)||!input.items.length||input.items.length>500)throw Error('Adicione de 1 a 500 produtos.');
  const source=input.sourceId?next.purchases.find(p=>p.id===input.sourceId):null;if(input.sourceId&&!source)throw Error('Pedido de origem não encontrado.');
  const seen=new Set(),items=input.items.map(i=>{const product=next.products.find(p=>p.id===i.productId),quantity=Number(i.quantity),unitCostCents=moneyCents(i.unitCost,true);if(!isActive(product))throw Error('Selecione produtos ativos para o pedido.');if(!Number.isSafeInteger(quantity)||quantity<1)throw Error('Quantidade deve ser inteira e maior que zero.');if(seen.has(product.id))throw Error('Produto repetido no pedido.');seen.add(product.id);return {productId:product.id,name:(p||source)?.items.find(item=>item.productId===product.id)?.name||product.name,code:product.code||'',quantity,unitCostCents,packages:require('./catalogue-next').packagingSnapshot(product,i,!!(p||source)?.items.find(a=>a.productId===i.productId)&&JSON.stringify(i.packages||[])===JSON.stringify((p||source).items.find(a=>a.productId===i.productId)?.packages||[])),...(i.substitutedFrom?{substitutedFrom:require('./catalogue-next').catalogueReference(next,i.substitutedFrom)}:{})};});
  const totalCents=items.reduce((n,i)=>n+i.quantity*i.unitCostCents,0),totalQuantity=items.reduce((n,i)=>n+i.quantity,0);if(!Number.isSafeInteger(totalCents)||!Number.isSafeInteger(totalQuantity))throw Error('Valor ou quantidade total muito alto.');
  const expectedDate=optional(input.expectedDate,10);if(expectedDate&&!validDay(expectedDate))throw Error('Informe uma previsão de entrega real.');
  const fields={supplierId:supplier.id,supplierName:p?.supplierId===supplier.id?p.supplierName:supplier.name,items,totalCents,expectedDate:expectedDate||null,note:optional(input.note,1000),updatedAt:date};
  if(p){Object.assign(p,fields);p.version++;}else{const number=next.purchases.reduce((max,p)=>Math.max(max,p.number||0),0)+1;if(!Number.isSafeInteger(number))throw Error('Limite de identificação atingido.');next.purchases.push({id:randomUUID(),number,date,version:1,sourceId:source?.id||null,receipts:[],...fields});}
 }else if(action==='confirm'){
  if(purchaseStatus(p)!=='draft')throw Error('Este pedido já foi confirmado ou encerrado.');
  if(!isActive(next.suppliers?.find(s=>s.id===p.supplierId))||p.items.some(i=>!isActive(next.products.find(r=>r.id===i.productId))))throw Error('Reative os cadastros do pedido antes de confirmar.');
  p.confirmedAt=date;p.confirmedExpectedDate=p.expectedDate||null;p.updatedAt=date;p.version++;
 }else if(action==='receive'){
  if(!['pending','partial'].includes(purchaseStatus(p)))throw Error('Pedido não está aguardando recebimento.');
  if(!Array.isArray(input.items)||!input.items.length||input.items.length>500)throw Error('Informe os produtos recebidos.');const seen=new Set();
  const items=input.items.map(i=>{const item=p.items.find(r=>r.productId===i.productId),product=next.products.find(r=>r.id===i.productId),quantity=Number(i.quantity);if(!item||!product)throw Error('Produto do pedido não encontrado.');if(seen.has(i.productId))throw Error('Produto repetido no recebimento.');seen.add(i.productId);if(!Number.isSafeInteger(quantity)||quantity<1)throw Error('Informe quantidades inteiras recebidas maiores que zero.');if(quantity>item.quantity-purchasedQuantity(p,item.productId))throw Error('Quantidade recebida ultrapassa o restante: '+item.name+'.');if(!Number.isSafeInteger(product.stock+quantity))throw Error('Estoque muito alto.');return {productId:item.productId,name:item.name,quantity,unitCostCents:item.unitCostCents};});
  const sequence=next.purchases.reduce((max,p)=>p.receipts.reduce((n,r)=>Math.max(n,r.sequence||0),max),0)+1;if(!Number.isSafeInteger(sequence))throw Error('Limite de recebimentos atingido.');
  const receipt={id:randomUUID(),date,sequence,requestId:input.requestId||null,note:optional(input.note,500),items};p.receipts.push(receipt);
  for(const i of items){const product=next.products.find(r=>r.id===i.productId);product.stock+=i.quantity;movement(next,product,i.quantity,'purchase',receipt.id,'Compra CMP-'+String(p.number).padStart(5,'0')+' · '+p.supplierName,date);next.stockMovements.at(-1).purchaseId=p.id;}
  require('./quarantine').quarantineReceipt(next,p,receipt,input,date);
  p.updatedAt=date;p.version++;
 }else if(action==='reschedule'){
  if(!['pending','partial'].includes(purchaseStatus(p)))throw Error('Somente pedidos aguardando entrega podem ser reprogramados.');
  const expectedDate=optional(input.expectedDate,10),reason=optional(input.reason,500);if(expectedDate&&!validDay(expectedDate))throw Error('Informe uma previsão real.');if(!reason)throw Error('Explique a reprogramação.');
  const before=structuredClone(p);p.scheduleHistory||=[];p.scheduleHistory.push({date,previousDate:p.expectedDate||null,expectedDate:expectedDate||null,reason});p.expectedDate=expectedDate||null;p.updatedAt=date;p.version++;audit(next,'purchase',p,before,input,date);
 }else if(action==='close'){
  if(['cancelled','closed','received'].includes(purchaseStatus(p)))throw Error('Pedido já concluído ou encerrado.');
  const reason=optional(input.reason,500);if(!reason)throw Error('Informe o motivo do cancelamento ou encerramento.');
  const summary=purchaseSummary(p);p.closedAt=date;p.closeReason=reason;p.closedPendingQuantity=summary.pendingQuantity;p.closedPendingCents=summary.pendingCents;p.updatedAt=date;p.version++;
 }else throw Error('Ação de compra inválida.');
 return record(next,input,hash);
}
module.exports={supplierAction,purchaseAction};
