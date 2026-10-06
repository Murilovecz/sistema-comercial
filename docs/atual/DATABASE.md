# Banco de dados e persistência

## Alvo aprovado e transição pendente — 05/10/2026

[Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md), §§2–8, 11 e 16, governa o modelo desejado. **ATUAL:** os campos `company_id`/`unit_id` continuam com sua semântica implementada; não foram renomeados/reinterpretados.

**PLANEJADO:** Conta/Organização é o tenant; uma ou mais Entidades Legais/Titulares PF/PJ, cada Unidade sob uma única entidade. Fatos preservam a entidade responsável no momento da operação; PF→PJ não reescreve história. Fase C exige mapa explícito de IDs, ownership, vínculos, auditoria, constraints, transição e recuperação aprovado antes de migrations. [Plano](ROADMAP.md).

Pessoas/Organizações comuns com papéis, Produtos/Serviços distintos, produtos com/sem estoque, Financeiro Básico independente, estados/estoque negativo com ocorrência e DRE/consolidação exigem especificações. O código atual ainda não atende integralmente; não remover constraints/guardas de estoque ou unir cadastros nesta rodada. Quantidades/UOM/arredondamento permanecem exatos e a definir por contrato. [Auditoria](../auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md).

## ATUAL no código — Fundação V1.2 fechada localmente

Estado atual em **03/10/2026**: Fundação V1.2 fechada localmente, checkpoint `2a2177c7b80734722f71bd9e72029cf9e1b39df0`: **B — homologação condicional, 610/610 aprovados**, migrations **001–010**, seis agregados relacionais. Versão **1.2.0-foundation.1**; fechamento local concluído, com tag `v1.2.0-foundation.1`. Evidências e limites no [estado consolidado V1.2](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md); [V1.1](../atualizacoes/v1.1/FOUNDATION_V1_1_REPORT.md) permanece histórico. Esta revisão documental não verifica nem altera o banco operacional e não certifica produção/cloud.

Persistência local em `data/foundation.sqlite`, por `node:sqlite` e SQL parametrizado, sem ORM. `data/database.json` é a origem preservada; não recebe as novas operações. A decisão e comparação com PostgreSQL/ORM estão em [FOUNDATION_V1_SQL_DECISION](../atualizacoes/fundacao-v1/FOUNDATION_V1_SQL_DECISION.md).

Empresas, unidades, usuários, vínculos, papéis/permissões, sessões, auditoria e controle de importação têm tabelas SQL e constraints. Os seis agregados comerciais relacionais atuais são **Produtos; Clientes; Fornecedores; Compras/Recebimentos; Estoque/Movimentações; Vendas**. SQL é autoridade desses agregados; `unit_states(company_id,unit_id,revision,payload)` conserva espelho equivalente para compatibilidade, incluindo as escritas de Vendas. `entity_index` indexa IDs estáveis existentes. Caixa, Financeiro e outros documentos permanecem transitórios. Não inventar IDs/autores antigos. Ver [Vendas V1.2](SALES_V1_2_MODEL.md), [modelo histórico V1.1](../atualizacoes/v1.1/FOUNDATION_V1_1_MODEL.md) e [V1](../atualizacoes/fundacao-v1/FOUNDATION_V1_MODEL.md).

Migrations possuem ordem e checksum conferidos antes de aplicação. Transação síncrona mantém leitura atual, regra comercial, revisão, tabelas normalizadas, snapshot, índice e auditoria juntos. Configuração de teste recusa a pasta operacional. Banco de produção remota ainda não é habilitado.

