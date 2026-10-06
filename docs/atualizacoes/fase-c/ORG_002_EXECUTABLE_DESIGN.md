# ORG-002 — Desenho executável do modelo organizacional

**Data:** 06/10/2026. **Status: DIREÇÃO GERAL APROVADA; AJUSTES FINAIS DOCUMENTAIS PARA REVISÃO, SEM AUTORIZAÇÃO DE CHECKPOINT.** Fase C, somente documentação. Nenhuma estrutura abaixo existe por causa desta entrega; nenhum SQL ilustrativo foi executado. O pedido posterior do proprietário “ORG-002 — Ajustes finais da revisão” aprova as escolhas indicadas na §1.1 e exige os ajustes desta versão. Aprovação conceitual/física não autoriza migration, backfill, implementação, checkpoint ou Fase D.

**Baseline inspecionada:** `d576075f93d3c2f3d6378f90542ea71c5fedc19d`, branch `v1.3-frontend`, árvore limpa na entrada. Esse checkpoint registra ORG-001; seu pai `038733102de9ae05a12e69b522e782243c5e8a54` registra IDP-001. Código, testes e migrations 001–010 continuam sendo a fonte da implementação. Não foi aberto o banco operacional.

## 1. Fontes, responsabilidades e resultado da análise

Referências obrigatórias: [AGENTS](../../../AGENTS.md), [Documento Mestre v1.0](../../../Documento_Mestre_Sistema_Comercial_v1.0.md), [ORG-001 integral](ORG_001_SPEC.md), [índice vigente](../../atual/PROJECT_MASTER.md), [roadmap](../../atual/ROADMAP.md) e [migrations 001–010](../../../foundation/migrations/). Apoio: arquitetura, banco, API, segurança, ameaças e inventário de 51 tabelas da ORG-001 §11. O mestre, especialmente §§2–8 e 15–18, estabelece produto, limites de confiança e integridade; ORG-P01–P12 consolidam as escolhas do proprietário. Esta proposta não substitui essas fontes.

Os especialistas foram usados como papéis de revisão, lendo suas definições, sem reativar diretor/tester antigos nem criar processos permanentes:

| Papéis | Responsabilidade nesta entrega | Entrega |
| --- | --- | --- |
| Arquitetura / Banco | Relações físicas, invariantes, SQLite e compatibilidade | Comparação física, catálogo de estruturas, constraints e transição |
| Segurança / Backend | Identidade, ação/recurso, contexto e replay | ACL fechada, Owner explícito, resolver e contratos versionados |
| Produto / Interface | Histórico, corte de titular e consumidores | Matriz de ações/corte, isolamento de drafts e respostas |
| QA / Infraestrutura | Equivalência, falhas, concorrência e recuperação | Matriz de testes futuros, gates e limites de rollback |
| Documentação | Fontes, estados e rastreabilidade | Desenho revisável, pendências e índices mínimos |

**Conclusão técnica:** não foi identificada inviabilidade de B, U-A ou ORG-P01–P12. As adaptações exigem autorização futura e cuidado com o runtime híbrido. Uma eventual evidência posterior de inviabilidade interrompe o incremento para revisão do proprietário; não autoriza substituir U-A por U-B ou agrupar tenants. Há pendências físicas e operacionais na §25, todas separadas das decisões conceituais já aprovadas.

### 1.1 Aceite e fonte dos ajustes finais

Na entrada desta revisão, HEAD continuava `d576075f93d3c2f3d6378f90542ea71c5fedc19d`; os únicos pendentes eram este documento e os dois índices documentais da entrega anterior. A árvore limpa mencionada na baseline refere-se ao início original da ORG-002, não à entrada destes ajustes. Fonte: instrução explícita do proprietário enviada como “FASE C — ORG-002 — AJUSTES FINAIS DA REVISÃO”, em 06/10/2026.

| Decisão/diretriz | Status nesta revisão | Impacto |
| --- | --- | --- |
| Opção 2, binding separado; companies única identidade física de Org | **APROVADA pelo proprietário** | Sem segunda tabela/ID tenant; alternativas permanecem justificativa histórica |
| Preparação corrigível por supersessão; binding inserido somente aprovado/publicável | **APROVADA pelo proprietário** | Preservar Unit em erro pré-publicação; INSERT é publicação autoritativa e irrevogável por UPDATE/DELETE |
| Legal PROVISIONED antes de ACTIVE/SUSPENDED/CLOSED | **APROVADA pelo proprietário** | Cadastro em validação não é contexto operacional nem produz fato; ativação explícita |
| Múltiplos Owners e proteção administrativa do último efetivo | **APROVADA pelo proprietário** | Mantém exceção de contenção por incidente/HOLD e autorização por ação |
| Grants selados com origem imutável da versão do template; aplicação de nova versão explícita | **DIRETRIZ APROVADA** | Revisões normalizadas e FK propostas na §8.1; detalhes DDL/UX ainda revisáveis |
| Autoria única, protocolo controlado, proteção CPF/CNPJ e migrations pequenas | **DIRETRIZES CONSOLIDADAS pela instrução** | Escolhas técnicas §§10–11/15; sem dados reais, algoritmo próprio ou schema completo em 011 |

Não foram detectadas contradições residuais com P01–P12 após revisão integral. Ambiguidades da versão anterior foram corrigidas: proposta não é binding publicado; PROVISIONED não é Legal operacional; contexto factual não é outro registro de executor; versão de aplicativo não é protocolo; catálogo completo não é primeira migration. Os mecanismos ainda sujeitos à revisão técnica estão na §25. Nada foi implementado ou certificado em banco.

## 2. Estado real e pontos de integração

| Evidência ATUAL | Implicação para o desenho PLANEJADO |
| --- | --- |
| [001](../../../foundation/migrations/001_foundation.sql): `companies(id)`; `units(company_id,id)`; usuários globais; memberships compostas; sessão com par C/U | Preservar IDs e o namespace composto. Não supor que todo ID importado seja globalmente único. |
| [entities](../../../foundation/entities.js): cria UUIDs; `updateUnit` só altera nome/status | Manter ausência de reparenting na API e acrescentar proteção física futura. `companies.name` não prova titular. |
| [access](../../../foundation/access.js), [rbac](../../../foundation/rbac.js), [identity](../../../foundation/identity.js) | Acesso e contexto atuais exigem pais/vínculos ativos; permissões são por unidade. Não existe Owner Org explícito. O papel “Proprietário inicial” não é evidência de P05. |
| [admin](../../../foundation/admin.js): lista dados do tenant e copia papéis do criador para unidade nova; criação de company cria outro tenant | Não reutilizar essa cópia como herança alvo. Criar Legal não é criar company. Administração terá filtro de recurso, não apenas permissão na unidade selecionada. |
| [auth-maintenance](../../../foundation/auth-maintenance.js), `resetTarget` | Reset atual bloqueia alvo vinculado a outra company, inclusive vínculo inativo. Isso não implementa recuperação global nem autoriza tenant a controlar credenciais globais. |
| [request-context](../../../foundation/request-context.js), [authorization](../../../foundation/authorization.js), [scoped-state](../../../foundation/scoped-state.js) | Headers atuais são expectativas, não autoridade; CSRF e escopo são revalidados. `inactive` hoje impede também leitura: CLOSED exige novo caminho histórico, sem relaxar a guarda atual globalmente. |
| [state-repository](../../../foundation/state-repository.js), [commercial-store](../../../foundation/commercial-store.js), [inventory-store](../../../foundation/inventory-store.js), [sales-store](../../../foundation/sales-store.js) | Escritas transacionais mantêm SQL, snapshot, índice e auditoria coerentes. Há substituição de linhas em mirrors: futuras FKs de contexto factual precisam suportar o ciclo transacional sem CASCADE/destruição de evidência. |
| [migration](../../../foundation/migration.js): source hash, igualdade canônica, IDs/centavos/ausência/extras, import por C/U | Backfill organizacional é outra operação. Não reimporta a origem nem chama o comando de venda ou `writeState` para preencher histórico. |
| [audit](../../../foundation/audit.js): cadeia física global; triggers append-only em 001; consultas por C/U | Não recalcular a cadeia antiga. A ligação Org/Legal futura será metadado associado a evento novo, sem expor a cadeia inteira a clientes. |
| [execution](../../../foundation/execution.js): executor autenticado e escopo técnico nos fatos novos | Executor não é titular legal. Vínculos usados por `actorColumns` e permissões atuais terão adaptação explícita; não fabricar authors antigos. |
| [sql-store](../../../foundation/sql-store.js): constructor abre banco, cria diretório, ativa WAL e migra; checksum e `BEGIN IMMEDIATE` síncrono | Não instanciar na rodada documental. No futuro, DDL aditivo em transação e implantação controlada; não manter transação aberta durante KDF/HTTP. |
| [server](../../../server.js): `legacy-sale-v1:` usa C/U/usuário/draft; [commercial-write](../../../foundation/commercial-write.js) possui contrato distinto | Preservar exatamente o replay atual por versão e scope; não converter fingerprints antigos para Legal. |
| [store legado](../../../public/store.js): intenção/payload preparados, chave preservada no erro; storage e cliente isolam C/U | Evoluir namespace e invalidar UI antiga por contrato, sem copiar intenção para a sucessora. |
| [frontend React](../../../frontend/README.md): sessão/contexto/HTTP/Design System, sem Produtos React | Adaptar tipos, geração de requisições e contexto futuramente; não iniciar migração comercial nesta especificação. |

Migrations conferidas: 001 fundação; 002 Produtos; 003 Clientes; 004 Fornecedores/presença; 005 Compras e filhos; 006 Estoque; 007 aprovação excepcional; 008 manutenção de acesso; 009 Vendas e 16 tabelas de filhos; 010 índice de FK de recebimento. São **51 tabelas declaradas**, além de `schema_migrations` criada pelo migrador. Nenhum checksum será editado. Valores em centavos inteiros e quantidades exatas continuam intactos.

## 3. Invariantes e vocabulário do alvo

```text
Organization (tenant; ID da company preservado)
  └── LegalEntity (PF OU PJ real; identidade imutável)
        └── Unit alvo (titular imutável)

Unit legada sem prova → namespace preservado + resolução UNRESOLVED
                      → não é Unit alvo apta a produzir fato novo com Legal
```

1. Toda Legal pertence a uma única Org; toda Unit alvo tem exatamente uma Legal na mesma Org. Chaves estrangeiras incluem Org, mesmo com UUID global novo.
2. IDs técnicos, `organization_id`, tipo PF/PJ e titular da Unit são imutáveis. Mudar titular cria Legal quando necessária e **outra Unit**. Corrigir cadastro cria perfil, não outra identidade temporal.
3. Não criar Legal `UNKNOWN`, CPF/PJ provisória, autor ou data retroativa fictícios. Ausência de prova é estado de resolução, não tipo legal.
4. O namespace legado `(company_id, unit_id, kind, id/caminho)` continua válido; não regenerar os IDs comerciais ou atribuir unicidade global retrospectiva.
5. Membership, Owner, role, permission, scope, contexto selecionado, entitlement, contrato e estação são conceitos distintos. Nenhuma seleção no cliente concede direito.
6. Um único modelo de autorização vigora por Org e versão. Nenhum `ACL_v1 OR ACL_v2`, fallback para Org inteira ou escolher a Legal mais provável.
7. Fato novo do alvo exige contexto legal válido e transação que preserve estoque, financeiro, replay, autoria e auditoria. Histórico não recebe automaticamente o titular estrutural atual.
8. CLOSED permite apenas ações históricas explicitamente autorizadas e aplicáveis; não reabre comércio. UNRESOLVED conserva leitura antes autorizada, mas não fornece titular para novos efeitos jurídicos.
9. Sucessão é referência entre Units; não transfere direitos, caixa, estoque, créditos, dívidas ou identidade de intenção.
10. Falhas, perda de resposta ou troca de contexto não geram automaticamente outra chave de comando.

## 4. Comparação física Unit → LegalEntity

| Critério | 1 — Coluna em `units` | 2 — Relação separada imutável | 3 — Nova tabela de Units alvo + mapa legado |
| --- | --- | --- | --- |
| Integridade/FKs | Direta; FK composta Org/Legal e nullable legado. CHECK local não prova titular nem exige Legal para todos os novos writers. | PK Org/Unit garante um titular; FK composta prova pais. Unit alvo é Unit com vínculo válido, não toda linha legada. Writer exige vínculo. | Nova tabela pode exigir Legal NOT NULL e separar legado estritamente. |
| SQLite | ADD COLUMN nullable simples; constraints compostas/NOT NULL final podem exigir rebuild controlado de `units`, pai de muitas tabelas. | CREATE TABLE com FKs a PKs existentes; sem rebuild de 001–010. `foreign_keys=ON` obrigatório. | Aditiva inicialmente; muda destinos de muitas FKs/joins e amplia adaptação posterior. |
| Impossibilidade de reparenting | Trigger deve impedir alteração de C/id/Legal; permitir NULL→valor apenas com evidência e rito. | Vínculo INSERT uma vez; UPDATE/DELETE proibidos. Proteção adicional de IDs em `units` e `companies`. | Pai imutável na nova tabela; mapa também deve ser imutável. |
| UNRESOLVED | Legal NULL com estado externo; risco de NULL virar contexto operacional tolerado. | Ausência de vínculo + evento UNRESOLVED explícito. Não há filho alvo inválido nem Legal fictícia. | Unit legada fica fora da tabela alvo. |
| Backfill | Atualiza tabela central; erro pode contaminar consumidores que derivam todos os fatos. | Acrescenta evidência/vínculo, sem tocar fatos/mirrors; erro não é corrigido trocando pai. | Acrescenta segundo registro Unit, exige provar que não são duas unidades concorrentes. |
| Compatibilidade/rollback | Readers antigos ignoram Legal; updates posicionais `INSERT ... VALUES` atuais exigem adaptação de código para coluna nova. | Estruturas atuais mantidas; adapters selecionam contrato. Tabelas novas não garantem rollback de política por si. | Compatibilidade exige resolver duas identidades e autoridade desde o início. |
| Queries/índices | Menos um join; composto Org/Legal/id; exige tratar NULL. | Um join por Org/Unit, coberto por PK; índice Org/Legal/Unit. | Joins adicionais mapa→Unit alvo e migração de queries. |
| Duas autoridades | Possível coluna versus mapa de resolução; definir precedência. | Vínculo é a autoridade estrutural única; ledger registra prova/contestações, não outro pai operacional. | Alto risco de `units` e Units alvo divergirem em identidade, nome e status. |
| Retirada do legado | Rebuild final/rename exige planejamento; simples alvo depois. | Pode continuar como relação 1:1 definitiva ou ser incorporada futuramente após retirar consumidores; nenhuma segunda decisão de titular. | Retirada demanda migrar referências e provar equivalência de IDs. |
| Manutenção | Mais simples no alvo puro; mais invasiva neste runtime. | Complexidade explícita de join/estado, concentrada no resolver/repositório. | Maior complexidade de identidade e APIs, sem necessidade demonstrada. |

**Decisão física APROVADA: opção 2**, `unit_legal_bindings`, com `companies` como única identidade física de Org durante compatibilidade. A escolha preserva as FKs compostas atuais, não altera inserts posicionais e permite distinguir legado não comprovado de Unit alvo. O custo é um join e regras claras de preparação/publicação/estado. A justificativa é o limite de alteração e preservação histórica, não a quantidade de linhas. Opções 1/3 permanecem alternativas comparadas, não pendências para reabrir a escolha. Uma futura mudança física exigiria evidência, revisão e nova autorização; A/C e U-B não são reabertas.

## 5. Convenções do catálogo físico proposto

O catálogo §§6–11 é a proposta de schema para revisão, **não DDL aplicado**. Toda coluna está enumerada; `?` significa nullable, demais são NOT NULL. `ID`/`REF`/enum/texto são `TEXT`, versões/epochs/ordinais são `INTEGER`, tabelas novas `STRICT`. Instantes são UTC ISO 8601 canônico; datas civis permanecem distintas. Versões/epochs usam `1..9007199254740991`; incrementos que excedam esse limite falham.

