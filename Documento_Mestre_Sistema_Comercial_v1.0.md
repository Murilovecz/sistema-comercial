# DOCUMENTO MESTRE — Sistema Comercial / ERP SaaS Modular

**Versão:** 1.0  
**Data:** 05/10/2026  
**Status:** Base conceitual validada; especificações técnicas detalhadas ainda em elaboração.

> Este arquivo é a versão textual de referência. O DOCX é a versão formatada principal.


| Versão do documento | 1.0 |
| --- | --- |
| Data de consolidação | 05/10/2026 |
| Status | Base conceitual validada; especificações técnicas detalhadas ainda em elaboração |
| Arquitetura-base | Monólito modular, API-first, cloud-authoritative, cliente/Agente Local com operação offline controlada |
| Finalidade | Referência oficial antes da retomada da implementação com Codex |

> Este documento consolida as decisões de produto, arquitetura, operação, dados e segurança já discutidas e validadas. Ele não substitui especificações fiscais/jurídicas nem fixa números que ainda dependem de testes, custo, risco ou contrato.
1. Status e princípios do produto
2. Modelo organizacional e multiempresa
3. Arquitetura de produto e módulos
4. Contrato, entitlement, permissão, escopo e estação
5. Pessoas, organizações, produtos e serviços
6. Precificação, promoções, descontos e alçadas
7. Vendas, estoque, compras e operações físicas
8. Serviços, OS, financeiro, DRE e relatórios
9. Tarefas, workspaces e automações
10. Fiscal e integrações
11. Agente Local, offline, sincronização e estações
12. Atualizações, distribuição e continuidade
13. Inteligência de Mercado e normalização de dados
14. Futuro produto de Finanças Pessoais
15. Arquitetura de segurança — princípios
16. Segurança 1–14 e chaves físicas FIDO2/WebAuthn
17. Tier 0, engenharia reversa e raio de explosão
18. Pontos legais, quantitativos e técnicos ainda abertos
19. Governança de desenvolvimento e retomada com Codex
20. Checklist de coerência e próximos passos

# 1. Status e princípios do produto

**DECISÃO FECHADA: A plataforma será um único ERP/SaaS modular, capaz de atender operações pequenas, médias e maiores sem criar produtos tecnicamente separados por porte.**
A mesma base deverá crescer por módulos contratados, permissões, governança, número de unidades, infraestrutura local e complexidade operacional. Presets de segmento e de governança são configurações iniciais, não sistemas diferentes.
A arquitetura-base permanece um monólito modular enquanto essa opção continuar oferecendo o melhor equilíbrio entre velocidade, confiabilidade, manutenção e custo. Fronteiras de domínio devem ser claras para permitir evolução futura sem obrigar uma migração prematura para microserviços.
**DECISÃO FECHADA: A nuvem é a autoridade oficial do sistema. Cliente Windows, navegador, PDV, tablet e Agente Local são participantes controlados, nunca autoridades finais.**
- Backend é autoridade para identidade, permissão, escopo, entitlement e validação de operações.
- Deny-by-default em controles de acesso.
- Dados financeiros e quantidades devem usar representação exata, evitando float binário em regras críticas.
- Atomicidade, idempotência e auditoria são requisitos estruturais.
- O sistema deve evoluir incrementalmente, sem recriação desnecessária do produto existente.

## 1.1 Presets de governança

Os presets Simples, Profissional e Corporativo são pontos de partida. Eles configuram maior ou menor formalidade em aprovações, segregação de funções e controles, mas o cliente permanece na mesma plataforma.
**DECISÃO FECHADA: O preset não concede autoridade por cargo; a autoridade real é sempre resultado de permissões + escopo + políticas/alçadas.**

# 2. Modelo organizacional e multiempresa

**DECISÃO FECHADA: Hierarquia oficial: CONTA/ORGANIZAÇÃO → ENTIDADE LEGAL/TITULAR (PF ou PJ) → UNIDADE.**
    CONTA / ORGANIZAÇÃO (tenant)
    ├─ ENTIDADE LEGAL A — PF
    │    └─ Unidade 01
    └─ ENTIDADE LEGAL B — PJ
    ├─ Unidade 02
    └─ Unidade 03
Uma conta pode conter várias entidades legais PF e/ou PJ. Cada unidade pertence a uma única entidade legal. O histórico preserva a entidade legal responsável no momento do fato; migrar de PF para PJ não reescreve operações antigas.
Um login pode participar de múltiplas entidades e unidades, mas somente dentro do tenant e dos escopos explicitamente autorizados.
**DECISÃO FECHADA: Descobrir ou alterar IDs de tenant, entidade ou unidade nunca concede acesso. Toda troca de contexto é revalidada pelo backend.**

## 2.1 Identidades e numeração

Registros internos usam IDs globais não previsíveis, enquanto numerações operacionais amigáveis podem possuir prefixos por entidade/unidade. Numerações fiscais são próprias e não devem ser confundidas com numeração interna.

# 3. Arquitetura de produto e módulos

