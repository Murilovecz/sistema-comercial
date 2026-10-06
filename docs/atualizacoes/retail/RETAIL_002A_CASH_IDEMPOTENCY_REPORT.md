# RETAIL-002A — Intenção/replay do caixa: RED e gate de persistência

**Data:** 06/10/2026. **Status:** RED EXECUTADO; PARADO NO GATE DE NOVO CONTRATO PERSISTENTE. **Não implementado, não GREEN, não pronto para checkpoint.**

**Baseline:** `a609f060dd1a964b7bf97054f426d329b49d4466`, `docs: approve retail pilot contract`, pai `26def32abe183f5eba7c808a835a0e793de43ed2`. O checkpoint incluiu exclusivamente RETAIL_001_PILOT_CONTRACT.md, PROJECT_MASTER.md e ROADMAP.md; árvore limpa confirmada antes de iniciar 002A. Sem push.

## 1. Autorização, limite e conclusão

Fonte: pedido do proprietário **“CHECKPOINT RETAIL-001 + INÍCIO RETAIL-002A”**. Autoriza TDD e somente intenção/replay de POST cash/open, supply, withdraw, refund e close, preservando sua semântica financeira. Determina:

> “Se RETAIL-002A exigir migration 013 ou novo contrato persistente, PARE antes de criar a migration.”

**A parada aplica-se ao novo contrato persistente**, não a uma alegação de que SQLite seja incapaz de guardar a prova. `cashCommands`/`unit_states` comportam dados adicionais, mas o contrato hoje implementado não prova executor imutável/contexto e não impede que a mesma chave OPEN seja executada em outro scope. Atender esse requisito exige revisar o alcance da identidade e a prova durável; modificar JSON silenciosamente também seria mudar esse contrato.

Não concluo que migration 013 seja inevitável. A alternativa de reaproveitar o payload existe; a alternativa relacional está desenhada abaixo. **Nenhuma foi implementada.** A escolha/revisão precisa anteceder GREEN, mudança de consumidores ou criação de migration, conforme o gate explícito. Não usei o fato de o JSON aceitar qualquer objeto como autorização de definir prova nova sem revisão.

Resultados concretos: novo teste RED com **34 testes, 12 passam e 22 falham**, incluindo RED dos cinco comandos. Backend/UI existentes não foram alterados. Migrations 001–012 permanecem intactas; nenhuma 013 foi criada; base operacional não foi aberta. Não iniciados 002B–E, C3/D/BRAND-002 ou novos controles de desconto/negativo/fiscal/perfil/multi-caixa.

Papéis lidos/aplicados: Backend — comandos/fingerprints; Banco — suficiência/compatibilidade da prova; Segurança — ator/contexto/autoridade; QA — RED e efeitos/rollback; Frontend — consumidores e retry; Documentação — gate/alternativas/aceite. Papéis permanentes, sem processos de agentes antigos.

## 2. Estado anterior dos cinco comandos

Fonte: [cash.js](../../../cash.js), [dispatchLegacy/createServer](../../../server.js), [cash-core](../../../public/cash-core.js), [cash-ui](../../../public/cash-ui.js).

| Comando | Efeito preservado | Proteção atual / lacuna |
| --- | --- | --- |
| OPEN | Sessão com fundo inicial; um aberto por Unit | Chave opcional; guard de aberto. Com chave, replay já precede guard e reconhece histórico depois de fechar; sem chave não há intenção durável |
| SUPPLY | Entrada física em dinheiro | Com chave/signature, retry não soma de novo. Sem chave, outra entrada é admitida; conferência não integra signature |
| WITHDRAW | Saída física limitada ao saldo | Com chave, efeito único. Chave opcional; limite de saldo não prova mesma intenção; conferência omitida na signature |
| REFUND | Dinheiro recebido em venda cancelada, limitado ao restante restituível/saldo de caixa | Com chave, efeito único. Chave opcional; parcial pode repetir dentro do saldo. Não emite PIX/cartão/crédito externo |
| CLOSE | Conferência/fechamento; diferença exige motivo | Guard de fechado e replay com chave. Chave opcional; expectedCents não entra na signature |

