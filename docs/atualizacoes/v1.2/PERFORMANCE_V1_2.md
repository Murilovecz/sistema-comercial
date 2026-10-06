# Desempenho e materialização — Fundação V1.2

Estado no fechamento local em **03/10/2026**, checkpoint `2a2177c7b80734722f71bd9e72029cf9e1b39df0`, migrations **001–010**, versão **1.2.0-foundation.1**. Estado final: **B, 610/610**, escritas large ~2 s no sanity HTTP final, snapshot crescente e memória a acompanhar. [Homologação e limites](FOUNDATION_V1_2_REPORT.md). Não houve novo benchmark para este fechamento. Métodos, resultados e limites estão consolidados abaixo; os caminhos `.qa` identificam evidência bruta local opcional, sem dependência para leitura em clone limpo.

## Método e limites

`node scripts/benchmark-foundation.js before` foi executado antes da criação de `sales-store.js`/migration009; acesso008 já estava integrado e backup desativado. O resultado inicial preservado está em `.qa/foundation-v1.2/benchmarks/before.json`. A comparação posterior usa `after` e as mesmas fixtures sintéticas: 100/500/1.500 produtos, 200/1.000/3.000 vendas, duas movimentações por produto, clientes/fornecedores/compras proporcionais. Bancos novos isolados; nunca dados comerciais reais.

São 19 operações por volume, três amostras (duas para login/inicialização e uma para carga). Tempos internos em milissegundos, sem rede/renderização; RSS máximo inclui processo, SQLite, dados e Argon2id. Contadores representam execuções SQL e linhas retornadas, **não** linhas examinadas nem total físico de bytes. A inicialização usa conexão separada: seus contadores zero no JSON inicial significam **não instrumentado**. A carga usa uma amostra, portanto não estabelece tendência estatística. Não é homologação de carga, SLA ou promessa de RPO/RTO.

## Medição anterior à normalização de Vendas

| Operação (mediana ms) | 200 vendas | 1.000 vendas | 3.000 vendas |
| --- | ---: | ---: | ---: |
| Produtos, página de 25 | 0,602 | 0,946 | 0,604 |
| Lista de Vendas | 29,945 | 164,494 | 580,922 |
| Financeiro em snapshot | 32,878 | 164,352 | 577,259 |
| Detalhe de Venda | 26,215 | 134,265 | 488,796 |
| Materialização completa | 25,181 | 129,530 | 446,879 |
| Confirmação Venda/Estoque/Auditoria | 146,763 | 646,707 | 2.290,061 |

Em 3.000 vendas, a listagem devolve 25 vendas, mas faz 2.127 execuções e retorna 7.144 linhas intermediárias; Produtos já usa seis execuções/30 linhas. A confirmação de venda faz 22.474 execuções/26.390 linhas retornadas. São evidências de custo crescente, sem extrapolar para volumes não medidos.

## Mapa de dependências

