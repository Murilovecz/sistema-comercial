'use strict';
const {AppError}=require('./errors'),{requestContext}=require('./request-context'),{requirePermission}=require('./identity'),{rejectClientAuthority}=require('./authorization');
const {loadState}=require('./scoped-state'),{saveBusinessState,canonical}=require('./state-repository'),{hash}=require('./sql-store');
const {catalogProduct,customer}=require('./commercial-read'),{createCatalogRecord}=require('../catalog-registration'),{supplierAction}=require('../purchases'),{activeAction}=require('../quotes');
function fail(code,message,status=422){return new AppError(status,code,message);}
function descriptor(req){if(req.method!=='POST')return null;const pathname=new URL(req.url,'http://local').pathname,match=/^\/api\/commercial\/(products|customers)(?:\/(edit|active))?$/.exec(pathname)||/^\/api\/commercial\/(suppliers)\/(create|edit|active)$/.exec(pathname);return match?{kind:match[1],action:match[2]||'create',pathname}:null;}
function body(raw,kind,action){
 if(typeof raw!=='string'||Buffer.byteLength(raw)>16384)throw fail('BODY_TOO_LARGE','Cadastro muito grande.',413);
 let input;try{input=JSON.parse(raw);}catch{throw fail('INVALID_JSON','Dados inválidos.',400);}
 if(!input||typeof input!=='object'||Array.isArray(input))throw fail('INVALID_INPUT','Dados inválidos.');rejectClientAuthority(input);
 const common=['requestId','responsible','reason'],fields=action==='active'?['id','expectedVersion','active']:['name',...(kind==='products'?['price','code','barcode','category','minStock',...(action==='create'?['stock']:[])]:['phone','email','notes']),...(action==='edit'?['id','expectedVersion']:[])],allowed=new Set([...common,...fields]);
 if(Object.keys(input).some(key=>!allowed.has(key)))throw fail('INVALID_REGISTRATION_FIELD','Campo de cadastro não permitido. Estoque, custo e identidade seguem seus fluxos próprios.');
 if(action==='create'&&(typeof input.requestId!=='string'||!input.requestId.trim()||input.requestId.length>80))throw fail('REGISTRATION_REQUEST_REQUIRED','Informe uma identificação de confirmação.');
 if(action!=='create'&&(typeof input.id!=='string'||!input.id||input.id.length>120||!Number.isSafeInteger(input.expectedVersion)||input.expectedVersion<0))throw fail('REGISTRATION_VERSION_REQUIRED','Informe registro e versão esperada.');
 return input;
}
function authorize(ctx,kind,action,input){
 for(const p of ['catalog.view','catalog.manage'])requirePermission(ctx,p);
 if(kind==='products'&&action==='create'&&Number(input.stock||0)>0)requirePermission(ctx,'inventory.adjust');
 if(kind==='products'&&Object.hasOwn(input,'minStock'))for(const p of ['inventory.view','inventory.adjust'])requirePermission(ctx,p);
}
function fingerprint(kind,action,input){return hash(canonical({kind,action,input:Object.fromEntries(Object.entries(input).filter(([k])=>k!=='responsible'))}));}
function handleRegistration(runtime,req,raw,domain={}){
 const route=descriptor(req);if(!route)return null;const input=body(raw,route.kind,route.action),initial=requestContext(runtime.identity,req,{write:true});authorize(initial,route.kind,route.action,input);
 return runtime.store.transaction(()=>{
  const ctx=requestContext(runtime.identity,req,{write:true});authorize(ctx,route.kind,route.action,input);
  const {state,revision}=loadState(runtime.store,ctx),signature=fingerprint(route.kind,route.action,input),dto=route.kind==='products'?catalogProduct:customer;
  const priorRecord=route.action==='create'?null:state[route.kind]?.find(r=>r.id===input.id);
  if(route.action!=='create'&&!priorRecord)throw fail('NOT_FOUND','Registro não encontrado nesta unidade.',404);
  if(priorRecord&&input.expectedVersion!==(priorRecord.version||0))throw fail('STALE_REGISTRATION','Este cadastro mudou em outra janela. Atualize e revise antes de salvar.',409);
  if(route.action==='create'){
   const records=['products','customers','suppliers'].flatMap(kind=>(state[kind]||[]).map(record=>({kind,record}))),prior=records.find(({record})=>record.registrationRequestId===input.requestId);
   if(prior){if(prior.kind!==route.kind||prior.record.registrationFingerprint!==signature||prior.record.registrationExecutor!==ctx.userId)throw fail('REGISTRATION_REPLAY_CHANGED','Esta confirmação já foi usada com outros dados ou por outra pessoa.',409);return{status:201,value:{record:dto(prior.record),revision,replayed:true}};}
  }
  const trusted={...input,responsible:ctx.user.name};let next;
  if(route.kind==='suppliers')next=supplierAction(state,route.action,trusted);
  else if(route.action==='create')next=createCatalogRecord(state,route.kind,route.kind==='products'?{...trusted,stock:trusted.stock??0}:trusted);
  else if(route.action==='active')next=activeAction(state,route.kind,trusted);
  else{const change=domain.change||require('../server').change;next=change(state,'/api/'+route.kind+'/edit',trusted);if(route.kind==='products'&&!Object.hasOwn(input,'minStock')){const record=next.products.find(r=>r.id===input.id);if(Object.hasOwn(priorRecord,'minStock'))record.minStock=priorRecord.minStock;else delete record.minStock;}}
  let id=input.id;
  if(route.action==='create'){
   const existing=new Set((state[route.kind]||[]).map(r=>r.id)),created=(next[route.kind]||[]).filter(r=>!existing.has(r.id));
   if(created.length!==1)throw fail('REGISTRATION_NOT_CREATED','Cadastro não foi produzido; revise a confirmação.',409);
   const record=created[0];Object.assign(record,{registrationRequestId:input.requestId,registrationFingerprint:signature,registrationExecutor:ctx.userId});id=record.id;
  }
  const saved=saveBusinessState(runtime.store,ctx,state,next,revision,trusted,route.pathname),record=saved.state[route.kind]?.find(r=>r.id===id);
  if(!record)throw fail('NOT_FOUND','Registro não encontrado nesta unidade.',404);
  return{status:201,value:{record:dto(record),revision:saved.revision,replayed:false}};
 });
}
module.exports={handleRegistration,registrationFingerprint:fingerprint};
