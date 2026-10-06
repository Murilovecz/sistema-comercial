# Código de barras e menu — V0.9.1

Atualização pontual pedida pelo Murilo antes de novos ciclos. O tester continua pausado; as verificações abaixo foram feitas pelo Codex com dados fictícios separados.

## Cadastrar uma etiqueta

1. Abra **Cadastros e estoque → Produtos**.
2. Edite um produto ou crie um novo. Informe o **Código de barras (opcional)**, digitando a etiqueta ou lendo com o leitor.
3. Clique em Salvar produto. O Enter enviado pelo leitor neste campo passa para Categoria, sem salvar o cadastro acidentalmente.

Código interno e código de barras são campos separados. Ambos podem localizar o produto. Os códigos são guardados como texto, preservando zeros iniciais. Uma etiqueta não pode identificar dois produtos, inclusive produtos inativos; também não pode coincidir com o código interno de outro produto. Cadastros antigos e produtos sem etiqueta continuam disponíveis manualmente. A aplicação não gera nem imprime etiquetas nesta atualização.

## Consultar preço e estoque

Abra **Vendas e consultas → Consulta de produtos**. Clique no campo de código, leia a etiqueta ou digite o código completo e pressione Enter ou Consultar. O resultado mostra nome, preço de venda, estoque e situação do cadastro. Código desconhecido ou ambíguo não escolhe outro produto por aproximação.

Sem leitor ou sem etiqueta, pesquise pelo nome e confira os resultados. **Adicionar à venda** coloca uma unidade no carrinho existente ou inicia um carrinho. Produtos inativos e produtos sem saldo não podem entrar na venda. Consultar ou montar carrinho não reserva nem baixa estoque; a baixa continua acontecendo somente na confirmação da venda.

## Montar a venda com leitor ou manualmente

Em **Vendas e consultas → Vendas**, o campo **Adicionar por código de barras ou interno** recebe a leitura seguida de Enter. Cada leitura acrescenta uma unidade, inclusive quando o produto já está no carrinho. Leituras rápidas são processadas em sequência. O botão Adicionar 1 unidade faz a mesma operação quando o código é digitado.

Cliente, desconto, motivo e demais dados da venda são preservados. O sistema consulta os dados locais atualizados antes da inclusão por leitura, limita a quantidade ao estoque e apresenta o motivo quando recusa uma etiqueta. Após uma recusa, o código fica selecionado para substituição.

A busca por nome ou código interno, a lista de produtos, a quantidade manual e os ajustes no carrinho continuam disponíveis. Na revisão final, confira os itens antes de confirmar a venda.

O leitor esperado funciona como teclado e envia Enter após o código. Use o campo correspondente com o foco nele. Não houve teste com um leitor físico nesta atualização; leitores que usam conexão serial, protocolo próprio, câmera ou outro terminador precisam de adaptação ou configuração. A aplicação não depende de leitor para nenhuma dessas operações.

## Menu por categorias

Visão geral permanece sempre à vista. Clique na caixa da categoria para expandir ou recolher os atalhos; Enter ou Espaço também funcionam com a caixa em foco. A categoria da tela escolhida é aberta ao navegar e as caixas abertas são lembradas nesta sessão.

- **Cadastros e estoque:** Produtos, Clientes, Fornecedores, Reposição planejada.
- **Vendas e consultas:** Vendas, Orçamentos, Consulta de produtos, Descontos.
- **Financeiro e compras:** Financeiro, Contas a pagar, Despesas, Caixa, Movimentações, Compras, Custos recebidos.
- **Administração:** Empresa, Alterações.

## Verificações realizadas

**83 testes de regras passaram**, incluindo cinco testes novos para zeros iniciais, unicidade e colisões de códigos, consulta exata, leituras sucessivas, limites de estoque, cadastros inativos, operação manual e exportação. A integração HTTP isolada conferiu criação, edição, rejeição de duplicidade sem alterar o arquivo e persistência após recarga.

No navegador foram conferidos: consulta exata com zero inicial, ausência de resultado por código parcial, consulta manual pelo nome, inclusão a partir da consulta, leituras sucessivas somando unidades, excesso de estoque, inativo, saldo zero, cliente e desconto mantidos, seleção manual com duas unidades e cadastro de etiqueta com Enter sem envio acidental. As categorias foram expandidas e recolhidas por mouse e teclado, e a navegação para Contas a pagar permaneceu funcional.

A consulta também foi utilizada em quadro de 390 × 844 pixels, com largura interna de 375 pixels e sem transbordamento horizontal da página. Nenhum erro de interface foi registrado no console da conferência. A imagem V0.9.1-consulta-menu.png mostra dados fictícios.

Estas verificações não são auditoria completa do programa nem aceite do tester. Os registros do Murilo não foram usados para cadastrar etiquetas ou simular vendas.