- IDs novos: UUID gerado pelo backend, imutável e imprevisível. PK composta protege tenant; `UNIQUE(id)` adicional só onde indicado. Não exigir novo formato de IDs legados.
- `org` significa `organization_id`; na compatibilidade sua FK física é `companies(id)`, **não uma view**. `unit` significa `(org,unit_id)`→`units(company_id,id)`; `legal` significa `(org,legal_entity_id)`→`legal_entities(organization_id,id)`.
- `actor`→`users(id)`; Org membership→`company_memberships(user_id,company_id)` com ordem correspondente; auditoria→`audit_events(id)` UNIQUE já existente. FK ao actor prova existência, não permissão; validação de autorização é obrigatória no servidor.
- Referências de evidência/perfil/identidade são opacas, sem documento bruto/token/URL assinada. Sua resolução exige serviço confiável e checagem de Org. Não é FK inventada para um storage que ainda não existe.
- Sem CASCADE de exclusão em estruturas de história. Vínculos, eventos, perfis, fatos e conjuntos selados são preservados; mudanças de status autorizadas geram auditoria e usam CAS/version.
- CHECK valida forma local; coerência entre linhas, ciclos, vigência e autorização exigem FK, trigger específico ou validação transacional indicada. SQLite CHECK não executa subqueries. Não declarar uma garantia apenas pelo nome da coluna.
- Para tabelas de eventos/versionamento, proibir UPDATE/DELETE por triggers futuros; para mutáveis, proteger identidade e atualizar por versão. Cada regra será testada no futuro com escrita SQL adversa em base sintética.
- A proposta DDL deve eliminar UNIQUE/índices que não acrescentem garantia, distinguindo unicidade de negócio, chave candidata para FK composta, índice de consulta e cobertura por PK/índice já existente. A auditoria de necessidade na §15.2 orienta o catálogo; nenhuma constraint atual é removida nesta rodada.

## 6. Organization, identidade legal e perfil

### 6.1 Org e memberships existentes

| Estrutura | Colunas / PK / FKs / UNIQUE / CHECK / estados | Autoridade, mutabilidade e índices |
| --- | --- | --- |
| `companies` mantida fisicamente | `id,name,status,created_at,updated_at`, todas não nulas; PK id; CHECK nome 1–120 e status active/inactive atuais | **Única identidade do tenant.** ID/criação imutáveis; nome/status versionáveis por comando auditado. PK basta para resolver ID. Nome não é identidade fiscal. Sem nova tabela `organizations` concorrente. |
| `OrganizationRepository` / DTO, estrutura de código futura | `organizationId=id`, displayName=name, state traduz status; sem armazenamento próprio | Autoridade física acima. Código novo usa Organization/org; adapter é único ponto com vocabulário company. View de leitura opcional não é destino de FK nem writer. |
| `company_memberships` mantida fisicamente | `user_id,company_id,status`; PK(user_id,company_id), FKs User e Org; status active/inactive | Autoridade do vínculo Org na etapa inicial e v2. DTO `OrganizationMembership`: ACTIVE/SUSPENDED; revogação suspende/preserva linha e evidencia motivo em auditoria. Nunca concede ação sozinha. Índice futuro `(company_id,status,user_id)` para listar vínculos. Não duplicar em outra tabela concorrente. |
| `users` existente | id/name/login/password_hash/status/datas; PK id, UNIQUE login; checks atuais | Identidade e credencial **globais**. Admin tenant gerencia membership/grants, não password/status global. Mudança global usa serviço Identity próprio. Sem copiar usuário por Org. |

Preservar `company.id` como `organizationId` é seguro para a correspondência B 1:1 porque a PK já identifica tenant e todas as relações atuais usam esse mesmo ID. Não prova equivalência jurídica, nem autoriza unir companies pelo nome. DTOs novos deixam de usar company assim que o adapter v2 existir; SQL físico pode manter o nome até a retirada coordenada das FKs/consumidores. Rename futuro exige migration própria e paridade; nunca manter dois IDs para “o mesmo tenant”. `state.company` é apresentação por Unit, não substitui Org ou perfil legal.

### 6.2 Catálogo legal

| Tabela | Todas as colunas | Chaves, checks e índices | Estados, autoridade e mutabilidade |
| --- | --- | --- | --- |
| `legal_entities` | org, id, legal_type, identity_ref, status, version, created_at, created_by, creation_evidence_ref, creation_audit_id, activated_at?, activated_by?, activation_audit_id? | PK(org,id); UNIQUE(id) para unicidade técnica global nova; FK org, actors/audits; CHECK type PF/PJ; status PROVISIONED/ACTIVE/SUSPENDED/CLOSED; version positiva; refs não vazias; campos de ativação todos NULL em PROVISIONED e preenchidos nos demais estados. Índice `(org,status,id)` | Cadastro real em validação quando PROVISIONED; somente ativação/publicação validada estabelece autoridade operacional. org/id/type/identity_ref/criação são preservados; após ativação identidade é imutável. Activation fields só NULL→valor uma vez; status/version por CAS/audit. PF→PJ operacional exige outra Legal. |
| `legal_entity_profiles` | org, legal_entity_id, version, valid_from, recorded_at, recorded_by, profile_ref, profile_schema_version, supersedes_version?, evidence_ref, reason, audit_event_id | PK(org,legal,version); FK legal, actor, audit e `(org,legal,supersedes_version)` à mesma tabela; CHECK versões positivas, predecessor menor que version, motivo 1–500/ref não vazia. Índice `(org,legal,valid_from,version)` | Versões imutáveis; profile_ref aponta conteúdo imutável protegido com digest verificado pelo serviço. Razão social/nome/endereço/cadastro variáveis ficam no perfil, sem substituir identity_ref. |
| `legal_profile_heads` | org, legal_entity_id, profile_version, revision, updated_at | PK(org,legal); FK `(org,legal,profile_version)`→profiles; revision positiva | Ponteiro atual, único writer/CAS. Não é perfil histórico. Toda mudança exige profile novo + evento na mesma transação. |

Perfis não têm `valid_to` mutável: sucessão/instantes definem a linha de vigência, com ordenação e ausência de ambiguidade validadas no comando. Distinguir vigência declarada de data de registro. Uma correção cadastral tardia não altera o perfil usado por um fato anterior: o fato conserva a versão escolhida e, se necessário, recebe correção vinculada. Não escolher perfil de documento antigo apenas pelo cadastro mais recente ou por data inferida. Fato novo captura a versão vigente validada na confirmação; mudança entre preparação/confirmação exige revisão explícita, sem autorizar refingerprint automático de retry consumido.

### 6.3 Lifecycle legal e preparação

```text
PROVISIONED → validação/evidência/perfil → ativação publicada → ACTIVE
ACTIVE ↔ SUSPENDED (revisão/autorização e auditoria)
ACTIVE ou SUSPENDED → CLOSED (sem reabrir comércio por outro rótulo)
```

PROVISIONED não serve a VerifiedContextV2 operacional/histórico, não pode receber binding publicado e não produz fato comercial/jurídico; eventos técnicos de cadastro/validação não são fatos comerciais. Pode ser referenciada por proposta/evidência em preparação, sem se tornar titular comprovado do legado. Ativar exige identidade/evidência aprovadas, perfil válido, ator autorizado, CAS/audit e ausência de contestação. Fechamento conserva identidade/perfis; CLOSED só admite conclusão histórica conforme §9, nunca comércio novo. Não criar Legal apenas para preencher FK de UNRESOLVED.

Correção cadastral pré-operacional usa novos perfis/evidências; se a própria identidade candidata PF/PJ estiver errada, recomenda-se preservar o dossiê PROVISIONED e substituí-lo por outra candidata real com novo ID, supersedendo a proposta da **mesma Unit**. Isso não exige Unit sucessora: ainda não houve publicação do binding/efeito v2. O desenho mantém IDs/dossiês rastreáveis em vez de editar identidade e apagar a tentativa. A candidata abandonada continua não operacional e só pode ser ativada após nova validação explícita. Identidade de uma Legal já ACTIVE permanece imutável; se o erro for percebido antes de publicar qualquer binding, outra Legal real pode ser selecionada na proposta sem trocar o ID da Unit. Nenhuma dessas correções reparenta binding publicado ou transfere história.

**Bloqueio de dados reais:** até especificação/aceite de Segurança para armazenamento, busca, chave, rotação, logs, backups e duplicidade de CPF/CNPJ, usar somente referências/fixtures sintéticas. Serviço protegido + referência opaca continua a direção; algoritmo próprio não foi escolhido. `legal_document_lookup` continua condicional e não integra automaticamente a primeira migration.

**CPF/CNPJ e busca:** documento nunca é PK, header, chave de cache, fingerprint de venda ou atributo padrão de auditoria. Não aproveitar automaticamente `commercial_customers.document`/suppliers para inferir titular. Essas colunas atuais não provam proteção adequada do cadastro legal futuro.

| Alternativa de pesquisa/unicidade | Consequência | Recomendação |
| --- | --- | --- |
| Documento normalizado em texto com índice SQL | Simples; espalha dado sensível em índices/backups/queries/logs | Rejeitar como padrão deste novo modelo. |
| Hash simples do CPF/CNPJ | Domínio pequeno permite enumeração; não é anonimização nem proteção suficiente | Rejeitar. |
| Serviço protegido com índice de pesquisa autenticado/chaveado, rotação e controles próprios | Reduz exposição; exige fornecedor/gestão de chaves, busca e rotação revisados | Preferência arquitetural, **sem inventar algoritmo/criptografia**. Especificação de Segurança necessária antes de persistir dados reais. |
| Sem índice documental no primeiro incremento | Cadastro técnico/evidenciado é viável, busca por ID; unicidade documental depende de rito/serviço | Aceitável em estrutura sintética, não prometer validação documental operacional pronta. |

Se aprovado, a interface física adicional é `legal_document_lookup(org,legal_entity_id,document_kind,key_version,lookup_ref)`: PK(org,legal,document_kind,key_version), FK legal, CHECK tipo CPF/CNPJ e coerência PF/PJ validada transacionalmente; índice UNIQUE candidato `(org,document_kind,key_version,lookup_ref)`. Linhas são imutáveis por versão; rotação cria outra linha e valida duplicatas em todas as versões aceitas antes de descartar índice antigo sob política de retenção. `lookup_ref` não pode ser hash simples ou segredo; formato vem do serviço revisado. **A criação e a regra UNIQUE são condicionais**, ainda dependem da política de duplicidade documental da §25. Sem UNIQUE global que revele cadastro de outro tenant. Não mesclar Legal/Org ou reidentificar histórico ao detectar documento repetido.

## 7. Unit, estados, evidência e sucessão

### 7.1 Estruturas

| Tabela | Todas as colunas | PK / FKs / UNIQUE / CHECK / índices | Autoridade e mudança |
| --- | --- | --- | --- |
| `units` existente | company_id,id,name,status,created_at,updated_at | PK(company_id,id), FK companies; checks atuais; índice adicional somente conforme medição | Namespace/identidade e apresentação preservados. C/id/criação imutáveis; nome mutável. Status v1 active/inactive até gate; em v2 é projeção compatível de lifecycle, sem writer independente. |
| `unit_legal_bindings` | org,unit_id,legal_entity_id,bound_at,bound_by,resolution_event_id | PK(org,unit); UNIQUE(org,legal,unit) como chave candidata exigida pelas FKs triplas, não para criar segunda unicidade de Unit; FK unit, legal, actor e `(org,resolution_event_id)`→resolution_events; sem índice duplicado do UNIQUE | **Única autoridade estrutural publicada Unit alvo→Legal.** Toda linha é publicada no INSERT; não há binding draft/shadow mutável. INSERT só com cabeça RESOLVED/APPROVED_FOR_PUBLICATION, Legal ACTIVE e rito de §7.2. Todas as colunas imutáveis; UPDATE/DELETE proibidos, mesmo antes do primeiro fato v2. |
| `unit_lifecycle` | org,unit_id,state,revision,changed_at,changed_by,audit_event_id | PK(org,unit); FK unit, actor, audit; CHECK state PROVISIONED/ACTIVE/SUSPENDED/CLOSED, revision positiva; índice `(org,state,unit)` | Autoridade operacional **apenas após gate v2**; antes é candidato shadow. org/unit imutáveis; estado por CAS + auditoria. ACTIVE novo exige binding comprovado e Legal/Org ativa. CLOSED não retorna a ACTIVE no rito de sucessão. |
| `organizational_resolution_events` (nome curto: `resolution_events` nas FKs deste documento) | org,id,subject_kind,unit_id,record_kind?,record_id?,record_path?,batch_id?,state,review_status,legal_entity_id?,supersedes_event_id?,recorded_at,recorded_by?,provenance,evidence_ref?,reason,audit_event_id,approved_at?,approved_by?,approval_audit_id? | PK(org,id), UNIQUE(id) para ID global novo; FK unit, legal nullable, actors/audits e predecessor `(org,supersedes_event_id)`; CHECK subject UNIT/FACT/BATCH, state UNRESOLVED/PROPOSED/RESOLVED/DISPUTED, review PREPARATION/APPROVED_FOR_PUBLICATION, forma abaixo. Índice do sujeito; lookup predecessor coberto pelo UNIQUE parcial descrito abaixo, sem duplicata integral por default | Ledger append-only de propostas/evidências/aceite, não pai operacional concorrente. Propostas são supersedidas, nunca editadas/apagadas. RESOLVED publicável ainda não é binding: exige comando de publicação separado/explicitamente aprovado. |
| `resolution_batch_items` | org,batch_event_id,ordinal,unit_id,record_kind,record_id,record_path | PK(org,batch_event,ordinal); UNIQUE(org,batch_event,unit,kind,id,path); FK evento e unit; CHECK ordinal≥0, strings de referência não vazias exceto path raiz `''` | Manifesto fechado do lote, imutável após selo do evento. Nada como “todos os futuros fatos desta Unit”. Índice `(org,unit,kind,id,path,batch_event)` para pesquisa. |
| `unit_successions` | org,predecessor_unit_id,successor_unit_id,effective_at,recorded_at,recorded_by,evidence_ref,reason,audit_event_id | PK(org,predecessor); UNIQUE(org,successor); FKs das duas Units, actor/audit; CHECK predecessor≠successor, motivo 1–500; índice reverso coberto pelo UNIQUE | Relação 1→1 imutável; datas distinguem corte aprovado e registro. INSERT exige inexistência de ciclo e sucessora apta no backend. Não é transferência. |

Para a proposta de migration, usar **um nome físico único: `organizational_resolution_events`**. As referências abreviadas acima e abaixo significam essa tabela, não outra estrutura concorrente.

Regras de forma de `resolution_events`: UNIT exige `record_kind/id/path/batch_id=NULL`; FACT exige kind/id/path não nulos e batch_id NULL; BATCH exige batch_id não nulo, kind/id/path NULL e manifesto selado com itens na mesma Org/Unit do evento. `record_path=''` identifica raiz; filhos usam caminho canônico com ordinais, preservando ausência/repetição de IDs de filhos. RESOLVED exige Legal, actor, evidence_ref; UNRESOLVED exige Legal NULL; PROPOSED pode apontar candidata PROVISIONED e evidência ainda em validação; DISPUTED pode citar Legal contestada, com referência/motivo, sem permitir efeito. `APPROVED_FOR_PUBLICATION` exige RESOLVED e todos os campos de aprovação preenchidos; PREPARATION exige esses campos NULL. A aprovação é nova afirmação superseding, não UPDATE do evento anterior; supersessão de preparação não declara mudança do titular operacional. Provenance é código de origem controlado (BACKFILL_MANIFEST / OWNER_REVIEW / DOCUMENT_REVIEW / CORRECTION). CHECK é local; cabeça/sujeito, aprovação autorizada, selo e pais são validados transacionalmente. UNIQUE parcial `(org,supersedes_event_id) WHERE supersedes_event_id IS NOT NULL` impede duas sucessões concorrentes da afirmação.

