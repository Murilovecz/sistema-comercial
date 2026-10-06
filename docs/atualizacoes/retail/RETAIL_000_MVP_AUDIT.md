# RETAIL-000 — Auditoria do MVP de varejo especializado

**Data:** 06/10/2026. **Status:** auditoria documental entregue para revisão; propostas não aprovadas para execução.

**Baseline inspecionada:** `fe72a2e4c3416e56bf3c50950886a6b6ce4bc277`, branch `v1.3-frontend`, árvore limpa no início. Esse commit registra BRAND-001. Nenhum código, teste, migration, dependência ou dado foi alterado nesta auditoria. Nenhum banco operacional foi aberto. Não foram iniciados C3, Fase D ou BRAND-002; não houve commit/push.

## 1. Conclusão e limites da evidência

Existe uma base comercial local significativa, especialmente no legado: cadastro, famílias de produtos, compras e recebimentos, estoque com movimentações e inventário, balcão PDV, pagamentos divididos/troco, caixa, devoluções, contas e relatórios. **Não existe ainda um MVP comercial homologado para uma loja real.** O menor caminho é estabilizar e completar os fluxos necessários, reaproveitando essa base, e fechar as condições fiscais e operacionais do piloto.

Estimativa qualitativa: **base funcional de balcão/backoffice média a alta; prontidão operacional baixa; prontidão para comercialização ampla baixa**. Não atribuo percentual de conclusão: os domínios têm pesos muito diferentes, e contar telas daria uma impressão enganosa frente a fiscal, recuperação e risco financeiro. A maior parte da jornada possui implementação; algumas lacunas pequenas em volume de código têm impacto decisivo no uso real.

Os cinco grupos de bloqueadores prioritários são: (1) replay ainda opcional em comandos críticos fora da venda direta protegida; (2) estornos, descontos e política de estoque com contratos incompletos; (3) posto de trabalho/caixa/perfil restrito e implantação inadequados ao cenário de até três caixas; (4) ausência de solução fiscal aplicável comprovada; (5) recuperação, entrega e contingência sem homologação operacional. São detalhados na seção 12, sem tratar risco estático como incidente ocorrido.

### Método

Inspeção somente de arquivos e Git: AGENTS, definições de especialistas, Documento Mestre, índices, DATABASE/API, migrations 001–012, backend, persistência, scripts, interfaces legada/React e testes. Código e assertions prevalecem quando a documentação diverge. A jornada da seção 5 é **simulação conceitual por código**, não execução de navegador ou de loja.

Não iniciei servidor, testes, build, benchmark nem restore nesta rodada, pois o escopo é auditoria sem abrir dados ou gerar artefatos operacionais. Os resultados já aprovados de BRAND-001 são **históricos na mesma baseline de código**: 21 testes específicos, 86 pertinentes, 189 React, typecheck/build e suíte raiz com 681 testes aprovados, segundo o [relatório de BRAND-001](../branding/BRAND_001_REPORT.md). Não são novos resultados deste RETAIL-000 nem certificação de loja real. As verificações finais desta entrega são de diff, escopo e integridade dos arquivos.

Os especialistas são papéis permanentes; não foram reativados diretor/tester antigos nem processos de agentes. Responsabilidades aplicadas à análise, após leitura de suas definições:

| Papel | Responsabilidade e entrega nesta auditoria |
| --- | --- |
| Produto e domínio | Delimitar primeiro varejo, jornada, piloto/comercial e decisões abertas |
| Arquitetura | Separar infraestrutura de produto, coexistência e menor dependência de C3 |
| Backend e banco | Evidenciar APIs, transações, representação exata e persistência híbrida |
| Segurança | Conferir autoridade, escopo, replay, contexto e fronteiras de confiança |
| Frontend/UX | Identificar tela efetiva, limitações de perfis e prioridade de uso |
| QA/Testing | Distinguir assertions/homologação histórica de uso real ainda não provado |
| Integrações e infraestrutura | Fiscal/hardware, distribuição, recuperação e contingência |
| Documentação | Registrar evidência, proposta, trade-offs e limites de autorização |

### Referências e divergências documentais

O [Documento Mestre v1.0](../../../Documento_Mestre_Sistema_Comercial_v1.0.md) continua a autoridade conceitual; especialmente §§2–4, 5–8, 10–12 e 15–16. [PROJECT_MASTER](../../atual/PROJECT_MASTER.md), [ROADMAP](../../atual/ROADMAP.md), [DATABASE](../../atual/DATABASE.md) e [API](../../atual/API.md) são derivados. Trechos dos índices ainda descrevem BRAND-001 como aguardando checkpoint; o Git comprova o checkpoint acima. VISION/AGENTS possuem registros históricos anteriores ao nicho e às migrations atuais. Não reescrevi essas referências: a autorização desta rodada limita as duas atualizações de índice a prioridade varejo/RETAIL-000 em auditoria. Este relatório explicita a baseline efetiva.

## 2. Produto e primeiro cliente

**Decisão recebida do proprietário:** primeiro produto comercial = varejo físico especializado pequeno, MEI/ME/EPP, para roupas, calçados, acessórios, semijoias, presentes e utilidades. ERP arquiteturalmente geral; primeiro produto vendável concentrado nesse nicho.

Perfil de referência: uma empresa, uma loja, um dono e poucos funcionários, centenas a poucos milhares de SKUs, de um a três caixas/estações, venda de balcão, fornecedores/compras/estoque local, dinheiro/PIX/cartão, contas básicas e relatórios simples. Preservar isolamento e arquitetura multiunidade sem exigir operações logísticas avançadas no piloto.

Fora do primeiro MVP: supermercado, farmácia, restaurante/KDS, oficina/OS, salão/agenda, indústria, logística e construção; CRM avançado, produção, marketplace complexo, inteligência de mercado, BI avançado, white-label avançado, multi-country, comissionamento complexo e fidelidade avançada. Nenhum deles foi identificado como condição para a primeira loja deste perfil. Logo, imagem de produto e nova UI completa também não são gates automáticos.

## 3. Inventário real da implementação

| Camada | ATUAL comprovado | Limite material |
| --- | --- | --- |
| Runtime | Node/CommonJS; módulos de domínio separados; HTTP contextual; SQLite; shell legado e `/ui/` React | CLI escuta `127.0.0.1:3210`; `configuration()` admite somente development/test. Não há produto cloud implantado nem configuração de produção habilitada |
| Organização | `companies`/`units`, vínculos, contexto validado, administração legada | Alias legado não implementa toda Org → Legal → Unit; 011 tem Legal dormente, sem binding/writer/API |
| Persistência | Seis agregados relacionais; FK, índices, valores monetários exatos, ledger de estoque | Escritas ainda materializam snapshot e espelhos; famílias, caixa e parte financeira continuam no snapshot |
| Escrita | Transação SQLite síncrona, revisão/CAS e auditoria no mesmo commit; revalidação de autorização | Não há replay obrigatório uniforme em todos os comandos; alguns contratos usam chave opcional |
| Acesso | Argon2id, sessão opaca/hash, contexto, CSRF/Origin/Host, RBAC backend e deny-by-default | Sem entitlement, licença/contrato executável, identidade confiável de dispositivo ou plano administrativo cloud separado |
| Comercial | Produtos/clientes/fornecedores; compras/recebimentos; vendas e estoques; fluxos complementares | Existência de domínio não comprova onboarding, caixa múltiplo, fiscal, hardware e recuperação em loja |
| UI | Legado cobre operação; APIs/DTOs paginados para leituras e interface comercial parcial; React sessão/contexto/Design System/Aparência | Produtos, compras, estoque, PDV e financeiro comerciais em React ausentes |
| Operação | Backup consistente, validação, agenda/retenção e restore para destino novo | Sem homologação DR da loja, distribuição atualizável assinada, offline cloud ou Agente Local |

Evidências principais: [server.js](../../../server.js), [runtime](../../../foundation/runtime.js), [config](../../../foundation/config.js), [scoped-state](../../../foundation/scoped-state.js), [state-repository](../../../foundation/state-repository.js), [execution](../../../foundation/execution.js), [commercial-store](../../../foundation/commercial-store.js), [commercial-read](../../../foundation/commercial-read.js), [authorization](../../../foundation/authorization.js), [migrations](../../../foundation/migrations/).

### Banco: o que é relacional e o que continua híbrido

