> HISTÓRICO — texto vigente antes da sincronização de 05/10/2026, preservado nesta data. Não define o próximo trabalho. Decisões atuais: [Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md). Estado e governança: [índice vigente](../atual/PROJECT_MASTER.md); sequência atual: [roadmap](../atual/ROADMAP.md). Somente links locais foram ajustados para manter navegação após o arquivamento.

# Roadmap vivo

Estado em **03/10/2026**: Fundação V1.2 **CONCLUÍDA / FECHADA LOCALMENTE**, versão **1.2.0-foundation.1**, tag `v1.2.0-foundation.1`, **HOMOLOGAÇÃO B, 610/610**, checkpoint funcional `2a2177c7b80734722f71bd9e72029cf9e1b39df0`, migrations 001–010. Condições B conhecidas e aceitas neste escopo; sem publicação automática.

## Fases PLANEJADAS

**Diretrizes incorporadas em 02/10/2026:** [Printing & Devices](../atual/PRINTING_AND_DEVICES.md) atravessa documentos/comercial, Logística, Fiscal e Desktop/Edge; [Commerce Hub / Omnichannel](../atual/COMMERCE_HUB.md) organiza canais na fase de Integrações. A sequência técnica atual mantém prioridade; não iniciar drivers, marketplaces ou Edge completo por esta anotação.

Antes de cada nova modelagem comercial, revisar decimal/unidades históricos, produto/variação, fonte central de disponibilidade, reservas, IDs de origem, dimensão de canal e vínculos por empresa/conexão/unidade. Primeiro equipamento/canal e prazo continuam **A DEFINIR**. Implementar apenas quando houver fluxo prioritário, contrato vigente e critérios de aceite definidos nos documentos específicos; homologação real não é substituída por planejamento.

| Fase | Objetivo | Critério para avançar |
| --- | --- | --- |
| 1 — Fundação | Diagnóstico/documentos, arquitetura, identidade, empresas/unidades, acesso e persistência | Contratos e ownership definidos; primeira fatia segura testada; migração/recuperação demonstradas quando aplicáveis |
| 2 — Core | Cadastros compartilhados e serviços, regras de empresa/unidade e histórico | Acesso isolado, invariantes e relações cobertos por testes |
| 3 — Comercial | Evoluir produtos, estoque, compras, vendas, orçamentos, caixa e exceções | Operações sem duplicação, concorrência adequada e histórico consistente |
| 4 — Financeiro | Datas/classificações, recebíveis/pagáveis, caixa/bancos, DRE gerencial | Origem e critérios dos indicadores explícitos; saldos e baixas reconciliáveis |
| 5 — Analytics | Comparações, indicadores e consultas gerenciais | Dados definidos, consultas eficientes e acesso por permissão |
| 6 — Fiscal | Módulo fiscal separado conforme necessidade | Contratos/regras validados e homologação; sem simular emissão real |
| 7 — Primeiro nicho | Regras e operação específicas do segmento escolhido | Nicho A DEFINIR; aceite com fluxo real e impactos no núcleo |
| 8 — Integrações | Primeiro conector externo e canais seguintes | Sandbox, segurança, idempotência e reconciliação de falhas |
| 9 — Edge/offline | Operação temporariamente desconectada e dispositivos | Política decidida, fila durável, conflitos/expiração testados |
| 10 — Automação/BI/IA | Automações e inteligência progressivas | Governança, acesso e auditoria; revisão de ações sensíveis |

Fundação documental e Fundação V1 local: **ATUAIS**, com identidade, empresas/unidades, RBAC, SQLite, transações, auditoria e migração preservando a origem. Ver [relatório/evidências](../atualizacoes/fundacao-v1/FOUNDATION_V1_REPORT.md). Recuperação operacional e implantação remota continuam pendentes; telas locais não concluem as fases SaaS.

## Entrega V1.1 — CONCLUÍDO, histórico de 02/10/2026

