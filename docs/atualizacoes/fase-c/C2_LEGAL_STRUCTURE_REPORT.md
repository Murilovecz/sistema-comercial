# C2 — Estrutura legal dormente / migration 011

Data: **06/10/2026**. Baseline aprovada e conferida: `5c9c7a4c2b6b611065c7488ac6ec2d72f425e993`, branch `v1.3-frontend`, árvore inicialmente limpa. Fonte de autorização: solicitação expressa do proprietário **FASE C — C2 — ESTRUTURA LEGAL DORMENTE / MIGRATION 011**. Referências conceituais preservadas: [Documento Mestre](../../../Documento_Mestre_Sistema_Comercial_v1.0.md), [ORG-001](ORG_001_SPEC.md), [ORG-002](ORG_002_EXECUTABLE_DESIGN.md) e [C1 aprovada](C1_MINIMAL_DDL_PROPOSAL.md).

**Estado:** C2 **pronta para checkpoint**, sujeita à revisão do proprietário. Implementação estrutural, homologação específica e regressão ampla concluídas sem falhas. Sem commit/push, implantação, abertura da base operacional, C3 ou Fase D. Este relatório não concede autorização para uma etapa posterior.

## 1. Escopo e responsabilidades

Banco: DDL, constraints, checksums e atomicidade. QA: RED, ataques e regressões. Backend: compatibilidade dos consumidores v1 e IDP-001. Segurança: limites das provas estruturais. Infraestrutura: backup/restore e recusa do catálogo antigo. As definições permanentes dos especialistas foram lidas; nenhum agente antigo ou ciclo histórico foi reativado.

Uma única migration nova. Nenhuma alteração em código de negócio, autenticação, RBAC, permissões, preços, estoque negativo, vendas, Financeiro, auditoria existente, migrador, backup ou dependências. Não há LegalRepository/service/controller, API/UI Legal, profile/head, resolution, binding, lifecycle/sucessão, Owner/grants v2, sessions v2, fact contexts, backfill, version/CAS ou campos de ativação.

## 2. Migration criada e contrato final

[011_legal_entities.sql](../../../foundation/migrations/011_legal_entities.sql) reproduz **integralmente** o bloco SQL aprovado em C1 §5. Comparação executável de texto, normalizando somente CRLF/LF, passou. **Nenhuma diferença de contrato ou correção sintática em relação a C1.** Arquivo UTF-8 sem BOM, LF, SHA-256 `52dbb04cdfe3026f863aa1e2afe543f9fdf94cbb635f5ed636b8b59523418082`.

| Característica | DDL final / prova executável |
| --- | --- |
| Tabela | Somente `legal_entities`, STRICT e WITHOUT ROWID |
| Colunas | `organization_id`, `id`, `legal_type`, `identity_ref`, `status`, `created_at`, `created_by`, `creation_provenance`, `creation_evidence_ref`, `creation_audit_id`; todas TEXT |
| Nullability/default | Nove NOT NULL; somente `created_by` nullable; somente `status` com default `'PROVISIONED'` |
| PK | `(organization_id,id)`, nesta ordem |
| UNIQUE | `id` global; não reutilizável em outra Org |
| CHECKs — 8 | ID não vazio; PF/PJ; identidade não vazia; enum de quatro estados; criação não vazia; USER/TECHNICAL; USER com ator; evidência não vazia |
| FKs — 3 | Org → `companies(id)`; ator → `users(id)`; auditoria → `audit_events(id)`, imediatas, NO ACTION em UPDATE/DELETE |
| Triggers — 3 | `legal_entities_insert_guard`, `legal_entities_no_update`, `legal_entities_no_delete` |
| Índices | Zero CREATE INDEX; chave primária da tabela e uma estrutura secundária implícita UNIQUE de `id`; `index_list` enumera as duas chaves |
| Conteúdo/mutabilidade | Vazia ao instalar; só INSERT PROVISIONED; qualquer UPDATE/DELETE bloqueado |
| Ausências | Sem seed, INSERT de dados, backfill, ALTER antigo, PRAGMA de relaxamento ou IF NOT EXISTS |

A FK de Org usa o ID atual de `companies`; nenhum consumidor foi renomeado ou reinterpretado. A candidata não concede autoridade nem participa de operações comerciais.

## 3. TDD — evidência RED real

