(function(root){
 const key=value=>String(value??'').trim().toLowerCase();
 function validateProductIdentifiers(products,product,input){
  const code=String((input.code===undefined?(product.code||''):input.code)??'').trim();
  if(input.barcode!==undefined&&input.barcode!==null&&typeof input.barcode!=='string')throw Error('Informe o código de barras como texto para preservar os zeros iniciais.');
  const barcode=String(input.barcode===undefined?(product.barcode||''):input.barcode??'').trim();
  if(code.length>40)throw Error('Use no máximo 40 caracteres no código interno.');
  if(barcode.length>64||(barcode&&!/^[!-~]+$/.test(barcode)))throw Error('Use até 64 caracteres sem espaços no código de barras.');
  for(const other of products){
   if(other.id===product.id)continue;
   const identifiers=[key(other.code),key(other.barcode),...(other.aliases||[]).map(a=>key(a.code)),...(other.packages||[]).map(a=>key(a.code))].filter(Boolean);
   if(code&&identifiers.includes(key(code)))throw Error('Já existe um produto com este código interno ou de barras.');
   if(barcode&&identifiers.includes(key(barcode)))throw Error('Já existe um produto com este código de barras ou interno.');
  }
  if([...(product.aliases||[]),...(product.packages||[])].some(a=>a.code&&[key(code),key(barcode)].includes(key(a.code))))throw Error('Código já reservado por identificador ou embalagem deste produto.');
  return {code,barcode};
 }
 function lookupProduct(products,value){
  const term=key(value);if(!term)return {status:'empty'};
  const matches=products.filter(p=>[key(p.barcode),key(p.code),...(p.aliases||[]).filter(a=>a.active!==false).map(a=>key(a.code)),...(p.packages||[]).filter(a=>a.active!==false).map(a=>key(a.code))].includes(term));
  if(!matches.length)return {status:'missing'};
  if(matches.length>1)return {status:'ambiguous'};
  const product=matches[0],pack=(product.packages||[]).find(a=>a.active!==false&&key(a.code)===term),alias=(product.aliases||[]).find(a=>a.active!==false&&key(a.code)===term);
  return {status:'found',product,...(pack?{package:pack,factor:pack.factor}:{}),...(alias?{alias}:{})};
 }
 function addProductToCart(products,items,productId,quantity=1){
  const product=products.find(p=>p.id===productId);
  if(!product)throw Error('Produto não encontrado.');
  if(product.active===false)throw Error('Este produto está inativo e não pode entrar na venda.');
  if(!Number.isSafeInteger(quantity)||quantity<1)throw Error('Informe uma quantidade inteira maior que zero.');
  const existing=items.find(i=>i.productId===productId),total=quantity+(existing?.quantity||0);
  if(!Number.isSafeInteger(total)||total>(product.availableStock??product.stock))throw Error('Quantidade maior que o estoque disponível: '+product.name+'.');
  const next=items.map(i=>({...i}));
  if(existing)next.find(i=>i.productId===productId).quantity=total;else next.push({productId,quantity});
  return next;
 }
 const api={validateProductIdentifiers,lookupProduct,addProductToCart};
 if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root,api);
})(typeof globalThis!=='undefined'?globalThis:this);
