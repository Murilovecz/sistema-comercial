const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const {productFields,optional,movement,dueDate,expense,cancelExpense,company}=require('./domain');
const {exportCsv}=require('./export');
const {moneyCents}=require('./money');
const {receive}=require('./payments');
const {supplierAction,purchaseAction}=require('./purchases');
const {payableAction}=require('./payables');
const {discountTotals}=require('./public/discount-core');

const {catalogVersion,audit}=require('./audit');
const {quoteAction,activeAction}=require('./quotes');
const {isActive}=require('./public/quotes-core');
const {inventoryAction,returnAction,reservationAction}=require('./workflows');
const {availableQuantity}=require('./public/workflow-core');
const {catalogAction}=require('./catalog');const {accountAction}=require('./accounts');const {taskAction}=require('./tasks');
const {pricingAction,validatedOffer}=require('./pricing');
const {quarantineAction}=require('./quarantine');const {supplierReturnAction}=require('./supplier-returns');
const {budgetAction}=require('./budgets');
const {supplierQuoteAction}=require('./supplier-quotes');
const {deliveryAction}=require('./deliveries');
const {storeCreditAction,consumeCredits,creditCancel}=require('./store-credits');
const {cashAction,linkReceipt,assertCashState,validateKey}=require('./cash');
function amount(value) { const n = Number(value); if (!Number.isFinite(n) || n < 0) throw Error('Informe um valor válido.'); return n; }
function sale(state, input, trustedQuote=null, approvalProof=null) {
  validateKey(input.requestId);
  const fingerprint=createHash('sha256').update(JSON.stringify({customerId:input.customerId||'',paymentMethod:input.paymentMethod,paymentStatus:input.paymentStatus,dueDate:input.dueDate||'',items:input.items,discount:input.discount||'0',discountReason:input.discountReason||'',priceListId:input.priceListId,promotionChoices:input.promotionChoices,expectedOffer:input.expectedOffer,offerReason:input.offerReason,allowPromotionDiscount:input.allowPromotionDiscount,storeCreditValue:input.storeCreditValue,checkoutPayments:input.checkoutPayments,allowPending:input.allowPending,pos:input.pos,sourcePositionId:input.sourcePositionId})).digest('hex');
  const previous=input.requestId&&state.sales.find(s=>s.requestId===input.requestId);
  if(previous){if(previous.requestFingerprint&&previous.requestFingerprint!==fingerprint)throw Error('Esta confirmação já foi usada com outros dados. Atualize a venda antes de tentar novamente.');return structuredClone(state);}
  assertCashState(state,input.expectedCashSessionId);
  if (!['cash','pix','debit','credit','other'].includes(input.paymentMethod)) throw Error('Selecione uma forma de pagamento válida.');
  if (!['received','pending'].includes(input.paymentStatus)) throw Error('Selecione a situação do pagamento.');
  if (!Array.isArray(input.items) || !input.items.length) throw Error('Adicione pelo menos um produto.');
  if (input.customerId && !isActive(state.customers.find(c => c.id === input.customerId))) throw Error('Cliente inexistente ou inativo.');
  const allowInactive=p=>approvalProof&&require('./foundation/inactive-sale-approval').isInactiveApproved(approvalProof,p);
  const offer=trustedQuote?null:validatedOffer(state,input,null,allowInactive);
  const next = structuredClone(state), quantities = new Map();
  for (const item of input.items) { const q = Number(item.quantity); if (!Number.isSafeInteger(q) || q < 1) throw Error('Quantidade inválida.'); quantities.set(item.productId, (quantities.get(item.productId) || 0) + q); }
  const items = [...quantities].map(([id, quantity]) => {
    const p = next.products.find(p => p.id === id);
    if (!p||!isActive(p)&&!allowInactive(p)) throw Error('Produto inexistente ou inativo.');
    const offered=offer?.items.find(i=>i.productId===id);
    if(itemPriceChanged(input.items,id,trustedQuote?.items.find(i=>i.productId===id)?.priceCents??offered?.priceCents??p.priceCents))throw Error(`O preço de ${p.name} mudou. Atualize e revise a venda novamente.`);
    if (availableQuantity(next,p) < quantity) throw Error(`Estoque insuficiente (saldo disponível): ${p.name}.`);
    p.stock -= quantity;
    const saved=trustedQuote?.items.find(i=>i.productId===id);
    return { ...(saved||offered||{}), productId: id, name: saved?.name||p.name, quantity, priceCents: saved?.priceCents??offered?.priceCents??p.priceCents,packages:require('./catalogue-next').packagingSnapshot(p,saved||{...input.items.find(i=>i.productId===id),quantity},!!saved),...(p.active===false?{inactiveAtSale:true}:{}),...(input.items.find(i=>i.productId===id)?.substitutedFrom?{substitutedFrom:require('./catalogue-next').catalogueReference(next,input.items.find(i=>i.productId===id).substitutedFrom)}:{}) };
  });
  const subtotalCents=items.reduce((n,i)=>n+i.priceCents*i.quantity,0),pricing=discountTotals(subtotalCents,trustedQuote?String((trustedQuote.discountCents||0)/100):input.discount||'0',trustedQuote?.discountReason||input.discountReason||''),totalCents=pricing.totalCents;
  if (!Number.isSafeInteger(totalCents)) throw Error('Valor da venda muito alto.');
  const date = new Date().toISOString();
  const created={ id: randomUUID(), dueDate:dueDate(input), requestFingerprint:fingerprint, requestId: input.requestId || null, customerId:input.customerId||null, paymentMethod: input.paymentMethod, paymentStatus: input.paymentStatus, receivedAt: input.paymentStatus === 'received' ? date : null, date, customerName: trustedQuote?.customerName || next.customers.find(c => c.id === input.customerId)?.name || 'Consumidor final', items, ...pricing };
  if(offer||trustedQuote?.negotiation)created.negotiation=structuredClone(offer||trustedQuote.negotiation);
  consumeCredits(next,created,input,date);
  const actualCents=totalCents-(created.storeCreditCents||0);
  if(!actualCents)created.paymentStatus='received';
  created.receipts=input.paymentStatus==='received'&&actualCents>0?[{id:randomUUID(),saleId:created.id,requestId:null,amountCents:actualCents,paymentMethod:input.paymentMethod,date,cashSessionId:null}]:[];
  require('./checkout').applyCheckout(created,input,date);
  next.sales.push(created);for(const r of created.receipts)linkReceipt(next,created,r);for(const item of items){movement(next,next.products.find(p=>p.id===item.productId),-item.quantity,'sale',created.id,'',date);if(item.inactiveAtSale)next.stockMovements.at(-1).inactiveAtSale=true;}
  return next;
}
function itemPriceChanged(items,id,priceCents){return items.some(i=>i.productId===id&&i.priceCents!==undefined&&i.priceCents!==priceCents);}
function dispatchLegacy(req,res,rawBody,store,ctx,preparedExports){
  let {state:db,revision}=require('./foundation/scoped-state').loadState(store,ctx);
  function json(status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
  function body(limit){if(rawBody.length>limit)throw Error('Dados muito grandes.');return rawBody;}
  function save(next,input={}){const result=require('./foundation/state-repository').saveBusinessState(store,ctx,db,next,revision,input,req.url);db=result.state;revision=result.revision;}
  function scopedExport(kind,ids){const collection=db[kind==='discounts'?'sales':kind];if(Array.isArray(collection)&&Array.isArray(ids)&&ids.some(id=>!collection.some(row=>row.id===id)))throw new (require('./foundation/errors').AppError)(404,'NOT_FOUND','Registro não encontrado nesta unidade.');return exportCsv(db,kind,ids);}
    if(req.method==='POST'&&/^\/api\/next\/(packages|aliases|families|positions|transfers|purchaseAmendments|purchaseConferences|purchaseOccurrences|agreements|recurringModels|recurringOccurrences|procedures|procedureExecutions|priceReviews)\/[a-z]+$/.test(req.url)){const raw=body(250000);const [, , ,kind,action]=req.url.split('/'),input=JSON.parse(raw),result=kind==='priceReviews'?require('./price-reviews').priceReviewAction(db,action,input):['procedures','procedureExecutions'].includes(kind)?require('./procedures').procedureAction(db,kind,action,input):['recurringModels','recurringOccurrences'].includes(kind)?require('./recurring').recurringAction(db,kind,action,input):kind==='agreements'?require('./agreements').agreementAction(db,action,input):['purchaseAmendments','purchaseConferences','purchaseOccurrences'].includes(kind)?require('./purchase-next').purchaseNext(db,kind,action,input):['positions','transfers'].includes(kind)?require('./positions').positionAction(db,kind,action,input):require('./catalogue-next').catalogueNext(db,kind,action,input);save(result,input);return json(201,db);}
    if(req.method==='POST'&&/^\/api\/advanced\/(priceLists|promotions|pricing|quarantineEntries|supplierReturns|storeCredits|deliveries|supplierQuotes|expenseCenters|expenseBudgets)\/[a-z]+$/.test(req.url)){
      const raw=body(250000);
      const parts=req.url.split('/'),input=JSON.parse(raw),result=['expenseCenters','expenseBudgets'].includes(parts[3])?budgetAction(db,parts[3],parts[4],input):parts[3]==='supplierQuotes'?supplierQuoteAction(db,parts[4],input):parts[3]==='deliveries'?deliveryAction(db,parts[4],input):parts[3]==='storeCredits'?storeCreditAction(db,parts[4],input):parts[3]==='quarantineEntries'?quarantineAction(db,parts[4],input):parts[3]==='supplierReturns'?supplierReturnAction(db,parts[4],input):pricingAction(db,parts[3],parts[4],input);if(parts[3]==='pricing')return json(200,result);save(result,input);return json(201,db);
    }
    if(req.method==='POST'&&/^\/api\/business\/(catalog|accounts|tasks)\/(metadata|bulk|plan|receive|allocate|forgive|create|edit|complete|reopen|cancel|hide|restore)$/.test(req.url)){const raw=body(250000);const parts=req.url.split('/'),handlers={catalog:catalogAction,accounts:accountAction,tasks:taskAction};save(handlers[parts[3]](db,parts[4],JSON.parse(raw)));return json(201,db);}
    if(req.method==='POST'&&/^\/api\/workflows\/(inventory|returns|reservations)\/(create|add|count|choose|rebase|apply|cancel|refund|edit|renew|convert|collect|reopen|close|recount)$/.test(req.url)){const raw=body(250000);const parts=req.url.split('/'),input=JSON.parse(raw),handlers={inventory:inventoryAction,returns:returnAction,reservations:reservationAction};save(handlers[parts[3]](db,parts[4],input,sale),input);return json(201,db);}
    if(req.method==='POST'&&/^\/api\/payables\/(create|edit|pay|link|cancel)$/.test(req.url)){const raw=body(100000);save(payableAction(db,req.url.split('/').at(-1),JSON.parse(raw)));return json(201,db);}
    if(req.method==='POST'&&(/^\/api\/suppliers\/(create|edit|active)$/.test(req.url)||/^\/api\/purchases\/(create|edit|confirm|receive|close|reschedule)$/.test(req.url))){
      const raw=body(100000);
      const input=JSON.parse(raw),parts=req.url.split('/');save(parts[2]==='suppliers'?supplierAction(db,parts[3],input):purchaseAction(db,parts[3],input),input);return json(201,db);
    }
    if(req.method==='POST'&&(/^\/api\/quotes\/(create|edit|prices|cancel|convert)$/.test(req.url)||/^\/api\/(products|customers)\/active$/.test(req.url))){
      const raw=body(100000);
      const input=JSON.parse(raw),parts=req.url.split('/');
      save(parts[2]==='quotes'?quoteAction(db,parts[3],input,sale):activeAction(db,parts[2],input));return json(201,db);
    }
    if (req.url === '/api/state' && req.method === 'GET') return json(200, db);
    if(req.method==='GET'&&req.url.startsWith('/api/cash/export?')){
      const id=new URL(req.url,'http://localhost').searchParams.get('id'),c=(db.cashSessions||[]).find(c=>c.id===id);if(!c)throw Error('Caixa não encontrado.');
      res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Cache-Control':'no-store','Content-Disposition':'attachment; filename="caixa-'+c.id+'.csv"'});return res.end(require('./cash-report').cashReport(c));
    }
    if(req.method==='POST'&&req.url==='/api/exports'){
      const raw=body(100000);
      const input=JSON.parse(raw),result=scopedExport(input.kind,input.ids);
      for(const [key,item] of preparedExports)if(item.expires<Date.now())preparedExports.delete(key);
      if(preparedExports.size>=20)preparedExports.delete(preparedExports.keys().next().value);
      const token=randomUUID();preparedExports.set(token,{...result,sessionId:ctx.sessionId,companyId:ctx.companyId,unitId:ctx.unitId,expires:Date.now()+300000});return json(201,{url:'/api/exports/'+token});
    }
    if(req.method==='GET'&&req.url.startsWith('/api/exports/')){
      const result=preparedExports.get(req.url.slice('/api/exports/'.length));
      if(!result||result.expires<Date.now()||result.sessionId!==ctx.sessionId||result.companyId!==ctx.companyId||result.unitId!==ctx.unitId)return json(404,{error:'Exportação expirou. Prepare o arquivo novamente.'});
      res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Cache-Control':'no-store','Content-Disposition':'attachment; filename="'+result.filename+'"'});return res.end(result.body);
    }
    if(req.method==='POST'&&/^\/api\/cash\/(open|supply|withdraw|refund|close)$/.test(req.url)){
      const raw=body(100000);
      save(cashAction(db,req.url.split('/').at(-1),JSON.parse(raw)));return json(201,db);
    }
    if(req.method==='GET'&&req.url.startsWith('/api/export?')){
      const params=new URL(req.url,'http://localhost').searchParams;
      const result=scopedExport(params.get('kind'),params.getAll('id'));
      res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="'+result.filename+'"'});
      return res.end(result.body);
    }
    if(['/api/expenses','/api/expenses/cancel','/api/company'].includes(req.url)&&req.method==='POST'){
      const raw=body(100000);const input=JSON.parse(raw);save(req.url==='/api/expenses'?expense(db,input):req.url==='/api/company'?company(db,input):cancelExpense(db,input.id));return json(201,db);
    }
    if (req.method === 'POST' && ['/api/products', '/api/customers', '/api/sales', '/api/products/edit', '/api/customers/edit', '/api/stock', '/api/sales/cancel', '/api/sales/receive'].includes(req.url)) {
      const raw=body(100000);
      const input = JSON.parse(raw);
      if (['/api/products/edit', '/api/customers/edit', '/api/stock', '/api/sales/cancel', '/api/sales/receive'].includes(req.url)) save(change(db, req.url, input),input);
      else if (req.url === '/api/sales') {
        // Reuse the validated, canonical commercial draft fingerprint. This boundary
        // owns external sale intents; quote/reservation conversions retain their guards.
        const draft=require('./foundation/inactive-sale-approval').draftFingerprint(input);
        const fingerprint='legacy-sale-v1:'+createHash('sha256').update(require('./foundation/state-repository').canonical({companyId:ctx.companyId,unitId:ctx.unitId,userId:ctx.userId,draft})).digest('hex');
        const previous=db.sales.find(s=>s.requestId===input.requestId);
        if(previous){
          if(previous.requestFingerprint!==fingerprint)throw new (require('./foundation/errors').AppError)(409,'REPLAY_CHANGED','Esta confirmação já foi usada com outros dados, contexto ou sem prova completa. Consulte a venda registrada antes de tentar novamente.');
          return json(201,db);
        }
        const next=sale(db,input);
        next.sales.find(s=>s.requestId===input.requestId).requestFingerprint=fingerprint;
        save(next,input);
      }
      else save(require('./catalog-registration').createCatalogRecord(db,req.url==='/api/products'?'products':'customers',input));
      return json(201, db);
    }

  throw new (require('./foundation/errors').AppError)(404,'NOT_FOUND','Operação não encontrada.');
}
function serveStatic(req,res){
 function json(status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
    if (req.method !== 'GET') return json(404, { error: 'Página não encontrada.' });
    if (req.url === '/branding-core.mjs') {
      res.writeHead(200, {'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store'});
      return res.end(fs.readFileSync(path.join(__dirname, 'shared', 'branding-core.mjs')));
    }
    if (req.url === '/branding-ui.js' || req.url === '/branding.css') {
      res.writeHead(200, {'Content-Type': (req.url.endsWith('.css') ? 'text/css' : 'text/javascript') + '; charset=utf-8', 'Cache-Control': 'no-store'});
      return res.end(fs.readFileSync(path.join(__dirname, 'public', req.url.slice(1))));
    }
    const pages = { '/positions-core.js':['positions-core.js','text/javascript'], '/next-ui-common.js':['next-ui-common.js','text/javascript'], '/catalogue-next-ui.js':['catalogue-next-ui.js','text/javascript'], '/checkout-core.js':['checkout-core.js','text/javascript'], '/checkout-ui.js':['checkout-ui.js','text/javascript'], '/workstation-core.js':['workstation-core.js','text/javascript'], '/workstation-ui.js':['workstation-ui.js','text/javascript'], '/advanced-analytics.js':['advanced-analytics.js','text/javascript'], '/analytics-ui.js':['analytics-ui.js','text/javascript'], '/budget-core.js':['budget-core.js','text/javascript'], '/budget-ui.js':['budget-ui.js','text/javascript'], '/supplier-quote-core.js':['supplier-quote-core.js','text/javascript'], '/supplier-quote-ui.js':['supplier-quote-ui.js','text/javascript'], '/delivery-core.js':['delivery-core.js','text/javascript'], '/delivery-ui.js':['delivery-ui.js','text/javascript'], '/store-credit-core.js':['store-credit-core.js','text/javascript'], '/store-credit-ui.js':['store-credit-ui.js','text/javascript'], '/quarantine-core.js':['quarantine-core.js','text/javascript'], '/supplier-return-core.js':['supplier-return-core.js','text/javascript'], '/quarantine-ui.js':['quarantine-ui.js','text/javascript'], '/pricing-core.js':['pricing-core.js','text/javascript'], '/pricing-ui.js':['pricing-ui.js','text/javascript'], '/experience-ui.js':['experience-ui.js','text/javascript'], '/accounts-core.js':['accounts-core.js','text/javascript'], '/business-core.js':['business-core.js','text/javascript'], '/business-ui.js':['business-ui.js','text/javascript'], '/accounts-ui.js':['accounts-ui.js','text/javascript'], '/tasks-ui.js':['tasks-ui.js','text/javascript'], '/manager-ui.js':['manager-ui.js','text/javascript'], '/workflow-core.js':['workflow-core.js','text/javascript'], '/workflows-ui.js':['workflows-ui.js','text/javascript'], '/reservations-ui.js':['reservations-ui.js','text/javascript'], '/product-lookup.js':['product-lookup.js','text/javascript'], '/scanner-ui.js':['scanner-ui.js','text/javascript'], '/navigation.js':['navigation.js','text/javascript'], '/payables-core.js':['payables-core.js','text/javascript'], '/discount-core.js':['discount-core.js','text/javascript'], '/replenishment-core.js':['replenishment-core.js','text/javascript'], '/payables-ui.js':['payables-ui.js','text/javascript'], '/planning-ui.js':['planning-ui.js','text/javascript'], '/money.js':['money.js','text/javascript'], '/purchases-core.js':['purchases-core.js','text/javascript'], '/purchases-ui.js':['purchases-ui.js','text/javascript'], '/quotes-core.js':['quotes-core.js','text/javascript'], '/quotes-ui.js':['quotes-ui.js','text/javascript'], '/catalog-ui.js':['catalog-ui.js','text/javascript'], '/': ['index.html', 'text/html'], '/cash-core.js':['cash-core.js','text/javascript'], '/cash-ui.js':['cash-ui.js','text/javascript'], '/expenses-ui.js':['expenses-ui.js','text/javascript'], '/payments.js':['payments.js','text/javascript'], '/operations.js':['operations.js','text/javascript'], '/reports.js':['reports.js','text/javascript'], '/store.js':['store.js','text/javascript'], '/startup.js':['startup.js','text/javascript'], '/finance.js': ['finance.js','text/javascript'], '/app.js': ['app.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
    for(const name of ['foundation-operations','foundation-experience','commercial-ui','foundation-storage','foundation-ui','scan-next-ui','positions-ui','inventory-next-ui','purchase-next-ui','agreements-core','agreements-ui','recurring-core','recurring-ui','procedures-ui','price-review-core','price-reviews-ui','round10-ui'])pages['/'+name+'.js']=[name+'.js','text/javascript'];
    const page = pages[req.url]; if (!page) return json(404, { error: 'Página não encontrada.' });
    res.writeHead(200, { 'Content-Type': page[1] + '; charset=utf-8' }); res.end(fs.readFileSync(path.join(__dirname, 'public', page[0])));

}
function serveFrontendSpa(req,res,frontendDev=false){
 const unavailable=status=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:status===503?'Interface indisponível. Gere o build antes de abrir.':'Página não encontrada.'}));};
 if(req.method!=='GET')return unavailable(404);
 let pathname;
 try{pathname=decodeURIComponent(req.url.split('?')[0]);}catch{return unavailable(404);}
 // Decode once; reject ambiguous Windows paths, control characters and dot segments.
 if(/[\\%:#?\x00-\x1f\x7f]/.test(pathname))return unavailable(404);
 if(pathname==='/ui'){res.writeHead(308,{'Location':'/ui/','Cache-Control':'no-store'});return res.end();}
 const entry=pathname==='/ui/'||pathname==='/ui/appearance';
 if(entry&&frontendDev){
  let html;
  try{html=fs.readFileSync(path.join(__dirname,'frontend','index.html'),'utf8');}catch{return unavailable(503);}
  const marker='<script type="module" src="/src/main.tsx"></script>';
  if(!html.includes(marker))return unavailable(503);
  const vite='http://127.0.0.1:5173/ui/';
  // Official React Refresh preamble for HTML served by a backend, before Vite/entry.
  const scripts=`<script type="module">
      import RefreshRuntime from '${vite}@react-refresh';
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <script type="module" src="${vite}@vite/client"></script>
    <script type="module" src="${vite}src/main.tsx"></script>`;
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(html.replace(marker,scripts));
 }
 const types={'.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf'};
 const relative=entry?'index.html':pathname.slice('/ui/'.length);
 const type=entry?'text/html; charset=utf-8':types[path.extname(relative)];
 if(!entry&&(!pathname.startsWith('/ui/assets/')||!type||relative.split('/').some(part=>!part||part.startsWith('.'))))return unavailable(404);
 const root=path.join(__dirname,'frontend','dist'),filename=path.resolve(root,relative);
 const inside=target=>{const local=path.relative(root,target);return local!==''&&local!=='..'&&!local.startsWith('..'+path.sep)&&!path.isAbsolute(local);};
 if(!inside(filename))return unavailable(404);
 let body;
 try{
  // Physical containment also rejects symlinks/junctions leading outside dist.
  if(path.relative(root,fs.realpathSync(root))!=='')return unavailable(404);
  const actual=fs.realpathSync(filename);
  if(!inside(actual)||!fs.statSync(actual).isFile())return unavailable(404);
  body=fs.readFileSync(actual);
 }catch{return unavailable(entry?503:404);}
 // No manifest proves content hashes yet; keep the existing conservative cache policy.
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);
}
function bufferedResponse(){return {status:200,headers:{},payload:null,writeHead(status,headers){this.status=status;this.headers=headers;},end(value){this.payload=value;},flush(res){res.writeHead(this.status,this.headers);res.end(this.payload);}};}
function createServer(options={}){
 const frontendMode=options.frontendDev===undefined?process.env.FRONTEND_DEV:options.frontendDev;
 if(![undefined,'0','1'].includes(frontendMode))throw Error('FRONTEND_DEV deve ser 0 ou 1; ausência usa o build estático.');
 const frontendDev=frontendMode==='1';
 const runtime=require('./foundation/runtime').createRuntime(options),{store,identity}=runtime,preparedExports=new Map();
 const server=http.createServer(async(req,res)=>{
  function json(status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');
  try{
   identity.checkHost(req);
   const rawPath=req.url.split('?')[0];
   // Claim the raw /ui boundary before URL normalization can collapse traversal into /api.
   if(rawPath==='/ui'||rawPath.startsWith('/ui/')||rawPath.startsWith('/ui\\'))return serveFrontendSpa(req,res,frontendDev);
   const pathname=new URL(req.url,'http://local').pathname;
   if(pathname==='/api/health'&&req.method==='GET')return json(200,{ready:true,local:true,version:require('./package.json').version});
   if(!pathname.startsWith('/api/'))return serveStatic(req,res);
   const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>1048576)throw new (require('./foundation/errors').AppError)(413,'BODY_TOO_LARGE','Dados muito grandes.');chunks.push(chunk);}let raw=Buffer.concat(chunks).toString('utf8');
   if(await identity.handle(req,res,raw))return;
   const branding=require('./foundation/organization-branding').handleBranding(runtime,req,raw);if(branding)return json(branding.status,branding.value);
   const administrative=await require('./foundation/admin').handleAdmin(runtime,req,raw);if(administrative)return json(administrative.status,administrative.value);
   const registration=require('./foundation/commercial-registration').handleRegistration(runtime,req,raw,{change});if(registration)return json(registration.status,registration.value);
   const commercialWrite=await require('./foundation/commercial-write').handleCommercialWrite(runtime,req,raw,{sale});if(commercialWrite)return json(commercialWrite.status,commercialWrite.value);
   if(req.method==='GET'&&pathname.startsWith('/api/commercial/')){
    const value=store.transaction(()=>require('./foundation/commercial-read').readCommercial(store,require('./foundation/request-context').requestContext(identity,req),req.url));return json(200,value);
   }
   if(req.method==='POST'){
    let input;try{input=JSON.parse(raw);}catch{throw new (require('./foundation/errors').AppError)(400,'INVALID_JSON','Dados inválidos.');}
    if(!input||typeof input!=='object'||Array.isArray(input))throw new (require('./foundation/errors').AppError)(422,'INVALID_INPUT','Dados inválidos.');
    // Compatibility: this legacy field identifies the cash document, never the login session.
    if(/^\/api\/cash\/(close|supply|withdraw|refund)$/.test(pathname)&&Object.hasOwn(input,'sessionId')){
     if(Object.hasOwn(input,'cashSessionId'))throw new (require('./foundation/errors').AppError)(422,'AMBIGUOUS_CASH_SESSION','Informe apenas um identificador do Caixa.');
     input.cashSessionId=input.sessionId;delete input.sessionId;
    }
    require('./foundation/authorization').rejectClientAuthority(input);
    // Legacy responsible fields are display metadata. The verified executor is always server-owned.
    const ctx=require('./foundation/request-context').requestContext(identity,req,{write:true});
    if(pathname==='/api/products'&&Number(input.stock)>0)require('./foundation/identity').requirePermission(ctx,'inventory.adjust');
    input.responsible=ctx.user.name;raw=JSON.stringify(input);
   }
   const buffered=bufferedResponse();
   store.transaction(()=>{const ctx=require('./foundation/request-context').requestContext(identity,req,{write:req.method!=='GET'});require('./foundation/authorization').authorizeLegacy(ctx,req.method,req.url);
    if(['/api/export','/api/cash/export'].includes(pathname)){const params=new URL(req.url,'http://local').searchParams;if((params.has('expectedCompanyId')||params.has('expectedUnitId'))&&(params.get('expectedCompanyId')!==ctx.companyId||params.get('expectedUnitId')!==ctx.unitId))throw new (require('./foundation/errors').AppError)(409,'CONTEXT_CHANGED','A empresa ou unidade mudou. Prepare a exportação novamente.');}
    if(pathname==='/api/products'&&req.method==='POST'&&Number(JSON.parse(raw).stock)>0)require('./foundation/identity').requirePermission(ctx,'inventory.adjust');
    dispatchLegacy(req,buffered,raw,store,ctx,preparedExports);});
   buffered.flush(res);
  }catch(error){
   const{AppError}=require('./foundation/errors');
   if(error instanceof AppError)return json(error.status,{error:error.message,code:error.code});
   const internal=!!error.code||error instanceof TypeError||error instanceof SyntaxError;
   json(internal?500:400,{error:internal?'Não foi possível concluir a operação. Nenhuma alteração foi confirmada.':error.message,code:internal?'INTERNAL_ERROR':'INVALID_OPERATION'});
  }
 });
 server.runtime=runtime;server.on('close',()=>runtime.close());return server;
}
if(require.main===module){try{const server=createServer();server.listen(Number(process.env.PORT||3210),'127.0.0.1',()=>console.log('Sistema Comercial: http://127.0.0.1:'+(process.env.PORT||3210)));server.on('error',error=>{console.error('Não foi possível abrir o sistema: '+(error.code==='EADDRINUSE'?'a porta já está em uso.':'confira a configuração local.'));server.runtime.close();process.exitCode=1;});}catch{console.error('Abertura interrompida com os dados preservados. Confira a configuração e o relatório de migração.');process.exitCode=1;}}
function change(state, route, input) {
  if(route==='/api/sales/receive')return receive(state,input);
  const next = structuredClone(state);
  if (route === '/api/sales/cancel') {
    const s = next.sales.find(s => s.id === input.id);
    if (!s) throw Error('Venda não encontrada.');
    if (s.cancelledAt) throw Error('Esta venda já foi cancelada.');
    if((s.returns||[]).length)throw Error('Esta venda já teve devolução parcial. Devolva os itens restantes pela tela de devoluções.');
    for (const item of s.items) {
      const p = next.products.find(p => p.id === item.productId);
      if (!p) throw Error('Produto da venda não encontrado.');
      p.stock += item.quantity;
      if (!Number.isSafeInteger(p.stock)) throw Error('Estoque muito alto.');
    }
    s.cancelledAt = new Date().toISOString();
    creditCancel(next,s,s.cancelledAt);
    for(const item of s.items)movement(next,next.products.find(p=>p.id===item.productId),item.quantity,'cancel',s.id,'',s.cancelledAt);
    return next;
  }
  const record = (route === '/api/customers/edit' ? next.customers : next.products).find(r => r.id === input.id);
  if (!record) throw Error('Cadastro não encontrado.');
  if (route === '/api/stock') {
    validateKey(input.requestId);
    const quantity = Number(input.quantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw Error('Informe uma quantidade inteira maior que zero.');
    const note=optional(input.note,200),prior=input.requestId&&(next.stockEntries||[]).find(e=>e.requestId===input.requestId);
    if(prior){if(prior.productId!==input.id||prior.quantity!==quantity||prior.note!==note||(prior.destinationPositionId||'')!==(input.destinationPositionId||''))throw Error('Esta confirmação já foi usada com outros dados.');return next;}
    if(!Number.isSafeInteger(record.stock+quantity))throw Error('Estoque muito alto.');
    record.stock += quantity;
    next.stockEntries ||= [];
    next.stockEntries.push({id:randomUUID(),requestId:input.requestId||null, productId:record.id, productName:record.name, quantity, note,destinationPositionId:input.destinationPositionId||'', date:new Date().toISOString()});
    const entry=next.stockEntries.at(-1);movement(next,record,quantity,'entry',entry.id,entry.note,entry.date);
  } else {
    catalogVersion(record,input);const before=structuredClone(record);
    const name = String(input.name || '').trim();
    if (!name || name.length > 120) throw Error('Informe um nome de até 120 caracteres.');
    record.name = name;
    if (route === '/api/products/edit') {
      const priceCents = moneyCents(input.price,true);
      if (!Number.isSafeInteger(priceCents)) throw Error('Preço inválido.');
      record.priceCents = priceCents;
      productFields(next,record,input);
    } else {
      record.phone = String(input.phone || '').trim().slice(0,40);
      record.email = String(input.email || '').trim().slice(0,150);
      if(input.notes!==undefined)record.notes=optional(input.notes,1000);
    }
    record.version=(record.version||0)+1;record.updatedAt=new Date().toISOString();audit(next,route==='/api/products/edit'?'products':'customers',record,before,input);
  }
  return next;
}
module.exports={sale,change,createServer};let defaultServer;Object.defineProperty(module.exports,'server',{enumerable:true,get(){return defaultServer||(defaultServer=createServer());}});
