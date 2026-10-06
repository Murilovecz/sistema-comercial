'use strict';
// Artifact generation only, no production or SQLite access.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../.qa/foundation-v1.2/balance-lookup'),input=path.resolve(process.argv[2]||'');
assert(input.startsWith(ROOT+path.sep)&&path.basename(input)==='report.json');
const report=JSON.parse(fs.readFileSync(input)),dir=path.dirname(input);
const optional=name=>fs.existsSync(path.join(dir,name))?JSON.parse(fs.readFileSync(path.join(dir,name))):null;
const decision=optional('decision.json')||{pending:true},supplement=optional('supplemental-validation.json');
const names={'normal-sale':'Venda normal','exceptional-sale-with-approval':'Excepcional + aprovação','purchase-receive':'Recebimento','stock-entry':'Entrada de estoque'};
function stats(a){const values=[...a].sort((a,b)=>a-b),n=values.length,mean=values.reduce((s,v)=>s+v,0)/n;return {n,mean,median:n%2?values[(n-1)/2]:(values[n/2-1]+values[n/2])/2,min:values[0],max:values.at(-1),sd:Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/n)};}
const f=v=>v.toFixed(3).replace('.',','),gain=(a,b)=>(1-b/a)*100;
const table=(head,rows)=>['| '+head.join(' | ')+' |','| '+head.map(()=>'---').join(' | ')+' |',...rows.map(r=>'| '+r.join(' | ')+' |')].join('\n');
const result=[],csv=['scale,round,candidate,operation,sample,calls,aggregate_ms,http_ms,find_searches,find_comparisons,map_checks,map_insertions,map_lookups'];
const callCsv=['scale,round,candidate,operation,sample,call,ms,balances,find_searches,find_comparisons,map_checks,map_insertions,map_lookups,ancestry'];
for(const volume of report.volumes)for(const name of Object.keys(names)){
 const row={size:volume.size,name,arms:{},rounds:[]};
 for(const candidate of [false,true]){
  const raw=[],allCalls=[];
  for(const run of volume.runs.filter(r=>r.candidate===candidate)){
   const m=run.measurements.find(m=>m.name===name),values=[],internal=[];
   m.raw.forEach((sample,i)=>{
    const calls=sample.profile.calls.filter(c=>c.name==='verifyInventoryMirror');
    const value={calls:calls.length,aggregate:calls.reduce((s,c)=>s+c.ms,0),http:sample.elapsedMs,
     searches:calls.reduce((s,c)=>s+c.counts.balanceSearches,0),comparisons:calls.reduce((s,c)=>s+c.counts.findComparisons,0),mapChecks:calls.reduce((s,c)=>s+c.counts.mapChecks,0),mapInsertions:calls.reduce((s,c)=>s+c.counts.mapInsertions,0),mapLookups:calls.reduce((s,c)=>s+c.counts.mapLookups,0)};
    raw.push(value);values.push(value);internal.push(...calls.map(c=>c.ms));allCalls.push(...calls.map(c=>c.ms));
    csv.push([volume.size,run.round,candidate,name,i+1,...Object.values(value)].join(','));
    calls.forEach((c,j)=>callCsv.push([volume.size,run.round,candidate,name,i+1,j+1,c.ms,c.counts.balances,c.counts.balanceSearches,c.counts.findComparisons,c.counts.mapChecks,c.counts.mapInsertions,c.counts.mapLookups,c.ancestry.join(' > ')].join(',')));
   });
   row.rounds.push({round:run.round,candidate,internal:stats(internal),...Object.fromEntries(Object.keys(values[0]).map(k=>[k,stats(values.map(v=>v[k]))]))});
  }
  row.arms[candidate?'candidate':'baseline']={internal:stats(allCalls),...Object.fromEntries(Object.keys(raw[0]).map(k=>[k,stats(raw.map(v=>v[k]))]))};
 }
 row.gains=Object.fromEntries(['internal','aggregate','http'].map(k=>[k,{medianPct:gain(row.arms.baseline[k].median,row.arms.candidate[k].median),meanPct:gain(row.arms.baseline[k].mean,row.arms.candidate[k].mean)}]));result.push(row);
}
fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(result,null,2)+'\n');fs.writeFileSync(path.join(dir,'measurements.csv'),csv.join('\n')+'\n');fs.writeFileSync(path.join(dir,'verifier-calls.csv'),callCsv.join('\n')+'\n');
const normal=result.find(r=>r.size==='large'&&r.name==='normal-sale');
const times=stat=>table(['Massa / operação','n operações / braço','n verificações / braço','Interno por chamada ms','Agregado verificador ms','HTTP ms'],result.map(r=>[r.size+' / '+names[r.name],r.arms.baseline.http.n,r.arms.baseline.internal.n,...['internal','aggregate','http'].map(k=>f(r.arms.baseline[k][stat])+' → '+f(r.arms.candidate[k][stat]))]));
const rounds=table(['Massa / operação','Rodada','Interno por chamada ms','Agregado ms','HTTP ms','Redução HTTP'],result.flatMap(r=>[1,2,3].map(round=>{const a=r.rounds.find(x=>x.round===round&&!x.candidate),b=r.rounds.find(x=>x.round===round&&x.candidate);return [r.size+' / '+names[r.name],round,...['internal','aggregate','http'].map(k=>f(a[k].median)+' → '+f(b[k].median)),f(gain(a.http.median,b.http.median))+'%'];})));
const spread=table(['Massa / operação / métrica','Antes mín–máx / desvio ms','Depois mín–máx / desvio ms'],result.flatMap(r=>['internal','aggregate','http'].map(k=>[r.size+' / '+names[r.name]+' / '+k,...[r.arms.baseline[k],r.arms.candidate[k]].map(s=>f(s.min)+'–'+f(s.max)+' / '+f(s.sd))])));
const improvements=Object.fromEntries(['internal','aggregate','http'].map(k=>[k,result.reduce((n,r)=>n+[1,2,3].filter(round=>{const a=r.rounds.find(x=>x.round===round&&!x.candidate),b=r.rounds.find(x=>x.round===round&&x.candidate);return b[k].median<a[k].median;}).length,0)]));
const visitTable=supplement?table(['Massa','Saldos','Buscas antes','Comparações reais do find','Map has depois','Map set depois','Map get depois'],supplement.initialVisits.map(v=>[v.size,v.baseline.balances,v.baseline.searches,v.baseline.comparisons,v.candidate.mapChecks,v.candidate.mapInsertions,v.candidate.mapLookups])):'Contagem suplementar pendente.';
const invalid=supplement?[...new Set(supplement.results.filter(r=>!r.proof.accepted).map(r=>r.name))].map(n=>'- '+n).join('\n'):'Casos suplementares pendentes.';
const status=decision.pending?'Decisão pendente; apenas experimento.':decision.implemented?'APROVADO: implementado somente o Map LOCAL de saldos do verificador.':'DESCARTADO: produção preservada.';
const md=`# Fundação V1.2 — Lookup local de saldos em verifyInventoryMirror

Relatório da sessão para a direção. Versão ${report.version}; migrations 001–010. ${status}

## 1. Comportamento atual do balances.find

Em foundation/inventory-store.js, verifyInventoryMirror carrega todos os saldos do escopo e confere balances.length === state.products.length. Para cada produto faz balances.find(b => b.product_id === p.id), devolvendo a PRIMEIRA ocorrência e interrompendo a busca quando encontrada. Em estado válido são P buscas; tamanho B da lista é P. SQL não tem ORDER BY nessa consulta; a ordem não é assumida como regra. Com PK única e todos os IDs distintos consultados uma vez, a soma das posições encontradas é SEMPRE P(P+1)/2, qualquer que seja a permutação.

Depois do lookup continuam: !b; compare(b.quantity,p.stock); compare(add(b.technical_anchor,sum),b.quantity); legacyInteger; presença/null/vazio/canonical e quantidades das posições; soma/âncoras físicas. A soma global já otimizada permanece idêntica; nenhuma matemática mudou.

Papéis Banco/Backend/QA aplicados: unicidade/contagem e medição; semântica/compatibilidade; estados válidos e inválidos/imutabilidade. Código real e última evidência (168/168 focados; última completa 562/562) usados como baseline, sem reabrir V1.1 ou modificar documentação histórica.

## 2. Constraints e unicidade

commercial_stock_balances é STRICT: company_id, unit_id, product_id TEXT NOT NULL; PRIMARY KEY(company_id,unit_id,product_id). Índice sqlite_autoindex_commercial_stock_balances_1 é UNIQUE, origin=pk. FK composta ao produto do MESMO escopo é DEFERRABLE INITIALLY DEFERRED. Mesmo product_id em A1/A2/B1 é permitido; duplicar a tripla não é.

Migration 006 e PRAGMA table_info/index_list/foreign_key_list do banco sintético confirmam a definição. INSERT SELECT de um saldo existente recusado por SQLite errcode 1555, sem mudar uma linha. Saldo para produto SQL inexistente recusado pela FK no commit, com rollback integral. Não foi removida constraint, criado estado duplicado impossível pela API ou acrescentada nova validação comercial. Evidência: supplemental-validation.json / constraintProof.

## 3. Comparações reais antes

${visitTable}

Contadores incrementaram a busca e CADA execução do callback do find dentro do corpo real, em replay NÃO cronometrado sobre cópias sintéticas. A fórmula triangular foi confirmada em todas as massas. Também foi conferida previamente em bancos QA da sessão anterior abertos somente para leitura. O máximo de UMA busca válida é P comparações; as P buscas distintas totalizam exatamente P(P+1)/2. P² é limite geral de buscas lineares, não a contagem observada nos estados válidos.

## 4. Candidato experimental

Map local balanceByProductId, construído uma vez DEPOIS da mesma conferência de cardinalidade. Para cada linha, has(product_id) e set somente se ainda ausente; depois get(p.id) substitui apenas balances.find. Cada valor é a MESMA linha original, sem clone/conversão/normalização. A proteção mantém a primeira ocorrência como find; não usamos último valor vence, nem mudamos a resposta para duplicidade hipotética fora do banco.

Fonte congelada antes da decisão em inventory-baseline.js; candidato aplicado apenas em memória durante o experimento, preservado em inventory-candidate.js. Nenhum Map global, entre chamadas, empresas, unidades, requisições ou conexões.

## 5. Operações depois

Em estado válido: P verificações has, P inserções set e P consultas get. Na massa maior, **1.500 + 1.500 + 1.500 = 4.500 operações de Map**, com uma passagem por 1.500 saldos e 1.500 produtos, em lugar de 1.125.750 comparações do find. Pequena/intermediária: 300 / 1.500 operações. O custo do has de proteção NÃO foi omitido das contagens.

Perfis HTTP registram contagens derivadas da entrada válida e tamanho real da consulta SQL, sem incrementar o callback do find ou usar timer a cada comparação. Replays separados contam ambos os corpos de verdade e conferem a derivação; instrumentos iguais nos dois braços. Cada chamada em verifier-calls.csv preserva buscas/comparações/has/set/get.

## 6. Complexidade

Somente localização de saldo: ANTES O(P²) no estado válido enumerado (P(P+1)/2 comparações); DEPOIS O(B + P), sendo B=P pela cardinalidade preservada, portanto **O(P)**, com operações amortizadas de Map. Memória adicional O(P) para referências aos saldos já carregados. Nenhuma operação sobre quantidades mudou. Hidratação/canonicalização, posições e demais etapas continuam com seus custos; não se afirmou que toda verificação/escrita virou linear.

## 7. Validações e cardinalidade preservadas

mesmo marcador e revisão; mesmo SQL por company_id/unit_id; mesmos históricos/ordem/canonical/extras/autoria; mesma checagem do número de saldos; mesma recusa de saldo não encontrado; mesma quantidade declarada; mesma âncora e soma global; mesmo legacyInteger e decimal/add/compare; mesmas posições e âncoras físicas; mesma semântica de ausente/null/vazio. Cardinalidade diferente aborta ANTES de construir o Map. Ausência de marcador mantém o retorno original, sem inventar RBAC nesse helper interno; autorização permanece no backend/loadState.

## 8. Casos inválidos testados

${invalid}

Falta de saldo reduzindo a lista: cardinalidade recusa. Saldo SQL extra versus estado: cardinalidade recusa. Cardinalidade igual com saldo para ID inesperado: falta do saldo correspondente recusa. PK impede duplicidade por escopo; constraint foi testada diretamente. Casos mantêm AppError 500 COMMERCIAL_DIVERGENCE e mensagem, ou o mesmo erro de hidratação quando essa já era a responsabilidade existente. Nenhuma nova regra inventada.

## 9. Equivalência baseline/candidato

${supplement?`**${supplement.cases} pares suplementares**, ${supplement.accepted} aceitos / ${supplement.rejected} recusados, com mesmo resultado de validação ou nome/código/status/mensagem do erro.`:'Validação suplementar pendente.'} Mais **18 pares** sobre estados pós-HTTP, todos iguais. Compara deepEqual do estado de saída, identidade do retorno sem marcador, SHA256 de todas as tabelas e entrada antes/depois; não apenas boolean/contagem. Nenhuma escrita, reparo, revisão, marcador ou auditoria no verificador.

Casos válidos incluem sem/um/muitos movimentos, positivos/negativos, inativo, histórico antigo/extras, âncoras, autoria presente/null/ausente, recibo/entrada, posições vazias/não vazias/ausentes/null, inteiros grandes com soma intermediária acima de MAX_SAFE_INTEGER, IDs __proto__/constructor, três escopos com mesmos IDs e chamadas subsequentes. PK/FK/integridade e rollback conferidos. Coleção null caracterizada apenas no helper direto; persistência continua recusando lista null antes do verificador. Frações continuam desabilitadas.

UUID/data das operações HTTP independentes legitimamente diferem entre bancos: equivalência exata compara a MESMA entrada/banco em cada replay, sem alterar relógio. Todos os hooks são exclusivos da medição em memória.

## 10. Tempo interno por chamada

Venda normal maior: mediana ${f(normal.arms.baseline.internal.median)} → ${f(normal.arms.candidate.internal.median)} ms (${f(normal.gains.internal.medianPct)}% de redução); média ${f(normal.arms.baseline.internal.mean)} → ${f(normal.arms.candidate.internal.mean)} ms. Tempo inclusivo de todo verifyInventoryMirror, com suas queries e conferências mantidas. Mediana individual usa as 45 chamadas dos 15 requests em cada braço; não multiplicar mediana por três para obter a mediana agregada.

Medianas antes → depois, ms:

${times('median')}

Médias antes → depois, ms:

${times('mean')}

## 11. Agregado das verificações

Venda normal maior: mediana ${f(normal.arms.baseline.aggregate.median)} → ${f(normal.arms.candidate.aggregate.median)} ms (${f(normal.gains.aggregate.medianPct)}%); média ${f(normal.arms.baseline.aggregate.mean)} → ${f(normal.arms.candidate.aggregate.mean)} ms. Soma das verificações de CADA requisição, sem dupla contagem com os wrappers loadState/verifyCommercialMirror. Chamadas mantidas: três por venda normal/recebimento/entrada; quatro por excepcional com concessão mais commit. Contagens conferidas em cada sample.

## 12. HTTP completo

Venda normal maior: mediana ${f(normal.arms.baseline.http.median)} → ${f(normal.arms.candidate.http.median)} ms (${f(normal.gains.http.medianPct)}%); média ${f(normal.arms.baseline.http.mean)} → ${f(normal.arms.candidate.http.mean)} ms. Mantidos sessão, RBAC, CSRF, escopo, domínio, transação, FKs, auditoria, idempotência, snapshot, todos os espelhos e resposta. Excepcional inclui concessão real com Argon2id mais commit.

Método compatível com a matriz anterior: small/medium/large, 100/500/1.500 produtos e saldos; M inicial 220/1.100/3.300; migrations 001–010. Fontes sintéticas fechadas e cópias byte a byte por braço, três rodadas pareadas AB/BA/AB, processo novo por braço; um aquecimento/operação, cinco vendas normais e três das demais por rodada. **252 operações medidas + 72 aquecimentos**. Mesmo instrumento nos braços, sem descarte de amostras, GC/cache flushing ou remoção de validações. Senhas somente IPC; nenhum banco operacional. Tempos dessa matriz não foram comparados diretamente com os de sessões anteriores.

Máquina: ${report.environment.cpu}, ${report.environment.logicalCpus} processadores lógicos, Windows ${report.environment.os}, Node ${report.environment.node}. Medição instrumentada tem overhead; massa HTTP sem posições físicas, validadas nos testes/replays não vazios.

## 13. Variação entre rodadas

Mediana menor em ${improvements.internal}/36 pares internos, ${improvements.aggregate}/36 agregados e ${improvements.http}/36 HTTP. Redução negativa significa mais lento. Todas as regressões/outliers permanecem:

Nas massas média e grande, todos os 24 pares internos e agregados melhoraram. A massa pequena teve duas regressões internas e duas agregadas; o HTTP ficou mais lento em 12/36 pares no conjunto. No recebimento pequeno, a média interna piorou de 5,082 para 8,127 ms (+59,921%), com máximo de 48,612 ms no candidato contra 6,111 ms na baseline; a mediana melhorou de 5,059 para 4,871 ms. A causa desses outliers não foi isolada: as amostras foram mantidas e não se promete ganho uniforme. Na massa grande, a venda excepcional teve HTTP +0,220% na primeira rodada, ainda com ganho interno e agregado.

${rounds}

${spread}

summary.json, measurements.csv e verifier-calls.csv conservam média, mediana, mínimo/máximo, desvio e contagens por chamada/rodada. Amostras por rodada compartilham histórico crescente/ambiente; sem promessa de SLA nem significância estatística de uma população independente.

## 14. Decisão

${status} ${decision.reason||'Decidir apenas após concluir as medições e a equivalência.'}

## 15. Arquivos alterados

${decision.implemented?'- foundation/inventory-store.js: somente criação do índice local e lookup do saldo em verifyInventoryMirror.\n':''}- foundation/balance-lookup.test.js: sete testes específicos, inclusive PK/FK.
- scripts/balance-lookup-candidate.js: candidato em memória e contagens reais.
- scripts/benchmark-balance-lookup.js: matriz pareada isolada.
- scripts/validate-balance-lookup.js: aceitação/recusa, constraints e contagens iniciais.
- scripts/sync-inventory-meter.js: contagens derivadas de find/Map e tamanho SQL real, sem instrumentar callback durante os tempos.
- scripts/report-balance-lookup.js: somente relatório/artefatos QA.
- Pasta desta sessão: fontes congeladas, bancos sintéticos/resultados, decisão, validação, testes e relatório.

Reutilizados SEM alteração: mirror-balance-fixture.js, mirror-balance-equivalence.js e stock-insert-equivalence.js. Nenhum novo índice SQL/migration, contrato/versão/commit/push. SHA baseline ${report.beforeSHA256}; produção final ${decision.productionSHA256||'pendente'}. Conferência de que todas as somas, queries e demais trechos são idênticos à baseline da tarefa; alterações anteriores do repositório preservadas.

## 16. Testes focados

Sete testes específicos passaram imediatamente na baseline e no candidato em memória; sem RED funcional artificial. ${decision.tests?`Regressão final: **${decision.tests.total} total, ${decision.tests.passed} aprovados, ${decision.tests.failed} falhos, ${decision.tests.skipped} ignorados e ${decision.tests.cancelled} cancelados**. Comando/arquivos em focused-command.txt; saída em focused-tests.txt.`:'Regressão final pendente.'}

18 processos HTTP/nove pares concluídos; reenvio idempotente, história/autoria/auditoria/FKs/integridade preservados. Suíte completa/segurança ampla/UX/homologação geral e benchmark global da plataforma NÃO executados. Última completa conhecida permanece 562/562; última focada anterior 168/168. Não declarar novo total global homologado.

## 17. Riscos restantes

Map acrescenta memória O(P), restrita à chamada; não escapa nem é compartilhado. Primeiro valor conservado, conforme find, embora duplicidade por escopo seja vedada pela PK. A correspondência de IDs e cardinalidade precisam continuar preservadas nas futuras alterações. Ganho no corpo não garante melhora em cada HTTP; demais custos continuam, inclusive N+1 de posições. Bases/instrumentos sintéticos não certificam concorrência ou operação da loja. Banco operacional/instância da loja não foram utilizados nem reiniciados.

## 18. Uma próxima ação recomendada

**Submeter estes resultados à direção para decidir o encerramento das micro-otimizações e a autorização da rodada ampla de homologação da Fundação V1.2.** Nenhuma nova otimização, N+1 de posições ou homologação ampla foi iniciada nesta tarefa.

Reprodução: node scripts/benchmark-balance-lookup.js --baseline <inventory-baseline.js desta pasta QA>; node scripts/validate-balance-lookup.js <nova pasta>; node scripts/report-balance-lookup.js <novo report.json>. --baseline só aceita fonte da pasta QA balance-lookup com as melhorias anteriores e balances.find original.

[Dados brutos](report.json), [sumários](summary.json), [operações](measurements.csv), [chamadas](verifier-calls.csv), [equivalência/constraints](supplemental-validation.json), [decisão](decision.json), [validação final](validation.json), [testes](focused-tests.txt).
`;
fs.writeFileSync(path.join(dir,'RELATORIO.md'),md);console.log(JSON.stringify({report:path.join(dir,'RELATORIO.md'),normalLarge:normal.gains,improvements,status}));
