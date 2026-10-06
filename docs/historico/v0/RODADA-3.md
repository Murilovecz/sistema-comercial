# V0.5 — vinte ciclos concluídos

1. Alterar quantidades no carrinho.
2. Guardar e recuperar rascunho da venda.
3. Descartar rascunho com confirmação.
4. Código opcional e único por produto.
5. Categoria e filtro de produtos.
6. Estoque mínimo e indicação de estoque baixo.
7. Histórico de estoque por produto, com saldos nas novas movimentações.
8. Motivo da reposição no histórico.
9. Observações nos clientes.
10. Detalhes do cliente e vendas vinculadas.
11. Vencimento opcional de venda a receber.
12. Consulta de pendências vencidas.
13. Período no histórico de vendas.
14. Período no Financeiro pela data da venda.
15. Registro de despesas já pagas.
16. Consulta e cancelamento de despesas, preservando histórico.
17. Resumo por data efetiva de recebimento e pagamento.
18. Identificação da empresa e comprovante interno para impressão.
19. CSV das listas filtradas de produtos, clientes, vendas e despesas.
20. Consolidação e testes integrados com dados separados.

## Para testar

Abra INICIAR.cmd se necessário, mantenha a janela aberta e acesse http://127.0.0.1:3210. Atualize a página e confira V0.5.

- Cadastre um produto com código, categoria e mínimo; pesquise pelo código e filtre a categoria.
- Reponha estoque com observação e consulte Histórico de estoque.
- Cadastre cliente com observação; consulte seus detalhes.
- Monte uma venda, altere quantidade, escolha Pix e A receber e informe vencimento. Atualize a página para conferir o rascunho.
- Confirme e consulte Financeiro, vencimento e período. Registre o recebimento e confira Movimentações.
- Registre uma despesa paga, confira o resumo e cancele um registro de teste.
- Em Empresa, salve a identificação. Abra os detalhes de uma venda e Imprimir comprovante; cancele a impressão se estiver apenas testando.
- Aplique filtros e exporte uma lista CSV para conferir somente os resultados exibidos.
- Feche e reabra, teste teclado e reduza a janela. Tudo permanece local, sem depender de internet.

## Limites

Não há emissão fiscal, autenticação real, sincronização entre computadores, executável empacotado ou assinatura. O rascunho é local à instalação e não reserva estoque; ao recuperar, preços e estoque atuais são verificados. Cadastro antigo sem vínculo identificável de cliente não é associado por suposição. Movimentações antigas podem não ter saldo após a operação registrado.

Recebimentos e despesas são declarações manuais. Cancelar não devolve dinheiro. A diferença entre entradas e saídas não representa lucro ou saldo bancário. Vencimentos não geram multa ou juros. Datas de relatório usam o calendário de São Paulo. CSV é uma exportação de consulta, sem importação nesta versão.

Consulte ARQUITETURA.md para o plano de servidor central e executável Windows. Ao fim destes vinte ciclos, a equipe para e aguarda o teste do Murilo.

## Verificações da entrega

22 testes de regras passaram. Integração com dados separados verificou cadastros, código único, reposição, venda, confirmação repetida, recebimento, despesa, cancelamentos, empresa e persistência após recarga. O CSV foi baixado pelo navegador e seu conteúdo conferido. Exportação aceita até 1.000 registros por arquivo; use filtros para reduzir listas maiores.

Na interface: rascunho após recarga, alteração de quantidade, venda a receber, vencimento, cliente vinculado, estoque mínimo, despesa e comprovante conferidos com dados de teste. Produtos, Vendas e Despesas não transbordaram a página na largura de 390 px. Escape fechou o diálogo de detalhes. Impressão conferida na prévia; não houve teste em impressora física. Dados do Murilo foram preservados.
