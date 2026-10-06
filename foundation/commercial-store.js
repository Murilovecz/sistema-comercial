'use strict';
const {AppError}=require('./errors');
const {decimal,legacyInteger}=require('./decimal');
const {validateDatabase}=require('../storage');
const text=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const key=value=>typeof value==='string'?value.trim().toLowerCase():null;
function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
const products={id:['id','string'],name:['name','string'],code:['code','string'],sku:['sku','string'],barcode:['barcode','string'],description:['description','string'],category:['category','string'],brand:['brand','string'],location:['location','string'],unit:['unit','string'],measureUnit:['measure_unit','string'],active:['active','boolean'],version:['version','integer'],priceCents:['price_cents','integer'],costCents:['cost_cents','integer'],unitCostCents:['unit_cost_cents','integer'],minimumPriceCents:['minimum_price_cents','integer'],stock:['stock_quantity','quantity'],minStock:['minimum_quantity','quantity'],date:['created_at','string'],updatedAt:['updated_at','string']};
const child={id:['id','string'],name:['name','string'],code:['code','string'],barcode:['barcode','string'],active:['active','boolean'],version:['version','integer'],date:['created_at','string']};
const packages={...child,factor:['factor_quantity','quantity'],unit:['unit','string']};
const customers={id:['id','string'],name:['name','string'],phone:['phone','string'],email:['email','string'],contactName:['contact_name','string'],address:['address','string'],document:['document','string'],commercialId:['commercial_id','string'],notes:['notes','string'],preferredPriceListId:['preferred_price_list_id','string'],active:['active','boolean'],version:['version','integer'],date:['created_at','string'],updatedAt:['updated_at','string']};
const suppliers=Object.fromEntries(Object.entries(customers).filter(([key])=>key!=='preferredPriceListId'));
const purchases={id:['id','string'],number:['number','integer'],supplierId:['supplier_id','reference'],supplierName:['supplier_name','string'],sourceId:['source_id','reference'],version:['version','integer'],totalCents:['total_cents','integer'],expectedDate:['expected_date','string'],confirmedExpectedDate:['confirmed_expected_date','string'],confirmedAt:['confirmed_at','string'],closedAt:['closed_at','string'],closeReason:['close_reason','string'],closedPendingQuantity:['closed_pending_quantity','quantity'],closedPendingCents:['closed_pending_cents','integer'],supplierQuoteId:['supplier_quote_id','string'],supplierQuoteResponseId:['supplier_quote_response_id','string'],quotedFreightCents:['quoted_freight_cents','integer'],note:['note','string'],date:['created_at','string'],updatedAt:['updated_at','string']};
const purchaseItems={id:['id','string'],productId:['product_id','reference'],name:['name','string'],code:['code','string'],quantity:['quantity','quantity'],unitCostCents:['unit_cost_cents','integer'],unit:['unit','string'],measureUnit:['measure_unit','string']};
const purchaseReceipts={id:['id','string'],sequence:['sequence','integer'],requestId:['request_id','string'],reference:['reference','string'],declaredDate:['declared_date','string'],conferenceId:['conference_id','string'],conferent:['conferent','string'],note:['note','string'],date:['created_at','string']};
const receiptItems={id:['id','string'],productId:['product_id','reference'],name:['name','string'],quantity:['quantity','quantity'],unitCostCents:['unit_cost_cents','integer'],originalUnitCostCents:['original_unit_cost_cents','integer'],costReason:['cost_reason','string'],quarantineQuantity:['quarantine_quantity','quantity'],quarantineEntryId:['quarantine_entry_id','string'],destinationPositionId:['destination_position_id','string'],unit:['unit','string'],measureUnit:['measure_unit','string']};
function project(record,mapping,excluded=[]){
 const values={},present=[],extras=Object.create(null);
 for(const[field,[column]]of Object.entries(mapping))values[column]=null;
 for(const[field,value]of Object.entries(record)){
  if(excluded.includes(field))continue;
  const spec=Object.hasOwn(mapping,field)?mapping[field]:undefined,type=spec?.[1];
  // Retain unsupported optional historical values as extras, not guessed coercions.
  if(spec&&(value===null||type==='reference'&&typeof value==='string'&&value!==''||type==='quantity'&&Number.isSafeInteger(value)||type==='integer'&&Number.isSafeInteger(value)||typeof value===type)){
   present.push(field);values[spec[0]]=value===null?null:type==='boolean'?Number(value):type==='quantity'?decimal(value):value;
  }else extras[field]=value;
 }
 return {...values,present_fields:JSON.stringify(present),extra_json:JSON.stringify(extras)};
}
function restore(row,mapping){
 const result=JSON.parse(row.extra_json),present=JSON.parse(row.present_fields);
 for(const field of present){if(mapping===products&&['aliases','packages'].includes(field)||mapping===purchases&&['items','receipts'].includes(field)||mapping===purchaseReceipts&&field==='items')continue;const spec=Object.hasOwn(mapping,field)?mapping[field]:null;if(!spec)throw new AppError(500,'COMMERCIAL_DIVERGENCE','Estrutura comercial inconsistente; restaure uma cópia conferida.');const value=row[spec[0]];result[field]=value===null?null:spec[1]==='boolean'?Boolean(value):spec[1]==='quantity'?legacyInteger(value):value;}
 return result;
}
function marker(store,scope,aggregate='products'){return store.db.prepare('SELECT source_revision,collection_present FROM commercial_normalizations WHERE company_id=? AND unit_id=? AND aggregate=?').get(scope.companyId,scope.unitId,aggregate);}
function hydratedRows(store,scope,rows){
 const aliases=store.db.prepare('SELECT * FROM commercial_product_aliases WHERE company_id=? AND unit_id=? AND product_id=? ORDER BY ordinal');
 const packs=store.db.prepare('SELECT * FROM commercial_product_packages WHERE company_id=? AND unit_id=? AND product_id=? ORDER BY ordinal');
 return rows.map(row=>{const result=restore(row,products),presence=JSON.parse(row.present_fields);
  if(presence.includes('aliases'))result.aliases=aliases.all(scope.companyId,scope.unitId,row.id).map(a=>restore(a,child));
  if(presence.includes('packages'))result.packages=packs.all(scope.companyId,scope.unitId,row.id).map(a=>restore(a,packages));
  return result;
 });
}
function hydrateProducts(store,scope){return hydratedRows(store,scope,store.db.prepare('SELECT * FROM commercial_products WHERE company_id=? AND unit_id=? ORDER BY ordinal').all(scope.companyId,scope.unitId));}
function divergence(){return new AppError(500,'COMMERCIAL_DIVERGENCE','SQL e espelho comercial divergem. A operação foi interrompida; confira uma cópia antes de recuperar.');}
function verifyProductMirror(store,scope,state){
 const normalizedHead=marker(store,scope);if(!normalizedHead)return state;
 const head=store.db.prepare('SELECT revision FROM unit_states WHERE company_id=? AND unit_id=?').get(scope.companyId,scope.unitId);
 if(!head||head.revision!==normalizedHead.source_revision)throw divergence();
 const normalized=hydrateProducts(store,scope);
 if(canonical(normalized)!==canonical(state.products))throw divergence();
 return {...state,products:normalized};
}
function upsert(store,table,record,pk){
 const columns=Object.keys(record),updates=columns.filter(c=>!pk.includes(c));
 store.db.prepare('INSERT INTO '+table+' ('+columns.join(',')+') VALUES ('+columns.map(()=>'?').join(',')+') ON CONFLICT('+pk.join(',')+') DO UPDATE SET '+updates.map(c=>c+'=excluded.'+c).join(',')).run(...columns.map(c=>record[c]));
}
function syncProducts(store,scope,state,revision){
 store.requireTransaction();
 const args=[scope.companyId,scope.unitId],old=store.db.prepare('SELECT id,ordinal FROM commercial_products WHERE company_id=? AND unit_id=?').all(...args);
 // Temporary positive ordinals avoid unique collisions when lists are reordered.
 const offset=old.reduce((n,r)=>Math.max(n,r.ordinal),0)+state.products.length+1;
 store.db.prepare('UPDATE commercial_products SET ordinal=ordinal+? WHERE company_id=? AND unit_id=?').run(offset,...args);
 for(const table of ['commercial_product_aliases','commercial_product_packages'])store.db.prepare('DELETE FROM '+table+' WHERE company_id=? AND unit_id=?').run(...args);
 for(let ordinal=0;ordinal<state.products.length;ordinal++){
  const p=state.products[ordinal],normalizedChildren=['aliases','packages'].filter(k=>Array.isArray(p[k])),row=project(p,products,normalizedChildren),present=JSON.parse(row.present_fields);
  for(const collection of normalizedChildren)present.push(collection);
  row.present_fields=JSON.stringify(present);
  upsert(store,'commercial_products',{company_id:scope.companyId,unit_id:scope.unitId,ordinal,...row,search_text:text([p.name,p.code,p.barcode].join(' ')),sort_name:text(p.name)},['company_id','unit_id','id']);
  for(const[collection,table,mapping]of [['aliases','commercial_product_aliases',child],['packages','commercial_product_packages',packages]])for(let index=0;index<(Array.isArray(p[collection])?p[collection]:[]).length;index++){
   const item=p[collection][index];upsert(store,table,{company_id:scope.companyId,unit_id:scope.unitId,product_id:p.id,ordinal:index,...project(item,mapping),lookup_code:key(item.code),lookup_barcode:key(item.barcode)},['company_id','unit_id','product_id','id']);
  }
 }
 const ids=new Set(state.products.map(p=>p.id));for(const row of old)if(!ids.has(row.id))store.db.prepare('DELETE FROM commercial_products WHERE company_id=? AND unit_id=? AND id=?').run(...args,row.id);
 upsert(store,'commercial_normalizations',{company_id:scope.companyId,unit_id:scope.unitId,aggregate:'products',source_revision:revision,normalized_at:new Date().toISOString()},['company_id','unit_id','aggregate']);
 if(canonical(hydrateProducts(store,scope))!==canonical(state.products))throw divergence();
}
function normalizeProducts(store,scope,state,revision){store.requireTransaction();validateDatabase(state);if(marker(store,scope)){verifyProductMirror(store,scope,state);return false;}syncProducts(store,scope,state,revision);return true;}
function normalizeAllProducts(store){
 return store.transaction(()=>{let normalized=0;for(const row of store.db.prepare('SELECT company_id,unit_id,revision,payload FROM unit_states').all())normalized+=Number(normalizeProducts(store,{companyId:row.company_id,unitId:row.unit_id},JSON.parse(row.payload),row.revision));return normalized;});
}
function hydrateCustomers(store,scope){return store.db.prepare('SELECT * FROM commercial_customers WHERE company_id=? AND unit_id=? ORDER BY ordinal').all(scope.companyId,scope.unitId).map(row=>restore(row,customers));}
function verifyCustomerMirror(store,scope,state){
 if(!marker(store,scope,'customers'))return state;
 queryRevision(store,scope,'customers');const normalized=hydrateCustomers(store,scope);
 if(canonical(normalized)!==canonical(state.customers))throw divergence();
 return {...state,customers:normalized};
}
function syncCustomers(store,scope,state,revision){
 store.requireTransaction();const args=[scope.companyId,scope.unitId],old=store.db.prepare('SELECT id,ordinal FROM commercial_customers WHERE company_id=? AND unit_id=?').all(...args),offset=old.reduce((n,r)=>Math.max(n,r.ordinal),0)+state.customers.length+1;
 store.db.prepare('UPDATE commercial_customers SET ordinal=ordinal+? WHERE company_id=? AND unit_id=?').run(offset,...args);
 for(let ordinal=0;ordinal<state.customers.length;ordinal++){
  const c=state.customers[ordinal];upsert(store,'commercial_customers',{company_id:scope.companyId,unit_id:scope.unitId,ordinal,...project(c,customers),search_text:text([c.name,c.phone,c.email,c.document,c.commercialId].join(' ')),sort_name:text(c.name)},['company_id','unit_id','id']);
 }
 const ids=new Set(state.customers.map(c=>c.id));for(const row of old)if(!ids.has(row.id))store.db.prepare('DELETE FROM commercial_customers WHERE company_id=? AND unit_id=? AND id=?').run(...args,row.id);
 upsert(store,'commercial_normalizations',{company_id:scope.companyId,unit_id:scope.unitId,aggregate:'customers',source_revision:revision,normalized_at:new Date().toISOString()},['company_id','unit_id','aggregate']);
 if(canonical(hydrateCustomers(store,scope))!==canonical(state.customers))throw divergence();
}
function normalizeCustomers(store,scope,state,revision){store.requireTransaction();validateDatabase(state);if(marker(store,scope,'customers')){verifyCustomerMirror(store,scope,state);return false;}syncCustomers(store,scope,state,revision);return true;}
function hydrateSuppliers(store,scope){return store.db.prepare('SELECT * FROM commercial_suppliers WHERE company_id=? AND unit_id=? ORDER BY ordinal').all(scope.companyId,scope.unitId).map(row=>restore(row,suppliers));}
function verifySupplierMirror(store,scope,state){
 const normalized=marker(store,scope,'suppliers');if(!normalized)return state;
 queryRevision(store,scope,'suppliers');const records=hydrateSuppliers(store,scope),present=Array.isArray(state.suppliers);
 if(Boolean(normalized.collection_present)!==present||canonical(records)!==canonical(state.suppliers||[]))throw divergence();
 return present?{...state,suppliers:records}:state;
}
function syncSuppliers(store,scope,state,revision){
 store.requireTransaction();const records=state.suppliers||[],args=[scope.companyId,scope.unitId],old=store.db.prepare('SELECT id,ordinal FROM commercial_suppliers WHERE company_id=? AND unit_id=?').all(...args),offset=old.reduce((n,r)=>Math.max(n,r.ordinal),0)+records.length+1;
 store.db.prepare('UPDATE commercial_suppliers SET ordinal=ordinal+? WHERE company_id=? AND unit_id=?').run(offset,...args);
 for(let ordinal=0;ordinal<records.length;ordinal++){const s=records[ordinal];upsert(store,'commercial_suppliers',{company_id:scope.companyId,unit_id:scope.unitId,ordinal,...project(s,suppliers),search_text:text([s.name,s.phone,s.email,s.document,s.commercialId].join(' ')),sort_name:text(s.name)},['company_id','unit_id','id']);}
 const ids=new Set(records.map(s=>s.id));for(const row of old)if(!ids.has(row.id))store.db.prepare('DELETE FROM commercial_suppliers WHERE company_id=? AND unit_id=? AND id=?').run(...args,row.id);
 upsert(store,'commercial_normalizations',{company_id:scope.companyId,unit_id:scope.unitId,aggregate:'suppliers',source_revision:revision,normalized_at:new Date().toISOString(),collection_present:Number(Array.isArray(state.suppliers))},['company_id','unit_id','aggregate']);
 if(canonical(hydrateSuppliers(store,scope))!==canonical(records))throw divergence();
}
function normalizeSuppliers(store,scope,state,revision){store.requireTransaction();validateDatabase(state);if(marker(store,scope,'suppliers')){verifySupplierMirror(store,scope,state);return false;}syncSuppliers(store,scope,state,revision);return true;}
function hydratePurchases(store,scope){
 const args=[scope.companyId,scope.unitId],itemStmt=store.db.prepare('SELECT * FROM commercial_purchase_items WHERE company_id=? AND unit_id=? AND purchase_id=? ORDER BY ordinal'),receiptStmt=store.db.prepare('SELECT * FROM commercial_purchase_receipts WHERE company_id=? AND unit_id=? AND purchase_id=? ORDER BY ordinal'),receivedStmt=store.db.prepare('SELECT * FROM commercial_purchase_receipt_items WHERE company_id=? AND unit_id=? AND purchase_id=? AND receipt_ordinal=? ORDER BY ordinal');
 return store.db.prepare('SELECT * FROM commercial_purchases WHERE company_id=? AND unit_id=? ORDER BY ordinal').all(...args).map(row=>({...restore(row,purchases),items:itemStmt.all(...args,row.id).map(i=>restore(i,purchaseItems)),receipts:receiptStmt.all(...args,row.id).map(r=>({...restore(r,purchaseReceipts),items:receivedStmt.all(...args,row.id,r.ordinal).map(i=>restore(i,receiptItems))}))}));
}
function verifyPurchaseMirror(store,scope,state){const normalized=marker(store,scope,'purchases');if(!normalized)return state;queryRevision(store,scope,'purchases');const records=hydratePurchases(store,scope),present=Array.isArray(state.purchases);if(Boolean(normalized.collection_present)!==present||canonical(records)!==canonical(state.purchases||[]))throw divergence();return present?{...state,purchases:records}:state;}
function syncPurchases(store,scope,state,revision){
 store.requireTransaction();const records=state.purchases||[],args=[scope.companyId,scope.unitId],old=store.db.prepare('SELECT id,ordinal FROM commercial_purchases WHERE company_id=? AND unit_id=?').all(...args),offset=old.reduce((n,r)=>Math.max(n,r.ordinal),0)+records.length+1;
 for(const table of ['commercial_purchase_receipt_items','commercial_purchase_receipts','commercial_purchase_items'])store.db.prepare('DELETE FROM '+table+' WHERE company_id=? AND unit_id=?').run(...args);
 store.db.prepare('UPDATE commercial_purchases SET ordinal=ordinal+? WHERE company_id=? AND unit_id=?').run(offset,...args);
 for(let ordinal=0;ordinal<records.length;ordinal++){const p=records[ordinal],head=project(p,purchases,['items','receipts']);head.present_fields=JSON.stringify([...JSON.parse(head.present_fields),'items','receipts']);upsert(store,'commercial_purchases',{company_id:scope.companyId,unit_id:scope.unitId,ordinal,...head},['company_id','unit_id','id']);}
 for(const p of records){
  for(let ordinal=0;ordinal<p.items.length;ordinal++)upsert(store,'commercial_purchase_items',{company_id:scope.companyId,unit_id:scope.unitId,purchase_id:p.id,ordinal,...project(p.items[ordinal],purchaseItems)},['company_id','unit_id','purchase_id','ordinal']);
  for(let ordinal=0;ordinal<p.receipts.length;ordinal++){
   const r=p.receipts[ordinal],receipt=project(r,purchaseReceipts,['items']);receipt.present_fields=JSON.stringify([...JSON.parse(receipt.present_fields),'items']);upsert(store,'commercial_purchase_receipts',{company_id:scope.companyId,unit_id:scope.unitId,purchase_id:p.id,ordinal,...receipt},['company_id','unit_id','purchase_id','ordinal']);
   for(let index=0;index<r.items.length;index++){const i=r.items[index],ordered=p.items.findIndex(item=>item.productId===i.productId);if(ordered<0)throw new AppError(422,'PURCHASE_ITEM_REFERENCE','Recebimento sem item correspondente no pedido.');upsert(store,'commercial_purchase_receipt_items',{company_id:scope.companyId,unit_id:scope.unitId,purchase_id:p.id,receipt_ordinal:ordinal,ordinal:index,ordered_item_ordinal:ordered,...project(i,receiptItems)},['company_id','unit_id','purchase_id','receipt_ordinal','ordinal']);}
  }
 }
 const ids=new Set(records.map(p=>p.id));for(const row of old)if(!ids.has(row.id))store.db.prepare('DELETE FROM commercial_purchases WHERE company_id=? AND unit_id=? AND id=?').run(...args,row.id);
 upsert(store,'commercial_normalizations',{company_id:scope.companyId,unit_id:scope.unitId,aggregate:'purchases',source_revision:revision,normalized_at:new Date().toISOString(),collection_present:Number(Array.isArray(state.purchases))},['company_id','unit_id','aggregate']);
 if(canonical(hydratePurchases(store,scope))!==canonical(records))throw divergence();
}
function normalizePurchases(store,scope,state,revision){store.requireTransaction();validateDatabase(state);if(marker(store,scope,'purchases')){verifyPurchaseMirror(store,scope,state);return false;}syncPurchases(store,scope,state,revision);return true;}
function normalizeAllCommercial(store){return store.transaction(()=>{let normalized=0;for(const row of store.db.prepare('SELECT company_id,unit_id,revision,payload FROM unit_states').all()){const scope={companyId:row.company_id,unitId:row.unit_id},state=JSON.parse(row.payload);normalized+=Number(normalizeProducts(store,scope,state,row.revision))+Number(normalizeCustomers(store,scope,state,row.revision))+Number(normalizeSuppliers(store,scope,state,row.revision))+Number(normalizePurchases(store,scope,state,row.revision))+Number(require('./inventory-store').normalizeInventory(store,scope,state,row.revision))+Number(require('./sales-store').normalizeSales(store,scope,state,row.revision));}return normalized;});}
function verifyCommercialMirror(store,scope,state){return require('./sales-store').verifySalesMirror(store,scope,require('./inventory-store').verifyInventoryMirror(store,scope,verifyPurchaseMirror(store,scope,verifySupplierMirror(store,scope,verifyCustomerMirror(store,scope,verifyProductMirror(store,scope,state))))));}
function queryRevision(store,scope,aggregate='products'){
 const head=store.db.prepare('SELECT revision FROM unit_states WHERE company_id=? AND unit_id=?').get(scope.companyId,scope.unitId),normalized=marker(store,scope,aggregate);
 if(!head){if(normalized)throw divergence();return 0;}
 if(!normalized)throw new AppError(503,'NORMALIZATION_REQUIRED','Catálogo ainda não preparado para consulta.');
 if(normalized.source_revision!==head.revision)throw divergence();
 return head.revision;
}
function queryCustomers(store,scope,options={}){
 require('./scoped-state').assertScope(store,scope);const revision=queryRevision(store,scope,'customers');
 const {page=1,pageSize=50,q='',sort='name',direction='asc',status='all'}=options,sorts={name:'sort_name',date:"coalesce(created_at,'')",code:"coalesce(commercial_id,'')",id:'id'};
 if(!Number.isSafeInteger(page)||page<1||page>1000000||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100||typeof q!=='string'||q.length>120||!Object.hasOwn(sorts,sort)||!['asc','desc'].includes(direction)||!['all','active','inactive'].includes(status))throw new AppError(422,'INVALID_QUERY','Paginação ou filtro inválidos.');
 const params=[scope.companyId,scope.unitId],where=['company_id=?','unit_id=?'];if(status!=='all')where.push(status==='inactive'?'active=0':'(active IS NULL OR active=1)');if(q){where.push("search_text LIKE ? ESCAPE '\\'");params.push('%'+text(q).replace(/[\\%_]/g,'\\$&')+'%');}
 const clause=where.join(' AND '),total=store.db.prepare('SELECT count(*) n FROM commercial_customers WHERE '+clause).get(...params).n;
 const rows=store.db.prepare('SELECT * FROM commercial_customers WHERE '+clause+' ORDER BY '+sorts[sort]+' '+direction.toUpperCase()+',id ASC LIMIT ? OFFSET ?').all(...params,pageSize,(page-1)*pageSize);
 return{items:rows.map(row=>restore(row,customers)),page,pageSize,total,totalPages:Math.ceil(total/pageSize),revision};
}
function getCustomer(store,scope,id){require('./scoped-state').assertScope(store,scope);queryRevision(store,scope,'customers');const row=store.db.prepare('SELECT * FROM commercial_customers WHERE company_id=? AND unit_id=? AND id=?').get(scope.companyId,scope.unitId,id);if(!row)throw new AppError(404,'NOT_FOUND','Cliente não localizado nesta unidade.');return restore(row,customers);}
function querySuppliers(store,scope,options={}){
 require('./scoped-state').assertScope(store,scope);const revision=queryRevision(store,scope,'suppliers');
 const {page=1,pageSize=50,q='',sort='name',direction='asc',status='all'}=options,sorts={name:'sort_name',date:"coalesce(created_at,'')",code:"coalesce(commercial_id,'')",id:'id'};
 if(!Number.isSafeInteger(page)||page<1||page>1000000||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100||typeof q!=='string'||q.length>120||!Object.hasOwn(sorts,sort)||!['asc','desc'].includes(direction)||!['all','active','inactive'].includes(status))throw new AppError(422,'INVALID_QUERY','Paginação ou filtro inválidos.');
 const params=[scope.companyId,scope.unitId],where=['company_id=?','unit_id=?'];if(status!=='all')where.push(status==='inactive'?'active=0':'(active IS NULL OR active=1)');if(q){where.push("search_text LIKE ? ESCAPE '\\'");params.push('%'+text(q).replace(/[\\%_]/g,'\\$&')+'%');}
 const clause=where.join(' AND '),total=store.db.prepare('SELECT count(*) n FROM commercial_suppliers WHERE '+clause).get(...params).n,rows=store.db.prepare('SELECT * FROM commercial_suppliers WHERE '+clause+' ORDER BY '+sorts[sort]+' '+direction.toUpperCase()+',id ASC LIMIT ? OFFSET ?').all(...params,pageSize,(page-1)*pageSize);
 return{items:rows.map(row=>restore(row,suppliers)),page,pageSize,total,totalPages:Math.ceil(total/pageSize),revision};
}
function getSupplier(store,scope,id){require('./scoped-state').assertScope(store,scope);queryRevision(store,scope,'suppliers');const row=store.db.prepare('SELECT * FROM commercial_suppliers WHERE company_id=? AND unit_id=? AND id=?').get(scope.companyId,scope.unitId,id);if(!row)throw new AppError(404,'NOT_FOUND','Fornecedor não localizado nesta unidade.');return restore(row,suppliers);}
function queryProducts(store,scope,options={}){
 require('./scoped-state').assertScope(store,scope);
 const revision=queryRevision(store,scope);
 const {page=1,pageSize=50,q='',sort='name',direction='asc',status='all'}=options;
 const sorts={name:'sort_name',date:"coalesce(created_at,'')",code:"coalesce(code,'')",id:'id'};
 if(!Number.isSafeInteger(page)||page<1||page>1000000||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100||typeof q!=='string'||q.length>120||!Object.hasOwn(sorts,sort)||!['asc','desc'].includes(direction)||!['all','active','inactive'].includes(status))throw new AppError(422,'INVALID_QUERY','Paginação ou filtro inválidos.');
 const params=[scope.companyId,scope.unitId],where=['company_id=?','unit_id=?'];
 if(status!=='all')where.push(status==='inactive'?'active=0':'(active IS NULL OR active=1)');
 if(q){where.push("search_text LIKE ? ESCAPE '\\'");params.push('%'+text(q).replace(/[\\%_]/g,'\\$&')+'%');}
 const clause=where.join(' AND '),total=store.db.prepare('SELECT count(*) n FROM commercial_products WHERE '+clause).get(...params).n;
 const rows=store.db.prepare('SELECT * FROM commercial_products WHERE '+clause+' ORDER BY '+sorts[sort]+' '+direction.toUpperCase()+',id ASC LIMIT ? OFFSET ?').all(...params,pageSize,(page-1)*pageSize);
 return {items:hydratedRows(store,scope,rows),page,pageSize,total,totalPages:Math.ceil(total/pageSize),revision};
}
function lookupProduct(store,scope,code){
 require('./scoped-state').assertScope(store,scope);
 if(typeof code!=='string'||!code.trim()||code.length>120)throw new AppError(422,'INVALID_QUERY','Informe um código válido.');
 if(!queryRevision(store,scope))throw new AppError(404,'NOT_FOUND','Código não localizado nesta unidade.');
 const matches=store.db.prepare(`SELECT p.* FROM commercial_products p WHERE p.company_id=? AND p.unit_id=? AND (lower(trim(p.code))=? OR lower(trim(p.barcode))=? OR EXISTS (SELECT 1 FROM commercial_product_aliases a WHERE a.company_id=p.company_id AND a.unit_id=p.unit_id AND a.product_id=p.id AND (a.active IS NULL OR a.active=1) AND (a.lookup_code=? OR a.lookup_barcode=?)) OR EXISTS (SELECT 1 FROM commercial_product_packages a WHERE a.company_id=p.company_id AND a.unit_id=p.unit_id AND a.product_id=p.id AND (a.active IS NULL OR a.active=1) AND (a.lookup_code=? OR a.lookup_barcode=?))) LIMIT 2`).all(scope.companyId,scope.unitId,...Array(6).fill(key(code)));
 if(matches.length!==1)throw new AppError(matches.length?409:404,matches.length?'AMBIGUOUS_CODE':'NOT_FOUND','Código não localizado de forma única nesta unidade.');
 const product=hydratedRows(store,scope,matches)[0],pack=(product.packages||[]).find(p=>p.active!==false&&(key(p.code)===key(code)||key(p.barcode)===key(code)));
 return {product,...(pack?{packageUnits:pack.factor||pack.units||pack.quantity}:{})};
}
function getProduct(store,scope,id){require('./scoped-state').assertScope(store,scope);queryRevision(store,scope);const rows=store.db.prepare('SELECT * FROM commercial_products WHERE company_id=? AND unit_id=? AND id=?').all(scope.companyId,scope.unitId,id);if(!rows.length)throw new AppError(404,'NOT_FOUND','Produto não localizado nesta unidade.');return hydratedRows(store,scope,rows)[0];}
function verifyCommercialBase(store){
 const scopes=store.db.prepare('SELECT company_id,unit_id,revision,payload FROM unit_states').all();
 const digest=value=>require('node:crypto').createHash('sha256').update(value).digest('hex');
 return {aggregate:'products',aggregates:['products','customers','suppliers','purchases'],units:scopes.map(row=>{const scope={companyId:row.company_id,unitId:row.unit_id},state=JSON.parse(row.payload);if(['products','customers','suppliers','purchases'].some(a=>!marker(store,scope,a)))throw new AppError(503,'NORMALIZATION_REQUIRED','Unidade sem normalização comercial.');verifyCommercialMirror(store,scope,state);return {...scope,revision:row.revision,count:state.products.length,equivalent:true,canonicalSHA256:digest(canonical(state.products)),idsSHA256:digest(JSON.stringify(state.products.map(p=>p.id).sort())),priceCents:state.products.reduce((n,p)=>n+BigInt(p.priceCents),0n).toString(),stockQuantity:state.products.reduce((n,p)=>require('./decimal').add(n,p.stock),'0'),customers:{count:state.customers.length,canonicalSHA256:digest(canonical(state.customers)),idsSHA256:digest(JSON.stringify(state.customers.map(c=>c.id).sort())),equivalent:true},suppliers:{present:Array.isArray(state.suppliers),count:(state.suppliers||[]).length,canonicalSHA256:digest(canonical(state.suppliers||[])),idsSHA256:digest(JSON.stringify((state.suppliers||[]).map(s=>s.id).sort())),equivalent:true},purchases:{present:Array.isArray(state.purchases),count:(state.purchases||[]).length,receipts:(state.purchases||[]).reduce((n,p)=>n+p.receipts.length,0),canonicalSHA256:digest(canonical(state.purchases||[])),totalCents:(state.purchases||[]).reduce((n,p)=>n+BigInt(p.totalCents),0n).toString(),equivalent:true}};})};
}
function verifyCommercial(store){const result=verifyCommercialBase(store);result.aggregates.push('inventory','sales');for(const unit of result.units){if(!marker(store,unit,'inventory')||!marker(store,unit,'sales'))throw new AppError(503,'NORMALIZATION_REQUIRED','Unidade sem normalização do estoque ou vendas.');const state=JSON.parse(store.db.prepare('SELECT payload FROM unit_states WHERE company_id=? AND unit_id=?').get(unit.companyId,unit.unitId).payload);unit.inventory=require('./inventory-store').report(store,unit,state);unit.sales=require('./sales-store').report(store,unit,state);}return result;}
module.exports={normalizeProducts,normalizeAllProducts,syncProducts,hydrateProducts,verifyProductMirror,verifyCommercial,queryProducts,lookupProduct,getProduct,normalizeCustomers,normalizeAllCommercial,syncCustomers,hydrateCustomers,verifyCustomerMirror,verifyCommercialMirror,queryCustomers,getCustomer,normalizeSuppliers,syncSuppliers,hydrateSuppliers,verifySupplierMirror,querySuppliers,getSupplier,normalizePurchases,syncPurchases,hydratePurchases,verifyPurchaseMirror};
