# Validação final da rodada V0.8

Tester chamado somente depois das 20 entregas completas. Comunicação de falhas diretamente ao executor; nenhuma auditoria antecipada e nenhuma mensagem ao diretor. Código do produto e dados reais do usuário não foram alterados pelo tester. Porta 3218 reservada à conferência visual do executor e porta 3210 preservada.

## Resultado independente

65 testes do produto e testes independentes anteriores passaram. Três verificações independentes adicionais passaram, registradas em work/tester-v8-http.js, tester-v8-handlers.js e tester-v8-receive-handler.js. Nenhuma falha confirmada nos cenários executados.

### Integração HTTP com base própria

- Fornecedores: nome/contatos/limites, e-mail inválido, reenvio idêntico e carga alterada, edição sem reescrever snapshot em pedido, desativação/reativação.
- Pedido: criação e edição em preparação, custo/quantidade/data inválidos, produtos repetidos, versões antigas, confirmação congelando conteúdo sem movimentar estoque ou financeiro, reenvio em criação/edição/confirmação.
- Recebimento: parcial com quantidade e valores conferidos, movimentos e referências gravados juntos, custos e nomes preservados, reenvio exato sem duplicar, carga alterada e versão antiga recusadas; fornecedor e produto desativados após confirmação ainda recebem entrega.
- Atomicidade: entrega contendo uma linha válida e outra excedente recusada; estado e bytes do arquivo permanecem iguais. O mesmo controle foi usado nos demais pedidos inválidos.
- Encerramento: motivo obrigatório, preservação de estoque e saldo não entregue, reenvio sem efeito adicional, novas entregas recusadas em pedido encerrado.
- Duplicação: nova identidade, nova preparação sem entregas/fechamento, fornecedor atual para revisão e snapshots dos itens.
- Concorrência: duas entregas de 3 unidades contra a mesma versão produziram 201 e 400; apenas uma entrega/baixa de saldo/aumento de estoque persistida. Entrega seguinte concluiu o restante exato.
- Custos: último custo vem de entrega efetiva, mantém preço de venda, compra cancelada sem entrega não substitui custo conhecido.
- CSV: arquivo filtrado com BOM, proteção de fórmula, valor pedido 139,60, recebido 69,80 e não entregue 69,80, situação encerrada e sem outros pedidos.
- Regressões: mercadoria recebida pode ser vendida; pagamento parcial em dinheiro aumenta apenas Caixa; cancelamento da venda devolve estoque sem desfazer recebimento da compra ou custo.
- Arquivos de tela servidos localmente; referências apenas a caminhos locais; arquivos 200. Dados após nova instância do servidor coincidem com estado e arquivo persistidos.

### Handlers com DOM simulado executando o código do produto

- Quantidade e custo persistidos no input sem esperar blur. Subtotal e total conferidos. Custo inválido com três casas preservado com pedido de correção, sem arredondamento silencioso.
- Rascunho de compra independente dos rascunhos de venda/orçamento. Recarga preserva quantidade e custo digitados. Duplicação não herda recibos, confirmação, fechamento ou previsão antiga.
- Recebimento após outra janela: quantidade 2 e nota mantidas, já recebido 3/restante 1/max 1 atualizados, controles liberados, excedente recusado e entrega corrigida 1 revisada na versão atual.
- Último custo escolhe a maior sequência de entrega mesmo quando o relógio/data volta para trás.

## Verificação visual

O navegador da sessão do tester não está habilitado (inventário apps=[] e browsers=[]). A conferência visual real foi executada pelo executor em base isolada na porta 3218, conforme resultados comunicados ao tester:

- Cadastro de fornecedor; custo 20,01 e quantidade 5 preservados após recarga imediata do rascunho.
- Preparação/confirmação sem alteração de estoque; entrega parcial 2 CAM + 1 BOL, custos e vínculos no estoque; encerramento com motivo preservando estoque.
- Duplicação com nova identidade sem entregas; duas abas com conflito preservando quantidade e nota e exigindo revisão. Entrega corrigida conclui o pedido sem excesso.
- Prévia não fiscal com empresa; janela de teste de 390 × 844, largura útil e página de 375 px sem transbordamento, detalhes em diálogo de 351 px, navegação e inclusão por Enter.
- Após recarga, Entrega 2 / Entrega 1 exibidas corretamente. Evidência visual salva pelo executor em outputs/SistemaComercial/V0.8-compras.png.

Impressão física e desconexão real em modo avião não foram executadas. O tester verificou referências e arquivos locais disponíveis; isso não equivale ao teste de desligar a conexão. Os testes com DOM simulado também não são apresentados como teste visual do tester.

## Conferência final focada e parecer

Após o ajuste de apresentação, work/tester-v8-presentation.js executou a função real purchaseBody: Entrega 2 aparece antes de Entrega 1; UUIDs não aparecem no conteúdo; notas e quantidades permanecem; a ordenação não modifica o histórico. Resultado: passou.

Os 12 testes de compras passaram novamente. O teste de integração com Caixa captura o estado antes da entrega e compara o estado após o recebimento; confirma que o recebimento de mercadoria não altera as sessões de Caixa.

V0.8 aprovada nos cenários funcionais executados, sem falha confirmada pendente. A aprovação visual se apoia na conferência real do executor e mantém as limitações acima. Nenhum código do produto ou dado real foi alterado pelo tester. O executor informou verificação da versão 0.8 e arquivos no servidor real com o hash do banco preservado: A1E5EB64B6039923403B33BB2975858F7E4E5ECF5F23E660DC9E70B4D503F3D9.

## Preservação e entrega ao usuário

Servidor local de teste do usuário em http://127.0.0.1:3210 serve a V0.8 e todos os arquivos novos. Banco existente verificado sem alteração (SHA256 A1E5EB64B6039923403B33BB2975858F7E4E5ECF5F23E660DC9E70B4D503F3D9). As janelas e o servidor temporário usados pelo executor foram encerrados; o servidor do usuário continua disponível.

Rodada encerrada após as 20 entregas e a validação do tester, sem falhas confirmadas pendentes nos cenários executados. Aguardar o teste do Murilo antes de iniciar outra rodada. O roteiro está em RODADA-6.md.