A plataforma é organizada em Core obrigatório, Financeiro Básico obrigatório, módulos de negócio opcionais, add-ons e integrações.

## 3.1 Core obrigatório

**DECISÃO FECHADA: O Core permanece sempre ativo e contém infraestrutura transversal, não módulos específicos de negócio.**
- Conta/tenant, entidades legais e unidades.
- Usuários, autenticação, sessões, permissões e escopos.
- Entitlements, configurações e políticas gerais.
- Base de Pessoas/Organizações e relacionamentos.
- Auditoria e histórico.
- Arquivos/anexos.
- Tarefas/agenda genérica.
- Notificações internas.
- Busca global permission-aware.
- Tags e campos personalizados.
- Infraestrutura de workflow/status.
- Infraestrutura de automações.
- Importação/exportação, versionamento, offline/sincronização e mecanismos de continuidade.

## 3.2 Financeiro Básico obrigatório

**DECISÃO FECHADA: Financeiro Básico é a principal capacidade empresarial sempre presente, mesmo quando Vendas, Estoque ou Produtos não estiverem contratados.**
- Contas a pagar e a receber.
- Caixa e contas financeiras internas.
- Categorias e centros de custo.
- Recorrências e previsões.
- Fluxo de caixa realizado e projetado.
- Estornos/reversões.
- Rateios.
- Relatórios financeiros básicos.
- DRE gerencial básica.
> Observação: A DRE é gerencial e não substitui demonstração contábil oficial. Números derivam de fatos e ajustes auditáveis, não de edição direta do relatório.

## 3.3 Módulos e add-ons


| Camada | Exemplos | Regra |
| --- | --- | --- |
| Módulos de negócio | Vendas/PDV, Produtos/Precificação, Estoque, Compras, Serviços/OS, CRM, Fiscal, Produção, Logística/Entrega | Ativados por entitlement conforme pacote/necessidade. |
| Especializações | Restaurante/Delivery, E-commerce, nichos futuros | Reutilizam a mesma plataforma e domínios; não viram sistemas isolados. |
| Add-ons | BI/Relatórios Avançados, automação avançada, Fidelidade/Clube, recursos premium de comissão, tracking | Capacidades adicionais sobre módulos existentes. |
| Integrações | iFood, WooCommerce, WhatsApp, e-mail/SMS, ESL, carriers, gateways, futuras conexões bancárias | Adaptadores independentes; falha de um provedor não deve derrubar a operação central. |


# 4. Contrato, entitlement, permissão, escopo e estação

    CONTRATO
    ↓ direitos comerciais
    ENTITLEMENT
    ↓ ativação técnica no backend
    PERMISSÃO
    ↓ quem pode fazer
    ESCOPO
    ↓ onde pode fazer
    ESTAÇÃO
    ↓ contexto operacional do dispositivo
**DECISÃO FECHADA: O backend valida todas as camadas; ocultar botão na interface nunca é considerado mecanismo suficiente de segurança.**
Estados conceituais de entitlement podem incluir NOT_ENTITLED, TRIAL, ACTIVE, CANCELLATION_SCHEDULED, HISTORICAL_READ_ONLY e SUSPENDED. O conjunto definitivo será formalizado em especificação técnica.
Desativar módulo não apaga fatos históricos. Durante a retenção aplicável, o sistema pode oferecer histórico/read-only, bloqueando novas operações, automações e integrações daquele módulo.

## 4.1 Assinatura e inadimplência

A cobrança e os efeitos de inadimplência serão tratados pelo backend, não por arquivo local. Foi discutida uma continuidade emergencial limitada para evitar paralisar totalmente um comércio, especialmente o PDV, mas sua implementação comercial e jurídica permanece pendente.
**DECISÃO FECHADA: Carência comercial e janela máxima de autorização offline são conceitos distintos.**
> Observação: Juros, multa, imputação de pagamentos, renegociação, continuidade e cobrança devem passar por revisão jurídica antes de virar regra de produção.

# 5. Pessoas, organizações, produtos e serviços

A base cadastral usa uma entidade comum de Pessoa/Organização, com subtipo PF/PJ e relacionamentos múltiplos.
- Papéis de relacionamento possíveis: Cliente, Fornecedor, Parceiro, Afiliado, Consultor, Representante, Prestador, Transportadora etc.
- Uma mesma pessoa/organização pode ter vários papéis sem cadastro duplicado.
- CRM é módulo opcional sobre a base Core.
- Consumidor anônimo pode comprar sem ser obrigado a virar registro de CRM.
- CPF na nota é identificador transacional/fiscal e não implica cadastro permanente por si só.

## 5.1 Produtos

**DECISÃO FECHADA: Produtos não pertencem ao Core. Produto pode controlar estoque ou não; variantes comercialmente distintas possuem SKU próprio.**
- Múltiplos códigos de barras por variante/apresentação são permitidos.
- Código do fornecedor é separado do SKU interno.
- Família/categoria hierárquica é suportada.
- Nome original do cliente é preservado separadamente da identidade normalizada para analytics.

