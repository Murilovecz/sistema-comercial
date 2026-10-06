'use strict';
const{randomUUID}=require('node:crypto');const{AppError}=require('./errors');const{requestContext}=require('./request-context');
const{requirePermission,hashPassword,loginValue}=require('./identity');const{name}=require('./sql-store');
const{createCompany,createUnit,getUnit,status}=require('./entities');const{grantCompanyAccess,grantUnitAccess}=require('./access');
const{PERMISSIONS,createRole,setRolePermissions,assignRole}=require('./rbac');const{appendAudit,listAudit}=require('./audit');
function adminData(store,ctx){
 const units=store.db.prepare('SELECT id,name,status FROM units WHERE company_id=? ORDER BY name,id').all(ctx.companyId);
 const roles=store.db.prepare('SELECT id,name FROM roles WHERE company_id=? ORDER BY name,id').all(ctx.companyId).map(r=>({...r,permissions:store.db.prepare('SELECT permission_code code FROM role_permissions WHERE company_id=? AND role_id=? ORDER BY code').all(ctx.companyId,r.id).map(p=>p.code)}));
 const users=store.db.prepare('SELECT u.id,u.name,u.login,cm.status FROM users u JOIN company_memberships cm ON cm.user_id=u.id WHERE cm.company_id=? ORDER BY u.name,u.id').all(ctx.companyId).map(u=>({...u,units:store.db.prepare('SELECT un.id,un.name,um.status FROM unit_memberships um JOIN units un ON un.company_id=um.company_id AND un.id=um.unit_id WHERE um.user_id=? AND um.company_id=? ORDER BY un.name,un.id').all(u.id,ctx.companyId).map(un=>({...un,roles:store.db.prepare('SELECT role_id id FROM unit_roles WHERE user_id=? AND company_id=? AND unit_id=?').all(u.id,ctx.companyId,un.id).map(r=>r.id)}))}));
 return{users,roles,units,permissions:Object.entries(PERMISSIONS).map(([code,description])=>({code,description}))};
}
function actor(ctx){return{userId:ctx.userId,companyId:ctx.companyId,unitId:ctx.unitId,sessionId:ctx.sessionId,executedBy:ctx.userId};}
function ensureGrant(ctx,permissions){if(!Array.isArray(permissions)||permissions.some(code=>!ctx.permissions.includes(code)))throw new AppError(403,'CANNOT_GRANT','Você só pode conceder permissões que possui nesta unidade.');}
function checkedRoles(store,ctx,input){
 if(!Array.isArray(input)||input.length>50||input.some(id=>typeof id!=='string'))throw new AppError(422,'INVALID_ROLES','Papéis inválidos.');
 return [...new Set(input)].map(id=>{const role=store.db.prepare('SELECT id FROM roles WHERE company_id=? AND id=?').get(ctx.companyId,id);if(!role)throw new AppError(404,'NOT_FOUND','Papel não encontrado nesta empresa.');ensureGrant(ctx,store.db.prepare('SELECT permission_code code FROM role_permissions WHERE company_id=? AND role_id=?').all(ctx.companyId,id).map(p=>p.code));return id;});
}
async function handleAdmin(runtime,req,raw){
 const{store,identity}=runtime,url=new URL(req.url,'http://local').pathname;if(!url.startsWith('/api/foundation/'))return null;
 const write=req.method==='POST',initial=requestContext(identity,req,{write});
 if(url==='/api/foundation/audit'&&req.method==='GET'){requirePermission(initial,'audit.view');const rows=listAudit(store,initial),full=require('./rbac').SNAPSHOT_READ.every(p=>initial.permissions.includes(p));return{status:200,value:{events:full?rows:rows.map(r=>require('./commercial-read').auditProjection(r,initial))}};}
 if(url==='/api/foundation/admin'&&req.method==='GET'){requirePermission(initial,'users.manage');requirePermission(initial,'roles.manage');return{status:200,value:adminData(store,initial)};}
 if(!write||!['/api/foundation/users','/api/foundation/access','/api/foundation/roles','/api/foundation/units','/api/foundation/companies'].includes(url))throw new AppError(404,'NOT_FOUND','Operação não encontrada.');
 const input=identity.body(raw);
 // Identity/context changes have their own endpoint. They cannot be supplied to administrative commands.
 if(['companyId','userId','tenantId','executedBy','authorizedBy','permissionsOverride'].some(k=>Object.hasOwn(input,k)))throw new AppError(422,'CLIENT_AUTHORITY','Use o contexto e a identidade verificados pelo servidor.');
 function authorized(){const ctx=requestContext(identity,req,{write:true});const codes=url.endsWith('/roles')?['roles.manage']:url.endsWith('/units')?['units.manage']:url.endsWith('/companies')?Object.keys(PERMISSIONS):['users.manage','roles.manage'];for(const code of codes)requirePermission(ctx,code);return ctx;}
 authorized();
 let prepared;
 if(url.endsWith('/users')){
  prepared={id:randomUUID(),name:name(input.name),login:loginValue(input.login)};
  prepared.passwordHash=await identity.kdf(()=>hashPassword(input.password));
 }
 return store.transaction(()=>{
  const ctx=authorized();let result;
  if(url.endsWith('/users')){
   getUnit(store,ctx.companyId,input.unitId);const roles=checkedRoles(store,ctx,input.roleIds);
   if(store.db.prepare('SELECT 1 FROM users WHERE login=?').get(prepared.login))throw new AppError(409,'LOGIN_EXISTS','Este login já está cadastrado.');
   const date=new Date().toISOString();store.db.prepare("INSERT INTO users VALUES(?,?,?,?,'active',?,?)").run(prepared.id,prepared.name,prepared.login,prepared.passwordHash,date,date);
   grantCompanyAccess(store,prepared.id,ctx.companyId);grantUnitAccess(store,prepared.id,ctx.companyId,input.unitId);for(const id of roles)assignRole(store,prepared.id,ctx.companyId,input.unitId,id);
   result={id:prepared.id,name:prepared.name,login:prepared.login};appendAudit(store,{...actor(ctx),action:'CREATE',entity:'user',recordId:result.id,after:result});
   appendAudit(store,{...actor(ctx),action:'PERMISSION_CHANGE',entity:'unit_membership',recordId:result.id,after:{unitId:input.unitId,roles}});
  }else if(url.endsWith('/access')){
   if(!store.db.prepare('SELECT 1 FROM company_memberships WHERE user_id=? AND company_id=?').get(input.id,ctx.companyId))throw new AppError(404,'NOT_FOUND','Usuário não encontrado nesta empresa.');
   const roles=checkedRoles(store,ctx,input.roleIds),active=status(input.status);getUnit(store,ctx.companyId,input.unitId);
   const before=adminData(store,ctx).users.find(u=>u.id===input.id)?.units.find(u=>u.id===input.unitId)||null;
   if(input.id===ctx.userId&&input.unitId===ctx.unitId&&(active!=='active'||['users.manage','roles.manage'].some(code=>!roles.some(id=>store.db.prepare('SELECT 1 FROM role_permissions WHERE company_id=? AND role_id=? AND permission_code=?').get(ctx.companyId,id,code)))))throw new AppError(409,'SELF_LOCKOUT','Mantenha seu acesso administrativo ativo. Use outro administrador para revisar sua própria permissão.');
   grantUnitAccess(store,input.id,ctx.companyId,input.unitId,active);store.db.prepare('DELETE FROM unit_roles WHERE user_id=? AND company_id=? AND unit_id=?').run(input.id,ctx.companyId,input.unitId);for(const id of roles)assignRole(store,input.id,ctx.companyId,input.unitId,id);
   result={id:input.id,unitId:input.unitId,status:active,roles};appendAudit(store,{...actor(ctx),action:'PERMISSION_CHANGE',entity:'unit_membership',recordId:input.id,before,after:result});
  }else if(url.endsWith('/roles')){
   ensureGrant(ctx,input.permissions);
   if(input.id){const before=adminData(store,ctx).roles.find(r=>r.id===input.id);if(!before)throw new AppError(404,'NOT_FOUND','Papel não encontrado nesta empresa.');setRolePermissions(store,ctx.companyId,input.id,input.permissions);if(input.name!==undefined)store.db.prepare('UPDATE roles SET name=? WHERE company_id=? AND id=?').run(name(input.name),ctx.companyId,input.id);result={id:input.id,permissions:input.permissions};appendAudit(store,{...actor(ctx),action:'PERMISSION_CHANGE',entity:'role',recordId:input.id,before,after:result});}
   else{result=createRole(store,ctx.companyId,input);appendAudit(store,{...actor(ctx),action:'CREATE',entity:'role',recordId:result.id,after:result});}
   const freshPermissions=require('./rbac').effectivePermissions(store,ctx.userId,ctx.companyId,ctx.unitId);
   if(ctx.permissions.includes('users.manage')&&(!freshPermissions.includes('users.manage')||!freshPermissions.includes('roles.manage')))throw new AppError(409,'SELF_LOCKOUT','Mantenha seu acesso administrativo ativo. Use outro administrador para revisar sua própria permissão.');
  }else if(url.endsWith('/units')){
   result=createUnit(store,ctx.companyId,input);grantUnitAccess(store,ctx.userId,ctx.companyId,result.id);
   for(const role of store.db.prepare('SELECT role_id id FROM unit_roles WHERE user_id=? AND company_id=? AND unit_id=?').all(ctx.userId,ctx.companyId,ctx.unitId))assignRole(store,ctx.userId,ctx.companyId,result.id,role.id);
   appendAudit(store,{...actor(ctx),action:'CREATE',entity:'unit',recordId:result.id,after:result});
  }else{
   const c=createCompany(store,input),u=createUnit(store,c.id,{name:input.unitName||'Unidade inicial'});grantCompanyAccess(store,ctx.userId,c.id);grantUnitAccess(store,ctx.userId,c.id,u.id);const role=createRole(store,c.id,{name:'Administrador inicial',permissions:Object.keys(PERMISSIONS)});assignRole(store,ctx.userId,c.id,u.id,role.id);result={companyId:c.id,unitId:u.id};appendAudit(store,{...actor(ctx),action:'CREATE',entity:'company',recordId:c.id,after:{id:c.id,name:c.name}});
  }
  return{status:201,value:{saved:true,result}};
 });
}
module.exports={handleAdmin,adminData};
