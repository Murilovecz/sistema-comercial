# Mapa do projeto

## Entrada vigente — 05/10/2026

[Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md): decisões conceituais; [PROJECT_MASTER](PROJECT_MASTER.md): índice de estado/governança; [MODULES](MODULES.md): mapa aprovado; [ROADMAP](ROADMAP.md): sequência A–G; [auditoria](../auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md): gaps/evidências/reclassificação. O inventário V1.2 abaixo continua descrevendo o backend ativo; B/610 é histórico.

Acréscimos **ATUAIS** V1.3: `frontend/package.json` e lock/configuração; `frontend/src/api/` transporte/auth; `session/` coordenação de sessão/contexto; `app/` login/seletor/roteamento; `ui/` Design System; testes próprios. Node serve `/ui/` e a interface comercial permanece em `public/`. Não há Produtos React. O [contrato V1.3 datado](../atualizacoes/v1.3/V1_3_FRONTEND_ARCHITECTURE.md) conserva inventário, mas sua ordem antiga não inicia o piloto.

**Direção não implementada:** organização/entidade legal/tenant conforme mestre, entitlement, dispositivo confiável, plano administrativo de plataforma, Agente Local/sync cloud/fiscal/updater. `company_id` e `unit_id` mantêm semântica atual até especificação aprovada; nenhuma pasta documental comprova módulo executável.

Novas referências **PLANEJADAS**, 02/10/2026: [PRINTING_AND_DEVICES](PRINTING_AND_DEVICES.md), [COMMERCE_HUB](COMMERCE_HUB.md) e [relatório da revisão](../historico/PRODUCT_DIRECTIONS_REPORT.md). Estes documentos não correspondem a pastas/módulos executáveis já implementados.

## ATUAL — Fundação V1.2 fechada localmente, 03/10/2026

Checkpoint funcional `2a2177c7b80734722f71bd9e72029cf9e1b39df0`, homologação **B, 610/610**, migrations **001–010**; versão **1.2.0-foundation.1**, fechamento local concluído e tag `v1.2.0-foundation.1`. [Estado e fontes](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md).

```text
D:\Projeto Sistema Local
  AGENTS.md                  protocolo dos especialistas
  agents/                    dez definições de papéis
  docs/README.md             índice da documentação
  docs/atual/                referências e planejamento vigentes
  docs/atualizacoes/          registros da Fundação, V1.1, V1.2 e V1.3
  docs/historico/             V0, governança antiga e relatos datados
  docs/briefings/             fontes gerais preservadas
  server.js                  servidor HTTP, rotas e coordenação
  foundation/                identidade, RBAC, SQL, auditoria e migração
  foundation/migrations/     migrations SQL versionadas com checksum
  scripts/migrate-legacy.js  importação explícita em banco isolado
  storage.js                 validação legada e leitura da origem JSON
  *.js                       regras, cálculos e validadores
  *.test.js                  testes com o runner nativo do Node
  package.json               versão 1.2.0-foundation.1; Node >=24.7
  INICIAR.cmd                inicializador local
  public/                    interface e cálculos compartilhados
  data/foundation.sqlite     SQL operacional; não usar para testes de escrita
  data/database.json         origem legada preservada; não é persistência ativa
  data/PRIMEIRO-ACESSO.txt    código privado de instalação; não publicar
  .qa/                       evidências e roteiros de verificação
  LEIA-ME.md                 manual de entrada
  V0.*.png/jpg                imagens históricas locais preservadas
```

Git local existe desde 02/10/2026; checkpoint do candidato registrado, sem remoto/publicação. Backup consistente/retenção e restore isolado implementados; procedimento da loja/RPO/RTO não homologados. [Versionamento](VERSIONING_LOCAL.md), [operação](OPERATIONS_V1_2.md).

## Pontos de entrada e dependências

