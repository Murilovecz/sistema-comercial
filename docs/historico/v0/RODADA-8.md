# Rodada 8 — plano de 200 entregas sobre V0.9.1

Status final: 200 itens implementados na V0.10. O checklist [x] indica implementação localizada; verificações executadas, limites e roteiro do usuário estão em VERIFICACAO-V0.10.md. Tester independente permanece pausado.

Autorização: Murilo solicitou 200 entregas nesta rodada; tester independente permanece pausado. Diretor planeja, executor implementa e realiza verificações próprias em bases isoladas. Ao encerrar, apresentar resultados e pendências reais e parar para o teste do Murilo. Limite de sessão não transforma trabalho incompleto em concluído.

## Regras transversais e ordem

Executar os módulos na ordem abaixo. Cada linha numerada descreve uma entrega funcional e seu critério de aceitação; alterar status somente mediante evidência. Comandos, arquivos gerados e testes isolados não contam como novas entregas.

Todas as operações financeiras usam centavos inteiros; quantidades permanecem inteiras. Validar no servidor, gravar operações relacionadas atomicamente, persistir identificadores de confirmação e recusar conflitos de conteúdo/versão. Preservar história e datas/formas desconhecidas; nenhuma migração inventa operação anterior. Datas comerciais seguem America/Sao_Paulo. Responsáveis são declarados; não há autenticação real.

Inventário exige reconferência se o físico de referência mudou. Devoluções são operações comerciais e físicas; restituições são operações financeiras separadas. Ratear desconto por unidades usando inteiros e distribuição determinística dos centavos restantes pela ordem histórica dos itens/unidades; a soma dos valores líquidos alocados é exatamente o líquido original. Nunca recalcular alocação usando preços atuais. Crédito de devolução reduz cobrança; recebimentos reais permanecem preservados. Cancelamento tradicional deve ser bloqueado onde conflitar com devolução já registrada.

Reserva reduz disponível, nunca físico. Carrinho sem confirmação não reserva. Vencimento de reserva deve ser reavaliado também no servidor. Ajuste de inventário não pode deixar físico menor que reservado. Recebimentos de mercadorias continuam separados de pagar fornecedor.

Parcelamento não cria receita ou dívida duplicada. Manter o total original da venda e detalhar créditos de devolução, saldo perdoado e restituições. Novo plano só em saldo conhecido sem pagamentos/devoluções; registros antigos continuam consultáveis como saldo único. Datas e percentuais desconhecidos não são presumidos.

Não instalar dependências ou implementar assinatura/cobrança SaaS, backup, fiscal, banco real, nuvem, executável ou permissões fictícias. Não prometer proteção absoluta contra adulteração local. Exportações mantêm proteção contra fórmulas e limites explícitos. Impressão física, hardware de leitor e desligamento real da internet só podem ser declarados testados se executados.

## Inventário físico — 1–25

1. [x] Criar sessão de inventário com nome, responsável declarado e escopo; abertura não altera estoque.
2. [x] Selecionar produtos ativos ou inativos para contagem; gravar nomes e saldo de referência sem duplicar linhas.
3. [x] Adicionar produtos à sessão aberta sem apagar contagens anteriores.
4. [x] Registrar contagem inteira não negativa por produto; vazio significa não contado, distinto de zero.
5. [x] Contar pelo código interno ou de barras em campo dedicado; Enter não conclui inventário.
6. [x] Somar unidades por leitura repetida e permitir informar quantidade manualmente.
7. [x] Salvar progresso da contagem no servidor sem ajustar estoque.
8. [x] Editar contagem com versão esperada; conflito preserva o preenchimento.
9. [x] Registrar observação por produto contado, consultável na revisão.
10. [x] Filtrar linhas não contadas, contadas e divergentes sem alterar resultados.
11. [x] Mostrar referência, contado e diferença por item, com sinal e legenda.
12. [x] Permitir segunda contagem explícita preservando primeira contagem e observação.
13. [x] Escolher qual contagem revisada será aplicada; não somar duas contagens físicas.
14. [x] Mostrar movimentos ocorridos desde a abertura em cada produto.
15. [x] Bloquear ajuste de linha cujo estoque mudou desde a referência; exigir reconferência física.
16. [x] Atualizar referência por confirmação mantendo histórico anterior e exigindo nova contagem.
17. [x] Revisar conjunto de ajustes com totais de unidades a acrescentar e retirar.
18. [x] Exigir motivo para divergências antes de aplicar ajustes.
19. [x] Aplicar sessão inteira atomicamente; qualquer conflito impede todos os ajustes.
20. [x] Persistir identificação da aplicação; reenvio idêntico não ajusta estoque novamente.
21. [x] Registrar movimentos de inventário com sessão, diferença e saldo resultante.
22. [x] Encerrar sessão aplicada e impedir edição de contagem ou reaplicação.
23. [x] Cancelar sessão não aplicada com motivo; nenhum estoque é alterado.
24. [x] Consultar sessões por período e situação, com contagens e ajustes históricos.
25. [x] Exportar e imprimir relatório da sessão com referências, contagens e diferenças, sem inventar custo.

