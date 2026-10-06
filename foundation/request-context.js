'use strict';
const{assertScope}=require('./scoped-state');const{AppError}=require('./errors');
function requestContext(identity,req,options={}){
 const current=identity.authenticate(req);
 if(options.requireScope!==false)assertScope(identity.store,current);
 const expectedCompany=req.headers?.['x-company-id'],expectedUnit=req.headers?.['x-unit-id'];
 if((expectedCompany!==undefined||expectedUnit!==undefined)&&(expectedCompany!==current.companyId||expectedUnit!==current.unitId))throw new AppError(409,'CONTEXT_CHANGED','A empresa ou unidade mudou em outra janela. Atualize antes de continuar.');
 if(options.write)identity.validateCsrf(req,current);
 return Object.freeze({...current,user:Object.freeze({...current.user}),permissions:Object.freeze([...current.permissions])});
}
module.exports={requestContext};
