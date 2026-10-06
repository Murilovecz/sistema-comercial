# Rodada 9 — exatamente 200 melhorias distintas sobre V0.10

Projeto único: D:\Projeto Sistema Local. Nenhuma leitura ou alteração da cópia em C é autorizada nesta rodada.

Status: 200 entregas implementadas e revisadas. Evidências e limites de cobertura em VERIFICACAO-V0.11.md. Cada item numerado é funcionalidade distinta; testes, comandos e documentação não são contabilizados como recursos. Tester independente permanece pausado. Executor realiza verificações próprias isoladas e registra evidências separadamente.

## Contrato transversal

Preservar dados e snapshots da V0.10. Campos/coleções novos são opcionais para registros anteriores; nenhum movimento, crédito, origem ou data antigo é presumido. Valores monetários usam centavos inteiros e percentuais em pontos-base inteiros (duas casas percentuais); quantidades permanecem inteiras. Multiplicações/rateios usam aritmética exata com limites de inteiros seguros; arredondamento comercial definido: metade para cima no valor unitário, gravado no snapshot. Soma e excedentes são validados no servidor.

Mutação relacionada é atômica: validar primeiro, persistir todas as alterações e só então publicar sucesso. Toda confirmação de movimento tem identificador persistido, replay idêntico e conflito para carga alterada. Controle de versão e de saldo impede disputa entre abas. Falha preserva formulário e estado anterior; revisão é requisito antes de nova tentativa. Responsáveis são declarados, sem comprovação de identidade.

Sem novas dependências, autenticação real, nuvem, sincronização, executável, fiscal, banco real, cobrança SaaS, licença ou backup. Datas seguem America/Sao_Paulo. Tabelas/ações funcionam por teclado e em janela estreita com rótulos textuais, foco e rolagem interna. Impressões são documentos internos sem valor fiscal; contato com terceiros não será enviado. Exportações protegem textos contra fórmulas e explicam limites. Não declarar impressão física ou leitor físico testado sem execução.

## Compatibilidade comercial e ordem

Listas e promoções: preço padrão continua padrão quando não houver escolha explícita. Uma única origem de preço por item; promoção é aplicada sobre essa origem, e desconto adicional total aparece separado. Orçamentos congelam preços negociados; conversão não exige promoção/lista ainda vigente porque usa documento autorizado histórico. Reserva continua sem congelar preço. Devoluções usam preço líquido histórico e rateio fixado, nunca regra promocional atual.

Quarentena: manter product.stock como físico vendável da V0.10. Unidades retidas são saldo separado, físico total = vendável + retido. Reservas só comprometem vendável. Inventário existente continua sobre vendável; retido tem conferência própria. Destinos de entradas/devoluções novos são explicitamente escolhidos; registros anteriores não ganham saldo retido automático.

Devolução ao fornecedor não cancela recebimento, não baixa dívida e não presume pagamento recebido. Restituição efetiva de fornecedor é entrada financeira própria e deve integrar fluxo apenas uma vez. Caixa fechado permanece imutável. Retorno de mercadoria recusada requer declaração física; não ocorre pela simples recusa comercial.

Crédito de loja: exclusivo de crédito de restituição existente, cliente identificado e conversão explícita; não permitir carga arbitrária, transferência entre clientes ou resgate automático. Emissão desloca crédito de restituição pendente para saldo interno. Uso liquida comercialmente a venda sem ser dinheiro recebido; receiptList/fluxo/Caixa não contabilizam esse consumo como entrada. Alocações de origem/uso permitem reversão exatamente uma vez. Devolução de venda paga com crédito restaura primeiro a parte interna pela alocação histórica; restituição em dinheiro nunca ultrapassa dinheiro real ainda não restituído. Não apagar dinheiro efetivo nem reescrever total original.

