'use strict';
// Reproducible, bounded synthetic workload. Never opens data/ or private QA copies.
const fs=require('node:fs'),path=require('node:path'),{performance}=require('node:perf_hooks');
const {randomBytes}=require('node:crypto');
const {createRuntime}=require('../foundation/runtime'),{createCompany,createUnit}=require('../foundation/entities');
const {writeState,executeStateCommand}=require('../foundation/state-repository'),{loadState,getRecord}=require('../foundation/scoped-state');
const {readCommercial}=require('../foundation/commercial-read'),{createUser}=require('../foundation/identity');
const {grantCompanyAccess,grantUnitAccess}=require('../foundation/access'),{createRole,assignRole,PERMISSIONS}=require('../foundation/rbac');
const {appendAudit}=require('../foundation/audit'),{sale}=require('../server');
const PASSWORD='Benchmark sintetico isolado 2026!';
function syntheticState(n){
 const products=Array.from({length:n},(_,i)=>({id:'p'+i,name:'Produto sintético '+String(i).padStart(5,'0'),code:'SKU'+i,barcode:'789'+String(i).padStart(10,'0'),stock:100,priceCents:1237,active:true,version:1}));
 const customers=Array.from({length:Math.ceil(n/4)},(_,i)=>({id:'c'+i,name:'Cliente sintético '+i,version:1,active:true}));
 const suppliers=Array.from({length:Math.ceil(n/10)},(_,i)=>({id:'f'+i,name:'Fornecedor sintético '+i,active:true,version:1}));
 const sales=Array.from({length:n*2},(_,i)=>({id:'s'+i,date:'2026-09-'+String(i%28+1).padStart(2,'0')+'T15:00:00.000Z',customerId:customers[i%customers.length].id,customerName:customers[i%customers.length].name,items:[{productId:products[i%n].id,name:products[i%n].name,quantity:1,priceCents:1237}],subtotalCents:1237,discountCents:0,totalCents:1237,paymentMethod:'cash',paymentStatus:'received',receipts:[],requestId:'synthetic-sale-'+i}));
 const stockMovements=sales.map((s,i)=>({id:'m'+i,productId:s.items[0].productId,productName:s.items[0].name,quantity:-1,type:'sale',referenceId:s.id,date:s.date,stockAfter:i<n?101:100}));
 const purchases=Array.from({length:Math.ceil(n/5)},(_,i)=>({id:'b'+i,number:i+1,supplierId:suppliers[i%suppliers.length].id,supplierName:suppliers[i%suppliers.length].name,date:'2026-09-01T15:00:00.000Z',version:1,items:[{productId:products[i%n].id,name:products[i%n].name,quantity:5,unitCostCents:750}],receipts:[],totalCents:3750}));
 return{schemaVersion:2,products,customers,suppliers,purchases,sales,stockMovements};
}
function instrument(db){const original=db.prepare.bind(db),stats={executions:0,rows:0};db.prepare=function(sql){const stmt=original(sql);return new Proxy(stmt,{get(target,key){const value=target[key];if(typeof value!=='function')return value;return (...args)=>{if(['all','get','run','iterate'].includes(key))stats.executions++;const result=value.apply(target,args);if(key==='all')stats.rows+=result.length;else if(key==='get'&&result)stats.rows++;return result;};}});};return stats;}
async function measure(name,fn,stats,samples=3){const times=[],counts=[],rows=[],mem=[];for(let i=0;i<samples;i++){stats.executions=0;stats.rows=0;const start=performance.now();await fn(i);times.push(performance.now()-start);counts.push(stats.executions);rows.push(stats.rows);mem.push(process.memoryUsage().rss);}times.sort((a,b)=>a-b);return{name,samples,medianMs:Number(times[Math.floor(times.length/2)].toFixed(3)),minMs:Number(times[0].toFixed(3)),maxMs:Number(times.at(-1).toFixed(3)),sqlExecutions:counts,sqlRowsReturned:rows,rssMaxBytes:Math.max(...mem)};}
async function run(label,output){
 if(!['before','after'].includes(label))throw Error('Use before ou after.');
 const report={label,version:require('../package.json').version,node:process.version,date:new Date().toISOString(),volumes:[],notes:'100/500/1500 produtos, 2 vendas históricas por produto; sondagem limitada baseada nas fixtures existentes, não homologação de carga. 3 amostras salvo login/inicialização; contadores são execuções SQL e linhas retornadas, não rows scanned. RSS inclui estado do processo/SQLite/KDF. Chamadas internas excluem rede/renderização.'};
 const qa=path.resolve(__dirname,'../.qa/foundation-v1.2/benchmarks');fs.mkdirSync(qa,{recursive:true});
 for(const [size,n]of [['small',100],['medium',500],['large',1500]]){
  const dir=fs.mkdtempSync(path.join(qa,label+'-'+size+'-')),filename=path.join(dir,'synthetic.sqlite'),options={environment:'test',filename,importLegacy:false,pairingToken:randomBytes(32).toString('base64url'),backup:{enabled:false}};
  const runtime=createRuntime(options),store=runtime.store,state=syntheticState(n),c=createCompany(store,{name:'Benchmark sintético'}),u=createUnit(store,c.id,{name:'Unidade sintética'}),scope={companyId:c.id,unitId:u.id};
  const stats=instrument(store.db),measurements=[];measurements.push(await measure('seed-write',()=>store.transaction(()=>writeState(store,scope,state,0)),stats,1));
  const user=await createUser(store,{name:'Operador sintético',login:'benchmark-owner',password:PASSWORD});store.transaction(()=>{grantCompanyAccess(store,user.id,c.id);grantUnitAccess(store,user.id,c.id,u.id);const role=createRole(store,c.id,{name:'Benchmark',permissions:Object.keys(PERMISSIONS)});assignRole(store,user.id,c.id,u.id,role.id);});
  const ctx={...scope,userId:user.id,user:{id:user.id,name:user.name},sessionId:null,permissions:Object.keys(PERMISSIONS)};
  const request={headers:{host:'127.0.0.1:39991'},socket:{remoteAddress:'127.0.0.1'}};
  measurements.push(await measure('startup-existing',()=>{const r=createRuntime(options);r.close();},stats,2));
  measurements.push(await measure('login',()=>runtime.identity.login(request,{login:user.login,password:PASSWORD}),stats,2));
  for(const [name,url]of [['products','catalog?sort=name&pageSize=25'],['search','catalog?q=SKU99&sort=name&pageSize=25'],['page','catalog?page=2&sort=name&pageSize=25'],['customers','customers?sort=name&pageSize=25'],['suppliers','suppliers?sort=name&pageSize=25'],['inventory','inventory?sort=name&pageSize=25'],['movements','inventory/movements?sort=date&pageSize=25'],['sales-list','sales?sort=date&pageSize=25'],['sales-search','sales?sort=date&q=Cliente%20sint%C3%A9tico%201&pageSize=25'],['financial-snapshot','financial?sort=date&pageSize=25']])measurements.push(await measure(name,()=>store.transaction(()=>readCommercial(store,ctx,'/api/commercial/'+url)),stats));
  measurements.push(await measure('sales-detail',()=>fs.existsSync(path.join(__dirname,'../foundation/sales-store.js'))?require('../foundation/sales-store').getSale(store,ctx,'s1'):getRecord(store,ctx,'sales','s1'),stats));
  measurements.push(await measure('purchases-snapshot',()=>loadState(store,scope).state.purchases,stats));
  measurements.push(await measure('materialize-state',()=>loadState(store,scope),stats));
  measurements.push(await measure('sale-stock-audit-commit',i=>executeStateCommand(store,ctx,current=>sale(current,{requestId:'bench-new-sale-'+i,items:[{productId:'p0',quantity:1,priceCents:1237}],paymentMethod:'cash',paymentStatus:'received',discount:'0',expectedCashSessionId:null}),{route:'/api/sales'}),stats));
  measurements.push(await measure('audit-write',i=>store.transaction(()=>appendAudit(store,{userId:user.id,...scope,executedBy:user.id,action:'BENCHMARK',entity:'synthetic',recordId:String(i)})),stats));
  measurements.push(await measure('audit-read',()=>store.db.prepare('SELECT id,action,date FROM audit_events WHERE company_id=? AND unit_id=? ORDER BY sequence DESC LIMIT 25').all(c.id,u.id),stats));
  report.volumes.push({size,records:{products:n,sales:n*2,customers:state.customers.length,suppliers:state.suppliers.length,purchases:state.purchases.length,movements:state.stockMovements.length},snapshotBytes:Buffer.byteLength(JSON.stringify(state)),measurements});runtime.close();
 }
 const destination=path.resolve(output||path.join(qa,label+'.json'));if(!destination.startsWith(qa+path.sep))throw Error('Relatório deve ficar na pasta isolada de benchmarks.');fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({label,output:destination,volumes:report.volumes.map(v=>({size:v.size,sales:v.records.sales,measurements:v.measurements.length}))}));return report;
}
if(require.main===module)run(process.argv[2],process.argv[3]).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={run,syntheticState};
