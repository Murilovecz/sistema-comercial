'use strict';
// One-index experiment, always synthetic. Migrations 001..009 are frozen for both arms.
// Passwords travel only through the worker IPC channel; never argv/files/results.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict');
const {performance} = require('node:perf_hooks');
const {randomBytes, randomUUID, createHash} = require('node:crypto');
const {fork} = require('node:child_process');
const {summary} = require('./benchmark-v1-2-http');
const ROOT = path.resolve(__dirname, '../.qa/foundation-v1.2/receipt-fk');
const INDEX_NAME = 'stock_movements_scope_receipt';
const INDEX_SQL = 'CREATE INDEX ' + INDEX_NAME + ' ON commercial_stock_movements(company_id,unit_id,purchase_id,receipt_ordinal);';
function guard(file) {
  const resolved = path.resolve(file);
  assert(resolved.startsWith(ROOT + path.sep), 'Only isolated receipt FK QA paths.');
  return resolved;
}
const fingerprint = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
async function close(server, store) {
  if (server) await new Promise(resolve => {server.close(resolve); server.closeAllConnections();});
  store.close();
}
function instrument(db) {
  const prepare = db.prepare.bind(db);
  let stats;
  function reset() {stats = {executions: 0, returnedRows: 0, snapshotReads: 0, relevant: new Map()};}
  reset();
  db.prepare = sql => new Proxy(prepare(sql), {get(target, key) {
    const value = target[key]; if (typeof value !== 'function') return value;
    return (...args) => {
      if (!['get', 'all', 'run'].includes(key)) return value.apply(target, args);
      stats.executions++;
      if (/SELECT revision,payload FROM unit_states/i.test(sql)) stats.snapshotReads++;
      const relevant = /^(?:INSERT INTO|DELETE FROM) commercial_purchase_receipts\b/.test(sql);
      const start = relevant ? performance.now() : 0, result = value.apply(target, args);
      if (key === 'get' && result) stats.returnedRows++;
      if (key === 'all') stats.returnedRows += result.length;
      if (relevant) {
        let entry = stats.relevant.get(sql);
        if (!entry) {entry = {sql, calls: 0, ms: 0}; stats.relevant.set(sql, entry);}
        entry.calls++; entry.ms += performance.now() - start;
      }
      return result;
    };
  }});
  return {reset, get: () => stats};
}
function databaseSize(db, file) {
  const pageSize = db.prepare('PRAGMA page_size').get().page_size;
  return {pageSize, pageCount: db.prepare('PRAGMA page_count').get().page_count,
    freePages: db.prepare('PRAGMA freelist_count').get().freelist_count,
    fileBytes: fs.statSync(file).size};
}
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
  const {file, candidate, migrationsDir, scope, password, records, operatorId, approverId} = input;
  guard(file); guard(migrationsDir);
  const {SqlStore} = require('../foundation/sql-store');
  const store = new SqlStore(file, {environment: 'test', migrationsDir});
  let server;
  try {
    const db = store.db, before = databaseSize(db, file), beforePayload = db.prepare('SELECT payload FROM unit_states').get().payload;
    assert.equal(createHash('sha256').update(beforePayload).digest('hex'), input.payloadHash);
    assert.equal(db.prepare("SELECT count(*) n FROM sqlite_master WHERE type='index' AND name=?").get(INDEX_NAME).n, 0);
    let buildMs = null;
    if (candidate) {const start = performance.now(); db.exec(INDEX_SQL); buildMs = performance.now() - start;}
    assert.equal(db.prepare('SELECT payload FROM unit_states').get().payload, beforePayload);
    db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    const after = databaseSize(db, file);
    const schema = {foreignKeys: db.prepare('PRAGMA foreign_key_list(commercial_stock_movements)').all(),
      indexes: db.prepare('PRAGMA index_list(commercial_stock_movements)').all().map(idx => ({name: idx.name,
        unique: idx.unique, columns: db.prepare('PRAGMA index_info(' + idx.name + ')').all().map(c => c.name)}))};
    const receiptColumns = db.prepare('PRAGMA table_info(commercial_purchase_receipts)').all().map(c => c.name);
    const receipt = db.prepare('SELECT * FROM commercial_purchase_receipts LIMIT 1').get();
    const insert = 'INSERT INTO commercial_purchase_receipts (' + receiptColumns.join(',') + ') VALUES (' + receiptColumns.map(() => '?').join(',') + ')';
    const queries = [
      [insert, receiptColumns.map(c => receipt[c])],
      ['DELETE FROM commercial_purchase_receipts WHERE company_id=? AND unit_id=?', [scope.companyId, scope.unitId]],
      ['SELECT rowid FROM commercial_stock_movements WHERE company_id=? AND unit_id=? AND purchase_id=? AND receipt_ordinal=?',
        [scope.companyId, scope.unitId, receipt.purchase_id, receipt.ordinal]],
      ['SELECT * FROM commercial_stock_movements WHERE company_id=? AND unit_id=? ORDER BY ordinal', [scope.companyId, scope.unitId]]
    ];
    const plans = queries.map(([sql, args]) => ({sql, details: db.prepare('EXPLAIN QUERY PLAN ' + sql).all(...args).map(row => row.detail)}));
    let indexBytes;
    try {indexBytes = db.prepare('SELECT coalesce(sum(pgsize),0) bytes FROM dbstat WHERE name=?').get(INDEX_NAME).bytes;}
    catch {indexBytes = (after.pageCount - before.pageCount) * after.pageSize;}
    const {createServer} = require('../server'), {Client} = require('../foundation/http-fixture');
    server = createServer({environment: 'test', filename: file, dataDir: path.dirname(file), store,
      importLegacy: false, pairingToken: randomBytes(32).toString('base64url'), backup: {enabled: false}});
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    const owner = new Client(origin), operator = new Client(origin);
    await owner.login('fk-owner', password); await operator.login('fk-operator', password);
    const meter = instrument(db), measurements = [];
    async function call(client, url, body, expected = 200) {
      const value = await client.call(url, body);
      assert.equal(value.status, expected, url + ' ' + value.status + ' ' + (value.data?.code || ''));
      return value.data;
    }
    async function measure(name, fn, samples, warmup) {
      for (let i = 0; i < warmup; i++) await fn();
      const raw = [];
      for (let i = 0; i < samples; i++) {
        meter.reset(); const start = performance.now(); await fn(); const elapsedMs = performance.now() - start;
        const stats = meter.get();
        raw.push({elapsedMs, executions: stats.executions, returnedRows: stats.returnedRows, snapshotReads: stats.snapshotReads,
          receiptStatements: [...stats.relevant.values()], receiptStatementMs: [...stats.relevant.values()].reduce((sum, q) => sum + q.ms, 0),
          rssBytes: process.memoryUsage().rss});
      }
      const result = {name, samples, warmup, ms: summary(raw.map(x => x.elapsedMs)),
        executions: summary(raw.map(x => x.executions)), returnedRows: summary(raw.map(x => x.returnedRows)),
        receiptStatementMs: summary(raw.map(x => x.receiptStatementMs)), raw};
      measurements.push(result);
      process.send({progress: {size: input.size, round: input.round, candidate, operation: name, medianMs: result.ms.median}});
    }
    for (const [name, url] of [['sales-read', 'sales?sort=date&direction=desc&pageSize=25'],
      ['products-read', 'catalog?sort=name&pageSize=25'], ['movements-read', 'inventory/movements?sort=date&pageSize=25']]) {
      await measure(name, () => call(operator, '/api/commercial/' + url), 20, 2);
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
      const grant = await call(operator, '/api/commercial/sales/inactive-approval', {saleDraft: body,
        approverLogin: 'fk-approver', approverPassword: password, reason: 'Experimento sintético FK'}, 201);
      const value = await call(operator, '/api/commercial/sales', {...body, approvalToken: grant.approvalToken}, 201);
      assert.equal(value.sale.execution.authorizedBy, approverId);
    }, 3, 1);
    let version = 2;
    await measure('purchase-receive', async () => {
      const value = await call(owner, '/api/purchases/receive', {id: 'b0', expectedVersion: version,
        requestId: randomUUID(), items: [{productId: 'p0', quantity: 1}]}, 201);
      version = value.purchases.find(p => p.id === 'b0').version;
    }, 3, 1);
    await measure('stock-entry', () => call(owner, '/api/stock', {id: 'p1', quantity: 1,
      requestId: randomUUID(), note: 'Entrada sintética'}, 201), 3, 1);
    const {loadState} = require('../foundation/scoped-state');
    const {canonical} = require('../foundation/state-repository');
    const current = loadState(store, scope), initial = JSON.parse(beforePayload);
    assert.equal(current.state.sales.length, records.sales + 10);
    assert.equal(current.state.stockMovements.length, records.movements + 18);
    assert.equal(current.state.products.find(p => p.id === 'p0').stock, initial.products.find(p => p.id === 'p0').stock - 6 + 4);
    assert.equal(current.state.products.find(p => p.id === 'p1').stock, initial.products.find(p => p.id === 'p1').stock + 4);
    assert.deepEqual(current.state.sales.filter(s => initial.sales.some(old => old.id === s.id)), initial.sales);
    assert.deepEqual(current.state.stockMovements.slice(0, initial.stockMovements.length), initial.stockMovements);
    const snapshotBeforeReplay = canonical(current), auditBeforeReplay = db.prepare('SELECT count(*) n FROM audit_events').get().n;
    const replay = await call(operator, '/api/commercial/sales', lastNormal.body, 201);
    assert.equal(replay.sale.id, lastNormal.id);
    assert.equal(canonical(loadState(store, scope)), snapshotBeforeReplay);
    assert.equal(db.prepare('SELECT count(*) n FROM audit_events').get().n, auditBeforeReplay);
    assert(require('../foundation/audit').verifyAuditChain(store));
    assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.deepEqual(db.prepare('PRAGMA integrity_check').all().map(row => row.integrity_check), ['ok']);
    db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    const result = {size: input.size, round: input.round, candidate, records, payloadHash: input.payloadHash,
      file, beforeSize: before, afterIndexSize: after, finalSize: databaseSize(db, file), indexBytes, buildMs,
      schema, plans, measurements, sqlite: db.prepare('SELECT sqlite_version() v').get().v,
      checks: ['HTTP/RBAC/CSRF', 'mirror equivalence', 'history unchanged', 'expected stock/sale/movement totals',
        'executor/authorizer', 'idempotent replay without new audit', 'audit chain', 'foreign_keys ON', 'foreign_key_check empty', 'integrity_check ok']};
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
  const migrationsDir = path.join(dir, 'migrations-001-009'); fs.mkdirSync(migrationsDir);
  const originals = fs.readdirSync(path.resolve(__dirname, '../foundation/migrations')).filter(f => /^00[1-9]_.*\.sql$/.test(f)).sort();
  assert.equal(originals.length, 9);
  for (const file of originals) fs.copyFileSync(path.resolve(__dirname, '../foundation/migrations', file), path.join(migrationsDir, file));
  const volumes = [];
  for (const [size, n] of [['small', 100], ['medium', 500], ['large', 1500]]) {
    const volumeDir = path.join(dir, size); fs.mkdirSync(volumeDir);
    const fixture = await seed(n, volumeDir, migrationsDir), sourceHash = fingerprint(fixture.file), runs = [];
    for (let round = 1; round <= 3; round++) for (const candidate of round % 2 ? [false, true] : [true, false]) {
      const file = path.join(volumeDir, 'round-' + round + '-' + (candidate ? 'index' : 'baseline') + '.sqlite');
      fs.copyFileSync(fixture.file, file); assert.equal(fingerprint(file), sourceHash);
      const result = await dispatch({...fixture, file, candidate, size, round, migrationsDir});
      result.databaseRetained = round === 1;
      if (round !== 1) for (const suffix of ['', '-wal', '-shm']) if (fs.existsSync(file + suffix)) fs.unlinkSync(guard(file + suffix));
      runs.push(result);
      assert.equal(fingerprint(fixture.file), sourceHash, 'Synthetic source must stay unchanged.');
    }
    volumes.push({size, source: fixture.file, sourceHash, records: fixture.records, runs});
    fs.writeFileSync(path.join(dir, 'partial.json'), JSON.stringify(volumes, null, 2) + '\n');
  }
  const report = {date: new Date().toISOString(), version: require('../package.json').version,
    environment: {node: process.version, os: os.release(), cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length},
    candidate: INDEX_SQL, migrations: originals,
    method: ['Three paired rounds per scale, alternating AB/BA/AB; exact closed-file copies of one synthetic source.',
      'Fresh process for each arm, SQLite WAL synchronous FULL, real HTTP sessions/CSRF/RBAC/scopes/audit/rate limits.',
      '20 reads + 2 warm-ups; normal sale 5 + 1; exceptional (grant + commit), receipt and stock entry 3 + 1 each.',
      'No samples discarded; no forced GC/cache flushing. Receipt statement timers in both arms; no SQL bind data in artifacts.',
      'Index DDL outside endpoint timings; size/build time captured before workload. Keep round 1 databases only.',
      'Exceptional timing includes real authorization KDF, unlike the separate grant/commit measurements of previous benchmark.',
      'No artificial functional RED; after operations validate histories, business totals, replay, audit, FK and integrity.'], volumes};
  const destination = path.join(dir, 'report.json'); fs.writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({report: destination}));
}
if (require.main === module) {
  if (process.argv[2] === '--worker') process.once('message', input => worker(input).then(result => {
    process.send({result}, () => process.disconnect());
  }).catch(error => {console.error(error.message); process.exit(1);}));
  else if (process.argv[2] === '--help') console.log('node scripts/benchmark-receipt-fk.js\nOnly fresh synthetic .qa/foundation-v1.2/receipt-fk/paired-* databases. Compares migrations 001..009 with/without one candidate index, three alternating rounds and three scales. No operational DB, credentials persisted, production DDL, or old migration changes.');
  else run().catch(error => {console.error(error.message); process.exitCode = 1;});
}
module.exports = {INDEX_NAME, INDEX_SQL};
