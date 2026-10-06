# ORG-001 — Especificação do modelo organizacional

**Data:** 05/10/2026. **Fase C: decisões arquiteturais consolidadas; revisão documental. Sem autorização de implementação.**

**Baseline inspecionada:** `038733102de9ae05a12e69b522e782243c5e8a54`, branch `v1.3-frontend`, árvore limpa no início da especificação original. A consolidação começou com README/PROJECT_MASTER/ROADMAP modificados e esta especificação não rastreada, provenientes da entrega anterior. O checkpoint B/IDP-001 já está aprovado. Nenhuma implementação do modelo abaixo está autorizada por este documento.

**Autoridade:** [Documento Mestre v1.0](../../../Documento_Mestre_Sistema_Comercial_v1.0.md), especialmente §§2–5, 7–10, 15–16 e 18; solicitação ORG-001 e revisão explícita do proprietário, **“FASE C — ORG-001 — CONSOLIDAÇÃO DAS DECISÕES DO PROPRIETÁRIO”**, recebida em 05/10/2026. **ORG-P01 a ORG-P12: APROVADAS / PLANEJADAS**, registradas na §15. Aprovação da direção não equivale a implementação nem aprovação do schema. Alternativas A/C e U-B foram analisadas e rejeitadas nesta versão; propostas e pendências técnicas remanescentes são indicadas localmente.

**Escopo desta consolidação:** revisar este documento e atualizar somente `PROJECT_MASTER.md` e `ROADMAP.md` quanto ao estado de C. O README já estava modificado na entrega anterior e não recebe nova alteração. Documentos históricos e o mestre da raiz permanecem intactos. Nenhuma base operacional precisa ser aberta para a definição estrutural.

## 1. Estado atual comprovado e método

Foi feita leitura sem executar o runtime nem abrir o banco operacional: schema das migrations 001–010, produtores/consumidores de contexto, SQL, persistência, autenticação, administração, auditoria, importação, rotas, UI legada, React e fontes dos testes pertinentes. A pesquisa textual orientou o inventário; a classificação abaixo deriva dos relacionamentos e do comportamento dos métodos, não dos nomes das colunas.

Papéis consultados: [Arquitetura](../../../agents/architect.md) para alternativas; [Banco](../../../agents/database.md) para chaves/história; [Segurança](../../../agents/security.md) para isolamento; [Backend](../../../agents/backend.md) para contratos/transações; [Produto](../../../agents/product-domain.md) para ownership e pendências; [Interface](../../../agents/frontend-ux.md) para contexto; [Documentação](../../../agents/documentation.md) para autoridade e registro. São papéis de revisão, sem processos antigos reativados.

**ATUAL:** monólito Node local com SQLite; identidades globais na instalação, empresas, unidades, memberships e RBAC por empresa/unidade. Existem seis agregados relacionais e snapshots por unidade; escritas sincronizam esses agregados, snapshot, índice e auditoria na mesma transação. Lista/detalhe de Vendas usam SQL sem carregar o payload comercial completo. A Fundação V1.2 e sua homologação B/610 são históricas; não certificam o modelo novo. A UI legada é comercial; React possui sessão/contexto e skeleton.

**AUSENTE:** entidade legal interna PF/PJ, vínculo unidade–titular, titular histórico verificável nos fatos, contrato/entitlement formal e administração separada da plataforma. Não há estrutura de emissão fiscal ou de anexos implementada que substitua esse vínculo. Campos de documento de clientes/fornecedores não identificam o titular interno.

**Limite da descoberta:** o código permite várias empresas/unidades e IDs comerciais iguais em escopos diferentes. Não foi verificado quantas existem na base da loja ou quais titulares operaram nelas. Nenhum dado cadastral ou pessoal operacional foi lido. **ORG-P01/P02 aprovam a direção estrutural company→Org 1:1, sem agrupamento e sem inferir PF/PJ**, independentemente dessa leitura. O levantamento autorizado posterior é necessário para mapear dados reais, não para decidir B novamente. Esta especificação não certifica uma correspondência cadastral real.

### 1.1 Inventário semântico dos usos relevantes

| Evidência e consumidor | Significado ATUAL | Consequência para ORG-001 |
| --- | --- | --- |
| [001](../../../foundation/migrations/001_foundation.sql), [entities](../../../foundation/entities.js): `createCompany`, `createUnit`, `getUnit`, `updateUnit` | Empresa é raiz de agrupamento/isolation; unidade tem chave composta e pertence a essa empresa. Empresa tem somente nome/status/datas. Atualização de unidade não troca seu pai. | Não existe prova de PF/PJ. Adicionar nível legal requer correspondência explícita; não basta renomear. |
| [access](../../../foundation/access.js): `grantCompanyAccess`, `grantUnitAccess`, `accessContexts` | Vínculo de entrada na empresa mais vínculo específico de unidade; contexto só aparece com usuário/pais/vínculos ativos. | Membership de empresa não equivale a direito sobre todas as unidades. |
| [rbac](../../../foundation/rbac.js): `effectivePermissions`, `assignRole` | Definições de papel na empresa; atribuição e direitos efetivos na unidade exata; vocabulário de permissões global. | Preservar a associação direito–escopo; não promover todos os papéis a grants de organização. |
| [identity](../../../foundation/identity.js): `authenticate`, `sessionCsrf`, troca de contexto, `bootstrapAccess` | Usuário/login global; sessão opaca seleciona par empresa/unidade. Lista autorizada e direitos são reavaliados; CSRF depende do contexto. Proprietário inicial recebe papel explícito numa unidade. | Não há proprietário de organização modelado. Troca para tripla exige contratos próprios e invalidação consistente. |
| [request-context](../../../foundation/request-context.js), [scoped-state](../../../foundation/scoped-state.js): `requestContext`, `assertScope`, `loadState` | Contexto autenticado imutável; headers são expectativa da aba, não seleção livre. Escopo valida vínculo/pais. Helpers internos técnicos podem trabalhar sem `userId`; rotas usam contexto autenticado. | IDs enviados pelo cliente continuam sem autoridade; contextos técnicos precisam permanecer distintos de autorização HTTP. |
| [authorization](../../../foundation/authorization.js), [commercial-read](../../../foundation/commercial-read.js), [commercial-registration](../../../foundation/commercial-registration.js) | Deny-by-default, rejeição de autoridade no corpo, allowlists e DTO por direito. Cadastro/consulta só enxergam o par ativo. | Novo nível precisa ser verificado antes da consulta, contagem, filtro, projeção e escrita, inclusive endpoints legados. |
| [admin](../../../foundation/admin.js): `adminData`, `handleAdmin`, `ensureGrant` | Administração de unidades, membros e papéis da empresa; direito na unidade ativa habilita operações administrativas sobre a empresa. Criação de unidade copia papéis do criador; criação de empresa cria outra raiz e dá acesso inicial ao criador. | Escopo administrativo já é diferente do escopo comercial de unidade. Não reinterpretar criar empresa como criar entidade legal nem copiar automaticamente essa autoridade para toda a organização. |
| [auth-maintenance](../../../foundation/auth-maintenance.js): `resetTarget`, `revokeUser` | Senha pertence ao usuário global; reset recusa alvo com vínculo em outra empresa, até inativo, e compara privilégios nas demais unidades. Revogação de sessões é global ao usuário. | Agrupar empresas pode enfraquecer proteção de credencial compartilhada. Revogar membership não deve desativar usuário global em outros tenants. |
| [inactive-sale-approval](../../../foundation/inactive-sale-approval.js) | Grant vinculado a sessão, executor, aprovador, empresa, unidade, requestId e draft/produtos; consumido na transação. | Não transportar aprovação transitória para novo titular/contexto; preservar provas consumidas. |
| [state-repository](../../../foundation/state-repository.js): `writeState`, `saveBusinessState` | Snapshot, CAS de revisão, índices, seis espelhos SQL e auditoria por empresa/unidade. Não são seis escritores independentes. | Mudança de ownership atravessa a persistência híbrida. Backfill que muda só SQL pode provocar divergência e bloquear o runtime. |
| [commercial-store](../../../foundation/commercial-store.js), [inventory-store](../../../foundation/inventory-store.js), [sales-store](../../../foundation/sales-store.js) | Produtos, clientes, fornecedores, compras, estoque e vendas são namespaces da unidade. Todas as referências principais repetem empresa/unidade. Present-fields/extras e ordinais preservam o formato legado. | Não há catálogo/CRM compartilhado por empresa já pronto. Ampliar consultas para organização seria mudança de visibilidade e colisões, não mero JOIN. |
| [execution](../../../foundation/execution.js), `actorColumns` em sales/inventory | Executor/escopo/nome/papéis registrados para fatos novos; autoria antiga ausente é preservada. Projeções relacionais de ator verificam vínculo de unidade. | Executor é pessoa que agiu, não titular legal. Preservar vínculos históricos e evidências, sem fabricar autoria no backfill. |
| [audit](../../../foundation/audit.js), triggers 001 | Evento tem empresa/unidade, atores, before/after sanitizados e hashes. Encadeamento é global ao arquivo; consulta é por unidade. | Alterar IDs/JSON de eventos antigos quebra a cadeia. Mapeamento legal deve ser externo e auditado; cadeia local não vira garantia SaaS inviolável. |
| [migration](../../../foundation/migration.js), [runtime](../../../foundation/runtime.js), [migrate-legacy](../../../scripts/migrate-legacy.js) | Importação por par, prova de origem/equivalência e preservação de IDs/valores; bootstrap usa nome de apresentação para criar empresa genérica. Normalização técnica percorre snapshots antes de aceitar HTTP. | Importar/normalizar não prova titularidade. Scripts e runtime podem escrever; não foram executados nesta análise. |
| [sql-store](../../../foundation/sql-store.js), migrations 001–010 | Schema/checksums e transações são da instalação física; FKs comerciais compostas impedem referência a outra empresa/unidade. Índices usam prefixo de escopo. | Não alterar migrations aplicadas. Novas relações e índices deverão preservar o prefixo de tenant e ser medidos posteriormente. |
| [server](../../../server.js): venda legada e exports; [commercial-write](../../../foundation/commercial-write.js) | IDP-001 usa `legacy-sale-v1:` e hash de empresa/unidade/usuário/draft. Caminho comercial tem seu próprio fingerprint e escopo verificado. Export temporário depende de sessão/par/expiração; links CSV exigem par esperado. | Não recalcular fingerprints antigos com novos IDs. Replay e download continuam sujeitos ao acesso atual ao recurso original. |
| [domain](../../../domain.js): `company`; [store UI](../../../public/store.js): `companySettings`, `previewReceipt` | `state.company = {name, contact}` é perfil por unidade para comprovante interno sem valor fiscal; `/api/company` grava esse snapshot, não cadastro SQL de empresa. | Terceiro sentido nominal de empresa, separado de tenant e titular. Não usar nome do comprovante como prova jurídica. |
| [foundation-storage](../../../public/foundation-storage.js), [foundation-ui](../../../public/foundation-ui.js), [commercial-ui](../../../public/commercial-ui.js), [foundation-operations](../../../public/foundation-operations.js), [cash-ui](../../../public/cash-ui.js) | Storage usa usuário/empresa/unidade; requisições, filtros, respostas tardias, painéis e exports usam contexto. Sessão também participa da geração de leituras comerciais. | Mudança de chave exige versão e barreira de contexto; rascunho de PF nunca deve reaparecer automaticamente na PJ. |
| [auth React](../../../frontend/src/api/auth.ts), [HTTP React](../../../frontend/src/api/http.ts), [session](../../../frontend/src/session/session.ts), [provider](../../../frontend/src/session/SessionProvider.tsx), [selector](../../../frontend/src/app/ContextSelector.tsx), [App](../../../frontend/src/app/App.tsx) | DTO tipado é par, lista vem do backend, troca oculta estado anterior e reconcilia timeout; seleção não inventa IDs. Campos extras são descartados pela projeção. | Adicionar campo no servidor não basta: DTO, cliente, seleção e testes precisariam de evolução coordenada. Nada alterado nesta fase. |
| Fontes de testes e scripts de medição/validação, listadas a seguir | Fixtures usam pares e dados sintéticos; algumas repetem IDs entre unidades/empresas. Benchmarks/reporters assumem prefixos atuais. | Atualizar fixtures, invariantes e medições em implementação futura; não tratar uma busca/substituição de nomes como homologação. |

