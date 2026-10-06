# Modelo incremental da Fundação V1.1

**Registro histórico da entrega V1.1, 02/10/2026.** Cinco agregados e Vendas transitória descrevem aquela versão, sem substituir o [estado atual V1.2](../v1.2/FOUNDATION_V1_2_REPORT.md). O sexto agregado e as leituras SQL estão em [Vendas V1.2](../../atual/SALES_V1_2_MODEL.md); corpo/compatibilidade/recuperação originais preservados.

## Passo 3 — Produtos, IMPLEMENTADO no código

Produtos são o primeiro agregado comercial normalizado. Migration aditiva [002_products.sql](../../../foundation/migrations/002_products.sql); não modificar a migration 001 já aplicada. Banco operacional só recebe a evolução depois de cópia consistente, ensaio isolado e verificações da entrega. A existência de tabelas no código não comprova aplicação na instalação.

`commercial_products` possui colunas reais para ID, código/SKU/barcode, nome, descrição, categoria, marca, localização, unidade declarada, medida, situação, versão, preço, custo **quando já existente**, preço mínimo, quantidade, mínimo e datas. `commercial_product_aliases` e `commercial_product_packages` são filhos com IDs, campos reais, ordem e FK composta ao produto. Históricos dos identificadores, atributos, tags, vínculos ainda em outros agregados e campos desconhecidos ficam em extras; não afirmar que cada referência dentro desses extras possui FK.

PK e FKs usam empresa + unidade + ID. A propriedade continua por unidade, como na V1. Não compartilhar catálogo entre lojas silenciosamente. Códigos principais mantêm regras do domínio existente; não introduzir unicidade SQL mais forte que a integridade comprovada do legado.

`present_fields` conserva quais campos existiam; `extra_json` conserva apenas campos não projetados ou valores opcionais históricos que não se encaixem no tipo da coluna. `ordinal` conserva ordem. Ausência, null, listas vazias, datas, valores, IDs e autoria histórica permanecem distintos. Sem inventar active/version/unidade/custo/autor. O custo atual da loja continua vindo das Compras/Custos recebidos; normalização não cria novo lançamento no cadastro.

## Autoridade e compatibilidade ATUAIS

[commercial-store.js](../../../foundation/commercial-store.js) guarda Produtos no SQL como autoridade e mantém espelho compatível dentro de `unit_states`, na mesma transação da revisão e auditoria. Pais existentes recebem UPSERT, conservando futuras referências SQL; filhos são reconciliados nesta primeira etapa. Não apagar/recriar todos os pais.

`loadState` hidrata Produtos a partir das tabelas e verifica igualdade canônica com o espelho, inclusive ordem/extras, e revisão com o marcador. Divergência interrompe leitura/comando; não reparar automaticamente SQL pelo snapshot. `writeState` é a escrita técnica interna de importação/fixtures e sincroniza explicitamente tabelas+espelho no mesmo BEGIN. Não é endpoint nem autorização para mudar saldo sem movimento. A regra obrigatória para comandos comerciais será reforçada no passo 7 em `saveBusinessState`; nenhum bypass recebido do cliente.

O runtime normaliza estados antigos por unidade antes de aceitar requisições. A transação retorna tudo ao estado anterior se qualquer unidade falhar. Estado já normalizado somente é conferido; não reimportar JSON antigo. Revisão comercial não muda apenas por converter representação.

Produtos têm consultas SQL paginadas: count, filtro, busca normalizada, ordenação com whitelist e ID para desempate; pageSize máximo 100 e página máxima 1.000.000. Não carregar snapshot inteiro para a consulta paginada. A consulta interna retorna campos completos; a API **sempre aplica DTO allowlist** adequado à permissão antes da resposta. Unidades novas sem estado retornam catálogo vazio sem escrita em GET. Estado existente sem marcador bloqueia a consulta até normalização. Consultas conferem metadados/revisão; a conferência integral do espelho ocorre em comandos, leitura compatível e ferramenta de verificação.

## Quantidades e unidades

[decimal.js](../../../foundation/decimal.js) usa strings decimais canônicas e aritmética BigInt, sem REAL e sem multiplicar o saldo legado por escala fixa que possa causar overflow. Exemplo exato suportado pela representação: `0.5`, com unidade explicitamente declarada quando existir. Preços/custos continuam inteiros seguros em centavos e não usam a representação de quantidade.

