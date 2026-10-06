'use strict';
// Benchmark only. Each scale runs in a fresh process and a new synthetic QA database.
// No operational defaults, legacy import, credentials, cookies or SQL bind values are saved.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const {performance} = require('node:perf_hooks');
const {randomBytes, randomUUID} = require('node:crypto');
const {spawn} = require('node:child_process');
const ROOT = path.resolve(__dirname, '../.qa/foundation-v1.2/benchmarks');
const SCALES = {small: 100, medium: 500, large: 1500};

function safeFile(filename) {
  const resolved = path.resolve(filename);
  assert(resolved.startsWith(ROOT + path.sep), 'Somente pasta isolada de benchmark.');
  const parts = path.relative(ROOT, resolved).split(path.sep);
  assert(parts.length === 3 && /^http-[A-Za-z0-9]+$/.test(parts[0]) && Object.hasOwn(SCALES, parts[1]),
    'Somente bancos novos da matriz HTTP; baseline interno preservado.');
  assert.equal(parts[2], 'synthetic.sqlite');
  return resolved;
}
function options(filename) {
  return {environment: 'test', filename: safeFile(filename), dataDir: path.dirname(filename),
    importLegacy: false, pairingToken: randomBytes(32).toString('base64url'), backup: {enabled: false}};
}
function instrumentation() {
  const {DatabaseSync} = require('node:sqlite');
  const original = DatabaseSync.prototype.prepare;
  const originalExec = DatabaseSync.prototype.exec;
  let stats, profile = false;
  function reset(timed = false) {
    stats = {executions: 0, returnedRows: 0, execCalls: 0, snapshotReads: 0, queries: new Map()};
    profile = timed;
  }
  reset();
  DatabaseSync.prototype.exec = function(sql) {stats.execCalls++; return originalExec.call(this, sql);};
  DatabaseSync.prototype.prepare = function(sql) {
    const statement = original.call(this, sql);
    return new Proxy(statement, {get(target, key) {
      const value = target[key];
      if (typeof value !== 'function') return value;
      return (...args) => {
        if (!['get', 'all', 'run', 'iterate'].includes(key)) return value.apply(target, args);
        stats.executions++;
        if (/SELECT revision,payload FROM unit_states/i.test(sql)) stats.snapshotReads++;
        let entry = stats.queries.get(sql);
        if (!entry) {entry = {sql, calls: 0, ms: 0, args}; stats.queries.set(sql, entry);}
        entry.calls++;
        const start = profile ? performance.now() : 0;
        const result = value.apply(target, args);
        if (profile) entry.ms += performance.now() - start;
        if (key === 'get' && result) stats.returnedRows++;
        if (key === 'all') stats.returnedRows += result.length;
        if (key === 'iterate') return (function*() {for (const row of result) {stats.returnedRows++; yield row;}})();
        return result;
      };
    }});
  };
  return {reset, get: () => stats, restore() {
    DatabaseSync.prototype.prepare = original; DatabaseSync.prototype.exec = originalExec;
  }};
}
function summary(values) {
  const sorted = [...values].sort((a, b) => a - b), n = sorted.length;
  const round = x => Number(x.toFixed(3));
  return {mean: round(values.reduce((a, b) => a + b, 0) / n),
    median: round(n % 2 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2),
    min: round(sorted[0]), max: round(sorted.at(-1)),
    ...(n >= 20 ? {p95Sample: round(sorted[Math.ceil(n * .95) - 1])} : {})};
}
async function close(server) {
  await new Promise(resolve => {server.close(resolve); server.closeAllConnections();});
}
async function child(args) {
  return new Promise((resolve, reject) => {
    const worker = spawn(process.execPath, [__filename, ...args], {cwd: path.resolve(__dirname, '..'),
      windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
    let output = '', errors = '';
    worker.stdout.on('data', chunk => output += chunk);
    worker.stderr.on('data', chunk => errors += chunk);
    worker.on('error', reject);
    worker.on('exit', code => code ? reject(new Error(output + errors || 'Benchmark interrompido.')) : resolve(output));
  });
}
async function startupProbe(filename) {
  const start = performance.now(), meter = instrumentation();
  const server = require('../server').createServer(options(filename));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const result = {applicationMs: performance.now() - start, executions: meter.get().executions,
    returnedRows: meter.get().returnedRows, rssBytes: process.memoryUsage().rss};
  await close(server); meter.restore();
  console.log(JSON.stringify(result));
}
async function scale(size, dir) {
  assert(Object.hasOwn(SCALES, size));
  const filename = safeFile(path.join(dir, 'synthetic.sqlite')), n = SCALES[size];
  const meter = instrumentation();
  const {createServer} = require('../server');
  const {Client} = require('../foundation/http-fixture');
  const {createUser} = require('../foundation/identity');
  const {createRole, assignRole} = require('../foundation/rbac');
  const {grantCompanyAccess, grantUnitAccess} = require('../foundation/access');
  const {writeState} = require('../foundation/state-repository');
  const {loadState} = require('../foundation/scoped-state');
  const {appendAudit, verifyAuditChain} = require('../foundation/audit');
  const {syntheticState} = require('./benchmark-foundation');
  const password = randomBytes(24).toString('base64url');
  const opts = options(filename);
  let server = createServer(opts);
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let owner = new Client('http://127.0.0.1:' + server.address().port);
    await owner.call('/api/auth/status');
    const setup = await owner.call('/api/auth/setup', {pairingToken: opts.pairingToken,
      name: 'Dono sintético', login: 'http-benchmark-owner', password});
    assert.equal(setup.status, 200, 'Instalação sintética falhou.');
    const scope = {companyId: setup.data.companyId, unitId: setup.data.unitId};
    let state = syntheticState(n);
    for (const product of state.products.slice(-6)) product.active = false;
    // Real domain receiving creates receipts and matching stock movements, outside timed work.
    for (let i = 0; i < state.purchases.length; i++) {
      state.purchases[i].confirmedAt = '2026-09-02T15:00:00.000Z';
      state = require('../purchases').purchaseAction(state, 'receive', {id: 'b' + i,
        expectedVersion: 1, requestId: 'seed-receipt-' + i, items: [{productId: 'p' + i, quantity: 1}]});
    }
    const store = server.runtime.store;
    store.transaction(() => {
      const revision = store.db.prepare('SELECT revision FROM unit_states WHERE company_id=? AND unit_id=?')
        .get(scope.companyId, scope.unitId)?.revision || 0;
      writeState(store, scope, state, revision);
      for (let i = 0; i < n * 2; i++) appendAudit(store, {...scope, userId: setup.data.user.id,
        action: 'BENCHMARK_SEED', entity: 'sales', recordId: 's' + i, after: {id: 's' + i}});
    });
    const operator = await createUser(store, {name: 'Operador sintético', login: 'http-benchmark-operator', password});
    const approver = await createUser(store, {name: 'Autorizador sintético', login: 'http-benchmark-approver', password});
    store.transaction(() => {
      for (const [user, permissions] of [[operator, ['catalog.view', 'inventory.view', 'sales.view', 'sales.create', 'audit.view']],
        [approver, ['sales.authorize_inactive']]]) {
        grantCompanyAccess(store, user.id, scope.companyId); grantUnitAccess(store, user.id, scope.companyId, scope.unitId);
        const role = createRole(store, scope.companyId, {name: user.login, permissions});
        assignRole(store, user.id, scope.companyId, scope.unitId, role.id);
      }
    });
    const records = {products: n, customers: state.customers.length, suppliers: state.suppliers.length,
      sales: state.sales.length, saleItems: state.sales.length, purchases: state.purchases.length,
      purchaseReceipts: state.purchases.length, movements: state.stockMovements.length,
      auditEvents: store.db.prepare('SELECT count(*) n FROM audit_events').get().n,
      inactiveProducts: 6, users: 3, companies: 1, units: 1};
    const snapshotBytes = Buffer.byteLength(JSON.stringify(state));
    // Fresh process startup on the prepared database. Disk/OS caches are NOT flushed.
    await close(server); server = null;
    const cold = [];
    for (let i = 0; i < 3; i++) {
      const start = performance.now(), result = JSON.parse(await child(['--startup', filename]));
      cold.push({...result, processLaunchAndExitMs: performance.now() - start});
    }
    server = createServer(opts);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const activeStore = server.runtime.store;
    const origin = 'http://127.0.0.1:' + server.address().port;
    owner = new Client(origin); await owner.login('http-benchmark-owner', password);
    const commercial = new Client(origin); await commercial.login(operator.login, password);
    const measurements = [], planCandidates = new Map();
    async function measure(name, fn, samples = 20, warmup = 2, metadata = {}) {
      for (let i = 0; i < warmup; i++) await fn(i);
      const raw = [];
      for (let i = 0; i < samples; i++) {
        meter.reset(); const start = performance.now(); await fn(i);
        const elapsedMs = performance.now() - start, stats = meter.get(), memory = process.memoryUsage();
        raw.push({elapsedMs, sqlExecutions: stats.executions, returnedRows: stats.returnedRows,
          execCalls: stats.execCalls, snapshotReads: stats.snapshotReads, rssBytes: memory.rss, heapUsedBytes: memory.heapUsed});
        if (i === samples - 1) for (const entry of stats.queries.values()) {
          if (/^SELECT/i.test(entry.sql.trim())) planCandidates.set(entry.sql, {entry, operation: name});
        }
      }
      const result = {name, samples, warmup, ...metadata, ms: summary(raw.map(r => r.elapsedMs)),
        sqlExecutions: summary(raw.map(r => r.sqlExecutions)), returnedRows: summary(raw.map(r => r.returnedRows)),
        snapshotReads: summary(raw.map(r => r.snapshotReads)), rssBytesObserved: summary(raw.map(r => r.rssBytes)), raw};
      measurements.push(result);
      console.log(JSON.stringify({progress: size, operation: name, medianMs: result.ms.median}));
      return result;
    }
    async function call(client, url, input, status = 200) {
      const response = await client.call(url, input);
      assert.equal(response.status, status, 'HTTP inesperado: ' + url + ' ' + response.status + ' ' + (response.data?.code || ''));
      return response.data;
    }
    const get = (client, url) => () => call(client, url);
    await measure('login-http', async () => {
      const freshClient = new Client(origin);
      await call(freshClient, '/api/auth/status');
      const value = await call(freshClient, '/api/auth/login', {login: operator.login, password});
      commercial.cookies = freshClient.cookies; commercial.csrf = freshClient.csrf;
      return value;
    }, 5, 1, {note: 'Bootstrap CSRF/status + login; KDF e rate limits reais; cinco amostras, sem p95.'});
    await call(commercial, '/api/auth/status');
    const base = '/api/commercial/';
    const reads = [
      ['commercial-initial-http', 'catalog?sort=name&pageSize=25'],
      ['products-http', 'catalog?sort=name&pageSize=25'],
      ['products-search-http', 'catalog?q=SKU99&sort=name&pageSize=25'],
      ['products-page2-http', 'catalog?sort=name&pageSize=25&page=2'],
      ['products-lookup-http', 'products/lookup?code=SKU99'],
      ['customers-http', 'customers?sort=name&pageSize=25'],
      ['suppliers-http', 'suppliers?sort=name&pageSize=25'],
      ['inventory-http', 'inventory?sort=name&pageSize=25'],
      ['movements-http', 'inventory/movements?sort=date&pageSize=25'],
      ['sales-list-http', 'sales?sort=date&direction=desc&pageSize=25'],
      ['sales-search-http', 'sales?sort=date&q=Cliente%20sint%C3%A9tico%201&pageSize=25'],
      ['sales-page2-http', 'sales?sort=date&direction=desc&pageSize=25&page=2'],
      ['sales-last-page-http', 'sales?sort=date&pageSize=25&page=' + Math.ceil(n * 2 / 25)],
      ['sales-period-http', 'sales?sort=date&from=2026-09-10&to=2026-09-14&pageSize=25'],
      ['sales-status-http', 'sales?sort=date&cancelled=registered&pageSize=25'],
      ['sales-customer-http', 'sales?sort=date&customerId=c1&pageSize=25'],
      ['sales-unit-http', 'sales?sort=date&unitId=' + encodeURIComponent(scope.unitId) + '&pageSize=25'],
      ['sales-detail-commercial-http', 'sales/by-id?id=s1'],
      ['checkout-context-snapshot-http', 'sales/checkout-context']
    ];
    for (const [name, url] of reads) await measure(name, get(commercial, base + url));
    await measure('sales-detail-financial-http', get(owner, base + 'sales/by-id?id=s1'));
    for (const [name, url] of [['initial-full-state-http', '/api/state'],
      ['financial-snapshot-http', base + 'financial?sort=date&pageSize=25'],
      ['product-cost-snapshot-http', base + 'product-costs?productId=p0'],
      ['operations-snapshot-http', base + 'operations?sort=date&pageSize=25']]) {
      await measure(name, get(owner, url));
    }
    // No separate purchase GET exists today. Its list is carried by /api/state.
    await measure('purchases-receipts-via-full-state-http', async () => {
      const value = await call(owner, '/api/state'); assert.equal(value.purchases.length, records.purchases);
      assert.equal(value.purchases.reduce((sum, p) => sum + p.receipts.length, 0), records.purchaseReceipts);
    }, 20, 2, {sharedEndpoint: '/api/state', note: 'Same full-state request; not an isolated purchase repository latency.'});
    await measure('audit-http', get(owner, '/api/foundation/audit'));
    await measure('audit-commercial-http', get(commercial, '/api/foundation/audit'));
    function draft(product = 'p0') {return {requestId: randomUUID(), customerId: 'c0',
      items: [{productId: product, quantity: 1, priceCents: 1237}],
      paymentMethod: 'pix', paymentStatus: 'received', expectedCashSessionId: null};}
    await measure('sales-preview-snapshot-http', () => call(commercial, base + 'sales/preview', draft()));
    await measure('sale-stock-audit-commit-http', async () => {
      const value = await call(commercial, base + 'sales', draft(), 201);
      assert.equal(value.sale.execution.executedBy, operator.id);
    }, 7, 1, {note: 'Each sample commits a distinct sale, stock movement and receipt; one warm-up also writes.'});
    // Separate grant timing from consuming/committing, so credential verification is visible.
    const approvals = [];
    await measure('inactive-approval-http', async () => {
      const saleDraft = draft('p' + (n - 1 - approvals.length));
      const value = await call(commercial, base + 'sales/inactive-approval', {saleDraft,
        approverLogin: approver.login, approverPassword: password, reason: 'Benchmark sintético'}, 201);
      approvals.push({...saleDraft, approvalToken: value.approvalToken});
    }, 5, 1);
    await measure('inactive-sale-stock-audit-commit-http', async () => {
      const value = await call(commercial, base + 'sales', approvals.shift(), 201);
      assert.equal(value.sale.execution.authorizedBy, approver.id);
    }, 5, 1);
    const verified = loadState(activeStore, scope);
    const receiptTarget = verified.state.purchases.find(p => p.id === 'b0');
    let purchaseVersion = receiptTarget.version;
    await measure('purchase-receive-http', async () => {
      const value = await call(owner, '/api/purchases/receive', {id: 'b0', expectedVersion: purchaseVersion,
        requestId: randomUUID(), items: [{productId: 'p0', quantity: 1}]}, 201);
      purchaseVersion = value.purchases.find(p => p.id === 'b0').version;
    }, 3, 1, {note: 'Four remaining units; response is the legacy full state. No p95 from three samples.'});
    const concurrentStart = performance.now();
    const concurrent = await Promise.all([0, 1].map(async i => {
      const start = performance.now(); await call(commercial, base + 'sales', draft('p' + (i + 1)), 201);
      return performance.now() - start;
    }));
    const concurrency = {requests: 2, totalMs: performance.now() - concurrentStart, requestMs: concurrent,
      note: 'One local Node process, two successful writes; scheduling/serialization observation only.'};
    // Profile only AFTER the workload identifies snapshot writes as the expensive operation.
    meter.reset(true); const profileStart = performance.now();
    await call(commercial, base + 'sales', draft('p3'), 201);
    const profileStats = meter.get();
    const sqlProfile = {separateSampleMs: performance.now() - profileStart,
      snapshotReads: profileStats.snapshotReads, executions: profileStats.executions,
      measuredStatementMs: [...profileStats.queries.values()].reduce((sum, q) => sum + q.ms, 0),
      topByCalls: [...profileStats.queries.values()].sort((a, b) => b.calls - a.calls).slice(0, 12)
        .map(({sql, calls, ms}) => ({sql, calls, ms})),
      note: 'Additional instrumented write; SQL timer overhead included. JS, prepare, exec and I/O are outside statement totals.'};
    const plans = [];
    for (const {entry, operation} of planCandidates.values()) {
      if (!/commercial_sales|commercial_purchase|commercial_stock_movements|audit_events|unit_states/i.test(entry.sql)) continue;
      const rows = activeStore.db.prepare('EXPLAIN QUERY PLAN ' + entry.sql).all(...entry.args);
      plans.push({operation, sql: entry.sql, details: rows.map(r => r.detail)});
    }
    const final = loadState(activeStore, scope).state;
    assert.equal(final.sales.length, records.sales + 17); // 8 normal, 6 exceptional, 2 concurrent, 1 profile.
    assert.equal(final.stockMovements.length, records.movements + 21); // plus four purchase receipts.
    assert.equal(final.products.find(p => p.id === 'p1').stock, state.products.find(p => p.id === 'p1').stock - 1);
    assert.equal(final.products.at(-1).active, false);
    assert(verifyAuditChain(activeStore), 'Audit chain failed.');
    const page1 = await call(commercial, base + 'sales?sort=date&direction=desc&pageSize=25');
    const page2 = await call(commercial, base + 'sales?sort=date&direction=desc&pageSize=25&page=2');
    assert.equal(new Set([...page1.items, ...page2.items].map(s => s.id)).size, 50);
    assert(!Object.hasOwn((await call(commercial, base + 'sales/by-id?id=s1')).sale, 'receipts'));
    assert.equal((await new Client(origin).call(base + 'sales')).status, 401);
    assert.equal((await commercial.call('/api/state')).status, 403);
    assert.equal((await commercial.call(base + 'sales', draft(), {
      'X-Company-Id': scope.companyId, 'X-Unit-Id': randomUUID()
    })).status, 409);
    const result = {size, records, snapshotBytes, database: filename,
      sqlite: activeStore.db.prepare('SELECT sqlite_version() version').get().version,
      migrations: activeStore.db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(r => r.version),
      startup: {samples: 3, applicationMs: summary(cold.map(r => r.applicationMs)),
        processLaunchAndExitMs: summary(cold.map(r => r.processLaunchAndExitMs)), raw: cold,
        note: 'Fresh process / application cold, warmed OS disk cache; outer time includes process shutdown.'},
      measurements, concurrency, sqlProfile, plans,
      finalRecords: {sales: final.sales.length, movements: final.stockMovements.length,
        purchaseReceipts: final.purchases.reduce((sum, p) => sum + p.receipts.length, 0),
        auditEvents: activeStore.db.prepare('SELECT count(*) n FROM audit_events').get().n},
      checks: ['HTTP success', 'executor/authorizer', 'unchanged inactive flag', 'sale/movement totals',
        'stock concurrency', 'audit chain', 'no duplicated pages', 'financial DTO projection',
        'unauthenticated denied', 'partial full-state denied', 'foreign unit denied'],
      processMemory: {rssBytesAtEnd: process.memoryUsage().rss, maxRssKiB: process.resourceUsage().maxRSS,
        note: 'Whole worker (server + HTTP client + fixture + KDF + SQLite). RSS sampled between requests; not per-request allocation.'}};
    fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify(result, null, 2) + '\n');
  } finally {if (server) await close(server); meter.restore();}
}
async function run() {
  fs.mkdirSync(ROOT, {recursive: true});
  const dir = fs.mkdtempSync(path.join(ROOT, 'http-'));
  const volumes = [];
  for (const size of Object.keys(SCALES)) {
    const childDir = path.join(dir, size); fs.mkdirSync(childDir);
    const output = await child(['--scale', size, childDir]);
    process.stdout.write(output);
    volumes.push(JSON.parse(fs.readFileSync(path.join(childDir, 'results.json'), 'utf8')));
  }
  const report = {date: new Date().toISOString(), version: require('../package.json').version,
    environment: {node: process.version, platform: process.platform, architecture: process.arch,
      osRelease: os.release(), cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length,
      totalMemoryBytes: os.totalmem(), availableMemoryBytesAtEnd: os.freemem()},
    method: ['Sequential synthetic scales in separate processes; disk SQLite WAL, synchronous FULL.',
      'HTTP loopback with actual sessions, CSRF, scope, RBAC, transactions and audit; no browser/rendering.',
      'Two warm-ups then 20 read samples; login/approval five, sale commits seven, receiving three.',
      'No samples dropped, no forced GC, no OS cache flushing, no indexes/queries changed.',
      'p95 only for 20 samples: nearest-rank sample quantile, exploratory, not a production guarantee.',
      'SQL counts include authentication and session last_seen updates; exec calls recorded separately.',
      'Returned rows are not scanned rows. Native statement instrumentation adds some overhead.',
      'Commercial initial means first product API after a restricted login. Full initial /api/state measured separately.',
      'Fixtures have one item per sale/order and one initial receipt per purchase. No complex credit/return/reservation histories.',
      'Small two-write concurrency sample, not a load test; all test accounts synthetic, credentials not persisted.'], volumes};
  const filename = path.join(dir, 'report.json');
  fs.writeFileSync(filename, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({report: filename}));
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === '--help') console.log('node scripts/benchmark-v1-2-http.js\nCreates a fresh isolated .qa/foundation-v1.2/benchmarks/http-* report (3 sequential scales). Never opens operational data. --scale and --startup are internal worker modes.');
  else (args[0] === '--startup' ? startupProbe(args[1]) : args[0] === '--scale' ? scale(args[1], args[2]) : run())
    .catch(error => {console.error(error.message); process.exitCode = 1;});
}
module.exports = {summary, safeFile};
