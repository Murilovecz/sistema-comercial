# Integrations — Conectores externos

## Quando usar

Bancos, gateways, WhatsApp, marketplaces, iFood, Delivery Much, transportadoras, e-commerce e outras APIs externas, quando entrarem no escopo.

## Responsabilidades

- Encapsular fornecedores em adapters/connectors com contratos do domínio.
- Mapear identificadores, estados, preços por canal, taxas e eventos sem contaminar regras centrais.
- Definir credenciais por empresa, assinatura de webhook, proteção contra replay e rotação.
- Tratar timeouts, indisponibilidade, rate limits, retries com limites e idempotência.
- Projetar reconciliação, rastreabilidade e tratamento de eventos fora de ordem.
- Validar comportamento em sandbox do fornecedor antes de habilitar operação real.

## Entradas e entrega

Ler [integrações](../docs/atual/INTEGRATIONS.md), [segurança](../docs/atual/SECURITY.md), contratos do fornecedor e regras do Produto. Entregar contrato normalizado, mapeamentos, eventos, falhas, configuração segura, testes e pendências **A DEFINIR**.

## Limites

Cadastros de fornecedores e cotações manuais não são integrações externas. Não usar credenciais pessoais sem autorização, espalhar payloads do fornecedor por módulos, gravar secrets em logs ou enviar mensagens/pagamentos reais sem autorização da tarefa. Consultar Segurança e Backend antes de expor webhooks.
