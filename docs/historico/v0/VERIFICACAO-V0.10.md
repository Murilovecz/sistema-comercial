# V0.10 — encerramento da rodada de 200 itens

Data: 30/09/2026. Implementação local, sem publicação ou instalação de novos componentes.

## Escopo e status

Os 200 itens de RODADA-8.md têm implementação localizada no código. O checklist marca implementação; a cobertura executada está discriminada abaixo. Não representa 200 versões publicadas, 200 testes distintos ou auditoria integral do programa.

O diretor definiu o roteiro e realizou revisão estática. O Codex implementou, corrigiu os achados e realizou as verificações próprias. O tester permanece pausado por solicitação do Murilo. Encerrar aqui e aguardar o teste do Murilo; não iniciar item 201 ou nova rodada automaticamente.

## Implementação por módulo

| Itens | Entrega | Arquivos principais | Evidência executada |
|---|---|---|---|
| 1–25 | Sessões de inventário, duas contagens, reconferência de referência, ajuste atômico, histórico e comprovante interno | workflows.js; public/workflow-core.js; public/workflows-ui.js | Regras de contagem, conflito, replay, cancelamento, segunda contagem e reserva; abertura, Enter por código, preservação ao alternar contagem e aplicação pela interface |
| 26–50 | Devoluções parciais, destino revendável/avariado, rateio histórico, crédito e restituição manual | workflows.js; public/workflow-core.js; public/workflows-ui.js | Centavos sucessivos exatos; concorrência; produto inativo; recebimentos preservados; restituição externa e Caixa; devolução avariada pela interface |
| 51–75 | Reservas explícitas, validade, renovação, liberação, conversão com preço atual, estoque físico/reservado/livre | workflows.js; server.js; public/reservations-ui.js; public/replenishment-core.js | Disponibilidade, concorrência, vencimento, renovação e replay; compra/estoque separados; criação e conversão pela interface |
| 76–100 | Metadados, etiquetas, edição em lote, contatos duplicados e pesquisa geral | catalog.js; public/business-core.js; public/business-ui.js | Lote atômico, versões, etiquetas e contatos normalizados; filtro por marca, edição preservando filtro e retorno ao resultado com foco |
| 101–125 | Plano de parcelas, recebimento identificado, distribuição, crédito comercial e perdão de saldo | accounts.js; public/accounts-core.js; public/accounts-ui.js | Centavos, distribuição, perdão fixo, crédito após pagamentos e legado sem recebimento fictício; plano de duas parcelas e recebimento parcial pela interface |
| 126–150 | Agenda manual, vínculos, histórico e central com ocultação/restauração | tasks.js; public/tasks-ui.js; public/business-core.js | Versões, reenvio, conclusão, reabertura e vínculo; ocultação/restauração por HTTP; criação e conclusão pela interface |
| 151–175 | 21 consultas gerenciais, filtros, CSV, impressão interna, consultas salvas e comparação | public/business-core.js; public/manager-ui.js | Consulta de todos os tipos sem alterar a base; limites numéricos e datas; 21 telas sem erro; filtros específicos de produto/tipo e favoritos salvos |
| 176–200 | Favoritos, atalhos, filtros, ordenação, páginas, links, rascunhos, recuperação e diagnóstico | public/experience-ui.js; public/store.js; storage.js; workflow-storage.js | Segunda página preservada e foco após detalhes; Ctrl+K e F2; link inexistente; servidor realmente interrompido e reiniciado; recuperação da mesma confirmação; tela de 390 px |

## Verificações executadas

- **111 testes de regras passaram, zero falhas**, executados na pasta do projeto com `node --test --test-isolation=none`. Casos em round8.test.js e round8-integrity.test.js complementam as regressões anteriores. Uma cópia duplicada de um teste antigo foi removida da contagem.
- **79 verificações HTTP passaram**, com dados fictícios em pasta separada. As novas rotas e todos os arquivos da interface responderam; reenvio exato permaneceu único e uma alteração concorrente foi recusada.
- Falha real de gravação foi provocada somente na pasta isolada. O arquivo original e o estado em memória permaneceram intactos; o reenvio protegido salvou uma vez após recuperar a gravação. Falhas de persistência dos seis novos grupos de operações também foram verificadas com adaptador de armazenamento isolado.
- A base isolada foi relida pelo validador. Um servidor novo abriu os registros persistidos; a recuperação pela interface continuou a confirmação após o reinício.
- Na interface: inventário, leitura com Enter, contagem manual, reserva e conversão, devolução avariada, plano e pagamento parcial, tarefa e conclusão, metadados, pesquisa, relatórios, favoritos, filtros, páginas e retorno de foco.
- A indisponibilidade foi simulada encerrando o servidor de teste. A confirmação mostrou erro, manteve o preenchimento e bloqueou o botão até a consulta explícita dos dados atuais. Após reiniciar, o mesmo pedido foi confirmado uma única vez.
- Conferência em **390 × 844 px**, sem transbordamento horizontal da página; tabelas continuam com rolagem própria.
- Atalhos Ctrl+K e F2 e Enter no campo de contagem foram exercitados. F2 moveu o foco de productSearch para saleScan.
- Sintaxe dos arquivos JavaScript verificada. As novas consultas não produziram erros de execução na navegação exercitada. A falha de conexão provocada gera o erro de rede esperado.
- Conferência final após recarregar: filtros de movimentos ficam ocultos em Estoque atual. Imagem da consulta com dados fictícios salva em V0.10-relatorios.jpg.
- O servidor principal em 127.0.0.1:3210 foi reiniciado com a versão nova e a base original respondeu à consulta de leitura. Nenhuma operação de teste foi gravada nela.

## Preservação da base do Murilo

SHA-256 antes e após as verificações: `e4f207b6eb261c9e4da4b77c8675141ebd19af8a82710275ace1bfa999fbe07d`.

As verificações comerciais foram feitas com registros fictícios isolados. O arquivo data/database.json principal permaneceu igual ao início desta rodada.

## Roteiro para o Murilo

1. Abra INICIAR.cmd e entre na demonstração.
2. Em Cadastros e estoque → Inventário físico, conte produtos, salve progresso e revise o ajuste.
3. Em Vendas e consultas → Reservas, separe mercadorias e confira o saldo livre na consulta e na venda.
4. Converta uma reserva, devolva parte da venda e confira o destino do estoque. Restituição de dinheiro é uma declaração manual separada.
5. Em Financeiro e compras → Contas a receber, defina parcelas de uma venda ainda não recebida e registre pagamento parcial.
6. Em Rotina e relatórios, experimente Agenda, Central operacional, Pesquisa geral e Relatórios. Salve uma consulta e marque como favorita.
7. Navegue entre listas com filtros e páginas, abra detalhes e retorne. Informe erros observados e melhorias desejadas para a próxima rodada.

## Limites e pendências de verificação

Não houve aceite independente do tester nem teste exaustivo de cada combinação de dados e formulário. O hardware de leitor, impressão física, desligamento da internet, outro computador e volume elevado de dados não foram exercitados. O roteiro usa leitor em modo teclado e prévias internas, sem valor fiscal.

Login continua fictício, com responsável declarado. Dados ficam em JSON local e só há um servidor neste computador. Executável Windows, servidor central, sincronização e autorização offline com validade permanecem etapas futuras da arquitetura. Não há cobrança, assinatura, backup ou emissão fiscal nesta rodada.

O desligamento do computador solicitado pelo Murilo será programado somente após salvar os arquivos e finalizar esta rodada. O resultado do desligamento deve ser relatado conforme a execução real, separado da verificação do produto.
