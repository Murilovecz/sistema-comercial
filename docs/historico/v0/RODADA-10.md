# Rodada 10 — V0.12 — exatamente 200 melhorias

Planejamento do diretor. Projeto exclusivo D:\Projeto Sistema Local, base V0.11. Cada item abaixo é um comportamento funcional implementado e integrado à interface. As marcações não equivalem a testes individuais de todos os recursos; consulte VERIFICACAO-V0.12.md. Não contar testes, documentação ou presença de código como entrega. Tester permanece pausado; Codex implementa e realiza verificações próprias em bases isoladas. Depois dos 200 e das correções necessárias, parar para Murilo testar, sem item 201.

## Contratos de aceitação comuns

Quantidades-base inteiras e centavos seguros, rejeitando precisão excedente, multiplicações/somas fora do limite e datas inválidas. Escritas revisadas, versões esperadas, requestId estável com assinatura da carga e persistência atômica. Reenvio idêntico não duplica; carga alterada recusa. Conflitos preservam preenchimento. Coleções opcionais e compatibilidade com antigos sem inventar atributos, posições, custos, vencimentos ou pagamentos. Documentos fechados conservam snapshots. Consultas/impressões/exportações respeitam filtros e não movimentam nada. Impressos internos sem valor fiscal. Interface explica bases e limites reais.

Sem dependências novas, nuvem, banco real, autenticação real, cobrança SaaS, fiscal, backups, licenciamento ou executável. Cada item será conferido por sua regra e interface; falhas podem exigir correções fora da contagem, sem ampliação de escopo.

## PDV e liquidação dividida — 1–20

Contrato: múltiplas formas reais e saldo pendente em uma confirmação; crédito de loja permanece no módulo existente. Troco só sobre dinheiro apresentado; Caixa recebe líquido retido. Nunca simular pagamento bancário. A opção de turno/estação é declarada, não autenticação.

1. [x] Abrir modo PDV com carrinho e liquidação simultâneos, mantendo Venda normal disponível.
2. [x] Incluir produto por leitura exata mantendo foco após sucesso no PDV.
3. [x] Definir multiplicador inteiro apenas da próxima leitura sem contaminar inclusões seguintes.
4. [x] Consolidar leituras repetidas na linha com quantidade acumulada e disponibilidade atual.
5. [x] Mostrar último produto lido e permitir localizar sua linha no carrinho.
6. [x] Desfazer última inclusão por leitura sem apagar quantidade anterior daquele produto.
7. [x] Abrir liquidação dividida com linhas de forma real e valor recebido separadas do total comercial.
8. [x] Acrescentar/remover linhas antes da revisão recusando formas vazias e valores não positivos.
9. [x] Informar dinheiro apresentado e calcular troco da parcela em dinheiro.
10. [x] Recusar excedente/troco em Pix, cartão ou outra forma não monetária.
11. [x] Mostrar aplicado, troco e saldo a receber com soma exata durante preenchimento.
12. [x] Completar última linha com saldo restante mediante comando explícito.
13. [x] Confirmar parcial com saldo pendente e vencimento opcional sem declarar quitação.
14. [x] Revisar itens, cliente, desconto, crédito interno e todas as linhas/troco antes de vender.
15. [x] Persistir venda/estoque/crédito/recebimentos divididos juntos ou nada.
16. [x] Vincular apenas dinheiro retido ao Caixa, guardando apresentado/troco como referências.
17. [x] Preservar liquidação no rascunho ativo separada dos outros atendimentos.
18. [x] Exibir divisão e troco históricos no detalhe/comprovante sem inventar campos antigos.
19. [x] Manter linhas preenchidas em conflito e exigir revisão dos novos saldos.
20. [x] Consultar vendas do PDV por turno e estação declarados com base temporal explícita.

## Embalagens e identificadores alternativos — 21–40

Contrato: embalagem multiplica produto existente em unidades-base inteiras; preço derivado do preço-base aprovado. Não criar estoque separado, unidades fracionárias ou preço arbitrário. Códigos exclusivos considerando também registros inativos.

