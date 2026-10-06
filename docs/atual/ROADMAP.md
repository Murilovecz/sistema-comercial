# Plano de construção vigente — fundação e integridade

**05/10/2026 — direção do proprietário.** Derivado do [Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md), da [auditoria](../auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md) e do pedido de sincronização. Substitui a sequência anterior como plano vigente. [Plano anterior preservado](../historico/ROADMAP_PRE_V1_0_2026_10_05.md).

**Prioridade atual — 06/10/2026:** varejo físico especializado de pequeno porte (MEI/ME/EPP). RETAIL-000 aprovado, checkpoint `26def32abe183f5eba7c808a835a0e793de43ed2`; [RETAIL-001 aprovado](../atualizacoes/retail/RETAIL_001_PILOT_CONTRACT.md), checkpoint `a609f060dd1a964b7bf97054f426d329b49d4466`. **002A: RED executado e gate de novo contrato persistente alcançado**; [prova/DDL alternativo para revisão](../atualizacoes/retail/RETAIL_002A_CASH_IDEMPOTENCY_REPORT.md). Não houve GREEN/implementação/migration; 002B+, C3/Fase D/BRAND-002 não iniciados.

**Autorização original da sincronização documental: somente Fase A.** A ordem abaixo não autorizou B–G, migrations, implantação ou commit/push. Solicitações posteriores autorizaram B/IDP-001, ORG-001/ORG-002/C1 e C2 dormente, esta registrada em `d324282b26db307ab642a89197a61de2846fca3e`. O ajuste histórico C2/prefixo 001–011 recebeu checkpoint `2b0c172bc101e8a0f0f39161ad9d5ef43c09a37f`. Depois, a continuação expressa autorizou BRAND-001 isolado, inclusive 012, testes e documentação. Nenhum checkpoint BRAND/push, aplicação na base operacional, C3 ou início de D está autorizado nesta rodada. Cada incremento recebe escopo e aceite próprios. Construir uma mudança por vez; defeitos com TDD Red → Green → Refactor e homologação pertinente em ambiente isolado.

## Baseline real

Fundação local V1.2, versão `1.2.0-foundation.1`, migrations históricas 001–010, seis agregados SQL e persistência híbrida. C2 acrescenta 011 com Legal dormente, sem comportamento comercial e sem abertura da base operacional. B/610 é homologação histórica; [C2](../atualizacoes/fase-c/C2_LEGAL_STRUCTURE_REPORT.md) registra a nova homologação sintética. React já possui skeleton, sessão/login/contexto e Design System; módulo comercial Produtos não está implementado. Ausentes: entitlement, dispositivo confiável, Agente Local, sync cloud, updater, fiscal real e administração própria de plataforma.

As fontes técnicas ficam no [índice de estado](PROJECT_MASTER.md), [mapa](PROJECT_MAP.md), [módulos](MODULES.md) e código. Fechamento V1.2 não homologa o novo alvo SaaS.

## Sequência A–G

**Incremento paralelo atual — BRAND-001:** nome visual, duas cores e tema por Organization física `companies(id)`, migration 012 sem seed/backfill, API contextual com permission/CAS/audit, tokens compartilhados, editor/preview React e adapter mínimo legado. Implementado localmente para revisão; [evidências, homologação e limites](../atualizacoes/branding/BRAND_001_REPORT.md). Logo **deferida para BRAND-002 / Files Core**, pois upload/assets seguros ainda não existem. C3/D continuam não iniciados. Esta entrega não implementa a hierarquia organizacional completa.

**Prioridade comercial inicial aprovada:** varejo físico especializado de pequeno porte, **MEI / ME / EPP**. Orienta os próximos incrementos depois das fundações; não autoriza PDV novo, oficina, restaurante ou outros módulos nesta entrega.

**PLANEJADO como futuro/add-on:** white-label avançado com domínio/subdomínio próprio, login pré-autenticação personalizado, e-mails, documentos/PDFs avançados, remoção contratual da marca da plataforma e branding por Legal/Unit. Nenhum desses itens foi implementado. Prioridade, contratos e infraestrutura exigem revisão própria.