**ATUAL:** contratos comerciais e reconstrução compatível continuam validando quantidades inteiras; não habilitar venda fracionada nesta etapa. A representação do SQL não impõe essa limitação permanentemente.

**A DEFINIR:** precisão/escala comerciais, limites por unidade de medida, fatores, arredondamento, validação dos produtos fracionáveis e entrada/saída por unidade alternativa. Conversões futuras precisam preservar fator/unidade de origem e base históricos; não reinterpretar compras/vendas antigas. Embalagens atuais conservam equivalência inteira existente, sem virar uma regra universal de conversão.

## Migração, conferência e recuperação

Antes de aplicação operacional: usar [backup-local-sql.js](../../../scripts/backup-local-sql.js) para cópia consistente com SQLite/WAL. Copiar apenas `.sqlite` com processo aberto não é recuperação comprovada. Evidência da cópia anterior: [pre-upgrade.sqlite](../../../.qa/foundation-v1.1/pre-upgrade.sqlite), criada pelo responsável da entrega; tratar como dados privados e não publicar.

Ensaiar upgrade em cópia isolada. Schema aditivo aplica primeiro; preenchimento e marcador por unidade são transacionais. Comparação integral canônica comprova preservação de valores, IDs, ordem, ausência/null e extras. [verify-commercial.js](../../../scripts/verify-commercial.js) abre o arquivo **read-only**, não aplica migration nem normaliza; relatório inclui contagens, hash canônico, hash de IDs, centavos e quantidades exatas. Agregados de preço/estoque servem à conferência, não são saldos financeiros. Não incluir dados pessoais no relatório.

Se falhar antes de haver operações novas, conservar origem/cópia íntegra e investigar o ensaio. Se já houve operações novas, nunca restaurar `database.json` original nem sobrepor SQL por snapshot antigo. Uma reversão de versão do código requer exportar/conferir o espelho **atual** do SQL, preservando operações posteriores; não há ferramenta automática de downgrade nesta entrega. Restauração de backup significa perder alterações posteriores e precisa decisão operacional explícita. Não apagar tabelas para forçar migração.

## Passo 4 — Clientes, IMPLEMENTADO no código

Desenho documentado antes da alteração. Migration aditiva [003_customers.sql](../../../foundation/migrations/003_customers.sql): `commercial_customers` com PK empresa+unidade+ID; nome, telefone, email, contato, endereço, documento/documento comercial quando existente, notas, preferência de preço, situação, versão e datas em colunas reais. Ordem, presença/ausência e extras seguem o contrato de Produtos. IDs iguais entre unidades/empresas são permitidos e consultas sempre possuem escopo composto. Nenhum documento ou contato vira obrigatório ou globalmente único por suposição.

Histórico de vendas/financeiro continua em seus documentos originais, ligado pelo ID existente; não duplicar histórico financeiro no cliente nem renomear snapshots de venda pelo cadastro atual. Preferência de preço ainda aponta para tabela de preço no snapshot e é validada pelo domínio, sem FK SQL universal. Migração/conferência/recuperação seguem o procedimento acima, agora verificando ambos agregados. Consulta interna paginada deve ser projetada por DTO autorizado na API.

`queryCustomers` e `getCustomer` consultam o SQL; autorização e projeção de campos são responsabilidade da API. `normalizeAllCommercial`, usado pelo runtime, prepara Produtos e Clientes antes de requisições. Hidratação, comando e conferência verificam ambos espelhos; cada alteração mantém seus marcadores na mesma revisão comercial. O relatório conserva campos de Produtos e acrescenta `customers` com contagem e hashes, sem conteúdo pessoal.

[commercial-customers.test.js](../../../foundation/commercial-customers.test.js): 12 testes específicos de contatos/documentos/extras/chaves especiais, ausência/null, ordem e pai referenciado, tenants/unidades/identidade não vinculada, FK composta, consulta SQL paginada sem snapshot, unidade vazia, divergência/revisão, rollback conjunto, idempotência e conservação do nome histórico de venda. Em conjunto com os 19 testes de Produtos: **31 passaram**, em bases isoladas. Regressão completa é registrada pelo responsável da entrega antes da etapa seguinte.

## Passo 5 — Fornecedores, IMPLEMENTADO no código

