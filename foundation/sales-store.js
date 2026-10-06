'use strict';
const {AppError}=require('./errors');
const {decimal,legacyInteger,add}=require('./decimal');
const {hash}=require('./sql-store');
const canonical=value=>require('./state-repository').canonical(value);
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const definitions={
"sales":{"table":"commercial_sales","fields":{"id":["id","string"],"customerId":["customer_id","reference"],"customerName":["customer_name","string"],"date":["created_at","string"],"dueDate":["due_date","string"],"receivedAt":["received_at","string"],"cancelledAt":["cancelled_at","string"],"totalCents":["total_cents","integer"],"subtotalCents":["subtotal_cents","integer"],"discountCents":["discount_cents","integer"],"discountReason":["discount_reason","string"],"paymentMethod":["payment_method","string"],"paymentStatus":["payment_status","string"],"requestId":["request_id","string"],"requestFingerprint":["request_fingerprint","string"],"commercialCommandFingerprint":["commercial_command_fingerprint","string"],"accountVersion":["account_version","integer"],"returnVersion":["return_version","integer"],"forgivenCents":["forgiven_cents","integer"],"storeCreditCents":["store_credit_cents","integer"],"storeCreditRestoredCents":["store_credit_restored_cents","integer"],"storeCreditIssuedCents":["store_credit_issued_cents","integer"],"quoteId":["quote_id","string"],"quoteNumber":["quote_number","integer"],"reservationId":["reservation_id","string"],"reservationNumber":["reservation_number","integer"],"activeAgreementId":["active_agreement_id","string"],"code":["code","string"],"number":["number","integer"],"active":["active","boolean"],"version":["version","integer"],"execution":["execution_json","json"]},"children":{"items":"items","receipts":"receipts","receivablePlan":"installments","returns":"returns","refunds":"refunds","returnAllocation":"returnAllocations","storeCreditAllocations":"creditAllocations","forgiveness":"forgiveness","checkout":"checkouts","pos":"pos"}},
"items":{"table":"commercial_sale_items","parent":"sales","parentOrdinal":"","fields":{"id":["id","string"],"productId":["product_id","reference"],"name":["name","string"],"code":["code","string"],"quantity":["quantity","quantity"],"priceCents":["price_cents","integer"],"basePriceCents":["base_price_cents","integer"],"listPriceCents":["list_price_cents","integer"],"unitCostCents":["unit_cost_cents","integer"],"costCents":["cost_cents","integer"],"unit":["unit","string"],"measureUnit":["measure_unit","string"],"priceOrigin":["price_origin","string"],"priceListId":["price_list_id","string"],"priceListName":["price_list_name","string"],"priceListVersion":["price_list_version","integer"],"inactiveAtSale":["inactive_at_sale","boolean"],"promotion":["promotion_json","json"],"substitutedFrom":["substituted_from_json","json"]},"children":{"packages":"packages","stockSources":"stockSources"}},
"packages":{"table":"commercial_sale_item_packages","parent":"items","parentOrdinal":"item_ordinal","fields":{"id":["id","string"],"packageId":["package_id","string"],"name":["name","string"],"factor":["factor_quantity","quantity"],"count":["count_quantity","quantity"],"version":["version","integer"]}},
"stockSources":{"table":"commercial_sale_item_stock_sources","parent":"items","parentOrdinal":"item_ordinal","fields":{"id":["id","string"],"positionId":["position_id","string"],"name":["name","string"],"quantity":["quantity","quantity"]}},
"receipts":{"table":"commercial_sale_receipts","parent":"sales","fields":{"id":["id","string"],"saleId":["declared_sale_id","string"],"requestId":["request_id","string"],"amountCents":["amount_cents","integer"],"paymentMethod":["payment_method","string"],"date":["created_at","string"],"cashSessionId":["cash_session_id","string"],"reference":["reference","string"],"tenderedCents":["tendered_cents","integer"],"changeCents":["change_cents","integer"],"agreementId":["agreement_id","string"],"agreementPaymentId":["agreement_payment_id","string"],"legacy":["legacy","boolean"],"execution":["execution_json","json"]},"children":{"allocations":"receiptAllocations"}},
"receiptAllocations":{"table":"commercial_sale_receipt_allocations","parent":"receipts","parentOrdinal":"receipt_ordinal","fields":{"id":["id","string"],"installmentId":["installment_id","string"],"amountCents":["amount_cents","integer"]}},
"installments":{"table":"commercial_sale_installments","parent":"sales","fields":{"id":["id","string"],"number":["number","integer"],"amountCents":["amount_cents","integer"],"dueDate":["due_date","string"]}},
"returns":{"table":"commercial_sale_returns","parent":"sales","fields":{"id":["id","string"],"number":["number","integer"],"date":["created_at","string"],"reason":["reason","string"],"responsible":["responsible","string"],"totalCents":["total_cents","integer"],"storeCreditRestoredCents":["store_credit_restored_cents","integer"],"execution":["execution_json","json"]},"children":{"items":"returnItems"}},
"returnItems":{"table":"commercial_sale_return_items","parent":"returns","parentOrdinal":"return_ordinal","fields":{"id":["id","string"],"productId":["product_id","reference"],"name":["name","string"],"quantity":["quantity","quantity"],"restockQuantity":["restock_quantity","quantity"],"quarantineQuantity":["quarantine_quantity","quantity"],"remaining":["remaining_quantity","quantity"],"restock":["restock","boolean"],"amountCents":["amount_cents","integer"],"note":["note","string"],"quarantineEntryId":["quarantine_entry_id","string"]}},
"refunds":{"table":"commercial_sale_refunds","parent":"sales","fields":{"id":["id","string"],"amountCents":["amount_cents","integer"],"paymentMethod":["payment_method","string"],"date":["created_at","string"],"paidDate":["paid_date","string"],"recordedAt":["recorded_at","string"],"cashSessionId":["cash_session_id","string"],"note":["note","string"],"returnRefund":["return_refund","boolean"],"execution":["execution_json","json"]}},
"returnAllocations":{"table":"commercial_sale_return_allocations","parent":"sales","fields":{"id":["id","string"],"productId":["product_id","reference"],"quantity":["quantity","quantity"],"discountedUnits":["discounted_units_quantity","quantity"],"unitNetCents":["unit_net_cents","integer"]}},
"creditAllocations":{"table":"commercial_sale_credit_allocations","parent":"sales","fields":{"id":["id","string"],"creditId":["credit_id","string"],"amountCents":["amount_cents","integer"],"restoredCents":["restored_cents","integer"]}},
"forgiveness":{"table":"commercial_sale_forgiveness","parent":"sales","fields":{"id":["id","string"],"date":["created_at","string"],"amountCents":["amount_cents","integer"],"reason":["reason","string"],"responsible":["responsible","string"],"execution":["execution_json","json"]},"children":{"allocations":"forgivenessAllocations"}},
"forgivenessAllocations":{"table":"commercial_sale_forgiveness_allocations","parent":"forgiveness","parentOrdinal":"forgiveness_ordinal","fields":{"id":["id","string"],"installmentId":["installment_id","string"],"amountCents":["amount_cents","integer"]}},
"checkouts":{"table":"commercial_sale_checkouts","parent":"sales","single":true,"fields":{"totalCents":["total_cents","integer"],"internalCents":["internal_cents","integer"],"receivedCents":["received_cents","integer"],"remainingCents":["remaining_cents","integer"],"cashCents":["cash_cents","integer"],"tenderedCents":["tendered_cents","integer"],"changeCents":["change_cents","integer"],"status":["status","string"],"recordedAt":["recorded_at","string"]},"children":{"receiptIds":"checkoutReceiptIds"}},
"checkoutReceiptIds":{"table":"commercial_sale_checkout_receipt_ids","parent":"checkouts","parentOrdinal":"checkout_ordinal","scalar":true,"fields":{"value":["value_json","json"]}},
"pos":{"table":"commercial_sale_pos","parent":"sales","single":true,"fields":{"station":["station","string"],"shift":["shift","string"]}}
};