**Incremento C2 — 06/10/2026:** o catálogo do código acrescenta `011_legal_entities.sql`, reproduzindo o DDL aprovado em [C1](../atualizacoes/fase-c/C1_MINIMAL_DDL_PROPOSAL.md). Uma tabela STRICT/WITHOUT ROWID, dez colunas (somente `created_by` nullable), PK `(organization_id,id)`, UNIQUE global de `id`, oito CHECKs, três FKs imediatas e três triggers; nenhum índice explícito, seed ou backfill. `organization_id` referencia o ID existente de `companies`, sem renomear/reinterpretar consumidores atuais. Apenas PROVISIONED pode entrar; qualquer UPDATE/DELETE é bloqueado, inclusive substituição por conflito de identidade. A tabela permanece vazia durante upgrade e operação v1 normais; sem repository/API/UI. `created_by` referencia usuário global e `creation_audit_id` evento existente: essas FKs não provam autorização, Org/causa do evento, evidência jurídica ou proteção criptográfica. O futuro writer deverá validar esses contextos semanticamente. [Homologação sintética e limites](../atualizacoes/fase-c/C2_LEGAL_STRUCTURE_REPORT.md).

001–010, migrador e backup permanecem intactos. Restore compatível valida/copia e **não migra**: abrir depois com o novo catálogo aplica 011 uma vez. Pacote antigo 001–010 recusa DB/backup com 011 e não é rollback seguro; compatibilidade de deployment/recovery depende de etapa futura. Não foi aberto nem migrado o banco operacional.

### Modelo incremental implementado