### 1.2 Cobertura de testes e ferramentas inspecionadas

Fontes relevantes: `foundation/{entities,access,rbac,identity,request-context,scoped-state,authorization,transactions,audit,execution,migration,runtime.integration,http,frontend,access-v1-2,access-ui-v1-2}.test.js`; famílias `commercial-{products,customers,suppliers,purchases,inventory,sales,read,registration}*.test.js`, `commercial-{purchase,stock,sales-read}-http.test.js`, `inactive-sale*.test.js`, `legacy-sale-{idempotency,retry-ui}.test.js`, `receipt-fk-index.test.js`, testes de balances/accumulators/stock-insert, `sql-backup.test.js`, `backup-service.test.js` e `v1-2-homologation.test.js`. Fixtures em `http-fixture.js` e scripts de mirror/balances usam o mesmo par técnico.

Evidências específicas: `scoped-state.test.js` aceita IDs comerciais iguais em escopos distintos e nega acesso cruzado; `commercial-sales.test.js` preserva snapshots e ordinais; `access-v1-2.test.js` recusa reset de usuário ligado a outra empresa ativa ou inativa; `legacy-sale-idempotency.test.js` verifica escopo, replay, concorrência/reinício e efeito único; `receipt-fk-index.test.js` verifica relação diferida e preservação no upgrade. As fontes React `api/{http,auth,auth-context,auth-mutations}.spec.ts` e `session/{session,session-context,session-mutations}.spec.ts` cobrem projeção, contexto cruzado, timeout e descarte de respostas tardias.

Ferramentas afetadas: `scripts/benchmark-*.js` de foundation, balances, receipt-FK, stock-insert, sync-inventory e HTTP V1.2; `mirror-balance-fixture.js`, `sync-inventory-meter.js`, `validate-{mirror-balances,stock-balances,balance-lookup}.js`, `report-{balance-lookup,sync-inventory}.js`. São consumidores técnicos do escopo, não caminhos de concessão de acesso. Relatórios de performance anteriores não medem a tripla nova. Não executar scripts só pelo nome: importação, inspeção/report e benchmarks podem gerar arquivos ou abrir runtime com migrations.

**Nenhuma suíte executável foi rodada nesta fase documental.** Leitura de teste comprova a existência do caso, não seu resultado atual. Não existe homologação do nível legal ainda ausente. Verificação desta entrega: cobertura documental das tabelas/coleções, links locais, diff e restrição a Markdown.

## 2. O que `company_id` representa hoje

Na prática, é a **raiz de isolamento e de administração dentro da instalação**, pai das unidades, namespace de memberships/papéis e componente de todas as chaves comerciais. É o equivalente técnico atual mais próximo de uma fronteira de tenant; isso não prova que cada cadastro real de empresa represente a Organização conceitual do mestre.

Classificação: **isolamento/tenant técnico atual, agrupamento operacional, escopo de usuário e namespace de políticas/papéis: SIM**. **Propriedade legal PF/PJ verificável: NÃO**. **Compartilhamento empresarial automático de catálogo/clientes/financeiro: NÃO**, pois o namespace comercial efetivo é `(company_id, unit_id)`. **Ownership financeiro:** delimita a partição que contém o financeiro, sem titular jurídico separado. **Auditoria/compatibilidade:** integra eventos, execution, fingerprints, reports, markers e FKs.

Não há CPF/CNPJ, tipo PF/PJ, titular, vínculo de grupo ou contrato em `companies`. Nomes de empresa, papéis chamados Proprietário/Administrador e perfil do comprovante não suprem essa ausência.

## 3. O que `unit_id` representa hoje

É a partição operacional de um conjunto comercial completo sob uma empresa: catálogo, clientes/fornecedores, compras, estoque, vendas, caixa/financeiro transitório e complementos. Também delimita membership, papel atribuído, sessão ativa, revisão do snapshot e leitura de auditoria.

A PK de unidade é `(company_id, id)`. UUIDs são gerados para unidades novas, mas o schema não garante que `unit_id` sozinho seja único globalmente. Não reduzir esse par sem diagnóstico posterior. Campo de unidade de medida do produto (`unit`/`measure_unit`) é outra semântica; posição de estoque, caixa e estação também não são automaticamente uma Unidade organizacional.

Não existe pai legal, endereço legal/operacional completo ou validade temporal do titular. `updateUnit` não muda seu pai atual. Transferências em [positions.js](../../../positions.js) ocorrem entre posições do mesmo snapshot; não homologam transferência entre unidades ou titulares.

## 4. Responsabilidades misturadas e conflitos de interpretação

| Concentração/ambiguidade | Impacto e risco | Tratamento proposto |
| --- | --- | --- |
| Empresa como fronteira de segurança, agrupamento e suposta empresa jurídica na linguagem | Agrupar empresas ou introduzir titular por inferência pode ampliar acesso ou falsificar história. | Separar Org, LegalEntity e Unit; mapear cadastralmente antes de qualquer migração. |
| `companies` SQL versus `state.company` por unidade | Nome atualizado de comprovante pode ser confundido com razão social histórica. | Manter apresentação separada; identidade legal versionada com evidência própria. |
| Papel definido por empresa e atribuído por unidade, mas administração atua sobre a empresa | Promover `users.manage`/`roles.manage` a Org-wide pode afetar outros titulares/unidades. | Especificar escopo administrativo por ação; distinguir editar template de papel e atribuí-lo. |
| Catálogos/CRM e financeiro juntos no snapshot da unidade | Compartilhar dados muda autorização, identidade e sincronização de espelhos. | Direção de base Org/projeções aprovada em P07; adapter e ACL detalhados ainda necessários, sem merge automático. |
| Executor/escopo técnico versus responsável legal | Usar autor da venda como titular atribui obrigação sem prova. | Campos distintos e evidência legal; manter autoria ausente quando ausente. |
| Usuário global versus membro de empresa | Administração de um tenant pode atingir credencial usada em outro; desligamento pode bloquear todos. | Identidade global multi-Org aprovada em P06; administrar membership não concede controle irrestrito de credencial global. |

Não foi provado que o cadastro SQL já seja uma entidade legal. O conflito arquitetural é a **insuficiência da hierarquia e a ambiguidade semântica**, não uma autorização para atribuir PF/PJ a registros existentes.

## 5. Modelo conceitual alvo

```text
Organização X (tenant)
  ├─ Titular A (PF)
  │    └─ Unidade 1
  └─ Titular B (PJ)
       ├─ Unidade 2
       └─ Unidade 3
Organização Y (outro tenant; fronteira independente)
```

**APROVADO:** Organização é tenant; pode conter uma ou várias PFs/PJs simultâneas; uma entidade pode possuir várias unidades; cada unidade tem um único titular; fato histórico preserva seu titular. O backend valida toda seleção e nenhum ID concede acesso.

**APROVADO na direção consolidada:** entidade legal pertence a uma Org; unidade mantém seu titular, e mudança de titular cria unidade sucessora (P03). ID legal é técnico, imutável e não previsível; CPF/CNPJ não é PK (P11). História sem prova usa estado explícito de mapeamento **UNRESOLVED**, separado do tipo PF/PJ (P02/P04). Mudança cadastral não apaga identidade anterior. Coerência de pais no backend e nas relações continua obrigatória; a forma física das constraints ainda será desenhada.

### 5.1 Semântica e exemplos avaliados

| Nível/exemplo | Classificação | Direção e detalhamento remanescente |
| --- | --- | --- |
| Organização como tenant e agrupador dos titulares | APROVADO | Fronteira de isolamento de todos os recursos do cliente. |
| Contrato/assinatura/entitlements | PROPOSTO na Org; detalhamento PENDENTE em D | Org contratante lógica; eventual pagador PF/PJ é relação separada. Cobertura, estados, limites e herança não definidos aqui. |
| Memberships/administração da conta | APROVADO P05/P06 | Identidade global com memberships multi-Org; Owner explícito no scope Org alcança descendentes atuais/futuros. Demais papéis têm scope fechado por padrão. Plataforma/Superadmin separado. |
| Políticas/configurações compartilhadas | P05 APROVA `policy.manage` separado/delegável; demais detalhes PROPOSTOS | Owner não torna policy.manage uma permissão implícita de qualquer papel. Modelo de políticas/configurações e contrato/entitlement ficam para escopo próprio. |
| Titular PF/PJ e propriedade legal histórica | APROVADO | Identidade interna distinta de usuário executor e contraparte. |
| CPF/CNPJ, nome/razão social e dados fiscais | Direção de identidade legal APROVADA P11; requisitos fiscais PENDENTES | Sensíveis protegidos; perfil versionável quando necessário, vigência/proveniência/evidência e alterações sensíveis auditadas. Documentação específica ainda exige revisão fiscal/jurídica. |
| Obrigações financeiras próprias/documentos emitidos | Preservação da obrigação APROVADA P08; detalhes fiscais PENDENTES | Unidade informa origem operacional; consolidação da Org não muda devedor/credor/emissor. |
| Loja, escritório ou filial operacional como Unidade | APROVADO P10: podem ser Unidade | Justificar contexto operacional; não inferir classificação fiscal pelo nome. |
| Depósito | APROVADO P10 | Localização interna por padrão na mesma operação; Unidade somente com autonomia operacional/legal que justifique contexto próprio. Sem classificação automática por label. |
| PDV, caixa, estação/dispositivo e centro de custo | APROVADO P10: não são Unidade | Recursos/dimensões próprios; seus modelos detalhados não são implementados nesta fase. Estação declarada não prova dispositivo confiável. |
| Conta financeira | APROVADO P10 | Pertence à entidade legal e pode ser autorizada para unidades; forma da autorização/tesouraria ainda será especificada. |
| Estoque operacional/endereço operacional | Estoque por Unit/localização APROVADO P07; endereço PROPOSTO | Localização física e proprietário dos bens são dimensões distintas; consignação/terceiros não definidos. |

“Organização” de pessoa/CRM do Core é contraparte externa, não o tenant. Uma pessoa PF pode ser titular ou cliente ou usuário mediante vínculos diferentes; coincidência de documento não concede membership nem funde históricos.

## 6. Alternativas arquiteturais consideradas

**A:** nova Organization; cadastro atual `companies` evolui para LegalEntity — **REJEITADA nesta versão**. **B:** cadastro atual `companies` evolui explicitamente para Organization; nova LegalEntity — **APROVADA P01**, inicial 1:1. **C:** ambos novos; `companies` vira namespace legado com correspondências explícitas e retirada planejada — **REJEITADA nesta versão**. A comparação técnica original abaixo é preservada; nenhum desses desenhos está implementado.

