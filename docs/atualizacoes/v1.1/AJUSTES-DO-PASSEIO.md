# Situação dos ajustes — Fundação V1.1, 02/10/2026

A entrega inicial dos seis pedidos foi concluída. As anotações originais abaixo são histórico do passeio de 01/10, não descrevem a interface atual.

| Pedido | Entregue | Limite |
| --- | --- | --- |
| Custo | Consulta pela fonte do último recebimento, com permissão financeira | Sem custo médio/margem nova; ausência não vira zero |
| Quick view | Produtos, Clientes e Fornecedores reutilizam formulários/gravação | Cadastros complementares mantêm fluxos próprios |
| Autoria | Executor/aprovador e perfis verificados nas novas ações | Não atribuir identidade a registros antigos |
| Receber compra | Atalho contextual com filtro do produto e rascunho preservado | Uma entrada pelo fluxo de Compras existente |
| Produto inativo | Venda direta por senha/direito explícito/motivo, exceção registrada | Não reativa cadastro; sem PIN/biometria ou exceção automática em orçamento |
| Limpar filtros | Botão visível próximo aos filtros | Preserva rascunhos e cadastros |

Ver [relatório V1.1](FOUNDATION_V1_1_REPORT.md) e retomar o passeio somente quando Murilo pedir.

---

# Ajustes anotados durante o passeio pelo sistema

Lista iniciada em 01/10/2026, a pedido do Murilo. Estas são solicitações para revisão posterior; anotar não significa implementar agora. O passeio continua um item por vez, avançando somente quando Murilo pedir.

Antes de implementar cada solicitação, conferir o que já existe e informar ao Murilo onde está. Preferir integrar ou melhorar o fluxo atual, evitando módulos, campos ou operações que dupliquem a mesma informação. Preservar históricos e os dados da loja. Novas sugestões devem ser acrescentadas a esta lista, mantendo as anteriores.

## 1. Custo dos produtos

**Pedido:** considerar custo dos produtos entre os ajustes a revisar.

**Já existe:** Compras registra custo unitário dos itens e recebimentos. A tela Custos recebidos consulta o custo unitário das últimas compras recebidas. Preço de venda no cadastro de Produtos é outra informação.

**Pendência:** durante a apresentação dessas telas, definir com Murilo onde o custo deve ficar mais acessível e se há informação adicional desejada. Não criar outro lançamento independente de custo antes dessa definição. O pedido ainda não especifica cálculo de custo médio, margem ou custo inicial.

**Situação:** anotado; aproveitar a fonte existente e esclarecer a apresentação desejada antes de alterar.

## 2. Cadastro e edição em quick view — Produtos, Clientes e semelhantes

**Pedido:** abrir uma janela rápida sobre a tela para cadastrar ou editar um produto, em vez de colocar o formulário nos campos fixos ao lado da lista.

**Ampliação solicitada pelo Murilo:** aplicar o mesmo padrão a Clientes e a outros cadastros semelhantes. Cadastrar e editar devem abrir a janela rápida, deixando a lista como contexto. Conferir todas as telas de cadastro na revisão, incluindo Fornecedores e cadastros complementares; aproveitar as que já usam janelas, sem criar outro fluxo de gravação.

**Já existe:** formulários de cadastro/edição de Produtos e Clientes ao lado das listas e mecanismo de janelas usado em outras operações.

**Ajuste proposto:** aproveitar formulário, validações e gravação existentes dentro da janela rápida; manter a lista como contexto. Oferecer acesso claro ao novo cadastro e à edição. Não ampliar os campos nesta etapa: Murilo deixará sugestões sobre campos incompletos para depois.

**Situação:** anotado; aguardando revisão após o passeio.

## 3. Responsável e autorização no histórico de estoque

**Pedido:** mostrar quem autorizou a movimentação e seu perfil, como funcionário, dono ou estoquista, para facilitar o rastreamento.

**Já existe:** histórico de estoque com data, tipo, quantidade, saldo posterior e referência/observação. Algumas rotinas guardam responsáveis declarados, mas a tabela de histórico apresentada no passeio não mostra quem autorizou nem o perfil. O login atual é fictício.

**Ajuste a revisar:** identificar executor e autorizador separadamente quando a operação tiver autorização, mostrar o perfil correspondente e permitir rastrear o documento de origem. Conferir os registros de identidade já disponíveis em cada tipo de movimento antes de criar novos campos. Rastreabilidade baseada em identidade verificada requer integração futura com usuários, acesso e permissões reais; um nome digitado não comprova autorização.

**Históricos antigos:** apresentar identificação ausente como não registrada; nunca inferir autor, cargo ou autorização retroativamente.

