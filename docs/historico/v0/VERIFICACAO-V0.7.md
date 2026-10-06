# Validação final da rodada V0.7

Fluxo seguido: chamada do tester depois das 20 entregas implementadas; falhas enviadas diretamente ao executor, correção e reteste. Não houve auditoria antecipada dos blocos nem encaminhamento ao diretor. Dados reais da loja e porta3210 preservados.

## Parecer

Aceite funcional da rodada, com as limitações visuais abaixo. Nenhuma falha pendente nos cenários executados pelo tester. A rodada está pronta para revisão do Murilo; não iniciar outra sem pedido.

## Testes executados pelo tester

- 53 testes do produto e testes independentes antigos executados juntos passaram.
- Integração HTTP exclusiva em work/tester-v7-http-data passou: produtos/clientes ativos e inativos, criação/edição/preços/cancelamento/conversão, reenvio idêntico e carga alterada, versões antigas, validade vencida/renovação, estoque sem reserva, cópia de convertido, snapshots dos preços/nomes, venda recebida em Caixa, venda pendente com vencimento, links, cancelamento de venda sem reabrir orçamento, CSV filtrado com BOM/aspas/linhas/fórmulas, falhas atômicas comparando bytes do arquivo e persistência após nova instância de servidor.
- Concorrência HTTP: duas edições na versão1 produziram uma resposta201 e outra400, mantendo versão2 única; duas conversões simultâneas produziram uma única venda, uma baixa de estoque, um recebimento e versão3.
- Handler de quantidade com DOM simulado executando o código do produto: input válido persiste imediatamente, atualiza subtotal e disponibilidade; quantidade inválida reverte sem perder rascunho.
- Handler de busca: Enter em busca ambígua não adiciona; resultado único disponível adiciona; produto inativo ou sem estoque não adiciona.
- Aviso em diálogo: último diálogo aberto recebe mensagem com rolealert/textContent e a mensagem seguinte reutiliza o parágrafo.

Scripts: tester-v7-http.js, tester-v7-draft.js, tester-v7-search.js, tester-v7-notice.js.

## Falhas corrigidas e retestadas

O rascunho de orçamento só salvava quantidade no onchange. O tester reproduziu input3 mantendo2 em localStorage; o executor mudou para oninput sem redesenhar o campo, e o reteste passou. A busca por Enter passou a exigir resultado único, evitando adicionar a seleção anterior numa busca ambígua. O executor encontrou aviso escondido atrás do diálogo durante QA visual e colocou aviso dentro do diálogo; tester verificou o handler corrigido e executor confirmou a visibilidade real.

## Evidência visual fornecida pelo executor

O navegador não estava habilitado na sessão do tester (inventário vazio). A conferência visual real foi feita pelo executor em3217 com dados separados: edição e atualização de preço99→119, total357, duplicação com nova identidade, quantidade3 após recarga sem blur, filtros e desativação/reativação, bloqueio de conversão com mensagem visível, vínculo entre orçamento e venda, Pix a receber com vencimento e conflito entre duas janelas preservando nota/quantidade antes de adotar a versão atual. A prévia mostrou empresa, observação, validade e aviso sem valor fiscal. Screenshot: outputs/SistemaComercial/V0.7-orcamento.png.

Limitações: impressão física não testada. O IAB não aplicou a dimensão estreita solicitada; a largura real permaneceu1265px. O executor resetou o ajuste e confirmou desktop sem transbordamento. A janela estreita da V0.7 ainda precisa de conferência real. Não declarar responsividade mobile como aprovada nesta rodada.