| Critério | A — company vira LegalEntity | B — company vira Organization | C — dois níveis novos |
| --- | --- | --- | --- |
| Compatibilidade | Mantém par legado como legal/unidade, adiciona Org acima de todos os caminhos. | Preserva fronteira/par existente como Org/unidade por adapter versionado; novo pai legal. | Preserva par antigo apenas via mapa e adapter; duas identidades paralelas. |
| Autorização | Papéis/memberships atuais ficam inicialmente legais; novos grants Org precisam ser separados. | Mantém fronteira tenant; grants de unidade continuam restritos, sem promoção Org-wide. | Permite desenho novo explícito; tradução de grants torna-se ponto crítico adicional. |
| História | Só adequada se a empresa realmente for um titular comprovado; PF→PJ dentro da mesma empresa contradiz essa suposição. | Não afirma que empresa era PF/PJ; precisa resolver titular por fato/período. | Representa legado ambíguo melhor, mas mapa externo continua necessário. |
| Migrations futuras | Criar Org/relacionamentos; revisar escopo legal versus tenant em todas as tabelas. | Adição legal e vínculos; compatibilidade nominal de `company_id`; evolução coordenada dos fatos. | Criar Org/Legal/mapas; ampliar FKs/claims e retirar dupla raiz gradualmente. |
| IDs | Company preservado como legal; novos IDs de Org; agrupamento não pode unir por nome. | Company preservado como Org em correspondência 1:1; Legal recebe novos IDs. | Preserva IDs legados e cria dois IDs novos; nada exige reemitir IDs comerciais. |
| FKs | Compostos atuais continuam isolando legal, mas não provam Org do recurso. | Compostos atuais preservam fronteira Org/unidade; adicionar relação legal coerente. | Compatibilidade requer FKs de mapa mais novas relações; maior superfície de erro. |
| Frontend | Seleção nova Org/Legal/Unit; campos company precisam de versão semântica. | Mesmo esforço de tripla, rótulos e DTOs; evita troca imediata dos IDs de tenant. | Tripla nova mais tradução dos drafts/links/par antigo. |
| Testes | Matriz entre titulares do mesmo Org e entre Orgs; impedir elevação por agrupamento. | Matriz com legal intermediário e acessos legados equivalentes. | Testar as duas representações, inconsistências e retirada do adapter. |
| Complexidade/esforço | ALTO; especialmente se várias empresas virarem um único tenant. | MÉDIO na camada organizacional; ALTO ao incluir histórico/segurança dos fatos. | ALTO; maior número de mapas e estados transitórios. |
| Performance | Mais lookup de Org, novos índices; filtro legal não substitui filtro tenant. | Lookup de vínculo legal adicional; índices atuais úteis no escopo exato. | Joins/mapas extras e cache/invalidação; exige medição específica. |
| Manutenção | Mantém nome ambíguo company para legal; administração da Org precisa ser extraída. | Alias legado company para Org precisa de prazo/contrato; hierarquia final simples. | Semântica final limpa, custo transitório maior; risco de legado permanente. |
| Incrementalidade | Possível mantendo Org 1:1 inicialmente; merge posterior é projeto distinto. | Melhor aderência ao escritor híbrido: adicionar vínculo sem reagrupar dados inicialmente. | Possível por adapter; não permitir duas autoridades independentes. |
| Cross-tenant | Alto risco ao agrupar companies e generalizar papéis/reset/consultas. | Menor mudança de fronteira inicial; ainda alto risco de generalizar escopo legal/unidade. | Alto risco de mapa errado/ambíguo ou fallback entre namespaces. |
| Rollback | Antes dos novos fatos é viável com prova; após agrupamento/legal exige recuperação sem perder ownership. | Preservação do par facilita retorno inicial; fatos legais novos impedem retorno cego ao binário antigo. | Adapter favorece retorno inicial, mas dupla identidade complica equivalência; mesmo limite após novos fatos. |
| Mestre | Atende se a correspondência company–titular for provada e Org não for mero rótulo. | Atende se legal/unidade/fato forem modelados realmente, sem só renomear company. | Atende com três níveis finais; compatibilidade não vira quarto nível de negócio. |

**Justificativa da rejeição de A:** pressupõe company como titular que o código não comprova e torna agrupamento uma mudança de segurança. **Justificativa da rejeição de C:** introduz duas camadas novas de correspondência sem necessidade demonstrada. Foram consideradas as hipóteses de cadastro real favorecer A ou uma raiz incompatível favorecer C, mas o proprietário escolheu B. Descobertas futuras não reabrem automaticamente a escolha: eventual alteração exigiria nova decisão explícita e revisão desta direção.

## 7. Direção técnica aprovada — Alternativa B

**APROVADO P01:** company legado **1:1 → Organização → nova Entidade Legal → Unidade**, preservando inicialmente a fronteira atual e sem agrupar companies automaticamente. O fundamento técnico permanece: company concentra isolamento/administração, sem atributos que provem PF/PJ. O aceite do proprietário resolve a escolha arquitetural; não aprova schema ou alteração de código.

`company_id` pode permanecer como chave/alias de compatibilidade durante a transição. Isso é **dívida semântica temporária**: modelo/código novos devem convergir para nomes explícitos `organization`, `legal_entity` e `unit`. A proposta de preservação dos IDs da correspondência 1:1 continua alinhada à preferência do proprietário; unicidade, constraints, adapter e retirada do alias precisam do desenho executável.

**APROVADO P02/P04:** titulares nunca inferidos; mapear unidade/fato com evidência auditável ou manter **UNRESOLVED**, sem impedir preservação/leitura autorizada. Não unir companies ou registros por nome, documento, SKU, login ou similar. A base real permanece fechada nesta fase. A/C ficam rejeitadas nesta versão com análise preservada na §6.

U-A, autoridade, identidade, sharing e gates foram definidos em P03–P12 (§§8–15). Dependem de detalhamento os formatos de mapeamento, adapter/schema, ACL/delegação, plano de testes e recuperação. História UNRESOLVED não bloqueia o desenho estrutural; os dados reais precisarão de tratamento explícito antes de sua migração controlada. Não iniciar migration até os artefatos e a revisão exigidos em P12; deduplicação, entitlement e dispositivos continuam incrementos separados.

## 8. Ownership dos domínios — decisões e propostas remanescentes

Esta tabela separa **autoridade do fato** de catálogo compartilhado, origem operacional e autorização. P05–P11 aprovaram as direções indicadas; detalhes não cobertos pelo aceite permanecem **PROPOSTOS/PENDENTES**. Base compartilhada na Org não concede visibilidade universal aos membros. Nenhum domínio é alterado agora.

| Domínio | Direção / status | Projeção/restrição e detalhamento pendente | Situação atual relevante |
| --- | --- | --- | --- |
| Usuários | **APROVADO P06:** identidade global com memberships multi-Org | Membership/acesso isolado por Org; administrar um tenant não dá controle irrestrito da credencial global. Recuperação/reset global será especificado separadamente. | Global `users`, acesso explícito por company/unit. |
| Papéis/permissões | **APROVADO P05:** Owner explícito no scope Org; demais scopes fechados; `policy.manage` separado/delegável | Owner alcança descendentes atuais/futuros da sua Org, nunca outra. Templates Org/vocabulário global são proposta técnica; representação/delegação/ACL por ação ainda pendentes. | Papéis company; atribuições por unit. |
| Pessoas/clientes | **APROVADO P07:** base Pessoas/Organizações na Org; relacionamentos/visibilidade/uso Legal/Unit | PENDENTE: ACL concreta, consentimento e critérios de deduplicação posterior. Base comum não autoriza leitura ampla nem merge por documento/nome. Fato mantém contraparte histórica. | Clientes separados por unit, sem pessoa comum. |
| Fornecedores | **APROVADO P07:** papel/relacionamento da mesma base comum | Não exigir segunda pessoa duplicada; condições comerciais e uso escopado ainda precisam de contratos. Sem unir legado por nome/documento. | Cadastro separado por unit. |
| Produtos | **APROVADO P07:** catálogo-base Org; projeção/ativação Unit | PENDENTE: schema/projeção, códigos/variantes/UOM e overrides. Nenhum merge automático por SKU/nome/documento; normalização posterior. | Produto e saldo por unit; alias/embalagem no mesmo scope. |
| Preços | **APROVADO P07:** política pode existir na Org; preço aplicável por Legal/Unit/canal/overrides | PENDENTE: precedência, elegibilidade e alçada. `policy.manage` é separado/delegável; não alterar regra de preço atual nesta fase. | Regras/listas/promoções no snapshot unit. |
| Estoque | **APROVADO P07/P08:** operacional por Unit/localização; troca de titular só por fato explícito | Saldo não prova sozinho owner; regras de consignação, trânsito e transferência jurídica/fiscal ainda pendentes. | Razão/balances por unit, posições internas. |
| Compras | Entidade legal compradora/obrigada; unidade de origem/recebimento | DECISÃO PENDENTE: compra central com distribuição a várias unidades/titulares. Contraparte é fornecedor, não titular interno. | Header/receipts/items no mesmo par. |
| Vendas | Entidade legal vendedora; unidade de operação; atores separados | Ownership histórico imutável; retorno/pagamento posterior refere-se à obrigação original. Venda anônima continua possibilidade do mestre, sem inventar CRM. | Header/filhos/execution por unit sem titular legal. |
| Financeiro | **APROVADO P08/P09:** obrigação permanece no titular original; dimensão operacional Unit | Org consolida só com direito/escopo; eliminação intercompany não altera fatos individuais (§8.2). Pendentes tesouraria, transferências suportadas e direitos históricos concretos; continuidade do owner já decidida. | Financeiro embutido em vendas e snapshot unit. |
| Contas financeiras | **APROVADO P10:** pertencem à entidade legal; podem ser autorizadas para unidades | PENDENTE: representação da autorização, caixa central e tesouraria. Conta/caixa não são Unidade nem se fundem por tenant. | Caixa, pagamentos e acordos transitórios unit; não modelo bancário completo. |
| Centros de custo | Templates Org e instâncias Legal/Unit **PROPOSTOS**; P10 APROVA que não são Unidade | PENDENTE: árvores/rateios e consolidação. Não duplicar a classificação obrigatória do mestre com um segundo plano incompatível. | `expenseCenters`/budgets por unit. |
| Serviços | Catálogo Org com projeção legal/unit/profissional | Serviço distinto de produto (mestre §5.2); DECISÃO PENDENTE: execução profissional, preços e tributação. Procedimento atual não comprova domínio de serviços/OS. | Procedimentos internos por unit. |
| Fiscal | Entidade legal emissora, estabelecimento/unidade conforme regra do documento | DECISÃO PENDENTE: emissão, numeração, jurisdição e responsabilidade; integração futura. Documento fiscal não é comprovante interno. | Emissão fiscal ausente. |
| Arquivos | Fronteira Org; ACL herdada do recurso legal/unit | Configurável por domínio; DECISÃO PENDENTE: retenção, versões, storage e classificações. Nenhum link/ID sozinho libera download. | Upload/anexo protegido ainda ausente. |
| Tarefas | Core da Org, escopo herdado do alvo legal/unit/workspace | Assignee não ganha acesso ao documento associado; DECISÃO PENDENTE: compartilhamento/workspaces/automação. | `tasks` no snapshot unit. |
| Auditoria | Fronteira Org; contexto e titular histórico do evento quando comprovado | Eventos técnicos globais separados; chain legado preservado. DECISÃO PENDENTE: âncora externa e retenção. | Chain global ao arquivo, consulta por unit. |
| Integrações | Container de governança na Org; conexão/credencial por legal e atuação unit | Configurável; DECISÃO PENDENTE: fornecedores, emissão e ownership de credenciais. Segredo não vai para contexto/frontend/fingerprint. | Integrações externas de negócio não implementadas. |

## 9. Membership, papel, permissão, escopo e contexto

**Membership:** vínculo que permite participar de uma Org; pode restringir quais titulares/unidades estão disponíveis. **Role:** conjunto nomeado de permissions, sem autoridade por seu nome. **Permission:** ação concreta permitida. **Scope:** recursos/alvos para os quais aquela atribuição vale. **Active context:** seleção autenticada para a operação atual, não novo grant. Contrato/entitlement e estação são controles distintos a especificar em D/E; não aparecem como permissions fictícias neste desenho.

**PROPOSTA:** atribuição vincula sujeito + papel/permissão + escopo tipado Org/Legal/Unit, com pais coerentes e condições verificadas. A decisão é por ação e recurso; não fazer produto cartesiano entre permissões de U1 e escopos de U2. Papel A que vende em U1 e papel B que consulta U2 não concedem venda em U2. Lista de contextos deve projetar apenas combinações autorizadas, sem enumerar titulares externos.

Exemplo: A tem membership em X, grant de venda/leitura sobre PJ1/U1 e PJ1/U2. Pode alternar essas unidades. Não lê/opera PJ2, não concede acesso a ela e não acessa Y alterando IDs. Filtro de listagem em X precisa continuar restrito a PJ1 e aos recursos permitidos; escolher X no seletor não habilita leitura agregada de PJ2.

**APROVADO P05 — Owner de X:** atribuição explícita de scope Org pode alcançar **todas as entidades legais/unidades atuais e futuras de X**, nunca Y. Não inferir Owner por criador, nome do papel ou quantidade de permissões. Esse alcance pertence à atribuição Owner, não a qualquer membership nem ao administrador legado. Administradores, gerentes e outros papéis têm scopes fechados por padrão; novos descendentes só ampliam seus poderes por política/grant explícito. `policy.manage` continua capacidade separada/delegável; plataforma/Superadmin é outro domínio.

Alcance de scope não substitui autorização por ação, estado operacional/histórico ou demais controles. O desenho executável ainda deverá representar o Owner e suas capacidades sem transformá-lo em bypass de segurança. Atribuir/revogar Owner, delegar `policy.manage` e editar templates exigirão contratos auditáveis; não atribuir implicitamente todos esses direitos a quem hoje cria empresa/unidade. Membership em Y do mesmo usuário global não transfere a atribuição Owner de X para Y.

