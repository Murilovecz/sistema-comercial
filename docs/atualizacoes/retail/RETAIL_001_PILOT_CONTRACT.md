# RETAIL-001 — Contrato operacional proposto do piloto

**Data:** 06/10/2026. **Status:** REVISADO E APROVADO como contrato/direção do primeiro piloto. Implementações e homologação operacional permanecem pendentes; aprovação documental não autoriza implantação real.

**Baseline de entrada:** `26def32abe183f5eba7c808a835a0e793de43ed2`, checkpoint `docs: audit retail mvp readiness`, pai `fe72a2e4c3416e56bf3c50950886a6b6ce4bc277`. O checkpoint incluiu exclusivamente os três documentos autorizados de RETAIL-000; árvore limpa confirmada antes de iniciar RETAIL-001; sem push.

**Fonte da autorização:** solicitação do proprietário “CHECKPOINT RETAIL-000 + INÍCIO RETAIL-001”. Autoriza somente especificação documental e os dois marcadores nos índices. A [auditoria RETAIL-000](RETAIL_000_MVP_AUDIT.md) foi aprovada como diagnóstico; suas recomendações continuam propostas. O [Documento Mestre v1.0](../../../Documento_Mestre_Sistema_Comercial_v1.0.md) mantém autoridade conceitual, especialmente §§2–8, 10–12 e 15–16.

**Aceite posterior — fonte: “CHECKPOINT RETAIL-001 + INÍCIO RETAIL-002A”.** O proprietário aprovou: uma Org/Unit/PC/caixa, gestor e vendedor restrito; caixa aberto para nova venda recebida no PDV; desconto manual ZERO, promoções separadas; bloqueio estrito de estoque temporariamente aceito somente no piloto, sem mudar o mestre; emissor externo/reconciliação; restituição externa PENDING → CONFIRMED com evidência; geração backend futura de SKU ausente estável/única; deployment local exclusivamente como exceção controlada; alvo inicial RPO ≤ 2h/RTO ≤ 4h para futura prova em RETAIL-005, sem SLA; C3 adiada e React comercial sem gate. As comparações/recomendações originais abaixo conservam os argumentos; este aceite substitui seus rótulos de pendência apenas para essas decisões. Rota fiscal concreta, recursos, implantação e provas GO continuam pendentes.

O mesmo pedido autoriza checkpoint documental e, após árvore limpa, somente RETAIL-002A: intenção/replay dos cinco comandos de caixa, sem alterar sua semântica financeira. Não autoriza 002B+, restituição externa, desconto, negativo, fiscal, perfil, multi-caixa, C3/D ou migration nova. Schema/novo contrato persistente necessário exige parada e revisão antes de criação. RETAIL-002A não recebe autorização de commit/push.

## 1. Decisões recebidas, recomendações e autorização

| Status | Conteúdo |
| --- | --- |
| **APROVADO COMO DIREÇÃO PARA ANÁLISE** | Uma Organization, uma loja/Unit, um PC operacional, um caixa físico, dono/administrador e vendedor restrito; varejo especializado de mercadorias; dinheiro/PIX/débito/crédito; sem TEF, múltiplas gavetas, offline/sync formal ou React comercial obrigatório; legado pode ser usado |
| **DIREÇÃO PREFERENCIAL DE ANÁLISE** | Piloto com emissor fiscal externo existente/adequado e reconciliação; futuro provedor integrado; sem motor fiscal próprio |
| **DECISÃO CONCEITUAL PRESERVADA** | Variante comercial/estoque distinta tem identidade/SKU próprio; barcode separado e múltiplos aliases. Cloud é autoridade definitiva. Venda física válida pode prosseguir com negativo/ocorrência no alvo conceitual |
| **APROVADO, AINDA NÃO IMPLEMENTADO/HOMOLOGADO** | Regras/limites do aceite posterior acima; alvo de recuperação da opção B, sem SLA. Detalhes da rota/recursos e prova dos critérios GO permanecem pendentes |
| **NÃO AUTORIZADO** | Código, migrations, testes executáveis, bind LAN, desabilitar production, abrir base operacional, implantar loja, iniciar C3/D/BRAND-002 ou fazer commit/push de RETAIL-001 |

Este documento registra o contrato aprovado, preservando alternativas e pendências nomeadas. O aceite é limitado às decisões expressas acima; não inventa enquadramento fiscal, alocação financeira ou homologação. O estado atual continua **NO-GO para vendas reais** enquanto os gates da seção 14 não forem demonstrados e aceitos.

### Responsabilidades aplicadas

Após leitura das definições dos papéis permanentes: Produto fecha jornada/regras e pendências; Arquitetura delimita exceção local/C3; Backend inventaria comandos/efeitos; Segurança define perfil/contexto e casos negativos; QA define provas de GO sem alegar execução; Integrações define reconciliação externa; Infraestrutura compara recuperação/entrega; Documentação distingue fonte/status/limites. Não foram iniciados agentes antigos, processos de especialistas ou implementação.

## 2. Escopo candidato fechado do piloto

**Operação:** uma loja parceira identificada e acompanhada, uma Organization/Unit, um PC com navegador e servidor local somente se a exceção for aprovada, uma gaveta física e uma sessão de caixa aberta por vez. Dono e vendedor usam contas pessoais distintas e alternam sessão; não compartilham senha. Etiqueta de estação/turno é informativa, não identidade confiável de dispositivo.

**Incluído:** cadastro assistido de mercadorias/variantes/clientes/fornecedores; catálogo/saldo inicial conferidos; compra e recebimento; AP vinculada explicitamente e despesas básicas pelo gestor; balcão com produto, quantidade inteira, preço/promoção configurada, cliente quando necessário e recebimento integral em dinheiro/PIX/débito/crédito; pagamentos mistos/troco em dinheiro; caixa/fechamento; venda/comprovante/reimpressão; cancelamento/devolução/restituição sob gestor; inventário/ajuste rastreado; relatório diário; emissão externa/reconciliação; backup externo e recuperação ensaiada.

**Limites deliberados:** novas vendas do PDV são integralmente recebidas; fiado/parcelamento interno, acordos/renegociação e crédito novo da loja não são decisões do vendedor. AR existente pode ser conferido/recebido pelo gestor no fluxo próprio, sem o chamar de venda novamente. Crédito da loja decorrente de devolução é tratado na seção 9, somente sob gestor e após aceite específico. Cartão de crédito no terminal externo não significa parcelamento/AR do ERP; datas/taxas/repasse do adquirente ficam fora da conciliação automática.

**Fora:** outro PC/LAN, múltiplas gavetas, transferência interunitária, atacado/canais externos, serviços/pesagem/fracionamento, produto sem estoque no primeiro catálogo, estoque em trânsito/logística, TEF/pinpad/acionamento de gaveta/balança, impressão direta ESC/POS, motor fiscal, upload/imagem/logo, offline/sync/Agente Local, DRE fictícia e reescrita comercial React. Reservas/orçamentos/conversões, quarentena operacional avançada, devolução ao fornecedor, acordos, recorrências automáticas e workflows de posições não são caminhos do piloto inicial.

Financeiro Básico continua essencial no produto. AP/AR/despesas/fluxo do recorte serão usados honestamente; DRE e autonomia financeira completa permanecem gaps declarados, não entrega pronta. Piloto reduzido não autoriza vender conformidade integral com o mestre nem excluir Financeiro Básico da oferta futura.

