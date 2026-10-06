'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {SqlStore}=require('./sql-store'),{createCompany,createUnit}=require('./entities');
const {writeState}=require('./state-repository'),{loadState}=require('./scoped-state');
const {contents,digest}=require('../scripts/stock-insert-equivalence');
const inventory=require('./inventory-store');
function state(moves=[]) {return {products:[
  {id:'many',name:'Antigo inativo',stock:19,priceCents:100,active:false},
  {id:'one',name:'Um movimento',stock:8,priceCents:100},
  {id:'none',name:'Sem movimento',stock:7,priceCents:100},
  {id:'__proto__',name:'Identificador especial',stock:Number.MAX_SAFE_INTEGER,priceCents:100},
  {id:'constructor',name:'Outro identificador',stock:3,priceCents:100}],customers:[],sales:[],stockMovements:moves};}
const move=(id,productId,quantity)=>({id,productId,quantity,type:'initial',date:'2020',referenceId:productId,custom:{historical:true}});
function fixture(t,input) {
  const store=new SqlStore(':memory:',{environment:'test'});t.after(()=>store.close());
  const a=createCompany(store,{name:'Sintética A'}),b=createCompany(store,{name:'Sintética B'});
  const scopes=[createUnit(store,a.id,{name:'A1'}),createUnit(store,a.id,{name:'A2'}),createUnit(store,b.id,{name:'B1'})]
    .map(u=>({companyId:u.company_id,unitId:u.id}));
  store.transaction(()=>{for(const scope of scopes)writeState(store,scope,input,0);});
  return {store,scopes};
}
function balances(store,scope) {return Object.fromEntries(store.db.prepare('SELECT product_id,quantity,technical_anchor FROM commercial_stock_balances WHERE company_id=? AND unit_id=?').all(scope.companyId,scope.unitId).map(r=>[r.product_id,[r.quantity,r.technical_anchor]]));}
function sync(store,scope) {const current=loadState(store,scope);store.transaction(()=>inventory.syncInventory(store,scope,current.state,current.revision));assert.deepEqual(loadState(store,scope),current);return balances(store,scope);}
test('saldo global: sem movimentos conserva estoque histórico como âncora',t=>{
  const {store,scopes}=fixture(t,state());const rows=sync(store,scopes[0]);
  assert.deepEqual(rows.none,['7','7']);assert.deepEqual(rows.__proto__,['9007199254740991','9007199254740991']);
});
test('saldo global: um movimento e histórico intercalado positivo/negativo preservam âncoras',t=>{
  const input=state([move('a','many',2),move('b','one',3),move('c','many',-4),move('d','constructor',-2),move('e','many',5)]);
  const {store,scopes}=fixture(t,input),rows=sync(store,scopes[0]);
  assert.deepEqual(rows.many,['19','16']);assert.deepEqual(rows.one,['8','5']);assert.deepEqual(rows.constructor,['3','5']);
  assert.deepEqual(loadState(store,scopes[0]).state.stockMovements,input.stockMovements);
});
test('saldo global: aritmética decimal do trecho isolado é exata sem habilitar persistência fracionada',()=>{
  const input=state([move('a','many','0.1'),move('b','many','0.2'),move('c','__proto__','9007199254740991'),
    move('d','many','-0.3'),move('e','__proto__','2'),move('f','__proto__','-9007199254740991'),move('g','one','0.125')]);
  // Only arithmetic characterization: the current projection accepts integer quantities.
  // No SQL/domain operation with fractions is enabled or claimed by this stub.
  const rows=Object.create(null),store={requireTransaction(){},setMeta(){},db:{prepare(sql){return {run(...args){if(sql.startsWith('INSERT INTO commercial_stock_balances VALUES'))rows[args[2]]=[args[3],args[4]];},get(){return null;}};}}};
  inventory.syncInventory(store,{companyId:'synthetic',unitId:'arithmetic-only'},input,1);
  assert.deepEqual(rows.many,['19','19']);assert.deepEqual(rows.one,['8','7.875']);
  assert.deepEqual(rows.__proto__,['9007199254740991','9007199254740989']);
  assert.throws(()=>require('./decimal').legacyInteger('0.125'),/fracionada/);
});
test('saldo global: muitas entradas com soma zero e identificadores especiais ficam independentes',t=>{
  const moves=Array.from({length:400},(_,i)=>move('m'+i,i%2?'constructor':'__proto__',i%4<2?1:-1));
  const {store,scopes}=fixture(t,state(moves)),rows=sync(store,scopes[0]);
  assert.deepEqual(rows.__proto__,['9007199254740991','9007199254740991']);assert.deepEqual(rows.constructor,['3','3']);
});
test('saldo global: acumulado não atravessa chamadas, empresas ou unidades com IDs iguais',t=>{
  const {store,scopes}=fixture(t,state([move('old','many',2)]));
  for(let i=0;i<scopes.length;i++)store.transaction(()=>writeState(store,scopes[i],state([move('old','many',i+1)]),1));
  for(const [i,scope] of [...scopes.entries(),[0,scopes[0]]])assert.deepEqual(sync(store,scope).many,['19',String(18-i)]);
  store.transaction(()=>writeState(store,scopes[0],state(),2));assert.deepEqual(sync(store,scopes[0]).many,['19','19']);
});
test('saldo global: falha na inserção de saldo mantém rollback integral e próxima chamada íntegra',t=>{
  const {store,scopes}=fixture(t,state([move('a','many',2)])),scope=scopes[0],current=loadState(store,scope);
  store.db.exec("CREATE TRIGGER fail_global_balance BEFORE INSERT ON commercial_stock_balances WHEN NEW.product_id='one' BEGIN SELECT RAISE(ABORT,'synthetic global balance'); END;");
  const before=digest(contents(store));
  assert.throws(()=>store.transaction(()=>inventory.syncInventory(store,scope,current.state,current.revision)),/synthetic global balance/);
  assert.equal(digest(contents(store)),before);store.db.exec('DROP TRIGGER fail_global_balance');sync(store,scope);
  assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(),[]);
  assert.deepEqual(store.db.prepare('PRAGMA integrity_check').all().map(r=>r.integrity_check),['ok']);
});
test('saldo global: produto inexistente continua recusado por FK com rollback integral',t=>{
  const {store,scopes}=fixture(t,state()),scope=scopes[0],current=loadState(store,scope),before=digest(contents(store));
  current.state.stockMovements.push(move('foreign','missing',1));
  assert.throws(()=>store.transaction(()=>inventory.syncInventory(store,scope,current.state,current.revision)),/FOREIGN KEY/);
  assert.equal(digest(contents(store)),before);
});
test('saldo global: consulta sem transação continua recusada sem mudar dados',t=>{
  const {store,scopes}=fixture(t,state()),before=digest(contents(store));
  assert.throws(()=>inventory.syncInventory(store,scopes[0],state(),1),/transação/);assert.equal(digest(contents(store)),before);
});