001 cria a fundação; 002 Produtos/aliases/embalagens; 003 Clientes; 004 Fornecedores; 005 Compras/recebimentos; 006 Estoque/movimentações; 007 aprovação de produto inativo; 008 manutenção de acesso; 009 Vendas e filhos, inclusive recebimentos; 010 índice FK de estoque/recebimento; 011 Legal dormente; 012 Branding.

O estado comercial passa por `unit_states`, validações e sincronização/conferência dos espelhos SQL. Portanto, Produtos/Clientes/Fornecedores/Compras/Estoque/Vendas têm persistência **híbrida**, com entidades SQL e snapshot conservado. Caixa, despesas, obrigações/AP, acordos/AR e recorrências não se tornaram agregados financeiros relacionais independentes. Recebimentos espelhados em SQL não equivalem a plano de contas/conta bancária/razão financeiro completo. Isso é dívida de evolução, **não prova de que a transação atual perde atomicidade**.

011 é `STRICT/WITHOUT ROWID`, somente PROVISIONED, com UPDATE/DELETE bloqueados; não resolve identidade legal operacional. 012 guarda nome visual/cores/tema/revisão por `companies(id)`; nome visual não prova razão social/emissor fiscal. Migração desconhecida/checksum alterado continuam recusados. Pacote antigo não é rollback seguro de banco com schema novo.

## 4. Matriz de maturidade

Legenda: **A = AUSENTE; P = PARCIAL; F = FUNCIONAL; H = HOMOLOGADO** em ambiente sintético e no recorte indicado. PROTÓTIPO e PRONTO PARA MVP seriam usados se houvesse evidência correspondente; não há homologação operacional que permita certificar um domínio comercial inteiro como PRONTO PARA MVP. H não significa teste novo nesta auditoria. F em testes significa que há testes/assertions pertinentes inspecionados, sem afirmar cobertura integral. P em uso real indica base utilizável condicionada aos gates; A indica capacidade desejada não disponível.

| Domínio | Backend | Persistência | API | UI legada | React | Segurança/autoridade | Testes | Uso real |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Organização/configuração | P | P | F | F | P | P | F | P |
| Usuários/RBAC | F | F | F | F | P | P | F | P |
| Branding | H | H | H | H | H | H | H | P |
| Produtos | F | F | F | F | A | P | F | P |
| Variações | P | P | F | F | A | P | F | P |
| SKU | P | F | P | P | A | P | F | P |
| Código de barras | F | F | F | F | A | F | F | P |
| Preço | F | F | F | F | A | P | F | P |
| Clientes | F | F | F | F | A | P | F | P |
| Fornecedores | F | F | F | F | A | P | F | P |
| Compras | F | F | F | F | A | P | F | P |
| Recebimento | F | F | F | F | A | P | F | P |
| Estoque | F | F | F | F | A | P | F | P |
| Inventário/ajuste | F | P | F | F | A | F | F | P |
| Venda | H | F | H | H | A | P | H | P |
| PDV | F | F | F | F | A | P | F | P |
| Descontos | P | F | P | F | A | P | F | P |
| Pagamentos | P | F | F | F | A | P | F | P |
| Caixa | P | P | F | F | A | P | F | P |
| Cancelamento | P | F | F | F | A | P | F | P |
| Devolução/troca | P | P | F | F | A | P | F | P |
| Contas a pagar | F | P | F | F | A | F | F | P |
| Contas a receber | P | P | F | F | A | P | F | P |
| Fluxo de caixa | P | P | F | F | A | F | F | P |
| DRE básica | A | A | A | A | A | A | A | A |
| Relatórios | F | P | F | F | A | F | F | P |
| Comprovante | P | F | P | F | A | F | F | P |
| Impressão | A | A | A | P | A | P | P | P |
| Fiscal | A | A | A | A | A | A | A | A |
| Backup/restore | F | F | P | P | A | F | H | P |
| Atualizações oficiais | A | A | A | A | A | A | A | A |
| Offline/sync/contingência formal | A | A | A | A | A | A | A | A |
| Auditoria | F | F | P | P | A | F | F | P |

Venda H: recorte de replay da criação direta legado/IDP-001, não todo cancelamento/pagamento/fiscal. Backup H: restore sintético isolado, não recuperação operacional. Branding H: contrato específico aprovado, não certificação do produto que o hospeda. Variações P: famílias/matriz existem, mas não todo onboarding comercial de grade. Não há inferência de que ausência de React torne backend AUSENTE.

## 5. Jornada end-to-end conceitual

Cada linha descreve a funcionalidade observada; **nenhum passo foi executado nesta rodada**. “Teste” aponta evidência existente, não resultado novo. Aceite real sempre inclui as condições gerais de segurança, fiscal e recuperação das seções 10–13.

| Passo | Tela/API e funcionamento atual | Segurança e teste existente | Workaround / aceite para cliente real |
| --- | --- | --- | --- |
| Cadastrar empresa | Administração/contexto legado; estruturas companies/units | `access*.test.js`, `request-context.test.js`, `entities.test.js`; backend valida vínculos | Onboarding técnico local não é contratação self-service. Aceitável somente com implantação aprovada; identidade legal não resolvida |
| Criar usuários | Administração de acessos legada; concessões por Unit | `access-v1-2.test.js`, `rbac.test.js`; sessão/autoridade no servidor | Preparar perfil de vendedor sem ampliar acesso ao financeiro inteiro; homologar tarefas desse perfil |
| Cadastrar produtos | Produtos legado e cadastro comercial contextual | `commercial-registration*.test.js`, `commercial-products.test.js`; versão/escopo | Digitação funciona; carga CSV/Excel comercial ausente. Poucos milhares exigem plano de carga, deduplicação e revisão |
| Cadastrar fornecedor | Fornecedores legado/API comercial | `commercial-suppliers.test.js`, `purchases.test.js` | Cadastro manual possível; algumas escritas legadas admitem chave ausente |
| Fazer compra | Compras legado, itens, versões e confirmação | `commercial-purchases.test.js`, `commercial-purchase-http.test.js`, `purchases.test.js` | Funciona por digitação; sem XML fiscal/importação; lançamento da conta a pagar é explícito |
| Receber mercadoria | Recebimento parcial de itens da compra | `receipt-fk-index.test.js`, `commercial-inventory.test.js`; transação/versionamento | Conferência física manual. Fechar contrato de intenção/retry e dados de custo antes do uso real |
| Estoque aumenta | Entrada e movimento associados ao recebimento | `inventory-store`, `stock-movement-insert.test.js`, `transactions.test.js` | Não requer lançamento de estoque duplicado. Adequado após homologação da compra e saldo inicial |
| Abrir caixa | Tela Caixa / `cashAction('open')` | `cash.test.js`, `commercial-cash-http.test.js`; `cash.manage`; autor derivado do usuário | Um caixa aberto por Unit. Não atende três gavetas independentes; decidir piloto de um caixa ou evolução |
| Vender produto | Balcão PDV legado; carrinho/revisão; `POST /api/sales` | `sales.test.js`, `legacy-sale-idempotency.test.js`, `legacy-sale-retry-ui.test.js` | Base funcional forte. Perfil parcial possui venda direta simplificada, não PDV completo equivalente |
| Receber dinheiro/PIX/cartão | PDV com pagamentos divididos e troco em dinheiro | `round10.test.js`, `payments.test.js`, `checkout-core`; exatidão em centavos | PIX/cartão são declarações manuais: confirmar na máquina/app externo. Nenhuma conciliação bancária automática |
| Estoque diminui | Venda cria baixa/movimento no mesmo commit | `commercial-sales.test.js`, `commercial-stock-http.test.js`; disponibilidade e rollback | Concorrência precisa ensaio do perfil real. Estoque insuficiente bloqueia: divergência frente ao mestre exige decisão |
| Caixa/financeiro registra | Recebimentos e vínculo ao caixa aberto; AR para pendência | `finance.test.js`, `cash.test.js`, `commercial-cash-http.test.js` | Pode vender/receber sem caixa aberto. Definir obrigatoriedade e tratamento; caixa não equivale a conta financeira |
| Cancelar/devolver | Cancelamento de venda e devolução parcial com destinação/refund/crédito | `round9-credit.test.js`, `sales.test.js`, `round10.test.js` | Não há estorno integrado ao adquirente. Venda integral cancelada em PIX/cartão tem lacuna de restituição/reconciliação no fluxo de caixa |
| Fechar caixa | Valor contado, esperado, motivo de divergência, snapshot e histórico | `cash.test.js`, `cash-report`; RBAC/auditoria | Homologar conferência real, operador e política de diferença; não usar estação digitada como identidade |
| Ver relatório diário | Gerencial, caixa, vendas, recebimentos, despesas/fluxo, exportação | `reports.test.js`, `export.test.js`; leituras/export contextualizadas | Realizado não é lucro/DRE. Conferir relatório com recibos de cartão/PIX e contagem física |
| Backup | Serviço agendado/manual técnico, retenção e restore para novo destino | `backup-service.test.js`, `sql-backup.test.js` | Processo precisa estar ativo; cópia local não cobre perda do PC. Aceite requer cópia externa e restauração ensaiada |