| Operação e caminho | O que materializa e por quê | Classificação / decisão V1.2 |
| --- | --- | --- |
| `loadState` → `validateDatabase` → `verifyCommercialMirror` | JSON da unidade, validação do domínio, hidratação dos agregados SQL e comparação canônica/markers | Necessário temporariamente para comandos e telas avançadas; divergência falha explicitamente |
| Lista/busca/detalhe de Vendas V1.1 — histórico | Todo o caminho anterior para filtrar, ordenar e limitar em memória | Substituído na V1.2 por querySales/getSale SQL e DTO; revisão/marcador sem payload integral |
| Produtos/Clientes/Fornecedores/Estoque/Movimentações por perfil | Queries SQL e filhos somente da página selecionada | Já proporcional na V1.1; preservar |
| `/api/state` e ponte do perfil completo | Estado de vários domínios exigido por relatórios, saldos e rotinas legadas | Dependência de tela legada/snapshot; consulta nova de Vendas reutiliza endpoint proporcional |
| Financeiro, Operações e consultas avançadas de Compras | Materialização completa para cálculos de recebimentos, obrigações, reservas e relações ainda em snapshot | Necessário temporariamente; não normalizar esses módulos nesta rodada |
| `sales/checkout-context` e `product-costs` | Consulta de caixa aberto e cálculo de custos existentes dentro do estado | Substituível por query futura após contrato correspondente; preservar nesta rodada |
| `executeStateCommand` / `saveBusinessState` / `writeState` | Estado antes/depois, preços, crédito, caixa, posições, histórico e auditoria; serializa espelho e reconstrói índices | Dependência de domínio/snapshot; manter transação e revisão otimista |
| Sincronização dos cinco agregados originários da V1.1 | Produtos/filhos e compras/filhos reescritos; estoque confronta históricos e saldos | Custo transitório; melhorias locais já medidas, sem remover verificação/compatibilidade |
| Sincronização SQL de Vendas V1.2 | UPSERT e filhos apenas das vendas alteradas; inalteradas preservadas | Implementado no novo agregado, equivalência/espelho atômicos; comandos ainda materializam estado |

A saída da ponte exige migrar consumidores por domínio, provar equivalência e manter estoque/auditoria transacionais. As medições posteriores abaixo sustentam somente seus cenários; Financeiro permanece snapshot e não foi normalizado.

## Normalização de Sales — benchmark interno posterior, histórico

O instrumento [benchmark-foundation.js](../../../scripts/benchmark-foundation.js) preserva massas internas before/after com os mesmos volumes e sequência de 19 operações. Arquivos before (evidência local opcional: `.qa/foundation-v1.2/benchmarks/before.json`) de 02/10 e after (evidência local opcional: `.qa/foundation-v1.2/benchmarks/after.json`) de 03/10 (anterior ao conjunto final de otimizações). São sondagens internas de três amostras, sem HTTP/renderização, compras iniciais sem recebimentos. Detalhe before usava getRecord/loadState; after usa getSale SQL. Compare somente esses braços internos para observar a transição; os tempos não são equivalentes às matrizes HTTP abaixo nem isolam todas as causas de variação.

| Operação — mediana ms antes → depois | 200 vendas | 1.000 vendas | 3.000 vendas |
| --- | ---: | ---: | ---: |
| Lista de Vendas | 29,945 → 1,156 | 164,494 → 1,342 | 580,922 → 3,639 |
| Detalhe de Venda | 26,215 → 0,901 | 134,265 → 0,837 | 488,796 → 0,881 |
| Financeiro em snapshot | 32,878 → 45,405 | 164,352 → 217,077 | 577,259 → 654,292 |
| Materialização completa | 25,181 → 35,476 | 129,530 → 169,985 | 446,879 → 563,580 |
| Confirmação Venda/Estoque/Auditoria | 146,763 → 209,092 | 646,707 → 1.114,239 | 2.290,061 → 2.733,456 |

Lista large caiu de 2.127 execuções/7.144 linhas intermediárias para 7/55; detalhe posterior teve 21 execuções/6 linhas. Estes contadores internos diferem dos contadores HTTP, que incluem autenticação/contexto/revisão/DTO. A leitura SQL melhorou nessa sondagem; custo de estado/Financeiro/escrita persistiu ou cresceu após hidratar o sexto agregado. Não declarar ganho de escrita pela normalização de Vendas.

## Índice FK 010 — ensaio pareado próprio

Relatório (evidência local opcional: `.qa/foundation-v1.2/receipt-fk/paired-RgTJiF/RELATORIO.md`), [instrumento](../../../scripts/benchmark-receipt-fk.js). Três pares AB/BA/AB por volume, 18 processos; fontes/cópias iniciais idênticas por hash, baseline 001–009 versus índice candidato, HTTP/sessão/CSRF/KDF/auditoria reais e SQLite WAL/FULL. Massas 100/500/1.500 produtos, 200/1.000/3.000 vendas, 20/100/300 compras **recebidas** e 220/1.100/3.300 movimentos iniciais. Leituras 2+20 amostras por rodada; normal 1+5, excepcional/recebimento/entrada 1+3. Aquecimentos também gravam em sequência igual; sem descarte/GC forçado.

