# Histórico de arquitetura e documentação

## 05/10/2026 — Fase B / IDP-001, revisão pendente

Correção isolada de `POST /api/sales`: identidade obrigatória, fingerprint canônico compartilhado/contextualizado no campo existente, replay sem escrita e colisão recusada. Consumidor básico congela payload na revisão para preservar retry após reconexão. Conversões internas, regras comerciais, migrations e históricos preservados. TDD e testes isolados registrados no [relatório](../atualizacoes/fase-b/IDP_001_REPORT.md). Sem commit/push; nenhuma fase seguinte iniciada.

## 05/10/2026 — Sincronização de governança com Documento Mestre v1.0

Somente documentos: referência conceitual oficial na raiz preservada; antigo PROJECT_MASTER convertido em índice de estado/governança; mestre e roadmap anteriores arquivados com navegação; AGENTS atualizado com TDD/integridade/fronteiras/aprovação; mapa modular e plano A–G reconciliados; auditoria anterior registrada e reclassificada. Documentos vigentes de visão/arquitetura/banco/API/segurança/ameaças/offline/integrações e índices receberam contexto atual, incluindo React parcial.

Decisões [G-001–G-004](DECISIONS.md), [mestre](../../Documento_Mestre_Sistema_Comercial_v1.0.md), [pedido](../briefings/GOVERNANCE_SYNC_SOURCE_2026_10_05.md), [auditoria](../auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md) e [plano](ROADMAP.md). Próxima proposta única: replay da venda legada, sem implementação. Conteúdo histórico V1.1/V1.2/V1.3 não reescrito. Código/testes/migrations/dependências/versão/tag/dados não alterados. Verificação documental: links novos/alterados, diff/escopo e hashes de preservação; sem nova homologação comercial ou benchmark. Sem commit/push.

## 03/10/2026 — Fechamento local da Fundação V1.2, 1.2.0-foundation.1

Fundação V1.2 fechada localmente, tag anotada `v1.2.0-foundation.1`, homologação preservada **B, 610/610**, migrations **001–010**. Condições conhecidas aceitas neste escopo: snapshot/Caixa/Financeiro, escrita/RSS, restore apenas sintético, favicon ausente e capacidades futuras. Sem nova homologação, alteração comercial ou push. [Estado e limites](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md).

## 03/10/2026 — reconciliação documental do candidato Fundação V1.2

Documentos oficiais reconciliados com checkpoint `2a2177c7b80734722f71bd9e72029cf9e1b39df0`, homologação **B, 610/610**, migrations **001–010**. Consolidados seis agregados SQL, leituras de Vendas sem payload integral/escritas transitórias, manutenção de acesso, Git, backup/retenção/restore sintético e matrizes de desempenho separadas. Arquitetura/banco/API/segurança/roadmap/mapa/mestre/passos/AGENTS/índice/manual e referências de estado atual alinhados.

Históricos V0.12/V1/V1.1, desenhos prévios, briefings e evidências originais preservados com seu escopo/contagens. Estado oficial consolidado em [FOUNDATION_V1_2_REPORT](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md), verificações/diff em [RECONCILIATION_V1_2](../atualizacoes/v1.2/RECONCILIATION_V1_2.md). Classificação B permanece; snapshot/custo de escrita/RSS/restore operacional/futuro não viraram garantias.

Somente documentação; sem JS/SQL/testes/configuração/dados alterados, sem nova suíte global por ritual. Versão **1.1.0-foundation.1** preservada, sem commit/tag/push/fechamento formal ou nova fase.

## 02/10/2026 — Printing & Devices / Commerce Hub, revisão documental

Incorporadas duas áreas **PLANEJADAS** à visão oficial; briefing integral preservado, documentos [Printing](PRINTING_AND_DEVICES.md) e [Commerce](COMMERCE_HUB.md) criados e referências/impactos atualizados em mestre, mapa, visão, arquitetura, módulos, roadmap, integrações, banco, segurança, ameaças, API, Edge e índice. Decisões D-019..D-022 registram fronteiras, efeitos externos, compatibilidade e pendências.

Revisão confirmou decimal textual exato preparatório, operação inteira atual, catálogo por unidade, agregados SQL e snapshots restantes. Não houve mudança executável/schema/banco por esta tarefa. Durante a revisão outra execução encerrou a V1.1 e atualizou versão/estado operacional; os arquivos foram relidos e preservados. Ver [relatório desta tarefa](../historico/PRODUCT_DIRECTIONS_REPORT.md), regressão isolada 457/457 e conferência de links. Nenhum driver, marketplace ou Edge completo foi implementado.

## 02/10/2026 — Fundação V1.1 local, 1.1.0-foundation.1