Entrega logística não cria baixa física adicional: venda já baixou estoque. Retorno logístico de tentativa não devolve estoque vendável; somente devolução comercial ou cancelamento compatível o fazem. Conferências e saldos de remessas devem descontar devoluções e impedir novas expedições de venda cancelada.

Cotações não enviam mensagens, não reservam mercadorias e não criam dívida. Escolha comercial explícita pode gerar preparações de pedidos, sem confirmá-los automaticamente. Frete permanece referência separada e não modifica custo histórico ou financeiro.

Orçamentos de despesas são limites informativos, não saldo ou autorização financeira. Planejamento não soma pagamento e obrigação pendente duas vezes. Análises descrevem bases conhecidas e nunca lucro, valor contábil do estoque ou abandono presumido.

Implementar módulos na sequência; crédito interno antes da entrega e análises. Interfaces novas devem expor as ações pelos detalhes e lista correspondentes, não existir apenas em API. Cada item inclui efeito e critério de aceitação; checklist só muda mediante implementação localizada e conferência do comportamento correspondente.

## Listas de preços — 1–20

1. [x] Cadastrar lista de preços nomeada com descrição e vigência opcional; criação não altera o preço padrão dos produtos.
2. [x] Incluir produtos ativos com preços explícitos em centavos; cada produto aparece uma vez por lista.
3. [x] Editar preços de lista com versão e revisão de valores anteriores e novos; histórico vendido permanece intacto.
4. [x] Remover produto de lista sem removê-lo do cadastro ou de documentos anteriores.
5. [x] Duplicar lista para nova negociação, com identidade própria e preços revisáveis.
6. [x] Desativar e reativar lista; lista inativa não pode ser aplicada em nova operação.
7. [x] Associar lista preferencial ao cliente por escolha explícita, sem mudar vendas ou orçamentos existentes.
8. [x] Selecionar lista na venda e mostrar origem do preço por item antes de confirmar.
9. [x] Usar preço padrão como alternativa quando produto não estiver na lista, com identificação visual explícita.
10. [x] Gravar identificação da lista e preço unitário aplicado no snapshot da venda, sem confiar em preço arbitrário da interface.
11. [x] Selecionar lista ao montar orçamento; congelar preços ao salvar e honrá-los na conversão.
12. [x] Atualizar preços de orçamento usando lista escolhida com comparação e confirmação, sem atualização silenciosa.
13. [x] Selecionar lista na conversão de reserva e revisar preços vigentes antes de baixar estoque.
14. [x] Bloquear aplicação de lista fora de vigência no servidor; prazo usa calendário local.
15. [x] Alterar vigência com motivo e histórico; operações antigas permanecem válidas.
16. [x] Comparar duas listas por produto mostrando preço padrão, preços selecionados e diferença em centavos.
17. [x] Reajustar seleção de preços por percentual com duas casas, regra de arredondamento fixa e revisão antes de gravar.
18. [x] Definir preço mínimo informativo por produto e exigir justificativa explícita em negociação abaixo dele, sem alegar cálculo de margem.
19. [x] Consultar aplicações da lista em vendas e orçamentos com vínculos históricos.
20. [x] Exportar e imprimir lista filtrada com vigência e preços, indicando ausência de valor fiscal.

## Promoções comerciais — 21–40