21. [x] Cadastrar embalagem com nome/fator inteiro e unidade-base visível.
22. [x] Editar embalagem com motivo/versão preservando equivalências históricas.
23. [x] Desativar embalagem para novas inclusões conservando documentos antigos.
24. [x] Cadastrar identificador alternativo textual distinto de códigos principais.
25. [x] Cadastrar código exclusivo de embalagem resolvendo produto/fator no servidor.
26. [x] Recusar colisão entre todos os tipos de código, inclusive inativos, mostrando o conflito.
27. [x] Remover identificador alternativo por revisão sem apagar produto ou histórico.
28. [x] Pesquisar catálogo por identificador alternativo mostrando a correspondência.
29. [x] Consultar embalagem por leitura com fator/preço derivado/disponibilidade em embalagens completas.
30. [x] Adicionar embalagem manualmente à venda mostrando equivalência base.
31. [x] Adicionar embalagem por leitura com multiplicação segura de unidades-base.
32. [x] Mostrar equivalência da embalagem no carrinho sem substituir unidade de estoque.
33. [x] Salvar nome/fator da embalagem no snapshot da venda.
34. [x] Incluir embalagem em orçamento congelando fator e valor aprovado.
35. [x] Revisar fator alterado na conversão permitindo manter equivalência histórica ou refazer proposta explicitamente.
36. [x] Preparar compra por embalagem convertendo para quantidade-base antes de confirmar.
37. [x] Receber compra por embalagem mostrando equivalência sem entrada duplicada.
38. [x] Filtrar cadastro por produtos sem embalagem e embalagens inativas.
39. [x] Imprimir ficha das embalagens/códigos selecionados sem códigos inventados.
40. [x] Exportar identificadores/embalagens selecionados com fatores e situações.

## Famílias e substitutos de produto — 41–60

Contrato: relacionar SKUs existentes sem fabricar variantes ou combinar estoques. Substituição explícita recalcula preço aprovado e saldo do escolhido; não muda documentos fechados.

41. [x] Cadastrar família comercial distinta de categoria/marca.
42. [x] Editar/desativar família preservando produtos vinculados e histórico.
43. [x] Vincular produtos à família por seleção revisada sem mesclar códigos/saldos.
44. [x] Retirar produto da família com motivo e sem alterar snapshots.
45. [x] Definir atributos descritivos da família com nomes e limite informado.
46. [x] Preencher atributos por SKU sem inferir variantes antigas.
47. [x] Avisar combinação repetida de atributos e exigir reconhecimento explícito.
48. [x] Consultar matriz de SKUs com atributos/preço/físico/reservado/disponível separados.
49. [x] Filtrar catálogo por família e atributos combinados.
50. [x] Escolher SKU da matriz para acrescentar ao carrinho usando seu próprio saldo.
51. [x] Cadastrar substituto explícito com observação sem afirmar equivalência técnica automática.
52. [x] Remover relação de substituto sem editar carrinhos existentes.
53. [x] Mostrar alternativas disponíveis quando produto estiver sem saldo livre.
54. [x] Comparar original/substitutos por atributos, preço aprovado e disponibilidade.
55. [x] Substituir linha do carrinho revisando quantidade/saldo/diferença de preço.
56. [x] Guardar referência opcional do produto substituído na nova venda.
57. [x] Substituir item de orçamento aberto com versão e histórico próprios.
58. [x] Escolher alternativa na compra preparada sem mudar pedido confirmado/dívida.
59. [x] Consultar famílias com inativos, combinações repetidas ou atributos ausentes.
60. [x] Imprimir ficha de família e exportar matriz filtrada atual.

## Posições físicas e transferências — 61–80

