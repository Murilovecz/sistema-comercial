# Verificação da V0.12 — Rodada 10

Rodada encerrada em 01/10/2026, exclusivamente em `D:\Projeto Sistema Local`. Os 200 critérios funcionais de RODADA-10.md foram implementados. As marcações registram implementação e revisão de integração; não significam 200 testes independentes nem garantia de ausência de erros. Correções de integração, testes e documentação não foram contados como funcionalidades adicionais.

O diretor fez revisão estática e apontou ajustes em previsões de acordos, recuperação de rascunhos, substituições, revisão de limites, cobertura de recorrências e alertas de preços. As correções estão incorporadas. O tester continuou pausado; as verificações abaixo foram feitas pelo Codex em dados fictícios separados.

## Resultados e preservação

- **205 testes de regras aprovados, nenhum reprovado:** 156 anteriores e 49 novos. Incluem valores em centavos, limites de quantidade/custo, colisões de códigos, estoque/posições, recontagem, acordos, recorrências, procedimentos, preços, reenvios e falha de gravação. Resultado completo em `.qa/round10/unit-results.txt`.
- **40 cenários de integração HTTP aprovados**, incluindo disponibilidade dos 69 arquivos servidos da interface. Escritas válidas tiveram reenvio idêntico conferido; o mesmo identificador com carga alterada foi recusado. Casos inválidos preservaram o estado. Roteiro e resultado em `.qa/round10/http-check.js` e `http-results.json`.
- **126 arquivos JavaScript** da raiz e da interface passaram pela conferência final de sintaxe. O servidor de verificação respondeu pronto como V0.12 e o estado persistido passou pela validação estrutural.
- **Arquivo de dados do Murilo preservado:** o SHA-256 de `data/database.json` permaneceu igual ao registrado antes da rodada: `9DECAE25D304B6A64E1774A8E0993AE845CA278E82333F2FEBB25E7AE4B3D626`. A base antiga também passou pela validação estrutural, sem gravação.
- Verificações usaram `.qa/round10/data` e `127.0.0.1:3220`. O servidor da loja na porta 3210 não recebeu vendas ou pagamentos de teste. A aba e o servidor temporários foram encerrados ao terminar.
- Evidências consolidadas em `.qa/round10/final-results.json` e mapa dos 200 critérios em `.qa/round10/criteria-evidence.json`. Captura da revisão do PDV: `V0.12-balcao.jpg`.

## Cobertura por critério

Cada intervalo aponta as regras e os controles que implementam seus critérios. Os exemplos da última coluna são verificações representativas do grupo. As demais ações foram conferidas por leitura do código e ligação à interface; não foram todas executadas individualmente no navegador.