## 6. Produtos — recorte necessário para varejo

Evidências: [catalog-registration](../../../catalog-registration.js), [catalog](../../../catalog.js), [catalogue-next](../../../catalogue-next.js), [domain](../../../domain.js), [commercial-registration](../../../foundation/commercial-registration.js), [commercial-store](../../../foundation/commercial-store.js), [Produtos legado](../../../public/store.js), [Famílias](../../../public/catalogue-next-ui.js), [lookup](../../../public/product-lookup.js), testes `barcode.test.js`, `commercial-products.test.js`, `commercial-registration.test.js`, `round8.test.js` e `v9.test.js`.

| Capacidade | ATUAL e gap | Necessidade / recomendação proposta |
| --- | --- | --- |
| Cadastro/edição/inativação | Nome/preço/estoque, código e barcode; versões; inativo preserva história | Reutilizar. Cadastro comercial tem melhor contrato de replay/versão; não substituir históricos |
| SKU | UUID obrigatório identifica produto; código interno textual opcional | Identidade técnica não é política de SKU comercial. Definir se código interno deve ser obrigatório no primeiro catálogo; não renumerar IDs antigos |
| Variações | Famílias com atributos, membros com IDs/saldos/preços próprios; matriz e diagnóstico na UI | Não estão ausentes. Para roupa/calçado, testar grade e carga real; geração de combinações e disciplina de duplicata precisam evolução se forem necessárias |
| Duplicatas de grade | Combinação repetida pode ser aceita explicitamente | Escolher política de negócio; código não garante exclusividade universal de tamanho/cor por família |
| Múltiplos códigos | Aliases e lookup, preservação de zeros, normalização/colisão, vínculos ativos | Reutilizar; não existe emissão de etiquetas/barcodes nem homologação física do leitor nesta auditoria |
| Preço | Preço por produto, promoções/oferta validada; centavos e comparação de oferta | Reutilizar cálculo; fechar alçada manual. Integração fiscal não pode recalcular preço silenciosamente |
| Custo | Derivação de compra recebida mais recente | Não é custo médio nem CMV histórico. Registrar política/fatos antes de prometer margem/DRE; sem custo inventado zero |
| Categoria/marca | Categoria simples e marca como metadado | Suficiente inicialmente; taxonomia/árvore avançada pode esperar |
| Unidade de medida | Metadado textual; balcão usa quantidades inteiras | Adequado a peças/pares/unidades se cadastro coerente; não equivale a contrato de escala/fracionamento |
| Embalagem | Cadastro com código e fator inteiro; preço derivado; fator/versionamento histórico na venda | Reutilizar para packs aprovados; não usar como conversão dimensional genérica |
| Produto sem estoque | Não existe contrato funcional específico; venda atual controla disponibilidade/baixa | Pode ficar fora do primeiro varejo de mercadorias. Continua gap do produto geral no mestre §5 |
| Busca | Nome/código/barcode; aliases/embalagem; rotas SQL contextuais | Reutilizar. Integrar consultas proporcionais onde tela ainda carrega tudo |
| Paginação | APIs comerciais paginadas/limitadas; telas antigas usam arrays completos | Base existe. Não atribuir paginação SQL a toda tela de PDV/produtos |
| Performance | Índices/leituras proporcionais, mas scanner legado consulta `/api/state` por leitura | Medir com catálogo/histórico alvo; dívida tem consumidor claro no balcão |
| Imagem | Não há upload/imagem de produto operacional | Pós-MVP; não depender de Files Core para vender presencialmente |
| Importação | Importação técnica de JSON legado existe; carga comercial CSV/Excel de catálogo não | Não confundir as duas. Se catálogo grande, planejar importação validada ou carga assistida autorizada; nunca SQL manual sem contrato |

Mínimo: identificação inequívoca, tamanho/cor quando aplicável, preço exato, saldo inicial conferido, busca/leitor confiáveis, edição/inativação preservando história, carga viável. Imagens, catálogo online e hierarquias sofisticadas não devem atrasar receita.

## 7. PDV — existe, mas ainda não está pronto para lojista comum

A tela efetiva resulta dos scripts carregados em [index.html](../../../public/index.html), [store.js](../../../public/store.js), [checkout-ui](../../../public/checkout-ui.js), [scan-next-ui](../../../public/scan-next-ui.js), [workstation-core](../../../public/workstation-core.js) e integrações de acesso/comercial. Inspecionar só `/api/sales` ou só a função inicial de `store.js` ocultaria o balcão, pagamentos e wrappers já existentes.

| Item | Resultado observado / limite |
| --- | --- |
| Iniciar venda/buscar nome | Carrinho legado e Balcão PDV; venda direta simplificada em perfil parcial |
| Leitor de barras | Entrada de teclado/Enter, lookup código/barcode/alias/embalagem; fila de leitura, foco e multiplicação por fator. Hardware USB não ensaiado nesta auditoria |
| Quantidade/alterar/remover | Quantidade inteira, atualização/remoção e desfazer último item; itens repetidos tratados na validação |
| Subtotal/total | Cálculo em centavos, oferta validada, revisão pré-confirmação |
| Cliente opcional | Consumidor final em venda recebida; pendência exige identificação conforme checkout |
| Desconto | Valor/motivo e limites de cálculo. Falta alçada por usuário ancorada no preço de referência |
| Autorização de desconto | Não há primitive implementada equivalente ao contrato do mestre. Confirmação de combinação de promoção pelo cliente não prova autorização de gestor |
| Produto inativo | Há aprovação específica, senha/permission/motivo/token contextual e consumo atômico; não reutilizar como se fosse autorização de desconto |
| Pagamentos múltiplos | Checkout suporta divisão; dinheiro, PIX, débito, crédito e outros; pendência e crédito da loja são conceitos próprios |
| Troco | Cálculo/regras no dinheiro; não criar troco fictício em cartão/PIX |
| Confirmação externa | Não existe confirmação PIX, TEF, integração adquirente ou pinpad; métodos são registros declarados |
| Cancelamento pré-venda | Descartar/alterar carrinho não produz fatos comerciais confirmados |
| Cancelamento pós-venda | Cancela, repõe estoque/gera movimento, preserva histórico. Estorno externo e restituição integral não dinheiro não estão completos |
| Devolução/troca | Devolução parcial, destino vendável/não vendável, restituição ou crédito; troca pode exigir devolução + nova venda, não workflow unificado fiscal/financeiro |
| Comprovante | Comprovante interno, sem valor fiscal; nome visual atual não é identificação legal histórica |
| Impressão | `window.print()`/CSS; sem serviço de impressão/dispositivo/fila de jobs |
| Idempotência da venda direta | IDP-001 exige intenção e fingerprint contextual/ator; replay igual retorna efeito anterior; alterado falha. Não protege automaticamente outros comandos |
| Timeout/retry | Revisão legada preserva requestId/payload preparado; não gera nova chave por erro. Evidência em `legacy-sale-retry-ui.test.js` e relatório IDP-001 |
| Concorrência | Transação/CAS/validação de oferta/disponibilidade; controles em comandos. Não há nova medição de três caixas nem comprovante operacional de carga |
| Estoque negativo | Bloqueio hard no servidor/UI. Conflita com mestre §7.2, que prevê fato físico válido com ocorrência; qualquer mudança depende de política aprovada |
| Auditoria | Venda, recebimentos/baixa e ator confiável na execução transacional; não é trilha cloud resistente ao administrador do arquivo |

**Classificação:** PDV legado FUNCIONAL para ensaio, PARCIAL para uso real. Não é apenas protótipo de endpoint; tampouco é release comercial. Preservar IDP-001, validadores, cálculos, approval de inativo e rollback. Principais evoluções: perfil restrito completo, operação do caixa escolhido, alçadas/restituição, consultas proporcionais e homologação fiscal/hardware/falhas.

A chave preparada da venda e o retry têm prova histórica; **não inventei uma nova identidade ou screenshot nesta auditoria**. LocalStorage contextual guarda rascunhos/preferências; não é sincronização entre PCs, backup de fatos ou prova de estação.