## 5.2 Serviços

**DECISÃO FECHADA: Serviço é entidade própria e não uma “variante de produto”. Operações podem misturar produtos e serviços por meio de uma abstração comercial comum.**
Serviços podem ter preço fixo/referência, preço variável/orçamento e preço específico por profissional quando necessário. Experiência do profissional pode participar de recomendação, mas nunca determinar preço automaticamente por uma regra simplista.

# 6. Precificação, promoções, descontos e alçadas

O motor de preços será formalizado em camadas determinísticas.
1. Resolver preço de referência/base no contexto de produto/serviço, unidade, canal, apresentação/variante e profissional quando aplicável.
1. Determinar condições comerciais automáticas elegíveis (promoção pública, clube/fidelidade, contrato/segmento, quantidade, campanha, cupom, pacote etc.).
1. Resolver conflitos por política; condições não são empilhadas cegamente.
1. Aplicar desconto manual por último, sujeito à alçada e às proteções definidas.
1. Registrar proveniência/versão da regra utilizada para histórico e auditoria.
**DECISÃO FECHADA: Toda regra comercial deve responder: QUEM é elegível, ONDE/EM QUÊ se aplica, QUAL é a ação e COM O QUE pode combinar.**

## 6.1 Desconto manual

**DECISÃO FECHADA: A alçada manual do funcionário é ancorada no preço de referência, não no preço já promocional.**
    Preço de referência: R$ 80,00
    Alçada manual do usuário: 5%
    Piso pessoal: R$ 76,00
    Promoção autorizada pela empresa: R$ 60,00
    → usuário pode vender a R$ 60,00
    → promoção NÃO cria mais 5% sobre R$ 60,00
    → abaixo de R$ 60,00 requer autorização superior/política específica

## 6.2 Governança e alçadas

As alçadas são configuráveis por ação, valor, percentual, unidade, escopo e política. Cargo não é atalho automático para poder.

| Exemplo de ação | Supervisor | Gerente | Diretor | Dono |
| --- | --- | --- | --- | --- |
| Cancelamento | até R$ 200 | até R$ 1.000 | até R$ 10.000 | acima conforme política |
| Desconto manual | regra própria | regra própria | regra própria | regra própria |
| Ajuste de estoque | regra própria | regra própria | regra própria | regra própria |

**DECISÃO FECHADA: policy.manage é uma permissão separada. Um gerente não aumenta a própria alçada só por ser gerente.**

# 7. Vendas, estoque, compras e operações físicas

Vendas/PDV é opcional e deve integrar Produtos, Estoque, Financeiro, Fiscal e fidelidade quando esses domínios estiverem contratados, sem tornar-se dono dos dados deles.

## 7.1 Estoque como razão de movimentos

**DECISÃO FECHADA: Saldo de estoque é consequência de movimentos/eventos; não existe “editar saldo” sem gerar ajuste auditado.**
    Saldo anterior 100
    + Entrada 60
    - Saída 10
    = Saldo 150
    Contagem física = 145
    → ajuste auditado = -5

## 7.2 Estoque negativo e divergência

**DECISÃO FECHADA: Se o item existe fisicamente, uma divergência sistêmica não deve impedir automaticamente a venda. A venda pode gerar saldo negativo e uma ocorrência para investigação.**
A política precisa distinguir permissão para vender, severidade da divergência e tarefas de correção. O saldo negativo não deve ser mascarado silenciosamente.

## 7.3 Estados e disponibilidade

- Físico total.
- Reservado: compromisso, ainda físico.
- Disponível: físico menos reservado/bloqueado/indisponível.
- Separado: pode permanecer físico, mas em localização/estado de reserva/expedição.
- Em trânsito: saiu da origem e ainda não foi recebido no destino.
- Bloqueado, quarentena, danificado: físico porém indisponível.
**DECISÃO FECHADA: As propriedades do estado/localização determinam se a quantidade conta como física e/ou disponível; não haverá um único “número mágico” hardcoded.**

## 7.4 Transferências

    Unidade A
    ↓ saída confirmada
    EM TRÂNSITO
    ↓ recebimento confirmado
    Unidade B
Custos logísticos podem ser acompanhados separadamente e só entram no custo do produto mediante política explícita.

## 7.5 Reservas

**DECISÃO FECHADA: Reserva não reduz o estoque físico. Reduz o disponível. Cancelar reserva apenas libera a reserva, sem criar entrada fictícia de estoque.**

## 7.6 Lotes, validade e serial

Controle de lote/validade é opcional por produto. FEFO pode ser recomendado, mas o sistema não deve afirmar certeza sobre o lote efetivamente vendido quando o processo não o capturou. Serial é individual quando habilitado.

## 7.7 Embalagens e apresentações

Quando possível, a autoridade de estoque permanece na unidade-base. Uma apresentação comercial com fator de conversão pode possuir código de barras e preço próprios sem exigir estoque duplicado. Estoque por embalagem separada só deve existir quando houver necessidade operacional/legal real.