Dez passos autorizados concluídos: leituras por perfil e SQL paginado; cinco agregados normalizados (migrations 002..006); autorização de inativo por senha/direito/motivo e consumo transacional (007); cadastros menores; quick views, autoria no estoque, fonte única de custo, Receber compra contextual e filtros visíveis. Mantidos IDs, extras, ausência/null, históricos e espelhos conferidos.

Corrigidos achados de equivalência, invariantes de estoque, colisão do ID comercial de Caixa com autoridade da sessão, versão stale, eventos do modal, invalidação de autorização, carregamento do novo script e data civil. Regressão final: **457/457**. Conferência visual em base isolada com 121 produtos e perfis distintos; cópia SQLite consistente e ensaio de atualização antes da aplicação operacional. [Relatório/evidências](../atualizacoes/v1.1/FOUNDATION_V1_1_REPORT.md).

Vendas/Caixa/Financeiro ainda em snapshot; ponte avançada, reconstrução integral/desempenho, recuperação, Git e backup automático continuam pendentes. Sem cloud/Edge/executável/fiscal/cobrança.


## 02/10/2026 — Fundação V1 local, 1.0.0-foundation.1

**Escopo autorizado:** vinte passos em ordem, novos especialistas necessários, diretor/tester antigos desativados.

- Preservada baseline V0.12 e origem JSON; mapeadas 42 coleções e importação SQL conferida sem alteração de IDs, centavos ou autoria histórica.
- Adotado SQLite nativo, SQL parametrizado e migrations checksum; persistência ativa em `data/foundation.sqlite`.
- Implementados usuários Argon2id, empresas/unidades, vínculos, RBAC, sessão/CSRF/contexto e administração local; bootstrap sem senha padrão.
- Integrado domínio legado à transação de leitura atual/snapshot/índice/auditoria, com resposta após commit e rollback completo.
- Preparados executor/aprovador sem liberar exceções; nova auditoria append-only/hash não é inviolável contra administrador do arquivo.
- Interface preservada, login real, seletor de contexto, acessos/auditoria e rascunhos separados por identidade/unidade; exports vinculados à sessão/escopo.
- Atualizados documentos atuais; diagnóstico, mapa V0.12 e briefings originais preservados como histórico.

Resultado exato, verificações isoladas, limites e evidências: [FOUNDATION_V1_REPORT](../atualizacoes/fundacao-v1/FOUNDATION_V1_REPORT.md). Cloud, Edge, cobrança, instalador, fiscal completo e novos nichos/integrações não foram implementados. Git, backup operacional, recuperação de senha e aprovação excepcional continuam pendentes.

## 01/10/2026 — Fundação documental sobre V0.12.0

**Escopo autorizado:** criar os agentes especializados e documentos após interpretação dos dois textos enviados pelo Murilo.

- Criados AGENTS.md e dez definições permanentes em agents/, com seleção por tarefa, responsabilidades, entradas, entregas e limites.
- Criada memória oficial em docs/: documento mestre, visão, diagnóstico, mapa, arquitetura, banco, módulos, segurança, ameaças, API, integrações, offline, roadmap e decisões.
- Preservados integralmente os dois briefings de origem em docs/briefings/.
- Registrada direção futura de monólito modular, servidor central, cliente Windows e Edge opcional, separada do protótipo atual.
- Preservadas as anotações do passeio e explicitadas as pendências de custo, quick views, filtros, compras e autorização.
- Documentado que o tester continua pausado e os novos arquivos não iniciam ciclos automaticamente.
- Executados novamente os 205 testes existentes de regras: todos passaram. Ver [evidências](../atualizacoes/fundacao-v1/INITIAL_DIAGNOSIS.md).

**Arquitetura executável:** sem alteração. **Versão:** permanece 0.12.0. Nenhuma nova função, autenticação, migração, cobrança, cloud, sincronização ou implantação foi implementada. Preservação dos arquivos de aplicação e do banco local é conferida por hash em [.qa/foundation-docs/verification.json](../../.qa/foundation-docs/verification.json).

## Histórico anterior

[ARQUITETURA.md](../historico/v0/ARQUITETURA.md), [EVOLUCAO.md](../historico/v0/EVOLUCAO.md), relatórios RODADA da raiz e verificações anteriores permanecem disponíveis. Eles registram evolução do protótipo; não comprovam implantação SaaS ou segurança de capacidades ainda planejadas.

## Próximas entradas

Registrar somente mudanças efetuadas, com data, escopo, decisão relacionada, impacto, migração/compatibilidade quando houver e verificação real. Mudanças propostas ficam no roadmap e nas decisões pendentes até implementação.