| Fase | Entrega | Dependências / gate para avançar | Situação nesta rodada |
| --- | --- | --- | --- |
| **A — Governança/documentação** | Mestre único, índice de estado, AGENTS, mapa modular, auditoria reclassificada, plano e registro de decisões | Coerência de referências, links e escopo; revisar o diff documental | Aprovada; checkpoint `b5137c149f0fab2e375e47a5b97fd3bdc6d6dc8a` |
| **B — Integridade comprovada** | Uma correção isolada do replay da venda legada | Inventário de consumidores; teste Red; estratégia de compatibilidade; Green e regressão de atomicidade/escopo; autorização própria para código | IDP-001 implementada e homologada; checkpoint aprovado `038733102de9ae05a12e69b522e782243c5e8a54`, sem push; [relatório da implementação](../atualizacoes/fase-b/IDP_001_REPORT.md) |
| **C — Fundação organizacional** | Especificação Conta/Organização → Entidade Legal/Titular PF/PJ → Unidade | P12: desenho executável, schema proposto, adapter/versionamento, planos de testes/recuperação e revisão do proprietário **antes de migrations** | [ORG-001 aprovada](../atualizacoes/fase-c/ORG_001_SPEC.md), checkpoint `d576075f93d3c2f3d6378f90542ea71c5fedc19d`; B 1:1 + U-A. [ORG-002 aprovada](../atualizacoes/fase-c/ORG_002_EXECUTABLE_DESIGN.md), checkpoint `9be605aee8e88e7e2d232f736d42db7eb3245a44`. [C1 aprovada](../atualizacoes/fase-c/C1_MINIMAL_DDL_PROPOSAL.md), checkpoint `5c9c7a4c2b6b611065c7488ac6ec2d72f425e993`. [C2 — estrutura mínima dormente](../atualizacoes/fase-c/C2_LEGAL_STRUCTURE_REPORT.md) aprovada/checkpoint `d324282b26db307ab642a89197a61de2846fca3e`; ajuste histórico de testes em `2b0c172bc101e8a0f0f39161ad9d5ef43c09a37f`. Sem push/base operacional/C3/D |
| **D — Contrato / Entitlement / Permission / Scope / Station** | Modelo formal e invariantes dos cinco controles distintos | C; Core/Financeiro Básico obrigatórios; estados/ativação/leitura histórica; restrições/políticas; regras jurídicas abertas explícitas; revisão antes de cobrança/licenciamento | Somente especificação futura |
| **E — Dispositivos e fronteira cliente/plataforma** | Especificação de identidade própria/revogação, plano administrativo separado, capacidades de cliente/Agente e proteção de Tier 0 | C/D; contexto de usuário/dispositivo; segredos e privilégio mínimo; cloud-only; requisitos verificáveis de sessão, step-up e offline | Somente especificação inicialmente |
| **F — Agregados/persistência** | Incrementos pequenos priorizados por dependências, invariantes e gargalos medidos | C–E aprovadas e fundamentos relevantes estabilizados; especificações de domínio, compatibilidade/replay/auditoria, recuperação e testes antes de cada mudança estrutural | Sem normalização total automática |
| **G — React comercial** | Retomada de migração por módulo/fluxo; Produtos continua candidato a piloto | Fundamentos usados pelo módulo estabilizados; APIs/DTOs/entitlement/escopo e aceite definidos; regressão e retorno à interface existente | Adiada; não autorizada nesta rodada |

C–E são gates de desenho e aprovação, não autorização de implementar toda a plataforma de uma vez. A estabilização exigida por F/G é definida por incremento e dependências; não pressupõe que toda capacidade futura esteja pronta.

## Proposta original e registro de execução — Fase B

**Problema demonstrado na auditoria anterior, corrigido em B:** `POST /api/sales` chegava à função de venda legada que aceitava ausência de `requestId`; a mesma entrada podia gerar nova venda/baixa. A API comercial nova possuía replay, mas não protegia esse caminho legado. Os passos abaixo preservam a proposta original, não uma nova execução autorizada.

**Escopo sugerido:** corrigir exclusivamente esse contrato e os consumidores efetivamente necessários. Sem novo modelo organizacional, nova migration, entitlement, preços/estoque negativo, React Produtos ou refatoração ampla por arrasto.

1. Inspecionar Git e mapear chamadas diretas/indiretas: interface, orçamentos/reservas, scripts/testes e replay já existente. Diferenciar comando externo de conversão interna; não endurecer helper compartilhado sem medir impacto.
2. Escrever teste Red no caminho externo apropriado: confirmação crítica sem identidade estável não produz venda, recebimento, baixa, revisão ou auditoria de sucesso.
3. Apresentar estratégia de compatibilidade: endurecer a rota com consumidores atualizados ou descontinuá-la gradualmente em favor da API comercial; comparar riscos antes de decisão de impacto. Não inventar chave por tentativa no servidor.
4. Green com menor mudança: mesma chave/conteúdo reconhece resultado anterior; chave reutilizada com conteúdo diferente é recusada; tenant/unidade/ator e transação permanecem válidos.
5. Testar retry após falha/timeout, rollback de auditoria, efeito único financeiro/estoque e separação de contexto em bases isoladas; verificar as rotas impactadas e documentar contrato.
6. Refactor somente se necessário à correção; homologar o escopo e parar para avaliação.

**Aceite proposto:** replay idêntico causa um único conjunto de efeitos; replay alterado é negado; ausência de chave no contrato protegido falha antes dos efeitos; históricos sem chave não são reescritos; consumidores compatíveis; testes existentes preservados e pertinentes aprovados.

**Registro posterior — IDP-001:** a solicitação da Fase B autorizou exclusivamente essa correção após o checkpoint documental `b5137c149f0fab2e375e47a5b97fd3bdc6d6dc8a`. Foram escolhidos validação compartilhada do draft, fingerprint canônico contextualizado no campo existente e 409 `REPLAY_CHANGED`, sem depreciação da rota ou migration. Histórico sem prova completa não é reescrito nem reconhecido silenciosamente. [Compatibilidade, evidências e limites](../atualizacoes/fase-b/IDP_001_REPORT.md). A autorização documental inicial acima continua datada; nenhuma fase seguinte ou commit/push começa automaticamente.

