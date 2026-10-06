'use strict';
const{AppError}=require('./errors');const{assertScope}=require('./scoped-state');
function executionMetadata(store,ctx){
 assertScope(store,ctx);
 const user=store.db.prepare("SELECT id,name FROM users WHERE id=? AND status='active'").get(ctx.userId);
 if(!user)throw new AppError(401,'INVALID_ACTOR','Executor não autenticado.');
 const roles=store.db.prepare('SELECT r.name FROM unit_roles ur JOIN roles r ON r.company_id=ur.company_id AND r.id=ur.role_id WHERE ur.user_id=? AND ur.company_id=? AND ur.unit_id=? ORDER BY r.name').all(ctx.userId,ctx.companyId,ctx.unitId).map(r=>r.name);
 return {executedBy:user.id,executorName:user.name,executorRoles:roles,companyId:ctx.companyId,unitId:ctx.unitId,executedAt:new Date().toISOString(),authorizedBy:null,authorizationReason:null};
}
function stampExecution(before,next,metadata,approval=null){
 for(const kind of ['stockMovements','positionMovements','sales','expenses']){
  const prior=new Set((before[kind]||[]).map(r=>r.id));
  for(const row of next[kind]||[])if(!prior.has(row.id)){
   row.execution=structuredClone(metadata);
   if(approval&&require('./inactive-sale-approval').verifiedRecordApproval(approval.store,approval.ctx,approval.proof,kind,row))Object.assign(row.execution,require('./inactive-sale-approval').approvalMetadata(approval.store,approval.ctx,approval.proof));
  }
 }
 for(const kind of ['purchases','cashSessions'])for(const row of next[kind]||[]){const old=(before[kind]||[]).find(r=>r.id===row.id);for(const field of kind==='purchases'?['receipts']:['movements']){const prior=new Set((old?.[field]||[]).map(r=>r.id));for(const child of row[field]||[])if(!prior.has(child.id))child.execution=structuredClone(metadata);}}
 return next;
}
module.exports={executionMetadata,stampExecution};