function divergence(){return new AppError(500,'COMMERCIAL_DIVERGENCE','Vendas SQL e espelho divergem. Confira uma cópia preservada antes de recuperar.');}
function invalid(message='Filtro ou paginação de vendas inválidos.'){return new AppError(422,'INVALID_QUERY',message);}
function keys(name){const d=definitions[name];return name==='sales'?['company_id','unit_id','id']:['company_id','unit_id','sale_id',...(d.parentOrdinal?[d.parentOrdinal]:[]),'ordinal'];}
function compatible(value,type){return value===null||type==='json'||type==='reference'&&typeof value==='string'&&value!==''||type==='quantity'&&Number.isSafeInteger(value)||type==='integer'&&Number.isSafeInteger(value)||type==='boolean'&&typeof value==='boolean'||type==='string'&&typeof value==='string';}
function children(record,definition){
 const selected={};
 for(const [field,name]of Object.entries(definition.children||{})){
  const child=definitions[name],value=record[field];
  if(child.single?object(value):Array.isArray(value)&&(child.scalar||value.every(object)))selected[field]=name;
 }
 return selected;
}
function project(record,definition){
 const row={},present=[],extra=Object.create(null),selected=children(record,definition);
 for(const [column]of Object.values(definition.fields))row[column]=null;
 for(const [field,value]of Object.entries(record)){
  if(Object.hasOwn(selected,field)){present.push(field);continue;}
  const spec=Object.hasOwn(definition.fields,field)?definition.fields[field]:null;
  if(spec&&value!==undefined&&compatible(value,spec[1])){
   present.push(field);row[spec[0]]=value===null?null:spec[1]==='quantity'?decimal(value):spec[1]==='boolean'?Number(value):spec[1]==='json'?JSON.stringify(value):value;
  }else extra[field]=value;
 }
 return{row:{...row,present_fields:JSON.stringify(present),extra_json:JSON.stringify(extra)},selected};
}
function restore(row,definition){
 let result,present;
 try{result=JSON.parse(row.extra_json);present=JSON.parse(row.present_fields);}catch{throw divergence();}
 if(!object(result)||!Array.isArray(present))throw divergence();
 for(const field of present){
  if(Object.hasOwn(definition.children||{},field))continue;
  const spec=Object.hasOwn(definition.fields,field)?definition.fields[field]:null;if(!spec)throw divergence();
  const value=row[spec[0]];
  try{result[field]=value===null?null:spec[1]==='quantity'?legacyInteger(value):spec[1]==='boolean'?Boolean(value):spec[1]==='json'?JSON.parse(value):value;}catch{throw divergence();}
 }
 return result;
}
function actorColumns(store,scope,sale){
 const e=object(sale.execution)?sale.execution:{},result={};
 for(const [column,field]of [['executed_by','executedBy'],['authorized_by','authorizedBy']]){
  result[column]=typeof e[field]==='string'&&store.db.prepare('SELECT 1 FROM unit_memberships WHERE user_id=? AND company_id=? AND unit_id=?').get(e[field],scope.companyId,scope.unitId)?e[field]:null;
 }
 for(const [column,field]of [['executor_name','executorName'],['authorizer_name','approverName'],['executed_at','executedAt']])result[column]=typeof e[field]==='string'?e[field]:null;
 return result;
}
function verifyActor(row,sale){
 for(const [column,field]of [['executed_by','executedBy'],['authorized_by','authorizedBy'],['executor_name','executorName'],['authorizer_name','approverName'],['executed_at','executedAt']])if(row[column]!==null&&row[column]!==sale.execution?.[field])throw divergence();
}
function day(value){try{return typeof value==='string'&&Number.isFinite(Date.parse(value))?require('../public/reports').calendarDay(value):null;}catch{return null;}}
function marker(store,scope){return store.db.prepare("SELECT source_revision FROM commercial_normalizations WHERE company_id=? AND unit_id=? AND aggregate='sales'").get(scope.companyId,scope.unitId);}
function queryRevision(store,scope){
 const head=store.db.prepare('SELECT revision FROM unit_states WHERE company_id=? AND unit_id=?').get(scope.companyId,scope.unitId),m=marker(store,scope);
 if(!head){if(m)throw divergence();return 0;}
 if(!m)throw new AppError(503,'NORMALIZATION_REQUIRED','Vendas ainda não preparadas para consulta.');
 if(m.source_revision!==head.revision)throw divergence();return head.revision;
}
function selectedDefinitions(mode){
 if(mode==='summary')return new Set(['items']);
 if(mode==='commercial')return new Set(['items','packages','stockSources']);
 return new Set(Object.keys(definitions).filter(name=>name!=='sales'));
}
function hydrateRows(store,scope,rows,mode='full',all=false){
 const selected=selectedDefinitions(mode),indexes=new Map(),ids=rows.map(row=>row.id);
 if(!ids.length)return[];
 for(const [name,d]of Object.entries(definitions)){
  if(name==='sales'||!selected.has(name))continue;
  const extra=all?'':' AND sale_id IN ('+ids.map(()=>'?').join(',')+')',order=['sale_id',...(d.parentOrdinal?[d.parentOrdinal]:[]),'ordinal'];
  const found=store.db.prepare('SELECT * FROM '+d.table+' WHERE company_id=? AND unit_id=?'+extra+' ORDER BY '+order.join(',')).all(scope.companyId,scope.unitId,...(all?[]:ids)),index=new Map();
  for(const row of found){const identity=JSON.stringify([row.company_id,row.unit_id,row.sale_id,...(d.parentOrdinal?[row[d.parentOrdinal]]:[])]);if(!index.has(identity))index.set(identity,[]);index.get(identity).push(row);}
  indexes.set(name,index);
 }
 function build(name,row){
  const d=definitions[name],record=restore(row,d),present=JSON.parse(row.present_fields);
  for(const [field,childName]of Object.entries(d.children||{})){
   if(!present.includes(field)||!selected.has(childName))continue;
   const found=indexes.get(childName)?.get(JSON.stringify(keys(name).map(key=>row[key])))||[],child=definitions[childName],values=found.map(next=>child.scalar?restore(next,child).value:build(childName,next));
   if(child.single){if(values.length!==1)throw divergence();record[field]=values[0];}else record[field]=values;
  }
  if(name==='sales'){verifyActor(row,record);if(mode==='full'&&hash(canonical(record))!==row.content_hash)throw divergence();}
  return record;
 }
 return rows.map(row=>build('sales',row));
}
function hydrateSales(store,scope){return hydrateRows(store,scope,store.db.prepare('SELECT * FROM commercial_sales WHERE company_id=? AND unit_id=? ORDER BY ordinal').all(scope.companyId,scope.unitId),'full',true);}
function verifySalesMirror(store,scope,state){
 if(!marker(store,scope))return state;queryRevision(store,scope);
 const sales=hydrateSales(store,scope);
 if(canonical(sales)!==canonical(state.sales))throw divergence();
 return{...state,sales};
}
function upsert(store,table,row,primary){
 const columns=Object.keys(row),update=columns.filter(column=>!primary.includes(column));
 store.db.prepare('INSERT INTO '+table+'('+columns.join(',')+') VALUES('+columns.map(()=>'?').join(',')+') ON CONFLICT('+primary.join(',')+') DO UPDATE SET '+update.map(column=>column+'=excluded.'+column).join(',')).run(...columns.map(column=>row[column]));
}
function removeChildren(store,args){
 for(const d of Object.values(definitions).slice(1).reverse())store.db.prepare('DELETE FROM '+d.table+' WHERE company_id=? AND unit_id=? AND sale_id=?').run(...args);
}
function insertChildren(store,scope,saleId,name,record,ordinal=0){
 const d=definitions[name],selected=children(record,d);
 for(const [field,childName]of Object.entries(selected)){
  const child=definitions[childName],values=child.single?[record[field]]:record[field];
  for(let index=0;index<values.length;index++){
   const value=child.scalar?{value:values[index]}:values[index],projected=project(value,child).row;
   const row={company_id:scope.companyId,unit_id:scope.unitId,sale_id:saleId,...(child.parentOrdinal?{[child.parentOrdinal]:ordinal}:{}),ordinal:index,...projected},columns=Object.keys(row);
   store.db.prepare('INSERT INTO '+child.table+'('+columns.join(',')+') VALUES('+columns.map(()=>'?').join(',')+')').run(...columns.map(column=>row[column]));
   insertChildren(store,scope,saleId,childName,value,index);
  }
 }
}
function syncSales(store,scope,state,revision){
 store.requireTransaction();
 const args=[scope.companyId,scope.unitId],old=store.db.prepare('SELECT id,ordinal,content_hash FROM commercial_sales WHERE company_id=? AND unit_id=?').all(...args),prior=new Map(old.map(row=>[row.id,row])),wanted=new Map(state.sales.map((sale,index)=>[sale.id,index]));
 for(const row of old)if(!wanted.has(row.id)){removeChildren(store,[...args,row.id]);store.db.prepare('DELETE FROM commercial_sales WHERE company_id=? AND unit_id=? AND id=?').run(...args,row.id);}
 const reorder=old.some(row=>wanted.has(row.id)&&wanted.get(row.id)!==row.ordinal);
 if(reorder){const offset=old.reduce((n,row)=>Math.max(n,row.ordinal),0)+state.sales.length+1;store.db.prepare('UPDATE commercial_sales SET ordinal=ordinal+? WHERE company_id=? AND unit_id=?').run(offset,...args);}
 let changed=0;
 for(let ordinal=0;ordinal<state.sales.length;ordinal++){
  const sale=state.sales[ordinal],fingerprint=hash(canonical(sale)),previous=prior.get(sale.id),contentChanged=!previous||previous.content_hash!==fingerprint;
  if(!contentChanged&&!reorder&&previous.ordinal===ordinal)continue;
  const row={company_id:scope.companyId,unit_id:scope.unitId,ordinal,...project(sale,definitions.sales).row,content_hash:fingerprint,search_text:normalize([sale.id,sale.customerName,sale.code,sale.number].join(' ')),sort_name:normalize(sale.customerName),sale_day:day(sale.date),is_cancelled:Number(Boolean(sale.cancelledAt)),...actorColumns(store,scope,sale)};
  upsert(store,definitions.sales.table,row,keys('sales'));
  if(contentChanged){removeChildren(store,[...args,sale.id]);insertChildren(store,scope,sale.id,'sales',sale);changed++;}
 }
 upsert(store,'commercial_normalizations',{company_id:scope.companyId,unit_id:scope.unitId,aggregate:'sales',source_revision:revision,normalized_at:new Date().toISOString()},['company_id','unit_id','aggregate']);
 return changed;
}
function normalizeSales(store,scope,state,revision){
 store.requireTransaction();if(marker(store,scope)){verifySalesMirror(store,scope,state);return false;}
 syncSales(store,scope,state,revision);if(canonical(hydrateSales(store,scope))!==canonical(state.sales))throw divergence();return true;
}
function querySales(store,scope,options={}){
 require('./scoped-state').assertScope(store,scope);const revision=queryRevision(store,scope);
 const {page=1,pageSize=50,q='',sort='name',direction='asc',status='all',cancelled='all',from='',to='',customerId='',executorId='',unitId=''}=options,sorts={name:'sort_name',date:"coalesce(created_at,'')",code:"coalesce(code,'')",id:'id'};
 if(!Number.isSafeInteger(page)||page<1||page>1000000||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100||typeof q!=='string'||q.length>120||!Object.hasOwn(sorts,sort)||!['asc','desc'].includes(direction)||!['all','active','inactive'].includes(status)||!['all','registered','cancelled'].includes(cancelled)||[from,to,customerId,executorId,unitId].some(value=>typeof value!=='string'))throw invalid();
 const {validDay}=require('../public/reports');
 if(from&&!validDay(from)||to&&!validDay(to)||from&&to&&from>to||[customerId,executorId,unitId].some(value=>value.length>120))throw invalid();
 if(unitId&&unitId!==scope.unitId)throw new AppError(403,'FORBIDDEN_CONTEXT','Consulta limitada à unidade selecionada e autorizada.');
 const params=[scope.companyId,scope.unitId],where=['company_id=?','unit_id=?'];
 if(status!=='all')where.push(status==='inactive'?'active=0':'(active IS NULL OR active=1)');
 if(cancelled!=='all')where.push('is_cancelled='+(cancelled==='cancelled'?1:0));
 if(q){where.push("search_text LIKE ? ESCAPE '\\'");params.push('%'+normalize(q).replace(/[\\%_]/g,'\\$&')+'%');}
 for(const [value,column,operator]of [[from,'sale_day','>='],[to,'sale_day','<='],[customerId,'customer_id','='],[executorId,'executed_by','=']])if(value){where.push(column+operator+'?');params.push(value);}
 const clause=where.join(' AND '),total=store.db.prepare('SELECT count(*) n FROM commercial_sales WHERE '+clause).get(...params).n;
 const rows=store.db.prepare('SELECT * FROM commercial_sales WHERE '+clause+' ORDER BY '+sorts[sort]+' '+direction.toUpperCase()+',id ASC LIMIT ? OFFSET ?').all(...params,pageSize,(page-1)*pageSize);
 return{items:hydrateRows(store,scope,rows,'summary'),page,pageSize,total,totalPages:Math.ceil(total/pageSize),revision};
}
function getSale(store,scope,id,options={}){
 require('./scoped-state').assertScope(store,scope);queryRevision(store,scope);
 if(typeof id!=='string'||!id||id.length>120)throw invalid('Informe um identificador válido.');
 const rows=store.db.prepare('SELECT * FROM commercial_sales WHERE company_id=? AND unit_id=? AND id=?').all(scope.companyId,scope.unitId,id);
 if(!rows.length)throw new AppError(404,'NOT_FOUND','Venda não localizada nesta unidade.');
 return hydrateRows(store,scope,rows,options.financial===false?'commercial':'full')[0];
}
function report(store,scope,state){
 verifySalesMirror(store,scope,state);const sales=state.sales,sums=new Map(),quantities=new Map();
 function walk(value,path){
  if(Array.isArray(value)){for(const item of value)walk(item,path+'[]');return;}
  if(!object(value))return;
  for(const [key,child]of Object.entries(value)){
   const at=path+'.'+key;if(key.endsWith('Cents')&&Number.isSafeInteger(child))sums.set(at,(sums.get(at)||0n)+BigInt(child));
   if(['quantity','restockQuantity','quarantineQuantity','remaining','factor','count','discountedUnits'].includes(key)&&Number.isSafeInteger(child))quantities.set(at,add(quantities.get(at)||'0',child));
   walk(child,at);
  }
 }
 walk(sales,'sales');
 return{count:sales.length,items:sales.reduce((n,s)=>n+s.items.length,0),receipts:sales.reduce((n,s)=>n+(Array.isArray(s.receipts)?s.receipts.length:0),0),returns:sales.reduce((n,s)=>n+(Array.isArray(s.returns)?s.returns.length:0),0),refunds:sales.reduce((n,s)=>n+(Array.isArray(s.refunds)?s.refunds.length:0),0),equivalent:true,canonicalSHA256:hash(canonical(sales)),idsSHA256:hash(JSON.stringify(sales.map(s=>s.id).sort())),totalCents:sales.reduce((n,s)=>n+BigInt(s.totalCents),0n).toString(),centsByPath:Object.fromEntries([...sums].sort(([a],[b])=>a.localeCompare(b)).map(([path,value])=>[path,value.toString()])),quantitiesByPath:Object.fromEntries([...quantities].sort(([a],[b])=>a.localeCompare(b)))};
}
module.exports={syncSales,normalizeSales,hydrateSales,verifySalesMirror,querySales,getSale,report};

