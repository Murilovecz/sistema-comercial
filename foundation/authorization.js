'use strict';
const{AppError}=require('./errors');const{requirePermission}=require('./identity');const{SNAPSHOT_READ}=require('./rbac');
function requiredLegacyPermissions(method,url){
 const pathname=new URL(url,'http://local').pathname;
 if(method==='GET'&&(pathname==='/api/state'||['/api/export','/api/cash/export'].includes(pathname)||pathname.startsWith('/api/exports/')))return [...SNAPSHOT_READ];
 if(method!=='POST')throw new AppError(404,'NOT_FOUND','Operação não encontrada.');
 let action;
 if(pathname==='/api/exports')action=[];
 else if(/^\/api\/(products|customers)(\/(edit|active))?$/.test(pathname)||/^\/api\/suppliers\/(create|edit|active)$/.test(pathname))action=['catalog.manage'];
 else if(pathname==='/api/sales')action=['sales.create'];
 else if(pathname==='/api/sales/cancel')action=['sales.cancel'];
 else if(pathname==='/api/sales/receive'||['/api/expenses','/api/expenses/cancel'].includes(pathname))action=['financial.manage'];
 else if(pathname==='/api/stock')action=['inventory.adjust'];
 else if(pathname==='/api/company')action=['companies.manage'];
 else if(/^\/api\/quotes\/(create|edit|prices|cancel|convert)$/.test(pathname))action=['sales.create'];
 else if(/^\/api\/purchases\/(create|edit|confirm|receive|close|reschedule)$/.test(pathname))action=['purchases.manage'];
 else if(/^\/api\/payables\/(create|edit|pay|link|cancel)$/.test(pathname))action=['financial.manage'];
 else if(/^\/api\/cash\/(open|supply|withdraw|refund|close)$/.test(pathname))action=['cash.manage'];
 else if(/^\/api\/business\/(catalog|accounts|tasks)\/(metadata|bulk|plan|receive|allocate|forgive|create|edit|complete|reopen|cancel|hide|restore)$/.test(pathname))action=[{catalog:'catalog.manage',accounts:'financial.manage',tasks:'operations.manage'}[pathname.split('/')[3]]];
 else if(/^\/api\/workflows\/(inventory|returns|reservations)\/(create|add|count|choose|rebase|apply|cancel|refund|edit|renew|convert|collect|reopen|close|recount)$/.test(pathname))action=['inventory.adjust',...(pathname.endsWith('/refund')?['financial.manage']:[])];
 else if(/^\/api\/advanced\/(priceLists|promotions|pricing|quarantineEntries|supplierReturns|storeCredits|deliveries|supplierQuotes|expenseCenters|expenseBudgets)\/[a-z]+$/.test(pathname)){
  const key=pathname.split('/')[3];action=key==='pricing'?[]:key==='quarantineEntries'?['inventory.adjust']:key==='supplierReturns'?['purchases.manage','inventory.adjust','financial.manage']:key==='deliveries'?['operations.manage']:key==='supplierQuotes'?['purchases.manage']:['storeCredits','expenseCenters','expenseBudgets'].includes(key)?['financial.manage']:['catalog.manage'];
 }else if(/^\/api\/next\/(packages|aliases|families|positions|transfers|purchaseAmendments|purchaseConferences|purchaseOccurrences|agreements|recurringModels|recurringOccurrences|procedures|procedureExecutions|priceReviews)\/[a-z]+$/.test(pathname)){
  const key=pathname.split('/')[3];action=['positions','transfers'].includes(key)?['inventory.adjust']:key.startsWith('purchase')?['purchases.manage']:['agreements','recurringModels','recurringOccurrences'].includes(key)?['financial.manage']:key.startsWith('procedure')?['operations.manage']:['catalog.manage'];
 }else throw new AppError(404,'NOT_FOUND','Operação não encontrada.');
 return [...new Set([...SNAPSHOT_READ,...action])];
}
function authorizeLegacy(ctx,method,url){for(const code of requiredLegacyPermissions(method,url))requirePermission(ctx,code);return ctx;}
function rejectClientAuthority(input){if(input&&typeof input==='object'&&['companyId','unitId','tenantId','empresa_id','unidade_id','userId','user_id','sessionId','permissions','executedBy','authorizedBy','authorized_by','approvedBy','admin'].some(k=>Object.hasOwn(input,k)))throw new AppError(422,'CLIENT_AUTHORITY','Empresa, unidade, identidade e autorização são determinadas pelo servidor.');}
module.exports={requiredLegacyPermissions,authorizeLegacy,rejectClientAuthority};
