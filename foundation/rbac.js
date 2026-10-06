'use strict';
const{randomUUID}=require('node:crypto');const{name}=require('./sql-store');const{write}=require('./entities');const{AppError}=require('./errors');
const PERMISSIONS=Object.freeze({
 'catalog.view':'Consultar cadastros','catalog.manage':'Gerenciar cadastros',
 'inventory.view':'Consultar estoque','inventory.adjust':'Movimentar e ajustar estoque',
 'sales.view':'Consultar vendas','sales.create':'Criar vendas/orçamentos','sales.cancel':'Cancelar vendas',
 'sales.authorize_inactive':'Autorizar venda excepcional de produto desativado',
 'purchases.manage':'Gerenciar compras','financial.view':'Consultar financeiro','financial.manage':'Gerenciar financeiro',
 'cash.manage':'Operar caixa','operations.view':'Consultar operação','operations.manage':'Gerenciar rotinas',
 'users.manage':'Gerenciar acessos da empresa','users.reset_password':'Redefinir acesso de usuários da empresa','roles.manage':'Gerenciar papéis da empresa',
 'companies.manage':'Gerenciar a própria empresa','units.manage':'Gerenciar unidades da empresa','audit.view':'Consultar auditoria'
});
const SNAPSHOT_READ=Object.freeze(['catalog.view','inventory.view','sales.view','financial.view','operations.view']);
function seedPermissions(store){return write(store,()=>{
 const insert=store.db.prepare('INSERT INTO permissions VALUES(?,?) ON CONFLICT(code) DO UPDATE SET description=excluded.description');
 for(const[c,d]of Object.entries(PERMISSIONS))insert.run(c,d);
 for(const [table,permission,count]of [['inactive_permission_upgrade','sales.authorize_inactive',18],['reset_permission_upgrade','users.reset_password',19]]){
  if(!store.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table))continue;
  for(const row of store.db.prepare('SELECT * FROM '+table+' WHERE audited_at IS NULL').all()){
   require('./audit').appendAudit(store,{action:permission==='users.reset_password'?'RESET_PERMISSION_UPGRADE':'PERMISSION_UPGRADE',entity:'role',recordId:row.role_id,reason:'Concessão técnica única: papel possuía as '+count+' permissões anteriores explícitas.',after:{companyId:row.company_id,roleId:row.role_id,permission,grantedAt:row.granted_at}});
   store.db.prepare('UPDATE '+table+' SET audited_at=? WHERE company_id=? AND role_id=?').run(new Date().toISOString(),row.company_id,row.role_id);
  }
 }
});}
function permissionList(input){if(!Array.isArray(input)||input.length>Object.keys(PERMISSIONS).length||input.some(c=>typeof c!=='string'||!Object.hasOwn(PERMISSIONS,c)))throw new AppError(422,'INVALID_PERMISSIONS','Permissões inválidas.');return [...new Set(input)];}
function createRole(store,companyId,input){return write(store,()=>{const id=randomUUID(),codes=permissionList(input.permissions||[]);store.db.prepare('INSERT INTO roles VALUES(?,?,?)').run(companyId,id,name(input.name));const insert=store.db.prepare('INSERT INTO role_permissions VALUES(?,?,?)');for(const code of codes)insert.run(companyId,id,code);return {id,companyId,name:input.name.trim(),permissions:codes};});}
function setRolePermissions(store,companyId,roleId,input){return write(store,()=>{const codes=permissionList(input);if(!store.db.prepare('SELECT 1 FROM roles WHERE company_id=? AND id=?').get(companyId,roleId))throw new AppError(404,'NOT_FOUND','Papel não encontrado nesta empresa.');store.db.prepare('DELETE FROM role_permissions WHERE company_id=? AND role_id=?').run(companyId,roleId);for(const code of codes)store.db.prepare('INSERT INTO role_permissions VALUES(?,?,?)').run(companyId,roleId,code);return codes;});}
function assignRole(store,userId,companyId,unitId,roleId){return write(store,()=>{store.db.prepare('INSERT INTO unit_roles VALUES(?,?,?,?) ON CONFLICT DO NOTHING').run(userId,companyId,unitId,roleId);});}
function effectivePermissions(store,userId,companyId,unitId){return store.db.prepare(`SELECT DISTINCT rp.permission_code code FROM unit_roles ur JOIN role_permissions rp ON rp.company_id=ur.company_id AND rp.role_id=ur.role_id
 JOIN unit_memberships um ON um.user_id=ur.user_id AND um.company_id=ur.company_id AND um.unit_id=ur.unit_id
 JOIN company_memberships cm ON cm.user_id=um.user_id AND cm.company_id=um.company_id
 JOIN companies c ON c.id=um.company_id JOIN units u ON u.id=um.unit_id AND u.company_id=um.company_id JOIN users person ON person.id=um.user_id
 WHERE ur.user_id=? AND ur.company_id=? AND ur.unit_id=? AND um.status='active' AND cm.status='active' AND c.status='active' AND u.status='active' AND person.status='active' ORDER BY code`).all(userId,companyId,unitId).map(r=>r.code);}
module.exports={PERMISSIONS,SNAPSHOT_READ,seedPermissions,createRole,setRolePermissions,assignRole,effectivePermissions};