**Controles de fechamento:** fluxos excluídos precisam estar indisponíveis ao vendedor e não ser executados pelo gestor como parte do piloto sem revisão de escopo. Hoje essa whitelist não é um controle novo implementado; escondê-los no menu não basta. Critério futuro é autorização/backend e homologação, com estado histórico legível preservado. O piloto de base nova não pressupõe migração ou descarte da base operacional existente.

## 3. Jornada fechada e responsáveis

| Passo | Quem / ação | Evidência e condição de saída |
| --- | --- | --- |
| Preparar piloto | Proprietário + responsável operacional | Loja/UF/regime/atividade, emissor, limites, recuperação e exceções aceitos; ambiente isolado ensaiado; sem iniciar venda real pelo simples aceite documental |
| Preparar acessos | Gestor com permissions efetivas | Contas individuais, vínculo à Org/Unit, vendedor com tarefas da seção 10; teste de negação e revogação |
| Preparar catálogo | Gestor | Cada variante com ID/SKU próprio, preço, barcode/aliases quando usados, contagem inicial e códigos sem colisão; carga autorizada/conferida |
| Cadastrar fornecedor/fazer compra | Gestor | Pedido confirmado, itens/custo conhecidos, intenção da confirmação rastreável |
| Receber mercadoria | Gestor | Quantidade conferida; um recebimento e uma entrada únicos; versão/retry; nota externa de entrada guardada no processo fiscal aplicável |
| Criar AP/pagar | Gestor | Ligação explícita compra/obrigação/parcelas; pagar OU vincular despesa existente, evitando duplicar despesa; pagamento externo comprovado |
| Abrir caixa | Gestor | Fundo contado; caixa da Unit atual aberto; ator confiável; um único resultado mesmo após perda de resposta |
| Iniciar balcão | Vendedor autenticado | Contexto fixo do piloto, caixa permitido, consulta somente necessária; carrinho novo tem intenção nova |
| Identificar cliente | Vendedor | Consumidor final se permitido; identificação necessária à operação/documento, crédito ou regra fiscal sem coleta indiscriminada |
| Revisar preço/pagamento | Vendedor | Sem desconto manual; promoção configurada/elegível; quantidade; forma/valor/troco; cartão/PIX confirmados no canal externo correto |
| Confirmar ERP | Vendedor | Payload/requestId preparados e caixa esperado; uma venda, uma baixa e recebimentos únicos; timeout consulta/retry da mesma intenção |
| Emitir documento externo | Operador autorizado do emissor | Consultar antes de reemitir em dúvida; documento correto e autorizado quando exigido, vinculado à venda no registro de reconciliação |
| Entregar mercadoria/comprovante | Vendedor | Venda e documento reconciliados; comprovante interno não apresentado como fiscal; impressora escolhida homologada se necessária |
| Tratar cancelamento/devolução | Gestor | Separar fato comercial, documento fiscal, estoque e restituição; saldo/destinação/autoridade; nunca excluir para fechar diferença |
| Restituir | Gestor | Meio correto; saldo disponível; externo pendente até prova de execução; não duplicar dinheiro e crédito |
| Fechar dia/caixa | Gestor | Caixa contado, razão de divergência, vendas/documentos/restituições/PIX/cartão conferidos; pendências entregues com responsável |
| Backup/continuidade | Responsável de operação | Pacote válido, cópia externa recente segundo meta aprovada; status conferido; restauração previamente ensaiada |

Se pagamento externo estiver confirmado e confirmação ERP tiver resultado desconhecido, não cobrar novamente nem criar nova intenção automaticamente. Consultar/repetir a intenção preparada. Se a venda ERP existir e emissão fiscal falhar, não repetir venda para emitir: abrir pendência fiscal, consultar emissor e resolver/acionar contingência fiscal previamente validada. Sem procedimento válido, suspender novas operações afetadas e chamar o gestor.

Essa jornada exige pequenas evoluções dos contratos atuais; não foi executada em navegador, hardware ou loja nesta especificação.

## 4. Catálogo e SKU comercial

**ATUAL:** [catalog-registration](../../../catalog-registration.js) gera UUID de produto e saldo inicial; [domain](../../../domain.js) valida identificadores; código interno textual é opcional. [catalogue-next](../../../catalogue-next.js) tem famílias/atributos/membros; cada membro possui produto/estoque próprios. [product-lookup](../../../public/product-lookup.js) trata códigos/barcodes/aliases/embalagens. Não existe política de geração automática de SKU comercial implementada.

**RECOMENDAÇÃO:** quando usuário não informar código, geração automática de SKU comercial é compatível com o conceito, desde que ocorra no backend, dentro da criação, seja única no namespace aprovado, estável no replay e preservada depois. Nunca usar posição no array, nome/tamanho/cor ou barcode como identidade. UUID técnico continua íntegro; não renumerar produtos existentes nem reutilizar código de inativo.

Comparação: sequência legível facilita comunicação/etiqueta, mas exige alocação transacional e namespace; código aleatório legível reduz coordenação, mas ainda exige checagem de colisão e estabilidade. Recomendo geração legível sem tentar codificar todas as características da grade; formato/namespace ficam para revisão da entrega, sem campo/schema novo aqui. O namespace atual de identificadores é contextual da Unit; isso não aprova unicidade global nem altera o sharing Org planejado.

Barcode continua opcional/separado, com vários aliases; não gerar EAN fiscal/comercial válido por mera concatenação de números. Roupa/calçado: variante distinta de tamanho/cor é outro produto/ID/SKU; família agrupa, não compartilha saldo fictício. Duplicatas de combinação precisam reconhecimento/revisão no cadastro, conforme fluxo existente; não prometer constraint inexistente.

Critério futuro: mesmo requestId de criação retorna mesmo produto/SKU; intenção nova gera identidade distinta; código fornecido válido preservado; colisão falha sem saldo/movimento parcial; zeros do barcode preservados; grade e aliases não permitem vender o SKU errado. Nenhuma geração/carga foi implementada nesta rodada.

## 5. Política proposta de caixa

**Regra candidata:** nova venda integralmente recebida no PDV exige caixa aberto da Unit permitida, inclusive PIX/cartão. Caixa aqui organiza a operação e conferência; dinheiro físico só muda conforme seu meio. O vendedor recebe pela venda, não ganha poder de suprimento/sangria/fechamento.

**ATUAL:** [cash-core.openCash](../../../public/cash-core.js) encontra um aberto por Unit; [cash](../../../cash.js) permite vínculo nulo se não houver aberto. Venda/recebimento podem ocorrer assim. [checkout-context](../../../foundation/commercial-read.js) informa o aberto; [server](../../../server.js)/IDP-001 já consideram caixa esperado no contexto preparado. Portanto a regra nova **ainda não é garantida**.

