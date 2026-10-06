# Vendas relacionais — estado e desenho histórico da Fundação V1.2

## ATUAL / HOMOLOGADO — Fundação V1.2 fechada localmente, 03/10/2026

Migration [009_sales.sql](../../foundation/migrations/009_sales.sql) e [sales-store.js](../../foundation/sales-store.js) implementados no checkpoint `2a2177c7b80734722f71bd9e72029cf9e1b39df0`, migrations 001–010. Homologação global **B, 610/610**; versão **1.2.0-foundation.1**, fechamento local concluído, tag `v1.2.0-foundation.1`. [Estado e fontes](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md).

**Leituras:** `GET /api/commercial/sales` usa querySales e `GET /api/commercial/sales/by-id?id=...` usa getSale. Busca/COUNT/filtros/ordem/paginação são SQL; filhos carregados correspondem à página/detalhe. Esses endpoints consultam revisão/marcador sem materializar `unit_states.payload` completo. Lista e detalhe comercial são allowlist; detalhe financeiro exige financial.view. Filtros atuais: parâmetros básicos, cancelled/from/to/customerId/executorId/unitId; filtros financeiros não são aceitos. Dia civil America/Sao_Paulo e desempate por ID preservados. [Contrato API](API.md) e [testes HTTP sem payload válido](../../foundation/commercial-sales-read-http.test.js).

**Escritas:** continuam por estado materializado/snapshot para equivalência transitória e domínio existente. syncSales faz UPSERT e reconcilia filhos de vendas alteradas, preservando filhos inalterados; SQL/espelho/revisão/estoque/índice/auditoria e grant excepcional são atômicos. Vendas SQL não elimina snapshot dos comandos nem conclui Caixa/Financeiro/Crédito/Orçamentos/Reservas.

Tabelas de cabeçalho/filhos factuais listadas no desenho abaixo existem, com escopo composto, extras/presença/ordinais e identidade histórica preservados; não há autoria/recibo fabricado. Métodos de leitura/hidratação interna completa não equivalem ao DTO público. Campos futuros de canal/UOM e regras fracionadas permanecem planejados. Operações comerciais continuam inteiras.

Equivalência, transações/replay/rollback, isolamento, projeção por direito, queries, UI e restore sintético foram cobertos pela homologação; benchmark interno posterior e HTTP final em [PERFORMANCE_V1_2](../atualizacoes/v1.2/PERFORMANCE_V1_2.md). Escritas large ~2 s e RSS merecem acompanhamento; não há SLA ou ausência comprovada de leak. Recuperação da loja/DR/RPO/RTO não homologados.

## Registro histórico do desenho — 02/10/2026

**Todo o texto abaixo registra o plano anterior à implementação.** Verbos futuros e baseline 457/migrations 001..007 pertencem àquele momento; o estado atual está acima. O desenho é preservado para rastrear propriedade, compatibilidade, recuperação e critérios, sem transformar cada possibilidade em contrato implementado.

**02/10/2026 — PLANEJADO, registrado antes de schema/código.** Escopo autorizado: [passos 11–24 da V1.2](../atualizacoes/v1.2/FOUNDATION_V1_2_SOURCE.md), após acesso/recuperação, backup/restore e benchmark anterior. Baseline local: `79b418a`, versão 1.1.0-foundation.1, migrations 001..007 e 457 testes antes da V1.2; o total final será apurado, nunca presumido. A migration **009_sales.sql** está reservada; 008 pertence à manutenção de acesso. Não modificar bytes/checksums de migrations aplicadas.

Especialistas selecionados: Banco/Backend/Produto inventariam fatos, propriedade, transação e consultas; coordenação/Arquitetura consolida o desenho e mede desempenho; Segurança/QA revisam isolamento, autoria, replay e regressão. Este documento não declara implementação, migração operacional ou resultado de novos testes.

## Domínio ATUAL conferido

