'use strict';
const {AppError}=require('./errors'),{decimal,add,compare,legacyInteger}=require('./decimal');
const {assertScope}=require('./scoped-state');
const canonical=value=>require('./state-repository').canonical(value);
const minus=(a,b)=>add(a,decimal(b)==='0'?'0':decimal(b).startsWith('-')?decimal(b).slice(1):'-'+decimal(b));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const common={id:['id'],productId:['product_id'],productName:['product_name'],quantity:['quantity','quantity'],type:['type'],referenceId:['reference_id'],date:['created_at'],execution:['execution_json','json']};
const maps={stockMovements:{...common,stockAfter:['stock_after','quantity'],purchaseId:['purchase_id'],note:['note']},positionMovements:{...common,from:['from_id'],to:['to_id'],fromName:['from_name'],toName:['to_name'],stockMovementId:['stock_movement_id'],reason:['reason']},stockEntries:{id:['id'],productId:['product_id'],productName:['product_name'],quantity:['quantity','quantity'],requestId:['request_id'],destinationPositionId:['destination_position_id'],note:['note'],date:['created_at']}};
const tables={stockMovements:'commercial_stock_movements',positionMovements:'commercial_position_movements',stockEntries:'commercial_stock_entries'};
function divergence(){return new AppError(500,'COMMERCIAL_DIVERGENCE','Estoque inconsistente; confira uma cópia preservada antes de recuperar.');}
function projection(value,map){
 const row={},extra=Object.create(null),present=[];for(const[c]of Object.values(map))row[c]=null;
 for(const[k,v]of Object.entries(value)){const s=Object.hasOwn(map,k)?map[k]:null;if(s&&v!==undefined&&(v===null||s[1]==='json'||s[1]==='quantity'&&Number.isSafeInteger(v)||!s[1]&&typeof v==='string'&&(k!=='purchaseId'||v!==''))){present.push(k);row[s[0]]=v===null?null:s[1]==='quantity'?decimal(v):s[1]==='json'?JSON.stringify(v):v;}else extra[k]=v;}
 return{...row,present_fields:JSON.stringify(present),extra_json:JSON.stringify(extra)};
}
function restore(row,map){const result=JSON.parse(row.extra_json);for(const k of JSON.parse(row.present_fields)){const s=Object.hasOwn(map,k)?map[k]:null;if(!s)throw divergence();const v=row[s[0]];result[k]=v===null?null:s[1]==='quantity'?legacyInteger(v):s[1]==='json'?JSON.parse(v):v;}if(Object.hasOwn(row,'executed_by')){for(const [column,field]of [['executed_by','executedBy'],['authorized_by','authorizedBy'],['executor_name','executorName'],['authorizer_name','approverName'],['executed_at','executedAt']])if(row[column]!==null&&row[column]!==result.execution?.[field])throw divergence();}return result;}
function marker(store,scope){return store.db.prepare("SELECT * FROM commercial_normalizations WHERE company_id=? AND unit_id=? AND aggregate='inventory'").get(scope.companyId,scope.unitId);}
function revision(store,scope){const head=store.db.prepare('SELECT revision FROM unit_states WHERE company_id=? AND unit_id=?').get(scope.companyId,scope.unitId),m=marker(store,scope);if(!head){if(m)throw divergence();return 0;}if(!m)throw new AppError(503,'NORMALIZATION_REQUIRED','Estoque ainda não preparado.');if(m.source_revision!==head.revision)throw divergence();return head.revision;}
function hydrate(store,scope,kind){return store.db.prepare('SELECT * FROM '+tables[kind]+' WHERE company_id=? AND unit_id=? ORDER BY ordinal').all(scope.companyId,scope.unitId).map(r=>restore(r,maps[kind]));}
function presence(store,scope){const m=marker(store,scope);return m?JSON.parse(store.db.prepare("SELECT value FROM foundation_meta WHERE key=?").get('inventory-presence:'+scope.companyId+':'+scope.unitId)?.value||'{}'):{};}
function verifyInventoryMirror(store,scope,state){
 if(!marker(store,scope))return state;revision(store,scope);const next={...state,products:state.products.map(p=>({...p}))},flags=presence(store,scope);
 for(const[kind]of Object.entries(tables)){const rows=hydrate(store,scope,kind);if(Boolean(flags[kind])!==Array.isArray(state[kind])||canonical(rows)!==canonical(state[kind]||[]))throw divergence();if(flags[kind])next[kind]=rows;}
 const balances=store.db.prepare('SELECT * FROM commercial_stock_balances WHERE company_id=? AND unit_id=?').all(scope.companyId,scope.unitId);
 if(balances.length!==state.products.length)throw divergence();
 const balanceByProductId=new Map();for(const b of balances)if(!balanceByProductId.has(b.product_id))balanceByProductId.set(b.product_id,b);
 const verifiedMovementTotals=new Map();for(const m of next.stockMovements||[])verifiedMovementTotals.set(m.productId,add(verifiedMovementTotals.get(m.productId)??'0',m.quantity));
 for(const p of next.products){const b=balanceByProductId.get(p.id);if(!b||compare(b.quantity,p.stock)!==0)throw divergence();const sum=verifiedMovementTotals.get(p.id)??'0';if(compare(add(b.technical_anchor,sum),b.quantity)!==0)throw divergence();p.stock=legacyInteger(b.quantity);
  const rows=store.db.prepare('SELECT * FROM commercial_position_balances WHERE company_id=? AND unit_id=? AND product_id=? ORDER BY ordinal').all(scope.companyId,scope.unitId,p.id),object=Object.fromEntries(rows.map(r=>[r.position_id,legacyInteger(r.quantity)]));
  if(Boolean(b.positions_present)!==Object.hasOwn(p,'positionBalances')||b.positions_present===2&&p.positionBalances!==null||b.positions_present!==2&&canonical(object)!==canonical(p.positionBalances||{})||b.positions_present===2&&rows.length)throw divergence();if(b.positions_present)p.positionBalances=b.positions_present===2?null:object;
  for(const row of rows){let physical='0';for(const m of next.positionMovements||[])if(m.productId===p.id){if(m.to===row.position_id)physical=add(physical,m.quantity);if(m.from===row.position_id)physical=minus(physical,m.quantity);}if(compare(add(row.technical_anchor,physical),row.quantity)!==0)throw divergence();}
 }
 return next;
}
function syncInventory(store,scope,state,rev){
 store.requireTransaction();const args=[scope.companyId,scope.unitId];
 for(const table of ['commercial_position_movements','commercial_stock_movements','commercial_stock_entries','commercial_position_balances','commercial_stock_balances'])store.db.prepare('DELETE FROM '+table+' WHERE company_id=? AND unit_id=?').run(...args);
 let stockMovementInsert=null;
 try{
 for(const[kind,table]of Object.entries(tables))for(let ordinal=0;ordinal<(state[kind]||[]).length;ordinal++){
  const value=state[kind][ordinal],row={company_id:scope.companyId,unit_id:scope.unitId,ordinal,...projection(value,maps[kind])};
  if(kind!=='stockEntries'){const e=value.execution;for(const[column,field]of [['executed_by','executedBy'],['authorized_by','authorizedBy']])row[column]=typeof e?.[field]==='string'&&store.db.prepare('SELECT 1 FROM unit_memberships WHERE user_id=? AND company_id=? AND unit_id=?').get(e[field],...args)?e[field]:null;row.executor_name=typeof e?.executorName==='string'?e.executorName:null;row.authorizer_name=typeof e?.approverName==='string'?e.approverName:null;row.executed_at=typeof e?.executedAt==='string'?e.executedAt:null;}
  if(kind==='stockMovements'){const p=(state.purchases||[]).find(p=>p.id===value.purchaseId),matches=(p?.receipts||[]).map((r,i)=>({r,i})).filter(({r})=>r.id&&r.id===value.referenceId);row.receipt_ordinal=matches.length===1?matches[0].i:null;row.search_text=norm([value.productName,value.type,value.referenceId].join(' '));row.sort_name=norm(value.productName);}
  const columns=Object.keys(row);
  if(kind==='stockMovements'){
   if(!stockMovementInsert)stockMovementInsert=store.db.prepare('INSERT INTO '+table+'('+columns.join(',')+') VALUES('+columns.map(()=>'?').join(',')+')');
   stockMovementInsert.run(...columns.map(c=>row[c]));
  }else store.db.prepare('INSERT INTO '+table+'('+columns.join(',')+') VALUES('+columns.map(()=>'?').join(',')+')').run(...columns.map(c=>row[c]));
 }
 }finally{
  // Node 24 StatementSync has no public finalize; drop the call-local reference even on failure.
  stockMovementInsert=null;
 }
 const movementTotals=new Map();for(const m of state.stockMovements||[])movementTotals.set(m.productId,add(movementTotals.get(m.productId)??'0',m.quantity));
 for(const p of state.products){const sum=movementTotals.get(p.id)??'0';store.db.prepare('INSERT INTO commercial_stock_balances VALUES(?,?,?,?,?,?)').run(...args,p.id,decimal(p.stock),minus(p.stock,sum),Object.hasOwn(p,'positionBalances')?(p.positionBalances===null?2:1):0);
  let ordinal=0;for(const[id,value]of Object.entries(p.positionBalances||{})){let sum='0';for(const m of state.positionMovements||[])if(m.productId===p.id){if(m.to===id)sum=add(sum,m.quantity);if(m.from===id)sum=minus(sum,m.quantity);}store.db.prepare('INSERT INTO commercial_position_balances VALUES(?,?,?,?,?,?,?)').run(...args,p.id,id,ordinal++,decimal(value),minus(value,sum));}
 }
 store.setMeta('inventory-presence:'+scope.companyId+':'+scope.unitId,JSON.stringify(Object.fromEntries(Object.keys(tables).map(k=>[k,Array.isArray(state[k])]))));
 store.db.prepare("INSERT INTO commercial_normalizations(company_id,unit_id,aggregate,source_revision,normalized_at,collection_present) VALUES(?,?,'inventory',?,?,1) ON CONFLICT(company_id,unit_id,aggregate) DO UPDATE SET source_revision=excluded.source_revision,normalized_at=excluded.normalized_at").run(...args,rev,new Date().toISOString());
 // Snapshot revision is committed later; equivalence is checked by the enclosing repository.
}
function normalizeInventory(store,scope,state,rev){store.requireTransaction();if(marker(store,scope)){verifyInventoryMirror(store,scope,state);return false;}syncInventory(store,scope,state,rev);return true;}
function originExists(state,m){const ref=m.referenceId,lists={sale:'sales',cancel:'sales',entry:'stockEntries',inventory:'inventories',quarantine:'quarantineEntries',quarantineRelease:'quarantineEntries',supplierReturn:'supplierReturns',supplierReturnBack:'supplierReturns',transfer:'transfers'};
 const sign=compare(m.quantity,0);if(['sale','quarantine'].includes(m.type)&&sign>=0||['entry','purchase','cancel','return','quarantineRelease','supplierReturnBack'].includes(m.type)&&sign<=0||m.type==='supplierReturn'&&sign>=0||m.type==='initial'&&sign<0)return false;
 if(m.type==='initial')return ref===m.productId;
 if(m.type==='purchase')return(state.purchases||[]).some(p=>(!m.purchaseId||p.id===m.purchaseId)&&(p.receipts||[]).some(r=>r.id===ref&&r.items.some(i=>i.productId===m.productId)));
 if(m.type==='return')return state.sales.some(s=>(s.returns||[]).some(r=>r.id===ref&&r.items.some(i=>i.productId===m.productId)));
 return Boolean(lists[m.type]&&(state[lists[m.type]]||[]).some(r=>r.id===ref&&(r.productId===m.productId||(r.items||[]).some(i=>i.productId===m.productId))));
}
function assertStockTransition(before,next){
 const fresh={};for(const kind of Object.keys(tables)){const old=before[kind]||[],rows=next[kind]||[];if(rows.length<old.length||old.some((record,index)=>canonical(rows[index])!==canonical(record)))throw new AppError(409,'STOCK_HISTORY_IMMUTABLE','Histórico de estoque não pode ser alterado, reordenado ou apagado.');fresh[kind]=rows.slice(old.length);}
 const running=new Map(before.products.map(p=>[p.id,decimal(p.stock)]));
 for(const m of fresh.stockMovements){const balance=add(running.get(m.productId)||'0',m.quantity);if(m.stockAfter===null||m.stockAfter===undefined||compare(balance,m.stockAfter)!==0)throw new AppError(409,'STOCK_HISTORY_BALANCE','Saldo após a movimentação não corresponde ao histórico.');running.set(m.productId,balance);if(!originExists(next,m)||m.type==='initial'&&before.products.some(p=>p.id===m.productId))throw new AppError(422,'STOCK_ORIGIN_REQUIRED','Movimentação exige uma origem e produto correspondentes nesta unidade.');}
 for(const m of fresh.positionMovements){const parent=m.stockMovementId&&fresh.stockMovements.find(s=>s.id===m.stockMovementId&&s.productId===m.productId),transfer=m.type==='transfer'&&(next.transfers||[]).find(t=>t.id===m.referenceId&&t.confirmedAt&&t.from===m.from&&t.to===m.to&&t.items.some(i=>i.productId===m.productId&&compare(i.quantity,m.quantity)===0));if(compare(m.quantity,0)<=0||!transfer&&(!parent||parent.type!==m.type||parent.referenceId!==m.referenceId||compare(parent.quantity,0)<0&&m.to!==null||compare(parent.quantity,0)>0&&m.from!==null))throw new AppError(422,'STOCK_ORIGIN_REQUIRED','Movimentação física exige origem nova e correspondente nesta operação.');}
 for(const parent of fresh.stockMovements){const rows=fresh.positionMovements.filter(m=>m.stockMovementId===parent.id);if(rows.length&&compare(rows.reduce((n,m)=>add(n,m.quantity),'0'),compare(parent.quantity,0)<0?minus(0,parent.quantity):parent.quantity)!==0)throw new AppError(409,'POSITION_HISTORY_REQUIRED','Distribuição física difere da movimentação global.');}
 const ids=new Set([...before.products,...next.products].map(p=>p.id));
 for(const id of ids){const a=before.products.find(p=>p.id===id),b=next.products.find(p=>p.id===id);let sum='0';for(const m of fresh.stockMovements)if(m.productId===id)sum=add(sum,m.quantity);if(compare(minus(b?.stock||0,a?.stock||0),sum)!==0)throw new AppError(409,'STOCK_HISTORY_REQUIRED','Alteração de saldo exige movimentações correspondentes.');
  for(const position of new Set([...Object.keys(a?.positionBalances||{}),...Object.keys(b?.positionBalances||{})])){let sum='0';for(const m of fresh.positionMovements)if(m.productId===id){if(m.to===position)sum=add(sum,m.quantity);if(m.from===position)sum=minus(sum,m.quantity);}if(compare(minus(b?.positionBalances?.[position]||0,a?.positionBalances?.[position]||0),sum)!==0)throw new AppError(409,'POSITION_HISTORY_REQUIRED','Alteração de distribuição exige movimentações físicas correspondentes.');}
 }
}
function query(store,scope,options,kind){
 assertScope(store,scope);const rev=revision(store,scope),{page=1,pageSize=50,q='',sort='name',direction='asc',status='all'}=options||{};
 if(!Number.isSafeInteger(page)||page<1||page>1000000||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100||typeof q!=='string'||q.length>120||!['name','date','code','id'].includes(sort)||!['asc','desc'].includes(direction)||!['active','inactive','all'].includes(status))throw new AppError(422,'INVALID_QUERY','Consulta inválida.');
 const inventory=kind==='inventory',table=inventory?'commercial_products p JOIN commercial_stock_balances b ON b.company_id=p.company_id AND b.unit_id=p.unit_id AND b.product_id=p.id':'commercial_stock_movements p',order={name:'p.sort_name',date:'p.created_at',code:inventory?'p.code':'p.type',id:'p.id'},where=['p.company_id=?','p.unit_id=?'],params=[scope.companyId,scope.unitId];
 if(status!=='all')where.push(inventory?(status==='active'?'(p.active IS NULL OR p.active=1)':'p.active=0'):(status==='inactive'?'0':'1'));
 if(q){where.push("p.search_text LIKE ? ESCAPE '\\'");params.push('%'+norm(q).replace(/[\\%_]/g,'\\$&')+'%');}
 const clause=where.join(' AND '),total=store.db.prepare('SELECT count(*) n FROM '+table+' WHERE '+clause).get(...params).n;
 const rows=store.db.prepare('SELECT '+(inventory?'p.id,p.name,p.code,p.unit,p.measure_unit,p.active,p.version,b.quantity':'p.*')+' FROM '+table+' WHERE '+clause+' ORDER BY coalesce('+order[sort]+",'') "+direction.toUpperCase()+',p.id ASC LIMIT ? OFFSET ?').all(...params,pageSize,(page-1)*pageSize);
 return{items:rows.map(r=>inventory?{id:r.id,name:r.name,code:r.code,unit:r.unit,measureUnit:r.measure_unit,active:r.active===null?undefined:Boolean(r.active),version:r.version,stock:legacyInteger(r.quantity)}:restore(r,maps.stockMovements)),page,pageSize,total,totalPages:Math.ceil(total/pageSize),revision:rev};
}
function report(store,scope,state){verifyInventoryMirror(store,scope,state);return{equivalent:true,balances:state.products.length,movements:(state.stockMovements||[]).length,positionMovements:(state.positionMovements||[]).length,entries:(state.stockEntries||[]).length,technicalAnchors:store.db.prepare("SELECT count(*) n FROM commercial_stock_balances WHERE company_id=? AND unit_id=? AND technical_anchor<>'0'").get(scope.companyId,scope.unitId).n};}
module.exports={syncInventory,normalizeInventory,verifyInventoryMirror,assertStockTransition,queryInventory:(s,c,o)=>query(s,c,o,'inventory'),queryStockMovements:(s,c,o)=>query(s,c,o,'movements'),report};
