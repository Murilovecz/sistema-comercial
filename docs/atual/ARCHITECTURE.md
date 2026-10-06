# Arquitetura

## Referência vigente — 05/10/2026

Produto/arquitetura desejados: [Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md), §§1–5, 11–17. Estado: código/testes e [índice](PROJECT_MASTER.md). Plano: [A–G](ROADMAP.md). A seção V1.2 abaixo descreve a fundação ainda ativa; B/610 não certifica a V1.3 inteira.

Alvo aprovado: monólito modular API-first, cloud como autoridade; Conta/Organização (tenant) → Entidade Legal/Titular PF/PJ → Unidade; Core e Financeiro Básico obrigatórios, módulos opcionais/add-ons/adapters. Plano administrativo da plataforma separado do cliente; clientes/estações/Agente Local não confiáveis e sem acesso direto ao banco cloud. Contrato, entitlement, permission, scope e station são controles distintos.

**Diferenças atuais:** `companies → units` não realiza a hierarquia alvo; mapeamento legado será especificado em C, sem migration agora. Persistência híbrida e acoplamentos impedem afirmar independência modular pronta. Replay legado, pessoas comuns, estados/negativo de estoque e alçadas estão registrados na [auditoria](../auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md). Não corrigir por esta anotação.

## ATUAL no código — Fundação V1.2 fechada localmente

Estado atual em **03/10/2026**: Fundação V1.2 fechada localmente, checkpoint `2a2177c7b80734722f71bd9e72029cf9e1b39df0`: **B — homologação condicional, 610/610 aprovados**, migrations **001–010**, seis agregados relacionais. Versão **1.2.0-foundation.1**; fechamento local concluído, com tag `v1.2.0-foundation.1`. Evidências e limites no [estado consolidado V1.2](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md); [V1.1](../atualizacoes/v1.1/FOUNDATION_V1_1_REPORT.md) permanece histórico. Esta revisão documental não verifica nem altera o banco operacional e não certifica produção/cloud.

```text
Navegador no próprio computador
  HTML + CSS + JavaScript em public/
                |
                v
HTTP Node.js — server.js — 127.0.0.1:3210
                |
Funções de domínio e validadores na raiz
                |
Contexto autenticado + RBAC + domínio preservado
                |
Comandos: domínio + SQL normalizado + espelho + índice + auditoria
Consultas menores: SQL paginado (inclui Vendas) / snapshot nos demais contratos
                |
node:sqlite → data/foundation.sqlite
```

O runtime importa a origem JSON apenas na configuração inicial do banco novo, validando e conferindo a preservação. Depois usa SQLite nativo, migrations com checksum, foreign keys, WAL e transações síncronas `BEGIN IMMEDIATE`. Antes de aceitar requisições, prepara/confere os agregados das unidades antigas. Cada comando hidrata/confere o estado atual da unidade dentro da transação, aplica domínio/reconciliação, valida e grava tabelas, espelhos, índice e auditoria. Divergência SQL/espelho aborta sem reimportação silenciosa. A resposta de sucesso só sai após commit. Falha cancela a operação completa; não se mantém transação aberta durante leitura HTTP ou cálculo assíncrono de senha.

O backend é CommonJS e usa módulos nativos do Node; package.json não declara dependências externas. A interface comercial preservada em `public/` é JavaScript sem framework, com scripts sequenciais, estado global e extensões de funções. Em paralelo, `frontend/` já possui React/TypeScript/Vite em `/ui/`, HTTP/sessão/login/contexto e Design System, sem módulo comercial migrado. Alguns cálculos de `public/*-core.js` são importados também pelo servidor. Há reutilização útil, mas dependência de caminho e ordem de carga.

`foundation/` delimita identidade, vínculos de acesso, RBAC, contexto, administração, persistência e auditoria. Há empresas/unidades e sessão autenticada revalidada em cada pedido. O servidor ainda concentra transporte e despacho legado. [commercial-store.js](../../foundation/commercial-store.js), [inventory-store.js](../../foundation/inventory-store.js) e [sales-store.js](../../foundation/sales-store.js) normalizam seis agregados: Produtos (aliases/embalagens), Clientes, Fornecedores, Compras/Recebimentos, Estoque/Movimentações (global/físico/saldos/entradas) e Vendas (cabeçalho/filhos factuais). SQL é autoridade desses agregados; snapshot equivalente mantém domínio/interface e escritas compatíveis. Caixa, Financeiro, documentos de posições e outros módulos permanecem transitórios. FKs compostas cobrem relações comprovadas entre agregados SQL; referências restantes usam validadores do domínio. Não há FK universal nem catálogo compartilhado entre unidades. Compras tem persistência relacional, mas consultas operacionais e comandos ainda usam estado completo; não possui API proporcional própria para todo o módulo.

