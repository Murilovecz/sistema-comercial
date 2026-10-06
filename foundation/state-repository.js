'use strict';
const{validateDatabase,collections}=require('../storage');const{assertScope,loadState}=require('./scoped-state');const{AppError}=require('./errors');const{appendAudit}=require('./audit');const{executionMetadata,stampExecution}=require('./execution');
function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
function writeState(store,scope,state,expectedRevision){
 store.requireTransaction();assertScope(store,scope);validateDatabase(state);
 const current=loadState(store,scope);if(current.revision!==expectedRevision)throw new AppError(409,'STATE_CHANGED','Os dados mudaram. Atualize e revise novamente.');
 if(current.revision>0&&canonical(current.state)===canonical(state)){require('./commercial-store').normalizeProducts(store,scope,state,current.revision);require('./commercial-store').normalizeCustomers(store,scope,state,current.revision);require('./commercial-store').normalizeSuppliers(store,scope,state,current.revision);require('./commercial-store').normalizePurchases(store,scope,state,current.revision);require('./inventory-store').normalizeInventory(store,scope,state,current.revision);require('./sales-store').normalizeSales(store,scope,state,current.revision);return current.revision;}
 const revision=current.revision+1;if(!Number.isSafeInteger(revision))throw new AppError(409,'REVISION_LIMIT','Limite de versão atingido.');
 const payload=JSON.stringify(state),date=new Date().toISOString();
 require('./commercial-store').syncProducts(store,scope,state,revision);
 require('./commercial-store').syncCustomers(store,scope,state,revision);
 require('./commercial-store').syncSuppliers(store,scope,state,revision);
 require('./commercial-store').syncPurchases(store,scope,state,revision);
 require('./inventory-store').syncInventory(store,scope,state,revision);
 require('./sales-store').syncSales(store,scope,state,revision);
 if(current.revision===0)store.db.prepare('INSERT INTO unit_states VALUES(?,?,?,?,?)').run(scope.companyId,scope.unitId,revision,payload,date);
 else{const changed=store.db.prepare('UPDATE unit_states SET revision=?,payload=?,updated_at=? WHERE company_id=? AND unit_id=? AND revision=?').run(revision,payload,date,scope.companyId,scope.unitId,current.revision);if(changed.changes!==1)throw new AppError(409,'STATE_CHANGED','Os dados mudaram.');}
 store.db.prepare('DELETE FROM entity_index WHERE company_id=? AND unit_id=?').run(scope.companyId,scope.unitId);
 const insert=store.db.prepare('INSERT INTO entity_index VALUES(?,?,?,?)');
 for(const[kind,records]of Object.entries(state))if(collections.includes(kind)&&!kind.endsWith('Commands')&&Array.isArray(records))for(const row of records)if(row&&typeof row.id==='string'&&row.id)insert.run(scope.companyId,scope.unitId,kind,row.id);
 require('./commercial-store').verifyCommercialMirror(store,scope,state);
 return revision;
}
function auditChanges(store,ctx,before,after,route='',proof=null){
 const omit=new Set(['operationCommands','purchaseCommands','quoteCommands','cashCommands','auditLog']);
 for(const kind of new Set([...Object.keys(before),...Object.keys(after)])){
  if(omit.has(kind))continue;
  if(!Array.isArray(before[kind])&&!Array.isArray(after[kind])){if(canonical(before[kind])!==canonical(after[kind]))appendAudit(store,{...actor(ctx),action:'UPDATE',entity:kind,recordId:ctx.unitId,before:before[kind],after:after[kind]});continue;}
  const old=new Map((before[kind]||[]).filter(r=>r?.id).map(r=>[r.id,r])),next=new Map((after[kind]||[]).filter(r=>r?.id).map(r=>[r.id,r]));
  for(const id of new Set([...old.keys(),...next.keys()])){const a=old.get(id),b=next.get(id);if(canonical(a)===canonical(b))continue;const action=!b?'DELETE':!a?kind.endsWith('Movements')?'STOCK_ADJUSTMENT':'CREATE':b.cancelledAt&&!a.cancelledAt?'CANCEL':b.active===false&&a.active!==false?'DEACTIVATE':'UPDATE';const approved=proof&&!a&&b&&require('./inactive-sale-approval').verifiedRecordApproval(store,ctx,proof,kind,b);appendAudit(store,{...actor(ctx),action,entity:kind,recordId:id,before:a,after:b,reason:approved?b.execution.approvalReason:route,...(approved?{authorizedBy:b.execution.authorizedBy,approvalProof:proof}:{})});}
 }
}
function actor(ctx){return {userId:ctx.userId,companyId:ctx.companyId,unitId:ctx.unitId,sessionId:ctx.sessionId,executedBy:ctx.userId};}
function saveBusinessState(store,ctx,before,next,expectedRevision,input={},route='',proof=null){
 store.requireTransaction();
 next=require('../agreements').reconcileAgreements(before,require('../positions').reconcilePositions(before,next,input));
 stampExecution(before,next,executionMetadata(store,ctx),proof?{store,ctx,proof}:null);
 require('./inventory-store').assertStockTransition(before,next);
 const revision=writeState(store,ctx,next,expectedRevision);auditChanges(store,ctx,before,next,route,proof);
 return {state:next,revision};
}
function executeStateCommand(store,ctx,command,options={}){
 if(command.constructor?.name==='AsyncFunction')throw Error('Comando de domínio deve ser síncrono.');
 return store.transaction(()=>{const currentCtx=options.refreshContext?options.refreshContext():ctx;const{state,revision}=loadState(store,currentCtx);const next=command(structuredClone(state),currentCtx);return saveBusinessState(store,currentCtx,state,next,revision,options.input||{},options.route||'');});
}
module.exports={canonical,writeState,auditChanges,saveBusinessState,executeStateCommand};