21. [x] Cadastrar promoção de preço unitário fixo por produto, nome e intervalo opcional, sem alterar preço padrão.
22. [x] Cadastrar promoção percentual por produto com base explícita no preço selecionado e arredondamento em centavos.
23. [x] Definir quantidade mínima inteira para elegibilidade da promoção.
24. [x] Escolher produtos elegíveis explicitamente ou por categoria capturada na regra, exibindo o escopo atual.
25. [x] Ativar, pausar ou encerrar promoção preservando histórico.
26. [x] Detectar promoções elegíveis no carrinho e apresentar sugestões, sem aplicá-las silenciosamente.
27. [x] Aplicar promoção por escolha explícita com subtotal anterior e posterior na revisão.
28. [x] Resolver sobreposição escolhendo uma promoção por item; impedir acumulação invisível.
29. [x] Remover promoção aplicada e restaurar o preço da origem escolhida, sem perder quantidades.
30. [x] Reavaliar elegibilidade após mudar quantidade, cliente ou lista de preço e exigir revisão se houver diferença.
31. [x] Recalcular promoção no servidor usando regra vigente e preços autorizados antes da venda.
32. [x] Guardar regra, base e preço final promocional no snapshot; alteração posterior não muda documento salvo.
33. [x] Aplicar promoção em orçamento por escolha explícita e preservar preço negociado após salvar.
34. [x] Duplicar orçamento promocional preservando preço histórico, identificando que promoção pode não estar vigente.
35. [x] Combinar promoção com desconto total somente por confirmação explícita que mostra ambos os efeitos.
36. [x] Consultar promoções por produto, situação e vigência sem misturar com desconto manual.
37. [x] Consultar vendas vinculadas a promoção com valor original da base e vantagem concedida.
38. [x] Comparar concessões de promoção e descontos adicionais no período sem apresentar lucro.
39. [x] Programar início e fim por data local; ativação depende do servidor e não de aba aberta.
40. [x] Imprimir material interno de preços promocionais e exportar regras, com base e condições legíveis.

## Quarentena e avarias — 41–60

41. [x] Criar área de quarentena lógica e separar físico vendável de unidades retidas; saldo antigo não é reinterpretado.
42. [x] Registrar retenção manual de unidades vendáveis com motivo, limitado ao livre sem comprometer reservas.
43. [x] Gravar retirada do vendável e entrada em quarentena numa operação completa, com movimentos vinculados.
44. [x] Identificar entrada retida com produto, origem opcional, responsável declarado e data real.
45. [x] Encaminhar explicitamente unidades não revendáveis de nova devolução para quarentena; devoluções antigas não ganham saldo presumido.
46. [x] Receber mercadorias de compra com parte retida explicitamente, mantendo total recebido e dividindo destinos físicos.
47. [x] Consultar entradas retidas por produto, origem, período e situação.
48. [x] Registrar inspeção de entrada retida com conclusão e observação sem alterar saldo.
49. [x] Liberar parte das unidades retidas ao vendável após inspeção declarada, com motivo.
50. [x] Impedir liberação maior que saldo retido e proteger reenvio e concorrência.
51. [x] Descartar parte de unidades retidas com motivo e confirmação; descarte não registra despesa automaticamente.
52. [x] Preservar movimentos de liberação e descarte ligados à entrada original.
53. [x] Mostrar vendável, reservado, livre, retido e físico total na consulta do produto.
54. [x] Contar quarentena por entrada em conferência específica, sem aplicar o inventário vendável a esses saldos.
55. [x] Registrar ajuste de quarentena após comparação e motivo, recusando versão desatualizada.
56. [x] Impedir estoque retido de entrar em carrinho, reserva ou sugestão de quantidade disponível.
57. [x] Bloquear desativação de produto com quarentena pendente até disposição explícita das unidades.
58. [x] Criar acompanhamento de inspeção a partir da entrada retida com vínculo próprio.
59. [x] Consultar tempo de retenção e entradas sem inspeção, sem prazo ou qualidade presumidos.
60. [x] Exportar e imprimir posição de quarentena e destinos de unidades, distinguindo quantidade de perda financeira.

## Devoluções a fornecedores — 61–80

