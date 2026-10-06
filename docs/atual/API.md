# API

## Referência e convivência vigentes — 05/10/2026

[Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md) define o alvo; rotas abaixo descrevem o código local. React `/ui/` já consome a mesma API para sessão/login/contexto, sem segunda API ou módulos comerciais. Contratos futuros validarão organização/entidade/unidade e contrato/entitlement/permission/scope/station distintos; administração crítica é cloud-only. Nenhum cliente acessa banco cloud.

**IDP-001 — Fase B:** `POST /api/sales` agora exige identidade válida e reconhece replay somente com conteúdo canônico e contexto/executor correspondentes, sem repetir efeitos. Implementação local em revisão, sem commit nesta rodada. [Relatório, compatibilidade e testes](../atualizacoes/fase-b/IDP_001_REPORT.md). A [auditoria anterior](../auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md) permanece como evidência histórica; outros comandos não foram endurecidos por arrasto.

## ATUAL no código — HTTP local, Fundação V1.2 fechada localmente

Estado atual em **03/10/2026**: Fundação V1.2 fechada localmente, checkpoint `2a2177c7b80734722f71bd9e72029cf9e1b39df0`: **B — homologação condicional, 610/610 aprovados**, migrations **001–010**, seis agregados relacionais. Versão **1.2.0-foundation.1**; fechamento local concluído, com tag `v1.2.0-foundation.1`. Evidências e limites no [estado consolidado V1.2](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md); [V1.1](../atualizacoes/v1.1/FOUNDATION_V1_1_REPORT.md) permanece histórico. Esta revisão documental não verifica nem altera o banco operacional e não certifica produção/cloud.

Rotas implementadas em [server.js](../../server.js), [identity.js](../../foundation/identity.js) e [admin.js](../../foundation/admin.js). Origem padrão: `http://127.0.0.1:3210`. Sessão, empresa/unidade, vínculos e permissões são verificados pelo servidor. Estes são contratos internos locais, sem versão pública/OpenAPI ou publicação SaaS.

POST exige JSON, Origin permitido e `X-CSRF-Token` associado à sessão/contexto, ou ao pré-login. O cookie de sessão é HttpOnly e SameSite=Strict. `X-Company-ID` e `X-Unit-ID` indicam o contexto esperado da aba; não concedem acesso. Divergência retorna `409 CONTEXT_CHANGED`, sem reenviar comandos automaticamente.

Erros possuem `{error,code}`: 400 para comando/formato inválido, 401 para sessão/credencial inválida, 403 para autorização/CSRF/origem, 404 para rota/recurso não disponível no escopo, 409 para conflito, 413 para corpo excessivo, 415 para formato e 422 para validação de fundação. Falhas internas retornam 500 com mensagem genérica, sem SQL, caminhos ou secrets. Algumas validações comerciais legadas continuam em 400.

Rotas legadas normalmente retornam 201 e o estado completo da unidade; pricing retorna 200. Toda resposta comercial completa e export exige `catalog.view`, `inventory.view`, `sales.view`, `financial.view` e `operations.view`; cada escrita exige também sua permissão específica. A V1.1 oferece DTOs pequenos por permissão em `/api/commercial/*`, sem filtrar parcialmente o snapshot completo. Cadastros e venda direta novos retornam somente registro/venda autorizado. Sucesso só é enviado depois do commit SQL, incluindo auditoria.

## Identidade e administração ATUAIS

### BRAND-001 — aparência contextual

`GET /api/organization/branding`: sessão e contexto C/U ativos/verificados; qualquer usuário desse contexto pode ler a aparência. Resposta 200 com somente `displayName`, `primaryColor`, `accentColor`, `themeMode`, `revision`. Sem linha: default central com revisão 0; dado visual inválido: default com revisão válida preservada. Nenhuma leitura cria configuração.

