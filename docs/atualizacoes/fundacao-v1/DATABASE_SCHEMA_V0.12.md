# Schema legado V0.12 — Fundação V1, passo 2

**ATUAL, diagnóstico documental de 2026-10-02.** Este catálogo cobre as **42 coleções reconhecidas pelo código**, o objeto company e os caminhos aninhados observados/produzidos. Não é uma migration, contrato SQL ou auditoria completa de segurança. Nenhum valor pessoal, ID de cliente, contato, conteúdo de nota, assinatura de comando ou senha foi publicado.

Na base da loja há **12 listas presentes e 30 ausentes** dentre as 42. **company é objeto separado e não entra nessa contagem.** Coleção ausente é compatibilidade legada; não significa funcionalidade não implementada. O arquivo real foi validado e seu SHA-256 permaneceu igual antes/depois da inspeção. A suíte instrumentada passou **205 testes, 0 falhas**, usando estados de teste em memória.

## Como ler

- **V**: exigência estrutural demonstrada no storage/validador, para registro ou contêiner presente. Não torna uma coleção opcional obrigatória no topo.
- **C**: produzido/conferido em comando, ou obrigatório somente em condição descrita nas regras. Não é exigência uniforme de persistência.
- **O**: somente observado na base/testes; obrigatoriedade não garantida.
- **B**: observado na base real; **T**: observado em retorno bem-sucedido de handler na suíte sintética; **S**: acrescentado por leitura estática de construtor/validador.
- Caminhos são relativos a um registro: items[].quantity significa campo dos itens embutidos. [] representa elemento de lista; * é chave dinâmica, cujo valor foi omitido. Tipos null/inteiro/etc observados não substituem constraints. Campos de snapshot podem repetir a estrutura original, inclusive registros anteriores; before/after/previous são polimórficos e não têm schema fixo independente.
- Tipos safe-integer são números exatos com Number.isSafeInteger; número assinado continua inteiro. String de código de barras preserva zeros. Dinheiro em centavos não usa reais em ponto flutuante no registro persistido.
- Campo não listado e ausente em testes/base é **A DEFINIR** quando não demonstrado pelo código; o storage legado admite propriedades adicionais. Presença em100% das amostras não foi usada para declarar obrigatoriedade.

## Raiz e validação

| Campo | Tipo/obrigatoriedade comprovada |
| --- | --- |
| products, customers, sales | listas obrigatórias, podendo ficar vazias |
| demais39 coleções abaixo | listas opcionais em legado, criadas pelos fluxos; se presentes, precisam ser listas de objetos |
| schemaVersion | opcional; se presente inteiro seguro1ou2; persistDatabase grava2 |
| company | objeto de apresentação emitido como {name:string, contact:string}; opcional, sem id e sem validação estrutural específica no storage |
| campos desconhecidos | não há whitelist que descarte/exija schema para todos; preservar ao migrar ou registrar decisão explícita |

Todas as coleções, exceto operationCommands/purchaseCommands/quoteCommands/cashCommands, exigem id textual não vazio único **dentro da coleção**. Não há garantia de unicidade global entre tabelas. Nos quatro logs de comando, apenas objeto por registro é exigido; os três antigos normalmente não têm id. O construtor usa randomUUID para novos IDs, mas o validador aceita IDs legados não UUID.

Fontes de validação: [storage.js](../../../storage.js), [workflow-storage.js](../../../workflow-storage.js), [advanced-storage.js](../../../advanced-storage.js), [credit-storage.js](../../../credit-storage.js), [operations-storage.js](../../../operations-storage.js), [round10-storage.js](../../../round10-storage.js). Cada seção também aponta os construtores. A verificação de uma referência apenas no comando não vira chave estrangeira de banco.

## Índice das coleções

