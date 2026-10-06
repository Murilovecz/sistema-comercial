# Governança e estado implementado — índice vigente

Atualizado em **06/10/2026**. Este arquivo conserva o nome histórico para preservar links; **não é um segundo Documento Mestre conceitual**.

**Prioridade atual:** varejo físico especializado de pequeno porte (MEI/ME/EPP). RETAIL-000 aprovado, checkpoint `26def32abe183f5eba7c808a835a0e793de43ed2`; [RETAIL-001 aprovado](../atualizacoes/retail/RETAIL_001_PILOT_CONTRACT.md), checkpoint `a609f060dd1a964b7bf97054f426d329b49d4466`. **RETAIL-002A: RED executado, parado no gate de novo contrato persistente**, sem implementação ou migration; [evidências e alternativas](../atualizacoes/retail/RETAIL_002A_CASH_IDEMPOTENCY_REPORT.md). Sem 002B+, C3/D/BRAND-002.

## Autoridade das referências

| Fonte | Responsabilidade |
| --- | --- |
| [Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md) | Única referência conceitual oficial aprovada para produto/arquitetura desejados |
| Código, migrations e testes | Fonte do que está implementado e de seus limites |
| Este índice, [mapa](PROJECT_MAP.md), [arquitetura](ARCHITECTURE.md), [banco](DATABASE.md), [API](API.md) | Estado técnico vigente e contratos; não substituem decisões do mestre |
| [Módulos](MODULES.md), [roadmap](ROADMAP.md) | Mapa derivado e sequência A–G; plano não autoriza implementação |
| [Decisões](DECISIONS.md), [changelog](CHANGELOG_ARCHITECTURE.md) | Fonte/data, alternativas, aprovação, mudanças e consequências |
| [Auditoria de 05/10](../auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md) | Evidências da auditoria anterior e aderência reclassificada com o mestre disponível |
| [Atualizações por fase](../atualizacoes/) e [histórico](../historico/) | Escopos, resultados e planos datados; não são a ordem atual de execução |

O mestre informa que DOCX é a versão formatada principal. Esta rodada usa o Markdown fornecido e aprovado pelo proprietário; não presume um DOCX adicional disponível ou validado. Se representações divergirem, o proprietário decide a reconciliação. O conteúdo do mestre foi preservado integralmente.

Instruções explícitas do proprietário prevalecem. Documentos derivados devem indicar as seções do mestre e distinguir **ATUAL**, **PLANEJADO** e **A DEFINIR**. Divergência entre regra aprovada e código é gap registrado, não autorização para corrigi-lo.

## Estado ATUAL — conferido no código

Baseline histórica da sincronização da Fase A: branch `v1.3-frontend`, HEAD `af98255f1eadef57d86b6e76d438a7657df9ff40`, com apenas o mestre novo não rastreado. C2 partiu de `5c9c7a4c2b6b611065c7488ac6ec2d72f425e993` e recebeu checkpoint aprovado `d324282b26db307ab642a89197a61de2846fca3e`. [Relatório C2](../atualizacoes/fase-c/C2_LEGAL_STRUCTURE_REPORT.md). **Baseline de BRAND-001 — 06/10/2026:** `2b0c172bc101e8a0f0f39161ad9d5ef43c09a37f`, checkpoint aprovado do ajuste histórico de três testes/helpers C2 para prefixo 001–011, com árvore limpa. A continuação expressa autorizou somente branding por Organization, migration aditiva 012, React/adapter mínimo legado e homologação sintética. [Relatório BRAND-001](../atualizacoes/branding/BRAND_001_REPORT.md). Sem novo commit/push, implantação na base operacional, C3 ou Fase D.

