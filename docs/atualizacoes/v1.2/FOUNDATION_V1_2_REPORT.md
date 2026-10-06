# Fundação V1.2 — fechada localmente, 1.2.0-foundation.1

Reconciliação documental registrada em `33b4efc80bc0f3edf9c4b76873719d06e49cc323`; **fechamento formal local autorizado pelo Murilo em 03/10/2026**. Este documento consolida a homologação existente **B, 610/610**, sem nova execução. As condições B são aceitas como conhecidas e não bloqueantes neste escopo local.

## Identidade e resultado homologado

- Checkpoint local: `2a2177c7b80734722f71bd9e72029cf9e1b39df0` — Fundação V1.2: checkpoint do release candidate homologado.
- Versão oficial: **1.2.0-foundation.1**, definida em `package.json`. Versionamento e fechamento formal local concluídos; tag local anotada `v1.2.0-foundation.1`, sem push.
- Migrations **001–010**, com bytes/checksums preservados.
- Homologação de 03/10/2026: **B — HOMOLOGAÇÃO CONDICIONAL**, **610/610 aprovados**, zero falhos, ignorados ou cancelados. Nenhum bloqueador funcional demonstrado nos cenários testados.

Fontes locais privadas: relatório da homologação (evidência local opcional: `.qa/foundation-v1.2/homologation/rc-Ip8azD/RELATORIO.md`), resultado global final (evidência local opcional: `.qa/foundation-v1.2/homologation/rc-Ip8azD/full-final-result.json`) e conferência do checkpoint (evidência local opcional: `.qa/foundation-v1.2/homologation/rc-Ip8azD/CHECKPOINT_GIT.md`). A homologação capturou uma working tree sobre `c7360f46dce6b7f6c3b15ea4574d1298e41fc993`; o checkpoint posterior gravou o mesmo candidato e o teste complementar. Esses identificadores descrevem momentos diferentes, sem divergência funcional. As evidências em `.qa` são locais/ignoradas pelo Git e não estarão disponíveis automaticamente em outro checkout. Os fatos necessários estão consolidados neste documento e nos contratos versionados abaixo; consultar os artefatos brutos é opcional.

## ATUAL — implementação local

Monólito modular em evolução, backend Node.js autoritativo, interface HTML/CSS/JavaScript e SQLite local. Sessão, vínculos, RBAC deny-by-default e escopo composto isolam empresas/unidades; multi-tenant local não equivale a SaaS publicado. Não foi adotado Next.js, React ou TypeScript.

| Área | Estado comprovado | Limite transitório |
| --- | --- | --- |
| Produtos, Clientes, Fornecedores | SQL, equivalência, consultas paginadas e comandos menores por direito | Catálogo compartilhado entre unidades não implementado |
| Compras/Recebimentos | Cabeçalhos/itens/recibos relacionais, FKs compostas, domínio de recebimento existente | Consultas operacionais/custos e comandos ainda passam por estado completo; não há API proporcional própria para todo Compras |
| Estoque/Movimentações | `commercial_stock_movements`, `commercial_stock_balances`, posições, entradas, espelho/revisão/marcador e âncora técnica histórica | Reconstrução e compatibilidade permanecem; âncora não inventa operação ou autor |
| Vendas | Cabeçalho/filhos SQL, listagem/detalhe, busca/filtros/paginação SQL sem materializar `unit_states.payload` completo | Escritas usam estado materializado/snapshot; Caixa/Financeiro não foram normalizados integralmente |
| Acesso | Argon2id, sessões, troca de senha, reset administrativo, revogação e manutenção conservadora de grants | Sem recuperação por e-mail, MFA ou identidade de dispositivo confiável |
| Exceção de produto inativo | Senha real, direito `sales.authorize_inactive`, motivo, grant temporário/CAS; executor/autorizador e consumo atômicos com venda/estoque/auditoria | Produto permanece inativo; não concede exceção a outros fluxos automaticamente |
| Recuperação | Backup consistente, validação, agendamento local e retenção; restore em destino novo isolado | Agendamento depende do processo aberto; proteção externa/procedimento da loja não homologados |
| Git | Repositório e checkpoint locais existentes | Sem remoto/publicação; recuperar código não restaura dados |

