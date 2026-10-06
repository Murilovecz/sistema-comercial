> HISTÓRICO — texto vigente antes da sincronização de 05/10/2026, preservado nesta data. Não define o próximo trabalho. Decisões atuais: [Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md). Estado e governança: [índice vigente](../atual/PROJECT_MASTER.md); sequência atual: [roadmap](../atual/ROADMAP.md). Somente links locais foram ajustados para manter navegação após o arquivamento.

# Documento mestre — Sistema Comercial

Referência principal em **03/10/2026**: **Fundação V1.2 fechada localmente, homologada B**, versão **1.2.0-foundation.1**, tag local `v1.2.0-foundation.1`. Checkpoint funcional `2a2177c7b80734722f71bd9e72029cf9e1b39df0`; reconciliação documental registrada em `33b4efc80bc0f3edf9c4b76873719d06e49cc323`. Pasta exclusiva: `D:\Projeto Sistema Local`. V0.12.0 é baseline histórica.

## Estado ATUAL

Há um protótipo local funcional, com interface em português e paleta verde, menus por categoria, produtos, clientes, fornecedores, compras, estoque, vendas, caixa, controles financeiros e relatórios. A [lista de módulos](../atual/MODULES.md) detalha recursos e limites.

O servidor Node.js, versão 24.7 ou superior, roda em `127.0.0.1:3210`, no próprio computador. A persistência ativa é `data/foundation.sqlite`, com migrations, transações e isolamento por empresa/unidade. `data/database.json` permanece como origem histórica preservada; novas operações não são gravadas nele.

O login é real: Argon2id, sessão no servidor, expiração, vínculos de empresas/unidades e permissões por ação/RBAC deny-by-default. Primeiro responsável escolhe credenciais com código privado em `data/PRIMEIRO-ACESSO.txt`, sem senha padrão. Troca de senha, reset administrativo por direito/senha/motivo, listagem/revogação de sessões e manutenção conservadora de grants existem; sem recuperação por e-mail/MFA. Auditoria registra executor e autorizador/motivo quando comprovados, hash/seqüência/escopo; falha desfaz operação antes do sucesso. Cadeia local não neutraliza administrador capaz de modificar SQLite/mecanismo local; âncora externa é futura.

Seis agregados têm SQL por empresa/unidade: **Produtos, Clientes, Fornecedores, Compras/Recebimentos, Estoque/Movimentações e Vendas**; migrations **001–010**. Espelho em unit_states é conferido sem reimportação silenciosa. Lista/detalhe de Vendas, busca/filtros/paginação são SQL sem payload comercial completo; escritas ainda usam estado materializado/snapshot. Caixa/Financeiro e complementos permanecem transitórios. Compras/Recebimentos tem relações/FKs, mas consultas operacionais/custos e comandos ainda passam por estado completo; não há API proporcional própria para todo Compras. DTOs respeitam direitos; cadastros/venda direta não exigem leitura financeira. Interface completa mantém ponte das cinco leituras. Cloud/PostgreSQL, Windows/Edge e cobrança continuam planejados.

Resultado homologado atual: **B — HOMOLOGAÇÃO CONDICIONAL, 610/610 aprovados, zero falhos/ignorados/cancelados**, sem bloqueador funcional demonstrado. [Estado consolidado V1.2 e fontes](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md). **457** no [relatório V1.1](../atualizacoes/v1.1/FOUNDATION_V1_1_REPORT.md), **302** no [V1](../atualizacoes/fundacao-v1/FOUNDATION_V1_REPORT.md) e **205** no [diagnóstico inicial](../atualizacoes/fundacao-v1/INITIAL_DIAGNOSIS.md) são históricos. Testes não certificam produção, pentest completo ou funcionalidades futuras.

Git local/checkpoint, backup consistente com validação/agendamento/retenção e restore em destino isolado existem. Restore foi validado sinteticamente com schema/migrations/integridade/login/seis agregados/escopos/auditoria; não homologa procedimento da loja, disaster recovery real, falha física, infraestrutura externa ou RPO/RTO. Índice 010 e melhorias locais de estoque foram comprovados sem mudança comercial. Escritas large ~2 s, /api/state e Financeiro crescentes e RSS a acompanhar; sem SLA ou leak comprovado/ausência comprovada. [Operação](../atual/OPERATIONS_V1_2.md) e [performance](../atualizacoes/v1.2/PERFORMANCE_V1_2.md).

## Visão PLANEJADA

