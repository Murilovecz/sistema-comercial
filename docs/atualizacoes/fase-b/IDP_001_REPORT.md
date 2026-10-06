# Fase B — IDP-001 — replay da venda legada

05/10/2026. **Implementado e verificado localmente; aguardando revisão do proprietário. Sem commit/push.** Nenhuma fase seguinte iniciada.

Baseline: branch `v1.3-frontend`, HEAD `b5137c149f0fab2e375e47a5b97fd3bdc6d6dc8a`, árvore limpa antes dos testes/alterações. Mestre v1.0, AGENTS, auditoria e roadmap lidos antes de editar. A solicitação posterior autorizou somente esta correção; não reinterpretou o checkpoint documental como autorização geral.

Papéis aplicados nesta revisão: Backend — contrato/consumidores e alteração mínima; Banco — atomicidade/locks/persistência existente; Segurança — contexto/executor e colisões; QA — Red, rollback/concorrência e regressão isolada; Frontend — identidade e payload no retry. São responsabilidades de revisão, sem processos antigos ou agentes permanentes reativados.

## 1. Causa raiz e caminho exato

`POST /api/sales` → autorização legada → transação `SqlStore.transaction` → `dispatchLegacy` → `sale` → `saveBusinessState` → SQL/espelho/índice/auditoria → resposta após commit.

`input.requestId` entrava no body JSON. `cash.validateKey` permitia undefined/null; `sale` pesquisava `state.sales` apenas quando a chave existia e gravava null na ausência. Portanto, repetir a mesma venda sem identidade criava outra venda e baixa. Não era falha de transação: faltava o contrato de identidade na entrada externa.

O fingerprint anterior era SHA-256 de `JSON.stringify` de campos selecionados: dependia da ordem de propriedades internas, omitindo guardas como `expectedCashSessionId` e `expectedPositions`, e não vinculava executor. Registro antigo sem fingerprint podia ser reconhecido sem prova de conteúdo.

## 2. Inventário de consumidores e infraestrutura relacionada

| Caminho / consumidor | Identidade e comportamento anterior | Tratamento nesta correção |
| --- | --- | --- |
| `POST /api/sales` — `public/store.js` | `saleRequestId` gerado na revisão, salvo no rascunho, preservado em erro e descartado após sucesso/edição; vínculo de Caixa recalculado no callback | Payload completo capturado na revisão, incluindo chave e Caixa; cada retry da revisão reutiliza o mesmo payload |
| Mesmo endpoint — `public/pricing-ui.js` | Chave do rascunho; payload já capturado na revisão | Preservado |
| Mesmo endpoint — `public/store-credit-ui.js` | Chave do rascunho e payload com crédito/guarda capturado | Preservado |
| Mesmo endpoint — `public/checkout-ui.js` | Chave do rascunho; recebimentos mistos/guarda de Caixa capturados | Preservado; teste de crédito + pagamentos mistos |
| `public/scan-next-ui.js` | Wrapper acrescenta embalagens/substituição/pos declarada; não cria requestId | Preservado; conteúdo compõe fingerprint, não autoridade de dispositivo |
| `POST /api/commercial/sales` — `public/foundation-experience.js` | Draft obrigatório, revisão preparada e proteção de operação ambígua já existentes | Sem alteração; testes de venda/inativo mantidos |
| `POST /api/quotes/convert` — `quotes.js`, `public/quotes-ui.js` | UI envia chave estável da confirmação; `quoteAction` guarda em quoteCommands quando presente, verifica versão/estado e vínculo saleId; não repassa requestId ao helper `sale` | Preservado: orçamento já convertido não cria segunda venda; nenhuma exigência nova no helper compartilhado |
| `POST /api/workflows/reservations/convert` — `workflows.js`, UIs de workflows/reservas/preços | `commands.command` exige requestId e signature; guarda versão/status/vínculo; não repassa chave ao helper `sale` | Preservado; replay protegido pelo comando da reserva |
| Testes puros de vendas/caixa/estoque/compras/preços/devoluções/crédito/checkout | Muitos chamam `sale` sem chave como fixture interna; outros verificam replay com chave | Preservados; nenhum teste enfraquecido ou desabilitado |
| Testes HTTP/transações/SQL | Criações positivas já enviam chave; testes negativos exercitam autorização/escopo | Preservados; novos testes no contrato HTTP |
| `scripts/benchmark-foundation.js` | Chave explícita em venda interna sintética dentro de `executeStateCommand` | Sem alteração/execução de benchmark |
| `scripts/benchmark-*` comerciais | Usam draft/chave da API comercial | Sem alteração/execução |
| React / integrações | React atual é acesso/contexto/Design System, sem criação comercial; nenhum conector externo real encontrado | Sem adaptação ou implementação |

Inventário de outros mutáveis na mesma base: reposição `/api/stock`, recebimento `/api/sales/receive`, Caixa e Compras usam validação/replay com chave opcional em partes do legado; cancelamento tem guarda factual; `commands.command` exige chave para inventário/devoluções/reservas/contas e vários complementos. `saveBusinessState`/SQL/auditoria são compartilhados. Este inventário não certifica replay de todas essas operações e não ampliou o escopo de IDP-001.