Registro existente: `{requestId, signature, date}` em `cashCommands` de cada snapshot de Unit. Signature atual: JSON de route, cash/session alvo, valor em centavos, note, responsible e saleId. `responsible` HTTP é substituído pelo nome autenticado; **nome não é ID de executor**. Duas contas com mesmo nome produzem assinatura igual. Role/nome/CSRF/sessão de login também não são identidade comercial.

O handler revalida contexto/permissions no servidor e executa estado/audit em transação. Esses mecanismos permanecem íntegros, mas não adicionam ator imutável à proof nem estendem a busca da chave a outra Unit: o helper procura somente em `state.cashCommands`.

## 3. RED reais e provas já preservadas

Arquivo: [foundation/cash-idempotency.test.js](../../../foundation/cash-idempotency.test.js). Comando executado:

```text
node --test --test-isolation=none foundation/cash-idempotency.test.js
```

Primeira execução, somente casos HTTP: 33 testes / 12 passam / 21 falham, exit 1. Após acrescentar o caso UI de payload preparado: **34 / 12 / 22**, exit 1, aproximadamente 7,35 s na execução final. Não houve GREEN intermediário, implementação ou assertion removida/enfraquecida.

Fixture HTTP: environment test, SQLite `:memory:`, dataDir explicitamente sintético sob `.qa/retail-002a-red`, importLegacy false, backup desabilitado, pareamento sintético. Fixture cria servidor HTTP loopback real e sessões reais; cleanup fecha servidor/conexões. Nenhum DB operacional/dado da loja é massa de teste. Caso UI usa VM e DOM/API sintéticos; **não é homologação de navegador nem hardware**.

| Família de casos | Quantidade / resultado | Observado |
| --- | --- | --- |
| RequestId ausente, por ação | 5 RED | HTTP 201 onde contrato requerido exige rejeição sem efeitos |
| RequestId inválido, por ação | 5 RED | Null é aceito. Strings vazias/brancas, tipos inválidos e comprimento >80 são recusados nos passos anteriores do mesmo teste |
| Outro ator autenticado com o mesmo nome, por ação | 5 RED | Permission/contexto válidos, mas usuário diferente; HTTP 201 reconhece chave de outro executor |
| Conferência alterada, SUPPLY/WITHDRAW/REFUND/CLOSE | 4 RED | Mesmo requestId, expectedCents alterado; HTTP 201 porque campo não participa da signature e prior precede conferência |
| OPEN em outra Unit / outra Organization | 2 RED | Mesma chave/payload, contexto autenticado alterado; abre nova sessão na outra Unit em vez de negar. Não é acesso ao caixa da primeira Unit: é execução nova da mesma identidade, que este contrato manda recusar |
| UI timeout/preparo | 1 RED | Mesmo requestId preservado, mas expectedCents muda de 10000 para 0 no retry; payload não é igual ao preparado |
| Primeira intenção/efeito único/replay/payload alterado, por ação | 5 PASSAM | Replay com chave atual conserva estado/revisão/audit; alteração de motivo é recusada |
| Falha de domínio, SQL e audit, por ação | 5 PASSAM | Comparação do estado/revisão e hashes da audit coincide antes/depois; após retirar falha injetada, mesma chave executa uma vez |
| OPEN após fechar / CLOSE após abrir outro | 2 PASSAM | Replay com chave já reconhece histórico sem abrir/fechar novamente; preservar esse comportamento |

SUPPLY válido de R$100 resulta uma única entrada de R$100; WITHDRAW de R$50 e REFUND de R$50 têm uma única saída/registro com retry da chave válida. REFUND permanece dinheiro e limite atual. OPEN/CLOSE não foram classificados incorretamente como sem replay: **ele existe quando a chave é fornecida**, com limitações de proof.

As 22 falhas são assertions do contrato pedido sobre comportamento atual, não erro de fixture/syntax/KDF/schema. Outros usuários são autenticados e recebem permissions reais; o teste não envia executor para o servidor. Scope alternativo é concedido explicitamente na fixture; os efeitos originais e alternativos são comparados quando a resposta deveria ser negada.

