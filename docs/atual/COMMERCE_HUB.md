# Commerce Hub / Omnichannel

**Referência vigente — 05/10/2026:** [Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md), especialmente §§2–4, 10–17, e [plano A–G](ROADMAP.md). Os contratos futuros aqui descritos são subordinados ao mestre; nenhum adapter/dispositivo/Agente ou entitlement foi implementado. Menções anteriores a empresa/Edge precisam de mapeamento formal tenant/entidade/unidade/Agente antes de schema ou contrato externo; não equiparar automaticamente `company_id` ao novo tenant. Fiscal é independente e transversal na experiência; impressão não emite. Cliente/Agente não confiáveis, identidade revogável, autorização offline assinada, cloud-only crítico, APIs sem acesso direto ao banco e efeitos externos idempotentes. Pacotes/canais não criam ERPs separados; credenciais centrais não vão ao cliente. Especificação e revisão precedem a implementação.

Diretriz de produto adotada em **02/10/2026**, inteiramente **PLANEJADA**. Fonte: [pedido integral do Murilo, itens 11–48](../briefings/PRINTING_COMMERCE_SOURCE.md). Não existem conectores reais, contratos de fornecedor ou sincronização omnichannel implementados.

## Objetivo e limites

Integrar loja física, site próprio, WooCommerce, loja de outro provedor, Mercado Livre, Shopee, outros marketplaces, WhatsApp e API própria aos mesmos domínios comerciais. Storefront próprio futuro também utiliza Commerce Hub e os módulos habilitados, sem outro estoque. Core Platform permanece transversal; Produtos, Vendas, Estoque e Compras são módulos opcionais.

```text
Canal externo → adapter da conexão → pedido interno padronizado
                                      ↓
                 Produtos / Vendas / Estoque / Financeiro Básico / Logística
                                      ↓
          disponibilidade, preços e resultados → adapter → canal
```

Commerce Hub coordena canais, catálogo, listings/mapeamentos, pedidos, inventário publicado, preços, fulfillment e reconciliação. A divisão é conceitual; não exige estas pastas nem serviços distribuídos. Produto/Estoque/Venda não conterão lógica específica de Mercado Livre, Shopee ou WooCommerce. Payloads/estados externos são traduzidos pelo adapter; cada domínio valida seus próprios comandos, com as regras transversais do Core.

## Contas, vínculos e identidade PLANEJADOS

Conexão de canal pertence à empresa, com várias contas do mesmo provedor permitidas: duas contas Mercado Livre ou duas lojas WooCommerce na mesma empresa. Não impor unicidade empresa+provedor. Unidade/alocação é configuração própria; não assumir que uma conta corresponde a uma única unidade.

Entidade futura de vínculo produto/variação ↔ anúncio identifica empresa, conexão, produto interno, variação interna quando existir e IDs externos. SKU auxilia mapeamento validado; nome não é chave. Preservar IDs de pedido, anúncio, variação, transação, envio, notificação e demais IDs relevantes. Namespace deve incluir empresa+conexão+tipo de recurso+ID externo; IDs iguais de contas diferentes não podem colidir.

Variações P/M/G/GG ou anel 16/18/20 têm SKU próprio segundo o mestre (§5.1); IDs externos são preservados conforme o canal. Modelagem atual de famílias/atributos não comprova variações omnichannel prontas. Estrutura física, escopo do catálogo e transição dos IDs atuais continuam **A DEFINIR** antes de compartilhar/publicar catálogo, sem unir registros pelo nome ou reabrir a decisão de identidade própria da variação.

## Autoridade por dado PLANEJADA

Cada adapter documentará autoridade, sentido de sincronização, estados, versões e resolução de divergências por campo. Referência inicial, sujeita ao contrato da integração:

| Dado | Autoridade pretendida / ressalva |
| --- | --- |
| Produto mestre | Módulo Produtos; importação externa exige política explícita de autoridade por campo |
| Estoque operacional/disponibilidade | Módulo Estoque; canal recebe projeção, não saldo independente |
| Pedido criado no canal | Canal informa origem/ID; pedido interno controla efeitos operacionais locais |
| Pagamento/status externo | Evidência do canal/provedor; confirmação não será inventada pelo sistema |
| Envio/rastreamento | Canal/logística conforme adapter |
| Resultado financeiro | Financeiro interno reconciliado com transações, taxas e evidências externas |
| Preço/promoção | Política definida por conexão/campo; promoção externa pode ser autoritativa |

