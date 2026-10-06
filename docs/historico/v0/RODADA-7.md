# Rodada 7 — V0.9 — 50 entregas

Rodada autorizada pelo Murilo. O diretor definiu o escopo; o Codex implementou as 50 entregas abaixo e realizou verificações próprias. O tester ficou temporariamente pausado por pedido do Murilo. Agora a rodada está encerrada para o Murilo experimentar e orientar os próximos passos.

## Contas a pagar

1. Cadastro manual de obrigação com fornecedor, descrição, valor positivo e vencimento opcional, sem movimentar dinheiro ao criar.
2. Criação explícita a partir de uma compra confirmada, com valor sugerido e editável; compras antigas não geram dívidas automaticamente.
3. Referência comercial e aviso de possível duplicidade por fornecedor ou compra, com confirmação explícita.
4. Comparação entre valor da compra e obrigação; diferenças exigem justificativa.
5. Até 60 parcelas com datas explícitas e distribuição exata dos centavos.
6. Revisão das parcelas antes de criar e proteção contra repetição da mesma confirmação.
7. Edição somente antes de pagamentos, com proteção contra alteração simultânea.
8. Lista com pesquisa por fornecedor, descrição e referência e filtros de situação.
9. Atrasos calculados por data local; vencimento de hoje não conta como atraso.
10. Detalhes com valor original, parcelas, pagamentos, saldo e vínculos.
11. Pagamento integral manual de parcela, com data efetiva não futura e forma de pagamento.
12. Pagamento parcial manual, limitado ao saldo da parcela.
13. Revisão do pagamento com saldo anterior, valor pago, saldo posterior e efeito no Caixa.
14. Reenvio idêntico protegido; alteração do conteúdo de uma confirmação já usada é recusada.
15. Conflitos de pagamento ou edição preservam o formulário e exigem nova conferência.
16. Dinheiro do Caixa atual somente mediante vínculo explícito, data de hoje e saldo suficiente; gravação conjunta.
17. Pagamentos externos ao Caixa não alteram sessões históricas nem criam vínculo automático.
18. Uma única despesa vinculada por pagamento, sem duplicar a saída no Caixa.
19. Histórico persistente de valor, data, forma, despesa e Caixa relacionado.
20. Cancelamento apenas do saldo restante, com motivo, preservando pagamentos realizados.
21. Despesas ligadas a contas a pagar não podem ser canceladas isoladamente.
22. Vínculo explícito com uma despesa manual compatível já existente, com confirmação do fornecedor, sem outra saída de dinheiro.
23. Resumo de saldos abertos, atrasados, de hoje, cancelados e sem vencimento.
24. Detalhes da compra com obrigações e pagamentos associados, separando mercadoria e dinheiro.
25. CSV da consulta filtrada e prévia de impressão interna da conta, com proteção de valores textuais na exportação.

## Descontos

26. Modelo de subtotal, desconto e total líquido; registros antigos mantêm desconto zero.
27. Desconto em reais na venda, menor que o subtotal, com motivo obrigatório quando positivo.
28. Revisão de venda com valor bruto, desconto e líquido; recebimentos usam o líquido.
29. Recálculo e validação pelo servidor antes de salvar a venda inteira.
30. Descontos e motivos em orçamentos, sem movimentar estoque ou dinheiro.
31. Edição e atualização de preços de orçamento preservam o desconto; valores incompatíveis impedem a gravação.
32. Conversão de orçamento utiliza preço e desconto gravados e conferidos pelo servidor.
33. Duplicação de orçamento copia desconto e motivo para revisão.
34. Detalhes, impressão e CSV mostram bruto, desconto e líquido, preservando o histórico.
35. Consulta de descontos por período, considerando vendas válidas.

## Reposição planejada

36. Consulta de produtos ativos zerados ou abaixo do estoque mínimo.
37. Seleção de vários produtos e quantidades manuais, sem reservar ou movimentar estoque.
38. Mercadorias pendentes de compras confirmadas aparecem separadas do estoque disponível.
39. Sugestão de quantidade: mínimo menos estoque disponível menos entradas pendentes, limitada a zero; linhas zeradas não são selecionadas automaticamente.
40. Seleção de fornecedor ativo para preparar a reposição.
41. Último custo efetivamente recebido com origem e data; custo desconhecido exige preenchimento explícito.
42. Revisão e criação única de uma compra em preparação; confirmação e recebimento continuam separados.
43. Consulta de compras e entradas pendentes por produto.
44. Reagendamento de entrega de compras confirmadas com saldo pendente, exigindo motivo e guardando histórico, sem alterar itens ou estoque.
45. Consulta de entregas atrasadas, de hoje e sem data, com período e histórico de reagendamentos.

## Proteção dos dados e fechamento

46. Proteção por versão nas edições e mudanças de situação de produtos, clientes e fornecedores.
47. Consulta das alterações futuras com data, campos modificados e responsável declarado; o login fictício não comprova identidade.
48. Validação da estrutura e versão do arquivo local ao abrir; arquivo inválido interrompe o uso da API e preserva o original.
49. Confirmação de sucesso somente após a gravação atômica; falha mantém dados anteriores e permite nova tentativa protegida.
50. Verificações próprias de regras, API, recarga, concorrência, formulários e tela estreita; versão e documentação atualizadas, com dados de teste separados.

## Roteiro para experimentar

Use dados fictícios: os botões de confirmar e pagar registram operações locais de verdade, mesmo nesta demonstração. Atualize a página com F5 para carregar a V0.9.

1. Em **Contas a pagar**, crie uma conta de R$ 100,01 em três parcelas. Confira R$ 33,34, R$ 33,34 e R$ 33,33 na revisão. Escolha datas e confirme.
2. Abra a conta, pague apenas parte de uma parcela e confira o saldo restante e o histórico. Em Despesas, procure a saída vinculada. O pagamento é declarado manualmente; o programa não envia dinheiro.
3. Em uma compra confirmada, abra os detalhes e crie a obrigação explicitamente. Se informar um valor diferente da compra, explique o motivo. Receber produtos continua separado de pagar o fornecedor.
4. Em Vendas, adicione produtos e informe um desconto com motivo. Confira subtotal e total líquido na revisão. Repita com um orçamento e confira o desconto após duplicar ou converter.
5. Em **Reposição planejada**, selecione produtos e fornecedor, revise quantidades e custos e prepare a compra. Confira que o estoque só aumenta depois do recebimento das mercadorias.
6. Em uma compra confirmada com saldo a receber, reagende a entrega e confira o motivo e a data nos detalhes.
7. Abra **Descontos** e **Alterações** para consultar o histórico criado nesta rodada. Alterações antigas não foram reconstruídas.
8. Experimente pesquisa, filtros, CSV e prévias de impressão. Feche e reabra pelo INICIAR.cmd para conferir que seus registros continuam disponíveis.

## Limites desta versão

Tudo permanece local e demonstrativo. Não há autenticação real, cobrança de assinatura, licenciamento, sincronização em nuvem, emissão fiscal, integração bancária ou instalador Windows. O executável e o servidor central continuam sendo a arquitetura futura descrita em ARQUITETURA.md.

O desconto é um valor em reais para a venda inteira, sem percentuais ou descontos por item. As contas a pagar são criadas por escolha explícita, inclusive para compras existentes. Correção de pagamento registrado e devolução de fornecedor ficam para uma etapa futura; cancelar saldo não desfaz pagamentos. Planejamento não é contagem física de estoque e não cria mercadorias disponíveis.

As verificações desta rodada estão em VERIFICACAO-V0.9.md. Não houve auditoria independente do tester nem auditoria completa de todo o programa.
