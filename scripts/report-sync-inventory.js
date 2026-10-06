'use strict';
// Render measurement artifacts only; never open SQLite or modify production files.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const ROOT = path.resolve(__dirname, '../.qa/foundation-v1.2/sync-inventory');
const input = path.resolve(process.argv[2] || '');
assert(input.startsWith(ROOT + path.sep) && path.basename(input) === 'report.json', 'Only synthetic measurement report.json.');
const report = JSON.parse(fs.readFileSync(input)), dir = path.dirname(input);
assert(!fs.existsSync(path.join(dir, 'PRELIMINAR.md')), 'Superseded preliminary profile; use the final run.');
const names = {'normal-sale': 'Venda normal', 'exceptional-sale-with-approval': 'Venda excepcional + aprovação',
  'purchase-receive': 'Recebimento', 'stock-entry': 'Entrada de estoque'};
const phaseNames = {setup: 'Preparação / contadores', delete: 'DELETE das cinco tabelas',
  'history-project': 'Projeção / autoria do histórico', 'history-link': 'Localizar compra / recibo e texto de busca',
  'history-insert': 'Preparar e inserir histórico', 'global-balances': 'Somar histórico e inserir saldos globais',
  'position-balances': 'Saldos por posição (ramo vazio)', markers: 'Presença e marcador'};
