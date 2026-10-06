'use strict';
// Measurement only. Fresh synthetic databases with migrations 001..010, no DDL experiment.
// Each arm uses a separate process; credentials travel only through IPC, never artifacts/argv.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const assert=require('node:assert/strict');
const {performance}=require('node:perf_hooks');
const {randomBytes,randomUUID,createHash}=require('node:crypto');
const {fork}=require('node:child_process');
const {summary}=require('./benchmark-v1-2-http');
const ROOT=path.resolve(__dirname,'../.qa/foundation-v1.2/balance-lookup');
function guard(file){const resolved=path.resolve(file);assert(resolved.startsWith(ROOT+path.sep),'Only isolated balance-lookup QA paths.');return resolved;}
const fingerprint=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
async function close(server,store){if(server)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});store.close();}
async function seed(n, dir, migrationsDir) {
  const {SqlStore} = require('../foundation/sql-store');
  const {createServer} = require('../server'), {Client} = require('../foundation/http-fixture');
  const {createUser} = require('../foundation/identity');
  const {createRole, assignRole} = require('../foundation/rbac');
  const {grantCompanyAccess, grantUnitAccess} = require('../foundation/access');
  const file = guard(path.join(dir, 'source.sqlite'));
  const store = new SqlStore(file, {environment: 'test', migrationsDir});
  const password = randomBytes(24).toString('base64url'), pairingToken = randomBytes(32).toString('base64url');
  const server = createServer({environment: 'test', filename: file, dataDir: dir, store, importLegacy: false,
    pairingToken, backup: {enabled: false}});
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const owner = new Client('http://127.0.0.1:' + server.address().port);
    await owner.call('/api/auth/status');
    const setup = await owner.call('/api/auth/setup', {pairingToken, name: 'Dono sintético', login: 'fk-owner', password});
    assert.equal(setup.status, 200);
    const scope = {companyId: setup.data.companyId, unitId: setup.data.unitId};
    let state = require('./benchmark-foundation').syntheticState(n);
    for (const product of state.products.slice(-6)) product.active = false;
    for (let i = 0; i < state.purchases.length; i++) {
      state.purchases[i].confirmedAt = '2026-09-02T15:00:00.000Z';
      state = require('../purchases').purchaseAction(state, 'receive', {id: 'b' + i, expectedVersion: 1,
        requestId: 'seed-receipt-' + i, items: [{productId: 'p' + i, quantity: 1}]});
    }
    store.transaction(() => {
      require('../foundation/state-repository').writeState(store, scope, state, 0);
      for (let i = 0; i < n * 2; i++) require('../foundation/audit').appendAudit(store, {
        ...scope, userId: setup.data.user.id, action: 'BENCHMARK_SEED', entity: 'sales', recordId: 's' + i, after: {id: 's' + i}});
    });
    const users = [];
    for (const [login, permissions] of [['fk-operator', ['catalog.view', 'inventory.view', 'sales.view', 'sales.create']],
      ['fk-approver', ['sales.authorize_inactive']]]) {
      const user = await createUser(store, {name: login, login, password}); users.push(user.id);
      store.transaction(() => {
        grantCompanyAccess(store, user.id, scope.companyId); grantUnitAccess(store, user.id, scope.companyId, scope.unitId);
        const role = createRole(store, scope.companyId, {name: login, permissions});
        assignRole(store, user.id, scope.companyId, scope.unitId, role.id);
      });
    }
    const payloadHash = createHash('sha256').update(store.db.prepare('SELECT payload FROM unit_states').get().payload).digest('hex');
    return {file, password, scope, operatorId: users[0], approverId: users[1], payloadHash,
      records: {products: n, customers: state.customers.length, suppliers: state.suppliers.length,
        purchases: state.purchases.length, receipts: state.purchases.length, sales: n * 2, movements: state.stockMovements.length}};
  } finally {await close(server, store);}
}
async function worker(input) {
  const {file, migrationsDir, scope, password, records, operatorId, approverId, candidate} = input;
  guard(file); guard(migrationsDir);
  guard(input.baselineSource);const originalSource=fs.readFileSync(input.baselineSource,'utf8'), candidateSource=require('./balance-lookup-candidate').candidate(originalSource);
  const meter = require('./sync-inventory-meter').install(true,{balanceLookupIndex:candidate,sources:{'foundation/inventory-store.js':candidate?candidateSource:originalSource}});
  const {SqlStore} = require('../foundation/sql-store');
  const store = new SqlStore(file, {environment: 'test', migrationsDir});
  let server;
  try {
    const db = store.db, beforePayload = db.prepare('SELECT payload FROM unit_states').get().payload;
    assert.equal(createHash('sha256').update(beforePayload).digest('hex'), input.payloadHash);
    assert.equal(db.prepare("SELECT count(*) n FROM sqlite_master WHERE type='index' AND name='stock_movements_scope_receipt'").get().n, 1);
    // Characterize the actual sync body before timing: exact rows/extras/anchors preserved.
    // The deliberately rolled-back call never participates in workload results.
    const inventoryTables = ['commercial_stock_movements', 'commercial_position_movements', 'commercial_stock_entries',
      'commercial_stock_balances', 'commercial_position_balances'];
    const inventoryRows = () => inventoryTables.map(table => db.prepare('SELECT * FROM ' + table + ' ORDER BY rowid').all());
    const originalRows = inventoryRows(), sentinel = new Error('Isolated measurement rollback');
    try {store.transaction(() => {
      const revision = db.prepare('SELECT revision FROM unit_states').get().revision;
      require('../foundation/inventory-store').syncInventory(store, scope, JSON.parse(beforePayload), revision);
      assert.deepEqual(inventoryRows(), originalRows);
      require('../foundation/inventory-store').verifyInventoryMirror(store, scope, JSON.parse(beforePayload));
      throw sentinel;
    });} catch (error) {if (error !== sentinel) throw error;}
    assert.deepEqual(inventoryRows(), originalRows);
    const statements = [
      ['DELETE FROM commercial_stock_movements WHERE company_id=? AND unit_id=?', [scope.companyId, scope.unitId]],
      ['SELECT * FROM commercial_position_balances WHERE company_id=? AND unit_id=? AND product_id=? ORDER BY ordinal', [scope.companyId, scope.unitId, 'p0']],
      ['SELECT * FROM commercial_stock_balances WHERE company_id=? AND unit_id=?', [scope.companyId, scope.unitId]],
      ['SELECT 1 FROM unit_memberships WHERE user_id=? AND company_id=? AND unit_id=?', [operatorId, scope.companyId, scope.unitId]],
      ['SELECT rowid FROM commercial_stock_movements WHERE company_id=? AND unit_id=? AND purchase_id=? AND receipt_ordinal=?', [scope.companyId, scope.unitId, 'b0', 0]]
    ];
    const plans = statements.map(([sql, args]) => ({sql, details: db.prepare('EXPLAIN QUERY PLAN ' + sql).all(...args).map(r => r.detail)}));
    const {createServer} = require('../server'), {Client} = require('../foundation/http-fixture');
    server = createServer({environment: 'test', filename: file, dataDir: path.dirname(file), store,
      importLegacy: false, pairingToken: randomBytes(32).toString('base64url'), backup: {enabled: false}});
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    const owner = new Client(origin), operator = new Client(origin);
    await owner.login('fk-owner', password); await operator.login('fk-operator', password);
    // Guards operate through the real endpoints. Never persist cookies, tokens, or passwords.
    assert.equal((await new Client(origin).call('/api/commercial/sales')).status, 401);
    assert.equal((await operator.call('/api/state')).status, 403);
    meter.attach(db);
    const measurements = [];
    async function call(client, url, body, expected = 200) {
      const value = await client.call(url, body);
      assert.equal(value.status, expected, url + ' ' + value.status + ' ' + (value.data?.code || ''));
      return value.data;
    }
    async function measure(name, fn, samples, warmup) {
      for (let i = 0; i < warmup; i++) await fn();
      const raw = [];
      for (let i = 0; i < samples; i++) {
        meter.reset(); const start = performance.now(); const timing = await fn();
        const elapsedMs = performance.now() - start, profile = meter.finish();
        raw.push({elapsedMs, timing: timing || null, profile, rssBytes: process.memoryUsage().rss});
      }
      const result = {name, samples, warmup, ms: summary(raw.map(x => x.elapsedMs)), raw};
      measurements.push(result);
      process.send({progress: {size: input.size, round: input.round, candidate, operation: name, medianMs: result.ms.median}});
    }
    const draft = id => ({requestId: randomUUID(), customerId: 'c0', items: [{productId: id, quantity: 1, priceCents: 1237}],
      paymentMethod: 'pix', paymentStatus: 'received', expectedCashSessionId: null});
    let lastNormal;
    await measure('normal-sale', async () => {
      const body = draft('p0'), value = await call(operator, '/api/commercial/sales', body, 201);
      assert.equal(value.sale.execution.executedBy, operatorId); lastNormal = {body, id: value.sale.id};
    }, 5, 1);
    let exceptional = 0;
    await measure('exceptional-sale-with-approval', async () => {
      const body = draft('p' + (records.products - 1 - exceptional++));
      const start = performance.now();
      const grant = await call(operator, '/api/commercial/sales/inactive-approval', {saleDraft: body,
        approverLogin: 'fk-approver', approverPassword: password, reason: 'Medição sintética de estoque'}, 201);
      const grantMs = performance.now() - start, commitStart = performance.now();
      const value = await call(operator, '/api/commercial/sales', {...body, approvalToken: grant.approvalToken}, 201);
      assert.equal(value.sale.execution.executedBy, operatorId);
      assert.equal(value.sale.execution.authorizedBy, approverId);
      return {grantMs, commitMs: performance.now() - commitStart};
    }, 3, 1);
    let version = 2;
    await measure('purchase-receive', async () => {
      const value = await call(owner, '/api/purchases/receive', {id: 'b0', expectedVersion: version,
        requestId: randomUUID(), items: [{productId: 'p0', quantity: 1}]}, 201);
      version = value.purchases.find(p => p.id === 'b0').version;
    }, 3, 1);
    await measure('stock-entry', () => call(owner, '/api/stock', {id: 'p1', quantity: 1,
      requestId: randomUUID(), note: 'Entrada sintética'}, 201).then(() => null), 3, 1);
    const {loadState} = require('../foundation/scoped-state');
    const {canonical} = require('../foundation/state-repository');
    const current = loadState(store, scope), initial = JSON.parse(beforePayload);
    assert.equal(current.state.sales.length, records.sales + 10);
    assert.equal(current.state.stockMovements.length, records.movements + 18);
    assert.equal(current.state.products.find(p => p.id === 'p0').stock, initial.products.find(p => p.id === 'p0').stock - 6 + 4);
    assert.equal(current.state.products.find(p => p.id === 'p1').stock, initial.products.find(p => p.id === 'p1').stock + 4);
    assert.deepEqual(current.state.sales.filter(s => initial.sales.some(old => old.id === s.id)), initial.sales);
    assert.deepEqual(current.state.stockMovements.slice(0, initial.stockMovements.length), initial.stockMovements);
    const beforeReplay = canonical(current), audits = db.prepare('SELECT count(*) n FROM audit_events').get().n;
    const replay = await call(operator, '/api/commercial/sales', lastNormal.body, 201);
    assert.equal(replay.sale.id, lastNormal.id);
    assert.equal(canonical(loadState(store, scope)), beforeReplay);
    assert.equal(db.prepare('SELECT count(*) n FROM audit_events').get().n, audits);
    assert(require('../foundation/audit').verifyAuditChain(store));
    assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.deepEqual(db.prepare('PRAGMA integrity_check').all().map(r => r.integrity_check), ['ok']);
    const relationalDigest = {};
    // Exact preexisting history and mirror assertions above; random new IDs/time excluded only for paired digest comparison.
    for (const table of ['commercial_products', 'commercial_stock_balances', 'commercial_stock_movements',
      'commercial_stock_entries', 'commercial_purchases', 'commercial_purchase_receipts', 'commercial_sales', 'entity_index']) {
      relationalDigest[table] = db.prepare('SELECT count(*) n FROM ' + table).get().n;
    }
    const exactEquivalence=require('./mirror-balance-equivalence').equivalence(store,scope,current.state,[originalSource,candidateSource]);
    for(const measurement of measurements)for(const sample of measurement.raw){const target=sample.profile.sql.filter(q=>/^INSERT INTO commercial_stock_movements\(/.test(q.text));assert.equal(target.length,1);assert.equal(target[0].prepares,1);const sync=sample.profile.calls.find(c=>c.name==='syncInventory');assert.equal(sync.counts.productMovementVisits,sync.counts.stockMovements);const verifiers=sample.profile.calls.filter(c=>c.name==='verifyInventoryMirror');assert.equal(verifiers.length,measurement.name==='exceptional-sale-with-approval'?4:3);for(const verifier of verifiers){assert.equal(verifier.counts.productMovementVisits,verifier.counts.stockMovements);assert.equal(verifier.counts.balances,verifier.counts.products);assert.equal(verifier.counts.findComparisons,candidate?0:verifier.counts.products*(verifier.counts.products+1)/2);assert.equal(verifier.counts.mapLookups,candidate?verifier.counts.products:0);}}
    const countedVisits={baseline:require('./balance-lookup-candidate').visits(originalSource,store,scope,current.state,false),candidate:require('./balance-lookup-candidate').visits(candidateSource,store,scope,current.state,true)};
    const result = {countedVisits,exactEquivalence, size: input.size, round: input.round, candidate, records, plans, measurements, file,
      sourceHashes: meter.verifySources(), relationalDigest, finalRevision: current.revision,
      finalProducts: current.state.products.map(p => ({id: p.id, stock: p.stock})),
      auditCount: audits, sqlite: db.prepare('SELECT sqlite_version() v').get().v,
      checks: ['real HTTP/auth/RBAC/CSRF', 'unauthenticated denied', 'partial operator snapshot denied',
        'mirror equivalence', 'old sale/movement history unchanged', 'expected stock and record totals',
        'executor and authorizer', 'replay without revision or audit changes', 'audit chain', 'FK ON/check',
        'integrity_check ok', 'production source hashes unchanged']};
    fs.writeFileSync(guard(file + '.json'), JSON.stringify(result, null, 2) + '\n');
    return result;
  } finally {await close(server, store);}
}
function dispatch(input) {
  return new Promise((resolve, reject) => {
    const child = fork(__filename, ['--worker'], {cwd: path.resolve(__dirname, '..'), windowsHide: true,
      stdio: ['ignore', 'ignore', 'pipe', 'ipc']});
    let result, errors = '';
    child.stderr.on('data', value => errors += value);
    child.on('message', value => {if (value.progress) console.log(JSON.stringify(value.progress)); else if (value.result) result = value.result;});
    child.on('error', reject);
    child.on('exit', code => code === 0 && result ? resolve(result) : reject(new Error(errors || 'Isolated worker failed.')));
    child.send(input);
  });
}
async function run() {
  fs.mkdirSync(ROOT, {recursive: true}); const dir = fs.mkdtempSync(path.join(ROOT, 'paired-'));
  const reference = process.argv[2] === '--baseline' ? guard(path.resolve(process.argv[3] || ''))
    : path.resolve(__dirname, '../foundation/inventory-store.js');
  const baselineText = fs.readFileSync(reference, 'utf8');
  assert(baselineText.includes('let stockMovementInsert=null;')&&baselineText.includes(' const movementTotals=new Map();')&&baselineText.includes(' const verifiedMovementTotals=new Map();')&&baselineText.includes(require('./balance-lookup-candidate').lookup),'Baseline must preserve previous accumulators and original balances.find.');
  const baselineSource=path.join(dir,'inventory-baseline.js');fs.writeFileSync(baselineSource,baselineText);const beforeSHA256=fingerprint(baselineSource);fs.writeFileSync(path.join(dir,'inventory-candidate.js'),require('./balance-lookup-candidate').candidate(baselineText));
  const migrationsDir = path.join(dir, 'migrations-001-010'); fs.mkdirSync(migrationsDir);
  const originals = fs.readdirSync(path.resolve(__dirname, '../foundation/migrations')).filter(f => /^(00[1-9]|010)_.*\.sql$/.test(f)).sort();
  assert.equal(originals.length, 10);
  for (const file of originals) fs.copyFileSync(path.resolve(__dirname, '../foundation/migrations', file), path.join(migrationsDir, file));
  const volumes = [];
  for (const [size, n] of [['small', 100], ['medium', 500], ['large', 1500]]) {
    const volumeDir = path.join(dir, size); fs.mkdirSync(volumeDir);
    const fixture = await seed(n, volumeDir, migrationsDir), sourceHash = fingerprint(fixture.file), runs = [];
    for (let round = 1; round <= 3; round++) {
      const pair = [];
      for (const candidate of round % 2 ? [false, true] : [true, false]) {
        const file = path.join(volumeDir, 'round-' + round + '-' + (candidate ? 'local-index' : 'baseline') + '.sqlite');
        fs.copyFileSync(fixture.file, file); assert.equal(fingerprint(file), sourceHash);
        const result = await dispatch({...fixture, file, candidate, size, round, migrationsDir,baselineSource});
        result.databaseRetained = round === 1;
        if (round !== 1) for (const suffix of ['', '-wal', '-shm']) if (fs.existsSync(file + suffix)) fs.unlinkSync(guard(file + suffix));
        runs.push(result); pair.push(result);
        assert.equal(fingerprint(fixture.file), sourceHash, 'Synthetic source must stay unchanged.');
      }
      assert.deepEqual(pair[0].relationalDigest, pair[1].relationalDigest);
      assert.deepEqual(pair[0].finalProducts, pair[1].finalProducts);
      assert.equal(pair[0].finalRevision, pair[1].finalRevision);
      assert.equal(pair[0].auditCount, pair[1].auditCount);
    }
    volumes.push({size, source: fixture.file, sourceHash, records: fixture.records, runs});
    fs.writeFileSync(path.join(dir, 'partial.json'), JSON.stringify(volumes, null, 2) + '\n');
  }
  const report = {date: new Date().toISOString(), version: require('../package.json').version,
    environment: {node: process.version, os: os.release(), cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length},
    baselineSource,beforeSHA256,migrations: originals, method: ['Three paired baseline/candidate rounds per scale, alternating AB/BA/AB, identical profiling in both arms.',
      'All migrations 001..010 in both arms, closed identical synthetic file copies; fresh process per arm.',
      'One warmup per operation; 5 normal samples and 3 exceptional (grant + commit), receipt, entry per round.',
      'Hooks only in memory; real production bodies/HTTP/security/transactions/FKs/audit/equivalence unchanged.',
      'SQL timings measure synchronous JS-to-SQLite boundary (prepare and execution), not pure SQLite CPU.',
      'Residual is not pure JS: hooks, clock/aggregation overhead, native serialization and untimed work remain.',
      'No samples discarded, no GC/cache manipulation; both arms use identical hooks; host variation remains visible.',
      'Timing counts derived from loops/input shape; additionally actual visit counters replay both bodies in untimed read-only replays.',
      'Only balance lookup Map compiled in memory, retaining first match. Both existing accumulators, all arithmetic and syncInventory unchanged. No new index/migration, credentials or operational data.'], volumes};
  const destination = path.join(dir, 'report.json'); fs.writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({report: destination}));
}
if (require.main === module) {
  if (process.argv[2] === '--worker') process.once('message', input => worker(input).then(result => {
    process.send({result}, () => process.disconnect());
  }).catch(error => {console.error(error.stack); process.exit(1);}));
  else if (process.argv[2] === '--help') console.log('node scripts/benchmark-balance-lookup.js [--baseline saved-QA-inventory-baseline.js]\nOne candidate only. Synthetic .qa/foundation-v1.2/balance-lookup/paired-* DBs, migrations 001..010. Three scales and three baseline/candidate pairs each, identical instrumentation. After optimization use --baseline with the preserved source inside the balance-lookup QA directory. No operational DB or production changes.');
  else run().catch(error => {console.error(error.stack); process.exitCode = 1;});
}
