# V0.6 — recebimentos parciais e Caixa

## Vinte entregas desta rodada

1. Modelo de recebimentos compatível com vendas anteriores, sem inventar datas.
2. Recebimento parcial com saldo e proteção contra confirmação repetida.
3. Tela para informar valor recebido e forma efetiva.
4. Histórico de cada recebimento e situação parcialmente recebida.
5. Financeiro com valor recebido e saldo, Movimentações por data efetiva.
6. Abertura de uma única sessão de Caixa.
7. Dinheiro inicial, entradas, saídas e dinheiro esperado separados de Pix/cartões.
8. Novos recebimentos vinculados ao Caixa aberto, sem vincular os antigos.
9. Suprimento manual com motivo.
10. Sangria limitada ao dinheiro disponível.
11. Forma de pagamento nas novas despesas; antigas sem informação permanecem assim.
12. Despesa em dinheiro paga hoje com vínculo opcional e explícito ao Caixa.
13. Cancelamentos preservam recebimentos e pagamentos efetivos.
14. Devolução manual de dinheiro de venda cancelada, limitada ao recebido ainda não devolvido.
15. Conferência do dinheiro contado e justificativa da diferença.
16. Fechamento definitivo, sem alterar a primeira contagem quando a confirmação é repetida.
17. Histórico de sessões por período de abertura, com detalhes.
18. CSV e prévia para impressão do relatório interno de uma sessão.
19. Revisão dos dados atuais, preservação de preenchimento em conflitos e proteção do diálogo enquanto salva.
20. Consolidação, testes independentes, persistência e roteiro de uso.

As correções adicionais solicitadas pelo tester abrangem reposição sem duplicação no reenvio, CSV de até 1.000 registros sem endereço longo, precisão de duas casas decimais também no servidor e proteção dos diálogos durante o salvamento. A equipe encerra após resolver falhas da rodada e aguarda o teste do Murilo.

## Como testar com dados fictícios

Se necessário, abra INICIAR.cmd. Acesse http://127.0.0.1:3210 e atualize a página para conferir V0.6.

1. Em Caixa, abra uma sessão com R$ 100 de dinheiro inicial.
2. Registre uma venda de R$ 100 como A receber.
3. Em Financeiro, receba R$ 30 em Dinheiro. Confira recebido R$ 30, saldo R$ 70 e dinheiro esperado R$ 130.
4. Receba os R$ 70 restantes em Pix. O saldo da venda fica zero; o dinheiro físico continua R$ 130. Nos detalhes, aparecem os dois recebimentos.
5. Em Despesas, registre R$ 10 pagos hoje em Dinheiro e escolha Registrar saída do Caixa aberto. O dinheiro esperado fica R$ 120. Uma despesa sem vínculo ou em Pix não muda a gaveta.
6. Em Caixa, registre um suprimento de R$ 5 e uma sangria de R$ 5, ambos com motivo. Confira que o esperado volta a R$ 120.
7. Cancele a venda de teste. Os recebimentos permanecem nas Movimentações e no Caixa. Nos detalhes, registre a devolução de R$ 30 em dinheiro, se realmente devolveu no teste. O esperado passa para R$ 90. A devolução de Pix fica fora deste controle.
8. Confira e feche informando R$ 90 contados. Teste também uma diferença em outra sessão: ela exige justificativa. Abra os detalhes da sessão fechada e baixe o CSV ou confira a prévia de impressão.
9. Abra outra sessão, feche e reabra o programa, consulte o histórico. Reduza a janela e use Tab/Escape nos formulários.

O exemplo depende de não registrar outras movimentações durante o teste. Use o dinheiro esperado exibido pelo sistema para conferir o seu próprio cenário.

## Regras e limites

O Caixa acompanha dinheiro físico declarado nesta instalação. Saldo inicial e suprimento não são receita. Pix/cartões são mostrados separadamente. Sem sessão aberta, vendas e recebimentos continuam possíveis, com indicação de falta de vínculo; abrir uma sessão não traz movimentos antigos para dentro dela.

Responsáveis são nomes informados manualmente. O login ainda é demonstrativo; esses nomes não comprovam identidade ou permissão. Não há consulta bancária, emissão fiscal, estorno automático, sincronização entre máquinas, assinatura implementada ou executável Windows empacotado.

Cancelar é uma mudança comercial, não a devolução do dinheiro. Financeiro exclui vendas canceladas dos indicadores comerciais. Movimentações mantém recebimentos e despesas já declarados e deduz devoluções de dinheiro registradas. Devoluções por Pix/cartão e recuperação do dinheiro de uma despesa cancelada não têm fluxo próprio nesta versão.

Uma sessão fechada não recebe novos movimentos; a contagem é preservada. Recebimentos posteriores pertencem à sessão então aberta ou ficam sem vínculo. As datas dos períodos de relatório seguem o calendário de São Paulo.

Dados comerciais ficam em data/database.json. Rascunhos de venda ficam no armazenamento do navegador desta instalação, sem reserva de estoque. Não há dependência de serviços externos para operar localmente; o servidor local precisa permanecer ligado.

CSV aceita até 1.000 registros filtrados. O arquivo preparado tem validade de cinco minutos e pode ser preparado novamente. Relatórios e comprovantes são internos, sem valor fiscal. Impressão física depende da impressora e deve ser conferida pelo usuário.

## Resultado da verificação

44 testes passaram (33 do produto e 11 independentes do tester), além das integrações HTTP dos quatro blocos e correções da base. Conferência visual por tester e executor: parcelas, Caixa, despesas, sangria, devolução, fechamento com diferença, histórico, CSV e revisão entre duas abas. Arquivos e dados continuam locais; persistência conferida após recarga do servidor. Impressão verificada somente na prévia. Consulte VERIFICACAO-V0.6.md. Rodada aprovada pelo diretor e encerrada para o teste do Murilo.
