'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {SqlStore}=require('./sql-store');
const {Identity,hashPassword,verifyPassword,createUser}=require('./identity');
const {randomBytes}=require('node:crypto');
const {createCompany,createUnit}=require('./entities');
const password='Senha forte 123!';
test('Argon2id usa salt único, parâmetros versionados e verifica sem remover espaços',async()=>{
  const a=await hashPassword(password),b=await hashPassword(password);
  assert.notEqual(a,b);assert.ok(a.startsWith('foundation-argon2id-v1$65536$3$1$'));
  assert.equal(await verifyPassword(password,a),true);assert.equal(await verifyPassword(password+' ',a),false);assert.equal(await verifyPassword('errada',a),false);
  const spaced=await hashPassword('  Senha forte 123!  ');assert.equal(await verifyPassword('Senha forte 123!',spaced),false);
});
function fixture(options={}) {
  const store=new SqlStore(':memory:'),pairingToken=randomBytes(32).toString('base64url'),events=[];
  store.db.prepare('INSERT INTO permissions VALUES(?,?)').run('sales.create','Criar venda');
  const identity=new Identity(store,{pairingToken,audit:event=>{assert.equal(store.inTransaction,true);events.push(event);},...options}),jar={};let csrfToken;
  async function call(path,method='GET',input={},extras={}) {
    const headers={host:'127.0.0.1:3211',origin:options.secureCookies?'https://127.0.0.1:3211':'http://127.0.0.1:3211','content-type':'application/json',cookie:Object.entries(jar).map(([k,v])=>k+'='+v).join('; '),'x-csrf-token':csrfToken,...extras};
    const req={url:'/api/auth/'+path,method,headers,socket:{remoteAddress:'127.0.0.1'}};
    const res={headers:{},getHeader(k){return this.headers[k];},setHeader(k,v){this.headers[k]=v;},writeHead(status,h){this.status=status;Object.assign(this.headers,h);},end(body){this.body=JSON.parse(body);}};
    await identity.handle(req,res,typeof input==='string'?input:JSON.stringify(input));
    for(const value of res.headers['Set-Cookie']||[]){const first=value.split(';')[0],at=first.indexOf('=');jar[first.slice(0,at)]=first.slice(at+1);if(!jar[first.slice(0,at)])delete jar[first.slice(0,at)];}
    if(res.body.csrfToken)csrfToken=res.body.csrfToken;
    return {...res,req};
  }
  async function setup(){await call('status');return call('setup','POST',{name:'Dono',login:'owner',password,pairingToken});}
  return {store,identity,jar,events,call,setup,pairingToken};
}
test('bootstrap pareado cria usuário/vínculos/sessão uma vez e não revela segredos',async()=>{
  const f=fixture();try{
    const status=await f.call('status');assert.equal(status.body.needsSetup,true);assert.ok(!JSON.stringify(status.body).includes(f.pairingToken));
    const bad=await f.call('setup','POST',{name:'Dono',login:'owner',password,pairingToken:'errado'});assert.equal(bad.status,403);
    const result=await f.setup();assert.equal(result.status,200);assert.ok(result.body.companyId);assert.ok(result.body.unitId);assert.deepEqual(result.body.permissions,['sales.authorize_inactive','sales.create','users.reset_password']);
    const encoded=JSON.stringify(result.body);assert.ok(!encoded.includes(password));assert.ok(!encoded.includes('password_hash'));assert.ok(!encoded.includes('tokenHash'));assert.ok(!encoded.includes(f.jar.foundation_session));
    const set=result.headers['Set-Cookie'].find(v=>v.startsWith('foundation_session='));assert.match(set,/HttpOnly/);assert.match(set,/SameSite=Strict/);assert.match(set,/Path=\//);
    assert.equal(f.store.db.prepare('SELECT count(*) n FROM sessions').get().n,1);
    const session=f.store.db.prepare('SELECT * FROM sessions').get();assert.match(session.token_hash,/^[a-f0-9]{64}$/);assert.notEqual(session.token_hash,f.jar.foundation_session);
    await f.call('logout','POST');await f.call('status');assert.equal((await f.call('setup','POST',{name:'Outro',login:'other',password,pairingToken:f.pairingToken})).status,409);
    assert.equal(f.store.db.prepare('SELECT count(*) n FROM users').get().n,1);assert.ok(f.events.some(e=>e.action==='LOGIN'));
  }finally{f.store.close();}
});
test('login correto, credenciais erradas/inexistentes/inativas, logout e sessão inválida',async()=>{
  const f=fixture();try{
    await f.setup();const previous=f.jar.foundation_session;await f.call('logout','POST');assert.equal((await f.call('me')).status,401);await f.call('status');
    const wrong=await f.call('login','POST',{login:'owner',password:'outra senha 123!'}),missing=await f.call('login','POST',{login:'unknown',password});
    assert.equal(wrong.status,401);assert.deepEqual(wrong.body,missing.body);
    const inactive=await createUser(f.store,{name:'Inativo',login:'disabled',password,status:'inactive'});
    const disabled=await f.call('login','POST',{login:inactive.login,password});assert.deepEqual(disabled.body,wrong.body);
    const login=await f.call('login','POST',{login:'OWNER',password});assert.equal(login.status,200);assert.notEqual(f.jar.foundation_session,previous);
    assert.equal((await f.call('me')).body.user.login,'owner');assert.equal(f.store.db.prepare('SELECT count(*) n FROM sessions WHERE revoked_at IS NOT NULL').get().n,1);
    f.jar.foundation_session=randomBytes(32).toString('base64url');assert.equal((await f.call('me')).status,401);
  }finally{f.store.close();}
});
test('sessão expira por prazo absoluto e inatividade com relógio controlado',async()=>{
  let now=Date.parse('2026-10-02T08:00:00Z');const f=fixture({now:()=>now,sessionLifetimeMs:1000,idleMs:500});try{
    await f.setup();now+=400;assert.equal((await f.call('me')).status,200);now+=400;assert.equal((await f.call('me')).status,200);now+=201;assert.equal((await f.call('me')).status,401);
    await f.call('status');await f.call('login','POST',{login:'owner',password});now+=501;assert.equal((await f.call('me')).status,401);
  }finally{f.store.close();}
});
test('usuário, empresa, unidade e vínculos desativados invalidam sessão imediatamente',async()=>{
  for(const kind of ['users','companies','units','company_memberships','unit_memberships']){
    const f=fixture();try{const result=await f.setup();f.store.db.exec(`UPDATE ${kind} SET status='inactive'`);assert.equal((await f.call('me')).status,401,kind);assert.ok(result.body.companyId);}finally{f.store.close();}
  }
});
test('contexto exige vínculo e permissões são reconsultadas sem aceitar dados do frontend',async()=>{
  const f=fixture();try{
    const first=await f.setup(),company=createCompany(f.store,{name:'Segunda'}),unit=createUnit(f.store,company.id,{name:'Loja B'});
    assert.equal((await f.call('context','POST',{companyId:company.id,unitId:unit.id,userId:'inventado',permissions:['users.manage']})).status,403);
    const userId=first.body.user.id;f.store.db.prepare("INSERT INTO company_memberships VALUES(?,?,'active')").run(userId,company.id);f.store.db.prepare("INSERT INTO unit_memberships VALUES(?,?,?,'active')").run(userId,company.id,unit.id);
    const oldCsrf=first.body.csrfToken;
    const changed=await f.call('context','POST',{companyId:company.id,unitId:unit.id});assert.equal(changed.status,200);assert.deepEqual(changed.body.permissions,[]);assert.notEqual(changed.body.csrfToken,oldCsrf);
    assert.equal((await f.call('context','POST',{companyId:first.body.companyId,unitId:first.body.unitId},{'x-csrf-token':oldCsrf})).status,403);
    assert.equal(changed.body.contexts.length,2);assert.throws(()=>f.identity.requirePermission(f.identity.authenticate(changed.req),'sales.create'),e=>e.status===403);
    const back=await f.call('context','POST',{companyId:first.body.companyId,unitId:first.body.unitId});assert.deepEqual(back.body.permissions,['sales.authorize_inactive','sales.create','users.reset_password']);
    f.store.db.exec('DELETE FROM role_permissions');assert.deepEqual((await f.call('me')).body.permissions,[]);
  }finally{f.store.close();}
});
test('Host, Origin, JSON e CSRF protegem bootstrap, login, contexto e logout',async()=>{
  const f=fixture();try{
    const initial=await f.call('status');const input={name:'Dono',login:'owner',password,pairingToken:f.pairingToken};
    await assert.rejects(f.identity.setup({...initial.req,socket:{remoteAddress:'10.0.0.2'}},input),e=>e.code==='LOCAL_SETUP_ONLY');
    assert.equal((await f.call('setup','POST',input,{origin:'https://malicioso.example'})).status,403);
    assert.equal((await f.call('setup','POST',input,{host:'malicioso.example'})).status,403);
    assert.equal((await f.call('setup','POST',input,{'content-type':'application/x-www-form-urlencoded'})).status,415);
    assert.equal((await f.call('setup','POST',input,{'x-csrf-token':'errado'})).status,403);
    assert.equal((await f.call('setup','POST',input,{origin:undefined})).status,403);assert.equal(f.store.db.prepare('SELECT count(*) n FROM users').get().n,0);
    await f.setup();assert.equal((await f.call('logout','POST',{}, {'x-csrf-token':'errado'})).status,403);assert.equal((await f.call('me')).status,200);
  }finally{f.store.close();}
});
test('falha de auditoria faz rollback da configuração, vínculos e sessão',async()=>{
  const f=fixture({audit:()=>{throw Error('falha de auditoria');}});try{
    await assert.rejects(f.setup(),/falha de auditoria/);
    for(const table of ['users','companies','units','sessions','company_memberships','unit_memberships','roles'])assert.equal(f.store.db.prepare(`SELECT count(*) n FROM ${table}`).get().n,0,table);
  }finally{f.store.close();}
});
test('duas configurações concorrentes produzem apenas um dono e uma sessão',async()=>{
  const f=fixture();try{
    await f.call('status');const input={name:'Dono',login:'owner',password,pairingToken:f.pairingToken};
    const results=await Promise.all([f.call('setup','POST',input),f.call('setup','POST',{...input,login:'second'})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
    assert.equal(f.store.db.prepare('SELECT count(*) n FROM users').get().n,1);assert.equal(f.store.db.prepare('SELECT count(*) n FROM sessions').get().n,1);
  }finally{f.store.close();}
});
test('proteção contra tentativas e custo concorrente limita hashing antes de executá-lo',async()=>{
  const f=fixture();try{
    await f.call('status');for(let n=0;n<8;n++)assert.equal((await f.call('login','POST',{login:'unknown',password})).status,401);
    assert.equal((await f.call('login','POST',{login:'unknown',password})).status,429);
    let release1,release2;const a=f.identity.kdf(()=>new Promise(resolve=>{release1=resolve;})),b=f.identity.kdf(()=>new Promise(resolve=>{release2=resolve;}));
    await assert.rejects(f.identity.kdf(()=>Promise.resolve()),e=>e.status===429);release1();release2();await Promise.all([a,b]);assert.equal(f.identity.kdfActive,0);
  }finally{f.store.close();}
});
test('cookie Secure é explícito; corpo inválido e cookie duplicado não criam acesso',async()=>{
  const f=fixture({secureCookies:true});try{
    const setup=await f.setup();assert.match(setup.headers['Set-Cookie'].find(v=>v.startsWith('foundation_session=')),/; Secure$/);
    const duplicate='foundation_session='+f.jar.foundation_session+'; foundation_session='+f.jar.foundation_session;
    assert.equal((await f.call('me','GET',{}, {cookie:duplicate})).status,401);
    assert.equal((await f.call('context','POST','{')).status,400);assert.equal((await f.call('context','POST','[]')).status,422);
    assert.equal((await f.call('context','POST','x'.repeat(17000))).status,413);
  }finally{f.store.close();}
});
test('hash de senha inválido ou custo adulterado falha sem derivação excessiva',async()=>{
  for(const hash of ['texto','foundation-argon2id-v1$999999999$3$1$a$b',null])assert.equal(await verifyPassword(password,hash),false);
  await assert.rejects(hashPassword('curta'),e=>e.code==='INVALID_PASSWORD');await assert.rejects(hashPassword('x'.repeat(129)));
});
test('usuário real mantém identificação, unicidade normalizada e somente hash persistido',async()=>{
  const s=new SqlStore(':memory:');try{
    const a=await createUser(s,{name:' Murilo ',login:' OWNER@LOCAL ',password});
    assert.equal(a.name,'Murilo');assert.equal(a.login,'owner@local');assert.equal(a.status,'active');assert.equal(a.created_at,a.updated_at);assert.ok(!('password_hash' in a));
    const row=s.db.prepare('SELECT * FROM users WHERE id=?').get(a.id);assert.notEqual(row.password_hash,password);assert.equal(await verifyPassword(password,row.password_hash),true);
    await assert.rejects(createUser(s,{name:'Outro',login:'owner@local',password}),e=>e.code==='LOGIN_EXISTS');
    await assert.rejects(createUser(s,{name:'Outro',login:'in válido',password}));
    await assert.rejects(createUser(s,{name:'Outro',login:'other',password,status:'admin'}));
    assert.equal(s.db.prepare('SELECT count(*) n FROM users').get().n,1);
  }finally{s.close();}
});