| Coleção | Base real | Registros reais | Topo |
| --- | --- | ---: | --- |
| [products](#products) | presente | 2 | obrigatório |
| [customers](#customers) | presente | 1 | obrigatório |
| [sales](#sales) | presente | 3 | obrigatório |
| [suppliers](#suppliers) | presente | 1 | opcional legado |
| [purchases](#purchases) | presente | 1 | opcional legado |
| [payables](#payables) | presente | 1 | opcional legado |
| [expenses](#expenses) | presente | 1 | opcional legado |
| [quotes](#quotes) | presente | 1 | opcional legado |
| [cashSessions](#cashsessions) | ausente | 0 | opcional legado |
| [stockMovements](#stockmovements) | presente | 3 | opcional legado |
| [stockEntries](#stockentries) | ausente | 0 | opcional legado |
| [auditLog](#auditlog) | ausente | 0 | opcional legado |
| [operationCommands](#operationcommands) | presente | 2 | opcional legado |
| [purchaseCommands](#purchasecommands) | presente | 5 | opcional legado |
| [quoteCommands](#quotecommands) | presente | 1 | opcional legado |
| [cashCommands](#cashcommands) | ausente | 0 | opcional legado |
| [inventories](#inventories) | ausente | 0 | opcional legado |
| [reservations](#reservations) | ausente | 0 | opcional legado |
| [tasks](#tasks) | ausente | 0 | opcional legado |
| [hiddenOperations](#hiddenoperations) | ausente | 0 | opcional legado |
| [priceLists](#pricelists) | ausente | 0 | opcional legado |
| [promotions](#promotions) | ausente | 0 | opcional legado |
| [quarantineEntries](#quarantineentries) | ausente | 0 | opcional legado |
| [supplierReturns](#supplierreturns) | ausente | 0 | opcional legado |
| [storeCredits](#storecredits) | ausente | 0 | opcional legado |
| [deliveries](#deliveries) | ausente | 0 | opcional legado |
| [supplierQuotes](#supplierquotes) | ausente | 0 | opcional legado |
| [expenseCenters](#expensecenters) | ausente | 0 | opcional legado |
| [expenseBudgets](#expensebudgets) | ausente | 0 | opcional legado |
| [families](#families) | ausente | 0 | opcional legado |
| [positions](#positions) | ausente | 0 | opcional legado |
| [transfers](#transfers) | ausente | 0 | opcional legado |
| [positionMovements](#positionmovements) | ausente | 0 | opcional legado |
| [purchaseConferences](#purchaseconferences) | ausente | 0 | opcional legado |
| [purchaseAmendments](#purchaseamendments) | ausente | 0 | opcional legado |
| [purchaseOccurrences](#purchaseoccurrences) | ausente | 0 | opcional legado |
| [agreements](#agreements) | ausente | 0 | opcional legado |
| [recurringModels](#recurringmodels) | ausente | 0 | opcional legado |
| [recurringOccurrences](#recurringoccurrences) | ausente | 0 | opcional legado |
| [procedures](#procedures) | ausente | 0 | opcional legado |
| [procedureExecutions](#procedureexecutions) | ausente | 0 | opcional legado |
| [priceReviews](#pricereviews) | ausente | 0 | opcional legado |

## products

**Base real:** presente (2 registros). **Fontes:** [storage.js](../../../storage.js), [domain.js](../../../domain.js), [catalog.js](../../../catalog.js), [catalogue-next.js](../../../catalogue-next.js), [pricing.js](../../../pricing.js), [positions.js](../../../positions.js).

**Regras comprovadas:** stock e priceCents são inteiros seguros não negativos; name é texto. version, se presente, é inteiro ≥1. tags, se presentes, até20 textos não vazios de até40 caracteres. aliases/packages são opcionais: cada entrada exige id textual único dentro da lista, name/code textuais, active booleano, version≥1; embalagem também factor≥1 e≤1.000.000, e preço derivado seguro. O validador de persistência não exige active, code, barcode, minStock ou metadados nos registros antigos. Códigos alternativos não podem colidir entre si nem com códigos principais; a validação de cadastro compara códigos também entre produtos. positionBalances, quando presente, exige quantidades≥0 e posições existentes (posição inativa somente com saldo zero); familyId, se preenchido, precisa existir. Campos adicionais desconhecidos não são descartados pelo storage.

**Relações:** familyId → families.id; substitutes[].productId → products.id; positionBalances.* usa positions.id como chave. Não distribuído é saldo derivado, sem cadastro de posição. aliases e packages têm IDs próprios embutidos; não são coleções de topo.

**Datas/histórico:** aliases/packages.history guarda criação, edição e desativação; previous pode conter snapshot completo do identificador. Auditoria do cadastro vai para auditLog. stock é vendável físico; reservado e disponível são derivados, não campos de autoridade persistente.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| active | boolean | O; ver regra do fluxo | T |  |
| aliases | array | C | S |  |
| aliases[] | object | C | S |  |
| aliases[].active | boolean | C | S |  |
| aliases[].code | string | C | S |  |
| aliases[].date | string | C | S | instante/data textual; ver distinção nas regras |
| aliases[].history | array | C | S |  |
| aliases[].history[] | object | C | S |  |
| aliases[].history[].action | string | C | S |  |
| aliases[].history[].date | string | C | S | instante/data textual; ver distinção nas regras |
| aliases[].history[].previous | object | C | S |  |
| aliases[].history[].reason | string | C | S |  |
| aliases[].history[].responsible | string | C | S |  |
| aliases[].id | string | C | S | identificador textual; referência conforme regras |
| aliases[].name | string | C | S |  |
| aliases[].version | safe-integer | C | S | inteiro/versão quando preenchido |
| barcode | string | O; ver regra do fluxo | T |  |
| brand | string | O; ver regra do fluxo | T |  |
| category | string | O; ver regra do fluxo | T |  |
| code | string | O; ver regra do fluxo | T |  |
| date | string | C | S | instante/data textual; ver distinção nas regras |
| familyAttributes | object | O; ver regra do fluxo | T |  |
| familyAttributes.* | string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| familyId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| id | string | V | B, T | identificador textual; referência conforme regras |
| internalNote | string | O; ver regra do fluxo | T |  |
| location | string | O; ver regra do fluxo | T |  |
| minimumPriceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| minStock | safe-integer | O; ver regra do fluxo | T |  |
| name | string | V | B, T |  |
| packages | array | O; ver regra do fluxo | T |  |
| packages[] | object | O; ver regra do fluxo | T |  |
| packages[].active | boolean | O; ver regra do fluxo | T |  |
| packages[].code | string | O; ver regra do fluxo | T |  |
| packages[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| packages[].factor | safe-integer | O; ver regra do fluxo | T |  |
| packages[].history | array | O; ver regra do fluxo | T |  |
| packages[].history[] | object | O; ver regra do fluxo | T |  |
| packages[].history[].action | string | O; ver regra do fluxo | T |  |
| packages[].history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| packages[].history[].previous | object | O; ver regra do fluxo | T |  |
| packages[].history[].previous.* | array / boolean / safe-integer / string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| packages[].history[].previous.*[] | object | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| packages[].history[].previous.*[].action | string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| packages[].history[].previous.*[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| packages[].history[].previous.*[].responsible | string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| packages[].history[].reason | string | O; ver regra do fluxo | T |  |
| packages[].history[].responsible | string | O; ver regra do fluxo | T |  |
| packages[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| packages[].name | string | O; ver regra do fluxo | T |  |
| packages[].unit | string | O; ver regra do fluxo | T |  |
| packages[].version | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| positionBalances | object | O; ver regra do fluxo | T |  |
| positionBalances.* | safe-integer | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| priceCents | safe-integer | V | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| stock | safe-integer | V | B, T |  |
| substitutes | array | C | S |  |
| substitutes[] | object | C | S |  |
| substitutes[].date | string | C | S | instante/data textual; ver distinção nas regras |
| substitutes[].note | string | C | S |  |
| substitutes[].productId | string | C | S | identificador textual; referência conforme regras |
| tags | array | O; ver regra do fluxo | T |  |
| tags[] | string | O; ver regra do fluxo | T |  |
| unit | string | O; ver regra do fluxo | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |

## customers

**Base real:** presente (1 registros). **Fontes:** [server.js](../../../server.js), [storage.js](../../../storage.js), [catalog.js](../../../catalog.js), [quotes.js](../../../quotes.js), [pricing.js](../../../pricing.js).

**Regras comprovadas:** name é texto; id obrigatório e único. version, se presente,≥1; tags opcionais são validadas. Campos de contato, active e preferredPriceListId são produzidos pelos fluxos, sem validação estrutural uniforme no storage.

**Relações:** preferredPriceListId → priceLists.id, conferido pelo fluxo que atribui a lista; vendas históricas só se vinculam por customerId existente no registro, sem inferência pelo nome.

**Datas/histórico:** date/updatedAt são emitidos pelos fluxos; edições e situação podem gerar auditLog. responsible é texto declarado, não usuário autenticado.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| active | boolean | O; ver regra do fluxo | T |  |
| address | string | C | S |  |
| commercialId | string | C | S | identificador textual; referência conforme regras |
| contactName | string | C | S |  |
| date | string | C | S | instante/data textual; ver distinção nas regras |
| email | string | O; ver regra do fluxo | B, T |  |
| id | string | V | B, T | identificador textual; referência conforme regras |
| name | string | V | B, T |  |
| phone | string | O; ver regra do fluxo | B, T |  |
| preferredPriceListId | null / string | C | S, T | identificador textual; referência conforme regras |
| tags | array | C | S |  |
| tags[] | string | C | S |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |

## sales

**Base real:** presente (3 registros). **Fontes:** [server.js](../../../server.js), [storage.js](../../../storage.js), [payments.js](../../../payments.js), [workflows.js](../../../workflows.js), [accounts.js](../../../accounts.js), [store-credits.js](../../../store-credits.js), [checkout.js](../../../checkout.js), [agreements.js](../../../agreements.js).

**Regras comprovadas:** items é lista (storage legado não exige que seja não vazia); totalCents≥0; itens quantity≥1 e priceCents≥0 inteiros seguros. O fluxo de venda exige itens, produto/cliente ativos, estoque livre suficiente e preço revisado. paymentMethod usa cash/pix/debit/credit/other; paymentStatus é recebido/pendente/parcial pelos fluxos, mas esses campos não têm enum universal no storage. receivablePlan, se presente, de1a60 parcelas e soma igual a totalCents. Alocações de recebimento/perdão devem referir parcelas e somar o valor; devolução não ultrapassa quantidade vendida/total. checkout opcional valida total=internal+received+remaining e troco=tendered−cash; recibos com troco validam valor e método. Crédito usado/restaurado exige alocações e vínculo de cliente/origem válidos.

**Relações:** customerId → customers.id ou null; items[].productId → products.id; quoteId → quotes.id; reservationId → reservations.id; receipts[].cashSessionId/refunds[].cashSessionId → cashSessions.id ou null. activeAgreementId → agreements.id; receipts[].agreementId/agreementPaymentId → acordo e pagamento. storeCreditAllocations[].creditId → storeCredits.id. returns[].items[].quarantineEntryId → quarantineEntries.id. stockSources[].positionId → positions.id ou string vazia. Nem todas estas referências são verificadas pelo storage legado: várias apenas no comando.

**Datas/histórico:** items/negotiation são snapshots de nome/preço/embalagem/promoção. receipts, returns, refunds, receivablePlan, planHistory, forgiveness, agreementHistory e returnAllocation preservam histórico financeiro/comercial. Não recalcular antigas pelo cadastro atual. DueDate pode ser null; legado pode não conter customerId/receipts. requestFingerprint é SHA-256 de entradas de venda; não representa autenticação.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| accountVersion | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| activeAgreementId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| agreementHistory | array | O; ver regra do fluxo | T |  |
| agreementHistory[] | object | O; ver regra do fluxo | T |  |
| agreementHistory[].agreementId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| agreementHistory[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| agreementHistory[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| cancelledAt | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| checkout | object | O; ver regra do fluxo | T |  |
| checkout.cashCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| checkout.changeCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| checkout.internalCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| checkout.receiptIds | array | O; ver regra do fluxo | T |  |
| checkout.receiptIds[] | string | O; ver regra do fluxo | T |  |
| checkout.receivedCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| checkout.recordedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| checkout.remainingCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| checkout.status | string | O; ver regra do fluxo | T |  |
| checkout.tenderedCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| checkout.totalCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| customerId | null / string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| customerName | string | O; ver regra do fluxo | B, T |  |
| date | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| discountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| discountReason | string | O; ver regra do fluxo | T |  |
| dueDate | null / string | O; ver regra do fluxo | B, T | data civil YYYY-MM-DD quando preenchida |
| forgivenCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| forgiveness | array | O; ver regra do fluxo | T |  |
| forgiveness[] | object | O; ver regra do fluxo | T |  |
| forgiveness[].allocations | array | O; ver regra do fluxo | T |  |
| forgiveness[].allocations[] | object | O; ver regra do fluxo | T |  |
| forgiveness[].allocations[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| forgiveness[].allocations[].installmentId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| forgiveness[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| forgiveness[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| forgiveness[].reason | string | O; ver regra do fluxo | T |  |
| forgiveness[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | B, T | identificador textual; referência conforme regras |
| items | array | V | B, T |  |
| items[] | object | O; ver regra do fluxo | B, T |  |
| items[].basePriceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].code | string | O; ver regra do fluxo | T |  |
| items[].listPriceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].name | string | O; ver regra do fluxo | B, T |  |
| items[].packages | array | O; ver regra do fluxo | T |  |
| items[].packages[] | object | C | S, T |  |
| items[].packages[].count | safe-integer | C | S, T |  |
| items[].packages[].factor | safe-integer | C | S, T |  |
| items[].packages[].name | string | C | S, T |  |
| items[].packages[].packageId | string | C | S, T | identificador textual; referência conforme regras |
| items[].packages[].version | safe-integer | C | S, T | inteiro/versão quando preenchido |
| items[].priceCents | safe-integer | V | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].priceListId | null / string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].priceListName | null / string | O; ver regra do fluxo | T |  |
| items[].priceListVersion | null / safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| items[].priceOrigin | string | O; ver regra do fluxo | T |  |
| items[].productId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| items[].promotion | null / object | O; ver regra do fluxo | T |  |
| items[].promotion.endsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| items[].promotion.id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].promotion.minQuantity | safe-integer | O; ver regra do fluxo | T |  |
| items[].promotion.name | string | O; ver regra do fluxo | T |  |
| items[].promotion.percentBps | safe-integer | O; ver regra do fluxo | T | percentual em pontos-base; 10000=100% |
| items[].promotion.startsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| items[].promotion.type | string | O; ver regra do fluxo | T |  |
| items[].promotion.valueCents | null | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].promotion.version | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| items[].quantity | safe-integer | V | B, T |  |
| items[].stockSources | array | O; ver regra do fluxo | T |  |
| items[].stockSources[] | object | O; ver regra do fluxo | T |  |
| items[].stockSources[].name | string | O; ver regra do fluxo | T |  |
| items[].stockSources[].positionId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].stockSources[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| items[].substitutedFrom | object | C | S |  |
| items[].substitutedFrom.code | string | C | S |  |
| items[].substitutedFrom.id | string | C | S | identificador textual; referência conforme regras |
| items[].substitutedFrom.name | string | C | S |  |
| negotiation | object | O; ver regra do fluxo | T |  |
| negotiation.baseCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.customerId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| negotiation.items | array | O; ver regra do fluxo | T |  |
| negotiation.items[] | object | O; ver regra do fluxo | T |  |
| negotiation.items[].basePriceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.items[].listPriceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.items[].name | string | O; ver regra do fluxo | T |  |
| negotiation.items[].priceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.items[].priceListId | null / string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| negotiation.items[].priceListName | null / string | O; ver regra do fluxo | T |  |
| negotiation.items[].priceListVersion | null / safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| negotiation.items[].priceOrigin | string | O; ver regra do fluxo | T |  |
| negotiation.items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| negotiation.items[].promotion | null / object | O; ver regra do fluxo | T |  |
| negotiation.items[].promotion.endsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| negotiation.items[].promotion.id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| negotiation.items[].promotion.minQuantity | safe-integer | O; ver regra do fluxo | T |  |
| negotiation.items[].promotion.name | string | O; ver regra do fluxo | T |  |
| negotiation.items[].promotion.percentBps | safe-integer | O; ver regra do fluxo | T | percentual em pontos-base; 10000=100% |
| negotiation.items[].promotion.startsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| negotiation.items[].promotion.type | string | O; ver regra do fluxo | T |  |
| negotiation.items[].promotion.valueCents | null | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.items[].promotion.version | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| negotiation.items[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| negotiation.listCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.offerReason | string | O; ver regra do fluxo | T |  |
| negotiation.priceListId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| negotiation.priceListName | string | O; ver regra do fluxo | T |  |
| negotiation.priceListVersion | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| negotiation.promotionCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.signature | string | O; ver regra do fluxo | T |  |
| negotiation.subtotalCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| paymentMethod | string | O; ver regra do fluxo | B, T |  |
| paymentStatus | string | O; ver regra do fluxo | B, T |  |
| planHistory | array | O; ver regra do fluxo | T |  |
| planHistory[] | object | C | S |  |
| planHistory[].date | string | C | S | instante/data textual; ver distinção nas regras |
| planHistory[].plan | array | C | S |  |
| planHistory[].plan[] | object | C | S |  |
| planHistory[].plan[].amountCents | safe-integer | C | S | dinheiro em centavos; conferir nulidade/sinal na regra |
| planHistory[].plan[].dueDate | null / string | C | S | data civil YYYY-MM-DD quando preenchida |
| planHistory[].plan[].id | string | C | S | identificador textual; referência conforme regras |
| planHistory[].plan[].number | safe-integer | C | S | inteiro/versão quando preenchido |
| pos | object | C | S |  |
| pos.shift | string | C | S |  |
| pos.station | string | C | S |  |
| quoteId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| quoteNumber | safe-integer | O; ver regra do fluxo | T |  |
| receipts | array | O; ver regra do fluxo | B, T |  |
| receipts[] | object | O; ver regra do fluxo | B, T |  |
| receipts[].agreementId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| receipts[].agreementPaymentId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| receipts[].allocations | array | O; ver regra do fluxo | T |  |
| receipts[].allocations[] | object | O; ver regra do fluxo | T |  |
| receipts[].allocations[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| receipts[].allocations[].installmentId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| receipts[].amountCents | safe-integer | O; ver regra do fluxo | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| receipts[].cashSessionId | null / string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| receipts[].changeCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| receipts[].date | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| receipts[].id | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| receipts[].paymentMethod | string | O; ver regra do fluxo | B, T |  |
| receipts[].reference | string | O; ver regra do fluxo | T |  |
| receipts[].requestId | null / string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| receipts[].saleId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| receipts[].tenderedCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| receivablePlan | array | O; ver regra do fluxo | T |  |
| receivablePlan[] | object | O; ver regra do fluxo | T |  |
| receivablePlan[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| receivablePlan[].dueDate | null / string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| receivablePlan[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| receivablePlan[].number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| receivedAt | null / string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| refunds | array | O; ver regra do fluxo | T |  |
| refunds[] | object | O; ver regra do fluxo | T |  |
| refunds[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| refunds[].cashSessionId | null / string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| refunds[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| refunds[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| refunds[].note | string | O; ver regra do fluxo | T |  |
| refunds[].paidDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| refunds[].paymentMethod | string | O; ver regra do fluxo | T |  |
| refunds[].recordedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| refunds[].returnRefund | boolean | O; ver regra do fluxo | T |  |
| requestFingerprint | string | O; ver regra do fluxo | B, T |  |
| requestId | null / string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| reservationId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| reservationNumber | safe-integer | O; ver regra do fluxo | T |  |
| returnAllocation | array | O; ver regra do fluxo | T |  |
| returnAllocation[] | object | O; ver regra do fluxo | T |  |
| returnAllocation[].discountedUnits | safe-integer | O; ver regra do fluxo | T |  |
| returnAllocation[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| returnAllocation[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| returnAllocation[].unitNetCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| returns | array | O; ver regra do fluxo | T |  |
| returns[] | object | O; ver regra do fluxo | T |  |
| returns[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| returns[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| returns[].items | array | O; ver regra do fluxo | T |  |
| returns[].items[] | object | O; ver regra do fluxo | T |  |
| returns[].items[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| returns[].items[].name | string | O; ver regra do fluxo | T |  |
| returns[].items[].note | string | O; ver regra do fluxo | T |  |
| returns[].items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| returns[].items[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| returns[].items[].quarantineEntryId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| returns[].items[].quarantineQuantity | safe-integer | O; ver regra do fluxo | T |  |
| returns[].items[].remaining | safe-integer | O; ver regra do fluxo | T |  |
| returns[].items[].restock | boolean | O; ver regra do fluxo | T |  |
| returns[].items[].restockQuantity | safe-integer | O; ver regra do fluxo | T |  |
| returns[].number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| returns[].reason | string | O; ver regra do fluxo | T |  |
| returns[].responsible | string | O; ver regra do fluxo | T |  |
| returns[].storeCreditRestoredCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| returns[].totalCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| returnVersion | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| storeCreditAllocations | array | O; ver regra do fluxo | T |  |
| storeCreditAllocations[] | object | O; ver regra do fluxo | T |  |
| storeCreditAllocations[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| storeCreditAllocations[].creditId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| storeCreditAllocations[].restoredCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| storeCreditCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| storeCreditIssuedCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| storeCreditRestoredCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| subtotalCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| totalCents | safe-integer | V | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |

## suppliers

**Base real:** presente (1 registros). **Fontes:** [purchases.js](../../../purchases.js), [storage.js](../../../storage.js), [catalog.js](../../../catalog.js).

**Regras comprovadas:** name é texto; version opcional≥1; tags opcionais validadas. O handler cria active=true/version1/date/updatedAt e confere email não vazio no cadastro; os campos de contato não são exigidos estruturalmente para legado.

**Relações:** id referenciado por compras, contas, cotações, recorrências e devoluções. commercialId é identificador comercial declarado, não tenant.

**Datas/histórico:** auditLog registra alterações; supplierName nas operações é snapshot e não deve ser substituído pelo nome atual.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| active | boolean | O; ver regra do fluxo | B, T |  |
| address | string | C | S |  |
| commercialId | string | C | S | identificador textual; referência conforme regras |
| contactName | string | C | S |  |
| date | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| email | string | O; ver regra do fluxo | B, T |  |
| id | string | V | B, T | identificador textual; referência conforme regras |
| name | string | V | B, T |  |
| notes | string | O; ver regra do fluxo | B, T |  |
| phone | string | O; ver regra do fluxo | B, T |  |
| tags | array | C | S |  |
| tags[] | string | C | S |  |
| updatedAt | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| version | safe-integer | O; ver regra do fluxo | B, T | inteiro/versão quando preenchido |

## purchases

**Base real:** presente (1 registros). **Fontes:** [purchases.js](../../../purchases.js), [storage.js](../../../storage.js), [purchase-next.js](../../../purchase-next.js), [supplier-quotes.js](../../../supplier-quotes.js).

**Regras comprovadas:** items não vazia; receipts lista; version≥1; totalCents≥0 e igual à soma quantity×unitCostCents; quantity≥1/custo≥0. Recebimento precisa referir item pedido e acumulado não pode exceder pedido; custo diferente requer costReason e originalUnitCostCents igual ao pedido. O fluxo preserva fornecedor ativo, previsões civis e estados draft/pending/partial/received/closed/cancelled derivados dos fatos. Datas/nomes/referências não são todos obrigatórios no storage.

**Relações:** supplierId → suppliers.id; sourceId → purchases.id ou null; items[].productId → products.id; receipts[].conferenceId → purchaseConferences.id; receipts[].items[].quarantineEntryId → quarantineEntries.id; destinationPositionId → positions.id ou vazio; amendmentIds[] → purchaseAmendments.id; supplierQuoteId/supplierQuoteResponseId → cotação/resposta.

**Datas/histórico:** items/receipts/originalOrder/quotedSelection guardam snapshots; scheduleHistory conserva previsão anterior/motivo. closedPendingQuantity e closedPendingCents preservam saldo encerrado. Compra recebida altera estoque; criar conta/pagar não recebe estoque novamente.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| amendmentIds | array | O; ver regra do fluxo | T |  |
| amendmentIds[] | string | O; ver regra do fluxo | T |  |
| closedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| closedPendingCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| closedPendingQuantity | safe-integer | O; ver regra do fluxo | T |  |
| closeReason | string | O; ver regra do fluxo | T |  |
| confirmedAt | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| confirmedExpectedDate | null / string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| date | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| expectedDate | null / string | O; ver regra do fluxo | B, T | data civil YYYY-MM-DD quando preenchida |
| id | string | V | B, T | identificador textual; referência conforme regras |
| items | array | V | B, T |  |
| items[] | object | O; ver regra do fluxo | B, T |  |
| items[].code | string | O; ver regra do fluxo | B, T |  |
| items[].name | string | O; ver regra do fluxo | B, T |  |
| items[].packages | array | O; ver regra do fluxo | T |  |
| items[].packages[] | object | C | S |  |
| items[].packages[].count | safe-integer | C | S |  |
| items[].packages[].factor | safe-integer | C | S |  |
| items[].packages[].name | string | C | S |  |
| items[].packages[].packageId | string | C | S | identificador textual; referência conforme regras |
| items[].packages[].version | safe-integer | C | S | inteiro/versão quando preenchido |
| items[].productId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| items[].quantity | safe-integer | V | B, T |  |
| items[].substitutedFrom | object | C | S |  |
| items[].substitutedFrom.code | string | C | S |  |
| items[].substitutedFrom.id | string | C | S | identificador textual; referência conforme regras |
| items[].substitutedFrom.name | string | C | S |  |
| items[].unitCostCents | safe-integer | V | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| note | string | O; ver regra do fluxo | B, T |  |
| number | safe-integer | O; ver regra do fluxo | B, T | inteiro/versão quando preenchido |
| originalOrder | object | O; ver regra do fluxo | T |  |
| originalOrder.date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| originalOrder.items | array | O; ver regra do fluxo | T |  |
| originalOrder.items[] | object | O; ver regra do fluxo | T |  |
| originalOrder.items[].code | string | O; ver regra do fluxo | T |  |
| originalOrder.items[].name | string | O; ver regra do fluxo | T |  |
| originalOrder.items[].packages | array | O; ver regra do fluxo | T |  |
| originalOrder.items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| originalOrder.items[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| originalOrder.items[].unitCostCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| originalOrder.totalCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| quotedFreightCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| quotedSelection | array | O; ver regra do fluxo | T |  |
| quotedSelection[] | object | O; ver regra do fluxo | T |  |
| quotedSelection[].expectedCostCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| quotedSelection[].expectedResponseVersion | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| quotedSelection[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| quotedSelection[].reason | string | O; ver regra do fluxo | T |  |
| quotedSelection[].responseId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| quotedSelection[].supplierId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| receipts | array | V | B, T |  |
| receipts[] | object | O; ver regra do fluxo | B, T |  |
| receipts[].conferenceId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| receipts[].conferent | string | O; ver regra do fluxo | T |  |
| receipts[].date | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| receipts[].declaredDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| receipts[].id | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| receipts[].items | array | V | B, T |  |
| receipts[].items[] | object | O; ver regra do fluxo | B, T |  |
| receipts[].items[].costReason | string | O; ver regra do fluxo | T |  |
| receipts[].items[].destinationPositionId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| receipts[].items[].name | string | O; ver regra do fluxo | B, T |  |
| receipts[].items[].originalUnitCostCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| receipts[].items[].productId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| receipts[].items[].quantity | safe-integer | V | B, T |  |
| receipts[].items[].quarantineEntryId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| receipts[].items[].quarantineQuantity | safe-integer | O; ver regra do fluxo | T |  |
| receipts[].items[].unitCostCents | safe-integer | V | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| receipts[].note | string | O; ver regra do fluxo | B, T |  |
| receipts[].reference | string | O; ver regra do fluxo | T |  |
| receipts[].requestId | null / string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| receipts[].sequence | safe-integer | O; ver regra do fluxo | B, T |  |
| scheduleHistory | array | O; ver regra do fluxo | T |  |
| scheduleHistory[] | object | O; ver regra do fluxo | T |  |
| scheduleHistory[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| scheduleHistory[].expectedDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| scheduleHistory[].previousDate | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| scheduleHistory[].reason | string | O; ver regra do fluxo | T |  |
| sourceId | null / string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| supplierId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| supplierName | string | O; ver regra do fluxo | B, T |  |
| supplierQuoteId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| supplierQuoteNumber | safe-integer | O; ver regra do fluxo | T |  |
| supplierQuoteResponseId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| totalCents | safe-integer | V | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| updatedAt | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | B, T | inteiro/versão quando preenchido |

## payables

**Base real:** presente (1 registros). **Fontes:** [payables.js](../../../payables.js), [storage.js](../../../storage.js), [budgets.js](../../../budgets.js), [agreements.js](../../../agreements.js), [round10-storage.js](../../../round10-storage.js).

**Regras comprovadas:** installments de1a60; payments lista; totalCents≥1 e soma exata das parcelas. ID de parcela textual e único; parcela≥1. Pagamentos positivos devem referir parcela existente e despesa correspondente (vínculo simples ou compartilhado); acumulado não ultrapassa parcela. Campos fornecedor/descritivos/version são emitidos pelo handler, sem exigência uniforme adicional do storage. expenseCenterId preenchido exige centro existente.

**Relações:** supplierId → suppliers.id; purchaseId → purchases.id ou null; installments[].id é local ao documento; payments[].installmentId refere uma dessas parcelas; payments[].expenseId → expenses.id com reciprocidade. activeAgreementId/agreementsHistory → agreements; expenseCenterId → expenseCenters.

**Datas/histórico:** snapshot purchaseNumber/purchaseTotalCents/supplierName; payments/instalments preservados após cancelamento de saldo (cancelledCents, cancelledAt, cancelReason). history guarda classificação e auditLog outras alterações.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| activeAgreementId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| agreementHistory | array | O; ver regra do fluxo | T |  |
| agreementHistory[] | object | O; ver regra do fluxo | T |  |
| agreementHistory[].agreementId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| agreementHistory[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| agreementHistory[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| cancelledAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| cancelledCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| cancelReason | string | O; ver regra do fluxo | T |  |
| date | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| description | string | O; ver regra do fluxo | B, T |  |
| differenceReason | string | O; ver regra do fluxo | B, T |  |
| expenseCategory | string | O; ver regra do fluxo | T |  |
| expenseCenterId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| history | array | O; ver regra do fluxo | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].previous | object | O; ver regra do fluxo | T |  |
| history[].previous.* | null | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | B, T | identificador textual; referência conforme regras |
| installments | array | V | B, T |  |
| installments[] | object | O; ver regra do fluxo | B, T |  |
| installments[].amountCents | safe-integer | V | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| installments[].dueDate | null / string | O; ver regra do fluxo | B, T | data civil YYYY-MM-DD quando preenchida |
| installments[].id | string | V | B, T | identificador textual; referência conforme regras |
| installments[].number | safe-integer | O; ver regra do fluxo | B, T | inteiro/versão quando preenchido |
| note | string | O; ver regra do fluxo | B, T |  |
| number | safe-integer | O; ver regra do fluxo | B, T | inteiro/versão quando preenchido |
| payments | array | V | B, T |  |
| payments[] | object | O; ver regra do fluxo | B, T |  |
| payments[].agreementId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| payments[].agreementPaymentId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| payments[].amountCents | safe-integer | V | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| payments[].cashSessionId | null / string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| payments[].date | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| payments[].expenseId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| payments[].id | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| payments[].installmentId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| payments[].linkedExisting | boolean | O; ver regra do fluxo | B, T |  |
| payments[].note | string | O; ver regra do fluxo | B, T |  |
| payments[].paidDate | string | O; ver regra do fluxo | B, T | data civil YYYY-MM-DD quando preenchida |
| payments[].paymentMethod | string | O; ver regra do fluxo | B, T |  |
| payments[].requestId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| purchaseId | null / string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| purchaseNumber | null / safe-integer | O; ver regra do fluxo | B, T |  |
| purchaseTotalCents | null / safe-integer | O; ver regra do fluxo | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| reference | string | O; ver regra do fluxo | B, T |  |
| supplierId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| supplierName | string | O; ver regra do fluxo | B, T |  |
| totalCents | safe-integer | V | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| updatedAt | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| version | safe-integer | O; ver regra do fluxo | B, T | inteiro/versão quando preenchido |

## expenses

**Base real:** presente (1 registros). **Fontes:** [domain.js](../../../domain.js), [storage.js](../../../storage.js), [payables.js](../../../payables.js), [budgets.js](../../../budgets.js), [recurring.js](../../../recurring.js), [agreements.js](../../../agreements.js).

**Regras comprovadas:** amountCents inteiro seguro>0; expenseCenterId preenchido exige centro existente. paidDate/description/paymentMethod são obrigatórios na criação manual, mas não todos no storage. payableAllocations, se presente, não vazia, até500, soma=amountCents, sem payableId e com reciprocidade de pagamentos; paymentId não repetido. Campos monetários de limite e justificativa só são emitidos quando limite é excedido.

**Relações:** cashSessionId → cashSessions.id ou null; payableId/payablePaymentId → conta e pagamento, ou payableAllocations[] → múltiplas contas/pagamentos/parcelas. expenseCenterId → expenseCenters.id; recurringOccurrenceId → recurringOccurrences.id; agreementId → agreements.id. BudgetVersion é snapshot, não ID de orçamento.

**Datas/histórico:** paidDate é data civil efetiva; createdAt é instante de registro. cancelamento não remove histórico nem faz estorno bancário. history guarda classificação. Devoluções ao cliente não geram necessariamente despesa em expenses: ficam em sales.refunds para evitar dupla contagem.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| agreementId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| amountCents | safe-integer | V | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| budgetExcessReason | string | O; ver regra do fluxo | T |  |
| budgetLimitCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| budgetVersion | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| cancelledAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| cashSessionId | null / string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| category | string | O; ver regra do fluxo | B, T |  |
| createdAt | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| description | string | O; ver regra do fluxo | B, T |  |
| expenseCenterId | null / string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| history | array | O; ver regra do fluxo | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].previous | object | O; ver regra do fluxo | T |  |
| history[].previous.* | null / string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | B, T | identificador textual; referência conforme regras |
| note | string | O; ver regra do fluxo | B, T |  |
| paidDate | string | O; ver regra do fluxo | B, T | data civil YYYY-MM-DD quando preenchida |
| payableAllocations | array | O; ver regra do fluxo | T |  |
| payableAllocations[] | object | O; ver regra do fluxo | T |  |
| payableAllocations[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| payableAllocations[].budgetExcessReason | string | O; ver regra do fluxo | T |  |
| payableAllocations[].category | string | O; ver regra do fluxo | T |  |
| payableAllocations[].expenseCenterId | null | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| payableAllocations[].installmentId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| payableAllocations[].originId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| payableAllocations[].payableId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| payableAllocations[].paymentId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| payableId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| payablePaymentId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| paymentMethod | string | O; ver regra do fluxo | B, T |  |
| recurringOccurrenceId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| requestId | null / string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| supplierName | string | O; ver regra do fluxo | B, T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | O; ver regra do fluxo | B, T | inteiro/versão quando preenchido |

## quotes

**Base real:** presente (1 registros). **Fontes:** [quotes.js](../../../quotes.js), [storage.js](../../../storage.js), [catalogue-next.js](../../../catalogue-next.js), [pricing.js](../../../pricing.js).

**Regras comprovadas:** items é lista; totalCents≥0; itens quantidade≥1 e preço≥0, inteiros seguros. Handler exige1a500 itens, validade civil real, versões e cadastros ativos. version/id/saleId e outros campos históricos não são todos exigidos no storage legado. packages opcionais validam equivalência.

**Relações:** customerId → customers.id ou null; items[].productId → products.id; sourceId → quotes.id ou null; saleId → sales.id; itemRevisions[].items/updatedItems guardam snapshots dos mesmos itens.

**Datas/histórico:** negotiation e snapshots de embalagem/preço/promoção; convertedAt/cancelledAt/updatedAt; itemRevisions contém itens anteriores/novos e responsável declarado. Conversão liga uma venda sem duplicar estoque.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| cancelledAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| convertedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| customerId | null / string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| customerName | string | O; ver regra do fluxo | B, T |  |
| date | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| discountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| discountReason | string | O; ver regra do fluxo | T |  |
| id | string | V | B, T | identificador textual; referência conforme regras |
| itemRevisions | array | O; ver regra do fluxo | T |  |
| itemRevisions[] | object | O; ver regra do fluxo | T |  |
| itemRevisions[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| itemRevisions[].items | array | O; ver regra do fluxo | T |  |
| itemRevisions[].items[] | object | O; ver regra do fluxo | T |  |
| itemRevisions[].items[].name | string | O; ver regra do fluxo | T |  |
| itemRevisions[].items[].packages | array | O; ver regra do fluxo | T |  |
| itemRevisions[].items[].packages[] | object | O; ver regra do fluxo | T |  |
| itemRevisions[].items[].packages[].count | safe-integer | O; ver regra do fluxo | T |  |
| itemRevisions[].items[].packages[].factor | safe-integer | O; ver regra do fluxo | T |  |
| itemRevisions[].items[].packages[].name | string | O; ver regra do fluxo | T |  |
| itemRevisions[].items[].packages[].packageId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| itemRevisions[].items[].packages[].version | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| itemRevisions[].items[].priceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| itemRevisions[].items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| itemRevisions[].items[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| itemRevisions[].responsible | string | O; ver regra do fluxo | T |  |
| itemRevisions[].updatedItems | array | O; ver regra do fluxo | T |  |
| itemRevisions[].updatedItems[] | object | O; ver regra do fluxo | T |  |
| itemRevisions[].updatedItems[].name | string | O; ver regra do fluxo | T |  |
| itemRevisions[].updatedItems[].packages | array | O; ver regra do fluxo | T |  |
| itemRevisions[].updatedItems[].priceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| itemRevisions[].updatedItems[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| itemRevisions[].updatedItems[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| itemRevisions[].updatedItems[].substitutedFrom | object | O; ver regra do fluxo | T |  |
| itemRevisions[].updatedItems[].substitutedFrom.code | string | O; ver regra do fluxo | T |  |
| itemRevisions[].updatedItems[].substitutedFrom.id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| itemRevisions[].updatedItems[].substitutedFrom.name | string | O; ver regra do fluxo | T |  |
| itemRevisions[].version | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| items | array | V | B, T |  |
| items[] | object | O; ver regra do fluxo | B, T |  |
| items[].basePriceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].listPriceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].name | string | O; ver regra do fluxo | B, T |  |
| items[].packages | array | O; ver regra do fluxo | T |  |
| items[].packages[] | object | C | S, T |  |
| items[].packages[].count | safe-integer | C | S, T |  |
| items[].packages[].factor | safe-integer | C | S, T |  |
| items[].packages[].name | string | C | S, T |  |
| items[].packages[].packageId | string | C | S, T | identificador textual; referência conforme regras |
| items[].packages[].version | safe-integer | C | S, T | inteiro/versão quando preenchido |
| items[].priceCents | safe-integer | V | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].priceListId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].priceListName | string | O; ver regra do fluxo | T |  |
| items[].priceListVersion | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| items[].priceOrigin | string | O; ver regra do fluxo | T |  |
| items[].productId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| items[].promotion | object | O; ver regra do fluxo | T |  |
| items[].promotion.endsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| items[].promotion.id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].promotion.minQuantity | safe-integer | O; ver regra do fluxo | T |  |
| items[].promotion.name | string | O; ver regra do fluxo | T |  |
| items[].promotion.percentBps | safe-integer | O; ver regra do fluxo | T | percentual em pontos-base; 10000=100% |
| items[].promotion.startsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| items[].promotion.type | string | O; ver regra do fluxo | T |  |
| items[].promotion.valueCents | null | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].promotion.version | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| items[].quantity | safe-integer | V | B, T |  |
| items[].substitutedFrom | object | C | S, T |  |
| items[].substitutedFrom.code | string | C | S, T |  |
| items[].substitutedFrom.id | string | C | S, T | identificador textual; referência conforme regras |
| items[].substitutedFrom.name | string | C | S, T |  |
| negotiation | object | O; ver regra do fluxo | T |  |
| negotiation.baseCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.customerId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| negotiation.items | array | O; ver regra do fluxo | T |  |
| negotiation.items[] | object | O; ver regra do fluxo | T |  |
| negotiation.items[].basePriceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.items[].listPriceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.items[].name | string | O; ver regra do fluxo | T |  |
| negotiation.items[].packages | array | O; ver regra do fluxo | T |  |
| negotiation.items[].priceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.items[].priceListId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| negotiation.items[].priceListName | string | O; ver regra do fluxo | T |  |
| negotiation.items[].priceListVersion | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| negotiation.items[].priceOrigin | string | O; ver regra do fluxo | T |  |
| negotiation.items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| negotiation.items[].promotion | object | O; ver regra do fluxo | T |  |
| negotiation.items[].promotion.endsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| negotiation.items[].promotion.id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| negotiation.items[].promotion.minQuantity | safe-integer | O; ver regra do fluxo | T |  |
| negotiation.items[].promotion.name | string | O; ver regra do fluxo | T |  |
| negotiation.items[].promotion.percentBps | safe-integer | O; ver regra do fluxo | T | percentual em pontos-base; 10000=100% |
| negotiation.items[].promotion.startsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| negotiation.items[].promotion.type | string | O; ver regra do fluxo | T |  |
| negotiation.items[].promotion.valueCents | null | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.items[].promotion.version | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| negotiation.items[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| negotiation.listCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.offerReason | string | O; ver regra do fluxo | T |  |
| negotiation.priceListId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| negotiation.priceListName | string | O; ver regra do fluxo | T |  |
| negotiation.priceListVersion | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| negotiation.promotionCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| negotiation.signature | string | O; ver regra do fluxo | T |  |
| negotiation.subtotalCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| note | string | O; ver regra do fluxo | B, T |  |
| number | safe-integer | O; ver regra do fluxo | B, T | inteiro/versão quando preenchido |
| saleId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| sourceId | null / string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| subtotalCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| totalCents | safe-integer | V | B, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| updatedAt | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| validUntil | null / string | O; ver regra do fluxo | B, T | data civil YYYY-MM-DD quando preenchida |
| version | safe-integer | O; ver regra do fluxo | B, T | inteiro/versão quando preenchido |

## cashSessions

**Base real:** ausente. **Fontes:** [cash.js](../../../cash.js), [storage.js](../../../storage.js), [public/cash-core.js](../../../public/cash-core.js).

**Regras comprovadas:** openingCents inteiro≥0; movements lista; cada amountCents inteiro>0. Handler só permite um caixa aberto e valida saldo/contagem/justificativa, mas openedAt/openedBy/closing não são obrigatórios estruturais uniformes. differenceCents do fechamento pode ser negativo.

**Relações:** movements[].referenceId depende type (sale, expense, supplierRefund ou null); receiptId refere recibo da venda. refunds de venda podem compartilhar ID com movimento. Estes não são chaves estrangeiras SQL.

**Datas/histórico:** openedAt/closedAt e openedBy/closedBy; movements conserva receipt/expense/supply/withdraw/refund/supplierRefund; closing contém totais esperados/contados/diferença e nota, sem apagar operações.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| closedAt | null / string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| closedBy | string | C | S, T |  |
| closing | object | C | S, T |  |
| closing.countedCents | safe-integer | C | S, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| closing.differenceCents | safe-integer | C | S, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| closing.expectedCents | safe-integer | C | S, T | dinheiro em centavos; conferir nulidade/sinal na regra |
| closing.note | string | C | S, T |  |
| closing.totals | object | C | S, T |  |
| closing.totals.* | safe-integer | C | S, T | chave dinâmica anonimizada; estrutura depende do contexto |
| id | string | V | T | identificador textual; referência conforme regras |
| movements | array | V | T |  |
| movements[] | object | O; ver regra do fluxo | T |  |
| movements[].amountCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| movements[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| movements[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| movements[].note | string | O; ver regra do fluxo | T |  |
| movements[].paymentMethod | string | O; ver regra do fluxo | T |  |
| movements[].receiptId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| movements[].referenceId | null / string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| movements[].responsible | string | O; ver regra do fluxo | T |  |
| movements[].type | string | O; ver regra do fluxo | T |  |
| openedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| openedBy | string | O; ver regra do fluxo | T |  |
| openingCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |

## stockMovements

**Base real:** presente (3 registros). **Fontes:** [domain.js](../../../domain.js), [positions.js](../../../positions.js), [workflows.js](../../../workflows.js), [purchases.js](../../../purchases.js).

**Regras comprovadas:** Além do id, storage não exige uniforme demais campos desta coleção. Handler emite quantity assinado e stockAfter inteiro. Entradas/saídas/inventário e reconciliação física produzem fatos; quantidade pode ser negativa ou zero (estoque inicial).

**Relações:** productId → products.id; referenceId é polimórfico conforme type: produto inicial, venda, recebimento, entrada avulsa, inventário, quarentena ou devolução. purchaseId/saleId opcionais contextualizam algumas operações. positionAllocations[].positionId → posição ou vazio.

**Datas/histórico:** productName é snapshot; date é instante; note contextual. Executor e autorizador autenticados ainda não existem. positionHandled identifica ajuste físico já aplicado; não duplicar reconciliação.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| date | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| destinationPositionId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| id | string | V | B, T | identificador textual; referência conforme regras |
| note | string | O; ver regra do fluxo | B, T |  |
| positionAllocations | array | O; ver regra do fluxo | T |  |
| positionAllocations[] | object | O; ver regra do fluxo | T |  |
| positionAllocations[].name | string | O; ver regra do fluxo | T |  |
| positionAllocations[].positionId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| positionAllocations[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| positionHandled | boolean | O; ver regra do fluxo | T |  |
| productId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| productName | string | O; ver regra do fluxo | B, T |  |
| purchaseId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| quantity | safe-integer | O; ver regra do fluxo | B, T |  |
| referenceId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| saleId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| stockAfter | safe-integer | O; ver regra do fluxo | B, T |  |
| type | string | O; ver regra do fluxo | B, T |  |

## stockEntries

**Base real:** ausente. **Fontes:** [server.js#change](../../../server.js).

**Regras comprovadas:** Storage só exige id; handler emite quantity inteiro>0, requestId opcional/null e texto limitado. Corresponde à entrada avulsa atual cuja retirada da UI foi anotada, não executada nesta fundação.

**Relações:** productId → products.id; destinationPositionId → positions.id ou vazio; stockMovements.referenceId aponta para esta entrada quando type=entry.

**Datas/histórico:** date/productName/note e requestId preservam fato e reenvio; nenhum responsável autenticado é gravado.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| destinationPositionId | string | C | S, T | identificador textual; referência conforme regras |
| id | string | V | T | identificador textual; referência conforme regras |
| note | string | O; ver regra do fluxo | T |  |
| productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| productName | string | O; ver regra do fluxo | T |  |
| quantity | safe-integer | O; ver regra do fluxo | T |  |
| requestId | null / string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |

## auditLog

**Base real:** ausente. **Fontes:** [audit.js](../../../audit.js).

**Regras comprovadas:** Somente id tem validação estrutural genérica. changes é produzido como lista de campos alterados; before/after podem ser texto/número/booleano/null/objeto/lista, conforme campo. Conteúdo de valores não está neste inventário.

**Relações:** kind/recordId apontam ao cadastro/documento afetado; nomes kind incluem variantes singulares (purchase/payable). Não há validação universal dessas referências.

**Datas/histórico:** date/responsible declarado/name snapshot/changes; sem identidade real nem prova contra adulteração. Alterações excluem version/updatedAt do comparativo, mas não os campos de negócio.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| changes | array | O; ver regra do fluxo | T |  |
| changes[] | object | O; ver regra do fluxo | T |  |
| changes[].after | array / boolean / object / safe-integer / string | O; ver regra do fluxo | T |  |
| changes[].after.* | string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| changes[].after[] | object / string | O; ver regra do fluxo | T |  |
| changes[].after[].active | boolean | O; ver regra do fluxo | T |  |
| changes[].after[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| changes[].after[].code | string | O; ver regra do fluxo | T |  |
| changes[].after[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| changes[].after[].dueDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| changes[].after[].expectedDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| changes[].after[].factor | safe-integer | O; ver regra do fluxo | T |  |
| changes[].after[].history | array | O; ver regra do fluxo | T |  |
| changes[].after[].history[] | object | O; ver regra do fluxo | T |  |
| changes[].after[].history[].action | string | O; ver regra do fluxo | T |  |
| changes[].after[].history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| changes[].after[].history[].previous | object | O; ver regra do fluxo | T |  |
| changes[].after[].history[].previous.* | array / boolean / safe-integer / string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| changes[].after[].history[].previous.*[] | object | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| changes[].after[].history[].previous.*[].action | string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| changes[].after[].history[].previous.*[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| changes[].after[].history[].previous.*[].responsible | string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| changes[].after[].history[].reason | string | O; ver regra do fluxo | T |  |
| changes[].after[].history[].responsible | string | O; ver regra do fluxo | T |  |
| changes[].after[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| changes[].after[].name | string | O; ver regra do fluxo | T |  |
| changes[].after[].number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| changes[].after[].previousDate | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| changes[].after[].reason | string | O; ver regra do fluxo | T |  |
| changes[].after[].unit | string | O; ver regra do fluxo | T |  |
| changes[].after[].version | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| changes[].before | array / boolean / null / safe-integer / string | O; ver regra do fluxo | T |  |
| changes[].before[] | object | O; ver regra do fluxo | T |  |
| changes[].before[].active | boolean | O; ver regra do fluxo | T |  |
| changes[].before[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| changes[].before[].code | string | O; ver regra do fluxo | T |  |
| changes[].before[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| changes[].before[].dueDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| changes[].before[].factor | safe-integer | O; ver regra do fluxo | T |  |
| changes[].before[].history | array | O; ver regra do fluxo | T |  |
| changes[].before[].history[] | object | O; ver regra do fluxo | T |  |
| changes[].before[].history[].action | string | O; ver regra do fluxo | T |  |
| changes[].before[].history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| changes[].before[].history[].responsible | string | O; ver regra do fluxo | T |  |
| changes[].before[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| changes[].before[].name | string | O; ver regra do fluxo | T |  |
| changes[].before[].number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| changes[].before[].unit | string | O; ver regra do fluxo | T |  |
| changes[].before[].version | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| changes[].field | string | O; ver regra do fluxo | T |  |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| id | string | V | T | identificador textual; referência conforme regras |
| kind | string | O; ver regra do fluxo | T |  |
| name | string | O; ver regra do fluxo | T |  |
| recordId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| responsible | string | O; ver regra do fluxo | T |  |

## operationCommands

**Base real:** presente (2 registros). **Fontes:** [commands.js](../../../commands.js).

**Regras comprovadas:** Storage exige apenas que cada linha seja objeto; pula exigência/uniquidade de id para todas as quatro coleções de comandos. Handler geral emite id/requestId/signature/scope/action/date. RequestId não vazio até80 caracteres, não necessariamente UUID no validador validateKey.

**Relações:** requestId reutilizado com SHA-256 diferente rejeita comando; assinatura inclui scope/action/input. Não é usuário nem autorização.

**Datas/histórico:** Log de idempotência persistente; data de execução e escopo. Retenção e limpeza A DEFINIR.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| action | string | O; ver regra do fluxo | B, T |  |
| date | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| id | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| requestId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| scope | string | O; ver regra do fluxo | B, T |  |
| signature | string | O; ver regra do fluxo | B, T |  |

## purchaseCommands

**Base real:** presente (5 registros). **Fontes:** [purchases.js](../../../purchases.js).

**Regras comprovadas:** Storage só exige linha objeto. Handler emite requestId/signature/date; não id. assinatura SHA-256 inclui action/input e cobre fornecedores/compras.

**Relações:** requestId vincula reenvio lógico, sem FK de documento e sem usuário autenticado.

**Datas/histórico:** Registro preservado para evitar reenvio com conteúdo diferente.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| date | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| requestId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| signature | string | O; ver regra do fluxo | B, T |  |

## quoteCommands

**Base real:** presente (1 registros). **Fontes:** [quotes.js](../../../quotes.js).

**Regras comprovadas:** Storage só exige linha objeto. Handler emite requestId/signature/date; não id. assinatura SHA-256 representa action e entradas.

**Relações:** requestId de criação/edição/conversão de orçamento; não é sessão/identidade.

**Datas/histórico:** Registro de reenvio; não normalizar removendo histórico durante migração.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| date | string | O; ver regra do fluxo | B, T | instante/data textual; ver distinção nas regras |
| requestId | string | O; ver regra do fluxo | B, T | identificador textual; referência conforme regras |
| signature | string | O; ver regra do fluxo | B, T |  |

## cashCommands

**Base real:** ausente. **Fontes:** [cash.js](../../../cash.js).

**Regras comprovadas:** Storage só exige linha objeto. Handler emite requestId/signature/date; não id. signature é JSON textual dos campos revisados, diferentemente do SHA-256 das outras coleções.

**Relações:** sessionId/saleId estão no conteúdo da assinatura, não campos separados do registro; não divulgar o conteúdo em documentação.

**Datas/histórico:** Log de reenvio de ações de caixa; contém texto declarado no JSON serializado, portanto tratar como dado protegido.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| requestId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| signature | string | O; ver regra do fluxo | T |  |

## inventories

**Base real:** ausente. **Fontes:** [workflows.js](../../../workflows.js), [workflow-storage.js](../../../workflow-storage.js), [positions.js](../../../positions.js).

**Regras comprovadas:** items não vazia até500 e identificação única por productId ou id; version≥1/name texto/rebases lista. expectedStock≥0; counted é null ou inteiro≥0. counts opcional é lista de exatamente2 valores null/inteiro≥0. Modo cego/posição e recontagem exigem coleta/decisão no handler. difference pode ser negativo; demais tokens/snapshots são conferidos pelo fluxo, não por todos os validadores.

**Relações:** items[].productId → products.id; positionScope, se definido, → posição ou vazio; stockToken referencia último stockMovements.id; positionToken é JSON de saldos; não são autenticação. Aplicação produz stockMovements e positionMovements.

**Datas/histórico:** collectionHistory, countHistory, conferents, finalDecision, rebases e summary preservam decisão/conferência declaradas; appliedAt/cancelledAt/closedWithoutAdjustment distinguem aplicar de encerrar sem ajuste.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| appliedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| blind | boolean | O; ver regra do fluxo | T |  |
| cancelledAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| closedWithoutAdjustment | boolean | C | S |  |
| collectedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| collectionHistory | array | O; ver regra do fluxo | T |  |
| collectionHistory[] | object | O; ver regra do fluxo | T |  |
| collectionHistory[].action | string | O; ver regra do fluxo | T |  |
| collectionHistory[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| collectionHistory[].reason | string | C | S |  |
| collectionHistory[].responsible | string | O; ver regra do fluxo | T |  |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| id | string | V | T | identificador textual; referência conforme regras |
| items | array | V | T |  |
| items[] | object | O; ver regra do fluxo | T |  |
| items[].barcode | string | O; ver regra do fluxo | T |  |
| items[].code | string | O; ver regra do fluxo | T |  |
| items[].conferents | array | O; ver regra do fluxo | T |  |
| items[].conferents[] | object | O; ver regra do fluxo | T |  |
| items[].conferents[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| items[].conferents[].name | string | O; ver regra do fluxo | T |  |
| items[].counted | null / safe-integer | V | T |  |
| items[].countHistory | array | O; ver regra do fluxo | T |  |
| items[].countHistory[] | object | O; ver regra do fluxo | T |  |
| items[].countHistory[].countNumber | safe-integer | O; ver regra do fluxo | T |  |
| items[].countHistory[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| items[].countHistory[].previous | null | O; ver regra do fluxo | T |  |
| items[].countHistory[].previousNote | string | O; ver regra do fluxo | T |  |
| items[].countNotes | array | O; ver regra do fluxo | T |  |
| items[].countNotes[] | string | O; ver regra do fluxo | T |  |
| items[].counts | array | O; ver regra do fluxo | T |  |
| items[].counts[] | null / safe-integer | O; ver regra do fluxo | T |  |
| items[].difference | safe-integer | O; ver regra do fluxo | T |  |
| items[].expectedGlobalStock | safe-integer | O; ver regra do fluxo | T |  |
| items[].expectedStock | safe-integer | V | T |  |
| items[].finalDecision | null / object | O; ver regra do fluxo | T |  |
| items[].finalDecision.countNumber | safe-integer | O; ver regra do fluxo | T |  |
| items[].finalDecision.date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| items[].finalDecision.reason | string | O; ver regra do fluxo | T |  |
| items[].finalDecision.responsible | string | O; ver regra do fluxo | T |  |
| items[].finalStock | safe-integer | O; ver regra do fluxo | T |  |
| items[].name | string | O; ver regra do fluxo | T |  |
| items[].note | string | O; ver regra do fluxo | T |  |
| items[].positionToken | string | O; ver regra do fluxo | T |  |
| items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].recountRequired | boolean | O; ver regra do fluxo | T |  |
| items[].selectedCount | safe-integer | O; ver regra do fluxo | T |  |
| items[].stockToken | null | O; ver regra do fluxo | T |  |
| name | string | V | T |  |
| note | string | O; ver regra do fluxo | T |  |
| number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| positionName | string | O; ver regra do fluxo | T |  |
| positionScope | string | O; ver regra do fluxo | T |  |
| reason | string | O; ver regra do fluxo | T |  |
| rebases | array | V | T |  |
| rebases[] | object | O; ver regra do fluxo | T |  |
| rebases[].changes | array | O; ver regra do fluxo | T |  |
| rebases[].changes[] | object | O; ver regra do fluxo | T |  |
| rebases[].changes[].after | safe-integer | O; ver regra do fluxo | T |  |
| rebases[].changes[].before | safe-integer | O; ver regra do fluxo | T |  |
| rebases[].changes[].counted | safe-integer | O; ver regra do fluxo | T |  |
| rebases[].changes[].countNotes | array | O; ver regra do fluxo | T |  |
| rebases[].changes[].countNotes[] | string | O; ver regra do fluxo | T |  |
| rebases[].changes[].counts | array | O; ver regra do fluxo | T |  |
| rebases[].changes[].counts[] | null / safe-integer | O; ver regra do fluxo | T |  |
| rebases[].changes[].note | string | O; ver regra do fluxo | T |  |
| rebases[].changes[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| rebases[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| rebases[].reason | string | O; ver regra do fluxo | T |  |
| responsible | string | O; ver regra do fluxo | T |  |
| summary | object | O; ver regra do fluxo | T |  |
| summary.changed | safe-integer | O; ver regra do fluxo | T |  |
| summary.conflicts | safe-integer | O; ver regra do fluxo | T |  |
| summary.counted | safe-integer | O; ver regra do fluxo | T |  |
| summary.decrease | safe-integer | O; ver regra do fluxo | T |  |
| summary.increase | safe-integer | O; ver regra do fluxo | T |  |
| summary.missing | safe-integer | O; ver regra do fluxo | T |  |
| summary.products | safe-integer | O; ver regra do fluxo | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## reservations

**Base real:** ausente. **Fontes:** [workflows.js](../../../workflows.js), [workflow-storage.js](../../../workflow-storage.js).

**Regras comprovadas:** version≥1; itens não vazios até500 com identificação única; total≥0 e soma de itens menos discountCents; validade preenchida deve ser civil real. Handler exige cliente ativo e saldo livre, versão e renovação não passada. Status é derivado, não campo obrigatório armazenado.

**Relações:** customerId → customers.id; items[].productId → products.id; saleId → sales.id após conversão.

**Datas/histórico:** snapshot preço/nome; renewals conserva validade anterior/motivo; convertedAt/cancelledAt; reserva compromete disponibilidade mas não diminui stock físico até vender.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| cancelledAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| convertedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| customerId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| customerName | string | O; ver regra do fluxo | T |  |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| discountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| discountReason | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| items | array | V | T |  |
| items[] | object | O; ver regra do fluxo | T |  |
| items[].code | string | O; ver regra do fluxo | T |  |
| items[].name | string | O; ver regra do fluxo | T |  |
| items[].priceCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].quantity | safe-integer | V | T |  |
| note | string | O; ver regra do fluxo | T |  |
| number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| reason | string | O; ver regra do fluxo | T |  |
| renewals | array | C | S |  |
| renewals[] | object | C | S |  |
| renewals[].date | string | C | S | instante/data textual; ver distinção nas regras |
| renewals[].previous | null / string | C | S |  |
| renewals[].reason | string | C | S |  |
| renewals[].validUntil | null / string | C | S | data civil YYYY-MM-DD quando preenchida |
| responsible | string | O; ver regra do fluxo | T |  |
| saleId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| subtotalCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| totalCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| validUntil | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## tasks

**Base real:** ausente. **Fontes:** [tasks.js](../../../tasks.js), [workflow-storage.js](../../../workflow-storage.js), [purchase-next.js](../../../purchase-next.js), [procedures.js](../../../procedures.js).

**Regras comprovadas:** version≥1, title texto não vazio, priority low/normal/high, history lista. dueDate opcional real. link é conferido por handler e pode referir20 tipos internos; estrutura/name pode variar quando criada automaticamente por ocorrência/procedimento.

**Relações:** link.kind+link.id é referência polimórfica; installmentId opcional para sales/payables. purchaseOccurrences.taskId e procedureExecutions.steps[].taskId apontam de volta para esta tarefa.

**Datas/histórico:** history guarda ação/antes/responsável/nota; completedAt/reopenReason/cancelledAt/cancelReason preservados; cancelamento não elimina registro.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| completedAt | null / string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| completionNote | string | O; ver regra do fluxo | T |  |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| dueDate | null / string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].before | null / object | O; ver regra do fluxo | T |  |
| history[].before.* | null / string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].note | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| link | null / object | O; ver regra do fluxo | T |  |
| link.id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| link.installmentId | null | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| link.kind | string | O; ver regra do fluxo | T |  |
| link.name | string | O; ver regra do fluxo | T |  |
| note | string | O; ver regra do fluxo | T |  |
| number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| priority | string | V | T |  |
| reopenReason | string | O; ver regra do fluxo | T |  |
| responsible | string | O; ver regra do fluxo | T |  |
| title | string | V | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## hiddenOperations

**Base real:** ausente. **Fontes:** [tasks.js](../../../tasks.js), [workflow-storage.js](../../../workflow-storage.js).

**Regras comprovadas:** key texto; hidden booleano; history lista. id exigido pelo storage geral. Handler valida pendência existente antes de ocultar e motivo obrigatório; restaurar mantém o mesmo registro.

**Relações:** key é chave de pendência gerada por business-core, não FK estável de documento e não registro excluído.

**Datas/histórico:** history[].date/hidden/reason/responsible; ocultação é preferência operacional, não remoção financeira.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| hidden | boolean | V | S |  |
| history | array | V | S |  |
| history[] | object | C | S |  |
| history[].date | string | C | S | instante/data textual; ver distinção nas regras |
| history[].hidden | boolean | C | S |  |
| history[].reason | string | C | S |  |
| history[].responsible | string | C | S |  |
| id | string | V | S | identificador textual; referência conforme regras |
| key | string | V | S |  |

## priceLists

**Base real:** ausente. **Fontes:** [pricing.js](../../../pricing.js), [advanced-storage.js](../../../advanced-storage.js).

**Regras comprovadas:** version/number≥1,name texto não vazio,active booleano,history lista. datas opcionais civis em ordem. items lista até500 (pode ficar vazia),productId textual único e preço≥0. Handler valida produto/versão e preserva códigos/nomes históricos.

**Relações:** items[].productId → products.id; sourceId → priceLists.id ou null; customers.preferredPriceListId aponta para lista. Histórico reviewId → priceReviews.id.

**Datas/histórico:** history contém before/previous ou percentBps nas operações; vigência/situação é derivada; preço ausente para produto recorre ao preço padrão.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| active | boolean | V | T |  |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| description | string | O; ver regra do fluxo | T |  |
| endsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].before | array / object | O; ver regra do fluxo | T |  |
| history[].before.* | array / boolean / null / safe-integer / string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| history[].before.*[] | object | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| history[].before.*[].action | string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| history[].before.*[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].before.*[].name | string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| history[].before.*[].priceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| history[].before.*[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| history[].before.*[].responsible | string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| history[].before[] | object | O; ver regra do fluxo | T |  |
| history[].before[].name | string | O; ver regra do fluxo | T |  |
| history[].before[].priceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| history[].before[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].percentBps | safe-integer | O; ver regra do fluxo | T | percentual em pontos-base; 10000=100% |
| history[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| history[].reviewId | string | C | S | identificador textual; referência conforme regras |
| id | string | V | T | identificador textual; referência conforme regras |
| items | array | V | T |  |
| items[] | object | O; ver regra do fluxo | T |  |
| items[].name | string | O; ver regra do fluxo | T |  |
| items[].priceCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].productId | string | V | T | identificador textual; referência conforme regras |
| name | string | V | T |  |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| responsible | string | O; ver regra do fluxo | T |  |
| sourceId | null | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| startsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## promotions

**Base real:** ausente. **Fontes:** [pricing.js](../../../pricing.js), [advanced-storage.js](../../../advanced-storage.js).

**Regras comprovadas:** version/number≥1,name não vazio,active booleano,history lista; vigência opcional real em ordem. type=fixed/percent,minQuantity≥1,productIds lista não vazia única. fixed exige valueCents≥0; percent exige percentBps de1a10000. Ramo de edição pode conservar campo do outro tipo; não inferir remoção automática.

**Relações:** productIds[] → products.id, normalmente verificado no comando, não FK SQL. sourceId → promotions.id ou null; category é snapshot/filtro comercial, não uma entidade distinta.

**Datas/histórico:** history e closedAt; negociação grava snapshot da promoção nos itens sem alterar vendas antigas.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| active | boolean | V | T |  |
| category | string | O; ver regra do fluxo | T |  |
| closedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| description | string | O; ver regra do fluxo | T |  |
| endsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| minQuantity | safe-integer | V | T |  |
| name | string | V | T |  |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| percentBps | safe-integer | O; ver regra do fluxo | T | percentual em pontos-base; 10000=100% |
| productIds | array | V | T |  |
| productIds[] | string | O; ver regra do fluxo | T |  |
| responsible | string | O; ver regra do fluxo | T |  |
| sourceId | null | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| startsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| type | string | V | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## quarantineEntries

**Base real:** ausente. **Fontes:** [quarantine.js](../../../quarantine.js), [advanced-storage.js](../../../advanced-storage.js), [supplier-returns.js](../../../supplier-returns.js).

**Regras comprovadas:** version≥1, initialQuantity≥1, remainingQuantity≥0; productId existente; inspections/counts/dispositions listas. Saldo recomposto pelo histórico: adjust assinado, release/discard/supplierReturn positivos e saldo nunca negativo.

**Relações:** productId → products.id; origin pode ser null ou {kind,id,receiptId/returnId/purchaseId} para purchases/sales/supplierReturns. dispositions[].referenceId pode apontar supplierReturns.

**Datas/histórico:** inspections/conferências/counts/dispositions/history preservam motivos e responsáveis declarados. Retido é separado do vendável: não somar automaticamente em produto.stock.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| counts | array | V | T |  |
| counts[] | object | O; ver regra do fluxo | T |  |
| counts[].appliedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| counts[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| counts[].note | string | O; ver regra do fluxo | T |  |
| counts[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| counts[].referenceQuantity | safe-integer | O; ver regra do fluxo | T |  |
| counts[].referenceVersion | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| counts[].responsible | string | O; ver regra do fluxo | T |  |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| dispositions | array | V | T |  |
| dispositions[] | object | O; ver regra do fluxo | T |  |
| dispositions[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| dispositions[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| dispositions[].reason | string | O; ver regra do fluxo | T |  |
| dispositions[].referenceId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| dispositions[].responsible | string | O; ver regra do fluxo | T |  |
| dispositions[].type | string | O; ver regra do fluxo | T |  |
| history | array | O; ver regra do fluxo | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| initialQuantity | safe-integer | V | T |  |
| inspections | array | V | T |  |
| inspections[] | object | O; ver regra do fluxo | T |  |
| inspections[].conclusion | string | O; ver regra do fluxo | T |  |
| inspections[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| inspections[].note | string | O; ver regra do fluxo | T |  |
| inspections[].responsible | string | O; ver regra do fluxo | T |  |
| number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| origin | null / object | O; ver regra do fluxo | T |  |
| origin.id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| origin.kind | string | O; ver regra do fluxo | T |  |
| origin.purchaseId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| origin.receiptId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| origin.returnId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| productId | string | V | T | identificador textual; referência conforme regras |
| productName | string | O; ver regra do fluxo | T |  |
| reason | string | O; ver regra do fluxo | T |  |
| remainingQuantity | safe-integer | V | T |  |
| responsible | string | O; ver regra do fluxo | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## supplierReturns

**Base real:** ausente. **Fontes:** [supplier-returns.js](../../../supplier-returns.js), [advanced-storage.js](../../../advanced-storage.js).

**Regras comprovadas:** version≥1,total≥0,items não vazia sem productId repetido,refunds lista. quantidade≥1,custo/aceita/recusada/retornada≥0; aceita+recusada≤expedida, retornada≤recusada. Soma quantity×custo=total; restituição positiva com paidDate real, até referência aceita.

**Relações:** purchaseId/receiptId → compra/recebimento; supplierId → suppliers.id; items[].productId → products.id; quarantineEntryId → quarentena ou null. refunds[].cashSessionId → cashSessions.id ou null.

**Datas/histórico:** dispatchedAt/cancelledAt/dispatchReference e history de aceite/recusa/retorno; refunds separado da retirada física, para não registrar recebimento de dinheiro apenas por aceite.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| dispatchedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| dispatchReference | string | C | S, T |  |
| history | array | O; ver regra do fluxo | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].declaredDate | string | C | S, T | data civil YYYY-MM-DD quando preenchida |
| history[].items | array | C | S, T |  |
| history[].items[] | object | C | S, T |  |
| history[].items[].destination | string | C | S, T |  |
| history[].items[].productId | string | C | S, T | identificador textual; referência conforme regras |
| history[].items[].quantity | safe-integer | C | S, T |  |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].reference | string | C | S, T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| items | array | V | T |  |
| items[] | object | O; ver regra do fluxo | T |  |
| items[].acceptedQuantity | safe-integer | V | T |  |
| items[].name | string | O; ver regra do fluxo | T |  |
| items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].quantity | safe-integer | V | T |  |
| items[].quarantineEntryId | null / string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].refusedQuantity | safe-integer | V | T |  |
| items[].returnedQuantity | safe-integer | V | T |  |
| items[].source | string | O; ver regra do fluxo | T |  |
| items[].unitCostCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| purchaseId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| purchaseNumber | safe-integer | O; ver regra do fluxo | T |  |
| reason | string | O; ver regra do fluxo | T |  |
| receiptId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| reference | string | O; ver regra do fluxo | T |  |
| refunds | array | V | T |  |
| refunds[] | object | O; ver regra do fluxo | T |  |
| refunds[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| refunds[].cashSessionId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| refunds[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| refunds[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| refunds[].paidDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| refunds[].paymentMethod | string | O; ver regra do fluxo | T |  |
| refunds[].reason | string | O; ver regra do fluxo | T |  |
| refunds[].reference | string | O; ver regra do fluxo | T |  |
| refunds[].responsible | string | O; ver regra do fluxo | T |  |
| responsible | string | O; ver regra do fluxo | T |  |
| supplierId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| supplierName | string | O; ver regra do fluxo | T |  |
| totalCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## storeCredits

**Base real:** ausente. **Fontes:** [store-credits.js](../../../store-credits.js), [credit-storage.js](../../../credit-storage.js).

**Regras comprovadas:** saleId e returnId precisam existir juntos na origem; customerId coincide com o valor na venda (o comando exige cliente identificado; o validador isolado não exige sua presença caso a venda também não o contenha). amountCents>0; remainingCents≥0 e≤emissão; events lista, valores positivos, type issue/use/restore/cancel. Recompõe saldo sequencial sem negativo/nem exceder emissão; cancelado deve ter saldo zero. Version/date são produzidos pelo baseRecord, não exigidos especificamente neste validador.

**Relações:** customerId → customers.id; saleId → sales.id; returnId → sales.returns[].id. events[].saleId/returnId registram uso/restauração; vendas guardam alocações por creditId.

**Datas/histórico:** events é extrato de emissão/uso/restauração/cancelamento; soma ativa emitida confere sales.storeCreditIssuedCents; não confundir com dinheiro recebido.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| amountCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| cancelledAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| customerId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| customerName | string | O; ver regra do fluxo | T |  |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| events | array | V | T |  |
| events[] | object | O; ver regra do fluxo | T |  |
| events[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| events[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| events[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| events[].returnId | null / string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| events[].saleId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| events[].type | string | O; ver regra do fluxo | T |  |
| history | array | O; ver regra do fluxo | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| reason | string | O; ver regra do fluxo | T |  |
| remainingCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| responsible | string | O; ver regra do fluxo | T |  |
| returnId | string | V | T | identificador textual; referência conforme regras |
| saleId | string | V | T | identificador textual; referência conforme regras |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |

## deliveries

**Base real:** ausente. **Fontes:** [deliveries.js](../../../deliveries.js), [operations-storage.js](../../../operations-storage.js).

**Regras comprovadas:** saleId existente e uma ordem por venda; version≥1; method local/pickup/other; previsão opcional civil. items não vazia≤500, sem produto repetido, produto/quantidade iguais à venda, separada entre0equantidade. Declarações de shipment/delivery/return/reconcile, quando presentes, precisam itens válidos e saldos logísticos coerentes. Arrays/logística histórica são produzidos por handler, não todas obrigatórias no storage.

**Relações:** saleId → sales.id; customerId snapshot da venda; items[].productId → item vendido; commercialReconciliations[].returnIds[] → devoluções da venda.

**Datas/histórico:** shipments, deliveries, attempts, logisticReturns, commercialReconciliations e history com data declarada/registrada. Entrega acompanha venda; não baixa estoque uma segunda vez.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| address | string | O; ver regra do fluxo | T |  |
| attempts | array | O; ver regra do fluxo | T |  |
| attempts[] | object | O; ver regra do fluxo | T |  |
| attempts[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| attempts[].declaredDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| attempts[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| attempts[].reason | string | O; ver regra do fluxo | T |  |
| commercialReconciliations | array | O; ver regra do fluxo | T |  |
| commercialReconciliations[] | object | O; ver regra do fluxo | T |  |
| commercialReconciliations[].cancelledAt | null | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| commercialReconciliations[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| commercialReconciliations[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| commercialReconciliations[].items | array | O; ver regra do fluxo | T |  |
| commercialReconciliations[].items[] | object | O; ver regra do fluxo | T |  |
| commercialReconciliations[].items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| commercialReconciliations[].items[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| commercialReconciliations[].reason | string | O; ver regra do fluxo | T |  |
| commercialReconciliations[].returnIds | array | O; ver regra do fluxo | T |  |
| commercialReconciliations[].returnIds[] | string | O; ver regra do fluxo | T |  |
| contact | string | O; ver regra do fluxo | T |  |
| customerId | null / string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| customerName | string | O; ver regra do fluxo | T |  |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| deliveries | array | O; ver regra do fluxo | T |  |
| deliveries[] | object | O; ver regra do fluxo | T |  |
| deliveries[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| deliveries[].declaredDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| deliveries[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| deliveries[].items | array | O; ver regra do fluxo | T |  |
| deliveries[].items[] | object | O; ver regra do fluxo | T |  |
| deliveries[].items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| deliveries[].items[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| deliveries[].recipient | string | O; ver regra do fluxo | T |  |
| expectedDate | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| history | array | O; ver regra do fluxo | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].before | array | O; ver regra do fluxo | T |  |
| history[].before[] | object | O; ver regra do fluxo | T |  |
| history[].before[].conflict | boolean | O; ver regra do fluxo | T |  |
| history[].before[].delivered | safe-integer | O; ver regra do fluxo | T |  |
| history[].before[].deliveredHistorical | safe-integer | O; ver regra do fluxo | T |  |
| history[].before[].dispatched | safe-integer | O; ver regra do fluxo | T |  |
| history[].before[].name | string | O; ver regra do fluxo | T |  |
| history[].before[].picked | safe-integer | O; ver regra do fluxo | T |  |
| history[].before[].pickedQuantity | safe-integer | O; ver regra do fluxo | T |  |
| history[].before[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| history[].before[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| history[].before[].reconciledDelivered | safe-integer | O; ver regra do fluxo | T |  |
| history[].before[].returnedLogistic | safe-integer | O; ver regra do fluxo | T |  |
| history[].before[].shipped | safe-integer | O; ver regra do fluxo | T |  |
| history[].before[].target | safe-integer | O; ver regra do fluxo | T |  |
| history[].before[].toPick | safe-integer | O; ver regra do fluxo | T |  |
| history[].before[].toShip | safe-integer | O; ver regra do fluxo | T |  |
| history[].before[].transit | safe-integer | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| instructions | string | O; ver regra do fluxo | T |  |
| items | array | V | T |  |
| items[] | object | O; ver regra do fluxo | T |  |
| items[].name | string | O; ver regra do fluxo | T |  |
| items[].pickedQuantity | safe-integer | V | T |  |
| items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| logisticReturns | array | O; ver regra do fluxo | T |  |
| logisticReturns[] | object | O; ver regra do fluxo | T |  |
| logisticReturns[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| logisticReturns[].declaredDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| logisticReturns[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| logisticReturns[].items | array | O; ver regra do fluxo | T |  |
| logisticReturns[].items[] | object | O; ver regra do fluxo | T |  |
| logisticReturns[].items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| logisticReturns[].items[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| logisticReturns[].reason | string | O; ver regra do fluxo | T |  |
| method | string | V | T |  |
| number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| pickingCompletedAt | null / string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| recipient | string | O; ver regra do fluxo | T |  |
| responsible | string | O; ver regra do fluxo | T |  |
| saleId | string | V | T | identificador textual; referência conforme regras |
| shipments | array | O; ver regra do fluxo | T |  |
| shipments[] | object | O; ver regra do fluxo | T |  |
| shipments[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| shipments[].declaredDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| shipments[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| shipments[].items | array | O; ver regra do fluxo | T |  |
| shipments[].items[] | object | O; ver regra do fluxo | T |  |
| shipments[].items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| shipments[].items[].quantity | safe-integer | O; ver regra do fluxo | T |  |
| shipments[].reference | string | O; ver regra do fluxo | T |  |
| shipments[].responsible | string | O; ver regra do fluxo | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |
| window | string | O; ver regra do fluxo | T |  |

## supplierQuotes

**Base real:** ausente. **Fontes:** [supplier-quotes.js](../../../supplier-quotes.js), [operations-storage.js](../../../operations-storage.js).

**Regras comprovadas:** version≥1; items não vazia≤500,produto único existente e quantity≥1. suppliers não vazia com id único,responses lista com supplierId único,purchaseIds lista. Resposta exige fornecedor na solicitação,version≥1,freight≥0,validade opcional real e cada item com quoted booleano; se cotado,custo/quantidade ofertada/prazo são inteiros≥0. Frete é referência separada, sem incorporação automática ao custo.

**Relações:** suppliers[].id → suppliers.id; items[].productId → products.id; responses[].supplierId → fornecedor convidado; purchaseIds[] → compras geradas com supplierQuoteId recíproco; selections[].responseId → resposta.

**Datas/histórico:** responses/history/selections/selectedAt/closedAt/cancelledAt; coleta e seleção manuais, sem API externa implementada.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| deadline | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| history | array | O; ver regra do fluxo | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| items | array | V | T |  |
| items[] | object | O; ver regra do fluxo | T |  |
| items[].code | string | O; ver regra do fluxo | T |  |
| items[].name | string | O; ver regra do fluxo | T |  |
| items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].quantity | safe-integer | V | T |  |
| note | string | O; ver regra do fluxo | T |  |
| number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| purchaseIds | array | V | T |  |
| purchaseIds[] | string | O; ver regra do fluxo | T |  |
| responses | array | V | T |  |
| responses[] | object | O; ver regra do fluxo | T |  |
| responses[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| responses[].freightCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| responses[].history | array | O; ver regra do fluxo | T |  |
| responses[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| responses[].items | array | O; ver regra do fluxo | T |  |
| responses[].items[] | object | O; ver regra do fluxo | T |  |
| responses[].items[].leadDays | null / safe-integer | O; ver regra do fluxo | T |  |
| responses[].items[].offeredQuantity | safe-integer | O; ver regra do fluxo | T |  |
| responses[].items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| responses[].items[].quoted | boolean | O; ver regra do fluxo | T |  |
| responses[].items[].unitCostCents | null / safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| responses[].reference | string | O; ver regra do fluxo | T |  |
| responses[].supplierId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| responses[].supplierName | string | O; ver regra do fluxo | T |  |
| responses[].validUntil | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| responses[].version | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| responsible | string | O; ver regra do fluxo | T |  |
| selectedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| selections | array | O; ver regra do fluxo | T |  |
| selections[] | object | O; ver regra do fluxo | T |  |
| selections[].expectedCostCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| selections[].expectedResponseVersion | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| selections[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| selections[].reason | string | O; ver regra do fluxo | T |  |
| selections[].responseId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| selections[].supplierId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| suppliers | array | V | T |  |
| suppliers[] | object | O; ver regra do fluxo | T |  |
| suppliers[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| suppliers[].name | string | O; ver regra do fluxo | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## expenseCenters

**Base real:** ausente. **Fontes:** [budgets.js](../../../budgets.js), [operations-storage.js](../../../operations-storage.js).

**Regras comprovadas:** version≥1,name texto não vazio,active booleano. ID é único pelo storage; nome distinto no comando, incluindo inativos. Number/date/history são emitidos por baseRecord.

**Relações:** Referenciado por expenses/payables/expenseBudgets/recorrências e snapshots de acordo.

**Datas/histórico:** history conserva alterações e desativação; não perde classificação de operações antigas.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| active | boolean | V | T |  |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history | array | O; ver regra do fluxo | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| name | string | V | T |  |
| number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| responsible | string | O; ver regra do fluxo | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## expenseBudgets

**Base real:** ausente. **Fontes:** [budgets.js](../../../budgets.js), [operations-storage.js](../../../operations-storage.js).

**Regras comprovadas:** version≥1,limitCents>0,month YYYY-MM válido. Chave composta month+centerId vazio/null+category não repete. centerId preenchido precisa existir. category é produzida textual, mas não tem verificação de typeof explícita neste validador.

**Relações:** centerId → expenseCenters.id ou null; sourceId → expenseBudgets.id ou null; gastos ligados por mês da paidDate,centro,categoria, não um FK global direto.

**Datas/histórico:** history/sourceId; limite gerencial com justificativa de excesso, não autorização nem reserva bancária.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| category | string | O; ver regra do fluxo | T |  |
| centerId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history | array | O; ver regra do fluxo | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| limitCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| month | string | V | T | mês civil YYYY-MM |
| number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| responsible | string | O; ver regra do fluxo | T |  |
| sourceId | null | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## families

**Base real:** ausente. **Fontes:** [catalogue-next.js](../../../catalogue-next.js), [round10-storage.js](../../../round10-storage.js).

**Regras comprovadas:** Regra comum V0.12 exige version/number≥1,history lista e date parseável; name/description/attributes/active são emitidos pelo handler. attributes até8 nomes distintos. No storage não há schema completo obrigatório de atributos.

**Relações:** products.familyId → families.id e familyAttributes.* tem chaves dos atributos; produto é SKU próprio, família não soma estoque/preço.

**Datas/histórico:** history de alterações/vínculos/substituição; código principal/IDs dos SKUs permanecem próprios.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| active | boolean | O; ver regra do fluxo | T |  |
| attributes | array | O; ver regra do fluxo | T |  |
| attributes[] | string | O; ver regra do fluxo | T |  |
| date | string | V | T | instante/data textual; ver distinção nas regras |
| description | string | O; ver regra do fluxo | T |  |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| name | string | O; ver regra do fluxo | T |  |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| responsible | string | O; ver regra do fluxo | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## positions

**Base real:** ausente. **Fontes:** [positions.js](../../../positions.js), [round10-storage.js](../../../round10-storage.js).

**Regras comprovadas:** Regra comum V0.12:version/number≥1,history lista,date parseável. Handler exige code/nome, código único mesmo em inativos, impede desativar com saldo. Validador não impõe uniformemente code/name/active nesta coleção.

**Relações:** products.positionBalances.* usa id; from/to em transferências e movimentos. String vazia significa Não distribuído, sem entidade real.

**Datas/histórico:** history conserva criação/edição/situação; movimentações em positionMovements.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| active | boolean | O; ver regra do fluxo | T |  |
| code | string | O; ver regra do fluxo | T |  |
| date | string | V | T | instante/data textual; ver distinção nas regras |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| name | string | O; ver regra do fluxo | T |  |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| responsible | string | O; ver regra do fluxo | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## transfers

**Base real:** ausente. **Fontes:** [positions.js](../../../positions.js), [round10-storage.js](../../../round10-storage.js).

**Regras comprovadas:** Regra comum V0.12; items não vazia≤500; quantidade≥1 e produto existente; from≠to. O storage não exige uniformemente tipos/existência de from/to; handler valida posição ativa/token/saldo e destino.

**Relações:** from/to → positions.id ou vazio; items[].productId → products.id; reversalOf/reversalId → transfers.id.

**Datas/histórico:** confirmedAt/cancelledAt/reversedAt; reversão cria compensação vinculada, preservando transferência inicial. Movimento entre posições não altera stock global.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| confirmedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| date | string | V | T | instante/data textual; ver distinção nas regras |
| from | string | O; ver regra do fluxo | T |  |
| fromName | string | O; ver regra do fluxo | T |  |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| items | array | V | T |  |
| items[] | object | O; ver regra do fluxo | T |  |
| items[].name | string | O; ver regra do fluxo | T |  |
| items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].quantity | safe-integer | V | T |  |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| reason | string | O; ver regra do fluxo | T |  |
| responsible | string | O; ver regra do fluxo | T |  |
| reversalId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| reversalOf | string | O; ver regra do fluxo | T |  |
| reversedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| to | string | O; ver regra do fluxo | T |  |
| toName | string | O; ver regra do fluxo | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## positionMovements

**Base real:** ausente. **Fontes:** [positions.js](../../../positions.js), [workflows.js](../../../workflows.js), [round10-storage.js](../../../round10-storage.js).

**Regras comprovadas:** quantity inteiro≥1,productId texto,date parseável. ID validado pelo storage geral; referências/posições/type são produzidas pelos reconciliadores, sem FK uniforme.

**Relações:** productId → products.id; from/to → positions.id,vazio ou null; stockMovementId → stockMovements.id quando reconciliado; referenceId polimórfico ou transfers.id.

**Datas/histórico:** fromName/toName/productName snapshots; reason/type; conservar junto aos movimentos globais.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| date | string | V | T | instante/data textual; ver distinção nas regras |
| from | null / string | O; ver regra do fluxo | T |  |
| fromName | null / string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| productId | string | V | T | identificador textual; referência conforme regras |
| productName | string | O; ver regra do fluxo | T |  |
| quantity | safe-integer | V | T |  |
| reason | string | O; ver regra do fluxo | T |  |
| referenceId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| stockMovementId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| to | null / string | O; ver regra do fluxo | T |  |
| toName | null / string | O; ver regra do fluxo | T |  |
| type | string | O; ver regra do fluxo | T |  |

## purchaseConferences

**Base real:** ausente. **Fontes:** [purchase-next.js](../../../purchase-next.js), [round10-storage.js](../../../round10-storage.js).

**Regras comprovadas:** Regra comum V0.12; declaredDate civil real,purchaseId existente; items não vazia≤500,campos quantitativos/custos inteiros≥0 e sellable+held+refused=presented. Handler exige compra aguardando/versão e motivos; ao confirmar, aceita até saldo pedido.

**Relações:** purchaseId → purchases.id; receiptId → recebimento da compra ou null; supplierId → suppliers.id; items[].productId → item pedido; destinationPositionId → posição ou vazio.

**Datas/histórico:** conferent declarado/reference/differentProduct/basePurchaseVersion; confirmedAt/cancelledAt/history. Recebimento/ocorrências são gerados uma vez a partir da conferência.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| basePurchaseVersion | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| conferent | string | O; ver regra do fluxo | T |  |
| confirmedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| date | string | V | T | instante/data textual; ver distinção nas regras |
| declaredDate | string | V | T | data civil YYYY-MM-DD quando preenchida |
| differentProduct | string | O; ver regra do fluxo | T |  |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| items | array | V | T |  |
| items[] | object | O; ver regra do fluxo | T |  |
| items[].costReason | string | O; ver regra do fluxo | T |  |
| items[].destinationPositionId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].destinationPositionName | string | O; ver regra do fluxo | T |  |
| items[].excess | safe-integer | V | T |  |
| items[].held | safe-integer | V | T |  |
| items[].missing | safe-integer | V | T |  |
| items[].name | string | O; ver regra do fluxo | T |  |
| items[].originalUnitCostCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].pendingAtReview | safe-integer | O; ver regra do fluxo | T |  |
| items[].presented | safe-integer | V | T |  |
| items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].reason | string | O; ver regra do fluxo | T |  |
| items[].refused | safe-integer | V | T |  |
| items[].sellable | safe-integer | V | T |  |
| items[].unitCostCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| purchaseId | string | V | T | identificador textual; referência conforme regras |
| purchaseNumber | safe-integer | O; ver regra do fluxo | T |  |
| receiptId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| reference | string | O; ver regra do fluxo | T |  |
| responsible | string | O; ver regra do fluxo | T |  |
| supplierId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| supplierName | string | O; ver regra do fluxo | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## purchaseAmendments

**Base real:** ausente. **Fontes:** [purchase-next.js](../../../purchase-next.js), [round10-storage.js](../../../round10-storage.js).

**Regras comprovadas:** Regra comum V0.12;items não vazia≤500;extraQuantity≥1,custo≥0,somaquantity×custo=totalCents. Handler só amplia SKU existente,preserva custo e confere compra/versão; existência purchaseId não é uma FK universal desse validador.

**Relações:** purchaseId → purchases.id; supplierId → suppliers.id; items[].productId → item da compra; compra guarda amendmentIds e originalOrder.

**Datas/histórico:** basePurchaseVersion/reason/confirmedAt/cancelledAt/history; originalOrder mantido na compra quando confirmado.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| basePurchaseVersion | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| confirmedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| date | string | V | T | instante/data textual; ver distinção nas regras |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| items | array | V | T |  |
| items[] | object | O; ver regra do fluxo | T |  |
| items[].extraQuantity | safe-integer | V | T |  |
| items[].name | string | O; ver regra do fluxo | T |  |
| items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].unitCostCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| purchaseId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| purchaseNumber | safe-integer | O; ver regra do fluxo | T |  |
| reason | string | O; ver regra do fluxo | T |  |
| responsible | string | O; ver regra do fluxo | T |  |
| supplierId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| supplierName | string | O; ver regra do fluxo | T |  |
| totalCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## purchaseOccurrences

**Base real:** ausente. **Fontes:** [purchase-next.js](../../../purchase-next.js), [round10-storage.js](../../../round10-storage.js).

**Regras comprovadas:** Regra comum V0.12 apenas neste validador; handler emite type missing/excess/retention/refusal/different/other,origem,motivo e eventualmente quantidade/produto. Campo por-item não aparece nas ocorrências de produto diferente.

**Relações:** purchaseId/receiptId/conferenceId → origem de compra; supplierId → suppliers; productId opcional; taskId → tasks.id.

**Datas/histórico:** response/result/resolvedAt/resolutions guarda resoluções anteriores ao reabrir; dueDate civil opcional/history. Sem correção automática do estoque por declarar ocorrência.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| active | boolean | O; ver regra do fluxo | T |  |
| conferenceId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| date | string | V | T | instante/data textual; ver distinção nas regras |
| description | string | O; ver regra do fluxo | T |  |
| dueDate | null / string | C | S | data civil YYYY-MM-DD quando preenchida |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| productName | string | O; ver regra do fluxo | T |  |
| purchaseId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| purchaseNumber | safe-integer | O; ver regra do fluxo | T |  |
| quantity | safe-integer | O; ver regra do fluxo | T |  |
| receiptId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| resolutions | array | C | S |  |
| resolutions[] | object | C | S |  |
| resolutions[].date | string | C | S | instante/data textual; ver distinção nas regras |
| resolutions[].response | string | C | S |  |
| resolutions[].result | string | C | S |  |
| resolvedAt | string | C | S | instante/data textual; ver distinção nas regras |
| response | string | C | S |  |
| responsible | string | O; ver regra do fluxo | T |  |
| result | string | C | S |  |
| supplierId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| supplierName | string | O; ver regra do fluxo | T |  |
| taskId | string | C | S | identificador textual; referência conforme regras |
| type | string | O; ver regra do fluxo | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## agreements

**Base real:** ausente. **Fontes:** [agreements.js](../../../agreements.js), [round10-storage.js](../../../round10-storage.js).

**Regras comprovadas:** Regra comum V0.12;side receive/pay;origins1a60 com valor>0 e origem existente;installments1a60 valores>0/data civil opcional;somasorigens e parcelas=total. Payments lista até10000;valor>0/parcela existente;allocations1a500,origem existente/valor>0 e soma=pagamento;acumulado≤total. IDs de parcelas/contraparte e unicidade adicional são conferidos por handler, não FK SQL.

**Relações:** counterpartyId → customers.id ou suppliers.id conforme side; origins[].id → sales/payables; originalInstallments[] snapshot das parcelas originais; payments[].allocations[].installmentId refere parcela da origem e payments[].installmentId parcela do acordo; expenseId → expenses em acordo a pagar.

**Datas/histórico:** origins snapshot principal/pago/interno/devolvido/perdoado; pagamentos mantêm recibos/despesas e alocação nas origens; adjustments indica redução comercial posterior. activeAgreementId e agreementHistory nas origens evitam duplicar posição.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| adjustments | array | O; ver regra do fluxo | T |  |
| adjustments[] | object | O; ver regra do fluxo | T |  |
| adjustments[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| adjustments[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| adjustments[].originId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| adjustments[].reason | string | O; ver regra do fluxo | T |  |
| adjustments[].returnId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| cancelledAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| counterpartyId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| counterpartyName | string | O; ver regra do fluxo | T |  |
| date | string | V | T | instante/data textual; ver distinção nas regras |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| installments | array | V | T |  |
| installments[] | object | O; ver regra do fluxo | T |  |
| installments[].amountCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| installments[].dueDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| installments[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| installments[].number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| origins | array | V | T |  |
| origins[] | object | O; ver regra do fluxo | T |  |
| origins[].amountCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| origins[].category | string | O; ver regra do fluxo | T |  |
| origins[].expenseCenterId | null | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| origins[].forgivenCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| origins[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| origins[].internalCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| origins[].name | string | O; ver regra do fluxo | T |  |
| origins[].originalInstallments | array | O; ver regra do fluxo | T |  |
| origins[].originalInstallments[] | object | O; ver regra do fluxo | T |  |
| origins[].originalInstallments[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| origins[].originalInstallments[].creditCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| origins[].originalInstallments[].customerId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| origins[].originalInstallments[].customerName | string | O; ver regra do fluxo | T |  |
| origins[].originalInstallments[].dueDate | null / string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| origins[].originalInstallments[].forgivenCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| origins[].originalInstallments[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| origins[].originalInstallments[].legacy | boolean | O; ver regra do fluxo | T |  |
| origins[].originalInstallments[].number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| origins[].originalInstallments[].receivedCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| origins[].originalInstallments[].remainingCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| origins[].originalInstallments[].saleId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| origins[].paidCentsAtAgreement | safe-integer | O; ver regra do fluxo | T |  |
| origins[].returnedCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| origins[].totalCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| payments | array | V | T |  |
| payments[] | object | O; ver regra do fluxo | T |  |
| payments[].allocations | array | V | T |  |
| payments[].allocations[] | object | O; ver regra do fluxo | T |  |
| payments[].allocations[].amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| payments[].allocations[].category | string | O; ver regra do fluxo | T |  |
| payments[].allocations[].expenseCenterId | null | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| payments[].allocations[].installmentId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| payments[].allocations[].originId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| payments[].amountCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| payments[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| payments[].expenseId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| payments[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| payments[].installmentId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| payments[].paidDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| payments[].paymentMethod | string | O; ver regra do fluxo | T |  |
| payments[].responsible | string | O; ver regra do fluxo | T |  |
| reason | string | O; ver regra do fluxo | T |  |
| responsible | string | O; ver regra do fluxo | T |  |
| side | string | V | T |  |
| totalCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## recurringModels

**Base real:** ausente. **Fontes:** [recurring.js](../../../recurring.js), [round10-storage.js](../../../round10-storage.js), [public/recurring-core.js](../../../public/recurring-core.js).

**Regras comprovadas:** Regra comum V0.12;revisions não vazia≤1000;valor>0;startsOn/effectiveOn civis reais;endsOn opcional real;frequency weekly/monthly. Handler exige política shortMonth=last para mensal e verifica centro/fornecedor. Campos do modelo atual são snapshot inicial: revisão aplicável vem de revisions por effectiveOn.

**Relações:** revisions[].expenseCenterId → expenseCenters.id ou null;supplierId → suppliers.id ou null. Ocorrências referem modelId e revision.

**Datas/histórico:** revisions/history preservam mudanças futuras; geração é manual, não scheduler. Modelo não é pagamento efetivo.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| active | boolean | O; ver regra do fluxo | T |  |
| amountCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| category | string | O; ver regra do fluxo | T |  |
| date | string | V | T | instante/data textual; ver distinção nas regras |
| description | string | O; ver regra do fluxo | T |  |
| endsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| expenseCenterId | null | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| frequency | string | O; ver regra do fluxo | T |  |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| responsible | string | O; ver regra do fluxo | T |  |
| revision | safe-integer | O; ver regra do fluxo | T |  |
| revisions | array | V | T |  |
| revisions[] | object | O; ver regra do fluxo | T |  |
| revisions[].amountCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| revisions[].category | string | O; ver regra do fluxo | T |  |
| revisions[].description | string | O; ver regra do fluxo | T |  |
| revisions[].effectiveOn | string | V | T | data civil YYYY-MM-DD quando preenchida |
| revisions[].endsOn | null | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| revisions[].expenseCenterId | null | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| revisions[].frequency | string | V | T |  |
| revisions[].responsible | string | O; ver regra do fluxo | T |  |
| revisions[].revision | safe-integer | O; ver regra do fluxo | T |  |
| revisions[].shortMonth | string | O; ver regra do fluxo | T |  |
| revisions[].startsOn | string | V | T | data civil YYYY-MM-DD quando preenchida |
| revisions[].supplierId | null | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| shortMonth | string | O; ver regra do fluxo | T |  |
| startsOn | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| supplierId | null | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## recurringOccurrences

**Base real:** ausente. **Fontes:** [recurring.js](../../../recurring.js), [round10-storage.js](../../../round10-storage.js).

**Regras comprovadas:** Regra comum V0.12;modelId existente;originalDate/plannedDate civis reais;valor>0;unique(modelId,originalDate). expenseId preenchido deve existir. Handler distingue realizado/cancelado/vínculo com conta e evita duplicar saída.

**Relações:** modelId → recurringModels.id; expenseId → expenses.id; relatedPayableId → payables.id opcional; expenseCenterId/supplierId são snapshots do modelo.

**Datas/histórico:** originalDate preserva identidade da previsão,plannedDate pode mudar;actualDate/actualCents/differenceReason/realizedAt e history; despesa pode apontar recurringOccurrenceId.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| actualCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| actualDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| amountCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| category | string | O; ver regra do fluxo | T |  |
| date | string | V | T | instante/data textual; ver distinção nas regras |
| description | string | O; ver regra do fluxo | T |  |
| differenceReason | string | O; ver regra do fluxo | T |  |
| expenseCenterId | null | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| expenseId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].previous | object | O; ver regra do fluxo | T |  |
| history[].previous.* | safe-integer / string | O; ver regra do fluxo | T | chave dinâmica anonimizada; estrutura depende do contexto |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| modelId | string | V | T | identificador textual; referência conforme regras |
| modelName | string | O; ver regra do fluxo | T |  |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| originalDate | string | V | T | data civil YYYY-MM-DD quando preenchida |
| plannedDate | string | V | T | data civil YYYY-MM-DD quando preenchida |
| realizedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| responsible | string | O; ver regra do fluxo | T |  |
| revision | safe-integer | O; ver regra do fluxo | T |  |
| supplierId | null | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## procedures

**Base real:** ausente. **Fontes:** [procedures.js](../../../procedures.js), [round10-storage.js](../../../round10-storage.js).

**Regras comprovadas:** Regra comum V0.12;steps1a30,IDs únicos no conjunto,name texto,required/requireReference booleanos. Handler cria id se omitido,número,orientação/responsável/página aceita. Persistência não garante tipo textual do id apenas via Set, nem lista universal de páginas.

**Relações:** steps.page é destino interno, não entidade/FK. procedureExecutions copia uma revisão por procedureId.

**Datas/histórico:** revision/revisions guarda versões anteriores do nome/finalidade/etapas; history e active; alterações no modelo não reescrevem execução iniciada.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| active | boolean | O; ver regra do fluxo | T |  |
| date | string | V | T | instante/data textual; ver distinção nas regras |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| name | string | O; ver regra do fluxo | T |  |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| purpose | string | O; ver regra do fluxo | T |  |
| responsible | string | O; ver regra do fluxo | T |  |
| revision | safe-integer | O; ver regra do fluxo | T |  |
| revisions | array | O; ver regra do fluxo | T |  |
| revisions[] | object | O; ver regra do fluxo | T |  |
| revisions[].name | string | C | S, T |  |
| revisions[].purpose | string | C | S, T |  |
| revisions[].revision | safe-integer | C | S, T |  |
| revisions[].steps | array | C | S, T |  |
| revisions[].steps[] | object | O; ver regra do fluxo | T |  |
| revisions[].steps[].guidance | string | O; ver regra do fluxo | T |  |
| revisions[].steps[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| revisions[].steps[].name | string | O; ver regra do fluxo | T |  |
| revisions[].steps[].number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| revisions[].steps[].page | null / string | O; ver regra do fluxo | T |  |
| revisions[].steps[].required | boolean | O; ver regra do fluxo | T |  |
| revisions[].steps[].requireReference | boolean | O; ver regra do fluxo | T |  |
| revisions[].steps[].suggestedOwner | string | O; ver regra do fluxo | T |  |
| steps | array | V | T |  |
| steps[] | object | O; ver regra do fluxo | T |  |
| steps[].guidance | string | O; ver regra do fluxo | T |  |
| steps[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| steps[].name | string | V | T |  |
| steps[].number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| steps[].page | null / string | O; ver regra do fluxo | T |  |
| steps[].required | boolean | V | T |  |
| steps[].requireReference | boolean | V | T |  |
| steps[].suggestedOwner | string | O; ver regra do fluxo | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## procedureExecutions

**Base real:** ausente. **Fontes:** [procedures.js](../../../procedures.js), [round10-storage.js](../../../round10-storage.js).

**Regras comprovadas:** Regra comum V0.12;steps1a30 IDs únicos/name texto/booleans,status pending/completed/blocked/skipped,references/history listas; etapa obrigatória não pode skipped. Handler exige revisão existente e referências antes de concluir etapa que as pede.

**Relações:** procedureId → procedures.id; procedureRevision snapshot; link.kind/id opcional a purchases/inventories/deliveries/cashSessions; steps[].references[].kind/id para documento interno; taskId → tasks.id.

**Datas/histórico:** Snapshot completo das etapas/guidance/owner/status/motivos/referências/datas e history por etapa/execução. Não constitui permissionamento, assinatura ou autorização autenticada.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| cancelledAt | string | C | S | instante/data textual; ver distinção nas regras |
| completedAt | string | C | S, T | instante/data textual; ver distinção nas regras |
| date | string | V | T | instante/data textual; ver distinção nas regras |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| history[].stepId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| id | string | V | T | identificador textual; referência conforme regras |
| link | null | O; ver regra do fluxo | T |  |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| procedureId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| procedureName | string | O; ver regra do fluxo | T |  |
| procedureRevision | safe-integer | O; ver regra do fluxo | T |  |
| purpose | string | O; ver regra do fluxo | T |  |
| responsible | string | O; ver regra do fluxo | T |  |
| steps | array | V | T |  |
| steps[] | object | O; ver regra do fluxo | T |  |
| steps[].blockReason | string | O; ver regra do fluxo | T |  |
| steps[].completedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| steps[].guidance | string | O; ver regra do fluxo | T |  |
| steps[].history | array | V | T |  |
| steps[].history[] | object | O; ver regra do fluxo | T |  |
| steps[].history[].action | string | O; ver regra do fluxo | T |  |
| steps[].history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| steps[].history[].note | string | O; ver regra do fluxo | T |  |
| steps[].history[].previous | string | O; ver regra do fluxo | T |  |
| steps[].history[].reason | string | O; ver regra do fluxo | T |  |
| steps[].history[].reference | null / object | C | S, T |  |
| steps[].history[].reference.date | string | C | S, T | instante/data textual; ver distinção nas regras |
| steps[].history[].reference.id | string | C | S, T | identificador textual; referência conforme regras |
| steps[].history[].reference.kind | string | C | S, T |  |
| steps[].history[].responsible | string | O; ver regra do fluxo | T |  |
| steps[].history[].status | string | O; ver regra do fluxo | T |  |
| steps[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| steps[].name | string | V | T |  |
| steps[].note | string | O; ver regra do fluxo | T |  |
| steps[].number | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| steps[].owner | string | O; ver regra do fluxo | T |  |
| steps[].page | null / string | O; ver regra do fluxo | T |  |
| steps[].references | array | V | T |  |
| steps[].references[] | object | O; ver regra do fluxo | T |  |
| steps[].references[].date | string | C | S, T | instante/data textual; ver distinção nas regras |
| steps[].references[].id | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| steps[].references[].kind | string | O; ver regra do fluxo | T |  |
| steps[].required | boolean | V | T |  |
| steps[].requireReference | boolean | V | T |  |
| steps[].skipReason | string | C | S, T |  |
| steps[].status | string | V | T |  |
| steps[].suggestedOwner | string | O; ver regra do fluxo | T |  |
| steps[].taskId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| targetDate | string | O; ver regra do fluxo | T | data civil YYYY-MM-DD quando preenchida |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## priceReviews

**Base real:** ausente. **Fontes:** [price-reviews.js](../../../price-reviews.js), [round10-storage.js](../../../round10-storage.js), [public/price-review-core.js](../../../public/price-review-core.js).

**Regras comprovadas:** Regra comum V0.12;items não vazia≤500;target standard/list;preçobase/proposto/versionprodutoint≥0 e produto existente. Handler exige versões atualizadas/ mínimo/motivo de redução; roundingDifferenceCents pode ser assinado. Em lista, targetVersion pode ser inteiro/null; em padrão null.

**Relações:** items[].productId → products.id; listId → priceLists.id ou null; reversalOf → priceReviews.id. appliedSnapshots conserva preço anterior/aplicado e versões após aplicação.

**Datas/histórico:** history com mudanças/refresh/remove; appliedAt/applyReason/cancelledAt; reversão é nova proposta, não sobrescrita de histórico. wasAbsent/restoreAbsence registra preço inexistente na lista.

| Caminho no registro | Tipo observado/produzido | Exigência | Evidência | Significado/limite |
| --- | --- | --- | --- | --- |
| appliedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| appliedSnapshots | array | O; ver regra do fluxo | T |  |
| appliedSnapshots[] | object | O; ver regra do fluxo | T |  |
| appliedSnapshots[].appliedPriceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| appliedSnapshots[].name | string | O; ver regra do fluxo | T |  |
| appliedSnapshots[].previousPriceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| appliedSnapshots[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| appliedSnapshots[].productVersionAfter | safe-integer | O; ver regra do fluxo | T |  |
| appliedSnapshots[].targetVersionAfter | null | O; ver regra do fluxo | T |  |
| appliedSnapshots[].wasAbsent | boolean | O; ver regra do fluxo | T |  |
| applyReason | string | O; ver regra do fluxo | T |  |
| date | string | V | T | instante/data textual; ver distinção nas regras |
| history | array | V | T |  |
| history[] | object | O; ver regra do fluxo | T |  |
| history[].action | string | O; ver regra do fluxo | T |  |
| history[].changes | array | O; ver regra do fluxo | T |  |
| history[].changes[] | object | O; ver regra do fluxo | T |  |
| history[].changes[].after | safe-integer | O; ver regra do fluxo | T |  |
| history[].changes[].before | safe-integer | O; ver regra do fluxo | T |  |
| history[].changes[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| history[].date | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| history[].previous | array | O; ver regra do fluxo | T |  |
| history[].previous[] | object | O; ver regra do fluxo | T |  |
| history[].previous[].basePriceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| history[].previous[].minimumCents | null | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| history[].previous[].name | string | O; ver regra do fluxo | T |  |
| history[].previous[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| history[].previous[].productVersion | safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| history[].previous[].proposedPriceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| history[].previous[].rawProposedCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| history[].previous[].reductionReason | string | O; ver regra do fluxo | T |  |
| history[].previous[].roundingDifferenceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| history[].previous[].targetVersion | null | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| history[].previous[].wasAbsent | boolean | O; ver regra do fluxo | T |  |
| history[].reason | string | O; ver regra do fluxo | T |  |
| history[].responsible | string | O; ver regra do fluxo | T |  |
| id | string | V | T | identificador textual; referência conforme regras |
| items | array | V | T |  |
| items[] | object | O; ver regra do fluxo | T |  |
| items[].basePriceCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].minimumCents | null / safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].name | string | O; ver regra do fluxo | T |  |
| items[].productId | string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| items[].productVersion | safe-integer | V | T | inteiro/versão quando preenchido |
| items[].proposedPriceCents | safe-integer | V | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].rawProposedCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].reductionReason | string | O; ver regra do fluxo | T |  |
| items[].restoreAbsence | boolean | O; ver regra do fluxo | T |  |
| items[].roundingDifferenceCents | safe-integer | O; ver regra do fluxo | T | dinheiro em centavos; conferir nulidade/sinal na regra |
| items[].targetVersion | null / safe-integer | O; ver regra do fluxo | T | inteiro/versão quando preenchido |
| items[].wasAbsent | boolean | O; ver regra do fluxo | T |  |
| listId | null / string | O; ver regra do fluxo | T | identificador textual; referência conforme regras |
| listName | null / string | O; ver regra do fluxo | T |  |
| name | string | O; ver regra do fluxo | T |  |
| number | safe-integer | V | T | inteiro/versão quando preenchido |
| reason | string | O; ver regra do fluxo | T |  |
| responsible | string | O; ver regra do fluxo | T |  |
| reversalOf | string | O; ver regra do fluxo | T |  |
| target | string | V | T |  |
| updatedAt | string | O; ver regra do fluxo | T | instante/data textual; ver distinção nas regras |
| version | safe-integer | V | T | inteiro/versão quando preenchido |

## Estruturas aninhadas compartilhadas

- **Embalagem de item em sales/quotes/purchases:** packageId/name/factor/count/version; snapshot da equivalência. As mesmas estruturas podem existir dentro de originalOrder.items, itemRevisions.items/updatedItems e negotiation.items quando copiados; cópias históricas não dependem da embalagem ainda ativa. Soma factor×count não excede quantidade-base; ver catalogue-next.js e round10-storage.js.
- **Substituição em item:** substitutedFrom={id,name,code}; aponta SKU anterior, snapshot de apresentação. Aplica-se também aos itens históricos copiados.
- **Histórico do baseRecord:** id,number,version,date,updatedAt,responsible,history[], além dos campos específicos. history cria date/action/responsible e touch adiciona reason/detalhes do domínio. A função baseRecord produzir estes campos não significa que todo validador os exige para todos os tipos.
- **Snapshot before/after/previous:** pode ser campo único ou registro/itens completos; nomes dinâmicos foram anonimizados na evidência. A estrutura do registro copiado é a da coleção de origem, incluindo arrays aninhados. Não inventar nova identidade nem normalizar apagando campos históricos.
- **Datas:** YYYY-MM-DD é dia civil, ISO com Z é instante UTC emitido em grande parte dos registros. Alguns fatos efetivos geram date com T12:00:00-03:00 além de paidDate/declaredDate/recordedAt. round10-storage valida date parseável, sem obrigar ISO uniforme. Campo date em histórico de resolução pode copiar instante anterior; previousDate é civil. Não transformar dias civis em UTC sem regra.
- **Totais de caixa:** closing.totals é mapa por método de pagamento (cash,pix,debit,credit,other), valores em centavos. differenceCents/roundingDifferenceCents e quantity de movimento global/ajuste podem ser negativos; não aplicar constraint≥0 mecanicamente.
- **Identidade histórica:** openedBy/closedBy/responsible/conferent/owner/conferents[].name são declarações de texto. Não há users/sessions/roles/permissions/tenant/unit reais na base V0.12; não converter automaticamente esses nomes em usuários autenticados.

## Lacunas e cuidados para passo3/migração

1. O contrato de storage é parcial: várias referências e enums só são validados no comando. Um JSON aceito não prova integridade equivalente a FKs/constraints SQL. Documentar validações de importação por relacionamento e manter rejeições explícitas.
2. Linhas antigas podem não ter version,date,active,customerId,receipts ou novos metadados. Ausência não autoriza inventar histórico. Datas e saldos desconhecidos devem ser marcados/compatibilizados explicitamente.
3. Estados comerciais costumam ser derivados de convertedAt,confirmedAt,receipts,closedAt,cancelledAt e saldos. Não substituir por enum único descartando fatos.
4. Assinaturas de idempotência têm formatos diferentes (SHA-256 ou JSON). Preservar o formato no adaptador; o conteúdo pode conter texto pessoal. Nenhum conteúdo destas assinaturas foi incluído aqui.
5. Não confundir despesas efetivas, parcelas planejadas, crédito interno, restituições, estoque retido e estoque disponível. Somar snapshots/origens/acordos como se fossem operações novas duplica valores.
6. company não é tenant; positions não são unidades empresariais; famílias não são SKUs; responsáveis declarados não são credenciais. Novas entidades SaaS serão modeladas separadamente sem reescrever automaticamente este histórico.
7. A obrigatoriedade de campos adicionais e regras de domínio ainda não verificadas no código está **A DEFINIR**. O esquema não foi convertido em migration nesta etapa.

## Evidência reproduzível

[Inventário sem valores](../../../.qa/foundation-v1/legacy-schema.json) · [Captura de tipos nos testes](../../../.qa/foundation-v1/legacy-schema-fixtures.json) · [Resultado dos205 testes](../../../.qa/foundation-v1/schema-tests.txt) · [Inspecionador](../../../scripts/inspect-legacy-schema.js)

Executar node scripts/inspect-legacy-schema.js atualiza apenas a evidência, lendo o JSON real e a captura sintética já existente. Para renovar a captura, carregar o script com --require durante node --test --test-isolation=none, com LEGACY_SCHEMA_CAPTURE=1 e LEGACY_SCHEMA_CAPTURE_FILE apontando para .qa/foundation-v1/legacy-schema-fixtures.json; guardar saída em schema-tests.txt e depois executar o inspecionador. O script usa apenas bibliotecas nativas e não depende de npm/banco externo. A captura lê tipos de retornos de handlers, não guarda conteúdos das operações.

**Limite da evidência:**205 testes e amostras reais não enumeram automaticamente todo caso condicional possível. A leitura estática acrescentou caminhos como aliases,substitutes,hiddenOperations e resoluções/referências ausentes nas amostras. Propriedades adicionais sem construtor nem amostra permanecem não especificadas. Este catálogo descreve o legado e não confirma a Fundação V1 futura implementada.