const num = n => Number(n.toFixed(3));
function stats(values) {
  const sorted = [...values].sort((a, b) => a - b), n = sorted.length, mean = values.reduce((a, b) => a + b, 0) / n;
  return {n, mean: num(mean), median: num(n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2),
    min: num(sorted[0]), max: num(sorted.at(-1)), sd: num(Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / n))};
}
const calls = (sample, name) => sample.profile.calls.filter(c => c.name === name);
const total = (sample, name, field = 'ms') => calls(sample, name).reduce((n, c) => n + c[field], 0);
const summary = [];
const csv = ['scale,round,instrumented,operation,sample,http_ms,sync_ms,mirror_inventory_ms,sql_prepare_ms,sql_execute_ms'];
for (const volume of report.volumes) for (const name of Object.keys(names)) {
  const runs = volume.runs.map(run => ({run, measurement: run.measurements.find(m => m.name === name)}));
  const profiled = runs.filter(r => r.run.instrumented).flatMap(r => r.measurement.raw),
    controls = runs.filter(r => !r.run.instrumented).flatMap(r => r.measurement.raw);
  for (const {run, measurement} of runs) measurement.raw.forEach((sample, i) => csv.push([
    volume.size, run.round, run.instrumented, name, i + 1, sample.elapsedMs,
    total(sample, 'syncInventory'), total(sample, 'verifyInventoryMirror'), sample.profile.prepareMs, sample.profile.executeMs].join(',')));
  const row = {size: volume.size, name, controlHttp: stats(controls.map(s => s.elapsedMs)),
    profileHttp: stats(profiled.map(s => s.elapsedMs)), sync: stats(profiled.map(s => total(s, 'syncInventory'))),
    share: stats(profiled.map(s => total(s, 'syncInventory') / s.elapsedMs * 100)), phases: {},
    outer: {}, counts: {}, executions: stats(profiled.map(s => s.profile.sql.reduce((n, q) => n + q.calls, 0))),
    syncExecutions: stats(profiled.map(s => calls(s, 'syncInventory').reduce((n, c) => n + Object.values(c.sql).reduce((n, q) => n + q.executions, 0), 0))),
    observerDeltaPct: num((stats(profiled.map(s => s.elapsedMs)).median / stats(controls.map(s => s.elapsedMs)).median - 1) * 100),
    rounds: runs.map(({run, measurement}) => ({round: run.round, instrumented: run.instrumented, http: measurement.ms}))};
  for (const phase of Object.keys(phaseNames)) {
    row.phases[phase] = {ms: stats(profiled.map(s => calls(s, 'syncInventory').reduce((n, c) => n + (c.phases[phase] || 0), 0))),
      prepareMs: stats(profiled.map(s => calls(s, 'syncInventory').reduce((n, c) => n + (c.sql[phase]?.prepareMs || 0), 0))),
      executeMs: stats(profiled.map(s => calls(s, 'syncInventory').reduce((n, c) => n + (c.sql[phase]?.executeMs || 0), 0)))};
  }
  for (const outer of ['verifyInventoryMirror', 'verifyCommercialMirror', 'loadState', 'assertStockTransition',
    'syncProducts', 'syncCustomers', 'syncSuppliers', 'syncPurchases', 'syncSales', 'writeState', 'saveBusinessState', 'auditChanges']) {
    row.outer[outer] = {inclusive: stats(profiled.map(s => total(s, outer))), self: stats(profiled.map(s => total(s, outer, 'selfMs'))),
      calls: stats(profiled.map(s => calls(s, outer).length))};
  }
  row.entityIndexMs = stats(profiled.map(s => calls(s, 'writeState').reduce((n, c) => n + (c.phases['entity-index'] || 0), 0)));
  row.positionQueries = stats(profiled.map(s => s.profile.sql.filter(q => q.text.startsWith('SELECT * FROM commercial_position_balances')).reduce((n, q) => n + q.calls, 0)));
  row.entityInserts = stats(profiled.map(s => s.profile.sql.filter(q => q.text.startsWith('INSERT INTO entity_index')).reduce((n, q) => n + q.calls, 0)));
  row.purchaseUpserts = stats(profiled.map(s => s.profile.sql.filter(q => /^INSERT INTO commercial_purchases[ (]/.test(q.text)).reduce((n, q) => n + q.calls, 0)));
  row.receiptUpserts = stats(profiled.map(s => s.profile.sql.filter(q => /^INSERT INTO commercial_purchase_receipts[ (]/.test(q.text)).reduce((n, q) => n + q.calls, 0)));
  for (const key of Object.keys(calls(profiled[0], 'syncInventory')[0].counts)) {
    row.counts[key] = stats(profiled.map(s => calls(s, 'syncInventory')[0].counts[key]));
  }
  row.syncPrepareMs = stats(profiled.map(s => Object.values(calls(s, 'syncInventory')[0].sql).reduce((n, q) => n + q.prepareMs, 0)));
  row.syncExecuteMs = stats(profiled.map(s => Object.values(calls(s, 'syncInventory')[0].sql).reduce((n, q) => n + q.executeMs, 0)));
  if (name.startsWith('exceptional')) {
    row.grant = stats(profiled.map(s => s.timing.grantMs)); row.commit = stats(profiled.map(s => s.timing.commitMs));
    row.commitShare = stats(profiled.map(s => total(s, 'syncInventory') / s.timing.commitMs * 100));
  }
  summary.push(row);
}
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'measurements.csv'), csv.join('\n') + '\n');
const large = summary.filter(r => r.size === 'large'), normal = large.find(r => r.name === 'normal-sale');
const f = n => n.toFixed(2).replace('.', ',');
const range = s => s.min === s.max ? String(s.min) : s.min + '–' + s.max;
const table = (headers, rows) => ['| ' + headers.join(' | ') + ' |', '| ' + headers.map(() => '---').join(' | ') + ' |',
  ...rows.map(r => '| ' + r.join(' | ') + ' |')].join('\n');
const operationsTable = table(['Massa', 'Operação', 'n', 'HTTP original mediana', 'HTTP instrumentado mediana', 'sync mediana', 'sync média', 'sync mín–máx', '% HTTP (mediana por amostra)'],
  summary.map(r => [r.size, names[r.name], r.sync.n, f(r.controlHttp.median), f(r.profileHttp.median), f(r.sync.median),
    f(r.sync.mean), f(r.sync.min) + '–' + f(r.sync.max), f(r.share.median) + '%']));