### UI: detalhe da divergência reproduzida

`bindCashForm` cria chave na abertura e muda em evento input. Faz preflight de `/api/state`, podendo substituir expectedCents antes da submissão. Em retry com `cashCommands` reconhecida, pula essa substituição e reconstrói `input=payload()` a partir dos valores originais. RED: revisão atualiza conferência para 10000; POST confirma, resposta é perdida sinteticamente; retry conserva key, mas envia expectedCents 0.

Este caso não afirma que a UI gera chave nova por todo timeout: **no retry sem input ela preserva a chave**, mas não todo payload. Input depois de erro também troca key; solução futura deve distinguir edição de intenção ainda não submetida de uma intenção de resultado incerto, sem converter erro em identidade nova automática.

## 4. Suficiência da persistência e alternativas

Fontes: [storage.validateDatabase](../../../storage.js), [scoped-state.loadState](../../../foundation/scoped-state.js), [state-repository](../../../foundation/state-repository.js), [001](../../../foundation/migrations/001_foundation.sql).

`unit_states` contém JSON válido por company/Unit/revisão. `writeState` grava snapshot, espelhos e audit no mesmo commit. `cashCommands` não possui tabela/índice próprio; validator aceita objetos nessa coleção e não valida versão/ator/contexto/prova. A collection é omitida na audit de mudanças; a audit dos efeitos não liga diretamente requestId à autoria do comando. Não reconstruir proof por nome, coincidência de timestamp ou inferência da audit.

**Insuficiência é do contrato atual:**

1. Signature guarda nome, não executor autenticado imutável.
2. Signature não guarda contexto/conferência completos do comando.
3. Chave é encontrada apenas no snapshot atual; OPEN em outro scope parece intenção nova.
4. Não existe contrato versionado para reconhecer prova antiga versus nova, nem vínculo explícito de resultado de OPEN no recibo do comando.
5. Clientes/pacotes antigos continuam aceitando schema 012 e campos JSON flexíveis; proof nova no payload não produz, sozinha, recusa técnica de pacote antigo.

| Alternativa a revisar | Benefício / trade-off |
| --- | --- |
| **A — proof versionada no payload existente** | Sem SQL novo. Exige contrato durável v1 para assinatura/contexto/ator/resultado e alcance da key. Para negar mesma key em outro scope: identidade da intenção explicitamente vinculada ao contexto desde o preparo, ou verificação transacional global das proofs JSON. A primeira muda contrato de requestId/consumidores; a segunda consulta snapshots e precisa política de colisão/índice/limite. Não basta pôr company/Unit no hash e buscar somente a Unit atual |
| **B — recibo/proof SQL mínimo de comando** | Chave única verificável, proof de ator/contexto e resultado, lookup indexado e constraint transacional. Requer migration 013 revisada, sem normalizar Caixa inteiro. Pacote 001–012 recusa DB com 013 pelo mecanismo já existente. Introduz nova tabela/contrato e requisitos de teste/migração/recovery |

**Recomendação para revisão:** B se a decisão mantiver chave opaca reutilizável como hoje e negar globalmente sua reutilização entre Org/Unit/ator; A se aprovar identidade explicitamente vinculada ao contexto e plano de compatibilidade do novo contrato JSON. Não recomendo scan de todos os snapshots como correção invisível. O alcance global versus key vinculada deve ser decidido/documentado; não relaxar o teste cross-context para manter key por Unit silenciosamente.

Nenhuma alternativa presume permission por posse de chave. Backend autentica e revalida permissions/contexto; diferença de contexto/ator produz erro genérico sem devolver proof/dados da outra Organization. Não mudar para “chave exclusiva só por ator” e permitir que outro ator execute a mesma key.

## 5. DDL mínimo proposto — somente alternativa B, não criado

**PROPOSTO, não aprovado/executado.** Uma tabela de proofs, sem Caixa relacional novo, sem backfill, sem alteração de 001–012. Fragmento abaixo é desenho para revisão; não é arquivo `013_*.sql`.