61. [x] Preparar devolução vinculada a entrega de compra, preservando pedido e recebimento originais.
62. [x] Selecionar unidades por item limitadas ao recebido menos devoluções anteriores daquela origem.
63. [x] Escolher saída do vendável ou de entrada retida compatível, com quantidades e vínculos explícitos.
64. [x] Exigir motivo e permitir referência comercial de retorno, sem gerar documento fiscal.
65. [x] Calcular valor de referência pelo custo histórico da entrega, sem alterar custos de outras compras.
66. [x] Salvar preparação de devolução sem retirar estoque ou reduzir obrigação a pagar.
67. [x] Editar preparação com controle de versão e revisão de quantidades antes da confirmação.
68. [x] Confirmar expedição ao fornecedor baixando os destinos físicos atomicamente.
69. [x] Impedir retirada vendável que comprometa reservas e retirada retida maior que saldo da entrada.
70. [x] Proteger expedição contra reenvio e devoluções concorrentes acima da quantidade recebida.
71. [x] Permitir devolver produto ou fornecedor inativo de entrega histórica sem reativar cadastro.
72. [x] Cancelar preparação ainda não expedida com motivo e sem movimento físico.
73. [x] Registrar aceite declarado do fornecedor com data e referência, sem inferir restituição financeira.
74. [x] Mostrar solicitado, expedido e aceito por item sem permitir aceite acima do expedido.
75. [x] Registrar recusa comercial do fornecedor preservando unidades expedidas; nenhuma mercadoria volta automaticamente.
76. [x] Registrar retorno físico de unidades recusadas para vendável ou quarentena por escolha explícita e confirmação.
77. [x] Registrar restituição efetivamente recebida do fornecedor por forma/data, separada de contas a pagar e crédito comercial.
78. [x] Vincular restituição em dinheiro de hoje ao Caixa aberto mediante declaração explícita; outras formas não alteram dinheiro físico.
79. [x] Consultar pendências físicas e financeiras da devolução, sem reduzir dívida automaticamente.
80. [x] Imprimir termo interno e exportar devoluções com custos históricos, movimentos e restituições sem valor fiscal.

## Crédito de loja por devolução — 81–100

81. [x] Oferecer conversão explícita de crédito de restituição de devolução em crédito de loja para cliente identificado.
82. [x] Converter valor limitado ao crédito existente, sem criar entrada de dinheiro ou baixar estoque.
83. [x] Manter vínculo entre crédito emitido e venda/devolução de origem, com data e responsável declarado.
84. [x] Proteger emissão contra reenvio e emissão concorrente acima do crédito de restituição disponível.
85. [x] Consultar saldo de crédito de loja por cliente separado de contas a receber e dinheiro recebido.
86. [x] Mostrar extrato de emissões, usos, cancelamentos e saldo, com vínculos de origem/destino.
87. [x] Usar crédito de loja em nova venda do mesmo cliente por valor explícito limitado ao saldo e total líquido.
88. [x] Revisar uso de crédito e restante a pagar antes de confirmar venda.
89. [x] Gravar consumo de crédito e criação da venda juntos; falha não consome crédito.
90. [x] Registrar crédito usado como liquidação interna separada de recibos de dinheiro, sem inflar Caixa ou fluxo efetivo.
91. [x] Permitir pagamento misto com crédito de loja e recebimento declarado do restante.
92. [x] Permitir restante a receber após uso parcial de crédito, mantendo plano e saldo corretos.
93. [x] Impedir duas vendas concorrentes de consumir o mesmo saldo.
94. [x] Consumir crédito em ordem de emissão com alocações identificadas; não apagar origem.
95. [x] Reverter consumo interno ao cancelar venda, restaurando crédito uma vez e preservando recebimentos reais.
96. [x] Restaurar proporcionalmente crédito interno em devolução parcial pela alocação histórica, sem prometer dinheiro que não entrou.
97. [x] Cancelar crédito ainda não utilizado com motivo, reabrindo crédito de restituição na origem sem enviar dinheiro.
98. [x] Impedir transferência de crédito entre clientes ou resgate automático em dinheiro nesta versão.
99. [x] Mostrar crédito de loja na consulta comercial do cliente e na revisão da venda.
100. [x] Exportar e imprimir extratos e comprovantes internos, distinguindo crédito comercial de pagamento bancário.

