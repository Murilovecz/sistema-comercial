(function(root){
 const localDay=typeof module==='object'&&module.exports?require('./reports').calendarDay:calendarDay;
 const safe=n=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Preço ou total fora do limite permitido.');return n;};
 function basisPoints(value,signed=false){const string=String(value??'').trim();if(!new RegExp(signed?'^-?\\d+(\\.\\d{1,2})?$':'^\\d+(\\.\\d{1,2})?$').test(string))throw Error('Percentual deve ter até duas casas.');const negative=string.startsWith('-'),parts=string.replace('-','').split('.'),n=Number(parts[0])*100+Number((parts[1]||'').padEnd(2,'0'));if(!Number.isSafeInteger(n)||n>1000000||negative&&n>10000)throw Error('Percentual fora do limite.');return negative?-n:n;}
 function roundRatio(cents,numerator,denominator=10000){safe(cents);if(!Number.isSafeInteger(numerator)||numerator<0)throw Error('Percentual inválido.');return safe(Number((BigInt(cents)*BigInt(numerator)+BigInt(denominator)/2n)/BigInt(denominator)));}
 function ruleStatus(row,today=localDay()){return row.closedAt?'closed':row.active===false?'paused':row.startsOn&&row.startsOn>today?'scheduled':row.endsOn&&row.endsOn<today?'expired':'active';}
 function promotionProducts(state,row){return row.productIds||state.products.filter(p=>p.category===row.category).map(p=>p.id);}
 function promotionCandidates(state,productId,quantity,priceListId='',today=localDay()){return (state.promotions||[]).filter(r=>ruleStatus(r,today)==='active'&&promotionProducts(state,r).includes(productId)&&quantity>=r.minQuantity).map(r=>({...r,priceListId}));}
 function priceOffer(state,input,today=localDay(),allowInactive=()=>false){
  if(!Array.isArray(input.items)||!input.items.length||input.items.length>500)throw Error('Adicione de 1 a 500 itens.');
  const list=input.priceListId?(state.priceLists||[]).find(l=>l.id===input.priceListId):null;if(input.priceListId&&(!list||ruleStatus(list,today)!=='active'))throw Error('Lista inativa ou fora de vigência.');
  const selected=input.promotionChoices||[];if(!Array.isArray(selected)||new Set(selected.map(i=>i.productId)).size!==selected.length)throw Error('Escolha somente uma promoção por produto.');
  const seen=new Set(),items=input.items.map(i=>{
   if(seen.has(i.productId))throw Error('Produto repetido na negociação.');seen.add(i.productId);
   const p=state.products.find(p=>p.id===i.productId);if(!p||p.active===false&&!allowInactive(p)||!Number.isSafeInteger(i.quantity)||i.quantity<1)throw Error('Produto ou quantidade inválida.');
   const explicit=list?.items.find(row=>row.productId===p.id),listPriceCents=explicit?.priceCents??p.priceCents,choice=selected.find(c=>c.productId===p.id);let priceCents=listPriceCents,promotion=null;
   if(choice?.promotionId){const r=promotionCandidates(state,p.id,i.quantity,input.priceListId,today).find(r=>r.id===choice.promotionId);if(!r)throw Error('Promoção indisponível ou quantidade insuficiente: '+p.name);priceCents=r.type==='fixed'?r.valueCents:roundRatio(listPriceCents,10000-r.percentBps);if(priceCents>listPriceCents)throw Error('A promoção não reduz o preço selecionado: '+p.name);promotion={id:r.id,name:r.name,version:r.version,type:r.type,percentBps:r.percentBps??null,valueCents:r.valueCents??null,minQuantity:r.minQuantity,startsOn:r.startsOn,endsOn:r.endsOn};}
   if(p.minimumPriceCents!==undefined&&priceCents<p.minimumPriceCents&&!String(input.offerReason||'').trim())throw Error('Justifique a negociação abaixo do mínimo informativo: '+p.name);
   return {productId:p.id,name:p.name,quantity:i.quantity,basePriceCents:p.priceCents,listPriceCents,priceCents,priceOrigin:explicit?'list':'standard',priceListId:explicit?list.id:null,priceListName:explicit?list.name:null,priceListVersion:explicit?list.version:null,promotion};
  });
  if(selected.some(c=>!seen.has(c.productId)))throw Error('Promoção selecionada para item fora do carrinho.');
  const subtotalCents=safe(items.reduce((n,i)=>safe(n+safe(i.priceCents*i.quantity)),0)),baseCents=safe(items.reduce((n,i)=>safe(n+safe(i.basePriceCents*i.quantity)),0)),listCents=safe(items.reduce((n,i)=>safe(n+safe(i.listPriceCents*i.quantity)),0));
  const snapshot={priceListId:list?.id||null,priceListName:list?.name||null,priceListVersion:list?.version||null,offerReason:String(input.offerReason||'').trim(),customerId:input.customerId||null,items,subtotalCents,baseCents,listCents,promotionCents:listCents-subtotalCents};
  return {...snapshot,signature:JSON.stringify(snapshot)};
 }
 function comparePriceLists(state,leftId,rightId){const left=state.priceLists?.find(r=>r.id===leftId),right=state.priceLists?.find(r=>r.id===rightId);return state.products.map(p=>{const l=left?.items.find(i=>i.productId===p.id)?.priceCents??p.priceCents,r=right?.items.find(i=>i.productId===p.id)?.priceCents??p.priceCents;return {productId:p.id,name:p.name,standard:p.priceCents,left:l,right:r,difference:r-l};});}
 const api={basisPoints,roundRatio,ruleStatus,promotionProducts,promotionCandidates,priceOffer,comparePriceLists};if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root,api);
})(typeof globalThis!=='undefined'?globalThis:this);
