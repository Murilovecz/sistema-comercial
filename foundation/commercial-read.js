'use strict';
const {AppError}=require('./errors');
const {requirePermission}=require('./identity');
const {loadState}=require('./scoped-state');
const pick=(row,keys)=>Object.fromEntries(keys.filter(key=>row&&Object.hasOwn(row,key)&&(row[key]===null||['string','number','boolean'].includes(typeof row[key]))).map(key=>[key,row[key]]));
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function catalogProduct(row){return {...pick(row,['id','name','code','barcode','category','description','priceCents','version','active','unit','measureUnit']),
 aliases:(Array.isArray(row.aliases)?row.aliases:[]).map(a=>pick(a,['id','code','barcode','active'])),packages:(Array.isArray(row.packages)?row.packages:[]).map(p=>pick(p,['id','name','code','barcode','factor','units','quantity','active']))};}
function customer(row){return pick(row,['id','name','phone','email','document','address','notes','version','active']);}
function execution(row){return {...pick(row,['executedBy','executorName','executedAt','authorizedBy','approverName','approvalReason','approvedAt','approvalId']),...Object.fromEntries(['executorRoles','approverRoles'].filter(k=>Array.isArray(row?.[k])).map(k=>[k,row[k].filter(r=>typeof r==='string')]))};}
function inventoryProduct(row){return pick(row,['id','name','code','stock','unit','measureUnit','active','version']);}
function inventoryMovement(row){return {...pick(row,['id','productId','productName','quantity','stockAfter','type','referenceId','purchaseId','date','inactiveAtSale']),execution:execution(row.execution)};}
function commercialSale(row){return {...pick(row,['id','date','customerId','customerName','totalCents','subtotalCents','discountCents','cancelledAt']),items:(row.items||[]).map(i=>pick(i,['productId','name','quantity','priceCents','inactiveAtSale'])),execution:execution(row.execution)};}
function commercialSaleDetail(row,financial=false){
 const detail={...commercialSale(row),...pick(row,['code','number','quoteId','quoteNumber','reservationId','reservationNumber']),items:(row.items||[]).map(item=>({...pick(item,['id','productId','name','code','quantity','priceCents','unit','measureUnit','inactiveAtSale']),...(Array.isArray(item.packages)?{packages:item.packages.map(p=>pick(p,['packageId','name','factor','count','version']))}:{})}))};
 if(!financial)return detail;
 Object.assign(detail,pick(row,['paymentMethod','paymentStatus','dueDate','receivedAt','forgivenCents','storeCreditCents','storeCreditRestoredCents','storeCreditIssuedCents','accountVersion','returnVersion']));
 const allocation=entry=>pick(entry,['installmentId','amountCents']);
 for(const [field,project]of [
  ['receipts',entry=>({...pick(entry,['id','saleId','requestId','amountCents','paymentMethod','date','cashSessionId','reference','tenderedCents','changeCents','agreementId','agreementPaymentId','legacy']),...(Array.isArray(entry.allocations)?{allocations:entry.allocations.map(allocation)}:{})})],
  ['refunds',entry=>pick(entry,['id','amountCents','paymentMethod','date','paidDate','recordedAt','cashSessionId','returnRefund'])],
  ['receivablePlan',entry=>pick(entry,['id','number','amountCents','dueDate'])],
  ['storeCreditAllocations',entry=>pick(entry,['creditId','amountCents','restoredCents'])],
  ['forgiveness',entry=>({...pick(entry,['date','amountCents']),...(Array.isArray(entry.allocations)?{allocations:entry.allocations.map(allocation)}:{})})]
 ])if(Array.isArray(row[field]))detail[field]=row[field].map(project);else if(Object.hasOwn(row,field)&&row[field]===null)detail[field]=null;
 return detail;
}
function saleQueryOptions(params){
 const extra=['cancelled','from','to','customerId','executorId','unitId'],base=new URLSearchParams();
 for(const [key,value]of params){if(params.getAll(key).length!==1)throw new AppError(422,'INVALID_QUERY','Filtro repetido não permitido.');if(!extra.includes(key))base.append(key,value);}
 return{...queryOptions(base),...Object.fromEntries(extra.filter(key=>params.has(key)).map(key=>[key,params.get(key)]))};
}
function financialRecords(state){return [
 ...(state.sales||[]).map(s=>{const balance=require('../public/payments').paymentBalance(s);return{...pick(s,['id','date','dueDate','totalCents','paymentStatus','cancelledAt']),type:'receivable',description:typeof s.customerName==='string'?s.customerName:'',amountCents:s.totalCents,remainingCents:Number.isSafeInteger(balance.remainingCents)?balance.remainingCents:null};}),
 ...(state.expenses||[]).map(r=>({...pick(r,['id','description','amountCents','paidDate','paymentMethod','cancelledAt']),type:'expense',date:r.paidDate})),
 ...(state.payables||[]).flatMap(r=>(r.installments||[]).map(i=>({...pick(i,['id','dueDate','amountCents']),...pick(r,['description','supplierName','cancelledAt']),payableId:r.id,type:'payable',date:i.dueDate,remainingCents:r.cancelledAt?0:i.amountCents-require('../public/payables-core').installmentPaid(r,i.id)}))),
 ...(state.sales||[]).flatMap(s=>(s.receipts||[]).map(r=>({...pick(r,['id','date','amountCents','paymentMethod']),type:'receipt',saleId:s.id,description:typeof s.customerName==='string'?s.customerName:''})))
 ];}
