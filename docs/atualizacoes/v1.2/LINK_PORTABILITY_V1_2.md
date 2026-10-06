# Auditoria de portabilidade dos links locais — Fundação V1.2

**03/10/2026 — somente documentação.** HEAD preservado: `2a2177c7b80734722f71bd9e72029cf9e1b39df0`. Versão **1.1.0-foundation.1**, migrations **001–010**, classificação **B**, **610/610 aprovados**: fatos da homologação existente, sem nova execução.

## Escopo e resultado

Inventário inicial: **82 Markdown** (80 versionados e dois candidatos da reconciliação), em todo o repositório, inclusive raiz, especialistas e briefings. Foram encontrados **62 hyperlinks para .qa em 15 documentos**, todos locais/ignorados. Não foram encontrados outros hyperlinks para arquivos ignorados, logs, bancos, capturas ou relatórios locais fora de `.qa`. O link para `agents/` é portátil: o diretório é representado por seus arquivos versionados.

**21 links atuais tratados:** zero referências apagadas; **17 conversões para texto sem hyperlink**; **quatro substituições por FOUNDATION_V1_2_REPORT.md**. Os caminhos das fontes brutas foram conservados como texto opcional, inclusive nas quatro substituições. Restam **41 hyperlinks históricos auxiliares para .qa**, todos classe A, **zero obrigatório para o estado atual**. Seus destinos estarão ausentes em clone limpo; essa limitação da evidência histórica privada é explícita, sem tratá-los como links disponíveis nesse clone.

Somente estes quatro documentos receberam ajustes nesta auditoria: [PROJECT_MAP](../../atual/PROJECT_MAP.md), [PERFORMANCE_V1_2](PERFORMANCE_V1_2.md), [FOUNDATION_V1_2_REPORT](FOUNDATION_V1_2_REPORT.md) e [RECONCILIATION_V1_2](RECONCILIATION_V1_2.md). Este inventário é o quinto documento da tarefa. Trabalho documental anterior preservado.

## Decisão por classe e suficiência dos resumos

- **A — 45:** evidência bruta auxiliar. 41 referências históricas preservadas, três referências antigas no mapa atual e um perfil intermediário de desempenho convertidos em texto.
- **B — 17:** informação necessária ao estado oficial, já representada nos resumos versionados; o acesso ao artefato bruto é opcional. 13 referências convertidas em texto e quatro substituídas pelo resumo oficial.
- **C — zero:** nenhum artefato privado precisa ser versionado nesta tarefa. Resultados, métodos e limites úteis já estão nos documentos; logs/capturas/bancos brutos não acrescentam informação necessária à navegação oficial. Não houve cópia ou inclusão de `.qa` no Git.
- **D — zero:** todas as referências têm função de rastreabilidade; nenhuma foi apagada.

[Estado consolidado](FOUNDATION_V1_2_REPORT.md) representa checkpoint, versão, migrations, B/610, seis agregados, arquitetura, segurança, restore sintético e limitações. [Desempenho](PERFORMANCE_V1_2.md) representa métodos, matrizes separadas, medições finais e limites de RSS/escrita. [Vendas](../../atual/SALES_V1_2_MODEL.md), [acesso](../../atual/ACCESS_V1_2.md), [segurança](../../atual/SECURITY.md) e [operação](../../atual/OPERATIONS_V1_2.md) detalham seus contratos. Código, testes e migrations versionados continuam como fontes da implementação. Os documentos não prometem reconstituir as capturas privadas originais sem seus artefatos.

## Inventário inicial completo

As linhas identificam as ocorrências **antes desta auditoria**. Em “essencial”, classe B significa informação essencial **resumida em documento versionado**, nunca obrigação de abrir o arquivo bruto; classe A não é essencial. Todos os 62 destinos estavam presentes localmente, mas **nenhum estará disponível em clone limpo**. Caminhos abaixo são texto, sem criar novos hyperlinks privados.

