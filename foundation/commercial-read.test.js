'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {randomBytes,randomUUID}=require('node:crypto');
const {createServer}=require('../server');
const {createUser}=require('./identity');
const {createCompany,createUnit}=require('./entities');
const {grantCompanyAccess,grantUnitAccess}=require('./access');
const {createRole,assignRole}=require('./rbac');
const {writeState,canonical}=require('./state-repository');
const {loadState}=require('./scoped-state');
const {appendAudit}=require('./audit');
// Fixed password is synthetic fixture data, never an operational credential.
const password='Leituras em teste isolado 2026!';
const BASE='/api/commercial/';
class Client{
 constructor(origin){this.origin=origin;this.cookies=new Map();this.csrf=null;}
 async call(url,body,headers={}){
  const response=await fetch(this.origin+url,{headers:{cookie:[...this.cookies].map(([k,v])=>k+'='+v).join('; '),...(body===undefined?{}:{Origin:this.origin,'Content-Type':'application/json','X-CSRF-Token':this.csrf||''}),...headers},...(body===undefined?{}:{method:'POST',body:JSON.stringify(body)})});
  for(const entry of response.headers.getSetCookie()){const pair=entry.split(';')[0],index=pair.indexOf('='),key=pair.slice(0,index),value=pair.slice(index+1);if(value)this.cookies.set(key,value);else this.cookies.delete(key);}
  const text=await response.text();let data;try{data=JSON.parse(text);}catch{data=text;}if(data?.csrfToken)this.csrf=data.csrfToken;
  return{status:response.status,data,text,headers:response.headers};
 }
 async login(login){await this.call('/api/auth/status');const response=await this.call('/api/auth/login',{login,password});assert.equal(response.status,200,response.text);return response.data;}
}
async function fixture(t){
 const pairingToken=randomBytes(32).toString('base64url'),dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'commercial-read-'));
 const server=createServer({environment:'test',filename:':memory:',dataDir,importLegacy:false,pairingToken});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const owner=new Client('http://127.0.0.1:'+server.address().port);await owner.call('/api/auth/status');
 const setup=await owner.call('/api/auth/setup',{name:'Dono da fixture',login:'fixture-owner',password,pairingToken});assert.equal(setup.status,200,setup.text);
 return{server,store:server.runtime.store,owner,scope:{companyId:setup.data.companyId,unitId:setup.data.unitId},ownerId:setup.data.user.id};
}
async function profile(f,permissions,login='profile-'+randomUUID()){
 const user=await createUser(f.store,{name:'Perfil sintético',login,password});let role;
 f.store.transaction(()=>{grantCompanyAccess(f.store,user.id,f.scope.companyId);grantUnitAccess(f.store,user.id,f.scope.companyId,f.scope.unitId);role=createRole(f.store,f.scope.companyId,{name:login,permissions});assignRole(f.store,user.id,f.scope.companyId,f.scope.unitId,role.id);});
 const client=new Client(f.owner.origin);await client.login(login);return{client,user,role};
}
function product(id='product-a',name='Mouse de teste',extra={}){return{id,name,code:'SKU-'+id,barcode:'000'+id,stock:8,minStock:2,priceCents:1990,version:1,active:true,date:'2026-10-02T01:00:00.000Z',...extra};}
function source(products=[product()]){
 const p=products[0];return{schemaVersion:2,products,customers:[{id:'customer-a',name:'Cliente fixture',phone:'11900000000',email:'fixture@example.test',version:1,active:true,creditLimitCents:993311,unknownFinancial:'CUSTOMER-PRIVATE-MARKER'}],sales:p?[{id:'sale-a',date:'2026-10-02T01:00:00.000Z',customerId:'customer-a',customerName:'Cliente fixture',items:[{productId:p.id,name:p.name,quantity:1,priceCents:1990,unitCostCents:711,unknownFinancial:'SALE-ITEM-PRIVATE-MARKER'}],totalCents:1990,subtotalCents:1990,discountCents:0,paymentStatus:'received',paymentMethod:'pix',dueDate:'2026-11-01',receivedAt:'2026-10-02T01:00:00.000Z',receipts:[{id:'receipt-a',saleId:'sale-a',amountCents:1990,date:'2026-10-02T01:00:00.000Z',paymentMethod:'pix',privateDetails:'RECEIPT-PRIVATE-MARKER'}],unknownFinancial:'SALE-PRIVATE-MARKER'}]:[],expenses:[{id:'expense-a',description:'Despesa sintética',amountCents:450,paidDate:'2026-10-02',paymentMethod:'cash',createdAt:'2026-10-02T02:00:00.000Z',unknownField:'EXPENSE-PRIVATE-MARKER'}],stockMovements:p?[{id:'movement-a',productId:p.id,productName:p.name,quantity:8,stockAfter:8,type:'initial',date:'2026-10-02T01:00:00.000Z',referenceId:p.id,unitCostCents:711,unknownFinancial:'MOVEMENT-PRIVATE-MARKER',execution:{executedBy:null,authorizedBy:null,executorName:'Sistema fixture',secretNested:'EXECUTION-PRIVATE-MARKER'}}]:[],tasks:[{id:'task-a',title:'Conferir vitrine',version:1,priority:'normal',history:[{before:{amountCents:994411},unknownFinancial:'HISTORY-PRIVATE-MARKER'}],dueDate:'2026-11-01',date:'2026-10-02T01:00:00.000Z',link:{kind:'sales',id:'sale-a',snapshot:{amountCents:994411,stock:8855}},unknownFinancial:'TASK-PRIVATE-MARKER'}]};
}
function seed(f,state,scope=f.scope){f.store.transaction(()=>writeState(f.store,scope,state,loadState(f.store,scope).revision));}
function assertPage(response,total){assert.equal(response.status,200,response.text);for(const key of ['items','page','pageSize','total','totalPages','revision'])assert.ok(Object.hasOwn(response.data,key),key);assert.ok(Array.isArray(response.data.items));assert.ok(response.data.items.length<=response.data.pageSize);assert.ok(Number.isSafeInteger(response.data.revision));if(total!==undefined)assert.equal(response.data.total,total);return response.data;}
function forbiddenKeys(value,keys){if(!value||typeof value!=='object')return;for(const[k,v]of Object.entries(value)){assert.ok(!keys.includes(k),'Forbidden key leaked: '+k);forbiddenKeys(v,keys);}}
function noMarkers(response){assert.ok(!/PRIVATE-MARKER/.test(response.text),response.text);}
function denied(response,status=403){assert.equal(response.status,status,response.text);assert.ok(!response.data.items&&!response.data.product,response.text);}

