# V0.7 — rodada de 20 entregas

O diretor definiu as entregas; o Codex implementou a rodada completa antes de chamar o tester. Falhas seguem diretamente para o Codex, com correção e reteste até a validação. A rodada encerra para o teste do Murilo, sem iniciar outra automaticamente.

1. Desativação e reativação de produtos, preservando histórico.
2. Desativação e reativação de clientes, preservando histórico.
3. Filtros Ativos, Inativos e Todos nos cadastros; registros antigos continuam ativos.
4. Busca por nome ou código na venda, com preço, estoque e adição por Enter quando há um único resultado disponível.
5. Orçamentos persistidos com identificação, cliente, snapshots dos itens, validade, observação e datas.
6. Montagem de orçamento sem reserva de estoque; quantidades acima do disponível são permitidas e sinalizadas.
7. Rascunho independente do rascunho de vendas, recuperado ao navegar/recarregar e descartado com confirmação.
8. Edição de orçamento aberto ou vencido, preservando data original e preços existentes.
9. Atualização explícita de preços com comparação, novo total e confirmação.
10. Validade real pelo calendário de São Paulo; vencidos precisam de renovação para converter.
11. Cancelamento com confirmação, preservação e repetição sem efeitos adicionais.
12. Lista com pesquisa por cliente/identificação, situação e período de criação.
13. Detalhes com conteúdo histórico e somente ações permitidas.
14. Prévia e impressão “Orçamento — sem valor fiscal”, com empresa e aviso de que não reserva estoque.
15. Duplicação de qualquer orçamento para nova negociação, com nova identidade e validade a revisar.
16. Revisão da conversão, forma/situação do pagamento, vencimento opcional e indicação do Caixa.
17. Conversão atômica e única, honrando preços salvos e regras de estoque, recebimento e Caixa.
18. Vínculos entre orçamento e venda; cancelar venda não reabre orçamento.
19. CSV filtrado protegido contra fórmulas e painel com abertos/vencidos separados do vendido.
20. Proteção por versão contra alterações simultâneas, preservação do preenchimento, testes e documentação.

## Como testar

1. Atualize a página local e abra **Orçamentos**.
2. Adicione produtos, cliente, validade e observação. Confira e salve.
3. Abra **Ver orçamento**. Experimente editar, duplicar e ver a prévia de impressão.
4. Converta um orçamento aberto em venda a receber e confira estoque, Financeiro e vencimento.
5. Com Caixa aberto, converta outro em venda recebida em dinheiro e confira a sessão.
6. Mude o preço do produto: orçamento já salvo mantém o preço negociado; **Atualizar preços** mostra a diferença antes de confirmar.
7. Desative um cadastro e confira o filtro Inativos. Ele permanece no histórico e não entra em novas operações. Reative para voltar a usar.
8. Em Vendas, busque um produto pelo código e adicione pelo teclado.

O endereço 127.0.0.1 é local. Esta entrega ainda usa login fictício e armazenamento local; não contém servidor de assinatura, sincronização em nuvem, emissão fiscal ou instalador Windows. A impressão depende do diálogo e da impressora do computador; a prévia pode ser conferida sem imprimir.

Os testes usam dados isolados em `work/`; os dados já existentes da loja não são usados em operações de teste.
