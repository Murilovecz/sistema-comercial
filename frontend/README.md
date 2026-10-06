# Frontend V1.3 — skeleton isolado

**ATUAL:** entrada React/TypeScript/Vite, com roteamento declarativo, leitura
de sessão/contexto, login/logout, seleção/troca de contexto e estados visuais mínimos. O backend e a interface legada
permanecem preservados; não há consulta a módulos comerciais na SPA.

BRAND-001 acrescenta aparência por Organization e editor `/ui/appearance`, com preview local, salvar, cancelar e restaurar padrão (persiste somente ao salvar). Escrita exige `companies.manage`, CSRF e revisão/CAS no backend. Logo deferida para BRAND-002 / Files Core. Não há módulo comercial React novo.

## Ambiente

- Node.js 24.7 ou superior; validação realizada com 24.19.0.
- pnpm 11.25.0, indicado em packageManager.
- Package próprio, sem workspace e sem alteração do package da raiz.
- Versões diretas fixadas; pnpm-lock.yaml deve acompanhar o source.
- @types/node tipa a configuração Vite, que também passa pelo typecheck.

A versão 0.0.0 deste package privado não altera a versão oficial da Fundação.

## Instalar dentro de frontend

```sh
pnpm install --frozen-lockfile
```

## Desenvolvimento com Node e Vite

**ATUAL:** o documento continua em http://127.0.0.1:3210/ui/. Vite serve somente
ferramentas/assets/HMR em 127.0.0.1:5173, sem entrada HTML ou fallback próprio.
O Node reaproveita frontend/index.html e substitui apenas a tag da entrada pelos
módulos do Vite e pelo preâmbulo oficial de React Refresh.

Em dois terminais PowerShell, ambos na raiz do projeto:

Terminal A — Node com dados de desenvolvimento isolados:

```powershell
$env:APP_ENV = "development"
$env:DATA_DIR = Join-Path (Get-Location).Path ".qa/v1_3-dev"
$env:SQL_FILE = Join-Path $env:DATA_DIR "foundation.sqlite"
$env:PORT = "3210"
$env:FRONTEND_DEV = "1"
node server.js
```

Terminal B — Vite:

```powershell
pnpm --dir frontend dev
```

Abrir http://127.0.0.1:3210/ui/, mantendo o documento e futuras URLs relativas
/api/ na origem Node. Não abrir a SPA pela porta 5173. PORT continua disponível
na execução normal, mas esta integração de desenvolvimento usa somente 3210.
Não mudar Host/Origin para contornar essa topologia.

FRONTEND_DEV é lido uma vez no startup: ausência ou "0" usa dist; "1" usa a
entrada dev; outro valor interrompe a abertura antes do runtime. Query, header
e cookie não ativam o modo. Para voltar ao build estático, encerrar o Node,
remover a variável com Remove-Item Env:FRONTEND_DEV e reiniciar, mantendo os dados
isolados. O modo normal não procura nem conecta ao Vite.

Se Vite estiver desligado com a flag ativa, /ui/ ainda entrega o HTML dev, mas o
navegador não consegue carregar seus módulos. Legado/API continuam disponíveis;
o Node não inicia Vite, gera build ou implementa retry.

Vite usa loopback, porta 5173, strictPort, CORS somente para a origem Node acima,
hosts explícitos e filesystem strict restrito ao frontend/dependências locais, com allowlist adicional de **um arquivo exato**, `shared/branding-core.mjs`, para os tokens compartilhados. Não libera a raiz do repositório.
publicDir continua desativado. Não há proxy /api, CORS no backend, mudança de
CSRF/cookies ou regra de firewall. Se a porta estiver ocupada, encerrar o processo
de desenvolvimento correspondente; não ampliar o binding para LAN.

O React Router usa a base /ui/ definida pelo Vite. A rota inicial mostra a plataforma antes do contexto e a marca da Organization após carregar; caminhos desconhecidos mostram uma mensagem e
um link de retorno. Não há rota comercial de Produtos.

## Verificar e gerar build

```sh
pnpm typecheck
pnpm build
```

