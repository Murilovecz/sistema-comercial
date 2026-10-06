# C1 — Proposta do DDL estrutural mínimo

**Data:** 06/10/2026. **Status: PROPOSTO / EM REVISÃO PELO PROPRIETÁRIO.** Somente análise e documentação; nenhum DDL executado, migration criada ou incremento C2 iniciado.

**Baseline conferida:** `9be605aee8e88e7e2d232f736d42db7eb3245a44`, branch `v1.3-frontend`, árvore limpa na entrada. Esse checkpoint documental aprovou ORG-002; não autorizou implementação. Fonte desta proposta: pedido do proprietário **“FASE C — C1 — PROPOSTA DO DDL ESTRUTURAL MÍNIMO”**, recebido em 06/10/2026. As recomendações abaixo não têm aceite automático.

## 1. Recomendação e limite do primeiro incremento

Recomendo **uma tabela nova, `legal_entities`, com dez colunas, três triggers e nenhum índice explícito de performance**. A tabela usa STRICT e WITHOUT ROWID: a PK composta é sua estrutura primária; UNIQUE(id) gera um índice secundário implícito de integridade. Ela admite somente candidatas PROVISIONED, imutáveis neste incremento. A migration futura criaria estrutura vazia, sem sequer inserir candidata ou evento técnico. Nenhuma entidade operacional, titular de Unit ou titular de fato nasce dessa estrutura.

Perfis, resolução UNIT e binding **podem esperar**: C2 não tem comando de cadastro/validação, resolução ou publicação, nem leitor v2 que os consuma. Não há dado novo a converter nem fato novo que exija FK cadastral. Criá-los agora acrescentaria estados, dependências e testes sem resolver um consumidor atual. O benefício de homologar cedo não justifica instalar uma autoridade de publicação sem o contrato correspondente.

O menor recorte ainda útil é o contrato persistente de **identidade candidata Legal→Org**, com proveniência e proteção física, a ser ensaiado exclusivamente com fixtures sintéticas em C2 se autorizado. Se adiarmos também essa tabela, C2 deixa de ser um incremento estrutural organizacional: seria apenas preparação de testes/compatibilidade, alternativa legítima se o proprietário preferir adiar qualquer schema. Não existe necessidade operacional imediata de instalar uma Legal na loja.

**Versionamento de linha também é adiado:** toda linha é imutável e nenhuma transição é permitida. Um contador constante `version=1` não oferece CAS útil agora. Antes da primeira mutação autorizada, adicionar `version INTEGER NOT NULL DEFAULT 1`, faixa segura e CAS no incremento de ativação. Todas as candidatas terão realmente uma única revisão até então; não será inventada história de mudanças. Perfil versionado continua necessário antes dos fatos que o usem.

**Divisão recomendada:** primeira migration somente identidade candidata; migrations posteriores coesas para perfil/ativação, resolução/preparação e publicação, conforme seus contratos forem aprovados. Não é necessário dividir os quatro statements deste primeiro recorte em várias migrations. Não reservar números posteriores nem antecipar `011_everything`.

## 2. Fontes e método

Foram lidos AGENTS, Documento Mestre v1.0, ORG-001 e ORG-002 integrais, PROJECT_MASTER e ROADMAP. Decisões preservadas: mestre §§2/15/16/19; ORG-P01–P12; ORG-002 §§4–7, 10–11, 15–20 e 25. Opção física 2, `companies` única Org, U-A, múltiplos Owners e preparação separada de publicação continuam aprovados. O catálogo completo da ORG-002 não obriga instalação simultânea de suas colunas/tabelas.

Papéis consultados, com entregas nesta revisão: Arquitetura — recorte e alternativas; Banco — DDL/constraints e SQLite; Backend — consumidores e migrador; Segurança — autoridade/proveniência/referências; QA — negativos e regressões futuros; Documentação — proposta, limites e índices. São papéis de análise, sem agentes antigos ou processos permanentes reativados.

Inspeção de fontes, sem execução do sistema: migrations 001–010; `SqlStore`, bootstrap, entidades, identidade/RBAC, auditoria, persistência/espelhos, seis agregados, backup/restore, UI legada e contratos React; fontes de testes de migration, transação, escopo, IDP-001 e backup. Leituras auxiliares: arquitetura/banco e índice documental. Nenhum SQLite foi aberto, inclusive em memória. Não foram criados dados, fixtures, manifesto operacional, screenshot ou artefato de execução.

**Runtime identificado sem abrir DB:** `node -p` sobre `process.version/process.versions.sqlite` retornou **Node v24.19.0 / SQLite 3.53.3** nesta máquina. `package.json` exige Node `>=24.7.0`, não fixa esse build exato. O suporte no futuro artefato de implantação ainda precisa ser conferido. Consultada documentação oficial SQLite para semântica de STRICT, FK e triggers; revisão textual não equivale a executar o candidato.

### 2.1 Evidências locais verificáveis

| Fonte / ponto | Evidência ATUAL e consequência |
| --- | --- |
| [001_foundation.sql](../../../foundation/migrations/001_foundation.sql) | `companies(id)` PK; `users(id)` PK; `audit_events(id)` UNIQUE. Pais reais para as três FKs propostas. Audit exige par C/U completo ou NULL/NULL. |
| [sql-store.js](../../../foundation/sql-store.js), constructor / `migrate` / `transaction` | Abre arquivo, configura FKs/WAL, aplica migrations; SHA-256 sobre conteúdo UTF-8; rejeita versão aplicada ausente; `BEGIN IMMEDIATE`, SQL + registro de checksum, COMMIT/ROLLBACK síncronos. |
| [runtime.js](../../../foundation/runtime.js), `createRuntime` | Migra antes de seed/import/normalização/Identity/jobs. Executá-lo nesta rodada violaria o limite de leitura. Nenhum ramo reconhece Legal. |
| [entities.js](../../../foundation/entities.js) | Inserts posicionais de cinco colunas em companies e seis em units; updates apenas de nome/status/datas. Adicionar colunas nessas tabelas quebraria compatibilidade; esta proposta não as adiciona. |
| [identity.js](../../../foundation/identity.js), `bootstrapAccess` / `issue` | Inserts posicionais em users, memberships, roles e sessions; contexto C/U. Não consulta `legal_entities`. |
| [rbac.js](../../../foundation/rbac.js), `seedPermissions` | Introspecção limitada aos dois nomes de upgrades 007/008; não percorre toda tabela nova para conceder direitos. |
| [state-repository.js](../../../foundation/state-repository.js), `writeState` | Estado/revisão, índice, mirrors e auditoria atuais. Índice deriva das coleções de storage, não de introspecção de tabelas SQL. |
| [commercial-store.js](../../../foundation/commercial-store.js), `normalizeAllCommercial` | Varre unit_states; seis normalizadores explícitos. `SELECT *`/hidratação usam tabelas e campos conhecidos. |
| [inventory-store.js](../../../foundation/inventory-store.js), [sales-store.js](../../../foundation/sales-store.js) | Mapas de tabelas/definições fechados; balances posicionais e filhos de venda explícitos. Nenhum JOIN Legal ou descoberta genérica de agregados novos. |
| [audit.js](../../../foundation/audit.js), `appendAudit` / `eventPayload` | Evento novo técnico pode ter C/U NULL/NULL e ator NULL. Hash e payload histórico permanecem intactos; sanitizador genérico não prova proteção de documento legal. |
| [backup-service.js](../../../foundation/backup-service.js), `verifySchema` / `validatePackage` / `restoreBackup` | Manifesto é validado contra prefixo exato dos arquivos/checksums conhecidos. Pacote antigo rejeita backup contendo 011, mesmo dormente. |
| [backup-local-sql.js](../../../scripts/backup-local-sql.js) | Cópia física via API SQLite; integrity/FK checks e lista migrations. Não seleciona só tabelas conhecidas nem altera a origem para remover estrutura nova. |
| [sql-store.test.js](../../../foundation/sql-store.test.js) | Fontes cobrem aplicação única, checksum alterado/ordem desconhecida, FK e rollback. Não executadas nesta rodada. |
| [receipt-fk-index.test.js](../../../foundation/receipt-fk-index.test.js) | Teste de 010 compara catálogo de tabelas e digest genérico antes/depois; com uma 011 aditiva essa expectativa histórica precisa de recorte específico, não serve como prova universal de compatibilidade. |
| [stock-insert-equivalence.js](../../../scripts/stock-insert-equivalence.js), `contents` | Introspecção genérica inclui toda tabela e usa ORDER BY rowid. Candidato WITHOUT ROWID exige ordenação pela PK no tooling; sem adaptação esse script falha, mesmo com tabela vazia. Não é consumidor de negócio nem foi executado. |
| [server.js](../../../server.js), [store.js](../../../public/store.js), [auth.ts](../../../frontend/src/api/auth.ts) | Replay `legacy-sale-v1` permanece C/U/user/draft; UI preserva intenção; React projeta DTO C/U. Uma tabela vazia não acrescenta campos às respostas. |

