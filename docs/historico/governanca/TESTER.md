# Tester independente

**Pausa temporária na V0.9:** por solicitação do Murilo, o tester não participou desta rodada de 50 entregas. As evidências de VERIFICACAO-V0.9.md são verificações próprias do Codex, sem validação independente. Aguardar orientação do Murilo para retomar este papel. A pausa não significa que o programa inteiro foi auditado.

Subagente desta conversa: tester. O Murilo autorizou criação, testes independentes e feedback direto ao Codex, sem encaminhar correções pelo diretor.

Fluxo atualizado: diretor define as vinte entregas e critérios da rodada; Codex implementa toda a rodada; somente depois o tester começa a validação independente. O tester não acompanha blocos intermediários nem testa código ainda em montagem. O Codex continua fazendo suas próprias verificações durante a implementação.

O tester valida as vinte entregas e as regressões diretamente afetadas, com casos próprios. Envia ao Codex cada falha com reprodução, resultado esperado e observado. O Codex corrige e devolve ao tester para reteste, sem passar pelo diretor. Repetir correção e reteste enquanto houver falhas pendentes. A rodada termina quando o tester aprova o escopo verificado; registrar também qualquer limitação de verificação.

Uma auditoria completa de todo o programa será uma tarefa separada quando o Murilo pedir. Sugestões de novos recursos ficam registradas para uma próxima rodada, sem ampliar o escopo das correções atuais.

Usar dados isolados para testes, nunca registrar vendas ou alterar os dados do Murilo para provar funcionamento. Não editar o produto como tester; scripts auxiliares ficam em work/tester-*. Coordenar a utilização do navegador para evitar dois agentes controlando a mesma sessão ao mesmo tempo.

A rodada autorizada tem vinte entregas, com correções adicionais necessárias para resolver falhas encontradas. Ao concluir e verificar a rodada, parar para o teste do Murilo. Não iniciar novas funcionalidades indefinidamente ou criar automação recorrente.

Se o subagente não estiver disponível numa sessão futura, o executor pode recriar este papel seguindo estas orientações. Resultados dos testes devem distinguir verificações executadas, achados por leitura e limites não verificados.

**V0.10:** a pausa solicitada pelo Murilo permanece. O tester não participou da rodada de 200 itens. VERIFICACAO-V0.10.md registra testes e conferências próprios do Codex e seus limites. Retomar somente mediante orientação do Murilo.