| Efeito da regra | Contrato proposto / impacto a homologar |
| --- | --- |
| Antes da primeira venda | Gestor precisa abrir e conferir fundo; vendedor não improvisa abertura com nome digitado |
| Dinheiro/PIX/cartão | Todos entram como recebimentos operacionais; somente dinheiro/troco líquido altera gaveta. Totais nominais não provam liquidação bancária |
| Preview/confirm concorrentes | Se caixa fechar/trocar após preparo, intenção nova não confirma no contexto antigo. Não reatribuir silenciosamente para novo caixa |
| Retry de venda já aceita | Reconhecer resultado original autorizado mesmo se caixa foi fechado depois; sem nova baixa/recebimento/vínculo. Revalidar autorização, sem reexecutar exigência de caixa aberto sobre fato já confirmado |
| Chave antiga + caixa diferente | Payload/contexto alterado não é retry. Exigir revisão humana e nova intenção somente para operação realmente nova |
| Rotas de venda | Regra no backend do PDV utilizado, incluindo qualquer rota alternativa habilitada. Não confiar em botão desabilitado ou deixar `/api/commercial/sales` contornar contrato |
| Históricos sem caixa | Preservar, sinalizar quando relevante; não atribuir caixa/autor artificialmente nem recalcular fechamento antigo |
| Testes existentes | Fixtures que vendem sem caixa representam contrato antigo; nova regra exige revisão de consumidores/aceite, sem apagar assertions de atomicidade/replay |
| AR posterior | Fora da criação de venda PDV. Proposta: recebimento em dinheiro exige caixa do dia/vínculo; PIX/cartão pelo gestor com conferência externa. Não estender regra a todos os comandos sem contrato específico |
| Restituição | Dinheiro exige caixa aberto permitido/saldo; PIX/cartão não viram saída fictícia de gaveta. Pendência externa permanece visível ao gestor depois do fechamento |
| Fechamento | Gestor compara contagem física, vendas e canais externos; conserva divergência/motivo. Pendência fiscal/restituição não desaparece ao fechar |

Esta regra não cria conta bancária, TEF, dispositivo confiável ou autoridade de estação. É temporariamente um caixa/Unit; não simular múltiplas gavetas com múltiplas Units. Aceite definitivo depende de testes de começo/fim do dia, retry após fechamento, mudança de contexto, erro/rollback e pagamento misto.

## 6. Descontos: alternativas e recomendação

Mestre §6 separa promoção, desconto manual, referência e autoridade. **ATUAL:** [discount-core](../../../public/discount-core.js) exige motivo e desconto menor que subtotal; [pricing](../../../pricing.js) valida oferta/assinatura e justificativa; `allowPromotionDiscount` confirma combinação, não autorização de gestor. Não há alçada formal atual; approval de inativo é outra finalidade.

| Opção | Risco / tempo / trade-off |
| --- | --- |
| **A — sem desconto manual discricionário do vendedor** | Menor risco e caminho mais curto. Para evitar inventar primitive de exceção, proposta inicial é desconto manual zero no PDV do piloto para todos os executores; não conceder escape implícito ao “dono”. Perde negociação individual |
| **B — somente gestor com autorização explícita** | Melhora negociação; exige prova de permission, contexto, referência/valor/motivo e autorização vinculada à intenção. Login/nome de cargo ou mensagem verbal não bastam. Esforço MÉDIO, não existe hoje como contrato próprio |
| **C — alçada já no piloto** | Maior flexibilidade; exige política, limites, exceções, gestão cloud-only e testes. Esforço ALTO, aumenta decisões e tempo até receita |

**Recomendo A** para primeiro piloto. Promoção automática configurada/elegível continua separada; nenhuma promoção aumenta alçada manual. Configuração de preço/promoção fica com gestor autorizado; editar catálogo a cada venda para contornar proibição de desconto não faz parte da jornada. Seleção manual de preço/exceção abaixo do mínimo também não é escape autorizado.

A é proposta de comportamento futuro: precisa validação backend dos caminhos habilitados, adulteração de payload e combinações. Hoje esconder campo não impede desconto pela API. Se a primeira loja depende de negociação discricionária, decidir B e seu incremento antes do GO; não tratá-la como requisito já satisfeito ou encaixá-la silenciosamente no pacote de replay.

## 7. Estoque negativo: alvo preservado e exceção candidata

**DECISÃO DEFINITIVA PRESERVADA:** mestre §7.2 permite venda física válida apesar da divergência, saldo negativo e ocorrência/tarefa auditável. **ATUAL:** servidor/UI bloqueiam venda acima do disponível; inventário/posições/reservas/quarentena e espelhos também têm invariantes que não podem ser relaxadas isoladamente.

| Caminho | Custo / risco / consequência |
| --- | --- |
| Implementar alvo antes do piloto | Esforço ALTO: contrato de prova física/autorização/severidade, saldo físico versus disponível, ocorrência, posições/reservas/quarentena, snapshot/SQL, histórico e testes de concorrência/retorno. Reduz dívida conceitual, adia piloto e pode afetar mais domínios |
| Exceção temporária: bloqueio estrito | Mudança de regra de estoque não necessária agora; esforço BAIXO de procedimento/especificação, mas risco de impedir venda real por cadastro/saldo divergente. Requer aceite explícito da contradição temporária |

**Recomendo avaliar a exceção temporária** para este piloto de um posto, com contagem/cadastro iniciais e gestor disponível. Em bloqueio, vendedor não aumenta saldo nem seleciona outro SKU fictício. Gestor confere produto/fato/movimentos, registra ocorrência de investigação no procedimento e corrige pelo fluxo autorizado de recebimento/inventário/ajuste com motivo, só então faz nova revisão. Entrada manual não pode ser usada para encobrir falta física.

**Dívida criada:** fato físico válido pode continuar sem venda ERP até regularização; não existe ocorrência automática do alvo; métricas omitem vendas impedidas; confiabilidade do saldo inicial e tempo do gestor viram dependências. A exceção não altera §§7.2/11, não é solução comercial definitiva e não autoriza apagar fatos ou inventar estoque.

Vigência proposta: somente piloto identificado, até seu encerramento/revisão explícita; sem renovação automática nem extensão a clientes comuns. Data/limite e responsável precisam aceite. Medir bloqueios, motivo e tempo de resolução; se a rotina depende de atalhos, NO-GO/pausa e revisar implementação do alvo. Nenhum saldo, guarda ou mestre foi alterado.

## 8. Rota fiscal externa e reconciliação

**Proposta preferencial:** emissor externo já adequado à loja, operado por pessoa autorizada, com reconciliação controlada de venda/documento/eventos. ERP não emite nem assina fiscal nesta etapa; futuro adapter/provedor integrado, sem motor próprio.

