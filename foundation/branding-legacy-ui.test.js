'use strict';
const {test} = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {fixture} = require('./http-fixture');
const core = require('../shared/branding-core.mjs');

test('BRAND adapter legado: default antes do login, contexto, late response, logout e texto seguro', async () => {
  const requests = [], styles = new Map(), node = {textContent: ''}, media = {matches: false, addEventListener() {}};
  const document = {title: '', documentElement: {style: {setProperty: (k, v) => styles.set(k, v)}}, querySelectorAll: () => [node]};
  const window = {foundationContext: null, matchMedia: () => media};
  const source = fs.readFileSync(path.join(__dirname, '../public/branding-ui.js'), 'utf8').replace(/^import .*?;\r?\n/, 'const {DEFAULT_BRANDING, brandTokens, createBrandingLoader} = core;\n');
  vm.runInNewContext(source, {window, document, core, fetch: (url, options) => new Promise(resolve => requests.push({url, options, resolve}))});
  assert.equal(document.title, core.DEFAULT_BRANDING.displayName);
  const a = {sessionId: 'synthetic-session', companyId: 'A', unitId: 'A1'}, b = {...a, companyId: 'B', unitId: 'B1'};
  const first = window.organizationBranding.load(a);
  assert.equal(requests[0].options.headers['X-Company-ID'], 'A');
  const second = window.organizationBranding.load(b);
  assert.equal(styles.get('--brand-primary'), core.DEFAULT_BRANDING.primaryColor);
  assert.equal(requests[0].options.signal.aborted, true);
  requests[1].resolve({ok: true, json: async () => ({...core.DEFAULT_BRANDING, displayName: '<B>', primaryColor: '#0000FF', revision: 1})});
  await second; assert.equal(node.textContent, '<B>'); assert.equal(document.title, '<B>');
  assert.equal(styles.get('--legacy-background'), '#F5F5F5');
  assert.equal(styles.get('--legacy-surface'), '#FFFFFF');
  requests[0].resolve({ok: true, json: async () => ({...core.DEFAULT_BRANDING, displayName: 'A', primaryColor: '#FF0000', revision: 1})});
  await first; assert.equal(styles.get('--brand-primary'), '#0000FF');
  const late = window.organizationBranding.load(a); await window.organizationBranding.load(null);
  requests[2].resolve({ok: true, json: async () => ({...core.DEFAULT_BRANDING, displayName: 'A', revision: 1})});
  await late; assert.equal(document.title, core.DEFAULT_BRANDING.displayName); assert.equal(styles.get('--brand-primary'), core.DEFAULT_BRANDING.primaryColor);
});
test('BRAND assets estáticos: whitelist exata, módulos disponíveis, sem exposição arbitrária', async t => {
  const f = await fixture(t);
  for (const route of ['/branding-core.mjs', '/branding-ui.js', '/branding.css']) assert.equal((await f.owner.call(route)).status, 200);
  for (const route of ['/shared/branding-core.mjs', '/branding-core.d.mts', '/branding-core.mjs?path=server.js', '/branding-ui.js/../server.js']) assert.equal((await f.owner.call(route)).status, 404);
});
test('BRAND rota Aparência: acesso direto e reload entregam SPA; outras rotas/privados seguem recusados', async t => {
  const f = await fixture(t);
  const response = await fetch(f.owner.origin + '/ui/appearance');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(await response.text(), /<div id="root"><\/div>/);
  for (const route of ['/ui/appearance/server.js', '/ui/shared/branding-core.mjs', '/ui/other']) assert.equal((await f.owner.call(route)).status, 404);
});
