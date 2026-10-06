# Printing & Devices

**Referência vigente — 05/10/2026:** [Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md), especialmente §§2–4, 10–17, e [plano A–G](ROADMAP.md). Os contratos futuros aqui descritos são subordinados ao mestre; nenhum adapter/dispositivo/Agente ou entitlement foi implementado. Menções anteriores a empresa/Edge precisam de mapeamento formal tenant/entidade/unidade/Agente antes de schema ou contrato externo; não equiparar automaticamente `company_id` ao novo tenant. Fiscal é independente e transversal na experiência; impressão não emite. Cliente/Agente não confiáveis, identidade revogável, autorização offline assinada, cloud-only crítico, APIs sem acesso direto ao banco e efeitos externos idempotentes. Pacotes/canais não criam ERPs separados; credenciais centrais não vão ao cliente. Especificação e revisão precedem a implementação.

Diretriz de produto adotada em **02/10/2026**, inteiramente **PLANEJADA**. Fonte: [pedido integral do Murilo, itens 1–10 e 39](../briefings/PRINTING_COMMERCE_SOURCE.md). Este documento especifica evolução; não declara equipamentos homologados.

## ATUAL e objetivo

A interface imprime documentos internos com `window.print()`: comprovante em [store.js](../../public/store.js), orçamento em [quotes-ui.js](../../public/quotes-ui.js), relatório de caixa em [cash-ui.js](../../public/cash-ui.js) e documentos em [workflows-ui.js](../../public/workflows-ui.js). O leitor como teclado e a digitação manual já existem. Não há Print Service, filas duráveis, PDF dedicado, drivers especializados, balanças ou emissão fiscal.

Objetivo futuro: compatibilidade ampla, direta ou indireta, com equipamentos comerciais usados no Brasil, mediante drivers e adapters, sem código de fabricante espalhado pelo Core. A compatibilidade depende do modelo, driver, protocolo, sistema e testes reais; não é garantia universal.

## Limites e fluxo PLANEJADOS

```text
Venda / Compras / Estoque / Logística / Commerce Hub
                  ↓ solicitação de documento
              Print Service
                  ↓ destino autorizado e configurado
       renderizador + adapter de impressão
                  ↓ Desktop / Edge, quando houver hardware local
           driver / protocolo → equipamento
```

Printing & Devices agrupa Windows Print, Thermal/Receipt, Labels, Documents/A4, Fiscal representation, Scales e Device adapters. O Print Service coordena impressão; leitura de peso/código usa contratos próprios de dispositivos, sem transformar toda leitura em print job. Módulos solicitam documentos ou leituras normalizadas; não escolhem comandos de fabricante diretamente.

Print Service administrará jobs, filas, prioridade, destino, tentativas com backoff e limite, falhas, cancelamento quando possível, reimpressão e auditoria. Job deve identificar empresa, unidade, solicitante, documento/versão, modelo/versão, destino, quantidade de cópias, chave de operação e correlação. Conteúdo/versionamento histórico será preservado: reimprimir venda antiga não deve substituí-la pelo nome/preço atual do cadastro. Estados detalhados e retenção **A DEFINIR**; distinguir solicitado, aceito pelo spooler e resultado físico conhecido. Aceite do spooler não comprova papel impresso.

A impressão é efeito externo após a confirmação da operação comercial. Falha de hardware não desfaz nem repete venda/recebimento. Publicação durável do trabalho deverá ser coordenada com a transação (por exemplo, outbox local ao monólito, sem escolher infraestrutura agora). Timeout pode representar resultado desconhecido: repetir automaticamente pode produzir cópias extras. Reimpressão explícita terá novo job vinculado ao original, motivo e autorização; nunca novo efeito financeiro/estoque.

## Caminhos de compatibilidade PLANEJADOS

| Caminho | Requisito | Limite |
| --- | --- | --- |
| Windows / driver instalado | Usar destino cadastrado e capacidades do driver; impressoras Windows, A4, térmicas, etiquetas e rede | HP, Epson, Canon, Brother, Elgin, Bematech, Zebra, Argox e TSC são alvos possíveis, não modelos testados |
| Protocolos diretos | Adapters ESC/POS, ZPL, EPL, CPCL e TSPL conforme necessidade comprovada | Variações de firmware/modelo exigem teste; não implementar todos antecipadamente |
| Demais dispositivos | Contratos para balança, leitor e outros periféricos comerciais | Equipamentos fiscais quando aplicáveis dependem do módulo Fiscal e requisitos próprios |

