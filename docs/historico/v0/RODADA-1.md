# V0.3 — cinco ciclos concluídos

1. Revisão antes de confirmar venda, com prevenção de duplicidade na repetição da mesma confirmação.
2. Detalhes históricos, pesquisa por cliente e filtros de vendas.
3. Situação e filtros de estoque, contador no painel e atalho para reposição.
4. Formulários com erros junto aos campos, navegação pelo teclado e visual adaptável.
5. Mensagens de listas vazias, versão e verificação integrada.

## Teste do Murilo

Abra INICIAR.cmd se o servidor estiver desligado. Mantenha a janela aberta e acesse http://127.0.0.1:3210. Atualize a página para carregar a V0.3.

- Cadastre um produto de teste sem estoque e encontre-o pelo filtro Sem estoque.
- Reponha 5 unidades e confira o histórico da entrada.
- Edite nome e preço, e pesquise o produto.
- Cadastre e edite um cliente de teste.
- Adicione 2 unidades a uma venda, abra a revisão e volte para editar; os itens devem permanecer.
- Confirme a venda. Confira estoque, total do painel e Ver detalhes.
- Edite novamente o preço do produto: os detalhes da venda anterior devem manter o preço original.
- Pesquise a venda pelo cliente e alterne os filtros.
- Cancele a venda: estoque deve voltar, total deve diminuir e o histórico deve indicar Cancelada.
- Feche e reabra o sistema; os registros devem permanecer. Experimente com a internet desconectada.
- Reduza a janela e experimente navegar com Tab, Enter e Escape.

Anote a tela, o que fez e o que esperava quando encontrar problemas. A equipe para ao final destes cinco ciclos e aguarda seu retorno antes de iniciar outra rodada.

## Limites atuais

Login demonstrativo, dados locais e sem proteção real de acesso. Sem financeiro, emissão fiscal, assinatura, sincronização ou aplicativo Windows empacotado. O total vendido não representa recebimentos. O acesso offline limitado por assinatura será uma implementação futura.
