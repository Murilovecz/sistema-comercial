(function(root){
 const day=typeof module==='object'&&module.exports?require('./reports').calendarDay:calendarDay;
 const safe=(n,label)=>{if(!Number.isSafeInteger(n))throw Error(label+' fora do limite permitido.');return n;};
 function reservationStatus(r,today=day()){return r.saleId?'converted':r.cancelledAt?'cancelled':r.validUntil&&r.validUntil<today?'expired':'open';}
 function reservedQuantity(state,id,exceptId=null,today=day()){return safe((state.reservations||[]).filter(r=>r.id!==exceptId&&reservationStatus(r,today)==='open').reduce((n,r)=>n+r.items.filter(i=>i.productId===id).reduce((s,i)=>s+i.quantity,0),0),'Quantidade reservada');}
 function availableQuantity(state,product,exceptId=null){return Math.max(0,product.stock-reservedQuantity(state,product.id,exceptId));}
 function inventoryStatus(r){return r.appliedAt?'applied':r.cancelledAt?'cancelled':'draft';}
 function stockToken(state,id){return (state.stockMovements||[]).filter(m=>m.productId===id).at(-1)?.id||null;}
 function inventoryPreview(state,r){return r.items.map(i=>{const p=state.products.find(p=>p.id===i.productId);return {...i,currentGlobalStock:p?.stock??null,currentStock:p?(r.positionScope!==undefined?(typeof module==='object'&&module.exports?require('./positions-core').positionQuantity:positionQuantity)(state,p,r.positionScope):p.stock):null,reserved:p?reservedQuantity(state,p.id):0,difference:i.counted===null?null:i.counted-i.expectedStock,conflict:!p||(r.positionScope!==undefined?((typeof module==='object'&&module.exports?require('./positions-core').positionToken:positionToken)(p)!==i.positionToken):p.stock!==i.expectedStock)||stockToken(state,i.productId)!==i.stockToken};});}
 function inventorySummary(rows){return rows.reduce((s,i)=>{s.products++;if(i.counted===null)s.missing++;else{s.counted+=i.counted;if(i.difference>0)s.increase+=i.difference;if(i.difference<0)s.decrease-=i.difference;if(i.difference)s.changed++;}if(i.conflict)s.conflicts++;for(const key of ['counted','increase','decrease'])safe(s[key],'Total da contagem');return s;},{products:0,counted:0,missing:0,increase:0,decrease:0,changed:0,conflicts:0});}
 function saleAllocation(s){
  if(s.returnAllocation)return s.returnAllocation;
  const subtotal=safe(s.items.reduce((n,i)=>n+safe(i.quantity*i.priceCents,'Subtotal'),0),'Subtotal'),discount=s.discountCents||0;
  const rows=s.items.map(i=>({productId:i.productId,quantity:i.quantity,unitNetCents:i.priceCents-(subtotal?Number(BigInt(i.priceCents)*BigInt(discount)/BigInt(subtotal)):0),discountedUnits:0}));
  let remaining=discount-rows.reduce((n,r,index)=>n+(s.items[index].priceCents-r.unitNetCents)*r.quantity,0);
  for(const r of rows){if(!remaining)break;if(r.unitNetCents){r.discountedUnits=Math.min(remaining,r.quantity);remaining-=r.discountedUnits;}}
  return rows;
 }
 function saleLineNets(s){return saleAllocation(s).map(r=>r.unitNetCents*r.quantity-r.discountedUnits);}
 function returnedQuantity(s,id){return (s.returns||[]).reduce((n,r)=>n+r.items.filter(i=>i.productId===id).reduce((m,i)=>m+i.quantity,0),0);}
 function returnedCents(s){return (s.returns||[]).reduce((n,r)=>n+r.totalCents,0);}
 function saleCommercialCents(s){return Math.max(0,s.totalCents-returnedCents(s));}
 function returnPreview(s,input){const allocations=saleAllocation(s);return input.map(i=>{const index=s.items.findIndex(o=>o.productId===i.productId),original=s.items[index];if(!original)throw Error('Produto não pertence à venda.');const a=allocations[index],before=returnedQuantity(s,i.productId),after=before+i.quantity;return {...i,name:original.name,remaining:original.quantity-before,amountCents:a.unitNetCents*i.quantity-(Math.min(after,a.discountedUnits)-Math.min(before,a.discountedUnits))};});}
 function refundBalance(s){const received=(s.receipts||[]).reduce((n,r)=>n+r.amountCents,0),refunded=(s.refunds||[]).reduce((n,r)=>n+r.amountCents,0),internal=(s.storeCreditCents||0)-(s.storeCreditRestoredCents||0);return {receivedCents:received,refundedCents:refunded,availableCents:Math.max(0,received-Math.max(0,(s.cancelledAt?0:saleCommercialCents(s))-internal)-refunded-(s.storeCreditIssuedCents||0))};}
 const api={reservationStatus,reservedQuantity,availableQuantity,inventoryStatus,stockToken,inventoryPreview,inventorySummary,saleAllocation,saleLineNets,returnedQuantity,returnedCents,saleCommercialCents,returnPreview,refundBalance};if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root,api);
})(typeof globalThis!=='undefined'?globalThis:this);
