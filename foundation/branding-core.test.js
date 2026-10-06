'use strict';
const {test} = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const file = path.join(__dirname, '../shared/branding-core.mjs');
const core = fs.existsSync(file) ? require(file) : null;
function ready() {assert.ok(core, 'camada central de branding inexistente'); return core;}
const A = {displayName: 'Org A', primaryColor: '#FFFFFF', accentColor: '#000000', themeMode: 'SYSTEM', revision: 1};
test('BRAND tokens: texto on-primary/accent legível e cores estruturais controladas nos três temas', () => {
  const {brandTokens, contrast, parseBranding} = ready();
  for (const color of ['#FFFFFF', '#000000', '#777777', '#767676', '#00FF00', '#0000FF', '#FF0000', '#B88700']) for (const themeMode of ['LIGHT', 'DARK', 'SYSTEM']) {
    const b = {...A, primaryColor: color, accentColor: color, themeMode};
    const tokens = brandTokens(b, true);
    assert.equal(tokens['--brand-primary'], color);
    assert.ok(contrast(color, tokens['--brand-on-primary']) >= 4.5);
    assert.ok(contrast(color, tokens['--brand-on-accent']) >= 4.5);
    assert.ok(contrast(tokens['--ui-link'], tokens['--ui-surface']) >= 4.5);
    assert.ok(contrast(tokens['--ui-link'], tokens['--ui-info-background']) >= 4.5);
    assert.ok(contrast(tokens['--ui-link'], tokens['--ui-background']) >= 4.5);
    assert.ok(contrast(tokens['--ui-text'], tokens['--ui-surface']) >= 4.5);
  }
  assert.equal(brandTokens(A, false)['color-scheme'], 'light');
  assert.equal(brandTokens(A, true)['color-scheme'], 'dark');
  for (const primaryColor of ['url(x)', 'var(--x)', '#FFF', 'javascript:x']) assert.equal(parseBranding({...A, primaryColor}), null);
});
test('BRAND race: A→B publica default imediatamente, ignora resposta tardia A e logout não recebe resposta B', async () => {
  const {createBrandingLoader, DEFAULT_BRANDING} = ready(), updates = [], pending = [];
  const loader = createBrandingLoader(value => updates.push(value), (ctx, signal) => new Promise(resolve => pending.push({ctx, signal, resolve})));
  const a = loader.load({companyId: 'A', unitId: '1', sessionId: 's'});
  assert.deepEqual(updates.at(-1).branding, DEFAULT_BRANDING);
  pending[0].resolve(A); await a; assert.equal(updates.at(-1).branding.displayName, 'Org A');
  const lateA = loader.load({companyId: 'A', unitId: '1', sessionId: 's'});
  const b = loader.load({companyId: 'B', unitId: '1', sessionId: 's'});
  assert.equal(pending[1].signal.aborted, true); assert.deepEqual(updates.at(-1).branding, DEFAULT_BRANDING);
  pending[1].resolve(A); await lateA; assert.deepEqual(updates.at(-1).branding, DEFAULT_BRANDING);
  pending[2].resolve({...A, displayName: 'Org B'}); await b; assert.equal(updates.at(-1).branding.displayName, 'Org B');
  const lateB = loader.load({companyId: 'B', unitId: '1', sessionId: 's'});
  await loader.load(null); assert.deepEqual(updates.at(-1).branding, DEFAULT_BRANDING);
  pending[3].resolve(A); await lateB; assert.deepEqual(updates.at(-1).branding, DEFAULT_BRANDING);
});
test('BRAND fallback: erro/DTO inválido substitui configuração por default, sem guardar cache de outra Org', async () => {
  const {createBrandingLoader, DEFAULT_BRANDING} = ready(), updates = [];
  const loader = createBrandingLoader(value => updates.push(value), async ctx => {if (ctx.companyId === 'error') throw Error('synthetic'); return {css: 'arbitrary'};});
  for (const companyId of ['invalid', 'error']) {await loader.load({companyId, unitId: '1', sessionId: 's'}); assert.deepEqual(updates.at(-1).branding, DEFAULT_BRANDING);}
});
test('BRAND neutro: azul/amarelo e vinho/rosa usam superfícies neutras idênticas em LIGHT/DARK e contraste preservado', () => {
  const {brandTokens, contrast} = ready();
  const brands = [{...A, primaryColor: '#164BA8', accentColor: '#F2C44A'}, {...A, primaryColor: '#782344', accentColor: '#F6A8CC'}];
  for (const themeMode of ['LIGHT', 'DARK']) {
    const values = brands.map(b => brandTokens({...b, themeMode}));
    for (const key of ['--ui-background', '--ui-surface', '--ui-info-background', '--ui-text', '--ui-muted', '--ui-border']) {
      assert.equal(values[0][key], values[1][key]);
      const hex = values[0][key];
      // Neutral structural RGB channels must be equal, independent of the brand.
      assert.equal(hex.slice(1, 3), hex.slice(3, 5), key); assert.equal(hex.slice(3, 5), hex.slice(5, 7), key);
    }
    values.forEach((tokens, index) => {
      assert.equal(tokens['--brand-primary'], brands[index].primaryColor);
      assert.equal(tokens['--brand-accent'], brands[index].accentColor);
      assert.ok(contrast(tokens['--brand-primary'], tokens['--brand-on-primary']) >= 4.5);
      assert.ok(contrast(tokens['--brand-accent'], tokens['--brand-on-accent']) >= 4.5);
      assert.ok(contrast(tokens['--ui-link'], tokens['--ui-info-background']) >= 4.5);
    });
  }
});
