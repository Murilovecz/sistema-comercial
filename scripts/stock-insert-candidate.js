'use strict';
// One isolated candidate, applied in memory before any production decision.
const assert = require('node:assert/strict');
function once(source, before, after) {
  assert.equal(source.split(before).length, 2, 'Candidate anchor must occur exactly once.');
  return source.replace(before, after);
}
function candidate(source) {
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  source = source.replace(/\r\n/g, '\n');
  source = once(source, ' for(const[kind,table]of Object.entries(tables))for',
    ' let stockMovementInsert=null;\n try{\n for(const[kind,table]of Object.entries(tables))for');
  source = once(source,
    "  const columns=Object.keys(row);store.db.prepare('INSERT INTO '+table+'('+columns.join(',')+') VALUES('+columns.map(()=>'?').join(',')+')').run(...columns.map(c=>row[c]));",
    "  const columns=Object.keys(row);\n" +
    "  if(kind==='stockMovements'){\n" +
    "   if(!stockMovementInsert)stockMovementInsert=store.db.prepare('INSERT INTO '+table+'('+columns.join(',')+') VALUES('+columns.map(()=>'?').join(',')+')');\n" +
    "   stockMovementInsert.run(...columns.map(c=>row[c]));\n" +
    "  }else store.db.prepare('INSERT INTO '+table+'('+columns.join(',')+') VALUES('+columns.map(()=>'?').join(',')+')').run(...columns.map(c=>row[c]));");
  source = once(source, " }\n for(const p of state.products){let sum='0';",
    " }\n }finally{\n  // Node 24 StatementSync has no public finalize; drop the call-local reference even on failure.\n  stockMovementInsert=null;\n }\n for(const p of state.products){let sum='0';");
  return source.replace(/\n/g, newline);
}
module.exports = {candidate};
