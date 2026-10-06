# Fundação V1.2 — registro do fechamento local

**03/10/2026 — 1.2.0-foundation.1, fechada localmente.** Fechamento autorizado pelo Murilo; homologação existente **B — condicional, 610/610 aprovados**, zero falhos/ignorados/cancelados, sem novo bloqueador funcional demonstrado ou nova homologação.

## Preflight e fonte da versão

HEAD inicial `33b4efc80bc0f3edf9c4b76873719d06e49cc323`, branch `main`, working tree limpa e staged vazio. Pai do commit documental: checkpoint funcional `2a2177c7b80734722f71bd9e72029cf9e1b39df0`. Antes de editar foram registrados hashes SHA-256 dos 331 arquivos versionados e classificadas as ocorrências abaixo.

Única tag anterior: `foundation-v1.1-baseline`, leve, alvo `79b418aa311a3775f3d8eff663eba27f86a890c2`. Ela identifica uma baseline, sem estabelecer convenção de release numerado. Este fechamento usa **tag local anotada `v1.2.0-foundation.1`**, sem sobrescrever a baseline, reescrever histórico, publicar release ou fazer push.

A fonte oficial é [package.json](../../../package.json), campo `version`: **1.1.0-foundation.1 → 1.2.0-foundation.1**. Não existe lockfile versionado nem módulo/UI com outra versão fixa. [server.js](../../../server.js) expõe a fonte em `GET /api/health`; [backup-service.js](../../../foundation/backup-service.js) a registra no manifesto de novos backups. Restore conserva a versão do manifesto de origem. Instrumentos de benchmark/diagnóstico também leem package.json, sem definir outra versão ou usar esse valor para alterar regras. Versões de dependências, contratos, schema e domínio não foram alterados.

## Classificação anterior às edições

A = fonte de verdade atual; B = documento de estado atual; C = registro histórico; D = exemplo/referência técnica que não muda. Busca em arquivos do repositório, incluindo ocultos relevantes; `.git`, `.qa` e dados operacionais privados ficaram fora do inventário de fontes atuais. Seus logs/bancos históricos não são fontes de versão e não foram reescritos.

**48 ocorrências literais de versão em 46 linhas**, todas relacionadas abaixo. Linhas/localizações são as do HEAD inicial. Havendo mais de uma versão na mesma linha, todas recebem a classificação da respectiva narrativa. Checkpoint/título de commit histórico citado dentro de linha B permanece C; apenas o estado vigente dessa linha é sincronizado.

