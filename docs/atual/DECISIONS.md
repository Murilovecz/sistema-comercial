# Registro de decisões

## G-001 a G-004 — Sincronização aprovada em 05/10/2026

**Fonte:** [Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md) aprovado pelo proprietário e [pedido desta rodada](../briefings/GOVERNANCE_SYNC_SOURCE_2026_10_05.md). **Escopo implementado: documentação/governança; sem código, migration, commit ou push.** As decisões datadas abaixo permanecem como histórico de seus respectivos escopos; a presente entrada e o mestre governam a direção atual.

| ID / status | Decisão e consequência |
| --- | --- |
| **G-001 — APROVADA / organização documental IMPLEMENTADA** | Mestre na raiz é a única fonte conceitual; PROJECT_MASTER é índice de estado/governança. Código/testes provam o implementado. Mestre/roadmap anteriores arquivados; registros V1.1/V1.2/V1.3 preservados. DOCX é representação formatada mencionada, não uma segunda decisão examinada nesta rodada |
| **G-002 — APROVADA / mapa documental IMPLEMENTADO** | Tenant é Conta/Organização → Entidade Legal/Titular PF/PJ → Unidade. Core e Financeiro Básico obrigatórios; módulos opcionais/add-ons/adapters; Fiscal independente/transversal; Inteligência de Mercado e Finanças Pessoais são produtos independentes. Implementação e mapeamento legado ainda PLANEJADOS |
| **G-003 — APROVADA / plano documental IMPLEMENTADO** | Ordem A–G do proprietário: governança; replay isolado; especificação organizacional; cinco controles; dispositivos/fronteiras; agregados; React. Piloto React Produtos imediato deixa de ser próximo milestone automático. B–G não autorizadas por este plano; C requer revisão/aprovação antes de migrations |
| **G-004 — APROVADA como regra de governança** | Recomendações não são decisões. Mudança contraditória ao mestre exige seções afetadas, evidência, alternativas/trade-offs, decisão explícita do proprietário, compatibilidade/recuperação/testes e revisão versionada. Sem commit/push sem autorização |

**Alternativas documentais consideradas:** mover o mestre para docs (melhor agrupamento, mudaria a entrada aprovada); manter dois mestres (risco de divergência); manter o mestre na raiz e converter o antigo em índice (escolhida, preserva entrada e links). Arquivamento conserva texto e ajusta somente links relativos. Não há escolha de schema/stack/fornecedor por esta consolidação.

**Reclassificação:** [auditoria](../auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md) preserva replay/persistência híbrida/React/ausências/controles sólidos. Pessoas comuns, produtos sem estoque, bloqueio absoluto de negativo e alçadas passam a ter divergências explícitas contra o alvo aprovado. Isso não autoriza retirar controles, unir cadastros ou implementar o alvo agora.

**Implementação real:** React/TypeScript/Vite já possuem base/sessão/login/contexto/Design System na V1.3, conforme código e frontend/README. Afirmações de não adoção no fechamento V1.2 são registros daquela data, não o estado vigente. Homologação B/610 continua histórica. [Estado](PROJECT_MASTER.md), [mapa modular](MODULES.md), [plano](ROADMAP.md).

**Aberto:** modelos formais, correspondência company_id/unit_id, detalhamento de políticas/alçadas/estoque/preços, entitlement, dispositivos, segurança detalhada, valores/retenção/RPO/RTO/SLA/offline, fiscal/jurídico e stack de implantação. Listas P-* antigas abaixo são contexto; não tornam escolhas fechadas no mestre novamente opcionais.

## Fechamento local V1.2 — 03/10/2026

