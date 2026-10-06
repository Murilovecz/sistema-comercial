# BRAND-001 — Personalização por Organization

Data: 06/10/2026. Baseline: `2b0c172bc101e8a0f0f39161ad9d5ef43c09a37f`, árvore limpa após checkpoint histórico C2. Autorização: continuação expressa do proprietário após `test: pin c2 migration history through 011`.

## Desenho e critérios antes da migration

Incremento isolado de identidade visual, uma aplicação/build. `companies(id)` continua sendo a Organization física. Sem alterações em ORG-001/ORG-002/C1/C2, 001–011, regras comerciais, C3 ou D.

Inspeção: React possui Design System com Button/FormField/Alert/PageShell, shell de sessão e roteamento; ainda não possui módulos comerciais. SessionProvider invalida o snapshot ao trocar contexto/logout. Cliente HTTP aceita contexto C/U esperado e CSRF em memória. UI legada mantém shell operacional e sessão backend. `companies.manage` já significa gerenciar a própria empresa; será reutilizada, sem cargos/Owner/ACL v2. Auditoria append-only participa da transação SqlStore. Migrations têm ordem/checksum e recusa de schema desconhecido. C2 histórica agora fixa 001–011; 010 fixa 001–010.

Assets encontrados: somente arquivos estáticos da aplicação e exports protegidos; não há upload/assets com referências opacas, ownership por tenant, validação tipo/tamanho e acesso protegido para logos. **LOGO DEFERIDA PARA BRAND-002 / Files Core.** Nenhum file server, BLOB/base64, caminho local ou URL externa configurável será criado.

Schema proposto: uma tabela `organization_branding` STRICT, PK/FK `organization_id → companies(id)`. Sem seed/backfill; ausência significa default. Oito colunas: organization_id (ownership 1:1), display_name (nome visual independente do cadastro), primary_color/accent_color (RGB controlado normalizado), theme_mode (LIGHT/DARK/SYSTEM), revision (CAS), updated_at e updated_by (última alteração comprovada). Created_at dispensado: a criação já tem evento auditado; campos de logo/overrides adiados. Nenhuma alteração de companies/Legal/Unit.

API proposta: GET/POST `/api/organization/branding`, contexto exclusivamente verificado no backend; sem IDs na URL/body, sem query de seleção. POST exige `companies.manage`, CSRF e `expectedRevision`. DTO somente displayName/primaryColor/accentColor/themeMode/revision. Primeira gravação exige revisão 0, próximas a revisão atual; stale é 409. Escrita e auditoria atômicas. Restaurar padrão é gravação auditada com nova revisão, sem apagar histórico.

Tokens centralizados com on-primary/on-accent calculados por luminância/contraste, preto/branco ≥4,5:1; cores estruturais continuam controladas. Links usam alternativa legível quando a cor escolhida não contrasta com superfície. Referência: [WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). SYSTEM usa preferência de mídia. Preview local não persiste. Login/logout usam plataforma; troca de contexto aplica default e cancela/ignora respostas antigas por geração/contexto.

Critérios: DB/FK/cores/estados, CAS e atomicidade; testes negativos A/B/permission/CSRF; default; race A→B/logout; configuração/preview React; adapter legado sem nova fonte; C2/010/IDP/sessão/RBAC/backup/React pertinentes, depois regressão ampla. Somente bases sintéticas. Compatibilidade: backup pré-012 restaura com catálogo novo, depois migra; pacote antigo desconhecendo 012 recusa DB/backup atualizado, sem enfraquecer migrador/backup. Sem deploy ou abertura da base operacional.

## TDD inicial

Antes da implementação: **9/9 RED** — três testes da camada central inexistente, dois por schema 012 inexistente, quatro por API inexistente (404). A coleção executou normalmente; não houve falha de import acidental. Testes adversariais dependentes executam suas verificações completas no GREEN.

## Checkpoint histórico concluído antes de BRAND

HEAD original confirmado: `d324282b26db307ab642a89197a61de2846fca3e`. Exatamente três arquivos pendentes, somente testes/helpers C2; migrations 001–011 preservadas e diff check limpo. Commit único autorizado: **`2b0c172bc101e8a0f0f39161ad9d5ef43c09a37f`**, `test: pin c2 migration history through 011`.

