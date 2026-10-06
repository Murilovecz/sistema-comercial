'use strict';
const {randomBytes,randomUUID}=require('node:crypto');
const {AppError}=require('./errors'),{hash}=require('./sql-store');
const DAY=86400000,RESET_MS=15*60000;
function invalid(){return new AppError(403,'RECOVERY_DENIED','Não foi possível confirmar a recuperação com os dados informados.');}
function credentialDenied(){return new AppError(403,'CREDENTIAL_CONFIRMATION_DENIED','Não foi possível confirmar sua senha.');}
function fields(input,allowed){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)))throw new AppError(422,'INVALID_INPUT','Campos inválidos ou não permitidos.');}
function newCredential(input){if(input.newPassword!==input.confirmPassword)throw new AppError(422,'PASSWORD_CONFIRMATION','A confirmação da nova senha não confere.');require('./identity').passwordValue(input.newPassword);}
function actor(ctx){return{userId:ctx.userId,companyId:ctx.companyId,unitId:ctx.unitId,sessionId:ctx.sessionId,executedBy:ctx.userId};}
function audit(identity,ctx,action,entity,recordId,after,reason=''){identity.audit({...actor(ctx),action,entity,recordId,after,reason});}
function unchanged(initial,current){if(['userId','sessionId','companyId','unitId'].some(k=>initial[k]!==current[k]))throw new AppError(409,'CONTEXT_CHANGED','O contexto mudou. Atualize antes de continuar.');}
function userRow(store,id){return store.db.prepare('SELECT * FROM users WHERE id=?').get(id);}
function revokeUser(store,userId,date){
 store.requireTransaction();
 const count=store.db.prepare('UPDATE sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL').run(date,userId).changes;
 store.db.prepare('UPDATE password_reset_grants SET revoked_at=? WHERE user_id=? AND consumed_at IS NULL AND revoked_at IS NULL').run(date,userId);
 store.db.prepare('DELETE FROM inactive_sale_approvals WHERE consumed_at IS NULL AND (executor_id=? OR authorizer_id=?)').run(userId,userId);
 return count;
}
function resetTarget(store,ctx,userId){
 const {requirePermission}=require('./identity'),{effectivePermissions}=require('./rbac');
 requirePermission(ctx,'users.reset_password');
 if(typeof userId!=='string'||!userId||userId===ctx.userId)throw new AppError(403,'RESET_NOT_ALLOWED','Não é possível redefinir este acesso neste contexto.');
 const user=userRow(store,userId);
 if(!user||user.status!=='active'||!store.db.prepare("SELECT 1 FROM unit_memberships um JOIN company_memberships cm ON cm.user_id=um.user_id AND cm.company_id=um.company_id WHERE um.user_id=? AND um.company_id=? AND um.unit_id=? AND um.status='active' AND cm.status='active'").get(userId,ctx.companyId,ctx.unitId))throw new AppError(404,'NOT_FOUND','Usuário não encontrado neste contexto.');
 if(store.db.prepare('SELECT 1 FROM company_memberships WHERE user_id=? AND company_id<>?').get(userId,ctx.companyId))throw new AppError(403,'RESET_NOT_ALLOWED','Não é possível redefinir este acesso neste contexto.');
 const units=store.db.prepare("SELECT unit_id FROM unit_memberships WHERE user_id=? AND company_id=? AND status='active'").all(userId,ctx.companyId);
 if(units.some(u=>effectivePermissions(store,userId,ctx.companyId,u.unit_id).some(p=>!ctx.permissions.includes(p))))throw new AppError(403,'RESET_NOT_ALLOWED','Não é possível redefinir este acesso neste contexto.');
 return user;
}
async function changePassword(identity,req,input){
 fields(input,['currentPassword','newPassword','confirmPassword']);newCredential(input);
 const {requestContext}=require('./request-context'),{verifyPassword,hashPassword}=require('./identity');
 // A global self-service credential action also works before selecting a company.
 const initial=requestContext(identity,req,{write:true,requireScope:false}),user=userRow(identity.store,initial.userId);identity.rate(req,'change:'+initial.userId);
 const valid=await identity.kdf(()=>verifyPassword(input.currentPassword,user.password_hash));
 if(!valid)throw credentialDenied();
 const encoded=await identity.kdf(()=>hashPassword(input.newPassword));
 return identity.store.transaction(()=>{
  const ctx=requestContext(identity,req,{write:true,requireScope:false});unchanged(initial,ctx);const current=userRow(identity.store,ctx.userId);
  if(!current||current.password_hash!==user.password_hash)throw credentialDenied();
  const date=identity.iso();identity.store.db.prepare('UPDATE users SET password_hash=?,updated_at=? WHERE id=?').run(encoded,date,ctx.userId);
  const revoked=revokeUser(identity.store,ctx.userId,date);audit(identity,ctx,'PASSWORD_CHANGE','user',ctx.userId,{affectedUserId:ctx.userId,revokedSessions:revoked});
  return{changed:true,loggedOut:true};
 });
}
async function issueReset(identity,req,input){
 fields(input,['id','operatorPassword','reason']);if(typeof input.reason!=='string'||!input.reason.trim()||input.reason.trim().length>500)throw new AppError(422,'RESET_REASON_REQUIRED','Informe um motivo de 1 a 500 caracteres.');
 const {requestContext}=require('./request-context'),{verifyPassword,hashPassword}=require('./identity');
 const initial=requestContext(identity,req,{write:true}),target=resetTarget(identity.store,initial,input.id),operator=userRow(identity.store,initial.userId);identity.rate(req,'reset:'+initial.userId);
 const valid=await identity.kdf(()=>verifyPassword(input.operatorPassword,operator.password_hash));if(!valid)throw credentialDenied();
 const disabled=await identity.kdf(()=>hashPassword(randomBytes(32).toString('base64url')));
 return identity.store.transaction(()=>{
  const ctx=requestContext(identity,req,{write:true});unchanged(initial,ctx);const current=resetTarget(identity.store,ctx,input.id),freshOperator=userRow(identity.store,ctx.userId);
  if(freshOperator.password_hash!==operator.password_hash)throw credentialDenied();
  if(current.password_hash!==target.password_hash)throw new AppError(409,'CREDENTIAL_CHANGED','O acesso mudou. Atualize antes de redefinir.');
  const date=identity.iso(),expiresAt=new Date(identity.now()+RESET_MS).toISOString(),resetId=randomUUID(),resetCode=randomBytes(32).toString('base64url');
  const revoked=revokeUser(identity.store,current.id,date);identity.store.db.prepare('UPDATE users SET password_hash=?,updated_at=? WHERE id=?').run(disabled,date,current.id);
  identity.store.db.prepare('INSERT INTO password_reset_grants VALUES(?,?,?,?,?,?,?,?,?,NULL,NULL)').run(resetId,hash(resetCode),current.id,ctx.userId,ctx.companyId,ctx.unitId,hash(disabled),date,expiresAt);
  audit(identity,ctx,'PASSWORD_RESET_ISSUED','user',current.id,{affectedUserId:current.id,resetId,expiresAt,revokedSessions:revoked},input.reason.trim());
  return{resetCode,resetId,expiresAt};
 });
}
function usableReset(identity,row,login){
 if(!row||row.revoked_at||row.consumed_at||!Number.isFinite(Date.parse(row.expires_at))||identity.now()>=Date.parse(row.expires_at))throw invalid();
 const user=userRow(identity.store,row.user_id);
 if(!user||user.login!==login||user.status!=='active'||hash(user.password_hash)!==row.disabled_hash_digest)throw invalid();
 const scopes=identity.contexts(row.executor_id);if(!scopes.some(s=>s.companyId===row.company_id&&s.unitId===row.unit_id))throw invalid();
 const permissions=require('./rbac').effectivePermissions(identity.store,row.executor_id,row.company_id,row.unit_id),ctx={userId:row.executor_id,companyId:row.company_id,unitId:row.unit_id,permissions};
 try{resetTarget(identity.store,ctx,row.user_id);}catch{throw invalid();}
 return user;
}
async function finishReset(identity,req,input){
 fields(input,['login','resetCode','newPassword','confirmPassword']);newCredential(input);
 const {loginValue,hashPassword}=require('./identity');let login;try{login=loginValue(input.login);}catch{login='';}identity.rate(req,'recover:'+login);
 if(typeof input.resetCode!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(input.resetCode))throw invalid();
 const row=identity.store.db.prepare('SELECT * FROM password_reset_grants WHERE code_hash=?').get(hash(input.resetCode));usableReset(identity,row,login);
 const encoded=await identity.kdf(()=>hashPassword(input.newPassword));
 return identity.store.transaction(()=>{
  const fresh=identity.store.db.prepare('SELECT * FROM password_reset_grants WHERE id=?').get(row.id),user=usableReset(identity,fresh,login),date=identity.iso();
  if(identity.store.db.prepare('UPDATE password_reset_grants SET consumed_at=? WHERE id=? AND consumed_at IS NULL AND revoked_at IS NULL').run(date,row.id).changes!==1)throw invalid();
  identity.store.db.prepare('UPDATE users SET password_hash=?,updated_at=? WHERE id=?').run(encoded,date,user.id);const revoked=revokeUser(identity.store,user.id,date);
  audit(identity,{userId:user.id,companyId:row.company_id,unitId:row.unit_id},'PASSWORD_RESET_COMPLETED','user',user.id,{affectedUserId:user.id,resetId:row.id,revokedSessions:revoked});
  return{changed:true,loggedOut:true};
 });
}
function activeSession(identity,row){return !row.revoked_at&&Number.isFinite(Date.parse(row.expires_at))&&identity.now()<Date.parse(row.expires_at)&&Number.isFinite(Date.parse(row.last_seen_at))&&identity.now()-Date.parse(row.last_seen_at)<identity.idleMs;}
function sessions(identity,ctx){return identity.store.db.prepare('SELECT id,created_at,last_seen_at,expires_at,revoked_at FROM sessions WHERE user_id=? ORDER BY created_at DESC,id').all(ctx.userId).filter(row=>activeSession(identity,row)).map(row=>({id:row.id,current:row.id===ctx.sessionId,createdAt:row.created_at,lastSeenAt:row.last_seen_at,expiresAt:row.expires_at,origin:'Local'}));}
function revokeSession(identity,req,input,others=false){
 fields(input,others?[]:['sessionId']);const {requestContext}=require('./request-context');
 return identity.store.transaction(()=>{
  const ctx=requestContext(identity,req,{write:true,requireScope:false}),date=identity.iso();let rows;
  if(others)rows=identity.store.db.prepare('SELECT id FROM sessions WHERE user_id=? AND id<>? AND revoked_at IS NULL').all(ctx.userId,ctx.sessionId);
  else{if(typeof input.sessionId!=='string'||input.sessionId.length>120)throw new AppError(422,'INVALID_SESSION_ID','Informe a sessão.');const row=identity.store.db.prepare('SELECT id FROM sessions WHERE id=? AND user_id=?').get(input.sessionId,ctx.userId);if(!row)throw new AppError(404,'NOT_FOUND','Sessão não encontrada.');rows=[row];}
  for(const row of rows){identity.store.db.prepare('UPDATE sessions SET revoked_at=COALESCE(revoked_at,?) WHERE id=? AND user_id=?').run(date,row.id,ctx.userId);identity.store.db.prepare('DELETE FROM inactive_sale_approvals WHERE session_id=? AND consumed_at IS NULL').run(row.id);}
  audit(identity,ctx,others?'SESSIONS_REVOKE_OTHERS':'SESSION_REVOKE','session',others?ctx.sessionId:input.sessionId,{affectedUserId:ctx.userId,revokedSessions:rows.map(r=>r.id)});
  return others?{revoked:true,count:rows.length}:{revoked:true,loggedOut:input.sessionId===ctx.sessionId};
 });
}
async function handleAccess(identity,req,res,raw){
 const path=new URL(req.url,'http://local').pathname;
 const post=['/api/auth/password/change','/api/foundation/password-reset','/api/auth/password/reset','/api/auth/sessions/revoke','/api/auth/sessions/revoke-others'];
 if(path!=='/api/auth/sessions'&&!post.includes(path))return false;
 identity.checkHost(req);
 if(path==='/api/auth/sessions'&&req.method==='GET'){const ctx=require('./request-context').requestContext(identity,req,{requireScope:false});identity.send(res,200,{sessions:sessions(identity,ctx)});return true;}
 if(req.method!=='POST'||!post.includes(path))throw new AppError(404,'NOT_FOUND','Operação de acesso não encontrada.');
 const input=identity.body(raw);if(path==='/api/auth/password/reset')identity.validateCsrf(req);else identity.validateCsrf(req,identity.authenticate(req));
 let result;
 if(path==='/api/auth/password/change')result=await changePassword(identity,req,input);
 else if(path==='/api/foundation/password-reset')result=await issueReset(identity,req,input);
 else if(path==='/api/auth/password/reset')result=await finishReset(identity,req,input);
 else result=revokeSession(identity,req,input,path.endsWith('/revoke-others'));
 if(result.loggedOut){identity.setCookie(res,'foundation_session','',0);identity.setCookie(res,'foundation_preauth','',0);}
 identity.send(res,path==='/api/foundation/password-reset'?201:200,result);return true;
}
function retention(options={}){
 const config={unusedMs:options.unusedMs??DAY,consumedMs:options.consumedMs??7*DAY,resetMs:options.resetMs??DAY,batchSize:options.batchSize??100};
 if(!Number.isSafeInteger(config.unusedMs)||config.unusedMs<DAY||!Number.isSafeInteger(config.consumedMs)||config.consumedMs<7*DAY||!Number.isSafeInteger(config.resetMs)||config.resetMs<DAY||!Number.isSafeInteger(config.batchSize)||config.batchSize<1||config.batchSize>1000)throw Error('Retenção de acesso inválida.');return config;
}
function maintainAuth(runtime,options={}){
 const{store,identity}=runtime,config=retention(options),time=identity.now(),cutoff=ms=>new Date(time-ms).toISOString();
 return store.transaction(()=>{
  const counts={unused:0,consumed:0,resets:0,inconsistent:0};
  const unused=store.db.prepare('SELECT id FROM inactive_sale_approvals WHERE consumed_at IS NULL AND expires_at<=? ORDER BY expires_at,id LIMIT ?').all(cutoff(config.unusedMs),config.batchSize);
  for(const row of unused)counts.unused+=store.db.prepare('DELETE FROM inactive_sale_approvals WHERE id=? AND consumed_at IS NULL').run(row.id).changes;
  const consumed=store.db.prepare('SELECT * FROM inactive_sale_approvals WHERE consumed_at IS NOT NULL AND consumed_at<=? ORDER BY consumed_at,id LIMIT ?').all(cutoff(config.consumedMs),config.batchSize);
  const scopedSales=new Map(),sqlSales=Boolean(store.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='commercial_sales'").get())||Boolean(store.db.prepare("SELECT 1 FROM schema_migrations WHERE version='009_sales.sql'").get());
  for(const row of consumed){
   const scope=JSON.stringify([row.company_id,row.unit_id]);
   if(!scopedSales.has(scope)){
    const mirror=store.db.prepare('SELECT payload FROM unit_states WHERE company_id=? AND unit_id=?').get(row.company_id,row.unit_id);
    try{scopedSales.set(scope,new Map((mirror?JSON.parse(mirror.payload).sales||[]:[]).map(s=>[s.id,s])));}catch{scopedSales.set(scope,new Map());}
   }
   const mirroredSale=scopedSales.get(scope).get(row.sale_id);let sale=mirroredSale;
   if(sqlSales){
    // SQL becomes authority once schema 009 exists. Missing/stale marker,
    // absent sale, invalid content hash or mirror divergence preserves the grant.
    try{sale=require('./sales-store').getSale(store,{companyId:row.company_id,unitId:row.unit_id},row.sale_id);if(require('./state-repository').canonical(sale)!==require('./state-repository').canonical(mirroredSale))sale=null;}catch{sale=null;}
   }
   const e=sale?.execution;
   const evidence=store.db.prepare("SELECT 1 FROM audit_events WHERE company_id=? AND unit_id=? AND entity='sales' AND record_id=? AND authorized_by=?").get(row.company_id,row.unit_id,row.sale_id,row.authorizer_id);
   let roles;try{roles=JSON.parse(row.authorizer_roles_json);}catch{roles=null;}
   if(!row.sale_id||!e||e.approvalId!==row.id||e.executedBy!==row.executor_id||e.authorizedBy!==row.authorizer_id||e.approverName!==row.authorizer_name||JSON.stringify(e.approverRoles)!==JSON.stringify(roles)||e.approvalReason!==row.reason||e.approvedAt!==row.created_at||!evidence){counts.inconsistent++;continue;}
   counts.consumed+=store.db.prepare('DELETE FROM inactive_sale_approvals WHERE id=? AND consumed_at IS NOT NULL').run(row.id).changes;
  }
  const resets=store.db.prepare('SELECT id FROM password_reset_grants WHERE (consumed_at IS NOT NULL AND consumed_at<=?) OR (revoked_at IS NOT NULL AND revoked_at<=?) OR (expires_at<=?) ORDER BY expires_at,id LIMIT ?').all(cutoff(config.resetMs),cutoff(config.resetMs),cutoff(config.resetMs),config.batchSize);
  for(const row of resets)counts.resets+=store.db.prepare('DELETE FROM password_reset_grants WHERE id=?').run(row.id).changes;
  if(counts.unused||counts.consumed||counts.resets||counts.inconsistent)identity.audit({action:'AUTH_MAINTENANCE',entity:'access_maintenance',after:counts,reason:counts.inconsistent?'Grants sem evidência permanente preservados.':''});
  return counts;
 });
}
function startMaintenance(runtime,options={}){
 retention(options);const intervalMs=options.intervalMs??5*60000;if(!Number.isSafeInteger(intervalMs)||intervalMs<1000)throw Error('Intervalo de manutenção inválido.');
 let stopped=false;const status={lastRun:null,lastResult:null,lastError:null};
 const report=()=>{if(options.onError)try{options.onError({code:status.lastError});}catch{ /* An observation callback cannot compromise the maintenance timer. */ }};
 const run=()=>{if(stopped)return;try{status.lastResult=maintainAuth(runtime,options);status.lastRun=runtime.identity.iso();status.lastError=status.lastResult.inconsistent?'AUTH_GRANT_EVIDENCE_MISSING':null;if(status.lastError)report();}catch{status.lastError='AUTH_MAINTENANCE_FAILED';report();}};
 run();const timer=setInterval(run,intervalMs);timer.unref();return{status,run,stop(){stopped=true;clearInterval(timer);}};
}
module.exports={handleAccess,maintainAuth,startMaintenance,revokeUser,retention};
