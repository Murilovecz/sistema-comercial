(function(root){
 const receipts=typeof module==='object'&&module.exports?require('./payments').receiptList:receiptList;
 function receivableRows(s,includeTransferred=false){
  const rows=(s.receivablePlan||[{id:'single-'+s.id,number:1,amountCents:s.totalCents,dueDate:s.dueDate||null}]).map(i=>({...i,saleId:s.id,customerId:s.customerId,customerName:s.customerName,receivedCents:0,creditCents:0,forgivenCents:0,remainingCents:i.amountCents,legacy:!s.receivablePlan}));
  for(const r of receipts(s)){if(r.allocations){for(const a of r.allocations){const part=rows.find(i=>i.id===a.installmentId);if(part){part.receivedCents+=a.amountCents;part.remainingCents-=a.amountCents;}}}else{let value=r.amountCents;for(const part of rows){const paid=Math.min(Math.max(0,part.remainingCents),value);part.receivedCents+=paid;part.remainingCents-=paid;value-=paid;}}}
  let internal=(s.storeCreditCents||0)-(s.storeCreditRestoredCents||0);for(const part of rows){const value=Math.min(Math.max(0,part.remainingCents),internal);if(value){part.internalCents=value;part.remainingCents-=value;internal-=value;}}
  let credit=(s.returns||[]).reduce((n,r)=>n+r.totalCents,0),forgiven=s.forgivenCents||0;
  const fixedForgiveness=(s.forgiveness||[]).flatMap(r=>r.allocations||[]);if(fixedForgiveness.length){for(const allocation of fixedForgiveness){const part=rows.find(i=>i.id===allocation.installmentId);if(part){const value=Math.min(part.remainingCents,allocation.amountCents);part.forgivenCents+=value;part.remainingCents-=value;forgiven-=allocation.amountCents;}}}
  for(const part of [...rows].reverse()){const forgivenPart=Math.min(Math.max(0,part.remainingCents),Math.max(0,forgiven));part.forgivenCents+=forgivenPart;part.remainingCents-=forgivenPart;forgiven-=forgivenPart;part.creditCents=Math.min(Math.max(0,part.remainingCents),credit);part.remainingCents-=part.creditCents;credit-=part.creditCents;part.remainingCents=Math.max(0,part.remainingCents);}
  if(s.activeAgreementId&&!includeTransferred)for(const i of rows){i.transferredCents=i.remainingCents;i.remainingCents=0;i.renegotiated=true;}return rows;
 }
 function allocationPreview(s,amountCents){let remaining=amountCents;const allocations=[];for(const p of receivableRows(s).sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')||a.number-b.number)){const paid=Math.min(p.remainingCents,remaining);if(paid){allocations.push({installmentId:p.id,amountCents:paid});remaining-=paid;}}if(remaining>0)throw Error('Valor acima do saldo a receber.');return allocations;}
 const api={receivableRows,allocationPreview};if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root,api);
})(typeof globalThis!=='undefined'?globalThis:this);