- Backend Node.js/CommonJS local, loopback `127.0.0.1:3210`; ambiente de produção recusado. SQLite ativo; JSON legado preservado.
- Fundação V1.2: versão `1.2.0-foundation.1`, tag local `v1.2.0-foundation.1`, migrations **001–010**. Checkpoint funcional histórico `2a2177c7b80734722f71bd9e72029cf9e1b39df0`.
- C2 adiciona **011_legal_entities.sql**, com o DDL exato de C1: uma tabela STRICT/WITHOUT ROWID, dez colunas, candidata somente PROVISIONED, identidade global e UPDATE/DELETE bloqueados. Vazia no upgrade/comércio normal; sem repository/API/UI, binding, backfill ou interpretação nova dos fatos existentes. A base operacional não foi aberta nem migrada.
- Identidade Argon2id, sessões opacas/hash, expiração/revogação, troca/reset administrativo, vínculos empresa/unidade, RBAC e autorização no servidor. Sem MFA/recuperação global/dispositivo confiável.
- Seis agregados relacionais: Produtos, Clientes, Fornecedores, Compras/Recebimentos, Estoque/Movimentações e Vendas. Lista/detalhe de Vendas usam SQL sem payload completo.
- Escritas materializam estado e conferem espelho; Caixa/Financeiro e complementos ainda transitórios. SQL relacional não significa normalização universal nem independência modular pronta.
- React/TypeScript/Vite já implementam skeleton, integração `/ui/`, cliente HTTP, sessão/contexto, login/logout, troca de contexto e Design System mínimo. **Não há módulo comercial Produtos em React.** [Guia atual](../../frontend/README.md).
- BRAND-001 implementa nome visual, cores principal/destaque e LIGHT/DARK/SYSTEM por `companies(id)`, tabela 1:1 `organization_branding` (012), GET/POST contextual, revisão/CAS e auditoria atômica. Escrita exige `companies.manage` efetiva em todas as Units ativas da Organization, com revalidação transacional. Tokens/default/loader compartilhados; superfícies neutras; Aparência React com preview local; adapter legado aplica marca e tema ao shell, conservando formulários comerciais LIGHT neutros. Sem assets seguros: logo deferida para BRAND-002 / Files Core. Revisão final local concluída, aguardando decisão, sem checkpoint BRAND.
- Backup consistente, validação/agendamento/retenção e restore isolado existem. Restore sintético não homologa recuperação da loja, DR real ou RPO/RTO.
- Auditoria transacional append-only/hash local; não neutraliza administrador do arquivo. Aprovação de produto inativo tem prova/direito/senha/motivo e consumo atômico.
- IDP-001 corrige localmente a criação direta legada: identidade obrigatória, replay contextualizado e efeitos únicos; [testes e compatibilidade da implementação](../atualizacoes/fase-b/IDP_001_REPORT.md). A homologação posterior foi aprovada pelo proprietário e o checkpoint é `038733102de9ae05a12e69b522e782243c5e8a54`. Falta entitlement, hierarquia organizacional completa, plano administrativo próprio da plataforma, Agente Local/sync cloud/updater/fiscal real.

A homologação **B/610** é da V1.2, não certificação do SaaS. Na auditoria anterior passaram 29 testes selecionados sem arquivos, 235 análises de sintaxe e typecheck React; não se repetiu a suíte global naquela rodada documental. C2 tem homologação própria em bases sintéticas, com resultados e limitações registrados no [relatório](../atualizacoes/fase-c/C2_LEGAL_STRUCTURE_REPORT.md).

## Direção aprovada, ainda PLANEJADA no produto

O mestre, especialmente seções 2–5, 7, 11–17 e 19, define Conta/Organização → Entidade Legal/Titular PF/PJ → Unidade, Core e Financeiro Básico obrigatórios, módulos opcionais, controles distintos e cloud como autoridade. Fiscal é domínio separado e experiência transversal. Inteligência de Mercado e Gestão Financeira Pessoal são produtos independentes futuros.

O código atual usa `company_id`/`unit_id`; a hierarquia alvo ainda não está implementada. Na [ORG-001 — Fase C](../atualizacoes/fase-c/ORG_001_SPEC.md), o proprietário **aprovou ORG-P01–P12**: B com company legado→Org 1:1, sem agrupamento; alias company temporário rumo a organization/legal_entity/unit; U-A com unidade sucessora; mapa evidenciado ou UNRESOLVED preservado/legível; Owner explícito Org com descendentes atuais/futuros e demais scopes fechados; identidade global multi-Org; sharing de base Org com uso/projeção Legal/Unit; continuidade das obrigações e direitos históricos específicos; classificação operacional, identidade legal protegida/versionável e gates incrementais. A/C e U-B foram rejeitadas nesta versão, com análise preservada. **APROVADO/PLANEJADO não é IMPLEMENTADO.** Schema/adapters, matriz ACL, resolução de evidências, corte/replay, testes e recuperação ainda exigem desenho e revisão; fiscal/jurídico, reset global e deduplicação são especificações próprias posteriores.

## Ordem vigente e autorização