TypeScript strict, sem emissão. O build executa a verificação de tipos antes de
gerar frontend/dist com HTML e assets estáticos com hash. Vite não substitui o
verificador TypeScript. node_modules, dist e caches não entram no Git.

O root do Vite e a permissão de arquivos do servidor dev ficam restritos a
frontend; publicDir está desativado. Nenhum script/CSS de public é carregado.

## Build servido pelo Node

**ATUAL:** depois de gerar o build, o servidor Node existente entrega /ui/ a
partir de frontend/dist/index.html. / continua entregando public/ e /api/ mantém
seus contratos. Não há compartilhamento de DOM ou scripts entre as entradas.
O Node não instala dependências nem executa build no startup.

- GET /ui redireciona com 308 para /ui/, com destino fixo e sem preservar query.
- GET /ui/ entrega o HTML construído; query strings não mudam o arquivo.
- Somente arquivos estáticos de tipos conhecidos sob /ui/assets/ são entregues.
- `/ui/appearance` é a única entrada adicional explícita para o HTML da SPA, permitindo link do legado e reload; não há fallback genérico.
- Asset ausente, caminho privado/inválido ou deep link desconhecido retorna 404
  JSON. Não existe fallback do Node para /ui/produtos ou rotas arbitrárias.
- Sem dist/index.html, /ui/ retorna 503 JSON controlado; legado/API continuam
  disponíveis. A resposta não expõe o caminho físico.
- Métodos diferentes de GET retornam 404, seguindo a política estática do legado.
- HTML, assets e erros mantêm Cache-Control: no-store. Sem manifesto que comprove
  hashes, não se deduz immutable pelo formato do nome do asset nesta rodada.
- Caminhos são decodificados uma vez, normalizados e conferidos dentro de dist,
  incluindo o destino físico de symlinks/junctions. Source e diretórios privados
  não são publicados.

Executar os testes HTTP da SPA e a suíte da raiz exige gerar frontend/dist antes;
os testes não executam build nem alteram os artefatos. Casos de build ausente usam
falhas de filesystem simuladas, sem remover o build ou abrir o banco operacional.

Os testes reais do Vite usam a porta fixa 5173; encerrar o processo Vite manual
antes de executar frontend-vite-http.test.js ou a suíte completa. A verificação
não abre banco operacional. Frontend deve estar instalado e construído antes.

## Transporte HTTP e testes

### Branding compartilhado

`BrandingProvider` único dentro de SessionProvider aplica tokens e título. `shared/branding-core.mjs` centraliza default, validação, contraste e loader; React incorpora o arquivo no mesmo build, e o legado lê a mesma fonte por rota estática exata. Não há cache/configuração por tenant no navegador nem persistência local de branding.

Contexto não confirmado/logout/troca aplica default imediatamente; loader cancela requests e invalida gerações antigas. Resposta tardia A após B ou logout não reaplica A. SYSTEM acompanha `prefers-color-scheme`. Preto/branco calculado para texto em primary/accent; links têm alternativa legível; cores estruturais pertencem à aplicação. Preview aplica tokens apenas ao próprio container; cancelar restaura a configuração lida. Save usa revisão e só publica resposta se o contexto continuar atual. Erro/timeout exige recarregar e revisar, sem retry automático.

LIGHT/DARK usam superfícies estruturais neutras claras/escuras, independentes da marca. Primary/accent comandam identidade; links usam a cor principal somente com contraste suficiente, caso contrário usam alternativa neutra. Danger/warning/success continuam estruturais. O backend exige `companies.manage` efetiva em todas as Units ativas da Organization para salvar; visibilidade do editor pela permission do contexto não comprova esse alcance. O editor apresenta mensagem específica para 403 FORBIDDEN_BRANDING_SCOPE.

Adapter legado aplica nome como texto, tokens, título e link Aparência; tema alcança fundo/shell lateral, enquanto área comercial/formulários conservam LIGHT com superfícies neutras. Tema escuro completo dos módulos legados não foi homologado nem implementado. [Homologação sintética real e limites](../docs/atualizacoes/branding/BRAND_001_REPORT.md).

