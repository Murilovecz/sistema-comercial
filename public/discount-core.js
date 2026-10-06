const discountMoney=typeof module!=='undefined'?require('./money').moneyCents:moneyCents;
function discountTotals(subtotalCents,value='0',reason=''){
 if(!Number.isSafeInteger(subtotalCents)||subtotalCents<0)throw Error('Subtotal fora do limite permitido.');
 const discountCents=discountMoney(value===''?'0':value,true),discountReason=String(reason||'').trim();
 if(discountCents>0&&discountCents>=subtotalCents)throw Error('O desconto deve ser menor que o subtotal.');
 if(discountReason.length>500)throw Error('Use até 500 caracteres no motivo do desconto.');
 if(discountCents&&!discountReason)throw Error('Informe o motivo do desconto.');
 return {subtotalCents,discountCents,discountReason,totalCents:subtotalCents-discountCents};
}
function commercialSubtotal(record){return record.subtotalCents??record.items.reduce((n,i)=>n+i.quantity*i.priceCents,0);}
if(typeof module!=='undefined')module.exports={discountTotals,commercialSubtotal};