Para impedir também duas afirmações iniciais do mesmo sujeito com requestIds diferentes, propor UNIQUE parcial de expressão sobre `(org,subject_kind,unit_id,coalesce(record_kind,''),coalesce(record_id,''),coalesce(record_path,''),coalesce(batch_id,'')) WHERE supersedes_event_id IS NULL`. É recurso SQLite a homologar na proposta DDL. Toda supersessão conserva exatamente essa chave de sujeito, validada por trigger/transação, e referencia sua cabeça atual. `batch_id` é ID técnico do manifesto fechado nessa Org/Unit, não URL/arquivo bruto; correção de lote conserva seus itens-alvo, enquanto mudar o conjunto cria outro manifesto revisado. Um lote que envolva várias Units se decompõe em manifestos por Unit vinculados no dossiê, sem relaxar o scope.

### 7.2 UNRESOLVED → resolução → contestação

**Fronteira de publicação aprovada:** preparação/resolução candidata vive no ledger e no dossiê; `unit_legal_bindings` contém somente relações publicadas. Antes de publicar e antes de qualquer fato v2, erro de onboarding/mapeamento é corrigido por supersessão da proposta/evidência, na mesma Unit, sem obrigar sucessora. O comando de publicação revalida a cabeça aprovada/publicável, identidade/perfil e Legal ACTIVE, ator/Org/Unit/epochs e ausência de binding ou fatos v2 incompatíveis; em uma transação, insere binding + audit/controle de publicação. `bound_at/bound_by` registram publicação. Ativação legal pode compor essa transação sob seu contrato; não é efeito implícito de backfill.

Depois desse INSERT o vínculo é autoridade estrutural e imutável, mesmo se o gate de comércio ainda estiver fechado ou não existir fato v2. Desligar flag/voltar a SHADOW não “despublica” o vínculo. Contestação posterior usa DISPUTED/HOLD/revisão, preserva o pai e não libera operação por outra proposta. Mudança de titular operacional segue U-A integralmente. Não inserir binding provisório para depois corrigir seus campos.

1. Para uma Unit legada U da Org X sem prova, inserir evento UNIT/UNRESOLVED e lifecycle PROVISIONED em shadow; **não inserir binding**. Reads compatíveis continuam no namespace original e com a ACL anterior. Não fazer NULL→Org-wide.
2. Resolução UNIT só com dossiê/evidência, operador autenticado com direito de resolução no recurso e decisão explícita. Registrar quem/quando/motivo/referência/audit. Não inferir por `name`, execução, login, branding, CPF de cliente ou local físico.
3. Resolver a estrutura atual de U não resolve automaticamente cada fato antigo. Um evento UNIT indica qual afirmação estrutural foi comprovada; fatos/lotes só ficam RESOLVED quando a evidência cobrir explicitamente aqueles registros/período verificado. UNIT não é prova retroativa universal.
4. Se o legado da mesma U contiver titulares distintos e não houver prova de um titular estrutural estável, manter U como namespace legado não operacional e resolver os fatos individualmente/lotes fechados. Criar Unit alvo nova para operar; não distribuir o mesmo `unit_id` entre dois pais nem relabelar fatos para satisfazer FK.
5. Havendo prova estável, registrar proposta/resolução e seu aceite publicável; corrigir erros de preparação por supersessão antes da publicação. Criar binding uma vez **somente no rito explícito aprovado acima**. A evidência distingue “titular estrutural daqui em diante” de titular de fatos antigos. A cabeça não superada do sujeito orienta revisão; FACT/lote explícito rege prova factual, sem rescopar binding publicado. Sobreposição/contradição bloqueia conclusão até correção autorizada.
6. Correção de afirmação histórica: evento CORRECTION com `supersedes_event_id`, nova evidência e auditoria; preservar afirmação anterior e fatos/hash originais. Dossiê informa tanto responsabilidade comprovada quanto correção; não editar bytes do fato.
7. **Binding publicado não se corrige com UPDATE/DELETE/reparenting.** Contestação insere DISPUTED e coloca operação em HOLD/revisão; não troca silenciosamente o pai, mesmo sem fato v2. Outra Unit para operação futura exige decisão/rito aprovado, não criação automática. Fatos/documentos já emitidos exigem correção jurídica/de domínio vinculada. Isso não se aplica à mera proposta ainda não publicada, corrigível na mesma Unit como acima. U-A permanece integral.

Leitura UNRESOLVED é preservação, não autorização de gerar recebimento novo sem titular. Comandos históricos com efeito comercial também são fatos novos: exigem titular da obrigação comprovado, contexto apto e direito específico. Se não comprovado, ficam bloqueados para resolução; não inventar contraparte para concluir cobrança. Grants históricos legados podem apontar Unit sem binding somente para leitura autorizada.

### 7.3 Constraints e sucessão U-A

Pseudo-DDL **ilustrativo**, não executável nesta rodada; catálogo e revisão posterior são necessários para o DDL final:

```sql
CREATE TABLE unit_legal_bindings (
 organization_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 legal_entity_id TEXT NOT NULL,
 bound_at TEXT NOT NULL,
 bound_by TEXT NOT NULL,
 resolution_event_id TEXT NOT NULL,
 PRIMARY KEY (organization_id,unit_id),
 UNIQUE (organization_id,legal_entity_id,unit_id),
 FOREIGN KEY (organization_id,unit_id) REFERENCES units(company_id,id),
 FOREIGN KEY (organization_id,legal_entity_id)
   REFERENCES legal_entities(organization_id,id),
 FOREIGN KEY (bound_by) REFERENCES users(id),
 FOREIGN KEY (organization_id,resolution_event_id)
   REFERENCES organizational_resolution_events(organization_id,id)
) STRICT;
CREATE TRIGGER unit_binding_no_update BEFORE UPDATE ON unit_legal_bindings
 BEGIN SELECT RAISE(ABORT,'Unit legal binding is immutable'); END;
CREATE TRIGGER unit_binding_no_delete BEFORE DELETE ON unit_legal_bindings
 BEGIN SELECT RAISE(ABORT,'Unit legal binding is immutable'); END;
```

Adicionar proteção futura contra mudar `units.company_id/id`, `companies.id`, `legal_entities.org/id/type/identity_ref`, além das FKs compostas. Trigger de INSERT do binding valida sujeito/estado/Unit/Legal do evento; operação do backend revalida autorização e ausência de contestação dentro de `BEGIN IMMEDIATE`. Nenhum trigger concede direito. Desativar foreign_keys em acesso operacional é proibido.

O pseudo-DDL só representa bindings já publicados: suas triggers não atingem propostas do ledger. Na proposta DDL final, a guarda de INSERT deve exigir também cabeça aprovada/publicável e Legal ACTIVE; sem essas guardas/contrato homologados, writer de publicação continua fechado. BATCH/`resolution_batch_items` e FACT avançadas são partes do alvo, **adiáveis a migrations posteriores** se nenhum requisito imediato depender delas; 011 não precisa aceitar esses kinds nem criar seus campos/tabelas (§15.1).

Sucessão recomendada **1→1**, permitindo cadeia PF→PJ→outra sucessora, sem ciclos. 1→N/N→1 exigem regras de divisão/fusão de operação, grants e obrigações ainda não definidas; impor isso agora seria complexidade prematura. Expandir a cardinalidade exige outra revisão e migration própria. A sucessão não requer que a predecessor UNRESOLVED receba titular inventado; relação operacional não é evidência legal do passado. Endereço comum pode ser descrito no futuro, mas não substitui IDs ou pai.

## 8. Membership, Owner e grants fechados

### 8.1 Estruturas ACL

Mantêm-se `users`, `company_memberships` e `permissions` como identidade/vínculo/catálogo de ações. `roles` preserva identidade do template na Org; `role_permissions` conserva o corpo legado até transição controlada. No alvo, revisões imutáveis abaixo são autoridade do template versionado, e `roles.name/role_permissions` são projeções compatíveis, sem writer concorrente. **V2 usa grants novos como autoridade efetiva**; `unit_roles/unit_memberships` são evidência/compatibilidade restrita. Alterar template não altera grant selado: ações permanecem materializadas e a origem aponta a revisão exata utilizada.

| Tabela | Todas as colunas | Chaves/checks/índices | Autoridade e mutabilidade |
| --- | --- | --- | --- |
| `organization_owner_assignments` | org,id,user_id,status,version,assigned_at,assigned_by,assignment_evidence_ref,assignment_audit_id,revoked_at?,revoked_by?,revocation_reason?,revocation_audit_id? | PK(org,id), UNIQUE(id), UNIQUE(org,id,user_id); FK membership(user_id,org), actors/audits; CHECK status ACTIVE/REVOKED, campos de revogação todos nulos ou todos preenchidos conforme estado; UNIQUE parcial(org,user_id) WHERE status ACTIVE; índice `(org,status,user_id)` | Atribuição explícita de Owner. Identidade/atribuição imutáveis; somente ACTIVE→REVOKED por CAS/audit. Reatribuir cria outra linha. Não deriva do criador ou role.name. |
| `role_template_revisions` | org,role_id,revision,template_name,template_schema_version,recorded_at,recorded_by,reason,audit_event_id | PK(org,role,revision); FK role(org,role_id), actor/audit; CHECK versões positivas, nome 1–120, motivo 1–500; PK cobre listar revisões | Snapshot imutável do template, sem UPDATE/DELETE. Org/role/revision/nome/schema/proveniência e corpo de ações selados na mesma transação. |
| `role_template_revision_permissions` | org,role_id,role_revision,permission_code | PK(org,role,revision,permission); FK `(org,role,role_revision)`→revisions, FK permissions(code); sem UNIQUE/índice duplicado da PK | Corpo normalizado imutável da revisão. Códigos existentes e únicos por template; não JSON sem FK a permissions. |
| `role_template_heads` | org,role_id,role_revision,revision,updated_at | PK(org,role); FK `(org,role,role_revision)`→revisions; CHECK versões positivas | Ponteiro atual por CAS; org/role imutáveis. Não altera revisões antigas nem grants; snapshot + head + audit na mesma transação. |
| `scoped_assignments` | org,id,user_id,source_role_id?,source_role_revision?,scope_kind,anchor_legal_entity_id?,anchor_unit_id?,owner_assignment_id?,status,version,created_at,created_by,provenance_ref,audit_event_id,revoked_at?,revoked_by?,revocation_reason?,revocation_audit_id? | PK(org,id), UNIQUE(id) global; sem UNIQUE(org,id,user_id) redundante/não referenciado; FK membership, `(org,source_role_id,source_role_revision)`→role_template_revisions, legal nullable, unit nullable, owner `(org,owner_assignment_id,user_id)`→owners, actor/audit; scope UNIT/LEGAL/ORG_CLOSED/OWNER_DESCENDANTS, status DRAFT/ACTIVE/REVOKED; checks abaixo. Índices por usuário/Org/status | Ações e recursos do próprio grant selados; origem da revisão do template é imutável inclusive após refresh. Corpo/substituição/status/CAS conforme abaixo; grant manual tem proveniência própria explícita. |
| `assignment_permissions` | org,assignment_id,permission_code | PK(org,assignment,permission), FK assignment e permissions; índice reverso `(org,permission_code,assignment_id)` se medido | Lista explícita de códigos nesse grant, imutável quando selado. Role é template/proveniência, não bypass. |
| `assignment_unit_members` | org,assignment_id,unit_id | PK(org,assignment,unit), FK assignment e unit; índice `(org,unit_id,assignment_id)` | Conjunto fechado de Units nesse grant, selado. UNRESOLVED só pode receber direitos de leitura compatível; não cria Legal nem direito comercial. |
| `assignment_legal_members` | org,assignment_id,legal_entity_id | PK(org,assignment,legal), FK assignment e legal; índice `(org,legal_entity_id,assignment_id)` | Conjunto fechado para ações sobre a própria Legal. Não gera implicitamente direito sobre toda Unit futura. |

Forma de `scoped_assignments`: UNIT exige anchor_unit não nulo, anchor_legal e owner NULL; LEGAL exige anchor_legal não nulo, anchor_unit/owner NULL; ORG_CLOSED exige anchors/owner NULL; OWNER_DESCENDANTS exige owner não nulo e anchors NULL. Para UNIT, a Legal é sempre derivada do binding, nunca parâmetro de autoridade do grant. Todos os FKs nullable aplicam-se só quando preenchidos.

Campos de revogação de assignment devem ser todos NULL em DRAFT/ACTIVE e todos preenchidos em REVOKED, com motivo 1–500. Corpo pode ser preparado apenas em DRAFT; ACTIVE sela permissions/members/anchors e identidade. Ativar exige todos os testes de forma/coerência; nova edição de grant ativo cria outra concessão e preserva anterior. Templates podem mudar por comando autorizado, sem refresh implícito de grants selados.

**Escolha física para provenance:** `source_role_id/source_role_revision` + FK composta à revisão imutável normalizada. CHECK exige ambos NULL (grant manual com provenance_ref/audit explícitos) ou ambos presentes e revisão positiva. Não manter outro `role_id` concorrente dentro do grant. Revisão determina o template que fundamentou a criação; `assignment_permissions` determina o conjunto efetivamente aprovado, que pode ser subconjunto explícito. Validação da selagem confere essa relação e registra o diff; fonte da revisão jamais troca no grant antigo.

Alternativa considerada: snapshot JSON/digest dentro de cada grant. Preserva origem se versionado/canônico, mas duplica templates, dificulta comparação e não dá FK SQL dos códigos. Referenciar apenas role_id mutável é insuficiente. Revisões normalizadas permitem integridade e diff por ação sem inventar algoritmo de digest. Cabeça é ponteiro atual, não autoridade retroativa.

Fluxo futuro obrigatório: nova revisão do template → calcular/mostrar impacto e diff de ações **e recursos** dos grants afetados → administrador autorizado escolhe quais aplicar → revalidar alçada/scope/revisões dentro da transação → criar novos grants vinculados à nova revisão e revogar/substituir os anteriores auditadamente → incrementar acl_epoch. Não ampliar scope no refresh, não aplicar sem escolha e não ressuscitar grant revogado; falha de concorrência exige revisão, não aplicação forçada. Detalhes de UI/step-up permanecem no incremento C5/C6.

Na migração de papéis legados, a primeira revisão é snapshot do template **observado naquele instante**, com data/proveniência reais; não representa versão histórica inventada. Preferir grant por usuário/Unit/role/revisão com ações efetivas filtradas/aprovadas. Se um conjunto consolidado vier de vários papéis, não atribuir uma fonte única falsa: usar grant manual com manifesto imutável das fontes/revisões e diff aprovado, ou decompor em grants por template; ambos preservam a regra ação-recurso.

Selar um grant exige: usuário global e membership ativos; executor autorizado para **cada ação e recurso concedido** e para delegar; template da mesma Org; corpo não vazio e compatível com scope; conjuntos explicitamente enumerados e verificados. UNIT contém somente sua anchor Unit; LEGAL contém anchor Legal e as Units escolhidas sob ela; ORG_CLOSED contém somente descendentes escolhidos existentes; OWNER_DESCENDANTS usa pai Org e Owner explícito, sem conjuntos materiais que concorram com a herança dinâmica. Constraints de filhos/selagem precisam de triggers/validação transacional, pois CHECK não consulta outra tabela. Não conceder `policy.manage`, Owner, direito histórico ou novos recursos por ter “todas as 20 permissões” antigas.

### 8.2 Sem produto cartesiano de ação e recurso

Regra conceitual do evaluator:

```text
permitir se:
 usuário e membership ativos + Org válida + recurso/pais coerentes
 E existe UM assignment ativo e selado do usuário nessa Org tal que:
   action ∈ assignment.permissions
   E recurso ∈ scope DESSE assignment
 E lifecycle, direito histórico, regra de domínio e controles adicionais aprovam
```

Exemplo User A / Org X: G1=`sales.create` × `{U1}`; G2=`sales.view` × `{U1,U2}`. Vender U2 é negado; consultar U2 pode ser permitido. G2 não empresta scope a G1. Legal B/U3 é negada. Se uma rota exigir vários direitos, todos precisam ser válidos **sobre o recurso da operação**; não somar permissões globais sem scope.