## 7.8 Compras e recebimento

    Pedido de compra
    ↓
    NF-e/XML pré-preenche
    ↓
    Conferência física
    ↓
    Recebimento confirmado
    ├─ estoque/lotes
    ├─ contas a pagar
    └─ auditoria/tarefas
**DECISÃO FECHADA: XML fiscal sozinho não altera estoque. O que entrou fisicamente é confirmado em recebimento. Divergências preservam documento original e quantidade efetivamente recebida.**

# 8. Serviços, OS, financeiro, DRE e relatórios

A OS/atendimento será apresentada como um bloco coerente ao usuário, reunindo orçamento, itens, responsáveis, aprovações, compras, pagamentos, fiscal, anexos e timeline. Internamente, cada fato mantém identidade própria.
**DECISÃO FECHADA: Histórico de orçamento nunca é sobrescrito. Aprovação, execução, faturamento e emissão fiscal podem ocorrer parcialmente.**

## 8.1 Financeiro

- Venda/processo pode gerar contas a receber ou movimento de caixa.
- Compra pode gerar contas a pagar.
- Pagamentos parciais e mistos são suportados.
- Recorrência de evento e previsão de valor são conceitos separados; variável recorrente não vira “realizado” automaticamente.
- Movimentos liquidados não são apagados; correção ocorre por estorno/reversão vinculada.
- Centros de custo são estruturais; categorias podem ser configuráveis com mapeamento interno padronizado.

## 8.2 DRE gerencial

**DECISÃO FECHADA: DRE é gerada a partir dos fatos. Gestor não edita números diretamente; corrige a origem ou lança ajuste gerencial auditado.**
Consolidação hierárquica: Unidade → Entidade Legal → Grupo. Intercompany precisa ser identificado e eliminado corretamente apenas na consolidação, preservando os relatórios individuais.
Comentários gerenciais são separados dos números, versionados e auditados. Relatórios antigos não são silenciosamente reescritos quando fatos posteriores corrigem o período; gera-se nova versão quando necessário.

## 8.3 Relatórios

Relatórios básicos pertencem ao produto operacional. BI/Relatórios Avançados é add-on. Métricas básicas incluem quantidade, receita bruta, descontos/devoluções, receita líquida, CMV/COGS, lucro bruto, margem bruta, markup realizado e participação.
> Observação: Lucro bruto não deve ser rotulado como lucro operacional.
Exportações obedecem permissão. Formatos: PDF para apresentação/documentos, XLSX para análise humana, CSV para dados tabulares e JSON para APIs. Saída completa de conta pode ser entregue em pacote estruturado com CSVs, documentos originais/anexos e README.

# 9. Tarefas, workspaces e automações

Tarefa/agenda é infraestrutura Core. Os módulos reutilizam a mesma entidade para fluxos diferentes.
- Responsável
- Data/hora e prazo
- Prioridade
- Status
- Origem
- Lembrete
- Recorrência
Workspaces são contextuais por função, permissão e estação. Caixa pode ter PDV em tela cheia; repositor pode ver tarefas de reposição; dono pode ter painel executivo compacto.

## 9.1 Automação

**DECISÃO FECHADA: O motor genérico seguirá evento/condição/ação, com idempotência, prevenção de loops/reentrada, auditoria, versionamento, permissões e classificação de risco.**
Primeira fase: automações codificadas pelos módulos sobre o motor comum. Posteriormente, builder no-code controlado com QUANDO/SE/ENTÃO e simulação antes da ativação. Nada de código arbitrário pelo cliente na fase inicial.

# 10. Fiscal e integrações

**DECISÃO FECHADA: Fiscal é domínio independente por baixo e transversal na experiência do usuário por cima.**
    Venda / OS / Processo
    ↓
    Motor Fiscal
    ↓
    Adaptador aplicável
    (NF-e / NFC-e / NFS-e / futuro)
Venda/processo e documento fiscal são registros distintos. Documentos fiscais têm identidade, estados e numerações legais próprias. A Central Fiscal reúne documentos, rejeições, contingência, cancelamentos, filas e configurações.
> Observação: Mecanismos legais e de contingência variam por documento e jurisdição; não serão hardcoded como uma regra universal brasileira.

## 10.1 Integrações

Integrações são adaptadores independentes sobre capacidades internas. Uma integração falhar não deve derrubar a operação central nem outra integração.
Marketplaces/delivery precisam registrar preço por canal, comissões/taxas, promoções, repasses e reconciliação estimada versus realizada. Taxas não serão hardcoded globalmente.

# 11. Agente Local, offline, sincronização e estações

O Agente Local é coordenador temporário da unidade, não autoridade final. Ele dá continuidade a operações locais, dispositivos, fila fiscal e sincronização.

| Porte/ambiente | Modelo conceitual |
| --- | --- |
| Micro / 1 PC | App e Agente podem coexistir na mesma máquina, com proteção e isolamento lógico. |
| Pequeno / 2–5 PCs | Estações críticas mantêm capacidade local; LAN sincroniza; PDV não depende do PC do dono. |
| Médio/grande | Agente Local dedicado por unidade coordena LAN, filas, dispositivos, fiscal e sync; estações críticas podem ganhar fallback limitado futuramente. |


