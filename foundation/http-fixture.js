'use strict';
// Synthetic HTTP fixtures only. Never opens the store database.
const assert=require('node:assert/strict'),{randomBytes,randomUUID}=require('node:crypto');
const {createServer}=require('../server'),{createUser}=require('./identity'),{createRole,assignRole}=require('./rbac'),{grantCompanyAccess,grantUnitAccess}=require('./access');
const PASSWORD='Fundacao em teste isolado 2026!';
class Client{
 constructor(origin){this.origin=origin;this.cookies=new Map();this.csrf='';}
 async call(url,input,headers={}){
  const r=await fetch(this.origin+url,{headers:{cookie:[...this.cookies].map(([k,v])=>k+'='+v).join('; '),...(input===undefined?{}:{Origin:this.origin,'Content-Type':'application/json','X-CSRF-Token':this.csrf}),...headers},...(input===undefined?{}:{method:'POST',body:JSON.stringify(input)})});
  for(const value of r.headers.getSetCookie()){const pair=value.split(';')[0],i=pair.indexOf('='),key=pair.slice(0,i),v=pair.slice(i+1);if(v)this.cookies.set(key,v);else this.cookies.delete(key);}
  const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}if(data?.csrfToken)this.csrf=data.csrfToken;return{status:r.status,data,text};
 }
 async login(login,password=PASSWORD){await this.call('/api/auth/status');const r=await this.call('/api/auth/login',{login,password});assert.equal(r.status,200,r.text);return r.data;}
}
async function fixture(t,options={}){
 const pairingToken=randomBytes(32).toString('base64url'),server=createServer({environment:'test',filename:':memory:',importLegacy:false,pairingToken,...options});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const owner=new Client('http://127.0.0.1:'+server.address().port);await owner.call('/api/auth/status');const setup=await owner.call('/api/auth/setup',{pairingToken,name:'Dono sintético',login:'owner-fixture',password:PASSWORD});assert.equal(setup.status,200,setup.text);
 return{server,store:server.runtime.store,owner,scope:{companyId:setup.data.companyId,unitId:setup.data.unitId},ownerId:setup.data.user.id};
}
async function profile(f,permissions,login='profile-'+randomUUID(),scope=f.scope){
 const user=await createUser(f.store,{name:'Pessoa sintética',login,password:PASSWORD});let role;
 f.store.transaction(()=>{grantCompanyAccess(f.store,user.id,scope.companyId);grantUnitAccess(f.store,user.id,scope.companyId,scope.unitId);role=createRole(f.store,scope.companyId,{name:login,permissions});assignRole(f.store,user.id,scope.companyId,scope.unitId,role.id);});
 const client=new Client(f.owner.origin);await client.login(login);return{client,user,role,login,password:PASSWORD};
}
module.exports={Client,fixture,profile,PASSWORD};