const phaseTable = table(['Fase na massa maior (mediana ms)', ...large.map(r => names[r.name])], Object.entries(phaseNames)
  .map(([key, label]) => [label, ...large.map(r => f(r.phases[key].ms.median))]));
const smallerPhases = table(['Massa / operação: medianas ms', ...Object.values(phaseNames)], summary.filter(r => r.size !== 'large')
  .map(r => [r.size + ' / ' + names[r.name], ...Object.keys(phaseNames).map(key => f(r.phases[key].ms.median))]));
const countTable = table(['Massa / operação', 'Produtos', 'Movimentos', 'INSERTs estoque¹', 'Execuções sync', 'Comparações produto × movimento', 'Comparações na busca de compras', 'entity_index INSERTs²'],
  summary.map(r => [r.size + ' / ' + names[r.name], range(r.counts.products), range(r.counts.stockMovements), range(r.counts.rowsInserted),
    range(r.syncExecutions), range(r.counts.productMovementVisits), range(r.counts.purchaseComparisons), range(r.entityInserts)]));
const outerTable = table(['Massa maior', 'Conferências estoque / tempo³', 'loadState tempo próprio⁴', 'syncPurchases', 'entity_index', 'assertStockTransition', 'auditChanges'],
  large.map(r => [names[r.name], r.outer.verifyInventoryMirror.calls.median + ' / ' + f(r.outer.verifyInventoryMirror.inclusive.median),
    f(r.outer.loadState.self.median), f(r.outer.syncPurchases.inclusive.median), f(r.entityIndexMs.median),
    f(r.outer.assertStockTransition.inclusive.median), f(r.outer.auditChanges.inclusive.median)]));
const observerTable = table(['Massa / operação', 'Diferença perfil/original mediana', 'HTTP original mín–máx', 'HTTP perfil mín–máx'],
  summary.map(r => [r.size + ' / ' + names[r.name], f(r.observerDeltaPct) + '%', f(r.controlHttp.min) + '–' + f(r.controlHttp.max),
    f(r.profileHttp.min) + '–' + f(r.profileHttp.max)]));
const roundsTable = table(['Massa maior / operação', 'Rodada', 'Original mediana ms', 'Perfil mediana ms'], large.flatMap(r => [1, 2, 3].map(round => [names[r.name], round,
  f(r.rounds.find(x => x.round === round && !x.instrumented).http.median), f(r.rounds.find(x => x.round === round && x.instrumented).http.median)])));
const phaseSqlTable = table(['Venda normal maior: fase', 'Tempo total mediano', 'prepare mediano', 'execução mediana'], Object.entries(phaseNames)
  .map(([key, label]) => [label, f(normal.phases[key].ms.median), f(normal.phases[key].prepareMs.median), f(normal.phases[key].executeMs.median)]));
const recordsTable = table(['Massa', 'Produtos', 'Vendas', 'Clientes', 'Fornecedores', 'Compras / recibos', 'Movimentos iniciais'], report.volumes.map(v => [v.size,
  v.records.products, v.records.sales, v.records.customers, v.records.suppliers, v.records.purchases + ' / ' + v.records.receipts, v.records.movements]));
const topSql = report.volumes.find(v => v.size === 'large').runs.find(r => r.instrumented).measurements[0].raw[0].profile.sql.sort((a, b) => b.calls - a.calls);
const sqlTable = table(['Statement (primeira venda medida da massa maior)', 'Execuções', 'Linhas devolvidas', 'Linhas afetadas', 'Tempo execução ms'], topSql.slice(0, 12).map(q => [
  '`' + (q.text.length > 120 ? q.text.slice(0, 117) + '...' : q.text).replace(/\|/g, '\\|') + '`', q.calls, q.returnedRows, q.changes, f(q.ms)]));