001: fundação/15 tabelas; 002: Produtos e normalizações; 003: Clientes; 004: Fornecedores e presença; 005: Compras/filhos/FKs diferidas; 006: Estoque/atores/FKs; 007–008: concessões técnicas e credenciais transitórias; 009: Vendas e 16 projeções filhas; 010: índice da FK de recebimento. **51 tabelas declaradas + schema_migrations do runner.** Nenhuma é alterada pela proposta. Aditividade não torna um pacote 001–010 capaz de reconhecer 011.

## 3. Matriz de candidatos — primeira migration hipotética

| Objeto | Classificação | Por que entra ou espera / dependência |
| --- | --- | --- |
| `legal_entities` | **ENTRA NA PRIMEIRA MIGRATION** | Menor identidade candidata tenant-scoped e auditável para o ensaio C2; sem Unit, perfil validado ou uso operacional. |
| `legal_entity_profiles` | **ADIAR** | Nenhum perfil é consumido em C2. Instalar antes do comando de validação/ativação e antes de FK factual; exige contrato de referência protegida/versionamento. |
| `legal_profile_heads` | **ADIAR** | Sem perfil não há cabeça útil. Entra junto do writer de perfil, com FK e CAS. |
| `organizational_resolution_events` | **ADIAR** | C2 não resolve sujeito algum. Instalar em C4/preparação, com formato UNIT, supersessão, auditoria e política de evidência revisados. |
| `unit_legal_bindings` | **ADIAR** | INSERT já publica autoridade. Instalar somente com rito de publicação homologado, Legal ativável, cabeça aprovada e guardas completas; não criar relação provisória. |
| `unit_lifecycle` | **ADIAR** | Só necessário quando adapter/gates passam a representar estado candidato/operacional; C3–C6 conforme contrato. Não alterar units.status. |
| `unit_successions` | **ADIAR** | C8/corte U-A; não há sucessão a registrar no ensaio vazio. |
| `legal_document_lookup` | **ADIAR** | Condicional à especificação de Segurança e política de duplicidade. Busca/documento real não é requisito C2. |
| `resolution_batch_items` | **ADIAR** | FACT/BATCH somente com prova/manifesto fechado de casos concretos C4 avançado/C8. |
| `organizational_backfill_runs` | **ADIAR** | Controle precisa acompanhar o primeiro backfill autorizado; nenhum backfill em C2. |
| `organizational_backfill_keys` | **ADIAR** | Idempotência de origem→resultado junto de runs/targets pertinentes; não existe item executado agora. |
| `organization_model_state` | **ADIAR** | C3/adapter shadow e contrato de deployment. first_v2_fact_id/FK somente quando contexto factual existir em C7. Flag ignorada pelo binário antigo não o protege. |
| ACL/Owner/grants/revisões de templates | **ADIAR** | C5 com equivalência, atores/delegação e herança explícita. Não converter papel legado nem criar novo código de permission. |
| Sessões v2 / sidecar | **ADIAR** | C6, resolver/CSRF/contexto/clientes e bloqueio de writers antigos homologados. |
| `business_fact_contexts` | **ADIAR** | C7 por writer, Legal ativa/perfil/binding e auditoria atômicos; nenhum fato novo em C2. |
| Links factuais / sidecar de auditoria organizacional | **ADIAR** | Links com writer C7; sidecar de auditoria antes de comandos organizacionais/consulta tenant-scoped que o exijam. Não há evento novo a vincular pela migration vazia. |
| Nova tabela `organizations` | **REJEITAR NESTA ARQUITETURA** | Duplicaria a identidade física aprovada em companies. |
| Coluna Legal em units / binding temporal U-B | **REJEITAR NESTA ARQUITETURA** | Contraria opção 2/U-A; esta rodada não reabre essas decisões. |
| Índice documental em texto / hash simples | **REJEITAR NESTA ARQUITETURA** | Não implementa a proteção aprovada; referências opacas não são hashes enumeráveis de CPF/CNPJ. |

Adiamento significa manter o alvo aprovado, instalando-o com seu primeiro uso e seus testes. **Não significa que ausência de relação legal passe a autorizar efeito v2.** Até então, só o contrato v1 atual continua vigente, sem reinterpretar fatos antigos.

## 4. Por que cada coluna existe — e o que foi removido

Todos os campos abaixo são dormentes para os consumidores atuais; nenhum modifica tabela/semântica existente. Nenhum cria grant ou capacidade de negócio. Os dependentes indicados são incrementos futuros, não leitores instalados.

| Coluna / tipo / nullability | Necessidade no contrato mínimo C2; consequência de omitir | Dependente futuro / autoridade |
| --- | --- | --- |
| `organization_id TEXT NOT NULL` | Candidata sem tenant seria estruturalmente órfã e não permitiria ensaiar o isolamento de sua identidade; FK ao ID real de companies. | Repositório/joins C3–C7. Define apenas o tenant da candidata. |
| `id TEXT NOT NULL` | Identidade estável sem documento como PK; omissão obriga identificar linha por CPF/referência ou rowid sem contrato. | Propostas/perfis/fatos posteriores. UUID imprevisível será gerado pelo backend; SQL só garante não vazio/unicidade. |
| `legal_type TEXT NOT NULL` | PF/PJ explícito, nunca inferido de nome; omissão deixaria a identidade candidata incompleta ou fictícia. | Validação cadastral; declaração candidata ainda exige prova, não certificação jurídica. |
| `identity_ref TEXT NOT NULL` | Âncora opaca do dossiê de identidade sem documento bruto; omissão perde proveniência da identidade que se congela. | Serviço protegido futuro; não é credential, URL assinada, FK fictícia ou identidade validada pelo SQLite. |
| `status TEXT NOT NULL DEFAULT 'PROVISIONED'` | Distingue expressamente candidata de entidade operacional; sem estado a interpretação dependeria de convenção externa. | Lifecycle futuro. Enum alvo conhecido; trigger permite somente PROVISIONED agora. |
| `created_at TEXT NOT NULL` | Momento de registro da candidata, distinto de data de fatos antigos/vigência cadastral; omissão perderia a cronologia local do cadastro independente do horário declarado no evento. | Dossiê de validação. UTC canônico no futuro comando; CHECK só rejeita texto vazio. |
| `created_by TEXT NULL` | Referência ao autor humano atual quando comprovado; obrigar pessoa impediria criação técnica legítima ou incentivaria autor fictício. | Proveniência; existência via FK global não prova vínculo/autoridade no tenant. |
| `creation_provenance TEXT NOT NULL` | Distingue ato USER de TECHNICAL, inclusive técnico iniciado por usuário real. Sem ele, nullability sozinha não distingue essas origens. | Comando/backfill autorizado futuro; nenhuma equivalência com autoria de negócio antiga. |
| `creation_evidence_ref TEXT NOT NULL` | Referência opaca à fonte do cadastro candidato; sem ela, não haveria prova vinculável da declaração PF/PJ. Pode ser dossiê em validação, não evidência já aprovada. | Resolução/validação. Sem payload bruto, schema de storage ou algoritmo criptográfico antecipados. |
| `creation_audit_id TEXT NOT NULL` | Linha criada sem referência a evento seria órfã de trilha; FK aponta UNIQUE existente e não exige alterar a cadeia. | Comando futuro grava evento novo e candidata na mesma transação. Não produz auditoria pela migration. |