Não resolver conflitos por “último registro vence” sem considerar domínio/versão. Evento antigo não desfaz estado final válido; quando necessário consultar a autoridade do canal. Autoridade configurável não autoriza escrita direta em tabelas de outro módulo.

## Estoque, reservas e unidades PLANEJADOS

Uma fonte central coerente de disponibilidade; não criar estoques independentes por marketplace/site/loja. Projeções, caches e alocações por canal serão derivadas e reconciliáveis. `available_to_sell` deve considerar saldo vendável, reservas, retenções e políticas aplicáveis. Exemplo didático: físico vendável 10, reserva 2, disponível 8; não substitui a regra final, nem ignora quarentena.

As funções locais [availableQuantity](../../public/workflow-core.js) e [physicalPosition](../../public/quarantine-core.js) e as reservas atuais são ponto de partida, não contrato omnichannel definitivo. Hoje `product.stock` representa vendável nesse fluxo, e o físico total inclui o retido; não descontar quarentena novamente desse vendável. Venda online pode reservar antes de pagamento/finalização: adapter traduz pedido, pagamento, cancelamento, expiração e fulfillment. Reserva, consumo e liberação devem ter efeito transacional e idempotente.

O mestre (§7.2) determina que divergência de estoque não bloqueie automaticamente uma venda física válida: saldo negativo e investigação precisam ser suportados. A implementação local ainda conflita com essa direção; nenhuma guarda será removida nesta rodada. Buffer por canal, fórmula, ordem de aplicação, alocação, validade de reserva e prioridades continuam **A DEFINIR**. Duas vendas da última unidade precisam de coordenação central. Publicação assíncrona em terceiros e operação offline mantêm risco de overselling; nuvem reduz o risco, não garante estoque remoto instantâneo.

Canal poderá consumir CD principal, Unidade 2 ou estoque agregado conforme configuração. Agregação requer regras de elegibilidade, reserva por unidade e transferência/expedição; não somar unidades indiscriminadamente. Quantidades fracionadas e unidades/conversões seguem [DATABASE](DATABASE.md), incluindo limites/capacidades de cada canal.

## Preços, promoções e resultados PLANEJADOS

Preço por canal sem duplicar produto: loja/site R$100, Mercado Livre R$115 e Shopee R$110 são exemplos, não preços definidos. Política por canal/conexão, tabela, vigência e arredondamento **A DEFINIR**. Promoções centrais, específicas e externas conservam origem/autoridade quando necessário.

Registrar comissões, frete subsidiado e outros custos, vinculados à venda/transação/conexão. Exemplo: venda R$100, comissão R$16, frete R$5, outros R$2 → líquido R$77. Regime, competência, provisão/liquidação, classificação e estornos **A DEFINIR**; não lançar custos duas vezes a partir de pedido e conciliação.

Financeiro/DRE usa dimensões de canal, conexão, unidade e classificações adequadas no mesmo núcleo financeiro. DRE total, física, e-commerce e por marketplace somente quando os dados permitirem, sem contabilidade duplicada. Dashboard futuro: vendas, pedidos, ticket médio, margem, taxas e cancelamentos por canal/produto/unidade/período; cálculo e permissões antes da implementação.

## Pedidos, cancelamentos e logística PLANEJADOS

Central de pedidos com origem/canal/conexão, cliente quando permitido/necessário, itens/variações, pagamento, entrega, status interno e IDs/estados externos preservados. Filtros Todos/Site/Mercado Livre/Shopee/Balcão/WhatsApp, com autorização e paginação. Pedido não equivale automaticamente a venda concluída, recebimento financeiro ou emissão fiscal.