| Granularidade | Proposta | Trade-off |
| --- | --- | --- |
| Unit | Grant UNIT contém sua anchor Unit; para várias Units usar grants separados ou conjunto fechado LEGAL/ORG_CLOSED | Maior precisão; mais linhas, sem contradizer a forma do grant. |
| Legal | Anchor identifica administração da Legal; Units autorizadas são lista fechada do grant | Menos repetição conceitual; criação de nova Unit não amplia por surpresa. |
| Org não Owner | Ações próprias da Org no pai; descendentes explicitamente materializados | Admin tenant não recebe automaticamente todas as Legals/Units futuras. |
| Owner Org | Descendência dinâmica somente com assignment Owner explícito e grant de ação válido | Abrange descendentes atuais/futuros como P05; não pula estado, regra ou autorização. |

Para recurso Org, scope ORG_CLOSED autoriza apenas ações explicitamente Org; isso não se expande para operações comerciais em descendentes. Policies podem materializar novos grants quando explicitamente aprovadas, mas não existe herança implícita por cargo. Revogação e alteração de membership invalidam caches/contextos imediatamente no backend via epoch/revalidação. Consultas/list/count/search/export usam predicado de scope no SQL ou projeção segura antes de agregação/paginação, não filtragem de resultado já vazado.

### 8.3 Owner e identidade global

- **APROVADO: múltiplos Owners.** Cada atribuição exige membership ativa, prova de autorização e auditoria. O primeiro Owner legado será atribuído explicitamente; nunca backfill por nome do papel, criação ou lista de permissões.
- Owner fornece alcance estrutural, não todos os códigos de ação. Grant OWNER_DESCENDANTS referencia o Owner do mesmo usuário/Org. Revogar Owner invalida grants ligados e incrementa `acl_epoch`, mesmo que o corpo antigo permaneça preservado.
- `policy.manage` continua direito distinto e delegável por rito próprio; Owner não recebe automaticamente política comercial ilimitada, reset global ou plataforma.
- **APROVADO:** operação administrativa comum não pode revogar/suspender o **último Owner efetivo** de Org ativa. Conferir a proteção na mesma transação, inclusive mudanças de membership relacionadas. “Efetivo” exige usuário global ativo, membership ativa e atribuição ativa. Transferência cria/substitui Owner atomicamente. Incidente de segurança pode colocar Org em HOLD e acionar recuperação global; a proteção não força manter uma identidade comprometida nem inventa substituto.
- Mudanças sensíveis de Owner/grants e evidência legal devem exigir reautenticação/step-up conforme especificação de Segurança futura. Sessão atual sozinha não será tratada como prova suficiente por omissão. Sem implementar MFA nesta rodada.
- Admin tenant pode suspender vínculo e grants naquele tenant. Não altera `users.password_hash`, login, status global ou credenciais de outro tenant. Convite/vínculo de identidade existente deve provar consentimento/identidade sem revelar lista global de usuários; recuperação global é fluxo Identity próprio, pendente, independente da senha na mão do tenant.
- O reset administrativo legado **não pode ser reutilizado como mecanismo alvo** por ter proteção para usuários multi-company. Antes de habilitar v2, decidir rota compatível ou bloqueio/depreciação explícita desse reset para Orgs convertidas, preservar grants consumidos e revogar transitórios não usados sob rito auditado. Não ampliar sua abrangência.
- Administração da plataforma usa outro contexto/principal/rotas e auditoria, sem fabricar membership Owner no cliente. ORG-002 não implementa essa plataforma, entitlement ou Tier 0.

## 9. Direitos históricos e estados

Nomes abaixo são capacidades conceituais; não sementes de `permissions` aprovadas. Estados de Org/Legal/Unit e autorização por ação são verificados a cada pedido. ACTIVE e CLOSED não equivalem ao atual active/inactive.

| Ação | Recurso | Unit | Direito e pré-condição | Efeito permitido |
| --- | --- | --- | --- | --- |
| Comércio normal | Venda/compra/estoque novo | ACTIVE, binding válido | Direito normal sobre a Unit + pais ativos + regra comercial | Fato novo com contexto legal/perfil; nenhuma alteração de preço/negativo por esta fase |
| Comércio normal | Qualquer registro | CLOSED | Mesmo que possua sales.create | **Negado**; selecionar sucessora e preparar outra intenção |
| Ler história | Fato/ledger no namespace antigo | CLOSED | Direito histórico de leitura e projeção de campos | Consulta paginada; não reativar Unit |
| Ler legado preservado | Fato sem titular comprovado | UNRESOLVED | Direito de leitura compatível já existente ou concessão histórica explícita | Exibir resolução pendente; sem inferir Legal ou consolidar como titular conhecido |
| Receber/pagar obrigação antiga | Obrigação com titular comprovado | CLOSED | Direito histórico financeiro específico, obrigação original e contexto validado | Evento de liquidação vinculado à obrigação/Legal antiga; não passar à sucessora |
| Devolver/reembolsar | Venda antiga comprovada | CLOSED | Direito histórico de retorno/refund, alçada e regras aplicáveis | Reversão/evento na origem; destino de estoque/caixa exige contrato explícito |
| Cancelar/corrigir | Documento/fato original | CLOSED | Direito histórico específico; regra jurídica/fiscal aplicável | Correção/reversão vinculada; não DELETE da história |
| Auditar/exportar história | Eventos/fatos autorizados | CLOSED | audit/export histórico no scope + projeção + contexto do job | Sem vazamento cross-Legal/tenant e sem esconder a titularidade antiga |
| Produzir efeito histórico | Obrigação UNRESOLVED | UNRESOLVED | Direito sozinho é insuficiente; titular ainda não comprovado | Bloquear para resolução; leitura continua autorizável |
| Qualquer efeito comercial | Binding contestado / Unit SUSPENDED | SUSPENDED | Revisão de contenção/recuperação própria | Fail-closed; leitura diagnóstica autorizada, não comércio |

Grant migrado de Unit inativa não ganha direitos históricos sozinho: medir o acesso que havia e preservar evidência; novas capacidades históricas são concessões explícitas revisadas. `acesso_depois ⊆ acesso_antes` vale para grants migrados, não para uma concessão nova aprovada e auditada que deve estar separada no relatório. Não enfraquecer `assertScope` atual para habilitar todos os caminhos de unidade inativa.

## 10. Contexto autenticado e adapter único

### 10.1 Contrato alvo do backend

Contrato operacional proposto, sem credentials ou documento fiscal no DTO:

```text
VerifiedContextV2 {
 userId, sessionId,
 organizationId, legalEntityId, unitId,
 mode: OPERATIONAL | HISTORICAL,
 contextRevision, aclEpoch, resolutionEpoch,
 contractVersion: 2
}
```

`legalProfileVersion` é capturada e verificada na intenção/fato, não autoridade de sessão. Contexto sem seleção não autoriza ação comercial. Há envelope separado `LegacyReadContextV1` com `organizationId,unitId,legalResolution=UNRESOLVED|PENDING_PUBLICATION|DISPUTED`, sem Legal fictícia e restrito à leitura compatível. PROPOSED ou RESOLVED ainda não publicado é PENDING_PUBLICATION para essa interface: candidata não aparece como Legal operacional. Não usar união nullable como VerifiedContextV2 operacional; Legal PROVISIONED não pode compor contexto alvo. O backend pode listar contexto histórico CLOSED por direitos específicos, sem `sales.create`.

Resolver: autenticar usuário/sessão global, selecionar modo vigente da Org, validar membership, buscar Unit por Org/ID, consultar binding e resolução, validar Legal/pais/estado e avaliar ação/recurso no grant. IDs do cliente são seleção/expectativa, nunca autoridade. Org X + Legal A + Unit de Legal B falha fechado mesmo se o usuário puder ver ambas. Deny para parent ausente, binding contestado, versão não aceita ou Org em HOLD. IDs cruzados não devem revelar se o recurso existe fora do scope.

### 10.2 Sessão e gates físicos

| Tabela | Todas as colunas | Chaves/checks/índices | Autoridade e mutabilidade |
| --- | --- | --- | --- |
| `session_organization_contexts` | session_id,user_id,org,unit_id,legal_entity_id?,mode,revision,acl_epoch,resolution_epoch,changed_at | PK(session_id); FK session, actor, membership(user_id,org), unit; FK `(org,legal,unit)`→binding quando Legal presente; CHECK mode OPERATIONAL/HISTORICAL/LEGACY_READ, Legal presente nos dois primeiros e NULL em LEGACY_READ, epochs/revision positivas; índice `(org,user_id,unit_id)` | Contexto v2 por sessão, sem token novo nesta tabela. CAS/epoch; usuário tem de ser o mesmo da sessão por trigger/validação transacional. LEGACY_READ não permite efeito comercial. |
| `organization_model_state` | org,mode,design_version,required_reader_protocol,required_writer_protocol,revision,acl_epoch,resolution_epoch,first_v2_fact_id?,changed_at,changed_by?,change_audit_id | PK(org), FK org/actor/audit e `(org,first_v2_fact_id)`→`business_fact_contexts(org,id)`; CHECK mode LEGACY/SHADOW/V2_READONLY/V2_ACTIVE/HOLD, versões/epochs/protocolos inteiros positivos; índice `(mode,org)` | Gate de implantação, não entitlement. Alteração por deployment autorizado/CAS/audit; first fact NULL→ID uma vez. Protocolos controlados, independentes da string de versão do aplicativo. |

`sessions` permanece a autoridade de token, validade e identidade. Após migração controlada de uma sessão para v2, recomenda-se revogá-la/reemitir em vez de reutilizar CSRF/contexto antigo. Sessões v2 mantêm o par legado de `sessions` **NULL/NULL** e usam sidecar para contexto; isso evita criar unit_membership fictícia apenas para satisfazer FK de Owner. Sessões v1 continuam usando exclusivamente o par original enquanto a Org for LEGACY/SHADOW. O resolver v2 não pode cair no par v1 se faltar sidecar. Login multi-Org continua global; contextos podem requerer contratos distintos até conversão completa.

Os binários antigos não conhecem sidecar/gates: uma sessão sem par pode ser vista como sem contexto e endpoints antigos ainda podem tentar selecionar par. Portanto a proteção definitiva exige controle de versão/deployment e bloqueio dos writers antigos, **não a alegação de que adicionar uma flag torna todo binário antigo seguro**. A emissão de sessão v2 só entra depois de revisão de todos os endpoints Identity/Admin/reset e consumidores. Infraestrutura cloud/replicação não é implementada aqui.

**Contrato de compatibilidade proposto:** `required_reader_protocol/required_writer_protocol` são inteiros monotônicos de protocolo de storage/contexto, no intervalo seguro das versões, publicados pelo deployment autorizado. Cada build oficial declara no manifesto controlado os conjuntos/faixas de protocolos que realmente lê e escreve. Aceitar só se o protocolo requerido pertence ao conjunto suportado **e** o gate permite a operação. Não presumir que número maior entende automaticamente todo formato antigo: suporte retroativo precisa estar declarado e homologado. Versão do aplicativo/build identifica artefato rastreável, não decide compatibilidade por ordem lexical ou semver informal; build conhecido incompatível falha no startup e antes do efeito. Não aceitar declaração do cliente como autoridade para abrir gate. Contratos API/cliente também declaram protocolo e são validados pelo backend; replay v1 conserva seu protocolo próprio. Nada disso torna binário antigo que ignora o contrato seguro: controle de deployment continua obrigatório.

### 10.3 CSRF, headers e ciclo de contexto

- Manter cookie opaco/HttpOnly e controles de host/origin/content-type. CSRF v1 continua validado por seu algoritmo original; CSRF v2 vincula token de sessão a Org/Legal/Unit, modo, revisão e versão de contexto. Nunca transportar tokenHash/cookie no DTO ou log. Algoritmo final será revisado sem alterar senhas por arrasto.
- Headers alvo `X-Organization-Id`, `X-Legal-Entity-Id`, `X-Unit-Id`, `X-Context-Revision` são expectativas obrigatórias nos comandos v2. Par incompleto ou divergente falha; headers legados com novos presentes devem ser coerentes ou rejeitados. Ausência não permite inferência de outro tenant. Nome final de rota/header será aprovado com o contrato, não existe nesta entrega.
- Troca: suspender ações/drafts da tela; abortar requisições; backend reautentica/CSRF e CAS revision, valida novo contexto e confirma transação; cliente adota DTO confirmado e recarrega. Falha/timeout deixa seleção incerta: consultar estado real da sessão antes de retomar; não repetir comando comercial sob outro contexto.
- Epochs vêm do backend: grants/membership/Owner alteram acl_epoch; resolução/binding/contestação alteram resolution_epoch. Cache usa principal + Org + Unit + Legal + modo + epochs; epoch não substitui revalidação transacional em escrita. Caches sem keys completas são descartados na transição.
- Resposta HTTP tardia só é aplicada se geração, sessão e tupla de contexto ainda coincidirem. Cancelamento no browser não prova rollback no servidor. Antes de novo comando, reconciliar resultado da intenção original no scope original.
- Namespace storage/drafts v2: usuário + Org + Legal + Unit + versão. Sessão pode integrar chave de cache efêmero; não gravar token/CSRF persistente. Ler storage não é autorização. Draft v1 permanece no namespace original, nunca copiado silenciosamente para v2/sucessora. Se precisar transportar itens, criar nova intenção explícita após resolver a anterior, revalidando preço/estoque sem alterar suas regras.
- UI legada precisa adapter/telas de seleção/limites de versão; não pode seguir ignorando Legal após gate v2. React requer atualização dos tipos que hoje representam C/U, parser/cliente HTTP/SessionProvider e guards de geração. Novos campos descartados por um parser antigo não podem ser tratados como compatibilidade aceita.
- Export/job mantém Org/Legal/Unit/mode/actor/sessão/epochs e formato de contexto; download revalida direito e seleção esperada. Revogação e corte invalidam exports não baixados quando necessário. Link opaco não é autorização; caches, COUNT, arquivos e analytics respeitam scope antes da agregação.

### 10.4 LegacyContextAdapter

Interface lógica única:

```text
resolveLegacyPair(user/session, companyId, unitId, requestedAction)
  → companyId como organizationId 1:1, sem nova identidade
  → validar Unit na Org + membership + modo vigente
  → se LEGACY/SHADOW: política v1 efetiva; propostas são candidatas
     binding já inserido é estruturalmente publicado/imutável, sem ativar writer v2
  → se v2: somente política v2 sobre o recurso
  → binding comprovado: derivar Legal; validar expectativa, lifecycle e ação
  → sem binding: LegacyReadContext explícito; negar novo efeito
  → jamais escolher Legal por nome, creator, primeira linha ou CPF de cliente
```

Rotas completas de snapshot conservam as cinco permissões de leitura e projeções atuais, **todas no mesmo recurso**; o adapter não pode ampliar esse contrato para tornar UI antiga funcional. Grants shadow não contam como efetivos. No gate, a ACL antiga fica evidência e não alternativa de autorização; alterações pendentes são reapuradas antes de ativar v2. Não copiar todos os papéis da unidade criadora para cada unidade nova.

Retirada do adapter só quando: todos os consumidores/rotas/exports/storage declaram v2; todos os writers reconhecem gates; novo modelo de permissões está homologado; nenhum contexto v1 operacional ativo; retries/command ledgers antigos continuam consultáveis por serviço de replay de versão; histórico UNRESOLVED tem acesso próprio; contadores de uso verificam ausência de chamadas antigas durante janela definida pelo proprietário. Retirar nomes de tabela físicos é outra migration, não requisito para retirar o DTO company.

## 11. Ownership dos fatos e contexto de auditoria

### 11.1 Comparação

| Critério | 1 — Legal explícita em todo fato | 2 — Derivar sempre de Unit | 3 — Híbrido recomendado |
| --- | --- | --- | --- |
| Integridade/imutabilidade | Pode divergir do pai sem FK composta; exige disciplina em todas as tabelas | Forte para fatos novos com binding imutável; errado para legado sem prova/cadastro histórico | Binding estrutural imutável + referência factual consistente/verificada |
| Redundância/migração 51 tabelas | Repetição e backfill invasivo, incluindo tabelas técnicas sem sentido legal | Menos colunas, mas inferência retroativa tentadora | Não duplicar Legal em todos os filhos; roots/contextos com associações e herança documentada |
| Auditoria/perfil | Explícito, mas ID sozinho não preserva cadastro | Perfil atual não prova versão usada no documento | Fato novo guarda Legal + perfil imutável + origem de contexto |
| Relatórios/performance | Filtro direto; novos índices em muitas tabelas | Join binding; fatos antigos exigem exceção | Contextos/links indexados nos roots; legado resolvido explicitamente sem relabel |
| Fiscal/analytics | Ajuda ownership, não resolve documento/jurisdição | Insuficiente para evidência cadastral/fiscal | Melhor base, sem afirmar emissão fiscal ou normalização universal |
| Risco | Duas versões de pai e alteração histórica | Projetar titular atual sobre história ambígua | Cobertura transacional e reconciliação precisam ser exigidas; sidecar não pode ficar opcional nos writers |