| Critérios | Implementação principal | Evidência representativa |
|---|---|---|
| 1–6 | `checkout-ui.js`, `scan-next-ui.js`, `product-lookup.js` | Leitura de caixa com multiplicador 2, consolidação, próxima leitura sem multiplicador, localizar e desfazer sem apagar quantidade anterior. |
| 7–12 | `checkout.js`, `checkout-core.js`, `checkout-ui.js` | Dinheiro/Pix divididos, soma exata, líquido/troco e recusa de troco eletrônico ou precisão excedente. |
| 13–20 | `server.js`, `store.js`, `checkout-ui.js`, `round10-ui.js` | Venda parcial com cliente/vencimento; snapshot e estoque; recarga preserva embalagem, pagamentos e vencimento; consulta por estação/turno declarados. |
| 21–27 | `catalogue-next.js`, `catalogue-next-ui.js`, `domain.js` | Código com zeros, embalagem de fator 6, colisão com inativo recusada; edição/desativação com versão. |
| 28–37 | `product-lookup.js`, `scan-next-ui.js`, `quotes.js`, `purchases.js`, `round10-ui.js` | Consulta mostra fator, preço e caixas completas; venda mantém snapshot; orçamento/compra usam unidades-base e metadados históricos. |
| 38–40 | `catalogue-next-ui.js` | Filtros e linhas exportadas/impressas usam a seleção atual; produtos sem embalagem não recebem códigos inventados. |
| 41–49 | `catalogue-next.js`, `catalogue-next-ui.js`, `round10-ui.js` | Matriz de família com preço/saldo/atributos; combinação repetida exige reconhecimento; filtros por família e palavras dos atributos. |
| 50–60 | `catalogue-next-ui.js`, `quotes.js`, `round10-ui.js` | Alternativa explícita preserva saldos; venda guarda referência; orçamento registra revisão de itens. Substituto já presente em orçamento/compra exige resolução manual. |
| 61–70 | `positions.js`, `positions-core.js`, `positions-ui.js` | Distribuição por transferência de 20 unidades sem aumentar estoque; edição, preparação, confirmação, compensação e posição não vazia. |
| 71–80 | `positions.js`, `server.js`, `positions-ui.js`, `round10-ui.js` | Origem insuficiente/desatualizada recusada; venda/cancelamento e retenção/liberação conciliam posições; movimentos com referências e distribuição exportável. |
| 81–90 | `workflows.js`, `workflow-core.js`, `inventory-next-ui.js` | Coleta cega por posição; primeira contagem 18, segunda 19, referência 20; conferentes e decisão explícita pela segunda. |
| 91–100 | `workflows.js`, `workflow-core.js`, `inventory-next-ui.js` | Aplicação reduz posição/global em uma unidade; movimento posterior exige nova referência; coleta preservada, fechamento sem ajuste e termo distinguem contagem/aplicação. |
| 101–110 | `purchase-next.js`, `purchase-next-ui.js`, `purchases-core.js` | Conferência de 10 apresentadas: 6 vendáveis, 2 retidas e 2 recusadas; excesso aceito exige aditamento; custo divergente exige motivo. |
| 111–120 | `purchase-next.js`, `purchases.js`, `positions.js`, `purchase-next-ui.js` | Aceitação/recibo/quarentena/ocorrências juntos; somente vendável vai à posição; ocorrência resolvida/reaberta, com acompanhamento interno e filtros. |
| 121–130 | `agreements.js`, `agreements-core.js`, `agreements-ui.js`, `accounts-core.js` | Duas vendas com saldo 30 + 66 formam acordo 96; recebimento 48 aloca 30 + 18 nas origens sem criar principal ou dinheiro extra. |
| 131–140 | `agreements.js`, `payables.js`, `budget-core.js`, `business-core.js`, `agreements-ui.js` | Retorno ajusta somente origem correspondente; acordo pago recusa cancelamento simples; pagamento gera uma despesa com classificações; previsão usa novas datas. |
| 141–150 | `recurring.js`, `recurring-core.js`, `recurring-ui.js` | Modelo mensal ancorado em 31 gera 31/10, 30/11 e 31/12; regra semanal de sete dias; geração manual e revisões futuras. |
| 151–160 | `recurring.js`, `budget-core.js`, `recurring-ui.js`, `round10-ui.js` | Realização de previsão 150 por despesa 155 justificada; próximos meses preservados. Cobertura de obrigação repartida uma vez por data/identificador, inclusive após acordo. |
| 161–170 | `procedures.js`, `procedures-ui.js` | Modelo, snapshot de execução, referência a compra, etapas, impedimento/retomada e conclusão sem modificar documento relacionado. |
| 171–180 | `procedures.js`, `procedures-ui.js`, `tasks.js` | Etapa opcional pode ser pulada; obrigatória exige conclusão/referência configurada; encerramento verifica versões; tarefa ligada a impedimento é explícita. |
| 181–190 | `price-reviews.js`, `price-review-core.js`, `price-reviews-ui.js` | Proposta de dois SKUs, aumento de 10%, centavos inteiros, arredondamento, mínimos e motivo de redução sem aplicar no catálogo durante preparação. |
| 191–200 | `price-reviews.js`, `price-review-core.js`, `price-reviews-ui.js` | Mudança concorrente recusa lote inteiro; atualizar referências preserva proposta; aplicar só muda preços futuros. Alertas incluem outras listas e promoções por categoria; reversão vira nova proposta. |