Migration 010 cria índice **não único** `stock_movements_scope_receipt(company_id,unit_id,purchase_id,receipt_ordinal)`. A FK diferida e dados/constraints permanecem. O plano inverso dos recibos passa de busca por empresa/unidade a covering index nos quatro campos. Medianas large deste ensaio: venda normal **3.257,19 → 2.307,13 ms**, recebimento **3.340,63 → 2.320,49 ms**, excepcional **com autorização/KDF** **3.844,55 → 2.828,70 ms**. Excepcional aqui inclui autorização; não comparar com o sanity que cronometra somente a confirmação. Quantidade de execuções/linhas retornadas permaneceu; mudou o trabalho interno da FK. Leituras permaneceram na ordem anterior, sem ganho causal alegado.

## Otimizações locais posteriores — matrizes separadas

Cada decisão usa sua própria baseline pareada e fonte congelada; não somar percentuais nem comparar tempos de fases instrumentadas com latência HTTP de outra sessão. Conteúdo, precisão, tenant/unidade, espelho, âncoras, revisão, autoria, transações/rollback e replay foram preservados nos testes. Nenhuma regra comercial mudou.

| Alteração implementada | Efeito delimitado | Evidência própria |
| --- | --- | --- |
| Prepared statement local de commercial_stock_movements | Um prepare por chamada não vazia, todos os bindings por execução; referência descartada em finally, sem cache entre chamadas/conexões | Ensaio INSERT (evidência local opcional: `.qa/foundation-v1.2/stock-insert/paired-1OPINP/RELATORIO.md`), [testes](../../../foundation/stock-movement-insert.test.js) |
| Acumulador local em syncInventory | Soma global passa de percursos P×M a M+P, com aritmética exata/ordem útil; posições/reconstrução ainda existem | Ensaio saldos (evidência local opcional: `.qa/foundation-v1.2/stock-balances/paired-I496oL/RELATORIO.md`), [testes](../../../foundation/stock-balance-accumulator.test.js) |
| Acumulador local em verifyInventoryMirror | Soma global por produto sem repetir todo histórico; mantém comparações/âncoras/histórico e conferência física | Ensaio verificador (evidência local opcional: `.qa/foundation-v1.2/mirror-balances/paired-QE1nDi/RELATORIO.md`), [testes](../../../foundation/mirror-balance-accumulator.test.js) |
| Map local de balances | Substitui find por produto; conserva primeira ocorrência e todas as recusas de falta/excesso/divergência | Ensaio lookup (evidência local opcional: `.qa/foundation-v1.2/balance-lookup/paired-1FtRrU/RELATORIO.md`), [testes](../../../foundation/balance-lookup.test.js) |

O perfil isolado de syncInventory (evidência local opcional: `.qa/foundation-v1.2/sync-inventory/profile-zuOEaO/RELATORIO.md`) apenas identificou fases antes dessas decisões; não é resultado final nem implementação adicional. StatementSync dessa API não oferece finalize público; descartar referência não promete liberação nativa imediata. Acumuladores/Map são locais, sem cache persistente. Não foi demonstrada necessidade de nova micro-otimização nesta tarefa.

## Sanity HTTP final homologado — comparação compatível