## Devoluções parciais de vendas — 26–50

26. [x] Abrir devolução vinculada à venda válida; manter a venda original preservada.
27. [x] Selecionar quantidades por item limitadas ao vendido menos devoluções anteriores.
28. [x] Classificar unidades como retornáveis ao estoque ou não revendáveis; somas devem coincidir.
29. [x] Exigir motivo e permitir observação para a devolução.
30. [x] Calcular valor líquido por unidade com rateio determinístico do desconto em centavos.
31. [x] Preservar rateio fixado para a venda; devoluções sucessivas não acumulam erro de arredondamento.
32. [x] Revisar itens, destino físico e valor comercial antes de confirmar.
33. [x] Registrar devolução e entrada revendável no estoque atomicamente.
34. [x] Registrar unidades não revendáveis sem adicioná-las ao estoque disponível.
35. [x] Proteger reenvio de devolução e rejeitar conteúdo alterado sob mesma identificação.
36. [x] Impedir duas janelas de devolver quantidade acima do saldo vendido.
37. [x] Permitir devolver produto desativado da venda histórica sem reativá-lo.
38. [x] Consultar histórico de devoluções por venda, com destino das unidades e motivo.
39. [x] Mostrar vendido, devolvido e restante nos detalhes de cada item.
40. [x] Reduzir saldo comercial a cobrar pelo valor devolvido, sem apagar recebimentos.
41. [x] Identificar crédito de devolução quando recebido superar o valor comercial restante.
42. [x] Impedir novos recebimentos acima do saldo comercial ajustado.
43. [x] Registrar devolução manual de dinheiro limitada ao crédito existente e dinheiro recebido não devolvido.
44. [x] Vincular restituição em dinheiro ao Caixa aberto com saldo suficiente; reenvio não duplica saída.
45. [x] Registrar restituição externa por forma e data, sem movimento retroativo em Caixa.
46. [x] Preservar todas as restituições efetivas nas consultas de movimentações.
47. [x] Impedir cancelamento integral tradicional após devolução parcial; orientar devolução do restante.
48. [x] Consultar devoluções por período, cliente e venda sem confundir com cancelamentos.
49. [x] Imprimir comprovante interno de devolução com valores e ressalva sem valor fiscal.
50. [x] Exportar devoluções e créditos pendentes em CSV protegido; totais não duplicam restituições.

## Reservas de estoque — 51–75

51. [x] Criar reserva explícita para cliente ativo, com itens e validade opcional.
52. [x] Distinguir estoque físico, reservado e disponível em cálculo compartilhado.
53. [x] Validar reservas contra disponível; produtos inativos não admitem novas reservas.
54. [x] Reservar quantidade inteira positiva por produto sem baixar estoque físico.
55. [x] Revisar itens e disponibilidade antes de confirmar reserva.
56. [x] Proteger confirmação contra reenvio e corrida entre duas reservas.
57. [x] Editar reserva aberta com versão e conferência atômica de diferenças de quantidade.
58. [x] Renovar validade com motivo, preservando prazo anterior no histórico.
59. [x] Liberar reserva manualmente com confirmação e motivo; não aumentar estoque físico.
60. [x] Registrar encerramento idempotente da reserva; repetição não libera duas vezes.
61. [x] Tratar validade vencida como liberação lógica determinística pelo calendário local.
62. [x] Revalidar disponibilidade no servidor após vencimento; não depender de aba aberta.
63. [x] Consultar reservas por cliente, produto, período e situação.
64. [x] Mostrar detalhes históricos e quantidades ainda reservadas.
65. [x] Mostrar reservas do produto na consulta de estoque e preço.
66. [x] Adaptar carrinho comum para respeitar estoque disponível, mantendo operação manual.
67. [x] Adaptar conversão de orçamento para respeitar reservas alheias.
68. [x] Converter reserva em venda pelo servidor liberando seu vínculo e baixando físico numa operação.
69. [x] Revisar preços atuais e pagamento antes de converter reserva; reserva não congela preço.
70. [x] Impedir conversão duplicada e mostrar a venda vinculada.
71. [x] Mostrar reservas no planejamento de reposição, separadas das compras previstas.
72. [x] Impedir desativação de produto com reserva ativa até liberação ou conversão.
73. [x] Impedir ajuste de inventário abaixo de unidades reservadas; exigir resolução das reservas.
74. [x] Imprimir termo interno e exportar reservas filtradas, indicando que não são vendas.
75. [x] Mostrar painel de reservas a vencer e vencidas sem somar valores ao total vendido.