Contexto operacional proposto: Org + Legal + Unit, escolhidos a partir da lista calculada no backend; servidor verifica todos os vínculos/estados/pais e autorização atual antes e dentro da transação. Contexto administrativo Org/Legal sem Unit precisa de endpoint/contrato e permissões específicos; não afrouxar o `assertScope` atual para simular esse caso. **APROVADO P09:** entidade/unidade encerrada admite consulta, auditoria, recebimento/baixa da obrigação original e devolução/reembolso/cancelamento juridicamente aplicável mediante **direito histórico específico**. Isso não reativa criação comercial normal. Códigos/grants/estados e aplicabilidade jurídica ainda serão especificados.

**Gate de ACL aceito em P12:** para recurso legado e ação, `acesso_depois ⊆ acesso_antes`, salvo nova concessão explícita aprovada/auditada. Buscar equivalência no conjunto antigo; **UNRESOLVED não impede preservação/leitura já autorizada**. Grants de unit atuais são traduzidos conservadoramente, jamais promovidos automaticamente a todas as entidades. O alcance atual/futuro do Owner aprovado em P05 depende de **atribuição explícita**, registrada como concessão própria; não é resultado de converter papéis antigos. Isso compatibiliza Owner com a não ampliação automática da migração.

**APROVADO P06:** identidade global com memberships multi-Org. O mesmo usuário pode pertencer a X e Y mediante vínculos independentes; cada operação resolve o contexto de um tenant autorizado. A formulação “dentro do tenant” do mestre §2 continua limite do acesso no contexto, não proibição de memberships globais explicitamente aprovados agora. Preservar usuário/IDs evita regenerar autoria. Administrador de X administra seu membership/acesso, não ganha controle irrestrito da credencial global usada em Y. Desativar vínculo de X não equivale a desativar identidade global. Recuperação/reset global exigirá especificação separada; não relaxar a proteção atual como consequência da aprovação multi-Org.

## 10. PF → PJ, unidade e preservação histórica

### 10.1 Exemplo sintético, sem inferência sobre a loja

Em X, criar titular `L-PF` para João PF com prova cadastral e unidade `U-PF`. Venda `S-2026`, ocorrida em 2026, pertence a `(X, L-PF, U-PF)`. Em 2027 nasce titular **novo** `L-PJ`, João Comércio Ltda, e unidade sucessora `U-PJ`, conforme **U-A aprovada P03**. Venda `S-2027` pertence a `(X, L-PJ, U-PJ)`. U-PF permanece vinculada à PF e ao histórico. Os IDs de S-2026, seus itens/recebimentos/estoque/execution permanecem. Abertura da PJ não troca `L-PF` pelo novo `L-PJ` no passado.

Cancelar, devolver ou receber em 2027 a venda de 2026 mantém a referência à obrigação de João PF. Usuário operando na PJ não ganha automaticamente poder sobre a PF. Exigir acesso histórico e comando explícito no escopo original; qualquer transferência de obrigação entre titulares seria fato próprio autorizado, com contrapartidas/reconciliação e especificação fiscal/financeira posterior. Não usar o titular ativo hoje para resolver operação antiga.

### 10.2 Alternativas analisadas — U-A aprovada, U-B rejeitada nesta versão

| Política | Vantagens | Custos/riscos | Recomendação/status |
| --- | --- | --- | --- |
| **U-A — unidade sucessora com pai legal estável** | U-PF permanece da PF; criar U-PJ sob a PJ. História e grants antigos não acompanham novo titular. Uma única entidade por unidade, sem interpretação temporal adicional. | Mesmo local físico ganha novo cadastro operacional; corte de estoque/caixa/obrigações e novos grants precisa ser explícito. Preserva ID antigo, mas cria um ID para a nova operação. | **APROVADA P03.** Local físico pode ter identidade comum separada futuramente, se necessária; formato da relação de sucessão ainda será desenhado. |
| **U-B — preservar unit_id com vínculo legal temporal** | Mesmo ID representaria continuidade operacional; um único titular em cada instante por intervalos e versão de vínculo. | Grants presos somente a unit_id poderiam seguir para PJ; exige temporalidade para história, backdating, sessão/draft, caixa e movimentos. | **REJEITADA nesta primeira arquitetura P03.** Análise preservada; não desenhar/implementar vínculo legal temporal para o mesmo unit_id. |

U-A preserva U-PF e todos os IDs históricos e adiciona identidade para a nova operação legal. A preferência por preservar IDs não exige reutilizar o ID antigo sob novo titular. U-B não integra o desenho aprovado; eventual reconsideração exigiria nova decisão do proprietário. Versionamento de perfil cadastral de uma entidade legal (P11) **não é temporalidade de titular de unit_id**: a unidade continua sob o mesmo titular. Localização física compartilhada futura não transfere ownership ou grants entre U-PF e U-PJ.

**APROVADO P08 — corte PF→PJ:** encerrar/reconciliar caixa antigo; iniciar novo contexto de caixa na nova unidade. Recebíveis, pagáveis, créditos e obrigações permanecem no titular original, salvo transferência jurídica explícita suportada. Estoque só atravessa titulares por operação/fato explícito apropriado. Quotes, reservas, recorrências e comandos pendentes não mudam silenciosamente de titular. As regras exatas de transferência e seus documentos ficam nos domínios jurídico/fiscal/financeiro; os procedimentos de encerramento/reconciliação ainda precisam de desenho executável.

### 10.3 Identidade histórica e legado sem prova

**Direção APROVADA P11:** entidade legal tem ID técnico imutável/não previsível, tipo real PF/PJ, CPF/CNPJ fora da PK, dados sensíveis protegidos, perfil versionável quando necessário, vigência/proveniência/evidência e alterações sensíveis auditadas. **Proposta física para fatos novos:** gravar Org, Legal, Unit e referência à versão cadastral necessária à história, com executor/aprovador separados. Guardar apenas atributos necessários; nunca consultar nome cadastral atual como substituto do perfil histórico. Diferenciar data do fato, registro no servidor e vigência cadastral. Nenhuma dessas versões muda o titular da unidade; não existe vínculo legal temporal U-B no alvo aprovado. Data do cliente/relógio offline futuro não escolhe titular arbitrariamente.

**APROVADO P02/P04 — legado:** company/unit/execution não provam PF/PJ. Correspondência histórica é explícita, evidenciada e auditável. Estado de mapeamento **UNRESOLVED** permanece quando não há prova. Resolução posterior exige evidência, ator autorizado, motivo/data e auditoria. Não fabricar PF/PJ, CPF/CNPJ, titular, data de corte ou autor. A proposta de mapa por fato/lote deve preservar bytes/IDs e provar homogeneidade; datas sozinhas não provam corte. Formato/status de evidência e autorização de resolução serão definidos no desenho executável.

Histórico UNRESOLVED permanece preservado e legível no escopo autorizado, sem ser anunciado como ownership certificado. O formato do metadado não cria um terceiro tipo de entidade legal. Unidades/fatos legados não resolvidos continuam representados pelo adapter e suas referências originais até resolução; não criar entidade fictícia para preencher uma FK. Unidades alvo e operações novas exigem titular real validado. Isso permite definir a estrutura sem abrir a base real ou resolver previamente todo o passado. Direitos históricos P09 não autorizam inventar titular para efetuar baixa; o contrato executável deverá definir os requisitos de cada comando em histórico ainda UNRESOLVED.

## 11. Impacto tabela por tabela e agregado por agregado

As matrizes seguem a direção **B + mapeamento 1:1 + U-A APROVADA**. `C = company_id`, `U = unit_id`, `R = id`, `O = ordinal`; demais nomes são colunas atuais. “Legal + Unit” significa autoridade legal do fato e origem operacional, sempre sob Org. **Risco** considera alteração futura, não defeito comprovado de cada tabela. A direção está aprovada; detalhes de schema/adapter/migration continuam propostas, sem DDL executada.

Preservações usadas abaixo: **P1:** manter IDs/par legados e mapa explícito; **P2:** manter conteúdo, ordem, ausência/null, extras, datas, valores monetários/quantitativos e referências; **P3:** manter evidências/bytes/hashes históricos, anotar correspondência externamente; **P4:** converter grants no menor scope e provar equivalência; **P5:** encerrar/renovar credenciais transitórias no corte, preservando evidências consumidas. Nenhuma técnica autoriza inventar titular ausente.

### 11.1 Migrations aplicadas — inventário e dependências

| Migration | Responsabilidade atual | Impacto futuro / preservação |
| --- | --- | --- |
| [001_foundation.sql](../../../foundation/migrations/001_foundation.sql) | 15 tabelas: identidade, fronteira company/unit, vínculos, RBAC, sessão, estado, índice, importação, auditoria/meta | Acrescentar modelo e tradução de escopo; preservar cadeia, actors e FKs. Não alterar arquivo/checksum aplicado. |
| [002_products.sql](../../../foundation/migrations/002_products.sql) | Produtos, aliases, packages e markers de normalização | Separar contexto legal de namespace de catálogo, sem fundir produtos. Manter IDs/ordinais/extras. |
| [003_customers.sql](../../../foundation/migrations/003_customers.sql) | Clientes por par | Relação contextual futura; pessoa comum é outra fase. Document genérico não identifica titular interno. |
| [004_suppliers.sql](../../../foundation/migrations/004_suppliers.sql) | Fornecedores por par; presença da coleção no marker | Mesma cautela de CRM e ausente/null; não copiar fornecedor para cadastro legal. |
| [005_purchases.sql](../../../foundation/migrations/005_purchases.sql) | Compras/itens/receipts/receipt-items com FKs compostas e diferidas | Titular comprador mais recebimento operacional, preservando fontes e cadeia até estoque. |
| [006_inventory.sql](../../../foundation/migrations/006_inventory.sql) | Balances/positions/movimentos/entradas; âncoras técnicas e actors | Identificar titular dos fatos/bens com prova; não tratar âncora técnica como operação nova. |
| [007_inactive_sale_approval.sql](../../../foundation/migrations/007_inactive_sale_approval.sql) | Upgrade técnico único de permission e grants de aprovação | Preservar upgrade/auditoria; não repetir promoção de papéis na Org. P5 para grants. |
| [008_access_maintenance.sql](../../../foundation/migrations/008_access_maintenance.sql) | Upgrade técnico único de reset, grants hash-only e índices de manutenção | Preservar proteção de usuário global; revalidar escopo antes/depois da KDF; P5. |
| [009_sales.sql](../../../foundation/migrations/009_sales.sql) | 17 tabelas de venda/projeções, PKs por ordinais e índices de leitura | Titular histórico no header/relação comprovada; filhos seguem fato original, sem reidentificar nested IDs. |
| [010_stock_receipt_fk_index.sql](../../../foundation/migrations/010_stock_receipt_fk_index.sql) | Índice de apoio à FK receipt→stock, sem nova tabela nem unicidade | Preservar cardinalidade e FK diferida; equivalente no escopo novo deve ser medido. |

Migrations são globais ao arquivo SQLite, não uma sequência por Org. [sql-store.js](../../../foundation/sql-store.js) cria também `schema_migrations` para checksums. Total inventariado: **51 tabelas nas migrations + 1 tabela técnica do runner**. Não foi criada migration 011.

### 11.2 Identidade, acesso, persistência e evidência