**Printing & Devices** e **Commerce Hub / Omnichannel** passam a fazer parte oficial da visão, conforme [pedido integral de 02/10/2026](../briefings/PRINTING_COMMERCE_SOURCE.md). [Printing & Devices](../atual/PRINTING_AND_DEVICES.md) centraliza impressão/periféricos por contratos e adapters, mantendo Fiscal separado. [Commerce Hub](../atual/COMMERCE_HUB.md) conecta canais ao mesmo Core, com disponibilidade central, contas/mapeamentos, idempotência e reconciliação. São diretrizes **PLANEJADAS**; a evolução técnica atual mantém prioridade e esta tarefa não implementa drivers, marketplaces ou Edge. [Relatório da recuperação e revisão](../historico/PRODUCT_DIRECTIONS_REPORT.md).

Construir uma plataforma empresarial modular, multiempresa e multiunidade, com núcleo compartilhado e módulos ativados conforme segmento e plano. Começar simples, preservando integridade, auditabilidade e possibilidade de evolução. Ver [visão](../atual/VISION.md).

O servidor central hospedará API, regras e dados oficiais. Cada cliente poderá utilizar aplicativo Windows, além de interfaces web e outras interfaces futuras. Um Edge local opcional poderá apoiar dispositivos e operação temporariamente offline. O aplicativo do cliente não receberá o backend central completo. A nuvem continuará sendo a autoridade principal. Ver [arquitetura](../atual/ARCHITECTURE.md) e [offline/Edge](../atual/OFFLINE_EDGE.md).

## Princípios

- Evoluir como monólito modular e API-first; separar responsabilidades sem antecipar microserviços.
- Conferir funcionalidades existentes antes de acrescentar outra forma de lançar a mesma informação.
- Manter regras importantes, identidade, permissões, acesso a dados e assinatura validados no backend.
- Tratar computador do cliente e entradas externas como não confiáveis.
- Preservar histórico financeiro, comercial e de estoque; valores monetários exatos e operações sem efeitos duplicados.
- Isolar empresas e unidades conforme a propriedade e as permissões de cada recurso.
- Marcar requisitos desconhecidos como **A DEFINIR**; não inventar regra comercial, fiscal ou de segurança.
- Implementar por etapas pequenas, com critérios de aceite, testes pertinentes e documentação atualizada.

## Organização de trabalho

O [AGENTS.md](../../AGENTS.md) define a seleção dos dez especialistas. Por novo pedido do Murilo, o diretor antigo e o tester antigo estão desativados. O Codex consolida o trabalho dos novos especialistas conforme cada etapa exigir. QA / Testing é um novo papel, distinto do tester antigo, autorizado nos vinte passos da Fundação V1.

Depois da fundação documental, Murilo autorizou os [vinte passos da Fundação V1](../atualizacoes/fundacao-v1/FOUNDATION_V1_STEPS.md), em ordem. A execução preserva a baseline e não inclui cloud, Edge, cobrança, fiscal completo, executável final ou novos setores. Consultar o quadro para o andamento real.

Murilo autorizou em seguida os [dez passos da Fundação V1.1](../atualizacoes/v1.1/FOUNDATION_V1_1_STEPS.md), com [briefing integral](../atualizacoes/v1.1/FOUNDATION_V1_1_SOURCE.md). **CONCLUÍDOS:** cinco agregados normalizados, consultas/cadastros por perfil, venda excepcional autenticada e ajustes do passeio. Regressão, cópia consistente, equivalência e conferência visual documentadas no relatório V1.1.

A V1.2 acrescentou manutenção de acesso, Git/backup/restore, Vendas SQL, UI, benchmarks e otimizações locais homologadas. [Passos consolidados](../atualizacoes/v1.2/FOUNDATION_V1_2_STEPS.md). Reconciliação documental e auditoria de portabilidade registradas em `33b4efc80bc0f3edf9c4b76873719d06e49cc323`; versão/tag/fechamento local concluídos nesta etapa autorizada, mantendo B/610 e seus limites.

## Mapa e referências

| Área | Referência |
| --- | --- |
| Código e estado real | [PROJECT_MAP](../atual/PROJECT_MAP.md), [INITIAL_DIAGNOSIS](../atualizacoes/fundacao-v1/INITIAL_DIAGNOSIS.md) |
| Arquitetura e persistência | [ARCHITECTURE](../atual/ARCHITECTURE.md), [DATABASE](../atual/DATABASE.md) |
| Capacidades e contratos | [MODULES](../atual/MODULES.md), [API](../atual/API.md) |
| Segurança | [SECURITY](../atual/SECURITY.md), [THREAT_MODEL](../atual/THREAT_MODEL.md) |
| Integrações e operação local | [INTEGRATIONS](../atual/INTEGRATIONS.md), [OFFLINE_EDGE](../atual/OFFLINE_EDGE.md) |
| Próximas etapas | [ROADMAP](../atual/ROADMAP.md) |
| Decisões e histórico | [DECISIONS](../atual/DECISIONS.md), [CHANGELOG_ARCHITECTURE](../atual/CHANGELOG_ARCHITECTURE.md) |
| Origem das diretrizes | [briefing mestre](../briefings/PROJECT_BRIEF_SOURCE.md), [briefing de agentes](../briefings/AGENT_ROLES_SOURCE.md) |

