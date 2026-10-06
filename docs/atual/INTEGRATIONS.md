# Integrações

**Referência vigente — 05/10/2026:** [Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md), especialmente §§2–4, 10–17, e [plano A–G](ROADMAP.md). Os contratos futuros aqui descritos são subordinados ao mestre; nenhum adapter/dispositivo/Agente ou entitlement foi implementado. Menções anteriores a empresa/Edge precisam de mapeamento formal tenant/entidade/unidade/Agente antes de schema ou contrato externo; não equiparar automaticamente `company_id` ao novo tenant. Fiscal é independente e transversal na experiência; impressão não emite. Cliente/Agente não confiáveis, identidade revogável, autorização offline assinada, cloud-only crítico, APIs sem acesso direto ao banco e efeitos externos idempotentes. Pacotes/canais não criam ERPs separados; credenciais centrais não vão ao cliente. Especificação e revisão precedem a implementação.

## ATUAL

Não há integrações externas com bancos, gateways, canais de delivery, marketplaces, WhatsApp, fiscal ou transportadoras identificadas no protótipo. Compras, fornecedores, cotações e pagamentos são registros internos, não confirmação por API de terceiros.

Entrada por código de barras aceita leitor que funciona como teclado e digitação manual. Isso não representa driver de hardware especializado. Exportações CSV e impressão de documentos internos usam a interface; não há integração certificada com pinpad, balança, impressora fiscal ou sistema fiscal.

## PLANEJADO — conectores

Diretrizes oficiais: [Commerce Hub / Omnichannel](COMMERCE_HUB.md) concentra adapters para WooCommerce, Mercado Livre, Shopee, sites próprios/outros provedores, WhatsApp e canais futuros; [Printing & Devices](PRINTING_AND_DEVICES.md) concentra drivers/protocolos e periféricos. Não há contrato/endpoint de fornecedor criado por este planejamento. Consultar documentação oficial vigente antes de implementar cada canal, incluindo aplicações/homologação Mercado Livre e parceiros/APIs/políticas brasileiras Shopee.

Conexões admitem múltiplas contas do mesmo canal por empresa, com credenciais segregadas. Vínculos produto/variação/anúncio e IDs externos usam namespace empresa+conexão+tipo+ID, nunca apenas nome. Autoridade de cada dado e política de unidade/estoque são documentadas por adapter. API/webhooks versionados para site customizado permanecem planejados, com scopes, rate limits e auditoria.

Webhooks validados pelo mecanismo real do provedor mais reconciliação periódica; efeito comercial deduplicado atomicamente, eventos fora de ordem tratados por estado/versão autoritativos. Trabalho durável, retries/backoff limitados, estado/erro visível e revisão manual; timeout ambíguo exige consulta antes de repetir efeito financeiro. Logs minimizados com canal, evento, entidade, tentativa, resultado, horário, erro e correlação. Marketplace/Logística solicitam impressão ao Print Service, sem motores próprios. Os contratos/aceites completos estão nos dois documentos acima.

| Área | Integrações possíveis | Decisões pendentes |
| --- | --- | --- |
| Financeiro/SaaS | Bancos, gateways, confirmação de pagamentos e conciliação | Fornecedor, métodos, eventos, taxas e reconciliação |
| Alimentação/delivery | iFood, Delivery Much e transportadoras | Primeiro canal, estados e fluxo por segmento |
| Comunicação | WhatsApp e notificações | Provedor, consentimento/uso e canais |
| Canais comerciais | E-commerce e marketplaces | Catálogo, preços por canal, estoque e pedidos |
| Fiscal | Emissão/consulta/cancelamento conforme documento aplicável | Regras fiscais, provedor e homologação |
| Dispositivos | Impressoras, balanças, pinpads, leitores e KDS | Equipamentos, protocolo, client/Edge e validação |

Tudo permanece **A DEFINIR** por prioridade. Não instalar SDKs ou contratar fornecedores nesta tarefa documental.

## Contrato do conector

Cada adapter traduz dados do fornecedor para o modelo interno. Preservar identificadores externos separados, empresa de origem, estados, eventos e rastreabilidade. Detalhes do fornecedor ficam no conector, sem espalhar payloads específicos pelo domínio.

Definir autenticação externa segura por empresa, secrets no servidor, timeouts, rate limits, retries limitados, idempotência, assinatura e proteção de replay em webhooks. Tratar eventos repetidos ou fora de ordem e indisponibilidade. Prever reconciliação e correção operacional, sem duplicar financeiro/estoque.

## Critérios de habilitação

Contrato e regras conhecidos, teste em sandbox, cenários de falha/reenvio, isolamento por empresa, logs sem secrets, métricas e procedimento de reconciliação. Pagamentos, mensagens e pedidos reais exigem autorização dentro da tarefa correspondente. Ver [segurança](SECURITY.md) e [API](API.md).