**ATUAL:** src/api/http.ts fornece get(path, options) e post(path, body, options),
ambos Promise<unknown>, usados pelas funções de autenticação. Aceita caminhos
controlados /api/ com segmentos alfanuméricos, hífen ou underscore; query é passada
separadamente em options.query. Usa fetch nativo, cookies same-origin e bloqueia
redirecionamentos, sem retry, armazenamento local ou logs.

options.context recebe companyId/unitId juntos e envia os headers esperados;
post aceita csrfToken explícito. O transporte não busca sessão/token nem concede
autoridade: backend valida acesso/contexto/CSRF. options.signal cancela a chamada;
timeoutMs é inteiro positivo, padrão 15 s (referência inicial, não SLA). Ambos
cobrem a leitura do corpo e liberam timer/listener. Cancelar ou expirar o prazo
não comprova que uma escrita deixou de acontecer no servidor.

HttpError distingue HTTP/NETWORK/TIMEOUT/ABORT/INVALID_RESPONSE, preservando status
quando recebido e code válido, com mensagem controlada sem expor o corpo/erro do
servidor. JSON bem formado permanece unknown para validação pelo endpoint futuro;
204/205 sem conteúdo retornam undefined, outros sucessos vazios são inválidos.
Opções/caminhos/corpos inválidos falham antes do fetch com TypeError.

Executar pnpm --dir frontend test na raiz. Vitest 5.0.3 é apenas devDependency;
os testes http.spec.ts usam ambiente Node e fetch controlado, sem DOM/banco.
O nome .spec.ts mantém essa suíte fora da descoberta de testes Node da raiz.
Esses testes não homologam cookies/origem ou autenticação no navegador real.

## Leitura de sessão/contexto

api/auth.ts usa GET /api/auth/status e GET /api/auth/me, pelo transporte
oficial. Valida os campos consumidos e projeta user (id/name/login), contexto,
sessionId, permissions, csrfToken e contexts (IDs/nomes de empresa/unidade).
Campos extras são ignorados; obrigatórios ausentes ou inválidos são recusados.
companyId/unitId podem ser null juntos: sessão válida sem contexto selecionado.
Nenhuma empresa/unidade é escolhida automaticamente.

SessionProvider/useSession expõem state, mutation, contextReady, refreshSession(),
login(credentials), logout() e changeContext(pair). O bootstrap consulta
status; setup-required e anonymous não consultam me. Sessão autenticada só é
publicada após me validado. 401 INVALID_SESSION em me produz anonymous sem reusar
snapshot/token anterior; rede, timeout e resposta inválida produzem error.
Os demais estados são loading e authenticated. A tela oferece atualização manual
e tentativa explícita após erro, sem polling ou retry automático.

O carregador pequeno em session/session.ts limpa o snapshot no refresh e combina
geração com abort para descartar respostas tardias e parar no unmount, inclusive
no ciclo de efeitos de desenvolvimento do StrictMode. CSRF/sessionId/contextos
ficam apenas na memória do Provider; permissões não concedem autoridade.
Os testes do carregador rodam em Node; o Provider fino é verificado no navegador
com backend real e banco sintético isolado, sem biblioteca DOM adicional.

## Login/logout

**ATUAL:** POST /api/auth/login envia somente login/password em JSON e o
X-CSRF-Token recebido de status anônimo. O backend valida o cookie pré-login,
cria a sessão e define o cookie HttpOnly; o frontend não lê cookies. A resposta
é validada, mas somente a releitura status/me publica o estado autenticado.
Login não envia role nem escolhe contexto; se o backend devolver os dois IDs
null, a sessão é válida e a tela informa que empresa/unidade não foi selecionada.
Setup continua no legado.

O formulário nativo suporta Enter, labels/autocomplete e bloqueio durante envio.
Senha permanece somente no formulário e no corpo da chamada durante a tentativa,
é apagada ao concluir e nunca entra no estado do Provider ou storage. Erros de
credencial não indicam existência de usuário; CSRF/sessão inválidos, rate limit,
busy, rede e timeout têm mensagens controladas. O backend não fornece Retry-After;
não há countdown ou reenvio automático.