- `foundation/legal-structure-test-fixture.js`
- `foundation/legal-entities.test.js`
- `foundation/legal-structure-runtime.test.js`

Três arquivos, 33 inserções/17 remoções, árvore limpa depois do checkpoint; sem push. Homologação anterior: 25/25 (C2/010/SqlStore). Só depois começou a continuação expressamente autorizada de BRAND. O ajuste histórico continua fechado no commit; esses três arquivos não foram novamente modificados pelo BRAND.

## Responsabilidades e evidências de inspeção

Papéis permanentes consultados, sem reativar diretor/tester antigos ou processos de agentes: Backend — integração contextual e compatibilidade; Banco — DDL/CAS/migração/restore; Segurança — permission/CSRF/isolamento/valores controlados; Frontend/UX — DS, preview e shell; QA — RED/GREEN e regressão; Documentação — contratos/estado/limites. Código/testes existentes orientaram a entrega.

| Superfície existente | Evidência | Decisão deste incremento |
| --- | --- | --- |
| DS React | `frontend/src/ui/{Button,FormField,Alert,PageShell}.tsx`, `ui.css` | Reutilizado; identidade por tokens, sem page builder |
| Sessão/HTTP React | SessionProvider, session-loader, `api/http.ts` | Provider dentro de sessão; headers esperados/abort/CSRF já existentes |
| Shell legado | `public/foundation-ui.js`, index/style e render comercial | Adapter pequeno, mesmo contrato/core; nenhuma configuração local própria |
| RBAC | `foundation/rbac.js`, permission existente `companies.manage` | Nenhuma permission/grant nova; nome de cargo não concede direito |
| Autoridade contextual | `foundation/request-context.js`, IdentityService | Contexto C/U validado, nunca ID do body como authority |
| Atomicidade/audit | SqlStore.transaction, `foundation/audit.js` | Audit append-only na mesma transação; ator/Org/instante backend |
| CAS existente | Revisões de estado e expectedVersion administrativos/comerciais | Revisão própria do branding; não altera revisão comercial |
| Migrations | `foundation/migrations/001–011`, sql-store | Adição 012, checksum/ordem/recusa histórica preservados |
| Assets | whitelist estática em server, exports protegidos | Não atende Files Core/logo segura; logo deferida |

## Contrato final e justificativa do schema

Migration **012_organization_branding.sql**: uma tabela STRICT, oito colunas, PK/FK Organization existente, sem backfill/seed, sem tabela organizations. Nenhum cadastro comercial ou identidade legal é renomeado pelo nome visual.

| Campo | Necessidade/garantia atual | Derivação/adiamento |
| --- | --- | --- |
| organization_id | Uma configuração por tenant; FK a companies(id) | Backend deriva da sessão; não aceita body/URL |
| display_name | Nome visual editável sem alterar cadastro/fatos | Não pode ser derivado do nome cadastral sem perder personalização |
| primary_color | Cor principal RGB controlada | Backend normaliza; on-primary derivado, não persistido |
| accent_color | Destaque visual independente | Backend normaliza; on-accent derivado, não persistido |
| theme_mode | LIGHT/DARK/SYSTEM consistentes no contrato | Preferência SYSTEM resolvida no navegador, sem guardar preferência do usuário |
| revision | CAS impede atualização perdida | Técnica, criada/incrementada pelo backend; ausência = 0 |
| updated_at | Instante da última gravação | Backend produz; criação histórica consta no audit |
| updated_by | Último ator autenticado, FK usuário existente | Backend produz; nenhuma criação técnica/seed neste escopo |
| created_at — omitido | Evento CREATE já registra instante | Duplicação dispensada; sem campo adicional |
| Logo/Legal/Unit/user override — omitidos | Infra/contratos ausentes ou fora do escopo | Deferidos; nenhuma URL/local/base64/BLOB |

DDL rejeita Org/ator inexistentes, configuração duplicada, cores fora de RGB maiúsculo, NUL escondido nas cores, tema desconhecido, revisão não positiva/não inteira e strings obrigatórias vazias. Validação adicional da API limita nome bruto a 80, rejeita controles, normaliza espaços externos e garante revisão inteira segura. SQL parametrizado. DB direto não é uma API de autorização.