[server.js](../../server.js) calcula a venda no backend e preserva cliente, itens e valores históricos; baixa estoque, cria movimentos, recebe quando aplicável e reaproveita crédito/checkout. [commercial-write.js](../../foundation/commercial-write.js) protege o comando parcial por direitos, fingerprint e prova interna de aprovação excepcional. [quotes.js](../../quotes.js) e [workflows.js](../../workflows.js) convertem orçamento/reserva pelo mesmo domínio.

[payments.js](../../payments.js) registra recebimento; [accounts.js](../../accounts.js) coordena parcelas, alocações e perdão; [workflows.js](../../workflows.js), [cash.js](../../cash.js), [quarantine.js](../../quarantine.js) e [store-credits.js](../../store-credits.js) coordenam devolução, restituição, retenção e crédito. Não criar segundo efeito de estoque/financeiro ou novo motor de venda na normalização.

O validador geral exige ID, itens como lista e total seguro não negativo; não exige itens históricos não vazios, cliente, nome, data, situação de pagamento ou recibos em toda venda antiga. Identidades de filhos não têm unicidade histórica global demonstrada. O [inventário V0.12](../atualizacoes/fundacao-v1/DATABASE_SCHEMA_V0.12.md) detalha campos e diferenças entre ausência/null.

**Limite importante:** [receiptList](../../public/payments.js) deriva um recibo `legacy-<sale.id>` quando `receipts` não é uma lista e o pagamento está recebido. A normalização/hidratação não chamará essa função para fabricar fatos. Persistirá somente filhos presentes na venda original. Os comandos existentes que materializam um recibo compatível continuam sendo executados apenas quando a operação de domínio o exigir.

## Autoridade, escopo e compatibilidade PLANEJADOS

SQL será a autoridade de Vendas depois da normalização validada. `unit_states` mantém espelho transitório para os comandos/telas legados: SQL, espelho, revisão, estoque, índice e auditoria na mesma transação. Conferência integral canônica inclui ordem, extras, campos ausentes/null e objetos históricos. Divergência interrompe leitura/comando; não reimportar o espelho sobre SQL já normalizado nem reparar silenciosamente.

PK do cabeçalho: empresa + unidade + ID. FK à unidade e referências compostas aos Clientes/Produtos SQL quando o vínculo preenchido é normalizável. Não buscar cliente/produto por nome para reparar referência. Campo ausente, null, string vazia ou valor opcional antigo fora do tipo projetado é conservado com presença/extras e coluna relacional null; referência textual preenchida a outro escopo/inexistente falha sem escrita parcial.

Filhos possuem chave técnica empresa + unidade + venda + ordinal, acrescentando ordinal do pai quando há outro nível. O ID histórico é coluna opcional, sem unicidade global nova; não gerar UUID para filho sem ID nem trocar identidade de recibo duplicado entre documentos. FK composta sempre ao pai correto. Relação de item devolvido à linha original só se demonstrada de modo inequívoco, sem reinterpretar IDs/ordens antigas. Não criar FK para toda referência ainda em snapshot.

Presença dos campos será registrada em `present_fields`; campos/valores não projetados em `extra_json`; `ordinal` conserva a ordem. Projeção/hidratação serão genéricas por descritores de campo/filho, evitando regras de coerção diferentes por tabela. Somente listas efetivas serão decompostas em filhos; ausência/null/lista vazia continuam reconstruíveis. Nenhum documento integral disfarçado de coluna relacional.

O contrato técnico interno `writeState` serve importação/fixtures e não é autorização HTTP. Comandos preservam `saveBusinessState` e a guarda de saldo/movimentos. Não mudar nesta etapa regras de Caixa, Financeiro, Orçamentos, Reservas ou Devoluções. Filhos factuais já contidos na venda poderão receber representação SQL; isso não normaliza nem reimplementa os demais módulos que participam de seus efeitos.

## Tabelas e campos reais PLANEJADOS

Todas as tabelas conservarão presença/extras/ordem e usarão SQL parametrizado. Colunas opcionais serão nullable; nenhuma regra de obrigatoriedade/unicidade/enum mais forte que a integridade histórica comprovada será inventada. Campos comerciais obrigatórios comprovados, como `totalCents` e quantidade/preço do item, recebem limites compatíveis.

