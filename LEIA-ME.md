# Sistema Comercial — candidato Fundação V1.2 local

**Governança vigente em 05/10/2026:** [Documento Mestre v1.0](Documento_Mestre_Sistema_Comercial_v1.0.md) define o produto desejado; [índice de estado](docs/atual/PROJECT_MASTER.md) descreve implementação. React V1.3 já tem base de acesso/contexto/Design System, sem módulos comerciais; a interface abaixo continua operacional. [Plano A–G](docs/atual/ROADMAP.md): próximo código proposto é replay legado, sem início nesta rodada. B/610 abaixo é homologação histórica V1.2, não do SaaS.

Fundação V1.2 **fechada localmente em 03/10/2026**, versão **1.2.0-foundation.1**, tag local `v1.2.0-foundation.1`. Homologação preservada: **B — condicional, 610/610 testes**, migrations 001–010. Projeto exclusivo em D:\Projeto Sistema Local.

## Abrir e usar

1. Dê dois cliques em **INICIAR.cmd**, nesta pasta. Requer Node.js 24.7 ou superior. Mantenha o servidor em funcionamento e abra [Sistema Comercial](http://127.0.0.1:3210/).
2. Se já possui conta, use seu login/senha. Na primeira configuração, use o código privado de data/PRIMEIRO-ACESSO.txt para escolher seu login/senha de 12 a 128 caracteres; não há senha padrão. Não publique esse arquivo.
3. Selecione a empresa/unidade quando houver mais de uma. **Administração → Usuários e acessos** gerencia vínculos e direitos; o menu respeita o perfil.
4. **Produtos, Clientes e Fornecedores:** cadastrar/editar abre janela rápida; limpar filtros fica perto dos filtros. Produtos consulta o último custo efetivamente recebido quando o perfil possui acesso financeiro; custo ausente não vira zero.
5. **Receber compra** abre Compras com filtro do produto, preservando o rascunho; escolha o pedido/fornecedor e registre a entrega pelo fluxo existente.
6. **Vendas → Nova venda direta:** busca manual ou leitura/digitação do código de barras. Item inativo mostra aviso e exige login/senha de pessoa com direito de autorização, além de motivo. A venda e o estoque mostram quem executou/quem liberou; produto continua inativo. PIN/biometria não estão disponíveis. Orçamentos/reservas não recebem essa exceção automaticamente.

Sair revoga a sessão, sem encerrar o servidor. Sessões expiram após 12 horas ou 30 minutos sem atividade. Troca de contexto/login/logout recarrega a página e separa rascunhos. Há troca de senha, reset administrativo autorizado e consulta/revogação de sessões; troca/reset exigem novo login. Reset usa código temporário para o usuário escolher nova senha, sem recuperação por e-mail. Perfis parciais usam consultas/cadastros/venda direta autorizados; lista/detalhe de Vendas têm busca/filtros/paginação SQL. Telas avançadas ainda usam ponte completa de leituras.

## Dados e recuperação

Banco ativo: data/foundation.sqlite. Seis agregados SQL: Produtos, Clientes, Fornecedores, Compras/Recebimentos, Estoque/Movimentações e Vendas. Lista/detalhe de Vendas não carregam todo o estado comercial; escritas ainda usam estado completo por compatibilidade. Caixa/Financeiro e complementos conservam snapshot transitório. Gravação/auditoria são transacionais. data/database.json é origem histórica preservada; não substitua SQL por JSON antigo, pois pode perder operações.

Backup consistente, validação, agendamento e retenção local existem; dependem do servidor em funcionamento. Restore em destino novo isolado foi validado com dados sintéticos, login e seis agregados; recuperação da loja, falha física, proteção externa e RPO/RTO não foram homologados. Copiar somente arquivo aberto durante gravações não é o procedimento. [Operação e limites](docs/atual/OPERATIONS_V1_2.md). Mantenha bancos/cópias privados.

Rascunhos/preferências pertencem ao usuário/empresa/unidade deste navegador, sem sincronização entre PCs ou criptografia pela aplicação. Quantidades decimais têm representação no modelo; comandos atuais continuam inteiros até definir precisão/unidades/conversões.

O sistema permanece local, sem internet com servidor iniciado. Cloud/PostgreSQL, Edge/offline SaaS, instalador Windows, cobrança/licença, fiscal, impressão/hardware, Commerce Hub, MFA/passkeys/biometria e fracionamento continuam futuros. Git/checkpoint são locais. Auditoria não é inviolável contra administrador do computador. Escritas grandes ainda ~2 s, memória a acompanhar; sem promessa de SLA/produção pronta.

Documentação: [governança/estado](docs/atual/PROJECT_MASTER.md) e [estado V1.2](docs/atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md), **B/610**. [V1.1/457](docs/atualizacoes/v1.1/FOUNDATION_V1_1_REPORT.md) é histórico. Testes de escrita usam bancos isolados, nunca a loja. Nenhum teste completo foi repetido nesta tarefa exclusivamente documental.

## Manual anterior — histórico V0.12 e rodadas

O conteúdo abaixo foi preservado como histórico. Login fictício, JSON ativo e requisitos antigos de Node descrevem aquelas versões, e não a Fundação V1 atual. Para abrir e operar hoje, siga as instruções acima.

## Abrir e usar

1. Abra esta pasta e dê dois cliques em **INICIAR.cmd**.
2. Mantenha a janela que abrir em funcionamento. Ela mantém o servidor ligado.
3. No navegador, acesse http://127.0.0.1:3210. Se a primeira abertura falhar, atualize a página após alguns segundos.
4. Digite seu nome para entrar na demonstração. Não é necessário criar conta ou senha.
5. Em Produtos, cadastre um produto com preço e estoque inicial.
6. Em Clientes, cadastre um contato de teste.
7. Em Vendas, escolha o cliente, adicione produtos e clique em Concluir venda.
8. Veja os números no painel e confira que o estoque diminuiu.

Para encerrar, feche a janela do servidor. O botão Sair encerra apenas sua sessão de demonstração.

## Onde ficam os dados

Os cadastros e as vendas ficam em `data/database.json`, nesta pasta, e continuam disponíveis após fechar e reabrir o sistema. Não apague esse arquivo. Esta versão é para testes com dados fictícios: não há autenticação real, isolamento entre empresas ou uso simultâneo entre servidores. O servidor aceita conexões apenas deste computador.

## Novidades da V0.11

Esta rodada entrega os 200 itens de RODADA-9.md: listas de preços, promoções explícitas, quarentena, devoluções a fornecedores, crédito de loja, separação e entregas, cotações, orçamento de despesas, 19 análises avançadas e atendimento com vários carrinhos nomeados.

As novas telas ficam nas categorias do menu. Em **Vendas e consultas**, comece por Atendimento, Listas de preços, Promoções e Separação e entregas. Em **Cadastros e estoque**, use Quarentena e avarias. Em **Financeiro e compras**, ficam Crédito de loja, Devoluções a fornecedores, Cotações de compra e Orçamento de despesas. O painel está em **Rotina e relatórios → Análises avançadas**.

Para carregar o servidor novo, feche a janela do inicializador anterior, reabra pelo atalho ou por INICIAR.cmd e atualize a página. Os dados continuam na mesma pasta. Rascunhos, modelos, favoritos, colunas e visões são preferências deste navegador; não são sincronizados entre computadores.

Crédito de loja é saldo interno originado por devolução. Não é dinheiro recebido. Estoque retido não pode ser vendido. Entregas acompanham mercadoria já vendida, sem segunda baixa. Cotações preparam compras e limites mensais acompanham gastos; não enviam mensagens nem fazem pagamentos bancários. Impressões são internas, sem valor fiscal.

Confira VERIFICACAO-V0.11.md para as verificações e um roteiro de teste. Tester independente permanece pausado por sua instrução. A rodada encerra para seu teste antes de mais recursos.

## Novidades da V0.10

Inventário físico com duas contagens, devoluções parciais, reservas de mercadorias, parcelas a receber, etiquetas e informações complementares, pesquisa geral, agenda manual, central de pendências e 21 consultas gerenciais. Favoritos, filtros e páginas ajudam a navegar. Veja RODADA-8.md e VERIFICACAO-V0.10.md para os 200 itens e as evidências desta rodada.

## O que já funciona

Login fictício, painel com totais, cadastro de produtos e clientes, venda com vários itens, validação de estoque, histórico e salvamento local. Valores monetários são armazenados em centavos; o servidor calcula os preços e só salva a venda inteira quando todos os itens têm estoque.

## Base para evoluir

Interface em HTML/CSS/JavaScript e servidor em Node.js, sem dependências externas. A interface consulta a API local; depois podemos acrescentar autenticação real, banco de dados, empresas, backend na nuvem e empacotamento para Windows com Electron. Essa migração exigirá trabalho adicional. Cobrança, backup e licenciamento ainda não fazem parte da versão.

A base inclui pesquisa e edição de cadastros, reposição de estoque com histórico e cancelamento de vendas. Veja EVOLUCAO.md. Há uma consulta financeira básica e registro manual de recebimentos. Há fechamento de Caixa com conferência manual; emissão fiscal ainda não está incluída.

## Para desenvolvimento

Com Node.js 22 ou superior, execute `node server.js` nesta pasta. Para verificar as regras do sistema, execute `node --test --test-isolation=none`.



A V0.3 acrescentou revisão antes de confirmar venda, proteção contra confirmação repetida, detalhes e filtros de vendas, indicadores e filtros de estoque e melhorias visuais e nos formulários. Consulte RODADA-1.md para testar.


A V0.4 acrescentou forma e situação de pagamento, Financeiro e registro manual de recebimento integral. Consulte RODADA-2.md.

A V0.5 acrescenta rascunho da venda, edição de quantidades, código e categoria de produtos, estoque mínimo, histórico por produto, observações e detalhes de clientes, vencimentos, períodos de consulta, despesas pagas, movimentações por data efetiva, identificação da empresa, comprovante interno e CSV das listas filtradas. Consulte RODADA-3.md para o roteiro completo de teste e ARQUITETURA.md para o destino do executável Windows e servidor central.

A V0.6 acrescenta recebimentos parciais, saldo restante, histórico por recebimento e Caixa com abertura, suprimento, sangria, despesas vinculadas, devoluções de dinheiro e fechamento com conferência. Consulte RODADA-4.md. Cancelamentos preservam o dinheiro efetivamente declarado; não fazem estorno automático. O responsável pelo Caixa é informado manualmente, pois o login continua fictício.

A V0.7 acrescenta orçamentos com preços preservados, validade, edição, duplicação, cancelamento, prévia de impressão e conversão única em venda; também oferece cadastros ativos/inativos e busca rápida por código na venda. Veja RODADA-5.md para as 20 entregas e o roteiro de teste.

A V0.8 acrescenta fornecedores, pedidos de compra, confirmação, recebimentos parciais, encerramento de saldo não entregue, histórico, consulta do último custo unitário recebido, impressão de pedido e CSV das compras. Receber mercadorias aumenta estoque e não registra pagamento ou despesa. Consulte RODADA-6.md.

A V0.9 acrescenta contas a pagar com parcelas e pagamentos parciais, descontos em vendas e orçamentos, planejamento de reposição, reagendamento de entregas e consulta de alterações. Também reforça a proteção contra gravações incompletas e edições simultâneas. São 50 entregas, com o tester temporariamente pausado por solicitação do Murilo. Consulte RODADA-7.md para testar e VERIFICACAO-V0.9.md para as verificações feitas pelo Codex.

A V0.9.1 atende a dois pedidos pontuais antes de novas rodadas: consulta e carrinho por código de barras ou operação manual, e menu em categorias expansíveis. Veja CODIGO-DE-BARRAS-E-MENU.md para usar. O código de barras é opcional e deve ser cadastrado no produto antes da leitura.

## Novidades da V0.12

A Rodada 10 reúne 200 melhorias de operação local. A relação completa está em RODADA-10.md; verificações e limitações estão em VERIFICACAO-V0.12.md.

- **Balcão PDV:** códigos de barras, caixas/pacotes, multiplicador da próxima leitura, desfazer leitura, recebimentos divididos e troco somente em dinheiro. Para venda parcial, selecione um cliente e marque deixar saldo a receber. Pix e cartões são registros manuais de valores que você confirmou.
- **Embalagens e famílias:** códigos alternativos, fatores em unidades-base, matriz de SKUs e alternativas escolhidas manualmente. Embalagens usam o mesmo estoque. Substituição em orçamento/compra recusa apagar uma alternativa já existente; revise essas linhas explicitamente.
- **Posições físicas:** produtos antigos começam em Não distribuído. Distribua por transferência e confira os saldos antes de confirmar. Reservas continuam globais; quarentena permanece separada.
- **Inventário:** coleta cega, escopo por posição, conferentes, segunda contagem e decisão final. Contar não ajusta; a revisão e aplicação ajustam posição e total juntos.
- **Compras:** conferência de apresentada/vendável/retida/recusada, aditamentos de quantidade, custos efetivos justificados e ocorrências com acompanhamento interno. Receber mercadoria não paga fornecedor.
- **Acordos:** selecionam somente saldo aberto do mesmo cliente ou fornecedor, com novas datas e sem juros automáticos. Pagamentos reais são alocados aos documentos originais; acordo pago não permite cancelamento simples.
- **Recorrências:** simulação e geração manual de previsões. Uma despesa só existe após realização explícita ou vínculo a despesa existente. Obrigações relacionadas cobrem somente o valor já representado no orçamento; reveja vínculos sem saldo.
- **Procedimentos:** modelos de checklists, execuções com etapas, impedimentos e documentos internos. Concluir checklist não faz uma venda, compra ou pagamento.
- **Preços:** propostas, simulações e aplicação integral de preço padrão/lista, com versões, mínimos, justificativas e reversão preparada para nova revisão. Históricos permanecem.

Para carregar esta atualização, feche a janela do inicializador do sistema, abra novamente **INICIAR.cmd nesta pasta do disco D** e atualize o navegador. O endereço local continua 127.0.0.1:3210. As verificações da rodada usam exclusivamente .qa/round10/data e a porta 3220, sem lançar operações na sua loja.

Esta versão continua sendo uma demonstração local com login fictício. Executável Windows, servidor central, sincronização entre computadores e assinatura offline terão etapas próprias.