GET/POST `/api/organization/branding`, sucesso 200, DTO com apenas cinco campos. GET exige sessão/contexto válido. POST exige **companies.manage efetiva em todas as Units ativas da Organization atual**, Origin/CSRF e body completo com expectedRevision; rejeita extras, queries seletoras, IDs/URL por tenant, CSS/logo. Não usa Owner, nome de cargo, nova permission ou grants automáticos. O alcance é conferido antes da validação do comando e novamente dentro da transação, antes da escrita. Falta de alcance retorna 403 FORBIDDEN_BRANDING_SCOPE; a ausência da permission no contexto continua sendo negada pelo guard existente. GET permanece permitido ao usuário autenticado/contextual.

### Decisão final de autoridade — revisão pré-checkpoint

**Fonte e status:** instrução expressa do proprietário nesta revisão, implementada e testada; ainda sem autorização de checkpoint BRAND. A inspeção não encontrou grant/primitive real que prove `companies.manage` em scope Company/Organization. `foundation/migrations/001_foundation.sql` guarda vínculos Company sem permission; roles pertencem à Company, mas sua atribuição ao usuário é `unit_roles(user_id,company_id,unit_id,role_id)`. `foundation/rbac.js::effectivePermissions` calcula a permission em uma Unit com vínculos/entidades ativos. `foundation/identity.js::requirePermission` usa o contexto selecionado. Pertencer à Company ou ter um cargo não comprova autoridade sobre ela inteira.

“Unit operacional relevante” já é definida no código v1: `status='active'`, conforme `foundation/scoped-state.js::assertScope`, `foundation/access.js` e o RBAC existente; os estados da Unit em 001 são active/inactive. A compatibilidade em `foundation/organization-branding.js::requireOrganizationReach` enumera **todas as Units ativas da Company atual**, sem restringir aos contextos visíveis ao usuário, e reutiliza `effectivePermissions` para cada uma. Lista vazia também falha. Outra Organization nunca satisfaz a prova. Nova Unit ativa sem grant efetivo bloqueia o gestor antes autorizado; desativação/reativação segue o mesmo critério operacional existente. Não foi inventado lifecycle novo.

**Impacto e trade-off:** a escrita se torna mais restrita, inclusive quando a Unit sem grant não aparece no seletor. O editor pode continuar visível pela permission do contexto, mas o servidor rejeita a gravação e a UI explica o alcance necessário. A verificação cresce com o número de Units e ocorre também na transação síncrona; nenhuma cache de autoridade foi criada. Isso preserva fail-closed e mudanças de grants/Units, ao custo de consultas adicionais. Uma primitive Company-wide futura pode substituir esta compatibilidade somente após desenho e autorização próprios. `POST /api/foundation/units` já copia roles do criador em seu fluxo administrativo histórico; esse comportamento existente não foi modificado nem usado para criar concessões pelo branding.

Primeira gravação CAS 0→1; futuras N→N+1. Atualização WHERE Org+revision; conflito 409 STALE_BRANDING, sem last-write-wins. Audit CREATE/UPDATE inclui ator/Org/unidade executora/instante, recordId da Org, antes/depois e changedFields. Falha audit reverte configuração/revisão; erro/stale não registra sucesso. Restaurar default cria nova revisão auditada, sem apagar linha/histórico.

## Tokens, fallback, React e legado

`shared/branding-core.mjs` e tipagem `.d.mts` são a fonte comum de default, parsing, contraste e loader. React incorpora essa fonte no único build; legado importa a rota estática exata `/branding-core.mjs`. As rotas de adapter/CSS são também fixas, não um file server de arquivos de clientes. Vite libera somente o arquivo exato além do frontend; raiz/privados continuam bloqueados.

