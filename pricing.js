const {text,integer,dateOnly,items,record,reason,baseRecord,touch,expected,cents,run}=require('./advanced-common');
const {basisPoints,roundRatio,ruleStatus,priceOffer}=require('./public/pricing-core');
function dates(input){const startsOn=dateOnly(input.startsOn,'Início'),endsOn=dateOnly(input.endsOn,'Fim');if(startsOn&&endsOn&&startsOn>endsOn)throw Error('Início posterior ao fim.');return {startsOn,endsOn};}
function listItems(state,rows,prior=null){return items(rows).map(i=>{const p=record(state,'products',i.productId);if(p.active===false&&!prior?.items.some(o=>o.productId===i.productId))throw Error('Não inclua produto inativo em nova lista.');return {productId:p.id,name:p.name,priceCents:cents(i.price,true)};});}
function pricingAction(state,kind,action,input){
 if(kind==='pricing'&&action==='preview')return priceOffer(state,input);
 return run(state,kind,action,input,(next,date)=>{
  if(kind==='priceLists'&&action==='customer'){const customer=record(next,'customers',input.customerId,true);if((customer.version||0)!==input.expectedVersion)throw Error('Cliente mudou.');if(input.priceListId)record(next,'priceLists',input.priceListId);const before=structuredClone(customer);customer.preferredPriceListId=input.priceListId||null;customer.version=(customer.version||0)+1;require('./audit').audit(next,'customers',customer,before,input,date);return;}
  if(kind==='priceLists'&&action==='minimum'){const p=record(next,'products',input.productId,true);if((p.version||0)!==input.expectedVersion)throw Error('Produto mudou.');const before={minimumPriceCents:p.minimumPriceCents};p.minimumPriceCents=input.value===''?undefined:cents(input.value,true);p.version=(p.version||0)+1;require('./audit').audit(next,'products',p,before,input,date);return;}
  let row=action==='create'?null:record(next,kind,input.id);if(row)expected(row,input);
  if(action==='create'||action==='edit'||action==='duplicate'){
   if(row?.closedAt)throw Error('Regra encerrada preserva seu histórico.');
   const fields={name:text(input.name,120,'Nome',true),description:text(input.description,1000,'Descrição'),...dates(input)};
   if(kind==='priceLists')fields.items=listItems(next,input.items,row);
   else if(kind==='promotions'){
    if(!['fixed','percent'].includes(input.type))throw Error('Tipo de promoção inválido.');fields.type=input.type;fields.minQuantity=integer(input.minQuantity,'Quantidade mínima');
    if(input.productIds){if(!Array.isArray(input.productIds)||!input.productIds.length||input.productIds.length>500||new Set(input.productIds).size!==input.productIds.length)throw Error('Selecione os produtos sem repetir.');fields.productIds=input.productIds.map(id=>{const p=record(next,'products',id);if(p.active===false&&!row?.productIds.includes(id))throw Error('Não inclua produto inativo em nova promoção.');return p.id;});fields.category=row?.category||null;}else{fields.category=text(input.category,60,'Categoria',true);fields.productIds=next.products.filter(p=>p.active!==false&&p.category===fields.category).map(p=>p.id);if(!fields.productIds.length)throw Error('Categoria sem produtos ativos.');}
    if(fields.type==='fixed')fields.valueCents=cents(input.value,true);else{fields.percentBps=basisPoints(input.percent);if(fields.percentBps<1||fields.percentBps>10000)throw Error('Desconto percentual deve ser maior que zero e até 100%.');}
   }else throw Error('Tipo de regra inválido.');
   if(action==='edit'){const before=structuredClone(row);Object.assign(row,fields);touch(row,date,action,input,{before});}
   else next[kind].push(baseRecord(next,kind,date,input,{...fields,active:true,sourceId:row?.id||null}));
  }else if(action==='active'){
   if(typeof input.active!=='boolean'||row.closedAt)throw Error('Situação inválida ou regra encerrada.');const why=reason(input);row.active=input.active;touch(row,date,action,{...input,reason:why});
  }else if(action==='close'&&kind==='promotions'){row.closedAt=date;row.active=false;touch(row,date,action,{...input,reason:reason(input)});}
  else if(action==='dates'){const before={startsOn:row.startsOn,endsOn:row.endsOn};Object.assign(row,dates(input));touch(row,date,action,{...input,reason:reason(input)},{before});}
  else if(action==='remove'&&kind==='priceLists'){if(!row.items.some(i=>i.productId===input.productId))throw Error('Selecione um produto da lista.');row.items=row.items.filter(i=>i.productId!==input.productId);touch(row,date,action,{...input,reason:reason(input)},{productId:input.productId});}
  else if(action==='adjust'&&kind==='priceLists'){
   const percent=basisPoints(input.percent,true);items(input.items);const before=structuredClone(row.items);for(const selected of input.items){const item=row.items.find(i=>i.productId===selected.productId);if(!item)throw Error('Produto fora da lista.');item.priceCents=roundRatio(item.priceCents,10000+percent);}touch(row,date,action,{...input,reason:reason(input)},{before,percentBps:percent});
  }else throw Error('Ação de regra inválida.');
 });
}
function validatedOffer(state,input,historical=null,allowInactive=()=>false){if(!input.priceListId&&!(input.promotionChoices||[]).length&&!input.offerReason){for(const i of input.items||[]){const p=state.products.find(p=>p.id===i.productId);if(!historical?.items.some(o=>o.productId===i.productId)&&p?.minimumPriceCents!==undefined&&p.priceCents<p.minimumPriceCents)throw Error('Justifique a negociação abaixo do mínimo informativo: '+p.name);}return null;}const offer=priceOffer(state,input,undefined,allowInactive);if(input.expectedOffer!==offer.signature)throw Error('A origem, preço ou promoção mudou. Revise a negociação novamente.');if(offer.promotionCents&&cents(input.discount||'0',true)>0&&input.allowPromotionDiscount!==true)throw Error('Confirme a combinação de promoção com desconto adicional.');text(input.offerReason,1000,'Justificativa');return offer;}
function historicalNegotiation(prior,items){const safe=require('./commands').safe;const next={...structuredClone(prior),items:structuredClone(items)};next.subtotalCents=items.reduce((n,i)=>safe(n+safe(i.priceCents*i.quantity)),0);next.baseCents=items.reduce((n,i)=>safe(n+safe((i.basePriceCents??i.priceCents)*i.quantity)),0);next.listCents=items.reduce((n,i)=>safe(n+safe((i.listPriceCents??i.priceCents)*i.quantity)),0);next.promotionCents=next.listCents-next.subtotalCents;next.signature=JSON.stringify({...next,signature:undefined});return next;}
module.exports={pricingAction,validatedOffer,historicalNegotiation};