**BRAND-001 — 06/10/2026, local para revisão:** `012_organization_branding.sql` cria somente `organization_branding`, STRICT, oito colunas: `organization_id` PK/FK → `companies(id)`; `display_name` (1–80); `primary_color`/`accent_color` (#RRGGBB maiúsculo, incluindo rejeição de NUL); `theme_mode` LIGHT/DARK/SYSTEM; `revision` positiva; `updated_at`; `updated_by` FK → usuário global. Sem seed/backfill ou override Legal/Unit. Ausência de linha significa default central; leitura não cria linha. `created_at` foi dispensado porque o evento de criação é auditado. API determina Org/ator/instante e combina CAS e auditoria na mesma transação. FK de usuário comprova existência; autorização permanece no backend. [Contrato, justificativa por campo e testes](../atualizacoes/branding/BRAND_001_REPORT.md).

001–011 permanecem byte a byte intactas. Restore pré-012 preserva dados e aplica 012 somente na abertura com catálogo novo; pós-012 preserva configuração/audit. Catálogo 001–011 recusa DB/backup 012; downgrade não é rollback seguro. Migrador/backup não foram alterados, e a base operacional não foi aberta.

| Migration | Agregado e relações |
| --- | --- |
| `001_foundation.sql` | Identidade, empresas/unidades, vínculos/RBAC, sessões, estado escopado e auditoria |
| `002_products.sql` | Produtos com campos reais de cadastro, preço e custos já existentes; aliases e embalagens em filhos próprios |
| `003_customers.sql` | Clientes com cadastro, contatos/documentos existentes; não duplica vendas/financeiro no cliente |
| `004_suppliers.sql` | Fornecedores com cadastro/contatos existentes; marcador conserva coleção ausente versus vazia |
| `005_purchases.sql` | Cabeçalhos, itens, recibos e itens recebidos; vínculo composto à linha pedida da mesma compra e ao produto/fornecedor do escopo |
| `006_inventory.sql` | Saldos globais, movimentos globais/físicos, saldos por posição e entradas; âncoras técnicas explícitas para histórico incompleto |
| `007_inactive_sale_approval.sql` | Direito excepcional, journal de concessão inicial e grants de autorização de venda desativada; não normaliza o agregado Vendas |
| `008_access_maintenance.sql` | Convites hash-only de reset e concessão única do direito de reset administrativo |
| `009_sales.sql` | Vendas e filhos factuais; escopo composto, presença/extras/ordinais, índices e preservação histórica |
| `010_stock_receipt_fk_index.sql` | Índice não único `stock_movements_scope_receipt` em `commercial_stock_movements(company_id,unit_id,purchase_id,receipt_ordinal)`; preserva FK diferida e múltiplos movimentos por recibo |
| `011_legal_entities.sql` | Estrutura legal dormente mínima de C1; identidade global imutável, candidatas PF/PJ PROVISIONED, proveniência USER/TECHNICAL e referências de existência a Org/ator/auditoria; sem comportamento Legal operacional |
| `012_organization_branding.sql` | Configuração visual 1:1 por `companies(id)`, cores controladas, tema, revisão/CAS e última alteração; sem seed/backfill |

PKs/FKs comerciais incluem empresa/unidade. Referências normalizadas recebem constraints onde comprovadas; vínculos de posições, origens/documentos ainda no snapshot usam domínio. Vendas possui FKs compostas a Clientes/Produtos quando normalizáveis e filhos ligados ao pai; isso não cria FK universal entre todo movimento e todo documento. Compras conserva cabeçalhos/itens/recebimentos e itens recebidos com relações compostas; movimento pode referenciar recibo por compra/ordinal na mesma unidade. Recibo histórico sem ID ou identidade ambígua não ganha prova inventada. Campos desconhecidos, presença/ausência/null e ordem são preservados. Custo existente não cria segunda fonte de entrada/despesa.

O runtime prepara/confere unidades antes de aceitar requisições. `loadState` hidrata/confere os seis espelhos; divergência aborta sem reimportação silenciosa. Consultas SQL paginadas, incluindo lista/detalhe de Vendas, usam revisão/marcador sem payload integral ou conferência completa por página. `writeState` é caminho técnico de importação/fixtures. `saveBusinessState` impede apagar/alterar movimentos/entradas antigos e exige movimento para cada delta global/físico; sem bypass no body. Transferência física não inventa entrada global e âncora não é movimento/autor antigo.

Estoque usa `commercial_stock_movements`, `commercial_stock_balances`, `commercial_position_movements`, `commercial_position_balances` e `commercial_stock_entries`. Saldos globais/físicos, históricos, presença e âncoras são confrontados com o espelho e sua revisão/marcador. Precisão técnica é exata; operações comerciais continuam inteiras. O índice 010, statement local, acumuladores e Map local reduziram percursos/preparações sem cache permanente nem alteração de invariantes. Detalhes pertencem a [PERFORMANCE_V1_2](../atualizacoes/v1.2/PERFORMANCE_V1_2.md).

## Mapeamento histórico da V0.12.0 — passo 2

Catálogo completo de campos, tipos aparentes, obrigatoriedade comprovada, IDs, relações, datas, centavos e históricos: [DATABASE_SCHEMA_V0.12.md](../atualizacoes/fundacao-v1/DATABASE_SCHEMA_V0.12.md). As 42 coleções suportadas foram inventariadas; a base real contém 12 listas e company separado. Campos observados em amostras não são automaticamente obrigatórios. [Evidência estrutural sem valores pessoais](../../.qa/foundation-v1/legacy-schema.json); ferramenta read-only em [inspect-legacy-schema.js](../../scripts/inspect-legacy-schema.js). A inspeção e os 205 testes preservaram byte a byte a base original.

### Persistência original, antes da Fundação V1

Não há banco SQL. [storage.js](../../storage.js) abre um JSON em `data/database.json`, ou no DATA_DIR configurado. O processo mantém a base em memória, valida o próximo estado e escreve um arquivo temporário antes de renomeá-lo. A versão gravada é `schemaVersion: 2`; versões suportadas pelo validador vão de 1 a 2, e alguns dados antigos sem versão continuam aceitos.

`products`, `customers` e `sales` são listas obrigatórias. Outras coleções podem não existir em bases antigas e são criadas pelos fluxos correspondentes. O código reconhece **42 coleções**; isso não significa que o arquivo da loja contém ou utiliza todas. A base lida nesta tarefa foi validada sem alterações. Não publicar registros pessoais nos documentos.

## Coleções reconhecidas

| Grupo | Coleções | Relação/uso |
| --- | --- | --- |
| Cadastros | products, customers, suppliers, families | Identificadores, situação, versões e metadados; aliases/packages ficam dentro do produto |
| Comercial | sales, quotes | Itens e valores históricos; cliente vinculado por ID quando registrado; orçamento pode virar venda |
| Compras | purchases, supplierQuotes | Fornecedor e itens; entregas dentro da compra; cotação manual pode preparar compra |
| Controle de compras | purchaseConferences, purchaseAmendments, purchaseOccurrences | Conferência, alteração e ocorrência vinculadas a documentos de compra |
| Estoque | stockMovements, stockEntries, inventories, reservations | Movimentações, entradas, contagem e reservas; saldo vendável no produto, físico total inclui retidos |
| Localização | positions, transfers, positionMovements | Posições e deslocamentos físicos; saldos por posição no produto |
| Segregação/retorno | quarantineEntries, supplierReturns | Quarentena, devolução ao fornecedor e vínculos de origem |
| Preços | priceLists, promotions, priceReviews | Condições comerciais e revisões de preço |
| Financeiro | payables, expenses, cashSessions | Parcelas/pagamentos vinculados a despesas; caixa com movimentos internos |
| Crédito e entrega | storeCredits, deliveries | Crédito de loja e acompanhamento de entrega ligados ao contexto comercial |
| Planejamento | expenseCenters, expenseBudgets, agreements | Classificação, limites gerenciais e acordos vinculados a operações |
| Recorrência | recurringModels, recurringOccurrences | Modelos e ocorrências geradas manualmente; não há scheduler cloud |
| Procedimentos | procedures, procedureExecutions | Roteiros e execução declarada de etapas |
| Organização | tasks, hiddenOperations | Agenda manual e ocultação visual; ocultar não exclui operação |
| Auditoria/comandos | auditLog, operationCommands, purchaseCommands, quoteCommands, cashCommands | Histórico e controle de reenvio nos fluxos que usam esses mecanismos |

O objeto legado `company` continua guardando a apresentação comercial da unidade. O ownership e o acesso são definidos pelas novas tabelas reais de empresas, unidades, usuários e sessões; nunca inferir autorização desse objeto de apresentação.

## Valores, datas e histórico ATUAL

- Dinheiro utiliza inteiros em centavos, com validação de inteiros seguros nos fluxos. Isso é uma base a preservar; regras de arredondamento adicionais dependem do domínio.
- Operações comerciais principais continuam inteiras; a representação SQL de quantidades usa decimal canônico **TEXT**, com cálculo exato em BigInt, sem REAL. Embalagens podem representar múltiplos de unidades. Unidades já existentes são preservadas; venda fracionada, conversões, peso, lotes e validade não estão habilitados por essa representação.
- Registros usam IDs, frequentemente UUID, e várias operações usam versões esperadas. ID não substitui autorização nem isolamento.
- Vendas/compras preservam itens e valores de seu momento. Não recalcular transações antigas pelo preço atual do cadastro.
- Há instantes ISO e datas civis em diferentes documentos. Padronização e timezone precisam ser mantidos explicitamente por campo ao evoluir.
- O `auditLog` legado contém responsável declarado e permanece preservado. A nova `audit_events` registra ator verificado, antes/depois minimizados e escopo, em transação; triggers bloqueiam update/delete e hashes encadeados detectam alterações simples. Administrador do arquivo pode adulterar/remover/reconstruir a trilha; ela não é inviolável.
- Recebimento de compra, despesa vinculada e pagamento possuem validações de integridade. A cobertura depende do fluxo, não é garantia uniforme para toda escrita.

## Limitações ATUAIS

Cada escrita ainda materializa/valida/serializa grande parte ou todo o snapshot da unidade e reconcilia tabelas/espelhos; filhos/saldos/movimentos ainda são reconstruídos, embora Vendas preserve filhos inalterados e estoque tenha melhorias locais. Conferência física/posições e outros percursos permanecem. Catálogo/Clientes/Fornecedores/Estoque/Movimentos e lista/detalhe de Vendas usam SQL; Financeiro/Operações projetam snapshot em memória. Custos/consultas avançadas de Compras ainda dependem de estado completo; persistência relacional não implica API proporcional própria de todo módulo. Interface completa exige as cinco leituras. Não há prontidão cloud, catálogo compartilhado ou FK universal.

Transações não substituem proteção contra falha de disco. [backup-service.js](../../foundation/backup-service.js) implementa cópia consistente SQLite, validação, agendamento e retenção; [restore-local-sql.js](../../scripts/restore-local-sql.js) restaura somente em destino novo isolado. Homologação sintética validou migrations/integridade/FKs, login, seis agregados, escopos e auditoria. Procedimento operacional da loja, disaster recovery real, RPO/RTO e infraestrutura externa não foram homologados. [verify-commercial.js](../../scripts/verify-commercial.js) confere em leitura. Banco/JSON/rascunhos não possuem criptografia de aplicação; retenção local não é proteção contra administrador ou perda física. Não substituir SQL por JSON antigo nem presumir downgrade. Ver [operação V1.2](OPERATIONS_V1_2.md).

## PLANEJADO

Continuar a normalização incremental de Caixa, Financeiro e demais documentos e reduzir a dependência de snapshot nas escritas de Vendas. SQLite nativo é atual; PostgreSQL é alvo central futuro, com adapter/migrations e paridade ainda necessários. Não presumir portabilidade pronta nem migrar infraestrutura nesta tarefa.

Modelar ownership de tenant/entidade legal/unidade conforme o mestre e a especificação C, sem presumir que empresa atual já seja organização ou entidade legal. Nem toda tabela precisa duplicar chaves: associação derivada deve ser demonstravelmente segura. Contextos/vínculos devem ser revalidados; não inferir acesso pelo objeto comercial company.

Expandir queries SQL paginadas e filtradas aos módulos restantes; arquivos em armazenamento protegido com metadados/vínculo de acesso. Valores exatos em centavos ou decimal apropriado; datas civis separadas de instantes UTC. Lotes, validade, custo médio e conversões de unidades dependem de definição do fluxo; saldos atuais já são isolados por empresa/unidade.

## Quantidades e unidades de medida (PLANEJADO)

Revisão Printing/Commerce, 02/10/2026: `decimal.js` representa texto decimal canônico e calcula com BigInt. Porém projeções de `commercial-store.js`/`inventory-store.js` e hidratação `legacyInteger` continuam restritas a inteiros seguros. Não inserir frações diretamente no SQL: o caminho compatível as recusará. `unit`/`measure_unit` conservam informação declarada, sem contrato completo de produto fracionável, unidade base/compra/venda ou conversão. O limite técnico de texto não define precisão comercial.

Para habilitar frações, especificar contrato decimal ponta a ponta (entrada, API/DTO, cálculo, SQL, leitura e interface), precisão/escala/limites, quantidade × preço/custo e arredondamento por item/documento. Exemplos de aceite: 0,684 kg; 1,750 m; 2,430 m²; 0,500 L; caixa=12 unidades ou 2,43 m²; compra 12 kg/venda 0,750 kg. Conservar fator, unidade e versão históricos; não reinterpretar operações antigas.

### Impacto dos módulos futuros — PLANEJADO

Printing: destinos/dispositivos/capacidades, modelos versionados, jobs/tentativas e vínculo ao documento histórico com escopo composto. Reimpressão conserva conteúdo/versão e cria trilha própria, sem nova venda ou emissão fiscal. Commerce: conexões multiconta por empresa, listings/mapeamentos/variações, IDs externos por conexão/tipo, pedidos/eventos/reservas e projeções reconciliáveis. Custos/taxas e dimensão de canal alimentarão o mesmo Financeiro, sem duplicar contabilidade.

Não impor conta única por empresa+provedor. Catálogo atual tem PK empresa+unidade+ID; compartilhamento/agregação exige identidade/mapeamento explícito. Vendas já tem SQL/leituras próprias, mas comandos e reservas, preços, pedidos externos, entregas e Financeiro conservam dependências transitórias; não presumir normalização universal. A semântica local diferencia vendável (`product.stock`) de físico total com retidos: não descontar quarentena duas vezes ao definir `available_to_sell`/buffer. Unidade de atendimento, alocação e regras finais **A DEFINIR**.

Nenhuma migration/schema/dado foi alterado por esta revisão: o decimal textual e chaves compostas permitem evolução aditiva. Antes de futuras migrations, documentar compatibilidade, transição de IDs/autoridade, recuperação e ensaio isolado; verificar replay, concorrência, histórico e isolamento. Ver [Printing](PRINTING_AND_DEVICES.md), [Commerce](COMMERCE_HUB.md) e [decisões](DECISIONS.md).

Diretriz do Murilo, 02/10/2026: a normalização de Produtos, Compras, Estoque e futuramente Vendas deve suportar quantidades decimais, unidades de medida e conversões futuras. Não transformar as validações atuais de quantidade inteira em uma restrição permanente do novo modelo.

A representação decimal textual exata já existe no SQL da V1.1; habilitação de operações fracionadas e regras de conversão continuam planejadas. O módulo fiscal brasileiro permanece planejado e deverá ser isolado do domínio comercial.

Antes de cada alteração estrutural, definir a representação exata das quantidades, precisão/escala, arredondamento, unidades aceitas e contratos de conversão. Esses detalhes permanecem **A DEFINIR**; não adotar fatores ou regras comerciais por suposição. Quantidade não se confunde com valor monetário em centavos. A migração deve preservar quantidades, saldos e históricos existentes, e as conversões futuras não devem reinterpretar operações antigas silenciosamente.

Critério de aceite do desenho: representar, sem truncamento, uma quantidade fracionada como 0,5 em uma unidade de medida definida e reservar um contrato explícito para conversões. Quando implementado, verificar os efeitos em compra/recebimento, estoque e venda, além da compatibilidade com os registros inteiros existentes. Isso não habilita venda fracionada nesta entrega.

## Critérios de migração

**Implementado na Fundação V1:** `foundation/migration.js` lê UTF-8/JSON válido, rejeita números inseguros e referências conhecidas inválidas, preserva campos desconhecidos/IDs/históricos, importa em transação e relê para igualdade canônica. O relatório confere contagens, hashes de IDs, centavos por caminho e hash da origem antes/depois; esses agregados não são novos saldos contábeis. Importação repetida com a mesma origem reconhece o resultado sem apagar operações posteriores; origem diferente ou estado existente não é sobrescrito silenciosamente.

A ferramenta [migrate-legacy.js](../../scripts/migrate-legacy.js) exige origem, destino e nomes de contexto explícitos; destina-se à conferência isolada e recusa o banco operacional. O runtime faz a importação inicial no banco novo da instalação. Não apagar `foundation.sqlite` para forçar reimportação, nem substituir o banco por JSON antigo. Ver evidências e procedimento no [relatório V1](../atualizacoes/fundacao-v1/FOUNDATION_V1_REPORT.md).

1. Inventariar schemas, vínculos e casos antigos sem alterar a base original.
2. Definir equivalência de IDs, valores, estados e históricos; registrar casos que exigem decisão.
3. Preparar cópia de segurança e comprovar recuperação em ambiente isolado.
4. Executar importação reproduzível e validações de contagem, referências, dinheiro e estoque.
5. Testar concorrência, reenvio, rollback e acesso por empresa/unidade.
6. Homologar, documentar transição/compatibilidade e só então planejar uso real.

Não editar o JSON da loja para simular usuários, permissões ou migração durante desenvolvimento.
