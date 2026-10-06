'use strict';
// Synthetic experiment only: replace exactly the global history summation in syncInventory.
const assert = require('node:assert/strict');
const before = " for(const p of state.products){let sum='0';for(const m of state.stockMovements||[])if(m.productId===p.id)sum=add(sum,m.quantity);";
const after = " const movementTotals=new Map();for(const m of state.stockMovements||[])movementTotals.set(m.productId,add(movementTotals.get(m.productId)??'0',m.quantity));\n for(const p of state.products){const sum=movementTotals.get(p.id)??'0';";
function candidate(source) {
  assert.equal(source.split(before).length, 2, 'Only the current global balance loop may change.');
  return source.replace(before, after.replace(/\n/g, source.includes('\r\n') ? '\r\n' : '\n'));
}
function visits(source, store, scope, state, revision, accumulated) {
  // Untimed execution of the actual body. Counters never enter timed HTTP samples.
  let instrumented = source.replace('function syncInventory(store,scope,state,rev){',
    'function syncInventory(store,scope,state,rev){const visits={movementVisits:0,productVisits:0};');
  if (accumulated) {
    instrumented = instrumented.replace("for(const m of state.stockMovements||[])movementTotals.set(m.productId,add(movementTotals.get(m.productId)??'0',m.quantity));",
      "for(const m of state.stockMovements||[]){visits.movementVisits++;movementTotals.set(m.productId,add(movementTotals.get(m.productId)??'0',m.quantity));}");
    instrumented = instrumented.replace("for(const p of state.products){const sum=movementTotals.get(p.id)??'0';",
      "for(const p of state.products){visits.productVisits++;const sum=movementTotals.get(p.id)??'0';");
  } else {
    instrumented = instrumented.replace(before, " for(const p of state.products){visits.productVisits++;let sum='0';for(const m of state.stockMovements||[]){visits.movementVisits++;if(m.productId===p.id)sum=add(sum,m.quantity);}");
  }
  instrumented = instrumented.replace('// Snapshot revision is committed later;', 'return visits; // Snapshot revision is committed later;');
  assert.notEqual(instrumented, source);
  const inventory = require('./stock-insert-equivalence').compile(instrumented);
  let result; const stop = new Error('Untimed visit counting rollback');
  const {contents,digest}=require('./stock-insert-equivalence'), initial=digest(contents(store));
  try {store.transaction(() => {result=inventory.syncInventory(store,scope,state,revision);throw stop;});}
  catch (error) {if(error!==stop)throw error;}
  assert.equal(digest(contents(store)),initial);
  assert.deepEqual(result,{movementVisits:accumulated?(state.stockMovements||[]).length:state.products.length*(state.stockMovements||[]).length,productVisits:state.products.length});
  return {...result,totalVisits:result.movementVisits+result.productVisits};
}
module.exports={candidate,visits,before,after};