## Separação e entrega de vendas — 101–120

101. [x] Criar ordem de entrega explicitamente a partir de venda confirmada sem baixar estoque novamente.
102. [x] Guardar destinatário, endereço e contato de entrega como snapshot opcional distinto do cadastro.
103. [x] Selecionar entrega local, retirada ou outro meio declarado sem integração externa.
104. [x] Definir previsão e janela de atendimento opcional sem alterar vencimento financeiro.
105. [x] Salvar observação de acesso e instruções de entrega preservando histórico.
106. [x] Listar ordens por situação, cliente, previsão e meio de entrega.
107. [x] Montar lista de separação com produtos, códigos e localização física atual, sem nova reserva.
108. [x] Conferir itens por leitor em modo teclado ou quantidade manual, limitado ao vendido não devolvido.
109. [x] Salvar progresso de separação com versão, sem gerar venda ou movimento de estoque.
110. [x] Revisar faltantes antes de marcar separação concluída; bloquear excesso de conferência.
111. [x] Preparar expedição parcial por item preservando quantidades já expedidas.
112. [x] Confirmar expedição com responsável declarado, data e referência opcional, sem lançar despesa presumida.
113. [x] Registrar entrega parcial declarada com recebedor informado e data, limitada ao expedido.
114. [x] Registrar tentativa sem sucesso com motivo mantendo unidades em trânsito.
115. [x] Reagendar previsão com motivo e histórico, preservando expedições e entregas.
116. [x] Registrar retorno logístico para nova tentativa sem acrescentar estoque: venda segue válida.
117. [x] Bloquear novos despachos de venda cancelada; preservar remessas históricas e indicar pendência logística.
118. [x] Conciliar devoluções comerciais com saldo a separar/expedir, exigindo revisão de ordem conflitante.
119. [x] Imprimir romaneio interno e termo de entrega sem valor fiscal, com aviso de declaração manual.
120. [x] Consultar entregas vencidas, em trânsito e concluídas por período e exportar posição logística.

## Cotações com fornecedores — 121–140

121. [x] Criar solicitação de cotação com produtos e quantidades inteiras sem gerar pedido ou obrigação.
122. [x] Selecionar múltiplos fornecedores ativos para a mesma solicitação sem enviar mensagens.
123. [x] Definir prazo de resposta opcional e observação comercial.
124. [x] Editar solicitação em preparação com versões e sem alterar respostas confirmadas.
125. [x] Registrar resposta manual por fornecedor com custo unitário e validade opcional.
126. [x] Registrar produto não cotado separadamente de custo zero.
127. [x] Registrar quantidade ofertada e prazo de entrega declarado por item.
128. [x] Registrar custo adicional de frete declarado por resposta separado dos produtos.
129. [x] Revisar custo de itens e frete antes de confirmar resposta, validando soma em centavos.
130. [x] Editar resposta antes da escolha preservando histórico dos valores anteriores.
131. [x] Comparar fornecedores por item com custo, quantidade atendida, prazo e validade.
132. [x] Comparar total de propostas completas incluindo frete, identificando propostas incompletas.
133. [x] Selecionar fornecedor por item explicitamente sem escolha automática do menor preço.
134. [x] Justificar escolha de alternativa com custo maior quando houver resposta comparável.
135. [x] Revisar agrupamento das escolhas em pedidos separados por fornecedor.
136. [x] Criar preparações de compra a partir das escolhas de maneira única e atômica.
137. [x] Preservar vínculo da preparação de compra à solicitação e resposta escolhida.
138. [x] Manter frete como referência separada, sem distribuí-lo ao custo histórico ou registrar despesa automaticamente.
139. [x] Encerrar ou cancelar solicitação com motivo sem cancelar pedidos já criados.
140. [x] Imprimir solicitação interna e exportar comparação, identificando que o sistema não envia contato ao fornecedor.

## Orçamentos de despesas — 141–160

