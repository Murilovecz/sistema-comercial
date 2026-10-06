# Auditoria independente da V0.6

Os scripts desta auditoria usam dados exclusivos em work/tester-*-data, portas aleatórias e nunca modificam data/database.json do usuário.

## Resultado consolidado

44 testes passaram: 33 do produto e 11 adicionais independentes. Cinco integrações HTTP isoladas passaram: blocos 1–5, 6–10, 11–15, 16–20 e correções CSV/reposição. O produto poderá adicionar outros testes após este registro.

### Bloco 1–5

Recebimento parcial30 + restante70; valor inválido, três casas e excedente recusados; replay exato e carga alterada; estoque preservado ao receber; legado sem data não inventada; cancelamento preserva dinheiro efetivo; forma antiga integral sem valor com identificação funciona em replay; persistência após recarga. Preço três casas em criação e edição rejeitado.

### Bloco 6–10

Abertura simultânea com mesma chave resulta em uma sessão. Segunda abertura diferente recusada. Nenhum recebimento anterior passa a ter vínculo retroativo. Novas vendas e parcelas ficam vinculadas ao caixa aberto. Pix não aumenta dinheiro físico. Suprimento/sangria/replay corretos. Duas sangrias com o mesmo saldo esperado produzem HTTP201 e400 e não tornam saldo negativo.

### Bloco 11–15

Despesa exige forma. Vínculo explícito somente dinheiro pago hoje, caixa atual e saldo disponível. Replay não duplica e mudança de forma/vínculo é recusada. Cancelar preserva saída efetiva. Pix e dinheiro fora do Caixa não alteram gaveta. Despesas antigas permanecem sem forma. Devolução exige venda cancelada, dinheiro recebido não devolvido e saldo físico. Exemplo combinado conferido: Caixa85, Movimentações com100 recebidos,97,50 despesas e20 devolvidos, diferença-17,50.

### Bloco 16–20

Corrida entre fechamento e recebimento resultou em [400,201]; fechamento e sangria em [201,400]. Valores correntes são conferidos e só a primeira operação compatível salva. Fechamento corrigido preserva data e contagem no replay. Repetição de recebimento/despesa após fechamento não altera sessão. Novas operações em sessão fechada recusadas. Cancelar despesa após fechamento não altera snapshot nem CSV de sessão. CSV protege fórmulas e contém BOM. Ativos de tela são locais e todas as rotas de arquivos referenciados responderam200. Recarga do servidor confere com arquivo persistido.

### Correções encontradas na V0.5

CSV1.000 registros agora prepara arquivo por POST e URL curta; os bytes completos foram conferidos contra exportação esperada, incluindo BOM, aspas, nova linha e neutralização de fórmula.1.001 registros e identificações inválidas recusados. Arquivo preparado mantém snapshot após editar produto. Reposição com mesma identificação não duplica; carga alterada recusada; replay ao atingir MAX_SAFE_INTEGER funciona. Valores monetários com três casas são recusados em vez de arredondados silenciosamente.

## Conferência de interface independente

Conferidos no IAB do tester: abertura100, recebimento parcial30 em dinheiro com restante70, despesa15 explicitamente vinculada, sangria5 e dinheiro esperado110. Ao clicar em uma confirmação nativa antiga de cancelamento, o navegador do subagente travou; não foi possível recuperar o diálogo pela API documentada. O executor substituiu confirmação nativa por diálogo do próprio aplicativo e assumiu o restante da QA visual no seu navegador separado. O cancelamento do dataset de teste foi realizado e conferido por HTTP. Isso é uma limitação da verificação de interface deste tester, e não prova de falha financeira.

Dataset visual disponibilizado ao executor em http://127.0.0.1:51612/. Nenhuma impressora física, pagamento bancário real, sincronização ou autenticação real foi testada nesta rodada.

Feedback enviado diretamente ao diretor e ao executor. Nenhum defeito pendente nos cenários de domínio/API auditados até este registro.

## Complemento da conferência visual pelo executor

Devolução de R$ 30 reduziu dinheiro esperado de R$ 110 para R$ 80; fechamento com R$ 79 exigiu justificativa e guardou a diferença de -R$ 1. CSV baixado pelo navegador e inspecionado; prévia do relatório de impressão exibida com os mesmos valores. Outra sessão aberta com R$ 20 recebeu R$ 5 em uma segunda aba; tentativa de fechar pelo valor anterior foi interrompida sem apagar o valor contado. Após justificativa, fechou com esperado R$ 25 e contado R$ 20.

Cancelamento conferido com diálogo próprio do sistema, estoque devolvido e sem erros no navegador. Caixa, detalhes de sessão e Despesas conferidos na largura de 390 px, sem transbordamento horizontal da página. Escape fechou detalhes. Impressão física não realizada. O diretor aprovou encerramento, sem novos recursos.

O arquivo comercial do Murilo permaneceu com 1.598 bytes e última gravação em 30/09/2026 às 10:49:41, sem mutações durante os testes. O servidor continua vinculado somente ao próprio computador. Os nomes de responsáveis são declarações manuais e o login é demonstrativo.