```sql
CREATE TABLE cash_command_proofs (
 request_id TEXT PRIMARY KEY CHECK(length(request_id) BETWEEN 1 AND 80),
 company_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 executed_by TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('OPEN','SUPPLY','WITHDRAW','REFUND','CLOSE')),
 fingerprint TEXT NOT NULL CHECK(length(fingerprint)=64),
 cash_session_id TEXT NOT NULL CHECK(length(cash_session_id)>0),
 result_json TEXT NOT NULL CHECK(json_valid(result_json) AND json_type(result_json)='object'),
 created_at TEXT NOT NULL,
 FOREIGN KEY(company_id,unit_id) REFERENCES units(company_id,id),
 FOREIGN KEY(executed_by) REFERENCES users(id)
) STRICT, WITHOUT ROWID;

CREATE TRIGGER cash_command_proofs_no_update
 BEFORE UPDATE ON cash_command_proofs
 BEGIN SELECT RAISE(ABORT,'Cash proof is immutable'); END;

CREATE TRIGGER cash_command_proofs_no_delete
 BEFORE DELETE ON cash_command_proofs
 BEGIN SELECT RAISE(ABORT,'Cash proof is immutable'); END;
```

Chave primária global corresponde à negação pedida para a mesma key noutro scope; não torna todos os cadastros do ERP globais. A validação de key/entropia/namespace e colisão precisa contrato antes da implementação: IDs triviais reutilizados por clientes distintos não podem virar padrão novo de produção. Guards não devem expor quem possui uma chave conflitante.

`cash_session_id` é referência ao documento em snapshot, **não** FK a tabela inexistente. Aplicação valida existência/pertencimento na transação. `result_json` guarda recibo mínimo estável do comando (referências/valor/conferência pertinentes), não snapshot completo, credencial, dados fiscais ou cartão. Conteúdo exato e resposta HTTP precisam revisão; preservar compatibilidade da UI legada que espera estado. Não criar PENDING/CONFIRMED: proof é inserida somente para comando efetivamente confirmado na transação; restituições externas são 002E.

Nenhum índice extra é proposto sem query justificada; PK atende lookup da key. Triggers preservam proof contra update/delete pelo runtime; administrador do arquivo continua fora dessa garantia. Constraints futuras de conteúdo/result e formato não são decisões consolidadas só por constarem neste fragmento.

## 6. Fingerprints propostos por ação

Desenho ainda **PROPOSTO**, não “desenho final implementado”. Canonicalização estável/versionada e SHA-256; nomes de propriedades abaixo descrevem conteúdo semântico, não um novo contrato aprovado de API.

Comum: versão do contrato, comando, Org física atual/company, Unit e ID de executor confiável, todos obtidos no backend. Não usar session de login, nome, cargo ou permissions dinâmicas como identidade. Revalidar autorização separadamente.

| Ação | Conteúdo pertinente além do comum |
| --- | --- |
| OPEN | Fundo inicial em centavos; resultado associa o novo cash/session criado. Não incluir target inexistente ou sessão de login |
| SUPPLY | Cash/session alvo, valor em centavos, motivo, expectedCents quando informado |
| WITHDRAW | Cash/session alvo, valor em centavos, motivo, expectedCents quando informado |
| REFUND | Cash/session alvo, venda/origem, valor em centavos, motivo, expectedCents quando informado; conservar limites atuais |
| CLOSE | Cash/session alvo, valor contado em centavos, motivo da diferença, expectedCents quando informado |

Ausência de conferência é distinta de conferência informada, sem torná-la obrigatória por arrasto se semântica atual não exige. `responsible` HTTP é metadado de apresentação derivado; fingerprint usa executor ID, mantendo registros já gravados. Normalizar alias legado sessionId → cashSessionId como hoje; ambos juntos continuam recusados. Valores e textos seguem validação/limites atuais. Campos ignorados sem efeito não devem fazer fingerprint variar; input inválido continua negado.

