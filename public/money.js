function moneyCents(value,allowZero=false){
 if(!['string','number'].includes(typeof value)||!/^\d+(\.\d{1,2})?$/.test(String(value).trim()))throw Error('Informe um valor com até duas casas decimais.');
 const [whole,fraction='']=String(value).trim().split('.');
 const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(cents)||cents<(allowZero?0:1))throw Error(allowZero?'Informe um valor válido.':'Informe um valor maior que zero.');
 return cents;
}
if(typeof module!=='undefined')module.exports={moneyCents};
