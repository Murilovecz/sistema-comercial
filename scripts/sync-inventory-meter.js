'use strict';
// Synthetic benchmark only: compile unchanged production bodies with timing hooks in memory.
// No production file, database schema, business expression, or transaction is rewritten.
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const assert = require('node:assert/strict');
const {performance} = require('node:perf_hooks');
const {createHash} = require('node:crypto');
const BASE = path.resolve(__dirname, '..');
const FILES = ['foundation/inventory-store.js', 'foundation/commercial-store.js',
  'foundation/state-repository.js', 'foundation/scoped-state.js', 'foundation/sales-store.js'];
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function install(enabled, options = {}) {
  const hashes = Object.fromEntries(FILES.map(file => [file, hash(path.join(BASE, file))]));
  const inventoryAccumulator = options.inventoryAccumulator ??
    (options.sources?.['foundation/inventory-store.js'] ?? fs.readFileSync(path.join(BASE,'foundation/inventory-store.js'),'utf8')).includes(' const movementTotals=new Map();');
  const mirrorAccumulator = options.mirrorAccumulator ??
    (options.sources?.['foundation/inventory-store.js'] ?? fs.readFileSync(path.join(BASE,'foundation/inventory-store.js'),'utf8')).includes(' const verifiedMovementTotals=new Map();');
  const balanceLookupIndex = options.balanceLookupIndex ??
    (options.sources?.['foundation/inventory-store.js'] ?? fs.readFileSync(path.join(BASE,'foundation/inventory-store.js'),'utf8')).includes(' const balanceByProductId=new Map();');
  let frames = [], calls = [], sql = new Map(), prepareMs = 0, executeMs = 0, active = false;
  function phase(name) {
    const frame = frames.at(-1); if (!frame) return;
    const now = performance.now();
    frame.phases[frame.phase] = (frame.phases[frame.phase] || 0) + now - frame.phaseStart;
    frame.phase = name; frame.phaseStart = now;
  }
  function enter(name, state) {
    if (!active) return null;
    const now = performance.now(), frame = {name, start: now, phaseStart: now, phase: 'setup', phases: {},
      childrenMs: 0, sql: {}, counts: null};
    if(name==='verifyInventoryMirror'){
      frame.ancestry=frames.map(f=>f.name);
      const p=state.products.length,m=(state.stockMovements||[]).length;
      frame.counts={products:p,stockMovements:m,productMovementVisits:mirrorAccumulator?m:p*m,globalProductVisits:p,mirrorAccumulator,
        balanceSearches:balanceLookupIndex?0:p,findComparisons:balanceLookupIndex?0:p*(p+1)/2,
        mapChecks:balanceLookupIndex?p:0,mapInsertions:balanceLookupIndex?p:0,mapLookups:balanceLookupIndex?p:0,balanceLookupIndex};
    }
    if (name === 'syncInventory') {
      const products = state.products, moves = state.stockMovements || [], physical = state.positionMovements || [],
        entries = state.stockEntries || [], purchases = state.purchases || [], purchaseMap = new Map(purchases.map((p, i) => [p.id, {p, i}]));
      // Exact loop visits derived from the original loops, without adding work to their callbacks.
      let purchaseComparisons = 0, receiptVisits = 0;
      for (const move of moves) {const match = purchaseMap.get(move.purchaseId);
        purchaseComparisons += match ? match.i + 1 : purchases.length;
        receiptVisits += match?.p.receipts?.length || 0;}
      const positions = products.reduce((n, p) => n + Object.keys(p.positionBalances || {}).length, 0);
      frame.counts = {products: products.length, stockMovements: moves.length, positionMovements: physical.length,
        stockEntries: entries.length, positionBalances: positions, purchases: purchases.length,
        receipts: purchases.reduce((n, p) => n + (p.receipts || []).length, 0),
        productMovementVisits: inventoryAccumulator ? moves.length : products.length * moves.length,
        globalProductVisits: products.length, inventoryAccumulator, purchaseComparisons, receiptVisits,
        positionMovementVisits: positions * physical.length,
        rowsInserted: products.length + moves.length + physical.length + entries.length + positions};
    }
    frames.push(frame); return frame;
  }
  function leave(frame) {
    if (!frame) return;
    assert.equal(frames.at(-1), frame); phase('end'); frames.pop();
    frame.ms = performance.now() - frame.start; frame.selfMs = frame.ms - frame.childrenMs;
    if (frames.length) frames.at(-1).childrenMs += frame.ms;
    calls.push(frame);
  }
  function one(source, anchor, replacement) {
    assert.equal(source.split(anchor).length, 2, 'Timing anchor must occur exactly once: ' + anchor);
    return source.replace(anchor, replacement);
  }
  function wrap(source, name) {
    const match = new RegExp('function ' + name + '\\([^\\n]*?\\)\\{').exec(source);
    assert(match, 'Function timing anchor: ' + name);
    const bodyStart = match.index + match[0].length;
    const next = source.indexOf('\nfunction ', bodyStart), exports = source.indexOf('\nmodule.exports', bodyStart);
    const end = Math.min(...[next, exports].filter(n => n >= 0));
    const bodyEnd = source.lastIndexOf('}', end);
    assert(bodyEnd > bodyStart);
    const stateArg = ['syncInventory','verifyInventoryMirror'].includes(name) ? ',state' : '';
    return source.slice(0, bodyStart) + 'const __frame=__meter.enter(' + JSON.stringify(name) + stateArg + ');try{' +
      source.slice(bodyStart, bodyEnd) + '}finally{__meter.leave(__frame);}' + source.slice(bodyEnd);
  }
  function compile(relative, names, transform = s => s) {
    const file = path.join(BASE, relative); assert(!require.cache[file], 'Install before loading production modules.');
    let source = options.sources?.[relative] ?? fs.readFileSync(file, 'utf8');
    source = transform(source); for (const name of names) source = wrap(source, name);
    // Module-relative requires and circular dependencies remain those of the real file.
    const mod = new Module(file, module); mod.filename = file; mod.paths = Module._nodeModulePaths(path.dirname(file));
    require.cache[file] = mod;
    const key = '__inventoryMeasurementHooks'; assert(!globalThis[key]);
    globalThis[key] = {enter, leave, phase};
    try {mod._compile("'use strict';\nconst __meter=globalThis.__inventoryMeasurementHooks;\n" + source, file); mod.loaded = true;}
    finally {delete globalThis[key];}
  }
  if (enabled) {
    compile('foundation/scoped-state.js', ['loadState']);
    compile('foundation/inventory-store.js', ['syncInventory', 'verifyInventoryMirror', 'assertStockTransition'], source => {
      source = one(source, " for(const table of ['commercial_position_movements'", " __meter.phase('delete');\n for(const table of ['commercial_position_movements'");
      source = one(source, ' for(const[kind,table]of Object.entries(tables))for', " __meter.phase('history-project');\n for(const[kind,table]of Object.entries(tables))for");
      source = one(source, '  const value=state[kind][ordinal],row=', "  __meter.phase('history-project');const value=state[kind][ordinal],row=");
      source = one(source, "  if(kind==='stockMovements'){const p=", "  __meter.phase('history-link');if(kind==='stockMovements'){const p=");
      source = one(source, '  const columns=Object.keys(row);', "  __meter.phase('history-insert');const columns=Object.keys(row);");
      if (source.includes(' const movementTotals=new Map();')) {
        assert(inventoryAccumulator, 'Candidate timing must include its accumulator pass.');
        source = one(source, ' const movementTotals=new Map();', " __meter.phase('global-balances');const movementTotals=new Map();");
        source = one(source, ' for(const p of state.products){const sum=movementTotals.get(p.id)', " for(const p of state.products){__meter.phase('global-balances');const sum=movementTotals.get(p.id)");
      } else {
        assert(!inventoryAccumulator, 'Baseline loop and count mode must agree.');
        source = one(source, " for(const p of state.products){let sum='0';", " __meter.phase('global-balances');for(const p of state.products){__meter.phase('global-balances');let sum='0';");
      }
      source = one(source, '  let ordinal=0;for(const[id,value]', "  __meter.phase('position-balances');let ordinal=0;for(const[id,value]");
      source = one(source, " store.setMeta('inventory-presence:", " __meter.phase('markers');store.setMeta('inventory-presence:");
      return source;
    });
    compile('foundation/commercial-store.js', ['syncProducts', 'syncCustomers', 'syncSuppliers', 'syncPurchases', 'verifyCommercialMirror']);
    compile('foundation/sales-store.js', ['syncSales']);
    compile('foundation/state-repository.js', ['writeState', 'saveBusinessState', 'auditChanges'], source => {
      source = one(source, " store.db.prepare('DELETE FROM entity_index", " __meter.phase('entity-index');store.db.prepare('DELETE FROM entity_index");
      source = one(source, " require('./commercial-store').verifyCommercialMirror(store,scope,state);", " __meter.phase('final-mirror');require('./commercial-store').verifyCommercialMirror(store,scope,state);");
      return source;
    });
  }
  function attach(db) {
    if (!enabled) return;
    const original = db.prepare.bind(db);
    db.prepare = text => {
      const start = performance.now(), statement = original(text), elapsed = performance.now() - start;
      if (active) {prepareMs += elapsed;
        const query = sql.get(text) || {text, calls: 0, ms: 0, returnedRows: 0, changes: 0, prepares: 0, prepareMs: 0};
        query.prepares++; query.prepareMs += elapsed; sql.set(text, query);
        const frame = frames.at(-1);
        if (frame) {const item = frame.sql[frame.phase] ||= {prepareMs: 0, executeMs: 0, executions: 0, prepares: 0}; item.prepareMs += elapsed; item.prepares++;}}
      return new Proxy(statement, {get(target, key) {const value = target[key]; if (typeof value !== 'function') return value;
        return (...args) => {
          if (!active || !['get', 'all', 'run'].includes(key)) return value.apply(target, args);
          const start = performance.now(), result = value.apply(target, args), elapsed = performance.now() - start;
          executeMs += elapsed;
          const item = sql.get(text) || {text, calls: 0, ms: 0, returnedRows: 0, changes: 0, prepares: 0, prepareMs: 0};
          item.calls++; item.ms += elapsed; item.returnedRows += key === 'all' ? result.length : key === 'get' && result ? 1 : 0;
          item.changes += key === 'run' ? Number(result.changes) : 0; sql.set(text, item);
          const frame = frames.at(-1); if (frame) {const phase = frame.sql[frame.phase] ||= {prepareMs: 0, executeMs: 0, executions: 0};
            phase.executeMs += elapsed; phase.executions++;}
          if(frame?.name==='verifyInventoryMirror'&&key==='all'&&text==='SELECT * FROM commercial_stock_balances WHERE company_id=? AND unit_id=?')frame.counts.balances=result.length;
          return result;
        };}});
    };
  }
  return {attach,
    reset() {assert.equal(frames.length, 0); calls = []; sql = new Map(); prepareMs = 0; executeMs = 0; active = true;},
    finish() {active = false; assert.equal(frames.length, 0); return {calls, sql: [...sql.values()], prepareMs, executeMs};},
    verifySources() {for (const [file, expected] of Object.entries(hashes)) assert.equal(hash(path.join(BASE, file)), expected); return hashes;}
  };
}
module.exports = {install};