## 11.1 Conflitos offline


| Classe | Política |
| --- | --- |
| Fatos/eventos que realmente ocorreram | Preservar todos os fatos válidos e reconciliar. Ex.: duas vendas offline da última unidade → estoque negativo/divergência; não apagar venda. |
| Registros editáveis | Optimistic concurrency/base revision. Campos diferentes podem mesclar; mesmo campo conflitante exige resolução explícita. |
| Configuração crítica | Alteração cloud-only: permissões, alçadas, entitlements, assinatura, administração, segurança/fiscal crítico. |

Cada operação offline carrega identidade única/idempotência, tenant, entidade/unidade, estação, usuário, tempo local conhecido, base revision e referência à autorização offline usada.

## 11.2 Autorização offline

**DECISÃO FECHADA: Offline só opera sob autorização temporária assinada pela nuvem, vinculada a estação, tenant/unidade e capacidades permitidas. A estação não fabrica nem renova a própria autorização.**
O relógio local não é fonte absoluta de verdade. Serão usados sinais como último tempo confiável, tempo monotônico e detecção de regressão; inconsistências podem exigir validação online.
**DECISÃO FECHADA: Ações administrativas críticas ficam online-only.**

## 11.3 Estações

**DECISÃO FECHADA: Toda estação com capacidade operacional/offline é formalmente registrada. Copiar a pasta do ERP para outro computador não clona a identidade da estação.**
A identidade pode usar mecanismos de proteção do Windows e TPM quando disponível. O cache local contém somente o subconjunto necessário à operação daquela estação/unidade.

# 12. Atualizações, distribuição e continuidade

**DECISÃO FECHADA: Atualizações serão centralizadas, assinadas e distribuídas progressivamente pela nuvem.**
    Desenvolvimento
    ↓ código aprovado
    Pipeline de release
    ↓ testes
    Build oficial
    ↓ assinatura
    Cloud / serviço de updates
    ↓ interno
    ↓ piloto
    ↓ rollout progressivo
    Clientes
O download ocorre em segundo plano. A versão atual continua operando até o pacote estar integralmente baixado e validado. Na reinicialização, um Updater separado valida novamente a assinatura e aplica a versão em ponto seguro.
Agente Local segue fluxo semelhante, sem interromper transações críticas no meio. Migrações de banco requerem checkpoint/backup, compatibilidade e validação próprias.
**DECISÃO FECHADA: Seu PC inicia/aprova o release; o artefato de produção é construído, testado e assinado pela infraestrutura de release, não copiado diretamente da máquina de desenvolvimento.**

# 13. Inteligência de Mercado e normalização de dados

**DECISÃO FECHADA: Inteligência de Mercado/Ciência de Dados será produto B2B separado do ERP operacional.**
Dados operacionais de cada tenant permanecem privados. O produto estatístico trabalha com extração controlada, normalização, minimização e agregação. Nunca deve expor preço de compra, margem ou custo identificável de um concorrente específico.

## 13.1 Dados elegíveis

- Vendas realizadas e quantidades.
- Preço realizado/base/promocional e condição comercial.
- Produto/serviço normalizado, categoria, marca, apresentação, unidade de medida.
- Data/período, cidade/região e canal.
- Devoluções/cancelamentos agregáveis.
- Em camada mais restrita e somente com forte agregação: custos de compra, volumes, giro/ruptura, perdas, logística e lead time.
Excluídos inicialmente: identificação de consumidores, contatos pessoais, endereço pessoal, dados bancários, credenciais/tokens, documentos pessoais, anexos/notas livres, salários/comissões individuais e contratos individualizados.
**DECISÃO FECHADA: Backups não alimentam analytics. A pipeline de analytics extrai somente campos elegíveis do domínio operacional.**

## 13.2 Amostragem e neutralidade

Cada indicador deverá exigir número mínimo de contribuintes independentes, observações, diversidade, limite de concentração, cobertura temporal e qualidade. Os limiares serão específicos por indicador e ainda não estão congelados.
Se a cidade não tiver amostra suficiente, o sistema pode ampliar a região e informar isso explicitamente. Sem cobertura suficiente, não mostra estatística.
**DECISÃO FECHADA: O produto não recomendará/promoverá mercados específicos como parte da análise econômica. Um eventual localizador comercial seria produto/recurso separado e opt-in.**

## 13.3 Normalização

Preservar o nome original e manter identidade canônica separada. Campos úteis incluem GTIN, marca, taxonomia/categoria, quantidade/conteúdo, UOM e embalagem/apresentação. Mapeamentos são versionados e reprocessáveis; fatos não são reescritos.
**DECISÃO FECHADA: Normalização nunca bloqueia venda. Alta confiança pode aplicar automaticamente; baixa confiança pede confirmação quando oportuno.**

# 14. Futuro produto de Finanças Pessoais