Fundação V1.2 fechada localmente: versão **1.2.0-foundation.1**, tag `v1.2.0-foundation.1`, **B, 610/610**, migrations **001–010**, seis agregados SQL. Checkpoint funcional `2a2177c7b80734722f71bd9e72029cf9e1b39df0`, documentação em `33b4efc80bc0f3edf9c4b76873719d06e49cc323`. Condições B formalmente aceitas neste escopo: snapshots/Caixa/Financeiro, escrita/RSS, restore apenas sintético, favicon e capacidades futuras. [Estado/fontes](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md). Sem nova escolha de stack/infraestrutura/regra comercial ou reclassificação da homologação.

- Direção modular monolith/backend autoritativo/tenant permanece; SQLite é local, PostgreSQL/cloud/Windows/Edge futuros; Next.js/React/TypeScript não foram adotados.
- D-015 foi ampliada pela migration 009: Vendas SQL/lista/detalhe/filtros/busca/paginação sem payload integral; escritas ainda materializam estado. Caixa/Financeiro e outros módulos conservam ponte snapshot. Decisões V1/V1.1 abaixo preservam o estado da época.
- Migration 008 implementa troca/reset administrativo, sessões/revogação e manutenção; D-017 permanece com grant temporário/consumo atômico/executor/autorizador/motivo. Reset global multiempresa/e-mail, MFA/passkeys/biometria/dispositivos continuam futuros.
- Git/checkpoint local, backup/validação/agendamento/retenção e restore isolado existem; restore validado sinteticamente não homologa procedimento da loja/DR real/RPO/RTO/proteção externa. [Operação](OPERATIONS_V1_2.md).
- Migration 010 é índice FK não único; statement/acumuladores/Map locais são melhorias medidas, sem nova arquitetura ou regra comercial. [Matrizes separadas](../atualizacoes/v1.2/PERFORMANCE_V1_2.md). Escritas large ~2 s, snapshot crescente e RSS a acompanhar permanecem condições B.
- D-013/D-016 seguem: representação exata preparatória, operações comerciais inteiras; UOM/conversões/arredondamento/fracionamento aguardam especificação. Auditoria hash/seqüência local não neutraliza administrador de SQLite/mecanismo; âncora externa é futura.

Reconciliação documental entregue para revisão; não autoriza commit/versão/tag/push ou próxima fase. Preservar históricos, compatibilidade/atomicidade/idempotência e dados existentes.

## Printing & Devices / Commerce Hub — diretrizes adotadas, 02/10/2026

Status: **PLANEJADO**, sem implementação executável nesta tarefa. Origem: [briefing integral do Murilo](../briefings/PRINTING_COMMERCE_SOURCE.md). Revisão selecionada: Banco (persistência/precisão e compatibilidade), Arquitetura/Produto (limites e fluxo), Integrações/Segurança (contas, eventos, credenciais e Edge); Documentação/Codex consolida requisitos, evidências e referências.

**D-019 — Printing & Devices:** serviço comum de jobs/documentos/destinos, adapters Windows/protocolos e contratos de entrada para periféricos; emissão/autorização permanece no Fiscal. Rejeitar drivers de fabricante acoplados a Venda e motores de impressão por canal. Motivo: impressão térmica, etiquetas, A4 e logística reutilizam coordenação sem repetir efeitos comerciais/fiscais. Aceite do spooler não prova impressão física; timeout/reimpressão terão tratamento explícito. Compatibilidade só será declarada para equipamentos realmente testados. [Requisitos/aceite](PRINTING_AND_DEVICES.md).

**D-020 — Commerce Hub / Omnichannel:** módulo de conexões/adapters, anúncios/mapeamentos/variações e pedidos normalizados, com disponibilidade central coerente e preço por canal sem duplicar Produto. Rejeitar estoques/fontes comerciais independentes por marketplace e regras de canal no Core. Multicontas por empresa; IDs externos por empresa+conexão+tipo+ID; unidade de consumo configurável. Autoridade por dado documentada em cada adapter. Financeiro/Logística permanecem núcleos únicos; taxas e DRE usam dimensões/classificações, sem segunda contabilidade. [Requisitos/aceite](COMMERCE_HUB.md).