## Cadastros e pesquisa unificada — 76–100

76. [x] Adicionar unidade descritiva do produto, mantendo quantidade inteira nesta versão.
77. [x] Adicionar marca opcional pesquisável e exibida nos detalhes.
78. [x] Adicionar localização física opcional do produto para auxiliar contagem.
79. [x] Adicionar observação interna de produto sem alterar nomes históricos.
80. [x] Adicionar endereço comercial opcional do cliente sem exigir serviço externo.
81. [x] Adicionar endereço comercial opcional do fornecedor.
82. [x] Adicionar nome de contato do cliente separado do nome cadastrado.
83. [x] Adicionar nome de contato do fornecedor separado do nome cadastrado.
84. [x] Adicionar identificador comercial livre ao cliente com aviso de duplicidade, sem validação fiscal.
85. [x] Adicionar identificador comercial livre ao fornecedor com aviso de duplicidade.
86. [x] Criar etiquetas locais reutilizáveis para produtos sem mudar código ou categoria.
87. [x] Criar etiquetas locais reutilizáveis para clientes.
88. [x] Criar etiquetas locais reutilizáveis para fornecedores.
89. [x] Filtrar produtos por marca, localização, categoria e etiquetas combinadas.
90. [x] Filtrar clientes por etiquetas e situação preservando pesquisa existente.
91. [x] Filtrar fornecedores por etiquetas e situação preservando pesquisa existente.
92. [x] Detectar possíveis clientes duplicados por contato normalizado sem mesclar automaticamente.
93. [x] Detectar possíveis fornecedores duplicados por contato normalizado.
94. [x] Consultar produtos sem identificador, categoria ou localização sem presumir dados.
95. [x] Editar categoria ou localização de vários produtos com revisão de antes/depois e versões.
96. [x] Aplicar ou remover etiqueta em seleção revisada de cadastros sem sobrescrever demais etiquetas.
97. [x] Pesquisar globalmente produtos, clientes e fornecedores com tipo e situação explícitos.
98. [x] Pesquisar globalmente vendas, orçamentos e compras por identificação ou contraparte.
99. [x] Pesquisar globalmente obrigações, reservas e inventários com acesso ao detalhe.
100. [x] Preservar termo e filtros ao retornar de detalhe de resultado global.

## Parcelamento de contas a receber — 101–125

101. [x] Definir plano explícito de parcelas para venda pendente sem recebimentos; não criar venda ou receita adicional.
102. [x] Permitir divisão em até 60 parcelas com datas opcionais e soma exata em centavos.
103. [x] Revisar parcelas e saldo total antes de confirmar plano.
104. [x] Proteger criação do plano contra repetição e alteração concorrente da venda.
105. [x] Preservar venda antiga sem plano como saldo único, sem inventar vencimentos.
106. [x] Consultar parcelas com original, recebido, crédito de devolução e restante.
107. [x] Editar plano somente antes de pagamentos ou devoluções, preservando histórico da mudança.
108. [x] Registrar recebimento integral de parcela com forma efetiva e data real.
109. [x] Registrar recebimento parcial de parcela limitado ao saldo.
110. [x] Revisar recebimento mostrando parcela, saldo anterior e posterior.
111. [x] Gravar recebimento da parcela, venda e Caixa juntos sem criar entrada duplicada.
112. [x] Impedir pagamento concorrente acima do saldo da parcela.
113. [x] Preservar reenvio da confirmação após fechamento do Caixa sem registrar novamente.
114. [x] Consultar recebimentos com vínculo à parcela nos detalhes da venda.
115. [x] Distribuir recebimento manual geral por parcelas mais antigas mediante revisão explícita.
116. [x] Bloquear mistura de recebimento geral e parcelado sem alocação identificada.
117. [x] Distribuir crédito de devolução em parcelas pendentes da última para a primeira, preservando pagamentos.
118. [x] Exibir excesso recebido como crédito de restituição, sem parcelas negativas.
119. [x] Cancelar apenas saldo ainda a receber com motivo; preservar recebimentos e sem devolver estoque.
120. [x] Separar saldo perdoado de valor devolvido e de venda cancelada nos detalhes.
121. [x] Filtrar contas a receber por vencidas, hoje, próximas, quitadas e sem vencimento.
122. [x] Mostrar agenda de recebimentos previstos sem apresentar previsão como entrada efetiva.
123. [x] Consultar saldos por cliente com vendas, parcelas, créditos e pagamentos relacionados.
124. [x] Imprimir demonstrativo interno e exportar parcelas filtradas sem valor fiscal.
125. [x] Atualizar indicadores financeiros para plano, devoluções e saldo perdoado sem duplicar valores.