Antes de venda real: identificar UF, enquadramento/atividade/operação, emitente, credenciamento, documentos exigidos, operador, evidências aceitas, cancelamento/devolução e contingência do emissor com validação fiscal competente. Se paulista, a rota precisa validação **específica SP**: a SEFAZ-SP informa substituição por NFC-e no varejo a partir de 01/01/2026. Não inferir dispensa por ser MEI nem adotar SAT genericamente. [SEFAZ-SP — NFC-e](https://portal.fazenda.sp.gov.br/servicos/nfce/).

A orientação oficial diferencia hipóteses de emissão do MEI; enquadramento sozinho não prova dispensa para qualquer operação/destinatário. [Portal do Empreendedor — nota fiscal](https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/nota-fiscal). Não escolhi UF, modelo, prazo legal, CFOP/CST/NCM ou regra tributária do cliente. Permanecem A DEFINIR na validação da rota, não calculados pelo contrato.

### Informação que precisa ser guardada/reconciliada, sem schema novo

As linhas seguintes são **requisitos de informação e evidência de negócio**, não campos de tabela/API ou layout de arquivo proposto. Para piloto, um registro administrativo controlado pode suprir o vínculo fora do ERP, com acesso restrito, histórico de correções e responsável; precisa aceite e ensaio. Não equivale a integração ou auditoria append-only do ERP.

| Fato | Informação mínima / evidência / ligação |
| --- | --- |
| Venda ERP | Identidade imutável da venda e intenção original, Org/Unit, executor/data, itens/variantes/quantidades, preço/desconto/total, meios/valores recebidos e situação comercial |
| Documento externo | Identificação única verificável do documento/modelo, emissor legal/local, destinatário quando exigido, data, itens/totais/tributação conforme emissor, situação e prova de autorização, acesso ao documento/XML e representação disponíveis |
| Vínculo venda/documento | Correspondência inequívoca e responsável pela conferência; identificar também ausência, duplicidade, divergência e contingência. Um documento não pode ser atribuído inadvertidamente a duas vendas |
| Cancelamento | Venda/documento originais, motivo/ator/data, pedido versus confirmação fiscal, prova do evento/resultado e efeitos comerciais/estoque. ERP cancelado não prova documento cancelado |
| Devolução | Venda original, documento aplicável de origem/devolução validado fiscalmente, itens/quantidade/valor, destinação vendável ou não, responsável/data e efeitos de saldo/crédito; não exigir cancelamento integral quando fato é parcial |
| Restituição | Origem cancelamento/devolução, valor/meio, destinatário correto, intenção, pendência versus confirmação, prova externa quando aplicável, saldo já restituído/convertido/restaurado em crédito; prevenir duplicação |
| Correção/fechamento | Divergência detectada, responsável, ação e evidência de resolução; preservar versão/evento anterior. Relatório diário cruza ERP, emissor, dinheiro físico e canais externos |

Documentos/evidências ficam sob custódia definida pelo gestor, com backup externo e acesso mínimo; vendedor vê o necessário ao atendimento. Certificado, chave privada, CSC, senha do emissor e dados completos de cartão **não** entram em fingerprint, logs, documento do projeto ou comprovante interno. Não adicionar upload/assets/schema para atender esta especificação.

### Tratamento concreto de exceções

- Emissor em timeout: consultar identidade/situação no emissor antes de emitir outra vez; não criar nova venda ERP. Se não há consulta confiável/procedimento, NO-GO dessa rota.
- ERP confirmado/documento pendente: registrar pendência com responsável; usar apenas contingência fiscal validada do emissor. Operação local sem internet não é contingência fiscal nem offline autorizado do ERP.
- Documento autorizado/ERP com resultado desconhecido: consultar/retry da intenção ERP original; reconciliar. Não lançar “segunda venda” para fechar relatório.
- Cancelamento ERP e fiscal divergentes: manter ambos os estados/evidências e acionar gestor/validação fiscal; não apagar venda/documento nem alterar fato para fingir igualdade. Reversão/regularização precisa caminho aprovado.
- Devolução parcial: documentar fatos/quantidades/valores e documento aplicável sem presumir que cabe cancelamento integral. Restituição é trilha separada.
- Fechamento: conciliar quantidade/valor por venda/documento e pagamentos; pendências continuam abertas, com responsáveis e procedimento de escalada. Emissão não se deduz da soma diária.

Preferir uma venda → um documento no recorte. Operação que exige desdobramento/agrupamento é fora do contrato inicial até desenho explícito. Revisão por venda no momento do atendimento e revisão diária pelo gestor; não esperar fechamento para descobrir que o dia inteiro não foi emitido.

## 9. Modelo proposto de restituições e reversões

Cancelamento comercial, devolução física, evento fiscal, restituição ao cliente e restauração/emissão de crédito são fatos distintos. **Estados conceituais propostos:** restituição pendente de execução/confirmação externa e restituição confirmada com evidência. Rejeição/falha ou resultado desconhecido mantêm pendência; não são confirmação. Não são colunas novas nem código implementado.

| Meio | Execução / confirmação / vínculo e limites |
| --- | --- |
| **Dinheiro** | Gestor autorizado, cliente/destinatário conferido, caixa permitido aberto/saldo suficiente, entrega física comprovada e registro único. Falha/timeout ERP depois de entregar dinheiro exige consultar/retry, jamais entregar de novo. Definir comprovante/dupla conferência conforme procedimento aceito |
| **PIX** | Gestor executa pelo canal externo aprovado, confere destinatário/valor/origem e obtém comprovante/identificador verificável. Só então confirmar restituição ERP. Cancelamento ERP não prova devolução PIX; status desconhecido exige consulta externa |
| **Cartão débito** | Procedimento do adquirente/terminal externo vinculado à transação original; guardar evidência de pedido e confirmação. Sem TEF. Falha/prazo externo mantém pendência; não substituir automaticamente por dinheiro ou PIX |
| **Cartão crédito** | Distinguir solicitação aceita pelo adquirente de situação confirmada segundo evidência da rota. Repasse/fatura/parcelas podem ter tempos próprios, A DEFINIR com adquirente. Não prometer crédito imediato ao cliente nem inventar prazo |
| **Crédito da loja** | Obrigação interna vinculada a cliente e origem, com consentimento/política aceita; criação, consumo e restauração únicos. Não é dinheiro entregue nem estorno bancário. Crédito originalmente usado e depois restaurado não gera restituição em dinheiro pelo mesmo valor |

Conservação: o valor pago externamente, o saldo a receber reduzido, a parte de crédito interno restaurada e eventual crédito novo precisam ser conciliados sem duplicação. Não reembolsar mais que o direito disponível da origem; pagamentos mistos têm alocação definida/documentada pelo gestor, sem escolher regra fiscal/financeira ambígua automaticamente. Não confirmar dinheiro+PIX+crédito pelo mesmo direito. Toda tentativa/confirmação/correção se vincula à origem e ator.

**ATUAL e gap:** [server.change](../../../server.js) cancela/repõe estoque uma vez e preserva recebimentos; venda com devolução parcial não aceita cancelamento integral. [cashAction refund](../../../cash.js) atende dinheiro de venda integral cancelada. [returnAction](../../../workflows.js) aceita refund declarado em dinheiro/PIX/débito/crédito, mas grava fato efetivo imediatamente, não workflow externo pendente/confirmado; venda cancelada não aceita esse caminho. [store-credits](../../../store-credits.js) emite/restaura/consome crédito com guardas e command. Não há confirmação do adquirente/PIX nem restituição integral não dinheiro completa.

Despesa/AP: cancelar despesa não apaga caixa histórico; `cancelExpense` bloqueia despesas vinculadas à AP, mas não implementa reversão geral. AP cancelada cancela saldo ainda aberto, não desfaz pagamento realizado. Procedimentos não podem tratar essas ações como dinheiro recuperado. Recorte de reversões precisa desenho separado antes do uso real, com eventos vinculados, intenção/limites e testes.

Durante piloto, vendedor solicita, gestor decide/executa; crédito novo não é imposto ao cliente. Se crédito da loja ficar fora do aceite inicial, não emitir novos créditos; ainda preservar e reconciliar créditos históricos/restaurados quando existirem. A escolha não fica implícita por a UI oferecer o botão.

## 10. Perfil exato do vendedor restrito

“Dono”, “gestor” e “vendedor” descrevem funções operacionais; **nome de role/cargo não concede direito**. Concessões são explícitas, contextuais e verificadas no backend. Não criar Owner, ACL v2 ou nova permission nominal para esconder alcance insuficiente.

| Tarefa permitida proposta | Dados mínimos / limite |
| --- | --- |
| Consultar produto/preço/saldo | ID/SKU/nome/variante, código/barcode/alias/embalagem necessária, preço/promoção elegível e disponibilidade operacional da Unit. Sem custo/margem/compras |
| Montar/revisar carrinho | Quantidade inteira, itens, subtotal/total, situação de caixa, sem desconto manual nem alteração de catálogo/saldo |
| Identificar cliente quando necessário | Busca/seleção e dados indispensáveis ao atendimento/fiscal; novo cadastro por gestor ou fluxo mínimo posteriormente autorizado. Sem dados livres sensíveis por conveniência |
| Receber nova venda | Formas/valores/troco necessários, comprovação externa e confirmação ERP contextual; sem AR/financeiro geral ou perdão de saldo |
| Operar o caixa permitido | Gerar recebimento da venda no único caixa aberto da Unit; consultar somente disponibilidade/situação necessária, sem sangria/suprimento/fechamento/refund direto |
| Consultar/reimprimir venda necessária | Sua venda recém-concluída e suas vendas do dia para atendimento; outro histórico/documento por gestor. Visibilidade deve valer também em lookup por ID, não só na lista |
| Solicitar ação de gestor | Inativo, cancelamento/devolução/restituição, ajuste/divergência e exceção fora de política. Solicitação não é execução/autorização |

Não precisa: financeiro completo, despesas/AP/AR/acordos, custo sensível, relatório administrativo, usuários/papéis/auditoria administrativa, configuração/preço/promoção/branding, fornecedores/compras, outros contextos Org/Unit ou banco. Não exportar snapshot para fazê-lo imprimir recibo.

**ATUAL:** [rbac](../../../foundation/rbac.js) tem `catalog.view`, `inventory.view`, `sales.view/create`, `cash.manage` etc.; [authorization](../../../foundation/authorization.js) exige cinco leituras amplas para escrita legada. [commercial-write](../../../foundation/commercial-write.js) permite venda com catalog.view/sales.view/sales.create; [commercial-read](../../../foundation/commercial-read.js) tem DTOs e exige financial.view adicional para custos/detalhe financeiro. A UI parcial existe, mas não equivale ao PDV completo restrito; sales.view permite escopo Unit mais amplo que apenas suas vendas.

Candidato de concessões mínimas usa as permissions existentes relevantes (catalog.view, sales.view/create e inventory.view quando necessário), **sem** catalog.manage, financial.view/manage, cash.manage, inventory.adjust, companies/units/users/roles.manage. Isso **não prova sozinho** a limitação fina da tabela: DTOs/rotas de leitura e recebimento/comprovante precisam adaptação/homologação, inclusive não entregar notas livres/histórico alheio desnecessários. Não afirmar que o perfil já está pronto.

Aceite: vendedor faz o fluxo inteiro, payload adulterado não concede desconto/acesso/cash externo; sem custos/financeiro/global snapshot; consulta por ID/lista/export também respeita limite; outra Org/Unit nunca entra; contexto/permission revogados falham; nenhum request informa executor confiável. Não conceder SNAPSHOT_READ completo apenas para fazer o balcão legado funcionar.

## 11. Inventário fechado de comandos críticos

O conjunto é fechado para a jornada proposta, não “todos os comandos”. Cada comando abaixo foi confrontado com handler/helper/testes existentes. **Obrigatório** refere-se à validação atual do backend, não a UI normalmente enviar chave. Todas as escritas ainda precisam sessão/permission/contexto/transação; isso não equivale a replay contextual uniforme. Não executei esses testes nesta rodada.

### 11.1 Comandos a endurecer no recorte anterior ao GO

| Comando atual (POST) | Efeito financeiro/estoque | Proteção atual | requestId obrigatório? | Risco de replay | Prioridade para piloto |
| --- | --- | --- | --- | --- | --- |
| `/api/cash/open` | Fundo/sessão de caixa | Key opcional + signature; recusa outro aberto | **NÃO** | Mesmo payload imediato não abre dois; resposta perdida não retorna resultado comprovado sem chave; retry tardio após fechar pode abrir nova sessão | P0 de recuperação; 002A |
| `/api/cash/supply` | Entrada de dinheiro | Key opcional/signature; saldo esperado opcional | **NÃO** | Sem chave/expected, mesma entrada pode somar de novo | **P0 de efeito duplicado**; 002A |
| `/api/cash/withdraw` | Sangria/saída | Key opcional/signature; saldo suficiente | **NÃO** | Pode retirar/registrar outra saída enquanto houver saldo | **P0 de efeito duplicado**; 002A |
| `/api/cash/refund` | Restituição em dinheiro de venda cancelada | Key opcional/signature; limita ao recebido e saldo de caixa | **NÃO** | Parcial repetido pode restituir novamente dentro do restante; limite não prova intenção | **P0 de efeito duplicado**; 002A, regra de restituição em 002E |
| `/api/cash/close` | Fecha/congela conferência | Key opcional/signature; recusa fechado, diferença exige motivo | **NÃO** | Repetição não fecha duas vezes; perde reconhecimento de sucesso sem chave | P0 de recuperação; 002A |
| `/api/sales/receive` | Recebimento direto de saldo, possível caixa | Key opcional; saldo e expectedRemaining/caixa opcionais | **NÃO** | Parcial pode criar segundo recebimento enquanto há saldo quando expectativas omitidas | **P0 de efeito duplicado**; 002B |
| `/api/expenses` | Despesa, possível saída de caixa | Key opcional; replay compara dados quando fornecida; datas/valor/caixa | **NÃO** | Nova despesa/saída repetida se key ausente e saldo permitir | **P0 de efeito duplicado**; 002B |
| `/api/stock` | Entrada manual de quantidade/movimento | Key opcional e comparação de produto/quantidade/nota/destino | **NÃO** | Pode acrescentar saldo novamente sem chave | **P0 de efeito duplicado**; 002C |
| `/api/purchases/receive` | Receipt + entrada de compra | Key opcional/signature; **expectedVersion obrigatório**, limite restante; versão incrementa | **NÃO** | Mesmo payload/versão não baixa duas vezes: segunda falha de versão. Falta reconhecer intenção sem chave; “atualizar versão e reenviar” pode virar outro recebimento | P0 de intenção/recuperação; 002C, sem alegar bypass da versão |
| `/api/sales/cancel` | Reposição de estoque/restauração de crédito; estado comercial | `cancelledAt`/devolução prévia guardam transição; sem contrato próprio de replay | **NÃO** | Guarda impede dupla reposição imediata; retry retorna erro, não resultado da intenção; restituição/fiscal separados | P0 de reversão/recuperação; 002D |
| `/api/expenses/cancel` | Cancela fato de despesa na consulta; não desfaz dinheiro por si | `cancelledAt`, trava despesa ligada à AP; helper recebe ID, não prova de intenção | **NÃO** | Sem dupla saída por esta ação; risco é confundir cancelamento com recuperação financeira/resultado desconhecido | P0 de reversão/recuperação; 002D |

**Fechamento do conjunto:** 11 comandos em quatro incrementos; seis têm risco direto de efeito repetido sem chave no cenário descrito (supply, withdraw, refund, sales/receive, expenses, stock). Os demais têm guardas que limitam repetição, mas contrato de intenção/recuperação insuficiente para o uso crítico. Não transformar rejeição de versão/cancelledAt em alegação de segunda baixa já demonstrada.

Fonte exata: [cash.validateKey/cashAction](../../../cash.js), [payments.receive](../../../payments.js), [domain.expense/cancelExpense](../../../domain.js), [purchaseAction](../../../purchases.js), [server.change](../../../server.js). `cash.test.js`, `payments.test.js`, `purchases.test.js` e `commercial-cash-http.test.js` já verificam replay com chave e guardas; a ausência de chave é aceita pelo contrato inspecionado, não um teste novo de exploração.

### 11.2 Caminhos críticos já com identidade obrigatória: preservar e homologar

| Comando / conjunto finito | Efeito | Proteção atual / chave | Trabalho antes do GO |
| --- | --- | --- | --- |
| `/api/sales` | Venda/recebimentos/baixa/crédito | **SIM**, IDP-001 fingerprint canônico contextual/ator, resultado durável | Preservar; homologar nova política de caixa/discount sem regredir retry |
| `/api/commercial/sales` | Mesmo domínio de venda | **SIM**, validateSaleDraft + commercialCommandFingerprint; scope vem da sessão. Prova de ator/contexto não é o mesmo contrato da rota IDP-001 | Se usada pelo vendedor, verificar paridade necessária de intenção/ator e guardas; não declarar dois fingerprints equivalentes sem prova |
| `/api/workflows/returns/create` e `/refund` | Retorno de estoque/direito de devolução/restituição | **SIM**, command, returnVersion, quantidades/saldo/expectativas | Preservar replay; evolução de pendente/confirmada externa pertence a 002E, não mera key obrigatória |
| `/api/payables/create`, `/pay`, `/link`, `/cancel` | Obrigação, pagamento/despesa, vínculo ou cancelamento de saldo | **SIM**, command + versão; link não cria outra despesa | Não reimplementar replay; homologar pago versus cancelado e vínculo único no backoffice |
| `/api/business/accounts/receive`, `/allocate`, `/forgive` | Recebimentos/alocações ou perdão | **SIM**, command + versões/expectativas | Preservar; gestor somente, sem perdão pela rotina do vendedor |
| `/api/workflows/inventory/apply` | Ajuste físico/movimentos | **SIM**, command + versões/tokens/guardas | Reutilizar, teste de aplicação única/concorrência no ensaio; preparo/contagem também usa command |
| `/api/advanced/storeCredits/issue`, `/cancel` | Obrigação interna de crédito | **SIM**, advanced-common → command + versões/saldo | Somente se crédito novo aprovado; conservação com restituição/consumo/restauração |
| `/api/commercial/products` | Produto/saldo inicial | **SIM**, registrationRequestId/fingerprint/executor; inventory.adjust se saldo positivo | Preferir no cadastro assistido; SKU gerado deve respeitar o mesmo replay |

[commands](../../../commands.js) exige requestId, mas sua signature não é automaticamente a prova contextual/ator de IDP-001. Assertions novas devem testar o contrato do caminho usado, sem refatorar todos os comandos por arrasto. Helper interno `sale()` não é uma segunda API de caixa: quando chamado por workflow, respeitar intenção externa e proteção própria.

### 11.3 Limites explícitos da lista

Produtos com saldo inicial: usar cadastro comercial protegido; `/api/products` legado não tem contrato obrigatório equivalente, portanto não usar como atalho de carga. Clientes/fornecedores devem preferir cadastro comercial com identidade; não são P0 de dinheiro por si. Compra create/confirm/edit/close tem versionamento/replay opcional: prevenir duplicata de preparação e conferir pedido/AP, mas não alegar que create já produz baixa/recebimento. A melhoria desses cadastros é onboarding/P1, sem incluí-la como pacote financeiro automático.

Excluídos da jornada inicial: `/api/quotes/convert`, `/api/workflows/reservations/convert`, `/api/advanced/supplierReturns/*`, `/api/next/agreements/*`, `/api/next/transfers/*`, `/api/advanced/quarantineEntries/*`, recurring e demais workflows avançados. Não certifico esses caminhos como endurecidos pelo inventário do piloto. Sua ativação exige ampliar explicitamente a lista, inspeção de efeitos/consumidores e aceite; ocultar menu não basta. Preservar leitura histórica quando existir, sem acionar conversão.

### Invariantes para os incrementos de replay

Ausência/invalidade de intenção falha antes de efeito; intenção igual reconhece resultado durável; conteúdo/contexto/ator incompatíveis falham sem efeito; autorização é revalidada; falha de domínio/SQL/audit reverte tudo; chave não muda automaticamente após timeout/erro; intenção efetivamente nova ganha identidade nova após revisão humana; valores exatos e históricos intactos. Fingerprint considera apenas conteúdo semanticamente relevante e contexto aprovado; não inclui approvalToken, senha, certificado ou evidência sensível completa para “variar”. Compatibilidade de rascunhos/históricos/consumidores precisa desenho por comando.

## 12. Deployment excepcional, recuperação e hardware

### Exceção local candidata

Avaliar um PC com aplicação/SQLite local e navegador em loopback como **exceção exclusiva de piloto controlado**. Não redefine cloud-authoritative, não é Agente Local/offline autorizado, não habilita commercial production nem vira padrão para outras lojas. Aprovação documental de análise não autoriza executar development como produção por conveniência.

**ATUAL:** [server](../../../server.js) escuta `127.0.0.1`; [config](../../../foundation/config.js) recusa production; startup prepara/migra DB; backup é técnico/local. Antes de deployment, desenho/runbook específicos revisados precisam definir versão/configuração permitida para piloto, ambiente/dados novos, responsabilidades, permissões no SO, sessão individual, restrição de acesso físico/admin, parada segura e recuperação. Sem enfraquecer guarda production ou abrir LAN. Base operacional atual continua fechada e intocada.

Riscos da exceção: perda/roubo/malware do PC, administrador local capaz de adulterar banco/audit, processo parado sem backup, indisponibilidade por Windows/energia, falta de autoridade cloud e segregação operacional de produção. Loopback reduz exposição de rede, não elimina esses riscos. Dados e pacote de backup contêm informações privadas/hash de credencial; cópia externa exige acesso restrito e proteção definida. Segredos do emissor permanecem fora do ERP/cliente/Git/logs.

Se proprietário não aceitar a exceção ou controles mínimos não forem viáveis, o próximo passo é desenho de deployment cloud apropriado, não trocar bind ou NODE_ENV. Atualização manual assistida pode ser suficiente ao piloto somente com artefato oficial identificável/assinado, schema compatível, backup e ponto seguro conforme mestre §12; automação de updater não é gate automático.

### Opções de RPO/RTO para decisão, sem meta inventada como aprovada

RPO = perda máxima tolerada de fatos em recuperação; RTO = tempo para retomar operação segura. Números abaixo são **opções candidatas**, não SLA/garantia, e exigem ensaio end-to-end. RPO depende da última cópia válida fora do PC, não do timer local. Início/fim de contagem do RTO e cobertura de horário precisam ser aceitos.

| Opção candidata | Mecanismo/condições a demonstrar | Impacto operacional / esforço |
| --- | --- | --- |
| **A — RPO até 6 h / RTO até 8 h** | Pacote consistente e cópia externa validada dentro da janela; suporte assistido e equipamento de reposição acessível | Menor custo, mas pode perder muitas vendas/fechamento e parar uma jornada. Só aceitável com aceite explícito e reconciliação externa viável; não recomendo como default |
| **B — RPO até 2 h / RTO até 4 h** | Geração pelo menos horária e transferência/validação com margem dentro de 2 h; copia no fechamento; responsáveis, pacote compatível e PC de reposição/procedimento ensaiado | Equilíbrio recomendado para discussão: interrompe parte do dia, exige rotina/monitoramento e reposição preparada. Esforço MÉDIO, sem promessa antes do ensaio |
| **C — RPO até 30 min / RTO até 2 h** | Pacotes/cópias externas em cadência menor com margem de transporte; validação/alerta; spare pronto; medição de impacto da cadência nas vendas | Menor perda, maior custo/automação e disciplina; esforço ALTO. Não significa sync cloud ou que SQLite/PC já sustentam essa meta |

**Recomendação para decisão: B**, desde que recursos/ensaio a sustentem; caso contrário rever meta/arquitetura, não declarar cumprimento. Qualquer opção precisa cópia externa protegida, idade máxima observável, responsáveis, retenção aprovada e teste de perda total/reabertura. Defaults atuais de 6h/30 dias/mínimo três não definem a opção escolhida.

Runbook candidato: suspender vendas; preservar origem/evidências; verificar último pacote externo/schema; restore em destino novo isolado; conferir integridade/escopos/fatos/audit; reconciliar intervalo perdido com emissor/terminais/registro controlado; validar caixa/saldo; aprovar retomada. Não sobrescrever DB da loja, fazer downgrade ou reimportar JSON como identidade histórica. Registrar fatos perdidos/reconstituídos exige caminho autorizado que preserve autoria/origem; não digitar vendas repetidas/recebimentos novamente para “bater”.

Falha de energia/processo: revisar resultado da intenção antes de repetir. Falha de internet: ERP local não libera emissão fiscal nem simula autorização offline; apenas contingência externa previamente validada. Sem PC operacional: suspender uso ERP, seguir procedimento externo aprovado sem prometer backfill automático; retomada condicionada à reconciliação. Sem recuperação ensaiada, NO-GO.

### Hardware limitado

Teclado/mouse; leitor USB como teclado/Enter se utilizado; impressora comum/térmica via SO/browser se necessária; app/meio PIX e terminal de cartão externos. Ensaiar foco, zeros iniciais, leitura repetida, quantidade/embalagem, layout/troco/reimpressão e documentos entregues. Não há gate de gaveta automática, TEF, pinpad, balança ou driver próprio. Computador/driver/modelos não foram homologados nesta rodada.

## 13. Relação com C3

**C3 continua adiada.** Rota externa não prova por si necessidade de writer/binding Legal interno: emitente/credenciamento podem estar no emissor e vínculo/evidência no registro controlado, desde que aceitos/homologados. Branding/nome atual da company nunca substituem prova legal histórica.

Se a rota escolhida **demonstrar** que ERP precisa emitir/preencher dados legais ou preservar contexto interno consumido por documento/obrigação, menor recorte a especificar: identidade evidenciada/protegida do emitente, vínculo concreto Unit → Legal, autoridade de configuração e fatos/contexto histórico imutáveis/legíveis, com casos UNRESOLVED preservados. Não executar profiles/head/ACL/Owner/sessions/backfill ou toda C3 automaticamente; desenho/aceite de recorte antes de qualquer schema.

Não há necessidade comprovada de migration 013 nesta análise. 011 continua dormente e 012 intacta; nenhuma ativação foi feita. Eventual exceção local de configuração crítica precisa revisão explícita frente às seções cloud-only do mestre, não aceitação indireta pela rota externa.

## 14. Riscos, aceite e critérios GO / NO-GO

### Registro de risco e quem pode aceitar

| Risco/limite | Situação do aceite nesta rodada | Tratamento/gate |
| --- | --- | --- |
| Um PC/caixa, sem TEF/offline formal/React obrigatório | Direção de análise expressamente aprovada; disponibilidade operacional ainda não aceita/homologada | Ensaio/hardware/implantação; não prometer várias gavetas ou offline |
| Fiscal externo + reconciliação manual | Estratégia aprovada; rota concreta ainda A DEFINIR | Proprietário/validação fiscal/operador do emissor, consulta e documentos; antes de venda real |
| Desconto manual indisponível | ZERO aprovado no piloto; implementação pendente | Backend deverá impedir nos caminhos habilitados; não entra em 002A |
| Bloqueio estrito temporário de estoque | Exceção temporária expressamente aceita somente no piloto; decisão definitiva preservada | Contagem/procedimento/métricas e vigência do piloto; sem virar padrão comercial |
| Autoridade local e administração do arquivo | Deployment aprovado somente como exceção controlada do piloto; controles/implantação não homologados | Desenho/runbook/fronteiras; cloud continua alvo; sem LAN/remoção de guarda production |
| Perda/tempo de parada | Alvo inicial RPO ≤ 2h/RTO ≤ 4h aprovado para futura homologação; sem SLA | Recursos e prova em RETAIL-005; defaults não são garantia |
| Restituição externa pendente e crédito da loja | PENDING → CONFIRMED mediante evidência aprovado; política de alocação/crédito e implementação pendentes | Gestor/cliente/provedor conforme meio; limites/intenção; meios externos somente 002E |
| Dados híbridos e ausência de DRE completa | Limitação atual registrada; não é aceite de corrupção ou oferta comercial incompleta | Escopo honesto, transações/fatos/recovery; evolução Financeiro Básico futura |

Não há aceite de duplicação financeira, isolamento fraco, segredo exposto, obrigação fiscal descumprida ou perda desconhecida de dados. Somente as decisões expressamente recebidas no aceite posterior estão aprovadas; demais itens dependem de decisão e provas.

### Checklist de GO

1. Identificar loja/UF/regime/atividade e fechar emissor, documentos/cancelamento/contingência e custódia; roteiro externo validado, com divergências/retry demonstrados.
2. Aceitar formalmente contrato, limites, exceção local ou arquitetura alternativa, regra de caixa, desconto/negativo, restituição/crédito e metas de recuperação; vigência/responsáveis.
3. Completar/homologar comandos P0 habilitados e invariantes da seção 11, sem gerar nova identidade após erro; nenhum efeito parcial na falha.
4. Vendedor executar jornada inteira com dados mínimos; negar acesso/ação indevidos, outro tenant/Unit, contexto revogado, custo/financeiro/exports administrativos e consultas por ID fora da visibilidade.
5. Caixa aberto para novas vendas; retry válido após fechamento preserva resultado; pagamentos mistos/troco/refunds/saldo físico e externos conciliados; gestor fecha com divergência explícita.
6. Catálogo/SKU/variante/aliases e estoque inicial conferidos; compra/entrada/AP únicas; inventário/ajuste/devolução comprovados no recorte; nenhuma importação operacional nesta homologação.
7. Documento externo ligado à venda e eventos posteriores; restituições pendentes/confirmadas distinguíveis e limitadas; não dinheiro não tratado como estorno automático.
8. Hardware escolhido e carga representativa medidos; release/version/schema e recuperação compatíveis; cópia externa/restore/reabertura/reconciliação atendem metas aceitas.
9. Operadores treinados, procedimento de incidente/suporte disponível, ensaio isolado registrado; aprovação específica de implantação real posterior. Não usar base da loja como fixture.

**NO-GO ou pausa imediata:** P0 habilitado sem intenção obrigatória/prova suficiente; pagamento/restauração duplicados ou desconhecidos; perfil exigindo financeiro completo para vender; emissão/reconciliação sem rota válida; pedido de LAN/produção por remoção de guardas; saldo/autor inventados; recuperar sem backup válido; persistência/audit/tenant divergentes; necessidade cotidiana de burlar proibição de desconto/estoque; metas de recuperação não comprovadas; escopo crescendo sem revisão. Checklist ainda não executado: **estado atual NO-GO**, não defeito corrigido nesta rodada.

## 15. Roadmap revisado RETAIL-002+

O antigo RETAIL-002 não foi aceito como pacote único. A decomposição abaixo segue os contratos reais; pode haver checkpoints/revisões separados. Cada código/teste/migration exige solicitação própria e TDD pertinente. Não preparar implantação automaticamente após aprovar este documento.

| Incremento proposto | Escopo fechado / áreas afetadas | Dependências, valor e esforço/risco | Aceite proposto |
| --- | --- | --- | --- |
| **RETAIL-002A — Intenção e replay do caixa** | Exatamente open/supply/withdraw/refund/close em cash.js, transporte e consumidores cash-ui; testes de caixa/API/tenant/rollback | Contratos/inventário 001 revisados; refund preserva regra atual até 002E. Impacto ALTO; esforço MÉDIO; risco ALTO | Identidade obrigatória, prova contextual/ator, retorno único igual/alterado recusado; open/close recuperáveis; saldo/audit únicos; sem alterar política financeira por arrasto |
| **RETAIL-002B — Recebimento direto e despesa** | `/api/sales/receive` e `/api/expenses`; payments/domain, consumidores, testes | 002A quando vínculo de caixa; impacto ALTO; esforço MÉDIO; risco ALTO. AP/accounts protegidos ficam fora do endurecimento automático | Parcial repetido não duplica receipt; despesa não duplica saída; mesmo contexto/conteúdo retorna original; expectativas/limites/autoridade preservados |
| **RETAIL-002C — Entrada manual e recebimento de compra** | `/api/stock` e `/api/purchases/receive`; server.change/purchases, consumidores stock/purchases, testes | Catálogo/fornecedor/compra válidos; impacto ALTO; esforço MÉDIO; risco ALTO | Chave obrigatória/resultado único; versão e saldo restante preservados; original sem key não inventa prova; retry não “atualiza versão e tenta de novo” sozinho |
| **RETAIL-002D — Intenção e recuperação de cancelamento** | Exatamente `/api/sales/cancel` e `/api/expenses/cancel`; handlers/consumidores/testes, sem mudar efeito financeiro por arrasto | 002A/B/C; preservar cancelledAt, devoluções prévias, crédito e despesa vinculada à AP. Impacto ALTO; esforço MÉDIO; risco ALTO | Cancelamento reconhecível após resposta perdida, sem segunda reposição/crédito ou evento; ator/contexto/alteração negados; não chamar cancelamento de despesa de dinheiro recuperado |
| **RETAIL-002E — Restituições e reversões do piloto** | Desenho específico e evolução delimitada de cash refund/returns refund/crédito, confirmação externa e correção financeira vinculada necessária ao recorte | Política por meio/alocação aceita; 002A–D e rota fiscal. Impacto ALTO; esforço ALTO; risco ALTO. Revisar desenho e subdividir por caso/meio antes de autorizar código se necessário | Pendente/confirmada verdadeiro, conservação e origem; nenhuma segunda entrega de dinheiro/crédito nem estorno fiscal/bancário fictício; despesa/AP não apagadas para fechar saldo |
| **RETAIL-003A — Perfil, balcão e caixa obrigatório** | DTO/authorization/commercial-write, UI legado, consultas/reimpressão e fluxo de caixa | 002A–E; política A/caixa aceita; impacto ALTO; esforço MÉDIO/ALTO; risco ALTO | Vendedor restrito conclui venda/misto/retry sem snapshot amplo, com caixa e desconto zero; dados/ações proibidos negados; outra Unit/ator testados |
| **RETAIL-003B — Catálogo/SKU e preparação do saldo** | Cadastro comercial/famílias/aliases/onboarding/inventário; UI reaproveitada | Código gerado/namespace aprovados; impacto ALTO; esforço MÉDIO; risco MÉDIO | SKU estável/único por variante; carga/cadastro viável; saldo inicial e preço/custo conhecido conferidos; sem imagens/React obrigatório |
| **RETAIL-004 — Rota externa fiscal reconciliada** | Procedimento/emissor/registro controlado e documentos, sem motor próprio | UF/regime/rota validados; C3 só se dependência provada; impacto ALTO; esforço MÉDIO externo; risco ALTO | Venda/documento/eventos/restituição rastreáveis; falha/consulta/contingência sem duplicação; gate antes de venda real |
| **RETAIL-005 — Entrega e homologação recuperável** | Deployment revisado, release/atualização assistida, hardware/carga e recovery/runbook | Todos os gates relevantes, exceção/produção e RPO/RTO aceitos; impacto ALTO; esforço MÉDIO/ALTO; risco ALTO | Jornada/falhas/revogações/restore e reconciliação ensaiados isoladamente; treinamento/limites/suporte; solicitar autorização de implantação |

Contratos de desconto B/C, negativo com ocorrência, offline formal, TEF e C3 completo não entram automaticamente nessa lista. Preparar validação externa fiscal/hardware pode ocorrer documentalmente antes, mas nenhum gate fiscal/recovery fica para depois do primeiro comércio real.

**Depois do piloto:** Financeiro Básico independente/DRE por fatos, onboarding/produção/suporte comerciais repetíveis e demais gaps de RETAIL-000 continuam propostas para futura revisão. A exceção local/estrita de piloto não se transfere a uma loja comum pagante. Não iniciar Fase D por mencionar contrato/acesso nessa transição.

## 16. Decisões para revisão e limites da entrega

Permanecem a definir: loja/UF/regime/rota fiscal e responsáveis; controles/recursos do deployment excepcional; vigência concreta do piloto; alocação de restituição mista/crédito; formato/namespace de SKU; recursos/custódia para os alvos de recuperação; provas GO e autorização de implantação. Caixa obrigatório, desconto ZERO, exceção temporária de negativo, estratégia fiscal/externa, deployment excepcional e alvos iniciais de recuperação já receberam o aceite limitado acima. Somente 002A foi autorizado como próximo código; demais incrementos continuam propostas.

Fontes adicionais: [API](../../atual/API.md), [DATABASE](../../atual/DATABASE.md), [runbook V1.2](../../atual/OPERATIONS_V1_2.md), [ORG-002](../fase-c/ORG_002_EXECUTABLE_DESIGN.md), [IDP-001](../fase-b/IDP_001_REPORT.md), [BRAND-001](../branding/BRAND_001_REPORT.md) e código/testes citados. Testes existentes foram lidos; não houve nova execução de teste, build, servidor, navegador, restore ou hardware. Fontes fiscais oficiais foram consultadas para requisitos condicionais, sem definir enquadramento da loja.

Esta etapa de aprovação/checkpoint é somente documental: este contrato e os dois marcadores de índice. RETAIL-000 permanece intacto após seu checkpoint. Migrations 001–012, código, testes e dependências permanecem intactos; nenhuma 013, dado/fixture/screenshot/segredo ou artefato operacional criado. Checkpoint de RETAIL-001 autorizado sem push; depois de árvore limpa, somente 002A pode começar, nos limites do aceite posterior. Sem implantação, C3, Fase D ou BRAND-002.
