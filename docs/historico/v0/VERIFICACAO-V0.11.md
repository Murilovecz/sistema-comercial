# Verificação da V0.11 — Rodada 9

Data: 01/10/2026. Projeto exclusivo: D:\Projeto Sistema Local.

200 melhorias implementadas, conforme RODADA-9.md. O diretor fez revisão estática; o Codex realizou as verificações abaixo. O agente tester independente continua pausado.

## Resultado observado

- 156 testes de regras passaram, sem falha. São 111 anteriores e 45 desta rodada.
- 99 arquivos JavaScript tiveram sintaxe conferida.
- 27 verificações HTTP de fluxo passaram em instância isolada, incluindo rejeição esperada de pagamento acima do limite sem justificativa.
- 52 recursos da página retornaram HTTP 200; a saúde do servidor informa versão 0.11.0.
- A instância isolada reabriu com os registros novos persistidos e validados.
- A base anterior passou pela leitura compatível e não recebeu escrita: SHA-256 E4F207B6EB261C9E4DA4B77C8675141EBD19AF8A82710275ACE1BFA999FBE07D, igual ao registro inicial.

Os testes de escrita usaram a loja fictícia em .qa/round9/data e porta 3219. O inicializador normal continua usando data/database.json na porta 3210.

## Conferências pela interface

Lista Atacado com preço próprio e promoção por quantidade aplicadas explicitamente na venda; preço padrão mantido no cadastro. Retenção manual, inspeção e liberação parcial conferidas contra a posição vendável/retida. Venda de R$12,50 com R$5,00 de crédito interno gerou recebimento real de R$7,50 e saldo a receber zero. Concluir o atendimento principal deixou o segundo carrinho guardado.

Cotação criada com dois cafés; resposta de R$5,50 por unidade e frete de R$2,00 mostrou total comparável de R$13,00. A seleção revisou o grupo do fornecedor e gerou preparação de R$11,00, mantendo frete separado. Uma entrega foi conferida por código de barras digitado com Enter, concluída e expedida sem segunda baixa de estoque.

O demonstrativo de energia mostrou limite de R$10,00, pagamento de R$12,00, pendente zero e excesso de R$2,00. Outra despesa isolada exigiu revisão e justificativa. Detalhes de devolução ao fornecedor mostraram aceite declarado e restituição efetiva separados.

Os 19 indicadores abriram juntos, sem erro de JavaScript observado, e a escolha persistiu após reabertura. Colunas ocultadas/reordenadas persistiram; visão salva manteve carrinhos; registro consultado pôde ser fixado. Colunas de origem e vínculo ficaram obrigatórias. A prévia do extrato apresentou cliente, origem, valores, saldo após cada evento e datas da venda, sem controles de paginação. Janela estreita de 390 pixels foi conferida e o tamanho padrão restaurado. Imagem final: V0.11-atendimento.jpg, com dados fictícios.

## Regressões de maior risco

Crédito interno com desconto de um centavo e devolução parcial; emissão/consumo concorrentes; restauração por origem; quarentena reservada ou sem inspeção; contagem retida consumida; expedição repetida ao fornecedor; retorno físico distinto de recusa; geração repetida de pedidos; conciliação de entrega já realizada com devolução comercial; pagamento herdando centro histórico inativo; limite monetário; falha simulada no rename da gravação preservando arquivo original e permitindo nova tentativa sem duplicação.

## Localização e cobertura

As marcações de implementação são distintas da cobertura: testes de regras, HTTP e interface exercitam os cenários descritos. A revisão estática cobre os pontos de acesso e efeitos de cada grupo.

