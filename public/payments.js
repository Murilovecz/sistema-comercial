function receiptList(s){
 if(Array.isArray(s.receipts))return s.receipts;
 if(s.paymentStatus==='received')return [{id:'legacy-'+s.id,amountCents:s.totalCents,paymentMethod:s.paymentMethod||null,date:s.receivedAt||null,cashSessionId:null,legacy:true}];
 return [];
}
function paymentBalance(s){
 const known=['received','pending','partial'].includes(s.paymentStatus);
 const receivedCents=receiptList(s).reduce((total,r)=>total+r.amountCents,0);
 const returnedCents=(s.returns||[]).reduce((n,r)=>n+r.totalCents,0),forgivenCents=s.forgivenCents||0,commercialCents=Math.max(0,s.totalCents-returnedCents-forgivenCents);
 const internalCents=(s.storeCreditCents||0)-(s.storeCreditRestoredCents||0);
 return {known,receivedCents,...(s.storeCreditCents?{internalCents}:{}),remainingCents:known?Math.max(0,commercialCents-receivedCents-internalCents):null};
}
if(typeof module!=='undefined')module.exports={receiptList,paymentBalance};
