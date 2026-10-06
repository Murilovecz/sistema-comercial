'use strict';
const {write,status}=require('./entities');
const {AppError}=require('./errors');
function grantCompanyAccess(store,userId,companyId,active='active') {
 return write(store,()=>{store.db.prepare('INSERT INTO company_memberships VALUES(?,?,?) ON CONFLICT(user_id,company_id) DO UPDATE SET status=excluded.status').run(userId,companyId,status(active));});
}
function grantUnitAccess(store,userId,companyId,unitId,active='active') {
 return write(store,()=>{if(!store.db.prepare('SELECT 1 FROM units WHERE company_id=? AND id=?').get(companyId,unitId))throw new AppError(404,'NOT_FOUND','Unidade não encontrada nesta empresa.');
 store.db.prepare('INSERT INTO unit_memberships VALUES(?,?,?,?) ON CONFLICT(user_id,company_id,unit_id) DO UPDATE SET status=excluded.status').run(userId,companyId,unitId,status(active));});
}
function accessContexts(store,userId) {
 return store.db.prepare(`SELECT c.id companyId,c.name companyName,u.id unitId,u.name unitName
 FROM unit_memberships um JOIN users person ON person.id=um.user_id
 JOIN company_memberships cm ON cm.user_id=um.user_id AND cm.company_id=um.company_id
 JOIN companies c ON c.id=um.company_id JOIN units u ON u.company_id=um.company_id AND u.id=um.unit_id
 WHERE um.user_id=? AND person.status='active' AND um.status='active' AND cm.status='active' AND c.status='active' AND u.status='active' ORDER BY c.name,u.name`).all(userId).map(r=>({...r}));
}
module.exports={grantCompanyAccess,grantUnitAccess,accessContexts};