## 8. Caixa e estoque

### Caixa operacional

Evidências: [cash](../../../cash.js), [cash-core](../../../public/cash-core.js), [cash-ui](../../../public/cash-ui.js), [cash-report](../../../cash-report.js), [server](../../../server.js), `cash.test.js` e `commercial-cash-http.test.js`.

| Pergunta | ATUAL | Gap / consequência |
| --- | --- | --- |
| Quem abriu/fechou? | `responsible` é substituído pelo nome do usuário autenticado no handler; execution/auditoria têm identidade confiável | Nome exibido não substitui ID histórico. Estação/turno digitados não provam operador/dispositivo |
| Com quanto? | `openingCents` exato, conferência | Homologar valor de fundo e procedimento |
| Entradas/saídas? | Recebimentos, suprimento, sangria, despesas em dinheiro e restituições suportadas | Chave ainda opcional em contratos críticos; risco de repetição fora do fluxo feliz |
| Por meio de pagamento? | Totais por meio; PIX/cartão registrados não entram como dinheiro na gaveta | Totais nominais não são liquidação/conciliado/conta bancária |
| Sangria/suprimento? | Existem, com valor e motivo/registro | Permissão `cash.manage` opera o caixa da Unit, sem propriedade granular por posto |
| Fechamento/divergência? | Esperado, contado, razão de diferença, fechamento/histórico | Requer ensaio e política de quem pode aceitar diferença |
| Histórico/auditoria? | Snapshot de fechamento, movimentos, CSV/print e auditoria | Não apagar movimento para “arrumar” saldo; reversão de domínio não é universal |
| Vários caixas? | `openCash(state)` retorna um aberto; abertura recusa outro na Unit | **Não atende 2–3 gavetas independentes.** Multi-Unit não deve ser usado para fingir três caixas da mesma loja |
| Caixa obrigatório? | Venda/recebimento sem aberto são possíveis e sem vínculo | Política precisa decisão e teste; não presumir que toda venda está na sessão |

Recomendação: piloto com **um caixa físico**, se explicitamente aceito, reduz escopo; se o primeiro cliente exige dois/três caixas independentes, evolução do modelo é P1. Não inventar dispositivos confiáveis para resolver somente gavetas, mas não chamar etiqueta digitada de identidade. Um caixa operacional não é conta financeira, AR ou conciliação bancária.

### Estoque

Evidências: [inventory-store](../../../foundation/inventory-store.js), [positions-core](../../../public/positions-core.js), [inventory-next-ui](../../../public/inventory-next-ui.js), [quarantine-core](../../../public/quarantine-core.js), `commercial-inventory.test.js`, `round9-stock.test.js`, `stock-balance-accumulator.test.js` e `mirror-balance-accumulator.test.js`.

| Capacidade | ATUAL e mínimo do primeiro varejo |
| --- | --- |
| Saldo/movimentações | Saldo físico e ledger SQL/espelho; validação de transição. Reutilizar, conferir saldo de abertura |
| Compra/venda/cancelamento/devolução | Movimentos ligados aos fatos de origem; transação; preservar IDs/documentos |
| Disponibilidade/reserva | Disponível desconta reservas/quarentena; reserva não baixa físico; conversão controlada. Reutilizar quando utilizado, sem obrigar lojista a operar reserva |
| Inventário/ajuste | Sessão de contagem, opções de conferência, versões/token de estoque; aplicação gera diferenças; rebase explícito quando saldo mudou |
| Escala do inventário | Limite de 500 itens por sessão; catálogo maior exige lotes e instrução. Há inventário utilizável, não só tabela |
| Perda | Ajuste/inventário e quarentena/disposição permitem registrar destinação; não há contabilização de perda/CMV independente completa |
| Transferência | Posições internas na Unit e reversão vinculada; **não é transferência logística entre Units/em trânsito**. Suficiente para loja única se necessário |
| Negativo | Hard block atual; registrar conflito com regra aprovada, não remover guarda nesta auditoria |
| Custo | Compra recebida mais recente; não garante valuation/custo médio/fato de custo da venda |
| Rastreabilidade | Movimentos/recebimentos/vendas preservados com vínculos e execução; histórico não deve ser refeito por nome ou JSON inventado |

Mínimo: carga/saldo inicial conferidos; entrada por recebimento; baixa única; cancelamento/devolução com destinação; inventário em lotes; divergências explícitas; rastreio e restauração. Transferência interunidade, logística avançada e valuation sofisticada não precedem um piloto de loja única, mas fatos de custo são necessários para prometer DRE.

## 9. Financeiro Básico e relatórios

Evidências: [payables](../../../payables.js), [accounts](../../../accounts.js), [payments](../../../payments.js), [domain](../../../domain.js), [commands](../../../commands.js), [business-core](../../../public/business-core.js), [recurring-core](../../../public/recurring-core.js), [budget-core](../../../public/budget-core.js), [advanced-analytics](../../../public/advanced-analytics.js), `finance.test.js`, `payments.test.js`, `round9-planning.test.js`, `reports.test.js`.

| Capacidade | Fluxo real | Persistência / limite |
| --- | --- | --- |
| Contas a pagar | Obrigações, fornecedor, vencimentos/parcelas, pagamentos parciais; pagamento cria despesa vinculada; saldo cancelado conserva pago | Snapshot dentro da transação híbrida; comandos com identidade/versão. Não há agregado AP relacional próprio |
| Compra → AP | Ligação explícita por versão; alertas/diferença/revisão | Receber mercadoria **não cria automaticamente** AP. Procedimento deve evitar compra sem conta ou despesa duplicada |
| Contas a receber | Saldo das vendas, recebimentos, acordos/parcelas/alocação; crédito/restituição próprios | Snapshot/acordos + recebimentos de venda espelhados SQL; não é AR geral independente de vendas |
| Pagamento/recebimento parcial | Existe controle de saldo, datas e histórico | Recebimento direto ainda aceita ausência de chave; versão/saldo não equivalem a replay obrigatório |
| Categorias/centros | Categorias de despesa e centros/orçamentos simples | Snapshot; sem classificação contábil/competência fechada para DRE |
| Despesas | Valor exato, data paga, método, vínculos ao caixa quando aplicável | Snapshot; exclusão/cancelamento não é um serviço geral de reversões financeiras |
| Receitas | Principalmente recebimentos de vendas, crédito e restituições relacionadas | Receita manual genérica independente/razão de contas ausente |
| Recorrência | Planejamento mensal/semanal e geração; plano separado do fato realizado | Snapshot; não presumir execução bancária/scheduler financeiro externo |
| Fluxo realizado | Entradas/saídas registradas, restituições/despesas; relatório | Não é saldo bancário conciliado nem lucro |
| Projetado | Vencimentos/AP/AR/acordos e planejamento | Parcial; consolidar regras de projeção/recorrências sem duplicar realizados |
| DRE básica | **AUSENTE** | Sem CMV histórico, competência e classificação suficientes; diferença de caixa não é DRE |
| Financeiro sem Produtos/Vendas/Estoque | Parte dos lançamentos é independente; AR/relatórios continuam ligados ao estado comercial | Não cumpre integralmente o Financeiro Básico autônomo do mestre §§3/8 |

AP/AR não estão ausentes; existem fluxos consideráveis. Não recomendar normalizar todo o financeiro antes de ensaiar o piloto: o que precede uso com dinheiro é contrato de intenção, transação, reversão, conferência e recuperação comprovados. A normalização pode evoluir depois por consumidor/medição, preservando fatos e autoria.

Relatórios implementados incluem vendas por dia/produto/cliente, recebimentos, créditos, descontos, compras por fornecedor, entregas, pagamentos/obrigações, despesas, fluxo/projeção, caixa, movimentos/inventários/saldo, produtos sem venda e reservas. Há indicadores adicionais. Existem exportação/print e controles contextuais; não há BI/DRE/conciliador bancário pronto. O relatório diário deve ser homologado com as vendas, gaveta e comprovantes externos, e não apenas pela existência de uma tabela HTML.

## 10. Fiscal, comprovantes e hardware

### Fiscal: situação e gates

**Não existem emissão NFC-e/NF-e/SAT/NFS-e, credenciamento, certificado/CSC, XML fiscal, integração SEFAZ, cancelamento fiscal ou contingência fiscal.** A impressão existente é comprovante interno, expressamente sem valor fiscal. Não há importação comercial de XML de compra. Não confundir aprovação de venda ou `legal_entities` com documento fiscal.