const exceptional = large.find(r => r.name.startsWith('exceptional'));
const markdown = `# Fundação V1.2 — análise isolada de syncInventory

**ATUAL:** versão ${report.version}; migrations 001–010. Medição em ${report.date}. Nenhuma otimização implementada. Nenhuma migration, índice ou alteração de produção nesta tarefa. Relatório de sessão para encaminhamento à direção.

**Resultado:** na massa maior, syncInventory representa ${f(normal.share.median)}% da venda normal instrumentada (${f(normal.sync.median)} ms). O maior custo interno é preparar/reinserir todo o histórico; o comando completo continua com outros custos maiores somados, fora dessa função. Recomendação única: medir reutilização dos statements por chamada, sem aplicar agora.

## 1. Implementação e chamadores

\`foundation/inventory-store.js:33\` contém \`syncInventory\`; recebe o estado completo já materializado, exige transação e usa company_id/unit_id em todas as escritas. Não carrega produtos/movimentos do SQL e não atualiza entity_index.

Chamador de escrita: \`foundation/state-repository.js:14\` em writeState. saveBusinessState (:34) faz reconciliação, autoria, assertStockTransition e writeState/auditoria. Venda normal/excepcional: \`foundation/commercial-write.js\`; recebimento/entrada: \`server.js:65\` (dispatchLegacy). executeStateCommand também usa saveBusinessState. normalizeInventory (inventory-store:49) chama syncInventory somente sem marcador; normalização inicial em \`commercial-store.js:139\`; writeState sem alteração passa por normalizeInventory, que confere o espelho existente. Importação/carga também chega a writeState. \`scoped-state.js:9\` e \`commercial-store.js:140\` conferem espelhos, fora de syncInventory. Aprovação excepcional (\`inactive-sale-approval.js:51\`) materializa estado adicional antes de conceder a prova.

## 2. Fluxograma

\`\`\`mermaid
flowchart TD
  A[Sessão, empresa, unidade, permissão e CSRF] --> B[Estado atual e conferência do espelho]
  B --> C[Regra de negócio e autorização excepcional quando aplicável]
  C --> D[Autoria real e validação da transição de estoque]
  D --> E[writeState: revisão e sincronização de outros agregados]
  E --> F[syncInventory: apagar cinco tabelas do escopo]
  F --> G[Projetar e reinserir todo histórico]
  G --> H[Calcular e reinserir todos os saldos globais e por posição]
  H --> I[Presença e marcador de normalização]
  I --> J[writeState: Vendas, snapshot, entity_index e equivalência final]
  J --> K[Auditoria e commit antes da resposta]
\`\`\`

## 3. Fases internas reais

DELETE de position_movements, stock_movements, stock_entries, position_balances e stock_balances; projeção dos históricos e validação dos vínculos de autoria; busca da compra/ordinal do recibo e preparação do texto; INSERT de cada registro; somatório histórico para âncora e saldo global de cada produto; somatório físico por posição; presença e revisão de normalização. Não existe “carregar estado”, entity_index ou conferência do espelho dentro de syncInventory. Estes últimos custos foram medidos separadamente.

## 4. Metodologia

- Três pares por massa, alternando original/perfil, perfil/original e original/perfil.
- Migrations 001–010 nos dois braços; cópias idênticas do banco sintético fechado e processo novo por braço.
- Um aquecimento por operação; cinco amostras de venda normal e três de excepcional, recebimento e entrada por rodada.
- Hooks somente em memória; mesmo corpo de produção, modo estrito, HTTP, segurança, transações, FKs, auditoria e equivalência.
- Tempos SQL medem a fronteira síncrona Node/SQLite, separando preparação e execução; não representam CPU pura do motor.
- Resíduo contém instrumentação, conversões e trabalho não separado; não é JavaScript puro.
- Sem descarte de amostras ou manipulação de GC/cache; controle mostra efeito do observador e variação da máquina.
- Visitas dos loops derivadas do código e das entradas, sem alterar os callbacks comerciais.
- Sem cache permanente, índice/migration novos, alterações de produção, credenciais publicadas ou dados operacionais.

Máquina: ${report.environment.cpu}, ${report.environment.logicalCpus} processadores lógicos; Windows ${report.environment.os}; Node ${report.environment.node}, SQLite ${report.volumes[0].runs[0].sqlite}. SQLite WAL, synchronous FULL e foreign_keys ON. Mesma massa/preparo do benchmark da FK, agora ambos os braços com 010. Inclui rede HTTP local e resposta; a excepcional inclui senha real Argon2id e grant + consumo. Não equivale a tempo puro de banco ou SLA.

São 18 processos, nove pares e 252 operações medidas (126 por braço), além de 72 aquecimentos. 15 amostras de venda normal e nove de cada outra operação por massa/braço. Sem descarte de variação. Históricos crescem até 18 movimentos/10 vendas durante cada braço, de maneira idêntica. Metadados aleatórios não são publicados; senhas/tokens/cookies não entram nos artefatos.

Uma matriz preliminar foi integralmente repetida após ajuste para preservar o modo estrito do módulo compilado; somente a execução final desta pasta embasa as conclusões. A anterior foi marcada PRELIMINAR.

O custo dos hooks existe: contadores derivados, relógios e agregação SQL. Não subtraímos uma constante nem chamamos o resíduo de “JavaScript puro”. Tempos de prepare/get/all/run incluem a fronteira síncrona Node/SQLite; db.exec/commit não são perfilados individualmente. Timings externos são inclusivos e aninhados: não somá-los entre si. \`selfMs\` exclui filhos instrumentados. Controle original serve para mostrar efeito do observador e variação do host, sem criar comparação artificial de ganho.

${observerTable}

${roundsTable}

## 5. Massas

${recordsTable}

Cada compra contém um item e um recibo legítimo de uma unidade; movimentos incluem vendas históricas e esses recebimentos. Seis produtos inativos para autorizações reais; operador de vendas sem financial.view/operations.view; aprovador distinto só com sales.authorize_inactive; dono executa recebimento/entrada. Há auditoria prévia sintética proporcional. **Sem posições físicas, embalagens, reservas ou inventários nestas massas:** o ramo físico aparece vazio; não extrapolar seu tempo. Históricos antigos sem autoria preservados, novos com autoria real. Por isso não simulamos milhões de movimentos com executor nem múltiplas unidades concorrentes.

## 6. Custo total por operação

Todos os tempos abaixo em milissegundos.

${operationsTable}

## 7. Fases e fronteira SQL

${phaseTable}

${smallerPhases}

${phaseSqlTable}

Venda normal maior: prepare de todo sync mediano ${f(normal.syncPrepareMs.median)} ms e execução ${f(normal.syncExecuteMs.median)} ms, dentro de ${f(normal.sync.median)} ms totais. Medianas de componentes não precisam somar à mediana do total, pois podem vir de amostras diferentes. A fase vazia de posições ainda conta entrada/saída do loop e instrumentação.

## 8. Entidades, registros e estruturas regravadas

${countTable}

¹ INSERTs nas cinco tabelas de estoque; exclui dois upserts de metadados. ² Fora de syncInventory. Faixas consideram todas as amostras medidas. Em uma venda de um produto, **todos os produtos/saldos e movimentos** são processados. Compras não são regravadas por syncInventory: são buscadas em memória para vincular movimentos. **syncPurchases**, separadamente, percorre/regrava todos os cabeçalhos e filhos/recibos, mesmo nesta venda. **writeState** apaga e reinserta todos os IDs de entity_index. O custo dessas etapas não foi atribuído ao tempo interno do estoque. Confirmado também pelos statements da venda normal maior: ${range(normal.purchaseUpserts)} upserts de compras, ${range(normal.receiptUpserts)} de recibos de compras e ${range(normal.entityInserts)} INSERTs de entity_index por venda de um produto.

## 9. Statements, N+1 e planos

${sqlTable}

Tabela SQL é uma amostra representativa para identidade/contagem, não fundamento estatístico de ganho. Todas as amostras e tempos estão nos JSON. syncInventory prepara INSERT novamente para cada movimento/saldo; cinco DELETEs filtrados pelo escopo; dois upserts. SELECT de membership ocorre para cada executor/autorizador textual de movimento, incluindo históricos atribuídos; na massa há poucos destes. Não há consulta SQL de saldo dentro de syncInventory.

N+1 de posições é de **verifyInventoryMirror**, fora: por escrita normal/recebimento/entrada são três conferências, cada uma consulta P produtos; excepcional com grant tem quatro. Na massa maior: ${normal.positionQueries.median} consultas de posição por venda normal e ${exceptional.positionQueries.median} por grant + venda excepcional, mesmo retornando zero linhas.

Planos reais (mesmos nos braços; nenhum índice alterado):

${report.volumes.find(v => v.size === 'large').runs[0].plans.map(p => '- \`' + p.sql + '\` → ' + p.details.map(d => '\`' + d + '\`').join('; ')).join('\n')}

Não há full scan interempresa nesses planos: scope/PK são usados. Os DELETEs e INSERTs continuam afetando a unidade inteira. O covering index da 010 está ativo para receipt FK. Triggers/FK internos não são contados como chamadas JS separadas; estão incluídos no tempo nativo do statement. Linhas devolvidas/afetadas não significam linhas examinadas pelo motor.

## 10. Loops

- Para **cada produto**, percorre **todos os movimentos** de novo para somar os seus; exato P × M visitas. Decimal/add somente nos movimentos correspondentes.
- Para **cada movimento**, purchases.find procura a compra; inclusive movimento de venda sem purchaseId visita todas as compras até não encontrar. Recibos da compra encontrada são map/filter, duas passagens da coleção; receiptVisits no JSON conta o tamanho da coleção por vínculo, cada passagem executa esse tamanho.
- Para cada saldo físico, percorre todos os movimentos físicos: L × H. Não exercitado com H/L positivos nesta matriz.
- verifyInventoryMirror repete P × M, encontra saldo com balances.find (até P por produto), consulta posições por produto e confere histórico/canonical. assertStockTransition, separado, confere história antiga e procura produtos antes/depois.

## 11. Crescimento e complexidade

Internamente: DELETE/reinserção proporcional a registros afetados, com custos de índices/FK; projeção/INSERT O(M + H + E); vínculo O(M × B + trabalho nos recibos) no pior caso; saldo global O(P × M); físico O(L × H). P=produtos, M=movimentos, B=compras, H=histórico físico, E=entradas, L=saldos por posição. Relações entre entidades crescem nesta massa, então P × M e M × B crescem aproximadamente quadraticamente em P. Não chamar o tempo total de O(P²) puro: mistura SQL, regravação linear, validação, hidratação, GC e host.

Venda normal: P × M mediano = ${summary.filter(r => r.name === 'normal-sale').map(r => r.size + ': ' + r.counts.productMovementVisits.median).join('; ')}. Produtos multiplicados por 15 levam a cerca de 223 vezes as visitas, enquanto o tempo sync mediano vai de ${f(summary[0].sync.median)} para ${f(normal.sync.median)} ms. Isso demonstra o loop; não garante extrapolação temporal fora destes volumes.

## 12. Trabalho necessário

Validar sessão/RBAC/escopo, regra comercial, origem/delta, histórico imutável, execução/autorização real, versão otimista, idempotência; gravar nova movimentação/saldo correto e auditoria atomica; manter FKs e compatibilidade histórica. Nenhum foi desativado. Não é correto remover invariantes para medir ou ganhar velocidade.

## 13. Compatibilidade transitória

Materialização/validação do snapshot completo, projeção integral, preservação de extra_json/present_fields/coleção ausente, âncora técnica, marcadores, reserialização de unit_states, entity_index global e comparação canônica dos espelhos sustentam os consumidores/comandos atuais. A âncora também preserva saldos históricos anteriores ao histórico disponível; não é dado dispensável. A necessidade presente não torna toda a reconstrução global inevitável no futuro. Os timers separam funções, mas não decompõem cada instrução de validateDatabase entre negócio e compatibilidade; não há quantificação defensável de um único “tempo exclusivamente snapshot” somando essas funções.

## 14. Trabalho aparentemente redundante

Preparar a mesma forma SQL em cada iteração; recalcular o mesmo histórico para cada produto; procurar compras repetidamente sem índice em memória; regravar históricos imutáveis e produtos sem alteração; repetir conferências integrais em loadState e writeState; consultar saldos físicos vazios P vezes; reconstruir entity_index inteiro. São candidatos, não defeitos funcionais comprovados. Conferências em pontos diferentes têm propósito de segurança/consistência e não devem ser simplesmente removidas.

${outerTable}

³ Soma do tempo inclusivo de verifyInventoryMirror, sem contar novamente dentro de syncInventory. ⁴ Tempo próprio exclui verifyCommercialMirror, mas inclui escopo, parsing/validateDatabase e overhead não separado. As outras colunas são etapas distintas. A parte restante da escrita inclui outros espelhos/agregados, validação/serialização global, domínio, proof/KDF e transporte.

## 15. Participação na venda

Massa maior: syncInventory mediano ${f(normal.sync.median)} ms; participação por amostra mediana ${f(normal.share.median)}% do HTTP de venda normal. Excepcional: ${f(exceptional.sync.median)} ms e ${f(exceptional.share.median)}% do grant + commit. Separando aprovação: grant mediano ${f(exceptional.grant.median)} ms, commit ${f(exceptional.commit.median)} ms; participação no commit ${f(exceptional.commitShare.median)}%. Grant não chama syncInventory; adiciona conferência/validação e senha real. **syncInventory não é o único gargalo nem explica sozinho os segundos da escrita.**

## 16. Principal gargalo interno

Decisão baseada nas fases medidas nas três rodadas, apresentadas acima. A maior etapa interna nas três massas e nas quatro operações é **preparar e reinserir histórico**. Na venda normal maior, sua mediana é ${f(normal.phases['history-insert'].ms.median)} ms, dos quais prepare mede ${f(normal.phases['history-insert'].prepareMs.median)} ms e execução ${f(normal.phases['history-insert'].executeMs.median)} ms. O cálculo/regravação dos saldos globais fica em segundo: ${f(normal.phases['global-balances'].ms.median)} ms, com P × M visitas. A busca de compra/recibo é ${f(normal.phases['history-link'].ms.median)} ms. A fase do histórico representa aproximadamente ${f(normal.phases['history-insert'].ms.median / normal.sync.median * 100)}% do sync (razão entre medianas, distinta da mediana das razões por amostra). Nenhum ganho potencial pode ser prometido como eliminação do custo de todo o comando.

## 17. Estratégias futuras — não implementadas

As opções estão comparadas abaixo. A proposta de próximo passo único está no item 21; as demais permanecem apenas possibilidades.

## 18. Riscos de cada estratégia

| Estratégia | Propósito | Risco e limites |
| --- | --- | --- |
| Reutilizar statements durante uma única chamada de syncInventory | Evitar prepare repetido com a mesma forma SQL | Preservar forma/colunas e bindings por tipo de registro; não manter cache permanente nem omitir constraints; medir ganho real |
| Acumulador por produto em uma passagem e mapa local de compra/recibo | Evitar P × M e buscas repetidas | Decimal exato, ordem, ambiguidade de recibos, âncoras, extras e posições precisam equivalência demonstrada; é uma tarefa distinta |
| Buscar saldos físicos em lote na conferência | Reduzir N+1 externo | Escopo, ordenação, coleção ausente/null/vazia e validação de cada âncora devem ser preservados; não é otimização de syncInventory |
| Sincronização incremental de estoque/entity_index | Evitar DELETE/reinserção de história inteira | Maior alcance: detectar deltas/história/ordinais/FKs/revisões, imports e rollback; requer desenho/testes próprios |
| Reduzir materializações integrais de escrita por contratos próprios | Atacar custo externo maior | Afeta regras ainda em snapshot; risco de autorizações, histórico, financeiro/caixa e atomicidade; fora desta pequena tarefa |

## 19. Arquivos e verificações

Responsabilidades aplicadas das definições permanentes: Banco — schema, planos e contagens; Backend — chamadores, limites e semântica; QA / Testing — fixture isolada, equivalência e verificações do instrumento. Não foram reativados os agentes antigos.

Criados apenas \`scripts/benchmark-sync-inventory.js\`, \`scripts/sync-inventory-meter.js\` e \`scripts/report-sync-inventory.js\`, mais esta pasta QA. Hooks compilam cópias em memória usando caminhos/dependências originais. SHA256 de inventory-store, commercial-store, state-repository, scoped-state e sales-store foi conferido ao terminar cada processo; nenhuma alteração nesses arquivos. Migrations copiadas 001–010 com checksums originais, sem nova migration/índice. Fontes sintéticas fechadas permaneceram com SHA256 idêntico; só rodada 1 mantém bancos de cada braço, demais resultados JSON preservados.

Antes do workload, cada braço executou syncInventory no mesmo estado em transação descartada e comprovou igualdade exata das cinco tabelas, espelho válido e rollback. No fim: históricos antigos idênticos, totais/saldos esperados, autoria real, replay sem revisão/auditoria novas, cadeia de auditoria, FK ON + check vazio e integrity_check ok. Nove pares com produtos/saldos/revisões, contagem de auditoria e oito tabelas iguais entre braços. IDs novos/datas aleatórios diferem legitimamente entre processos; não afirmamos igualdade byte a byte de bancos pós-operação. HTTP não autenticado e snapshot com operador parcial negados. Não houve defeito funcional encontrado nessas verificações.

**18/18 processos concluídos; 9/9 pares consistentes; nenhuma falha observada.** Estes checks não são novos casos da suíte. Baseline preservada: 562 aprovados, 0 falhos, 0 ignorados na rodada anterior; **suíte completa não reexecutada**, conforme escopo de medição. Não houve RED artificial, homologação ampla, deploy, commit, push, mudança de versão ou otimização.

## 20. Reprodução e evidências

Na raiz do projeto, com Node 24:

\`\`\`powershell
node scripts/benchmark-sync-inventory.js
node scripts/report-sync-inventory.js <caminho-do-novo-report.json>
\`\`\`

O primeiro comando cria pasta nova automaticamente; não aceita banco operacional. O segundo exige report.json dentro de .qa/foundation-v1.2/sync-inventory. [Dados completos](report.json), [sumários com média/mediana/desvio e intervalos](summary.json), [CSV](measurements.csv), [verificações e hashes](validation.json), JSON por processo e cópias de migrations estão nesta pasta. Não repetir sessões em paralelo para comparar latências. Reexecutar muda IDs/instantes, não o formato/massa dos fixtures. O relatório não altera os documentos mestres nem encerra V1.2.

## 21. Uma próxima melhoria

**Propor um experimento delimitado de reutilização dos statements de INSERT dentro de uma chamada de syncInventory**, mantendo todos os registros, validações, FKs, ordem, transação, snapshot e auditoria. Começar pelo histórico, cuja preparação repetida foi medida; demonstrar equivalência e medir antes/depois. Não criar cache permanente. Essa melhoria é recomendação, depende de nova ordem e não foi iniciada.
`;
fs.writeFileSync(path.join(dir, 'RELATORIO.md'), markdown, 'utf8');
console.log(JSON.stringify({report: path.join(dir, 'RELATORIO.md'), summary: path.join(dir, 'summary.json')}));