Contrato: detalhamento do mesmo product.stock vendável; saldo antigo inicia Não distribuído derivado, sem alocação retroativa. Soma das posições + não distribuído = product.stock. Reservas seguem globais. Retido continua separado. Transferência não altera físico/disponível/custo. Integrar todos os caminhos existentes de estoque antes de habilitar: compra, reposição, venda, cancelamento, devolução comercial/fornecedor, inventário, retenção/liberação. Origem explícita quando necessária; fluxo legado usa Não distribuído primeiro e consumo determinístico informado, persistido em snapshot. Cancelamento devolve às origens históricas ou posição equivalente Não distribuído quando destino foi desativado, com explicação e sem presumir deslocamento retroativo.

61. [x] Cadastrar posição interna com código exclusivo/nome sem criar estoque adicional.
62. [x] Editar posição com motivo/versão preservando movimentos históricos.
63. [x] Desativar somente posição vazia recusando mercadoria atribuída.
64. [x] Mostrar Não distribuído derivado dos produtos antigos sem presumir posição.
65. [x] Distribuir saldo não atribuído por revisão sem aumentar físico/disponível.
66. [x] Consultar produto por posições reconciliando distribuído/não distribuído/total.
67. [x] Preparar transferência com origens/destinos/itens sem movimentar ao criar.
68. [x] Editar transferência preparada com versão sem alterar confirmadas.
69. [x] Revisar saldos e motivo da transferência antes de confirmar.
70. [x] Confirmar transferência atômica sem mudar product.stock, reservas ou dinheiro.
71. [x] Impedir consumo concorrente do mesmo saldo de posição preservando formulário.
72. [x] Cancelar transferência preparada com motivo sem efeito físico.
73. [x] Reverter transferência por compensação vinculada se houver saldo atual suficiente.
74. [x] Selecionar posição no recebimento de compra atribuindo apenas unidades aceitas.
75. [x] Selecionar origem de venda ou revisar consumo determinístico do fluxo legado.
76. [x] Exibir posições debitadas no detalhe da venda com nomes históricos.
77. [x] Destinar devolução revendável à posição escolhida sem duplicar retorno ao estoque.
78. [x] Selecionar origem da retenção e destino da liberação reconciliando quarentena/vendável.
79. [x] Consultar movimentos por posição/produto/motivo/período com documentos de origem.
80. [x] Imprimir transferência interna e exportar distribuição física atual.

## Contagem cega e recontagem — 81–100

Contrato: extensão do inventário atual, não segundo módulo duplicado. Contagem cega é conveniência operacional, sem promessa de autorização. Referência escondida durante coleta, mostrada na revisão. Usar versões atuais e não aplicar ajuste duplicado. Inventário global reconcilia posições explicitamente; inventário por posição altera posição e global juntos sem violar reservas.

81. [x] Abrir inventário existente em modo cego sem saldo esperado na coleta.
82. [x] Escolher posição ou Não distribuído como escopo da sessão existente.
83. [x] Imprimir lista de coleta por posição sem quantidade esperada.
84. [x] Contar embalagem por leitura convertendo unidades-base e mostrando equivalência.
85. [x] Registrar conferente declarado da primeira contagem por linha.
86. [x] Encerrar coleta sem ajustar estoque e abrir conferência das diferenças.
87. [x] Selecionar divergências para segunda contagem preservando primeira.
88. [x] Registrar segunda contagem cega com conferente/momento próprios.
89. [x] Comparar primeira/segunda/referência sem escolher resultado automaticamente.
90. [x] Escolher contagem final justificando resultados diferentes.
91. [x] Reabrir coleta não aplicada com motivo e histórico preservado.
92. [x] Impedir edição de contagem aplicada orientando nova conferência/compensação.
93. [x] Revisar efeito do ajuste por posição no global e disponível reservado.
94. [x] Aplicar posição/global atomicamente recusando incompatibilidade com reservas.
95. [x] Detectar movimento posterior à referência e exigir reconferência sem apagar coleta.
96. [x] Separar não contados, recontagem pendente e divergências sem decisão.
97. [x] Encerrar sem ajuste com justificativa mantendo contagens para consulta.
98. [x] Consultar decisões finais com conferentes declarados e motivos.
99. [x] Exportar primeira/segunda/final/referência/ajuste por posição.
100. [x] Imprimir termo de conferência distinguindo coleta e estoque aplicado.