Os testes foram escritos e executados **antes** de criar o arquivo final 011 e adaptar o comparador. Duas execuções registradas:

| Execução | Resultado antes da implementação | Motivo real |
| --- | --- | --- |
| `node --test --test-isolation=none foundation/legal-entities.test.js` | 11 testes: 10 falhas esperadas, 1 aprovado | Schema: `migration 011 inexistente`; integridade, tipos/estado, proveniência, limite semântico, dois modos de conflitos, upgrade e checksum: `migration 011 precisa instalar legal_entities`; tooling: `no such column: rowid` |
| `node --test --test-isolation=none foundation/legal-structure-runtime.test.js` | 3 testes: 3 falhas esperadas | Runtime v1 e backups A/B/C chegaram à verificação de instalação e falharam por schema 011 ausente |

O teste de atomicidade **já estava verde no RED**: executava o DDL aprovado em um diretório de migrations sintético, interrompido por erro intencional após criar tabela e primeira trigger e tentar alterar um dado antigo. Isso prova a proteção transacional existente, não a presença da migration final.

Total novo: **14 testes**, dos quais **13 realmente RED**. Os ataques dependentes do schema não haviam sido exercitados além da verificação de ausência; foram efetivamente executados no GREEN.

No primeiro GREEN, a fixture adicional de replay de estoque estava incompleta: não possuía snapshot/marker de unidade; ao prepará-la, faltavam as listas obrigatórias de Clientes/Vendas. Foram corrigidos somente os dados sintéticos do teste, preservando as guardas de divergência e validação. Não foi defeito de DDL ou runtime legítimo. Sem refactor de negócio.

## 4. Arquivos da entrega

| Arquivo | Alteração |
| --- | --- |
| `foundation/migrations/011_legal_entities.sql` | Novo DDL mínimo exato |
| `foundation/legal-entities.test.js` | 11 testes estruturais, adversariais, migrador e tooling |
| `foundation/legal-structure-runtime.test.js` | 3 cenários v1 e backup/restore |
| `foundation/legal-structure-test-fixture.js` | Helpers exclusivamente de teste, refs artificiais e cópia de prefixos de migrations |
| `foundation/receipt-fk-index.test.js` | Catálogo sintético limitado a 001–010 para homologação histórica de 010 |
| `scripts/stock-insert-equivalence.js` | Ordenação por PK para tabelas WITHOUT ROWID, preservando snapshot completo |
| `docs/atualizacoes/fase-c/C2_LEGAL_STRUCTURE_REPORT.md` | Este relatório |
| `docs/atual/PROJECT_MASTER.md` | Estado vigente e limites de autorização |
| `docs/atual/ROADMAP.md` | C1 aprovada, C2 executada dentro do recorte, gates posteriores |
| `docs/atual/DATABASE.md` | Catálogo 011, garantias/limites e compatibilidade de restore |

Documento Mestre, ORG-001, ORG-002 e C1 permanecem intactos. Nenhum arquivo foi adicionado ao índice Git.

## 5. Tooling e consumidores

`contents` mantém **todas** as tabelas não internas que já comparava, inclusive Legal. Consulta `PRAGMA table_list`; para WITHOUT ROWID, usa colunas de `table_info` ordenadas pelo ordinal da PK. Para tabelas antigas, conserva `ORDER BY rowid`. Não ignora linhas nem troca equivalência por contagem. Teste insere candidatas fora de ordem, confronta o snapshot com a ordem `(organization_id,id)`, executa dois replays descartados, verifica candidatas preservadas e comprova alteração do digest ao inserir outra candidata.

O teste histórico de 010 copia prefixos 001–009/001–010 sem alterar bytes. Continua comparando todas as tabelas antigas, schemas, históricos, espelhos, revisões, markers, checksums, FKs diferidas e recibos com múltiplos movimentos. A nova diferença de catálogo é comprovada separadamente pelo teste 011: uma tabela, um autoindex UNIQUE e três triggers, sem mudança dos objetos antigos.

Consumidor adicional inspecionado: snapshot global de `commercial-sales-read-http.test.js` já ordena linhas canônicas e funciona sem rowid; preservado. Benchmarks/testes que ordenam tabelas de estoque conhecidas por rowid permanecem válidos, pois nenhuma dessas tabelas foi convertida. Nenhum outro consumidor precisou de adaptação.