## Agenda operacional — 126–150

126. [x] Criar tarefa manual com título, responsável declarado, data opcional e prioridade.
127. [x] Editar tarefa aberta preservando criação e recusando versão desatualizada.
128. [x] Concluir tarefa com observação e data real, sem executar operação comercial.
129. [x] Reabrir tarefa concluída preservando histórico anterior.
130. [x] Cancelar tarefa com motivo sem apagar histórico.
131. [x] Vincular tarefa a cliente, fornecedor ou produto existente.
132. [x] Vincular tarefa a venda, orçamento, compra ou obrigação existente.
133. [x] Exibir vínculo e permitir abrir operação sem alterar sua situação.
134. [x] Listar tarefas por responsável, prioridade, data e situação.
135. [x] Mostrar tarefas de hoje, atrasadas e sem prazo separadamente.
136. [x] Consultar histórico de mudanças da tarefa com responsável declarado.
137. [x] Criar acompanhamento de orçamento com tarefa vinculada sem alterar validade.
138. [x] Criar acompanhamento de entrega de compra sem mudar previsão.
139. [x] Criar acompanhamento de parcela a receber sem cobrar ou enviar mensagem.
140. [x] Criar acompanhamento de parcela a pagar sem efetuar pagamento.
141. [x] Gerar tarefa de conferência de divergência de inventário por ação explícita.
142. [x] Gerar tarefa de crédito de devolução pendente por ação explícita.
143. [x] Evitar duplicação ao criar a mesma tarefa por reenvio da confirmação.
144. [x] Consultar agenda semanal com datas locais e acesso aos detalhes.
145. [x] Consultar agenda mensal com agrupamento diário e itens sem data separados.
146. [x] Mostrar central operacional com contagens por tipo de pendência e links filtrados.
147. [x] Permitir ocultar pendência da central com motivo sem cancelar operação de origem.
148. [x] Permitir restaurar pendência ocultada preservando histórico.
149. [x] Exportar tarefas filtradas em CSV protegido.
150. [x] Imprimir agenda do período com pendências e limites de operação manual.

## Relatórios gerenciais — 151–175