| Tabela atual | Chave atual | Significado atual | Nível alvo provável | Mudança necessária futuramente | Risco | Preservação |
| --- | --- | --- | --- | --- | --- | --- |
| `companies` | R | Raiz de acesso/admin; nome/status | Org | Mapear 1:1 explicitamente; adicionar titular em estrutura separada | ALTO: falso agrupamento | P1; sem declarar PF/PJ por nome |
| `units` | C,R | Partição comercial/operacional | Unit sob Legal/Org, U-A aprovada | Acrescentar relação legal; mudança de titular cria unidade sucessora, sem reparenting | ALTO: troca de pai/grants | P1; manter unidade original; sem vínculo temporal U-B |
| `users` | R; login único global | Identidade/credencial da instalação | Identidade global multi-Org APROVADA P06 | Separar gestão da credencial e membership; reset global em especificação própria | ALTO: impacto multi-Org/reset | Preservar R, hash e autoria; nunca duplicar credencial por inferência |
| `company_memberships` | user_id,C | Entrada na empresa | Membership Org | Tradução explícita; não grant automático de todos os titulares | ALTO: elevação | P1/P4 |
| `unit_memberships` | user_id,C,U | Entrada na unidade com FK ao membro/pai | Acesso Unit/Legal sob Org | Acrescentar coerência legal e acesso histórico separado | ALTO: grant acompanhar novo PJ | P4; preservar relação antiga/evidência |
| `roles` | C,R; C,name único | Template de permissões da empresa | Template Org | Definir delegação/edição e alcance; manter identidade do template | ALTO: administração ampliada | P1/P4; nome não concede direitos |
| `permissions` | code | Vocabulário técnico global | Global | Mapear ações existentes; novos códigos só em escopo futuro aprovado | MÉDIO: semântica antiga ampliada | Preservar códigos e deny-by-default |
| `role_permissions` | C,role_id,permission_code | Permission do template | Org + template | Manter relação, separar scope da atribuição | ALTO: direito vira universal | P4 |
| `unit_roles` | user_id,C,U,role_id | Grant daquele papel naquela unidade | Assignment com scope explícito | Adaptar preservando combinação ação/recurso e pai legal | ALTO: produto cartesiano de grants | P4; sem herança global presumida |
| `sessions` | R; token_hash único | Identidade global + par ativo nullable | Sessão com contexto Org/Legal/Unit | Evoluir claims internos/CSRF/contexto e revalidação; não divulgar tokens | ALTO: aba antiga e grant obsoleto | IDs históricos mantidos; P5 nas sessões do corte |
| `unit_states` | C,U | Payload inteiro/revisão por unidade | Estado operacional Unit + relação legal | Adapter único e sync coordenado; não reescrever fatos sem prova | ALTO: split-brain/hash | P1/P2; revisão/CAS e mirror verificado |
| `entity_index` | C,U,kind,record_id | Referência a registros indexados do snapshot | Índice derivado de scope autorizado | Reconstrução controlada após equivalência, sem ampliar lookup | ALTO: lookup por ID externo | P1; chave inclui kind/scope |
| `import_runs` | C,U | Prova da importação/origem | Evidência técnica vinculada ao legado | Manter relatório e origem; acrescentar mapa fora da prova original | ALTO: invalidação da equivalência | P3 |
| `audit_events` | sequence; R único | Chain global; evento company/unit ou técnico sem par | Evento Org/Legal/Unit; técnicos globais separados | Novos eventos com semântica nova; mapa de leitura para antigos | ALTO: quebra da cadeia/titular falso | P3; sem UPDATE/DELETE/rehash retroativo |
| `foundation_meta` | key | Config/meta global e algumas chaves com par embutido | Técnico global ou meta de scope explícito | Inventariar valores/chaves codificados; versionar interpretação | ALTO: segredo/marker no tenant errado | Preservar values privados; P1, sem copiá-los para documento |
| `schema_migrations` | version | Versão/checksum global do runner | Infraestrutura física | Novas migrations futuras; nenhuma reinterpretação por tenant | ALTO: checksum/upgrade | Preservar 001–010, checksums e applied_at |

### 11.3 Produtos, clientes, fornecedores e compras

| Tabela atual | Chave atual | Significado atual | Nível alvo provável | Mudança necessária futuramente | Risco | Preservação |
| --- | --- | --- | --- | --- | --- | --- |
| `commercial_products` | C,U,R; ordinal por par | Catálogo/preço/custo/quantidade da unidade | Catálogo-base Org/projeção Unit APROVADO P07 | Adapter/projeção a desenhar; normalização/deduplicação posterior | ALTO: colisão de SKU/ID/visibilidade | P1/P2; não merge por código |
| `commercial_product_aliases` | C,U,product_id,R | Identificação alternativa do produto local | Projeção do produto | Manter FK ao produto e namespace; sharing depende de política | MÉDIO: lookup fora de scope | P1/P2 |
| `commercial_product_packages` | C,U,product_id,R | Apresentação/embalagem local | Projeção do produto | Manter FK; não refazer snapshots históricos das vendas | ALTO: conversão/história | P1/P2 |
| `commercial_normalizations` | C,U,aggregate | Revisão/presença do espelho | Metadado técnico por projeção | Marker versionado e comparação com snapshot; não fingir backfill completo | ALTO: SQL/payload divergentes | P1/P2; registrar versão/equivalência |
| `commercial_customers` | C,U,R | Cliente/contato/document genérico por unidade | Base Pessoa/Organização Org, uso Legal/Unit APROVADO P07 | Desenhar relacionamento/visibilidade e mapa sem merge; normalização posterior | ALTO: unir pessoas/PII indevida | P1/P2; manter contraparte histórica |
| `commercial_suppliers` | C,U,R | Fornecedor por unidade | Papel/relacionamento da base Org APROVADO P07 | Adapter/ACL a desenhar; não mudar referências de compra nem deduplicar automaticamente | ALTO: fornecedor incorreto | P1/P2 |
| `commercial_purchases` | C,U,R | Compra, fornecedor/source e fatos locais | Legal comprador + Unit | Adicionar titular comprovado ao fato/mapa; manter self-FK/source | ALTO: obrigação muda de dono | P1/P2/P3 |
| `commercial_purchase_items` | C,U,purchase_id,O | Linha de compra e produto do mesmo par | Filho do fato Legal/Unit | Herdar relação validada do header; preservar FK produto local | ALTO: cadeia estoque/custo | P1/P2; manter ordinal |
| `commercial_purchase_receipts` | C,U,purchase_id,O | Recebimento de compra; id/request opcionais | Fato de recebimento Legal/Unit | Manter vínculo e ownership válido naquele recebimento | ALTO: receipt transferido | P1/P2; ID ausente continua ausente |
| `commercial_purchase_receipt_items` | C,U,purchase_id,receipt_ordinal,O | Item recebido com vínculos à linha/produto | Filho do recebimento Legal/Unit | Preservar FK composta inclusive item/product; tratar local de recebimento separadamente | ALTO: FK/mirror divergentes | P1/P2; sem consolidar receipts |

### 11.4 Estoque, autorizações e manutenção

| Tabela atual | Chave atual | Significado atual | Nível alvo provável | Mudança necessária futuramente | Risco | Preservação |
| --- | --- | --- | --- | --- | --- | --- |
| `commercial_stock_balances` | C,U,product_id | Saldo materializado/âncora técnica | Unit; titular dos bens explícito | Vincular owner comprovado sem inventar movimento; cortes legais são fatos próprios | ALTO: duplicar/transferir saldo | P1/P2; reconciliação da razão e âncora |
| `commercial_position_balances` | C,U,product_id,position_id | Distribuição física interna da unidade | Projeção Unit | Preservar posição e origem; não transformar posição em unit por nome | ALTO: soma/distribuição | P1/P2; âncoras e somas exatas |
| `commercial_stock_movements` | C,U,R | Fato de estoque com produto/purchase/receipt/actors | Legal + Unit | Ownership histórico e FKs coerentes; referência a receipt permanece | ALTO: histórico/cadeia de custo | P1/P2/P3; prefixo imutável e FK diferida |
| `commercial_position_movements` | C,U,R | Mudança de posição ligada a produto/movimento/ator | Unit + owner do fato | Mesma relação histórica; from/to não são unit_id | ALTO: local trocado | P1/P2/P3 |
| `commercial_stock_entries` | C,U,R | Entrada declarada de produto local | Legal + Unit | Relação owner/contexto sem reexecutar entrada | ALTO: segunda entrada | P1/P2/P3 |
| `inactive_permission_upgrade` | C,role_id | Prova da concessão técnica única 007 | Evidência do template legado | Mapear template e manter audited_at; não reaplicar grants por nova hierarquia | ALTO: ampliar privilégio | P3/P4 |
| `inactive_sale_approvals` | R; token_hash único | Credencial transitória/prova de aprovação consumida | Contexto explícito da operação | Renovar pendentes; preservar venda/request/consumo original | ALTO: replay/autorização em PJ errada | P3/P5; sale_id atual não tem FK SQL à venda |
| `reset_permission_upgrade` | C,role_id | Prova da concessão técnica única 008 | Evidência do template legado | Manter prova; não promover administradores Org automaticamente | ALTO: reset indevido | P3/P4 |
| `password_reset_grants` | R; code_hash único | Reset hash-only alvo/executor no par | Identidade global + scope administrativo | Revisar proteção cross-Org/Legal; encerrar grants pendentes no corte | ALTO: tomar conta global | P3/P5; não logar credenciais |

### 11.5 Vendas e todas as projeções filhas

Na coluna de chave, `S = sale_id`, `I = item_ordinal`, `T = receipt_ordinal`, `D = return_ordinal`, `F = forgiveness_ordinal`, `K = checkout_ordinal`. Todos os filhos preservam FK ao pai com C/U; **ordinais são identidade técnica da projeção, não novos IDs de negócio**.

| Tabela atual | Chave atual | Significado atual | Nível alvo provável | Mudança necessária futuramente | Risco | Preservação |
| --- | --- | --- | --- | --- | --- | --- |
| `commercial_sales` | C,U,R | Venda/cliente/actors/fingerprints/hash/extras | Legal vendedor + Unit | Ownership comprovado; adapter de contexto e replay versionado | ALTO: falso owner/duplicação | P1/P2/P3; fingerprints e hashes antigos preservados |
| `commercial_sale_items` | C,U,S,O | Item/produto local e snapshot comercial | Filho Legal/Unit da venda | Herdar owner; manter produto/snapshot/valores históricos | ALTO: preço/nome/custo reescrito | P1/P2 |
| `commercial_sale_item_packages` | C,U,S,I,O | Snapshot de embalagem, sem FK ao cadastro atual de package | Filho histórico | Manter pacote histórico; não ligar retroativamente a embalagem atual por ID solto | ALTO: conversão alterada | P2; não criar FK histórica inválida |
| `commercial_sale_item_stock_sources` | C,U,S,I,O | Fontes/posição declaradas no item | Filho histórico | Preservar distribuição local; associação owner segue o fato | ALTO: segunda baixa/origem alterada | P2; posição não é unidade |
| `commercial_sale_receipts` | C,U,S,O | Recebimento/cashSession/agreement em projeção | Legal da obrigação + Unit do fato | Relação com venda original, inclusive recebimento após corte | ALTO: saldo PF vira PJ | P1/P2/P3; cash/agreement ainda no snapshot |
| `commercial_sale_receipt_allocations` | C,U,S,T,O | Alocação de receipt a parcelas declaradas | Filho financeiro histórico | Validar cadeia no contexto do pai sem reidentificar parcela | ALTO: baixa duplicada | P2; installment_id não é FK SQL direta |
| `commercial_sale_installments` | C,U,S,O | Parcela de venda | Legal credor + origem Unit | Preservar vencimentos/valores e owner da obrigação | ALTO: recebível muda de titular | P1/P2/P3 |
| `commercial_sale_returns` | C,U,S,O | Devolução referenciada à venda | Legal original + Unit do fato | Comando posterior exige acesso ao owner original | ALTO: restituição no titular errado | P1/P2/P3 |
| `commercial_sale_return_items` | C,U,S,D,O | Linha de devolução/produto local | Filho da devolução | Manter referências produto/sale; não converter catálogo por nome | ALTO: estoque/crédito | P1/P2 |
| `commercial_sale_refunds` | C,U,S,O | Restituição/caixa declarados | Legal da obrigação + Unit | Preservar ligação à venda/devolução e caixa original | ALTO: pagamento duplicado | P1/P2/P3 |
| `commercial_sale_return_allocations` | C,U,S,O | Alocação de quantidades devolvidas/produto | Filho histórico | Herdar owner e FK produto, preservar ordens/quantidades | ALTO: saldo incorreto | P1/P2 |
| `commercial_sale_credit_allocations` | C,U,S,O | Consumo de crédito interno declarado | Legal da obrigação + Unit | Não transportar crédito entre PF/PJ; relação ao snapshot de crédito | ALTO: consumo duplicado/titular | P2/P3; credit_id ainda sem FK SQL ao crédito |
| `commercial_sale_forgiveness` | C,U,S,O | Perdão/ajuste financeiro da venda | Legal da obrigação | Preservar fato/ator e escopo original, sem refazer cálculo | ALTO: saldo perdoado errado | P1/P2/P3 |
| `commercial_sale_forgiveness_allocations` | C,U,S,F,O | Distribuição do perdão | Filho financeiro | Manter alocações e FK ao pai, sem reordenar IDs declarados | ALTO: distribuição financeira | P2 |
| `commercial_sale_checkouts` | C,U,S,O | Checkout registrado | Legal + Unit da venda | Preservar request/intenção/efeitos; novos contratos versionados | ALTO: repetir efeitos | P1/P2/P3 |
| `commercial_sale_checkout_receipt_ids` | C,U,S,K,O | Lista histórica de IDs/valores de receipts | Filho do checkout | Preservar value_json inclusive formato desconhecido; não exigir FK nova sem análise | MÉDIO: histórico incompleto | P2; ordinais/ausências intactos |
| `commercial_sale_pos` | C,U,S,O | POS/turno/estação declarados | Contexto operacional da venda | Manter snapshot; dispositivo confiável é assunto futuro E | ALTO: estação declarada tratada como prova | P2/P3; sem fabricar device ID |

