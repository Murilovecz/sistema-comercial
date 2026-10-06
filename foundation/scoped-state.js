'use strict';
const{AppError}=require('./errors');const{accessContexts}=require('./access');const{validateDatabase}=require('../storage');
function assertScope(store,scope){
 if(!scope||typeof scope.companyId!=='string'||typeof scope.unitId!=='string')throw new AppError(403,'SCOPE_REQUIRED','Selecione uma empresa e unidade permitidas.');
 if(scope.userId&&!accessContexts(store,scope.userId).some(s=>s.companyId===scope.companyId&&s.unitId===scope.unitId))throw new AppError(403,'FORBIDDEN_CONTEXT','Você não tem acesso a esta empresa e unidade.');
 if(!store.db.prepare("SELECT 1 FROM units u JOIN companies c ON c.id=u.company_id WHERE u.company_id=? AND u.id=? AND u.status='active' AND c.status='active'").get(scope.companyId,scope.unitId))throw new AppError(403,'FORBIDDEN_CONTEXT','Empresa ou unidade indisponível.');
 return scope;
}
function loadState(store,scope){assertScope(store,scope);const row=store.db.prepare('SELECT revision,payload FROM unit_states WHERE company_id=? AND unit_id=?').get(scope.companyId,scope.unitId);return row?{revision:row.revision,state:require('./commercial-store').verifyCommercialMirror(store,scope,validateDatabase(JSON.parse(row.payload)))}:{revision:0,state:{products:[],customers:[],sales:[],schemaVersion:2}};}
function getRecord(store,scope,kind,id){const{state}=loadState(store,scope);const list=state[kind];if(!Array.isArray(list))throw new AppError(404,'NOT_FOUND','Registro não encontrado neste contexto.');const row=list.find(r=>r.id===id);if(!row)throw new AppError(404,'NOT_FOUND','Registro não encontrado neste contexto.');return structuredClone(row);}
module.exports={assertScope,loadState,getRecord};