151. [x] Relatório de vendas por dia com bruto, desconto, devolvido e líquido comercial separados.
152. [x] Relatório de vendas por produto com quantidades vendidas, devolvidas e líquidas.
153. [x] Relatório de vendas por cliente preservando consumidor final e nomes históricos.
154. [x] Relatório de recebimentos por forma efetiva e período, sem inferir formas desconhecidas.
155. [x] Relatório de créditos e restituições com pendente e efetivamente devolvido separados.
156. [x] Relatório de descontos por produto usando rateio comercial determinístico, sem chamar lucro.
157. [x] Relatório de orçamentos por situação com valores separados das vendas.
158. [x] Relatório de conversões de orçamentos por período e vínculos, sem contar cópias como conversões.
159. [x] Relatório de compras por fornecedor com pedido, recebido e saldo não entregue.
160. [x] Relatório de entregas por produto e período usando custo informado na entrega.
161. [x] Relatório de pagamentos de fornecedores por forma e data efetiva.
162. [x] Relatório de obrigações abertas por fornecedor e faixa de vencimento.
163. [x] Relatório de despesas por categoria explícita e período sem duplicar pagamentos vinculados.
164. [x] Adicionar categoria de despesa opcional com antigas em Sem categoria.
165. [x] Relatório de fluxo efetivo diário com entradas, saídas e restituições identificadas.
166. [x] Relatório de previsão financeira por data com a receber e a pagar, sem chamar saldo bancário.
167. [x] Relatório de sessões de Caixa com diferenças de conferência e responsáveis declarados.
168. [x] Relatório de movimentos de estoque por tipo com filtros de produto e período.
169. [x] Relatório de inventários com divergências por produto e sessão.
170. [x] Relatório de estoque atual com físico, reservado, disponível e previsto separados.
171. [x] Relatório de itens sem venda no período, indicando produtos recém-criados quando data conhecida.
172. [x] Relatório de reservas por situação, cliente e prazo.
173. [x] Salvar filtros de relatório com nome local, sem congelar resultados.
174. [x] Comparar dois períodos em relatórios de vendas e fluxo, com diferença absoluta e percentual quando base não zero.
175. [x] Exportar e imprimir relatórios respeitando filtros, unidade e explicação das bases de cálculo.

## Navegação e confiabilidade local — 176–200

176. [x] Criar favoritos de páginas por preferência local sem exigir conta real.
177. [x] Criar favoritos de relatórios salvos com acesso direto.
178. [x] Adicionar lançador de ações pelo teclado com comandos disponíveis conforme página.
179. [x] Preservar filtros e paginação das listas durante navegação da sessão.
180. [x] Adicionar ordenação explícita de listas extensas por nome, data, valor ou situação conforme entidade.
181. [x] Adicionar paginação nas listas comerciais mantendo totais referentes ao conjunto filtrado.
182. [x] Adicionar paginação nas listas financeiras mantendo exportação do conjunto filtrado.
183. [x] Adicionar paginação nos históricos de estoque e alterações.
184. [x] Mostrar filtros ativos como resumo removível sem apagar filtros não selecionados.
185. [x] Permitir limpar somente período preservando pesquisa e situação.
186. [x] Gerar links internos de consulta para entidades locais sem incluir dados sensíveis na URL.
187. [x] Tratar entidade inexistente em link interno com mensagem e retorno à lista.
188. [x] Restaurar foco ao retornar de detalhe para a linha de origem, inclusive após paginação.
189. [x] Padronizar confirmação de ações destrutivas com resumo concreto dos efeitos físicos e financeiros.
190. [x] Exibir operações pendentes de resposta e bloquear repetição por clique sem perder possibilidade de reenvio protegido.
191. [x] Detectar servidor local indisponível preservando rascunhos e evitando sucesso fictício.
192. [x] Reconectar ao servidor por ação explícita e recarregar estado antes de confirmar operação pendente.
193. [x] Versionar rascunhos locais para migração compatível ou descarte explícito de formato desconhecido.
194. [x] Validar rascunho restaurado contra produtos, reservas, preços e entidades atuais.
195. [x] Detectar referências órfãs na base e disponibilizar diagnóstico de leitura sem correção automática.
196. [x] Verificar consistência de totais, saldos e movimentos e listar divergências sem regravar história.
197. [x] Aplicar limites de tamanho, linhas e campos nas novas APIs antes de gravação, com mensagens compreensíveis.
198. [x] Verificar falha de persistência em operações novas garantindo estado anterior e reenvio idempotente.
199. [x] Executar verificações próprias de regressão, concorrência, reinício, teclado e tela estreita com dados isolados.
200. [x] Consolidar versão e roteiro com itens implementados/verificados separados; registrar tester pausado e pendências reais.

## Riscos e encerramento

Principais riscos: interdependência de saldo comercial e dinheiro real; desconto com arredondamento em devoluções sucessivas; concorrência entre reserva, venda e inventário; retrocompatibilidade de recebimentos sem datas; volume crescente em arquivo JSON. Verificar cenários combinados antes de declarar módulos prontos. Não reescrever resultados históricos para fazê-los concordar com relatório.

O executor deve registrar evidência por módulo e pendências sem marcar automaticamente os 200 itens. Se o orçamento da sessão impedir conclusão, entregar estado fiel e preservar tarefas restantes. O tester não será convocado nesta rodada salvo nova instrução do Murilo. Após a rodada, parar; não iniciar ciclo 201 ou novo escopo automaticamente.