**Recomendação: modelo 3.** Unit binding é autoridade estrutural para novo fato do alvo; root jurídico relevante recebe contexto factual imutável com Legal e perfil. Filhos derivados carregam vínculo ao root, mas **novos recebimentos, refunds, devoluções ou ajustes** são eventos com contexto próprio, além do vínculo ao fato original. Um sale root antigo não dá perfil/contexto automático ao recebimento novo.

### 11.2 Estruturas factuais propostas

| Tabela/contrato | Todas as colunas | Chaves/checks/índices | Autoridade e limites |
| --- | --- | --- | --- |
| `business_fact_contexts` | org,id,unit_id,legal_entity_id,legal_profile_version,fact_kind,record_id,record_path,contract_version,created_at,audit_event_id | PK(org,id), UNIQUE(id) global, UNIQUE(org,unit,fact_kind,record_id,record_path); FK binding(org,legal,unit), perfil(org,legal,version), audit; CHECK versões positivas, kind fechado, record_id não vazio/path canônico; índices `(org,legal,fact_kind,created_at,id)` e `(org,unit,created_at,id)` | Contexto jurídico imutável na transação do efeito; **não contém executed_by/recorded_by**. Não é autoridade de autoria comercial nem resolução retroativa. |
| `sale_legal_contexts` | org,unit_id,sale_id,fact_context_id | PK(org,unit,sale), UNIQUE(org,fact_context_id); FK `(org,unit,sale)`→commercial_sales(company_id,unit_id,id) DEFERRABLE; FK `(org,fact_context_id)`→fact_contexts DEFERRABLE | Associação tipada do root de venda. Validador/trigger exige kind/ref/unit iguais. Link append-only. Índice de contexto coberto pelo UNIQUE. |
| `purchase_legal_contexts` | org,unit_id,purchase_id,fact_context_id | PK(org,unit,purchase), UNIQUE(org,fact_context_id); FKs header compra e contexto compostas DEFERRABLE | Mesmas garantias tipadas para root compra; recebimento novo não herda por omissão. |
| `stock_movement_legal_contexts` | org,unit_id,movement_id,fact_context_id | PK(org,unit,movement), UNIQUE(org,fact_context_id); FKs stock_movements e contexto compostas DEFERRABLE | Movimento root com Legal/perfil, associado ao evento causador. Não copiar novo contexto para movimentos antigos. |
| `audit_organization_contexts` | audit_event_id,org,legal_entity_id?,unit_id?,context_version,basis | PK(audit_event_id), FK audit, org, legal nullable, unit nullable; CHECK basis ORGANIZATION/LEGAL/UNIT/LEGACY, versão positiva e combinação de campos; índice `(org,legal,audit_event_id)` e `(org,unit,audit_event_id)` | Sidecar append-only dos eventos novos. UNIT exige Legal/Unit coerentes com binding; LEGACY admite Unit sem Legal, indicando unresolved; ORGANIZATION exige ambos NULL; LEGAL exige Legal e Unit NULL. Coerência intertabelas por trigger/transação. Não modifica eventPayload/hash de audit antigo. |

`business_fact_contexts` é o nome físico; abreviações `fact_contexts` nas FKs descritivas significam a mesma tabela. Índices dos links suportam joins por namespace original. FKs de links tipados são deferred para conviver com delete/reinsert transacional dos mirrors sem CASCADE; no commit todos os roots/links precisam existir e ser coerentes. Ainda exigem homologação da interação com `syncSales/syncPurchases/syncInventory`: simplesmente criar a FK e supor compatibilidade não é suficiente.

**Escolha sobre autoria: omitir `executed_by` e também `recorded_by` deste contexto.** Autoria principal continua no fato/execution/audit correspondente, já verificado pelo servidor. `audit_event_id` aponta o registro correspondente, com scope/causa/ato conferidos na mesma transação; `created_at` só informa persistência do contexto, não substitui execução comercial. Se futuramente houver necessidade demonstrada de distinguir quem persistiu tecnicamente, revisar um `recorded_by` de proveniência técnica, nunca concorrente do executor. Omitir agora elimina ambiguidade e divergência de duas cópias de autoria; não remove metadado de executor do fato/audit ou checks atuais.

`record_id/record_path/fact_kind` não constitui FK polimórfica mágica. Para roots SQL listados, link tipado e validação de cobertura dão referência concreta. Filhos de venda/recebimento podem exigir links tipados por ordinal na migration de seu writer. Para Caixa/Financeiro ainda em snapshot, a primeira versão deve registrar contextId no **fato novo**, validar namespace/caminho e cobertura na mesma transação do `unit_states`, comparar SQL/snapshot/índice/audit e proteger alteração/remoção do contexto. Não declarar FK SQL para coleção JSON. O registro de kinds/caminhos por comando será fechado na revisão de cada writer antes de habilitar efeitos; se faltar cobertura, gate não abre.

Vocabulário inicial candidato de `fact_kind`, fechado por CHECK na proposta DDL: SALE, SALE_RECEIPT, SALE_RETURN, SALE_REFUND, PURCHASE, PURCHASE_RECEIPT, STOCK_MOVEMENT, STOCK_ENTRY, POSITION_MOVEMENT, CASH_MOVEMENT, EXPENSE, PAYABLE_PAYMENT e FINANCIAL_CORRECTION. Incluir um código no schema não habilita seu writer. Kinds posteriores exigem revisão/versionamento; não aceitar qualquer string do cliente. Para links tipados, respectivamente SALE/PURCHASE/STOCK_MOVEMENT e `record_path=''`; qualquer outro kind/ref é rejeitado. Os demais kinds só produzem fatos após seus contratos/coverage forem homologados.

As estruturas factuais desta seção pertencem aos incrementos de writers, **não ao subconjunto mínimo da primeira migration**. Não é autorização de adicionar associações a todos os agregados de uma vez. Não normalizar agora Caixa/Financeiro nem guardar JSON histórico como substituto de SQL. Novas refs em snapshots/mirrors serão parte de contrato versionado dos fatos novos; bytes/hashes/presença/ordinais de fatos antigos não recebem campo retroativo. Perfil/link ausente de fato novo é falha de consistência, não fallback para perfil atual.

Auditoria Org-only usa novo evento com par C/U NULL/NULL, compatível com CHECK de 001, com refs mínimas no payload novo e sidecar tenant-scoped. Não colocar apenas company_id no evento antigo, pois seu CHECK exige par. Eventos Unit mantêm par original. Consultas v2 usam sidecar + escopo; eventos históricos continuam com namespace/hash original. Sanitizador atual por regex **não basta** para prometer proteção de CPF, evidência ou texto livre: novos comandos legais usam allowlist/minimização, referências opacas e motivos controlados. Cadeia técnica global continua verificável pelo serviço, sem expô-la inteira ao tenant.

### 11.3 Distribuição nas 51 tabelas atuais

| Família atual | Tratamento futuro |
| --- | --- |
| companies/units/users/memberships/roles/permissions/sessions | Org, identidade, templates e contexto conforme catálogo. Não são 51 fatos jurídicos para receber Legal compulsoriamente. |
| unit_states/entity_index/import_runs/normalizations/foundation_meta/schema_migrations | Preservar scope técnico/checksums/hashes; novos metadados externos. Chaves de meta/cache incluem contexto quando aplicável, não reescrever globais técnicos como dados de tenant. |
| Produtos/aliases/packages, Clientes, Fornecedores | Continuam Unit-scoped até incremento próprio de sharing. Não atribuir titular ao cadastro para inferir propriedade de obrigações. |
| Compras, itens, recebimentos e itens de recebimento | Root compra com contexto novo; filho estrutural herda root; novo recebimento exige seu contexto/ato; legado tem resolução separada por fato/lote comprovado. |
| Saldos globais/físicos, movimentos e entradas | Saldo é projeção de fatos por Unit; movimento/entrada novos devem ter contexto e vínculo de causa. Não transformar saldo em transferência automática. Posições internas não são outra Unit. |
| Vendas + 16 tabelas de filhos | Root e novos atos jurídicos com contexto; ordinais/snapshots e IDs originais permanecem. Não substituir nome/preço/pacote histórico por cadastro atual. |
| inactive_permission_upgrade/reset_permission_upgrade | Registros técnicos de concessões únicas permanecem; não executar de novo nem convertê-los em Owner/novos direitos históricos. |
| inactive_sale_approvals/password_reset_grants | Credenciais transitórias vinculadas ao contexto original; consumidas preservadas, não consumidas revogadas/expiradas no corte autorizado. Não mudar prova antiga para “caber” na Legal nova. |
| Auditoria | Append-only original e sidecar de eventos novos, sem rehash. |

O inventário detalhado de PKs/FKs e todos os nomes está preservado na ORG-001 §11; esta matriz especifica o tratamento alvo sem duplicar ou modificar o checkpoint conceitual.

## 12. Fingerprints, commands e replay versionado

**ATUAL comprovado:** `server.js` protege a intenção externa por `legacy-sale-v1:` + hash canônico `{companyId,unitId,userId,draft}`; draft validado é compartilhado com aprovação/commercial flow. Mesmo requestId com prova diferente retorna 409 `REPLAY_CHANGED`; ausência de prova completa não vira sucesso silencioso. `public/store.js` mantém payload e chave da intenção preparada ao tentar novamente. Contrato comercial próprio usa `commercialCommandFingerprint`, não é o mesmo fingerprint legado.

| Artefato | Regra de compatibilidade |
| --- | --- |
| legacy-sale-v1/requestId/payload antigos | Permanecem byte/semanticamente pelo algoritmo e **scope original C/U/actor**. B 1:1 não muda IDs nem adiciona Legal ao hash antigo. |
| Histórico sem requestId/prova completa | Não receber hash/key inventados; permanecer distinguido. Não aceitar como prova idempotente completa. |
| operation/purchase/quote/cash Commands e outros ledgers | Namespace, formato e canonicalização originais preservados. Converter somente com contrato específico, nunca recalcular todo ledger por efeito colateral. |
| Aprovação inativo / approvalToken | Credencial transitória fora do fingerprint; manter vínculo/prova/contexto validado no consumo. Não incorporar token para fazer hash variar. |
| Auditoria/import hash/content hash de fatos antigos | Não rehash, reimportar ou acrescentar metadado dentro de bytes históricos. |
| Novo contrato v2, se necessário | Define domínio/ação estáveis + versão + Org/Legal/Unit/actor + conteúdo comercial + refs de perfil/contexto aprovadas que alterem a intenção. Exclui sessão transitória/CSRF/tokens/documento bruto. Algoritmo final revisado por contrato. |

Regra de dispatch: procurar a identidade no namespace original **antes de qualquer efeito**; reconhecer contrato/fingerprint armazenado; verificar direito atual de consultar o resultado; comparar pelo algoritmo original. V1 no scope antigo pode consultar resultado já consumado, inclusive Unit CLOSED com direito histórico; não autoriza nova venda CLOSED. V2 não pode reutilizar requestId v1 como “novo namespace de versão” para executar outra venda. Colisão entre contratos ou key usada com outra intenção falha explicitamente e orienta reconciliação, sem gerar chave nova. Resultado histórico não recebe outro contexto/perfil.

Autorização atual continua obrigatória no retry; replay não recupera acesso revogado nem revela resultado de outro ator/tenant. Executar confirmação nova v1 só é admissível em LEGACY/SHADOW sob política v1; no gate alvo, somente writers homologados que registrem contexto novo, e clientes com contrato declarado. O adapter pode conservar verificação v1 para resultado consumado sem autorizar consumo novo nesse contrato. Compatibilidade de retry é distinta de aceitar nova operação sob semântica antiga.

Alteração real da intenção **antes do primeiro envio** pode criar nova chave após revisão do usuário; depois de resposta incerta, primeiro reconciliar a original. Troca de perfil cadastral, corte, preço ou contexto não permite enviar payload alterado com a chave antiga nem renovar automaticamente a identidade para vencer 409. Se um domínio exigir cancelar intenção preparada, o cancelamento/abandono terá estado auditável e não apaga uma confirmação já consumada. Testes IDP-001 permanecem como regressão protegida, sem refactor oportunista.

## 13. Corte PF → PJ — procedimento futuro

Pré-condições: evidência das duas Legals, perfis validados, Unit antiga e sucessora distintas, autorização de corte, plano de interrupção/reconciliação, inventário de obrigações/comandos e regras jurídicas revisadas onde houver transferência. Endereço/nome iguais não são motivo para mudar ownership. Recomenda-se janela controlada de congelamento de novas intenções, não zerar saldos por edição.

| Categoria | Classificação | Tratamento proposto |
| --- | --- | --- |
| Caixa aberto | Encerra + reconcilia | Conferir movimentos/valores e fechar caixa antigo com fatos originais. Sucessora abre outro caixa; diferença vira ocorrência/evento próprio, nunca edição do histórico. |
| Estoque físico/posições | Permanece no antigo até fato explícito de transferência + decisão jurídica futura | Contagem/manifesto e origem/destino/quantidades exatas; saída/entrada vinculadas, ownership/avaliação/documento conforme especificação futura. Mesmo endereço não transfere. |
| Recebíveis | Permanece no antigo | Liquidação histórica na origem com direito/conta compatível. Cessão só por contrato/fato/documentos explicitamente aprovados. |
| Pagáveis | Permanece no antigo | Pagamento histórico pelo titular original; assunção/transferência jurídica depende de outra decisão/documentação. |
| Créditos de clientes/fornecedores | Permanece no antigo | Não utilizar automaticamente na PJ. Transferência/compensação exige fato explícito e regra jurídica futura. |
| Recorrências/acordos | Reconcilia + cancela/encerra agenda futura antiga + prepara nova intenção quando aprovada | Ocorrências já constituídas permanecem. Novas agendas na PJ requerem novo contrato e consentimento aplicável; não copiar identidade de comando. |
| Compras abertas/recebimentos pendentes | Permanece no antigo ou encerra/cancela após reconciliação | Recebimento contra titular original, ou nova compra legítima após tratamento da anterior. Não trocar supplier/Legal de compra existente. Transferência contratual é decisão futura. |
| Quotes/orçamentos | Permanece como histórico; cancela/expira pendência antiga + prepara nova intenção | Revalidar cliente/itens/preço/condições na sucessora; não converter quote da PF em venda PJ por simples seleção. |
| Reservas | Reconcilia + encerra/cancela antiga + prepara nova intenção | Liberar/consumir pelos eventos autorizados da origem. Reserva na PJ requer estoque/direito próprios. |
| Devoluções/refunds | Permanece no antigo | Vincular à venda/obrigação original. Se outro local/Legal receber fisicamente, exige fato/contrato de logística/transferência; não rescopar a devolução. |
| Requests preparados | Reconcilia resultado original; cancela/abandona somente se não consumado; prepara nova intenção legítima | Timeout pode significar commit. Mesma chave/payload retorna na origem; nova venda na sucessora só após esclarecimento. |
| Commands pendentes | Reconcilia | Levantar consumado/incerto/não enviado; consultar ledgers originais. Não reexecutar em PJ nem renomear scope. |
| Exports | Cancela acesso pendente quando contexto/revogação exigir; prepara novo job | Arquivo histórico retém titular de origem; novo job revalida scope, não reetiqueta dados. |
| Drafts/storage | Permanece no namespace antigo; prepara nova intenção explícita | Não copiar requestId, token de aprovação ou caixa esperado; revisão do conteúdo é obrigatória. |
| Sessões abertas | Encerra/revoga contexto operacional antigo + reconcilia respostas + seleciona novo | Atualizar epochs/CSRF, abortar respostas antigas; contexto histórico antigo continua disponível por direito específico. Grants de gerentes não seguem sucessão. |

