'use strict';
// Artifact renderer only. Does not open SQLite, change source, or implement the candidate.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const input = path.resolve(process.argv[2] || ''), ROOT = path.resolve(__dirname, '../.qa/foundation-v1.2/stock-insert');
assert(input.startsWith(ROOT + path.sep) && path.basename(input) === 'report.json', 'Only isolated experiment report.json.');
const report = JSON.parse(fs.readFileSync(input)), dir = path.dirname(input);
const decisionFile = path.join(dir, 'decision.json'), decision = fs.existsSync(decisionFile) ? JSON.parse(fs.readFileSync(decisionFile)) : {implemented: false, pending: true};
const names = {'normal-sale': 'Venda normal', 'exceptional-sale-with-approval': 'Excepcional + aprovação',
  'purchase-receive': 'Recebimento', 'stock-entry': 'Entrada de estoque'};
function stats(values) {
  const sorted = [...values].sort((a, b) => a - b), n = values.length, mean = values.reduce((n, v) => n + v, 0) / n;
  const round = n => Number(n.toFixed(3));
  return {n, mean: round(mean), median: round(n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2),
    min: round(sorted[0]), max: round(sorted.at(-1)), sd: round(Math.sqrt(values.reduce((n, v) => n + (v - mean) ** 2, 0) / n))};
}
const f = n => n.toFixed(2).replace('.', ','), gain = (a, b) => (1 - b / a) * 100;
const table = (headers, rows) => ['| ' + headers.join(' | ') + ' |', '| ' + headers.map(() => '---').join(' | ') + ' |',
  ...rows.map(row => '| ' + row.join(' | ') + ' |')].join('\n');
const range = s => s.min === s.max ? String(s.min) : s.min + '–' + s.max;
const result = [], csv = ['scale,round,candidate,operation,sample,http_ms,stock_insert_prepares,stock_insert_prepare_ms,history_ms,sync_ms'];
for (const volume of report.volumes) for (const name of Object.keys(names)) {
  const row = {size: volume.size, name, arms: {}, rounds: []};
  for (const candidate of [false, true]) {
    const runs = volume.runs.filter(r => r.candidate === candidate), raw = [];
    for (const run of runs) {
      const m = run.measurements.find(m => m.name === name), values = [];
      m.raw.forEach((s, i) => {
        const stock = s.profile.sql.find(q => q.text.startsWith('INSERT INTO commercial_stock_movements(')), sync = s.profile.calls.find(c => c.name === 'syncInventory');
        const value = {http: s.elapsedMs, prepares: stock.prepares, prepareMs: stock.prepareMs, executions: stock.calls,
          executeMs: stock.ms, history: sync.phases['history-insert'], sync: sync.ms};
        raw.push(value); values.push(value);
        csv.push([volume.size, run.round, candidate, name, i + 1, value.http, value.prepares, value.prepareMs, value.history, value.sync].join(','));
      });
      row.rounds.push({round: run.round, candidate, http: stats(values.map(v => v.http)), history: stats(values.map(v => v.history)),
        sync: stats(values.map(v => v.sync)), prepareMs: stats(values.map(v => v.prepareMs))});
    }
    row.arms[candidate ? 'candidate' : 'baseline'] = Object.fromEntries(Object.keys(raw[0]).map(key => [key, stats(raw.map(r => r[key]))]));
  }
  row.gains = Object.fromEntries(['http', 'history', 'sync', 'prepareMs'].map(key => [key, {
    medianPct: gain(row.arms.baseline[key].median, row.arms.candidate[key].median),
    meanPct: gain(row.arms.baseline[key].mean, row.arms.candidate[key].mean),
    medianMs: row.arms.baseline[key].median - row.arms.candidate[key].median}]));
  result.push(row);
}
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(result, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'measurements.csv'), csv.join('\n') + '\n');
const large = result.filter(r => r.size === 'large'), normal = large.find(r => r.name === 'normal-sale');
const timingTable = table(['Massa / operação', 'n por braço', 'Prepare ms antes → depois', 'Histórico ms antes → depois', 'sync ms antes → depois', 'HTTP ms antes → depois'],
  result.map(r => [r.size + ' / ' + names[r.name], r.arms.baseline.http.n, ...['prepareMs', 'history', 'sync', 'http'].map(key =>
    f(r.arms.baseline[key].median) + ' → ' + f(r.arms.candidate[key].median))]));
const meanTable = table(['Massa / operação (médias ms)', 'Prepare antes → depois', 'Histórico antes → depois', 'sync antes → depois', 'HTTP antes → depois'],
  result.map(r => [r.size + ' / ' + names[r.name], ...['prepareMs', 'history', 'sync', 'http'].map(key =>
    f(r.arms.baseline[key].mean) + ' → ' + f(r.arms.candidate[key].mean))]));