**Campos adiados:** `version`/CAS; `activated_at/by/activation_audit_id`; revisão de perfil; vigência; motivo livre; CPF/CNPJ, lookup, endereço, razão social, chave/digest criptográfico; Unit, resolução, binding, gate, Owner e entidade factual. Nenhum deles é necessário para armazenar uma candidata imutável sintética. Refs de identidade/evidência não são verificadas nem dereferenciadas nesta etapa; qualquer resolução de conteúdo real continua bloqueada até Segurança.

### 4.1 Estados e evolução sem ativação antecipada

O CHECK enumera os quatro estados **já aprovados** para evitar rebuild apenas por ampliar o enum. A guarda de INSERT restringe a PROVISIONED; a guarda de UPDATE impede toda transição. ACTIVE/SUSPENDED/CLOSED não são utilizáveis no schema candidato. Essa combinação não duplica a mesma garantia: enum rejeita valores desconhecidos, trigger limita o subconjunto utilizável e UPDATE bloqueia alterações/reparenting.

Antes de ativar: instalar perfis/head e campos de ativação, version/CAS e referência ao evento de transição; substituir, em migration revisada, a guarda total de UPDATE por proteção permanente dos campos de identidade/criação + invariantes de transição/ativação. Só depois habilitar comando autorizado que valide identidade/evidência/perfil e audite na mesma transação. Não basta remover a trigger ou mudar status por SQL. Se o incremento futuro exigir CHECKs intercolunas que ADD COLUMN não suporte adequadamente, reconstruir **somente esta tabela nova de metadados**, preservando linhas/FKs e com ensaio; não editar 011 aplicada.

Alternativa: CHECK limitado a PROVISIONED, sem reserva do enum. É mais explícito quanto ao subconjunto, mas exige reconstrução para ampliar estados. Recomendo enum aprovado + bloqueio temporário porque não instala autoridade e evita esse rebuild específico. Alternativa incluir contador/ativação/perfil desde C2 reduz uma migration futura, mas cria campos sem mutação/consumidor e enfraquece o critério mínimo pedido.

## 5. DDL candidato exato — somente texto nesta proposta

O bloco é completo para o recorte recomendado. **Não foi executado nem salvo como .sql.** Depende de 001–010 aplicadas e `foreign_keys=ON` pelo SqlStore. Não contém BEGIN/COMMIT/PRAGMA: o migrador já controla a transação e a conexão. Não há `IF NOT EXISTS` para esconder schema prévio inesperado. Não há INSERT, seed, UPDATE, ALTER de tabela antiga ou criação de evento.

WITHOUT ROWID é proteção necessária deste candidato: com rowid oculto, INSERT OR REPLACE informando o rowid de outra linha e um ID novo poderia apagar a anterior sem passar pela guarda de ID; DELETE trigger pode não disparar com recursive_triggers desligado. Não depender de NEW.rowid indefinido em BEFORE INSERT. Eliminar o rowid oculto fecha essa identidade substituível: todas as chaves de conflito restantes contêm id, cobertas pela guarda. O trade-off concreto é adaptar tooling que presume rowid (§9), com revisão própria antes de C2. Não converter tabelas antigas para WITHOUT ROWID.

```sql
CREATE TABLE legal_entities (
    organization_id TEXT NOT NULL,
    id TEXT NOT NULL,
    legal_type TEXT NOT NULL,
    identity_ref TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PROVISIONED',
    created_at TEXT NOT NULL,
    created_by TEXT,
    creation_provenance TEXT NOT NULL,
    creation_evidence_ref TEXT NOT NULL,
    creation_audit_id TEXT NOT NULL,

    CONSTRAINT legal_entities_pk PRIMARY KEY (organization_id, id),
    CONSTRAINT legal_entities_global_id UNIQUE (id),
    CONSTRAINT legal_entities_id_not_empty CHECK (length(trim(id)) > 0),
    CONSTRAINT legal_entities_type CHECK (legal_type IN ('PF', 'PJ')),
    CONSTRAINT legal_entities_identity_ref_not_empty
        CHECK (length(trim(identity_ref)) > 0),
    CONSTRAINT legal_entities_status
        CHECK (status IN ('PROVISIONED', 'ACTIVE', 'SUSPENDED', 'CLOSED')),
    CONSTRAINT legal_entities_created_at_not_empty
        CHECK (length(trim(created_at)) > 0),
    CONSTRAINT legal_entities_creation_provenance
        CHECK (creation_provenance IN ('USER', 'TECHNICAL')),
    CONSTRAINT legal_entities_user_creation_has_actor
        CHECK (creation_provenance <> 'USER' OR created_by IS NOT NULL),
    CONSTRAINT legal_entities_creation_evidence_not_empty
        CHECK (length(trim(creation_evidence_ref)) > 0),

    CONSTRAINT legal_entities_organization_fk
        FOREIGN KEY (organization_id) REFERENCES companies(id)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT legal_entities_creator_fk
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT legal_entities_creation_audit_fk
        FOREIGN KEY (creation_audit_id) REFERENCES audit_events(id)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) STRICT, WITHOUT ROWID;

CREATE TRIGGER legal_entities_insert_guard
BEFORE INSERT ON legal_entities
BEGIN
    SELECT RAISE(ABORT, 'LEGAL_NOT_PROVISIONED')
    WHERE NEW.status <> 'PROVISIONED';

    SELECT RAISE(ABORT, 'LEGAL_ID_ALREADY_EXISTS')
    WHERE EXISTS (SELECT 1 FROM legal_entities WHERE id = NEW.id);
END;

CREATE TRIGGER legal_entities_no_update
BEFORE UPDATE ON legal_entities
BEGIN
    SELECT RAISE(ABORT, 'LEGAL_CANDIDATE_IMMUTABLE');
END;

CREATE TRIGGER legal_entities_no_delete
BEFORE DELETE ON legal_entities
BEGIN
    SELECT RAISE(ABORT, 'LEGAL_CANDIDATE_IMMUTABLE');
END;
```