## Prioridades e pendências A DEFINIR

Próxima fase V1.3: definir escopo e prioridade, sem iniciar execução automaticamente. Senhas/sessões, Git, backup/restore isolado, benchmark, UI, Vendas SQL e fechamento local V1.2 estão concluídos. Ponte das telas avançadas, escrita/Financeiro, acompanhamento de memória e recuperação operacional ficam na fila futura, sem otimização automática. Requisitos de implantação antecedem uso remoto. Ver [roadmap](../atual/ROADMAP.md).

| Questão | Situação |
| --- | --- |
| Primeiro segmento comercial e escopo de lançamento | A DEFINIR; o protótipo atual atende fluxos de varejo |
| Banco SQL, acesso e migração local | ATUAL: SQLite nativo, SQL parametrizado e importação conferida; PostgreSQL/adapter central PLANEJADOS |
| Tecnologia do executável Windows e atualização | A DEFINIR; Electron/Tauri são possibilidades, não escolhas feitas |
| Provedor cloud, domínio, custos e ambientes | A DEFINIR |
| Identidade e permissões por ação | ATUAL: sessão/RBAC, troca/reset administrativo, revogação/manutenção e exceção por senha/direito/motivo; recuperação global/e-mail, MFA/passkeys/biometria/dispositivos FUTUROS |
| Offline no lançamento, operações permitidas, validade e conflitos | A DEFINIR; requisito do Murilo: a loja deve operar sem internet |
| SaaS: planos, módulos, preços, cobrança e suspensão | PLANEJADO; políticas configuráveis no servidor |
| Aviso de vencimento e carência | Histórico do usuário: aviso nos cinco dias anteriores e sete dias de carência; ainda sem implementação |
| Validade de autorização offline | A DEFINIR; não é automaticamente a carência de pagamento |
| Primeiro módulo setorial, fiscal e integrações | A DEFINIR por prioridade e dependências |

## Solicitações já anotadas

**Diretriz para a normalização, solicitada pelo Murilo em 02/10/2026:** ao normalizar Produtos, Compras, Estoque e futuramente Vendas, não assumir que produtos são vendidos exclusivamente por unidade inteira. A arquitetura deve suportar quantidades decimais, unidades de medida e conversões futuras. O módulo fiscal brasileiro permanece **PLANEJADO** e deverá ser isolado do domínio comercial.

O modelo normalizado já representa quantidade decimal textual exata; os comandos comerciais continuam com quantidades inteiras. Venda fracionada ainda não está disponível. Precisão, arredondamento, unidades e regras de conversão estão **A DEFINIR** antes de implementar; preservar os registros atuais. Ver [diretriz de dados](../atual/DATABASE.md#quantidades-e-unidades-de-medida-planejado).

Preservar os seis grupos de [anotações do passeio](../atualizacoes/v1.1/AJUSTES-DO-PASSEIO.md): custo acessível pela fonte de Compras/Custos recebidos; quick views em Produtos, Clientes e cadastros semelhantes; executor e autorizador no histórico de estoque; substituir reposição avulsa pelo recebimento de compra existente; venda excepcional de item desativado com identidade confirmada e liberação registrada; limpeza de filtros mais visível.

Na V1.1 foram entregues quick views de Produtos/Clientes/Fornecedores, custo consultado pela fonte dos recebimentos, limpeza visível e atalho Receber compra com filtro do produto. A venda direta pode liberar item inativo por login/senha, direito sales.authorize_inactive e motivo, com executor/aprovador explícitos na venda, estoque e auditoria. O cadastro continua inativo. PIN/biometria não existem; históricos sem executor verificado não recebem identidade inventada. Não criar outro lançamento de custo ou recebimento.

## Recuperar o contexto

Ler este documento, o mapa e as decisões, depois os documentos e especialistas relativos à tarefa. Conferir o código e a última evidência disponível. O endereço local é demonstração; a visão cloud ainda está planejada. O passeio foi interrompido para organizar a fundação documental e pode ser retomado quando o Murilo pedir.