| Documento / linha | Seção | Destino local | Função | Classe / essencial | Clone limpo | Tratamento |
| --- | --- | --- | --- | --- | --- | --- |
| `docs/CHANGELOG_ARCHITECTURE.md:52` | 01/10/2026 — Fundação documental sobre V0.12.0 | `.qa/foundation-docs/verification.json` | .qa/foundation-docs/verification.json | A / não | Não | Preservado — histórico auxiliar |
| `docs/DATABASE.md:36` | Mapeamento histórico da V0.12.0 — passo 2 | `.qa/foundation-v1/legacy-schema.json` | Evidência estrutural sem valores pessoais | A / não | Não | Preservado — histórico auxiliar |
| `docs/DATABASE_SCHEMA_V0.12.md:2341` | Evidência reproduzível | `.qa/foundation-v1/legacy-schema.json` | Inventário sem valores | A / não | Não | Preservado — histórico auxiliar |
| `docs/DATABASE_SCHEMA_V0.12.md:2341` | Evidência reproduzível | `.qa/foundation-v1/legacy-schema-fixtures.json` | Captura de tipos nos testes | A / não | Não | Preservado — histórico auxiliar |
| `docs/DATABASE_SCHEMA_V0.12.md:2341` | Evidência reproduzível | `.qa/foundation-v1/schema-tests.txt` | Resultado dos205 testes | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_1_MODEL.md:35` | Migração, conferência e recuperação | `.qa/foundation-v1.1/pre-upgrade.sqlite` | pre-upgrade.sqlite | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_1_REPORT.md:52` | Interface conferida | `.qa/foundation-v1.1/quick-view-product.png` | produto | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_1_REPORT.md:52` | Interface conferida | `.qa/foundation-v1.1/inactive-sale-confirmed.png` | venda autorizada | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_1_REPORT.md:52` | Interface conferida | `.qa/foundation-v1.1/financial-profile.png` | perfil financeiro | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_1_REPORT.md:52` | Interface conferida | `.qa/foundation-v1.1/stock-authorization-history.png` | histórico de estoque | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_1_REPORT.md:56` | Evidências e correções | `.qa/foundation-v1.1/final-tests.txt` | final-tests.txt | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_1_REPORT.md:61` | Evidências e correções | `.qa/foundation-v1.1/verification-final.json` | verification-final.json | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_1_REPORT.md:67` | Atualização operacional e recuperação | `.qa/foundation-v1.1/release-ensayo.json` | Ensaio de atualização | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_1_REPORT.md:67` | Atualização operacional e recuperação | `.qa/foundation-v1.1/operational-release.json` | Conferência operacional | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_1_REPORT.md:67` | Atualização operacional e recuperação | `.qa/foundation-v1.1/operational-equivalence.json` | equivalência | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_MIGRATION.md:70` | Ensaio local executado | `.qa/foundation-v1/migration-copy-report.json` | Relatório de importação | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_MIGRATION.md:71` | Ensaio local executado | `.qa/foundation-v1/migration-copy-verification.json` | Conferência isolada | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_MIGRATION.md:72` | Ensaio local executado | `.qa/foundation-v1/migration-copy-tests.tap` | Resultado da suíte | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_MIGRATION.md:73` | Ensaio local executado | `.qa/foundation-v1/migration-copy-source-hash.json` | Comparação de hashes de origem/cópia | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_QA.md:12` | Resultado observado | `.qa/foundation-v1/qa-http-final.txt` | HTTP final desta rodada | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_QA.md:12` | Resultado observado | `.qa/foundation-v1/qa-regression-final.txt` | regressão completa | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_QA.md:12` | Resultado observado | `.qa/foundation-v1/qa-summary.json` | resumo com hashes | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_REPORT.md:32` | Evidências e alcance | `.qa/foundation-v1/final-tests.txt` | Suíte completa final: 302/302 | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_REPORT.md:34` | Evidências e alcance | `.qa/foundation-v1/final-http-cache.txt` | Rechecagem HTTP final: 27/27 | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_REPORT.md:38` | Evidências e alcance | `.qa/foundation-v1/integrity-final.json` | Integridade da baseline e do original | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_REPORT.md:38` | Evidências e alcance | `.qa/foundation-v1/verification-final.json` | verificações de sintaxe/links/padrões de secrets | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_REPORT.md:42` | Evidências e alcance | `.qa/foundation-v1/visual-products.png` | Produtos | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_REPORT.md:42` | Evidências e alcance | `.qa/foundation-v1/visual-sales.png` | Vendas | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_REPORT.md:42` | Evidências e alcance | `.qa/foundation-v1/visual-admin.png` | Usuários e acessos | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_REPORT.md:66` | Para abrir | `.qa/foundation-v1/operational-summary.json` | operational-summary.json | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_REPORT.md:66` | Para abrir | `.qa/foundation-v1/first-access-ready.png` | Captura do primeiro acesso | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_STEPS.md:30` | Baseline | `.qa/foundation-v1/baseline-v0.12.0/MANIFEST.json` | Manifesto | A / não | Não | Preservado — histórico auxiliar |
| `docs/FOUNDATION_V1_STEPS.md:30` | Baseline | `.qa/foundation-v1/baseline-tests.txt` | testes | A / não | Não | Preservado — histórico auxiliar |
| `docs/INITIAL_DIAGNOSIS.md:46` | Validação desta entrega | `.qa/foundation-docs/unit-results.txt` | .qa/foundation-docs/unit-results.txt | A / não | Não | Preservado — histórico auxiliar |
| `docs/INITIAL_DIAGNOSIS.md:46` | Validação desta entrega | `.qa/foundation-docs/verification.json` | .qa/foundation-docs/verification.json | A / não | Não | Preservado — histórico auxiliar |
| `docs/INITIAL_DIAGNOSIS.md:48` | Validação desta entrega | `.qa/round10/final-results.json` | .qa/round10/final-results.json | A / não | Não | Preservado — histórico auxiliar |
| `docs/PERFORMANCE_V1_2.md:42` | Normalização de Sales — benchmark interno posterior, histórico | `.qa/foundation-v1.2/benchmarks/before.json` | before | B / informação sim; bruto não | Não | Referência textual |
| `docs/PERFORMANCE_V1_2.md:42` | Normalização de Sales — benchmark interno posterior, histórico | `.qa/foundation-v1.2/benchmarks/after.json` | after | B / informação sim; bruto não | Não | Referência textual |
| `docs/PERFORMANCE_V1_2.md:56` | Índice FK 010 — ensaio pareado próprio | `.qa/foundation-v1.2/receipt-fk/paired-RgTJiF/RELATORIO.md` | Relatório | B / informação sim; bruto não | Não | Referência textual |
| `docs/PERFORMANCE_V1_2.md:66` | Otimizações locais posteriores — matrizes separadas | `.qa/foundation-v1.2/stock-insert/paired-1OPINP/RELATORIO.md` | Ensaio INSERT | B / informação sim; bruto não | Não | Referência textual |
| `docs/PERFORMANCE_V1_2.md:67` | Otimizações locais posteriores — matrizes separadas | `.qa/foundation-v1.2/stock-balances/paired-I496oL/RELATORIO.md` | Ensaio saldos | B / informação sim; bruto não | Não | Referência textual |
| `docs/PERFORMANCE_V1_2.md:68` | Otimizações locais posteriores — matrizes separadas | `.qa/foundation-v1.2/mirror-balances/paired-QE1nDi/RELATORIO.md` | Ensaio verificador | B / informação sim; bruto não | Não | Referência textual |
| `docs/PERFORMANCE_V1_2.md:69` | Otimizações locais posteriores — matrizes separadas | `.qa/foundation-v1.2/balance-lookup/paired-1FtRrU/RELATORIO.md` | Ensaio lookup | B / informação sim; bruto não | Não | Referência textual |
| `docs/PERFORMANCE_V1_2.md:71` | Otimizações locais posteriores — matrizes separadas | `.qa/foundation-v1.2/sync-inventory/profile-zuOEaO/RELATORIO.md` | perfil isolado de syncInventory | A / não | Não | Referência textual |
| `docs/PERFORMANCE_V1_2.md:75` | Sanity HTTP final homologado — comparação compatível | `.qa/foundation-v1.2/homologation/rc-Ip8azD/RELATORIO.md` | homologação | B / informação sim; bruto não | Não | Resumo versionado + caminho textual |
| `docs/PERFORMANCE_V1_2.md:75` | Sanity HTTP final homologado — comparação compatível | `.qa/foundation-v1.2/homologation/rc-Ip8azD/performance-sanity.json` | comparação/amostras | B / informação sim; bruto não | Não | Referência textual |
| `docs/PERFORMANCE_V1_2.md:75` | Sanity HTTP final homologado — comparação compatível | `.qa/foundation-v1.2/benchmarks/http-ltEFZX/report.json` | baseline HTTP | B / informação sim; bruto não | Não | Referência textual |
| `docs/PERFORMANCE_V1_2.md:75` | Sanity HTTP final homologado — comparação compatível | `.qa/foundation-v1.2/benchmarks/http-fEJpoi/report.json` | resultado atual | B / informação sim; bruto não | Não | Referência textual |
| `docs/PRODUCT_DIRECTIONS_REPORT.md:7` | Estado real recuperado | `.qa/foundation-v1.1/operational-release.json` | evidência operacional | A / não | Não | Preservado — histórico auxiliar |
| `docs/PRODUCT_DIRECTIONS_REPORT.md:11` | Estado real recuperado | `.qa/product-directions/health.json` | health consultado nesta tarefa | A / não | Não | Preservado — histórico auxiliar |
| `docs/PRODUCT_DIRECTIONS_REPORT.md:13` | Estado real recuperado | `.qa/product-directions/tests.txt` | saída | A / não | Não | Preservado — histórico auxiliar |
| `docs/PRODUCT_DIRECTIONS_REPORT.md:54` | Verificação e próxima tarefa | `.qa/product-directions/verification.json` | verification.json | A / não | Não | Preservado — histórico auxiliar |
| `docs/PRODUCT_DIRECTIONS_REPORT.md:54` | Verificação e próxima tarefa | `.qa/product-directions/source-verification.json` | Briefing preservado byte a byte | A / não | Não | Preservado — histórico auxiliar |
| `docs/PROJECT_MAP.md:54` | Pontos de entrada e dependências | `.qa/foundation-docs/baseline.json` | .qa/foundation-docs/baseline.json | A / não | Não | Referência textual |
| `docs/PROJECT_MAP.md:68` | Verificação e recuperação de contexto | `.qa/foundation-docs/unit-results.txt` | .qa/foundation-docs/unit-results.txt | A / não | Não | Referência textual |
| `docs/PROJECT_MAP.md:69` | Verificação e recuperação de contexto | `.qa/round10/final-results.json` | .qa/round10/final-results.json | A / não | Não | Referência textual |
| `docs/FOUNDATION_V1_2_REPORT.md:12` | Identidade e resultado homologado | `.qa/foundation-v1.2/homologation/rc-Ip8azD/RELATORIO.md` | relatório da homologação | B / informação sim; bruto não | Não | Referência textual |
| `docs/FOUNDATION_V1_2_REPORT.md:12` | Identidade e resultado homologado | `.qa/foundation-v1.2/homologation/rc-Ip8azD/full-final-result.json` | resultado global final | B / informação sim; bruto não | Não | Referência textual |
| `docs/FOUNDATION_V1_2_REPORT.md:12` | Identidade e resultado homologado | `.qa/foundation-v1.2/homologation/rc-Ip8azD/CHECKPOINT_GIT.md` | conferência do checkpoint | B / informação sim; bruto não | Não | Referência textual |
| `docs/RECONCILIATION_V1_2.md:9` | 1. Preflight e autoridade | `.qa/foundation-v1.2/homologation/rc-Ip8azD/RELATORIO.md` | homologação | B / informação sim; bruto não | Não | Resumo versionado + caminho textual |
| `docs/RECONCILIATION_V1_2.md:9` | 1. Preflight e autoridade | `.qa/foundation-v1.2/homologation/rc-Ip8azD/CHECKPOINT_GIT.md` | checkpoint | B / informação sim; bruto não | Não | Resumo versionado + caminho textual |
| `docs/RECONCILIATION_V1_2.md:9` | 1. Preflight e autoridade | `.qa/foundation-v1.2/homologation/rc-Ip8azD/full-final-result.json` | resultado final | B / informação sim; bruto não | Não | Resumo versionado + caminho textual |

Documentos envolvidos (15): `docs/CHANGELOG_ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/DATABASE_SCHEMA_V0.12.md`, `docs/FOUNDATION_V1_1_MODEL.md`, `docs/FOUNDATION_V1_1_REPORT.md`, `docs/FOUNDATION_V1_MIGRATION.md`, `docs/FOUNDATION_V1_QA.md`, `docs/FOUNDATION_V1_REPORT.md`, `docs/FOUNDATION_V1_STEPS.md`, `docs/INITIAL_DIAGNOSIS.md`, `docs/PERFORMANCE_V1_2.md`, `docs/PRODUCT_DIRECTIONS_REPORT.md`, `docs/PROJECT_MAP.md`, `docs/FOUNDATION_V1_2_REPORT.md`, `docs/RECONCILIATION_V1_2.md`.

## Validação conceitual do clone limpo

**83 documentos Markdown** conferidos: **788 hyperlinks relativos**, sendo **747 destinos disponíveis** no conjunto versionado/candidato e **41 referências históricas privadas opcionais**. **47 âncoras conferidas**, **zero destino ou âncora quebrado entre arquivos versionados/candidatos**, zero hyperlink obrigatório para `.qa`. Os quatro documentos atuais ajustados ficaram sem hyperlink para `.qa`; os 41 remanescentes aparecem apenas nas seções históricas inventariadas.

O conjunto disponível foi definido por `git ls-files` mais os três novos Markdown candidatos. Arquivos ignorados não foram adicionados à disponibilidade nem usados para aprovar destinos. Diretórios só contam como disponíveis quando contêm arquivos desse conjunto. Foram conferidos hyperlinks relativos, imagens e âncoras Markdown; links externos ficaram fora do escopo. Os 41 destinos históricos privados são exceções auxiliares inventariadas, e não foram contabilizados como links válidos entre arquivos versionados.

Os checks locais da seção 10 da reconciliação anterior (49 documentos/731 links e existência local de 62 artefatos) permanecem como registro daquela tarefa. Não equivalem a esta validação de portabilidade.

## Preservação e diff

**248 arquivos versionados fora de Markdown idênticos aos objetos de HEAD**, por hash Git: código, testes, SQL/migrations, scripts, package.json e configuração preservados. Comparação SHA-256 com o início desta auditoria identificou apenas os quatro Markdown ajustados e este novo relatório; todos os demais arquivos previamente presentes, inclusive referências históricas, foram preservados. HEAD inalterado, staged vazio, `git diff --check` sem achados. Somente Markdown modificado/criado.

`git diff --stat` cumulativo contra HEAD, incluindo o trabalho anterior já presente:

```text
 AGENTS.md                            |  2 +-
 LEIA-ME.md                           | 16 ++++----
 docs/ACCESS_V1_2.md                  |  6 +--
 docs/API.md                          | 27 ++++++++++---
 docs/ARCHITECTURE.md                 | 18 +++++----
 docs/CHANGELOG_ARCHITECTURE.md       |  8 ++++
 docs/DATABASE.md                     | 26 ++++++++-----
 docs/DECISIONS.md                    | 19 +++++++--
 docs/FOUNDATION_V1_1_APPROVAL.md     |  2 +
 docs/FOUNDATION_V1_1_MODEL.md        |  2 +
 docs/FOUNDATION_V1_1_REGISTRATION.md |  2 +
 docs/FOUNDATION_V1_2_STEPS.md        | 19 +++++----
 docs/FOUNDATION_V1_AUTH.md           |  2 +
 docs/MODULES.md                      | 21 +++++-----
 docs/OFFLINE_EDGE.md                 |  2 +-
 docs/OPERATIONS_V1_2.md              | 10 +++--
 docs/PERFORMANCE_V1_2.md             | 74 +++++++++++++++++++++++++++++++++---
 docs/PROJECT_MAP.md                  | 30 +++++++++++----
 docs/PROJECT_MASTER.md               | 16 +++++---
 docs/README.md                       | 18 ++++++++-
 docs/ROADMAP.md                      | 31 ++++++++++-----
 docs/SALES_V1_2_MODEL.md             | 18 ++++++++-
 docs/SECURITY.md                     | 30 +++++++++------
 docs/THREAT_MODEL.md                 | 18 ++++-----
 docs/VERSIONING_LOCAL.md             |  2 +
 docs/VISION.md                       |  2 +-
 26 files changed, 305 insertions(+), 116 deletions(-)
```

O comando não inclui os três novos Markdown sem staging: FOUNDATION_V1_2_REPORT.md e RECONCILIATION_V1_2.md vieram da tarefa anterior; LINK_PORTABILITY_V1_2.md foi criado agora. Conjunto documental pendente: **26 modificados + três novos**, todos Markdown. Esta auditoria alterou quatro documentos e criou um; não é responsável por todas as alterações cumulativas.

Sem commit, staging, tag, push, mudança de versão, execução de suíte funcional ou nova homologação. Tarefa encerrada na entrega documental.