Cancelamentos e devoluções coordenam Pedido, Estoque, Financeiro, Taxas e Logística sem repetir efeitos. Estados e reversões permitidas **A DEFINIR** por domínio/adapter. Picking, packing, separação, expedição, transportadora, etiqueta e rastreamento reutilizam Logística; documentos/etiquetas passam pelo [Print Service](PRINTING_AND_DEVICES.md), sem motor de impressão por canal.

## Entrega e recuperação PLANEJADAS

Webhooks/notificações para resposta rápida quando disponíveis, mais reconciliação periódica por conexão com checkpoints e revisão de divergências. Ambos percorrem os mesmos comandos/invariantes. Webhook duplicado/reconciliação não cria dois pedidos nem duas baixas. Chaves persistentes por conexão e efeito, registradas atomicamente junto da aplicação; transporte pode repetir mensagens, não se promete entrega externa exatamente uma vez.

Inbox/outbox duráveis são opção de implementação no monólito para coordenar recebimento/publicação com transações. Não fazer chamadas externas mantendo a transação comercial aberta. Falha do canal não quebra venda local; fila, timeout, retry com backoff/limite, respeito a rate limits e dead-letter/revisão manual conforme necessidade. Timeout ambíguo de operação com efeito exige consulta/reconciliação antes de repetir.

Interface futura mostra status Sincronizado/Pendente/Erro, última sincronização/checagem e mensagem útil do canal com tentativa manual autorizada. Não esconder falhas. Log minimizado: canal/conexão, evento, entidade, tentativa, resultado, horário, erro sanitizado e correlation ID; sem tokens/secrets completos ou payload pessoal indiscriminado.

## Segurança e API PLANEJADAS

Credenciais de marketplace/site somente backend ou secret storage, segregadas por empresa/conexão, menor scope, acesso limitado, renovação/rotação/revogação adequadas. Usuário, payload ou ID externo não decide tenant: conexão é resolvida e validada no servidor. Webhook validado pelo mecanismo vigente do fornecedor, com proteção de replay e limites de recurso; não presumir um algoritmo universal.

Site customizado: API + webhooks com OAuth/API credentials conforme escolha, scopes, rate limits, versão, documentação e auditoria. Não reutilizar sessão/CSRF do navegador como contrato de autenticação externo nem tratar o servidor local como API pública pronta. Endpoints/autenticação finais **A DEFINIR**. Ver [INTEGRATIONS](INTEGRATIONS.md), [SECURITY](SECURITY.md) e [API](API.md).

## Adapters e habilitação futura

| Canal | Escopo solicitado | Condição antes de implementar |
| --- | --- | --- |
| WooCommerce | Produtos, variações, pedidos, clientes quando necessário/permitido, estoque, preço, status e webhooks | Documentação oficial vigente e versão/capacidades da loja |
| Mercado Livre | Anúncios, variações, pedidos, estoque, preços, pagamento/status relevante, envios, cancelamentos e notificações | Documentação oficial vigente, aplicação/homologação e contas autorizadas |
| Shopee | Adapter próprio conforme APIs realmente disponíveis | Documentação oficial vigente, parceiros/aplicações, APIs, auth, notificações e políticas brasileiras |
| Site próprio/outro provedor | Integração própria quando suportada; API/webhooks para customizado | Contrato, autoridade e capacidades definidas |
| WhatsApp / demais canais | Origem preservada e pedido central conforme fluxo futuro | Provedor e comportamento definidos; canal não cria pagamento confirmado por suposição |

Não foram consultados contratos externos nesta tarefa documental nem inventados endpoints; consultá-los na implementação. Primeiro canal, ordem de entrega, sincronização inicial, origem de cada campo, reserva/buffer, preço, catálogo compartilhado, unidade de atendimento, financeiro/DRE, retenção/LGPD e operação offline continuam **A DEFINIR**.

Aceite futuro: sandbox autorizado, mesmo ID em contas/empresas diferentes sem cruzamento, replay e evento fora de ordem, reconciliação após webhook perdido, expiração/cancelamento/reserva, última unidade concorrente, timeout/429/retry esgotado, revogação de token, recuperação após reinício e devolução sem efeito duplicado. Preço/custos/produto/histórico não podem divergir silenciosamente.