Tokens: --brand-primary/--brand-on-primary/--brand-accent/--brand-on-accent, paletas estruturais --ui-* controladas pela aplicação. **LIGHT:** fundo #F5F5F5, superfície #FFFFFF, superfície auxiliar #EFEFEF. **DARK:** fundo #151515, superfície #242424, auxiliar #303030. Texto, bordas e muted também são neutros, sem verde fixo; surfaces não herdam primary_color. A marca comanda ações principais, accent, seleção/highlights e pequenos detalhes. Texto sobre as duas cores recebe preto/branco de maior contraste, ≥4,5:1 nesses pares; link usa primary somente se atingir ≥4,5:1 nos três fundos relevantes, caso contrário usa #303030/#F0F0F0 conforme tema. Danger/warning/success continuam estruturais; focus acessível permanece controlado pela aplicação. Isso não equivale a certificação WCAG de toda a aplicação legada. SYSTEM acompanha mudança de prefers-color-scheme.

Default central: Sistema Comercial, #17603C/#B88700, LIGHT, revisão 0 sem linha. Erro de leitura/DTO inválido usa default; nenhum cache/localStorage ou reaproveitamento da última Org. Dado persistido visual inválido usa default e preserva revisão válida; revisão corrupta não permite reparo cego, exige diagnóstico posterior. Falha HTTP não comprova ausência de gravação.

Provider único limpa visual no render que muda contexto, antes dos efeitos, e carrega novo contexto com geração/abort; resposta tardia não substitui contexto novo/logout. Save só aplica resposta se o contexto ainda é o atual. Editor Aparência: nome, cores, temas, card/texto/badge/botões DS, preview local, cancelar, restaurar e salvar. Restore só grava ao Save; conflitos/timeout pedem leitura/revisão, sem retry automático. Login sem contexto permanece plataforma. `/ui/appearance` tem entrada explícita no Node para link/reload, sem liberar deep links genéricos.

Adapter legado: mesmo GET/core, contexto esperado, texto via textContent, título/tokens e link Aparência condicionado à permission. Invalida default antes de context/logout/clear; ignores tardios. Tema modifica shell lateral/fundo; **área comercial/formulários permanecem LIGHT neutros**, inclusive fundo da área principal, para conservar legibilidade dos módulos antigos. O adapter deriva os tokens --legacy-* de LIGHT no mesmo core, sem configuração própria. Tabelas, controles, painéis e trays deixam de depender de superfícies verdes; primary/accent ficam nos elementos de identidade. Tema escuro completo legado foi deferido; não houve migração do CSS de dezenas de telas. Nome/cadastro cadastral/recibos/documentos históricos não mudam.

## Homologação e testes reais

| Verificação | Resultado |
| --- | --- |
| RED inicial antes de implementar API/schema/core | 9/9 RED, motivos descritos acima |
| RED adicional da rota direta Aparência | 404 antes; 200 após entrada explícita; privados/rotas desconhecidas 404 |
| RED adversarial ampliando teste DB | SQLite GLOB aceitou sufixo NUL em escrita direta sintética; guarda instr(char(0)) adicionada somente em 012; GREEN |
| RED ampliando contraste dos tokens | #767676 passava no fundo normal, mas falhava no hover do secundário; --ui-link passou a exigir ≥4,5:1 em superfície/fundo/hover, com fallback controlado; GREEN |
| RED da revisão de alcance e neutralidade | Antes das correções: **5 RED / 1 GREEN**; o caso sem manage já era corretamente negado. Outros casos expuseram alcance insuficiente e superfícies verdes |
| Específicos BRAND finais | **21/21 GREEN**, zero skips; seis casos adicionais de alcance/revalidação e um de neutralidade |
| Primeira regressão pertinente | **69/69 GREEN**: BRAND inicial + 010/C2/SqlStore/IDP/backup |
| Regressão pertinente após a revisão | **86/86 GREEN**, zero falhas/skips; BRAND, RBAC/contexto, legado, 010/011, migrador, IDP e backup |
| Vitest React final | **189/189 GREEN**, 11 arquivos, incluindo 2 previews novos |
| Typecheck / build React | Ambos aprovados, Node 24.19.0; nenhum install/update de dependência |
| Regressão ampla final da raiz | **681/681 GREEN**, zero falhas/skips/cancelamentos, cerca de 139 s, após os ajustes finais de código/testes |
| Git diff check | Limpo; rastreados e arquivos novos conferidos |