**D-021 — efeitos externos e segurança:** jobs/eventos duráveis coordenados com transação, efeitos internos idempotentes, webhook mais reconciliação, eventos fora de ordem, retries/backoff limitados e falhas visíveis. Inbox/outbox no monólito é opção futura; não instalar infraestrutura antecipadamente. Chamadas externas não mantêm transação SQL aberta; timeout ambíguo exige consulta/revisão antes de repetir efeito. Segredos somente backend por empresa/conexão. Desktop/Edge usa comandos tipados/autenticados/limitados para destinos cadastrados, nunca executor remoto genérico. Não prometer entrega externa exatamente uma vez ou ausência de overselling offline.

**D-022 — compatibilidade e prioridade:** D-013/D-016 continuam válidas. SQL decimal textual/BigInt já evita restrição permanente a inteiros; projeção/hidratação/domínio atuais ainda exigem inteiro seguro. Frações precisam contrato ponta a ponta e regras de unidade/fator/arredondamento históricos. Não alterar migrations/schema/runtime nesta tarefa: nenhum impedimento imediato demonstrado. Evolução técnica/recuperação atuais mantêm prioridade; próximos modelos devem passar pelo checklist de Printing/Commerce antes de implementação. Futuras migrations exigem desenho, compatibilidade, recuperação e ensaio isolado.

**Divergências e consolidação:** representação decimal existente não significa venda fracionada pronta; scanner em modo teclado/impressão pelo navegador não homologam periféricos; atributos/embalagens não comprovam variações omnichannel; catálogo por unidade e reservas em snapshot exigem evolução antes de estoque agregado. `product.stock` já representa vendável no fluxo de quarentena: não descontar retido duas vezes. Todos os revisores recomendaram documentação e contratos futuros, sem ajuste estrutural agora. A atualização V1.1 ocorreu durante esta revisão em outra execução; estado final foi relido, sem atribuir seu encerramento a esta tarefa. [Relatório](../historico/PRODUCT_DIRECTIONS_REPORT.md).

**A DEFINIR:** primeiro canal/equipamento, tecnologia Desktop, matriz homologada, estados/retenção de jobs, precisão/arredondamento/unidades/conversões, identidade de variação/catálogo compartilhado, disponibilidade/reservas/buffer/alocação, promoção/autoridade por campo, taxas/DRE, credenciais/API pública, retenção e políticas offline. Contratos externos serão consultados na documentação oficial vigente quando cada adapter entrar em implementação.

Data inicial: 01/10/2026. **Direção adotada** não significa **implementação concluída**. Novas decisões devem registrar contexto, alternativas, justificativa, consequências e evidência; divergências importantes entre especialistas ficam explícitas.

## Direções adotadas

| ID | Decisão e origem | Consequência |
| --- | --- | --- |
| D-001 | Usar somente `D:\Projeto Sistema Local`; instrução do Murilo | Não desenvolver a cópia antiga do projeto |
| D-002 | Dez papéis permanentes em agents/, selecionados por tarefa; briefing de agentes | Não ativar todos nem manter dez processos continuamente |
| D-003 | Memória oficial em docs/ com documento mestre e estado verificável; briefing mestre | Separar ATUAL, PLANEJADO e A DEFINIR; preservar fontes/histórico |
| D-004 | Preferência inicial por monólito modular; briefing mestre | API e contratos claros; evitar microserviços por antecipação |
| D-005 | Cloud-first, API-first, servidor central como autoridade; briefing mestre e pedido de servidor host | Protótipo local não será publicado sem fundação segura |
| D-006 | Cliente Windows no computador da loja; pedido do Murilo e briefing | Backend central não deve ser distribuído completo; tecnologia pendente |
| D-007 | Multiempresa/unidade com controle de acesso e propriedade segura; briefing | Ownership, queries e relações precisam de isolamento verificável |
| D-008 | Cliente potencialmente hostil; regras críticas/autorização no backend; briefing | Segurança não depende de esconder código, botão ou chave embutida |
| D-009 | Edge opcional futuro; requisito de loja operar sem internet | Autoridade central preservada; regras/prazo e prioridade offline pendentes |
| D-010 | Preservar dados/históricos e reaproveitar o protótipo; pedido e briefing | Evolução incremental, sem grande refatoração nesta entrega |
| D-011 | Tester pausado por solicitação do Murilo | Definição QA não o reativa; Codex continua verificando o que altera |
| D-012 | Conferir recursos já existentes antes de criar outro lançamento; pedido do passeio | Custo e recebimento de compra têm fonte atual a reutilizar |

