# Verificações próprias — V0.9

Data: 30/09/2026. Executor: Codex. O tester foi pausado por solicitação do Murilo e não validou esta rodada.

## Regras e integração

A suíte do projeto contém 78 testes de regras, incluindo 24 casos novos para contas a pagar, descontos, reposição, versões e armazenamento. Foram verificadas a distribuição de centavos, limites de parcelas e pagamentos, duplicidade, pagamentos e despesas vinculadas, separação do Caixa, conversão de orçamento, descontos históricos, custos recebidos, entregas e conflitos de edição.

Resultado final: **78 testes passaram, nenhuma falha**. Todos os arquivos JavaScript do servidor e da interface também passaram na verificação de sintaxe.

A conferência HTTP usou servidor e dados isolados. Duas tentativas simultâneas de pagamento sobre a mesma versão resultaram em um pagamento aceito e outro recusado, preservando uma única despesa. Reenvio idêntico não alterou o arquivo; versão antiga foi recusada sem gravação. Recarga do servidor preservou os registros criados. CSV filtrado apresentou o saldo esperado.

Uma falha de gravação foi induzida em dados de teste: a API recusou a operação, preservou o arquivo e o estado anterior, e aceitou a nova tentativa após remover a causa da falha, sem duplicação. Um arquivo inválido na abertura deixou a API indisponível com orientação e manteve os bytes originais. Fixtures também verificam estruturas inválidas de compras, contas e Caixa.

## Interface

Conferência manual pelo navegador, sempre em dados separados dos registros do Murilo:

- Entrada demonstrativa, navegação e novas telas.
- Conta de R$ 100,01 em três parcelas de R$ 33,34, R$ 33,34 e R$ 33,33.
- Pagamento parcial de R$ 10,01 e outro de R$ 5,00, com saldo total de R$ 85,00 e despesas vinculadas.
- Venda e orçamento de R$ 99,00 com desconto de R$ 9,01 e total líquido de R$ 89,99; duplicação preservou o desconto do orçamento.
- Preparação de compra de quatro unidades a R$ 20,01, total R$ 80,04, sem aumentar estoque; confirmação e reagendamento guardaram o histórico.
- Duas janelas em pagamento e edição de produto: conflito sinalizado, preenchimento preservado e nova revisão explícita antes de continuar.
- Prévia de impressão interna da conta com identificação da empresa e histórico; impressão física não executada.
- Tela estreita em quadro de 390 × 844 pixels, com área interna de 375 pixels sem transbordamento horizontal da página; navegação e formulários de pagamento e produto utilizados.

Durante esta conferência foram corrigidos o redesenho das parcelas ao digitar valor/quantidade, a revisão após conflito de pagamento e a apresentação dos valores atuais ao revisar cadastro. A consulta de alterações apresenta campos e valores em linguagem acessível.

A imagem V0.9-contas.png mostra dados fictícios usados na conferência.

## Dados e limites

Os testes não registraram operações no banco do Murilo. O servidor real foi usado somente para consultas de saúde e arquivos estáticos, além de reinício para carregar a versão nova. O banco existente foi lido e considerado compatível com as validações da V0.9.

A comparação final confirmou que o arquivo do Murilo permaneceu idêntico ao início desta rodada (SHA-256: ca85172173b40f0b9f0bab251d8b3980c8cec9d52771b62b60b6e7a9db72a7b4). O servidor local foi reiniciado com o código final; a consulta de saúde respondeu pronto, versão 0.9, e os cinco novos arquivos de interface responderam normalmente. As duas abas e o servidor temporário de teste foram encerrados, mantendo a aplicação do Murilo em funcionamento.

Esta rodada verifica as entregas novas e regressões diretamente afetadas. Não é auditoria completa do programa. Não foram testados impressão física, instalador Windows, servidor remoto ou operação real com a conexão de internet desligada; a aplicação continua usando arquivos e API locais. Nenhum desses componentes externos foi implementado nesta rodada.