Nunca incluir senha, approvalToken, CSRF, segredo, cookie/token de login, certificado/CSC ou payload de pagamento externo. Não hash de todo body cegamente. RequestId identifica a intenção, não a autorização. Históricos sem prova não são reclassificados como v1 apenas por conter key.

## 7. Replay histórico, autoridade, atomicidade e recovery propostos

1. Validar requestId/entrada e autenticar, resolver contexto e exigir a permission existente de caixa conforme contrato vigente. Nenhuma nova permission/Owner.
2. Dentro da transação, revalidar contexto/autoridade e consultar proof conforme contrato escolhido. Mesmo ator/contexto/conteúdo: reconhecer resultado histórico, sem reexecutar domínio ou gravar audit/revisão novos.
3. Outra action, payload/conferência, ator ou contexto: conflito/negação genérica sem efeitos ou dados de outro scope. Permission revogada/sessão inválida nunca reconhecem retry autorizado só por conhecer a key.
4. Sem proof reconhecível: distinguir intenção nova de histórico legado; não reexecutar key antiga cuja proof é insuficiente. Recusar com orientação de revisão, sem criar key nova automaticamente.
5. Nova intenção válida executa domínio financeiro atual; grava efeitos, prova, resultado e audit na mesma transação; resposta só depois do commit. Erro SQL/audit/domínio reverte tudo, incluindo eventual proof.
6. OPEN A depois de fechamento reconhece OPEN original, não abre outro. CLOSE A depois de outro OPEN não fecha sessão nova. Resultado histórico não é o estado corrente da gaveta: UI precisa apresentá-lo sem fingir que a sessão antiga está aberta.

Na alternativa B, BEGIN IMMEDIATE/PK serializam disputa da key inclusive entre conexões/scopes; isso precisa teste, não afirmação de execução nova. Proof não pode ser confirmada antes de salvar Caixa/audit. A transação de rollback atual já passou nos novos testes, mas ainda não incluiu a tabela/proof proposta.

Recovery: backup consistente inclui prova e estado da mesma versão; restore em destino novo compara efeitos/proofs/audit/migrations/FKs e reabre com aplicação compatível. Testar reinício, duas conexões e restore preservando intenção, sem resultado composto de versões diferentes. Não criar backup/restaurar loja nesta etapa. SQL desconhecido/checksum alterado continuam fail-closed; não enfraquecer backup/migrador para aceitar proposta futura.

## 8. Compatibilidade e consumidores inventariados

**Nenhum consumidor foi alterado ainda.** Inventário real por busca de rotas/cashAction:

| Arquivo/grupo | Estado / alteração futura delimitada |
| --- | --- |
| `server.js` → cashAction | Passa input, responsável derivado e state; requer mecanismo de ator/contexto/proof confiável integrado à mesma transação |
| `public/cash-ui.js` | `bindCashForm` é consumidor dos cinco comandos: openCashForm, cashMovement supply/withdraw, closeCashDialog, refundDialog. Congelar key e payload preparados, especialmente expectedCents; tratar resultado incerto/contexto e intenção nova sem fallback |
| `cash.test.js` | Algumas chamadas omitem key inclusive aberturas de fixture; adaptar explicitamente cada intenção/teste quando contrato for aprovado, sem gerar chave por erro nem alterar expectativas financeiras |
| `purchases.test.js`, `quotes.test.js`, `round8.test.js`, `round9-stock.test.js`, `v9.test.js` | Helpers/fixtures usam cashAction; revisar se são execução real de comando ou preparação sintética, sem tornar helper bypass de endpoint |
| `foundation/commercial-cash-http.test.js` | Já fornece key e testa alias cash/session e permissão; preservar, acrescentar proof/expectativas conforme contrato |
| `foundation/commercial-registration-http.test.js`, `inactive-sale-http.test.js`, `legacy-sale-idempotency.test.js` | Há setup de caixa por helper/HTTP; ajustar preparação sintética explicitamente, sem mudar venda/inativo/IDP-001 |
| `foundation/legal-structure-runtime.test.js` | HTTP open/close já com key; preservar transição histórica C2 e prefixo 001–011, sem pressupor novo catálogo |
| Novo `foundation/cash-idempotency.test.js` | RED em cinco ações, ator/contexto/conferência/rollback/histórico/UI; permanece com falhas esperadas até contrato aprovado/GREEN |

