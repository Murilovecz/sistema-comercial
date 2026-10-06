'use strict';
// Artifact generation only, no production or SQLite access.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../.qa/foundation-v1.2/mirror-balances'),input=path.resolve(process.argv[2]||'');
assert(input.startsWith(ROOT+path.sep)&&path.basename(input)==='report.json');
const report=JSON.parse(fs.readFileSync(input)),dir=path.dirname(input);
const optional=name=>fs.existsSync(path.join(dir,name))?JSON.parse(fs.readFileSync(path.join(dir,name))):null;
const decision=optional('decision.json')||{pending:true},supplement=optional('supplemental-validation.json');
const names={'normal-sale':'Venda normal','exceptional-sale-with-approval':'Excepcional + aprovação','purchase-receive':'Recebimento','stock-entry':'Entrada de estoque'};
function stats(a){const values=[...a].sort((a,b)=>a-b),n=values.length,mean=values.reduce((s,v)=>s+v,0)/n;return {n,mean,median:n%2?values[(n-1)/2]:(values[n/2-1]+values[n/2])/2,min:values[0],max:values.at(-1),sd:Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/n)};}
const f=v=>v.toFixed(3).replace('.',','),gain=(a,b)=>(1-b/a)*100;
const table=(head,rows)=>['| '+head.join(' | ')+' |','| '+head.map(()=>'---').join(' | ')+' |',...rows.map(r=>'| '+r.join(' | ')+' |')].join('\n');
const result=[],csv=['scale,round,candidate,operation,sample,calls,aggregate_ms,http_ms,movement_visits,product_visits'];
const callCsv=['scale,round,candidate,operation,sample,call,ms,movements,comparisons,product_visits,ancestry'];
for(const volume of report.volumes)for(const name of Object.keys(names)){
 const row={size:volume.size,name,arms:{},rounds:[]};
 for(const candidate of [false,true]){
  const raw=[],allCalls=[];
  for(const run of volume.runs.filter(r=>r.candidate===candidate)){
   const m=run.measurements.find(m=>m.name===name),values=[],internal=[];
   m.raw.forEach((sample,i)=>{
    const calls=sample.profile.calls.filter(c=>c.name==='verifyInventoryMirror');
    const value={calls:calls.length,aggregate:calls.reduce((s,c)=>s+c.ms,0),http:sample.elapsedMs,
     movementVisits:calls.reduce((s,c)=>s+c.counts.productMovementVisits,0),productVisits:calls.reduce((s,c)=>s+c.counts.globalProductVisits,0)};
    raw.push(value);values.push(value);internal.push(...calls.map(c=>c.ms));allCalls.push(...calls.map(c=>c.ms));
    csv.push([volume.size,run.round,candidate,name,i+1,...Object.values(value)].join(','));
    calls.forEach((c,j)=>callCsv.push([volume.size,run.round,candidate,name,i+1,j+1,c.ms,c.counts.stockMovements,c.counts.productMovementVisits,c.counts.globalProductVisits,c.ancestry.join(' > ')].join(',')));
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
const visitTable=supplement?table(['Massa','Comparações antes','Produtos antes','Movimentos depois','Produtos depois','Total depois'],supplement.initialVisits.map(v=>[v.size,v.baseline.movementVisits,v.baseline.productVisits,v.candidate.movementVisits,v.candidate.productVisits,v.candidate.totalVisits])):'Contagem suplementar pendente.';
const invalid=supplement?[...new Set(supplement.results.filter(r=>!r.proof.accepted).map(r=>r.name))].map(n=>'- '+n).join('\n'):'Casos suplementares pendentes.';
const status=decision.pending?'Decisão pendente; apenas experimento.':decision.implemented?'APROVADO: implementado somente o acumulador global LOCAL do verificador.':'DESCARTADO: produção preservada.';
const md=`# Fundação V1.2 — Soma global de verifyInventoryMirror

Relatório de sessão para a direção. Versão ${report.version}; migrations 001–010. ${status}

## 1. Implementação atual confirmada

foundation/inventory-store.js: verifyInventoryMirror, linha 21 na fonte congelada. Saída sem marcador mantém o objeto original. Com marcador: confere revisão; hidrata e compara canonicamente históricos; busca saldos do escopo; compara quantidade declarada, produto, âncora e soma; reconstrói/confere posições e sua âncora; retorna cópia compatível do estado. Apenas SELECTs, sem reparar ou gravar.

Chamadores diretos no código executável: commercial-store.verifyCommercialMirror; inventory-store.normalizeInventory quando já normalizado; inventory-store.report. Indiretos: scoped-state.loadState, state-repository.writeState (conferência final e caminho de normalização sem alteração), normalizeAllCommercial e verifyCommercial/verifyCommercialBase. Runtime prepara/confere unidades; scripts/verify-commercial.js chama verifyCommercial. Em HTTP, loadState é utilizado por commercial-write.handleCommercialWrite (venda), inactive-sale-approval.approveInactiveSale (concessão), server.dispatchLegacy (recebimento/entrada) e writeState/saveBusinessState. Arquivos/testes/ferramentas têm outras invocações para caracterização, não chamadas adicionais de negócio.

Papéis lidos e aplicados: Banco — contagem, precisão/conteúdo e isolamento; Backend — contratos/ordem das conferências e chamadores; QA / Testing — aceitação/recusa equivalentes, efeitos e medição. Documentação histórica V1.1 não substituiu o código/baseline atual; nenhuma fundação anterior reimplementada.

## 2. Chamadas por operação

Venda normal: **3**; recebimento: **3**; entrada: **3**; excepcional com concessão + commit: **4** (uma na concessão e três no commit). Confirmados em TODAS as amostras atuais e nas evidências da sessão anterior. Não se retirou nenhuma chamada.

As três ancestrais instrumentadas de uma escrita normal são: loadState → verifyCommercialMirror; saveBusinessState → writeState → loadState → verifyCommercialMirror; saveBusinessState → writeState → verifyCommercialMirror. A excepcional agrega mais uma leitura na concessão. São contagens deste fluxo de nova escrita: replay sem nova escrita tem caminho próprio e não deve receber a mesma contagem por suposição.

## 3. Soma anterior

Para cada produto, depois de encontrar seu saldo e comparar saldo declarado, percorria next.stockMovements inteiro e somava add somente quando productId === p.id. A validação compare(add(technical_anchor,sum),quantity) precisava continuar intacta.

## 4. Visitas antes

${visitTable}

Por verificação, massa maior inicial: 4.950.000 comparações de movimento, mais 1.500 produtos. Uma escrita normal realiza três verificações, por isso o custo se repete; M varia entre a leitura anterior e a conferência final conforme a escrita acrescenta histórico. verifier-calls.csv preserva M e visitas de CADA chamada medida, sem usar 3 × constante para ocultar essa variação.

Contadores reais executaram os corpos baseline/candidato em leituras separadas, SEM timers/contadores dentro dos loops HTTP. Foram contados estados inicial e pós-workload; entrada e conteúdo do banco permaneceram iguais. Nos perfis HTTP, as contagens são derivadas da forma validada de entrada e confirmadas pelos replays reais.

## 5. Candidato

Após hidratar/conferir históricos e confirmar a quantidade de saldos, cria verifiedMovementTotals = new Map() LOCAL. Uma passagem pelos movimentos hidratados soma com add decimal exato; depois consulta total ou '0' no MESMO ponto da validação por produto. Nenhum cache entre chamadas/requisições, tenants, unidades ou conexões; nenhuma alteração em syncInventory. Fonte atual congelada em inventory-baseline.js antes da produção; candidato exato em inventory-candidate.js.

## 6. Visitas depois

Na massa maior inicial: 3.300 movimentos + 1.500 consultas de produto = **4.800** visitas. Massas pequena/intermediária: **320 / 1.600**. Adições por produto mantêm sua ordem original. Identificadores especiais ficam em Map, sem colisão de propriedades.

## 7. Complexidade

Somente SOMA GLOBAL: O(P × M) → O(M + P), com lookup amortizado do Map e custo decimal considerado separadamente. Memória adicional O(U), U IDs movimentados (U ≤ P no estado válido). Não afirmar linearidade de toda verificação/escrita: balances.find continua podendo fazer P², queries por produto/posições, conferências físicas, canonicalização/hidratação e demais módulos não foram otimizados.

## 8. Invariantes preservadas

- Marcador, revisão e comportamento transitório sem marcador.
- Presence flags das três coleções; dados ausentes, vazios, null onde já admitidos; ordem e conteúdo canônico, extras/present_fields e autoria SQL versus histórico.
- Número de saldos, produto correspondente, saldo declarado comparado de forma exata e saldo = âncora histórica + soma de movimentos.
- legacyInteger na hidratação/retorno, sem permitir persistência/comando fracionado; add/compare/decimal usam representação exata, sem soma por float nem novo arredondamento.
- Presence 0/1/2 das posições, null/ausente/vazio distintos; quantidades/ordem/canonical e âncora física + entradas/saídas por posição.
- SQL filtrado por empresa/unidade. verifyInventoryMirror não aplica RBAC/assertScope diretamente; essa autoridade permanece no chamador HTTP/loadState. Ausência de marcador de contexto inexistente já retorna a entrada no helper interno; não inventamos uma nova recusa. loadState continua rejeitando contexto inválido.
- Nenhuma mutação do estado de entrada nem de tabela, snapshot, marcador, revisão, auditoria ou histórico. Transação, FK, RBAC, CSRF e idempotência permanecem no fluxo real.

## 9. Estados inválidos testados

${invalid}

Casos de saldo, âncora, produtos/histórico, marcadores, posições e autoria devolvem o MESMO AppError 500 COMMERCIAL_DIVERGENCE e mensagem. Quantidade SQL fracionada/inválida mantém o mesmo erro de hidratação já existente, sem converter para nova regra. Corrupções SQL são exclusivamente em memória, dentro de transações descartadas; os casos nunca reparam os dados.

## 10. Equivalência baseline/candidato

${supplement?`**${supplement.cases} pares suplementares**, ${supplement.accepted} aceitos e ${supplement.rejected} recusados, com mesma entrada, sucesso/objeto de saída ou nome/código/status/mensagem do erro.`:'Validação suplementar pendente.'} Três escopos (A1/A2/B1), sem/um/muitos movimentos, positivos/negativos, produto inativo, histórico/extras, âncoras, __proto__/constructor, autoria presente/null/ausente, recibo/entrada e posições não vazias/ausentes/vazias/null. Inteiro 9007199254740991 e cancelamento cuja soma intermediária excede Number.MAX_SAFE_INTEGER preservados com BigInt.

Em cada braço, SHA256 de conteúdo completo de TODAS as tabelas e entrada antes/depois comprova ausência de escrita/mutação. Resultados de sucesso são comparados deepEqual, erros por campos relevantes; aceitação sem marcador preserva identidade do objeto. Não se compara apenas boolean ou contagens. Casos válidos têm FK check vazio e integrity_check ok. Corruptions rollback restaura tudo.

Mais **18 pares de verificação** sobre os estados produzidos pelos processos HTTP reais; todos iguais. HTTP independente gera UUID/data diferentes legitimamente; prova de equivalência usa exatamente a mesma entrada e banco em cada replay. Sem manipular o relógio, pois o verificador é somente leitura.

Coleção stockMovements=null foi caracterizada apenas no helper direto sobre base com coleção ausente. Persistência/loadState recusam lista null antes dessa função; não anunciamos suporte comercial a isso. A primeira montagem de fixture tentou gravar null e alterar metadados sem transação: fixtures corrigidas, sem mudança de produção ou RED funcional artificial.

## 11. Tempo interno por chamada

Venda normal maior: mediana ${f(normal.arms.baseline.internal.median)} → ${f(normal.arms.candidate.internal.median)} ms (${f(normal.gains.internal.medianPct)}%); média ${f(normal.arms.baseline.internal.mean)} → ${f(normal.arms.candidate.internal.mean)} ms. Interno é o tempo inclusivo do CORPO completo do verificador, com todas as conferências/queries mantidas, não apenas soma nem SQL puro. Mediana por chamada usa todas as chamadas individuais (45 em cada braço para venda normal).

Medianas antes → depois (ms):

${times('median')}

Médias antes → depois (ms):

${times('mean')}

## 12. Agregado das verificações

Venda normal maior: mediana ${f(normal.arms.baseline.aggregate.median)} → ${f(normal.arms.candidate.aggregate.median)} ms (${f(normal.gains.aggregate.medianPct)}%); média ${f(normal.arms.baseline.aggregate.mean)} → ${f(normal.arms.candidate.aggregate.mean)} ms. Soma das três verificações de cada request, sem somar novamente wrappers como loadState/verifyCommercialMirror. Agregado da excepcional inclui quatro verificações dos dois requests da concessão/commit.

## 13. HTTP completo

Venda normal maior: mediana ${f(normal.arms.baseline.http.median)} → ${f(normal.arms.candidate.http.median)} ms (${f(normal.gains.http.medianPct)}%); média ${f(normal.arms.baseline.http.mean)} → ${f(normal.arms.candidate.http.mean)} ms. HTTP mantém materialização, domínio, outros espelhos, todas as sincronizações, auditoria, commit e resposta. A excepcional contém aprovação real Argon2id; não comparar seu tempo absoluto diretamente com venda normal.

Metodologia compatível com a sessão anterior: P=100/500/1.500 e M inicial=220/1.100/3.300, mesmas fixtures/rotas/segurança/migrations 001–010. Três pares AB/BA/AB por escala, processo novo por braço, cópias byte a byte de fonte sintética FECHADA, um aquecimento/operação; 5 normais e 3 excepcionais/recebimentos/entradas por rodada. **252 operações medidas + 72 aquecimentos**. Hooks iguais nos braços, sem descarte de amostras/GC/cache flushing. Senhas somente por IPC; nenhum banco operacional. Tempos desta matriz não são comparações diretas com números de sessões anteriores.

Máquina: ${report.environment.cpu}, ${report.environment.logicalCpus} processadores lógicos; Windows ${report.environment.os}, Node ${report.environment.node}. Fases/SQL instrumentados têm overhead; resultados não certificam carga concorrente. Massa HTTP sem posições físicas; ramo não vazio foi validado na comparação suplementar e testes.

## 14. Variação entre rodadas

Mediana menor em **${improvements.internal}/36** comparações internas, **${improvements.aggregate}/36** agregadas e **${improvements.http}/36** HTTP. Valores negativos de redução significam mais lento e não foram omitidos.

${rounds}

${spread}

Dados completos de média, mediana, mínimo, máximo, desvio e por chamada/rodada em summary.json, measurements.csv, verifier-calls.csv e JSONs brutos. Amostras de uma rodada compartilham histórico crescente/ambiente; não há promessa de SLA ou significância estatística de população independente.

## 15. Decisão

${status} ${decision.reason||'Aguardar o término e a análise antes de alterar produção.'}

## 16. Arquivos alterados

${decision.implemented?'- foundation/inventory-store.js: somente Map local e consulta da soma dentro de verifyInventoryMirror.\n':''}- foundation/mirror-balance-accumulator.test.js: 26 caracterizações/corrupções e imutabilidade.
- scripts/mirror-balance-candidate.js: transformação única em memória/contagem real não cronometrada.
- scripts/mirror-balance-equivalence.js: comparação de sucesso/erro/entrada/banco, sem escrita.
- scripts/mirror-balance-fixture.js: massa e corrupções sintéticas compartilhadas.
- scripts/benchmark-mirror-balances.js: matriz pareada isolada.
- scripts/validate-mirror-balances.js: aceitação/recusa em três escopos e visitas iniciais.
- scripts/sync-inventory-meter.js: instrumentar entrada/ancestrais/contagens do verificador; mesmos hooks em ambos os braços.
- scripts/report-mirror-balances.js: artefatos QA.
- Pasta desta sessão: fontes congeladas, resultados, decisão, testes, validação e relatório.

SHA baseline ${report.beforeSHA256}; produção final ${decision.productionSHA256||'pendente'}. Nenhuma migration/índice/contrato/versão alterado. Fora do corpo do verificador, inventory-store inteiro (incluindo syncInventory) é igual à baseline congelada. Modificações anteriores do repositório preservadas. Sem commit/push.

## 17. Testes focados

Antes de produção, **26/26** na baseline e **26/26** no candidato; caracterização imediatamente verde após corrigir as fixtures. Sem RED funcional artificial.

${decision.tests?`Regressão final diretamente relacionada: **${decision.tests.total} total; ${decision.tests.passed} aprovados; ${decision.tests.failed} falhos; ${decision.tests.skipped} ignorados; ${decision.tests.cancelled} cancelados**. Comando/arquivos em focused-command.txt; saída em focused-tests.txt.`:'Regressão final ainda pendente.'}

18 processos HTTP concluídos / nove pares coerentes; autoria, aprovação, idempotência, auditoria, FK e integridade mantidas. Suíte completa, segurança ampla, UX e homologação geral NÃO iniciadas. Última suíte completa conhecida permanece **562/562**; última rodada anterior foi **142/142**. Não anunciar novo total global homologado.

## 18. Riscos

Memória adicional local O(U); nenhuma referência ao Map é devolvida/armazenada globalmente. Mantida a ordem da soma por produto. Não removemos validações para gerar performance. Medições sintéticas/instrumentadas com variação da máquina; benefício não garante redução em toda requisição nem cobre concorrência. N+1, balances.find, posições/canonicalização/materialização continuam com seus custos. Helpers internos não são fronteira de autorização: conferir sempre pelo backend autenticado/loadState. Loja/banco operacional não foram usados nem reiniciados.

## 19. Uma próxima melhoria recomendada

**Experimentar um índice local de saldos por product_id para substituir somente balances.find dentro de verifyInventoryMirror**, preservando falta/quantidade/correspondência de produto e todas as comparações atuais, com equivalência e medição próprias. É recomendação separada; nenhuma implementação foi iniciada e o N+1 de posições permanece intacto.

Reprodução: node scripts/benchmark-mirror-balances.js --baseline <inventory-baseline.js desta pasta QA>; node scripts/validate-mirror-balances.js <nova pasta>; node scripts/report-mirror-balances.js <novo report.json>. Fonte --baseline deve estar dentro de QA mirror-balances e conter as melhorias anteriores de syncInventory/INSERT, com soma antiga do verificador.

[Dados brutos](report.json), [sumários](summary.json), [operações](measurements.csv), [chamadas](verifier-calls.csv), [equivalência suplementar](supplemental-validation.json), [decisão](decision.json), [testes](focused-tests.txt).
`;
fs.writeFileSync(path.join(dir,'RELATORIO.md'),md);console.log(JSON.stringify({report:path.join(dir,'RELATORIO.md'),normalLarge:normal.gains,improvements,status}));
