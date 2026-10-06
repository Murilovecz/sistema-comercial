'use strict';
const { randomBytes, randomUUID, argon2, timingSafeEqual, createHash, createHmac } = require('node:crypto');
const { promisify } = require('node:util');
const { AppError } = require('./errors');
const { name } = require('./sql-store');
const { write, status, createCompany, createUnit } = require('./entities');
const derive = promisify(argon2);
const PASSWORD_PARAMS = Object.freeze({ memory: 65536, passes: 3, parallelism: 1, tagLength: 32 });
const PASSWORD_PREFIX = 'foundation-argon2id-v1';
function passwordValue(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128 || Buffer.byteLength(password,'utf8') > 512) {
    throw new AppError(422,'INVALID_PASSWORD','Use uma senha entre 12 e 128 caracteres.');
  }
  return password;
}
function loginValue(login) {
  if (typeof login !== 'string') throw new AppError(422,'INVALID_LOGIN','Informe um login de 3 a 120 caracteres.');
  const value = login.trim().toLowerCase();
  if (value.length < 3 || value.length > 120 || /[\s\x00-\x1f\x7f]/u.test(value)) throw new AppError(422,'INVALID_LOGIN','Informe um login de 3 a 120 caracteres, sem espaços.');
  return value;
}
async function hashPassword(password) {
  passwordValue(password);
  const salt = randomBytes(16);
  const key = await derive('argon2id',{ message: Buffer.from(password,'utf8'), nonce: salt, ...PASSWORD_PARAMS });
  return [PASSWORD_PREFIX,PASSWORD_PARAMS.memory,PASSWORD_PARAMS.passes,PASSWORD_PARAMS.parallelism,salt.toString('base64url'),key.toString('base64url')].join('$');
}
async function verifyPassword(password,encoded) {
  if (typeof password !== 'string' || password.length > 128 || Buffer.byteLength(password,'utf8') > 512 || typeof encoded !== 'string') return false;
  const parts = encoded.split('$');
  // Stored costs are bounded too: a damaged hash must not trigger unbounded allocations.
  if (parts.length !== 6 || parts[0] !== PASSWORD_PREFIX || parts[1] !== '65536' || parts[2] !== '3' || parts[3] !== '1' || !/^[A-Za-z0-9_-]{22}$/.test(parts[4]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[5])) return false;
  const salt = Buffer.from(parts[4],'base64url'), expected = Buffer.from(parts[5],'base64url');
  if (salt.length !== 16 || expected.length !== 32) return false;
  const actual = await derive('argon2id',{ message: Buffer.from(password,'utf8'), nonce: salt, ...PASSWORD_PARAMS });
  return timingSafeEqual(actual,expected);
}
function publicUser(row) { return {id:row.id,name:row.name,login:row.login,status:row.status,created_at:row.created_at,updated_at:row.updated_at}; }
async function createUser(store,input) {
  if (store.inTransaction) throw Error('Gerar a senha antes de abrir a transação.');
  const fields={id:randomUUID(),name:name(input.name),login:loginValue(input.login),status:status(input.status)};
  if (store.db.prepare('SELECT id FROM users WHERE login=?').get(fields.login)) throw new AppError(409,'LOGIN_EXISTS','Este login já está cadastrado.');
  const passwordHash=await hashPassword(input.password), date=new Date().toISOString();
  return write(store,()=>{
    if (store.db.prepare('SELECT id FROM users WHERE login=?').get(fields.login)) throw new AppError(409,'LOGIN_EXISTS','Este login já está cadastrado.');
    store.db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run(fields.id,fields.name,fields.login,passwordHash,fields.status,date,date);
    return publicUser({...fields,created_at:date,updated_at:date});
  });
}
const SESSION_COOKIE='foundation_session', PREAUTH_COOKIE='foundation_preauth';
const digest=value=>createHash('sha256').update(value).digest('hex');
function constantEqual(a,b) { return typeof a==='string' && typeof b==='string' && timingSafeEqual(Buffer.from(digest(a),'hex'),Buffer.from(digest(b),'hex')); }
function cookie(req,key) {
  const values=(req.headers?.cookie||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(key+'=')).map(v=>v.slice(key.length+1));
  return values.length===1 && /^[A-Za-z0-9_-]{43}$/.test(values[0]) ? values[0] : null;
}
function authError() { return new AppError(401,'INVALID_SESSION','Entre novamente para continuar.'); }
function requirePermission(ctx,code) { if (!ctx) throw authError();if(!ctx.companyId || !ctx.unitId || !ctx.permissions.includes(code)) throw new AppError(403,'FORBIDDEN','Você não tem permissão para esta ação.');return ctx; }
function publicContext(ctx) { return {user:ctx.user,companyId:ctx.companyId,unitId:ctx.unitId,sessionId:ctx.sessionId,permissions:[...ctx.permissions],csrfToken:ctx.csrfToken}; }
class Identity {
  constructor(store,options={}) {
    this.store=store;this.options=options;this.secret=randomBytes(32);this.attempts=new Map();this.kdfActive=0;this.dummy=null;
    this.sessionLifetimeMs=options.sessionLifetimeMs??12*60*60*1000;this.idleMs=options.idleMs??30*60*1000;
    if(!Number.isFinite(this.sessionLifetimeMs)||this.sessionLifetimeMs<=0||!Number.isFinite(this.idleMs)||this.idleMs<=0)throw Error('Prazos de sessão inválidos.');
  }
  now() {const n=this.options.now?this.options.now():Date.now();return n instanceof Date?n.getTime():n;}
  iso() {return new Date(this.now()).toISOString();}
  tokenCsrf(kind,value) {return createHmac('sha256',this.secret).update(kind+':'+value).digest('base64url');}
  sessionCsrf(tokenHash,companyId,unitId) {return this.tokenCsrf('session',JSON.stringify([tokenHash,companyId||null,unitId||null]));}
  setCookie(res,key,value,maxAge) {
    const entry=key+'='+value+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+Math.max(0,Math.floor(maxAge/1000))+(this.options.secureCookies?'; Secure':'');
    const old=res.getHeader('Set-Cookie');res.setHeader('Set-Cookie',old?[...(Array.isArray(old)?old:[old]),entry]:[entry]);
  }
  checkHost(req) {
    const host=req.headers?.host||'';
    const configured=this.options.allowedHosts || (this.options.allowedOrigins||[this.options.origin].filter(Boolean)).map(origin=>new URL(origin).host);
    if(configured.length?!configured.includes(host):!(/^(?:127\.0\.0\.1|localhost)(?::\d{1,5})?$/.test(host)))throw new AppError(403,'INVALID_HOST','Origem da requisição não permitida.');
  }
  checkOrigin(req) {
    this.checkHost(req);
    const allowed=this.options.allowedOrigins || (this.options.origin?[this.options.origin]:[(this.options.secureCookies?'https':'http')+'://'+req.headers.host]);
    if(!allowed.includes(req.headers?.origin))throw new AppError(403,'INVALID_ORIGIN','Origem da requisição não permitida.');
    if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers?.['content-type']||''))throw new AppError(415,'JSON_REQUIRED','Envie os dados no formato JSON.');
  }
  validateCsrf(req,ctx=null) {
    this.checkOrigin(req);
    const nonce=ctx?ctx.tokenHash:cookie(req,PREAUTH_COOKIE), expected=nonce?(ctx?this.sessionCsrf(nonce,ctx.companyId,ctx.unitId):this.tokenCsrf('preauth',nonce)):null;
    if(!expected || !constantEqual(req.headers?.['x-csrf-token'],expected))throw new AppError(403,'INVALID_CSRF','Atualize a página antes de confirmar.');
  }
  contexts(userId) {
    return this.store.db.prepare(`SELECT c.id companyId,c.name companyName,u.id unitId,u.name unitName
      FROM unit_memberships um JOIN company_memberships cm ON cm.user_id=um.user_id AND cm.company_id=um.company_id
      JOIN companies c ON c.id=um.company_id JOIN units u ON u.company_id=um.company_id AND u.id=um.unit_id
      WHERE um.user_id=? AND um.status='active' AND cm.status='active' AND c.status='active' AND u.status='active' ORDER BY c.name,u.name,c.id,u.id`).all(userId).map(row=>({...row}));
  }
  authenticate(req) {
    this.checkHost(req);
    const token=cookie(req,SESSION_COOKIE);if(!token)throw authError();
    const tokenHash=digest(token),s=this.store.db.prepare(`SELECT s.*,u.name,u.login,u.status user_status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?`).get(tokenHash),now=this.now();
    if(!s || s.revoked_at || s.user_status!=='active' || !Number.isFinite(Date.parse(s.expires_at)) || now>=Date.parse(s.expires_at) || !Number.isFinite(Date.parse(s.last_seen_at)) || now-Date.parse(s.last_seen_at)>=this.idleMs)throw authError();
    if(s.company_id && !this.contexts(s.user_id).some(c=>c.companyId===s.company_id&&c.unitId===s.unit_id))throw authError();
    const permissions=s.company_id?this.store.db.prepare(`SELECT DISTINCT rp.permission_code code FROM unit_roles ur
      JOIN role_permissions rp ON rp.company_id=ur.company_id AND rp.role_id=ur.role_id
      WHERE ur.user_id=? AND ur.company_id=? AND ur.unit_id=? ORDER BY rp.permission_code`).all(s.user_id,s.company_id,s.unit_id).map(p=>p.code):[];
    this.store.db.prepare('UPDATE sessions SET last_seen_at=? WHERE id=?').run(this.iso(),s.id);
    return {userId:s.user_id,user:{id:s.user_id,name:s.name,login:s.login},companyId:s.company_id,unitId:s.unit_id,sessionId:s.id,permissions,csrfToken:this.sessionCsrf(tokenHash,s.company_id,s.unit_id),tokenHash};
  }
  requirePermission(ctx,code) {return requirePermission(ctx,code);}
  publicContext(ctx) {return {...publicContext(ctx),contexts:this.contexts(ctx.userId)};}
  audit(event) {if(this.options.audit)this.options.audit(event);}
  rate(req,login) {
    const now=this.now(),ip=req.socket?.remoteAddress||'local';
    for(const [key,value] of this.attempts)if(now-value.started>=60000)this.attempts.delete(key);
    for(const [key,limit] of [['ip:'+ip,30],['login:'+login,8]]){
      const value=this.attempts.get(key)||{started:now,count:0};
      if(value.count>=limit)throw new AppError(429,'AUTH_RATE_LIMIT','Muitas tentativas. Aguarde um minuto.');
      value.count++;this.attempts.set(key,value);
    }
    if(this.attempts.size>1000)this.attempts.delete(this.attempts.keys().next().value);
  }
  async kdf(fn) {
    if(this.kdfActive>=2)throw new AppError(429,'AUTH_BUSY','Aguarde um momento e tente novamente.');
    this.kdfActive++;try{return await fn();}finally{this.kdfActive--;}
  }
  body(raw) {
    if(typeof raw!=='string' || Buffer.byteLength(raw)>16384)throw new AppError(413,'AUTH_BODY_TOO_LARGE','Dados de acesso muito grandes.');
    let input;try{input=JSON.parse(raw);}catch{throw new AppError(400,'INVALID_JSON','Dados inválidos.');}
    if(!input || typeof input!=='object' || Array.isArray(input))throw new AppError(422,'INVALID_INPUT','Dados inválidos.');return input;
  }
  bootstrapAccess(userId,companyId,unitId) {
    this.store.db.prepare("INSERT INTO company_memberships VALUES(?,?,'active')").run(userId,companyId);
    this.store.db.prepare("INSERT INTO unit_memberships VALUES(?,?,?,'active')").run(userId,companyId,unitId);
    if(this.options.bootstrapAccess){this.options.bootstrapAccess(this.store,{userId,companyId,unitId});return;}
    const roleId=randomUUID();this.store.db.prepare('INSERT INTO roles VALUES(?,?,?)').run(companyId,roleId,'Proprietário inicial');
    this.store.db.prepare('INSERT INTO role_permissions SELECT ?,?,code FROM permissions').run(companyId,roleId);
    this.store.db.prepare('INSERT INTO unit_roles VALUES(?,?,?,?)').run(userId,companyId,unitId,roleId);
  }
  newSession(userId,scope,req,action) {
    const token=randomBytes(32).toString('base64url'),tokenHash=digest(token),id=randomUUID(),date=this.iso(),expires=new Date(this.now()+this.sessionLifetimeMs).toISOString();
    const previous=cookie(req,SESSION_COOKIE);if(previous)this.store.db.prepare('UPDATE sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL').run(date,digest(previous));
    this.store.db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?,?,?,?,NULL)').run(id,tokenHash,userId,scope?.companyId||null,scope?.unitId||null,date,expires,date);
    this.audit({userId,companyId:scope?.companyId||null,unitId:scope?.unitId||null,sessionId:id,action,entity:'session',recordId:id,executedBy:userId});
    return token;
  }
  async setup(req,input) {
    if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket?.remoteAddress))throw new AppError(403,'LOCAL_SETUP_ONLY','Configure o acesso inicial neste computador.');
    if(this.store.db.prepare('SELECT count(*) n FROM users').get().n)throw new AppError(409,'ALREADY_CONFIGURED','O acesso inicial já foi configurado.');
    if(!this.options.pairingToken || !constantEqual(input.pairingToken,this.options.pairingToken))throw new AppError(403,'INVALID_PAIRING','Código de instalação inválido.');
    const fields={id:randomUUID(),name:name(input.name),login:loginValue(input.login)};
    const passwordHash=await this.kdf(()=>hashPassword(input.password));
    return this.store.transaction(()=>{
      if(this.store.db.prepare('SELECT count(*) n FROM users').get().n)throw new AppError(409,'ALREADY_CONFIGURED','O acesso inicial já foi configurado.');
      const date=this.iso();this.store.db.prepare("INSERT INTO users VALUES(?,?,?,?,'active',?,?)").run(fields.id,fields.name,fields.login,passwordHash,date,date);
      let c=this.store.db.prepare("SELECT * FROM companies WHERE status='active' ORDER BY created_at,id LIMIT 1").get();
      if(!c)c=createCompany(this.store,{name:input.companyName||'Minha empresa'});
      let u=this.store.db.prepare("SELECT * FROM units WHERE company_id=? AND status='active' ORDER BY created_at,id LIMIT 1").get(c.id);
      if(!u)u=createUnit(this.store,c.id,{name:input.unitName||'Unidade inicial'});
      this.bootstrapAccess(fields.id,c.id,u.id);
      this.audit({userId:fields.id,companyId:c.id,unitId:u.id,action:'CREATE',entity:'user',recordId:fields.id,executedBy:fields.id,after:{id:fields.id,name:fields.name,login:fields.login,status:'active'}});
      return this.newSession(fields.id,{companyId:c.id,unitId:u.id},req,'LOGIN');
    });
  }
  async login(req,input) {
    let login;try{login=loginValue(input.login);}catch{login='';}
    this.rate(req,login);
    const user=this.store.db.prepare('SELECT * FROM users WHERE login=?').get(login);
    const valid=await this.kdf(async()=>{
      if(!user && !this.dummy)this.dummy=hashPassword(randomBytes(32).toString('base64url'));
      return verifyPassword(typeof input.password==='string'?input.password:'',user?.password_hash||await this.dummy);
    });
    // Recheck status/password after async hashing; a parallel account change must take effect.
    const current=user?this.store.db.prepare('SELECT * FROM users WHERE id=?').get(user.id):null;
    if(!valid || !current || current.status!=='active' || current.password_hash!==user.password_hash){
      this.store.transaction(()=>this.audit({action:'LOGIN_FAILURE',entity:'session',reason:'Credenciais inválidas'}));
      throw new AppError(401,'INVALID_CREDENTIALS','Login ou senha inválidos.');
    }
    return this.store.transaction(()=>{
      const fresh=this.store.db.prepare('SELECT status,password_hash FROM users WHERE id=?').get(current.id);
      if(!fresh || fresh.status!=='active' || fresh.password_hash!==current.password_hash)throw new AppError(401,'INVALID_CREDENTIALS','Login ou senha inválidos.');
      const scopes=this.contexts(current.id);return this.newSession(current.id,scopes.length===1?scopes[0]:null,req,'LOGIN');
    });
  }
  send(res,statusCode,value) {res.writeHead(statusCode,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
  async handle(req,res,rawBody='') {
    const pathname=new URL(req.url,'http://local').pathname;
    if(!pathname.startsWith('/api/auth/')&&pathname!=='/api/foundation/password-reset')return false;
    try{
      if(await require('./auth-maintenance').handleAccess(this,req,res,rawBody))return true;
      this.checkHost(req);
      if(pathname==='/api/auth/status' && req.method==='GET'){
        let ctx;try{ctx=this.authenticate(req);}catch(e){if(!(e instanceof AppError)||e.status!==401)throw e;}
        let csrfToken;if(ctx)csrfToken=ctx.csrfToken;else{
          const nonce=cookie(req,PREAUTH_COOKIE)||randomBytes(32).toString('base64url');this.setCookie(res,PREAUTH_COOKIE,nonce,60*60*1000);csrfToken=this.tokenCsrf('preauth',nonce);
        }
        this.send(res,200,{needsSetup:this.store.db.prepare('SELECT count(*) n FROM users').get().n===0,authenticated:!!ctx,csrfToken});return true;
      }
      if(pathname==='/api/auth/me' && req.method==='GET'){this.send(res,200,this.publicContext(this.authenticate(req)));return true;}
      if(!['/api/auth/setup','/api/auth/login','/api/auth/logout','/api/auth/context'].includes(pathname) || req.method!=='POST')throw new AppError(404,'NOT_FOUND','Rota de acesso não encontrada.');
      const input=this.body(rawBody);
      if(pathname==='/api/auth/setup'||pathname==='/api/auth/login'){
        this.validateCsrf(req);
        if(pathname==='/api/auth/setup')this.rate(req,'setup');
        const token=await (pathname.endsWith('/setup')?this.setup(req,input):this.login(req,input));
        this.setCookie(res,SESSION_COOKIE,token,this.sessionLifetimeMs);this.setCookie(res,PREAUTH_COOKIE,'',0);
        const ctx=this.authenticate({...req,headers:{...req.headers,cookie:SESSION_COOKIE+'='+token}});this.send(res,200,this.publicContext(ctx));return true;
      }
      const ctx=this.authenticate(req);this.validateCsrf(req,ctx);
      if(pathname.endsWith('/logout')){
        this.store.transaction(()=>{this.store.db.prepare('UPDATE sessions SET revoked_at=? WHERE id=?').run(this.iso(),ctx.sessionId);this.store.db.prepare('DELETE FROM inactive_sale_approvals WHERE session_id=? AND consumed_at IS NULL').run(ctx.sessionId);this.audit({userId:ctx.userId,companyId:ctx.companyId,unitId:ctx.unitId,sessionId:ctx.sessionId,action:'LOGOUT',entity:'session',recordId:ctx.sessionId,executedBy:ctx.userId});});
        this.setCookie(res,SESSION_COOKIE,'',0);this.setCookie(res,PREAUTH_COOKIE,'',0);this.send(res,200,{loggedOut:true});return true;
      }
      const scope=this.contexts(ctx.userId).find(c=>c.companyId===input.companyId && c.unitId===input.unitId);
      if(!scope)throw new AppError(403,'FORBIDDEN_CONTEXT','Você não tem acesso a esta empresa e unidade.');
      this.store.transaction(()=>{
        const fresh=this.authenticate(req);this.validateCsrf(req,fresh);
        if(!this.contexts(fresh.userId).some(c=>c.companyId===scope.companyId&&c.unitId===scope.unitId))throw new AppError(403,'FORBIDDEN_CONTEXT','Você não tem acesso a esta empresa e unidade.');
        this.store.db.prepare('UPDATE sessions SET company_id=?,unit_id=? WHERE id=?').run(scope.companyId,scope.unitId,fresh.sessionId);
        this.audit({userId:fresh.userId,companyId:scope.companyId,unitId:scope.unitId,sessionId:fresh.sessionId,action:'CONTEXT_CHANGE',entity:'session',recordId:fresh.sessionId,executedBy:fresh.userId,before:{companyId:fresh.companyId,unitId:fresh.unitId},after:{companyId:scope.companyId,unitId:scope.unitId}});
      });
      this.send(res,200,this.publicContext(this.authenticate(req)));return true;
    }catch(error){
      if(!(error instanceof AppError))throw error;
      this.send(res,error.status,{error:error.message,code:error.code});return true;
    }
  }
}
module.exports={Identity,hashPassword,verifyPassword,createUser,loginValue,passwordValue,publicUser,requirePermission,publicContext};