**Contagem:** 1 tabela STRICT/WITHOUT ROWID; 10 colunas, 9 NOT NULL e 1 nullable; 1 PK composta; 1 UNIQUE global; 8 CHECKs; 3 FKs imediatas; 3 triggers persistentes; **0 CREATE INDEX**, 1 índice secundário implícito UNIQUE, além da estrutura primária da PK. São duas chaves indexadas de integridade, não dois índices secundários de performance. Nenhuma FK deferred, partial index ou expression index neste recorte. Não criar `UNIQUE(organization_id,id)` adicional nem índice sobre os mesmos campos.

### 5.1 Garantia e necessidade de cada constraint/trigger

| Objeto | Garantia real; por que já é necessário / efeito de adiar |
| --- | --- |
| STRICT | Tipos TEXT/INTEGER suportados; aqui apenas TEXT. Evita armazenar valores sem conversão válida ao tipo declarado. Permite coerções sem perda: não é validação de domínio/criptografia. Adiar permitiria tipo inválido na própria identidade candidata. |
| WITHOUT ROWID | Remove chave oculta que permitiria substituir linha por REPLACE com outro id. Sem esta opção a guarda por id não fecha todas as chaves de conflito. Não é autorização nem otimização de performance solicitada. |
| NOT NULL dos nove campos | Exige tenant/ID/tipo/ref/estado/registro/proveniência/evidência/audit completos no contrato mínimo. FK sozinha aceitaria NULL. A única exceção intencional é ator técnico. |
| `legal_entities_pk` | Identidade tenant-scoped e chave candidata composta para relações posteriores. Organiza lookup `(Org,id)` já do contrato C2; não certifica ownership de Unit. |
| `legal_entities_global_id` | ID novo não se repete entre Orgs; PK composta não garante isso. Dá lookup para guarda contra REPLACE. Não aplicar unicidade global retrospectiva aos IDs legados. |
| `legal_entities_id_not_empty` | Impede ID vazio/espaços, mesmo que único. Formato/imprevisibilidade UUID serão backend; não se promete isso com CHECK. |
| `legal_entities_type` | Somente PF/PJ, sem UNKNOWN. Não prova que a declaração corresponde à realidade. |
| `legal_entities_identity_ref_not_empty` | Exige âncora da declaração de identidade; não prova proteção/existência do conteúdo referenciado. |
| `legal_entities_status` | Enum aprovado, rejeita estado desconhecido. Não autoriza os três estados bloqueados pela guarda. |
| `legal_entities_created_at_not_empty` | Exige instante declarado não vazio; formato UTC/validade/relógio confiável pertencem ao comando. |
| `legal_entities_creation_provenance` | Códigos fechados de origem; não permite rotular história desconhecida como criação humana comprovada. |
| `legal_entities_user_creation_has_actor` | USER exige pessoa existente por FK; TECHNICAL pode ter pessoa real ou NULL. Não identifica autor antigo nem concede poder ao usuário. |
| `legal_entities_creation_evidence_not_empty` | Referência mínima de fonte/dossiê é obrigatória; não valida suficiência legal da prova. |
| `legal_entities_organization_fk` | Tenant existente via PK companies(id), sem Org paralela ou reinterpretação de name. NO ACTION impede remover/renomear pai referenciado; nenhum CASCADE. |
| `legal_entities_creator_fk` | Ator informado existe globalmente; ausência legítima técnica é permitida. Membership/atividade/autorização são backend, não inferidas da FK. |
| `legal_entities_creation_audit_fk` | Evento referenciado existe via UNIQUE audit_events(id); linha sem evento não é aceita. Não prova ação/Org/causa/ator corretos nem exclusividade do evento. |
| `legal_entities_insert_guard`, condição status | Somente PROVISIONED nasce neste incremento, mesmo por SQL manual; evita autoridade legal antecipada. |
| `legal_entities_insert_guard`, condição ID existente | Aborta substituição por `INSERT OR REPLACE`, inclusive tentativa de mover ID para outra Org. UNIQUE isolada poderia substituir linha. Não confundir com garantia duplicada de unicidade. |
| `legal_entities_no_update` | Neste incremento tudo é imutável, inclusive Org/ID/tipo/ref/proveniência/estado; adiar admitiria reparenting ou ativação manual. Guarda temporária de toda linha a substituir somente no incremento de mutação revisado. |
| `legal_entities_no_delete` | Preserva candidata/evidência registrada mesmo abandonada; adiar admitiria apagar tentativas. Continua necessária depois da ativação. |
| Estrutura primária da PK | Armazena a tabela WITHOUT ROWID ordenada pela chave composta; não acrescentar índice igual nem contar uma segunda cópia física da tabela. |
| Autoíndice de UNIQUE(id) | Integridade global e lookup da guarda; não acrescentar outro índice de id. |

Nenhum índice de status/data/ref/creator/audit é incluído: não há query de listagem Legal, exclusão de usuário/evento ou comando desse cadastro em C2. `audit_events` já proíbe exclusão e usuários são desativados pelo fluxo atual. Avaliar índice de FK ao creator com medição/necessidade se houver futuro comando de remoção de usuário. Prefixo organization_id da PK já apoia verificação do pai Org. Índice `(org,status,id)` do catálogo alvo espera a consulta que o justifique.

### 5.2 Ordem e dependências

001 já criou companies, users e audit_events com chaves candidatas válidas → criar legal_entities, incluindo PK/UNIQUE/CHECK/FKs/estrutura primária e índice UNIQUE implícito → insert_guard → no_update → no_delete → registro de checksum pelo migrador → COMMIT.

Nenhuma nova tabela depende de outra tabela ainda não instalada. Os quatro statements têm de completar na mesma transação; não permitir processo de aplicação entre CREATE TABLE e guardas. FKs imediatas bastam: no comando futuro, criar evento primeiro, obter ID e depois inserir candidata, na mesma transação. Não há ciclo que exija deferred.

## 6. Alternativas: perfis, resolução e publicação

### 6.1 Perfil: A desde C2 versus B antes da validação/ativação

| Critério | A: profiles + heads em C2 | B: adiar — recomendado |
| --- | --- | --- |
| Uso / histórico | Tabelas vazias, sem writer/prova; não preservam história adicional | Candidata imutável conserva origem; primeira versão cadastral nasce quando realmente validada/registrada |
| FK factual | Disponível estruturalmente, mas não existe contexto factual | Criar perfil/head antes do writer factual; usar PK `(org,legal,version)` então. Nenhuma FK atual a reparar |
| Complexidade | Mais self-FKs, guards append-only, ordenação/vigência, ponteiro CAS e contrato de ref protegida | Migration aditiva própria, seguida de revisão/ensaios coesos do writer |
| Risco posterior | Menos DDL depois, mas cristaliza contrato de storage não implementado | Instalação deve preceder ativação/fato; sem dados reais/fatos/perfis hoje, não há história cadastral a migrar |

Não criar perfil sintético automático como versão histórica de cadastro antigo. identity_ref ancora a identidade candidata; profile_ref descreverá cadastro protegido/versionado quando o serviço existir. Eles não são dois documentos brutos duplicados. Proteção e busca de dados reais seguem bloqueadas até Segurança.

### 6.2 Resolução UNIT mínima, somente quando houver preparação

O menor contrato futuro precisa de Org/ID, Unit, estados **UNRESOLVED/PROPOSED/RESOLVED/DISPUTED**, review PREPARATION/APPROVED_FOR_PUBLICATION, candidata Legal nullable coerente, predecessor, evidência/motivo/proveniência, data/ator nullable técnica, audit e campos de aceite. UNRESOLVED tem Legal NULL; RESOLVED exige Legal/evidência/ator; aprovação exige RESOLVED e aprovação completa; PREPARATION não tem campos de aprovação. Supersessão append-only conserva sujeito e não cria dois sucessores nem duas raízes para a mesma Unit. Esse contrato não é implementado aqui.