### 11.6 Agregados, snapshots e coleções transitórias

Os seis agregados SQL são: **Produtos**, **Clientes**, **Fornecedores**, **Compras/Recebimentos**, **Estoque/Movimentações** e **Vendas**. Seus headers, filhos e balances estão integralmente nas matrizes anteriores. O escritor atual coordena todos os seis; “migrar um domínio” não autoriza quebrar suas FKs ou espelhos.

As **42 coleções declaradas em [storage.js](../../../storage.js)** também foram inventariadas abaixo; listas desconhecidas/extras e atributos não declarados podem existir em importação e devem ser preservados por P2. Para coleções, a chave usual atual é `(C,U,coleção,id)` dentro do payload; command ledgers possuem formato próprio de request/resultado, não devem ser convertidos em cadastros comuns. Nada abaixo presume que estejam preenchidas na base real.

| Agregado/coleções atuais | Significado e nível alvo provável | Mudança futura / risco / preservação |
| --- | --- | --- |
| `products` (com aliases/packages aninhados), `customers`, `suppliers` | Cadastros locais; direção catálogo/base Pessoa Org com uso/projeção escopados APROVADA P07 | ALTO: merge/visibilidade. Manter par+ID; desenhar adapter/ACL sem normalização ou união automática. |
| `purchases`, `stockMovements`, `stockEntries`, `positionMovements`, `sales` | Fatos relacionais/históricos; Legal + Unit | ALTO: owner/FK/replay. P1/P2/P3; contexto novo coordenado nos seis espelhos. |
| `payables`, `expenses`, `agreements` | Obrigações/despesas/acordos locais; Legal + dimensões Unit | ALTO: saldos/credores. Preservar vínculos purchase/sale/customer/supplier, parcelas/pagamentos; não consolidar por Org. |
| `cashSessions` | Caixa operacional local com movimentos aninhados; Unit + titular | ALTO: corte mistura caixa PF/PJ. Fechamento/transição explícita; preservar movimentos e saldos antigos. |
| `quotes`, `reservations` | Intenções/promessas/conversões locais; owner/contexto na conversão | ALTO: converter PF em PJ involuntariamente. Vincular versão de contexto e política do corte; preservar originais sem converter automaticamente. |
| `inventories`, `positions`, `transfers` | Contagem/posição/transferência interna local; Unit + owner de bens | ALTO: reexecutar contagem/transferência. P2; `transfers` atual não é interunit/interlegal. |
| `quarantineEntries`, `supplierReturns` | Estado físico/retorno ao fornecedor; Legal + Unit | ALTO: quantidade/custo/obrigação. Preservar vínculos produto/purchase/receipts e compensações. |
| `storeCredits` | Crédito/obrigação do titular com cliente; Legal + Unit | ALTO: crédito PF utilizado em PJ sem acordo. P2/P3; sem transferir saldo pelo novo contexto. |
| `deliveries`, `supplierQuotes` | Operação de entrega/cotação local; Legal/Unit do alvo | MÉDIO/ALTO: alvo/titular errado. Preservar IDs e referências; compartilhamento pendente. |
| `priceLists`, `promotions`, `priceReviews` | Políticas/revisões locais; direção Org e preço aplicável Legal/Unit/canal/overrides APROVADA P07 | ALTO: alterar preço ou ampliar alçada. Representação, precedência e regras detalhadas pendentes; P2. |
| `families` | Classificação local de produtos; possível catálogo Org/projeção | MÉDIO: colisão/classificação indevida. Sem normalização por nome/código; P1/P2. |
| `expenseCenters`, `expenseBudgets` | Centros/orçamento local; Legal/Unit com templates Org propostos | ALTO: rateio/DRE. Preservar dimensões/valores; não transformar budget em lançamento real. |
| `purchaseConferences`, `purchaseAmendments`, `purchaseOccurrences` | Conferência/alteração/ocorrência da compra local | ALTO: cadeia receipt/custo. Herdar owner do fato, preservar references/história/execution. |
| `recurringModels`, `recurringOccurrences` | Modelo e ocorrência financeira local; Legal + Unit | ALTO: gerar novo fato no titular errado. Congelar pendentes no corte; modelo novo precisa owner verificado. |
| `procedures`, `procedureExecutions` | Rotinas internas locais; Org/projeção Unit do alvo, pendente | MÉDIO/ALTO: tarefa ganha autoridade. Separar execução/escopo; não declarar como módulo Serviços implementado. |
| `tasks`, `hiddenOperations` | Agenda/visibilidade operacional local | MÉDIO/ALTO: acesso indireto e ocultação cross-scope. ACL do alvo continua exigida; ocultar não remove fato. |
| `operationCommands`, `purchaseCommands`, `quoteCommands`, `cashCommands` | Ledgers de replay do estado local | ALTO: perder identidade/reexecutar. Preservar chaves/conteúdo/resultado/escopo; versionar novos comandos, sem fallback de nova chave. |
| `auditLog` | Histórico declarado antigo, diferente de audit_events | ALTO: autoria/titular inventados. P2/P3; não reclassificar como chain autenticada. |
| `state.company` (objeto, fora das 42 listas) | Nome/contato de apresentação local | MÉDIO: confundir branding com owner. Preservar perfil; cadastro legal separado. |

### 11.7 Constraints e índices: semântica de cada família

**Fundação:** PK/UNIQUE de empresas/usuários/roles não equivalem à identidade jurídica. Login e token hashes são únicos na instalação. FK `(user,C,U)` de sessão/grants e FK `(C,U)` de estados/auditoria estabelecem coerência atual; os CHECKs de par nullable exigem ambos ou nenhum. Nova tripla precisa de coerência equivalente, sem mistura de campos null/legados. Membership unit depende de company; unit_roles depende de membership e role da mesma empresa. Role name é único por empresa, não autorização global.

**Comercial:** PKs/UNIQUE de ordinais e FKs por `(C,U,...)` delimitam produtos, clientes, fornecedores, compras, items, receipts, stock e sales. Preservar referências compostas/self-FK e relações `DEFERRABLE INITIALLY DEFERRED`; recibo pode ter vários movimentos. FK de actor aponta usuário global; titular legal não deve reutilizar essa coluna. Referências apenas declaradas em extras/snapshot (cash session, agreement, créditos, posições e alguns IDs filhos) precisam de diagnóstico antes de impor FK nova; ausência de FK SQL não autoriza unir por ID solto.

| Índices explícitos atuais | Uso semântico | Requisito futuro |
| --- | --- | --- |
| `sessions_by_user` | Revogação/listagem da identidade global | Manter alcance global de credencial; ACL de consulta própria. |
| `audit_by_scope` | Consulta company/unit em ordem de cadeia | Filtrar Org/Legal/Unit autorizados antes da projeção; chain antigo intacto. |
| `products_scope_name`, `products_scope_code`, `aliases_scope_lookup`, `packages_scope_lookup` | Busca de catálogo local | Manter prefixo de scope no adapter; catálogo-base Org/projeção Unit aprovado exige novo contrato/ACL/medição. |
| `customers_scope_name`, `suppliers_scope_name` | Busca CRM local | Não generalizar para todo tenant sem política/ACL. |
| `purchases_scope_supplier`, `receipts_scope_id` | Histórico/receipt local | Manter referências compostas e filtros antes de paginação/contagem. |
| `stock_movements_scope_product`, `stock_movements_scope_receipt` | Razão por produto e apoio à FK receipt | Novos índices precisam preservar cardinalidade/FK e não fazer scans de outros tenants. |
| `inactive_grants_by_session`, `inactive_grants_by_expiry`, `password_resets_by_user`, `password_resets_by_expiry` | Credenciais transitórias/manutenção | Globalidade técnica do purge não vira permissão HTTP; preservar consumo/evidências. |
| `sales_scope_date`, `sales_scope_customer`, `sales_scope_name`, `sales_scope_request`, `sales_scope_executor` | Listagem/replay/autor local | `sales_scope_request` não é UNIQUE; efeito único depende do contrato/transação. Manter listagem SQL sem full payload e versionar replay. |
| `commercial_sale_*_by_sale` (16 índices nas projeções filhas de 009) | Hidratação ordenada dos filhos no par/sale | Manter pais e ordinais; índices técnicos não acrescentam owner. |

Todos os índices implícitos de PK/UNIQUE acompanham as chaves das matrizes. Performance exige medir cardinalidade, planos e custo dos novos lookups em fixture isolada; não há números novos nesta fase. Evitar consultas agregadas sem restrição de scope, materializar o snapshot só para descobrir titular, ou introduzir duplicação de domínio para economizar um JOIN.

## 12. Estratégia de IDs, FKs, snapshots e contratos

**Preservar:** company IDs na correspondência B 1:1; pares de unidade; IDs de users/roles/produtos/pessoas/fornecedores/compras/receipts/estoque/vendas e comandos; ordinais técnicos; execution, valores, datas, extras e referências históricas. **U-A aprovada:** unidade sucessora recebe ID novo; unidade antiga mantém seu ID e titular. Novos titulares precisam de **nova camada de IDs**, pois não existe identidade legal atual para reutilizar com segurança. IDs legais são imutáveis/não previsíveis; CPF/CNPJ não é PK (P11).

**IDs globais do mestre (§2.1):** novos registros devem seguir identidade global não previsível. O legado não prova unicidade global de todos os IDs: importação e testes permitem colisão entre scopes e coleções. Diagnosticar antes de reduzir chaves. Quando houver colisão real ou formato legado incompatível, manter original em snapshot/referência legada e criar somente a identidade canônica adicional necessária, com mapa bijetivo `(C,U,kind,id) → canonical_id`. Não regenerar todo histórico para uniformizar; não usar CPF/CNPJ como PK. Filhos sem ID/repetidos continuam com path/ordinal técnico; não atribuir identidade histórica fictícia.

**FKs preserváveis em B:** pai company–unit como fronteira compatível, membership/role existentes, e referências comerciais compostas dentro do par. **Relações novas futuras:** Legal→Org; Unit→Legal estável e coerente com a mesma Org; referência de sucessão U-A; assignment→scope/pais; fato→titular/perfil histórico comprovado; mapas→referências legadas/evidência. **Sem relação temporal Unit→Legal** nesta arquitetura. Schema/PK/nullable/backfill/adapter de UNRESOLVED precisam de desenho e revisão antes da migration; `legal_entity_id` solto não resolve isolamento. Convergir nomes novos para `organization`, `legal_entity`, `unit`; alias company é temporário.

**Histórico:** audit_events/import_reports/fingerprints não devem sofrer substituição global de company por Org ou Legal. Projeção de leitura pode acrescentar resolução legal através do mapa, com proveniência, sem afirmar que o campo existia no original. Fatos comprovados e novos podem ter referência legal própria, respeitando hash/mirror/versão de schema do fato. Inserir um atributo em `execution` ou extras antigos muda canonical/content_hash: requer formato versionado e estratégia explícita, não edição incidental durante normalização.

**APIs/UI futuras:** adapter documentado para o par legado, DTO/contexto novo versionado, rejeição de mistura de identificadores e continuidade de headers de expectativa/CSRF. Não reinterpretar um `companyId` antigo em Legal numa rota e Org em outra sem versão. Listas, detalhes, exports, permissões de custo/financeiro e endpoints administrativos precisam do mesmo resolved context. Novos campos de Org/Legal enviados pelo cliente continuam sendo candidatos de seleção, nunca prova de autoridade.