Após corte, Unit antiga CLOSED e sucessora ACTIVE somente depois dos gates. Sua relação de sucessão não executa qualquer linha dessa matriz. Legal antiga pode ficar CLOSED com direitos de conclusão histórica. Owner mantém descendência estrutural na mesma Org; demais grants requerem atribuição explícita à sucessora. O plano de corte deve listar pendências não transferíveis e responsáveis reais, sem fabricar aprovador para obrigações antigas.

## 14. Contratos estruturais de sharing

Sem migrar Pessoas/Produtos nesta rodada:

| Contrato futuro | Limite obrigatório |
| --- | --- |
| People/OrganizationsRepository(org, personId) | Base comum por Org com PF/PJ/papéis, relações de uso/visibilidade Legal/Unit. Cliente/fornecedor são papéis, não autorização global. Contraparte comercial não é automaticamente Legal titular do tenant. |
| ProductRepository(org, productId) | Identidade base Org; projection/activation `(org,unit,product)`; saldo/localização por Unit. Compartilhar catálogo não concede venda/estoque em outra Unit. |
| LegacyRecordRef(org,unit,kind,id)→canonicalId | Mapa explícito; IDs comerciais atuais preservados. Canonical ID novo só quando incremento próprio exigir e tiver correspondência revisada. Não merge por nome/SKU/CPF/CNPJ. |
| PricingContext(org,legal,unit,channel,...) | Política pode existir em Org; aplicação elegível/contextual e override/alçada próprios. Não mudar preço atual por esta especificação. `policy.manage` separado da ação de vender/descontar. |

As FKs novas usam Org + identidade, de modo que referências futuras a bases compartilhadas caibam sem remover a coerência legal/unit dos fatos. Catalog sharing não transfere stock/obrigações ou mistura histórico. Normalização/duplicidade completa será outro desenho; não dimensionar a migration organizacional como migração de todas as pessoas/produtos.

## 15. Estratégia da futura migration e gates

**Não existe migration 011 nesta entrega.** A próxima rodada pode revisar sua proposta, se solicitada; execução exige aceite específico. Não editar 001–010, não renomear companies/units, não acrescentar coluna que quebre inserts posicionais atuais sem adaptar writer e provar compatibilidade no mesmo incremento autorizado.

### 15.1 Alvo completo não é uma única migration

**A futura 011 não deve ser presumida como implementação integral da ORG-002. Não criar `011_everything`.** C1 deverá propor o menor subconjunto aditivo/dormente necessário, com finalidade e dependências justificadas tabela por tabela; C1 é revisão de proposta, não sua execução. O catálogo §§6–16 descreve o alvo completo e não obriga que todas as suas colunas/FKs existam desde a primeira migration.

| Incremento/migration futura | Subconjunto candidato e dependências | O que fica fora / condição |
| --- | --- | --- |
| C1 proposta → C2 implementação, candidata 011 se autorizada | Org física existente, Legal PROVISIONED/perfis, resolução **UNIT básica** e binding estrutural com guardas de publicação; somente partes demonstradamente necessárias, dormentes | Não ativar Legals/bindings, não preencher dados reais, não implementar ACL/sessão/fatos; lifecycle avançado/sucessão podem aguardar se nenhum requisito mínimo os exigir |
| C3, migration posterior própria se necessária | Adapter/shadow e controle inicial de protocolo/gate | `first_v2_fact_id` e sua FK não existem antes de `business_fact_contexts`: adição será revisada em C7, sem criar contexto factual prematuramente para satisfazer a FK |
| C4, migrations posteriores próprias | Mapping/proveniência/backfill com idempotência conforme contrato; publicação só se explicitamente autorizada | BATCH/`resolution_batch_items`, resolução FACT e backfill avançado podem receber increments/migrations ainda posteriores; não são requisito automático da 011 |
| C5, migrations próprias | Owner, revisões/head/permissões de templates e grants materializados/selados | Autoridade v2 shadow; não criar sessão/contexto factual por arrasto |
| C6, migrations próprias | Sessão/contexto v2, protocolos/gates, lifecycle e leitura histórica pertinentes | Sem writer factual liberado só por selecionar contexto |
| C7 por writer, migrations próprias | Contextos factuais sem executor duplicado, links tipados, audit metadata e coverage; FK primeiro fato no gate quando instalada | Instalar apenas kinds/associações necessários ao writer aprovado; financeiros/JSON têm testes/contratos próprios |
| C8, migrations próprias quando necessárias | Sucessão/corte/conclusão histórica e resolução FACT/BATCH que seus casos realmente exigirem | Sem transferência implícita; requisitos jurídicos e recuperação aprovados antes dos efeitos |
| C9, retirada sob plano próprio | Descontinuação de aliases/consumidores, eventualmente rename revisado | Replay/história/evidência preservados; nenhuma exclusão silenciosa |

Cada proposta de migration especificará quais versões de tabelas/colunas/enums/triggers do catálogo instala, qual protocolo lê/escreve e o que continua ausente. Não aceitar FACT/BATCH ou qualquer efeito cuja estrutura/contrato ainda não foi instalado; CHECK/enums e writers devem corresponder ao subconjunto. Expansões das tabelas de metadados exigem revisão de compatibilidade/constraints/preservação, nunca editar migrations já aplicadas. Numeração posterior será decidida no incremento autorizado, não reservada como cronograma nesta documentação.

### 15.2 Higiene de chaves e índices na proposta DDL

| Constraint/índice candidato | Garantia real / decisão de desenho |
| --- | --- |
| PK compostas existentes/novas | Identidade no namespace e alvo de FKs; não acrescentar UNIQUE/índice com mesmas colunas/ordem sem garantia adicional |
| UNIQUE(id) em estruturas de IDs novos que declaram unicidade global | Acrescenta garantia entre Orgs que PK(org,id) não oferece; manter somente onde essa unicidade for contrato declarado, sem forçar IDs legados |
| UNIQUE(org,legal,unit) de binding | A unicidade de Unit já vem da PK; aqui é chave candidata **necessária à FK tripla** que prova coincidência do titular estrutural. SQLite exige chave candidata declarada para essa FK. Manter enquanto essa FK existir; não duplicar índice de consulta igual |
| UNIQUE(org,id,user_id) de Owner | Chave candidata necessária à FK do grant Owner que prova mesmo usuário/Org. Não duplicar índice equivalente |
| UNIQUE(org,id,user_id) de scoped_assignments | Nenhuma FK do desenho o referencia e PK já basta: **removido do catálogo** |
| UNIQUE parcial de Owner ativo / predecessor de resolução / sujeito inicial | Regras distintas da PK: um Owner ativo por usuário/Org, uma supersessão e uma afirmação inicial por sujeito; manter com predicates/NULLs homologados |
| Índice integral de predecessor de resolução | Lookup não nulo já coberto pelo UNIQUE parcial; removido por default; reavaliar somente se query/medição provar outra necessidade |
| PK de revision_permissions + UNIQUE da mesma tupla | PK já impede código repetido na revisão; não acrescentar UNIQUE/índice idêntico |
| UNIQUE(org,successor) em succession | Impede dois predecessores para a mesma sucessora no modelo 1→1; distinta da PK do predecessor |
| UNIQUE dos links factuais / plan_digest / origin_key | Impede reutilização de contexto, reaplicação de plano ou duplicação de origem; justificar cada relação ao revisar seu incremento |
| Índices de listagem/contexto/audit | Desempenho, não autoridade/constraint de negócio; conferir prefixos de PK/UNIQUE existentes, planos e medição futura antes de duplicar |

Chave candidata aparentemente redundante na unicidade pode ser necessária para **integridade de referência composta**. Eliminá-la sem revisar a FK enfraqueceria o desenho; a proposta DDL deverá registrar essa diferença ou provar alternativa com a mesma garantia. Não remover constraints de 001–010 nem alterar schema agora. Esta higiene é revisão do catálogo futuro, não otimização executada.

| Etapa futura | Operação proposta | Gate de saída |
| --- | --- | --- |
| Pré-flight | Conferir versão/schema/checksums/foreign_keys, backup validável, writers ativos, manifesto sem dados sensíveis expostos; medir cópia isolada | Sem divergência ou alteração de origem; recuperação aceita; autorização explícita |
| Estrutura aditiva | Criar primeiro subconjunto de tabelas/índices/triggers necessário à estrutura/evidência, numa transação do migrador quando possível | 001–010 intocadas, `foreign_key_check`/schema sintéticos aprovados; aplicação antiga testada com estrutura dormente |
| Compatibilidade | Introduzir repositório Org e resolver/adapter shadow com flags LEGACY/SHADOW; revisar bootstrap/Admin/reset/runtime | Nenhum direito/efeito novo; equivalência e ausência de writer antigo inesperado |
| Mapping/backfill técnico | Org 1:1 sem escrita de fato; preparar evidência, UNRESOLVED/propostas; bindings só por rito separado aprovado/publicável | IDs/hash/espelhos originais iguais; execução repetida idempotente; nenhum INSERT provisório ou ativação implícita |
| Shadow validation | Comparar contexto/ACL candidata, vínculos e coverage sem usar candidato para autorizar | `acesso_depois ⊆ acesso_antes` para migrados; perdas relevantes apresentadas para revisão; epochs sincronizadas |
| ACL/contexto | Gate v2 por Org/coorte, depois de todos os caminhos pertinentes reconhecerem política nova | Binário antigo impedido de escrever; sessões/CSRF/consumidores homologados; direitos históricos explícitos; sem fallback v1 |
| Novos fatos | Habilitar um writer/contrato por vez com contexto factual, link tipado ou cobertura JSON, replay e auditoria transacionais | Nenhuma nova escrita sem Legal/perfil; regressões e falhas/timeout aprovados |
| Corte U-A | Rito operacional PF→PJ solicitado, pendências reconciliadas, sucessora e grants explícitos | Estoque/obrigações não relabelados, caixa fechado/novo caixa, contexto antigo bloqueado para novo comércio |
| Retirada posterior | Deprecar DTO/adapter v1 operacional, mantendo replay/histórico; rename físico só em incremento próprio | Critérios §10.4 e recovery cumpridos, sem reidentificar histórico |

Não criar todas as estruturas e ativá-las por bootstrap. DDL pode ser aditivo, mas os componentes ACL/contexto/fatos precisam de incrementos revisados e coesos. `SqlStore.migrate` atual aplica arquivos novos ao iniciar: publicar o arquivo já é uma decisão de implantação. Migration estrutural deve ficar **dormente**, sem seed que atribua Owner, novos scopes ou Legal automaticamente. Gates de autorização/fato exigem comando de deployment explícito e auditoria.

Transações: DDL e registro de checksum por migration; backfill em lotes limitados com checkpoints; comandos críticos em uma transação síncrona `BEGIN IMMEDIATE`, com revalidação de contexto/rights/epochs e dados antes do commit. Leitura de evidência externa/KDF fica fora da transação; conferir referência/digest/revisão confiáveis novamente ao aplicar. Não prometer operação assíncrona distribuída atômica. Transferência de estoque entre Units no mesmo banco e eventual cloud distribuído precisam de contrato separado, não seguir do desenho da FK.

Em SHADOW, `unit_lifecycle` e grants são candidatos, não autoridade. Até o gate, status/ACL v1 continuam vigentes. No v2, lifecycle é único writer de estado operacional, e `units.status` é projeção compatível (`ACTIVE→active`, demais→inactive); named legacy “inactive” não é promovido a CLOSED com causa fictícia. Projeção não é mecanismo suficiente de segurança se binário antigo puder reativar/copiar papéis: impedir seu uso é requisito. `unit_memberships/unit_roles` não recebem concessão artificial para que Owner passe por guardas antigas. Writers, `executionMetadata/actorColumns`, consultas, admin e storage precisam consumir o contexto verificado novo nos incrementos pertinentes.

## 16. Backfill evidenciado e idempotente

### 16.1 Estruturas de controle

| Tabela | Todas as colunas | Chaves/checks/índices | Autoridade e mutabilidade |
| --- | --- | --- | --- |
| `organizational_backfill_runs` | org,id,design_version,source_schema_digest,source_manifest_digest,evidence_manifest_ref,plan_digest,status,started_at,started_by,completed_at?,result_ref?,audit_event_id | PK(org,id), UNIQUE(id), UNIQUE(org,plan_digest); FK org/actor/audit; CHECK status PREPARED/APPLIED/FAILED e versões/digests de formato revisado; APPLIED exige completed_at/result_ref; índice `(org,status,started_at,id)` | Ledger técnico do plano aprovado. Plano/digests/autor imutáveis; resultado/status por CAS, sem reaplicar item concluído. Artefatos protegidos ficam fora de Git/log público. FAILED tem motivo no resultado/audit, preserva checkpoint. |
| `organizational_backfill_keys` | org,origin_key,run_id,item_kind,legal_entity_id?,unit_id?,resolution_event_id?,assignment_id?,created_at | PK(org,origin_key); FK run(org,run_id), legal nullable, unit nullable, resolution nullable e assignment nullable; CHECK item_kind LEGAL/UNIT_RESOLUTION/GRANT e exatamente o alvo aplicável; índice `(org,run_id,origin_key)` | Chave persistida de origem→resultado, imutável; impede UUID/event/grant duplicado no retry do mesmo item. Não cria PK comercial nova. |

Forma de backfill_keys: LEGAL exige legal_entity_id, demais alvos NULL; UNIT_RESOLUTION exige unit_id/resolution_event_id e legal/assignment NULL; GRANT exige assignment_id, demais NULL. Item UNIT_RESOLUTION registra preparação/evidência, **não publica binding nem ativa Legal automaticamente**, mesmo se a afirmação for RESOLVED. Publicação segue seu comando/aceite idempotente após aprovação; chave de item anterior não troca de resultado silenciosamente. Granularidade FACT/BATCH usa futuro item específico e migrations posteriores quando necessária; não reutilizar UNIT para comprovar lote sem manifesto.

### 16.2 Algoritmo proposto

1. Em ambiente autorizado, produzir manifestos: schema/checksums, companies/Units/PKs, hashes de equivalência, grants efetivos e referências de evidência. Não incluir CPF/senha/token em digest de venda ou manifestos públicos. Manifesto operacional e seus dados são protegidos e não publicados em docs/Git.
2. Validar desenho aprovado, Org 1:1, namespaces sem colisão indevida, integridade da fonte e cadeia de auditoria. Company conhecida usa **o mesmo ID**; não INSERT outra Org nem fazer merge. Divergência estrutural aborta o plano, não “corrige” origem.
3. Elaborar plan_digest sobre versão do desenho + manifestos canônicos + decisões de evidência/aprovação + escopo. Não usar valor sensível de baixa entropia como “prova segura” por hash. Revisar e aceitar plano antes de aplicar.
4. Inserir/reusar run pela UNIQUE(org,plan_digest). `origin_key` é namespace do item + chave legada + versão da afirmação/manifesto aprovado; a mesma afirmação gera mesma chave. UUID alvo é criado **uma vez** e persistido; não regenerado ao retentar. Troca de evidência requer nova revisão/evento superseding, não fazer UPSERT do titular.
5. Para Unit sem prova: item/evento UNRESOLVED com proveniência técnica e actor técnico real da execução, ou NULL quando processo técnico legítimo sem pessoa; não atribuir esse actor como autor de fatos antigos. Lifecycle candidate não permite novo efeito. Sem binding.
6. Para Unit com evidência: criar/reusar candidata Legal PROVISIONED ou Legal já validada **pela correspondência explícita**, perfil/dossiê e evento de proposta/resolução conforme validação. Não inserir binding por ter passado no backfill. Erro pré-publicação supersede proposta/evidência na mesma Unit; publicação/ativação exige rito §7.2 e autorização explícita, com identidade de comando estável. Reexecução desse comando reconhece o mesmo binding aprovado sem duplicar publicação/audit de sucesso. Binding publicado divergente **interrompe** com HOLD/contestação/revisão; nunca UPDATE/DELETE do pai. Identidade já existente é reusada só por correspondência comprovada, não nome/documento.
7. Para grants: extrair conjunto efetivo exato por usuário/Unit/ação da ACL vigente no instante consistente. Materializar grant UNIT e permissões aprovadas, fechadas, sem Owner, policy.manage, novo direito histórico ou nova Legal implícita. Para Unit UNRESOLVED, o candidato v2 sela somente leituras compatíveis; direitos de efeito existentes são preservados como evidência v1 e registrados como restrição até resolução/novo aceite, não como permissão comercial operacional em contexto inválido. Guardar proveniência e diffs de perda/restrição. Administração Org-wide atual exige análise por recurso: escolher subconjunto conservador e apresentar perdas, não assumir que permissão numa Unit autorize a Org toda no alvo.
8. Em cada lote, `BEGIN IMMEDIATE`: revalidar origem/epoch/manifesto; chave→resultado existente retorna o mesmo resultado, verifica conteúdo sem emitir duplicata; item novo grava controle, estrutura e **nova auditoria técnica** atomicamente. Falha desfaz lote inteiro. Checkpoint anterior permanece; registro de falha técnico ocorre separadamente após rollback, sem sucesso comercial.
9. Conferir que payloads, revisões comerciais, IDs, ordem, extras, centavos/quantidades, ledgers, requestIds/fingerprints, import hashes, SQL e auditoria antiga não mudaram. Auditoria pode ter novos eventos técnicos esperados; o prefixo original e seus hashes precisam ser idênticos. Não usar número total de eventos igual como critério quando novos eventos técnicos são previstos.
10. Reexecução total/parcial após crash deve retornar mapeamentos/IDs já persistidos, sem venda/baixa/recebimento/contexto factual/audit duplicado de item concluído. Fonte alterada ou plano diferente não é retry automático; novo plano revisado. Somente após relatório de equivalência e aceite abrir o próximo gate.