Os nomes de interface na tabela são arquivos dentro de `public/`; arquivos de regras ficam na raiz quando não existe versão de consulta em `public/`. O mapa JSON lista os caminhos exatos e cada critério individual.

## Fluxos conferidos no navegador

Foram abertas as telas novas e executados fluxos completos representativos: leitura/multiplicador/desfazer no PDV; recebimentos divididos e venda parcial; transferência física; conferência de compra com retenção e recusa; recebimento de acordo; gerar e realizar recorrência; executar procedimento com referência; revisar/aplicar preços após conflito; primeira/segunda contagens com ajuste por posição; consulta de embalagem; matriz/substituição; recuperação do rascunho após recarga; revisão de limite de pagamento e previsão gerencial por novas datas. A última conferência do PDV não apresentou erros de console e foi encerrada sem confirmar a venda ainda em revisão.

Também foram corrigidas ligações aos detalhes, recuperação de equivalências, envelope estável de posições nos reenvios, histórico de alterações de itens de orçamento, valores seguros em conferências de compra e cobertura financeira por origem. Nenhuma dessas correções foi contada como ciclo adicional.

## Regras que merecem atenção no uso

- Embalagem equivale a unidades inteiras do mesmo produto. O preço deriva do preço-base selecionado; não há saldo independente por caixa. Alterar o fator exige revisar novas inclusões, enquanto documentos fechados conservam o fator anterior.
- Produtos antigos aparecem em **Não distribuído**. Distribua somente quando souber onde a mercadoria está. Reservas são globais; retenção continua fora do vendável.
- Na conferência, mercadoria recusada não entra no estoque. Apresentar mais que o pedido gera aviso; **aceitar o excedente** exige aditamento confirmado. É possível recusar o excedente e aceitar somente o saldo autorizado.
- Semana recorrente usa intervalos de sete dias. Início vazio assume hoje como âncora; fim é opcional. Gerar previsão não cria pagamento e não há execução automática em segundo plano.
- No orçamento, cada saldo de obrigação cobre previsões relacionadas apenas uma vez dentro do mês/classificação, por data prevista, data original e identificador. O restante aparece como previsão adicional; vínculo sem cobertura suficiente é sinalizado.
- Pix e cartões são declarações manuais. Nenhuma confirmação local transmite pagamento bancário. Estação, turno, conferente e responsável são informados pela pessoa; o login ainda é fictício.
- Impressões são internas, sem valor fiscal. Alterações de preços, acordos e procedimentos exigem suas revisões; não reescrevem documentos antigos.

## Limites da verificação

Não foram usados leitor USB físico, impressora física, vários computadores, executável Windows ou sincronização de nuvem. Concorrência foi verificada por versões/tokens desatualizados e reenvios, sem campanha de carga simultânea. A validação de armazenamento e das coleções antigas não substitui teste de cada combinação de dados de uma loja real. A aparência foi conferida na janela do navegador disponível, sem uma matriz completa de tamanhos de tela.

Esta versão continua local, com arquivo JSON e autenticação fictícia. Servidor central, executável, permissões reais, sincronização, assinatura offline, cobrança e backups permanecem etapas futuras. A rodada termina agora para Murilo testar e relatar erros ou mudanças desejadas.

## Como abrir e experimentar

Feche a janela do inicializador atual, abra **INICIAR.cmd** em `D:\Projeto Sistema Local` e atualize o navegador no endereço local habitual. Confira primeiro uma consulta por código e nome, um carrinho com embalagem, a revisão de pagamento dividido, posições, inventário e os novos controles financeiros. Confirme operações somente quando quiser registrá-las nos dados da sua loja; consultar ou abrir a revisão não movimenta estoque/dinheiro.