**DECISÃO FECHADA: Gestão Financeira Pessoal será produto separado do ERP, não um módulo interno do negócio empresarial.**
Pode futuramente integrar Open Finance por abstração de provedor autorizado, inicialmente em modo de leitura. Conceitos: contas, cartões, crédito, investimentos, categorização, transferências/duplicidades, fluxo de caixa, orçamento, metas, posição financeira, inflação pessoal e estimativa regional de cesta.
**DECISÃO FECHADA: Dados pessoais de Open Finance não entram automaticamente na Inteligência de Mercado empresarial; finalidade e governança são separadas.**

# 15. Arquitetura de segurança — princípios

**DECISÃO FECHADA: Assumir que navegador, app Windows, estação, LAN e até Agente Local podem ser comprometidos. Segurança deve limitar o raio de explosão em vez de depender de endpoint perfeito.**
    Endpoint comprometido
    ↓
    Pode tentar agir com credenciais legítimas daquele contexto
    ↓
    Backend continua validando tenant + escopo + permissão + entitlement + dispositivo + operação
    ↓
    Sem caminho direto para banco, superadmin, outros tenants ou segredos de produção
A engenharia reversa será dificultada, mas não será tratada como impossibilidade. Descobrir endpoints, protocolo ou lógica de UI não concede autoridade.

# 16. Segurança 1–14 e chaves físicas FIDO2/WebAuthn


## 16.1 Segurança 1 — Cloud/Backend

**DECISÃO FECHADA: Nenhum componente instalado no cliente acessa diretamente o banco da nuvem. Toda operação passa por APIs. Banco permanece privado; backend trabalha em deny-by-default. O plano administrativo da plataforma é separado do plano dos clientes.**

## 16.2 Segurança 2 — Isolamento multi-tenant

**DECISÃO FECHADA: Isolamento é obrigatório em autenticação, autorização, consultas, arquivos, cache, eventos, relatórios e exportações. IDs informados pelo cliente são sempre revalidados. Testes cross-tenant tornam-se obrigatórios.**

## 16.3 Segurança 3 — Identidade, sessões e MFA

**DECISÃO FECHADA: Contas individuais. Sessões revogáveis e contextualizadas por usuário/dispositivo/tenant/unidade. MFA/passkeys proporcionais ao risco; reautenticação para ações sensíveis. Bloqueio de usuário invalida sessões.**

## 16.4 Segurança 4 — Estações e app Windows

**DECISÃO FECHADA: App roda com privilégio mínimo, não carrega segredos mestres e mantém somente dados locais necessários. Identidade de estação é própria e revogável. Atualizações somente assinadas. Arquivos perigosos não são executados como documentos pelo ERP.**

## 16.5 Segurança 5 — Agente Local

**DECISÃO FECHADA: Agente possui identidade criptográfica própria por instalação, conta de serviço com privilégio mínimo, APIs fechadas/autenticadas, nenhuma pasta administrativa aberta e nenhuma credencial master da nuvem. Comprometer um agente não deve abrir outros tenants.**

## 16.6 Segurança 6 — Offline

**DECISÃO FECHADA: Autorização offline assinada, temporária e vinculada ao contexto. Relógio local não é autoridade. Ações críticas são online-only. Expiração sem validação leva a fail-closed nas capacidades protegidas.**

## 16.7 Segurança 7 — Atualizações e supply chain

**DECISÃO FECHADA: Artefatos oficiais são assinados; alteração de código, aprovação, assinatura e publicação podem ser separadas. Chaves de assinatura não ficam no Git nem no PC comum. Releases usam canais/rollout e dependências controladas; SBOM é desejável.**

## 16.8 Segurança 8 — Segredos e credenciais

**DECISÃO FECHADA: Segredos ficam em cofre apropriado, fora do código/cliente/log. Privilégio mínimo, separação por ambiente, rotação e auditoria. Tokens/certificados de clientes são dados de alta sensibilidade. Evitar chave mestra universal.**

## 16.9 Segurança 9 — Banco, backups e ransomware

**DECISÃO FECHADA: Produção e recuperação são separadas. PITR e backups versionados/imutáveis conforme infraestrutura. Credenciais operacionais não podem destruir todo o histórico. Backups são periodicamente restaurados e testados.**

## 16.10 Segurança 10 — Rede e comunicação

**DECISÃO FECHADA: Comunicação relevante autenticada e criptografada. Agente não fica exposto diretamente à internet; inicia conexões externas. LAN é potencialmente hostil. Segmentação por VLAN/firewall é recomendada conforme porte.**

## 16.11 Segurança 11 — Engenharia reversa

**DECISÃO FECHADA: Build de produção endurecido, assinatura, minificação/obfuscação seletiva, anti-tamper onde valer o custo e remoção de debug. Nenhuma modificação local concede licença, módulo ou privilégio no backend.**

## 16.12 Segurança 12 — Malware e endpoint comprometido