## 3. Contrato antes/depois

| Situação | Antes | Depois em `POST /api/sales` |
| --- | --- | --- |
| Sem chave / null | Criava venda/baixa | 422 `INVALID_SALE_DRAFT`, zero efeitos comerciais |
| Chave inválida | Parte já recusada por validação genérica | String não vazia até 80 caracteres, validação compartilhada explícita |
| Primeira chave válida | Venda e efeitos transacionais | Mantidos, com fingerprint contextualizado persistido |
| Mesma chave/operação/executor/contexto | Replay baseado no fingerprint parcial | 201, reconhece venda original no snapshot atual, sem escrita/revisão/auditoria comercial adicional |
| Ordem de propriedades JSON diferente | Podia gerar falso conflito | Canonicalização existente elimina diferença de ordem de propriedades |
| Conteúdo/guardas/executor diferentes | Parcial; alguns campos não eram comparados | 409 `REPLAY_CHANGED`, zero efeitos |
| Histórico sem prova completa | Podia reconhecer sem comprovação | 409 sem reescrita nem fabricação de prova; consultar resultado registrado |

Reutiliza whitelist e limite do draft comercial: 1–500 itens, 100.000 bytes, campos conhecidos. Valores/tipos/presença e ordem das listas permanecem significativos; não se tenta equiparar arbitrariamente entradas diferentes. `responsible`/`approvalToken` não definem conteúdo pela infraestrutura compartilhada; token nunca libera produto inativo pela rota legada. Guards de Caixa/crédito/posições e metadados comerciais de itens permanecem vinculados à intenção.

## 4. Implementação mínima e alternativas

Escolhida: endurecer a **fronteira externa legada**, reutilizar `inactive-sale-approval.draftFingerprint` e `state-repository.canonical`, contextualizar com empresa/unidade/usuário autenticados e persistir no campo **já existente** `requestFingerprint` com marcador `legacy-sale-v1:`. Nenhum mecanismo durável paralelo, tabela, índice, migration, dependência ou normalização nova.

Replay é pesquisado no estado da unidade lido sob transação. Fingerprint completo igual reconhece a venda e retorna; diferente/ausente é recusado. Sessão, nome do usuário, timestamps e IDs gerados pelo servidor não compõem o fingerprint contextual: novo login do mesmo usuário pode reconhecer a operação, se continuar autorizado. Outras unidades possuem namespace independente; o mesmo executor/chave não recupera venda estrangeira.

Alternativas avaliadas: exigir chave em todo helper `sale` quebraria fixtures e conversões com proteção própria; migrar/descontinuar a rota exigiria consumidores adicionais; tabela de idempotência/schema novo duplicaria persistência sem necessidade. A fronteira existente permite fechar o defeito com duas pequenas alterações executáveis. A função pura interna continua compatível; sua exportação não é endpoint desprotegido.

## 5. Atomicidade, resultado e concorrência

`BEGIN IMMEDIATE` antecede leitura, busca da chave e execução. O fingerprint é incorporado à venda antes de `saveBusinessState`; sincronização dos seis agregados, itens/recibos/movimentos, Caixa/crédito, revisão/snapshot/índice e auditoria permanecem na mesma transação. Nenhuma chave separada é gravada antes/depois do conjunto de efeitos. SQL/auditoria que falham fazem rollback integral; retry com a mesma chave pode executar depois da recuperação.

Resposta HTTP permanece bufferizada e enviada depois do commit. No replay, o retorno contém a venda registrada no **snapshot atual** da unidade; não é cache byte a byte da primeira resposta global. Mudanças legítimas posteriores não são desfeitas pelo retry, nem recalculadas por ele.

O lock de escrita SQLite serializa a leitura/busca/escrita entre conexões; não há SELECT externo seguido de INSERT fora da proteção. Testes enviaram quatro requisições simultâneas com a mesma chave e duas requisições por duas instâncias/conexões do mesmo arquivo isolado; ambos produziram um efeito. Reinício de outra instância reconheceu o resultado durável. Não houve stress de processos independentes ou promessa de capacidade SaaS. Busy/timeout deve continuar como resultado desconhecido, resolvido com a mesma chave, nunca com chave nova automática.

## 6. Red → Green → Refactor

Antes de modificar código executável, foram criados 13 testes novos. Após corrigir somente problemas de fixture, a execução Red teve **7 passes / 6 falhas**: ausência produzia 201/venda/baixa; ordem dos campos produzia 400; outro executor obtinha 201; histórico sem prova obtinha falso reconhecimento; retry UI mudava Caixa. O caso de colisão foi também executado isoladamente com alteração só de Caixa e obteve **201 indevido**, provando omissão de conteúdo além da diferença do código de erro.