**Registro posterior — ORG-001:** após checkpoint de B, C foi solicitada como especificação e revisada pelo proprietário. **P01–P12 aprovadas/consolidadas:** B 1:1 sem agrupamento, alias temporário rumo a organization/legal_entity/unit, U-A sucessora, UNRESOLVED evidenciado/legível, Owner Org atual/futuro explícito versus demais scopes fechados, identidade global multi-Org, base/sharing Org com uso Legal/Unit, obrigações originais/corte explícito, direitos históricos, classificação operacional, identidade legal protegida e gates incrementais. A/C e U-B preservadas como rejeitadas nesta versão. O [documento](../atualizacoes/fase-c/ORG_001_SPEC.md) distingue aprovação estrutural de implementação e lista pendências técnicas e perguntas residuais da §16. Base real fechada; correspondência concreta, desenho executável, schema/adapters/ACL/planos e revisão ainda necessários antes de migration. Sem mudança executável, commit/push ou início de D.

## Especificações necessárias para F e posteriores

**Registro ORG-002/C1/C2 — 06/10/2026:** ORG-002 revisada/aprovada, checkpoint documental `9be605aee8e88e7e2d232f736d42db7eb3245a44`. [C1 — proposta do menor DDL aditivo/dormente](../atualizacoes/fase-c/C1_MINIMAL_DDL_PROPOSAL.md) aprovada no checkpoint `5c9c7a4c2b6b611065c7488ac6ec2d72f425e993`. C2 recebeu autorização específica para uma tabela `legal_entities` vazia no upgrade normal, sem backfill/writer/API/UI. Migração aplicada somente em DBs sintéticos. [Evidências e limites](../atualizacoes/fase-c/C2_LEGAL_STRUCTURE_REPORT.md). Antes de qualquer mutabilidade/ativação: perfis/head, campos de ativação, version/CAS, transição auditada e substituição revisada da guarda total, conforme C1. Pacote 001–010 continua recusando DB/backup com 011; eventual compatibilidade de deployment/recovery exige trabalho futuro separado. Nenhum C3, D, commit/push ou abertura da base operacional nesta rodada.

- Pessoas/Organizações PF/PJ comuns com papéis; identidade e sharing sem unir históricos por nome.
- Produtos opcionais, variantes/SKU, serviços próprios e itens com/sem controle de estoque.
- Preços: elegibilidade/aplicação/ação/combinação; alçada manual ancorada no preço de referência, `policy.manage` separado e prova de exceção quando exigida.
- Estoque: movimentos/estados, físico/disponível/reservado/em trânsito, venda física válida com divergência negativa e ocorrência; preservação de fatos. Não remover guardas atuais antes do contrato aprovado.
- Financeiro Básico independente: contas/caixa/categorias/centros/rateios/recorrências/projeções/reversões e DRE a partir de fatos; consolidação/intercompany.
- Segurança derivada dos 14 blocos do mestre, com requisitos e testes: isolamento/entitlements, sessões/dispositivos, step-up, Tier 0, secrets, auditoria, recuperação, rede, incidentes e supply chain.
- Precisão/UOM/conversões, anexos/retenção/exports, eventos externos e recuperação operacional.

## Posteriores, sem implementação nesta rodada

PostgreSQL/adapter/paridade, infraestrutura cloud, cliente Windows, Agente Local, offline/sync cloud, fiscal real, updater assinado, Printing & Devices, Commerce Hub e integrações dependem de especificações e prioridades próprias. Não introduzir microserviços ou infraestrutura sem necessidade demonstrada.

Offline: fatos válidos preservados, registros editáveis por versão/conflito explícito, configuração crítica cloud-only. Janela/expiração/operações, revogação e relógio exigem especificação; ~72h não é decisão. Updater tem assinatura, rollout e ponto seguro, sem escolha automática de stack. Fiscal varia por documento/jurisdição.

Inteligência de Mercado e Gestão Financeira Pessoal são produtos independentes futuros; não competem automaticamente por posição no roteiro do ERP. BI interno continua add-on. Backups não alimentam analytics.

## Histórico e decisões abertas

[Fundação V1](../atualizacoes/fundacao-v1/FOUNDATION_V1_REPORT.md), [V1.1](../atualizacoes/v1.1/FOUNDATION_V1_1_REPORT.md), [V1.2](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md) e [contrato V1.3 datado](../atualizacoes/v1.3/V1_3_FRONTEND_ARCHITECTURE.md) preservam o passado. Nenhum roteiro antigo reinicia execução.

Permanecem abertas as escolhas do mestre §18: números de offline/RPO/RTO/SLA/retenção/rate limits/rollout/amostragem; regras jurídicas/fiscais; fornecedores/stack desktop/cloud; modelos técnicos detalhados. Registrar decisões com alternativas, fonte do proprietário, seções afetadas, transição e testes em [DECISIONS](DECISIONS.md). Propostas anteriores de piloto React imediato são superadas por esta ordem.
