# V0.4 — rodada 2, cinco ciclos

1. Forma de pagamento: Dinheiro, Pix, Débito, Crédito ou Outro.
2. Situação do pagamento: Recebido ou A receber, sem escolha automática.
3. Financeiro com indicadores, pesquisa e filtros; canceladas excluídas.
4. Registro manual do recebimento integral de uma pendência, com data e hora e proteção contra repetição.
5. Consolidação, esclarecimento de cancelamento e verificação integrada.

## Teste

Abra o sistema e atualize a página para ver V0.4. Se estiver desligado, abra INICIAR.cmd e mantenha sua janela aberta.

- Venda um produto de teste escolhendo Pix e A receber. Revise os dados antes de confirmar.
- No Financeiro, encontre a pendência e confira o total A receber.
- Clique em Registrar recebimento e confirme. O valor deve passar para Recebido, sem alterar estoque.
- Consulte os detalhes para ver a data de recebimento.
- Faça outra venda escolhendo Dinheiro e Recebido; ela já deve aparecer como recebida.
- Cancele uma venda de teste: o estoque volta e os indicadores retiram seu valor; o histórico permanece.
- Confira que suas vendas anteriores sem situação aparecem em Sem informação. Elas não são presumidas recebidas ou pendentes.
- Feche e reabra para conferir o salvamento; os fluxos locais continuam funcionando sem internet.

## O significado dos números

Recebido e A receber são declarações da loja, sem confirmação bancária. Os indicadores consideram todas as vendas confirmadas; filtros afetam só a lista. Total vendido inclui recebidas e pendentes. Sem informação conta registros sem situação, sem atribuir uma situação por suposição.

Cancelar exclui a venda dos totais e devolve os produtos ao estoque. Não devolve dinheiro: se houve recebimento, a devolução ao cliente precisa ser feita separadamente. Não há controle de estornos, despesas, lucro, parcelas, recebimentos parciais ou saldo de caixa.

Login permanece demonstrativo. Assinatura e limite de acesso offline ainda são etapas futuras. A equipe para após cinco ciclos e aguarda o retorno do Murilo.