**DECISÃO FECHADA: No pior caso, malware pode alcançar dados/poderes legitimamente disponíveis ao usuário naquele endpoint, mas não deve escalar automaticamente para outros tenants, cloud ou privilégios superiores. Dispositivos podem ser colocados em quarentena.**

## 16.13 Segurança 13 — Auditoria e trilha forense

**DECISÃO FECHADA: Eventos sensíveis e relevantes geram trilha append-only com ator, contexto, dispositivo, sessão, horário, antes/depois quando aplicável e motivo. Tentativas negadas também podem ser evidência. Logs críticos podem ir para armazenamento separado.**

## 16.14 Segurança 14 — Resposta a incidentes

**DECISÃO FECHADA: Fluxo: detectar → conter → preservar evidências → erradicar causa → recuperar → monitorar → post-mortem. Ações emergenciais são granulares, credenciais expostas são rotacionadas e restauração é baseada em evidência, não apenas no backup mais recente.**

## 16.15 Chaves físicas FIDO2/WebAuthn

**DECISÃO FECHADA: Perfis sensíveis podem usar security keys físicas para step-up authentication em operações críticas; para administração de produção da plataforma, a tendência é serem obrigatórias.**
    Sessão ativa
    ↓ ação crítica
    Cloud envia desafio
    ↓
    Security key física + verificação local (PIN/biometria quando aplicável)
    ↓ assinatura criptográfica
    Cloud valida
    ↓ operação autorizada
A chave privada não sai do autenticador. Não há “código especial do gerente” reutilizável. Chaves de reserva e processo seguro de revogação/recuperação devem ser previstos.

# 17. Tier 0, engenharia reversa e raio de explosão

Tier 0 reúne componentes cujo comprometimento pode afetar grande parte da plataforma. Recebem controles superiores aos endpoints de cliente.
- Contas administrativas de produção.
- Sistema central de identidade/autorização.
- Chaves de assinatura e infraestrutura de release.
- Cofre de segredos.
- Controle de entitlements.
- Administração da infraestrutura.
- Backups críticos e mecanismos de recuperação.
**DECISÃO FECHADA: Comprometer um PC ou Agente Local não deve conceder acesso direto a Tier 0. Um atacante precisaria superar barreiras independentes adicionais.**
A arquitetura deve preferir identidades por instalação/serviço, tokens curtos, privilégios mínimos e revogação granular em vez de credenciais compartilhadas universais.

# 18. Pontos legais, quantitativos e técnicos ainda abertos

A arquitetura está suficientemente consolidada para especificação, mas alguns valores e regras não devem ser inventados antes de testes, custo ou análise jurídica.

## 18.1 Números ainda não congelados


| Tema | Status |
| --- | --- |
| Tempo máximo offline | Aberto; hipótese anterior de ~72h é apenas referência, não decisão final. |
| RPO/RTO | Aberto por plano/SLA e custo de infraestrutura. |
| Retenção de backups | Aberto. |
| Retenção de logs/auditoria | Aberto por categoria e obrigação. |
| Retenção pós-cancelamento | Aberto. |
| Rate limits | A definir por endpoint e comportamento real. |
| Janelas de atualização | A definir por criticidade e operação. |
| Limiares antifraude | A definir com telemetria real. |
| Amostragem estatística | A definir por indicador: contribuintes, observações, concentração, período e qualidade. |
| SLA | A definir por plano/comercial. |


## 18.2 Questões jurídicas

- Participação padrão de clientes na base estatística: base legal, transparência, contratos, minimização e governança.
- Política de inadimplência, continuidade emergencial, juros, multa, imputação de pagamentos e renegociação.
- Retenção de dados, privacidade, termos de uso e responsabilidades das partes.
- Regras fiscais específicas e atualização normativa por documento/jurisdição.
- Critérios e obrigações de notificação em incidentes de segurança, quando aplicável.

## 18.3 Especificações técnicas ainda necessárias

1. Motor formal de preços e precedência/combinação de regras.
1. Máquina de estados e eventos do estoque.
1. Matriz operação × modo offline (permitida, restrita, online-only).
1. Modelo formal de entitlement, suspensão, cancelamento e historical read-only.
1. Modelo formal de autorização/segurança com requisitos testáveis.
1. Modelo fiscal por tipo de documento e adaptadores concretos.
1. Estrutura definitiva da DRE gerencial e consolidação.
1. Política de retenção/exportação de dados e arquivos.
1. Contratos de sincronização e conflitos do Agente Local.

# 19. Governança de desenvolvimento e retomada com Codex

**DECISÃO FECHADA: Codex é executor/implementador e pode sugerir soluções, mas suas recomendações não serão aceitas automaticamente. Cada relatório deve ser confrontado com este Documento Mestre.**
Critérios de avaliação de recomendações: evidência, alternativas, custo-benefício, risco, impacto arquitetural, segurança, performance, manutenibilidade e aderência ao roadmap.
Fluxo preferido: construção/melhoria em uma mudança por vez; homologação em rodada ampla; defeitos encontrados são corrigidos um a um com TDD e então a homologação necessária é repetida.
- TDD Red → Green → Refactor.
- Backend authority e fail-closed.
- Dados financeiros/quantidades exatos.
- Atomicidade, idempotência e auditoria em fluxos críticos.
- Não mascarar defeitos nem desabilitar testes para “passar”.
- Decisões destrutivas, mudança de stack, contratos externos e regras financeiras/fiscais ambíguas exigem decisão explícita do usuário.
- Não fazer commit/push sem autorização.