Comandos finais: `node --test --test-isolation=none foundation/branding-core.test.js foundation/branding-legacy-ui.test.js foundation/branding-migration-runtime.test.js foundation/organization-branding.test.js`; regressão da raiz com `APP_ENV=test`, `node --test --test-isolation=none`; em frontend, executáveis já instalados de TypeScript/Vitest/Vite para typecheck/test/build. npm/pnpm não estavam no PATH da sessão; nenhum gerenciador/dependência foi instalado. Logs de execução e screenshots ficam somente em `.qa` ignorada, fora da entrega Git.

Dois testes complementares inicialmente exigiram correção do próprio harness (argumento explícito do migrador/import e fechamento de conexões). Nenhum migrador/backup foi modificado para fazê-los passar. A regressão ampla foi repetida após os últimos ajustes de rota/DDL/contraste, e os resultados acima são da versão final.

Cobertura específica: FK/unicidade/STRICT/valores; default/DTO; usuário sem permission e gestor com somente companies.manage; CSRF; Org A-only não seleciona/lê/escreve B com IDs/headers; duas configs independentes; validação de CSS/controles/extras; CAS/stale; rollback audit; restore-default preservando audit chain; corrupção sintética; tokens/contraste; A→B/default/late/logout; adapter e whitelist/deep link. Regressão ampla inclui sessão/contexto/RBAC/legado, 010/011 históricas, migrador, operações comerciais, IDP-001 e backup/restore.

Novos casos de scope em `foundation/organization-branding.test.js`: manage em 1/2 →403; em 2/2 →200; sem manage →403; nova Unit sem grant →403 para o gestor anterior; grant em outra Org (inclusive mesmo ID de Unit) não completa alcance; revogação de permission/vínculo e reativação também negam. Um caso adicional revoga o grant entre a checagem externa e a entrada transacional, provando a revalidação interna. Rejeições conservam dados/auditoria de negócio por comparação integral das tabelas, sem reduzir a contagem. Os testes de contraste existentes foram preservados; a nova prova de neutralidade compara canais RGB das superfícies/textos/bordas para duas marcas em LIGHT/DARK.

Migração 011→012 comparou **cada tabela antiga e DDL integral**, registry/checksums antigos, configurações vazias e no-op. Venda preparada antes de 012 reconheceu replay depois, sem novo efeito; salvar branding não alterou estado comercial. Backup pré-012 restaurou e migrou sem perder dados; pós-012 restaurou todas as tabelas/config/audit/FKs. Catálogo histórico 001–011 executado pelo código inalterado recusou DB/backup 012 sem publicar destino, sem modificação da origem. Não é homologação de recovery da loja ou pacote antigo implantável.

### Navegador real, somente sintético — homologação inicial

Servidor createServer com **SQLite :memory:**, environment=test, importLegacy=false, dataDir `.qa`, backup desabilitado. Dois tenants sintéticos e build único. Nenhuma base operacional aberta; nenhuma credencial real usada.

- Antes do login e antes de selecionar C/U: Sistema Comercial/default.
- A: Loja Azul, #164BA8, DARK; B: Loja Coral, #A63A20, LIGHT, na mesma build.
- Edição de nome/tema alterou somente preview; título/tema global continuaram A até Save.
- Cancelar restaurou config lida; Restaurar padrão alterou somente draft, mantendo marca global A até Save.
- Save confirmou nome Loja Azul homologada; navegação e reload preservaram leitura persistida no servidor sintético.
- A→B mostrou nome/cor/tema B; logout mostrou default #17603C/LIGHT.
- Legado leu a mesma configuração gravada pelo React; A→B manteve isolamento e respeitou perfil restrito B.
- Inspeção visual identificou texto escuro sobre fundo escuro na área comercial legada; fixada superfície clara, e leitura DOM confirmou fundo rgb(243,247,245), texto rgb(0,23,17).
- Link legado → Aparência e reload direto funcionaram depois do teste RED/entrada explícita.