| Localização inicial | Versão encontrada | Classe | Tratamento |
| --- | --- | --- | --- |
| `AGENTS.md:35` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/ACCESS_V1_2.md:3` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/API.md:5` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/ARCHITECTURE.md:5` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/briefings/FOUNDATION_V1_2_SOURCE.md:9` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/briefings/FOUNDATION_V1_2_SOURCE.md:945` | 1.2.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/CHANGELOG_ARCHITECTURE.md:9` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/CHANGELOG_ARCHITECTURE.md:17` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/CHANGELOG_ARCHITECTURE.md:26` | 1.0.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/DATABASE.md:5` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/DECISIONS.md:5` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/DECISIONS.md:73` | 1.0.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/FOUNDATION_V1_1_REPORT.md:3` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/FOUNDATION_V1_1_REPORT.md:9` | 1.0.0-foundation.1, 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/FOUNDATION_V1_1_REPORT.md:67` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/FOUNDATION_V1_2_REPORT.md:8` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/FOUNDATION_V1_2_STEPS.md:3` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/FOUNDATION_V1_2_STEPS.md:5` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/FOUNDATION_V1_REPORT.md:3` | 1.0.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/LINK_PORTABILITY_V1_2.md:3` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/MODULES.md:3` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/OFFLINE_EDGE.md:5` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/OPERATIONS_V1_2.md:3` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/PERFORMANCE_V1_2.md:3` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/PRODUCT_DIRECTIONS_REPORT.md:7` | 1.0.0-foundation.1, 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/PRODUCT_DIRECTIONS_REPORT.md:11` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/PROJECT_MAP.md:7` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/PROJECT_MAP.md:21` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/PROJECT_MASTER.md:3` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/README.md:3` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/RECONCILIATION_V1_2.md:7` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/RECONCILIATION_V1_2.md:49` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/RECONCILIATION_V1_2.md:73` | 1.2.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/RECONCILIATION_V1_2.md:130` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/RECONCILIATION_V1_2.md:131` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/RECONCILIATION_V1_2.md:132` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/RECONCILIATION_V1_2.md:133` | 1.0.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/ROADMAP.md:3` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/SALES_V1_2_MODEL.md:5` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/SALES_V1_2_MODEL.md:19` | 1.1.0-foundation.1 | C | Preservar registro datado/briefing |
| `docs/SECURITY.md:5` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/THREAT_MODEL.md:3` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/VERSIONING_LOCAL.md:5` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `docs/VISION.md:39` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `LEIA-ME.md:3` | 1.1.0-foundation.1 | B | Sincronizar estado atual |
| `package.json:3` | 1.1.0-foundation.1 | A | Atualizar fonte única |

Expressões equivalentes relevantes de candidato/fechamento/revisão foram classificadas antes de editar:

| Localização inicial | Referência | Classe | Tratamento |
| --- | --- | --- | --- |
| `docs/API.md:3` | release candidate | B | Refletir fechamento local |
| `docs/ARCHITECTURE.md:3` | release candidate | B | Refletir fechamento local |
| `docs/CHANGELOG_ARCHITECTURE.md:1` | estado de fechamento equivalente | C | Preservar registro histórico |
| `docs/DATABASE.md:3` | release candidate | B | Refletir fechamento local |
| `docs/DECISIONS.md:3` | estado de fechamento equivalente | B | Refletir fechamento local |
| `docs/DECISIONS.md:94` | tag/fechamento e procedimento da loja penden | B | Refletir fechamento local |
| `docs/FOUNDATION_V1_2_REPORT.md:1` | release candidate | B | Refletir fechamento local |
| `docs/FOUNDATION_V1_2_REPORT.md:3` | fechamento oficial | B | Refletir fechamento local |
| `docs/FOUNDATION_V1_2_REPORT.md:7` | release candidate | C | Preservar registro histórico |
| `docs/FOUNDATION_V1_2_STEPS.md:17` | estado de fechamento equivalente | B | Refletir fechamento local |
| `docs/FOUNDATION_V1_2_STEPS.md:18` | Versionamento final, tag e fechamento formal \| PENDEN | B | Refletir fechamento local |
| `docs/FOUNDATION_V1_2_STEPS.md:22` | estado de fechamento equivalente | B | Refletir fechamento local |
| `docs/LINK_PORTABILITY_V1_2.md:95` | candidatos**, zero hyperlink ob | C | Preservar registro histórico |
| `docs/PROJECT_MAP.md:5` | release candidate | B | Refletir fechamento local |
| `docs/PROJECT_MASTER.md:46` | fechamento formal | B | Refletir fechamento local |
| `docs/PROJECT_MASTER.md:63` | revisar o diff document | B | Refletir fechamento local |
| `docs/README.md:61` | candidato homologado; fechamento penden | B | Refletir fechamento local |
| `docs/README.md:65` | Candidato B | B | Refletir fechamento local |
| `docs/README.md:66` | tag/fechamento penden | B | Refletir fechamento local |
| `docs/RECONCILIATION_V1_2.md:3` | fechamento formal | C | Preservar registro histórico |
| `docs/RECONCILIATION_V1_2.md:27` | tag/fechamento penden | C | Preservar registro histórico |
| `docs/RECONCILIATION_V1_2.md:127` | release candidate | C | Preservar registro histórico |
| `docs/RECONCILIATION_V1_2.md:128` | release candidate | C | Preservar registro histórico |
| `docs/RECONCILIATION_V1_2.md:169` | release candidate | C | Preservar registro histórico |
| `docs/RECONCILIATION_V1_2.md:175` | tag/fechamento continuam penden | C | Preservar registro histórico |
| `docs/ROADMAP.md:30` | estado de fechamento equivalente | B | Refletir fechamento local |
| `docs/ROADMAP.md:40` | estado de fechamento equivalente | B | Refletir fechamento local |
| `docs/ROADMAP.md:42` | estado de fechamento equivalente | B | Refletir fechamento local |
| `docs/ROADMAP.md:44` | estado de fechamento equivalente | B | Refletir fechamento local |
| `docs/SALES_V1_2_MODEL.md:3` | release candidate | B | Refletir fechamento local |
| `docs/SECURITY.md:3` | release candidate | B | Refletir fechamento local |
| `docs/SECURITY.md:55` | candidato V1.2: suíte global 610/610 em b | B | Refletir fechamento local |

As 17 correspondências amplas sem pendência de release (recontagem, fechamento de caixa, revisão de situação, estado/revisão técnica e textos de ensaio) são D e foram preservadas. Seus arquivos/linhas: `LEIA-ME.md:14`, `docs/MODULES.md:21`, `RODADA-10.md:130`, `docs/PROJECT_MAP.md:31`, `docs/PROJECT_MAP.md:58`, `public/catalogue-next-ui.js:7`, `docs/SALES_V1_2_MODEL.md:121`, `VERIFICACAO-V0.12.md:55`, `public/inventory-next-ui.js:3`, `public/planning-ui.js:15`, `public/pricing-ui.js:24`, `scripts/report-stock-insert.js:97`, `scripts/report-mirror-balances.js:41`, `scripts/report-stock-balances.js:40`, `scripts/report-stock-balances.js:76`, `scripts/report-balance-lookup.js:41`, `scripts/report-balance-lookup.js:130`.

## Arquivos alterados e históricos preservados

- **Versão/metadado:** somente package.json, campo version.
- **Documentação atual:** AGENTS.md, LEIA-ME.md, ACCESS_V1_2, API, ARCHITECTURE, DATABASE, DECISIONS, FOUNDATION_V1_2_REPORT, FOUNDATION_V1_2_STEPS, MODULES, OFFLINE_EDGE, OPERATIONS_V1_2, PERFORMANCE_V1_2, PROJECT_MAP, PROJECT_MASTER, README, ROADMAP, SALES_V1_2_MODEL, SECURITY, THREAT_MODEL, VERSIONING_LOCAL e VISION, em docs quando não indicado.
- **Changelog:** uma entrada curta acrescentada; entradas anteriores preservadas.
- **Novo Markdown:** este registro de fechamento.

Relatórios V1/V1.1, PRODUCT_DIRECTIONS_REPORT, RECONCILIATION_V1_2, LINK_PORTABILITY_V1_2 e briefings permanecem idênticos ao HEAD inicial. Partida V1.1 em FOUNDATION_V1_2_STEPS e desenho histórico em SALES_V1_2_MODEL mantêm suas versões/resultados antigos. O título original do checkpoint permanece “release candidate homologado”. O corpo anterior do changelog foi preservado depois da nova entrada. Não foram corrigidos favicon, scripts QA ou outros itens por oportunidade.

## Validação proporcional

**Caso B:** a versão é exposta por runtime/API e metadados de backup; não participa de cálculos comerciais, permissões ou decisões de schema. Foram executados cinco testes existentes diretamente relacionados: interface/health e privacidade de assets; publicação de backup; restore isolado real/CLI; recusa de checksum/manifest adulterado; recusa de schema divergente/desconhecido. Resultado: **5/5, zero falhos/ignorados/cancelados**.

Sonda adicional, sem arquivo de teste versionado, usou porta e banco novos isolados em `.qa/foundation-v1.2/closure/`: **quatro verificações aprovadas** — versão HTTP, manifesto de novo backup, relatório de restore e compatibilidade de metadado de backup V1.1. Todos leram/preservaram a versão correta; schema continuou com dez migrations. Nenhum dado operacional foi usado. Artefatos brutos permanecem opcionais/ignorados, sem hyperlinks.

Sintaxe conferida em server.js e backup-service.js; package.json validado por leitura JSON e comparação dos campos com HEAD. Código/testes/SQL/configuração executável não mudaram; a análise não identificou impacto amplo e nenhum teste focado falhou, portanto não houve ampliação para a suíte global. **610/610 permanece a homologação associada ao checkpoint funcional anterior**, não uma suíte executada neste fechamento.

Links conferidos em **84 Markdown**: **797 hyperlinks relativos**, **756 destinos disponíveis**, **47 âncoras válidas**, **zero quebra entre arquivos versionados/candidato**. Os **41 links históricos auxiliares para .qa** permanecem preservados; zero obrigatório para o estado atual. Links externos não foram revalidados. `git diff --check` sem achados.

## Migrations e integridade

Migrations continuam **001–010**, sem 011, com SHA-256 idêntico ao preflight e bytes idênticos ao checkpoint funcional:

| Migration | SHA-256 preservado |
| --- | --- |
| `001_foundation.sql` | `4bcec35e59b9af50975ae4736561039891c26febc61550bf47c2f1995f438ee7` |
| `002_products.sql` | `7fff6835119519962908735eb25339a5754a3904572d7356b70f74c64d2a720b` |
| `003_customers.sql` | `03ae6dcd8471ee46c516ea7fa6f6b8a1843913e9209c93ef2b9fde75ed74ca38` |
| `004_suppliers.sql` | `5eb946a87dac12d6c01e12b3594a9172702a460faf4e7fceb8346846095c8236` |
| `005_purchases.sql` | `bb241a2274d27e9de285508dabee73d2cd55e01422a036fbc54f90e7c7642829` |
| `006_inventory.sql` | `5133ffb46374717a2521d9cc9a5723c23fe1aacbc2e5392ce63d269cec3213e8` |
| `007_inactive_sale_approval.sql` | `443addfe846c976245740030adf2f75c700f181431975b123b0c94de85e0c5a6` |
| `008_access_maintenance.sql` | `465a9c19f18031a636a54a904a81a7602cca02ee95911fa047691355b9fe6de5` |
| `009_sales.sql` | `f4f2ed25ee32dbbe8c8ebb7b1b85fff2931de1902da9f9279d99cdd176150b02` |
| `010_stock_receipt_fk_index.sql` | `2b41117b7da528abd6b0a7b1a0a19c9f28c64d0e3d3d6e46db61611b7d1286b9` |

**247 arquivos versionados fora de Markdown/package.json idênticos ao HEAD inicial e ao checkpoint funcional** por hash Git; código, testes, SQL, scripts e configurações preservados. SHA-256 das dez migrations coincidente com o preflight. Em package.json, comparação JSON confirma que somente `version` mudou; dependências e demais campos são idênticos. Comparação de todos os hashes iniciais identificou somente os 24 arquivos autorizados já versionados; este registro é o único arquivo novo versionável.

## Diff e registro Git

`git diff --stat` antes do staging (24 arquivos já versionados; este registro novo fica fora dessa saída):

```text
 AGENTS.md                      |  2 +-
 LEIA-ME.md                     |  2 +-
 docs/ACCESS_V1_2.md            |  2 +-
 docs/API.md                    |  4 ++--
 docs/ARCHITECTURE.md           |  4 ++--
 docs/CHANGELOG_ARCHITECTURE.md |  4 ++++
 docs/DATABASE.md               |  4 ++--
 docs/DECISIONS.md              |  6 +++---
 docs/FOUNDATION_V1_2_REPORT.md |  6 +++---
 docs/FOUNDATION_V1_2_STEPS.md  |  8 ++++----
 docs/MODULES.md                |  2 +-
 docs/OFFLINE_EDGE.md           |  2 +-
 docs/OPERATIONS_V1_2.md        |  2 +-
 docs/PERFORMANCE_V1_2.md       |  2 +-
 docs/PROJECT_MAP.md            |  6 +++---
 docs/PROJECT_MASTER.md         |  6 +++---
 docs/README.md                 |  8 ++++----
 docs/ROADMAP.md                | 10 +++++-----
 docs/SALES_V1_2_MODEL.md       |  4 ++--
 docs/SECURITY.md               |  4 ++--
 docs/THREAT_MODEL.md           |  2 +-
 docs/VERSIONING_LOCAL.md       |  2 +-
 docs/VISION.md                 |  2 +-
 package.json                   |  2 +-
 24 files changed, 50 insertions(+), 46 deletions(-)