`POST /api/organization/branding`: convenção administrativa atual; exige CSRF/Origin e **`companies.manage`**, sem checar nome de papel. Corpo completo com `displayName` (1–80, sem controles), `primaryColor`/`accentColor` (#RRGGBB normalizado), `themeMode` (LIGHT/DARK/SYSTEM) e `expectedRevision` inteira segura ≥0. Org/ator/instante vêm do backend. Não aceita IDs, query seletora, logo, CSS ou extras. Primeira escrita exige 0; próximas exigem revisão atual. 200 retorna DTO com revisão incrementada; conflito **409 STALE_BRANDING**, validação **422 INVALID_BRANDING_INPUT**. Contexto esperado divergente continua 409 CONTEXT_CHANGED.

Escrita/auditoria são atômicas, com ator, Org, instante e campos alterados; falha de audit reverte a configuração. Restaurar default usa o mesmo POST/CAS e preserva histórico. Perda de resposta não causa retry automático: recarregar/revisar antes de tentar novamente. Como o RBAC v1 não possui grant Company-wide, a escrita exige `companies.manage` efetiva em **todas as Units ativas da Organization atual**, inclusive as não acessíveis ao usuário. O alcance é revalidado dentro da transação; ausência de permissão em qualquer dessas Units retorna **403 FORBIDDEN_BRANDING_SCOPE**. Grants de outra Organization não contam. Nenhuma permission, concessão automática, ACL v2 ou Owner foi criada. GET continua contextual. [Relatório](../atualizacoes/branding/BRAND_001_REPORT.md).

| Método | Caminho | Contrato e acesso |
| --- | --- | --- |
| GET | `/api/auth/status` | Estado de configuração/autenticação e CSRF; nunca retorna código de instalação |
| POST | `/api/auth/setup` | Primeiro usuário: name, login, password, pairingToken; somente loopback e banco sem usuários |
| POST | `/api/auth/login` | login/password; credencial errada, inexistente ou inativa usa erro genérico |
| GET | `/api/auth/me` | Usuário público, contexto, permissões, CSRF e contextos acessíveis; sem hash/token de sessão |
| POST | `/api/auth/context` | companyId/unitId verificados contra os vínculos; muda sessão e CSRF associado |
| POST | `/api/auth/logout` | Revoga sessão e limpa cookies |
| POST | `/api/auth/password/change` | currentPassword/newPassword/confirmPassword; 200 `{changed,loggedOut}`; senha atual real, revoga todas as sessões e exige novo login |
| POST | `/api/foundation/password-reset` | id/operatorPassword/reason; `users.reset_password`; 201 `{resetCode,resetId,expiresAt}`; código exibido somente uma vez, alvo restrito ao contexto |
| POST | `/api/auth/password/reset` | login/resetCode/newPassword/confirmPassword; CSRF pré-login; 200 `{changed,loggedOut}`; escolhe nova senha, sem iniciar sessão |
| GET | `/api/auth/sessions` | Sessões próprias ativas; `{sessions}` com id/current/createdAt/lastSeenAt/expiresAt/origin Local; IDs não são tokens |
| POST | `/api/auth/sessions/revoke` | sessionId próprio; 200 `{revoked,loggedOut}`; ID de outro usuário 404 |
| POST | `/api/auth/sessions/revoke-others` | Objeto vazio; 200 `{revoked,count}`; preserva a sessão atual |
| GET | `/api/foundation/admin` | Usuários/vínculos, unidades, papéis e catálogo de permissões da empresa; users.manage + roles.manage |
| POST | `/api/foundation/users` | name/login/password/unitId/roleIds; empresa implícita, users.manage + roles.manage |
| POST | `/api/foundation/access` | id/unitId/status/roleIds; vínculo da unidade na empresa atual, sem alterar usuário global de outra empresa |
| POST | `/api/foundation/roles` | name/permissions, ou id/name/permissions para editar; roles.manage |
| POST | `/api/foundation/units` | name, na empresa atual; units.manage |
| POST | `/api/foundation/companies` | name/unitName e acesso inicial do operador; exige todas as permissões |
| GET | `/api/foundation/audit` | Últimos eventos da unidade atual; audit.view |

Papéis concedidos não podem conter permissões ausentes do operador. Há proteção contra perda do próprio acesso administrativo. Identidade/executor/empresa não são autoridade em corpos comerciais. Catálogo atual: **20 permissões**, incluindo `sales.authorize_inactive` e `users.reset_password`. Recuperação por e-mail e MFA não existem; troca/reset administrativo e sessões são os contratos locais acima.

Senha nova: 12–128 caracteres, até 512 bytes UTF-8, confirmação igual e hash Argon2id. Troca/reset revogam sessões, convites anteriores e grants pendentes relacionados ao usuário. Reset próprio é recusado; alvo ativo deve estar vinculado à unidade atual, não ter vínculo em outra empresa (inclusive inativo) nem direitos ativos superiores aos do executor. Emissão exige senha real/motivo de 1–500 caracteres e impede uso da senha anterior; código hash-only expira em 15 minutos e é de uso único. Revalidação após KDF e auditoria/transação impedem atualização parcial. Campos desconhecidos são recusados.

Erros específicos comprovados: 403 `CREDENTIAL_CONFIRMATION_DENIED` / `RECOVERY_DENIED` para negativa genérica; 403 `RESET_NOT_ALLOWED` para alvo não permitido; 404 `NOT_FOUND` para alvo/sessão indisponível no contexto; 422 `PASSWORD_CONFIRMATION`, `INVALID_PASSWORD`, `RESET_REASON_REQUIRED`, `INVALID_SESSION_ID` ou `INVALID_INPUT`; 409 `CONTEXT_CHANGED` se contexto mudar. Limites locais podem negar tentativas; nenhum contrato de rate limiting distribuído. Detalhes em [ACCESS_V1_2](ACCESS_V1_2.md) e [testes de acesso](../../foundation/access-v1-2.test.js).

## Consultas menores ATUAIS — V1.1 e V1.2

Todas exigem sessão/contexto válido; DTO usa allowlist e omite extras/históricos internos. Campos comerciais ainda são dados pessoais quando correspondem a cadastro: resposta pequena não dispensa controle de acesso.

| Método/caminho | Acesso e resposta |
| --- | --- |
| GET `/api/commercial/catalog` ou `/products` | catalog.view; produtos sem estoque/custo/financeiro; paginação SQL |
| GET `/api/commercial/customers` ou `/suppliers` | catalog.view; cadastro/contatos autorizados, paginação SQL |
| GET `/api/commercial/inventory` ou `/inventory/movements` | inventory.view; saldo ou movimento/origem/execução, sem preço/custo; paginação SQL |
| GET `/api/commercial/sales` | sales.view; lista comercial com itens/execução; COUNT/busca/filtros/paginação SQL, sem payload comercial completo |
| GET `/api/commercial/sales/by-id?id=...` | sales.view; `{sale,revision}` SQL no escopo; campos financeiros somente com financial.view; inexistente 404 |
| GET `/api/commercial/financial` | financial.view; projeções de recebíveis, despesas, parcelas e recebimentos; sem catálogo/estoque; paginação em memória |
| GET `/api/commercial/operations` | operations.view; tarefas projetadas; paginação em memória |
| GET `/api/commercial/products/lookup?code=...` | catalog.view; busca SQL por código/barcode/alias/embalagem, DTO produto; não encontrado 404 e código ambíguo 409 |
| GET `/api/commercial/{products,customers,suppliers}/by-id?id=...` | catalog.view; `{record}` no escopo; produto inclui minStock somente com inventory.view; inexistente 404 |
| GET `/api/commercial/product-costs?productId=...` | catalog.view + financial.view; `{cost,revision}` da última fonte recebida existente; ausência retorna null, sem presumir custo zero; materializa snapshot |
| GET `/api/commercial/sales/checkout-context` | catalog.view + sales.view + sales.create; `{cashSessionId}` aberto ou null; sem filtros, materializa snapshot |

Listas recebem somente `page`, `pageSize`, `q`, `sort`, `direction`, `status`: página 1..1.000.000, tamanho 1..100 (padrão 50), busca até 120 caracteres, ordenação permitida por name/date/code/id, direção asc/desc, situação all/active/inactive. Repetições/nomes/valores inválidos retornam 422. Retornam `{items,page,pageSize,total,totalPages,revision}`. As consultas SQL usam whitelist/parametrização, count/filtro/ordem/LIMIT/OFFSET no banco e desempate estável; não leem payload comercial integral. Revisão/marcador assegura agregado preparado; conferência integral do espelho ocorre em hidratação/comandos, não por página.

**Exceção comprovada para a lista de Vendas:** além dos parâmetros básicos, aceita `cancelled=all|registered|cancelled`, `from`/`to` como dias civis válidos `YYYY-MM-DD` em America/Sao_Paulo (inclusive, from ≤ to), `customerId`, `executorId` e `unitId` até 120 caracteres. `unitId` só pode coincidir com a unidade autorizada; outra recebe 403 `FORBIDDEN_CONTEXT`. `status` conserva semântica de active/inactive do registro, sem substituir cancelamento. Busca textual cobre ID/nome histórico do cliente/código/número; empates usam ID ascendente. Filtros financeiros como paymentStatus/paymentMethod não fazem parte da allowlist e retornam 422 `INVALID_QUERY`, inclusive para perfil financeiro. Detalhe aceita somente um `id`, não parâmetros de lista. Lista permanece comercial mesmo com financial.view; detalhe amplia projeção de recibos/parcelas/restituições/créditos/perdão quando autorizado, sem extras brutos ou custo dos itens. [Implementação](../../foundation/commercial-read.js), [queries](../../foundation/sales-store.js), [testes HTTP](../../foundation/commercial-sales-read-http.test.js).

Lista/detalhe precisam de revisão/marcador válidos: agregado não preparado pode retornar 503 `NORMALIZATION_REQUIRED`; divergência é recusada. Não carregam snapshot completo, mas não dispensam metadata. A UI de detalhe atual solicita/projeta a apresentação comercial também no perfil financeiro; a projeção financeira existe no backend.

`/api/foundation/audit` continua exigindo audit.view, mas before/after recebe projeção por permissão do domínio, sem snapshots brutos para perfil parcial. Interface parcial usa essas consultas e paginação; interface completa permanece adaptador compatível do snapshot e exige as cinco leituras.

## Comandos menores V1.1

POST continua exigindo JSON/Origin/CSRF/contexto. Permissões são reavaliadas dentro da transação. Entradas desconhecidas e campos de identidade/autorização usados como autoridade são recusados.

| Caminho | Contrato |
| --- | --- |
| `/api/commercial/products` e `/customers` | Criação; catalog.view + catalog.manage; requestId obrigatório; 201 `{record,revision,replayed}` |
| `/api/commercial/products/{edit,active}` e `/customers/{edit,active}` | Edição/situação; mesmas permissões; id + expectedVersion obrigatório |
| `/api/commercial/suppliers/{create,edit,active}` | Mesmo contrato de cadastro menor; create exige requestId |
| `/api/commercial/sales/preview` | catalog.view + sales.view + sales.create; 200 com offer/expectedOffer/totais/inactiveProductIds; consulta de preço sem venda, estoque ou grant |
| `/api/commercial/sales/inactive-approval` | Mesmas permissões do executor; `{saleDraft,approverLogin,approverPassword,reason}`; 201 `{approvalToken,approvalId,expiresAt}` |
| `/api/commercial/sales` | Mesmas permissões; draft e approvalToken quando necessário; 201 `{sale}` com execução/autorização verificada |

Cadastro: corpo até 16 KiB; criação requestId não vazio até 80 caracteres, IDs gerados no servidor. Retry idêntico do mesmo executor/contexto não duplica cadastro/movimento/auditoria; uso com outro conteúdo/cadastro/executor retorna 409. Edit/active requer versão inteira não negativa (zero admite legado sem versão); inexistente 404, obsoleta 409 `STALE_REGISTRATION`. Produto aceita nome/preço/código/barcode/categoria/minStock; estoque só inicial, positivo exige inventory.adjust. minStock informado, inclusive zero, exige inventory.view + inventory.adjust; omissão preserva valor/ausência. Não aceita custo inventado ou ajuste silencioso de saldo. Cliente/Fornecedor aceita nome/telefone/email/notas. Ver [contrato de cadastros](../atualizacoes/v1.1/FOUNDATION_V1_1_REGISTRATION.md).

Venda direta: corpo até 100.000 bytes, whitelist explícita de draft/itens, requestId e fingerprint canônico para retry. Preview informa itens inativos para a interface; **não concede autorização**. expectedOffer é sinal de revisão de oferta, não autoridade de preço ou segurança: venda recalcula/valida preço, desconto, saldo, cliente, caixa e embalagem no servidor. Itens inativos exigem confirmação de login/senha real por conta ativa com sales.authorize_inactive na mesma empresa/unidade e motivo obrigatório. Grant dura até 120 segundos, é vinculado ao draft/produtos/executor/sessão/contexto e só é consumido uma vez na mesma transação da venda/auditoria. Replay de venda já confirmada é conferido antes do consumo. Ver [aprovação excepcional](../atualizacoes/v1.1/FOUNDATION_V1_1_APPROVAL.md); não há PIN/biometria ou aprovação automática de orçamentos/reservas.

## Rotas observadas

| Método | Caminho ou família | Finalidade |
| --- | --- | --- |
| GET | `/api/health` | Saúde: ready, local e version; não certifica segurança |
| GET | `/api/state` | Todo o estado comercial da unidade autenticada, com as cinco leituras |
| POST | `/api/products`, `/api/customers` | Cadastro |
| POST | `/api/products/edit`, `/api/customers/edit` | Edição com controles do fluxo |
| POST | `/api/products/active`, `/api/customers/active` | Situação do cadastro |
| POST | `/api/stock` | Entrada avulsa atual; acesso será revisto conforme o passeio |
| POST | `/api/sales`, `/api/sales/cancel`, `/api/sales/receive` | Venda, cancelamento e recebimento |
| POST | `/api/expenses`, `/api/expenses/cancel`, `/api/company` | Despesas e dados de apresentação da empresa |
| POST | `/api/suppliers/{create,edit,active}` | Fornecedores |
| POST | `/api/purchases/{create,edit,confirm,receive,close,reschedule}` | Compras e recebimentos |
| POST | `/api/quotes/{create,edit,prices,cancel,convert}` | Orçamentos |
| POST | `/api/payables/{create,edit,pay,link,cancel}` | Contas a pagar |
| POST | `/api/cash/{open,supply,withdraw,refund,close}` | Caixa |
| POST | `/api/business/{catalog,accounts,tasks}/{action}` | Catálogo complementar, recebíveis e agenda |
| POST | `/api/workflows/{inventory,returns,reservations}/{action}` | Inventário, devoluções e reservas |
| POST | `/api/advanced/{kind}/{action}` | Preços, quarentena, retorno ao fornecedor, crédito, entrega, cotação e orçamento de despesas |
| POST | `/api/next/{kind}/{action}` | Catálogo, posições, controle de compras, acordos, recorrências, procedimentos e revisões de preço |
| POST | `/api/exports` | Prepara CSV e retorna URL temporária |
| GET | `/api/exports/{token}` | CSV da sessão/empresa/unidade que o preparou, válido por cinco minutos |
| GET | `/api/export?kind=...&id=...` | CSV conforme tipo e IDs |
| GET | `/api/cash/export?id=...` | Relatório CSV de caixa |

Chaves entre `{}` representam alternativas, não texto literal da URL.

`business` reconhece no roteador ações metadata, bulk, plan, receive, allocate, forgive, create, edit, complete, reopen, cancel, hide e restore. `workflows` reconhece create, add, count, choose, rebase, apply, cancel, refund, edit, renew, convert, collect, reopen, close e recount. O handler de cada módulo decide quais combinações são válidas: a família de rota não garante toda combinação.

`advanced` reconhece kinds priceLists, promotions, pricing, quarantineEntries, supplierReturns, storeCredits, deliveries, supplierQuotes, expenseCenters e expenseBudgets. `next` reconhece packages, aliases, families, positions, transfers, purchaseAmendments, purchaseConferences, purchaseOccurrences, agreements, recurringModels, recurringOccurrences, procedures, procedureExecutions e priceReviews. As ações dessas famílias são validadas pelos handlers; este catálogo não substitui seus schemas.

## Integridade e limitações ATUAIS

### Criação de venda legada — IDP-001

`POST /api/sales` exige `requestId` string não vazia, até 80 caracteres, e reutiliza a whitelist/fingerprint canônico de draft da API comercial: até 500 itens e 100.000 bytes. Ausência/chave inválida/campos não permitidos retornam 422 `INVALID_SALE_DRAFT` sem efeitos comerciais; corpo excessivo pode retornar 413. Autenticação, cinco leituras, `sales.create`, contexto e CSRF continuam obrigatórios.

Primeira execução persiste venda, fingerprint contextualizado, estoque, recebimentos/caixa/crédito, espelhos e auditoria na mesma transação. Mesma chave/conteúdo/empresa/unidade/executor retorna 201 e o snapshot atual contendo a venda registrada; não recalcula a venda, não grava revisão nem duplica auditoria. Ordem das propriedades JSON não importa; tipos, valores, presença dos campos e ordem das listas fazem parte do contrato. Guardas de Caixa/crédito/posições integram o conteúdo; nome declarado, token de aprovação e sessão/horário novos não definem outra intenção. A rota legada não aceita token como autorização de produto inativo.

Mesma chave com outro conteúdo/executor, uso de chave de outro fluxo ou histórico sem fingerprint contextualizado completo retorna 409 `REPLAY_CHANGED`, sem efeitos. Chaves são pesquisadas somente na unidade autenticada; a mesma string pode representar intenções independentes em outras unidades, nunca reconhecer a venda estrangeira. Não trocar automaticamente a chave após timeout/conflito: consultar a venda registrada. Uma nova intenção legítima usa chave nova no cliente.

Históricos sem chave/fingerprint não são alterados. Rascunhos antigos com chave anterior à correção precisam consultar o resultado; não se inventa prova retroativa. A função pura `sale` continua interna e compatível com conversões protegidas por orçamento/reserva; a exigência nova é no contrato externo de criação direta. [Inventário completo e limites](../atualizacoes/fase-b/IDP_001_REPORT.md).

Diversos comandos usam `requestId` e assinatura de conteúdo para reenvio idêntico sem duplicar efeito; conteúdo alterado com a mesma chave é rejeitado. Diversas edições exigem `expectedVersion`. Não é uniforme em todas as rotas legadas; os novos cadastros menores têm replay de criação e conflito de versão explícitos. Hash de requisição não é assinatura de identidade.

Há teto de leitura HTTP de 1 MiB e limites legados de 100.000 ou 250.000 caracteres por família, além dos limites de itens. Autenticação possui limitação local de tentativas e de cálculos simultâneos de senha; não há rate limit distribuído de API pública. Export temporário não substitui sessão: ambos e o escopo são exigidos no download. IDs externos ao contexto são recusados.

Consultas menores reduzem exposição/transferência, mas comandos, incluindo Vendas, continuam materializando/validando snapshot e reconciliando os seis agregados/espelhos. Melhorias locais de escrita já foram medidas; a dependência transitória e o gargalo large permanecem. Compras/Recebimentos tem SQL/FKs e rotas de comando existentes, mas consultas operacionais/custos ainda passam por estado completo; não há endpoint novo de listagem proporcional de Compras. Backup/restore são serviços/ferramentas locais, sem endpoint público de restore. Não executar exemplos de escrita contra a loja. Testes HTTP são isolados; [homologação atual](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md), [V1](../atualizacoes/fundacao-v1/FOUNDATION_V1_REPORT.md) e V0.12 preservam seus respectivos escopos.

## PLANEJADO — contratos centrais

Os novos módulos [Commerce Hub](COMMERCE_HUB.md) e [Printing & Devices](PRINTING_AND_DEVICES.md) não têm endpoints implementados por esta tarefa. Site customizado terá API/webhooks autenticados com OAuth/API credentials conforme escolha futura, scopes, rate limits, documentação, auditoria e versionamento. Contratos de canais dependem da documentação oficial vigente. Comandos Desktop/Edge serão tipados, limitados, autenticados e escopados; não oferecer API de execução arbitrária. Sessão/CSRF local não é contrato de autenticação externo.

API pública versionada e schemas publicados; ampliar contratos explícitos para os módulos restantes. Contexto, permissão, efeitos transacionais, replay nas fatias cobertas e resposta minimizada já existem nas fatias V1.1 descritas acima. No alvo, proteção contra replay é obrigatória para operações críticas, inclusive os legados que ainda precisam de correção.

Versionamento público, política remota de sessão/compatibilidade e schemas publicados continuam **PLANEJADOS/A DEFINIR**. Expandir paginação SQL/respostas por permissão e substituir gradualmente o adaptador completo; não afirmar que toda rota legada já tem contrato parcial.