Migration 008 mantém acesso; 009 acrescenta Vendas; 010 cria o índice **não único** `stock_movements_scope_receipt(company_id,unit_id,purchase_id,receipt_ordinal)` sobre `commercial_stock_movements`, preservando a FK diferida e múltiplos movimentos por recibo. Otimizações locais de estoque reduziram preparações e percursos repetidos sem mudar regras: statement local, acumuladores locais de sincronização/verificação e Map local de saldos. Detalhes e medições em [PERFORMANCE_V1_2](PERFORMANCE_V1_2.md).

Valores monetários continuam em centavos inteiros seguros; quantidades usam representação técnica exata onde aplicável. **Operações comerciais continuam inteiras.** UOM, conversões, precisão/arredondamento e fracionamento aguardam especificação; não há suporte comercial liberado a kg/litros fracionados.

## HOMOLOGADO — escopo e limites

A suíte final cobre acesso/CSRF, RBAC, tenant/unidade, migrations, equivalência, grants, atomicidade, idempotência, concorrência local, API e regressão. Restore sintético validou migrations/schema, integridade/FKs, credencial/login real, seis agregados, três escopos A1/A2/B1 e cadeia de auditoria. UI foi conferida com perfis comercial/financeiro/reduzido em 1024×768 e 1440×900. Leituras HTTP de Vendas tiveram `snapshotReads=0` nas três massas do instrumento.

A auditoria local encadeia hashes/seqüência e registra escopo, executor, autorizador/motivo quando comprovados, com rollback e replay sem efeitos duplicados nos fluxos testados. Administrador capaz de modificar SQLite e o mecanismo local pode reconstruir a cadeia; âncora externa permanece futura. Históricos sem autoria verificada não recebem identidade inventada.

## Condições B preservadas

- Snapshot em comandos e módulos não normalizados, especialmente Caixa/Financeiro e telas avançadas.
- Escritas large ainda próximas de **2,0 s**: venda normal 2.019,342 ms; excepcional 1.991,010 ms; recebimento 2.046,506 ms no sanity HTTP final compatível. Não há SLA aprovado; dados sintéticos em um computador/SQLite local, sem carga distribuída.
- `/api/state` e Financeiro crescem com volume. RSS final large foi de 340,9 para 784,2 MiB e pico de 972,0 para 1.043,2 MiB frente ao baseline HTTP. Merece acompanhamento; não demonstra leak nem prova sua ausência em serviço prolongado.
- Restore em destino isolado não valida procedimento operacional da loja, disaster recovery real, RPO/RTO, falha física ou infraestrutura externa.
- A documentação estava defasada na homologação e foi reconciliada nesta tarefa; a classificação **B não foi reclassificada**. Favicon ausente permanece observação cosmética.

Não se declara produção pronta, certificação de segurança, recuperação de desastre em produção ou capacidade cloud.

## FUTURO / A DEFINIR

Normalização completa de Caixa/Financeiro e retirada da ponte snapshot; Cloud/PostgreSQL/adapter e paridade; cliente Windows/Edge/offline; fiscal; impressão/hardware; Commerce Hub; cobrança/assinatura SaaS; MFA/passkeys/biometria/Windows Hello, device identity, rate limiting distribuído, KMS/HSM, âncora externa e hardening cloud. Segmento/lançamento, UOM/arredondamentos, catálogo entre unidades e política offline continuam a decidir conforme [ROADMAP](../../atual/ROADMAP.md) e [DECISIONS](../../atual/DECISIONS.md).

## Histórico preservado

Baseline V0.12: 205 testes; Fundação V1: 302; V1.1: 457. Gate inicial da homologação V1.2: 608; gate final: 610. Contagens anteriores, inclusive 562 quando datadas em sua rodada, não foram convertidas em contagem atual. Relatórios originais V1/V1.1, briefings e evidências de benchmark permanecem históricos.

Contratos e fontes: [API](../../atual/API.md), [SECURITY](../../atual/SECURITY.md), [DATABASE](../../atual/DATABASE.md), [ARCHITECTURE](../../atual/ARCHITECTURE.md), [Acesso](../../atual/ACCESS_V1_2.md), [Operação](../../atual/OPERATIONS_V1_2.md), [Vendas](../../atual/SALES_V1_2_MODEL.md) e [Passos](FOUNDATION_V1_2_STEPS.md).