test('V1.1 leituras: cada área exige sua própria permissão sem requerer as cinco leituras',async t=>{
 const f=await fixture(t);seed(f,source());
 const cases=[['catalog.view',['catalog','products','customers']],['inventory.view',['inventory','inventory/movements']],['sales.view',['sales']],['financial.view',['financial']],['operations.view',['operations']]];
 for(const[permission,allowed]of cases){const p=await profile(f,[permission]);for(const[,paths]of cases)for(const pathname of paths){const response=await p.client.call(BASE+pathname);if(allowed.includes(pathname))assertPage(response);else denied(response);}denied(await p.client.call('/api/state'));}
});
test('V1.1 vendedor: catálogo e vendas comerciais não entregam financeiro/estoque ou extras desconhecidos',async t=>{
 const f=await fixture(t),p=product(undefined,undefined,{costCents:711,minimumPriceCents:1500,opaque:{unknownFinancial:'PRODUCT-PRIVATE-MARKER'},aliases:[{id:'alias-a',name:'Alternativo',code:'ALT-001',active:true,version:1,history:[{unitCostCents:711,unknownFinancial:'ALIAS-PRIVATE-MARKER'}]}],packages:[{id:'pack-a',name:'Caixa',code:'PACK-001',active:true,version:1,factor:6,unit:'unidade',unitCostCents:4266,history:[{unknownFinancial:'PACKAGE-PRIVATE-MARKER'}]}]});seed(f,source([p]));const seller=await profile(f,['catalog.view','sales.view']);
 const catalog=await seller.client.call(BASE+'catalog');assertPage(catalog,1);assert.equal(catalog.data.items[0].priceCents,1990);assert.equal(catalog.data.items[0].code,p.code);
 forbiddenKeys(catalog.data.items,['stock','minStock','positionBalances','reservedStock','availableStock','costCents','unitCostCents','minimumPriceCents','history','opaque']);noMarkers(catalog);
 const customers=await seller.client.call(BASE+'customers');assertPage(customers,1);forbiddenKeys(customers.data.items,['creditLimitCents','unknownFinancial','storeCredits','agreements']);noMarkers(customers);
 const sales=await seller.client.call(BASE+'sales');assertPage(sales,1);assert.equal(sales.data.items[0].totalCents,1990);forbiddenKeys(sales.data.items,['receipts','paymentStatus','paymentMethod','dueDate','receivedAt','receivablePlan','installments','storeCreditAllocations','unitCostCents','unknownFinancial']);noMarkers(sales);
 denied(await seller.client.call(BASE+'financial'));denied(await seller.client.call(BASE+'inventory'));
});
test('V1.1 financeiro: consulta útil sem cadastro/quantidades de mercadorias ou inventário',async t=>{
 const f=await fixture(t);seed(f,source());const p=await profile(f,['financial.view']);const response=await p.client.call(BASE+'financial');const page=assertPage(response);assert.ok(page.items.length>0);
 forbiddenKeys(page.items,['products','stock','stockAfter','minStock','quantity','items','positionBalances','unknownField']);noMarkers(response);denied(await p.client.call(BASE+'catalog'));denied(await p.client.call(BASE+'inventory'));denied(await p.client.call(BASE+'sales'));
});
test('V1.1 estoque: saldos/movimentos não carregam preços, custo ou execução opaca',async t=>{
 const f=await fixture(t);seed(f,source());const p=await profile(f,['inventory.view']);
 for(const route of ['inventory','inventory/movements']){const response=await p.client.call(BASE+route);const page=assertPage(response,1);forbiddenKeys(page.items,['priceCents','unitCostCents','costCents','minimumPriceCents','secretNested','unknownFinancial','receipts']);noMarkers(response);}
});
test('V1.1 operações: vínculos não expandem snapshot de venda/financeiro e histórico opaco',async t=>{
 const f=await fixture(t);seed(f,source());const p=await profile(f,['operations.view']),response=await p.client.call(BASE+'operations');assertPage(response);assert.ok(response.data.items.some(i=>i.id==='task-a'));
 forbiddenKeys(response.data.items,['snapshot','history','amountCents','stock','unknownFinancial']);noMarkers(response);denied(await p.client.call(BASE+'financial'));
});
test('V1.1 consultas: sessão ausente, permissão revogada e vínculo revogado não reutilizam projeções',async t=>{
 const f=await fixture(t);seed(f,source());const anonymous=new Client(f.owner.origin);for(const route of ['catalog','inventory','sales','financial','operations'])denied(await anonymous.call(BASE+route),401);
 const p=await profile(f,['catalog.view']);assertPage(await p.client.call(BASE+'catalog'));f.store.db.prepare("DELETE FROM role_permissions WHERE company_id=? AND role_id=? AND permission_code='catalog.view'").run(f.scope.companyId,p.role.id);denied(await p.client.call(BASE+'catalog'));
 f.store.db.prepare("UPDATE unit_memberships SET status='inactive' WHERE user_id=? AND company_id=? AND unit_id=?").run(p.user.id,f.scope.companyId,f.scope.unitId);denied(await p.client.call(BASE+'catalog'),401);
});
test('V1.1 consultas: IDs iguais entre empresas/unidades não revelam dados e headers não selecionam tenant',async t=>{
 const f=await fixture(t);seed(f,source([product('same-id','Nome empresa A')]));const p=await profile(f,['catalog.view']);let foreign,sibling;
 f.store.transaction(()=>{const company=createCompany(f.store,{name:'Empresa B'}),unit=createUnit(f.store,company.id,{name:'Unidade B'});foreign={companyId:company.id,unitId:unit.id};const other=createUnit(f.store,f.scope.companyId,{name:'Outra unidade da empresa A'});sibling={companyId:f.scope.companyId,unitId:other.id};});seed(f,source([product('same-id','Nome empresa B')]),foreign);seed(f,source([product('same-id','Nome outra unidade A')]),sibling);
 const response=await p.client.call(BASE+'products');assertPage(response,1);assert.equal(response.data.items[0].name,'Nome empresa A');assert.ok(!response.text.includes('Nome empresa B'));
 denied(await p.client.call(BASE+'products',undefined,{'X-Company-ID':foreign.companyId,'X-Unit-ID':foreign.unitId}),409);
 denied(await p.client.call(BASE+'products?companyId='+foreign.companyId+'&unitId='+foreign.unitId),422);
 denied(await p.client.call('/api/auth/context',{companyId:foreign.companyId,unitId:foreign.unitId}));
 denied(await p.client.call(BASE+'products',undefined,{'X-Company-ID':sibling.companyId,'X-Unit-ID':sibling.unitId}),409);denied(await p.client.call('/api/auth/context',sibling));assert.ok(!response.text.includes('Nome outra unidade A'));
});
test('V1.1 produtos: paginação limita resposta e atravessa páginas sem repetir ou perder IDs',async t=>{
 const f=await fixture(t),products=Array.from({length:123},(_,i)=>product('p'+String(i).padStart(3,'0'),'Mesmo nome'));seed(f,source(products));const p=await profile(f,['catalog.view']);
 const defaults=assertPage(await p.client.call(BASE+'products'),123);assert.equal(defaults.page,1);assert.equal(defaults.pageSize,50);assert.equal(defaults.items.length,50);assert.equal(defaults.totalPages,3);
 const ids=[];for(let page=1;page<=3;page++){const result=assertPage(await p.client.call(BASE+'products?page='+page+'&pageSize=50&sort=name&direction=asc'),123);ids.push(...result.items.map(i=>i.id));assert.equal(result.revision,defaults.revision);}
 assert.deepEqual(ids,products.map(p=>p.id));assert.equal(new Set(ids).size,123);const outside=assertPage(await p.client.call(BASE+'products?page=4&pageSize=50'),123);assert.equal(outside.items.length,0);
});
test('V1.1 produtos: busca, situação e ordenação atuam no servidor antes da paginação',async t=>{
 const f=await fixture(t);seed(f,source([product('p-a','Alfa'),product('p-b','Beta',{active:false}),product('p-c','Alfa',{active:false})]));const p=await profile(f,['catalog.view']);
 const result=assertPage(await p.client.call(BASE+'products?q=Alfa&status=inactive&pageSize=1&sort=code&direction=desc'),1);assert.equal(result.items[0].id,'p-c');assert.equal(result.totalPages,1);
 const desc=assertPage(await p.client.call(BASE+'products?sort=id&direction=desc&status=all'),3);assert.deepEqual(desc.items.map(i=>i.id),['p-c','p-b','p-a']);
 const none=assertPage(await p.client.call(BASE+'products?q=texto-inexistente'),0);assert.deepEqual(none.items,[]);const active=assertPage(await p.client.call(BASE+'products?status=active'),1);assert.equal(active.items[0].id,'p-a');
});
test('V1.1 produtos: filtros/ordem de campos ocultos, parâmetros desconhecidos/repetidos e limites inválidos são 422',async t=>{
 const f=await fixture(t);seed(f,source());const p=await profile(f,['catalog.view']);const before=canonical(loadState(f.store,f.scope));
 for(const query of ['page=0','page=-1','page=1.5','page=1000001','page=9007199254740992','page=abc','page=1&page=2','pageSize=0','pageSize=101','pageSize=3.5','pageSize=abc','q='+encodeURIComponent('x'.repeat(121)),'q=a&q=b','sort=stock','sort=unitCostCents','sort=priceCents','sort=name%3BDROP%20TABLE%20products','direction=sideways','status=pending','stock=0','minStock=1','costCents=1','include=financial','pageSize=1&pageSize=100'])denied(await p.client.call(BASE+'products?'+query),422);
 assert.equal(canonical(loadState(f.store,f.scope)),before);
});
test('V1.1 produtos: lookup textual procura além da primeira página e preserva zeros/códigos alternativos',async t=>{
 const f=await fixture(t),products=Array.from({length:70},(_,i)=>product('item'+i,'Produto '+String(i).padStart(3,'0'))),last=products.at(-1);last.code='SKU-FINAL';last.barcode='000000000012';last.aliases=[{id:'alias-final',name:'Código alternativo',code:'ALT-FINAL',active:true,version:1,history:[{unknownFinancial:'LOOKUP-PRIVATE-MARKER'}]}];last.packages=[{id:'pack-final',name:'Caixa seis',code:'PACK-FINAL',active:true,version:1,factor:6,history:[],unit:'unidade'}];seed(f,source(products));const p=await profile(f,['catalog.view']);
 for(const code of ['SKU-FINAL','000000000012','ALT-FINAL','PACK-FINAL']){const response=await p.client.call(BASE+'products/lookup?code='+encodeURIComponent(code));assert.equal(response.status,200,response.text);assert.equal(response.data.product.id,last.id);forbiddenKeys(response.data.product,['stock','costCents','minimumPriceCents','history']);noMarkers(response);if(code==='PACK-FINAL')assert.equal(response.data.packageUnits,6);}
 for(const code of ['12','SKU-FIN','Produto 069'])denied(await p.client.call(BASE+'products/lookup?code='+encodeURIComponent(code)),404);
 denied(await p.client.call(BASE+'products/lookup?code=ALT-FINAL&code=SKU-FINAL'),422);denied(await p.client.call(BASE+'products/lookup?code='),422);
});
test('V1.1 lookup: código existente apenas em outra empresa não é encontrado',async t=>{
 const f=await fixture(t);seed(f,source());let foreign;f.store.transaction(()=>{const company=createCompany(f.store,{name:'Empresa estrangeira'}),unit=createUnit(f.store,company.id,{name:'Loja estrangeira'});foreign={companyId:company.id,unitId:unit.id};});seed(f,source([product('foreign-only','Produto estrangeiro',{code:'FOREIGN-ONLY'})]),foreign);const p=await profile(f,['catalog.view']);denied(await p.client.call(BASE+'products/lookup?code=FOREIGN-ONLY'),404);
});
test('V1.1 catálogo: resultado seguro não autoriza snapshot/CSV legados nem escrita sem permissão',async t=>{
 const f=await fixture(t);seed(f,source());const p=await profile(f,['catalog.view','sales.view']);assertPage(await p.client.call(BASE+'catalog'));denied(await p.client.call('/api/state'));denied(await p.client.call('/api/export?kind=products&id=product-a'));denied(await p.client.call('/api/exports',{kind:'products',ids:['product-a']}));denied(await p.client.call('/api/products',{name:'Não criar',stock:1,price:'10.00'}));
 assert.equal(loadState(f.store,f.scope).state.products.length,1);
});
test('V1.1 auditoria: audit.view sem domínio não revela before/after comercial completo',async t=>{
 const f=await fixture(t);seed(f,source());f.store.transaction(()=>appendAudit(f.store,{companyId:f.scope.companyId,unitId:f.scope.unitId,userId:f.ownerId,executedBy:f.ownerId,action:'UPDATE',entity:'sales',recordId:'sale-a',before:{receipts:[{amountCents:334422,secretNested:'AUDIT-PRIVATE-MARKER'}]},after:{receipts:[{amountCents:334433}],stock:991122}}));const p=await profile(f,['audit.view']),response=await p.client.call('/api/foundation/audit');assert.equal(response.status,200,response.text);noMarkers(response);forbiddenKeys(response.data.events,['receipts','amountCents','stock','secretNested']);
});