| Tabela | Conteúdo factual |
| --- | --- |
| `commercial_sales` | ID, ordinal, cliente/nome histórico, data/recebimento/cancelamento/vencimento, subtotal/desconto/total/motivo, método/situação de pagamento declarados, requestId e fingerprints, versões de conta/devolução existentes, perdão/crédito usado/restaurado/emitido, origens orçamento/reserva/números/acordo existentes, metadados de execução/autorização já registrados |
| `commercial_sale_items` | ID opcional, produto, nome/código históricos, quantidade decimal TEXT, preço/base/lista/custo quando existente, unidade declarada, origem/lista/versão de preço, indicador de inativo e snapshots de promoção/substituição conservados |
| `commercial_sale_item_packages` | Venda/item ordinal, packageId/nome/fator/count/versão históricos; não FK ao cadastro de embalagem atual |
| `commercial_sale_item_stock_sources` | Venda/item ordinal, posição/nome histórico/quantidade; posição/documento ainda em snapshot não recebe FK inventada |
| `commercial_sale_receipts` e `commercial_sale_receipt_allocations` | Recibo efetivamente existente: ID/saleId/requestId/valor/método/data/caixa/referência/tendered/change/acordo/pagamento e alocações parcela/valor; execução somente quando registrada |
| `commercial_sale_installments` | Plano efetivamente existente: ID/número/valor/vencimento; não fabricar parcela única |
| `commercial_sale_returns` e `commercial_sale_return_items` | Devoluções já internas à venda: ID/número/data/motivo/responsável declarado/total/crédito restaurado; produto/nome/quantidades devolvida, restock, quarentena, remaining, valores/notas existentes |
| `commercial_sale_refunds` | Restituições existentes: ID/valor/método/data/paidDate/recordedAt/caixa/note/returnRefund |
| `commercial_sale_return_allocations` | Rateio original: produto/quantidade/discountedUnits/unitNetCents; não recalcular pelo cadastro atual |
| `commercial_sale_credit_allocations` | creditId/amountCents/restoredCents; o agregado Crédito continua no snapshot |
| `commercial_sale_forgiveness` e filhos de alocações | Data/valor/motivo/responsável declarado e alocações parcela/valor dos eventos existentes |
| `commercial_sale_checkouts` e referências de recibos | Objeto de liquidação existente com totais, recebido/pendente, dinheiro/entregue/troco/status/recordedAt e receiptIds na ordem original |

`pos` pode ser projetado em station/shift, reconstruindo objeto ausente/null. `negotiation`, `planHistory`, `agreementHistory` e detalhes históricos ainda não normalizados de promoções conservam snapshots específicos em extras. Não declarar catálogo de preços/acordos/financeiro inteiro normalizado. Detalhes desconhecidos em qualquer nível continuam preservados integralmente.

Valores monetários: centavos inteiros seguros, sem REAL ou recálculo silencioso. Quantidades/fatores/counts: texto decimal canônico e aritmética técnica BigInt, conforme [decimal.js](../../foundation/decimal.js). Leitura compatível usa inteiro seguro; venda fracionada permanece desabilitada. Não fabricar custo zero, versão 1, unidade, data, nome ou situação. Precisão/arredondamento/conversões permanecem A DEFINIR para a futura operação fracionada.

## Autoria, origem e autorização

Novas vendas recebem executor verificado do contexto do servidor e autorização excepcional somente por prova interna validada. Metadados originais, nomes/roles históricos e indicação dos itens realmente inativos sobrevivem integralmente. Colunas de referência à identidade não serão apresentadas como autenticação retroativa: `responsible`, nome coincidente ou usuário que executou a migração nunca são prova de autoria antiga.

Executor original da venda não é executor de recebimento/cancelamento/devolução. A estrutura atual não grava `execution` nesses filhos de forma uniforme; ausência será conservada. Auditoria dos comandos continua separada. FK histórica não deverá tornar a leitura dependente do vínculo ativo atual do operador antigo nem impedir revogação de membership.