141. [x] Cadastrar centro de acompanhamento de despesas, nome e situação, sem criar permissão ou filial fiscal.
142. [x] Vincular centro opcional a nova despesa; antigas permanecem Sem centro.
143. [x] Reclassificar categoria ou centro de despesa mediante motivo, preservando valor, data e Caixa.
144. [x] Impedir reclassificação simultânea com versão e mostrar histórico anterior.
145. [x] Definir orçamento de gastos por centro, categoria e mês em centavos positivos.
146. [x] Revisar orçamento antes de gravar; repetição não duplica limite mensal.
147. [x] Editar orçamento com motivo e histórico sem alterar despesas efetivas.
148. [x] Duplicar orçamento mensal para próximo mês com revisão de valores e identidade própria.
149. [x] Definir responsáveis declarados por acompanhamento do orçamento, sem autorização de pagamento.
150. [x] Consultar gasto efetivo e limite por centro/categoria usando datas reais de pagamento.
151. [x] Mostrar restante ou excesso do limite sem chamar resultado de saldo de Caixa.
152. [x] Mostrar obrigações a pagar classificadas no centro separadas de despesas já pagas.
153. [x] Classificar obrigação em centro e categoria para planejamento sem gerar nova saída.
154. [x] Projetar limite considerando despesas e obrigações pendentes sem somar parcelas pagas duas vezes.
155. [x] Exibir aviso de orçamento excedido na revisão de nova despesa, sem bloquear operação automaticamente.
156. [x] Registrar justificativa de despesa acima do limite quando usuário decidir prosseguir.
157. [x] Criar acompanhamento manual de orçamento excedido com vínculo ao mês e centro.
158. [x] Consultar evolução mensal de gasto e orçamento com meses sem limite explicitamente separados.
159. [x] Imprimir demonstrativo de orçamento e exportar despesas vinculadas respeitando filtro mensal.
160. [x] Desativar centro para novas classificações preservando despesas, obrigações e limites históricos.

## Análises operacionais avançadas — 161–180

161. [x] Consultar curva de participação de produtos nas vendas líquidas com percentuais e critério de período explícitos.
162. [x] Consultar curva de participação de clientes, separando consumidor final de clientes identificados.
163. [x] Consultar frequência de compras por cliente com número de vendas válidas e intervalo conhecido.
164. [x] Consultar recência de atendimento por cliente e clientes sem venda, sem inferir abandono.
165. [x] Consultar ticket médio por dia e cliente usando líquido comercial, com contagem de vendas explícita.
166. [x] Consultar itens médios por venda descontando devoluções e exibindo base de cálculo.
167. [x] Consultar taxa de devolução por produto com vendido/devolvido e período da origem explícito.
168. [x] Consultar motivos de devolução e destino revendável/retido/descartado sem somar dinheiro restituído.
169. [x] Consultar concessões de preço de lista e promoção separadas de descontos adicionais.
170. [x] Consultar rendimento de orçamentos por mês de criação com convertidos e ainda abertos separados.
171. [x] Consultar prazo entre criação e conversão de orçamento com registros sem data excluídos explicitamente.
172. [x] Consultar pontualidade de fornecedores pela previsão registrada na confirmação e entrega efetiva.
173. [x] Consultar atendimento parcial de compras com quantidade, custo recebido e saldo encerrado.
174. [x] Consultar tempo em quarentena e taxa de liberação por produto sem atribuir custo contábil.
175. [x] Consultar divergências recorrentes de inventário por produto com ajustes positivos/negativos separados.
176. [x] Consultar atraso de recebimentos por parcela comparando vencimento e data efetiva conhecida.
177. [x] Consultar atraso de pagamentos a fornecedor por parcela e data efetiva conhecida.
178. [x] Consultar exposição comercial por cliente somando saldo conhecido e créditos internos separados.
179. [x] Consultar idade de entregas em trânsito e tentativas malsucedidas por meio logístico.
180. [x] Montar painel analítico escolhendo indicadores e períodos, persistindo configuração local e recalculando valores atuais.

