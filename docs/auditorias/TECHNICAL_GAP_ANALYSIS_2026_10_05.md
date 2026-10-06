# Auditoria técnica de 05/10/2026 — registro e reclassificação

## Proveniência e limites

Este arquivo registra de forma consolidada as descobertas do relatório entregue em chat na auditoria somente leitura de 05/10/2026; não é transcrição literal daquele relatório. Acrescenta uma segunda camada de interpretação após disponibilização/aprovação do [Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md). As evidências anteriores não foram descartadas ou transformadas retroativamente em testes do novo alvo.

Baseline de código: branch `v1.3-frontend`, HEAD `af98255f1eadef57d86b6e76d438a7657df9ff40`. Versão backend `1.2.0-foundation.1`, migrations 001–010. Na auditoria inicial o mestre v1.0 não estava disponível; usaram-se o PROJECT_MASTER anterior, documentos vinculados e os requisitos solicitados. Agora o mestre define decisões desejadas; código/testes continuam fonte do implementado.

**Auditoria inicial:** Git limpo antes/depois; nenhuma edição/commit. 29 testes selecionados aprovados (8 funções puras + 8 acesso/RBAC/auditoria/autorização/contexto em memória + 13 identidade em memória); 235 arquivos JS passaram sintaxe; typecheck React passou sem emissão. Inventário: 65 arquivos Node de testes e 10 specs frontend. Reprodução de replay feita em memória. A suíte B/610 é histórica V1.2, não execução integral atual.

Não se abriu banco da loja, iniciou runtime operacional, fez build/benchmark/backup/restore ou executou suíte que cria arquivos. Metadados operacionais mantiveram tamanhos/horários observados; isso não comprova integridade interna nem proteção do banco. Sem pentest ou certificação SaaS. Nesta sincronização apenas documentos/código fonte foram lidos; nenhuma nova homologação comercial.

## Descobertas preservadas da auditoria inicial

