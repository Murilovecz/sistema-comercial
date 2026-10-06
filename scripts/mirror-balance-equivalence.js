'use strict';
// Read-only verifier replay. Same input, success value/error, input immutability, all DB rows.
const assert=require('node:assert/strict');
const {compile,contents,digest}=require('./stock-insert-equivalence');
function equivalence(store,scope,state,sources){
 const dbBefore=digest(contents(store)),inputBefore=digest(state),outcomes=[];
 for(const source of sources){
  const input=structuredClone(state);let outcome;
  try{const result=compile(source).verifyInventoryMirror(store,scope,input);outcome={accepted:true,result,sameReference:result===input};}
  catch(error){outcome={accepted:false,error:{name:error.name,code:error.code??null,status:error.status??null,message:error.message}};}
  assert.equal(digest(input),inputBefore,'Verification must not mutate the caller state.');
  assert.equal(digest(contents(store)),dbBefore,'Verification must never write, repair, audit, mark or revise.');
  outcomes.push(outcome);
 }
 assert.deepEqual(outcomes[0],outcomes[1],'Same success result or relevant error, not just boolean acceptance.');
 return {equal:true,databaseBeforeAndAfter:dbBefore,inputBeforeAndAfter:inputBefore,accepted:outcomes[0].accepted,
  ...(outcomes[0].accepted?{resultSHA256:digest(outcomes[0].result),sameReference:outcomes[0].sameReference}:{error:outcomes[0].error})};
}
module.exports={equivalence};