## Estação de atendimento e preferências funcionais — 181–200

181. [x] Criar área de atendimento do cliente selecionado reunindo contatos, saldo, crédito interno e operações recentes.
182. [x] Iniciar venda, orçamento, reserva ou tarefa a partir do cliente da área de atendimento sem perder vínculo.
183. [x] Criar lista de produtos frequentemente atendidos por seleção explícita para adição rápida ao carrinho.
184. [x] Salvar conjunto de itens como modelo de carrinho, sem salvar venda nem reservar estoque.
185. [x] Aplicar modelo de carrinho revisando preços atuais, listas e disponibilidade antes de acrescentar.
186. [x] Permitir múltiplos rascunhos de vendas nomeados sem misturar cliente, itens ou confirmação entre eles.
187. [x] Alternar rascunho ativo por escolha explícita, preservando preenchimento dos demais.
188. [x] Renomear ou descartar rascunho específico com confirmação sem apagar venda salva.
189. [x] Converter somente rascunho ativo em venda e limpar apenas aquele após sucesso.
190. [x] Mostrar referências do produto em painel lateral do atendimento: saldo, listas e pedidos pendentes.
191. [x] Permitir comparar preços de até quatro produtos selecionados sem alterar cadastro.
192. [x] Persistir preferências de colunas por lista, mantendo colunas obrigatórias de identidade e ações.
193. [x] Reordenar colunas de listas pelo controle acessível sem alterar ordenação dos registros.
194. [x] Salvar visões nomeadas de listas com filtros, colunas e ordenação, separadas dos relatórios gerenciais.
195. [x] Aplicar visão salva sem substituir rascunho comercial ou abrir operação de escrita.
196. [x] Mostrar histórico local de registros consultados com acesso rápido, sem incluir operação como realizada.
197. [x] Fixar registros de trabalho recentes em uma bandeja de acesso local, com remoção manual.
198. [x] Apresentar timeline comercial integrada do cliente com vendas, entregas, devoluções e crédito interno por data.
199. [x] Apresentar timeline do fornecedor com cotações, pedidos, devoluções e pagamentos sem duplicar vínculos.
200. [x] Criar resumo de encerramento do atendimento com operações efetivamente salvas e rascunhos pendentes, imprimível sem executar ações.

## Evidência e encerramento

Regressões de vendas, orçamentos, estoque, reservas, devoluções, recebíveis, contas a pagar e Caixa são obrigatórias sem contar como entregas adicionais. Cenários prioritários: crédito interno misto com dinheiro e devolução parcial; dupla emissão/consumo de crédito; quarentena concorrente com reserva; expedição repetida ao fornecedor; seleção de preço alterada em outra aba; mercadoria devolvida e remessa pendente; geração duplicada de pedidos por cotação; falha de gravação com replay.

Riscos principais: nova origem de preço interferir no rateio histórico; crédito interno inflar recebimento; saldo retido ser vendido; restituição do fornecedor ser contada duas vezes; despacho logístico provocar baixa duplicada. Explicitar pendências de verificação e limites reais.

Somente D:\Projeto Sistema Local será usado. Dados do Murilo não serão usados para testes de escrita. Ao completar exatamente 200 melhorias e verificações próprias necessárias, parar para Murilo testar. Não iniciar item 201 nem chamar tester sem nova autorização. Se houver bloqueio real, preservar trabalho e reportar o estado fiel, nunca concluir checklist por contagem ou tempo decorrido.


Encerramento em 01/10/2026: V0.11.0, 156 testes passados, 27 verificações HTTP, 52 recursos da página, conferências de interface e preservação da base. Ver VERIFICACAO-V0.11.md e .qa/round9/final-evidence.json. Tester pausado; aguardar teste do Murilo.
