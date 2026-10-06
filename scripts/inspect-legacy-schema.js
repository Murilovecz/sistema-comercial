'use strict';

// Inspection only: retains field paths and types, never record values or IDs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const collections = ['products','customers','sales','suppliers','purchases','payables','expenses','quotes','cashSessions','stockMovements','stockEntries','auditLog','operationCommands','purchaseCommands','quoteCommands','cashCommands','inventories','reservations','tasks','hiddenOperations','priceLists','promotions','quarantineEntries','supplierReturns','storeCredits','deliveries','supplierQuotes','expenseCenters','expenseBudgets','families','positions','transfers','positionMovements','purchaseConferences','purchaseAmendments','purchaseOccurrences','agreements','recurringModels','recurringOccurrences','procedures','procedureExecutions','priceReviews'];
const fields = new Map();
const sources = new Map();
function type(value) { return value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value === 'number' ? Number.isSafeInteger(value) ? 'safe-integer' : 'number' : typeof value; }
function walk(value, prefix) {
  let entry = fields.get(prefix);
  if (!entry) fields.set(prefix, entry = {types: new Set(), observations: 0});
  entry.types.add(type(value)); entry.observations++;
  if (Array.isArray(value)) { for (const item of value) walk(item, prefix+'[]'); }
  else if (value && typeof value === 'object') {
    // Dynamic keys can be customer data. Do not retain arbitrary keys in evidence.
    const dynamic = /\.(positionBalances|familyAttributes|totals|expectedStocks|expectedPositions|budgetVersions|budgetExcessReasons|before|after|previous|snapshot|current)$/.test(prefix);
    for (const [key, item] of Object.entries(value)) walk(item, prefix+'.'+(dynamic?'*':key));
  }
}
function observe(state, source) {
  if (!state || !Array.isArray(state.products) || !Array.isArray(state.customers) || !Array.isArray(state.sales)) return;
  for (const name of collections) {
    if (!Array.isArray(state[name])) continue;
    walk(state[name], name);
    if (state[name].length) { let names=sources.get(name); if (!names) sources.set(name,names=new Set()); names.add(source); }
  }
  if (state.company) walk(state.company, 'company');
  if (state.schemaVersion !== undefined) walk(state.schemaVersion, 'schemaVersion');
}
function exportFields() { return Object.fromEntries([...fields].sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,{types:[...item.types].sort(),observations:item.observations}])); }
function hash(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function inside(file, directory) { const rel=path.relative(directory,path.resolve(file)); return rel && !rel.startsWith('..') && !path.isAbsolute(rel); }

if (process.env.LEGACY_SCHEMA_CAPTURE === '1') {
  const Module = require('node:module');
  const original = Module._load;
  const wrapped = new WeakSet();
  const names = new Set(['sale','change','expense','company','cancelExpense','receive','supplierAction','purchaseAction','payableAction','cashAction','quoteAction','activeAction','inventoryAction','returnAction','reservationAction','catalogAction','accountAction','taskAction','pricingAction','quarantineAction','supplierReturnAction','storeCreditAction','deliveryAction','supplierQuoteAction','budgetAction','catalogueNext','positionAction','purchaseNext','agreementAction','recurringAction','procedureAction','priceReviewAction','reconcileAgreements','reconcilePositions']);
  Module._load = function(request, parent, isMain) {
    const result = original.apply(this, arguments);
    let resolved; try { resolved=Module._resolveFilename(request,parent,isMain); } catch { return result; }
    if (typeof resolved !== 'string' || path.dirname(resolved)!==root || !result || typeof result!=='object' || wrapped.has(result)) return result;
    wrapped.add(result);
    for (const [name, fn] of Object.entries(result)) {
      if (typeof fn !== 'function' || !names.has(name)) continue;
      result[name]=function(...args) { const out=fn.apply(this,args); observe(out,path.basename(resolved)+'#'+name); return out; };
    }
    return result;
  };
  process.on('exit',()=>fs.writeFileSync(process.env.LEGACY_SCHEMA_CAPTURE_FILE,JSON.stringify({fields:exportFields(),collectionSources:Object.fromEntries([...sources].map(([k,v])=>[k,[...v].sort()]))},null,2)));
} else if (require.main === module) {
  const output=path.resolve(root,process.argv[2]||'.qa/foundation-v1/legacy-schema.json');
  const evidenceDir=path.resolve(root,'.qa/foundation-v1');
  if (!inside(output,evidenceDir)) throw Error('Evidence output must stay inside .qa/foundation-v1.');
  fs.mkdirSync(evidenceDir,{recursive:true});
  const database=path.join(root,'data/database.json'), before=hash(database);
  const real=JSON.parse(fs.readFileSync(database,'utf8'));
  require(path.join(root,'storage')).validateDatabase(real);
  observe(real,'database.json (read only)');
  const realFields=exportFields();
  // Optional capture is generated by preloading this file in an explicit test run.
  // The default command only reads the live JSON, sources and existing evidence.
  const captured=path.join(evidenceDir,'legacy-schema-fixtures.json');
  const testLog=path.join(evidenceDir,'schema-tests.txt');
  const fixtures=fs.existsSync(captured)?JSON.parse(fs.readFileSync(captured,'utf8')):{fields:{},collectionSources:{}};
  const testOutput=fs.existsSync(testLog)?fs.readFileSync(testLog,'utf8'):'';
  const after=hash(database);
  const summary={generatedAt:new Date().toISOString(),version:require(path.join(root,'package.json')).version,supportedSchemaVersions:[1,2],schemaVersionOptionalInLegacy:true,collectionCount:collections.length,databaseSHA256Before:before,databaseSHA256After:after,databaseUnchanged:before===after,valuesIncluded:false,method:'Real database read-only plus field/type capture from successful handler returns during existing tests; fixtures are synthetic observations, not a complete schema contract.',tests:{capturePresent:fs.existsSync(captured),passed:Number((testOutput.match(/(?:#|ℹ) pass (\d+)/)||[])[1]||0),failed:Number((testOutput.match(/(?:#|ℹ) fail (\d+)/)||[])[1]||0)},collections:Object.fromEntries(collections.map(name=>[name,{requiredAtRoot:['products','customers','sales'].includes(name),presentInRealDatabase:Object.hasOwn(real,name),realRecordCount:Array.isArray(real[name])?real[name].length:0,fixtureHandlerSources:fixtures.collectionSources[name]||[],realFields:Object.fromEntries(Object.entries(realFields).filter(([p])=>p===name||p.startsWith(name+'.')||p.startsWith(name+'['))),fixtureFields:Object.fromEntries(Object.entries(fixtures.fields).filter(([p])=>p===name||p.startsWith(name+'.')||p.startsWith(name+'[')))}])),rootObjects:{realFields:Object.fromEntries(Object.entries(realFields).filter(([p])=>p==='schemaVersion'||p==='company'||p.startsWith('company.')))},limitations:['Coverage is bounded by existing tests and actual records; optional paths need static source review.','No values, user names, record IDs or dynamic dictionary keys are retained.','Field presence in all observations does not imply required storage validation.','This script does not migrate, normalize, save or change the legacy database.']};
  fs.writeFileSync(output,JSON.stringify(summary,null,2));
  if (before!==after) throw Error('Database changed during inspection.');
  process.stdout.write(JSON.stringify({output:path.relative(root,output),collections:collections.length,tests:summary.tests,databaseUnchanged:true,nonemptyFixtureCollections:collections.filter(n=>summary.collections[n].fixtureHandlerSources.length).length})+'\n');
}