## Divergências de recebimento de compras — 101–120

Contrato: apresentação/aceitação/recusa distintas. Aceita retida integra compra/quarentena atomicamente, nunca vendável duas vezes. Recusada não entra no físico/recebido. Excesso exige aditamento comercial confirmado sem dívida automática. Não inventar custo financeiro.

101. [x] Abrir conferência de entrega de compra confirmada preservando pedido original.
102. [x] Informar referência e conferente declarado da entrega.
103. [x] Informar apresentada/aceita vendável/aceita retida/recusada com soma exata por item.
104. [x] Justificar retenção/recusa por item sem presumir perda monetária.
105. [x] Mostrar falta perante saldo pedido sem encerrar pendência automaticamente.
106. [x] Detectar excesso apresentado e impedir aceitação do excedente sem aditamento confirmado; permitir recusar o excedente.
107. [x] Preparar aditamento de quantidade com custo explícito/motivo preservando original.
108. [x] Revisar/confirmar aditamento sem receber mercadoria ou gerar dívida.
109. [x] Registrar produto diferente apresentado como ocorrência sem cadastro/entrada implícitos.
110. [x] Revisar custos históricos/efetivos explicitamente informados da aceitação.
111. [x] Persistir aceitação/recibo/ocorrência juntos com replay protegido.
112. [x] Criar quarentena de aceitação retida vinculada ao recibo/item sem entrada vendável.
113. [x] Mostrar recusadas no termo mantendo-as fora do físico/recebido.
114. [x] Escolher posição das aceitas vendáveis mostrando retenções separadamente.
115. [x] Registrar ocorrência posterior sobre recibo sem desfazer estoque/custo/pagamento.
116. [x] Criar acompanhamento da ocorrência com fornecedor/prazo manual sem contato externo.
117. [x] Resolver ocorrência com resposta e resultado declarados sem efeito físico automático.
118. [x] Reabrir ocorrência com motivo preservando resolução anterior.
119. [x] Filtrar divergências por fornecedor/tipo/situação abrindo documentos relacionados.
120. [x] Imprimir termo de conferência e exportar ocorrências filtradas sem efeito fiscal.

## Renegociação de saldos — 121–140

Contrato: mover apenas saldo conhecido aberto; sem juros/multa/desconto automático, novo dinheiro ou principal duplicado. Datas/pagamentos/alocações originais permanecem. Parcelas substituídas fechadas para novas alocações e saldo transferido identificado. Recebimento real alocado deterministicamente às origens. Devoluções posteriores conservam equivalência de origem. Módulo de maior risco; não habilitar parcial sem integrações completas.

121. [x] Selecionar vendas do mesmo cliente com saldo positivo conhecido para acordo.
122. [x] Mostrar principal/recebimentos/crédito/perdão/restante por origem antes da escolha.
123. [x] Excluir consumidor final/canceladas/desconhecidas de acordo sem inferir identidade.
124. [x] Definir parcelas/vencimentos novos somando exatamente saldo escolhido.
125. [x] Registrar motivo/responsável declarado sem assinatura jurídica presumida.
126. [x] Revisar datas antigas/novas e transferência de saldo por venda.
127. [x] Confirmar acordo/transferência atomicamente recusando pagamento/devolução concorrente.
128. [x] Mostrar parcelas substituídas como renegociadas excluindo-as da previsão duplicada.
129. [x] Receber acordo alocando às origens e Caixa apenas conforme dinheiro real.
130. [x] Exibir histórico recíproco origem/acordo sem duplicar principal.
131. [x] Aplicar devolução posterior somente ao saldo transferido daquela origem.
132. [x] Cancelar acordo sem novos recebimentos restaurando saldos originais por revisão.
133. [x] Impedir cancelamento simples de acordo com recebimento preservando dinheiro/histórico.
134. [x] Selecionar obrigações do mesmo fornecedor limitadas ao saldo aberto para acordo.
135. [x] Definir parcelas renegociadas a pagar sem mudar custos ou pagamentos antigos.
136. [x] Confirmar acordo a pagar excluindo parcelas substituídas da previsão.
137. [x] Pagar acordo com única despesa real e alocações/classificações por origem preservadas.
138. [x] Cancelar acordo a pagar não pago restaurando somente saldo transferido.
139. [x] Consultar acordos por contraparte/situação/vencimento/saldo separados de fluxo efetivo.
140. [x] Imprimir demonstrativo e exportar mapa de origens/parcelas sem juros presumidos.

