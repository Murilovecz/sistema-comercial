(function(root){
 const safe=n=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Saldo de crédito inválido.');return n;};
 function storeCreditBalance(state,customerId){return safe((state.storeCredits||[]).filter(c=>c.customerId===customerId&&!c.cancelledAt).reduce((n,c)=>n+c.remainingCents,0));}
 function internalSettled(s){return safe((s.storeCreditCents||0)-(s.storeCreditRestoredCents||0));}
 function creditLineAllocation(s){
  const netAllocation=typeof module==='object'&&module.exports?require('./workflow-core').saleAllocation(s):saleAllocation(s),total=s.totalCents,credit=s.storeCreditCents||0;
  let left=credit;const rows=netAllocation.map(i=>{const bands=[{quantity:i.discountedUnits,netCents:i.unitNetCents-1},{quantity:i.quantity-i.discountedUnits,netCents:i.unitNetCents}].filter(b=>b.quantity>0).map(b=>{const unitCents=total?Number(BigInt(Math.max(0,b.netCents))*BigInt(credit)/BigInt(total)):0;left-=unitCents*b.quantity;return {...b,unitCents,extraUnits:0};});return {productId:i.productId,quantity:i.quantity,bands};});
  for(const r of rows)for(const b of r.bands)if(left&&b.unitCents<b.netCents){b.extraUnits=Math.min(left,b.quantity);left-=b.extraUnits;}
  if(left)throw Error('Rateio interno incompatível.');return rows;
 }
 function returnCreditCents(s,items){const allocations=creditLineAllocation(s);return safe(items.reduce((n,i)=>{const a=allocations.find(a=>a.productId===i.productId);const before=(s.returns||[]).reduce((x,r)=>x+r.items.filter(x=>x.productId===i.productId).reduce((y,x)=>y+x.quantity,0),0);const prefix=count=>{let amount=0,left=count;for(const b of a.bands){const qty=Math.min(left,b.quantity);amount+=qty*b.unitCents+Math.min(qty,b.extraUnits);left-=qty;}return amount;};return n+prefix(before+i.quantity)-prefix(before);},0));}
 const api={storeCreditBalance,internalSettled,creditLineAllocation,returnCreditCents};if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root,api);
})(typeof globalThis!=='undefined'?globalThis:this);