function operation(row){return pick(row,['id','title','name','description','status','dueDate','date','completedAt','cancelledAt']);}
function queryOptions(params){
 const allowed=['page','pageSize','q','sort','direction','status'];
 for(const key of params.keys())if(!allowed.includes(key)||params.getAll(key).length!==1)throw new AppError(422,'INVALID_QUERY','Filtro não permitido.');
 const integer=(key,fallback,max)=>{const raw=params.get(key);if(raw===null)return fallback;if(!/^[1-9][0-9]*$/.test(raw)||!Number.isSafeInteger(Number(raw))||Number(raw)>max)throw new AppError(422,'INVALID_QUERY','Paginação inválida.');return Number(raw);};
 const q=params.get('q')||'',sort=params.get('sort')||'name',direction=params.get('direction')||'asc',status=params.get('status')||'all';
 if(q.length>120||!['name','date','code','id'].includes(sort)||!['asc','desc'].includes(direction)||!['active','inactive','all'].includes(status))throw new AppError(422,'INVALID_QUERY','Filtro ou ordenação inválidos.');
 return{page:integer('page',1,1000000),pageSize:integer('pageSize',50,100),q,sort,direction,status};
}
function paginate(rows,options,revision){
 const {page,pageSize,q,sort,direction,status}=options,term=normalize(q);
 const filtered=rows.filter(row=>(status==='all'||(status==='active'?row.active!==false:row.active===false))&&(!term||normalize([row.name,row.code,row.barcode,row.customerName,row.description,row.title].join(' ')).includes(term)));
 filtered.sort((a,b)=>{const primary=String(a[sort]??'').localeCompare(String(b[sort]??''),'pt-BR');return (direction==='desc'?-primary:primary)||String(a.id).localeCompare(String(b.id));});
 return{items:filtered.slice((page-1)*pageSize,page*pageSize),page,pageSize,total:filtered.length,totalPages:Math.ceil(filtered.length/pageSize),revision};
}
function readCommercial(store,ctx,url){
 const parsed=new URL(url,'http://local'),kind=parsed.pathname.replace('/api/commercial/','');
 const permission={catalog:'catalog.view',products:'catalog.view',customers:'catalog.view',suppliers:'catalog.view',inventory:'inventory.view','inventory/movements':'inventory.view',sales:'sales.view','sales/by-id':'sales.view',financial:'financial.view',operations:'operations.view','products/lookup':'catalog.view','products/by-id':'catalog.view','customers/by-id':'catalog.view','suppliers/by-id':'catalog.view','product-costs':'catalog.view','sales/checkout-context':'sales.create'}[kind];
 if(!permission)throw new AppError(404,'NOT_FOUND','Consulta não encontrada.');requirePermission(ctx,permission);
 if(kind==='sales/by-id'){
  const id=singleParam(parsed.searchParams,'id'),financial=ctx.permissions.includes('financial.view'),sale=require('./sales-store').getSale(store,ctx,id,{financial});
  const revision=store.db.prepare('SELECT revision FROM unit_states WHERE company_id=? AND unit_id=?').get(ctx.companyId,ctx.unitId)?.revision||0;
  return{sale:commercialSaleDetail(sale,financial),revision};
 }
 if(kind.endsWith('/by-id')){
  const id=singleParam(parsed.searchParams,'id'),repository=require('./commercial-store'),record=kind.startsWith('products/')?repository.getProduct(store,ctx,id):kind.startsWith('customers/')?repository.getCustomer(store,ctx,id):repository.getSupplier(store,ctx,id);
  return{record:kind.startsWith('products/')?{...catalogProduct(record),...(ctx.permissions.includes('inventory.view')?pick(record,['minStock']):{})}:customer(record)};
 }
 if(kind==='product-costs'){
  requirePermission(ctx,'financial.view');const productId=singleParam(parsed.searchParams,'productId');require('./commercial-store').getProduct(store,ctx,productId);
  const {state,revision}=loadState(store,ctx),cost=require('../public/purchases-core').latestPurchaseCosts(state.purchases||[]).find(c=>c.productId===productId);
  return{cost:cost?pick(cost,['productId','productName','unitCostCents','supplierName','date','sequence','purchaseId','purchaseNumber']):null,revision};
 }
 if(kind==='sales/checkout-context'){
  requirePermission(ctx,'catalog.view');requirePermission(ctx,'sales.view');if([...parsed.searchParams].length)throw new AppError(422,'INVALID_QUERY','Esta consulta não recebe filtros.');
  const {state}=loadState(store,ctx);return{cashSessionId:require('../public/cash-core').openCash(state)?.id||null};
 }
 if(kind==='products/lookup'){
  if([...parsed.searchParams.keys()].some(k=>k!=='code')||parsed.searchParams.getAll('code').length!==1)throw new AppError(422,'INVALID_QUERY','Informe um código.');
  const code=parsed.searchParams.get('code');if(!code||code.length>120)throw new AppError(422,'INVALID_QUERY','Código inválido.');
  const result=require('./commercial-store').lookupProduct(store,ctx,code);return {...result,product:catalogProduct(result.product)};
 }
 const options=kind==='sales'?saleQueryOptions(parsed.searchParams):queryOptions(parsed.searchParams);
 if(kind==='sales'){const result=require('./sales-store').querySales(store,ctx,options);return{...result,items:result.items.map(commercialSale)};}
 if(kind==='catalog'||kind==='products'){const result=require('./commercial-store').queryProducts(store,ctx,options);return{...result,items:result.items.map(catalogProduct)};}
 if(kind==='customers'){const result=require('./commercial-store').queryCustomers(store,ctx,options);return{...result,items:result.items.map(customer)};}
 if(kind==='suppliers'){const result=require('./commercial-store').querySuppliers(store,ctx,options);return{...result,items:result.items.map(customer)};}
 if(kind==='inventory'||kind==='inventory/movements'){const repository=require('./inventory-store'),result=kind==='inventory'?repository.queryInventory(store,ctx,options):repository.queryStockMovements(store,ctx,options);return{...result,items:result.items.map(kind==='inventory'?inventoryProduct:inventoryMovement)};}
 const {state,revision}=loadState(store,ctx);
 const rows=kind==='catalog'||kind==='products'?state.products.map(catalogProduct):kind==='customers'?state.customers.map(customer):kind==='inventory'?state.products.map(inventoryProduct):kind==='inventory/movements'?(state.stockMovements||[]).map(inventoryMovement):kind==='sales'?state.sales.map(commercialSale):kind==='financial'?financialRecords(state):(state.tasks||[]).map(operation);
 return paginate(rows,options,revision);
}
function singleParam(params,key){const value=params.get(key);if([...params.keys()].some(k=>k!==key)||params.getAll(key).length!==1||!value||value.length>120)throw new AppError(422,'INVALID_QUERY','Informe um identificador válido.');return value;}
function auditProjection(row,ctx){
 const metadata=pick(row,['sequence','id','action','entity','recordId','date','userId','executedBy','authorizedBy','executorName']);
 const domain=['products','customers','suppliers'].includes(row.entity)?'catalog.view':['stockMovements','positionMovements'].includes(row.entity)?'inventory.view':['sales','quotes'].includes(row.entity)?'sales.view':['expenses','payables','cashSessions'].includes(row.entity)?'financial.view':'operations.view';
 if(!ctx.permissions.includes(domain))return{...metadata,before:null,after:null};
 const project=row.entity==='products'?catalogProduct:row.entity==='customers'?customer:row.entity==='stockMovements'?inventoryMovement:row.entity==='sales'?commercialSale:null;
 // No raw snapshots, nested histories or freely entered reasons reach a partial profile.
 return {...metadata,before:project&&row.before?project(row.before):null,after:project&&row.after?project(row.after):null};
}
module.exports={readCommercial,catalogProduct,commercialSale,commercialSaleDetail,customer,inventoryMovement,queryOptions,saleQueryOptions,paginate,auditProjection};
