'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');

function renderSale(record) {
  const sandbox = {money: value => String(value)};
  vm.createContext(sandbox);
  // Reuse the actual escaping/table helpers, without starting the application or a browser.
  const helpers = readFileSync(join(__dirname, '../public/app.js'), 'utf8').split('\n')
    .filter(line => line.startsWith('const esc =') || line.startsWith('function table(')).join('\n');
  vm.runInContext(helpers, sandbox);
  vm.runInContext(readFileSync(join(__dirname, '../public/commercial-ui.js'), 'utf8'), sandbox);
  return sandbox.commercialRows({key: 'sales'}, [record]);
}

test('Vendas UI: item antigo sem nome mostra seu identificador em vez de undefined/null', () => {
  for (const name of [undefined, null, '']) {
    const item = {productId: 'produto-historico-001', quantity: 1, priceCents: 1500};
    if (name !== undefined) item.name = name;
    const html = renderSale({id: 'venda-antiga', items: [item], totalCents: 1500});
    assert.match(html, /1 × produto-historico-001/);
    assert.doesNotMatch(html, /1 × (undefined|null)/);
    assert.equal(Object.hasOwn(item, 'name'), name !== undefined, 'Rendering must preserve historical absence');
  }
});

test('Vendas UI: nome histórico existente é conservado e escapado na listagem', () => {
  const html = renderSale({id: 'venda', items: [{productId: 'produto-atual', name: 'Histórico <script>',
    quantity: 2, priceCents: 100}], totalCents: 200});
  assert.match(html, /2 × Histórico &lt;script&gt;/);
  assert.doesNotMatch(html, /<script>|2 × produto-atual/);
});