**Não chamar** `performImport`, `sale`, `executeStateCommand`, `saveBusinessState` ou normalização comercial para “preencher titular” no backfill. Backfill não executa negócio, não reimporta, não altera old fingerprint, não fabrica authors. Falta de mapeamento concreto permanece pendência legítima. Nesta rodada o algoritmo é textual; não foi gerado manifesto nem executado item.

## 17. Matriz de testes futura — antes de habilitar implementação

Fixture exclusivamente sintética: Org X e Y; Legal A(PF) e B(PJ) em X; U1/U2 sob A, U3 sob B; outra Legal/Unit em Y; Owner X explícito; Manager só U1; User global com memberships independentes X/Y; Unit CLOSED com obrigação antiga; Unit legada UNRESOLVED sem binding; sucessora PJ de U1; novos descendentes criados após grants. Sem banco da loja ou documentos pessoais reais.

| ID | Cenário / camada | Resultado exigido |
| --- | --- | --- |
| T01 | DDL/constraints: Org X, Legal Y, Unit X; alteração/delete de binding/IDs; checks de shape e FKs | SQL adverso sintético falha; nenhum cross-tenant, reparenting, evento/perfil apagado |
| T02 | Idempotência migration/controle de checksums, falha no meio do DDL | 001–010 idênticas; migration ou conclui ou rollback; schema dormente não ativa negócio |
| T03 | Resolver: Org X/Legal A/U3(B), ID inexistente, par/header parcial ou contraditório | Fail-closed sem fallback/enumeração de outro scope |
| T04 | Leitura/escrita/detail por IDs de X/Y em todas as APIs pertinentes | Nenhum conteúdo, COUNT, efeito ou log sensível cross-tenant |
| T05 | User A G1 vende U1 + G2 consulta U1/U2; vender U2 ou Legal B/U3 | Leitura U2 admitida por G2; venda U2 negada; sem produto cartesiano |
| T06 | LEGAL/ORG_CLOSED grants e criação de novos descendentes | Novas Units/Legals não entram no conjunto antigo; apenas concessão explícita ou Owner dinâmico |
| T07 | Owner X, papel chamado Owner sem atribuição, criador com todas permissions | Só atribuição explícita válida ativa descendant scope; direitos por ação continuam necessários; Y sempre negada |
| T08 | Múltiplos Owners, revogar último, suspender membership, incidente global | CAS concorrente não deixa último Owner efetivo por ação administrativa; contenção global bloqueia/HOLD sem inventar substituto |
| T09 | Administração: listar/criar Unit/Legal, papel/grant, usuário e convite | Escopo de recurso respeitado; não copiar papéis para sucessora; nenhuma posse de senha global por tenant |
| T10 | User global X/Y, suspensão vínculo X e alteração credencial global | X revogado, Y independente; reset tenant não atinge credencial global; sessão global revogada conforme Identity, sem cópia de usuário |
| T11 | List/count/search/paginação/exports, parcial financeiro/custo, caches e audit | Predicados antes de agregação/paginação; mesmos limites de campo atuais ou mais restritos; jobs/download revalidam scope |
| T12 | Sessão/Cookie/CSRF/headers/mode/revision, replay de CSRF de outra Unit/Legal, revogação | Token de contexto antigo falha; cliente não vira authority; resolver revalida após operação assíncrona e dentro da transação |
| T13 | CLOSED: leitura e recebimento/return/refund/cancel/audit com e sem direitos | Novo comércio negado; só conclusão histórica aplicável; nenhuma reativação ou traslado de titular |
| T14 | UNRESOLVED: leitura compatível, confirmação nova, obrigação não comprovada | História legível no scope; efeito novo negado sem titular; nenhuma PF/PJ UNKNOWN |
| T15 | Preparação UNIT corrigida antes de publicação; publicação concorrente/retry; contestação pós-publicação sem fato v2; FACT/BATCH quando instalados | Supersessão pré-publicação preserva Unit, não exige sucessora; só cabeça aprovada/Legal ACTIVE publica; depois INSERT imutável mesmo com gate fechado; contestação HOLD, sem troca de pai; estruturas não instaladas negadas |
| T16 | Legal PROVISIONED, ativação/perfil, versão usada no fato, cadastro alterado após preparação | PROVISIONED não publica binding/contexto/efeito; só validação técnica; identidade ACTIVE imutável, histórico usa perfil original; retry não muda intenção |
| T17 | Replay IDP-001 v1 na origem após gate/CLOSED; v2 com mesma key; outro actor/tenant/payload | Mesmo resultado autorizado sem segundo efeito; colisão/alteração nega; nenhuma nova key em erro; approvalToken fora FP |
| T18 | Perda de resposta pós-commit, duas confirmações concorrentes, falha de auditoria/link/mirror | Um efeito comercial completo ou nenhum; mesma key/payload no retry; não duas vendas/baixas/recebimentos |
| T19 | Prefixos de auditoria/hash/import/ledgers/extras/ordinais e ausência/null antigos | Identidade histórica canônica preservada; novos eventos técnicos/factuais separados e verificáveis |
| T20 | Snapshot/SQL/mirror: sync delete/reinsert com FKs deferred; cobertura de atos novos/JSON | Commit não aceita root órfão/contexto ausente ou pai divergente; conteúdo/centavos exatos; erro reverte tudo |
| T21 | Backfill repetido/parcial/crash, mesma origem vs origem/plano alterados | Mesmos IDs/mapas; zero efeitos comerciais; no-op audit de item consumado; plano alterado exige revisão |
| T22 | PF→PJ: caixa/stock/obrigações/quotes/reservas/commands/drafts/sessões | Matriz §13 observada; nada transferido por local comum; Owner e grants fechados separados |
| T23 | UI legada/React: late HTTP, contexto em outra aba, logout, draft antigo e confirmação incerta | Não aplicar resposta/draft no contexto novo; bloqueio até reconciliar; chave original não reutilizada na sucessora |
| T24 | Exports/arquivo/search/log/evidenceRef/profiles de outra Legal/Org | Acesso filtrado/revalidado, sem documentos brutos/token/URL assinada em log/fingerprint/metadata público |
| T25 | Rollback antes/apos novos fatos e após gate ACL, restore isolado, forward fix/HOLD | Nenhum writer antigo aceita estado novo; restauração não perde fatos recentes silenciosamente nem degrada outras Orgs |
| T26 | Equivalência de ACL e DTOs, contratos antigo/novo, callers técnicos sem userId | Para migrados, `acesso_depois ⊆ acesso_antes`; permissões expandidas novas separadas/aceitas; helper técnico sem usuário não é exposto como bypass HTTP |
| T27 | Role revision, refresh explícito, revogação concorrente, source_role cruzada | Fonte versionada imutável e FK tenant-scoped; template novo não muda grant ativo; diff/seleção/revalidação/substituição auditados; não ressuscita revoked |
| T28 | Protocolo requerido x manifesto de build, strings de versões ambíguas, writer antigo, subconjunto de schema | Decisão por protocolo inteiro/suporte declarado homologado; sem lexical/semver informal ou autoridade declarada pelo cliente; falha fechada para estrutura/kind não instalado |
| T29 | Contexto factual x execução/audit, persistência técnica diferente, FK/ref incorreta | Contexto não contém executor concorrente; autoria vem do fato/execution/audit; scope/ato/link atômicos e divergência rejeitada |

Cobertura por superfície: auth/context/setup/reset; Admin; legacy complete snapshot/exports; commercial list/detail/write; inventory/purchase/sales; audit/attachments futuros que toquem contexto. Incluir endpoints conhecidos de leitura e escrita e IDs aninhados/aliases/ordinais. Um teste no resolver não substitui testes HTTP negativos dos caminhos reais. No futuro, alterações em isolamento exigem testes cross-tenant e cross-Legal pertinentes, não só happy path.

Equivalência: fixar corpus `(principal,action,resource,projection,estado)` por snapshot consistente da ACL atual; comparar decisões candidatas/queries/contagens e diferenças de campo. O conjunto positivo migrado nunca pode crescer. Reduções esperadas são listadas e aceitas antes do gate, incluindo administração/reset e inativos. Concessões Owner/direitos históricos explícitas são outro corpus, com origem/aceite e negativos próprios. Validar revogação posterior ao shadow antes de ativar para não ressuscitar grants stale.

TDD futuro por incremento: Red do contrato/negativo relevante → Green mínimo → Refactor apenas necessário. Regressões pertinentes: entities/access/rbac/identity/request-context/authorization/admin/access-maintenance; import/audit/transactions/scoped-state; seis agregados e mirrors; legacy-sale-idempotency/legacy-sale-retry-ui; frontend/sessão/contexto e exports. Selecionar pelos caminhos alterados, sem repetir suite irrelevante para aumentar contagem. **Nenhum desses testes foi executado nesta rodada documental.**

## 18. Performance: índices candidatos e medição futura

Priorizar Org nas consultas de tenant, resolver por PK, evitar carregar `unit_states.payload` para contexto/ACL/listas SQL. Não adicionar índice por intuição sem explicar query. Índices candidatos do catálogo são propostas, não mudança executada.

| Fluxo | Índices/estratégia propostos | Benchmark futuro e evidência |
| --- | --- | --- |
| Resolver contexto | Units PK(C,id); binding PK(org,unit)/UNIQUE(org,legal,unit); Legal PK; lifecycle PK; model_state PK; sessão PK/índice por user existente | Latência p50/p95/p99, round trips, planos e desempenho com muitos memberships; verificar validação no mesmo commit |
| Listar contextos | Membership(company_id,status,user_id); assignments(user_id,org,status,id); lifecycle(org,state,unit); binding(org,legal,unit) | Muitos tenants/Legals/Units e Owner com descendentes; paginação e não N+1 por papel |
| Verificar scope | assignment_permissions PK e índices reversos de members Unit/Legal | Muitos grants e comandos com múltiplas ações; comparação evaluator SQL vs cache com epochs/revogação |
| Vendas | Índices atuais por C/U/data/cliente/request; sale link PK; fact_contexts(org,legal,kind,date,id) | Lista/count/detail/lookup request de v1/v2; não carregar snapshot em leitura SQL nem perder índice existente |
| Produtos | Produtos atuais scope_name/scope_code e lookup aliases; futuras projeções Org/Unit em incremento próprio | Busca exata/textual e paginação, sem antecipar normalização de sharing |
| Busca/report/analytics | Joins com scope antes de filtro/count; perfil/documento protegido fora de busca livre | Busca seletiva e pouco seletiva, cardinalidade por Legal; resultado cross-scope zero |
| Auditoria/evidências | Audit scope atual; sidecar(org,unit/event) e (org,legal/event); resolução subject/predecessor | Prefixo grande, consulta histórica paginada, cabeças de resolução sem full scan; não expor cadeia global |
| Troca de contexto | Session sidecar PK; epoch/read gates; invalidation por geração | Tempo ponta a ponta, aba concorrente, requisições atrasadas, payload/cache não carregados em contexto errado |

Benchmarks futuros: cópia sintética com distribuição desigual realista, cenários pequenos/grandes por Unit e por Org, cache frio/aquecido, concorrência e contenção de transações SQLite, duração/volume de batches, explain query plan e cobertura de índices de FKs. Definir critérios numéricos antes de medir com base na baseline futura, hardware e demanda; não inventar SLA agora. Nenhum benchmark ou abertura de DB nesta rodada.

## 19. Recovery e limites de rollback

Rollback de **DDL**, rollback de **binário**, desligar **gate** e restaurar **backup** são operações diferentes. Todas requerem plano compatível com o estágio e os fatos já aceitos.

| Momento | Caminho possível | O que não se pode presumir |
| --- | --- | --- |
| Estrutura aditiva dormente, sem nova política/efeito | Voltar ao binário anterior previamente homologado mantendo tabelas dormentes; gates LEGACY; não precisa apagar tabelas de evidência | Mesmo aditivo precisa provar que SQL/INSERTs/triggers antigos continuam válidos; não editar schema_migrations para simular rollback |
| Mapping/SHADOW, sem política v2 efetiva | Suspender backfill/shadow; manter evidência e parar writer organizacional; voltar se equivalência/estrutura comprovadas | Não apagar UNRESOLVED/evidência/resoluções aplicadas para “limpar”; dados operacionais originais não foram reescritos |
| ACL/contexto/lifecycle v2 efetivos, ainda sem fato legal novo | HOLD/read-only ou binário compatível; eventual retorno v1 exige plano explícito de política/sessão e prova de acesso seguro | Ausência de fato novo **não basta** para binário antigo: ele ignora grants fechados/Owner/revogações/CLOSED/contexto e pode copiar papéis ou controlar credencial global |
| Primeiro fato novo com Legal/perfil ou correção histórica executada | Forward fix compatível, HOLD/read-only por Org/Unit/caminho e reconciliação; preservar sidecars/ledgers | Binário antigo não entende contexto, linkage, epochs ou novo comando; pode remover refs/recriar mirror/responder indevidamente. Retorno simples é inseguro |
| Backup anterior a fatos novos | Restaurar cópia **isolada**, validar schema, chains, mirrors, saldos/ledgers e comparar fatos posteriores; planejar reconciliação/retorno | Restore físico é do DB inteiro, com outras Orgs no mesmo arquivo; não é rollback mágico por tenant. Não descartar fatos válidos ou inventar RPO/RTO |

Contenção: fechar gate de novos efeitos; manter consultas seguras autorizadas quando possível; isolar comando/Unit contestada; registrar incidente e versão; preservar exports/intenções/resultados necessários à reconciliação sem expor credenciais. `V2_READONLY/HOLD` precisa barrar também writes indirectos/Admin/runtime e jobs, não só esconder botão. Guardas de versão na aplicação e política de deployment devem impedir processo antigo; flags armazenadas não protegem contra binário que não as lê.

Interromper rollout se: cross-tenant/cross-Legal; ACL migrada mais ampla; writer sem gate/cobertura legal; binding/perfil incompatível; mirror/hash/checksum discrepante; duplicação de efeito/replay; último Owner perdido sem contenção; logs/evidência vazando; restore não verificável; contexto tardio aplicado errado; duração/lock/performance fora dos critérios previamente aceitos. Falha não dispara backfill corretivo automático ou key nova.

Recovery futuro deve especificar responsáveis autorizados, inventário de escritores e fatos desde último backup, janela e aceitação operacional, restauração isolada e ensaio de reconciliação. RPO/RTO e política de retenção permanecem decisões próprias. Backup existente é base útil, não certificação de recovery organizacional/cloud. Não usar backup como fonte de analytics.