**IDP-001:** manter `legacy-sale-v1` e seu contexto C/U/user/draft para reconhecer resultado antigo no scope original, depois de revalidar acesso. Novo fingerprint para intenção nova poderá incluir Org/Legal/Unit sob contrato versionado a revisar, sem introduzir titular temporal de unidade. Não recalcular prova antiga, unir ledgers de duas unidades, reaproveitar intenção PF na PJ ou gerar requestId novo após erro/timeout. `approvalToken` continua credencial transitória, fora da identidade comercial. Caminho comercial novo e command ledgers também precisam de compatibilidade, não só `/api/sales`.

**Storage/links:** prefixo atual de rascunhos `[user,C,U]` e contexto de leitura `[user,session,C,U]` permanecem com versão legada durante transição. Draft pendente só pode ser restaurado se sua intenção/contexto original for válida; não mover silenciosamente para nova tripla. Exports preparados, CSRF, sessão, grants e caches de permissão não atravessam corte sem revalidação. Tokens e documentos pessoais não entram em logs/fingerprints por causa desta migração.

## 13. Riscos de segurança e invariantes de aceite

São riscos do **desenho/migração futura**, não alegação de que esses novos ataques já funcionam na baseline. Os controles atuais company/unit devem ser preservados.

| Risco / evidência atual | Impacto | Controle proposto / dependência |
| --- | --- | --- |
| Agrupar companies em Org e converter membership em acesso total | Cross-tenant ou acesso a PJ/unidade antes negada | Inicial 1:1; comparação ação/recurso e concessão explícita para ampliar. |
| Herança de papel/scope ou produto cartesiano de grants | Operador U1 vende em U2/PJ2 | Grant associa permission ao seu scope; resolução deny-by-default. |
| `adminData` e edição de roles têm alcance company a partir do direito no contexto ativo | Administrador local passa a gerir todas as entidades da Org | Separar scope administrativo; revisão de delegação/visibilidade antes da tradução. |
| Criação de unit copia papéis; criação de company cria raiz com administrador inicial | Novo legal/unidade recebe acesso não aprovado, ou criação de tenant vira ação comercial comum | P05: Owner explícito alcança descendentes atuais/futuros; demais papéis fechados. Contratos distintos e atribuição auditada, sem promoção do criador. |
| Relação Legal→Org ou Unit→Legal verificada só no frontend/ID isolado | IDOR, vazamento em detalhe/contagem/export e escrita externa | Resolver recurso no backend com todos os pais; FKs/joins compostos e DTO allowlist. |
| Consulta compartilhada de catálogo/pessoas/financeiro | Vazamento entre entidades e de dados pessoais | Compartilhamento explícito por domínio; ACL antes de busca/paginação/consolidação. |
| Reparenting de unit_id, risco analisado em U-B | Operador antigo acompanha unidade para PJ não autorizada | U-B rejeitada; U-A mantém pai/ID antigo e cria sucessora. Grants não Owner não acompanham a sucessora automaticamente. |
| Reset global perde a recusa “outra company” depois do agrupamento | Administrador de um titular controla credencial com privilégios externos | Proteger identidade global; revisar todos os tenants/escopos relevantes, antes/depois de await. |
| Lookup histórico deriva titular de cadastro atual | Falsificação de obrigação/história e acesso indevido | Fato/versão imutável ou mapa comprovado; unresolved nunca tratado como titular certo. |
| Rewrite de audit/execution/import/fingerprint | Perda de cadeia/prova e efeito comercial repetido | P3; novos eventos de mapeamento; compatibility versionada e replay autorizado. |
| Fallback “sem legal, usar Org toda” ou “falhou replay, chave nova” | Ampliação silenciosa e duplicação | Falhar fechado no modelo novo; caminho legado delimitado/explicitamente versionado. |
| Restaurar backup físico como se fosse só uma Org | Reverter dados/permissões de outros tenants no mesmo arquivo | Recovery isolado e inventário do alcance; restore per-tenant exige desenho próprio. |
| Credenciais em cadastro/JSON de contexto/debug | Exposição de senha/token/CPF desnecessário | Contexto mínimo, secrets fora do cliente/log/fingerprint, sanitização e acesso explícito. |

Aceites futuros mínimos: trocar/permutar qualquer Org/Legal/Unit não concede acesso; combinações cruzadas e IDs de outra Org negados em leitura/escrita/lista/contagem/export/admin; revogação efetiva em sessão já aberta e após KDF; **zero ampliação automática de grants legados**, distinguindo concessão Owner explícita; snapshots/mirrors/FKs consistentes; cadeia antiga verificável; PF→PJ segue U-A e não altera fatos antigos; retries conservam identidade/contexto e efeito único. Owner X alcança descendente novo de X por sua atribuição Org, mas nunca Y; administrador com scope fechado não acompanha descendente sem novo grant/política. Histórico UNRESOLVED continua legível no scope autorizado.

Testar também identidade repetida entre namespaces legados, role name sem autoridade, membership sem permission, permission em escopo diferente, titular ativo sem direito, unidade encerrada com acesso histórico explícito, comando pendente no corte, autor histórico ausente, campos desconhecidos/null/ordem, falha de auditoria/rollback e resposta tardia do frontend. O novo conjunto exige fixtures Org X/Y, PF/PJ coexistentes, duas unidades da PJ1 e PJ2 negada; a suite antiga por par não basta para provar a tripla.

## 14. Estratégia futura de migração incremental e recuperação

**Estratégia, gates de equivalência/ACL, homologação isolada e limite de rollback APROVADOS P12; execução NÃO autorizada.** A abordagem é extensão/adaptação com **um escritor autoritativo transacional**, leitura paralela apenas para comparação controlada e retirada gradual da compatibilidade. Não criar escritores independentes old/new nem leitura que escolha a resposta mais permissiva. Migration depende de desenho executável, schema proposto, adapter/versionamento, plano de testes, plano de recuperação e revisão do proprietário; nenhum desses artefatos é considerado aprovado só pelo aceite da estratégia.

| Etapa futura | Entrega concreta | Gate antes de avançar | Recuperação/limite |
| --- | --- | --- | --- |
| 0 — decisões/evidências | Aplicar P01–P12 já aprovadas: B 1:1, U-A, identidade/sharing/autoridade; preparar inventário posterior | Estrutura pode ser desenhada sem abrir base real. Migração de dados reais exige mapa e tratamento de UNRESOLVED, sem inferências | Nada estrutural alterado nesta rodada; permanecer na baseline. |
| 1 — desenho executável e ensaio isolado | Especificação de schema/adapter/versionamento, plano de migração, snapshot/mirror, recuperação e critérios de aceite | Revisão do proprietário; fixture sintética representativa; backup/restore consistente validado em destino isolado | Nenhum acesso à base operacional como massa de teste. Não alterar 001–010. |
| 2 — estruturas aditivas e mapeamento | Novos titulares/relações/maps auditáveis, fronteira company 1:1; alias temporário rumo a organization/legal_entity/unit | Correspondências resolvidas unívocas; UNRESOLVED explícito/preservado/legível; FKs/adapters íntegros, P1–P3; nenhum fato atribuído por default | Antes de fatos novos, retorno comprovado ao leitor/escritor compatível; preservar mapa/evidências. |
| 3 — autorização/contexto | Resolver Org/Legal/Unit, identidade/memberships, Owner/escopos fechados/históricos; adaptar sessão/CSRF/headers/exports/UI | Matriz de equivalência de grants e concessões explícitas; testes cross-scope/revogação/descendentes; sem ampliar automaticamente direito legado | Flag/corte controlado; suspender escrita sem contexto válido, sem fallback aberto nem bloqueio da leitura histórica autorizada. |
| 4 — ownership de fatos e cortes | Referência legal de novos fatos; leitura de histórico comprovado/pendente; política PF→PJ e caixa/obrigações/intenção | Prova por fato/lote; datas/vínculos/replay/approvals preservados; sem reexecução de venda/entrada | Após fatos com legal novo, binário antigo não é rollback seguro: ele ignora a autoridade nova. |
| 5 — adaptação coordenada por incremento | Especificar/ajustar domínio e dependências, mantendo único saveBusinessState/atomicidade | Começar por contexto/cadastro estrutural; depois fatos conforme dependências compra→receipt→stock e sale→stock/receipt/credit/finance. Cada gate testa todos os espelhos afetados | Comparação de leitura shadow com resultado sem autoridade; interrupção ao divergir. Não migrar header isolado de suas FKs/filhos. |
| 6 — equivalência, desempenho e homologação | Comparar snapshots/SQL/maps, histórico, consultas, ACLs e retries; planos/latência em base sintética | IDs/contagens/hash/ordem/ausência/null/valores e saldos equivalentes; scope/tempo medidos; aprovação operacional | Parar escritor em divergência; recuperação compatível com novo modelo e auditoria preservada. |
| 7 — retirada da compatibilidade | Remover alias/adapters antigos apenas após consumidores e pendências resolvidos | Nenhum client/link/draft/command suportado exige semântica velha; restore antigo tem caminho de upgrade validado; aceite próprio | Não apagar evidência/mapa histórico nem referência antiga de snapshots. |

**Corte operacional futuro — princípios APROVADOS P08/P09:** encerrar/reconciliar caixa antigo e iniciar caixa no contexto novo; preservar obrigações/créditos no titular original; estoque cruza titular só por fato explícito apropriado. Revisar compras, recurringOccurrences, quotes/reservations, requests, grants, exports, abas e drafts; nenhum pendente migra silenciosamente. Retry de venda confirmada recupera o resultado original com acesso revalidado; intenção não executada não vira venda da PJ por trocar contexto. Procedimento para concluir antes do encerramento, cancelar explicitamente ou preparar nova intenção exige desenho próprio. **Depois de encerrada, a unidade antiga não recebe permissão normal de novas vendas por direito histórico.** Nova identidade decorre de nova intenção legítima, jamais de erro técnico. Testar restart/falha no commit/auditoria.

**Provas de equivalência:** inventário de IDs e escopos; contagens por coleção/tabela; canonical/presence/extras; revisão/markers; valores exatos (sem float/arredondamento novo), razão/âncoras/saldos/posições; referências e constraints; execução/ausência de ator; import source_hash/report; cadeia de auditoria; requests/fingerprints/receipts/credits; concessões de leitura, escrita e administração. Checksums 001–010 permanecem iguais. Recursos deriváveis podem ser recalculados sob prova; fatos e provas históricas não são substituídos silenciosamente.

**Recuperação:** antes de novos fatos legais, validar retorno ao código compatível sobre dados aditivos sem perder acesso/semântica. Depois, preferir correção forward/versão compatível, suspensão seletiva ou modo de leitura com ACL preservada; código velho não pode continuar criando fatos sem titular. Restore completo deve preservar plano de reconciliação das operações posteriores, escopo de todos os tenants atingidos e evidência auditável; nunca apagar fatos novos para declarar rollback bem-sucedido. O backup atual é físico da instalação; não promete restore de uma única Org. RPO/RTO e infraestrutura permanecem abertos no mestre.

Não há alteração de regra de preço, estoque negativo, precisão/UOM, Products/Finance internals, dependências, React, entitlement ou devices prevista como arrasto automático desta especificação. Cada mudança necessária futura recebe seu escopo e aprovação próprios. Fase D continua não iniciada.

## 15. Registro aprovado, pendências reais e conciliação

### 15.1 ORG-P01–P12 — APROVADAS / PLANEJADAS

**Fonte de todas as aprovações:** pedido explícito do proprietário “FASE C — ORG-001 — CONSOLIDAÇÃO DAS DECISÕES DO PROPRIETÁRIO”, 05/10/2026. As decisões abaixo substituem os estados PROPOSTO/DECISÃO PENDENTE da primeira entrega no seu alcance exato. Nenhuma foi implementada nesta consolidação.