## 6. Migration, atomicidade e integridade

- Upgrade de banco sintético 001–010: cada tabela antiga preservada, catálogo antigo intacto e Legal vazia.
- 011 aplicada uma vez; segundo `migrate` e reabertura produzem conteúdo completo idêntico, inclusive registro/timestamp da aplicação.
- Checksum alterado de 011 aplicada recusa avanço com a guarda existente. Não se editou `schema_migrations` manualmente para produzir esse resultado.
- Migration equivalente interrompida no meio: nenhuma tabela/trigger Legal parcial, nenhum registro 011, nenhuma alteração do dado antigo; snapshot integral igual ao anterior.
- PRAGMAs reais confirmam STRICT, WITHOUT ROWID, tipos, default/nullability, PK, UNIQUE, FKs e SQL das três triggers.
- Foreign keys e integrity checks permanecem válidos nas verificações de upgrade, tooling e restore; não houve relaxamento do migrador.

### SHA-256 001–010 — antes e depois, iguais

Além da comparação de hashes do disco antes/depois, `git diff HEAD` das dez migrations não mostrou alterações. As cópias sintéticas e os registros aplicados conservaram seus checksums.

| Migration | SHA-256 do arquivo, preservado |
| --- | --- |
| 001_foundation.sql | `4bcec35e59b9af50975ae4736561039891c26febc61550bf47c2f1995f438ee7` |
| 002_products.sql | `7fff6835119519962908735eb25339a5754a3904572d7356b70f74c64d2a720b` |
| 003_customers.sql | `03ae6dcd8471ee46c516ea7fa6f6b8a1843913e9209c93ef2b9fde75ed74ca38` |
| 004_suppliers.sql | `5eb946a87dac12d6c01e12b3594a9172702a460faf4e7fceb8346846095c8236` |
| 005_purchases.sql | `bb241a2274d27e9de285508dabee73d2cd55e01422a036fbc54f90e7c7642829` |
| 006_inventory.sql | `5133ffb46374717a2521d9cc9a5723c23fe1aacbc2e5392ce63d269cec3213e8` |
| 007_inactive_sale_approval.sql | `443addfe846c976245740030adf2f75c700f181431975b123b0c94de85e0c5a6` |
| 008_access_maintenance.sql | `465a9c19f18031a636a54a904a81a7602cca02ee95911fa047691355b9fe6de5` |
| 009_sales.sql | `f4f2ed25ee32dbbe8c8ebb7b1b85fff2931de1902da9f9279d99cdd176150b02` |
| 010_stock_receipt_fk_index.sql | `2b41117b7da528abd6b0a7b1a0a19c9f28c64d0e3d3d6e46db61611b7d1286b9` |

## 7. Adversarial, proveniência e limites de auditoria

Org inexistente/evento inexistente: FK recusa. Dez colunas e nullability exata comprovadas; ID/refs/criação vazios recusados; BLOB em TEXT recusado pelo STRICT. PF/PJ PROVISIONED entram. UNKNOWN e estados ACTIVE/SUSPENDED/CLOSED não entram. USER exige ator válido; USER nulo ou ator inexistente recusa. TECHNICAL admite ator nulo ou existente.

Com `recursive_triggers=0` **e** `=1`: UPDATE de cada coluna e UPDATE sem mudança, DELETE, INSERT OR REPLACE, REPLACE, OR IGNORE, UPSERT por ambas as chaves/DO NOTHING e multirow com conflito abortam, preservando candidata e snapshot integral. Conflitos no mesmo tenant e em outro tenant foram exercitados. Tentativa de substituição por rowid falha porque a tabela não tem essa coluna. ID global duplicado não pode reaparecer em outra Org.

**Limite comprovado deliberadamente:** uma candidata da Org B referenciando evento da Org A e ator sem membership B é aceita pelo SQL, desde que essas identidades existam. O evento também pode ter causa distinta. Isso corresponde ao limite aprovado de C1, não é autorização, isolamento HTTP Legal ou validação semântica. O futuro writer deverá conferir Org/causa/operação, proveniência, permissão e evidência, auditar na mesma transação e ter testes negativos próprios. Nenhuma trigger de autorização foi acrescentada.

## 8. Compatibilidade v1 e IDP-001

Fluxo novo executado via servidor HTTP real em loopback, com DB descartável:

1. Banco 001–010, setup e criação de produto/venda por APIs existentes.
2. Encerramento do servidor, snapshot de cada tabela e linha SQL da venda/fingerprint.
3. Upgrade 011, comparação de todas as tabelas antigas e reabertura do runtime v1.
4. Login/contexto C/U; retry da **mesma** identidade artificial `c2-synthetic-sale-intent` e payload. Mesma venda, linha SQL/fingerprint intactos, mesma revisão/saldo/recebimento, nenhum evento de auditoria comercial adicional. Login produz sua auditoria legítima antes dessa comparação.
5. Perfil sem direito tem leitura comercial/venda negadas; cadastros de Clientes/Fornecedores, compra confirmada/recebida, estoque e nova venda com Caixa aberto funcionam.
6. Saldo final esperado: 5; duas vendas distintas, um recibo de compra e um movimento de Caixa de 1000 centavos, fechamento válido, auditoria íntegra. Logout invalida sessão e login volta a funcionar.
7. Legal permanece **zero linhas** durante toda a operação normal. Caminhos HTTP sondados de Legal retornam 404. Revisão do diff confirma ausência de qualquer implementação/rota/UI Legal.

Regressão IDP-001 existente: **12 testes backend + 1 teste UI**, todos aprovados na execução pertinente. Abrange requestId ausente/inválido, retry exato, payload alterado, executor/contexto, atomicidade, concorrência, duas conexões/reinício, histórico sem prova, recebimento misto/crédito e retry de UI preservando payload/intenção após timeout. A UI foi exercitada pelo teste VM existente do código legado; **não houve homologação visual em navegador** nem resultado visual presumido.

Financeiro/Caixa continuam híbridos e cobertos pelos caminhos/testes v1 existentes. C2 não os normaliza nem modifica regras.

## 9. Backup/restore A, B e C

| Cenário | Resultado |
| --- | --- |
| A — backup pré-011 → restore pelo código atual → upgrade → v1 | Manifest de dez migrations aceito; restore isolado; SqlStore novo aplica 011; cada tabela antiga equivalente; setup e venda legítima após restore funcionam; Legal vazia; origem íntegra |
| B — backup pós-011 → restore pelo código atual | Manifest com onze migrations; preservação integral de dados, candidata sintética, auditoria e DDL WITHOUT ROWID; reabertura no-op |
| C — backup/DB pós-011 → catálogo antigo 001–010 | Migrador recusa 011 desconhecida tanto em `migrate` quanto nova conexão; validador/restore de backup recusa schema incompatível; destino recusado não criado e origem preservada |

**Precisão da evidência de pacote antigo:** o migrador real usa seu parâmetro existente `migrationsDir` com prefixo físico sintético 001–010. Para backup, um harness de teste compila o arquivo **inalterado** `backup-service.js` e limita somente a listagem de seu catálogo a 001–010 por uma fachada local de `fs`; toda validação real de manifest, checksum e banco continua ativa. Não modifica o módulo global, migrador/backup ou regras, nem gera pacote de deployment/compatibilidade. Comprova a recusa pelo catálogo antigo; **não ensaia um instalador/binary antigo distribuído**. Essa limitação não é convertida em garantia de recovery real.

O restore existente valida/copia, não aplica migrations. A atualização ocorre ao abrir o destino com SqlStore do novo catálogo. Nenhum pacote de compatibilidade foi criado. O pacote 001–010 não é rollback seguro de DB já migrado; decisão de deployment/recovery permanece futura.

## 10. Execuções e contagens

Runtime observado: Node **v24.19.0**, SQLite **3.53.3**, sem atualização. Todas as gravações foram em memória ou diretórios sintéticos. Novos fixtures de disco ficam em `.qa/fase-c-c2`, ignorado pelo Git, com verificação do caminho antes da remoção. Testes existentes conservam seus diretórios sintéticos próprios. A base operacional não foi aberta ou usada como massa.

Fixtures Legal usam somente referências artificiais (`identity-ref-test-*`, `evidence-ref-test-*`), nenhum CPF/CNPJ/documento real, segredo, senha, token ou URL credenciada. A homologação de autenticação reutiliza o helper de teste existente com credenciais **sintéticas e transitórias**, sem copiá-las para Legal, auditoria, este relatório ou logs. Não foram adicionadas novas credenciais persistidas em código/documentação.