Fontes: [briefing de especialistas](../briefings/AGENT_ROLES_SOURCE.md), [briefing mestre](../briefings/PROJECT_BRIEF_SOURCE.md) e pedidos do Murilo preservados nos documentos históricos/anotações.

## Decisões Fundação V1 — 02/10/2026

V1-D-001: diretor e tester antigos desativados; trabalhar com os novos papéis conforme os [20 passos autorizados](../atualizacoes/fundacao-v1/FOUNDATION_V1_SOURCE.md). O QA novo pode participar; a desativação anterior não o impede.

V1-D-002: modelo de identidade/RBAC e bridge comercial aprovado tecnicamente por Architect, Database e Security depois do mapa completo. Constraints compostas, sessão sem NULL parcial, contexto revalidado, leituras protegidas e auditoria transacional são condições de implementação. Ver [modelo](../atualizacoes/fundacao-v1/FOUNDATION_V1_MODEL.md).

V1-D-003: SQLite local via node:sqlite, SQL parametrizado, migrations checksum/transação e desenvolvimento/teste isolados. PostgreSQL é alvo estratégico para servidor central, com adapter e testes de paridade ainda pendentes. Comparação, alternativas ORM, riscos e fontes em [decisão SQL](../atualizacoes/fundacao-v1/FOUNDATION_V1_SQL_DECISION.md). Não instalar infraestrutura cloud nesta fase.

V1-D-004: compatibilidade comercial por snapshot SQL por empresa/unidade; normalização comercial futura permanece dívida explícita. Nenhuma resposta completa sem as cinco permissões de leitura. Estado antigo não terá autoria verificada inventada. Essas limitações permitem preservar os fluxos sem reescrever o sistema.

V1-D-005: identidade local por Argon2id e cookie opaco HttpOnly/SameSite, hash da sessão no SQL, expiração/inatividade/logout, CSRF/Host/Origin e contexto revalidado. Bootstrap aleatório privado fecha após o primeiro usuário; não há senha padrão. Recuperação e MFA permanecem pendentes. Ver [auth](../atualizacoes/fundacao-v1/FOUNDATION_V1_AUTH.md).

V1-D-006: cada operação lê o estado atual dentro da transação síncrona, grava snapshot/índice/auditoria e somente depois responde sucesso. Validações comerciais existentes são preservadas. Falha na auditoria desfaz a operação. Testes isolados/HTTP e seus limites estão no [relatório](../atualizacoes/fundacao-v1/FOUNDATION_V1_REPORT.md).

V1-D-007: origem JSON preservada e importação SQL conferida por igualdade canônica, IDs, contagens, centavos e hash antes/depois. Reimportação idêntica não sobrescreve operações posteriores; origem diferente/estado existente exige revisão. Campos desconhecidos permanecem opacos, sem regras inventadas.

V1-D-008: auditoria transacional com executor verificado, triggers append-only e hash encadeado; não é inviolável contra administrador do arquivo. Aprovação excepcional não é habilitada: authorizedBy permanece vazio, sem PIN/biometria fictícios nem identidade retroativa.

