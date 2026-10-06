'use strict';
// QA artifact renderer. Never opens a database or changes production.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../.qa/foundation-v1.2/stock-balances');
const input=path.resolve(process.argv[2]||'');assert(input.startsWith(ROOT+path.sep)&&path.basename(input)==='report.json');
const report=JSON.parse(fs.readFileSync(input)),dir=path.dirname(input);
const supplementalFile=path.join(dir,'supplemental-validation.json');
const supplemental=fs.existsSync(supplementalFile)?JSON.parse(fs.readFileSync(supplementalFile)):null;
const decision=fs.existsSync(path.join(dir,'decision.json'))?JSON.parse(fs.readFileSync(path.join(dir,'decision.json'))):{pending:true};
const names={'normal-sale':'Venda normal','exceptional-sale-with-approval':'Venda excepcional + aprovação','purchase-receive':'Recebimento','stock-entry':'Entrada de estoque'};
function stats(values){const a=[...values].sort((a,b)=>a-b),n=a.length,mean=a.reduce((s,v)=>s+v,0)/n;return {n,mean,median:n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2,min:a[0],max:a.at(-1),sd:Math.sqrt(a.reduce((s,v)=>s+(v-mean)**2,0)/n)};}
const f=n=>n.toFixed(3).replace('.',','),gain=(a,b)=>(1-b/a)*100;
const table=(headers,rows)=>['| '+headers.join(' | ')+' |','| '+headers.map(()=>'---').join(' | ')+' |',...rows.map(r=>'| '+r.join(' | ')+' |')].join('\n');
const csv=['scale,round,candidate,operation,sample,phase_ms,sync_ms,http_ms,movement_visits,product_visits'];
const result=[];
for(const volume of report.volumes)for(const name of Object.keys(names)){
 const row={size:volume.size,name,arms:{},rounds:[]};
 for(const candidate of [false,true]){
  const raw=[];
  for(const run of volume.runs.filter(r=>r.candidate===candidate)){
   const measurement=run.measurements.find(m=>m.name===name),values=[];
   measurement.raw.forEach((sample,i)=>{
    const sync=sample.profile.calls.find(c=>c.name==='syncInventory');
    const value={phase:sync.phases['global-balances'],sync:sync.ms,http:sample.elapsedMs,movementVisits:sync.counts.productMovementVisits,productVisits:sync.counts.globalProductVisits};
    values.push(value);raw.push(value);csv.push([volume.size,run.round,candidate,name,i+1,...Object.values(value)].join(','));
   });
   row.rounds.push({round:run.round,candidate,...Object.fromEntries(Object.keys(values[0]).map(k=>[k,stats(values.map(v=>v[k]))]))});
  }
  row.arms[candidate?'candidate':'baseline']=Object.fromEntries(Object.keys(raw[0]).map(k=>[k,stats(raw.map(v=>v[k]))]));
 }
 row.gains=Object.fromEntries(['phase','sync','http'].map(k=>[k,{medianPct:gain(row.arms.baseline[k].median,row.arms.candidate[k].median),meanPct:gain(row.arms.baseline[k].mean,row.arms.candidate[k].mean)}]));result.push(row);
}
fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(result,null,2)+'\n');fs.writeFileSync(path.join(dir,'measurements.csv'),csv.join('\n')+'\n');
const normal=result.find(r=>r.size==='large'&&r.name==='normal-sale');
const valuesTable=stat=>table(['Massa / operação', 'n por braço','Saldo global ms antes → depois','syncInventory ms antes → depois','HTTP ms antes → depois'],result.map(r=>[r.size+' / '+names[r.name],r.arms.baseline.http.n,...['phase','sync','http'].map(k=>f(r.arms.baseline[k][stat])+' → '+f(r.arms.candidate[k][stat]))]));
const roundTable=table(['Massa / operação','Rodada','Saldo ms antes → depois','sync ms antes → depois','HTTP ms antes → depois','Redução HTTP'],result.flatMap(r=>[1,2,3].map(round=>{const a=r.rounds.find(x=>x.round===round&&!x.candidate),b=r.rounds.find(x=>x.round===round&&x.candidate);return [r.size+' / '+names[r.name],round,...['phase','sync','http'].map(k=>f(a[k].median)+' → '+f(b[k].median)),f(gain(a.http.median,b.http.median))+'%'];})));
const spreadTable=table(['Massa / operação / métrica','Antes mín–máx / desvio ms','Depois mín–máx / desvio ms'],result.flatMap(r=>['phase','sync','http'].map(k=>[r.size+' / '+names[r.name]+' / '+k,...[r.arms.baseline[k],r.arms.candidate[k]].map(s=>f(s.min)+'–'+f(s.max)+' / '+f(s.sd))])));
const improvements=Object.fromEntries(['phase','sync','http'].map(k=>[k,result.reduce((s,r)=>s+[1,2,3].filter(round=>{const a=r.rounds.find(x=>x.round===round&&!x.candidate),b=r.rounds.find(x=>x.round===round&&x.candidate);return b[k].median<a[k].median;}).length,0)]));
const visitTable=table(['Massa','P','M inicial','Antes: comparações P × M','Depois: movimentos M + consultas P','Contagem real após as operações (antes → depois)'],report.volumes.map(v=>{const c=v.runs[0].countedVisits;return [v.size,v.records.products,v.records.movements,v.records.products*v.records.movements,v.records.movements+' + '+v.records.products+' = '+(v.records.movements+v.records.products),c.baseline.totalVisits+' → '+c.candidate.totalVisits];}));
const initialVisitTable=supplemental?table(['Massa','Movimentos visitados antes','Produtos visitados antes','Movimentos visitados depois','Produtos consultados depois'],supplemental.initialVisits.map(v=>[v.size,v.baseline.movementVisits,v.baseline.productVisits,v.candidate.movementVisits,v.candidate.productVisits])):'Contagens iniciais suplementares pendentes.';
const status=decision.pending?'Somente experimento; decisão pendente.':decision.implemented?'APROVADO: somente o acumulador local foi implementado.':'DESCARTADO: produção preservada.';
const md=`# Fundação V1.2 — Acumulador local dos saldos globais

Relatório de sessão para a direção. Versão ${report.version}, migrations 001–010. ${status}

## 1. Algoritmo atual confirmado

Antes desta tarefa, syncInventory percorria todos os movimentos para CADA produto, somando com add decimal apenas aqueles cujo productId fosse igual. Em seguida gravava o estoque declarado e a âncora estoque menos soma. A reutilização local do INSERT de movimentos já existia e foi preservada nos dois braços. Nenhum bug funcional foi presumido.

Papéis consultados: Banco — complexidade/conteúdo/FKs; Backend — fronteira local e contratos; QA / Testing — equivalência, rollback e medição. Documentação histórica V1.1 ainda cita 457 testes/001–007; código e baseline atual orientaram esta tarefa, sem reabrir a fundação.

## 2. Visitas antes

${visitTable}

Contagens também executadas nos corpos reais sobre cópias descartáveis das massas INICIAIS (as fontes sintéticas foram preservadas):

${initialVisitTable}

A coluna P × M conta as comparações de movimentos; o total antes também inclui P visitas externas a produtos. Após o workload há 18 movimentos adicionais em cada braço. Os valores finais foram CONTADOS executando os corpos reais com incrementos apenas nos dois loops relevantes, em transações descartadas fora da medição. O corpo sem contadores foi usado nos tempos HTTP. Os perfis por requisição derivam a mesma contagem da forma de entrada; não há timer/contador por comparação nos samples.

## 3. Candidato

Map LOCAL a syncInventory, com uma passagem pelos movimentos. Para cada movimento, soma add(acumulado ou '0', quantidade), preservando a ordem relativa dos movimentos do mesmo produto. Depois, cada produto consulta seu acumulado ou '0'. Mesma preparação/inserção de saldos, decimal(p.stock), minus(p.stock,sum), posições e marcadores. Fonte congelada em inventory-baseline.js antes de qualquer mudança de produção; inventory-candidate.js contém o candidato exato medido.

## 4. Visitas depois

Uma visita a cada movimento e uma consulta por produto: M + P. Na massa maior inicial: 3.300 + 1.500 = 4.800, em lugar de 4.950.000 comparações internas mais 1.500 visitas externas. Map trata identificadores como __proto__ e constructor sem colisão de propriedades. Não há cache compartilhado entre chamadas, unidades, empresas ou conexões.

## 5. Complexidade

ANTES O(P × M + P); DEPOIS O(M + P), considerando lookup de Map amortizado e a soma decimal separadamente. A quantidade/ordem das adições úteis é a mesma. O acumulador adiciona memória O(U), sendo U o número de IDs de produto nos movimentos (U ≤ P em estado válido). Isso descreve somente a soma global: reconstrução SQL, busca de compras, posições e verifyInventoryMirror continuam com seus custos anteriores. Não é uma alegação de que toda escrita virou linear.

## 6. Equivalência

18 processos / nove pares. Em cada processo, baseline e candidato recebem o MESMO estado, revisão e escopo em replays descartados. Comparação deepEqual de todas as linhas/colunas de todas as tabelas, seguida de SHA256 por tabela; não apenas contagem. Inclui commercial_stock_balances, commercial_stock_movements, commercial_stock_entries, commercial_position_balances, commercial_position_movements, marcadores, revisões, snapshot, auditoria e provas existentes. Relógio fixo somente nos replays para normalized_at idêntico; tempos HTTP usam relógio real. Os replays também verificam espelho, FK check vazio, integridade ok e restauração integral após rollback.

HTTP real preserva autorização por sessão/empresa/unidade/recurso, autoria e aprovação reais, histórico antigo, estoques esperados, revisão, cadeia de auditoria e idempotência sem nova escrita. Os braços HTTP geram IDs/datas novos distintos; a prova de igualdade exata usa entrada idêntica nos replays, sem alegar igualdade dos bancos independentes pós-HTTP.

Testes focados: sem/um/muitos movimentos; positivos e negativos; âncoras e histórico; inativo; IDs especiais; chamadas repetidas; três escopos; falha na inserção de saldo; FK recusando produto inexistente; transação obrigatória. Testes existentes verificam autoria presente/ausente, recebimentos, posições/entradas não vazias. Validação suplementar compara conteúdo completo com esses ramos não vazios em três escopos (supplemental-validation.json).

Precisão: add usa BigInt e texto decimal, sem Number/float para somar, sem novo arredondamento. Quantidades persistidas/operações permanecem inteiras. Aritmética com texto decimal e cancelamento acima de MAX_SAFE_INTEGER foi caracterizada no trecho isolado com stub SQL; não é prova de persistência nem venda fracionada. A primeira fixture tentou texto decimal na persistência e foi rejeitada pela projeção atual; corrigida apenas a fixture. Não houve RED funcional de produção.

## 7. Fase de saldo global

Média e mediana medem a soma (incluindo a passagem do acumulador) E inserção dos saldos globais, exatamente a fase do instrumento anterior. Posições físicas têm fase separada. Na venda normal maior: mediana ${f(normal.arms.baseline.phase.median)} → ${f(normal.arms.candidate.phase.median)} ms (${f(normal.gains.phase.medianPct)}%); média ${f(normal.arms.baseline.phase.mean)} → ${f(normal.arms.candidate.phase.mean)} ms.

Medianas (ms):

${valuesTable('median')}

Médias (ms):

${valuesTable('mean')}

## 8. syncInventory total

Na venda normal maior: mediana ${f(normal.arms.baseline.sync.median)} → ${f(normal.arms.candidate.sync.median)} ms (${f(normal.gains.sync.medianPct)}%); média ${f(normal.arms.baseline.sync.mean)} → ${f(normal.arms.candidate.sync.mean)} ms. A melhoria da fase não remove os demais custos do método.

## 9. HTTP completo

Na venda normal maior: mediana ${f(normal.arms.baseline.http.median)} → ${f(normal.arms.candidate.http.median)} ms (${f(normal.gains.http.medianPct)}%); média ${f(normal.arms.baseline.http.mean)} → ${f(normal.arms.candidate.http.mean)} ms. HTTP inclui materialização, validações, sincronizações, espelhos, auditoria/commit e resposta. A excepcional inclui aprovação Argon2id mais commit; não comparar seu valor diretamente com venda normal.

Método compatível com benchmark anterior: pequenas/intermediárias/maiores com P=100/500/1.500, M inicial=220/1.100/3.300; mesmas fixtures sintéticas com compras já recebidas, sem posições no HTTP. Três rodadas AB/BA/AB, arquivos fonte fechados copiados byte a byte, processo novo por braço, migrations 001–010 e configurações de SQLite preservadas. Um aquecimento/operação/braço; cinco normais e três de cada outra operação por rodada, total 252 samples + 72 aquecimentos. Mesmos hooks de SQL/fases nos dois braços. Sem descarte de samples, manipulação de cache/GC, senhas nos artefatos ou banco operacional. Máquina ${report.environment.cpu}, ${report.environment.logicalCpus} processadores lógicos, Windows ${report.environment.os}, Node ${report.environment.node}.

## 10. Variação entre rodadas

Redução de mediana em ${improvements.phase}/36 pares da fase, ${improvements.sync}/36 de sync e ${improvements.http}/36 de HTTP. Valores negativos preservados: significam execução mais lenta.

${roundTable}

${spreadTable}

summary.json e measurements.csv preservam média, mediana, mínimo, máximo, desvio e samples por rodada. Medição instrumentada/sintética sujeita a variação da máquina; amostras por rodada compartilham histórico crescente. Sem promessa de SLA nem significância estatística de uma população independente.

## 11. Decisão

${status} ${decision.reason||'Analisar o resultado antes de alterar produção.'}

## 12. Arquivos

${decision.implemented?'- foundation/inventory-store.js: substituição SOMENTE da soma global P × M por acumulador local.\n':''}- foundation/stock-balance-accumulator.test.js: oito testes diretamente relacionados.
- scripts/stock-balance-candidate.js: transformação única e contagem real em replay descartado.
- scripts/benchmark-stock-balances.js: matriz isolada baseada no benchmark anterior.
- scripts/sync-inventory-meter.js: reconhecer as duas formas do loop, contar a passagem do acumulador dentro da fase e declarar contagens corretas.
- scripts/validate-stock-balances.js: equivalência suplementar com autoria/posições/recibos em três escopos.
- scripts/report-stock-balances.js: somente geração do relatório e sumários QA.
- Pasta desta sessão: fontes congeladas, resultados por processo, CSV/JSON, decisão, validação e testes.

Nenhum contrato, migration, índice, versão, snapshot, mirror, sincronização de compra, entity_index ou regra comercial alterado. Sem commit/push. Modificações anteriores preservadas. SHA baseline: ${report.beforeSHA256}; SHA produção final: ${decision.productionSHA256||'pendente'}.

## 13. Testes focados

Oito testes contra candidato em memória aprovados antes da decisão; caracterização também executada contra baseline correta, sem RED funcional artificial. ${decision.tests?'Resultado final: **'+decision.tests.total+' total; '+decision.tests.passed+' aprovados; '+decision.tests.failed+' falhos; '+decision.tests.skipped+' ignorados; '+decision.tests.cancelled+' cancelados**. Arquivos/comando em focused-command.txt e saída integral em focused-tests.txt.':'Validação final ainda pendente.'}

Benchmark: 18 processos, nove pares coerentes, 18 equivalências de conteúdo completo, idempotência/FKs/integridade/auditoria preservadas. Suíte completa e homologação geral NÃO executadas nesta tarefa. Última suíte completa continua sendo a baseline informada: 562/562, sem falhas/ignorados; não anunciar novo total global homologado.

## 14. Riscos e limites

Memória adicional proporcional a produtos movimentados, restrita à chamada; nenhuma reutilização entre escopos. A soma segue a ordem original por produto e preserva add/decimal/minus. Identificadores válidos são strings; FKs continuam rejeitando relações inválidas. Posições e validações não foram simplificadas. Benefício não elimina custo total de reconstrução/espelho nem certifica carga concorrente, volumes não medidos ou operação da loja. O código foi alterado localmente após a decisão; nenhum banco operacional/instância da loja foi usado ou reiniciado.

## 15. Uma próxima melhoria

**Experimentar, em tarefa própria, um acumulador local na soma global de verifyInventoryMirror**, mantendo a validação exata de cada saldo/âncora e sem combinar com outras otimizações. O verificador ainda repete P × M nas escritas. Apenas recomendação; nenhum trecho dele foi alterado nesta sessão.

Reprodução: node scripts/benchmark-stock-balances.js --baseline <inventory-baseline.js desta pasta QA>; depois node scripts/report-stock-balances.js <novo report.json>. O parâmetro só aceita fonte da pasta QA stock-balances e exige a baseline com INSERT local já otimizado e loop global antigo.

[Dados brutos](report.json), [sumários](summary.json), [CSV](measurements.csv), [decisão](decision.json), [validação suplementar](supplemental-validation.json), [testes](focused-tests.txt).
`;
fs.writeFileSync(path.join(dir,'RELATORIO.md'),md);
console.log(JSON.stringify({report:path.join(dir,'RELATORIO.md'),normalLarge:normal.gains,improvements,status}));