O snapshot completo e exports contêm financeiro: exigem todas as cinco permissões de leitura, mais a permissão da escrita. Perfis parciais usam consultas/DTOs por direito; Administração/Auditoria seguem seus próprios direitos. Catálogo/Clientes/Fornecedores/Estoque/Movimentos e lista/detalhe de Vendas usam SQL sem payload comercial integral. Vendas aplica busca, filtros, COUNT e paginação SQL; revisão/marcador continuam necessários. Financeiro/Operações projetam/paginam snapshot em memória. Custo recebido e contexto de caixa ainda materializam estado, com resposta/acesso restritos. Interface completa permanece ponte compatível do snapshot e exige as cinco leituras. Export temporário pertence à sessão/empresa/unidade; rascunhos locais usam namespace verificado. Cloud, instalador e Edge permanecem planejados.

`commercial-registration.js` fornece comandos menores de cadastro com versão esperada e replay de criação; `catalog-registration.js` compartilha a criação com domínio legado. `commercial-write.js` oferece preview e venda direta com resposta limitada. O preview não altera estoque nem autoriza exceção. `inactive-sale-approval.js` valida senha real/direito explícito, emite grant hash-only de até 120 segundos e consome com CAS no mesmo commit da venda. Prova interna WeakMap é vinculada à instância/epoch/contexto/fingerprint e venda; execução/auditoria só aceitam aprovação comprovada nos itens efetivamente inativos. Não há PIN/biometria ou liberação implícita pelo cargo. Ver [API](API.md), [segurança](SECURITY.md) e [aprovação](../atualizacoes/v1.1/FOUNDATION_V1_1_APPROVAL.md).

Saldos e quantidades SQL são decimal canônico TEXT, calculado exatamente com BigInt, sem REAL. Unidades/custos/históricos existentes são preservados; contratos operacionais continuam inteiros. Conversões, precisão/escala comercial e venda fracionada permanecem A DEFINIR. Guarda de `saveBusinessState` exige movimento para cada delta global/físico e histórico anterior imutável; importação/fixtures têm caminho técnico interno sem bypass HTTP. Âncora de saldo legado é explícita e não fabrica autoria/operação.

Comandos ainda materializam/validam snapshot, conferem espelhos e reconciliam tabelas; vários filhos/saldos/movimentos são reconstruídos. Vendas preserva filhos de vendas inalteradas. O índice 010 e melhorias locais de estoque reduziram trabalho repetido sem mudar regra comercial; não eliminam o custo de escrita ou da conferência física. [Desempenho](../atualizacoes/v1.2/PERFORMANCE_V1_2.md): escritas large ~2 s, snapshot crescente e RSS a acompanhar, sem leak comprovado ou SLA. Backup consistente, agendamento/retenção e manutenção de acesso iniciam no runtime e param antes de fechar SQLite; restore isolado passou por validação sintética com login/seis agregados/escopos/auditoria. Procedimento da loja, disaster recovery real, RPO/RTO e proteção externa continuam pendentes. [Operação](OPERATIONS_V1_2.md).

Troca de senha, reset administrativo por direito/senha/motivo, revogação de sessões e purge conservador estão integrados; não há recuperação por e-mail, MFA ou dispositivo confiável. Ver [Acesso](ACCESS_V1_2.md). A arquitetura continua monólito modular, backend autoritativo e multi-tenant/multiempresa/multiunidade local. React/TypeScript/Vite foram adotados na base frontend V1.3; backend permanece JavaScript. Next.js/SSR/BFF e conversão do backend não são a direção desta fase.

**Histórico V0.12.0:** usava login fictício, estado global em memória e gravação por JSON temporário/rename. A baseline e o [diagnóstico inicial](../atualizacoes/fundacao-v1/INITIAL_DIAGNOSIS.md) preservam esse estado anterior, sem representá-lo como arquitetura ativa.

## PLANEJADO — desenho inicial

```text
Cliente Windows / Web / Mobile e portais futuros
                         |
              API central autenticada
                         |
                 Monólito modular
          Core + Financeiro Básico obrigatórios
        Módulos opcionais / add-ons / adapters
           Fiscal tecnicamente independente
                         |
          Banco transacional e arquivos protegidos

Edge opcional futuro ↔ API central
  cache limitado, fila local, dispositivos e sincronização
```

A nuvem será autoridade para identidade, autorização, assinatura e dados oficiais. O executável Windows é cliente e ponto de integração com dispositivos; não distribui o código completo do backend central. A tecnologia do executável é **A DEFINIR**.