| Área | Arquivos principais |
| --- | --- |
| Inicialização/API | [server.js](../../server.js), [package.json](../../package.json), [INICIAR.cmd](../../INICIAR.cmd) |
| Fundação SQL/identidade | [runtime.js](../../foundation/runtime.js), [sql-store.js](../../foundation/sql-store.js), [identity.js](../../foundation/identity.js), [admin.js](../../foundation/admin.js) |
| Escopo e permissões | [request-context.js](../../foundation/request-context.js), [authorization.js](../../foundation/authorization.js), [access.js](../../foundation/access.js), [rbac.js](../../foundation/rbac.js) |
| Transação e auditoria | [state-repository.js](../../foundation/state-repository.js), [audit.js](../../foundation/audit.js), [execution.js](../../foundation/execution.js), [migration.js](../../foundation/migration.js) |
| Persistência | [storage.js](../../storage.js), [workflow-storage.js](../../workflow-storage.js), [advanced-storage.js](../../advanced-storage.js), [credit-storage.js](../../credit-storage.js), [operations-storage.js](../../operations-storage.js), [round10-storage.js](../../round10-storage.js) |
| Comandos e histórico | [commands.js](../../commands.js), [audit.js](../../audit.js), [advanced-common.js](../../advanced-common.js) |
| Cadastros e dinheiro | [domain.js](../../domain.js), [catalog.js](../../catalog.js), [catalogue-next.js](../../catalogue-next.js), [money.js](../../money.js) |
| Comercial/financeiro | [checkout.js](../../checkout.js), [payments.js](../../payments.js), [accounts.js](../../accounts.js), [cash.js](../../cash.js), [payables.js](../../payables.js), [quotes.js](../../quotes.js) |
| Compras/estoque | [purchases.js](../../purchases.js), [purchase-next.js](../../purchase-next.js), [workflows.js](../../workflows.js), [positions.js](../../positions.js), [quarantine.js](../../quarantine.js), [supplier-returns.js](../../supplier-returns.js) |
| Comercial complementar | [pricing.js](../../pricing.js), [price-reviews.js](../../price-reviews.js), [store-credits.js](../../store-credits.js), [deliveries.js](../../deliveries.js), [supplier-quotes.js](../../supplier-quotes.js) |
| Planejamento/gestão | [budgets.js](../../budgets.js), [agreements.js](../../agreements.js), [recurring.js](../../recurring.js), [procedures.js](../../procedures.js), [tasks.js](../../tasks.js) |
| Exportação | [export.js](../../export.js), [cash-report.js](../../cash-report.js) |
| Interface principal | [index.html](../../public/index.html), [style.css](../../public/style.css), [app.js](../../public/app.js), [navigation.js](../../public/navigation.js), [startup.js](../../public/startup.js), [store.js](../../public/store.js) |
| Acesso e preferências | [foundation-ui.js](../../public/foundation-ui.js), [foundation-storage.js](../../public/foundation-storage.js) |
| Leitor/atendimento | [product-lookup.js](../../public/product-lookup.js), [scanner-ui.js](../../public/scanner-ui.js), [scan-next-ui.js](../../public/scan-next-ui.js), [workstation-ui.js](../../public/workstation-ui.js) |
| Relatórios | [reports.js](../../public/reports.js), [manager-ui.js](../../public/manager-ui.js), [advanced-analytics.js](../../public/advanced-analytics.js), [analytics-ui.js](../../public/analytics-ui.js) |

A tabela é um mapa dos pontos principais, não a lista integral de arquivos. As famílias `public/*-core.js` concentram cálculos reutilizáveis e `public/*-ui.js` telas/ações; não há garantia de separação perfeita pelo nome. O inventário histórico de hashes em `.qa/foundation-docs/baseline.json` (consulta local opcional) lista os 130 arquivos de aplicação considerados naquela preservação, incluindo os 126 JavaScript existentes à época.

## Fluxo típico

Comando com CSRF/contexto esperado → servidor verifica sessão e ação → transação SQL lê o estado atual daquela unidade → domínio, validações, reconciliação e executor verificado → agregados SQL/espelho/índice/auditoria → commit → resposta. A resposta comercial completa exige as leituras de catálogo, estoque, vendas, financeiro e operação. Idempotência/versão legadas ainda variam por fluxo.

## O que está incompleto

