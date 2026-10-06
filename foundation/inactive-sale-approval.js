'use strict';
const {randomBytes,randomUUID}=require('node:crypto');
const {AppError}=require('./errors'),{hash}=require('./sql-store');
const {requestContext}=require('./request-context'),{loadState,assertScope}=require('./scoped-state');
const {requirePermission,loginValue,hashPassword,verifyPassword}=require('./identity');
const {effectivePermissions}=require('./rbac');
const proofs=new WeakMap(),clocks=new WeakMap();
const canonical=value=>require('./state-repository').canonical(value);
const permission='sales.authorize_inactive',executorPermissions=['catalog.view','sales.view','sales.create'];
const TOP=new Set(['requestId','customerId','paymentMethod','paymentStatus','dueDate','items','discount','discountReason','priceListId','promotionChoices','expectedOffer','offerReason','allowPromotionDiscount','storeCreditValue','expectedStoreCreditCents','checkoutPayments','allowPending','pos','sourcePositionId','expectedPositions','expectedCashSessionId','approvalToken','responsible']);
function fail(status=409,code='INACTIVE_APPROVAL_INVALID',message='A autorização mudou ou não é válida para esta venda. Revise e solicite novamente.'){return new AppError(status,code,message);}
function object(value,allowed){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!allowed.has(k)))throw fail(422,'INVALID_SALE_DRAFT','Campos de venda inválidos ou não permitidos.');}
function validateSaleDraft(input){
 object(input,TOP);
 if(typeof input.requestId!=='string'||!input.requestId.trim()||input.requestId.length>80||!Array.isArray(input.items)||!input.items.length||input.items.length>500)throw fail(422,'INVALID_SALE_DRAFT','Informe identificação de confirmação e de 1 a 500 itens.');
 for(const item of input.items){object(item,new Set(['productId','quantity','priceCents','packages','substitutedFrom','sourcePositionId','expectedVersion']));if(typeof item.productId!=='string'||!item.productId||item.productId.length>120||!['number','string'].includes(typeof item.quantity)||!Number.isSafeInteger(Number(item.quantity))||Number(item.quantity)<1)throw fail(422,'INVALID_SALE_DRAFT','Produto ou quantidade inválidos.');if(item.priceCents!==undefined&&(!Number.isSafeInteger(item.priceCents)||item.priceCents<0))throw fail(422,'INVALID_SALE_DRAFT','Preço inválido.');
  if(item.packages!==undefined){if(!Array.isArray(item.packages)||item.packages.length>100)throw fail(422,'INVALID_SALE_DRAFT');for(const p of item.packages)object(p,new Set(['packageId','name','factor','count','version']));}
  if(item.substitutedFrom!==undefined&&typeof item.substitutedFrom!=='string')object(item.substitutedFrom,new Set(['id','name','code']));
 }
 if(input.promotionChoices!==undefined){if(!Array.isArray(input.promotionChoices)||input.promotionChoices.length>500)throw fail(422,'INVALID_SALE_DRAFT');for(const p of input.promotionChoices)object(p,new Set(['productId','promotionId']));}
 if(input.checkoutPayments!==undefined){if(!Array.isArray(input.checkoutPayments)||input.checkoutPayments.length>12)throw fail(422,'INVALID_SALE_DRAFT');for(const p of input.checkoutPayments)object(p,new Set(['paymentMethod','value','tendered','reference']));}
 if(input.pos!==undefined)object(input.pos,new Set(['station','shift']));
 if(input.expectedPositions!==undefined&&(input.expectedPositions===null||typeof input.expectedPositions!=='object'||Array.isArray(input.expectedPositions)||Object.values(input.expectedPositions).some(v=>typeof v!=='string')))throw fail(422,'INVALID_SALE_DRAFT');
 if(Buffer.byteLength(JSON.stringify(input))>100000)throw fail(413,'SALE_DRAFT_TOO_LARGE','Dados da venda muito grandes.');
 return input;
}
function draftFingerprint(input){validateSaleDraft(input);return hash(canonical(Object.fromEntries(Object.entries(input).filter(([k])=>!['approvalToken','responsible'].includes(k)))));}
function now(store){return clocks.get(store)?.now()??Date.now();}
function registerApprovalIdentity(store,identity){if(identity.store!==store||typeof identity.now!=='function')throw Error('Identidade de aprovação inválida.');clocks.set(store,identity);}
function snapshots(state,input){const ids=[...new Set(input.items.map(i=>i.productId))].sort();return ids.map(id=>{const p=state.products.find(p=>p.id===id);if(!p)throw fail(422,'PRODUCT_NOT_FOUND','Produto inexistente nesta unidade.');return{id,hash:hash(canonical(p)),inactive:p.active===false};});}
function executor(store,ctx){
 assertScope(store,ctx);const rights=effectivePermissions(store,ctx.userId,ctx.companyId,ctx.unitId);for(const code of executorPermissions)if(!rights.includes(code))throw fail(403,'FORBIDDEN','Você não tem permissão para esta venda.');
 const session=store.db.prepare('SELECT * FROM sessions WHERE id=?').get(ctx.sessionId),time=now(store),idle=clocks.get(store)?.idleMs??30*60000;
 if(!session||session.user_id!==ctx.userId||session.company_id!==ctx.companyId||session.unit_id!==ctx.unitId||session.revoked_at||!Number.isFinite(Date.parse(session.expires_at))||!Number.isFinite(Date.parse(session.last_seen_at))||time>=Date.parse(session.expires_at)||time-Date.parse(session.last_seen_at)>=idle)throw fail(401,'INVALID_SESSION','Entre novamente para continuar.');
 return rights;
}
function authorizer(store,ctx,userId){const user=store.db.prepare("SELECT * FROM users WHERE id=? AND status='active'").get(userId);return user&&effectivePermissions(store,userId,ctx.companyId,ctx.unitId).includes(permission)?user:null;}
async function approveInactiveSale(runtime,req,input){
 object(input,new Set(['saleDraft','approverLogin','approverPassword','reason']));validateSaleDraft(input.saleDraft);
 if(Object.hasOwn(input.saleDraft,'approvalToken'))throw fail(422,'INVALID_SALE_DRAFT','Solicite uma nova autorização sem token anterior.');
 if(typeof input.reason!=='string'||!input.reason.trim()||input.reason.trim().length>500)throw fail(422,'APPROVAL_REASON_REQUIRED','Informe um motivo de 1 a 500 caracteres.');
 const {store,identity}=runtime;registerApprovalIdentity(store,identity);const initial=requestContext(identity,req,{write:true});executor(store,initial);
 let login;try{login=loginValue(input.approverLogin);}catch{throw fail(403,'APPROVAL_DENIED','Não foi possível autorizar com os dados informados.');}
 identity.rate(req,login);const user=store.db.prepare('SELECT * FROM users WHERE login=?').get(login);
 const verified=await identity.kdf(async()=>{if(!identity.dummy)identity.dummy=await hashPassword(randomBytes(24).toString('base64url'));return verifyPassword(input.approverPassword,user?.password_hash||identity.dummy);});
 const result=store.transaction(()=>{
  const ctx=requestContext(identity,req,{write:true});executor(store,ctx);
  if(ctx.sessionId!==initial.sessionId||ctx.userId!==initial.userId||ctx.companyId!==initial.companyId||ctx.unitId!==initial.unitId)throw fail();
  const approver=user&&authorizer(store,ctx,user.id);
  if(!verified||!approver||approver.password_hash!==user.password_hash){require('./audit').appendAudit(store,{...ctx,action:'INACTIVE_APPROVAL_DENIED',entity:'sale',reason:'Autorização excepcional não concedida.'});return{denied:true};}
  const {state}=loadState(store,ctx),productSnapshot=snapshots(state,input.saleDraft);if(!productSnapshot.some(p=>p.inactive))throw fail(422,'NO_INACTIVE_PRODUCTS','Esta venda não possui produtos desativados.');
  const time=now(store),id=randomUUID(),token=randomBytes(32).toString('base64url'),date=new Date(time).toISOString(),expiresAt=new Date(time+120000).toISOString();
  const roles=store.db.prepare('SELECT r.name FROM unit_roles ur JOIN roles r ON r.company_id=ur.company_id AND r.id=ur.role_id WHERE ur.user_id=? AND ur.company_id=? AND ur.unit_id=? ORDER BY r.name,r.id').all(approver.id,ctx.companyId,ctx.unitId).map(r=>r.name);
  store.db.prepare('INSERT INTO inactive_sale_approvals(id,token_hash,executor_id,session_id,company_id,unit_id,request_id,fingerprint,product_snapshot_json,authorizer_id,authorizer_name,authorizer_roles_json,authorizer_hash_digest,reason,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,hash(token),ctx.userId,ctx.sessionId,ctx.companyId,ctx.unitId,input.saleDraft.requestId,draftFingerprint(input.saleDraft),JSON.stringify(productSnapshot),approver.id,approver.name,JSON.stringify(roles),hash(approver.password_hash),input.reason.trim(),date,expiresAt);
  require('./audit').appendAudit(store,{...ctx,action:'INACTIVE_APPROVAL_GRANTED',entity:'inactive_sale_approval',recordId:id,after:{approvalId:id,approverId:approver.id,approverName:approver.name,approverRoles:roles,reason:input.reason.trim(),inactiveProductIds:productSnapshot.filter(p=>p.inactive).map(p=>p.id),expiresAt}});
  return{approvalToken:token,approvalId:id,expiresAt};
 });
 if(result.denied)throw fail(403,'APPROVAL_DENIED','Não foi possível autorizar com os dados informados.');return result;
}
function consumeInactiveApproval(store,ctx,state,input){
 store.requireTransaction();validateSaleDraft(input);executor(store,ctx);const current=snapshots(state,input),inactive=current.filter(p=>p.inactive);
 if(!input.approvalToken){if(inactive.length)throw fail(403,'INACTIVE_APPROVAL_REQUIRED','Produto desativado exige liberação por senha e motivo.');return null;}
 if(typeof input.approvalToken!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(input.approvalToken))throw fail();
 const row=store.db.prepare('SELECT * FROM inactive_sale_approvals WHERE token_hash=?').get(hash(input.approvalToken)),approver=row&&authorizer(store,ctx,row.authorizer_id);
 if(!row||row.consumed_at||row.executor_id!==ctx.userId||row.session_id!==ctx.sessionId||row.company_id!==ctx.companyId||row.unit_id!==ctx.unitId||row.request_id!==input.requestId||row.fingerprint!==draftFingerprint(input)||!approver||hash(approver.password_hash)!==row.authorizer_hash_digest||!Number.isFinite(Date.parse(row.expires_at))||now(store)>=Date.parse(row.expires_at)||canonical(current)!==canonical(JSON.parse(row.product_snapshot_json)))throw fail();
 const time=new Date(now(store)).toISOString();if(store.db.prepare('UPDATE inactive_sale_approvals SET consumed_at=? WHERE id=? AND consumed_at IS NULL').run(time,row.id).changes!==1)throw fail();
 const proof=Object.freeze({}),data={store,epoch:store.transactionEpoch,ctx:{userId:ctx.userId,sessionId:ctx.sessionId,companyId:ctx.companyId,unitId:ctx.unitId},row:{...row,consumed_at:time},snapshot:current,saleId:null};proofs.set(proof,data);return proof;
}
function proofData(proof,store=null,ctx=null){const data=proof&&proofs.get(proof);if(!data||!data.store.inTransaction||data.epoch!==data.store.transactionEpoch||store&&store!==data.store||ctx&&Object.keys(data.ctx).some(k=>ctx[k]!==data.ctx[k]))throw fail(422,'APPROVAL_REQUIRED','Autorização excepcional exige prova interna verificada.');return data;}
function isInactiveApproved(proof,product){try{const data=proofData(proof);return data.snapshot.some(p=>p.id===product?.id&&p.inactive&&p.hash===hash(canonical(product)));}catch{return false;}}
function bindSaleProof(store,ctx,proof,sale){const data=proofData(proof,store,ctx);if(data.saleId&&data.saleId!==sale.id||sale.requestId!==data.row.request_id||sale.commercialCommandFingerprint!==data.row.fingerprint)throw fail();if(!sale.items?.some(i=>data.snapshot.some(p=>p.id===i.productId&&p.inactive)))throw fail();if(store.db.prepare('UPDATE inactive_sale_approvals SET sale_id=? WHERE id=? AND consumed_at=? AND (sale_id IS NULL OR sale_id=?)').run(sale.id,data.row.id,data.row.consumed_at,sale.id).changes!==1)throw fail();data.saleId=sale.id;return proof;}
function approvalMetadata(store,ctx,proof){const data=proofData(proof,store,ctx);return{approvalId:data.row.id,authorizedBy:data.row.authorizer_id,approverName:data.row.authorizer_name,approverRoles:JSON.parse(data.row.authorizer_roles_json),approvalReason:data.row.reason,approvedAt:data.row.created_at,inactiveProductIds:data.snapshot.filter(p=>p.inactive).map(p=>p.id)};}
function verifiedRecordApproval(store,ctx,proof,kind,row){const data=proofData(proof,store,ctx);return Boolean(data.saleId&&(kind==='sales'&&row.id===data.saleId||['stockMovements','positionMovements'].includes(kind)&&row.type==='sale'&&row.referenceId===data.saleId&&data.snapshot.some(p=>p.id===row.productId&&p.inactive)));}
function verifyAuditApproval(store,input){const data=proofData(input.approvalProof,store,{userId:input.userId,sessionId:input.sessionId,companyId:input.companyId,unitId:input.unitId});if(input.authorizedBy!==data.row.authorizer_id||!verifiedRecordApproval(store,data.ctx,input.approvalProof,input.entity,input.after))throw fail(422,'APPROVAL_REQUIRED');return data.row.authorizer_id;}
module.exports={approveInactiveSale,consumeInactiveApproval,isInactiveApproved,bindSaleProof,approvalMetadata,draftFingerprint,validateSaleDraft,verifiedRecordApproval,verifyAuditApproval,registerApprovalIdentity};
