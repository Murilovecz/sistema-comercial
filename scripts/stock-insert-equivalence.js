'use strict';
// Same-input replay in discarded synthetic transactions. No clock override during HTTP timing.
const assert = require('node:assert/strict'), path = require('node:path'), Module = require('node:module');
const {createHash} = require('node:crypto');
function compile(source) {
  const file = path.resolve(__dirname, '../foundation/inventory-store.js'), mod = new Module(file, module);
  mod.filename = file; mod.paths = Module._nodeModulePaths(path.dirname(file));
  mod._compile(source, file); return mod.exports;
}
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function contents(store) {
  const withoutRowid = new Set(store.db.prepare('PRAGMA table_list').all().filter(row => row.schema === 'main' && row.wr).map(row => row.name));
  const quoted = name => '"' + name.replaceAll('"', '""') + '"';
  return store.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()
    .map(({name}) => {
      const order = withoutRowid.has(name)
        ? store.db.prepare('PRAGMA table_info(' + quoted(name) + ')').all().filter(row => row.pk).sort((a, b) => a.pk - b.pk).map(row => quoted(row.name)).join(',')
        : 'rowid';
      return [name, store.db.prepare('SELECT * FROM ' + quoted(name) + ' ORDER BY ' + order).all()];
    });
}
function digest(value) {return createHash('sha256').update(canonical(value)).digest('hex');}
function equivalence(store, scope, state, revision, sources) {
  const initial = contents(store), before = digest(initial), results = [];
  const RealDate = globalThis.Date, fixed = RealDate.parse('2026-10-03T12:00:00.000Z');
  class FixedDate extends RealDate {constructor(...args) {super(...(args.length ? args : [fixed]));} static now() {return fixed;}}
  const stop = new Error('Synthetic equivalence rollback');
  try {
    globalThis.Date = FixedDate;
    for (const source of sources) {
      const inventory = compile(source);
      try {store.transaction(() => {
        inventory.syncInventory(store, scope, structuredClone(state), revision);
        assert.deepEqual(inventory.verifyInventoryMirror(store, scope, state), state);
        assert.deepEqual(store.db.prepare('PRAGMA foreign_key_check').all(), []);
        assert.deepEqual(store.db.prepare('PRAGMA integrity_check').all().map(r => r.integrity_check), ['ok']);
        results.push(contents(store)); throw stop;
      });} catch (error) {if (error !== stop) throw error;}
      assert.equal(digest(contents(store)), before, 'Replay must leave every database row unchanged.');
    }
  } finally {globalThis.Date = RealDate;}
  assert.deepEqual(results[0], results[1], 'Exact contents, not counts: inventory, snapshot, markers/revisions, audit, and all other tables.');
  return {before, baseline: digest(results[0]), candidate: digest(results[1]), equal: true,
    clock: 'Fixed only during discarded same-input sync replay, for exact normalized_at equality; HTTP uses real clock.',
    tables: results[0].map(([name, rows]) => ({name, rows: rows.length, sha256: digest(rows)}))};
}
module.exports = {compile, contents, canonical, digest, equivalence};
