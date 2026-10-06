(function(root){
 function retainedQuantity(state,productId){const n=(state.quarantineEntries||[]).filter(r=>r.productId===productId).reduce((n,r)=>n+r.remainingQuantity,0);if(!Number.isSafeInteger(n))throw Error('Saldo retido fora do limite.');return n;}
 function quarantineStatus(r){return r.remainingQuantity===0?'closed':(r.inspections||[]).length?'inspected':'waiting';}
 function physicalPosition(state,p){const workflow=typeof module==='object'&&module.exports?require('./workflow-core'):{reservedQuantity,availableQuantity};const held=retainedQuantity(state,p.id),total=p.stock+held;if(!Number.isSafeInteger(total))throw Error('Físico total fora do limite.');return {sellable:p.stock,reserved:workflow.reservedQuantity(state,p.id),available:workflow.availableQuantity(state,p),retained:held,total};}
 const api={retainedQuantity,quarantineStatus,physicalPosition};if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root,api);
})(typeof globalThis!=='undefined'?globalThis:this);