const gainTable = table(['Massa / operação', 'Histórico: redução mediana', 'sync: redução mediana', 'HTTP: redução mediana'],
  result.map(r => [r.size + ' / ' + names[r.name], ...['history', 'sync', 'http'].map(key => f(r.gains[key].medianMs) + ' ms / ' + f(r.gains[key].medianPct) + '%')]));
const roundTable = table(['Massa / operação', 'Rodada', 'Histórico antes → depois', 'sync antes → depois', 'HTTP antes → depois', 'HTTP: redução'],
  result.flatMap(r => [1, 2, 3].map(round => {const a = r.rounds.find(x => x.round === round && !x.candidate), b = r.rounds.find(x => x.round === round && x.candidate);
    return [r.size + ' / ' + names[r.name], round, ...['history', 'sync', 'http'].map(key => f(a[key].median) + ' → ' + f(b[key].median)), f(gain(a.http.median, b.http.median)) + '%'];})));
const countTable = table(['Massa / operação', 'Prepares antes', 'Prepares depois', 'Execuções em ambos'], result.map(r => [r.size + ' / ' + names[r.name],
  range(r.arms.baseline.prepares), range(r.arms.candidate.prepares), range(r.arms.baseline.executions)]));
const spreadTable = table(['Massa / operação', 'sync antes mín–máx', 'sync depois mín–máx', 'HTTP antes mín–máx', 'HTTP depois mín–máx'],
  result.map(r => [r.size + ' / ' + names[r.name], ...['sync', 'http'].flatMap(key => [r.arms.baseline[key], r.arms.candidate[key]].map(s => f(s.min) + '–' + f(s.max)))]));
const masses = table(['Massa', 'Produtos', 'Vendas históricas', 'Compras / recibos', 'Movimentos iniciais'], report.volumes.map(v => [v.size,
  v.records.products, v.records.sales, v.records.purchases + ' / ' + v.records.receipts, v.records.movements]));