| ID | Evidência / arquivos | Impacto e risco preservados | Recomendação original para decisão posterior / esforço |
| --- | --- | --- | --- |
| G1 | [server.js](../../server.js), imports backend de `public/*-core.js`, [state-repository](../../foundation/state-repository.js) | Transporte/domínio/compatibilidade acoplados; remoção de public quebra backend; maior raio de regressão | Extrair fronteiras conforme fluxo exigir; evitar reescrita ampla. MÉDIO/ALTO |
| G2 | [001](../../foundation/migrations/001_foundation.sql), [entities](../../foundation/entities.js): companies → units | Sem organização/entidade legal; reinterpretar company_id muda ownership | Especificar mapeamento/IDs/histórico/isolamento antes de migration. ALTO |
| G3 | [identity](../../foundation/identity.js), [rbac](../../foundation/rbac.js), [auth-maintenance](../../foundation/auth-maintenance.js), [checkout](../../checkout.js) | Identidade/sessões reais; escopo empresa/unidade; recuperação global/MFA/dispositivo ausentes; pos.station/shift são texto declarado | Preservar controles e projetar complementos; estação textual não autoriza. MÉDIO/ALTO |
| G4 | [admin](../../foundation/admin.js): criação de empresa exige todos os direitos locais e concede administrador inicial | Sem plano administrativo próprio da plataforma; não se demonstrou acesso automático a empresas de terceiros | Separar onboarding/cliente/plataforma, com limites futuros. ALTO |
| G5 | Migrations 002–009; [scoped-state](../../foundation/scoped-state.js) e state-repository | Seis agregados SQL com espelhos; Caixa/Financeiro/complementos híbridos; constraints não universais; PostgreSQL não é troca direta | Um agregado por vez com equivalência e recuperação. ALTO |
| G6 | [decimal](../../foundation/decimal.js), [storage](../../storage.js), pricing/carrinho | Decimal SQL/BigInt exato, mas legacyInteger e comandos recusam frações | Especificar escala/UOM/fatores/arredondamento/histórico ponta a ponta. ALTO |
| G7 | [audit](../../foundation/audit.js), triggers 001 e execução transacional | Append-only/hash local sólido; administrador do mecanismo pode reconstruir; filtragem por nome de campo não garante texto livre sem dado sensível | Preservar atomicidade; proteção externa/minimização futuras. MÉDIO/ALTO |
| G8 | server.sale, [cash.validateKey](../../cash.js), despacho POST /api/sales | requestId opcional permite duplicação real; API comercial nova protege replay, sem cobrir legado | Corrigir contrato/consumidores isoladamente com TDD e compatibilidade. MÉDIO |
| G9 | [002](../../foundation/migrations/002_products.sql), [003](../../foundation/migrations/003_customers.sql), [004](../../foundation/migrations/004_suppliers.sql) | Produtos/cadastros por unidade; clientes e fornecedores separados; sem PF/PJ comum | Decidir identidade/ownership antes de unificação; preservar vínculos. ALTO |
| G10 | [purchases](../../purchases.js), [inventory-store](../../foundation/inventory-store.js), [sales-store](../../foundation/sales-store.js), [commercial-write](../../foundation/commercial-write.js), payments/payables/accounts/cash/agreements | Compras SQL ainda usa estado completo; estoque reconstrói estruturas; Vendas lê SQL mas escreve materializado; Financeiro/Caixa sem normalização integral | Contratos menores e incrementos de persistência sem outra fonte de custo/recebimento. MÉDIO/ALTO |
| G11 | [App](../../frontend/src/app/App.tsx), [session](../../frontend/src/session/session.ts), frontend/ui; public global | React real de acesso/contexto/Design System; páginas comerciais ausentes; duas interfaces coexistem | Piloto delimitado antes de ampliar; proposta de próximo piloto foi posteriormente superada. MÉDIO/ALTO |
| G12 | [http](../../frontend/src/api/http.ts), [request-context](../../foundation/request-context.js), server e [catalog-ui](../../public/catalog-ui.js) | Mesma origem/headers/CSRF/limites existentes; legado exige cinco leituras; HTTP local/sem CSP/limites distribuídos; ID interpolado cru em atributo HTML é revisão condicionada à entrada maliciosa | DTOs mínimos/revisão de escape/implantação segura; XSS remoto não demonstrado. MÉDIO/ALTO |
| G13 | .gitignore, identity, [backup-service](../../foundation/backup-service.js), [restore](../../scripts/restore-local-sql.js) | Hashes/exclusões; buscas limitadas sem padrões comuns de secrets; bootstrap privado remanescente; backup consistente local sem proteção externa/assinatura/criptografia própria; restore apenas sintético | Gestão de secrets/ACL e cópia externa protegida/procedimento/RPO/RTO. MÉDIO/ALTO |
| G14 | foundation/*.test.js e frontend/*.spec.* | Cobertura negativa local útil; mocks/markup não provam operação/acessibilidade real; futuras capacidades sem testes | Testes por incremento e homologação pertinente em ambiente autorizado. MÉDIO |
| G15 | loadState/writeState, [sql-store](../../foundation/sql-store.js), [performance V1.2](../atualizacoes/v1.2/PERFORMANCE_V1_2.md) | Materialização/reconciliação, BEGIN IMMEDIATE também em leituras, atualização de sessão e LIKE %texto%; escrita large ~2s histórica; RSS a acompanhar, sem leak comprovado | Medir e reduzir trabalho por comando antes de infraestrutura; não alegar capacidade SaaS. ALTO |
| G16 | Mestre/arquitetura antigos e contrato V1.3 datado versus código React | Documentos atrasados diziam React não adotado/SPA não implementada | Reconciliar documentos vigentes sem reescrever registros históricos. BAIXO; tratado documentalmente nesta sincronização |

### G8 — Reprodução preservada

Função `sale` aceita ausência de `requestId` porque `validateKey` recusa somente valores presentes inválidos; replay só é procurado quando a chave existe. Roteamento legado não torna a chave obrigatória.

Entrada sintética em memória: produto p, preço 100 centavos, estoque 3, cliente anônimo; compra de 1 item, cash/received, sem requestId. Primeira chamada gera 1 venda; repetir no resultado gera 2 vendas, estoque 1 e requestId null. Não houve gravação de arquivo ou requisição à loja.

Isso prova duplicação nesse caminho, não defeito universal em todos os comandos. Mesma chave/conteúdo já é protegida em outros caminhos. Gerar chave nova por tentativa no servidor não resolve. Histórico sem chave não deve ser reescrito para parecer protegido. [Fase B](../atual/ROADMAP.md).

## Matriz inicial e interpretação com o mestre disponível

**ATENDE:** comportamento presente no recorte indicado. **PARCIAL:** base existente, falta parte relevante. **NÃO ATENDE:** capacidade ausente. **CONFLITA:** comportamento/modelo existente difere da decisão alvo; exige mudança posterior, não autorização automática.

| Área | Classificação inicial | Com mestre v1.0 / fundamento |
| --- | --- | --- |
| Monólito/modularidade | PARCIAL | PARCIAL — §1; acoplamentos G1 |
| Backend authority local | ATENDE | ATENDE no recorte local — §§1/15; cloud definitivo não implantado |
| Cloud/servidor central | NÃO ATENDE | NÃO ATENDE — §§1/16; produção recusada localmente |
| Multi-tenant completo | PARCIAL | PARCIAL — tenant agora é organização (§2); não rebatizar companies |
| Hierarquia organizacional | PARCIAL | PARCIAL — decisão alvo fechada, mapeamento C pendente |
| Autenticação/sessões | PARCIAL | PARCIAL — §16.3 acrescenta dispositivo/step-up proporcional ao risco |
| RBAC deny-by-default local | ATENDE | ATENDE no recorte — escopos completos/políticas/dispositivo ausentes |
| Escopos organizacionais | PARCIAL | PARCIAL — §§2/4 |
| Entitlement | NÃO ATENDE | NÃO ATENDE — distinto dos outros quatro controles (§4), não simples flag de UI |
| Administração plataforma/cliente | PARCIAL | PARCIAL — separação é decisão fechada (§16.1), implementação ausente |
| Usuários | PARCIAL | PARCIAL — identidade/vínculos locais; recuperação global/dispositivo/Tier 0 futuros |
| Dispositivo confiável | NÃO ATENDE | NÃO ATENDE — identidade própria/revogável aprovada (§§11.3/16.4) |
| Estações/turnos | PARCIAL | PARCIAL — texto declarado não substitui station formal |
| Banco/cobertura SQL | PARCIAL | PARCIAL — seis agregados, snapshot residual; novo modelo necessita especificação |
| Migrations locais | ATENDE | ATENDE — preservar checksum/ordem/transações; nenhuma migration criada |
| Precisão monetária atual | ATENDE | ATENDE no recorte — centavos/inteiro seguro/BigInt; não prova motor de alçadas |
| Quantidades/UOM ponta a ponta | PARCIAL | PARCIAL — representação exata; frações/contratos futuros |
| Auditoria | PARCIAL | PARCIAL — §16.13 inclui dispositivo/contexto completo/proteção; base local preservada |
| Idempotência geral | CONFLITA | CONFLITA — §§1/19; G8 mantido como próximo defeito isolado |
| Produtos/catálogo | PARCIAL | PARCIAL como agregado; comportamento de estoque obrigatório CONFLITA com §5.1 |
| Clientes/Pessoas/Organizações | PARCIAL | CONFLITA no modelo separado — §5 exige base comum e múltiplos papéis; preservar dados até migração |
| Fornecedores | PARCIAL | CONFLITA no modelo separado — mesmo §5, sem concluir que histórico pode ser fundido |
| Compras | PARCIAL | PARCIAL — §7.8; recebimento existente útil, XML/fiscal futuros |
| Estoque | PARCIAL | PARCIAL no agregado; bloqueio absoluto/negação de negativo CONFLITA com §7.2 |
| Vendas | PARCIAL | PARCIAL — replay G8 e dependências; serviços/integração opcional incompletos |
| Financeiro/Caixa | PARCIAL | PARCIAL em funções; acoplamento de recebíveis/estado CONFLITA com independência §3.2 |
| Fiscal | NÃO ATENDE | NÃO ATENDE — domínio independente/transversal definido (§10), emissão não existe |
| Arquivos/anexos | NÃO ATENDE | NÃO ATENDE — capacidade Core (§3.1), não add-on presumido |
| Frontend React | PARCIAL | PARCIAL — §19.1 confirma base atual; retomada G posterior |
| Frontend/backend | PARCIAL | PARCIAL — mesma API local/DTOs; sem gates novos/contratos externos |
| Segurança de APIs | PARCIAL | PARCIAL — 14 blocos/requisitos formais futuros; controles locais não são SaaS |
| Isolamento cross-tenant local | ATENDE | ATENDE no recorte companies/units; não certifica hierarquia futura, arquivos/eventos ausentes |
| Segredos/credenciais | PARCIAL | PARCIAL — §16.8; buscas limitadas sem certificação de ausência |
| Backup/restore | PARCIAL | PARCIAL — §16.9; recuperação separada/imutabilidade/PITR conforme infraestrutura futuros |
| Offline/sync SaaS | NÃO ATENDE | NÃO ATENDE — política de preservar fatos válidos fechada, protocolos/janela abertos |
| Agente Local | NÃO ATENDE | NÃO ATENDE — coordenador limitado/identidade própria definido (§11), implementação ausente |
| Atualização automática | NÃO ATENDE | NÃO ATENDE — assinaturas/pipeline/rollout/updater definidos (§12) |
| Testes/homologação integral | PARCIAL | PARCIAL — TDD/regressão incremental obrigatórios (§19); não certificar alvo por B/610 |
| Performance | PARCIAL | PARCIAL — G15 mantido, métricas atuais não repetidas |
| Coerência documental | CONFLITA | Reconciliada nesta rodada nos documentos vigentes; textos datados preservados/contextualizados |

Classificações de conflito aqui comparam o **alvo aprovado** com o legado, não desqualificam retrospectivamente a entrega V1.2 nem autorizam mudanças durante a sincronização.

## Decisões que mudam a interpretação

### Modelo organizacional e pessoas

Agora a organização é tenant, e entidade legal PF/PJ é um nível próprio (§2). Não se deve escolher um modelo final de dois níveis como equivalente ao mestre. Alternativas físicas de transição continuam abertas, mas ambas precisam realizar a hierarquia aprovada. A fase C deve mapear explicitamente os atuais IDs, sessões/vínculos, PK/FK, entidade histórica e recuperação; nenhum mapeamento foi aprovado aqui.

§5 decide uma base comum PF/PJ com múltiplos relacionamentos. A alternativa anterior de manter clientes/fornecedores permanentemente como cadastros independentes deixa de ser desenho alvo aprovado; pode permanecer apenas como ponte de compatibilidade, com evolução especificada. **Risco:** fusão incorreta/isolamento; dependência C; esforço ALTO.

### Core e Financeiro Básico

§3.2 exige operação financeira mesmo sem Vendas/Produtos/Estoque contratados. `storage.js` requer listas products/customers/sales; recebíveis em `accounts.js` e projeções financeiras usam vendas; as escritas/ponte têm dependências transversais. Isso não implementa independência funcional/ativação, e DRE básica/consolidação não estão prontas.

Produtos/Vendas/Estoque deixam de ser descritos como Core. Entitlement continua ausente. **Recomendação posterior:** especificar dependências/obrigações financeiras próprias e contratos opcionais, preservando liquidações/históricos. Alternativas de implementação incremental são possíveis; tornar Financeiro opcional contradiz o alvo. **Risco alto, dependências C/D/F, esforço ALTO.**

### Produtos com ou sem estoque e Serviços

§5.1 permite produto sem controle de estoque; §5.2 exige Serviço próprio e abstração comercial comum. Venda atual busca produto, verifica disponível, decrementa stock e gera movimento para cada item; `storage.js` valida stock em todo produto. **CONFLITA** nesse comportamento obrigatório; serviços são **NÃO ATENDE**.

**Recomendação:** modelar tipos/capacidade de estoque e contratos de item antes de alterar venda. Alternativas de abstração física precisam respeitar serviço próprio e produto sem estoque, não simular serviço como variante. Dependências C/D/F, preservar itens históricos; **esforço ALTO**, sem implementação agora.

### Estoque negativo, estados e transferências

§7.2 não admite bloquear automaticamente venda física válida somente por divergência sistêmica. `server.sale` recusa disponível inferior à quantidade; `storage.js` recusa stock negativo. **CONFLITA** com essa política alvo. Não remover guardas agora: permissões, prova/condição operacional, estados, ocorrência e reconciliação exigem especificação.

§7.3 exige propriedades de estado/localização; os cálculos atuais de reserva/quarentena são úteis, sem máquina genérica implementada. `positions.js` opera posições do mesmo estado/unidade, não comprova transferência interunidade com trânsito/recebimento. Reservas reduzem disponibilidade sem baixa física; essa base é a preservar.

**Recomendação posterior:** especificar estados e política negativa/ocorrência, testes e migração; alternativas de projeção/acumuladores não podem mascarar negativo ou apagar fatos válidos. Dependências C/D/F, **risco alto/esforço ALTO**.

### Preços e alçadas

§6.1 ancora alçada manual no preço de referência; §6.2 separa `policy.manage`. `pricing.validatedOffer` e commercial-write aceitam combinação promoção/desconto mediante `allowPromotionDiscount`; discountTotals valida valor/motivo, sem alçada por identidade. RBAC não contém policy.manage. Confirmação booleana/justificativa não é aprovação superior.

**CONFLITA** no mecanismo atual de autorização para desconto adicional contra a política alvo; motor formal/políticas ainda faltam. Não confundir aprovação de produto inativo existente com aprovação de desconto.

**Recomendação posterior:** especificar determinismo, elegibilidade, precedência/combinação, piso de referência, política/escopo e prova de exceção, preservando proveniência/versões. Alternativas de motor são abertas; promoção aumentar alçada não é alternativa aprovada. Dependências D/F, **risco financeiro/esforço ALTO**.

### Offline, distribuição e produtos independentes

Política conceitual de conflito já está fechada (§11): fatos válidos preservados/reconciliados, editáveis por versão/conflito, críticos cloud-only. Não tratar exclusão de venda válida ou last-write-wins financeiro como alternativa equivalente. Mecanismos/janela/validade ainda abertos; não congelar 72h. Estação/Agente registrados e autorização cloud assinada estão definidos, não implementados.

Updaters/releases assinados e pipeline oficial são decisões (§12); fornecedor/stack seguem abertos. §§13–14 separam Inteligência de Mercado/Finanças Pessoais do ERP/BI interno; backups não alimentam analytics. Não há pipelines desses produtos implementados, amostragem/base legal continuam abertas.

## Gaps e riscos preservados

- Segurança: replay legado; separação administrativa/entitlement; recuperação/MFA/estação; gestão de secrets e implantação remota; auditoria externa/backup; escape condicionado de IDs, sem XSS remoto comprovado.
- Dados: hierarquia e pessoas comuns; Financeiro/Caixa/complementos relacionais; unidades/conversões; anexos; eventos/sync.
- Funcional: entitlement, plataforma admin, dispositivo confiável, fiscal/OS/serviços, anexos, sync/Agente/updater; React comercial ainda ausente.
- Migração: ownership/IDs/FKs/sessões; fusão de cadastros; eventos de estoque/financeiro; frações; importadores de public; paridade PostgreSQL; conflitos offline; compatibilidade do requestId.
- Duração/capacidade: escrita/snapshot/RSS e locks; números V1.2 são históricos, sem SLA ou prova de leak.

## Bases sólidas a preservar

Argon2id/sessões hash/expiração/revogação; deny-by-default/contexto revalidado; PK/FK compostas e queries parametrizadas; migrations aplicadas/checksums; commit só após domínio/SQL/espelho/índice/auditoria; divergência recusada sem reimportação; centavos/BigInt; históricos/autoria antiga não fabricada; aprovação excepcional vinculada/consumo atômico; fonte única de custo/recebimento; guardas de movimentos; backup consistente/restore isolado; bind local/produção recusada enquanto implantação não pronta.

A mudança futura de guardas de saldo/preço depende do novo contrato e testes. Preservar integridade não significa congelar regras legadas que o mestre explicitamente alterou.

## Prioridade e proposta anterior superada

O relatório inicial propôs “Contratos e piloto comercial V1.3”, incluindo piloto Produtos. **Era recomendação, não aprovação.** O proprietário substituiu a ordem por A–G: primeiro integridade/fundação, React somente em G. A proposta anterior fica registrada como superada.

Próximo único código proposto: **Fase B — replay da venda legada**, TDD Red/Green/Refactor, análise dos consumidores e compatibilidade, sem regra comercial nova/migration/refatoração ampla. Hierarquia antes de migrations; controles e dispositivos inicialmente especificados. [Plano/aceite e decisões abertas](../atual/ROADMAP.md). Nenhuma dessas correções começou nesta rodada.