| ID | Status | Decisão consolidada | Consequência / limite |
| --- | --- | --- | --- |
| ORG-P01 | **APROVADA** | B: company legado 1:1→Org→nova Legal→Unit; sem agrupamento automático | company_id é compatibilidade temporária; modelo/código novos convergem para organization/legal_entity/unit. A/C rejeitadas nesta versão. |
| ORG-P02 | **APROVADA** | Nenhuma PF/PJ inferida; mapa histórico explícito, evidenciado/auditável; UNRESOLVED preservado/legível | Base operacional não precisa ser aberta nesta fase. Dados concretos serão levantados em escopo posterior. |
| ORG-P03 | **APROVADA** | U-A: mudança de titular cria unidade sucessora; antiga conserva titular/história | U-B rejeitada nesta primeira arquitetura. Local físico comum futuro é identidade separada, se necessária. |
| ORG-P04 | **APROVADA** | Estado de mapa não resolvido; sem fabricar PF/PJ, CPF/CNPJ, titular, corte ou autor | Resolução exige evidência, ator autorizado, motivo/data e auditoria. |
| ORG-P05 | **APROVADA** | Owner é atribuição explícita Org que alcança descendentes atuais/futuros daquela Org | Não inferir por criação/nome/permissões. Demais papéis fechados por padrão; ampliação exige política/grant explícito. policy.manage separado/delegável; plataforma/Superadmin separado. |
| ORG-P06 | **APROVADA** | Identidade global com memberships multi-Org independentes | Administrar membership do tenant não dá controle irrestrito da credencial global. Recuperação/reset global em especificação separada. |
| ORG-P07 | **APROVADA** | Pessoas/Organizações na Org com uso/visibilidade/relacionamento Legal/Unit; fornecedor como papel; produto-base Org/projeção/ativação Unit | Estoque Unit/localização; preço por Legal/Unit/canal/overrides, com política possível na Org. Sem união por nome/SKU/documento; normalização posterior. |
| ORG-P08 | **APROVADA** | Corte encerra/reconcilia caixa antigo e inicia contexto novo; obrigações/créditos no titular original | Estoque e transferência jurídica suportada exigem fatos explícitos. Pendentes não seguem silenciosamente a PJ. Regras jurídicas/fiscais em seus domínios. |
| ORG-P09 | **APROVADA** | Histórico encerrado admite consulta/auditoria e baixa/recebimento/devolução/reembolso/cancelamento juridicamente aplicáveis por direito histórico específico | Não reativar capacidade normal de criar novas operações. Códigos/matriz de ações ainda a desenhar. |
| ORG-P10 | **APROVADA** | Loja/filial/escritório operacional podem ser Unit; PDV, estação/device, caixa, centro de custo não são Unit | Conta financeira pertence à Legal e pode ser autorizada a Units. Depósito interno por padrão; Unit só com autonomia justificada. Sem classificação por label. |
| ORG-P11 | **APROVADA** | Legal: ID técnico imutável/não previsível, PF/PJ real, CPF/CNPJ não PK, sensíveis protegidos, perfil versionável, vigência/proveniência/evidência e alterações sensíveis auditadas | Exigências documentais/fiscais específicas permanecem para especificação posterior. Perfil versionado não troca titular da unidade. |
| ORG-P12 | **APROVADA** | Migração incremental, equivalência/ACL, homologação isolada e limite de rollback aceitos | Migration só após desenho executável, schema proposto, adapter/versionamento, plano de testes/recuperação e revisão. Sem RPO/RTO inventado. |

### 15.2 Pendências reais — não reabrem as decisões acima

| Referência | Detalhamento ainda aberto | Efeito sobre o próximo desenho |
| --- | --- | --- |
| ORG-T01 — mapa/evidência | Formato de UNRESOLVED/resolução, proveniência/período, autorização concreta do resolvedor, granularidade fato/lote e adapter de leitura | Bloqueia conclusão do contrato executável do mapa; não exige ler base real nesta consolidação. |
| ORG-T02 — ACL/Owner/histórico | Representar atribuição/revogação Owner, scopes fechados/delegação, policy.manage separado, matriz e códigos de direitos históricos por ação | Bloqueia desenho executável de acesso; alcance Org atual/futuro do Owner já está decidido. |
| ORG-T03 — credencial global | Recuperação/reset, convites e efeitos de desativação do membership versus usuário global | Especificação separada. O incremento organizacional precisa preservar proteção atual e definir seus limites, sem controle global por admin de tenant. |
| ORG-T04 — schema/adapter/IDs | Modelo físico, FKs/constraints, mapa de colisões, representação de sucessão U-A, nomes/alias, contratos de contexto/DTO e writer/mirror versionados | Bloqueia desenho executável; não autoriza produzir/aplicar schema nesta rodada. |
| ORG-T05 — sharing/projeções | ACL de visibilidade/uso, ativação Unit, referências legadas sem merge; precedência de preços/overrides/canal | Direção P07 fechada; especificar só contratos necessários ao incremento, sem antecipar normalização ou refazer preços. |
| ORG-T06 — corte/intenção | Procedimento de fechamento/reconciliação, requests/drafts/quotes/reservas/recorrências, acesso a obrigações UNRESOLVED, versão de replay | Princípios P08/P09 fechados; faltam comandos/estados/aceites operacionais e preservação de efeito único. |
| ORG-T07 — regras jurídicas/fiscais | Documentos legais exigidos, transferências intertitular suportadas e aplicabilidade de devolução/reembolso/cancelamento | Escopo dos respectivos domínios. Não precisa resolver toda legislação para desenhar a hierarquia; transferência não especificada não pode ganhar suporte presumido. |
| ORG-T08 — demais domínios | Compras centralizadas, tesouraria, árvores/rateios de centros, serviços, arquivos, tarefas, integrações, retenção/âncora externa | Propostas não cobertas por P01–P12 continuam propostas. Não bloquear a fundação com implementação antecipada de todos esses domínios. |
| ORG-T09 — validação/recuperação | Plano de testes e equivalência/ACL, fixtures, cobertura de falhas/restart, recuperação compatível após fatos novos e retirada do alias | Gates P12 aceitos; planos, ensaios e revisão ainda pendentes. RPO/RTO não congelados. |
| ORG-T10 — correspondência real | Titulares/unidades/períodos reais, evidências e colisões do legado | Levantamento autorizado antes de migrar dados reais; não impede desenho estrutural/sintético. Sem resolver por heurística. |

Contrato/entitlement e estação/cloud permanecem escopos D/E, **não iniciados**. Nenhuma pendência autoriza ampliar esta rodada.

### 15.3 Contradições e diferenças com o estado atual

**Não identificada contradição interna entre P01–P12 e a hierarquia aprovada.** Foram conciliadas as seguintes tensões, sem alterar código ou o mestre:

- **Owner × não ampliação de ACL:** a atribuição Org explícita cobre descendentes atuais/futuros; tradução de papéis legados não cria Owner. Novas concessões são auditadas e distinguidas da prova de equivalência.
- **U-A × preservação de IDs:** manter ID da unidade antiga e de seus fatos; criar ID para a sucessora, sem reparenting nem reidentificação histórica. Perfil legal versionado não ressuscita U-B.
- **Identidade global × isolamento:** usuário participa de várias Orgs por memberships independentes; cada ação pertence a tenant/scope autorizado. A credencial global não é propriedade administrativa irrestrita do tenant.
- **Sharing Org × acesso Legal/Unit:** base comum é ownership do cadastro, não grant de visibilidade universal. ACL/projeções mantêm uso escopado; nenhum merge automático do legado.
- **UNRESOLVED × titular obrigatório no alvo:** metadado do mapa/adaptação do legado preserva consulta autorizada sem Legal fictícia; unidade/fato alvo novo exige titular real. O contrato para comandos sobre obrigações ainda não resolvidas permanece T06.

**Gaps perante a implementação, não novas decisões abertas:** `companies` ainda não modela Org explícita/Legal; papéis/memberships e sessão ainda são C/U; Owner Org não existe; catálogo/CRM permanecem por unit; helpers de acesso exigem pais ativos e não modelam os direitos históricos P09. Reset atual protege credencial multiempresa por recusa; futuro multi-Org não pode remover essa proteção sem contrato. Essas diferenças foram documentadas e não corrigidas nesta fase.

## 16. Perguntas antes do desenho executável e de qualquer migration

Numeração da primeira entrega preservada para rastreabilidade. A aprovação resolve escolhas conceituais; contratos técnicos, validação e autorização de execução não são presumidos.

| Pergunta original | Estado após consolidação | O que ainda falta / gate |
| --- | --- | --- |
| **1 — alternativa/correspondência tenant** | **Escolha RESOLVIDA P01/P02:** B 1:1, sem agrupamento; alias temporário | Correspondências reais/casos ambíguos T10 serão levantados antes de backfill real, sem reabrir B nem exigir base operacional para desenho estrutural. |
| **2 — prova do titular/UNRESOLVED** | **Política RESOLVIDA P02/P04/P11** | **Impede fechar desenho executável:** formato/mapa, prova, fluxo de resolução e ACL do resolvedor (T01/T04). Dados concretos pendentes T10 são gate da migração real. |
| **3 — U-A ou U-B** | **RESOLVIDA P03:** U-A; U-B rejeitada | Sem pergunta de temporalidade a responder. Representação da sucessão/identidade de unidade permanece parte do schema futuro T04, sem localização comum antecipada. |
| **4 — ACL/admin/Owner/histórico/global** | **Direção RESOLVIDA P05/P06/P09/P12** | **Impede fechar desenho executável:** matriz ação/recurso, atribuições/delegação, direitos históricos e limites da credencial global (T02/T03). |
| **5 — IDs/FKs/schema/adapters** | Preservação e direção B/U-A aprovadas; formato físico não definido | **Impede fechar desenho executável:** constraints, collision map, UNRESOLVED, nomes e adapter reversível (T04). |
| **6 — equivalência/formato/hashes** | **Gate RESOLVIDO P12:** equivalência exigida, sem rewrite de provas | **Impede fechar desenho executável:** writer/markers/mirrors/maps/formato versionado e roteiro de prova (T04/T09). |
| **7 — UI/API/contexto/CSRF/cache** | Invariantes de isolamento mantidas; contratos novos não desenhados | **Impede fechar desenho executável:** adapter/DTOs e política de draft/export/resposta tardia (T04/T06). Não modificar UI agora. |
| **8 — corte PF→PJ/obrigações/pendentes** | **Princípios RESOLVIDOS P08/P09** | **Impede fechar desenho executável:** procedimentos, estados e comandos explícitos antes/depois do corte, inclusive UNRESOLVED (T06). |
| **9 — replay antigo e novo** | Efeito único/scope original e ausência de chave nova automática permanecem invariantes | **Impede fechar desenho executável:** versão do contrato/fingerprint, revalidação histórica e testes de restart/falha (T04/T06/T09). |
| **10 — transferência jurídica/fiscal** | **Princípio RESOLVIDO P08:** fato explícito suportado; nenhuma transferência automática | Regras, documentos e autoridade concreta T07 permanecem abertas para o domínio que suportará transferência. Não são condição para escolher/desenhar B; não presumir suporte no primeiro incremento. |
| **11 — recuperação/ensaios/rollback** | **Estratégia/limite RESOLVIDOS P12** | **Impede fechar desenho executável:** plano de recuperação compatível e de ensaios; ensaios isolados serão gate antes de executar (T09). Nenhum RPO/RTO escolhido. |
| **12 — escopo/revisão/autorização** | **RESOLVIDA:** esta rodada somente consolidação; P12 não autoriza migration | Schema proposto, desenho executável, adapter/versionamento, planos de testes/recuperação e revisão do proprietário são gates obrigatórios. Implementação/commit/push precisam de autorização própria. |

Assim, **2 e 4–9 e 11** conservam detalhamentos que impedem fechar um desenho executável; **1 e 3** têm a escolha estrutural resolvida; **10** é especificação do domínio de transferências; **12** fixa o gate de revisão/autorização. Inventário real T10 e ensaios não foram executados nem são exigidos para esta consolidação documental.

### Registro desta entrega documental

Na entrega inicial, criado este documento e atualizados índices/roadmap para refletir B checkpoint e C em revisão. **Nesta consolidação:** revisado este documento integralmente e atualizados apenas `PROJECT_MASTER.md`/`ROADMAP.md` quanto ao novo estado de C; README conserva sua alteração anterior, documentos históricos intactos. P01–P12 aprovadas, A/C e U-B preservadas como rejeitadas nesta versão; pendências reais e perguntas residuais identificadas. Código, migrations 001–010, schema, testes executáveis, dados, dependências, APIs e interfaces não modificados. Nenhum banco aberto, runtime/suite executado ou credencial/dado operacional incorporado. **Sem commit/push e sem início de D. Aguardando revisão documental do proprietário.**
