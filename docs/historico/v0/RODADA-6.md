# V0.8 — fornecedores e compras: 20 entregas

Diretor definiu as entregas; Codex implementa a rodada inteira; tester só valida ao final, encaminhando falhas diretamente ao Codex para correção e reteste. Ao encerrar, aguardar o teste do Murilo antes de outra rodada.

1. Cadastro persistente de fornecedores, com nome, telefone, e-mail e observações validados.
2. Edição de fornecedores, sem reescrever nomes em pedidos anteriores.
3. Desativação e reativação confirmadas; histórico preservado e novos pedidos impedidos com fornecedor inativo.
4. Pesquisa por nome e contato, filtros de situação e detalhes com compras vinculadas.
5. Pedido persistido com identificação, fornecedor, snapshots dos itens, quantidade, custo, total, previsão e observação, sem movimentação de estoque ou dinheiro.
6. Montagem por produtos ativos, nome/código, quantidade inteira e custo com até duas casas, com revisão antes de salvar.
7. Rascunho independente, preservado durante digitação, navegação e recarga, descartado com confirmação.
8. Edição somente em preparação, mantendo criação e recusando versão antiga.
9. Confirmação revisada, congelando conteúdo sem movimentar estoque.
10. Prévia e impressão “Pedido de compra — sem valor fiscal”, com identificação da empresa.
11. Recebimento parcial ou integral por item, limitado ao restante, com revisão.
12. Entrega e movimentos de estoque gravados juntos; qualquer falha impede toda a operação. Produto desativado após confirmação ainda pode receber essa compra.
13. Proteção contra reenvios e recebimentos concorrentes; mesmo pedido nunca recebe acima do saldo.
14. Cancelamento sem entrega ou encerramento de saldo parcialmente entregue, com motivo e preservação do estoque recebido.
15. Consulta de cada entrega, data, quantidade, observação e vínculo com pedido no histórico do estoque.
16. Lista com pesquisa, período e situações preparação, a receber, parcial, recebido, cancelado e encerrado com saldo.
17. Duplicação para nova preparação, com identidade própria, custos e fornecedor a revisar, sem copiar entregas ou encerramento.
18. Último custo unitário efetivamente recebido por produto, fornecedor e data, sem presumir custos antigos, lucro ou alterar preço de venda.
19. Painel de pendências e previsão vencida (hoje não está atrasado); CSV filtrado protegido, separando valor pedido, recebido e não entregue.
20. Versão, roteiro e consolidação com testes das regras, persistência, concorrência, rascunhos, teclado, janela estreita, uso local sem internet e regressões relevantes.

## Teste recomendado para o Murilo

1. Atualize a página e abra **Fornecedores**. Cadastre um contato de teste.
2. Abra **Compras**, escolha fornecedor e adicione produtos com quantidade e custo. Salve a preparação.
3. Abra **Ver pedido**, confira os dados e confirme. Observe que o estoque ainda não mudou.
4. Clique em **Receber mercadorias**, informe parte do que chegou, revise e registre. Confira o estoque e o restante.
5. Registre outra entrega ou use **Encerrar saldo não entregue** com motivo. O que já chegou permanece no estoque.
6. Consulte **Custos recebidos**, o histórico de estoque, a prévia de impressão e o CSV da lista filtrada.
7. Experimente editar uma preparação, duplicar um pedido e desativar/reativar fornecedor.

Pedidos confirmados não permitem mudar itens ou custos. Corrigir uma compra confirmada exige encerramento e um novo pedido. O custo registrado é informativo por entrega; não é custo médio ou contábil do estoque.

Receber produtos não paga o fornecedor e não registra despesa, Caixa ou contas a pagar. Frete, tributos, devolução ao fornecedor e pagamento de compras ficam para etapas futuras. A reposição manual continua separada, sem custo presumido.

O sistema continua local, com login fictício e arquivos neste computador. Não há integração fiscal, bancária ou com nuvem nesta rodada. Os testes usam bases isoladas em `work/`; a base já existente da loja é preservada.

## Encerramento

As 20 entregas foram implementadas e a rodada foi aprovada pelo tester nos cenários executados. Passaram 65 testes, três verificações independentes adicionais e conferência visual do executor, incluindo duas janelas e largura de 390 pixels. A apresentação final das entregas e os 12 testes de compras foram reconferidos. Dados anteriores preservados. Impressão física e desconexão real em modo avião não foram executadas; veja VERIFICACAO-V0.8.md para responsabilidades e limites.

Agora a equipe aguarda o teste do Murilo.