[A — governança → B — replay → C — fundação organizacional → D — controles → E — dispositivos/fronteiras → F — agregados → G — React comercial](ROADMAP.md).

A foi aprovada e registrada no checkpoint `b5137c149f0fab2e375e47a5b97fd3bdc6d6dc8a`. B/IDP-001 foi implementada, homologada e aprovada para checkpoint `038733102de9ae05a12e69b522e782243c5e8a54`, sem push. C/ORG-001 foi consolidada, revisada e registrada no checkpoint documental `d576075f93d3c2f3d6378f90542ea71c5fedc19d`. A [ORG-002 — desenho executável](../atualizacoes/fase-c/ORG_002_EXECUTABLE_DESIGN.md) foi revisada/aprovada e registrada no checkpoint `9be605aee8e88e7e2d232f736d42db7eb3245a44`. C1 foi aprovada no checkpoint `5c9c7a4c2b6b611065c7488ac6ec2d72f425e993`; C2 e seu ajuste histórico receberam os checkpoints acima. BRAND-001 é incremento paralelo expressamente autorizado, não avanço de C3/D. Não existe autorização de checkpoint BRAND/push, C3 ou D. P12 continua exigindo desenho/revisão para cada incremento. D/E dependem de solicitação própria; React Produtos permanece candidato de G. PostgreSQL, Agente Local, offline cloud, fiscal, updater e normalização total continuam fora desse escopo.

## Decisões abertas

Detalhamento no mestre §18 e no [roadmap](ROADMAP.md):

- Detalhamento técnico da ORG-001: schema/adapters/mapa e evidências, ACL/Owner/direitos históricos, sharing/projeções, corte/replay e recuperação. As direções P01–P12 estão aprovadas; correspondência real exige levantamento autorizado posterior, sem inferência ou união automática. A base operacional não precisa ser aberta nesta fase estrutural. Reset global e regras específicas de transferência/fiscal permanecem em especificações próprias.
- Modelos formais de contrato/entitlement, autorização, estação, políticas/alçadas, preços e estados de estoque.
- Precisão/escala/UOM/conversões e arredondamento; DRE e consolidação/intercompany.
- Operações/janela offline, sincronização e revogação; hipótese de 72h e carências históricas não são números aprovados.
- Cloud/ambientes, Desktop Shell, equipamentos, fornecedores e contratos externos.
- RPO/RTO/SLA, retenção, proteção externa, recuperação, release e resposta a incidentes.
- Regras jurídicas/fiscais, inadimplência e governança dos produtos de dados.

## Registrar futuras mudanças

Antes de implementar mudança relevante: inspeção Git/código, seção do mestre, evidência do problema, alternativas/trade-offs, dependências e critérios de aceite. Registrar ID/data, status **proposto / aprovado / implementado / superado**, fonte da aprovação, migração/compatibilidade/recuperação, testes e documentos afetados em [DECISIONS](DECISIONS.md).

Se contradizer o mestre, requer decisão explícita do proprietário e revisão versionada das seções afetadas; o agente não modifica a referência para acomodar sua preferência. Commit/push dependem de autorização separada. Registrar implementação/verificação real no changelog, preservando as entradas anteriores.

## Histórico preservado

[Mestre anterior](../historico/PROJECT_MASTER_PRE_V1_0_2026_10_05.md) e [roadmap anterior](../historico/ROADMAP_PRE_V1_0_2026_10_05.md) foram arquivados com links úteis. Registros da V1/V1.1/V1.2/V1.3 continuam intactos. O [contrato React V1.3 datado](../atualizacoes/v1.3/V1_3_FRONTEND_ARCHITECTURE.md) conserva inventário e planejamento daquela fase; suas prioridades/gates precisam ser confrontados com o roadmap vigente antes de retomar.

[Estado V1.2](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md), [operações](OPERATIONS_V1_2.md), [performance histórica](../atualizacoes/v1.2/PERFORMANCE_V1_2.md), [índice geral](../README.md).

## Solicitações já anotadas

Preservadas as diretrizes de quantidades exatas/unidades e os seis grupos de [anotações do passeio](../atualizacoes/v1.1/AJUSTES-DO-PASSEIO.md). A V1.1 entregou quick views, custo da fonte recebida, Receber compra contextual, autoria/aprovação verificada e limpeza de filtros. Não criar outra fonte de custo/recebimento nem inventar autoria antiga. O mestre vigente complementa essas decisões; não habilita frações nem altera retrospectivamente vendas/estoque.