| Alternativa | Custo/integridade | Recomendação |
| --- | --- | --- |
| Ledger genérico UNIT/FACT/BATCH completo agora | Campos polimórficos, manifests/seals/paths/UNIQUE de expressão e estados sem uso; mais superfície de inconsistência | Adiar alvo completo; não entra em C2 |
| `organizational_resolution_events` UNIT-only no incremento de preparação | Reutiliza nome físico aprovado; subject_kind CHECK UNIT, sem colunas FACT/BATCH. UNIQUE inicial `(org,unit)` parcial e UNIQUE predecessor parcial, append-only e coerência por FK/trigger/transação | **Preferida em C4**, com DDL próprio revisado. Não é necessária hoje |
| Ledgers físicos separados Unit/fatos | Evita ampliar CHECK de Unit e separa sujeitos, mas muda catálogo/FKs/consulta de evidências aprovados e pode duplicar protocolos | Alternativa futura se casos reais justificarem; exigiria revisão do proprietário, não adotada nesta proposta |

Expandir UNIT-only para alvo FACT/BATCH pode exigir rebuild do **ledger novo de metadados** para CHECK/colunas. Preservar IDs, afirmações, predecessor, evidências/audit e validar FKs. Não reconstruir Unit/fatos antigos por isso. Custo existe, mas é menor que instalar/generalizar prova de fato/lote antes dos contratos. Se a revisão C4 demonstrar que expansão é iminente e contratualmente definida, comparar novamente desenho completo naquela migration; quantidade de migrations não é critério de integridade. Resolução UNIT nunca prova universalmente fatos antigos.

### 6.3 Binding: criar agora versus junto do comando

**Escolha: adiar, mantendo a tabela separada aprovada.** Criar agora exige resolution/head, Legal ACTIVE, aprovação e guarda de INSERT completa. Neste recorte não pode haver Legal ACTIVE. Guardar todos os INSERTs para sempre torna a tabela inutilizável; permitir qualquer INSERT cria publicação prematura. Homologação estrutural precoce é benefício, mas viria com dependências sem uso.

Antes de publicar, o incremento autorizado precisa instalar FK `(org,unit)`→units, `(org,legal)`→Legal, FK ao evento de resolução; PK `(org,unit)`; UNIQUE `(org,legal,unit)` **como candidate key da FK tripla**, não índice de performance redundante. Guardas devem exigir mesmo sujeito/Unit/Legal/Org, cabeça atual RESOLVED/APPROVED_FOR_PUBLICATION, Legal ACTIVE e ausência de contestação, além de impedir UPDATE/DELETE/REPLACE e proteger identidade dos pais. A nova migration e o comando precisam ser homologados juntos. Não escrever DDL incompleto de binding agora.

O runtime v1 não leria tabela nova vazia, mas isso não controla inserção manual nem transforma INSERT em mera proposta. Após publicado, mesmo sem fato v2, binding é imutável. Erro anterior à publicação usa supersessão na mesma Unit; depois, contestação/HOLD/revisão, sem trocar pai. U-A não é reaberta.

## 7. Auditoria, atores e fronteira de Segurança

Para o único objeto incluído, `creation_audit_id` é obrigatório e referencia audit existente; **migration não cria linha estrutural sem evento, nem cria linha alguma**. Tabelas/triggers vazias não precisam de evento de negócio para “simular” implantação; schema_migrations registra aplicação técnica. Registrar implantação externamente no processo autorizado futuro é outra decisão, sem inventar autoria histórica.

Comando futuro: autorização pelo backend → validar refs sintéticas/protegidas e proveniência → `BEGIN IMMEDIATE` → revalidar tenant/ator/request/provas → anexar evento **novo** de criação com ação/record/Org/refs mínimos corretos → inserir candidata com seu audit ID → COMMIT. Falha desfaz ambos. Implementar replay antes de INSERT: a guarda rejeita ID já existente até em UPSERT/OR IGNORE; ela não fornece idempotência de comando. Retry futuro busca resultado/compare intenção dentro da transação, sem gerar ID novo por erro. Nenhum comando é criado em C2.

Evento Org-only pode usar C/U NULL/NULL conforme CHECK atual e Org no payload novo allowlisted. Isso é compatibilidade de gravação, **não consulta tenant-scoped pronta**: listAudit atual filtra C/U; sidecar/consulta de eventos Org precisa de contrato antes de expor cadastro/audit ao cliente. FK de audit comprova existência apenas. Reuso de audit existente de outra causa/Org pode satisfazer FK: o comando tem de verificar ação, contexto, recordId, autor/proveniência e causalidade e produzir evento novo. Sem backend correspondente, não habilitar criação operacional nem anunciar que FK evita falsificação semântica da prova.

| Origem | created_by / provenance | Limite |
| --- | --- | --- |
| Criação por pessoa autenticada | ID real / USER | Backend verifica principal, membership e capacidade sobre Org; FK global não autoriza |
| Criação técnica auditada | NULL ou pessoa real responsável pela execução / TECHNICAL | Evento/processo/escopo atuais rastreáveis; nenhum usuário técnico fictício obrigatório |
| Autor do fato antigo desconhecido | Continua ausente no fato/audit antigo | Não é “autor da candidata”; registrar quem fez o cadastro novo não atribui autoria retroativa |

Triggers só protegem estado, identidade e imutabilidade. Não verificam permissões, cargo, Owner, entitlement ou autorização do resolvedor. Administrador com controle de arquivo/DDL pode remover proteções; não é fronteira SaaS. Nenhum cliente passa a acessar banco cloud. Refs opacas não provam acesso nem proteção do conteúdo; SQLite não distingue uma ref de documento bruto colocado indevidamente em TEXT. Allowlists/serviço confiável/proteção/logs/retention serão obrigatórios antes de dados reais. Nesta etapa usar apenas refs sintéticas e nenhum CPF/CNPJ, senha, token, segredo, chave ou URL credenciada em fixtures/docs/DDL/logs.

## 8. SQLite, migrador e limites técnicos

