(function(root){
 const money=typeof module==='object'&&module.exports?require('./money').moneyCents:moneyCents;
 const safe=n=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Valor fora do limite permitido.');return n;};
 function checkoutPreview(totalCents,internalCents,payments=[],allowPending=false){
  safe(totalCents);safe(internalCents);if(internalCents>totalCents)throw Error('Crédito acima do total.');
  if(!Array.isArray(payments)||payments.length>12)throw Error('Use até 12 formas de recebimento.');
  let paid=0,cash=0,tendered=0;const lines=payments.map(p=>{
   if(!['cash','pix','debit','credit','other'].includes(p.paymentMethod))throw Error('Escolha a forma efetiva de cada recebimento.');
   const amountCents=money(p.value);paid=safe(paid+amountCents);let tenderedCents=amountCents;
   if(p.paymentMethod==='cash'){tenderedCents=p.tendered===''||p.tendered===undefined?amountCents:money(p.tendered);if(tenderedCents<amountCents)throw Error('Dinheiro entregue abaixo do valor recebido.');cash=safe(cash+amountCents);tendered=safe(tendered+tenderedCents);}
   else if(p.tendered!==undefined&&p.tendered!=='')throw Error('Troco só se aplica a dinheiro.');
   const reference=String(p.reference||'').trim();if(reference.length>120)throw Error('Referência deve ter até 120 caracteres.');
   return {paymentMethod:p.paymentMethod,amountCents,tenderedCents,changeCents:tenderedCents-amountCents,reference};
  });
  const external=totalCents-internalCents;if(paid>external)throw Error('Recebimentos acima do restante da venda. Informe o valor líquido; troco fica separado.');
  if(paid<external&&!allowPending)throw Error('Distribua todo o restante ou escolha deixar saldo a receber.');
  return {lines,totalCents,internalCents,receivedCents:paid,remainingCents:external-paid,cashCents:cash,tenderedCents:tendered,changeCents:tendered-cash,status:external===paid?'received':paid>0||internalCents>0?'partial':'pending'};
 }
 const api={checkoutPreview};if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root,api);
})(typeof globalThis!=='undefined'?globalThis:this);
