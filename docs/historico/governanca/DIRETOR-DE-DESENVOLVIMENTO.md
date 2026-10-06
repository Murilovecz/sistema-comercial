# Diretor de desenvolvimento

O Murilo pode escrever seus pedidos nesta conversa em linguagem comum, começando com “Diretor, quero...”. O agente principal encaminha o pedido ao subagente `diretor_desenvolvimento`, que transforma a necessidade em uma orientação para implementação.

O diretor define o resultado esperado, as regras relevantes, a prioridade e como verificar que o pedido foi atendido. Faz somente perguntas indispensáveis; escolhas técnicas rotineiras ficam com a equipe. O agente principal implementa, verifica e explica o resultado em português acessível.

O diretor é um subagente desta conversa, sem chat separado. Se ele não estiver mais disponível em uma sessão futura, o agente principal pode recriar esse papel com estas orientações.

Preservar a evolução gradual da base local. Não incluir cobrança, backup ou licenciamento sem novo pedido. Não alterar arquivos ou ampliar o escopo quando a tarefa for apenas traduzir requisitos.

## Autonomia autorizada pelo Murilo

**Exceção da rodada V0.9:** o Murilo autorizou 50 entregas e pausou temporariamente o tester para concentrar a rodada na implementação. O diretor definiu as 50 entregas de RODADA-7.md; o Codex implementou e realizou verificações próprias, sem aceite independente. Ao concluir esta rodada, parar para o Murilo testar. Não reativar o tester sem orientação do Murilo. O fluxo abaixo registra a autorização anterior e permanece como referência quando a participação do tester for retomada.

O Murilo ampliou o limite de cinco para exatamente vinte ciclos por rodada e atualizou o fluxo após a V0.6: o diretor define as vinte entregas, prioridades e critérios; o Codex implementa toda a rodada e faz suas próprias verificações; somente então o tester valida as entregas e as regressões diretamente afetadas.

O tester relata falhas diretamente ao Codex. Correção e reteste seguem entre Codex e tester até a validação final, sem aprovação intermediária do diretor. Essas correções podem ultrapassar os vinte ciclos, mas não acrescentam novos recursos. Auditoria completa do programa fica para um pedido separado do Murilo, conforme TESTER.md.

Depois da validação do tester, encerrar a rodada e pedir ao Murilo que teste. Incorporar o retorno dele na próxima rodada autorizada. Não criar automação recorrente nem novas funcionalidades fora da rodada enquanto aguarda esse retorno. Os registros abaixo descrevem rodadas anteriores; o fluxo atualizado prevalece para as próximas.

Rodada 1 concluída na V0.3: revisão de venda e deduplicação; detalhes e filtros de vendas; disponibilidade de estoque; formulários e visual responsivo; consolidação e verificação final. Oito testes e integração com dados isolados passaram. Aguardando o Murilo testar. Consulte RODADA-1.md.

Rodada 2 autorizada e concluída na V0.4: forma de pagamento, situação recebido/a receber, consulta financeira, registro manual de recebimento integral, consolidação. Treze testes e integração com recarga de dados passaram; UI de venda pendente e recebimento verificada com dados separados, largura de 390 px sem transbordamento da página. Consulte RODADA-2.md. Parar e aguardar novo retorno do Murilo, sem iniciar ciclo adicional.

Rodada 3 autorizada e concluída na V0.5, com vinte ciclos. Vinte e dois testes passaram e a integração verificou persistência após recarga. A interface foi conferida em dados separados; o CSV foi baixado e inspecionado. Diretor aprovou o encerramento, sem ciclo 21. Consulte RODADA-3.md. Agora aguardar o teste do Murilo.

Rodada 4: V0.6, vinte entregas de recebimentos parciais e Caixa operacional manual, mais correções solicitadas pelo tester. Consulte RODADA-4.md. Concluída e aprovada pelo diretor: 44 testes passaram, auditoria independente de regras/API e conferência visual pela equipe concluídas. Parar para o teste do Murilo, sem novas funcionalidades.

Rodada V0.7 encerrada: diretor definiu as 20 entregas; Codex implementou a rodada inteira; tester validou depois e reportou diretamente ao Codex. Correções e retestes concluídos, com aceite funcional. Roteiro em RODADA-5.md e evidências em VERIFICACAO-V0.7.md. Aguardar o teste do Murilo antes de nova rodada.

Rodada V0.8 implementada: diretor definiu as 20 entregas; Codex implementou fornecedores e compras; tester foi chamado somente depois da rodada completa. Validação final e limites em VERIFICACAO-V0.8.md; roteiro em RODADA-6.md. Ao concluir a validação, parar para o teste do Murilo, sem iniciar outra rodada automaticamente.

**Rodada 8 — V0.10:** Murilo autorizou 200 itens. Diretor definiu o roteiro e revisou a cobertura; Codex implementou e realizou verificações próprias. O checklist registra implementação, sem aceite independente do tester. Evidências e limites em VERIFICACAO-V0.10.md. Encerrar a rodada e aguardar retorno do Murilo; não iniciar item 201 automaticamente.