| Tema | Validação textual / evidência e limite |
| --- | --- |
| Versão/STRICT | Build observado SQLite 3.53.3; 001–010 já usam STRICT. Candidato só usa TEXT, suportado. STRICT exige SQLite >=3.37; confira futuro Node oficial, não apenas engine range. [Referência oficial](https://www.sqlite.org/stricttables.html). |
| FKs/candidate keys | Três pais já existentes e PK/UNIQUE válidas, com collations padrão. Relação composta Org/Legal virá em tabelas posteriores com PK candidata. FKs compostas exigem mesma aridade e chave candidata correspondente; não basta UNIQUE em subconjunto. [FKs oficiais](https://www.sqlite.org/foreignkeys.html). |
| foreign_keys | SqlStore liga ON antes de transação. Nenhuma PRAGMA para desligar durante DDL. CHECK não substitui FK; alterar PRAGMA no meio de transação não serve como controle. FK de ator NULL é deliberada. |
| Deferred | Nenhuma nova neste recorte. As existentes de 005/006/009 ficam iguais e são verificadas no commit; não antecipar links de mirrors. |
| Partial UNIQUE / expressão | Não usados aqui. SQLite observado suporta os recursos; UNIQUE parcial tem predicado/subconjunto e índices de expressão exigem expressão determinística, sem subquery. Precisam de ensaio de NULL/cabeça/sujeito no futuro ledger, não garantia atual. [Parciais](https://www.sqlite.org/partialindex.html), [expressões](https://www.sqlite.org/expridx.html). |
| CHECK | Oito expressões locais sem subquery. NOT NULL fecha bypass por NULL onde obrigatório; ator NULL só técnico. Validam forma, não identidade real, data confiável ou autoridade. |
| Trigger/REPLACE | Triggers persistentes BEFORE com RAISE e mensagens literais; não mutam outra tabela nem leem NEW.rowid. DELETE disparado por REPLACE depende de recursive_triggers; SqlStore não o configura. WITHOUT ROWID elimina conflito pela chave oculta; guarda de INSERT verifica ID existente e aborta conflitos restantes. Testar OFF/ON. [ON CONFLICT](https://www.sqlite.org/lang_conflict.html), [RAISE/trigger](https://www.sqlite.org/lang_createtrigger.html). |
| WITHOUT ROWID | Compatível com STRICT no build observado; PK composta obrigatória já declarada. Ausência de rowid é deliberada e interfere no tooling genérico que o consulta, não nas tabelas antigas ou consumidores de negócio. Contar estrutura da PK separadamente do índice secundário UNIQUE. [Opções STRICT](https://www.sqlite.org/stricttables.html). |
| ABORT/transação | RAISE(ABORT) aborta statement; **não promete rollback de toda transação sozinho**. Runner propaga erro e faz ROLLBACK; futuro comando não pode engolir erro e COMMIT parcial. |
| DDL atomicidade | `migrate` chama `db.exec(sql)` e INSERT de schema_migrations na mesma transaction. Falha em statement/triggers ou no registro deve reverter objetos daquele arquivo. 001–010 previamente aplicadas permanecem; a sequência toda não é uma transação única. |
| WAL | Constructor ativa WAL/synchronous FULL antes de migrar; DDL exige lock de escrita e pode esperar/falhar por busy timeout. Não há atualização de linha comercial pelo candidato, mas schema e registro escrevem WAL. Falha não promete inexistência física de WAL/SHM nem ausência de PRAGMAs previamente aplicadas. Não copiar só arquivo vivo ignorando sidecars. |
| Backup físico | API backup copia snapshot consistente; BackupService sela **a cópia** em DELETE e valida manifesto/FKs/hash. A origem permanece WAL. Aumento do catálogo/migration aparece no backup mesmo vazio. |
| SQL exato não executado | Ordem/nomes/pais/tipos/expressões e necessidade revisados estaticamente. Parser/constraints/concurrency/rollback/crash continuam **NÃO HOMOLOGADOS** até C2 sintético autorizado. |

Não se recomenda atualizar SQLite/Node/dependências nesta rodada. Nenhuma garantia nova de multi-tenant HTTP, preço, precision, offline ou performance é certificada pelo SQL proposto.

## 9. Compatibilidade por consumidor

Condição de análise: tabelas novas vazias, sem writer/seed/adapters/gate, e **pacote contendo a nova migration/checksum aceitos**. Código de negócio continua v1. A conclusão abaixo é de fontes, não homologação executada. O pacote antigo exato é tratado separadamente na §10.

| Consumidor | Prova por fonte / resultado esperado | Limite / ensaio futuro |
| --- | --- | --- |
| Login/sessão/RBAC | identity/access/rbac usam users, memberships, sessions, roles e permissões antigas. Colunas, INSERT VALUES e par C/U não mudam | Testar setup/login/logout/troca/reset/revogação; Legal não aparece em contextos nem permissions |
| Bootstrap | createRuntime migra primeiro, depois seed/import/normalizeAllCommercial/Identity/jobs; loops explícitos não descobrem Legal | Bootstrap já pode escrever/normalizar/criar configuração; comparar execuções com mesma origem/condições, não afirmar startup sem escrita |
| Migrations | Nova sequência apenda arquivo; checksums UTF-8 001–010 preservados, nenhuma reexecução dos upgrades | Pacote pós-011 abre/aplica uma vez; pacote sem 011 rejeita DB aplicado. Não esconder rejeição |
| Produtos | hydrateProducts/maps aliases/packages e INSERTs em tabelas conhecidas | Schema antigo idêntico, escopo/presence/extras/custo/ordem preservados |
| Clientes / Fornecedores | Hydrators/queries por C/U e mapas de campos; documentação de titular não é inferida de document | Coleções/presença e contraparte seguem v1; nenhum sharing/merge |
| Compras | Purchases/receipts/items conhecidos e FKs diferidas atuais | Recebimento não muda ownership/saldo/fato por tabela candidata |
| Estoque | Sync/hydrate e balances posicionais com mesma aridade; guardas novas só na tabela Legal | Nenhum delta, preço/negativo/conversão novos; movimentos/âncoras exatos iguais |
| Vendas | Definitions/syncSales em tabelas nomeadas, headers/filhos/SQL paginado inalterados | IDP-001 retry preserva request/payload/fingerprint e efeito único; Legal não entra no hash |
| Caixa/Financeiro | snapshot/ledgers/reconciliação v1 sem lookup Legal | Nenhuma migração/transferência/novo recebimento; mesmos saldos/centavos/revisões |
| Auditoria | Candidato não escreve audit; eventPayload/append-only/hash/listAudit não alterados | Prefixo histórico byte/canonicamente igual; futuras fixtures podem anexar só eventos técnicos esperados |
| Backup / Restore | Cópia física inclui schema; verifySchema aceita prefixo exato conhecido, rejeita desconhecido | Testar matriz pré/pós na §10; não afirmar compatibilidade irrestrita |
| UI legada | Estado/APIs/drafts e headers C/U iguais; frontend não lê SQLite | Nenhum novo selector ou contexto Legal. Homologação funcional futura com DB sintético |
| React | auth.ts projeta explicitamente companyId/unitId/permissions/contexts e session controla geração | Mesmos DTOs/respostas, sem fields extras decorrentes de schema; typecheck/browser futuro se pertinentes, não executados aqui |
| Introspecção / scripts de equivalência | Runtime introspecta nomes específicos em migrate/RBAC/auth-maintenance; scripts/testes genéricos enxergam tabela nova e alguns exigem rowid | Catálogo completo **muda intencionalmente**; ORDER BY rowid da tabela nova falha. Adaptar recorte/ordenação pela PK no tooling autorizado antes de C2, sem enfraquecer preservação das tabelas 001–010 |

`INSERT INTO existing_table VALUES` conserva ordem/aridade porque nenhuma coluna antiga muda. `SELECT *` continua retornando colunas da tabela nomeada: não significa SELECT de todas as tabelas; não foram encontradas hidratações por posição que dependam da ordem global do catálogo. JSON APIs/payload comercial não é gerado enumerando sqlite_master. Uma biblioteca/script futuro que imponha catálogo 52 tabelas fixo terá de reconhecer estrutura aditiva; não alegar compatibilidade de consumidores desconhecidos.

**Divergências concretas de tooling/teste:** o teste de upgrade 010 em receipt-fk-index compara todas as tabelas antes/depois, partindo de diretório 001–009 e migrando para diretório vigente. Se este passar a conter 011, legal_entities vazia muda catálogo/digest, e seu ORDER BY rowid também não serve à tabela nova. `stock-insert-equivalence.contents` possui a mesma suposição de rowid. Antes de C2, revisar explicitamente o teste de 010 para seu prefixo/recorte e os leitores genéricos para ordenação determinística pela PK; adicionar teste próprio 001–010→011 que prove identidade dos dados/tabelas antigos e valide a diferença nova esperada. Não remover assertions/excluir linhas de evidência para mascarar diferença. Se essa adaptação não for autorizada, não declarar homologação completa nem aplicar o candidato. Código não foi alterado nesta rodada.

## 10. Backup/restore e rollback de pacote

| Origem / destino | Resultado segundo código atual | Gate futuro |
| --- | --- | --- |
| Backup pré-011 → pacote pós-011 | verifySchema aceita prefixo 001–010 se checksums coincidirem. restoreBackup valida/copia isoladamente, **não migra**. SqlStore pós-011 aplica a nova migration ao abrir destino depois | Ensaiar restore isolado + upgrade + login/negócio/chain; nova cópia já terá hash/schema distintos do backup original, esperado depois do upgrade |
| Backup pós-011 vazio → pacote pós-011 | Conhece 011/checksum e pode validar/restaurar estrutura completa | Ensaiar tabela/triggers vazias, registro/checksum e regressões. Não há prova executada nesta rodada |
| Backup pós-011 vazio → pacote antigo somente 001–010 | **Incompatível:** verifySchema rejeita versão 011 desconhecida; SqlStore.migrate também recusa versão aplicada ausente. Vazio não evita recusa | Não declarar binário antigo homologado apto; não usar appVersion do manifest como substituto do controle de schema |
| Código de negócio v1 + diretório autorizado contendo 001–011 | Migrador genérico pode aceitar checksum; domínio não reconhece Legal e deveria preservar v1 | É pacote de compatibilidade distinto do checkpoint antigo; revisão/autorização e homologação próprias, incluindo backup/restore/retention |

O backup é físico da instalação, não por tenant. Restore potencialmente alcança todos os tenants do arquivo. Checksum, integrity/FK checks e validação do pacote não certificam processo operacional/RPO/RTO. O pacote antigo também pode classificar backups novos como inválidos na retenção; a análise não equivale a executar purge.

**Qualificação da ORG-002 §19:** seu retorno ao binário previamente homologado era condicionado à compatibilidade comprovada. No código observado, pacote 001–010 não reconhece 011: não há rollback direto comprovado. Este documento registra o limite concreto sem modificar ORG-002 aprovada ou reabrir seu modelo.

## 11. Plano TDD mínimo futuro — não executado

C2 depende de aceite do recorte/DDL e autorização separada. **Red → Green → Refactor somente se necessário.** Fixtures de fonte/cópia/destino sob área sintética isolada, sem DB/JSON/dados da loja, backup automático operacional, CPF/CNPJ ou segredo real. Não iniciar servidor contra configuração padrão. Testes seguintes não estão escritos nem executados agora.

### 11.1 Migration e metadados

| ID | Prova exigida |
| --- | --- |
| M1 | Fixar checksums SHA-256 UTF-8 de 001–010 na baseline aprovada, criar fixture com esse prefixo e provar que arquivo e registros/checksums/datas antigos não mudam após upgrade. Registro novo aparece uma vez. |
| M2 | DB sintético novo e upgrade 001–010→nova migration: schema exato, 1 tabela/10 colunas/nullability/PK/UNIQUE/8 CHECKs/3 FKs/3 triggers, STRICT/WITHOUT ROWID e índice implícito; sem linhas novas de Legal/audit/grants/membership/contexto. Segundo migrate é no-op. |
| M3 | Migration sintética de falha após CREATE TABLE/um trigger e antes do último statement: nenhum objeto parcial nem registro novo persistido; 001–010/dados intactos; nova tentativa com candidato correto aplica uma vez. Testar falha ao registrar migration sem editar arquivo já aplicado. |
| M4 | `PRAGMA foreign_keys=1`, foreign_key_check/integrity_check sem falha; pai/audit/actor ausentes negados. Aplicação não aceita conexão com FKs desligadas como prova de integridade. |
| M5 | Pacote 001–010 rejeita DB e backup pós-nova-migration; pacote de compatibilidade autorizado com mesma migration aceita. Rejeição deve acontecer sem seguir ao bootstrap comercial. |
| M6 | Novo teste de preservação separa catálogo antigo de objeto aditivo; teste histórico 010 recebe prefixo explícito, preservando assertions próprias. Leitores genéricos usam ordenação determinística pela PK para tabela sem rowid. Checksums/dados e ausência de efeito não substituídos por mera contagem. |

### 11.2 Schema adversarial

| ID | Prova exigida |
| --- | --- |
| S1 | Org inexistente falha FK; ID global já de X inserido sob Y falha, inclusive REPLACE; UPDATE de organization_id para Y ou mudança de ID/tipo/ref/audit/proveniência falha. INSERT/UPDATE tentando usar rowid não encontra essa coluna. Isso é isolamento **estrutural da identidade**, não autorização HTTP. |
| S2 | PF/PJ admitidos só em candidata; UNKNOWN/estado arbitrário/ACTIVE/SUSPENDED/CLOSED no INSERT negados; UPDATE PROVISIONED→ACTIVE negado. |
| S3 | INSERT com ator real/USER funciona; USER sem ator e ator inexistente negados; TECHNICAL com NULL ou pessoa real funciona, mantendo semântica de criação atual. Auditoria obrigatória. |
| S4 | ID/ref/evidência/data vazios/espaços ou campos obrigatórios NULL negados; tipos incompatíveis negados por STRICT. Não afirmar rejeição de toda coerção ou validação criptográfica/data real. |
| S5 | UPDATE/DELETE e INSERT OR REPLACE contra linha existente negados com recursive_triggers OFF e ON; dois INSERTs com mesmo ID em statement/lote deixam original intacta; falha propaga e reverte lote. Testar UPSERT, OR IGNORE e ID cruzado, sem bypass de guarda. |
| S6 | Tentativa de mudar/remover parent companies.id referenciado falha FK; desativar/nomear company e usuário pelos caminhos v1 permanece como antes. Não criar trigger sobre tabela antiga para mudar sua política. |
| S7 | FK ao audit não prova semântica: ensaio documenta que evento existente de causa/Org errada pode satisfazê-la. Antes de comando real, teste de aplicação deve negar essa prova e produzir novo evento correto. Não contabilizar como proteção SQL que não existe. |

Ainda **não aplicáveis ao recorte**: FK Legal/Unit cruzada, binding/sucessão/reparenting Unit, perfil/predecessor/head, ACL/Owner, sessão, fato. Devem acompanhar seus incrementos, não ser artificialmente satisfeitos em C2 criando essas tabelas. Inserir ID novo sob outra Org válida não pode ser proibido só por FK: autorização depende de comando inexistente. Regressões HTTP atuais cross-company/unit continuam necessárias para preservar o que já existe.

### 11.3 Regressão v1 e recuperação sintética

| ID | Prova exigida |
| --- | --- |
| R1 | Comparar antes/depois **sem executar negócio entre snapshots**: rows e DDL/índices/FKs das 51 tabelas antigas, payload/revisões/markers/ordinais/presence/extras, saldos, audit prefix/hashes, ledgers/requestIds/fingerprints; diferença exclusiva é catálogo/registro novo. |
| R2 | Depois do upgrade vazio, executar v1 com mesmo corpus que baseline: bootstrap, setup/login/contexto/reset/RBAC, Produtos/Clientes/Fornecedores/Compras/recebimento/Estoque/Vendas/Caixa/Financeiro/Audit; mesmas respostas/negativos e efeitos comerciais esperados, Legal continua vazia. Não exigir ausência de auditoria de ações legítimas novas. |
| R3 | IDP-001: retry/timeout/concorrência e reinício preservam intenção/key/payload/fingerprint e efeito único. Regressões de atomicidade/mirror/audit, quantidades/centavos e escopos atuais. Sem mudar preço/negativo/permissão para passar. |
| R4 | Fixture com candidata PROVISIONED sintética e novo audit técnico legítimo: contextos/session/UI/RBAC/negócio v1 iguais; nenhum binding/fato Legal/perfil é criado. Prefixo audit antigo igual, somente sufixo técnico previsto. |
| R5 | Backup pré-estrutura restaura isolado em pacote novo, abre/migra e opera v1; backup pós-estrutura restaura em pacote novo/compatível; pacote antigo rejeita. Validar cópia WAL consistente/selagem, manifesto, checksum/FKs/triggers/chain/dados, sem remover metadata para passar. |
| R6 | Falha de migration/lock/fechamento e restart isolados: nenhum objeto parcial ou efeito antigo alterado; recovery autorizado usa pacote compatível ou cópia prévia isolada reconciliada. Não prometer recuperação de desastre sem ensaio. |

Fontes a reaproveitar por pertinência: sql-store/transactions/entities/scoped-state/runtime.integration; testes dos seis agregados e guards de mirror; legacy-sale-idempotency/retry-ui; identity/access/rbac/authorization; backup-service/sql-backup. Não repetir testes irrelevantes só para contagem. Revisar HTTP/legado/React de sessão conforme consumidor efetivamente tocado; não fabricar homologação de browser.

## 12. Recovery e ponto de não retorno

**Falha durante a futura migration:** SqlStore deve propagar erro, executar ROLLBACK e fechar a conexão na falha do constructor. Provar ausência de tabela/trigger/registro parciais; 001–010 já aplicadas permanecem. Não apagar objetos manualmente para compensar erro nem editar checksum de arquivo aplicado. Resolver problema em fonte ainda não aplicada, com revisão, e repetir apenas em destino autorizado. WAL/PRAGMAs/arquivos auxiliares podem existir mesmo após rollback; isso não prova migration parcial.

**Migration concluída e vazia:** não é necessário apagar tabelas para recuperar comportamento v1. Preferir manter schema e usar pacote compatível homologado. **O pacote antigo exato não é rollback seguro operacional: rejeita 011.** Preparar/autorizar pacote de compatibilidade que reconheça o mesmo arquivo/checksum e mantenha negócio v1, ou planejar restore de backup pré-estrutura em destino isolado com reconciliação de quaisquer operações posteriores. Esta rodada não autoriza alterar migrador, manifestos, backup ou deployment para criar esse pacote.

**Não editar schema_migrations:** seu registro comprova o schema instalado; retirar linha ou inventar checksum oculta divergência, pode tentar reaplicar CREATE e não faz o esquema antigo voltar. Não usar DROP TABLE/desligar FK como rollback. Não editar 001–010 ou migration já aplicada. Falha de registro tem de reverter a transaction, não ser reparada por mentira de metadata.

Ainda não ocorreu o ponto de não retorno **de autoridade organizacional/negócio**: nenhuma política/sessão/grant v2, binding publicado, Legal ativa ou fato v2. Há, porém, **mudança do requisito de pacote/schema já na aplicação da migration**, independentemente de dados vazios. Após criação técnica de candidatas/eventos, preservar essas evidências também. Publicação de binding já impede desfazê-lo mesmo sem fato; ativação de ACL/contexto ou primeiro fato exigirá recovery compatível próprio. Esses pontos não são atingidos por esta proposta documental.

Não inventar RPO/RTO, janela, backup por tenant ou permissão de descartar venda posterior ao backup. Qualquer restore operacional futuro exige aprovação, inventário dos efeitos desde backup, escopo de tenants, preservação/reconciliação e ensaio isolado.

## 13. Riscos, alternativas e decisões pendentes

| Risco / impacto | Recomendação e alternativa | Dependência / esforço qualitativo |
| --- | --- | --- |
| Pacote antigo rejeita 011/backup novo: retorno não é imediato | Manter schema + pacote compatível homologado; alternativa restore prévio isolado e reconciliação, nunca editar schema_migrations | Gate de C2/recuperação/deployment, **MÉDIO** técnico; recovery operacional depende do caso |
| Perfis/ativação adiados exigem DDL/guards depois | Adição controlada antes da primeira mutação; alternativa instalar tudo cedo, custo/superfície maior | Revisão de Segurança, writer e FK factual, **MÉDIO** |
| Resolução UNIT-only terá expansão CHECK futura | Ledger mínimo em C4, preservar/reconstruir metadado próprio se necessário; alternativa geral completo quando contrato estiver fechado ou ledger separado sob novo aceite | Evidência/forma/fatos/lotes, **MÉDIO/ALTO** conforme caso |
| Referência opaca/proveniência ou FK audit usada como “prova” | Nenhum writer operacional agora; backend futuro valida tenant/causa/ator/conteúdo/refs e auditoria atômica | Política de evidência/serviço protegido, **ALTO** para operacionalização; não é defeito corrigido no baseline |
| REPLACE contorna DELETE trigger dependendo de conexão | Guarda de INSERT por ID + UPDATE/DELETE; homologar conflitos/off/on e multirow, sem alterar PRAGMAs do runtime antigo | Tests SQL adversos C2, **BAIXO/MÉDIO** |
| Introspecção e testes históricos assumem catálogo antigo/rowid | Recorte explícito de schema/data antigos + diferença aditiva esperada, ordenação pela PK no tooling; alternativa schema com rowid somente após rever proteção completa contra substituição | Revisão de teste 010, leitores genéricos e novo upgrade test C2, **BAIXO/MÉDIO** |
| Estrutura vazia anunciada como hierarquia implementada | Manter PROPOSTO/PLANEJADO; C2 será apenas estrutura, nenhuma autoridade comercial | Índices/relatórios futuros, **BAIXO** documental |

Ainda dependem do proprietário: **aceite deste recorte de uma tabela** em vez da hipótese inicial de perfis/resolução/binding; adiamento de version/CAS e campos de ativação; nullability/proveniência técnica proposta (ajuste do catálogo de created_by humano); WITHOUT ROWID e adaptação mínima do tooling identificado antes de C2; estratégia de pacote/recuperação; autorização separada de implementação/ensaios e eventual checkpoint. Não reabrir companies única, opção 2/U-A/múltiplos Owners/P01–P12. Política de resolver/ativação, Segurança de refs/dados reais e contratos posteriores terão seus aceites próprios.

## 14. Entrega documental e critérios de parada

Criado somente este documento; PROJECT_MASTER e ROADMAP recebem indicações mínimas de baseline/ORG-002 checkpoint e **C1 em revisão**, sem recomendar execução automática. ORG-001, ORG-002, Documento Mestre, código, testes executáveis, frontend, migrations 001–010, dependências e dados preservados.

Verificações nesta rodada: leitura de fontes e testes; metadados de versão Node/SQLite; documentação oficial; conferência Git, whitespace/diff e links locais. **Não houve teste de aplicação/DDL, criação de SQLite, base operacional aberta, runtime/servidor/backfill/restore/benchmark/navegador executado.** Nenhum arquivo 011_*.sql foi criado; nenhum LegalRepository/adapter/resolution/binding/Owner/ACL/session/fact foi implementado. Nenhum commit/push, C2 ou Fase D iniciado.

Se o DDL futuro não passar, se aparecer consumidor não inventariado, se recovery depender de burlar checksum/FK ou se alguma decisão aprovada se mostrar inviável, interromper o incremento e apresentar evidência/alternativas antes de corrigir. **Entrega somente para revisão do proprietário; aguardar decisão.**