V1-D-009: rascunhos/preferências separados por usuário/empresa/unidade verificados; chaves antigas preservadas sem adoção automática. Troca de contexto/login/logout recarregam os módulos. Export temporário pertence à sessão/empresa/unidade por cinco minutos. Namespace não equivale a criptografia do navegador.

V1-D-010: entrega **1.0.0-foundation.1** local, Node >=24.7, bind loopback e produção recusada. PostgreSQL/cloud, Edge, executável, cobrança/fiscal/integrações não fazem parte desta implementação. Sem Git ou backup operacional configurados; essas pendências antecedem implantação remota.

## Diretriz posterior à Fundação V1

**D-013 — diretriz de evolução, 02/10/2026, solicitada pelo Murilo:** normalizar Produtos, Compras, Estoque e futuramente Vendas sem pressupor venda exclusivamente por unidade inteira. O desenho deve suportar quantidades decimais, unidades de medida e conversões futuras. Precisão, arredondamento e contratos de conversão permanecem A DEFINIR, com preservação de históricos e saldos; o código atual não foi alterado por essa anotação. O fiscal brasileiro continua PLANEJADO e isolado do domínio comercial. Consequência: revisar estes requisitos antes de aprovar os próximos modelos e migrations comerciais. Ver [documento mestre](PROJECT_MASTER.md#solicitações-já-anotadas) e [banco](DATABASE.md#quantidades-e-unidades-de-medida-planejado).

## Escolhas A DEFINIR (registro da fundação documental; avanços acima prevalecem)

| ID | Escolha | Alternativas/impactos a analisar |
| --- | --- | --- |
| P-001 | Primeiro nicho e escopo de lançamento | Prioriza requisitos operacionais, fiscal e offline |
| P-002 | Evolução do banco central | SQLite nativo já escolhido localmente; PostgreSQL/adapter/paridade ainda planejados |
| P-003 | Complementos de identidade | Vínculos/RBAC/exceção, troca/reset administrativo e sessões atuais; recuperação global/e-mail, MFA/passkeys/biometria/dispositivos futuros |
| P-004 | Tecnologia desktop | Electron/Tauri ou outra abordagem; empacotamento, dispositivos e atualização |
| P-005 | Cloud, domínio, armazenamento e ambientes | Custos, secrets, TLS, backup, monitoramento e recuperação |
| P-006 | Offline: operações, janela, lançamento e conflitos | Continuidade versus revogação, saldos e risco de adulteração |
| P-007 | Planos/cobrança/juros/multa e suspensão | Políticas configuráveis; histórico de aviso 5 dias/carência 7, sem execução atual |
| P-008 | Fiscal e primeiro fornecedor externo | Regras aplicáveis, sandbox, taxas, eventos e homologação |
| P-009 | Custo, margem e classificação/DRE | Fonte já existente; custo médio/regime e novos critérios não definidos |
| P-010 | RPO/RTO, proteção externa, retenção operacional, LGPD e suporte | Retenção local já implementada; requisitos operacionais/obrigações e validação específica pendentes |
| P-011 | API pública, versionamento e compatibilidade | Consumidores, respostas/erros, acesso e transição incremental |
| P-012 | Fechamento local V1.2 e recuperação operacional | Versão/tag/fechamento local V1.2 concluídos; Git e backup/retenção/restore isolado existentes; procedimento operacional da loja continua pendente |

Não escolher todas essas alternativas nesta tarefa. Registrar a decisão quando uma entrega concreta exigir a escolha e houver dados suficientes.

## Divergências da fundação documental — histórico de 01/10/2026

Os itens abaixo registram a consolidação anterior à Fundação V1. A migração local SQL/identidade de 02/10 está registrada acima; cloud/desktop/Edge continuam planejados.

- Documentos antigos enfatizam execução local e evolução desktop; o novo briefing define nuvem como autoridade. **Consolidação:** execução atual permanece local, direção futura é cloud-first com cliente Windows e Edge opcional. Nenhuma arquitetura foi migrada nesta tarefa.
- Pedido anterior exige loja sem internet; briefing posiciona Edge na fase 9. **Consolidação:** preservar o requisito, antecipar seu desenho e deixar momento/escopo do lançamento A DEFINIR.
- Histórico traz sete dias de carência; o novo briefing pede políticas configuráveis. **Consolidação:** manter o pedido histórico como referência comercial, não como número hardcoded nem prazo offline.
- Pedido de agentes anteriores era colaboração contínua; o briefing agora pede definições sob demanda. **Consolidação:** manter papéis e selecionar somente os relevantes; esta tarefa não reinicia ciclos ou agentes contínuos.

## Modelo para futuras decisões

Registrar ID/data, status, problema concreto, alternativas, recomendações dos especialistas e divergências, decisão consolidada, motivo, efeitos nos módulos/dados/segurança, plano de transição, testes e documentos afetados. Reabrir decisão quando evidência nova justificar mudança; preservar o registro anterior.

## Decisões V1.1 — 02/10/2026, IMPLEMENTADAS

**D-014 — respostas por direito:** endpoints com DTO explícito, paginação limitada e busca exata. Não abrir snapshot para perfil parcial; manter API completa como ponte de compatibilidade. Alternativa de reescrever todos os módulos rejeitada nesta etapa. Catálogo não inclui saldo/custo e nem permite inferi-los por ordenação.

**D-015 — normalização incremental:** migrations aditivas 002..006, um agregado por vez (Produtos, Clientes, Fornecedores, Compras/Recebimentos, Estoque/Movimentos). SQL é autoridade; espelho preserva extras/ausências/ordem e divergência é recusada. Domínio, SQL, espelho, revisão e auditoria na mesma transação. Vendas/Caixa/Financeiro continuam transitórios; não alegar normalização universal. Cópia consistente e ensaio de equivalência antes da atualização. Não há downgrade automático/restauração pelo JSON antigo.

**D-016 — quantidades:** TEXT decimal exato e cálculos técnicos BigInt, sem REAL. Unidades declaradas preservadas, não inferidas. Operação inteira atual permanece até especificar precisão/arredondamento/conversões. Evitar perda na migração sem inventar regras fracionadas; fiscal planejado separado.

**D-017 — autorização de inativo:** direito explícito sales.authorize_inactive, senha real e motivo; grant curto, hash-only, vinculado a sessão/executor/escopo/conteúdo/produtos e consumido uma vez na transação. Prova interna não forjável por JSON. Revalidar direitos/senha/contexto; registrar autorizador apenas nos itens realmente inativos e preservar cadastro. Sem PIN/biometria ou privilégio pelo nome do cargo. Alternativa de senha/PIN compartilhado no frontend rejeitada. Migration 007 concede direito uma única vez aos papéis com todos os direitos anteriores explícitos; revogação persiste.

**D-018 — interface e fonte única:** quick views reutilizam formulários; comandos menores compartilham domínio de cadastro. Custo vem de recebimento; Receber compra só navega/filtra. Não criar nova entrada/custo. Venda direta com scanner/manual e preview comercial sem autoridade de aprovação; edição invalida grant e retry conserva chave de confirmação para evitar duplicação.

**Consolidação dos especialistas:** Banco/Backend, Arquitetura/Segurança, Produto/UX e QA revisaram suas partes. Compatibilidade exige materializar estado/reconstruir agregados nas escritas; eficiência é dívida registrada, em vez de afirmar eliminação do snapshot. Históricos sem identificação e origens ainda em snapshot não recebem atores/FKs fictícios. [Relatório](../atualizacoes/v1.1/FOUNDATION_V1_1_REPORT.md): 457 testes, ensaio em cópia e visual isolado; [achados corrigidos](../atualizacoes/v1.1/FOUNDATION_V1_1_FINDINGS.md).