**Situação:** anotado; mapear responsabilidades existentes e definir integração com usuários antes de implementar.

## 4. Retirar reposição avulsa e direcionar para Compras

**Pedido:** retirar Repor estoque de Produtos porque já existe entrada vinculada ao fornecedor. No lugar, oferecer Receber compra, direcionando ao painel de Compras.

**Já existe:** Compras prepara pedidos com fornecedor, produto, quantidade e custo, registra entregas e atualiza o estoque. Inventário físico trata diferenças entre contagem e saldo. Cadastro novo possui estoque inicial.

**Fluxo proposto no passeio:**

1. Em Produtos, clicar em Receber compra.
2. Abrir Compras, filtrando pedidos que contêm o produto escolhido.
3. Selecionar fornecedor e pedido pendente; não presumir fornecedor quando houver várias opções.
4. Conferir quantidade/custo e confirmar recebimento no fluxo existente de Compras.

**Integração necessária:** verificar filtros e navegação atuais antes de acrescentar o atalho contextual. A mercadoria deve entrar uma única vez por Compras. Manter movimentos históricos de reposições antigas; não apagar registros. Ajustes por contagem permanecem em Inventário físico. Estoque inicial continua disponível no cadastro novo.

**Situação:** anotado; substituir o acesso de reposição avulsa pelo atalho contextual, após revisão da lista.

## 5. Venda de produto desativado com liberação identificada

**Pedido complementar do Murilo:** permitir vender produto desativado mediante confirmação de identidade por senha ou biometria, deixando explícito que o item estava desativado e quem liberou a venda. O aviso serve para controle e para perceber uma possível desativação indevida; não deve caracterizar a venda como irregular.

**Já existe:** desativação preserva histórico e estoque, mas o fluxo atual bloqueia o produto em novas vendas/orçamentos. A exceção autenticada solicitada ainda não existe. O login fictício não oferece confirmação real por senha ou biometria.

**Regra a implementar após revisão:**

- Ao tentar vender um item desativado, mostrar claramente sua situação e solicitar liberação explícita.
- Confirmar a identidade de quem autoriza usando senha ou biometria conforme os meios que forem implementados. Definir quais perfis podem autorizar junto às permissões de usuários.
- Registrar na venda o item, sua situação desativada no momento, quem executou a venda, quem liberou, seu perfil e o momento da autorização. Relacionar essa identificação à rastreabilidade do movimento de estoque do item, aproveitando a anotação 3.
- Mostrar no detalhe/histórico da venda uma indicação neutra, como **“Item desativado — venda liberada por [nome]”**, distinguindo o item quando a venda tiver outros produtos ativos.
- Como regra proposta, a liberação vale para aquela venda; o cadastro permanece desativado. Reativar o produto continua sendo uma decisão separada.
- Manter as demais validações de estoque e preço; liberar a situação do cadastro não autoriza vender unidades indisponíveis.

**Situação:** anotado; implementar junto a identidade/permissões reais, sem simular autenticação nem atribuir autorizadores a registros antigos.

## 6. Limpeza de filtros mais visível e próxima da consulta

**Pedido:** o local atual para retirar filtros está pouco visível e difícil de enxergar. Reposicionar a limpeza junto aos filtros de Produtos, podendo ficar dentro da área, acima ou abaixo dela. A posição final ainda será escolhida na revisão visual.

**Já existe:** etiquetas de filtros aplicados com × na barra superior e controles de busca/filtro na lista. O problema é de apresentação e localização; aproveitar a lógica de limpeza atual.

**Ajuste a revisar:** acesso com texto claro e destaque suficiente próximo aos filtros, por exemplo Limpar filtros. Diferenciar limpar todos os filtros e retirar um filtro individual, mantendo a ação compreensível. Conferir os controles existentes para evitar mais botões espalhados ou acessos duplicados. Não confundir limpeza de filtros com apagar cadastros ou limpar somente período.

**Situação:** anotado; definir a posição e a aparência na revisão visual, sem alterar o código durante o passeio.

## Posição atual do passeio

Visão geral (total vendido/vendas válidas), Produtos (cadastro), histórico de estoque, reposição avulsa, revisão de desativação, busca/filtros de Produtos e cadastro de Clientes foram apresentados. A reposição de exemplo foi fechada sem registrar entrada e a desativação foi fechada sem confirmar. O cadastro de cliente Murilo está aberto em edição, sem alterações gravadas. Próximo assunto: Ver cliente, para consultar seus detalhes. Nenhuma dessas solicitações de mudança de código foi implementada durante as anotações.