Resultado consolidado: [homologação — resumo versionado](FOUNDATION_V1_2_REPORT.md). Evidência bruta original: seção 26 de `.qa/foundation-v1.2/homologation/rc-Ip8azD/RELATORIO.md`, comparação/amostras (evidência local opcional: `.qa/foundation-v1.2/homologation/rc-Ip8azD/performance-sanity.json`), baseline HTTP (evidência local opcional: `.qa/foundation-v1.2/benchmarks/http-ltEFZX/report.json`) e resultado atual (evidência local opcional: `.qa/foundation-v1.2/benchmarks/http-fEJpoi/report.json`). Instrumento [benchmark-v1-2-http.js](../../../scripts/benchmark-v1-2-http.js) reutilizado sem alteração. Baseline HTTP já tinha Sales SQL/migrations 001–009; candidato tem 001–010 e melhorias locais. **Mesma metodologia/massas confirmadas na homologação**, sem isolamento causal de cada otimização.

Um computador Windows 10, Ryzen 5 5600X/32 GiB, Node 24.19.0/SQLite 3.53.3. Três processos separados por escala, HTTP real/sessão/CSRF/RBAC/tenant/auditoria, SQLite em disco WAL/FULL; small/medium/large 100/500/1.500 produtos, 200/1.000/3.000 vendas, 20/100/300 compras iniciais. Leituras 2 aquecimentos +20 amostras, venda normal 1+7, excepcional 1+5, recebimento 1+3. **Excepcional abaixo mede confirmação; autorização/KDF é medida separadamente pelo instrumento.** Sem descarte/GC forçado; sem testes de CPU paralelos.

| Mediana ms baseline compatível → final | Small | Medium | Large |
| --- | ---: | ---: | ---: |
| Produtos | 15,822 → 15,970 | 15,531 → 15,489 | 15,365 → 15,500 |
| Estoque | 15,841 → 15,893 | 15,233 → 15,705 | 15,510 → 15,410 |
| Vendas lista | 15,431 → 15,321 | 15,781 → 15,480 | 15,248 → 15,932 |
| Vendas detalhe | 15,529 → 15,199 | 15,329 → 15,721 | 15,492 → 15,919 |
| Venda normal | 162,832 → 142,101 | 769,835 → 645,641 | 3.387,469 → 2.019,342 |
| Venda excepcional (confirmação) | 159,171 → 141,235 | 761,052 → 660,641 | 3.367,213 → 1.991,010 |
| Recebimento | 160,596 → 144,185 | 775,971 → 671,381 | 3.433,994 → 2.046,506 |
| /api/state | 44,566 → 33,358 | 157,579 → 142,681 | 461,926 → 419,985 |
| Financeiro | 45,071 → 46,821 | 190,937 → 174,323 | 565,315 → 511,286 |

Lista/detalhe de Vendas tiveram snapshotReads=0 nos três volumes. Os checks funcionais do instrumento passaram. Nenhuma regressão grave de tempo demonstrada na matriz; escritas large seguem gargalo conhecido **~2 s**. `/api/state` e Financeiro crescem com volume porque ainda materializam snapshot. Compras tem SQL, mas fluxo de recebimento/sincronização e consultas avançadas ainda carregam estado completo.

## Memória e limites do resultado

| RSS MiB baseline HTTP → final | Small | Medium | Large |
| --- | ---: | ---: | ---: |
| Final | 236,3 → 260,8 | 398,2 → 436,6 | 340,9 → 784,2 |
| Pico | 435,0 → 473,6 | 524,6 → 566,9 | 972,0 → 1.043,2 |

Heap teve quedas recorrentes (84/36/53) e processos terminaram; RSS large requer acompanhamento. Processo inclui fixture/KDF/SQLite/servidor/cliente, GC não controlado e execução finita. **Não há leak comprovado nem prova de ausência de leak/estabilidade em serviço prolongado.** Não substituir estes números pelos RSS do instrumento interno.

Todos os resultados usam dados sintéticos em um computador/SQLite local. Não são carga distribuída, capacidade SaaS, SLA aprovado, prova de produção pronta ou garantia de RPO/RTO. Escrita/snapshot/RSS permanecem condições B; melhoria local não conclui normalização de Caixa/Financeiro nem altera quantidades inteiras comerciais.
