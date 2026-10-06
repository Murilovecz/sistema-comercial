# V0.2

Pesquisa por nome (ignora acentos), edição de produtos e clientes, reposição de estoque com histórico e cancelamento de venda com confirmação. O cancelamento preserva a venda, devolve estoque uma única vez e remove seu valor e contagem dos indicadores de vendas válidas. Edição de preço e nome não reescreve vendas anteriores. Cadastros existentes são preservados.

Para testar: edite um cadastro; pesquise pelo nome; reponha estoque; registre uma venda de teste e cancele-a. Confira estoque, total e situação no histórico. Feche e reabra para conferir persistência. Tudo roda localmente, sem internet.

## Decisão para etapas futuras

O Murilo confirmou que a loja deve funcionar sem internet. Quando implementarmos assinatura, o acesso offline será limitado por uma autorização com validade, emitida após consulta ao servidor. Sete dias sem validação é uma proposta anterior, ainda a confirmar; não confundir com os sete dias de carência por atraso já discutidos. Prever aviso cinco dias antes do vencimento, renovação após pagamento e suspensão após carência, com regras detalhadas a definir nessa etapa.

A implementação futura deve verificar validade da autorização e tratar alterações de relógio. Proteções locais podem dificultar adulterações, mas não garantem impossibilidade de fraude. A V0.2 não implementa assinatura, cobrança, sincronização, backup ou atualizações automáticas.

V0.7: rodada de 20 entregas voltada a orçamentos e cadastros ativos/inativos. Validação funcional aprovada com 53 testes e integração HTTP isolada. Detalhes em RODADA-5.md e VERIFICACAO-V0.7.md.

V0.8: rodada de 20 entregas de fornecedores, compras e recebimentos de mercadorias. Estoque e histórico são gravados juntos; reenvios e versões protegem o saldo. Último custo efetivamente recebido, duplicação, encerramento e CSV. Detalhes em RODADA-6.md e VERIFICACAO-V0.8.md.

V0.9: rodada de 50 entregas de contas a pagar, descontos, planejamento de reposição e proteção dos dados. O tester ficou pausado por pedido do Murilo; o Codex realizou as verificações próprias. Consulte RODADA-7.md e VERIFICACAO-V0.9.md. A rodada termina para o Murilo testar antes de novas funcionalidades.

V0.9.1: pedidos pontuais de código de barras para consulta/carrinho e menu por categorias expansíveis, mantendo a operação manual. Foram realizados 83 testes de regras e conferências de API e interface em dados isolados. Não iniciou nova rodada de ciclos; o tester continua pausado. Consulte CODIGO-DE-BARRAS-E-MENU.md.

V0.10: rodada de 200 itens de inventário, devoluções, reservas, cadastros complementares, parcelamento, agenda, relatórios e navegação. 111 testes de regras e 79 verificações HTTP passaram, além de fluxos de interface em base isolada. As 200 marcações registram implementação; cobertura e limites estão em VERIFICACAO-V0.10.md. Tester pausado; aguardar teste do Murilo antes de nova rodada.

V0.11: segunda rodada de 200 entregas, descritas em RODADA-9.md. Listas e promoções com snapshots, quarentena, devoluções a fornecedores, crédito de loja, logística, cotações, limites mensais, 19 análises e estação de atendimento. 156 testes de regras passaram, com 27 verificações HTTP e fluxos de interface em loja isolada. Detalhes e limites em VERIFICACAO-V0.11.md. Projeto exclusivo em D; dados anteriores preservados; tester pausado. Parar para Murilo testar.

V0.12: Rodada 10 com 200 melhorias de PDV, embalagens/códigos, famílias/substitutos, posições físicas, contagem cega/recontagem, conferências/aditamentos de compra, acordos de saldo, previsões recorrentes, procedimentos e revisão de preços. 205 testes de regras e 40 verificações HTTP passaram, além de fluxos representativos no navegador em base isolada. Diretor revisou arquitetura/cobertura; tester permaneceu pausado. Projeto exclusivo em D e arquivo de dados anterior preservado. Parar para Murilo testar; detalhes em RODADA-10.md e VERIFICACAO-V0.12.md.