## 20. Sequência futura de incrementos revisáveis

Cada linha depende de solicitação/aceite próprios; os nomes C1–C9 abaixo são identificadores **propostos**, não cronograma nem início autorizado.

| Incremento | Escopo pequeno e entrega | Dependência/gate e TDD |
| --- | --- | --- |
| C1 — Revisão de schema | Propor **menor subconjunto** aditivo/dormente da §15.1 e auditar necessidade de cada constraint/índice; não é todo o catálogo nem `011_everything` | Ajustes finais/DDL e pendências revisados; autorização própria; tests futuros T01–T02/T15–T16; nenhuma migration escrita nesta rodada |
| C2 — Estrutura/evidência | Implementar somente subconjunto C1 aprovado; runtime não ativa negócios; recovery ensaiado | C1/DDL aceito, backup isolado; um checkpoint estrutural, sem backfill automático |
| C3 — Org adapter/shadow | Repositório/adapter de contexto 1:1 e relatórios de equivalência; bootstrap/admin mapeados sem ativação | C2; T03/T04/T26 e regressões de scopes; semanticamente manter v1 |
| C4 — Mapping/backfill isolado | Manifestos, UNRESOLVED, resolução autorizada e ledger técnico idempotente | C3 + política de evidência/proteção; T15/T19/T21; levantamento real só com autorização própria |
| C5 — ACL/Owner em shadow | Owners múltiplos explícitos, revisões de template/FK de origem, grants fechados/refresh, admin/global identity e equivalência; migrations próprias | C4 e políticas §25; T05–T10/T26–T27; shadow não concede direito |
| C6 — Contexto/UI/gate | Sessão/CSRF/resolver, cliente legado/React de contexto, filtros/Admin/exports/direitos históricos de leitura; ativação inicialmente read-only | C5; **backend e consumidores compatíveis antes do gate**, T11–T14/T23/T24; impedir writer antigo |
| C7 — Um writer factual por vez | Começar por venda legada se selecionada; IDP-001 preservado; contexto sem autoria concorrente, perfil/link/audit atômicos e migrations próprias | C6 + contrato do writer aprovado; T16–T20/T25/T28–T29; outros writers bloqueados até seu incremento |
| C8 — Histórico/corte operacional | Ações históricas com efeito, depois rito PF→PJ por coorte; especificações de transferência/jurídico necessárias | C7 e contratos de caixa/financeiro/estoque aplicáveis; T13/T17/T22; nenhuma transferência genérica automática |
| C9 — Consolidação e retirada | Equivalência end-to-end e recovery, depreciação do adapter operacional quando uso antigo cessar | Gates §10.4, T25/T26; replay v1 e história preservados; rename físico só se outra revisão justificar |

Testes de equivalência/segurança/recovery acompanham todos os incrementos, não são deixados para C9. Fase D/Entitlement não começa ao concluir C; módulo opcional/backend capability continua dependência externa planejada. Corte não é liberar todos os writers de uma vez. Compartilhar cadastro ou reescrever persistência financeira não entra por arrasto.

## 21. Alternativas e trade-offs registrados para revisão

| Proposta | Alternativa | Impacto/risco residual | Esforço qualitativo futuro |
| --- | --- | --- | --- |
| Binding separado opção 2 | Coluna nullable em units; ou nova Unit física | Join/estado explícitos; evita rebuild/dupla identidade. Depende de todos os writers exigirem vínculo | MÉDIO estrutural; ALTO integração |
| Companies como única Org física | Rename/add nova organizations com outro ID | Dívida nominal temporária; evita identidade duplicada e ruptura de FKs | BAIXO adapter nominal; ALTO retirada física |
| Perfil append-only + head | Atualizar cadastro e copiar texto em cada fato | Mais disciplina de versões/ref protegida; preserva evidência sem duplicar documento sensível em toda linha | MÉDIO; depende Segurança |
| Owner múltiplo explícito + grants de ação (aprovado) | Nome de role/todas permissions | Proteção do último efetivo aprovada; mecanismos de step-up/recuperação permanecem pendentes; não inferir Owner do legado | MÉDIO/ALTO ACL |
| Grants selados com conjuntos fechados | Herança automática de qualquer role Org/Legal | Mais linhas e refresh explícito; impede novos descendentes/ações por surpresa | ALTO adaptação/admin |
| Híbrido factual + links/coverage | Legal em 51 tabelas; derivar tudo de Unit | Redundância controlada, integração complexa com mirror e JSON; cobertura incompleta bloqueia writer | ALTO por domínio |
| Sessão sidecar v2, reemissão | Acrescentar campos em sessions e rebuild/novo contrato único | Evita FK unitmembership fictícia; exige nova lógica Identity/Admin/cliente e deployment mínimo | ALTO; bloqueia gate até homologação |
| Sucessão 1→1 | 1→N/N→1 genérico | Simplicidade agora; divisão/fusão precisa especificação futura | BAIXO relação; ALTO corte |
| Recuperação forward + gates | Voltar binário antigo/backup e perder fatos | Custos de reconciliação e controle de versão; não há rollback simples depois de política/fatos v2 | ALTO operacional |

As estimativas não aprovam execução e não quantificam dias. Dependências relevantes são segurança/proteção de identidade legal, política Owner/global identity, contratos de ações históricas, atores/mirrors e revisão operacional. Não houve escolha de fornecedor cloud, mudança de stack ou fórmula fiscal.

## 22. O que continua sólido e protegido

Preservar IDP-001 e sua intenção/retry, atomicidade/rollback de SQL + espelho + audit, checksum de 001–010, FKs compostas, precisão monetária/quantitativa, projeções de campos por direito, preservação de snapshots/extras/ordinais/import hashes e auditoria append-only. Preservar global users/credential KDF/cookie/host/origin e revogação como base, sem alegar que já satisfazem Owner/Legal/contexto v2. Backup/restore sintético existente deve ser usado como base de ensaio, não removido nem certificado como recovery real por texto.

Não tocar regra atual de preço, alçada comercial ou guarda de estoque negativo para viabilizar desenho organizacional. Estação/POS/caixa/posição/centro não viram Unit por renomeação. Atualizadores/offline/Agente Local não são inseridos no plano C por inferência.

## 23. Riscos residuais e critérios de parada

1. **Evidência desconhecida no legado:** schema não comprova titular. Mitigação: UNRESOLVED por sujeito, manifesto e operador autorizados; bloquear novo efeito sem prova. Não abriu base operacional.
2. **Erro pré-publicação versus binding publicado:** preparação é corrigível por supersessão na mesma Unit, sem sucessora obrigatória; publicar indevidamente aciona HOLD/revisão sem reparentar. Fatos já produzidos exigem correção jurídica própria. Desligar gate não permite trocar pai publicado; U-A preservada.
3. **Dupla autoridade de estados/ACL/contexto:** gates estabelecem autoridade exclusiva; sidecars shadow não autorizam; legados não podem permanecer writers ignorantes do v2.
4. **Permissão atual ampla e cópia administrativa:** redução controlada/revisada e corpus de equivalência; não converter papel completo em Owner. Reset global é fronteira a fechar antes do gate.
5. **Persistência híbrida e FK de mirror:** link tipado deferred e cobertura por writer precisam teste real sintético; generic ref não basta. Gate de fatos fica fechado enquanto incompleto.
6. **Dados legais sensíveis:** novo serviço protegido/ref/lookup pendentes; sanitizador genérico atual não é garantia. Nenhum documento real é necessário para testar estrutura.
7. **Histórico mixto/sem contexto Unit estável:** resolver fatos não autoriza reparentar namespace. Leitura mantém origem; efeitos históricos excepcionais precisam contrato explícito como §24.
8. **Restore multi-tenant/rollback de política:** arquivo único afeta várias Orgs; preservar fatos/epochs/ledgers e impedir versão antiga. Backup não resolve autorização por si.
9. **Claims de homologação:** pseudo-DDL/testplan não são migrations/tests aprovados; navegador/performance/concurrency/recovery continuam não executados nesta entrega.

Se surgir prova de que uma decisão aprovada é inviável ou produz risco superior à alternativa, registrar decisão/seção afetada, evidência técnica, risco, alternativas e recomendação, e **parar antes da mudança** para revisão. Esta rodada não identificou essa condição; os riscos acima têm transição compatível com P01–P12, não autorização de corrigir código.

## 24. Limites específicos do histórico e das pendências jurídicas

O caso comum CLOSED com binding e obrigação da mesma Legal pode ter contexto HISTORICAL válido, respeitando estado da Legal e direito de conclusão, sem exigir reabertura comercial. O resolver usa binding imutável e prova da obrigação, não a Unit sucessora.

Caso excepcional: fato antigo resolvido individualmente para Legal A, mas namespace Unit legado sem binding estável, ou fato com titular comprovado diferente do binding estrutural posterior. A prova factual permite consulta/dossiê/relatório por titular, **não criar VerifiedContextV2 que viole a FK Unit→Legal**. Até contrato de conclusão histórica próprio, o efeito fica bloqueado. Alternativa futura a revisar: contexto executante válido de Legal A + referência imutável ao fato/namespace antigo, com evento jurídico de liquidação/correção que explicite ambos os contextos; isso não reparenta Unit nem relabela o fato. Não escolher automaticamente Unit ativa de A ou sucessora B para cobrar. As regras de conta, recebedor/pagador, devolução e evidência fiscal exigem especificação de domínio e aceite. Este limite evita preencher o passado com a autoridade do presente.

Questões legais/fiscais de CPF/PJ, unicidade cadastral, cessão/assunção/transferência de crédito/dívida/estoque e emissão/correção de documento continuam **A DEFINIR** com revisão especializada; não foram dadas instruções jurídicas nesta especificação. Requisitos técnicos de referência/evidência não substituem validade jurídica.

## 25. Decisões técnicas/operacionais ainda a aprovar

| Pendência | Recomendação para revisão | Impacto se não decidida |
| --- | --- | --- |
| DDL mínimo e higiene de constraints | Opção 2/companies única **já aprovadas**; revisar subconjunto C1, chaves necessárias e schema de preparação/publicação | Não escrever migration organizacional nesta rodada; não repetir aprovação da escolha física |
| Mecanismos operacionais de Owner | Múltiplos/último efetivo **já aprovados**; detalhar recovery/step-up e atribuição inicial explícita | ACL v2 não pode ser ativada por inferência |
| Delegação/templates | Selagem/proveniência/refresh explícito consolidados; revisar FKs de revisões e UX/diff/alçada da aplicação | Mecanismo proposto não implementado; sem refresh automático |
| Proteção/evidência/lookup CPF-CNPJ | Serviço protegido, referências imutáveis, gestão de chaves/retention própria; revisar UNIQUE por Org e duplicatas reais | Somente fixtures sintéticas; não operacionalizar armazenamento/lookup legal real |
| Resolução e contestação | Perfil de resolutor, prova mínima, dupla revisão/step-up onde aplicável, rito de erro sem trocar pai | Binding humano não pode ser publicado só porque existe coluna |
| Direitos históricos e casos mistos | Matriz conceitual aceita; códigos, alçadas, contas, cobertura dos writers e exceções §24 especificados por ação | Novos efeitos históricos ficam fechados quando pré-condição desconhecida |
| Sessão/contrato clientes/reset | Sidecar v2/reemissão, headers/revisions, corte v1 e recuperação global independente | Gate ACL/contexto permanece fechado até revisão de consumidores |
| Sucessão e janela PF→PJ | 1→1 e corte controlado; transferência de cada categoria somente com ato/contrato aprovado | Não migrar saldos/obrigações/intent por local físico |
| Implantação/recovery | Revisar domínio e manifesto de protocolos inteiros/suporte declarado, coortes, HOLD, medição, retention/RPO/RTO | Não rollout por documentação, comparação informal de versões ou retorno inseguro de binário |
| Ordem de writers e milestones | C1–C9 propostos; escolher um writer após fundamentos e revisão | Não habilitar todos os módulos ou Fase D por sequência textual |

Não reabrir B 1:1, U-A, identidade global/P01–P12, opção física 2/companies única ou múltiplos Owners já aceitos. A tabela trata dos mecanismos executivos residuais. O catálogo revisado não tem aceite de implementação/checkpoint; recomendações técnicas remanescentes não viram decisão automática.

## 26. Critérios de aceite desta entrega documental

- Documento permite revisar **uma proposta futura** de schema/migration, suas FKs e limites, sem rediscutir princípios aprovados.
- Opções físicas, autoridade de cada estrutura, estados/transições/constraints, campos/nullability, scopes e contextos foram especificados; invariantes não dependem de frontend.
- UNRESOLVED, correção contestada, casos mistos e ownership/profile/replay antigos/novos estão separados e preservados.
- Planos de migration/backfill, equivalência, teste, performance, recovery e incrementos têm gates explícitos; nenhum plano é implementação.
- Alterações permitidas: este documento novo e indicações mínimas de ORG-002 em revisão no PROJECT_MASTER/ROADMAP. ORG-001/mestre/código/testes/migrations/dependências/dados continuam intactos.
- Verificação desta rodada: leitura de fontes/código/testes/schema textual, conferência Git, revisão documental/links/whitespace. Não abriu SQLite, não iniciou runtime, não executou testes comerciais/backfill/benchmark/navegador, não criou dados/screenshot/manifests, não fez commit/push.

## 27. Rastreabilidade do pedido ORG-002

| Itens do pedido | Seções desta entrega |
| --- | --- |
| 1–3 fontes, alvo e comparação física | §§1–4 |
| 4–7 estruturas, Org/Legal/profile | §§5–8 e 10–11 |
| 8–9 UNRESOLVED e U-A | §7, §§23–24 |
| 10–13 identidade/membership/Owner/scopes/histórico | §§8–9 |
| 14–15 contexto/adapter | §10 |
| 16–17 facts/replay | §§11–12 |
| 18–19 corte/sharing | §§13–14 |
| 20–21 migration/backfill | §§15–16 |
| 22–25 testes/performance/recovery/incrementos | §§17–20 |
| 26 limites | §§22, 26 |
| 27–28 saída, pendências e reporte | §§21–27 + relatório final da rodada |

**Próximo milestone apenas proposto:** revisão do desenho e das pendências bloqueantes, seguida de solicitação separada para preparar uma proposta de DDL estrutural aditivo dormente (C1). Não implementar Legal/Owner/ACL, não escrever migration 011 e não iniciar Fase D por este documento. **Entrega encerrada para revisão do proprietário.**

### 27.1 Rastreabilidade dos ajustes finais

| Item do pedido de revisão | Ajuste incorporado |
| --- | --- |
| 1 opção física | Aprovação explícita §§1.1/4; companies única |
| 2 publicação/imutabilidade | Preparação supersedível versus INSERT autoritativo §§7/16; Unit preservada antes de publicar |
| 3 Legal PROVISIONED | Lifecycle/ativação/guardas §6.3; nenhum contexto/fato comercial provisório |
| 4 Owner | Múltiplos/último efetivo aprovados §8.3; HOLD por incidente, sem bypass |
| 5 roles/grants | Revisões normalizadas, source_role_id/revision, FK e refresh/diff explícitos §8.1 |
| 6 executor contextual | Campo omitido; autoria única no fato/execution/audit §11.2 |
| 7 protocol gates | Inteiros monotônicos + manifesto controlado/suporte declarado §10.2 |
| 8 CPF/CNPJ | Bloqueio de dados reais até Segurança de armazenamento/busca/chave/rotação/log/backups/duplicidade §6.3 |
| 9 BATCH/FACT | Alvo futuro adiável, sem requisito automático da 011 §§7.3/15.1 |
| 10 primeira migration | Menor subconjunto C1; ACL/sessões/fatos/backfill avançado em migrations posteriores §15.1 |
| 11 higiene/schema/revisão integral | Garantia de cada chave/índice, redundância removida/necessidade de FK justificada §15.2; estados/backfill/gates/tests/pendências reconciliados |

**Encerramento dos ajustes:** direção geral e decisões listadas aprovadas; documentação revisada para conferência final, **sem autorização de checkpoint**. Sem commit/push, migration, implementação, base operacional ou Fase D.