Normalização completa de Caixa/Financeiro, remoção da ponte/estado completo nas escritas, catálogo compartilhado, recuperação global/e-mail e recuperação operacional da loja, API cloud/PostgreSQL, fiscal, integrações/hardware, instalador/Edge/offline e assinatura SaaS. Seis agregados SQL, lista/detalhe de Vendas sem payload integral, troca/reset administrativo/sessões, Git e backup/retenção/restore sintético isolado já existem. Escritas large/RSS precisam acompanhamento. Limites: [estado V1.2](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md); V1.1 e diagnóstico inicial são históricos.

## Verificação e recuperação de contexto

- Testes de regras: `node --test --test-isolation=none`; usar base isolada nas verificações HTTP/UI que gravam.
- Evidência atual: [estado consolidado V1.2](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md) e `.qa/foundation-v1.2/homologation/rc-Ip8azD/`; dados/portas isolados. `.qa` é privada e ignorada pelo Git. V1.1 permanece histórico.
- Evidência histórica documental: `.qa/foundation-docs/unit-results.txt` (consulta local opcional).
- Verificação histórica da V0.12: [relatório](../historico/v0/VERIFICACAO-V0.12.md) e `.qa/round10/final-results.json` (consulta local opcional).
- Alterações pedidas pelo Murilo: [AJUSTES-DO-PASSEIO.md](../atualizacoes/v1.1/AJUSTES-DO-PASSEIO.md).
- Próxima direção: [ROADMAP](ROADMAP.md); não retomar automaticamente rodadas antigas.

## Acréscimos V1.1

- [commercial-store.js](../../foundation/commercial-store.js), [inventory-store.js](../../foundation/inventory-store.js): agregados relacionais e equivalência.
- [commercial-read.js](../../foundation/commercial-read.js): projeções autorizadas, filtros e paginação; [commercial-write.js](../../foundation/commercial-write.js): venda direta/preview.
- [commercial-registration.js](../../foundation/commercial-registration.js), [catalog-registration.js](../../catalog-registration.js): comandos menores e domínio compartilhado.
- [inactive-sale-approval.js](../../foundation/inactive-sale-approval.js): autorização vinculada à venda/sessão, consumo transacional.
- [commercial-ui.js](../../public/commercial-ui.js), [foundation-experience.js](../../public/foundation-experience.js): interface por perfil e quick views.
- [verify-commercial.js](../../scripts/verify-commercial.js): conferência SQL somente leitura; [backup-local-sql.js](../../scripts/backup-local-sql.js): cópia SQLite consistente para destino novo.

## Contrato atual de leitura e escrita

Leituras pequenas não devolvem snapshot completo. Catálogo não revela custo/saldo; custo exige financeiro e saldo exige estoque. Lista/detalhe de Vendas usam SQL sem payload completo; Financeiro ainda materializa snapshot. Escritas, incluindo Vendas, mantêm estado da unidade por compatibilidade.

## Acréscimos V1.2

- [sales-store.js](../../foundation/sales-store.js): projeção/hidratação, sincronização incremental, espelho e queries de Vendas; [modelo](SALES_V1_2_MODEL.md).
- [auth-maintenance.js](../../foundation/auth-maintenance.js) e [identity.js](../../foundation/identity.js): troca/reset, revogação de sessões e purge conservador; [contrato](ACCESS_V1_2.md).
- [backup-service.js](../../foundation/backup-service.js), [restore-local-sql.js](../../scripts/restore-local-sql.js): backup/validação/retenção e restore novo isolado; [limites](OPERATIONS_V1_2.md).
- [foundation-operations.js](../../public/foundation-operations.js): telas de acesso/sessões; [commercial-ui.js](../../public/commercial-ui.js): lista/detalhe SQL por perfil.
- [008](../../foundation/migrations/008_access_maintenance.sql), [009](../../foundation/migrations/009_sales.sql), [010](../../foundation/migrations/010_stock_receipt_fk_index.sql): acesso, Vendas e índice FK.
- [benchmark-foundation.js](../../scripts/benchmark-foundation.js), [benchmark-v1-2-http.js](../../scripts/benchmark-v1-2-http.js) e instrumentos locais específicos: [matrizes separadas](../atualizacoes/v1.2/PERFORMANCE_V1_2.md).
- [v1-2-homologation.test.js](../../foundation/v1-2-homologation.test.js): restore/login/seis agregados/três escopos e vendas simultâneas/replay/auditoria; complementa a suíte global homologada.