Origem comercial existente: `quoteId`/`reservationId`, seus números e vínculos reais. Canal/conexão/identificador externo futuro são conceitos distintos de fornecedor: não adicionar supplierId para esse propósito, não preencher antigas como balcão e não inferir marketplace por texto. Campos adicionais já existentes ficam conservados em extras. Contrato future de origem/canal/ID externo poderá ser acrescentado por migration aditiva e Commerce Hub, sem dezenas de campos específicos de fornecedor e sem endpoint de integração nesta V1.2. Ver [Commerce](COMMERCE_HUB.md).

RequestId e fingerprints atuais permanecem. Não impor unicidade nova sobre valores históricos duplicados; novas confirmações devem manter prevenção de replay no escopo correto. Grant temporário, consumo, venda, estoque e auditoria continuam na mesma confirmação. Reenvio idêntico não altera revisão/estoque/recibos; conteúdo alterado com mesma chave é recusado.

## Escrita incremental e consultas sem payload

[sales-store.js](../../foundation/sales-store.js), a criar, será responsável por projeção/hidratação/sync/conferência/queries/relatório. Pais por UPSERT, nunca apagar/recriar vendas inteiras. Filhos somente de vendas alteradas serão reconciliados; vendas canonicamente iguais terão seus filhos preservados. Os marcadores acompanham a revisão comercial mesmo quando outro agregado mudou. Não otimizar outros agregados sem medição/necessidade demonstrada.

Integrações previstas: `commercial-store` na normalização global/conferência/relatório; `state-repository` no sync e no-op; `commercial-read` no query/DTO; `scoped-state` por conferência geral sem duplicar reconstrução; `verify-commercial` continua read-only. Respeitar alterações de acesso/backup coordenadas fora desses pontos. Queries atuais dos cinco agregados não serão refeitas.

`querySales` e `getSale` internos terão escopo composto e conferência de revisão/marcador. Lista usa COUNT/filtros/whitelist de ordem/ID de desempate/LIMIT/OFFSET no SQL, sem ler `unit_states.payload`. Hidrata somente itens e execution necessários ao resumo/DTO; não carregar filhos financeiros para a lista comercial. Detalhe comercial é allowlist; dados financeiros opcionais exigem `financial.view` e projeção específica, nunca objeto bruto ou estado inteiro.

Filtros previstos, conforme domínio: texto/ID/nome histórico, cliente, período, cancelamento, executor quando realmente registrado e origens comerciais existentes. Unidade vem do contexto autorizado; não aceitar unidade arbitrária como bypass. `sale_day` derivado somente de data válida usa [calendarDay](../../public/reports.js), America/Sao_Paulo; não cortar o dia UTC nem mudar o timestamp original. Datas históricas ausentes/inválidas permanecem sem dia derivado.

Preservar os contratos básicos atuais de paginação e limitar page/pageSize/q; filtros novos têm allowlist própria e não reinterpretam silenciosamente active/inactive como cancelamento. Filtro/ordenação por paymentStatus/paymentMethod/saldo/custo pode revelar financeiro pelo COUNT ou existência: bloquear sem direito financeiro. Não acrescentar inferência indireta em query de `sales.view`.

Índices inicialmente justificáveis: escopo+dia+ID, escopo+cliente+dia+ID, escopo+ordem de nome histórico+ID e lookup de requestId escopado sem unicidade histórica nova. Executores/origens receberão índices somente conforme query/benchmark. O caminho de escrita ainda materializa estado compatível e confere espelhos; esta etapa não promete eliminar esse custo.

## Migração, rollback e recuperação