As obrigações dependem de UF, enquadramento, operação e destinatário. A orientação oficial do MEI distingue consumidor pessoa física de destinatário pessoa jurídica; portanto, MEI não autoriza presumir dispensa universal de documento. [Portal do Empreendedor — perguntas frequentes](https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/vitrine/perguntas-frequentes).

Exemplo concreto, **sem presumir que o primeiro cliente seja paulista**: a SEFAZ-SP informa obrigatoriedade de NFC-e para varejo paulista a partir de 01/01/2026, em substituição a CF-e-SAT e modelos indicados. O portal também trata credenciamento/CSC. Isso impede adotar SAT como recomendação genérica atual sem verificar a jurisdição e eventuais regras específicas. [SEFAZ-SP — NFC-e](https://portal.fazenda.sp.gov.br/servicos/nfce/).

Produtos/mercadorias e serviços têm caminhos distintos; NFS-e de serviço não substitui automaticamente documento de venda de mercadoria. [Portal do Empreendedor — nota fiscal](https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/nota-fiscal).

| Classificação solicitada | Condição objetiva |
| --- | --- |
| **BLOQUEADOR DO PILOTO** | Loja fazendo vendas reais sem rota fiscal válida aplicável. UF/regime/atividade/operador/emissor e cancelamento precisam verificação antes da primeira venda real |
| **BLOQUEADOR DA VENDA COMERCIAL** | Vender como ERP/PDV de varejo completo sem solução fiscal operável, suporte e conciliação dos documentos/fatos |
| **PODE ENTRAR APÓS PILOTO CONTROLADO** | Automação fiscal interna pode ser posterior **somente se** já houver emissão externa legalmente adequada, aprovada para o piloto e com reconciliação documentada. A obrigação fiscal não é adiada |

Treinamento sintético sem comércio real não exige inventar documento emitido. Piloto real pode usar emissor externo existente se proprietário/contador validarem a rota e o volume permitir conferência, evitando duplicar venda ou perder vínculo. Alternativa: integração com provedor/emissor, com contrato/homologação e tratamento de falha. Motor próprio aumenta esforço/regulação e não é requisito automático. Nenhuma alternativa está aprovada nesta rodada.

### Impressão e equipamentos

| Item | ATUAL | Prioridade e dependência |
| --- | --- | --- |
| Comprovante | HTML de venda, valores históricos; nome visual do contexto atual; “sem valor fiscal” | Necessário ao atendimento quando requerido; preservar distinção fiscal e futura identidade histórica do emitente |
| Impressora térmica | `window.print()` e CSS; pode usar driver do navegador/SO | Ensaiar o modelo real, corte/layout/reimpressão e documento exigido. Sem ESC/POS, fila ou seleção automática garantida |
| Código de barras | Lookup de código/alias/embalagem | Necessário ao catálogo quando usa etiquetas existentes; impressão de etiquetas pode esperar se mercadoria já identificada |
| Leitor USB | Contrato de teclado/Enter e foco | Útil já e normalmente importante para roupas/calçados; homologar equipamento com zeros iniciais e leitura repetida. Não há prova física nesta auditoria |
| Gaveta | Nenhum adapter de acionamento | Manual pode ser aceito no piloto; automação depois. Segurança de dinheiro/procedimento é obrigatória mesmo sem adapter |
| Balança | Nenhuma integração/escala fracionada de balcão | Fora da prioridade deste nicho por peças/pares; cliente que exige pesagem muda o recorte |
| TEF | Ausente | Não é gate universal se máquina externa + confirmação/conferência manual aceitas; integração útil depois |
| Pinpad | Ausente | Depende de TEF/adquirente; não conectar diretamente sem contrato. Terminal externo não prova integração |

“Obrigatório agora” significa capacidade de operar e entregar documentos exigidos com os equipamentos escolhidos, não obrigação de construir todos os drivers. Não há homologação de térmica, leitor, gaveta ou terminal físico neste relatório.

## 11. Segurança, operação e performance

### Segurança e autoridade

Reutilizar [identity](../../../foundation/identity.js), [rbac](../../../foundation/rbac.js), [authorization](../../../foundation/authorization.js), contexto de sessão, aprovação de inativo e auditoria transacional. Há validações de Host/Origin/CSRF, sessão hash/opaca, KDF, contexto tenant/Unit, permissão backend, isolamento em leituras/escritas e exportação; frontend não concede autoridade. Exportação tem token contextual temporário e proteção contra fórmula CSV.

**Limites específicos:**

- Escritas legadas gerais exigem conjunto amplo de leituras (`SNAPSHOT_READ`, incluindo financeiro/operação) além da permission da ação. Interface parcial/DTOs existem e permitem venda direta simplificada, mas o PDV/caixa completo do vendedor restrito não tem paridade. Não resolver concedendo todas as leituras ao vendedor.
- `companies.manage` Unit não é grant Org-wide. BRAND-001 resolve somente branding com prova em **todas as Units ativas da Org**, revalidada na transação. Preservar esse mecanismo; não reutilizar nome de cargo como autorização.
- Sessão local e estação declarada não são identidade revogável de dispositivo. LocalStorage não é autoridade. Cookie Secure depende de configuração/transporte; modelo local HTTP não é política de produção HTTPS.
- Sem entitlement, licenciamento executável ou separação de administração da plataforma operacional cloud. Essas lacunas não autorizam iniciar Fase D integral; exigem recorte para produção/cobrança coerente com o mestre.
- Auditoria append-only/hash local não resiste a administrador com controle do arquivo/PC. Backup/cópia externa e autoridade cloud são problemas distintos.
- Replay opcional nos exemplos críticos da seção 12; approvalToken é credencial transitória, não deve virar fingerprint/log.
- Não foi feita certificação global de ausência de segredos nem leitura de credenciais/arquivo privado de pareamento. Nenhum segredo foi extraído ou incluído nesta entrega. Política de distribuição, permissões e operação precisa homologação própria.

Toda futura mudança de API/DTO/tenant requer testes negativos de outra Org/Unit, ausência de permissão, sessão/contexto alterados e rollback/retry. Não enfraquecer guardas para “viabilizar” o piloto.

### Backup, update, offline e implantação

Evidências: [backup-service](../../../foundation/backup-service.js), `backup-service.test.js`, `sql-backup.test.js`, [runtime](../../../foundation/runtime.js), [config](../../../foundation/config.js) e [runbook V1.2](../../atual/OPERATIONS_V1_2.md).

Backup consistente de SQLite/WAL, pacote/manifesto/checksums, verificação de schema/FKs e restore isolado existem. Agenda padrão de seis horas e retenção de trinta dias/mínimo de três cópias não são RPO/RTO contratados; execução depende do processo ativo. Falha/status técnicos não equivalem a alerta e recuperação autônoma pelo lojista. Cópia no mesmo disco não protege perda do PC. Restore para diretório novo não homologa troca operacional, reabertura e retomada do dia.

Não existem updater oficial assinado, rollout, rollback de aplicação condicionado ao schema ou recuperação automatizada. Git/npm/build manuais não são produto de atualização. Proposta mínima: pacote identificável, procedimento seguro de atualização manual assistida e recuperação testada; automação pode esperar. Ponto seguro, assinatura/rastreabilidade e compatibilidade continuam requisitos do mestre §12; não prometer downgrade de DB.

Não existem offline autorizado/assinado, sync cloud, Agente Local ou identidade operacional de dispositivo. O servidor local continuar funcionando sem internet não implementa esse modelo. Para piloto local excepcional, precisa decisão expressa do proprietário, limites, backup e contingência; isso diverge da autoridade cloud do mestre. Se o caminho escolhido for cloud, decidir contingência adequada antes de loja depender diariamente do sistema; não inventar janela de 72h nem emissão de autorização pela estação.

O comando normal escuta loopback e a configuração recusa production. **Não serve hoje três PCs da loja nem deployment comercial suportado.** Alternativas propostas: piloto de um posto/um PC com exceção explícita, ou implantação cloud/transportes e fronteiras revistos. Abrir bind para LAN/desabilitar a guarda production não é solução autorizada nem recomendação isolada. Cliente não deve acessar SQLite/cloud DB diretamente.

### Performance relevante

Consultas comerciais SQL possuem paginação/limite e índices; reaproveitar. Scanner legado busca `/api/state` por leitura e várias telas operam arrays completos. Escritas validam estado e espelhos de vários agregados dentro de seção síncrona; histórico crescente pode aumentar latência/memória e contenção.

O [relatório histórico V1.2](../v1.2/FOUNDATION_V1_2_REPORT.md) registra cenário sintético grande com venda próxima de 2 segundos e RSS da ordem de 784 MiB/pico 1.043 MiB. Isso não é benchmark novo nem SLA para a pequena loja. A carga-alvo de poucos milhares de SKUs e um/três operadores precisa medição proporcional, scans consecutivos e operações concorrentes. Primeiro medir e adaptar lookup/DTO; não introduzir PostgreSQL/microserviços ou refazer todos os agregados para corrigir um consumidor.

## 12. Bloqueadores e riscos, em ordem técnica

Prioridades: **P0** risco direto de dinheiro/dados; **P1** impede piloto real no cenário pertinente; **P2** impede comercialização ampla; **P3** melhoria posterior. Severidade não prova exploração/incidente. Recomendações abaixo são propostas sujeitas a revisão; nenhuma autoriza correção.

| ID / prioridade | Evidência, impacto e risco | Dependências / recomendação / alternativas | Esforço |
| --- | --- | --- | --- |
| R01 **P0** — intenção obrigatória incompleta | `cash.validateKey()` aceita null/undefined; cashAction suprimento/sangria, `domain.expense`, `payments.receive`, entrada em `server.js` aceitam ausência de requestId. Replay sem chave pode gerar segundo efeito quando saldo permite; versão/saldo não provam mesma intenção | Mapear consumidores/testar Red por comando, chave estável e fingerprint contextual, replay igual único/alterado recusado, falha sem efeitos. Priorizar dinheiro/estoque. Alternativa adapter seguro por intenção; nunca chave nova automática após erro. Preservar IDP-001/CAS/audit | MÉDIO |
| R02 **P0** — restituições/reversões incompletas | Cancelamento repõe estoque/preserva recebimentos; cash refund de venda integral cancelada cobre dinheiro. ReturnAction suporta meios manuais, mas venda já cancelada não percorre devolução normal. Sem estorno externo de PIX/cartão; despesa cancelada não é reversão completa | Contrato aprovado por tipo de fato; evento/reversão vinculados, limites e conferência externa; TDD efeitos/concorrência. Piloto pode restringir operação somente com procedimento aprovado, não “apagar” recebimentos. Não inventar regra financeira | MÉDIO/ALTO |
| R03 **P1**, risco financeiro — descontos | `discount-core` exige motivo e limites; `pricing` aceita exceção de mínimo por motivo; `allowPromotionDiscount` é confirmação do cliente, não alçada. Mestre §6 exige autoridade/política ancorada em referência | Fechar alçada e teste de vendedor/gestor/contexto antes de permitir descontos delegados. Alternativa piloto sem desconto discricionário devidamente aprovado. Não reutilizar approval de produto inativo nem criar Owner implícito | MÉDIO |
| R04 **P1 condicional** — estoque negativo | Venda/UI bloqueiam insuficiência; mestre §7.2 preserva venda física válida/ocorrência | Decisão de política/exceção de piloto, contagem e procedimento de divergência; mudança de regra só após especificação. Alternativa catálogo/saldo verificados com restrição temporária aprovada. Nunca desligar guarda sem substituto | MÉDIO |
| R05 **P1** — caixa/postos | `openCash` único por Unit, estação/turno declarados, caixa.manage sobre caixa da Unit; servidor loopback | Definir primeiro posto: um caixa reduz escopo; dois/três independentes exigem evolução e recuperação concorrente. Não simular caixas como Units. Transporte/produção com autoridade revisada | MÉDIO para um posto; ALTO para múltiplos |
| R06 **P1** — vendedor restrito | Legacy write pede leituras amplas; UI parcial permite venda direta mas não balcão completo/múltiplos pagamentos/caixa equivalente | Reaproveitar DTOs/commercial APIs e habilitar tarefas específicas sem financial.view global; teste negativo de dados sensíveis/outra Org. Pode ser legado; React não elimina regra de backend | MÉDIO |
| R07 **P1 condicional / P2** — fiscal | Nenhum emissor/documento fiscal, certificado/CSC/contingência. Comprovante interno não substitui fiscal | UF/regime/atividade/destinatário + validação da rota; emissor externo reconciliado ou provedor integrado. Gate antes de venda real quando exigido; contrato/homologação externos separados | MÉDIO para rota externa; ALTO integração |
| R08 **P1** — implantação/recuperação | Production recusado; loopback; restore sintético para destino novo; backups locais/processo ativo | Decidir arquitetura do piloto sem enfraquecer guardas; cópia externa, RPO/RTO definidos e ensaio de perda/reabertura. Exceção local expressa ou caminho cloud. Sem restaurar em base de loja nesta auditoria | MÉDIO/ALTO |
| R09 **P1 condicional** — onboarding/carga | Código interno opcional; famílias/matriz existem; não há carga comercial CSV/Excel. Estoque inicial/modelo de grade precisam revisão | Catálogo pequeno pode ser cadastro assistido. Grande: import validado/idempotente/relatório de rejeição após autorização; definir SKU/grade/duplicatas sem reidentificar fatos | MÉDIO |
| R10 **P1 a medir** — balcão/performance/hardware | Scanner lê snapshot; escrita síncrona com espelhos; window.print sem hardware homologado | Medir catálogo/histórico e leitor/térmica escolhidos; adaptar consultas proporcionais se gargalo demonstrado. Não afirmar defeito de performance sem ensaio | BAIXO/MÉDIO |
| R11 **P2** — Financeiro Básico/DRE | AP/AR/fluxo funcionais mas dependentes; DRE/CMV histórico/conta financeira independente ausentes | Preservar fatos; especificar custo/competência/reversões e fluxo independente. Piloto pode declarar limitação aprovada; não vender caixa como lucro nem Financeiro Básico completo | ALTO |
| R12 **P2** — entrega/suporte/autoridade | Sem release/update oficial assinado, operação production/cloud, contrato/entitlement/plano administrativo separados | Recortar mecanismos necessários à oferta escolhida; release identificável, ponto seguro/schema/recovery, suporte/alertas e fronteiras testadas. Não iniciar D/E inteiras automaticamente | ALTO |
| R13 **P2 condicional** — contingência | Local sem internet não é sync/offline autorizado; nenhum AgentLocal/device revogável | Definir interrupção tolerável e procedimento fiscal/operacional; escopo offline somente se necessário e aprovado. Confiabilidade cloud não dispensa decisão sobre queda de rede | ALTO se offline formal |
| R14 **P3** — acabamento/complementos | Logo, imagens, UI React comercial, TEF, etiqueta avançada e BI ausentes | Adiar sem bloquear balcão validado; migrar UI por dor concreta. Sem custo de reescrita geral | Variável |

R01 é provado pelo contrato estático, não por reprodução operacional nova. Nem todos os comandos sofrem o mesmo risco: `commands.js` e AP usam requestId obrigatório/versão; criação direta de venda foi protegida por IDP-001; abertura/fechamento de caixa possuem guardas de estado. Isso reduz efeitos em alguns casos, mas não protege automaticamente suprimento/sangria/despesa/recebimento parcial sem chave.

### Riscos de migração/transição

- Não alterar 001–012 já aprovadas para acomodar a vertical. Próximos schemas só após proposta/revisão/checksum/recuperação; esta auditoria não propõe SQL.
- Preservar IDs, autores, oferta/preço, quantidade, fatores de embalagem, vínculos de recebimento/devolução e custo historicamente conhecido. Não preencher custo inexistente com zero ou inventar emissor fiscal antigo.
- Não converter snapshot financeiro para SQL por contagem: equivalência integral, efeitos/reversões e compatibilidade precisam prova; dinheiro tem prioridade sobre normalização estética.
- Implementação gradual de novo DTO/PDV deve preservar intenção preparada/retry e regressão legado. Não misturar frontend novo com outro cálculo comercial.
- Binding Legal/Unit não pode inferir CNPJ/autoridade por branding, nome ou CPF digitado; fatos não resolvidos ficam explícitos conforme ORG-001/002.
- Schema novo impede rollback com pacote antigo; update e restore devem escolher versões compatíveis, preservando fail-closed do migrador/backup.
- Catálogo real grande exige diagnóstico de códigos/grade/saldos antes de carga. Nenhuma massa operacional foi examinada; duplicatas reais são desconhecidas.

## 13. Piloto, comercial e pós-MVP

| Nível | Mínimo para declarar esse nível | O que não pode ser presumido |
| --- | --- | --- |
| **MVP PILOTO** | Loja parceira explicitamente controlada; contrato operacional/fiscal/arquitetura aceito; um caixa ou modelo homologado; perfis reais; intenções/efeitos financeiros protegidos; catálogo/saldo conferidos; jornada completa e falhas ensaiadas; backup externo/restore/contingência e acompanhamento | Aprovação desta auditoria não autoriza instalação. Se há venda real, obrigação fiscal já precisa rota válida |
| **MVP COMERCIAL** | Cliente sem vínculo pessoal opera sem suporte diário de desenvolvedor; onboarding/carga, emissão fiscal adequada, estorno/conferência, fechamento, atualizações/recuperação e suporte repetíveis; produção/autoridade/fronteiras/contrato coerentes; Financeiro Básico da oferta honesto e gaps essenciais resolvidos | Homologação sintética, máquina do desenvolvedor, backup no próprio disco ou “chamar o fundador” não bastam |
| **PÓS-MVP** | Evoluções por demanda e ROI: React por módulo, imagem/logo/white-label, TEF/etiquetas sofisticadas, BI, logística interunitária e demais verticais | Não usar pós-MVP para esconder obrigação fiscal, perda de dados ou autoridade indevida |

**Antes de cobrar uma loja sem relação pessoal com os fundadores:** provar R01/R02; política R03/R04; uso do perfil/caixa contratado; rota fiscal e documentos associados; implantação de produção coerente com a autoridade aprovada; onboarding e jornada diária; backup externo/recuperação; release/atualização segura e suporte; limites/contrato e acesso. DRE/Financeiro Básico independente precisam escopo e fatos definidos para oferecer conformidade com o mestre; qualquer oferta reduzida exige decisão explícita, sem chamar saldo de caixa de lucro. Não basta ter cinco milestones concluídos para dar aprovação automática de venda comercial.

## 14. Reutilizar, evoluir ou adiar; legado e React

| Módulo/fluxo | Decisão técnica proposta | Legado/React e trade-off |
| --- | --- | --- |
| Sessões/contexto/RBAC básico | **REUTILIZAR COMO ESTÁ** nos mecanismos sólidos; **EVOLUIR** composição de tarefas/perfis | React sessão existente; administração legada pode coexistir. Não trocar KDF/sessão para antecipar UI |
| Branding | **REUTILIZAR COMO ESTÁ** | Editor React + adapter legado aprovados; sem logo/white-label novo |
| Transações/CAS/audit/migrador/backup validador | **REUTILIZAR COMO ESTÁ** | Preservar invariantes. Operação/recovery precisam evolução, não enfraquecimento |
| Produtos/clientes/fornecedores | **EVOLUIR** onboarding; **ENVOLVER COM API/ADAPTER** onde necessário | Legado utilizável; consultas/DTOs existem. React comercial não é pré-requisito de piloto |
| Famílias/SKU/aliases/embalagens | **EVOLUIR** disciplina e carga da grade | Aproveitar matriz legado; automatização só com demanda real |
| Compras/recebimento/AP associado | **EVOLUIR** contrato de intenção/conferência | UI legado pode ficar; formalizar vínculo AP sem prometer automação ausente |
| Estoque/inventário/reservas/posições | **REUTILIZAR** ledger/validações; **EVOLUIR** procedimento/política | Legado tem contagem aplicável; não reescrever por framework |
| Venda/cálculo/IDP-001 | **REUTILIZAR COMO ESTÁ** núcleo protegido; **EVOLUIR** bordas | Preservar cálculos/retry; padronizar comandos faltantes separadamente |
| PDV de vendedor restrito | **ENVOLVER COM API/ADAPTER / EVOLUIR** | Legado completo exigindo acessos amplos é inadequado para esse perfil. Adequar fluxo/DTO; **MIGRAR UI** apenas se ensaio apontar ganho maior |
| Caixa | **EVOLUIR** de acordo com número de gavetas e política | Não substituir o domínio todo; um caixa reduz esforço com limite explícito |
| Cancelamento/devolução/restituição | **EVOLUIR** contratos de reversão/conciliação | Não desfazer estoques e recebimentos por exclusão; UI pode coexistir |
| AP/AR/despesas/recorrências/relatórios | **EVOLUIR**, mantendo fatos e modelos úteis | Legado utilizável; independência Financeiro Básico/DRE não exige React |
| Impressão | **ENVOLVER COM API/ADAPTER** se driver/browser insuficiente | Ensaio pode validar impressão manual primeiro. Evitar serviço genérico sem consumidor |
| Fiscal | **ENVOLVER COM API/ADAPTER** de emissor/provedor ou rota externa aprovada | Ausente, portanto não é reescrita. Escolha depende de UF/contrato/volume |
| Backup/restore operacional e releases | **EVOLUIR** runbooks/interface/monitoramento e pacote seguro | Não substituir validador. UI de saúde pode ser incremental |
| DRE/financeiro independente | **EVOLUIR** por especificação e fatos novos preservados | Não substituir snapshot inteiro de uma vez; sem “DRE” fictícia |
| C3 completo/offline formal/AgentLocal/TEF/BI/white-label | **ADIAR**, exceto dependência concreta aprovada | Não abrir antigas fases por recomendação desta auditoria |

**Nenhum módulo foi recomendado para SUBSTITUIR integralmente nesta rodada.** O benefício demonstrado está nas bordas de operação, contratos e entrega. React antes do piloto: **nenhum fluxo obrigatoriamente precisa de React**. Sessão/Aparência já existem nele; demais fluxos podem coexistir em legado se o ensaio comprovar segurança e usabilidade. Legado inadequado hoje: balcão completo de perfil restrito com leituras amplas, múltiplas gavetas independentes e impressão não homologada para equipamento escolhido. São problemas de fluxo/contrato, não corrigidos automaticamente por trocar tecnologia.

## 15. C3 e arquitetura organizacional

**C3 integral não é bloqueador automático de varejo de uma loja.** Profiles/head, resolution UNIT, binding, lifecycle/sucessão, ACL/Owner/grants, sessions v2, factual contexts/backfill têm decisões aprovadas em [ORG-002](../fase-c/ORG_002_EXECUTABLE_DESIGN.md), mas não foram implementadas pela estrutura dormente de C2. Não puxar tudo para a frente apenas porque estava no roadmap antigo.

Dependência concreta possível: emissão fiscal e documentos/obrigações precisam identificar o responsável legal correto, a Unit emitente e o contexto histórico. Risco: atribuir documento à Organization visual, CNPJ atual ou titular novo sem prova. **Menor peça a especificar**, se a rota fiscal integrada escolhida consumir esses dados: identidade legal evidenciada e protegida do emitente, vínculo da Unit, autoridade de configuração e contexto/fato preservado no documento, com compatibilidade e casos não resolvidos. Isso pode exigir um recorte revisado de C3; não equivale a ativar/writar 011 diretamente ou executar toda ACL v2.

Alternativa piloto com emissão externa: provedor mantém identidade legal/credenciamento e processo reconcilia venda/documento. Reduz dependência imediata de schema, mas não resolve por magia a identidade histórica do ERP. Avaliar riscos/documentos efetivamente emitidos antes de aprovar o limite. Configuração fiscal/crítica permanece cloud-only conforme mestre; eventual exceção local exige decisão explícita. Nesta rodada não há binding, backfill, migration 013 nem início de C3/D.

## 16. Exatamente os próximos cinco incrementos propostos

São **PLANEJADOS/PROPOSTOS**, sem autorização de execução. Fazer uma mudança por vez, defeitos com TDD Red → Green → Refactor quando necessário; cada escopo/código/schema/contrato externo tem revisão própria. Impacto mede chegar ao primeiro cliente pagante, não sofisticação arquitetural.

| Incremento | Objetivo / entregas e áreas potencialmente afetadas | Dependências / trade-offs | Impacto / esforço / risco | Critério de conclusão e valor |
| --- | --- | --- | --- | --- |
| **RETAIL-001 — Contrato do piloto e gates** | Fechar cliente-alvo/UF/regime/rota fiscal; um ou mais caixas; vendedor/gestor; SKU/grade; descontos/negativo; cloud versus exceção local; contingência/RPO/RTO. Especificação e critérios, docs retail/arquitetura/operação | Decisões do proprietário e validação fiscal competente. Um posto/emissor externo pode encurtar caminho; exceção não pode ser implícita nem flexibilizar production | **ALTO / BAIXO–MÉDIO / MÉDIO** | Contrato aceito, limites e critérios verificáveis, responsáveis definidos. Evita implementar arquitetura/regra sem consumidor |
| **RETAIL-002 — Efeitos críticos únicos e reversões** | Endurecer intenção/replay nos comandos críticos comprovadamente faltantes; fechar e implementar somente reversões financeiras necessárias ao piloto. Domínios cash/payments/domain/stock/purchases e consumidores/testes, conforme inventário aprovado | R01/R02; regras de restituição aprovadas em 001. Separar comandos em entregas pequenas; preservar venda/CAS/audit/exatidão; não uniformizar tudo por arrasto | **ALTO / MÉDIO–ALTO / ALTO** | Sem chave falha sem efeitos; retry idêntico único; alterado/contexto/ator impróprio recusado; cancelamento/restituição/estoque conciliados em bases sintéticas. Desbloqueia confiar dinheiro/dados ao sistema |
| **RETAIL-003 — Balcão e caixa do piloto** | Fluxo completo do vendedor restrito, caixa/posto selecionado, alçadas aprovadas, leitura/consulta proporcional se necessária, onboarding catálogo/saldo e conferência. DTO/authorization, UI legado/checkout/cash/catalog/inventory e testes | 001/002; um caixa reduz mudança de schema. Grade/carga real do nicho e prioridade ao teclado. Pode permanecer legado; não dar todas as permissions nem ampliar escopo Org | **ALTO / MÉDIO para um caixa; ALTO para três / MÉDIO–ALTO** | Dono e vendedor concluem jornada sem exposição indevida; estoque/caixa/relatório batem; regra de desconto/divergência aplicada; cadastro/carga viável. Desbloqueia operação diária |
| **RETAIL-004 — Rota fiscal e identidade do emitente** | Homologar emissão aplicável externa reconciliada ou integração mínima; falha/cancelamento/referência de documento. Domínio fiscal/adapter/docs; recorte Legal somente se contrato consumir | 001 define UF/regime/provedor. Dependências legais podem ser levantadas em paralelo, gate antes de vendas reais. Motor próprio aumenta esforço; C3 inteiro não é pré-condição automática | **ALTO / MÉDIO externo; ALTO integrado / ALTO** | Rota válida confirmada, emissor/contexto correto, fluxo de documento/cancelamento/contingência demonstrado sem duplicar fatos. Desbloqueia venda real conforme obrigação |
| **RETAIL-005 — Homologação operacional e entrega recuperável** | Ensaio isolado da jornada/falhas/concurrência/catálogo-alvo; leitor/térmica; cópia externa/restore/reabertura; pacote de release/atualização assistida segura; manual/saúde/contingência. Infra/operação/testes, consumidores medidos | 001–004 e arquitetura de implantação aprovada. Não testar no DB da loja; assinar/rastrear pacote e validar schema; ajuste de defeito retorna a revisão específica | **ALTO / MÉDIO–ALTO / ALTO** | Aceite registrado por cenário; perda simulada recuperada no RPO/RTO decidido; operadores treinados; limites conhecidos. Então solicitar decisão específica de implantação do piloto |

A numeração indica gates de aceite, não proíbe preparar documentação fiscal/hardware antes. Rota fiscal e recuperação precisam estar prontas **antes do primeiro comércio real**; não são tarefas para consertar depois de instalar.

### Caminho do piloto ao comercial

Após esses cinco incrementos e uma implantação separadamente aprovada, acompanhar piloto com dados de operação, fechamento/conciliação diária, incidentes e ensaio periódico de recuperação. Gate de comercialização: loja independente conclui onboarding, operação, exceções, suporte e atualização sem intervenção diária do desenvolvedor, no ambiente/autoridade aprovados.

Próximos incrementos conceituais, **também não autorizados**:

- **RETAIL-006 — Financeiro Básico e DRE por fatos:** fechar política de custo/competência/classificação; reversões e receitas/AR independentes; critérios do módulo essencial. Impacto ALTO para oferta conforme mestre; esforço/risco ALTO; depende de fatos de venda/compra/restituição confiáveis. Aceite: demonstrativo reconciliável, sem custo fabricado, módulo independente no recorte acordado.
- **RETAIL-007 — Operação comercial repetível:** onboarding/import, produção cloud/autoridade, suporte/monitoramento, contrato/acesso da oferta, update seguro e recuperação repetidos. Impacto ALTO; esforço/risco ALTO; depende do modelo comercial/arquitetura escolhido e métricas do piloto. Aceite: cliente sem relação pessoal opera e se recupera sem dependência diária dos fundadores. Não inicia Fase D/E integral automaticamente.
- Posteriores por demanda: migração React por fluxo, TEF, impressão especializada, imagem/logo, logística interunidade, offline formal e BI. Impacto variável; não ganham prioridade sem consumidor e gate aprovado.

## 17. Decisões pendentes do proprietário

1. Loja/UF/CNAE/regime, destinatários e validação da rota fiscal; externo ou provedor integrado; obrigações e responsáveis de cancelamento/conciliação.
2. Primeiro piloto de um caixa/PC ou exigência de dois/três gavetas/postos; cloud como alvo ou exceção local temporária expressa, com prazo/limites e recuperação. Esta análise não concede a exceção.
3. Perfil do vendedor e tarefas delegadas, descontos/alçadas/combinação de promoção, obrigatoriedade de caixa aberto e tratamento de diferenças.
4. Política de divergência/estoque negativo conforme mestre, restituição integral/parcial por meio e vínculo com provedor; nenhuma regra financeira inferida.
5. Código interno/SKU, tamanhos/cores, duplicatas de grade, carga e saldo inicial; se serão necessários packs/UOM fracionada além de peças.
6. Oferta do piloto e da primeira venda comercial: limites explícitos versus obrigação de Financeiro Básico/DRE do mestre; modelo de licença/acesso/contrato e condições de suporte.
7. RPO/RTO/retenção externa, responsabilidades/alertas e procedimento de falha de energia/rede/PC; modelos reais de impressora/leitor/terminal.
8. Se a rota fiscal consome identidade legal interna e qual recorte mínimo revisado de C3 é necessário. A decisão sobre implementação fica para nova solicitação.

## 18. O que preservar e encerramento

Preservar: exatidão monetária/quantidades; transações/rollback/CAS; IDs e histórico; espelhos/ledger/FKs; migrador/checksums/fail-closed e prefixos históricos de testes; validação de backup/schema; sessão/contexto/RBAC backend e isolamento; IDP-001 e intenção preparada de retry; aprovação contextual de inativo; branding Org-wide com CAS/audit/superfícies neutras; APIs SQL proporcionais; famílias/aliases/embalagens e inventário já existentes. Preservar não elimina evolução de fluxos com gaps; evita trocar fundamentos sólidos sem benefício comprovado.

Esta entrega muda somente este relatório e os dois marcadores de prioridade/auditoria em PROJECT_MASTER/ROADMAP. Não há novos resultados de navegador/hardware/testes; não houve leitura de base operacional, criação de fixture, screenshot ou alteração de schema. Os achados são evidência de implementação/contrato e os gates são propostas para revisão. **Aguardar decisão; nenhuma fase ou implementação começa automaticamente.**

## 19. Verificação documental da entrega

- HEAD preservado em `fe72a2e4c3416e56bf3c50950886a6b6ce4bc277`; index sem arquivos staged.
- `git diff --check` aprovado. O relatório novo também foi conferido com `git diff --no-index --check`, sem erros de whitespace; exit 1 indica o diff do arquivo novo, não falha de whitespace.
- Matriz com 33 domínios e oito dimensões; estrutura das tabelas e existência dos links locais conferidas.
- Migrations 001–012 comparadas com os blobs da baseline: todas byte a byte intactas; nenhuma 013 existe. SHA-256 de 012 preservado: `7491f73a443496cf3962a2bdf402873d45dcc20debcca95cdf9e24b713ce5f03`.
- `git diff --stat` dos arquivos já rastreados: dois arquivos, quatro inserções. O relatório novo permanece untracked e não aparece nesse comando; não foi adicionado ao index para produzir estatística.
- Código, testes, dependências e demais arquivos rastreados permanecem sem diff. Nenhum artefato operacional novo aparece como arquivo pendente.

`git status --short --untracked-files=all`:

```text
 M docs/atual/PROJECT_MASTER.md
 M docs/atual/ROADMAP.md
?? docs/atualizacoes/retail/RETAIL_000_MVP_AUDIT.md
```

Sem commit/push. Entrega encerrada para revisão, sem autorização de executar os incrementos propostos.
