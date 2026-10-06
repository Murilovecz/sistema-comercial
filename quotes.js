const {randomUUID,createHash}=require('node:crypto');
const {optional}=require('./domain');
const {validateKey}=require('./cash');
const {validDay,calendarDay}=require('./public/reports');
const {discountTotals}=require('./public/discount-core');
const {catalogVersion,audit}=require('./audit');
const {validatedOffer}=require('./pricing');
const {isActive,quoteStatus}=require('./public/quotes-core');
function activeAction(state,kind,input){
 if(kind==='products'&&input.active===false&&require('./public/quarantine-core').retainedQuantity(state,input.id)>0)throw Error('Defina o destino da quarentena antes de desativar o produto.');
 if(typeof input.active!=='boolean')throw Error('Informe a situação do cadastro.');
 const next=structuredClone(state),r=next[kind].find(r=>r.id===input.id);
 if(!r)throw Error('Cadastro não encontrado.');if(kind==='products'&&input.active===false&&require('./public/workflow-core').reservedQuantity(next,r.id)>0)throw Error('Libere ou converta as reservas deste produto antes de desativar.');catalogVersion(r,input);const before=structuredClone(r);r.active=input.active;r.version=(r.version||0)+1;r.updatedAt=new Date().toISOString();audit(next,kind,r,before,input);return next;
}
function version(q,input){if(input.expectedVersion!==q.version)throw Error('Este orçamento mudou em outra janela. Seu preenchimento foi mantido; confira a versão atual antes de tentar novamente.');}
function editable(q){if(q.saleId||q.cancelledAt)throw Error('Orçamento convertido ou cancelado não pode ser alterado.');}
function available(state,customerId,items){
 if(customerId&&!isActive(state.customers.find(c=>c.id===customerId)))throw Error('Cliente inexistente ou inativo. Selecione um cadastro ativo.');
 for(const i of items)if(!isActive(state.products.find(p=>p.id===i.productId)))throw Error('Produto inexistente ou inativo. Revise os itens.');
}
function quoteAction(state,action,input,sale){
 validateKey(input.requestId);
 const next=structuredClone(state);next.quotes||=[];next.quoteCommands||=[];
 const signature=createHash('sha256').update(JSON.stringify({action,...input})).digest('hex');
 const previous=input.requestId&&next.quoteCommands.find(c=>c.requestId===input.requestId);
 if(previous){if(previous.signature!==signature)throw Error('Esta confirmação já foi usada com outros dados.');return next;}
 const q=action==='create'?null:next.quotes.find(q=>q.id===input.id);
 if(action!=='create'&&!q)throw Error('Orçamento não encontrado.');
 if(action==='convert'&&q.saleId)return next;
 if(action==='cancel'&&q.cancelledAt)return next;
 if(q){editable(q);version(q,input);}
 const date=new Date().toISOString();let result=next;
 if(action==='create'||action==='edit'){
  const source=input.sourceId?next.quotes.find(q=>q.id===input.sourceId):null;
  if(input.sourceId&&!source)throw Error('Orçamento de origem não encontrado.');
  if(source&&source.version!==input.sourceVersion)throw Error('O orçamento de origem mudou. Abra uma nova cópia para revisar.');
  const customerId=input.customerId||null;
  if(!Array.isArray(input.items)||!input.items.length||input.items.length>500)throw Error('Adicione de 1 a 500 produtos.');
  available(next,customerId,input.items);
  const offer=validatedOffer(next,input,q||source);
  const seen=new Set(),items=input.items.map(i=>{
   const quantity=Number(i.quantity),p=next.products.find(p=>p.id===i.productId);
   if(seen.has(i.productId))throw Error('Produto repetido no orçamento.');seen.add(i.productId);
   if(!Number.isSafeInteger(quantity)||quantity<1)throw Error('Quantidade inválida.');
   const prior=offer?.items.find(item=>item.productId===i.productId)||(q||source)?.items.find(item=>item.productId===i.productId);
   if(i.priceCents!==undefined&&i.priceCents!==(prior?.priceCents??p.priceCents))throw Error('Um preço mudou desde a revisão. Confira os preços atuais antes de salvar.');
   return {...(prior||{}),productId:p.id,name:prior?.name||p.name,priceCents:prior?.priceCents??p.priceCents,quantity,packages:require('./catalogue-next').packagingSnapshot(p,i,!!prior&&JSON.stringify(i.packages||[])===JSON.stringify(prior.packages||[])),...(i.substitutedFrom?{substitutedFrom:require('./catalogue-next').catalogueReference(next,i.substitutedFrom)}:{})};
  });
  const validUntil=optional(input.validUntil,10),note=optional(input.note,1000);
  if(validUntil&&!validDay(validUntil))throw Error('Informe uma data de validade real.');
  const subtotalCents=items.reduce((n,i)=>n+i.priceCents*i.quantity,0),pricing=discountTotals(subtotalCents,input.discount||'0',input.discountReason||''),totalCents=pricing.totalCents;
  if(!Number.isSafeInteger(totalCents)||totalCents<0)throw Error('Valor do orçamento muito alto.');
  const fields={customerId,customerName:next.customers.find(c=>c.id===customerId)?.name||'Consumidor final',items,...pricing,validUntil:validUntil||null,note,updatedAt:date};
  if(offer||(q||source)?.negotiation)fields.negotiation=offer||require('./pricing').historicalNegotiation((q||source).negotiation,items);
  if(q){q.itemRevisions||=[];if(JSON.stringify(q.items)!==JSON.stringify(items))q.itemRevisions.push({date,version:q.version,items:structuredClone(q.items),updatedItems:structuredClone(items),responsible:optional(input.responsible,120)||'Não declarado'});Object.assign(q,fields);q.version++;}
  else{const number=Math.max(0,...next.quotes.map(q=>q.number||0))+1;if(!Number.isSafeInteger(number))throw Error('Limite de identificação atingido.');next.quotes.push({id:randomUUID(),number,version:1,date,...fields,sourceId:source?.id||null});}
 }else if(action==='prices'){
  available(next,q.customerId,q.items);
  const offer=validatedOffer(next,{...input,items:q.items,customerId:q.customerId,discount:String((q.discountCents||0)/100)});
  if(!Array.isArray(input.expectedPrices)||q.items.some(i=>input.expectedPrices.find(p=>p.productId===i.productId)?.priceCents!==(offer?.items.find(p=>p.productId===i.productId)?.priceCents??next.products.find(p=>p.id===i.productId).priceCents)))throw Error('Os preços atuais mudaram desde a revisão. Reabra a atualização de preços.');
  q.items=q.items.map(i=>{const priced=offer?.items.find(p=>p.productId===i.productId);return priced?{...i,...priced}:{...i,productId:i.productId,name:i.name,quantity:i.quantity,priceCents:next.products.find(p=>p.id===i.productId).priceCents};});
  if(offer)q.negotiation=offer;else delete q.negotiation;
  Object.assign(q,discountTotals(q.items.reduce((n,i)=>n+i.priceCents*i.quantity,0),String((q.discountCents||0)/100),q.discountReason||''));
  if(!Number.isSafeInteger(q.totalCents))throw Error('Valor do orçamento muito alto.');q.version++;q.updatedAt=date;
 }else if(action==='cancel'){q.cancelledAt=date;q.version++;q.updatedAt=date;}
 else if(action==='convert'){
  if(quoteStatus(q,calendarDay())==='expired')throw Error('Orçamento vencido. Renove a validade antes de converter.');
  available(next,q.customerId,q.items);
  result=sale(next,{customerId:q.customerId,paymentMethod:input.paymentMethod,paymentStatus:input.paymentStatus,dueDate:input.dueDate,items:q.items.map(i=>({productId:i.productId,quantity:i.quantity})),expectedCashSessionId:input.expectedCashSessionId},q);
  const converted=result.quotes.find(r=>r.id===q.id),s=result.sales.at(-1);
  s.quoteId=q.id;s.quoteNumber=q.number;converted.saleId=s.id;converted.convertedAt=date;converted.updatedAt=date;converted.version++;
 }else throw Error('Ação de orçamento inválida.');
 if(input.requestId)result.quoteCommands.push({requestId:input.requestId,signature,date});
 return result;
}
module.exports={activeAction,quoteAction};
