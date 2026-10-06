'use strict';
const {randomUUID}=require('node:crypto'),{moneyCents}=require('./money'),{productFields,optional,movement}=require('./domain');
// Shared original creation path: transport-specific idempotency/authorization stay outside.
function createCatalogRecord(state,kind,input){
 if(!['products','customers'].includes(kind))throw Error('Cadastro inválido.');
 const next=structuredClone(state),name=String(input.name||'').trim();if(!name||name.length>120)throw Error('Informe um nome de até 120 caracteres.');
 if(kind==='products'){
  const stock=Number(input.stock),priceCents=moneyCents(input.price,true);
  if(!Number.isFinite(stock)||stock<0||!Number.isSafeInteger(stock)||!Number.isSafeInteger(priceCents))throw Error('Estoque ou preço inválido.');
  const product={id:randomUUID(),name,stock,priceCents,version:1,date:new Date().toISOString()};
  productFields(next,product,input);next.products.push(product);movement(next,product,stock,'initial',product.id);
 }else next.customers.push({id:randomUUID(),version:1,date:new Date().toISOString(),name,phone:String(input.phone||'').slice(0,40),email:String(input.email||'').slice(0,150),notes:optional(input.notes,1000)});
 return next;
}
module.exports={createCatalogRecord};