Limitações: race controlada determinística e aborto foram testados pelo loader comum e harness do adapter, não por sabotagem da rede no navegador. SYSTEM foi verificado nos testes para as duas preferências; mudança de preferência real do SO não foi acionada. Não há certificação de toda UI/acessibilidade/browser móvel, nem logo ou tema escuro integral legado. Screenshot de resultado em `.qa/brand-001-appearance.jpg`, somente sintética/ignorada. Servidor de homologação encerrado ao finalizar.

### Homologação visual atualizada — revisão final pré-checkpoint

Navegador real da aplicação, servido pelo build atual com fixture `createServer` SQLite **:memory:**, importLegacy=false e backup desabilitado; toda execução em `.qa` ignorada. Azul/amarelo (#164BA8/#F2C44A) e vinho/rosa (#782344/#F6A8CC), dois tenants independentes, na mesma build. Login/contexto, Aparência, gravação de tema, troca de Organization e logout foram efetivamente exercitados, sem base ou credencial operacional.

| Marca / tema React | Fundo / superfície observados no DOM | Screenshot sintética atualizada |
| --- | --- | --- |
| Azul/amarelo DARK | rgb(21,21,21) / rgb(36,36,36) | `.qa/brand-001-review-blue-dark.jpg` |
| Azul/amarelo LIGHT | rgb(245,245,245) / rgb(255,255,255) | `.qa/brand-001-review-blue-light.jpg` |
| Vinho/rosa LIGHT | rgb(245,245,245) / rgb(255,255,255) | `.qa/brand-001-review-wine-light.jpg` |
| Vinho/rosa DARK | rgb(21,21,21) / rgb(36,36,36) | `.qa/brand-001-review-wine-dark.jpg` |

As quatro inspeções confirmaram ações/destaques da marca sobre superfícies neutras. No legado vinho/DARK, shell lateral rgb(36,36,36) e área comercial LIGHT rgb(245,245,245); azul/LIGHT confirmou shell rgb(255,255,255), área comercial rgb(245,245,245), toolbar rgb(239,239,239), registrada em `.qa/brand-001-review-legacy-light.jpg`. Pequenos indicadores semânticos conservam cores da aplicação. Logout voltou ao nome/default da plataforma. As limitações de SYSTEM real, acessibilidade integral e DARK completo legado acima permanecem. A prova adversarial de scope foi automatizada na API; não foi simulada visualmente uma edição por cada perfil negativo.

## Preservação, trade-offs e itens deferidos

SHA-256 001–010 novamente iguais à tabela do relatório C2; 011 continua `52dbb04cdfe3026f863aa1e2afe543f9fdf94cbb635f5ed636b8b59523418082`. A 012 também permaneceu intacta nesta revisão: `7491f73a443496cf3962a2bdf402873d45dcc20debcca95cdf9e24b713ce5f03`. Testes históricos fixam transições 010/011; 012 não altera suas garantias. ORG-001/ORG-002/C1/C2, Documento Mestre, migrador/backup, dependências/locks, código de preço/estoque/venda/financeiro permanecem intactos. CAS, auditoria, contrato contextual e schema não foram alterados nesta revisão; somente autoridade de escrita e neutralização visual foram ajustadas. Mudanças em server e foundation-ui são integração visual/rota/API contextual, sem autoridade relaxada ou comando comercial alterado.

- **Logo:** deferida BRAND-002/Files Core. Alternativa improvisada rejeitada por ausência de ownership/assets seguros.
- **Permission:** compatibilidade v1 exige companies.manage efetiva em todas as Units ativas; não usa cargos/Owner/grant automático. Uma primitive Company-wide futura exigiria desenho e autorização próprios; simples renomeação de permission não resolveria scope.
- **Defaults:** sem linha conserva DB sem backfill; erro visual degrada para plataforma. Sem dado válido/revisão confirmada, UI não força overwrite.
- **Audit:** append-only transacional local; administrador com controle do arquivo ainda pode alterar DB. Não substitui proteção externa/cloud.
- **CAS/retry:** POST com revisão impede lost update; após resposta perdida, retry de revisão antiga conflita e exige recarregar. Não há requestId/auto-retry adicional para branding.
- **Rollout:** 012 autorizada somente em código/testes; banco real fechado. Pacote 001–011 não reabre DB 012 com segurança; deployment/backup operacional requer decisão separada.
- **Tema legado:** shell adapter usa tema configurado e preserva área comercial LIGHT neutra; mudar todos os módulos para DARK exigiria trabalho visual próprio. React aplica os três temas integralmente ao DS atual.
- **Marca exibida:** é apresentação, não identidade legal/cadastral/autoria/permission.
- **White-label avançado:** domínio/subdomínio, pré-login, e-mails, PDFs, remoção contratual de marca, Legal/Unit overrides somente futuros/add-on.

Roadmap registra prioridade do proprietário: **varejo físico especializado de pequeno porte, MEI/ME/EPP**, sem novos módulos. C3 e Fase D **não iniciados**. Sem file server/organizations/PDV/entitlement por arrasto.

## Entrega para revisão

**Os dois ajustes obrigatórios de BRAND-001 estão concluídos e homologados para revisão**, com logo deferida conforme autorização e limite visual legado explícito. Nenhum commit/stage/push BRAND foi feito. HEAD permanece baseline `2b0c172bc101e8a0f0f39161ad9d5ef43c09a37f`; árvore contém somente a entrega descrita abaixo. Artefatos sintéticos/DBs/backups/logs/screenshots/credenciais não entram na lista de arquivos Git. Aprovação/checkpoint posterior não é presumida.

### Arquivos e diff

**27 arquivos pendentes:** 13 rastreados modificados, 14 novos. Código/API/schema/tokens/editor/adapter e testes novos estão no status completo abaixo; cinco documentos rastreados e este relatório registram somente os contratos afetados. Nenhuma dependência/lock/artefato de execução está nessa lista. O Git não inclui arquivos novos não rastreados em `git diff --stat`; por isso seu resultado literal é complementado pelo status com todos os novos.

`git diff --stat`:

```text
 docs/atual/API.md            |  8 ++++++++
 docs/atual/DATABASE.md       |  5 +++++
 docs/atual/PROJECT_MASTER.md |  5 +++--
 docs/atual/ROADMAP.md        | 10 ++++++++--
 frontend/README.md           | 18 +++++++++++++++---
 frontend/src/app/App.tsx     |  7 ++++++-
 frontend/src/app/app.css     |  4 ++++
 frontend/src/main.tsx        |  3 ++-
 frontend/src/ui/ui.css       | 27 ++++++++++++++++-----------
 frontend/vite.config.ts      |  3 ++-
 public/foundation-ui.js      | 10 ++++++++++
 public/index.html            |  2 +-
 server.js                    | 11 ++++++++++-
 13 files changed, 90 insertions(+), 23 deletions(-)
```

### Git final

`git status --short --untracked-files=all`:

```text
 M docs/atual/API.md
 M docs/atual/DATABASE.md
 M docs/atual/PROJECT_MASTER.md
 M docs/atual/ROADMAP.md
 M frontend/README.md
 M frontend/src/app/App.tsx
 M frontend/src/app/app.css
 M frontend/src/main.tsx
 M frontend/src/ui/ui.css
 M frontend/vite.config.ts
 M public/foundation-ui.js
 M public/index.html
 M server.js
?? docs/atualizacoes/branding/BRAND_001_REPORT.md
?? foundation/branding-core.test.js
?? foundation/branding-legacy-ui.test.js
?? foundation/branding-migration-runtime.test.js
?? foundation/migrations/012_organization_branding.sql
?? foundation/organization-branding.js
?? foundation/organization-branding.test.js
?? frontend/src/branding/AppearancePage.spec.tsx
?? frontend/src/branding/AppearancePage.tsx
?? frontend/src/branding/BrandingProvider.tsx
?? public/branding-ui.js
?? public/branding.css
?? shared/branding-core.d.mts
?? shared/branding-core.mjs
```

Index/staged diff vazio. `git diff --check` limpo; arquivos novos também conferidos por diff/check sem alterar index. Árvore intencionalmente pendente da revisão de BRAND; estava limpa no checkpoint histórico. `.qa`/dist são ignorados; nenhuma base, backup, log ou screenshot é arquivo pendente. Migrations anteriores e documentos conceituais permanecem intactos. Aguardando decisão do proprietário, sem execução adicional.
