'use strict';
const {AppError}=require('./errors'),{requestContext}=require('./request-context'),{requirePermission}=require('./identity'),{rejectClientAuthority}=require('./authorization');
const {loadState}=require('./scoped-state'),{saveBusinessState}=require('./state-repository'),{commercialSale}=require('./commercial-read');
function salePermissions(ctx){for(const permission of ['catalog.view','sales.view','sales.create'])requirePermission(ctx,permission);}
function body(raw){if(Buffer.byteLength(raw)>100000)throw new AppError(413,'BODY_TOO_LARGE','Venda muito grande.');let input;try{input=JSON.parse(raw);}catch{throw new AppError(400,'INVALID_JSON','Dados inválidos.');}if(!input||typeof input!=='object'||Array.isArray(input))throw new AppError(422,'INVALID_INPUT','Dados inválidos.');rejectClientAuthority(input);return input;}
async function handleCommercialWrite(runtime,req,raw,domain){
 const pathname=new URL(req.url,'http://local').pathname;
 if(req.method!=='POST'||!['/api/commercial/sales','/api/commercial/sales/inactive-approval','/api/commercial/sales/preview'].includes(pathname))return null;
 const initial=requestContext(runtime.identity,req,{write:true});salePermissions(initial);const input=body(raw),approvals=require('./inactive-sale-approval');
 if(pathname.endsWith('/inactive-approval'))return{status:201,value:await approvals.approveInactiveSale(runtime,req,input)};
 approvals.validateSaleDraft(input);
 if(pathname.endsWith('/preview'))return runtime.store.transaction(()=>{
  const ctx=requestContext(runtime.identity,req,{write:true});salePermissions(ctx);const {state}=loadState(runtime.store,ctx);
  if(input.customerId&&!require('../public/quotes-core').isActive(state.customers.find(c=>c.id===input.customerId)))throw new AppError(422,'INVALID_CUSTOMER','Cliente inexistente ou inativo.');
  // A price preview is read-only. This predicate is never passed to the sale command.
  const offer=require('../public/pricing-core').priceOffer(state,input,undefined,()=>true),totals=require('../public/discount-core').discountTotals(offer.subtotalCents,input.discount||'0',input.discountReason||'');
  if(offer.promotionCents&&totals.discountCents&&input.allowPromotionDiscount!==true)throw new AppError(422,'PROMOTION_DISCOUNT_CONFIRMATION','Confirme a combinação da promoção com o desconto adicional.');
  return{status:200,value:{offer,expectedOffer:offer.signature,...totals,inactiveProductIds:offer.items.filter(item=>state.products.find(p=>p.id===item.productId)?.active===false).map(item=>item.productId)}};
 });
 return runtime.store.transaction(()=>{
  const ctx=requestContext(runtime.identity,req,{write:true});salePermissions(ctx);const {state,revision}=loadState(runtime.store,ctx),fingerprint=approvals.draftFingerprint(input),existing=state.sales.find(s=>s.requestId===input.requestId);
  if(existing){if(existing.commercialCommandFingerprint!==fingerprint)throw new AppError(409,'REPLAY_CHANGED','Esta confirmação já foi usada com outros dados ou em outro fluxo.');return{status:201,value:{sale:commercialSale(existing)}};}
  const proof=approvals.consumeInactiveApproval(runtime.store,ctx,state,input),trustedInput={...input,responsible:ctx.user.name},next=domain.sale(state,trustedInput,null,proof),created=next.sales.find(s=>s.requestId===input.requestId);
  if(!created)throw Error('Venda não foi produzida pelo domínio.');created.commercialCommandFingerprint=fingerprint;
  if(proof)approvals.bindSaleProof(runtime.store,ctx,proof,created);
  const result=saveBusinessState(runtime.store,ctx,state,next,revision,trustedInput,pathname,proof);
  return{status:201,value:{sale:commercialSale(result.state.sales.find(s=>s.id===created.id))}};
 });
}
module.exports={handleCommercialWrite};