Desenho registrado antes da implementação. Migration aditiva [004_suppliers.sql](../../../foundation/migrations/004_suppliers.sql): cadastro com PK empresa+unidade+ID, nome, contatos, documento/documento comercial quando existente, endereço, notas, situação, versão e datas em colunas reais. Demais campos/histórico/vínculos não projetados permanecem extras. Não inventar fornecedor principal, documento obrigatório ou regra fiscal.

`suppliers` é uma coleção opcional no legado: ausência é diferente de lista vazia. A coluna aditiva `collection_present` no marcador de normalização preserva explicitamente presença da coleção; hidratação não adiciona `suppliers:[]` às bases antigas que não possuíam a propriedade. Vínculos de compras/custos/documentos mantêm IDs e snapshots originais; não duplicar compras dentro do cadastro. O mesmo procedimento transacional, conferência/recuperação e DTO autorizado vale para os três cadastros. Compras só será iniciada após validação deste agregado.

`querySuppliers` e `getSupplier` são consultas internas SQL e requerem DTO/permissão na API. Normalização, sincronização, hidratação e verificação de runtime contemplam os três cadastros; a conferência acrescenta presença, contagem e hashes de Fornecedores sem publicar nomes/contatos. [commercial-suppliers.test.js](../../../foundation/commercial-suppliers.test.js): 11 testes específicos passaram; com Produtos e Clientes, **42/42**. Casos cobrem ausência/lista vazia, campos históricos, escopo composto, busca e página SQL, FK e pais referenciados, tamper/presença, rollback, idempotência e nome histórico de compra preservado. Não usou banco operacional.

## Passo 6 — Compras/Recebimentos, IMPLEMENTADO no código

Desenho registrado antes da implementação. Migration aditiva [005_purchases.sql](../../../foundation/migrations/005_purchases.sql): cabeçalho com ID, versão, número, fornecedor e nome histórico, valor, previsões/confirmação/fechamento; itens com ordinal, produto, nome/código históricos, quantidade decimal textual e custo exato em centavos; recibos com IDs quando existentes, sequência, instante, requestId e referência; itens recebidos vinculados ao recibo e ao item pedido do mesmo escopo. Fornecedor/produto usam FKs compostas; origem de compra é FK composta à compra, diferida para preservar ordens históricas.

Itens e recibos antigos sem ID não ganham identidade histórica inventada: sua chave técnica usa ordinal do documento, conservando ausência de `id` na reconstrução. IDs de recibos não recebem unicidade global mais forte que a comprovada pelo legado; IDs históricos duplicados permanecem separados por documento/ordinal. Referências vazias antigas conservam valor em extras com coluna de FK null. Extras/presença/ordem conservam originais do pedido, seleção cotada, históricos, conferência, quarentena, destino e autoria quando o agregado correspondente ainda não foi normalizado. Referências internas ainda em snapshot continuam validadas no domínio; não declarar FK SQL para todas.

Compras opcionais ausentes permanecem ausentes. Recebimento parcial mantém a regra atual de quantidade acumulada limitada ao pedido e custo diferente acompanhado do motivo/original. SQL normaliza os documentos resultantes do fluxo existente e não cria novo recebimento, entrada, custo ou despesa. Compra, recebimento, estoque, fonte de custo, financeiro aplicável, auditoria e espelho continuam na mesma transação de comando. Reenvios seguem `purchaseCommands` já existente; não atribuir efeito adicional na normalização. Migração/conferência/recuperação seguem o procedimento já definido antes da aplicação operacional.

[commercial-purchases.test.js](../../../foundation/commercial-purchases.test.js) cobre equivalência de cabeçalho/filhos/históricos, IDs ausentes, campos desconhecidos, coleção ausente/vazia, recebimento parcial e reenvio, excesso rejeitado, quarentena sem duplicação, conferência recusada sem recebimento, custo efetivo conferido, falha SQL em item recebido com rollback completo, FKs cruzadas e vínculo à linha pedida, IDs iguais entre escopos, origem posterior/ordem, idempotência e tamper bloqueado. Revisão estrutural independente não encontrou bloqueio restante; regressão completa e ensaio em cópia são registrados pelo responsável da entrega antes do passo 7.

## Passo 7 — Estoque/Movimentações, IMPLEMENTADO no código