## Planejamento recorrente de despesas — 141–160

Contrato: modelos manuais de previsão, sem scheduler/lançamento automático/cobrança. Ocorrência vira despesa somente por confirmação explícita ou vínculo a despesa existente. Não duplicar previsão de obrigação relacionada.

141. [x] Cadastrar modelo recorrente com descrição/categoria/centro/valor previsto positivo.
142. [x] Definir recorrência mensal e regra explícita de último dia em mês curto.
143. [x] Definir recorrência semanal de sete dias com início/fim opcionais em datas reais; início vazio usa hoje como âncora.
144. [x] Vincular fornecedor opcional/responsável declarado sem presumir pagamento.
145. [x] Editar modelo com vigência futura preservando ocorrências confirmadas.
146. [x] Suspender/reativar modelo com motivo sem cancelar pagos/previsões existentes.
147. [x] Simular ocorrências de intervalo limitado com datas/valores antes de gerar.
148. [x] Gerar ocorrências escolhidas com identidade modelo/data sem duplicação por replay.
149. [x] Mostrar planejada distinta de obrigação e despesa paga.
150. [x] Ajustar valor/data de ocorrência específica com motivo sem alterar modelo.
151. [x] Cancelar ocorrência prevista com motivo sem estorno ou mudança do modelo.
152. [x] Adiar previsão preservando data original sem duplicação no calendário.
153. [x] Registrar despesa efetiva da previsão revisando valor/data/forma/vínculo.
154. [x] Justificar diferença previsto/pago sem ajustar próximos meses automaticamente.
155. [x] Vincular despesa existente à previsão sem nova saída.
156. [x] Marcar realização somente por despesa válida vinculada conservando diferenças.
157. [x] Mostrar previsões recorrentes separadas no orçamento sem duplicar obrigação vinculada.
158. [x] Filtrar previstas hoje/atrasadas/próximas por modelo/responsável/centro.
159. [x] Comparar previsto/realizado por modelo/mês separando canceladas e desvios.
160. [x] Imprimir calendário planejado e exportar ocorrências com situações reais.

## Procedimentos operacionais — 161–180

Contrato: checklist declarado, não autorização/certificação. Marcar etapa não faz operação comercial; vínculos abrem fluxos existentes. Snapshot por revisão do modelo; execução final não reescreve registros vinculados.

161. [x] Cadastrar procedimento nomeado com finalidade/etapas ordenadas/situação.
162. [x] Definir etapa obrigatória/opcional com orientação/responsável sugerido.
163. [x] Vincular etapa a rotina para abrir tela sem executar ação.
164. [x] Editar modelo criando revisão sem mudar execuções iniciadas.
165. [x] Desativar modelo preservando execuções e impedindo novas.
166. [x] Iniciar execução com snapshot de etapas/responsável/data-alvo.
167. [x] Vincular execução a compra/inventário/entrega/Caixa existente.
168. [x] Concluir etapa com observação/momento real sem efeito no vínculo.
169. [x] Registrar impedimento de etapa com motivo e execução aberta.
170. [x] Retomar etapa impedida preservando histórico do impedimento.
171. [x] Pular etapa opcional com justificativa distinta de conclusão.
172. [x] Reabrir etapa concluída antes do encerramento com motivo.
173. [x] Exigir referência interna existente em etapa configurada para isso.
174. [x] Acrescentar múltiplas referências internas por etapa sem upload/cópia de arquivo.
175. [x] Mostrar progresso obrigatórias/opcionais/impedidas sem alegar aprovação real.
176. [x] Revisar encerramento recusando obrigatórias pendentes e conflito entre janelas.
177. [x] Cancelar execução com motivo sem cancelar documentos vinculados.
178. [x] Filtrar execuções por procedimento/situação/responsável/data-alvo.
179. [x] Criar tarefa vinculada a etapa impedida por ação explícita e replay protegido.
180. [x] Imprimir roteiro vazio/execução e exportar etapas com pendências/responsáveis.

