'use strict';
const { randomUUID } = require('node:crypto');
const { name } = require('./sql-store');
const { AppError } = require('./errors');
function write(store,fn) { return store.inTransaction ? fn() : store.transaction(fn); }
function status(value='active') { if (!['active','inactive'].includes(value)) throw new AppError(422,'INVALID_STATUS','Situação inválida.'); return value; }
function createCompany(store,input) {
  return write(store,()=>{const row={id:randomUUID(),name:name(input.name),status:status(input.status),created_at:new Date().toISOString()};row.updated_at=row.created_at;
    store.db.prepare('INSERT INTO companies VALUES(?,?,?,?,?)').run(row.id,row.name,row.status,row.created_at,row.updated_at);return row;});
}
function getCompany(store,id) { const row=store.db.prepare('SELECT * FROM companies WHERE id=?').get(id);if(!row)throw new AppError(404,'NOT_FOUND','Empresa não encontrada.');return row; }
function updateCompany(store,id,input) {
  return write(store,()=>{const old=getCompany(store,id);store.db.prepare('UPDATE companies SET name=?,status=?,updated_at=? WHERE id=?').run(input.name===undefined?old.name:name(input.name),input.status===undefined?old.status:status(input.status),new Date().toISOString(),id);return getCompany(store,id);});
}
function createUnit(store,companyId,input) {
  return write(store,()=>{getCompany(store,companyId);const row={company_id:companyId,id:randomUUID(),name:name(input.name),status:status(input.status),created_at:new Date().toISOString()};row.updated_at=row.created_at;
    store.db.prepare('INSERT INTO units VALUES(?,?,?,?,?,?)').run(row.company_id,row.id,row.name,row.status,row.created_at,row.updated_at);return row;});
}
function getUnit(store,companyId,unitId) {const row=store.db.prepare('SELECT * FROM units WHERE company_id=? AND id=?').get(companyId,unitId);if(!row)throw new AppError(404,'NOT_FOUND','Unidade não encontrada.');return row;}
function updateUnit(store,companyId,unitId,input) {
 return write(store,()=>{const old=getUnit(store,companyId,unitId);store.db.prepare('UPDATE units SET name=?,status=?,updated_at=? WHERE company_id=? AND id=?').run(input.name===undefined?old.name:name(input.name),input.status===undefined?old.status:status(input.status),new Date().toISOString(),companyId,unitId);return getUnit(store,companyId,unitId);});
}
module.exports={createCompany,getCompany,updateCompany,createUnit,getUnit,updateUnit,write,status};
