'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { createHash } = require('node:crypto');
const { AppError } = require('./errors');
const { guardDatabasePath } = require('./config');
const hash = value => createHash('sha256').update(value).digest('hex');
class SqlStore {
  constructor(filename, options = {}) {
    if (!filename) throw Error('Informe um banco SQL explícito.');
    this.environment=options.environment||process.env.APP_ENV||process.env.NODE_ENV||'development';
    guardDatabasePath(filename,this.environment);
    if (filename !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
    this.filename = filename;
    this.db = new DatabaseSync(filename);
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL;');
    if (filename !== ':memory:') this.db.exec('PRAGMA journal_mode=WAL;');
    this.inTransaction = false;this.transactionEpoch=0;
    try { this.migrate(options.migrationsDir || path.join(__dirname,'migrations')); }
    catch(error) { this.db.close(); throw error; }
  }
  migrate(dir) {
    const files = fs.readdirSync(dir).filter(n => /^\d+_[a-z0-9_]+\.sql$/.test(n)).sort();
    const numeric=files.map(n=>Number(n.split('_')[0]));
    if(new Set(numeric).size!==numeric.length||numeric.some(n=>!Number.isSafeInteger(n)))throw Error('Número de migration duplicado ou inválido.');
    files.sort((a,b)=>Number(a.split('_')[0])-Number(b.split('_')[0]));
    const exists=this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'").get();
    const applied=exists?this.db.prepare('SELECT version,checksum FROM schema_migrations').all().sort((a,b)=>Number(a.version.split('_')[0])-Number(b.version.split('_')[0])):[];
    for(let i=0;i<applied.length;i++){
      if(applied[i].version!==files[i])throw Error('Migration aplicada ausente, desconhecida ou fora de ordem: '+applied[i].version);
      if(hash(fs.readFileSync(path.join(dir,files[i]),'utf8'))!==applied[i].checksum)throw Error('Migration já aplicada foi alterada: '+files[i]);
    }
    this.db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL) STRICT;');
    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir,file),'utf8'), checksum = hash(sql);
      const previous = this.db.prepare('SELECT checksum FROM schema_migrations WHERE version=?').get(file);
      if (previous) { if (previous.checksum !== checksum) throw Error('Migration já aplicada foi alterada: '+file); continue; }
      this.transaction(() => { this.db.exec(sql); this.db.prepare('INSERT INTO schema_migrations VALUES(?,?,?)').run(file,checksum,new Date().toISOString()); });
    }
  }
  transaction(fn) {
    if (this.inTransaction) throw Error('Transação aninhada não permitida.');
    if(typeof fn!=='function'||fn.constructor?.name==='AsyncFunction')throw Error('A transação exige callback síncrono.');
    this.db.exec('BEGIN IMMEDIATE'); this.inTransaction = true;this.transactionEpoch++;
    try { const result = fn(); if (result && typeof result.then === 'function') throw Error('Não manter transação SQL aberta durante operação assíncrona.'); this.db.exec('COMMIT'); return result; }
    catch(error) { this.db.exec('ROLLBACK'); throw error; }
    finally { this.inTransaction = false; }
  }
  requireTransaction() { if (!this.inTransaction) throw Error('Esta escrita exige transação.'); }
  meta(key) { return this.db.prepare('SELECT value FROM foundation_meta WHERE key=?').get(key)?.value; }
  setMeta(key,value) { this.requireTransaction(); this.db.prepare('INSERT INTO foundation_meta VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,String(value)); }
  close() { this.db.close(); }
}
function name(value) { if (typeof value !== 'string' || !value.trim() || value.trim().length>120) throw new AppError(422,'INVALID_NAME','Informe um nome de até 120 caracteres.'); return value.trim(); }
module.exports = { SqlStore, hash, name };
