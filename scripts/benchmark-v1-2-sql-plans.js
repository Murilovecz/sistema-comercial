'use strict';
// Read-only follow-up for an already completed synthetic HTTP benchmark.
// EXPLAIN compiles plans; no INSERT/UPDATE/DELETE is executed and no migrations are opened.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {DatabaseSync} = require('node:sqlite');
const {safeFile} = require('./benchmark-v1-2-http');
const root = path.resolve(__dirname, '../.qa/foundation-v1.2/benchmarks');
function run(reportFile) {
  const resolved = path.resolve(reportFile);
  assert(resolved.startsWith(root + path.sep) && path.basename(resolved) === 'report.json');
  const report = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  const volumes = report.volumes.map(volume => {
    const db = new DatabaseSync(safeFile(volume.database), {readOnly: true});
    try {
      db.exec('PRAGMA foreign_keys=ON; PRAGMA query_only=ON;');
      const plans = volume.sqlProfile.topByCalls.map(entry => ({
        sql: entry.sql, measuredCalls: entry.calls, measuredStatementMs: entry.ms,
        details: db.prepare('EXPLAIN QUERY PLAN ' + entry.sql)
          .all(...Array.from(entry.sql.matchAll(/\?/g), () => null)).map(row => row.detail)
      }));
      const tables = ['commercial_purchase_receipts', 'commercial_purchase_receipt_items',
        'commercial_stock_movements', 'commercial_position_movements', 'entity_index'];
      const schema = tables.map(table => ({table,
        foreignKeys: db.prepare('PRAGMA foreign_key_list(' + table + ')').all(),
        indexes: db.prepare('PRAGMA index_list(' + table + ')').all().map(index => ({
          name: index.name, unique: index.unique,
          columns: db.prepare('PRAGMA index_info(' + index.name + ')').all().map(column => column.name)
        }))}));
      return {size: volume.size, plans, schema};
    } finally {db.close();}
  });
  const result = {date: new Date().toISOString(), source: resolved,
    method: 'Read-only EXPLAIN QUERY PLAN after measured bottleneck. Null binds describe the compiled strategy, not per-row execution cost. Foreign keys ON; no mutations, indexes or migrations.', volumes};
  const output = path.join(path.dirname(resolved), 'write-query-plans.json');
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({output}));
  return result;
}
if (require.main === module) {
  if (process.argv[2] === '--help') console.log('node scripts/benchmark-v1-2-sql-plans.js .qa/foundation-v1.2/benchmarks/http-<id>/report.json\nRead-only query plans for the measured synthetic workload; no production connection.');
  else try {run(process.argv[2]);} catch (error) {console.error(error.message); process.exitCode = 1;}
}
module.exports = {run};