Inventário futuro de equipamentos: modelo, conexão, driver/versão, capacidades, adapter/versão, resultado/data de teste e restrições. Nenhum equipamento passa a constar como testado por estar nesta lista.

## Etiquetas PLANEJADAS

Editor com largura, altura, DPI, margens, gap, orientação, linhas, colunas e quantidade. Modelos salvos/versionados e impressão em lote: 40×25, gôndola, joias, validade e logística são exemplos. Campos previstos: nome, SKU, código de barras, QR Code, preço, preço promocional, peso, unidade, lote, validade, fornecedor, localização, empresa e logo. Campos ausentes não ganham valores inventados; lote/validade dependem dos agregados futuros.

Preview e renderização deverão respeitar tamanho físico e capacidades do destino. Formatos de código, validação, conteúdo do QR, limites de lote e editor visual **A DEFINIR**. Modelos e logos são entradas não confiáveis: não executar scripts ou comandos arbitrários.

## Térmicas e documentos PLANEJADOS

Térmicas: cupom não fiscal, comprovante, pedido, comanda, cozinha, bar, separação, senha e comprovantes internos. Roteamento configurável por empresa/unidade/uso, incluindo Pedido → Caixa / Cozinha / Bar, conforme regra do segmento. Destinos têm jobs e resultados próprios, sem duplicar o pedido.

A4/PDF: orçamento, pedido, contrato, relatório, DRE, inventário, ficha, lista de separação, documentos administrativos e DANFE quando aplicável. Visualização/geração em PDF quando adequada, com acesso e retenção definidos. A existência do formato não cria conteúdo jurídico, DRE ou fiscal ainda não implementado.

## Fiscal separado — regra obrigatória

**Imprimir um documento fiscal não significa emitir um documento fiscal.**

```text
Venda → Módulo Fiscal → autorização fiscal
      → documento/XML autorizado → Print Service → representação física
```

O Fiscal guarda regras, autorização e estado oficial; a impressão consome o documento autorizado no caso aplicável. Falha/reimpressão não emite nem cancela novamente. Contingência, documento aplicável, provedor e homologação **A DEFINIR** no domínio Fiscal.

## Desktop / Edge e segurança PLANEJADOS

Cloud → comando autenticado e limitado → Desktop/Edge → adapter → USB/rede local/hardware. Identidade de dispositivo, empresa/unidade, capacidades, permissão, validade, versão e proteção de replay serão verificadas. Destinos são cadastrados e autorizados; requisições não podem fornecer endereço, caminho ou executável arbitrário.

Edge nunca será executor remoto genérico: sem shell remoto, instalação dinâmica por comando ou proxy irrestrito de rede/arquivo. Segredos de canais comerciais permanecem no backend. Ver [segurança](SECURITY.md) e [Edge](OFFLINE_EDGE.md). Conectividade local é distinta de venda offline autorizada.

## Balanças e quantidades PLANEJADAS

Adapters serial, USB, rede, protocolos de fabricante e códigos de barras de balança conforme demanda, sem fabricante implementado agora. Contrato normalizado de leitura prevê quantidade exata, unidade, origem/equipamento e estado da leitura; estabilidade, tara, validade, parsing de barcode e confirmação comercial **A DEFINIR**. Leitura do equipamento não concede autorização para alterar preço/estoque.

Produto, Compra, Estoque e Venda deverão admitir `0,684 kg`, `1,750 m`, `2,430 m²`, `0,500 L`, produto fracionável, precisão, unidade de compra/venda e conversões por produto. Exemplos de requisitos: caixa de 12 unidades, caixa de piso de 2,43 m², compra de 12 kg e venda de 0,750 kg. Preservar fator/unidades históricos. A representação SQL atual é preparatória; [DATABASE](DATABASE.md#quantidades-e-unidades-de-medida-planejado) explica os limites.

## Entregas futuras e aceite

Escolher primeiro fluxo/equipamento e ambiente Desktop antes do primeiro adapter. Demonstrar preview, destino errado/sem permissão recusado, isolamento de tenant/unidade, falha/timeout, retry limitado, reinício da fila, reimpressão auditada sem nova venda, documento fiscal sem autorização recusado quando exigida, comando/dispositivo revogado ou adulterado recusado. Homologar somente equipamentos realmente exercitados.

**A DEFINIR:** prioridade/primeiros modelos, tecnologia Desktop, protocolos/transportes, capacidades, permissões específicas, estados/retenção dos jobs, tratamento de impressão ambígua, modelos, documentos, regras de balança e offline. Sem migration ou mudança executável nesta tarefa; a impressão atual permanece disponível durante a futura transição.
