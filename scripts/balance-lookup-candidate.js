'use strict';
// Experiment only: index balances locally, preserving find's first-match semantics.
const assert=require('node:assert/strict');
const lookup='balances.find(b=>b.product_id===p.id)';
const cardinality=' if(balances.length!==state.products.length)throw divergence();';
const index=' const balanceByProductId=new Map();for(const b of balances)if(!balanceByProductId.has(b.product_id))balanceByProductId.set(b.product_id,b);';
function candidate(source){
 assert.equal(source.split(lookup).length,2);assert.equal(source.split(cardinality).length,2);
 return source.replace(cardinality,cardinality+(source.includes('\r\n')?'\r\n':'\n')+index).replace(lookup,'balanceByProductId.get(p.id)');
}
function visits(source,store,scope,state,indexed){
 // Count actual executions in a separate, untimed, read-only replay.
 let s=source.replace('function verifyInventoryMirror(store,scope,state){','function verifyInventoryMirror(store,scope,state){const counts={balances:0,searches:0,comparisons:0,mapChecks:0,mapInsertions:0,mapLookups:0};');
 assert.equal(s.split(cardinality).length,2);s=s.replace(cardinality,cardinality+'counts.balances=balances.length;');
 if(indexed){
  assert.equal(s.split(index).length,2);
  s=s.replace(index,' const balanceByProductId=new Map();for(const b of balances){counts.mapChecks++;if(!balanceByProductId.has(b.product_id)){counts.mapInsertions++;balanceByProductId.set(b.product_id,b);}}');
  assert.equal(s.split('balanceByProductId.get(p.id)').length,2);
  s=s.replace('balanceByProductId.get(p.id)','(counts.mapLookups++,balanceByProductId.get(p.id))');
 }else{assert.equal(s.split(lookup).length,2);s=s.replace(lookup,'(()=>{counts.searches++;return balances.find(b=>{counts.comparisons++;return b.product_id===p.id;});})()');}
 assert.equal(s.split(' return next;').length,2);s=s.replace(' return next;',' return {validated:next,counts};');
 const {compile,contents,digest}=require('./stock-insert-equivalence'),before=digest(contents(store)),input=digest(state);
 const result=compile(s).verifyInventoryMirror(store,scope,state);
 assert.equal(digest(contents(store)),before);assert.equal(digest(state),input);assert.deepEqual(result.validated,state);
 const p=state.products.length;
 assert.deepEqual(result.counts,{balances:p,searches:indexed?0:p,comparisons:indexed?0:p*(p+1)/2,mapChecks:indexed?p:0,mapInsertions:indexed?p:0,mapLookups:indexed?p:0});
 return result.counts;
}
module.exports={candidate,visits,lookup,cardinality,index};