| Execução | Resultado |
| --- | --- |
| Novos C2 + histórico 010 | **18/18 aprovados**, zero falhas/cancelados/skips |
| Pertinente: todos os testes de `foundation`, exceto famílias `frontend*`, `sales-ui*`, `access-ui*` | **420/420 aprovados**, zero falhas/cancelados/skips; 106,1 s |
| Regressão ampla — `APP_ENV=test node --test --test-isolation=none` | **659/659 aprovados**, zero falhas/cancelados/skips; 109,9 s |

Os 14 novos, os quatro de 010 e os 13 IDP-001 estão incluídos nos 420; **não somar execuções sobrepostas como testes únicos**. Logs de execução são artefatos sintéticos ignorados, não arquivos da entrega.

`npm` não está disponível no PATH desta sessão. A tentativa não iniciou testes. A regressão ampla usa diretamente **`node --test --test-isolation=none`**, comando exato do script `test` de `package.json`, com `APP_ENV=test`; nenhuma instalação/alteração de dependências.

## 11. Riscos residuais, limitações e itens preservados

- Segurança estrutural SQL não certifica autorização backend Legal, isolamento HTTP Legal, step-up, evidência jurídica, criptografia, SaaS ou acesso administrativo ao arquivo local.
- Refs/date não vazios não certificam documento, conteúdo externo ou instante jurídico. USER com FK válida não prova membership/autoridade. Limites semânticos foram explicitamente testados.
- Legal permanece candidata imutável. Antes da primeira mutação: version/CAS, perfis/head, campos de ativação e transição auditada, além de substituição revisada da guarda total. Sem autorização para isso aqui.
- Pacote antigo recusa 011; implantar/reverter exige estratégia própria. Nenhuma operação sobre o banco da loja ou DR real foi homologada.
- Nenhum benchmark novo de latência foi feito; código de negócio e índices de tabelas antigas não mudaram. O comparador incorpora a tabela nova por metadata, sem cache permanente.
- Nenhum defeito adjacente de negócio/DDL foi identificado nas execuções específicas, pertinente e ampla. A preparação incompleta da nova fixture foi corrigida como descrito em §3; regras legítimas permaneceram intactas.
- Preservados integralmente: 001–010, migrador, backup, contratos v1/IDP-001, append-only existente, preços, estoque negativo, RBAC, dependências e documentos conceituais aprovados.

## 12. Git e encerramento

`git diff --check`: aprovado. HEAD permanece `5c9c7a4c2b6b611065c7488ac6ec2d72f425e993`. Índice Git vazio. Diff relido: somente uma migration nova, testes/fixtures de teste, os dois ajustes de tooling/teste histórico e os quatro documentos necessários. Código de negócio, migrador/backup, 001–010 e referências conceituais aprovadas intactos.

`git diff --stat` (Git enumera somente os cinco arquivos já rastreados modificados; os cinco novos abaixo ainda são untracked):

```text
 docs/atual/DATABASE.md              |  5 +++++
 docs/atual/PROJECT_MASTER.md        |  7 ++++---
 docs/atual/ROADMAP.md               |  8 ++++----
 foundation/receipt-fk-index.test.js | 19 ++++++++++---------
 scripts/stock-insert-equivalence.js |  9 ++++++++-
 5 files changed, 31 insertions(+), 17 deletions(-)
```

`git status --short` — dez arquivos da entrega, sem artefatos de execução:

```text
 M docs/atual/DATABASE.md
 M docs/atual/PROJECT_MASTER.md
 M docs/atual/ROADMAP.md
 M foundation/receipt-fk-index.test.js
 M scripts/stock-insert-equivalence.js
?? docs/atualizacoes/fase-c/C2_LEGAL_STRUCTURE_REPORT.md
?? foundation/legal-entities.test.js
?? foundation/legal-structure-runtime.test.js
?? foundation/legal-structure-test-fixture.js
?? foundation/migrations/011_legal_entities.sql
```

A árvore contém somente essa entrega pendente; **não está limpa**, pois não houve commit. Nenhum banco, backup, screenshot, temporário, log, credencial ou dependência está no índice/na lista de arquivos da entrega. Não houve commit/push ou início de C3/D. Critérios de C2 atendidos dentro dos limites estruturais e sintéticos descritos; aguardando revisão.
