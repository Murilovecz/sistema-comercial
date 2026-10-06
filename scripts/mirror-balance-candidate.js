'use strict';
// Controlled experiment: only the global history summation inside verifyInventoryMirror.
const assert=require('node:assert/strict');
const before="let sum='0';for(const m of next.stockMovements||[])if(m.productId===p.id)sum=add(sum,m.quantity);";
const insertion=' if(balances.length!==state.products.length)throw divergence();';
const accumulator=" const verifiedMovementTotals=new Map();for(const m of next.stockMovements||[])verifiedMovementTotals.set(m.productId,add(verifiedMovementTotals.get(m.productId)??'0',m.quantity));";
function candidate(source){
 assert.equal(source.split(before).length,2);assert.equal(source.split(insertion).length,2);
 const eol=source.includes('\r\n')?'\r\n':'\n';
 return source.replace(insertion,insertion+eol+accumulator).replace(before,"const sum=verifiedMovementTotals.get(p.id)??'0';");
}
function visits(source,store,scope,state,accumulated){
 let s=source.replace('function verifyInventoryMirror(store,scope,state){','function verifyInventoryMirror(store,scope,state){const visits={movementVisits:0,productVisits:0};');
 s=s.replace(' for(const p of next.products){const b=',' for(const p of next.products){visits.productVisits++;const b=');
 if(accumulated)s=s.replace(accumulator," const verifiedMovementTotals=new Map();for(const m of next.stockMovements||[]){visits.movementVisits++;verifiedMovementTotals.set(m.productId,add(verifiedMovementTotals.get(m.productId)??'0',m.quantity));}");
 else s=s.replace(before,"let sum='0';for(const m of next.stockMovements||[]){visits.movementVisits++;if(m.productId===p.id)sum=add(sum,m.quantity);}");
 assert.equal(s.split(' return next;').length,2);s=s.replace(' return next;',' return {state:next,visits};');
 const {compile,contents,digest}=require('./stock-insert-equivalence'),dbBefore=digest(contents(store));
 const result=compile(s).verifyInventoryMirror(store,scope,state);
 assert.equal(digest(contents(store)),dbBefore);
 assert.deepEqual(result.state,state);
 assert.deepEqual(result.visits,{movementVisits:accumulated?(state.stockMovements||[]).length:state.products.length*(state.stockMovements||[]).length,productVisits:state.products.length});
 return {...result.visits,totalVisits:result.visits.movementVisits+result.visits.productVisits};
}
module.exports={candidate,visits,before,insertion,accumulator};