```

Classificação do conjunto completo: **um metadado de versão e 24 Markdown**, incluindo este novo registro. Nenhum código de domínio/teste/SQL/migration/script QA alterado ou removido. Staging limitado nominalmente a esses arquivos, com `git diff --cached --check` também exigido antes do commit.

Um commit local de fechamento: **Fundação V1.2: fechar versão 1.2.0-foundation.1**, pai `33b4efc80bc0f3edf9c4b76873719d06e49cc323`. Tag anotada **v1.2.0-foundation.1** aponta exatamente para esse commit. Commit/árvore/alvo da tag são obtidos após o registro final e informados na entrega; não se insere no próprio commit um hash que depende de seu conteúdo.

Estado esperado e conferido após commit/tag: working tree limpa, staged vazio, versão **1.2.0-foundation.1**, migrations **001–010**, nenhum push. Baseline anterior preservada.

## Aceite das condições B e próxima fase

Murilo autorizou o fechamento local com snapshots transitórios, Caixa/Financeiro sem normalização completa, escrita custosa nas massas grandes, RSS/memória para acompanhamento, restore apenas sintético, favicon ausente e capacidades futuras fora da V1.2. [Condições e métricas](FOUNDATION_V1_2_REPORT.md), [desempenho](PERFORMANCE_V1_2.md), [operação](../../atual/OPERATIONS_V1_2.md). Não houve suavização nem reclassificação de B.

Fechamento local não certifica produção comercial/cloud, SLA, DR de produção, ausência de leak ou normalização integral. V1.3 continua **próxima fase planejada**, sem execução iniciada. Recomendação: definir uma prioridade e critérios de aceite para snapshot/escrita, Caixa/Financeiro, acompanhamento de memória ou recuperação operacional, conforme [ROADMAP](../../atual/ROADMAP.md), mediante nova ordem.