| Itens | Entrega | Arquivos principais | Conferência |
|---|---|---|---|
| 1–20 | Listas de preços | [pricing.js](../../../pricing.js), [public/pricing-core.js](../../../public/pricing-core.js), [public/pricing-ui.js](../../../public/pricing-ui.js) | Regras, versões, preços do servidor, alternativa padrão, mínimo e snapshots de orçamento; criação e aplicação também na interface. |
| 21–40 | Promoções | [pricing.js](../../../pricing.js), [public/pricing-core.js](../../../public/pricing-core.js), [public/pricing-ui.js](../../../public/pricing-ui.js) | Quantidade mínima, vigência, seleção única, consentimento para desconto, cópia/conversão histórica; aplicação visual na venda. |
| 41–60 | Quarentena | [quarantine.js](../../../quarantine.js), [public/quarantine-core.js](../../../public/quarantine-core.js), [public/quarantine-ui.js](../../../public/quarantine-ui.js) | Livre protegido de reservas, destinos de recebimento/devolução, inspeção, contagem consumida, versão e saldo; retenção/liberação na interface. |
| 61–80 | Devoluções a fornecedores | [supplier-returns.js](../../../supplier-returns.js), [public/supplier-return-core.js](../../../public/supplier-return-core.js), [public/quarantine-ui.js](../../../public/quarantine-ui.js) | Origem histórica, expedição, aceite/recusa, retorno físico, restituição e Caixa; detalhes com data declarada e exportação/termo. |
| 81–100 | Crédito de loja | [store-credits.js](../../../store-credits.js), [credit-storage.js](../../../credit-storage.js), [public/store-credit-core.js](../../../public/store-credit-core.js), [public/store-credit-ui.js](../../../public/store-credit-ui.js), [public/accounts-ui.js](../../../public/accounts-ui.js) | Emissão limitada, consumo FIFO, reenvio/concorrência, cancelamento/restauração, arredondamento residual; venda mista e extrato na interface. |
| 101–120 | Separação e entrega | [deliveries.js](../../../deliveries.js), [public/delivery-core.js](../../../public/delivery-core.js), [public/delivery-ui.js](../../../public/delivery-ui.js) | Sem baixa adicional, limites por item, remessas parciais, tentativa/retorno e conciliação comercial; código com Enter, conclusão e expedição na interface. |
| 121–140 | Cotações de compra | [supplier-quotes.js](../../../supplier-quotes.js), [public/supplier-quote-core.js](../../../public/supplier-quote-core.js), [public/supplier-quote-ui.js](../../../public/supplier-quote-ui.js) | Não cotado distinto de zero, validade, propostas incompletas, justificativa, geração atômica/replay; solicitação, resposta, escolha agrupada e compra na interface. |
| 141–160 | Orçamento de despesas | [budgets.js](../../../budgets.js), [public/budget-core.js](../../../public/budget-core.js), [public/budget-ui.js](../../../public/budget-ui.js), [payables.js](../../../payables.js), [public/payables-ui.js](../../../public/payables-ui.js) | Versão, histórico, mês, centro inativo, excesso justificado, classificação herdada no pagamento, projeção sem duplicar; demonstrativo e despesa na interface. |
| 161–180 | Análises avançadas | [public/advanced-analytics.js](../../../public/advanced-analytics.js), [public/analytics-ui.js](../../../public/analytics-ui.js) | 19 análises sem mutação, bases/limites/períodos explícitos, configuração persistida; todos os indicadores abriram com dados mistos. |
| 181–200 | Atendimento e preferências | [public/workstation-core.js](../../../public/workstation-core.js), [public/workstation-ui.js](../../../public/workstation-ui.js), [public/experience-ui.js](../../../public/experience-ui.js) | Rascunhos/modelos inválidos recusados, identidade/vínculos obrigatórios; dois carrinhos, conclusão do ativo, modelo, colunas, visão, fixação e timelines na interface. |

## Roteiro para Murilo testar

1. Feche o inicializador antigo, reabra pelo atalho e atualize a página. Confira V0.11 no menu.
2. Crie uma lista e uma promoção, aplique na venda e confira os valores antes de salvar.
3. Abra dois atendimentos com clientes e itens diferentes. Conclua um e confira o outro.
4. Registre retenção, inspeção e liberação; confirme que retido não aparece como disponível para venda.
5. Em uma venda recebida de cliente identificado, devolva mercadoria e converta a restituição em crédito. Use parte em outra venda e confira recebimentos e extrato.
6. Crie ordem de entrega e confira itens por código ou manualmente. Experimente expedição parcial, tentativa e entrega.
7. Registre cotação/resposta e confira a preparação de compra. Defina limite de despesas e confira gasto/pendências no mês.
8. Escolha indicadores, ajuste colunas e guarde uma visão. Reabra para verificar persistência.

## Limites desta verificação

Leitor físico e impressão em papel ficam para sua conferência; a leitura em modo teclado e prévias foram exercitadas. Pagamentos, respostas e entregas são declarações locais. Não houve conexão bancária ou contato enviado ao fornecedor. A base continua de demonstração, com login fictício, arquivo local e preferências por navegador. Executável Windows, autenticação real, nuvem, sincronização e assinatura seguem como etapas futuras.

A rodada encerra no item200 para Murilo testar. Não iniciar nova rodada sem pedido.