Migration aditiva `006_inventory.sql`: saldo por produto/unidade em quantidade decimal textual; movimentos globais e físicos com ID, quantidade, origem/referência, saldo posterior e metadata de execução existente; posições/saldos por posição e entradas históricas preservados. Escopo composto sempre. Referência a produto/compra já SQL recebe FK composta; recebimento usa compra+ordinal apenas quando a origem corresponde de modo único. Recebimento histórico sem identidade/ambíguo permanece declarado, sem fabricar prova. Vendas/inventários/quarentena/transferências ainda em snapshot têm referências conferidas no domínio e nos novos comandos; não prometer FK universal.

Âncora técnica separada registra a diferença entre saldo existente e somatório do histórico disponível, sem fabricar movimento comercial ou autor. A escrita técnica interna de importação/fixtures pode reconciliar esta base; comandos HTTP não possuem esse caminho de bypass. `saveBusinessState` deve rejeitar alteração/apagamento de movimentos antigos e exigir que todo delta de saldo seja integralmente explicado por movimentos novos do mesmo produto. A distribuição física também é explicada por novos movimentos físicos; transferência muda distribuição, não saldo global, e não deve criar movimento global zero.

SQL, espelhos, saldo, movimentos, bases técnicas e auditoria permanecem na mesma transação. Novas consultas internas paginadas de estoque/movimentos usam SQL, limites e escopo; API aplica DTO autorizado. Quantidade continua exata em TEXT/BigInt com contratos operacionais inteiros nesta fase. Migração/conferência/recuperação seguem os procedimentos já definidos antes da alteração.

[inventory-store.js](../../../foundation/inventory-store.js) implementa o agregado separado. Distribuição ausente/null/objeto permanece distinta. Identidades existentes são preservadas; colunas de executor/autorizador só apontam a usuários vinculados ao escopo. Não criar identidade para histórico anterior. Quantidades, origem, datas, execução e saldos usam colunas reais; campos não normalizados/históricos extras seguem preservados. A existência de posições/transferências ainda depende de documentos do domínio em snapshot; não declarar que esses módulos inteiros foram normalizados.

`saveBusinessState` recusa remoção/alteração de movimentos e entradas anteriores, saldo sem movimento equivalente e distribuição sem movimento físico correspondente. A guarda vale também sem posições. Novos movimentos exigem documento de origem no contexto. Cadastro com saldo inicial positivo passa a exigir `inventory.adjust`, inclusive na rota legada, além da permissão de cadastro. Saldo zero não concede poder de ajustar estoque.

`queryInventory` e `queryStockMovements` aplicam filtro, ordenação, contagem e LIMIT/OFFSET no SQL, sem ler payload comercial. A API continua projetando apenas campos de estoque; não inclui preços/custos. Escritas mantêm reconciliação integral compatível na transação: isso ainda regrava linhas e espelhos e é dívida de eficiência para volumes maiores, sem promessa de prontidão para produção.

[commercial-inventory.test.js](../../../foundation/commercial-inventory.test.js) verifica âncora histórica, extras, ausência/null, imutabilidade, saldo sem histórico, origem, venda/cancelamento, rollback, tamper, paginação SQL sem snapshot, isolamento e transferência física. Testes HTTP adicionais cobrem recebimento transacional e a permissão do saldo inicial. Regressão e revisão são registradas antes do passo 8.

## Próximos agregados — PLANEJADO

Produtos, Clientes, Fornecedores, Compras/Recebimentos e Estoque/Movimentos foram concluídos nesta entrega. Próxima evolução recomendada: Vendas, depois Caixa/Financeiro, um agregado por vez com contrato, equivalência e testes. Estes últimos permanecem em snapshot nesta fase. Fiscal brasileiro continua planejado e isolado do domínio comercial.

Compra → recebimento parcial/total → movimento de estoque → fonte de custo → financeiro aplicável mantém um único fluxo transacional. Não criar segunda entrada paralela. Movimentos legados sem executor não recebem identidade fictícia; base técnica de migração deve ser distinguida de fatos comerciais. Vínculos cujo agregado ainda esteja em snapshot continuam validados pelo domínio, sem alegar FK SQL universal.

## Verificação do passo 3

[commercial-products.test.js](../../../foundation/commercial-products.test.js) verifica representação decimal exata, equivalência integral, campos desconhecidos e chaves especiais, ausência/null/lista vazia, IDs e ordem dos filhos, FKs cruzadas, mesmo ID em tenants diferentes, paginação SQL sem snapshot, busca/ambiguidade, revisão divergente, rollback conjunto, idempotência, preparação no runtime e ferramenta read-only. Testes usam memória ou arquivos próprios na pasta `.qa`, nunca o banco operacional.