## 19.1 Estado técnico antes da pausa

O desenvolvimento estava na linha V1.3 de migração de frontend para React/TypeScript/Vite, com arquitetura, skeleton, integração SPA, cliente HTTP, sessão/contexto, login/logout, seleção de contexto e design system já implementados. O piloto de Produtos em React havia sido planejado, mas não deve ser presumido como concluído.
**DECISÃO FECHADA: Antes de retomar desenvolvimento de módulos, consolidar as especificações formais derivadas deste documento.**

# 20. Checklist de coerência e próximos passos

A revisão conceitual não identificou contradição estrutural que exija descartar a arquitetura existente. Tensões anteriores foram resolvidas da seguinte forma:

| Tema | Resolução consolidada |
| --- | --- |
| Core vs módulos | Core contém infraestrutura; Financeiro Básico é permanente; Vendas/Produtos/Estoque são opcionais. |
| Cloud vs offline | Cloud é autoridade; fatos legítimos offline são preservados e reconciliados. |
| Segurança vs operação | Controles são proporcionais ao risco; venda normal não recebe o mesmo atrito de uma ação administrativa crítica. |
| Fiscal | Domínio independente tecnicamente, experiência transversal operacionalmente. |
| Estoque negativo | Representa divergência real e dispara investigação; não é mascarado nem bloqueia automaticamente venda física válida. |
| Promoção vs desconto | Promoção autorizada não aumenta a alçada manual do funcionário. |
| Agente Local vs servidor | Agente coordena a unidade e continuidade, mas não substitui a autoridade cloud. |
| Engenharia reversa | Dificultada, mas a segurança real vem de autoridade no backend e ausência de segredos universais no cliente. |


## 20.1 Próxima sequência recomendada

1. Congelar este Documento Mestre como referência conceitual v1.0.
1. Criar uma Especificação Técnica de Segurança derivada dos 14 blocos, com requisitos e testes verificáveis.
1. Formalizar motor de preços, estoque, matriz offline, entitlement e autorização.
1. Criar roadmap técnico por incrementos, alinhado ao estado real do repositório.
1. Retomar Codex apenas após comparar o repo atual com as decisões consolidadas.
1. Implementar uma mudança por vez e homologar em rodadas amplas conforme o fluxo definido.

## 20.2 Regra de mudança deste documento

Qualquer decisão futura que contradiga este documento deve ser tratada explicitamente como alteração de arquitetura/produto. A mudança precisa identificar quais seções são afetadas e quais migrações/regras/testes precisam ser atualizados. O objetivo é evitar que decisões importantes se percam em conversas isoladas.

# Apêndice A — Princípios não negociáveis

- Backend é autoridade; cliente é não confiável.
- Multi-tenant deny-by-default e testado.
- Nenhum acesso direto do cliente ao banco cloud.
- Nenhum segredo mestre distribuído ao cliente.
- Entitlement, permissão, escopo e estação são controles distintos.
- Auditoria é append-only para eventos sensíveis.
- Offline usa autorização assinada e temporária.
- Fatos válidos ocorridos offline não são apagados para “ajustar” o sistema.
- Atualização e release são assinados e rastreáveis.
- Backups precisam provar restauração.
- Uma falha de endpoint deve ter raio de explosão limitado.
- Fiscal e jurídico não serão inventados pelo código.

# Apêndice B — Glossário mínimo


| Termo | Significado no projeto |
| --- | --- |
| Tenant / Conta / Organização | Limite principal de isolamento do cliente na plataforma. |
| Entidade legal / Titular | PF ou PJ legalmente responsável por operações. |
| Unidade | Estabelecimento/operação pertencente a uma entidade legal. |
| Entitlement | Capacidade tecnicamente ativada pela plataforma conforme direito comercial. |
| Permissão | Ação que uma identidade pode executar. |
| Escopo | Onde a permissão vale. |
| Estação | Dispositivo/contexto operacional registrado. |
| Agente Local | Coordenador local de continuidade, filas, dispositivos e sincronização. |
| Offline lease/autorização offline | Credencial temporária assinada que define capacidades válidas sem cloud. |
| Tier 0 | Componentes de maior impacto sistêmico, com controles máximos. |
| Step-up authentication | Nova confirmação de identidade exigida para ação mais sensível. |
| FIDO2/WebAuthn | Padrão de autenticação forte/passkeys e chaves físicas. |

> Versão 1.0 — consolidada em 05/10/2026. Próxima revisão deve ocorrer após a formalização das especificações técnicas abertas ou quando houver mudança explícita de decisão de produto/arquitetura.