## Revisão comercial de preços em lote — 181–200

Contrato: propostas de mudança futura do padrão ou de lista, não promoção automática. Preços mínimos e negociação continuam validados no servidor. Capturar versões, revisar antes/depois, aplicar tudo ou nada e nunca reescrever vendas/orçamentos/reservas históricos. Impacto de preço não é lucro.

181. [x] Criar proposta nomeada com alvo padrão/lista e produtos escolhidos.
182. [x] Selecionar produtos por família/categoria/marca/fornecedor vinculado sem incluir ocultos implicitamente.
183. [x] Capturar preços/versões mostrando origem e ausência de entrada na lista.
184. [x] Informar preço individual proposto sem editar catálogo ainda.
185. [x] Simular aumento/redução percentual com cálculo inteiro e resultado por item.
186. [x] Simular diferença fixa em centavos recusando negativo ou abaixo do mínimo.
187. [x] Escolher arredondamento para centavo/dez centavos/real mostrando diferença.
188. [x] Excluir item da proposta sem aplicar preços ou apagar produto.
189. [x] Acrescentar itens capturando referências próprias sem recalcular silenciosamente anteriores.
190. [x] Justificar redução por item e registrar motivo geral da revisão.
191. [x] Mostrar variação absoluta/percentual e impacto na quantidade disponível sem chamar lucro.
192. [x] Sinalizar conflito com mínimos/listas/promoções sem modificá-los implicitamente.
193. [x] Atualizar referências desatualizadas explicitamente conservando valores propostos para reconferência.
194. [x] Revisar conjunto antes/depois/alvo antes de confirmar lote.
195. [x] Aplicar atomicamente com versões/replay recusando qualquer conflito sem aplicação parcial.
196. [x] Preservar históricos e exigir revisão de rascunhos dependentes do novo preço.
197. [x] Consultar revisão com anteriores/aplicados/responsável e efeito somente futuro.
198. [x] Preparar reversão usando anteriores/versões atuais e resolver alterações posteriores explicitamente.
199. [x] Cancelar proposta não aplicada com motivo e filtrar por alvo/período/situação.
200. [x] Imprimir antes/depois e exportar propostos/aplicados com situação explícita.

## Verificação e encerramento

Ordem numerada dos módulos. Não distribuir fisicamente históricos; posições só começam por ação explícita e movimentações posteriores. Todos os módulos devem ter estados vazios, mensagens de conflito, acesso a detalhe e ações propostas disponíveis na interface. Regressões existentes, recarga, falha de gravação, replay/carga alterada, duas janelas, centavos e limites inteiros são verificações necessárias fora dos 200 recursos. Banco do Murilo preservado; usar bases isoladas. Registrar evidência por critério; não concluir por contagem ou tempo. Se restarem pendências, relatar fielmente e não alegar 200 entregas. Parar após rodada para Murilo experimentar.

## Encerramento em 01/10/2026

200 critérios implementados, com 205 testes de regras aprovados, 40 cenários HTTP e fluxos representativos conferidos no navegador em base isolada. Dados anteriores preservados. Diretor fez revisão estática; tester permaneceu pausado. Evidências e limitações em VERIFICACAO-V0.12.md. Parar agora para Murilo testar, sem iniciar outra rodada automaticamente.