POST /api/auth/logout envia JSON vazio com CSRF da sessão e espera loggedOut:true.
O snapshot autenticado é ocultado imediatamente. 401 INVALID_SESSION permite
convergir pela releitura de status; rede/timeout deixam erro de saída não confirmada
e permitem tentativa explícita, conservando apenas CSRF em memória para revogação.
Atualização manual consulta o servidor novamente; não restaura o snapshot antigo.
Nenhuma limpeza global de storage é feita. Cookies, revogação e RBAC permanecem
responsabilidade do backend.

Mutações são serializadas: duplo envio é ignorado e refresh solicitado durante
uma mutação não inicia uma leitura antecipada ao Set-Cookie. Uma mutação cancela
leituras anteriores; geração/abort descartam resultados tardios, inclusive após
unmount. Não há garantia de cancelamento de escrita já recebida pelo servidor.
Testes Node cobrem contratos, erros e concorrência; validação no navegador usa
backend real com banco sintético em memória, sem dados operacionais.

## Seleção e troca de contexto

**ATUAL:** um select apresenta somente pares completos companyId/unitId de contexts
validado por auth/me, com companyName/unitName como rótulos. Contexto null aguarda
escolha explícita; contexto já escolhido pelo backend é refletido, sem auto-seleção
frontend. Mesmo par confirmado é no-op. POST /api/auth/context envia somente os
dois IDs resolvidos na lista permitida e X-CSRF-Token da sessão atual.

O backend valida vínculo ativo novamente e retorna o snapshot atualizado; par
inválido, cruzado ou null é FORBIDDEN_CONTEXT. CSRF depende da sessão e do par,
portanto muda com a troca. INVALID_SESSION/INVALID_CSRF são erros reais desse
endpoint; CONTEXT_CHANGED e SCOPE_REQUIRED pertencem à conferência de contexto
das consultas comerciais, não são emitidos diretamente por esse POST atual.
O cliente trata esses códigos defensivamente com releitura, sem replay.

Durante a mutação context, o snapshot anterior é retirado e contextReady é false.
Sucesso, rejeição, rede, timeout, 5xx ou resposta inválida levam à consulta status/me
sem repetir o POST. Somente essa leitura publica o novo snapshot completo, incluindo
permissões/lista/CSRF. Se não for possível consultar, o estado é error e não declara
qual contexto está ativo; a atualização manual precisa reconciliar antes de nova
troca. Contexto null também mantém contextReady false para futuras telas comerciais.

Duplo envio e refresh durante troca são bloqueados. Logout pode substituir a troca:
cancela/invalida a geração anterior e recupera o CSRF por leitura antes de revogar,
sem publicar a sessão intermediária. Falha nessa leitura ou na revogação não confirma
saída; abort não comprova cancelamento de escrita no servidor. Respostas tardias não
restauram contexto/permissões. Não existe fila genérica, persistência, contexto de
URL/storage ou sincronização ativa entre abas.

## UI mínima

**ATUAL:** src/ui contém Button (primary/secondary), FormField, Alert (info/error)
e PageShell, usados nas telas de acesso/sessão/contexto. ui.css reúne tokens
semânticos, controles nativos e layout fluido; app.css mantém apenas ajustes da tela.
Sem biblioteca visual, fontes externas, ícones, tema escuro, tabela ou modal.

Button usa type=button por padrão; formulários informam type=submit explicitamente.
FormField recebe htmlFor/label e envolve input/select nativo: o consumidor preserva
ID, ref, autocomplete, disabled e associação do erro via aria-describedby. Alert
anuncia erro como alert e informação como status. UI não importa API/Provider nem
decide autorização. Os testes de semântica renderizam HTML com react-dom/server
existente; teclado, foco, contraste e viewports foram verificados no navegador com
backend e banco sintético. Isso não representa certificação completa de acessibilidade.

**PLANEJADO:** ampliação da UI conforme o piloto e sincronização entre abas.
Produtos, cloud, offline, Agente Local e Desktop Shell não fazem parte desta entrega.

Contrato: [arquitetura frontend V1.3](../docs/atualizacoes/v1.3/V1_3_FRONTEND_ARCHITECTURE.md).