As duas falhas iniciais de preparação de teste (origem de crédito inválida e document inexistente no sandbox) foram resolvidas antes da correção executável; não são evidência do defeito do produto. Fixture de crédito passou a usar venda/devolução/emissão reais do domínio, e o sandbox usa os drafts/funções reais. Nenhum teste de produto foi removido ou relaxado.

Green: os **13/13** passaram. Refactor: revisão das fronteiras/diff, sem refatoração estrutural desnecessária. Mantidos nomes/fluxos/persistência e guardas comerciais existentes.

| Cobertura nova | Evidência |
| --- | --- |
| A — ausência/invalidade | Estado/revisão/SQL/índice/auditoria comercial permanecem iguais |
| B/C — criar/repetir | Uma venda, uma baixa/movimento, um recebimento/Caixa; nova chave cria nova venda legítima |
| C — determinismo/contexto estável | Propriedades reordenadas e novo login/nome do mesmo usuário reconhecem a venda |
| D — colisão | Itens, cliente, pagamento, desconto, Caixa e posições alterados recusados sem efeitos |
| E — isolamento | Outro usuário recusado; mesma chave em outra unidade/empresa não reconhece resultado estrangeiro; corpo forjado recusado |
| F — rollback | Falha após SQL durante auditoria e falha de domínio não deixam efeitos/chave/falso sucesso; retry funciona |
| G — simultaneidade/durabilidade | Quatro pedidos simultâneos; duas conexões SQLite; reinício; efeito único |
| Financeiro auxiliar | Crédito, troco e duas formas de recebimento não duplicam consumo ou Caixa |
| Histórico | Ausência de requestId/fingerprint conservada; chave antiga sem prova não ganha validação retroativa |
| Consumidor | Timeout e reconexão não mudam chave/payload/Caixa da revisão básica |

## 7. Resultados e ambiente

- Específicos novos: **13/13**, incluindo o teste VM de lógica da UI, sem navegador/hardware homologados.
- Regressão pertinente: **290/290** em 26 arquivos Node, cobrindo vendas/conversões/estoque/compras/financeiro/Caixa/crédito/preços/auditoria/transações/autorização/contexto/SQL e aprovação de inativo. Fixtures em memória ou diretórios sintéticos isolados; nenhuma base da loja.
- Regressão ampla: **623/623** em 64 arquivos Node, em cópia temporária do projeto sem `data/`, `.qa/` original, `.git` ou node_modules. O total inclui os 13 novos, não é somado aos 290 repetidos. Zero falhas/skips/cancelamentos.
- Os três testes de SPA/Vite dependentes de build/dev e os specs React não participaram; não houve alteração React/build/dependências nem infraestrutura Vite relevante nesta correção.
- Migrations 001–010 e regras de preço/estoque negativo preservadas. Nenhum runtime operacional, benchmark ou homologação destrutiva da loja executado.

Os resultados comprovam o escopo local de IDP-001, não uma homologação de cloud, dispositivos ou offline. Requests autenticados podem atualizar metadados normais de sessão; “zero efeitos” aqui cobre o conjunto comercial e sua auditoria de negócio, sem falsa confirmação.

## 8. Histórico, riscos residuais e defeitos adjacentes

Vendas antigas sem chave permanecem legíveis, sem novos IDs/autores/fingerprints. Reutilizar uma chave antiga sem prova contextual suficiente é recusado: consultar a venda antes de decidir uma nova intenção. Não existe fallback silencioso nem instrução para trocar chave automaticamente.

Outros comandos legados continuam com identidade opcional/assinatura dependente de JSON.stringify em partes da infraestrutura. `quoteAction` permite requestId ausente e seu retorno de orçamento já convertido reconhece vínculo sem conferir todos os dados da repetição; não cria segunda venda. No replay da API comercial nova não há confronto explícito com executor da venda já existente equivalente ao introduzido nesta fronteira legada. São limitações adjacentes encontradas, **não corrigidas nem homologadas como cobertura completa** nesta rodada.

Persistência híbrida, snapshots/locks e demais gaps da auditoria continuam. O lock substitui janela de corrida nesse contrato, mas não é promessa de performance ou garantia contra escrita direta por administrador do SQLite. Mudança de whitelist/fingerprint é interna e exige manter payload estável nos consumidores; assinatura versionada não deve ser trocada sem estratégia para operações pendentes.

## 9. Arquivos e estado de entrega

Executáveis: `server.js`, `public/store.js`. Novos testes: `foundation/legacy-sale-idempotency.test.js`, `foundation/legacy-sale-retry-ui.test.js`. Registro necessário: este relatório, `docs/atual/API.md`, `PROJECT_MASTER.md`, `ROADMAP.md` e `CHANGELOG_ARCHITECTURE.md`.

Mestre, auditoria anterior e históricos de versão preservados. Sem mudanças de migrations, dependências, novo modelo organizacional, entitlement, dispositivos, Agente, offline cloud, fiscal, React Produtos ou normalização financeira.

`git diff --stat` e `git status` finais são entregues no relatório de chat; nenhum arquivo foi preparado para commit. A conclusão técnica local aguarda revisão do proprietário. Não iniciar C ou outro trabalho automaticamente.