1. Concluir etapas 1–10, registrar benchmark sintético anterior e aprovação do desenho.
2. Schema 009 aditivo, aplicado por mecanismo checksum existente; nenhuma alteração 001..008.
3. Preparar/preencher Vendas por unidade na transação de normalização, com validação e igualdade canônica. Revisão comercial não muda só pela representação. Falha em qualquer unidade reverte a preparação transacional, sem marcador parcial.
4. Conferência read-only valida seis agregados, vendas/IDs/itens/quantidades/centavos por caminho, datas/estados/referências/presença/extras/autoria histórica. Não publicar registros pessoais nem somar recibos/total de venda como novo saldo contábil.
5. Antes de aplicação operacional: backup consistente, restore/ensaio isolados e comparação integral entre origem/SQL/espelho. Banco da loja não é massa de testes.

Falha de comando em item/recibo/saldo/espelho/auditoria/grant provoca rollback completo. Falha de preenchimento não é autorização para apagar tabelas, marcadores ou banco. Schema aplicado e preenchimento são etapas distintas; preservar diagnóstico/cópia íntegra ao interromper inicialização.

Reversão de código exige compatibilidade com o schema novo e espelho **atual** conferido. Não existe downgrade automático: nunca substituir SQL por JSON histórico nem restaurar backup antigo sobre novas operações sem decisão operacional explícita. Restore significa potencial perda de alterações posteriores; ensaio desta V1.2 sempre em destino isolado conforme [operação](OPERATIONS_V1_2.md).

Remoção futura do espelho depende de substituir todos os comandos/leituras legados, provar equivalência e migrar os consumidores restantes. Não manter duas autoridades independentes nem retirar compatibilidade antes disso.

## Critérios de aceite e evidências a produzir

Testes somente com memória, arquivos e servidores sintéticos isolados. Registrar o número efetivo de vendas/itens/recibos migrados por fixture e por volume de benchmark, quantidade de casos, hashes/centavos/quantidades e total aprovado/falhado/ignorado. Não inventar contagem migrada na loja a partir de fixtures.

- Equivalência integral: extras/chaves especiais, campos opcionais de tipo histórico, ausência/null/lista vazia, ordem, filhos sem ID/IDs repetidos entre documentos, nomes/preços/custos/datas originais e recibos ausentes sem síntese.
- Limites monetários e quantidades: centavos seguros e soma de conferência BigInt; quantidade TEXT sem perda, rejeição operacional de frações preservada; nenhum custo/unidade/autor inventado.
- Isolamento: mesmos IDs de venda/filho entre tenants/unidades, FK cruzada recusada, recurso por ID e contexto/vínculo/permissão inválidos recusados; revogação não altera história.
- Queries: página/filtro/COUNT no SQL sem payload, filhos carregados apenas da página, busca escapada, ordem estável, limites, cliente/executor/período São Paulo, incluindo virada de dia UTC; GET em unidade vazia não escreve.
- DTO: resumo/detalhe proporcionais, extras/custo/recibos/histórico financeiro ausentes sem direito; filtros e COUNT não inferem financeiro.
- Fluxos: venda recebida/pendente, checkout dividido/troco, recibo parcial, parcelas/alocações/perdão, conversões, cancelamento e devolução/restock/quarentena/restituição/crédito sem efeitos adicionais.
- Replay/concorrência: venda idêntica e conteúdo alterado, grant de inativo, última unidade disputada por duas conexões SQL; uma venda válida e saldo consistente, sem aprovação reutilizada.
- Rollback: falha injetada em filho, saldo, snapshot ou auditoria reverte venda/estoque/recibo/caixa/crédito/revisão/grant; conferir também os agregados anteriores.
- Tamper/idempotência: SQL/espelho/marcador divergentes bloqueiam sem reparo; normalização repetida não gera fatos/revisão; checker read-only não migra schema antigo.
- Desempenho: comparar benchmark anterior/posterior nos mesmos volumes, queries/registros processados e memória quando possível. Melhoria somente se medida; regressão significativa precisa investigação antes do aceite.

Regressão completa e conferência visual sintética fecham o agregado antes de release. Depois de Vendas, parar: não iniciar automaticamente Caixa/Financeiro/Orçamentos/Reservas/Devoluções independentes, Fiscal, canais, Printing ou Edge. Status/contagens/artefatos finais serão atualizados somente após execução real.