Monólito modular é a preferência inicial: uma aplicação de servidor, com módulos e contratos explícitos. Separação em serviços só com necessidade demonstrada. Não há adoção automática de filas distribuídas, Kubernetes ou microserviços.

## Limites planejados

### Printing & Devices e Commerce Hub — diretrizes de 02/10/2026

São módulos futuros do mesmo monólito modular; não exigem microserviços nem filas distribuídas agora. [Print Service](PRINTING_AND_DEVICES.md) recebe documentos/versionamento, coordena jobs/destinos e usa adapters de driver/protocolo; dispositivos de entrada têm contratos próprios. Venda, Compra e Logística não conhecem fabricante. Fiscal emite/autoriza; impressão apenas representa o documento autorizado quando aplicável.

[Commerce Hub](COMMERCE_HUB.md) traduz cada canal/conexão para pedidos/eventos internos, mantém vínculos de anúncio/variação e projeções de estoque/preço, sem lógica de fornecedor no Core. Estoque/reservas e efeitos financeiros ficam nos domínios existentes; Logística cuida de fulfillment e solicita documentos ao Print Service compartilhado. Storefront próprio futuro também usa esse núcleo.

Chamadas externas/hardware ocorrem depois da transação comercial, com trabalho durável e efeitos idempotentes; inbox/outbox são opções planejadas, sem escolha de infraestrutura nesta etapa. Falha externa não repete venda/baixa/emissão; resultado físico ou remoto desconhecido exige reconciliação/revisão. Catálogo por unidade, snapshots restantes e contratos inteiros atuais são dependências a evoluir, não incompatibilidades que exijam refatoração agora. Desktop/Edge aceita somente comandos autenticados e limitados, nunca execução remota genérica. Ver [decisões](DECISIONS.md).

| Camada | Responsabilidade |
| --- | --- |
| Interface | Apresentação, entradas, estado de interação e acessibilidade |
| Transporte/API | Contratos, autenticação, contexto de acesso, validação de formato e respostas |
| Aplicação/domínio | Regras, estados, autorização por operação e coordenação transacional |
| Persistência | Integridade, relações, migrações, consultas e concorrência |
| Conectores | Tradução de fornecedores, credenciais e eventos externos |
| Edge | Execução offline permitida, dispositivos, fila e reconciliação com a nuvem |

Módulos dependem de contratos explícitos, não de mutação arbitrária do estado global. Cálculos puros compartilháveis podem ser extraídos progressivamente para um lugar próprio; não mover todos os arquivos nesta etapa.

Na evolução de Produtos, Compras, Estoque e Vendas, preservar a representação exata de quantidades e unidades existentes sem limitar o modelo SQL a unidades inteiras. Precisão/escala, arredondamento e conversões comerciais precisam de contratos definidos antes de habilitar operações fracionadas; ver [diretriz de dados](DATABASE.md#quantidades-e-unidades-de-medida-planejado). O módulo fiscal brasileiro permanece **PLANEJADO**, com regras e contratos isolados do domínio comercial.

## Estratégia de transição PLANEJADA

1. **ATUAL:** baseline V0.12 preservada, migração conferida e regras comerciais reaproveitadas.
2. **ATUAL:** usuários, empresas/unidades, vínculos, RBAC, contexto e auditoria local.
3. **ATUAL / HOMOLOGADO B:** SQLite, importação transacional e seis agregados SQL/espelhos, migrations 001–010; backup/retenção e restore sintético isolado existentes, operação de recuperação da loja pendente.
4. **ATUAL:** isolamento/autorização integrados às rotas locais; evidências e limites no [relatório V1](../atualizacoes/fundacao-v1/FOUNDATION_V1_REPORT.md).
5. **ATUAL no código V1.1:** consultas menores/DTOs/paginação e cadastros/venda direta com resposta limitada; expandir esses contratos e otimizar comandos dos módulos restantes.
6. Próxima proposta isolada: fase B/replay legado; C–E especificam hierarquia, controles e dispositivos antes de novas migrations/modelos.
7. F/G retomam agregados/React comercial após estabilização pertinente; cloud, Agente Local/offline/fiscal/updater seguem especificações próprias. O [roadmap vigente](ROADMAP.md) substitui sequências anteriores, sem autorização automática.

Não expor simplesmente o servidor atual à internet. O desenho de implantação inclui TLS, secrets, logs, backups com restauração e controles descritos em [segurança](SECURITY.md). Ver [decisões](DECISIONS.md) para as escolhas ainda abertas.
