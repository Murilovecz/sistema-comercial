# Documentação do projeto

O [Documento Mestre v1.0 na raiz](../Documento_Mestre_Sistema_Comercial_v1.0.md) é a única referência conceitual oficial. Código/testes definem a implementação; [governança e estado](atual/PROJECT_MASTER.md) e [mapa](atual/PROJECT_MAP.md) explicam o código. Confira **ATUAL**, **PLANEJADO** e **A DEFINIR**. O [roadmap A–G](atual/ROADMAP.md) substitui o plano anterior. A/B possuem checkpoints aprovados; a rodada C/ORG-001 é somente análise e especificação, sem autorização de código ou migrations.

A Fundação V1.2 está fechada localmente: versão **1.2.0-foundation.1**, tag `v1.2.0-foundation.1`, homologação **B — condicional, 610/610**, migrations **001–010**. A **base React V1.3 já foi parcialmente implementada**, sem módulo comercial ou homologação final. A retomada depende das fundações do plano vigente.

## Documentação atual

| Referências em [atual/](atual/) | Assunto |
| --- | --- |
| [Governança/estado](atual/PROJECT_MASTER.md), [visão](atual/VISION.md), [mapa](atual/PROJECT_MAP.md), [módulos](atual/MODULES.md) | Estado, direção e localização do sistema |
| [Arquitetura](atual/ARCHITECTURE.md), [banco](atual/DATABASE.md), [API](atual/API.md) | Contratos e implementação vigente |
| [Segurança](atual/SECURITY.md), [ameaças](atual/THREAT_MODEL.md), [acesso](atual/ACCESS_V1_2.md) | Identidade, autorização e limites |
| [Operação](atual/OPERATIONS_V1_2.md), [versionamento local](atual/VERSIONING_LOCAL.md), [Vendas](atual/SALES_V1_2_MODEL.md) | Procedimentos e contratos atuais originados na V1.2 |
| [Decisões](atual/DECISIONS.md), [changelog](atual/CHANGELOG_ARCHITECTURE.md), [roadmap](atual/ROADMAP.md) | Decisões, registros e sequência de evolução |
| [Integrações](atual/INTEGRATIONS.md), [offline/Edge](atual/OFFLINE_EDGE.md), [impressão/dispositivos](atual/PRINTING_AND_DEVICES.md), [Commerce Hub](atual/COMMERCE_HUB.md) | Direções futuras e escolhas abertas |

O nome de um arquivo pode conservar a versão em que ele surgiu; isso não o torna histórico quando ainda descreve um contrato vigente. Direções planejadas não são funcionalidades implementadas.

## Auditoria e fontes da sincronização

[Auditoria anterior preservada e reclassificada](auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md); [pedido do proprietário](briefings/GOVERNANCE_SYNC_SOURCE_2026_10_05.md); [mestre anterior arquivado](historico/PROJECT_MASTER_PRE_V1_0_2026_10_05.md); [roadmap anterior arquivado](historico/ROADMAP_PRE_V1_0_2026_10_05.md). Documentos derivados não substituem o mestre. DOCX é a representação formatada citada nele, não um arquivo adicional conferido nesta rodada.

## Atualizações e fases

Os registros em [atualizacoes/](atualizacoes/) preservam escopo, data, resultados e fontes de cada fase. Uma atualização antiga não substitui a referência atual quando ambos tratam do mesmo tema. Registros de V1.1/V1.2/V1.3 são preservados: inventários/contratos úteis continuam referências técnicas quando compatíveis, mas seus planos não autorizam execução e são subordinados ao mestre/roadmap vigentes.

| Fase | Entradas |
| --- | --- |
| [Fundação V1](atualizacoes/fundacao-v1/) | [Diagnóstico](atualizacoes/fundacao-v1/INITIAL_DIAGNOSIS.md), [passos](atualizacoes/fundacao-v1/FOUNDATION_V1_STEPS.md), [relatório](atualizacoes/fundacao-v1/FOUNDATION_V1_REPORT.md), [briefing](atualizacoes/fundacao-v1/FOUNDATION_V1_SOURCE.md) |
| [V1.1](atualizacoes/v1.1/) | [Relatório](atualizacoes/v1.1/FOUNDATION_V1_1_REPORT.md), [passos](atualizacoes/v1.1/FOUNDATION_V1_1_STEPS.md), [ajustes do passeio](atualizacoes/v1.1/AJUSTES-DO-PASSEIO.md), [briefing](atualizacoes/v1.1/FOUNDATION_V1_1_SOURCE.md) |
| [V1.2](atualizacoes/v1.2/) | [Estado e homologação](atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md), [fechamento](atualizacoes/v1.2/FOUNDATION_V1_2_CLOSURE.md), [passos](atualizacoes/v1.2/FOUNDATION_V1_2_STEPS.md), [performance](atualizacoes/v1.2/PERFORMANCE_V1_2.md), [reconciliação](atualizacoes/v1.2/RECONCILIATION_V1_2.md), [portabilidade](atualizacoes/v1.2/LINK_PORTABILITY_V1_2.md), [briefing](atualizacoes/v1.2/FOUNDATION_V1_2_SOURCE.md) |
| [V1.3 — em desenvolvimento](atualizacoes/v1.3/) | [Contrato arquitetural](atualizacoes/v1.3/V1_3_FRONTEND_ARCHITECTURE.md) e [guia do frontend](../frontend/README.md) |
| Fase B — IDP-001 | [Implementação, testes e compatibilidade](atualizacoes/fase-b/IDP_001_REPORT.md); checkpoint posterior aprovado `038733102de9ae05a12e69b522e782243c5e8a54` |
| Fase C — ORG-001 | [Especificação organizacional e alternativas](atualizacoes/fase-c/ORG_001_SPEC.md), proposta em revisão, sem implementação/migration |

O código de versões anteriores é recuperado por **Git/commits/tags**, sem cópias de código em pastas de release. Os registros datados de arquitetura e homologação não certificam implementações posteriores.

## Histórico e fontes

- [Histórico](historico/): [V0](historico/v0/), [governança antiga desativada](historico/governanca/) e [relatório de direções do produto](historico/PRODUCT_DIRECTIONS_REPORT.md).
- [Briefings gerais](briefings/): [projeto original](briefings/PROJECT_BRIEF_SOURCE.md), [papéis originais](briefings/AGENT_ROLES_SOURCE.md) e [Printing & Devices / Commerce Hub](briefings/PRINTING_COMMERCE_SOURCE.md). São fontes preservadas, não novas autorizações.
- [AGENTS.md](../AGENTS.md): protocolo permanente e dez especialistas atuais. O diretor antigo e o tester antigo continuam desativados.
- [LEIA-ME.md](../LEIA-ME.md): guia de entrada e inicialização local.

A pasta `.qa` contém **evidências locais opcionais**, ignoradas pelo Git. Links históricos para ela podem exigir arquivos privados; não são fonte obrigatória para compreender a documentação vigente.

## Manutenção

Atualize o documento específico quando uma regra, contrato ou decisão mudar. Preserve fatos históricos, inclusive caminhos originais citados em inventários antigos. Corrija links navegáveis para os destinos existentes e registre data e escopo das verificações.
