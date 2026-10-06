# Contrato arquitetural da V1.3 — frontend, desktop e manutenção simples

Referência: 03/10/2026. Fonte principal da arquitetura frontend V1.3. Documento de contrato e planejamento; nenhuma implementação da SPA, Desktop Shell, Agente Local ou offline acompanha esta entrega.

## 1. Estado, decisões e limites

**ATUAL:** Fundação V1.2 encerrada localmente; versão 1.2.0-foundation.1; HEAD de referência da V1.2 e inicial desta finalização 0aa6f19971eabef2cdfb0d2546fe1bc363fd641a; tag v1.2.0-foundation.1 apontando para esse commit; homologação B — condicional, 610/610, vinculada às evidências funcionais existentes; migrations 001–010. O preflight da elaboração original estava limpo. No preflight desta finalização existe somente este Markdown ainda não versionado, com staged vazio; nenhum arquivo da V1.2 está modificado.

**APROVADO COMO DIREÇÃO:** React + TypeScript SPA; Vite como ferramenta pretendida; backend Node.js autoritativo e mantido em JavaScript; monólito modular; migração incremental. Next.js, SSR, Backend-for-Frontend, segunda API e conversão do backend para TypeScript ficam fora desta fase. A expansão da migração depende do piloto: a direção aprovada não elimina a possibilidade de ADJUST ou STOP.

**NOVA DECISÃO APROVADA — CLOUD-AUTHORITATIVE:** o produto final terá backend principal e banco oficial na nuvem. Cloud será a fonte permanente de verdade; computadores clientes não serão servidores principais do ERP. Servidor físico principal no cliente não é a arquitetura padrão; infraestrutura principal local só poderá ser uma exceção futura devidamente justificada. A direção inclui contingência local limitada, com subconjunto operacional preparado enquanto online, fila persistente e sincronização futura. Isso não aprova todos os fluxos offline nem transforma o Agente Local em autoridade independente.

**PLANEJADO, NÃO IMPLEMENTADO:** SPA e Design System V1.3; aplicativo Windows/Desktop Shell; armazenamento operacional de contingência; Agente Local opcional, inclusive possível appliance de unidade; fila/sync e infraestrutura cloud. PostgreSQL continua direção futura. O backend atual permanece Node/SQLite local; o piloto usa essa Fundação, sem implantação cloud ou banco novo. O cliente Windows não recebe implicitamente o backend central inteiro ou uma réplica integral do banco oficial.

**A DEFINIR:** provedor/topologia/infraestrutura cloud; tecnologia do Desktop Shell; transporte/autenticação do contrato local e LAN; dispositivos/protocolos prioritários; matriz de operações offline, permissões/expiração, saldos e dados mínimos; conflitos por operação; retenção local configurável; proteção em disco; versões concretas das dependências e ferramentas de teste.

Nesta finalização editar somente este Markdown, preservando integralmente seus inventários técnicos. Está autorizado um único commit local contendo apenas este arquivo após verificação de coerência. Não modificar documentos da V1.2, código, SQL, testes, configuração, versão ou tag; não instalar dependências, mover arquivos, criar branch, fazer push ou alterar histórico existente. O commit documental não reabre a homologação V1.2 nem autoriza o skeleton.

Papéis permanentes aplicados pelo Codex, sem processos de especialistas executando:

| Papel | Responsabilidade nesta tarefa | Entrega |
| --- | --- | --- |
| Arquitetura | Fronteiras, dependências e evolução incremental | Arquitetura alvo e convivência |
| Produto e domínio | Separar direção aprovada de regras offline ainda desconhecidas | Limites da contingência, retenção e conflitos |
| Backend | Importadores de public e contrato real das APIs | Inventário compartilhado e API do piloto |
| Segurança | Sessão, origem, contexto e limites de confiança | Controles obrigatórios e critérios de parada |
| Frontend/UX | Componentes, estados e acessibilidade | Contrato de Design System e piloto |
| Infraestrutura | Desenvolvimento, build e distribuição futura | Modelo simples de execução/deploy |
| Integrações | Separação de capacidades e adapters futuros | Fronteira do Agente Local/dispositivos |
| QA/Testing | Comportamentos, regressão e gates | Aceite, GO/ADJUST/STOP e rollback |
| Documentação | Fontes, nomenclatura e distinção de estados | Este documento único |

Instruções explícitas do usuário prevalecem. Referências existentes: [AGENTS](../../../AGENTS.md), [mestre](../../atual/PROJECT_MASTER.md), [mapa](../../atual/PROJECT_MAP.md), [arquitetura](../../atual/ARCHITECTURE.md), [API](../../atual/API.md), [segurança](../../atual/SECURITY.md), [Fundação V1.2](../v1.2/FOUNDATION_V1_2_REPORT.md). Documentos antigos não substituem a conferência do código.

## 2. Inventário e riscos do frontend atual

