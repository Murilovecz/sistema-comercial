'use strict';
const{randomUUID}=require('node:crypto');const{hash}=require('./sql-store');const{write}=require('./entities');const{AppError}=require('./errors');
const forbidden=/password|senha|secret|token|cookie|authorization|csrf|pairing|credential/i;
function sanitize(value){if(value===undefined||value===null)return null;if(Array.isArray(value))return value.map(sanitize);if(typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!forbidden.test(key)).map(([key,v])=>[key,sanitize(v)]));return value;}
function eventPayload(row){return {id:row.id,userId:row.user_id,companyId:row.company_id,unitId:row.unit_id,sessionId:row.session_id,action:row.action,entity:row.entity,recordId:row.record_id,before:row.before_json===null?null:JSON.parse(row.before_json),after:row.after_json===null?null:JSON.parse(row.after_json),executedBy:row.executed_by,authorizedBy:row.authorized_by,reason:row.reason,date:row.date,prevHash:row.prev_hash};}
function appendAudit(store,input){
 store.requireTransaction();
 const previous=store.db.prepare('SELECT entry_hash FROM audit_events ORDER BY sequence DESC LIMIT 1').get()?.entry_hash||'';
 const row={id:randomUUID(),user_id:input.userId||null,company_id:input.companyId||null,unit_id:input.unitId||null,session_id:input.sessionId||null,action:String(input.action),entity:String(input.entity),record_id:input.recordId||null,before_json:input.before==null?null:JSON.stringify(sanitize(input.before)),after_json:input.after==null?null:JSON.stringify(sanitize(input.after)),executed_by:input.executedBy||input.userId||null,authorized_by:null,reason:String(input.reason||'').slice(0,500),date:input.date||new Date().toISOString(),prev_hash:previous};
 if(input.authorizedBy)row.authorized_by=require('./inactive-sale-approval').verifyAuditApproval(store,input);
 row.entry_hash=hash(JSON.stringify(eventPayload(row)));
 store.db.prepare(`INSERT INTO audit_events(id,user_id,company_id,unit_id,session_id,action,entity,record_id,before_json,after_json,executed_by,authorized_by,reason,date,prev_hash,entry_hash) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(...['id','user_id','company_id','unit_id','session_id','action','entity','record_id','before_json','after_json','executed_by','authorized_by','reason','date','prev_hash','entry_hash'].map(k=>row[k]));
 return row.id;
}
function verifyAuditChain(store){let previous='';for(const row of store.db.prepare('SELECT * FROM audit_events ORDER BY sequence').all()){if(row.prev_hash!==previous||hash(JSON.stringify(eventPayload(row)))!==row.entry_hash)return false;previous=row.entry_hash;}return true;}
function listAudit(store,ctx,limit=100){return store.db.prepare(`SELECT a.sequence,a.id,a.action,a.entity,a.record_id recordId,a.date,a.reason,a.user_id userId,a.executed_by executedBy,a.authorized_by authorizedBy,u.name executorName,a.before_json beforeJson,a.after_json afterJson
 FROM audit_events a LEFT JOIN users u ON u.id=a.executed_by WHERE a.company_id=? AND a.unit_id=? ORDER BY a.sequence DESC LIMIT ?`).all(ctx.companyId,ctx.unitId,Math.min(500,Math.max(1,Number.isSafeInteger(limit)?limit:100))).map(({beforeJson,afterJson,...row})=>({...row,before:beforeJson?JSON.parse(beforeJson):null,after:afterJson?JSON.parse(afterJson):null}));}
module.exports={appendAudit,listAudit,verifyAuditChain,sanitize};