Os [dez passos](../atualizacoes/v1.1/FOUNDATION_V1_1_STEPS.md) estão concluídos: cinco agregados SQL, leituras por perfil/paginação, cadastros menores, autorização excepcional e seis ajustes do passeio. [Relatório](../atualizacoes/v1.1/FOUNDATION_V1_1_REPORT.md): 457 testes aprovados e conferência visual isolada. A V1 anterior fica como histórico.

## Fundação V1.2 — CONCLUÍDA / FECHADA LOCALMENTE, 1.2.0-foundation.1

| Classificação | Entrega / condição |
| --- | --- |
| CONCLUÍDO | Acesso: troca/reset administrativo, sessões/revogação e manutenção; Git local; backup consistente/validação/retenção e restore em destino isolado |
| CONCLUÍDO | Sexto agregado SQL: Vendas, lista/detalhe/busca/filtros/paginação sem payload completo; UI por perfil |
| CONCLUÍDO | Benchmarks inicial/posterior/HTTP, índice FK 010 e quatro melhorias locais de estoque, sem mudança comercial |
| HOMOLOGADO | B — condicional; 610/610; integridade/isolamento/replay/rollback/restore sintético, API/UI e sanity de desempenho |
| TRANSITÓRIO | Snapshot nas escritas e módulos restantes; Caixa/Financeiro sem normalização completa; ~2 s em escritas large, estado/Financeiro crescentes e RSS a acompanhar |
| TRANSITÓRIO | Restore sintético não valida procedimento da loja/RPO/RTO/DR real; cadeia local sem âncora externa; favicon cosmético ausente |
| CONCLUÍDO | Reconciliação documental/portabilidade registradas; versionamento 1.2.0-foundation.1, tag local v1.2.0-foundation.1 e fechamento formal local com condições B aceitas |

[Passos](../atualizacoes/v1.2/FOUNDATION_V1_2_STEPS.md), [estado/fontes](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md) e [performance](../atualizacoes/v1.2/PERFORMANCE_V1_2.md). Fechamento local autorizado e concluído; a homologação permanece B, sem nova execução ou certificação de produção.

## V1.3 — próxima fase PLANEJADA, sem execução autorizada

1. Definir prioridade entre redução de snapshot/escrita, evolução de Caixa/Financeiro, acompanhamento de memória e procedimento operacional de recuperação. RPO/RTO/proteção externa continuam a definir; não repetir manutenção de senha/Git/benchmark como se ausentes.
2. Especificar precisão/arredondamento/UOM/conversões antes de fracionamento comercial; infraestrutura decimal exata não habilita frações sozinha. Fiscal permanece separado.
3. Decidir segmento/lançamento, catálogo entre unidades e escopo/prazo/conflitos de offline. Banco da loja nunca é massa de escrita de QA.
4. Cloud/PostgreSQL/adapter/paridade e cliente Windows/Edge somente com requisitos de TLS, secrets, identidade/dispositivos, suporte, recuperação e distribuição definidos/homologados. Stack web futura é A DEFINIR, sem adoção de Next.js/React/TypeScript nesta tarefa.
5. Fiscal, Printing/hardware, Commerce Hub, cobrança e MFA/passkeys/biometria/Windows Hello permanecem FUTUROS conforme a ordem macro acima.

Essa sequência é recomendação, não autorização de publicação ou nova implementação automática.

## Passeio — entrega inicial concluída na V1.1

Custo pela fonte recebida; quick views em Produtos/Clientes/Fornecedores; executor/aprovador verificados; Receber compra contextual; venda inativa com senha/direito/motivo; limpar filtros visível e preservar rascunhos. Limites e histórico em [AJUSTES-DO-PASSEIO](../atualizacoes/v1.1/AJUSTES-DO-PASSEIO.md). PIN/biometria, custo médio e conversões continuam planejados/a definir.

## Disciplina de execução

Selecionar especialistas pertinentes e verificar a entrega. Diretor/tester antigos estão desativados. O novo QA / Testing participou do escopo autorizado da Fundação V1 e não reativa o tester antigo. Não reiniciar rodadas históricas automaticamente; próxima tarefa depende do pedido atual do Murilo.