const status = decision.pending ? 'Decisão pendente; somente experimento.' : decision.implemented ? 'APROVADA e implementada somente a reutilização local.' : 'Hipótese testada e descartada; produção preservada.';
const fence = '```';
const md = `# Fundação V1.2 — INSERT local do histórico de estoque

Versão ${report.version}; migrations 001–010. ${status} Bancos exclusivamente sintéticos, sem commit/push ou mudança de versão. Relatório de sessão para a direção.

Resultado maior / venda normal: fase de histórico ${f(normal.arms.baseline.history.median)} → ${f(normal.arms.candidate.history.median)} ms; syncInventory ${f(normal.arms.baseline.sync.median)} → ${f(normal.arms.candidate.sync.median)} ms; HTTP ${f(normal.arms.baseline.http.median)} → ${f(normal.arms.candidate.http.median)} ms. São comparações desta matriz pareada; não misturar os números com os 340,55 ms / 94 ms da medição anterior.

## 1. Comportamento atual confirmado

O loop em foundation/inventory-store.js projetava a linha, montava as colunas e chamava db.prepare(...).run(...) para CADA movimento histórico. O formato das colunas de stockMovements é estável: projection inicializa todos os campos; extras/presença ficam em JSON; autoria e receipt_ordinal/search_text/sort_name são adicionados na mesma ordem. Registros com campos ausentes/null mudam bindings, não a forma SQL. Nenhum outro INSERT foi reutilizado.

Papéis aplicados: Banco — prepares/SQL/performance; Backend — fronteira da chamada e semântica; QA / Testing — equivalência e rollback. Definições permanentes lidas; agentes antigos não reativados.

## 2. Prepares antes

Uma chamada com M movimentos prepara M vezes o INSERT de commercial_stock_movements. Contagem real no db.prepare, não estimativa por tempo.

${countTable}

## 3. Implementação experimental

Código original congelado em inventory-baseline.js nesta pasta; candidato aplicado somente em memória antes da decisão. Variável stockMovementInsert local, criada sob demanda no primeiro movimento; reutilizada apenas em kind === stockMovements. Cada execução recebe TODOS os bindings da linha corrente. try/finally limitado ao loop de históricos; finally descarta a referência inclusive em erro. Entradas, movimentos físicos, saldos, P × M, vínculo de compras e todos os outros módulos mantêm código e comportamento.

## 4. Prepares depois e ciclo de vida

Uma preparação se M > 0; zero se M = 0. Não há cache em módulo/global/store nem passagem do statement a outro chamador. Chamadas, conexões, unidades/empresas/transações distintas têm objetos distintos, inclusive após erro.

No Node v24.19.0 instalado, StatementSync não tem close/finalize/Symbol.dispose público; o finally libera a referência da aplicação, sem prometer liberação nativa imediata. O driver finaliza ao coletar o objeto ou fechar a conexão; run reseta o statement e limpa bindings na execução seguinte. Não forçamos GC, não fechamos a conexão compartilhada e não invocamos API inexistente. Verificado no runtime e no [código oficial dessa versão](https://raw.githubusercontent.com/nodejs/node/v24.19.0/src/node_sqlite.cc) (StatementSync destructor/BindParams/Run e DatabaseSync::Close).

## 5. Equivalência exata

Cada um dos 18 processos, depois das quatro operações reais, repetiu syncInventory original e candidato com **o mesmo estado, escopo e revisão**, em transações descartadas. Clock fixo apenas nesses replays, para normalized_at idêntico; benchmark HTTP mantém relógio real. Comparação deepEqual de conteúdo de **todas as tabelas da conexão**, não apenas contagens, mais canonicalização/SHA256 por tabela: cinco estruturas de estoque, extras/presença/nulls, autoria real normal/excepcional, referências/ordinal de recibos, saldo/âncora, marcadores/revisões, snapshot e auditoria/provas existentes. Digests original/candidato idênticos em cada replay; rollback recolocou todos os dados originais.

Além disso: conferência de espelho, preservação dos prefixos históricos, totais esperados, cadeia de auditoria, idempotência sem nova revisão/auditoria, foreign_keys ON, foreign_key_check vazio e integrity_check ok. As operações HTTP de braços diferentes geram legitimamente IDs/datas distintos; não alegamos igualdade byte a byte de bancos pós-HTTP. A prova de conteúdo utiliza replay de entrada idêntica; os nove pares HTTP também conservam saldos, revisões e totais esperados.

Cinco testes focados exercitam posições físicas e entradas não vazias, autoria alternada/ausente/null, dados históricos extras, recibos, múltiplos tenants/unidades/conexões e inteiro 9007199254740991 preservado exatamente. Nenhuma operação fracionada foi habilitada. Falha injetada no segundo movimento comprova rollback integral e nova preparação na chamada seguinte.

## 6. Método e tempos

${masses}

Três rodadas pareadas AB/BA/AB por tamanho, cópias byte a byte de cada fonte sintética fechada, processo novo por braço. Um aquecimento por operação; 5 vendas normais e 3 de cada outra operação por rodada. Total 252 operações medidas + 72 aquecimentos. Mesma instrumentação em AMBOS os braços, incluindo contagem/timer de prepare, fases e execução SQL. Nenhum sample descartado; sem GC/cache flushing. Migrations 001–010 idênticas, WAL/synchronous FULL/FKs ativos; sessões/CSRF/permissões, autorizador real e auditoria preservados. Excepcional inclui aprovação com senha real Argon2id + commit. Recebimento/entrada usam endpoints legados com resposta completa.

Máquina: ${report.environment.cpu}, ${report.environment.logicalCpus} processadores lógicos, Windows ${report.environment.os}; Node ${report.environment.node}. Históricos crescem de maneira idêntica até 18 movimentos/10 vendas durante cada braço. Massa HTTP sem posições físicas; esse ramo não vazio foi validado nos testes. Histórico majoritário antigo sem autoria; não extrapolar para históricos densamente atribuídos, concorrência ou volumes não medidos.

Tempos em milissegundos. Medianas:

${timingTable}

Médias:

${meanTable}

Contagem/timer SQL acrescentam overhead: a baseline desta tarefa não é diretamente comparável com a instrumentação anterior. Tempos nativos medem fronteira síncrona Node/SQLite, não CPU pura do motor. Histórico é a fase dos três tipos de histórico; só o INSERT de stockMovements mudou. Não subtraímos constantes nem prometemos ganho integral dos 94 ms anteriores.

## 7. Ganho na fase de histórico

Na venda normal maior, redução mediana de ${f(normal.gains.history.medianMs)} ms (${f(normal.gains.history.medianPct)}%). Prepare desse INSERT: ${f(normal.arms.baseline.prepareMs.median)} → ${f(normal.arms.candidate.prepareMs.median)} ms; execução: ${f(normal.arms.baseline.executeMs.median)} → ${f(normal.arms.candidate.executeMs.median)} ms. Preparação e execução podem variar pelo reaproveitamento da VM e pela instrumentação; não atribuir toda a diferença a um único relógio.

## 8. Ganho total de syncInventory

${gainTable}

Razões calculadas entre medianas agrupadas dos braços. O algoritmo P × M permanece intacto; esta alteração reduz trabalho de preparação/VM, não elimina reconstrução nem muda complexidade assintótica.

## 9. HTTP completo

HTTP continua incluindo materialização/espelhos, validação de domínio, demais sincronizações, snapshot, entity_index, auditoria, commit e resposta. Ganhos internos não garantem o mesmo percentual no HTTP. A excepcional inclui ainda a aprovação real. As quatro operações foram medidas sem ampliar produção.

## 10. Variação entre rodadas

${roundTable}

${spreadTable}

Valor negativo de redução significa execução mais lenta. Preservar pequenas regressões e amostras lentas; não há promessa de SLA ou melhora em todo request individual. Desvio, média, mediana, mínimo e máximo completos em summary.json. Não há comparação estatística de população independente: amostras de cada rodada compartilham estado crescente e ambiente.

## 11. Decisão

${status}
${decision.reason || 'Aguardar a análise das três rodadas e a validação antes de alterar produção.'}

## 12. Arquivos

${decision.implemented ? '- foundation/inventory-store.js: somente variável local, branch do INSERT de stockMovements e finally para descartar a referência.\n' : ''}- foundation/stock-movement-insert.test.js: cinco verificações da alteração.
- scripts/stock-insert-candidate.js: transformação experimental única em memória.
- scripts/stock-insert-equivalence.js: replay idêntico e digests de conteúdo, sem produção.
- scripts/benchmark-stock-insert.js: matriz pareada isolada.
- scripts/sync-inventory-meter.js: fonte alternativa em memória e contagem/timer de prepares; mesma medição nos dois braços.
- scripts/report-stock-insert.js: geração somente de artefatos QA.
- Esta pasta: fontes congeladas, resultados JSON por processo, report.json, summary.json, measurements.csv, decisão, testes e relatório. Nenhuma migration/índice criado ou alterado; nenhuma versão alterada. Modificações anteriores do repositório preservadas.

## 13. Testes focados

Antes da decisão: cinco testes contra candidato em memória aprovados; primeira montagem da fixture foi rejeitada por posição inexistente e corrigida apenas nos dados sintéticos, sem bug de produção ou RED funcional artificial.

${decision.tests ? 'Depois da decisão, testes diretamente relacionados a estoque, venda normal/excepcional, compras/recebimentos e persistência/transações: **' + decision.tests.total + ' total; ' + decision.tests.passed + ' aprovados; ' + decision.tests.failed + ' falhos; ' + decision.tests.skipped + ' ignorados**. Arquivos/comando e saída preservados em focused-tests.txt. Cinco novos testes executados contra o código de produção, sem modo experimental.' : 'Resultados finais dos testes focados ainda não registrados.'}

18/18 processos do benchmark concluídos, 9/9 pares coerentes e 18/18 comparações de conteúdo exato. A última regressão completa permanece a baseline de **562 aprovados, 0 falhos, 0 ignorados**; **suíte completa não reexecutada** nesta melhoria. Não declarar que uma nova contagem total global foi homologada. Segurança/UX/módulos serão agrupados posteriormente, como solicitado.

## 14. Riscos e limites

- Forma SQL precisa continuar estável por tipo; todos os bindings devem ser enviados a cada run, incluindo null, autoria e receipt_ordinal. Mudanças futuras na projeção exigem rever estes testes.
- Statement não pode escapar da chamada ou ser retomado após erro. A criação local e finally preservam isso; driver Node 24 gerencia a finalização nativa, sem garantia de liberação imediata.
- Ganho no HTTP sofre variação e continua limitado pelos demais custos. Não se removeu conferência ou validação para melhorar número.
- Medições instrumentadas e sintéticas; não são carga concorrente, SLA ou certificação operacional. Banco operacional não foi usado. Nenhum deploy/restart/produção da loja alterado.

## 15. Uma próxima melhoria

**Medir um acumulador local de movimentos por produto dentro de syncInventory para evitar as P × M visitas no cálculo dos saldos globais**, mantendo decimal exato, âncoras, ordem, transação, espelho e demais regras. Fazer uma nova tarefa delimitada, sem combinar com busca de compras, incrementalidade ou conferências. Não foi implementado nesta sessão.

Reprodução do experimento e artefatos:

${fence}powershell
node scripts/benchmark-stock-insert.js --baseline '${path.relative(path.resolve(__dirname, '..'), path.join(dir, 'inventory-baseline.js')).replace(/\\/g, '/')}'
node scripts/report-stock-insert.js <caminho-do-novo-report.json>
${fence}

O experimento congela a fonte indicada no início e gera bancos novos. Após a aplicação, o comando acima usa a fonte preservada desta pasta; tentar tratar código já otimizado como baseline antiga é recusado. O parâmetro --baseline só aceita fonte dentro da pasta QA stock-insert. [Dados brutos](report.json), [sumários](summary.json), [CSV](measurements.csv), [decisão](decision.json) e [testes](focused-tests.txt).
`;
fs.writeFileSync(path.join(dir, 'RELATORIO.md'), md, 'utf8');
console.log(JSON.stringify({report: path.join(dir, 'RELATORIO.md'), normalLarge: normal.gains, status}));