O [Anexo A](#anexo-a--inventário-completo-de-public) classifica individualmente todos os 75 arquivos versionados de public: 73 JavaScript, um HTML e um CSS. São 748.881 bytes, aproximadamente 731,3 KiB de fonte e 2.110 linhas físicas. Todos os 73 scripts aparecem na entrada HTML. A navegação possui 53 identificadores estáticos únicos: 28 básicos, oito atribuições diretas, 12 registros por nextRegister e cinco por Object.assign. Existem aliases/variações; não são 53 módulos completos nem certificação de funcionalidades futuras.

| Arquivo destacado | KiB de fonte | Linhas físicas |
| --- | ---: | ---: |
| purchases-ui.js | 33,27 | 104 |
| foundation-experience.js | 31,11 | 244 |
| workstation-ui.js | 29,73 | 36 |
| store.js | 28,88 | 72 |
| pricing-ui.js | 27,53 | 55 |
| quarantine-ui.js | 27,35 | 23 |

Há funções com mais de cinco mil caracteres em uma linha. A quantidade de linhas não é um indicador suficiente de manutenção. Tamanho de fonte não mede transferência comprimida, memória ou desempenho.

O acervo inclui field/table, formulários, seletores, checkboxes, filtros, paginação, modais, notificações, foco, rascunhos, menus agrupados e contexto/permissões. style.css já possui variáveis e responsividade. Não começar o Design System presumindo ausência de soluções reutilizáveis.

Riscos observados:

- Scripts clássicos e símbolos globais tornam a ordem de carga parte do contrato. startup depende dos anteriores.
- app/render reconstrói o shell e as telas por HTML; experience-ui e outras extensões decoram o DOM depois, inclusive por MutationObserver.
- Contagem textual aproximada: 209 atribuições a innerHTML, 1.305 referências a querySelector/querySelectorAll e 56 aliases de funções anteriores. São sinais de acoplamento; não contagem de defeitos.
- Existem três pontos com fetch e comportamentos parcialmente distintos. Não reproduzi-los como três clientes na SPA.
- Formulários, revisão e modais repetem padrões de marcação/comportamento. Não foi calculado um percentual de duplicação por AST.
- O shell completo ainda pode consumir /api/state; consultas parciais usam DTOs específicos. Paginação de linhas já carregadas no DOM não reduz o payload do backend.
- 24 módulos de public são importados por produção no backend. A pasta visual não é descartável.
- Perfis restritos e consultas modernas já possuem proteções que a SPA deve preservar; refazer apenas a aparência seria insuficiente.

A análise é estática: não constitui nova homologação visual ou benchmark. Exemplos: [app](../../../public/app.js), [navegação](../../../public/navigation.js), [experience-ui](../../../public/experience-ui.js), [commercial-ui](../../../public/commercial-ui.js), [foundation-ui](../../../public/foundation-ui.js).

## 3. Código compartilhado: preservar agora, extrair somente por necessidade

O [Anexo B](#anexo-b--módulos-computacionais-e-consumidores) identifica os 24 módulos com importadores diretos de produção, suas responsabilidades, consumidores browser, importadores backend, dependência de ambiente, risco e estratégia. Quatro outros módulos computacionais são usados pelo browser e por testes Node, sem importador de produção identificado: advanced-analytics, finance, replenishment-core e workstation-core.

A ligação no navegador hoje é por globals; vários módulos usam CommonJS no Node e publicam exports em globalThis no browser. Não presumir que um import ESM direto no Vite funcionará sem adaptação. Também não carregar app/store e seus globais só para acessar um cálculo.

**Recomendação futura:** shared/<dominio>/ para funções computacionais efetivamente usadas nos dois ambientes. Esse nome distingue a biblioteca portátil tanto dos arquivos autoritativos do backend na raiz/foundation quanto da futura camada frontend. Não criar essa pasta nesta tarefa nem extrair módulos para satisfazer uma organização estética.

Regras da eventual extração:

1. Um domínio pequeno por necessidade real; sem shared genérico agregando todo o ERP, sem barrel global obrigatório.
2. Não importar React, DOM, Node HTTP, SQLite, identidade, configuração, secrets ou transporte para shared.
3. Não tornar shared uma segunda implementação das regras do servidor. Prévia reutilizável não concede autorização.
4. Preservar dinheiro em centavos, datas comerciais, inteiros/restrições vigentes e valores históricos. Quantidades fracionadas/UOM continuam futuras.
5. Mapear dependências transitivas e testar resultados antes/depois, incluindo negativos e limites. Mover uma unidade de cada vez.
6. Manter fachada de compatibilidade nos caminhos antigos enquanto existir consumidor; não trocar CommonJS por ESM globalmente.
7. Backend continua JavaScript nesta fase. Uma declaração de tipos/adaptação pequena pode servir ao frontend sem converter a implementação compartilhada.
8. Retirar a fachada só após busca de consumidores, testes relevantes e autorização específica.

O piloto de listagem não precisa de nenhum desses cálculos: recebe um DTO do servidor e usa formatação nativa de apresentação. Uma extração de alto risco não é pré-requisito desse piloto.

## 4. Arquitetura alvo e autoridade

**Produto final planejado: cloud-authoritative.** Backend principal e banco oficial ficam na nuvem; histórico e verdade permanente pertencem ao cloud. Infraestrutura concreta e PostgreSQL não estão implementados ou escolhidos como implantação nesta tarefa.

~~~mermaid
flowchart TD
  subgraph Cloud["CLOUD futuro — fonte permanente de verdade"]
    Backend["Backend Node.js autoritativo"]
    Dados["Banco oficial — PostgreSQL como direção futura"]
    Backend --> Dados
  end
  Web["Web: React SPA / TypeScript / Vite"]
  Shell["Windows futuro: Desktop Shell hospeda a mesma SPA"]
  Local["Agente Local opcional / Appliance de unidade"]
  Operacional["Subconjunto operacional + fila persistente de contingência"]
  Estacoes["Caixas / estoque / estações críticas"]
  Dispositivos["Windows / drivers / dispositivos"]
  Web <-->|Internet / API autorizada| Backend
  Shell <-->|Internet / API autorizada| Backend
  Local <-->|Internet / sincronização controlada| Backend
  Shell <-->|Contrato local controlado| Local
  Estacoes <-->|LAN| Local
  Local --> Operacional
  Local --> Dispositivos
~~~

O desenho mostra capacidades e relações futuras, não determina processos, transportes, microserviços ou a necessidade de um appliance em todo cliente. Cliente de uma estação pode hospedar contingência no próprio app; múltiplas estações críticas podem usar coordenação LAN. Os dois modelos estão detalhados nas seções 16, 18 e 20.

**Implementação atual e piloto imediato:** React futuro → API do Node local existente → domínio/SQLite atuais. Esse ambiente não é a topologia final de produção SaaS e permanece intacto. Servir assets pelo Node, como nas seções 6–7, não obriga instalar um servidor principal em cada cliente final.

Domínio, identidade, RBAC e confirmação oficial ficam no backend principal. shared continua limitado a cálculos portáteis; a contingência segue contratos de domínio aprovados futuramente e não cria regras paralelas. Computador cliente ou appliance não se torna banco principal; instalação principal local só seria exceção futura justificada.

Desktop Shell e Agente Local são responsabilidades arquiteturais; não obrigam programas visualmente separados nem instaladores diferentes. Web poderá acessar capacidades locais por contrato controlado se o ambiente e a segurança futura permitirem; não presumir acesso universal do browser. Cloud-authoritative permite continuidade local limitada, mas não promete todos os recursos sem internet.

## 5. Fronteira React e estrutura recomendada

**Recomendação única de source:** frontend/. public/ continua legado. Vite terá root restrito à nova aplicação; não tratar o public da raiz como publicDir, árvore de entrada ou conjunto de scripts da SPA.

Estrutura conceitual mínima, a criar apenas em implementação autorizada:

~~~text
frontend/
  index.html
  package.json / lockfile e configurações locais da ferramenta
  src/
    app/             entrada, rotas e shell
    api/             cliente HTTP, endpoints e DTOs
    context/         sessão/contexto verificados pelo backend
    design-system/   tokens e componentes reutilizáveis
    pages/
      products/      piloto de consulta
    assets/          somente assets novos realmente necessários
  dist/              saída gerada do build
~~~

Testes de componentes/composição podem ficar ao lado do código; browser/integradores em local próprio quando necessários. Não criar components, utils, services, repositories e hooks genéricos vazios. Um helper só é extraído ao possuir uma responsabilidade clara; uma composição específica de Produtos pode continuar na página.

Dependências permitidas: app compõe páginas/contexto; páginas usam API/Design System; API não importa páginas; Design System não chama APIs comerciais nem conhece tenant; contexto não materializa agregados. Páginas não importam a implementação comercial de outra página. Integração local futura terá adapter próprio, somente quando necessária.

Nenhuma SPA deve importar server.js, foundation, banco, secrets ou configurações privadas. Builds frontend contêm código público.

## 6. Build, produção, cache e fallback

Modelo planejado:

~~~text
frontend/src + entrada HTML
  → verificação de tipos + Vite build
  → frontend/dist/index.html + assets com hash
  → Node existente serve a entrada /ui/ e seus assets
  → mesma API /api/ já existente
~~~

O package da raiz mantém seu papel de backend; ferramentas da interface ficam no frontend, com versões/lockfile reproduzíveis. Scripts de conveniência na raiz só entram em tarefa autorizada. Vite dev/preview não será servidor de produção. Não criar BFF, API espelho ou SSR. [Deploy estático do Vite](https://vite.dev/guide/static-deploy.html).

Contrato de entrega futuro:

- Base pública da SPA: /ui/. Build: frontend/dist. Assets: /ui/assets/<nome-com-hash>.
- / permanece como entrada legada durante a transição; /ui/ abre a SPA. /ui sem barra pode redirecionar para /ui/.
- Node entrega o HTML produzido; não precisa recompor os chunks de produção em templates ou gerar dados de negócio no HTML. Manifest é opcional para uma necessidade real, não obrigação deste modelo.
- HTML de entrada e respostas de API mantêm no-store; cache longo/immutable somente para assets públicos com hash. Dados de usuário/contexto não entram em cache público.
- Atualização publica HTML e assets compatíveis; evitar uma página antiga referenciar arquivo removido durante uma sessão. Estratégia de retenção da geração anterior será verificada na integração.
- Fallback de navegação só para GET de rotas da SPA cadastradas, inicialmente /ui/ e /ui/produtos. Asset inexistente, caminho desconhecido ou /api/* não recebe HTML disfarçado de sucesso.
- Normalizar e conferir caminhos dentro de dist; nunca servir source, node_modules, .qa, data, bancos ou arquivos privados. Não transformar serveStatic em um servidor irrestrito da raiz.
- Produção sem fonte/Vite/HMR; variáveis expostas pelo build são públicas e não podem conter secrets.

O serveStatic atual é uma lista explícita de assets, e o servidor define Cache-Control no-store. A integração futura precisa tratar esses pontos de forma aditiva e limitada. Nenhuma mudança em server.js ocorre agora. “Backend intacto” no piloto significa domínio, API de negócio, identidade, isolamento e persistência preservados; eventual alteração autorizada de entrega de HTML/assets não é uma reescrita do backend.

## 7. Desenvolvimento local sem enfraquecer segurança

**Estratégia recomendada única:** manter a origem do documento no Node. Exemplo de ambiente isolado:

~~~text
Browser abre http://127.0.0.1:3210/ui/
  documento servido pelo Node
  módulos/HMR de desenvolvimento: Vite em 127.0.0.1:5173
  fetch relativo /api/*: Node em 127.0.0.1:3210
~~~

A futura entrada dev integra os módulos e o preâmbulo React Refresh conforme a ferramenta exige. Vite trabalha somente como servidor de ferramentas/assets; são dois processos de desenvolvimento, um único backend de negócio. A integração com HTML servido por backend é documentada pelo Vite. [Integração Vite/backend](https://vite.dev/guide/backend-integration.html).

Condições obrigatórias:

- Porta/host explícitos, loopback e strictPort; não publicar Vite na rede por conveniência.
- CORS de assets Vite permitido somente para a origem Node escolhida; hosts restritos. Não usar cors:true ou allowedHosts:true. Root/permissões de arquivos restringem source da interface; não liberar todo o repositório para /@fs. [Configuração do servidor Vite](https://vite.dev/config/server-options.html).
- Todas as APIs resolvem contra a origem do documento Node, nunca contra import.meta.url ou a porta de assets.
- Cookies HttpOnly, SameSite=Strict e Path=/ atuais são enviados pela origem Node. Não extrair cookie de sessão para JavaScript; não persistir senha/token em armazenamento local.
- POST usa JSON, Origin real da página e X-CSRF-Token correto. Backend mantém checkHost, checkOrigin e validateCsrf.
- X-Company-ID/X-Unit-ID acompanham o contexto esperado nas consultas comerciais; a sessão resolve a autoridade, não esses headers.
- Ambiente e dados de desenvolvimento isolados. Produção jamais ativa a entrada dev por input da requisição. Sem usar o banco da loja para fixtures/testes.

Proxy Vite de /api foi avaliado, mas não escolhido como padrão: mudar Host sem alinhar Origin pode ser rejeitado pelo backend atual; reescrever Origin indiscriminadamente pode ocultar a origem original. Não desativar CSRF, criar CORS amplo ou aceitar qualquer Host. O modelo Node como origem evita essa necessidade. Caso a integração recomendada se mostre excessiva, registrar ADJUST e revisar o contrato antes de adotar outra topologia.

O código atual permite configurar opções de identidade, mas este contrato não amplia nenhuma allowlist. React/Vite não conversam com Node hoje; a estratégia acima ainda precisa ser implementada e validada.

## 8. Coexistência e aposentadoria do legado

**Estratégia única:** entradas/documentos separados, navegação normal entre / e /ui/. Não usar iframe, DOM misturado ou montar React dentro do #app que render legado substitui.

A página React terá sua própria raiz, por exemplo #root, e não carregará os 73 scripts legados nem seus MutationObservers. A página legada não carregará o runtime React. Nenhuma interface manipula DOM da outra. Compartilhar uma mesma sessão HTTP não implica compartilhar globals, objetos de estado ou handlers.

Cada entrada recupera /api/auth/me para o contexto real; nenhuma confia em contexto passado por URL, localStorage ou window do outro documento. Headers esperados e descarte de respostas protegem a troca em outra aba. Durante o piloto, um link explícito permite voltar ao legado, sem replay de comandos ou cópia do estado comercial inteiro.

Critérios para aposentar uma tela/fluxo:

1. Enumerar seu escopo e consumidores, inclusive quick views, links, scanner, atalhos e perfis restritos.
2. Demonstrar equivalência do escopo, permissões, dados, histórico, teclado e estados de falha.
3. Homologar e registrar a entrada nova como padrão do escopo migrado.
4. Retirar a entrada antiga desse escopo após janela de retorno definida na homologação; nomear a tarefa de retirada e responsável antes de expandir.
5. Remover o arquivo antigo apenas se não houver outro comportamento dependente. Cálculos C permanecem ou passam por extração separada.
6. Verificar legado remanescente e atualizar links/testes em tarefa autorizada.

O primeiro piloto cobre a consulta, não a edição inteira de Produtos. Sua aprovação não autoriza apagar store.js, formulários ou detalhes ainda não substituídos. Nenhuma variante deve ser mantida em paralelo indefinidamente sem escopo/prazo de transição explícito.

## 9. Piloto recomendado e escopo de equivalência

**Confirmado pelo código: listagem/consulta de Produtos read-only.** catalog/products consulta commercial_products com COUNT, WHERE por empresa/unidade, ORDER BY, LIMIT/OFFSET e hidratação de filhos dos produtos da página. Não lê unit_states.payload; consulta revision e marcador de normalização.

Comparação das candidatas: Clientes também tem API proporcional, mas Produtos exercita a busca por nome/código/barcode e filtro de atividade solicitado; Vendas envolve dados históricos/executor e variação financeira, aumentando os cenários; Estoque tem permissão e interpretação própria de saldos. Produtos confirma a preferência com risco baixo.

Escopo mínimo: listar preço de venda e identificadores autorizados; busca; situação all/active/inactive; ordenação; tamanho/página; atualizar/limpar filtros; loading/empty/error; acesso negado/sessão expirada; empresa/unidade visíveis; troca de contexto; cancelamento/resposta tardia; acessibilidade; retorno ao legado.

Não incluir criar/editar/ativar, venda, estoque/custo, scanner operacional, grants, impressão ou offline. Não carregar /api/state. Detalhe read-only pode ser outro passo; não é necessário para provar o primeiro piloto. A equivalência de aceite é da consulta delimitada, incluindo perfis com apenas catalog.view, não de todo o cadastro legado.

## 10. API real do piloto

Fontes: [commercial-read](../../../foundation/commercial-read.js), [commercial-store](../../../foundation/commercial-store.js), [request-context](../../../foundation/request-context.js), [identity](../../../foundation/identity.js), [commercial-ui](../../../public/commercial-ui.js), [testes de leitura](../../../foundation/commercial-read.test.js) e [testes de cadastro/detalhe](../../../foundation/commercial-registration-http.test.js).

### 10.1 Listagem obrigatória

**GET /api/commercial/catalog**. /api/commercial/products é alias atual; escolher catalog como URL única do piloto, sem manter dois caminhos no API client.

| Query | Contrato real |
| --- | --- |
| page | Inteiro textual positivo, default 1, máximo 1.000.000 |
| pageSize | Inteiro textual positivo, default 50, máximo 100 |
| q | Texto de até 120 caracteres; default vazio; busca parcial normalizada por nome/código/barcode do produto |
| status | all (default), active ou inactive |
| sort | name (default), date, code ou id |
| direction | asc (default) ou desc |

Query desconhecida/repetida, enum ou número inválido retorna 422 INVALID_QUERY. Página além do total não é ajustada automaticamente pelo backend: pode voltar items vazio com page solicitado. UI não deve inventar erro; ao alterar filtros volta à primeira página. Empate de ordenação usa id ascendente. Campo date ordena data do cadastro, embora não seja exposto no DTO da lista.

Resposta 200: objeto com items, page, pageSize, total, totalPages e revision. totalPages pode ser zero; apresentar vazio com navegação desabilitada, sem fabricar uma página existente.

Projeção catalogProduct permite campos escalares id, name, code, barcode, category, description, priceCents, version, active, unit e measureUnit; aliases com id/code/barcode/active; packages com id/name/code/barcode/factor/units/quantity/active. A presença de campos opcionais depende do registro; o cliente preserva ausente/null quando permitido em vez de presumir valores. DTO não é o produto interno completo.

Permissão: **catalog.view**, sem exigir financial.view, inventory.view ou catalog.manage. Contexto: sessão autenticada, vínculo ativo e companyId/unitId da sessão; WHERE SQL inclui ambos. X-Company-ID e X-Unit-ID indicam contexto esperado e devem ser enviados. Não acrescentar tenant/company/unit à query do catálogo.

Campos não expostos na listagem: custo/custo de compra/preço mínimo financeiro, estoque/minStock, payload, histórico completo ou secrets. priceCents é preço de venda autorizado pelo catálogo, não custo. A SPA não chama product-costs para complementar o piloto.

### 10.2 Sessão/contexto necessários e endpoints adjacentes

| Método/URL existente | Uso e resposta relevante |
| --- | --- |
| GET /api/auth/status | needsSetup, authenticated, csrfToken; prepara CSRF pré-login quando necessário |
| GET /api/auth/me | user, companyId, unitId, sessionId, permissions, csrfToken e contexts permitidos |
| POST /api/auth/login | login/password, CSRF pré-login e cookie; retorna contexto e define sessão |
| POST /api/auth/context | companyId/unitId permitidos, sessão/CSRF; retorna contexto atualizado |
| POST /api/auth/logout | sessão/CSRF; revoga e retorna loggedOut |
| GET /api/health | ready/local/version atuais, para diagnóstico; não autoriza contexto ou operação |
| GET /api/commercial/products/by-id?id=... | Adjacente, não obrigatório no piloto mínimo: record projetado; minStock só se houver inventory.view |
| GET /api/commercial/products/lookup?code=... | Adjacente, fora do piloto: busca exata com alias/embalagem ativos; product e eventual packageUnits |

A SPA poderá usar o login existente no servidor sem duplicar credenciais/identidade; implementação do fluxo de entrada é etapa própria. Se status indicar needsSetup, orientar para a configuração legada; não recriar bootstrap administrativo no piloto. CSRF/contexto são dados transitórios em memória; não registrar respostas de autenticação em logs. Os POST de autenticação/contexto não tornam o piloto uma tela de escrita comercial.

Erros reais relevantes:

| HTTP / code | Tratamento futuro |
| --- | --- |
| 401 INVALID_SESSION | Limpar dados/contexto e pedir entrada; sem replay |
| 401 INVALID_CREDENTIALS | Erro de login, sem tratar como consulta vazia |
| 403 FORBIDDEN | Sem catalog.view; estado de acesso negado, sem dados anteriores |
| 403 SCOPE_REQUIRED / FORBIDDEN_CONTEXT | Selecionar contexto válido ou informar indisponibilidade |
| 409 CONTEXT_CHANGED | Invalidar, atualizar contexto e consultar de novo somente sob geração nova |
| 422 INVALID_QUERY | Preservar filtros, indicar erro; corrigir entrada antes de repetir |
| 503 NORMALIZATION_REQUIRED / 500 COMMERCIAL_DIVERGENCE | Indisponibilidade operacional; não cair em /api/state nem reimportar |
| 403 INVALID_HOST / INVALID_ORIGIN / INVALID_CSRF | Falha de integração/acesso, sem enfraquecer verificação |
| 404 NOT_FOUND / 409 AMBIGUOUS_CODE | Somente nos endpoints adjacentes de registro/código |
| 429 AUTH_RATE_LIMIT / AUTH_BUSY | Informar espera no login, sem loop de tentativas |
| 500 INTERNAL_ERROR ou falha de rede/timeout | Erro visível, filtros mantidos, tentativa explícita |

Backend normalmente responde erros em JSON {error, code}; cliente também trata corpo inválido/não JSON sem publicar conteúdo bruto. O piloto não introduz correlação que o backend ainda não fornece.

**Limitações registradas, sem correção:** busca textual da lista não pesquisa aliases/packages, categoria ou marca; não há filtros individuais de categoria/marca; não há endpoint só de projeção de colunas; filhos aliases/packages podem ampliar payload por produto; não há envelope de correlação uniforme nas respostas atuais. As limitações não impedem a consulta proposta. Evoluções de API são tarefas separadas.

## 11. Modelo de estado e troca de contexto

| Tipo | Dono e exemplos | Regra |
| --- | --- | --- |
| Local | Página/componente: filtros recolhidos, seleção, aba/modal | Perto de quem usa, sem registro global |
| Formulário | Componente do formulário: valores/erros em edição | Fora do piloto de escrita; não misturar com DTO do servidor |
| Contexto | Provider pequeno: usuário, sessão, empresa, unidade, permissões/CSRF | Recuperado do backend, sem agregados comerciais |
| Servidor | Resultado paginado da consulta e seu ciclo loading/erro | Identificado por contexto + query; não duplicar em contexto |

Proibido reconstruir um objeto global com todos os produtos/clientes/vendas/caixa/financeiro. /api/state não entra na SPA quando há endpoint específico. No piloto, basta o resultado da página atual; não criar cache persistente ou cache de todas as páginas.

Contrato obrigatório de contexto:

1. Ao iniciar mudança/logout/expiração, suspender novas consultas, incrementar geração e cancelar requests/timers.
2. Limpar imediatamente resultados, seleção/detalhe e dados incompatíveis; não exibir unidade nova com linhas da antiga.
3. Confirmar mudança pelo backend; receber/recuperar /api/auth/me com novos direitos e CSRF.
4. Recomeçar a consulta sob chave composta de usuário/sessionId/companyId/unitId, geração e query.
5. Antes de publicar sucesso, erro ou finally de qualquer request, conferir geração/contexto e montagem. AbortController sozinho não basta.
6. Se outra aba mudar contexto, headers esperados fazem a consulta comercial receber CONTEXT_CHANGED; invalidar e recuperar. /auth/me não depende desses headers, portanto suas respostas também precisam de proteção de geração.
7. Não repetir comandos automaticamente. Futuras edições incompatíveis exigem política de rascunho explícita.

O contrato não promete detecção instantânea de troca em outra aba antes de comunicação com o servidor. A UI identifica claramente o contexto dos dados exibidos; uma futura notificação entre abas é melhoria separada, não substitui a conferência backend.

## 12. Dependências mínimas

“Necessário agora” significa necessário ao plano da próxima implementação/piloto, não instalado nesta tarefa.

| Categoria | Classificação | Decisão |
| --- | --- | --- |
| react / react-dom | NECESSÁRIO AGORA | Runtime de interface escolhido |
| typescript / vite | NECESSÁRIO AGORA | Ferramentas de desenvolvimento/build |
| Plugin React do Vite e tipos React/DOM | NECESSÁRIO AGORA | Tooling específico da integração, sem camada de negócio |
| Roteamento | NECESSÁRIO AGORA | React Router em modo declarativo/client; não criar roteador interno |
| Estado local/contexto | NECESSÁRIO AGORA | APIs React suficientes, nenhuma biblioteca global |
| Cliente HTTP | NECESSÁRIO AGORA | fetch, URLSearchParams, AbortController e módulo pequeno |
| CSS/tokens | NECESSÁRIO AGORA | CSS simples do Design System, sem framework CSS obrigatório |
| Testes de componente/integração/browser | NECESSÁRIO AGORA como capacidade antes de homologar | Escolher ferramentas mínimas em tarefa própria, sem presumir pacote instalado |
| Biblioteca de cache/query | PODE ESPERAR | Pilotar uma consulta sem TanStack Query; reconsiderar se políticas repetidas justificarem |
| Biblioteca de formulário/tabela/virtualização | PODE ESPERAR | HTML semântico/paginações suficientes; exigir necessidade demonstrada |
| Redux / Zustand / MobX | NÃO JUSTIFICADO ATUALMENTE | Não existe necessidade de store comercial global |
| Axios | NÃO JUSTIFICADO ATUALMENTE | fetch cobre o contrato atual |
| Tailwind / Material UI / Ant Design / shadcn | NÃO JUSTIFICADO ATUALMENTE | Não assumidos pelo Design System |
| Schema/validação runtime genérica | PODE ESPERAR | Validar os DTOs necessários com funções pequenas; avaliar biblioteca se a escala justificar |
| PWA/service worker/offline | PODE ESPERAR | Depende de regras operacionais |
| Framework desktop/drivers/protocolos | PODE ESPERAR | Decisão e homologação próprias |

Modo declarativo do roteador não exige servidor de rotas ou BFF. [React Router](https://reactrouter.com/start/declarative/installation). Evitar dependências “para talvez usar”; versões/compatibilidade com Node declarado serão conferidas na implementação autorizada.

## 13. Um cliente HTTP pequeno

frontend/src/api terá um único transporte, acompanhado de funções explícitas por endpoint; nenhuma tela possui um fetch concorrente com regras próprias.

Contrato futuro do transporte:

- Base same-origin /api, caminhos controlados; não aceitar destino arbitrário vindo de query/usuário.
- credentials same-origin, método e JSON consistentes; GET sem body.
- CSRF transitório para mutações; não substituir autenticação por token inventado.
- Capturar contexto esperado no início e enviar headers comerciais; não usar “contexto atual” no final para legitimar resposta antiga.
- Receber AbortSignal do chamador e prazo finito; distinguir cancelamento de timeout. O legado comercial usa 15 s, referência inicial a verificar, não SLA.
- Parsear JSON a partir de unknown; validar envelope/DTO necessário antes de disponibilizar. Status HTTP, code e mensagem normalizados.
- 401/CONTEXT_CHANGED acionam o ciclo central de invalidação; demais erros continuam específicos da tela.
- Não logar body/cookie/senha/CSRF/dados comerciais por padrão.
- Sem retry automático, especialmente de comandos; repetir consulta por ação explícita.
- Sem DSL, registro mágico de entidades, gerador universal de CRUD, store ou framework interno.

Abort e timeout não significam que uma futura escrita deixou de acontecer no servidor. Comandos comerciais posteriores preservarão requestId/concorrência e recuperação conforme contratos existentes, não por regras inventadas no cliente.

## 14. Design System e complexidade visual

Objetivo: muita funcionalidade sem exigir que o usuário veja todas as opções simultaneamente. Não definir a estética final nesta tarefa; respeitar paleta verde adotada como origem, com revisão de contraste antes de fixar tokens.

| Camada | Contrato |
| --- | --- |
| Tokens | Cores semânticas, espaçamento, tipografia, radius, sombras, dimensões, z-index e breakpoints |
| Primitivos | Button, Input, Select, Checkbox, DateInput, Badge, Tooltip |
| Composições | FormField, Modal, Drawer, Dropdown, ActionMenu, Tabs |
| Padrões | PageHeader, FilterBar, Table, Pagination, Alert, Toast, Loading, EmptyState, ErrorState |

Criar somente o subconjunto exigido pelo piloto, sem fabricar 24 componentes vazios. Permission-aware actions utilizam o contexto verificado apenas para UX; Design System não decide RBAC comercial.

Princípios obrigatórios:

- Filtros compactos/recolhíveis com resumo dos filtros ativos e ação clara de limpar.
- Hierarquia forte, menos caixas/bordas e menos explicações permanentes.
- Tooltip acessível para ajuda não crítica; erro, restrição e informação necessária à decisão continuam visíveis.
- Status por texto/badge, nunca apenas por cor.
- Ações secundárias em menu; ação principal reconhecível e operável por teclado.
- Linhas e paginação compactas sem eliminar labels, foco ou alvos adequados à operação.
- Tabela sem carregar todos os registros; seleção de linhas não implica seleção de páginas não consultadas.
- Layout web administrativo e operação desktop podem ter densidades diferentes usando os mesmos componentes.

Reusar intenções e comportamentos comprovados do legado; não copiar automaticamente todas as marcações, globais e correções por observer.

## 15. Acessibilidade desde o primeiro componente

Critérios de comportamento: semântica HTML, labels associados, teclado, ordem e foco visíveis, nomes acessíveis, contraste verificável, mensagens de erro vinculadas, status de loading compreensível e estados disabled corretos.

Escape fecha sobreposição quando permitido; modal mantém foco dentro e devolve foco ao acionador. Preferir dialog/elementos nativos quando suficientes, validando o comportamento no ambiente alvo. Menu/tooltip funcionam por teclado e foco, não apenas hover. Atualizar tabela/filtros não deve perder foco da pessoa que digita.

Usar aria quando necessário, sem substituir semântica disponível. Loading pode usar aria-busy/status; anúncios não devem repetir cada tecla. Não tornar contraste ou navegação por teclado dívida “para depois”. Meta inicial: fluxo do piloto completo por teclado e verificações pertinentes de contraste, foco e nomes; isso não declara certificação global de acessibilidade.

## 16. Windows e PDV: experiência de aplicativo

**PLANEJADO:** ligar Windows → Sistema Comercial iniciar → autenticar/retomar conforme política futura → abrir ERP/PDV sem navegador manual nem barra de endereço. Inicialização automática não significa login automático, bypass de sessão ou acesso sem direito.

Separar perfis de experiência futuros:

| Estação | Experiência planejada | Limite |
| --- | --- | --- |
| Administrativa | Janela normal, navegação ampla; minimizar/fechar conforme política | Não confundir operação de janela com autorização comercial |
| Operacional | Inicialização automática, tela cheia, fluxo dedicado e saída controlada | Política kiosk/desktop usa mecanismos apropriados do Windows |

A SPA não bloqueia Windows por JavaScript nem promete impedir Alt+Tab ou acesso do administrador. Shell/instalação/política do sistema operacional cuidarão desses aspectos em tarefa própria.

Compartilhar o source React entre web e shell; capacidades ausentes devem ter estado claro na UX. Não importar bibliotecas nativas para as páginas ou assumir que window contém uma bridge confiável por existir.

**Cliente pequeno / uma estação, modelo futuro:** Sistema Comercial Windows hospeda React SPA e armazenamento operacional local de contingência. Enquanto online, recebe do cloud o subconjunto necessário, de forma sincronizada: produtos/preços pertinentes, configuração da unidade, contexto e saldos/dados exigidos somente pelos fluxos que vierem a ser aprovados. Durante indisponibilidade de internet usa os dados já preparados e registra operações autorizadas na fila persistente local.

Não depender de começar a baixar dados depois da queda. O armazenamento não é réplica integral: histórico completo, anexos, relatórios e todo Financeiro não são copiados automaticamente. Cloud mantém banco/histórico oficiais. Armazenamento, filas e regras futuras não são escolhidos pelo Desktop Shell, cuja tecnologia continua A DEFINIR.

Em cliente com várias estações críticas, o mesmo app poderá usar a contingência coordenada pelo Agente Local da unidade via LAN, como na seção 18. Compartilhar a base arquitetural de armazenamento/fila/sync/diagnóstico entre modo integrado ao app e modo appliance; não criar duas implementações offline independentes. Esse objetivo não autoriza abstrações ou código agora.

## 17. Desktop Shell futuro

Tecnologia **A DEFINIR**; Electron, Tauri, WebView2 e outras alternativas não foram escolhidos.

React SPA permanece independente do shell. Contingência offline e appliance não são motivos para escolher prematuramente uma tecnologia desktop; empacotamento e capacidades serão comparados em tarefa própria.

A comparação futura deve usar o mesmo fluxo e hardware representativos: RAM/inicialização, tamanho instalado, compatibilidade Windows/WebView, atualização/rollback, assinatura de código, segurança/sandbox, impressão, bridge/Agente Local, instalação/auto-start, debugging/diagnóstico, manutenção, offline e familiaridade da equipe.

Também verificar ciclo de suporte do runtime, distribuição corporativa e permissões realmente necessárias. Não atribuir vencedor por tamanho ou popularidade sem protótipo comparável. O shell é hospedeiro e integração de capacidades; não uma segunda fonte de regras comerciais.

## 18. Agente Local: separação de responsabilidade

Este contrato adota **Agente Local** para a capacidade futura chamada Edge nos documentos históricos. Não alterar agora os documentos da V1.2. A mudança de termo não representa implementação.

**Definição atualizada, PLANEJADA:** capacidade local opcional que poderá concentrar dispositivos, impressão, filas, armazenamento operacional de contingência, sincronização cloud, coordenação LAN entre estações e diagnóstico local. Pode fazer parte do mesmo instalador/app ou rodar em equipamento dedicado; não precisa aparecer como programa separado ao cliente.

Fluxos futuros: React/Desktop Shell → contrato local controlado → Agente Local → Windows/driver/dispositivo; e Cloud ↔ Agente Local/Appliance ↔ LAN ↔ caixas/estoque/estações. Se internet cair mas a LAN e o agente estiverem disponíveis, estações poderão continuar os fluxos de contingência aprovados usando a base operacional coordenada da unidade.

### Múltiplas estações críticas

Computadores independentes não devem cada um virar uma verdade offline isolada. Exemplo de risco: dois caixas acreditam possuir a última unidade durante a queda. O appliance/agente poderá coordenar banco operacional da unidade, fila, sincronização, estado entre estações, dispositivos, impressão e diagnóstico. Coordenação não aprova estoque negativo, prioridade de caixa ou qualquer regra de resolução; conectividade LAN, indisponibilidade do agente e concorrência exigirão contratos específicos.

**Appliance não obrigatório:** necessidade depende de múltiplas estações operacionais críticas, offline coordenado, dispositivos/impressoras centralizados, continuidade exigida e infraestrutura necessária. Não usar a regra “dois computadores = mini servidor”. Muitos computadores administrativos podem dispensá-lo; poucos computadores com vários dispositivos podem necessitar dele.

### Mini PC / appliance opcional

Quando justificado, o Agente Local poderá rodar em mini PC entregue/configurado pela empresa do Sistema Comercial: ligado à rede, preferencialmente Ethernet em operação crítica, sem monitor, pré-configurado, registrado no cloud, com atualização controlada e diagnóstico remoto futuro.

Isso é contingência + LAN + dispositivos + sync, não banco oficial ou servidor principal do ERP. O Agente Local não é segundo backend comercial autoritativo, fonte independente de RBAC ou servidor central permanente da empresa. Cloud permanece autoridade inclusive quando existem operações locais ainda não confirmadas. Modelo, sistema operacional, hardware, instalação e gerenciamento remoto continuam A DEFINIR.

Componentes conceituais de armazenamento operacional, fila, sync e diagnóstico devem poder ser reutilizados no app de uma estação e no appliance, preservando os mesmos contratos. Não criar código, camadas ou serviços para isso agora.

Requisitos a detalhar antes de implementar: origem/cliente autorizado, identidade/revogação do dispositivo, capacidades permitidas, empresa/unidade, validação de entrada, correlação, deduplicação adequada, limites, recuperação e diagnóstico. Sem USB/serial arbitrário da SPA, shell remoto, execução livre, caminhos/destinos de rede livres ou segredos de canais no executável. Transportes e protocolos continuam A DEFINIR.

O scanner que atua como teclado é suporte atual de browser; não deve ser descrito como driver do Agente Local já existente.

## 19. Impressão

Prioridade futura: driver/spooler Windows quando suficiente. Adapters ESC/POS, ZPL, EPL, CPCL, TSPL ou outros só entram por equipamento/fluxo comprovado.

Print job → Agente Local → fila → spooler/driver/protocolo → destino. Responsabilidade lógica não obriga um novo serviço distribuído.

Impressão é efeito após confirmação comercial: falha de hardware não repete nem desfaz venda. Aceitação do spooler não prova saída física; timeout pode ter resultado desconhecido. Reimpressão não cria novo efeito financeiro/estoque e deve preservar documento histórico e autorização conforme contrato futuro.

Não implementar print job/protocolo/fila nem emitir fiscal. A impressão atual do browser continua legado; emissão fiscal e representação impressa são responsabilidades distintas. Fontes futuras existentes: [Printing & Devices](../../atual/PRINTING_AND_DEVICES.md).

## 20. Offline

**Direção aprovada:** cloud-authoritative com contingência local limitada. Internet indisponível não deve significar automaticamente parada de toda a empresa; o escopo de continuidade dependerá dos fluxos aprovados futuramente. Nada de offline, banco operacional, fila ou sync será implementado no skeleton/piloto React.

### Dados preparados antes da queda

Enquanto online: Cloud → sincronização → armazenamento operacional local. Durante queda: armazenamento já existente → fluxos de contingência autorizados. Após retorno: fila persistente → sincronizador → cloud valida/processa → confirmação explícita.

LOCAL = subconjunto operacional necessário; CLOUD = banco/histórico oficiais. Cobertura, atualização/frescura, disponibilidade e dados mínimos serão definidos por operação. Não presumir réplica de toda empresa nem criar dados locais somente após ficar sem internet. Catálogo/cache não concede permissão e não garante preço/estoque atualizados.

### Fila persistente e confirmação

Operações offline autorizadas entram em fila persistente local. Exemplo somente conceitual, sem aprovar venda offline: venda local → operação pendente → retorno da internet → envio → cloud valida/processa → cloud confirma → operação local SINCRONIZADA.

**Regra inegociável:** operação sem confirmação inequívoca do cloud nunca é apagada automaticamente por retenção. Envio, timeout, passagem de tempo, aceite de transporte ou reinício não são confirmação. A condição pendente só termina por confirmação do servidor ou tratamento explícito e rastreável de conflito/erro; este último não pode marcar como SINCRONIZADA uma operação que o cloud não confirmou. Procedimentos de tratamento/encerramento ainda são A DEFINIR, sem descarte silencioso.

Sync deverá suportar IDs estáveis, idempotência, reenvio seguro, confirmação explícita, crash/restart e mensagens duplicadas. Reenvio não pode duplicar efeito comercial; a validação oficial pertence ao cloud. Armazenamento, protocolo, atomicidade da fila/efeitos e recuperação serão especificados antes da implementação. O cliente HTTP online do piloto continua sem retry automático: sync será um contrato futuro específico, não repetição genérica de fetch.

### Retenção local configurável / A DEFINIR

| Categoria | Política arquitetural |
| --- | --- |
| PENDENTE DE SYNC | Nunca apagar automaticamente por retenção; preservar até confirmação ou tratamento explícito de conflito/erro |
| SINCRONIZADO | Pode ter retenção local limitada/configurável; janela e critérios ainda A DEFINIR |
| CACHE/CATÁLOGO OPERACIONAL | Manter enquanto necessário à contingência e atualizar a partir do cloud; política distinta da fila |
| LOG/DIAGNÓSTICO | Política própria, com minimização/proteção de dados, ainda A DEFINIR |

Uma janela de 30 dias foi apenas exemplo discutido, não regra aprovada, default ou prazo mínimo/máximo. Retenção operacional não se confunde com retenção dos backups atuais. Perda de internet prolongada ou pressão de disco não autoriza limpeza automática de pendências; capacidade e resposta a falhas precisam ser especificadas.

### Matriz de operações e conflitos — A DEFINIR

Tarefa comercial própria classificará cada operação: PODE OFFLINE, LIMITADO OFFLINE ou EXIGE CLOUD. Venda, catálogo, caixa operacional e impressão são apenas exemplos de candidatos; administração crítica, usuários, permissões, configurações sensíveis e determinadas operações financeiras são exemplos de possíveis restrições. Nenhum desses exemplos está aprovado como regra funcional.

Conflitos pertencem ao domínio por tipo de operação. Não escolher last-write-wins, merge automático, estoque negativo, prioridade de estação, resolução por horário ou solução genérica. Sincronizador não resolve silenciosamente todos os conflitos da mesma maneira. Também não presumir que uma LAN elimina todos os conflitos ou permite continuidade quando o próprio agente fica indisponível.

A arquitetura continua permitindo service workers/IndexedDB e armazenamento no app ou agente, sem selecionar tecnologia de banco local. IndexedDB não substitui backup operacional. [Planejamento offline existente](../../atual/OFFLINE_EDGE.md) é referência histórica compatível apenas nos pontos não alterados pela direção aprovada neste contrato.

## 21. Segurança: contrato inegociável

React é interface. Backend decide login/sessão/CSRF/tenant/unidade/RBAC/grants/descontos/estoque/preço/vendas/financeiro/auditoria, com deny-by-default.

No produto final, essa autoridade é do backend principal cloud. Contingência seguirá escopo, direitos e expiração aprovados por contratos futuros; dispositivo/agente não cria RBAC independente ou autorizações irrestritas porque ficou sem internet. Confirmação oficial e validação de sincronização pertencem ao cloud.

Não mover secrets, senha de autorizador, regras de concessão ou autoridade para props/contexto/localStorage. Um DTO parcial não pode ser completado buscando /api/state. Esconder botão e tipar um permission code são UX, não autorização.

Autorização excepcional futura preservará senha real, direito, motivo, grant temporário, consumo atômico e executor/autorizador auditados. Nada disso é recriado pelo piloto.

Não adicionar nova identidade no frontend/Agente/Next. Integração que só funciona após desativar controles é STOP. Segurança local não é homologação cloud, pentest ou resistência ao administrador da máquina.

**Requisitos futuros de proteção local:** isolamento por empresa/unidade, dados mínimos, proteção em disco, identidade e revogação do dispositivo, expiração/autorização offline, ausência de senha/token permanente em claro e limpeza segura quando aplicável. Criptografia, DPAPI, TPM e gestão de chaves não são escolhidos aqui. Revogação durante desconexão e prazo de validade offline exigem regra específica; não prometer revogação instantânea sem comunicação.

Limpeza segura não pode contornar a preservação de operações ainda não confirmadas: conflitos entre retirada de dados/dispositivo, retenção, revogação e pendências precisam de tratamento explícito antes da implementação. Não implementar mecanismo de segurança local nesta etapa documental.

## 22. Política TypeScript

Source novo strict, props/DTOs explícitos e null/ausência tratados conscientemente. Evitar any; usar unknown nas fronteiras e validação pequena do que a tela efetivamente usa. Exceção de tipo deve ter motivo e plano de retirada, sem casts que apenas escondem erro.

Separar DTO HTTP de modelo de apresentação: preço em centavos chega como dado, formatação monetária é apresentação. Estado discriminado idle/loading/success/empty/error pode evitar combinações contraditórias; não criar hierarquia de tipos por antecipação.

Tipos não validam runtime nem concedem permissões. Vite faz transformação; a verificação de tipos deve ser um passo separado e obrigatório de build/CI futura. [Strict TypeScript](https://www.typescriptlang.org/tsconfig/strict.html), [TypeScript no Vite](https://vite.dev/guide/features.html).

Backend e módulos compartilhados atuais continuam JavaScript. Contratos locais de tipos não justificam reescrever implementações ou aceitar DTO por simples assertion.

## 23. Estratégia mínima de testes

| Nível | Cobertura do piloto |
| --- | --- |
| Componente | Teclado/foco, label, disabled/loading, filtros/paginação e feedback observável |
| Integração | Cliente HTTP, parse/erros, provider de contexto, cancelamento/timeout e resposta tardia |
| Browser | Login/contexto real, perfil restrito, busca/página, troca A/B, outra aba, expiração e navegação legado/SPA |
| Backend existente | Suíte própria preservada; testes relevantes de API/segurança e entrega de assets quando houver integração |

Fixtures isoladas; nunca usar o banco da loja. Componentes testados pelo comportamento, não por hooks privados ou snapshots enormes. Mock sozinho não prova cookie/Origin/Host/CSRF nem SQL: browser/API real usa servidor de teste isolado.

Testes existentes de frontend incluem VM/fake DOM, inspeção textual e entrega/ordem de scripts. Preservar cobertura do legado enquanto ativo; adaptar a intenção para testes React no escopo migrado, sem apagar evidência por conveniência.

Para provar paginação proporcional, usar evidências/testes SQL do backend e registrar requests do piloto: endpoint específico, parâmetros e nenhuma chamada a /api/state. Cancelamento de rede e descarte de resposta são dois cenários diferentes.

Esta tarefa documental não executa os 610 testes nem declara novos testes frontend aprovados. A homologação V1.2 continua a existente.

## 24. Orçamentos de complexidade

Indicadores são gatilhos de revisão, sem teto arbitrário de linhas/componentes/dependências.

| Sinal | Classificação | Ação antes de prosseguir |
| --- | --- | --- |
| Crescimento de bundle/RAM/carregamento sem causa clara | OBSERVAR | Registrar baseline e identificar dados/código retidos |
| Dependência grande com pouco uso | OBSERVAR | Justificar custo ou preferir recurso nativo |
| Componente reúne transporte, contexto, formulário e layout | REFATORAR ANTES DE EXPANDIR | Separar responsabilidades reais, sem novas camadas genéricas |
| Dependência circular ou página importando regras de outra | REFATORAR ANTES DE EXPANDIR | Rever fronteira pelo grafo e contrato |
| API client ou Design System duplicado | REFATORAR ANTES DE EXPANDIR | Consolidar contrato antes de nova tela |
| Estado global acumulando agregados/cache sem limites | REFATORAR ANTES DE EXPANDIR | Tornar dados locais/paginados e descartar o excedente |
| Listagem baixa catálogo inteiro ou usa /api/state | BLOQUEAR NOVA EXPANSÃO | Corrigir contrato específico antes de migrar outras áreas |
| Contextos misturados, resposta antiga publicada ou controle de segurança relaxado | BLOQUEAR NOVA EXPANSÃO | Interromper piloto, corrigir e revalidar |
| Legado/observer interfere em árvore React | BLOQUEAR NOVA EXPANSÃO | Isolar entradas e verificar regressão |
| Memória crescente repetível após ciclos, travamento ou desempenho operacional ruim | BLOQUEAR NOVA EXPANSÃO | Investigar com evidência; não concluir leak só por RSS elevado |

Um alerta observar sobe de classe se causar perda de integridade, regressão ou custo desproporcional. Bundle, latência e memória serão medidos no piloto real: mesmo hardware, dataset, consultas e condições para legado/React; registrar primeiro acesso, navegação, digitação, páginas e ciclos de contexto. Não prometer ganhos nem inventar limites sem baseline. Os critérios operacionais mensuráveis serão acordados antes de homologar; “parece rápido” não basta.

## 25. Suporte e diagnóstico futuro

Arquitetura deve permitir versão visível, health/status, logs estruturados, erros com correlação, backup, sync, Agente Local, impressoras/jobs e diagnóstico exportável, sem exigir abrir banco ou código para problemas comuns.

**ATUAL:** /api/health informa versão/local/ready; backup e retenção existem, com seus limites V1.2. **PLANEJADO:** apresentação consolidada e novos contratos de status/correlação/agente/sync/jobs. Não chamar um dado ausente de status operacional disponível.

Contingência futura deverá distinguir cloud disponível, última atualização do subconjunto operacional, pendências sem confirmação, conflitos/erros tratados, LAN/agente/dispositivo indisponíveis e operações confirmadas. Diagnóstico do appliance e atualização controlada/remota são capacidades futuras, sem acesso remoto genérico ou infraestrutura implementada nesta tarefa. Uma resposta local bem-sucedida não significa confirmação oficial do cloud.

Diagnóstico deve minimizar/redigir dados, excluir senhas/cookies/CSRF/secrets e permitir distinguir frontend/backend/dispositivo/conectividade. “Agente indisponível” não é “venda não gravada”. Pacote exportável não será um dump livre do banco.

## 26. Critérios de GO / ADJUST / STOP

**GO** somente após evidência de todos estes pontos:

- Equivalência da consulta delimitada, backend de negócio/persistência intactos, sem migration ou regra nova.
- Sessão real/CSRF/origem mantidos; usuário sem direito recusado; empresas/unidades isoladas; nenhum dado antigo reaparece após troca/expiração.
- API específica e paginação SQL; busca/situação/ordem/tamanho corretos; nenhuma consulta ao estado completo.
- Cancelamento, timeout, corpo inválido, erro/empty e resposta tardia tratados.
- Design System mínimo coerente e acessibilidade do fluxo por teclado/foco/labels/contraste.
- Build reproduzível com verificação de tipos; Node entrega produção sem Vite; deep link/asset faltante corretamente tratados.
- Código compreensível, um cliente HTTP, dependências justificadas e convivência sem interferência.
- Desempenho/memória aceitáveis no hardware/dados representativos, segundo baseline e critérios definidos antes da homologação.
- Plano de aposentadoria do escopo antigo e rollback exercitado sem mudança de dados.
- Nenhuma falha material pendente; resultado/restrições registrados. GO não significa migrar todas as telas automaticamente: próxima tarefa depende de autorização.

**ADJUST:** direção viável, mas há fricção limitada de build, UX, DTO, tests/tooling ou organização. Ajustar o piloto e repetir somente verificações afetadas antes de ampliar.

**STOP / REVER:** exige enfraquecer segurança, mistura de contextos, regressão relevante do legado, build/execução desproporcionais, dependências sem benefício, manutenção pior que equivalente legado, performance operacional inadequada ou extração compartilhada de alto risco como pré-requisito inesperado. Desativar entrada piloto, manter legado e revisar direção; não usar aprovação anterior de React como razão para ignorar evidência negativa.

## 27. Rollback do piloto

Tela legada disponível durante avaliação. Rollback significa retirar/desativar a entrada /ui/ do piloto e retornar a navegação ao legado, conservando backend/API/dados.

Sem downgrade, migration, reset de banco, perda de dados ou replay. Piloto read-only não cria gravação comercial; autenticação/contexto continuam no servidor. Não implementar feature flag agora. O mecanismo de habilitação futuro pode ser simples e explícito, sem serviço de flags.

Build estático ausente/inválido não pode impedir acesso ao legado. Homologar a retirada da entrada e atualização de links, além da entrada nova. Rollback do piloto não equivale a restaurar backup da operação.

## 28. Ordem recomendada da V1.3

Manter a sequência proposta:

1. Este contrato arquitetural.
2. Aprovação/revisão da direção delimitada.
3. Branch de trabalho V1.3, somente após autorização.
4. Skeleton mínimo React/TS/Vite e roteamento.
5. Integração aditiva de HTML/assets com Node, dev e produção.
6. Cliente HTTP/contexto/sessão.
7. Design System mínimo exigido pelo piloto.
8. Produtos read-only.
9. Testes e validação em ambiente isolado/hardware representativo.
10. Homologação do piloto com evidências e plano de retirada.
11. Decisão GO / ADJUST / STOP.
12. Próximas telas por etapas autorizadas, com aposentadoria do escopo antigo.

Não adiantar desktop/offline/drivers/caixa/financeiro nem refactor compartilhado nessa sequência. Cloud/PostgreSQL, hardware/fiscal, quantidades fracionadas e módulos futuros continuam fora da implementação inicial.

A direção cloud-authoritative com contingência não altera a ordem ou aumenta o piloto: arquitetura → skeleton React/TS/Vite → integração Node → contexto/API → Design System mínimo → Produtos read-only → homologação. Implantação cloud, PostgreSQL, armazenamento operacional local, offline/sync, appliance, Desktop Shell, impressão e dispositivos terão tarefas próprias. A aprovação da direção geral já ocorreu; este fechamento documental precede qualquer autorização de branch/implementação.

## 29. Riscos consolidados e pendências

| Risco | Tratamento no contrato |
| --- | --- |
| Mover public quebra backend/transitivos | Inventário completo; preservar e extrair só por tarefa específica |
| CommonJS/globals não são ESM automático | Piloto dispensa cálculos; futura compatibilidade explícita |
| Node atual não serve build/rotas da SPA | Integração restrita aditiva, sem abrir raiz ou API fallback |
| Dev modifica Origin/Host para funcionar | Origem do documento Node; controles mantidos |
| Troca de contexto/resposta tardia expõe dados | Geração, cancelamento, descarte, limpeza e headers esperados |
| Dois sistemas/Design Systems permanentes | Equivalência por escopo, retirada nomeada e plano antes de expansão |
| React vira migração longa sem entrega | Uma consulta read-only, gate e rollback |
| Payload de filhos/tamanho ou memória crescem | Medir dataset representativo; sem busca de todo ERP |
| Abstrações/dependências excessivas | Categorias explícitas e alertas antes de expandir |
| Desktop/Agente/appliance viram banco oficial ou backends autoritativos paralelos | Cloud permanente como fonte de verdade; contingência operacional limitada |
| Dados locais só são preparados depois da queda | Sincronizar o subconjunto operacional previamente enquanto online |
| Réplica integral substitui contingência mínima | Selecionar dados por fluxo; não copiar histórico/anexos/Financeiro inteiro automaticamente |
| Retenção elimina operação sem confirmação | Pendências não são apagadas automaticamente; confirmação inequívoca ou tratamento explícito |
| Caixas offline isolados disputam o mesmo saldo | Coordenação LAN opcional para estações críticas; regras de concorrência/conflito ainda A DEFINIR |
| Appliance vira obrigatório por contagem de PCs | Necessidade por criticidade, offline coordenado e dispositivos, não por número fixo |
| Sync duplicado, crash ou confirmação ambígua | IDs estáveis, idempotência, reenvio seguro e confirmação explícita como requisitos futuros |
| Proteção local/limpeza ou revogação perde pendências | Especificar segurança e tratamento de pendências conjuntamente; nenhuma escolha de mecanismo agora |
| Offline determina shell prematuramente ou amplia piloto | Shell independente/A DEFINIR; implementação inicial mantém escopo |
| Offline/hardware parece pronto por estar no desenho | Estados PLANEJADO/A DEFINIR, decisões específicas futuras |

Não foram demonstradas deficiências impeditivas da API de listagem. Filtros adicionais, DTO mais estreito e correlação permanecem pendências possíveis, sem correção nesta tarefa.

## 30. Primeira tarefa de implementação recomendada

**Skeleton mínimo isolado em frontend/, React/TypeScript/Vite, sem telas comerciais e sem tocar módulos compartilhados.**

Após aprovação e autorização da branch/instalação, essa tarefa deve entregar uma entrada mínima com roteamento, TypeScript strict, build reproduzível, ferramentas/dev dependencies mínimas e documentação do que ainda não foi integrado. O passo seguinte autorizado será a entrega pelo Node e a comprovação de sessão/contexto; depois cliente HTTP/Design System/piloto, conforme a ordem acima.

Aceite do skeleton: build + verificação de tipos; nenhum import do backend/public legado; nenhuma dependência comercial pesada; ausência de alterações em domínio/banco/migrations; versão/tag V1.2 preservadas até autorização própria de versionamento. Skeleton sozinho não autoriza expansão nem homologa a SPA.

## Fontes e verificação deste contrato

Autoridade local: código versionado no HEAD informado, importadores diretos, dependências de módulos, DTOs/queries/identidade e testes existentes inspecionados. Inventário cobre todos os arquivos de public versionados, não artefatos ignorados nem módulos instalados externamente.

Autoridade da direção futura: decisões explícitas do usuário nesta finalização — cloud-authoritative, contingência operacional local e Agente Local/appliance opcional. Elas não são fatos implementados pela Fundação V1.2. Não alterar seus documentos históricos; este contrato incorpora a nova direção nas seções correspondentes e preserva integralmente os anexos técnicos.

Fontes externas são documentação oficial para recursos atuais das ferramentas, não prova de implementação no projeto. A consulta não instalou dependências. Links internos devem ser relativos a este Markdown, sem referência obrigatória a .qa.

Verificação documental: conferir existência das referências locais, cobertura 75/75 e compartilhados 28/28, consistência de contagens, whitespace, status/staged e preservação dos arquivos versionados da baseline. Essa verificação não é execução do piloto, benchmark ou nova rodada dos 610 testes.


## Anexo A — inventário completo de public

Classificação primária exclusiva: **A** somente browser/interface com responsabilidade isolada; **B** computacional compartilhável, sem importação de produção do backend identificada; **C** browser e backend de produção; **D** interface legada dependente de DOM/globais/ordem de carga; **E** asset/estrutura. **F** é uma marca adicional de aposentadoria futura, condicionada à substituição e à remoção segura de todos os consumidores.

Os 44 D também são browser/interface (A em sentido amplo); usar D como classe principal evita contagem dupla. Totais: A = 1; B = 4; C = 24; D = 44; E = 2; total = 75. Nenhum arquivo está liberado para remoção agora. Nos D, F significa substituir o comportamento/tela e só então avaliar o arquivo; não apagar um arquivo que ainda atende outras telas. A/E também são candidatos condicionais à retirada do shell legado. B/C não são candidatos automáticos à aposentadoria.

Caminhos abaixo são relativos à raiz do repositório. Tamanho em KiB de fonte, sem compressão. Linhas físicas desconsideram a linha vazia criada apenas pelo terminador final.

| Caminho | Classe | F futuro | KiB | Linhas | Responsabilidade |
| --- | --- | --- | ---: | ---: | --- |
| [public/accounts-core.js](../../../public/accounts-core.js) | C | Não automático | 2.66 | 14 | Parcelas de recebíveis e prévia de alocação |
| [public/accounts-ui.js](../../../public/accounts-ui.js) | D | Condicional | 12.14 | 7 | Contas a receber |
| [public/advanced-analytics.js](../../../public/advanced-analytics.js) | B | Não automático | 12.54 | 30 | Análises e indicadores calculados |
| [public/agreements-core.js](../../../public/agreements-core.js) | C | Não automático | 2.26 | 8 | Origens, posição e token de acordos |
| [public/agreements-ui.js](../../../public/agreements-ui.js) | D | Condicional | 16.04 | 17 | Acordos de saldo |
| [public/analytics-ui.js](../../../public/analytics-ui.js) | D | Condicional | 2.87 | 3 | Análises avançadas |
| [public/app.js](../../../public/app.js) | D | Condicional | 11.80 | 42 | Shell legado, helpers, API e estado central |
| [public/budget-core.js](../../../public/budget-core.js) | C | Não automático | 3.65 | 7 | Posição do orçamento de despesas |
| [public/budget-ui.js](../../../public/budget-ui.js) | D | Condicional | 11.40 | 8 | Orçamento de despesas |
| [public/business-core.js](../../../public/business-core.js) | C | Não automático | 19.26 | 54 | Busca, duplicidades, pendências, diagnóstico e relatórios |
| [public/business-ui.js](../../../public/business-ui.js) | D | Condicional | 12.49 | 13 | Busca global e cadastros ampliados |
| [public/cash-core.js](../../../public/cash-core.js) | C | Não automático | 0.90 | 13 | Resumo e identificação do caixa aberto |
| [public/cash-ui.js](../../../public/cash-ui.js) | D | Condicional | 12.28 | 34 | Operação de caixa |
| [public/catalog-ui.js](../../../public/catalog-ui.js) | D | Condicional | 2.54 | 15 | Filtros e atividade de cadastros |
| [public/catalogue-next-ui.js](../../../public/catalogue-next-ui.js) | D | Condicional | 20.00 | 19 | Embalagens e famílias |
| [public/checkout-core.js](../../../public/checkout-core.js) | C | Não automático | 2.07 | 20 | Prévia de pagamento, valor entregue e troco |
| [public/checkout-ui.js](../../../public/checkout-ui.js) | D | Condicional | 13.08 | 22 | Balcão PDV e histórico |
| [public/commercial-ui.js](../../../public/commercial-ui.js) | D | Condicional | 14.72 | 123 | Consultas por DTO, paginação, filtros e proteção de contexto |
| [public/delivery-core.js](../../../public/delivery-core.js) | C | Não automático | 1.46 | 6 | Posição e situação de entregas |
| [public/delivery-ui.js](../../../public/delivery-ui.js) | D | Condicional | 10.39 | 8 | Separação e entregas |
| [public/discount-core.js](../../../public/discount-core.js) | C | Não automático | 0.92 | 11 | Desconto e subtotal comercial |
| [public/expenses-ui.js](../../../public/expenses-ui.js) | D | Condicional | 4.99 | 9 | Despesas pagas |
| [public/experience-ui.js](../../../public/experience-ui.js) | D | Condicional | 16.41 | 33 | Filtros, paginação local, foco, conexão e observadores |
| [public/finance.js](../../../public/finance.js) | B | Não automático | 0.46 | 3 | Resumo financeiro das vendas |
| [public/foundation-experience.js](../../../public/foundation-experience.js) | D | Condicional | 31.11 | 244 | Consultas, quick views, vendas SQL e extensões de UX |
| [public/foundation-operations.js](../../../public/foundation-operations.js) | D | Condicional | 10.94 | 72 | Senha, sessões, manutenção de acesso e recuperação |
| [public/foundation-storage.js](../../../public/foundation-storage.js) | A | Condicional | 1.37 | 30 | Preferências/rascunhos com namespace de identidade e contexto |
| [public/foundation-ui.js](../../../public/foundation-ui.js) | D | Condicional | 23.65 | 242 | Entrada, sessão, contexto, permissões e administração |
| [public/index.html](../../../public/index.html) | E | Condicional | 3.22 | 32 | Documento/entrada HTML e ordem dos scripts |
| [public/inventory-next-ui.js](../../../public/inventory-next-ui.js) | D | Condicional | 10.81 | 6 | Extensões de inventário e contagem |
| [public/manager-ui.js](../../../public/manager-ui.js) | D | Condicional | 8.55 | 12 | Relatórios gerenciais |
| [public/money.js](../../../public/money.js) | C | Não automático | 0.53 | 8 | Conversão exata para centavos |
| [public/navigation.js](../../../public/navigation.js) | D | Condicional | 1.67 | 14 | Menus e registro global de páginas |
| [public/next-ui-common.js](../../../public/next-ui-common.js) | D | Condicional | 4.83 | 20 | Registro de páginas, revisão, formulários e listas legadas |
| [public/operations.js](../../../public/operations.js) | D | Condicional | 8.20 | 16 | Movimentos, financeiro e histórico |
| [public/payables-core.js](../../../public/payables-core.js) | C | Não automático | 1.71 | 8 | Parcelas, saldo e situação de contas a pagar |
| [public/payables-ui.js](../../../public/payables-ui.js) | D | Condicional | 23.81 | 45 | Contas a pagar |
| [public/payments.js](../../../public/payments.js) | C | Não automático | 0.91 | 13 | Histórico de recebimentos e saldo pago/restante |
| [public/planning-ui.js](../../../public/planning-ui.js) | D | Condicional | 18.49 | 37 | Reposição e planejamento |
| [public/positions-core.js](../../../public/positions-core.js) | C | Não automático | 1.68 | 7 | Distribuição, saldo, token e consumo por posição |
| [public/positions-ui.js](../../../public/positions-ui.js) | D | Condicional | 12.65 | 15 | Posições e transferências |
| [public/price-review-core.js](../../../public/price-review-core.js) | C | Não automático | 2.93 | 8 | Referência e simulação de revisão de preços |
| [public/price-reviews-ui.js](../../../public/price-reviews-ui.js) | D | Condicional | 12.28 | 10 | Revisões de preços em lote |
| [public/pricing-core.js](../../../public/pricing-core.js) | C | Não automático | 5.03 | 28 | Preços, promoções, proporções e listas |
| [public/pricing-ui.js](../../../public/pricing-ui.js) | D | Condicional | 27.53 | 55 | Listas de preços e promoções |
| [public/procedures-ui.js](../../../public/procedures-ui.js) | D | Condicional | 14.10 | 11 | Procedimentos e checklists |
| [public/product-lookup.js](../../../public/product-lookup.js) | C | Não automático | 3.08 | 39 | Identificadores, busca de produto e prévia de carrinho |
| [public/purchase-next-ui.js](../../../public/purchase-next-ui.js) | D | Condicional | 13.05 | 13 | Conferências e ocorrências de compras |
| [public/purchases-core.js](../../../public/purchases-core.js) | C | Não automático | 1.88 | 8 | Recebimentos, situação de compra e custos históricos |
| [public/purchases-ui.js](../../../public/purchases-ui.js) | D | Condicional | 33.27 | 104 | Compras e recebimentos |
| [public/quarantine-core.js](../../../public/quarantine-core.js) | C | Não automático | 1.00 | 6 | Saldo retido e posição física |
| [public/quarantine-ui.js](../../../public/quarantine-ui.js) | D | Condicional | 27.35 | 23 | Quarentena e retornos ao fornecedor |
| [public/quotes-core.js](../../../public/quotes-core.js) | C | Não automático | 0.51 | 8 | Atividade de cadastro e situação de orçamento |
| [public/quotes-ui.js](../../../public/quotes-ui.js) | D | Condicional | 23.32 | 71 | Orçamentos comerciais |
| [public/recurring-core.js](../../../public/recurring-core.js) | C | Não automático | 1.76 | 7 | Revisões, calendário e situação de recorrências |
| [public/recurring-ui.js](../../../public/recurring-ui.js) | D | Condicional | 14.14 | 9 | Previsões recorrentes |
| [public/replenishment-core.js](../../../public/replenishment-core.js) | B | Não automático | 1.23 | 4 | Entradas esperadas e sugestão de reposição |
| [public/reports.js](../../../public/reports.js) | C | Não automático | 2.95 | 19 | Datas comerciais, períodos, movimentos e CSV |
| [public/reservations-ui.js](../../../public/reservations-ui.js) | D | Condicional | 10.75 | 8 | Reservas |
| [public/round10-ui.js](../../../public/round10-ui.js) | D | Condicional | 11.65 | 13 | Extensões de funções e ações de vários módulos |
| [public/scan-next-ui.js](../../../public/scan-next-ui.js) | D | Condicional | 4.61 | 4 | Extensões de leitura de códigos e observadores |
| [public/scanner-ui.js](../../../public/scanner-ui.js) | D | Condicional | 4.93 | 30 | Leitor como teclado e entrada manual |
| [public/startup.js](../../../public/startup.js) | D | Condicional | 0.10 | 1 | Inicialização global da interface legada |
| [public/store-credit-core.js](../../../public/store-credit-core.js) | C | Não automático | 1.97 | 13 | Saldo e alocação de crédito de loja/devolução |
| [public/store-credit-ui.js](../../../public/store-credit-ui.js) | D | Condicional | 9.30 | 10 | Crédito de loja |
| [public/store.js](../../../public/store.js) | D | Condicional | 28.88 | 72 | Cadastros, venda, carrinho e rascunhos |
| [public/style.css](../../../public/style.css) | E | Condicional | 13.77 | 69 | Estilos, variáveis CSS e responsividade |
| [public/supplier-quote-core.js](../../../public/supplier-quote-core.js) | C | Não automático | 1.60 | 7 | Situação, proposta e comparação de cotações |
| [public/supplier-quote-ui.js](../../../public/supplier-quote-ui.js) | D | Condicional | 12.77 | 8 | Cotações de fornecedores |
| [public/supplier-return-core.js](../../../public/supplier-return-core.js) | C | Não automático | 1.37 | 6 | Situação, resumo e saldo de retorno ao fornecedor |
| [public/tasks-ui.js](../../../public/tasks-ui.js) | D | Condicional | 12.18 | 7 | Tarefas e acompanhamentos |
| [public/workflow-core.js](../../../public/workflow-core.js) | C | Não automático | 4.41 | 26 | Reservas, inventários, estoque e devoluções |
| [public/workflows-ui.js](../../../public/workflows-ui.js) | D | Condicional | 24.73 | 31 | Inventários e devoluções |
| [public/workstation-core.js](../../../public/workstation-core.js) | B | Não automático | 1.70 | 6 | Validação de rascunhos/modelos e layout de colunas |
| [public/workstation-ui.js](../../../public/workstation-ui.js) | D | Condicional | 29.73 | 36 | Estação de atendimento e rascunhos |

## Anexo B — módulos computacionais e consumidores

Todos os 28 módulos abaixo são carregados como scripts por [index.html](../../../public/index.html). No browser não existem imports ESM entre eles: publicações no escopo global e a ordem de scripts fazem a ligação. A coluna browser registra referências estáticas aos símbolos exportados nos demais arquivos de public; não é um grafo dinâmico de chamadas nem prova de execução de cada função. A coluna backend lista **todos os importadores diretos de produção identificados no código versionado**, incluindo importações dentro de funções; demais chamadores do backend são transitivos. Testes Node não são classificados como backend de produção.

A conferência incluiu imports literais relativos, referências a public fora da interface e dependências locais dos módulos. Não foram identificados outros consumidores de produção de public além dos 24 C. Módulos C também têm consumidores transitivos em outros cálculos de public.

### Propriedades e estratégias comuns, aplicáveis a cada linha

- **Browser:** sim, via index.html e símbolos globais. **window/document/DOM:** não nos 28 módulos computacionais. globalThis/this aparecem como recipiente de exports em vários módulos; não são acesso a hardware ou DOM. O texto location em business-core é propriedade de produto, não window.location.
- **Lógica pura:** computacional, sem rede/banco/DOM; funções de calendário/situação podem obter a data atual por default ou chamar calendarDay. Determinismo exige informar a data quando a função admite esse parâmetro. Não certificar pureza referencial de todo o módulo por ausência de DOM. product-lookup inclui prévia de carrinho; business-core/analytics recebem estado amplo. Isso não autoriza baixar o ERP inteiro na SPA.
- **S1 / risco alto:** todos os C. Preservar arquivo/export/caminhos; futura extração por domínio, com testes de equivalência, atualização explícita de importadores e fachada CommonJS/browser transitória. Não converter export para ESM de uma vez. O risco decorre do uso real em regras, projeções, importação ou validação do backend, não só do tamanho.
- **S2 / risco intermediário:** os B. Não possuem importador de produção do backend identificado, mas possuem consumidores browser e testes Node. Adotar a mesma equivalência, cuidando de datas, arredondamento, histórico e dependências locais; só extrair se uma tela migrada precisar da função.
- money/payments/reports/workflow/business são pontos de alcance amplo: ordenar qualquer extração futura pelo grafo real e preservar dependências antes dos consumidores. Não retirar um C junto com uma tela antiga.

| Caminho | Classe | Responsabilidade | Consumidores browser identificados | Importadores diretos do backend / testes quando B | Risco e estratégia |
| --- | --- | --- | --- | --- | --- |
| [public/accounts-core.js](../../../public/accounts-core.js) | C | Parcelas de recebíveis e prévia de alocação | `accounts-ui.js`, `agreements-ui.js`, `business-core.js` | `accounts.js`, `agreements.js`, `foundation/migration.js`, `tasks.js` | Alto — S1 |
| [public/advanced-analytics.js](../../../public/advanced-analytics.js) | B | Análises e indicadores calculados | `analytics-ui.js` | Somente testes: `round9-regression.test.js` | Intermediário — S2 |
| [public/agreements-core.js](../../../public/agreements-core.js) | C | Origens, posição e token de acordos | `agreements-ui.js`, `budget-core.js`, `business-core.js`, `round10-ui.js` | `agreements.js` | Alto — S1 |
| [public/budget-core.js](../../../public/budget-core.js) | C | Posição do orçamento de despesas | `agreements-ui.js`, `budget-ui.js`, `payables-ui.js`, `recurring-ui.js`, `workstation-ui.js` | `budgets.js` | Alto — S1 |
| [public/business-core.js](../../../public/business-core.js) | C | Busca, duplicidades, pendências, diagnóstico e relatórios | `business-ui.js`, `delivery-ui.js`, `manager-ui.js`, `next-ui-common.js`, `quarantine-ui.js`, `round10-ui.js`, `supplier-quote-ui.js`, `tasks-ui.js`, `workstation-ui.js` | `tasks.js` | Alto — S1 |
| [public/cash-core.js](../../../public/cash-core.js) | C | Resumo e identificação do caixa aberto | `accounts-ui.js`, `agreements-ui.js`, `cash-ui.js`, `checkout-ui.js`, `expenses-ui.js`, `operations.js`, `payables-ui.js`, `pricing-ui.js`, `quarantine-ui.js`, `quotes-ui.js`, `recurring-ui.js`, `reservations-ui.js`, `round10-ui.js`, `store-credit-ui.js`, `store.js`, `workflows-ui.js` | `cash-report.js`, `cash.js`, `foundation/commercial-read.js`, `payables.js`, `supplier-returns.js`, `workflows.js` | Alto — S1 |
| [public/checkout-core.js](../../../public/checkout-core.js) | C | Prévia de pagamento, valor entregue e troco | `checkout-ui.js` | `checkout.js` | Alto — S1 |
| [public/delivery-core.js](../../../public/delivery-core.js) | C | Posição e situação de entregas | `advanced-analytics.js`, `delivery-ui.js` | `deliveries.js`, `operations-storage.js` | Alto — S1 |
| [public/discount-core.js](../../../public/discount-core.js) | C | Desconto e subtotal comercial | `checkout-ui.js`, `payables-ui.js`, `planning-ui.js`, `pricing-ui.js`, `quotes-ui.js`, `reservations-ui.js`, `store-credit-ui.js`, `store.js` | `export.js`, `foundation/commercial-write.js`, `quotes.js`, `server.js`, `workflows.js` | Alto — S1 |
| [public/finance.js](../../../public/finance.js) | B | Resumo financeiro das vendas | `operations.js` | Somente testes: `finance.test.js`, `payments.test.js` | Intermediário — S2 |
| [public/money.js](../../../public/money.js) | C | Conversão exata para centavos | `accounts-ui.js`, `agreements-ui.js`, `budget-ui.js`, `catalogue-next-ui.js`, `checkout-core.js`, `checkout-ui.js`, `discount-core.js`, `payables-ui.js`, `planning-ui.js`, `price-review-core.js`, `pricing-ui.js`, `purchases-ui.js`, `recurring-ui.js`, `store-credit-ui.js`, `supplier-quote-ui.js`, `workflows-ui.js` | `money.js` | Alto — S1 |
| [public/payables-core.js](../../../public/payables-core.js) | C | Parcelas, saldo e situação de contas a pagar | `accounts-ui.js`, `agreements-core.js`, `agreements-ui.js`, `business-core.js`, `payables-ui.js`, `planning-ui.js` | `accounts.js`, `agreements.js`, `export.js`, `foundation/commercial-read.js`, `payables.js` | Alto — S1 |
| [public/payments.js](../../../public/payments.js) | C | Histórico de recebimentos e saldo pago/restante | `accounts-core.js`, `accounts-ui.js`, `advanced-analytics.js`, `agreements-core.js`, `agreements-ui.js`, `app.js`, `business-core.js`, `cash-ui.js`, `finance.js`, `operations.js`, `reports.js`, `store-credit-ui.js`, `workflows-ui.js`, `workstation-ui.js` | `accounts.js`, `agreements.js`, `cash.js`, `export.js`, `foundation/commercial-read.js`, `payments.js`, `store-credits.js`, `workflows.js` | Alto — S1 |
| [public/positions-core.js](../../../public/positions-core.js) | C | Distribuição, saldo, token e consumo por posição | `positions-ui.js`, `round10-ui.js`, `workflow-core.js` | `positions.js`, `round10-storage.js`, `workflows.js` | Alto — S1 |
| [public/price-review-core.js](../../../public/price-review-core.js) | C | Referência e simulação de revisão de preços | `price-reviews-ui.js` | `price-reviews.js` | Alto — S1 |
| [public/pricing-core.js](../../../public/pricing-core.js) | C | Preços, promoções, proporções e listas | `checkout-ui.js`, `price-review-core.js`, `pricing-ui.js`, `store-credit-ui.js`, `workstation-ui.js` | `foundation/commercial-write.js`, `pricing.js` | Alto — S1 |
| [public/product-lookup.js](../../../public/product-lookup.js) | C | Identificadores, busca de produto e prévia de carrinho | `catalogue-next-ui.js`, `inventory-next-ui.js`, `scan-next-ui.js`, `scanner-ui.js`, `store.js`, `workflows-ui.js` | `domain.js` | Alto — S1 |
| [public/purchases-core.js](../../../public/purchases-core.js) | C | Recebimentos, situação de compra e custos históricos | `advanced-analytics.js`, `business-core.js`, `catalogue-next-ui.js`, `planning-ui.js`, `purchase-next-ui.js`, `purchases-ui.js`, `quarantine-ui.js`, `replenishment-core.js`, `workstation-ui.js` | `export.js`, `foundation/commercial-read.js`, `payables.js`, `purchase-next.js`, `purchases.js` | Alto — S1 |
| [public/quarantine-core.js](../../../public/quarantine-core.js) | C | Saldo retido e posição física | `positions-ui.js`, `quarantine-ui.js`, `scanner-ui.js`, `workstation-ui.js` | `advanced-storage.js`, `quarantine.js`, `quotes.js` | Alto — S1 |
| [public/quotes-core.js](../../../public/quotes-core.js) | C | Atividade de cadastro e situação de orçamento | `app.js`, `budget-ui.js`, `business-ui.js`, `catalog-ui.js`, `catalogue-next-ui.js`, `inventory-next-ui.js`, `next-ui-common.js`, `payables-ui.js`, `planning-ui.js`, `positions-ui.js`, `price-reviews-ui.js`, `pricing-ui.js`, `procedures-ui.js`, `purchases-ui.js`, `quarantine-ui.js`, `quotes-ui.js`, `recurring-ui.js`, `reservations-ui.js`, `scan-next-ui.js`, `scanner-ui.js`, `store.js`, `supplier-quote-ui.js`, `workflows-ui.js`, `workstation-ui.js` | `export.js`, `foundation/commercial-write.js`, `payables.js`, `purchases.js`, `quotes.js`, `server.js`, `workflows.js` | Alto — S1 |
| [public/recurring-core.js](../../../public/recurring-core.js) | C | Revisões, calendário e situação de recorrências | `recurring-ui.js` | `recurring.js` | Alto — S1 |
| [public/replenishment-core.js](../../../public/replenishment-core.js) | B | Entradas esperadas e sugestão de reposição | `planning-ui.js` | Somente testes: `round8-integrity.test.js`, `v9.test.js` | Intermediário — S2 |
| [public/reports.js](../../../public/reports.js) | C | Datas comerciais, períodos, movimentos e CSV | `accounts-ui.js`, `advanced-analytics.js`, `agreements-ui.js`, `budget-ui.js`, `business-core.js`, `cash-ui.js`, `checkout-ui.js`, `delivery-ui.js`, `expenses-ui.js`, `manager-ui.js`, `next-ui-common.js`, `operations.js`, `payables-core.js`, `payables-ui.js`, `planning-ui.js`, `positions-ui.js`, `pricing-core.js`, `pricing-ui.js`, `procedures-ui.js`, `purchase-next-ui.js`, `purchases-core.js`, `purchases-ui.js`, `quarantine-ui.js`, `quotes-core.js`, `quotes-ui.js`, `recurring-core.js`, `recurring-ui.js`, `reservations-ui.js`, `store.js`, `supplier-quote-core.js`, `tasks-ui.js`, `workflow-core.js`, `workflows-ui.js`, `workstation-ui.js` | `accounts.js`, `advanced-common.js`, `advanced-storage.js`, `agreements.js`, `cash-report.js`, `cash.js`, `checkout.js`, `deliveries.js`, `domain.js`, `export.js`, `foundation/sales-store.js`, `operations-storage.js`, `payables.js`, `purchase-next.js`, `purchases.js`, `quotes.js`, `recurring.js`, `round10-storage.js`, `supplier-quotes.js`, `supplier-returns.js`, `tasks.js`, `workflow-storage.js`, `workflows.js` | Alto — S1 |
| [public/store-credit-core.js](../../../public/store-credit-core.js) | C | Saldo e alocação de crédito de loja/devolução | `advanced-analytics.js`, `checkout-ui.js`, `store-credit-ui.js`, `workstation-ui.js` | `store-credits.js` | Alto — S1 |
| [public/supplier-quote-core.js](../../../public/supplier-quote-core.js) | C | Situação, proposta e comparação de cotações | `supplier-quote-ui.js` | `operations-storage.js`, `supplier-quotes.js` | Alto — S1 |
| [public/supplier-return-core.js](../../../public/supplier-return-core.js) | C | Situação, resumo e saldo de retorno ao fornecedor | `quarantine-ui.js` | `advanced-storage.js`, `supplier-returns.js` | Alto — S1 |
| [public/workflow-core.js](../../../public/workflow-core.js) | C | Reservas, inventários, estoque e devoluções | `accounts-ui.js`, `advanced-analytics.js`, `app.js`, `business-core.js`, `business-ui.js`, `delivery-core.js`, `inventory-next-ui.js`, `payments.js`, `price-review-core.js`, `price-reviews-ui.js`, `quarantine-core.js`, `quarantine-ui.js`, `replenishment-core.js`, `reservations-ui.js`, `store-credit-core.js`, `store-credit-ui.js`, `supplier-return-core.js`, `workflows-ui.js`, `workstation-ui.js` | `quarantine.js`, `quotes.js`, `server.js`, `store-credits.js`, `supplier-returns.js`, `workflows.js` | Alto — S1 |
| [public/workstation-core.js](../../../public/workstation-core.js) | B | Validação de rascunhos/modelos e layout de colunas | `workstation-ui.js` | Somente testes: `round9-regression.test.js` | Intermediário — S2 |