Não foram encontrados consumidores React de cash/open/supply/withdraw/refund/close; React comercial não é criado. Alias sessionId legado identifica caixa, nunca sessão autenticada. Não alterar outros consumidores financeiros/stock/retornos por arrasto.

Históricos `cashCommands` sem key ou v0 sem proof contextual permanecem intactos. Não fabricar executor, requestId, proof, result ou vínculo por timestamp/nome. Não reescrever audit antiga. Antes de aceitar pedido com key antiga, reconhecer insuficiência; não migrar automaticamente assinatura antiga para v1 após comparação superficial.

Alternativa A precisa plano de pacote antigo sobre JSON v1: schema 012 sozinho não bloqueia app antigo; definir proteção de deployment/versionamento antes de usar em loja. Alternativa B precisa backfill **zero** de proofs antigas e testes de upgrade vazio/prefixos; pacote 001–012 não é rollback seguro de DB 013. Não exigir que históricos antigos atendam novo formato para serem lidos; exigir proof nova para reconhecer retry novo.

## 9. Regressões, limites e próxima revisão

GREEN não executado, pois gate de contrato persistente foi alcançado. Regressão pós-GREEN (cash/replay, cash HTTP, IDP-001, vendas/financeiro pertinente, sessão/RBAC/contexto, backup/migrations e ampla) **não executada**. Os 12 casos passing do RED preservam comportamentos específicos atuais; não são regressão global nem homologação do produto.

Pendente após escolha: testes de duas conexões/reinício/restore da proof aprovada, negativos dos outros comandos em contexts alternativos, permission/sessão revogadas, histórico v0 e todos consumidores, timeout/falha real de resposta e UI. RED da UI é VM sintética, sem screenshot/navegador. Software protege registros; entrega física de dinheiro também exige procedimento humano de não repetir após resultado incerto.

Riscos residuais atuais: os comandos continuam aceitando chave ausente/null, atores homônimos reconhecem chave alheia, OPEN pode repetir identidade em outro scope, expectedCents não vincula replay, UI pode mudar payload. Não foram corrigidos nem mascarados; manter NO-GO da loja nos gates do contrato do piloto.

Revisão necessária: escolher prova JSON/context-bound ou prova SQL/key global, definir identidade/colisão/resultado/legacy e compatibilidade; aprovar DDL se B; só então autorizar implementação correspondente. Essa revisão não autoriza 002B+, restituição externa, multi-caixa ou alterar regra financeira dos cinco comandos.

## 10. Arquivos e Git desta entrega

Novos: `foundation/cash-idempotency.test.js` e este relatório. Alterados: somente marcadores de PROJECT_MASTER/ROADMAP para registrar o gate. Nenhum backend/UI existente ou teste antigo modificado; contrato RETAIL-001 permanece intacto após checkpoint. Sem arquivo SQL, dependência, segredo, DB, backup, screenshot ou fixture persistida adicionados ao Git.

`git diff --stat` rastreado: PROJECT_MASTER e ROADMAP, duas inserções/duas remoções. Os dois arquivos novos ficam untracked, não aparecem nessa estatística; nenhum foi staged. Conferência de whitespace inclui também esses arquivos novos.

Estado esperado e conferido ao encerrar:

```text
 M docs/atual/PROJECT_MASTER.md
 M docs/atual/ROADMAP.md
?? docs/atualizacoes/retail/RETAIL_002A_CASH_IDEMPOTENCY_REPORT.md
?? foundation/cash-idempotency.test.js
```

HEAD permanece `a609f060dd1a964b7bf97054f426d329b49d4466`. Migrations 001–012 byte a byte intactas, nenhuma 013. **Sem commit/push de RETAIL-002A. Parado para revisão do contrato persistente antes da implementação.**
