# NOVA SESSÃO — RECUPERAR O PROJETO E INCORPORAR DUAS NOVAS DIRETRIZES

Estamos continuando um projeto já existente.

Pasta exclusiva:

`D:\Projeto Sistema Local\`

NÃO assuma contexto de conversas anteriores.

A fonte de verdade é o código atual e a documentação existente no repositório.

Antes de alterar qualquer coisa, leia:

- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/PROJECT_MAP.md`
- `docs/ROADMAP.md`
- `docs/DECISIONS.md`

Depois consulte apenas os documentos adicionais relevantes para esta tarefa.

O estado mais recente conhecido é posterior à Fundação V1, que criou autenticação real, empresas/unidades, RBAC, SQLite transacional, auditoria e testes adicionais.

Primeiro confirme no próprio repositório:

1. versão atual;
2. última etapa concluída;
3. quantidade atual de testes;
4. agregados já normalizados;
5. agregados ainda baseados em snapshots;
6. principais riscos e pendências;
7. próxima etapa atualmente registrada.

Não confie nesses itens apenas porque foram mencionados nesta mensagem. Confirme no projeto.

---

# PARTE A — DUAS NOVAS DIRETRIZES DE PRODUTO

Precisamos incorporar oficialmente à visão do sistema:

1. `Printing & Devices`
2. `Commerce Hub / Omnichannel`

Essas duas áreas fazem parte da visão futura da plataforma.

NÃO interrompa desnecessariamente a etapa técnica atual para implementar tudo agora.

Primeiro:

- registre requisitos;
- revise impactos na arquitetura;
- atualize documentação;
- garanta que decisões atuais não criem becos sem saída.

---

# 1. PRINTING & DEVICES

A plataforma deverá possuir futuramente um subsistema centralizado de impressão e periféricos.

Objetivo:

ser compatível, direta ou indiretamente, com a maior parte das impressoras e equipamentos normalmente utilizados por empresas brasileiras.

Planejar suporte para:

- impressoras térmicas;
- impressoras de etiquetas;
- impressoras A4;
- impressoras de rede;
- impressoras instaladas no Windows;
- equipamentos fiscais quando aplicável;
- impressoras não fiscais;
- balanças;
- leitores de código de barras;
- outros periféricos comerciais.

Não implementar suporte individual acoplado ao core para cada fabricante.

Criar arquitetura baseada em abstrações e adapters.

Conceito:

```text
PRINTING & DEVICES
│
├── Windows Print
├── Thermal / Receipt
├── Labels
├── Documents / A4
├── Fiscal representation
├── Scales
└── Device adapters
```

---

# 2. PRINT SERVICE

Os módulos do sistema não deverão falar diretamente com modelos específicos de impressora.

Exemplo:

```text
Venda
↓
Print Service
↓
Destino configurado
↓
Driver / protocolo
↓
Impressora
```

O Print Service deverá futuramente administrar:

- jobs;
- filas;
- retries;
- erros;
- reimpressão;
- prioridade;
- impressora de destino;
- auditoria.

---

# 3. COMPATIBILIDADE DE IMPRESSÃO

Devemos possuir dois caminhos principais.

## A. Driver/sistema operacional

```text
Sistema
↓
Windows
↓
Driver instalado
↓
Impressora
```

Esse caminho permitirá compatibilidade ampla com:

- HP;
- Epson;
- Canon;
- Brother;
- Elgin;
- Bematech;
- Zebra;
- Argox;
- TSC;
- e outros fabricantes.

Não declarar um equipamento como testado sem realmente testar.

## B. Protocolos diretos

Planejar adapters para padrões relevantes, conforme necessidade:

```text
ESC/POS
ZPL
EPL
CPCL
TSPL
```

Não implementar todos agora.

---

# 4. ETIQUETAS

Precisamos futuramente de editor de etiquetas.

Permitir configurar:

- largura;
- altura;
- DPI;
- margens;
- gap;
- orientação;
- linhas;
- colunas;
- quantidade.

Campos possíveis:

- nome;
- SKU;
- código de barras;
- QR Code;
- preço;
- preço promocional;
- peso;
- unidade;
- lote;
- validade;
- fornecedor;
- localização;
- empresa;
- logo.

Permitir modelos salvos:

```text
Etiqueta 40x25
Etiqueta de gôndola
Etiqueta de joias
Etiqueta de validade
Etiqueta logística
```

E impressão em lote.

---

# 5. TÉRMICAS

Suportar futuramente:

- cupom não fiscal;
- comprovante;
- pedido;
- comanda;
- cozinha;
- bar;
- separação;
- senha;
- comprovantes internos.

Restaurantes poderão configurar destinos diferentes.

Exemplo:

```text
Pedido
├── Caixa
├── Cozinha
└── Bar
```

---

# 6. A4 / PDF

Suportar:

- orçamento;
- pedido;
- contrato;
- relatório;
- DRE;
- inventário;
- ficha;
- lista de separação;
- documentos administrativos;
- DANFE quando aplicável.

Documentos deverão poder ser visualizados/gerados em PDF quando adequado.

---

# 7. FISCAL É DIFERENTE DE IMPRESSÃO

Regra obrigatória:

**imprimir um documento fiscal não significa emitir um documento fiscal.**

Fluxo correto:

```text
Venda
↓
Módulo Fiscal
↓
Autorização fiscal
↓
Documento/XML autorizado
↓
Print Service
↓
Representação física
```

O módulo Fiscal continua sendo separado do Print Service.

---

# 8. EDGE E HARDWARE

A futura comunicação com USB/rede local deverá ocorrer pelo Desktop/Edge.

```text
Cloud
↓
comando autenticado
↓
Desktop / Edge
↓
Printing & Devices
↓
hardware
```

Nunca transformar o Edge em executor remoto genérico.

Comandos permitidos devem ser limitados e autenticados.

---

# 9. PRODUTOS PESÁVEIS E UNIDADES

Ao normalizar Produto, Compra, Estoque e Venda:

NÃO assumir que toda quantidade é inteira.

Precisamos suportar futuramente:

```text
0,684 kg
1,750 m
2,430 m²
0,500 L
```

Utilizar precisão numérica adequada.

Planejar:

- unidade de medida;
- produto fracionável;
- precisão;
- unidade de compra;
- unidade de venda;
- conversões por produto.

Exemplos:

```text
1 caixa = 12 unidades
```

ou:

```text
1 caixa de piso = 2,43 m²
```

ou:

```text
Compra: 12 kg
Venda: 0,750 kg
```

---

# 10. BALANÇAS

Planejar adapters futuros para:

- serial;
- USB;
- rede;
- protocolos de fabricantes;
- códigos de barras gerados por balança.

Não implementar fabricante específico agora sem necessidade.

---

# PARTE B — COMMERCE HUB / OMNICHANNEL

Outra parte central da plataforma será integrar vendas online ao mesmo núcleo comercial.

Uma empresa poderá vender simultaneamente por:

```text
Loja física
Site próprio
WooCommerce
Loja virtual de outro provedor
Mercado Livre
Shopee
Outros marketplaces
WhatsApp
API própria
```

Todos esses canais devem conversar com nosso sistema.

---

# 11. PRINCÍPIO CENTRAL DO OMNICHANNEL

Não criar lógica isolada como:

```text
estoque_mercadolivre
estoque_shopee
estoque_site
estoque_loja
```

sem uma fonte central coerente.

O sistema deverá possuir uma visão central de disponibilidade.

Conceitualmente:

```text
                 NOSSO SISTEMA
                      │
                  ESTOQUE
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
     Site        Mercado Livre     Shopee
       ↓              ↓              ↓
     Venda          Venda          Venda
       └──────────────┼──────────────┘
                      ↓
               PEDIDOS CENTRAIS
```

Nosso sistema deverá ser, sempre que possível, a fonte central de verdade do estoque operacional.

---

# 12. COMMERCE HUB

Planejar um módulo:

```text
Commerce Hub
```

responsável pela ligação entre o Core e canais externos.

Estrutura conceitual:

```text
commerce/
├── channels/
│   ├── woocommerce/
│   ├── mercadolivre/
│   ├── shopee/
│   ├── custom-site/
│   └── future/
│
├── catalog/
├── listings/
├── orders/
├── inventory/
├── pricing/
├── fulfillment/
└── reconciliation/
```

Não precisa seguir literalmente essa estrutura de pastas.

O princípio arquitetural importa mais.

---

# 13. ADAPTER POR CANAL

Cada canal deverá possuir adapter próprio.

Não espalhar regras de Mercado Livre, Shopee ou WooCommerce no domínio central.

Fluxo:

```text
Pedido Mercado Livre
↓
Adapter Mercado Livre
↓
Pedido interno padronizado
```

Outro:

```text
Pedido WooCommerce
↓
Adapter WooCommerce
↓
Pedido interno padronizado
```

O Core trabalha com nosso modelo.

---

# 14. SITE PRÓPRIO DO CLIENTE

O cliente poderá possuir:

- WooCommerce;
- outra plataforma;
- site customizado;
- nossa futura loja online.

Para plataformas suportadas, utilizar integrações próprias.

Para site customizado, futuramente disponibilizar:

```text
API
+
Webhooks
```

com autenticação, scopes, rate limits e auditoria.

---

# 15. WOOCommerce

Planejar integração para:

- produtos;
- variações;
- pedidos;
- clientes quando permitido/necessário;
- estoque;
- preços;
- status;
- webhooks.

Antes de implementar, consultar a documentação oficial vigente.

---

# 16. MERCADO LIVRE

Planejar adapter para:

- anúncios;
- variações;
- pedidos;
- estoque;
- preços;
- pagamentos/status relevantes;
- envios;
- cancelamentos;
- notificações.

Antes de implementar, consultar a documentação oficial vigente e requisitos de aplicação/homologação.

---

# 17. SHOPEE

Planejar adapter específico para Shopee.

Antes da implementação:

- consultar documentação oficial vigente;
- verificar requisitos para parceiros/aplicações;
- verificar APIs disponíveis;
- verificar autenticação;
- verificar webhooks/notificações;
- verificar políticas brasileiras vigentes.

Não inventar endpoints ou contratos agora.

---

# 18. MAPEAMENTO DE PRODUTO ↔ ANÚNCIO

Um produto interno poderá estar publicado em vários canais.

Exemplo:

```text
Produto interno:
SKU CAM-001

├── Site
│   ID externo 827
│
├── Mercado Livre
│   anúncio MLB...
│
└── Shopee
    item ...
```

Criar futuramente entidade de vínculo de canal.

Não usar somente nome para relacionar produtos.

Preferir IDs e SKUs corretamente mapeados.

---

# 19. VARIAÇÕES

A integração deverá suportar:

```text
Produto
├── P
├── M
├── G
└── GG
```

ou:

```text
Anel
├── 16
├── 18
└── 20
```

Cada variação poderá possuir identificadores externos diferentes.

---

# 20. ESTOQUE CENTRAL

Exemplo:

```text
Estoque físico:
10

Reserva:
2

Disponível:
8
```

O Commerce Hub deverá trabalhar com:

```text
estoque disponível
```

não necessariamente apenas estoque físico.

Precisaremos futuramente definir:

```text
available_to_sell
```

de forma consistente.

---

# 21. RESERVAS

Uma venda online poderá reservar estoque antes de determinadas etapas finais, conforme regra de cada canal.

Não descontar estoque de maneira ingênua sem entender:

- pedido;
- pagamento;
- cancelamento;
- expiração;
- fulfillment.

Cada adapter traduzirá o comportamento do canal para nosso modelo.

---

# 22. BUFFER DE ESTOQUE

Empresas poderão futuramente configurar margem de segurança.

Exemplo:

```text
Estoque real: 10
Buffer: 2
Disponível online: 8
```

Talvez por canal.

Regras finais A DEFINIR.

---

# 23. PREÇO POR CANAL

Permitir preços distintos.

Exemplo:

```text
Produto X

Loja física        R$100
Site               R$100
Mercado Livre      R$115
Shopee             R$110
```

Sem duplicar o cadastro do produto.

Criar futuramente política de preço por canal.

---

# 24. PROMOÇÕES

Promoções podem ser:

- centrais;
- específicas de canal;
- externas ao nosso sistema.

Não assumir que nosso sistema sempre controla toda promoção.

Registrar origem quando necessário.

---

# 25. PEDIDOS

Todos os pedidos online deverão entrar em uma central.

Exemplo:

```text
PEDIDO #4830

Origem:
Mercado Livre

Cliente:
...

Itens:
...

Pagamento:
...

Entrega:
...

Status:
...
```

O usuário deve conseguir filtrar:

```text
Todos
Site
Mercado Livre
Shopee
Balcão
WhatsApp
```

---

# 26. IDs EXTERNOS

Nunca perder:

- ID do pedido externo;
- ID do anúncio;
- ID da transação;
- ID de envio;
- outros identificadores relevantes.

Esses IDs serão essenciais para reconciliação e suporte.

---

# 27. IDEMPOTÊNCIA

Receber duas vezes a mesma notificação não poderá criar:

```text
2 pedidos
```

para a mesma venda externa.

Integrações deverão ser idempotentes.

---

# 28. WEBHOOKS + RECONCILIAÇÃO

Quando o canal oferecer notificações/webhooks:

utilizá-los para resposta rápida.

Mas não depender exclusivamente deles.

Planejar também reconciliação periódica.

Exemplo:

```text
Webhook
↓
atualização rápida

+

Job periódico
↓
confere estado
↓
corrige divergências
```

Isso evita perder dados caso alguma notificação falhe.

---

# 29. RETRIES

Falha temporária no marketplace não pode quebrar a venda local.

Usar:

- fila;
- retry;
- backoff;
- status de sincronização;
- dead-letter/revisão quando necessário.

Sem loops infinitos.

---

# 30. CONFLITOS

Exemplo:

```text
Produto:
última unidade

Site vende
e
loja física vende
quase simultaneamente
```

Precisamos de regras consistentes.

A futura arquitetura cloud será fundamental para reduzir esse risco.

Operação offline adicionará casos específicos.

Regras finais serão definidas por domínio.

---

# 31. STATUS DE SINCRONIZAÇÃO

O usuário poderá futuramente visualizar:

```text
Produto X

Site               ✓ Sincronizado
Mercado Livre      ✓ Sincronizado
Shopee             ⚠ Pendente
```

E:

```text
Última sincronização:
10:42
```

---

# 32. ERROS DE CANAL

Exemplo:

```text
Mercado Livre recusou atualização.

Motivo:
...

[TENTAR NOVAMENTE]
```

Nunca esconder silenciosamente falha de sincronização.

---

# 33. LOG DE INTEGRAÇÕES

Registrar:

- canal;
- evento;
- entidade;
- tentativa;
- resultado;
- horário;
- erro;
- correlation ID.

Nunca registrar tokens/secrets completos.

---

# 34. SEGURANÇA

Credenciais de marketplaces e sites:

NUNCA no frontend.

Armazenar de forma segura no backend/secret storage.

Scopes mínimos necessários.

Tokens renovados corretamente.

Webhooks validados conforme mecanismo do fornecedor.

---

# 35. MULTIEMPRESA

Credenciais e integrações pertencem ao tenant correto.

Exemplo:

```text
Empresa A
→ conta Mercado Livre A

Empresa B
→ conta Mercado Livre B
```

Nunca permitir cruzamento.

---

# 36. MULTICONTAS

Uma mesma empresa poderá futuramente possuir:

```text
Conta Mercado Livre 1
Conta Mercado Livre 2
Loja WooCommerce A
Loja WooCommerce B
```

A modelagem não deve impedir isso.

---

# 37. MULTIUNIDADE

Será necessário definir como cada canal consome estoque.

Exemplo:

```text
Site
→ CD principal

Mercado Livre
→ Unidade 2

Shopee
→ estoque agregado
```

Essa regra deverá ser configurável futuramente.

Não assumir uma única unidade para sempre.

---

# 38. FULFILLMENT / EXPEDIÇÃO

Pedidos online deverão futuramente conversar com:

```text
Separação
Picking
Packing
Expedição
Transportadora
Etiqueta de envio
Rastreamento
```

Isso se conecta diretamente ao módulo Logística.

---

# 39. PRINTING + COMMERCE

Os dois novos módulos se relacionam.

Exemplo:

```text
Pedido Mercado Livre
↓
Commerce Hub
↓
Separação
↓
Printing & Devices
↓
Etiqueta / lista / documento
```

Não duplicar motores de impressão dentro de marketplaces.

---

# 40. DASHBOARD OMNICHANNEL

Futuramente:

```text
Vendas totais      R$ 200.000

Loja física        R$ 90.000
Site               R$ 50.000
Mercado Livre      R$ 40.000
Shopee             R$ 20.000
```

Também:

- pedidos;
- ticket médio;
- margem;
- taxas;
- cancelamentos;
- canal;
- produto;
- unidade;
- período.

---

# 41. TAXAS DE MARKETPLACE

Precisamos futuramente registrar taxas/custos de cada canal para medir resultado real.

Exemplo:

```text
Venda                R$100
Comissão marketplace -R$16
Frete subsidiado      -R$5
Outros custos         -R$2

Receita líquida canal R$77
```

Isso deverá alimentar análise financeira/DRE corretamente conforme classificação definida.

---

# 42. DRE POR CANAL

A arquitetura deverá futuramente permitir análise gerencial como:

```text
DRE total
DRE loja física
DRE e-commerce
DRE Mercado Livre
DRE Shopee
```

quando os dados permitirem.

Não duplicar contabilidade.

Utilizar dimensões/centros/classificações adequadas.

---

# 43. DEVOLUÇÕES E CANCELAMENTOS

Cancelamento externo deverá refletir corretamente:

```text
Pedido
Estoque
Financeiro
Taxas
Logística
```

sem gerar efeitos duplicados.

---

# 44. FONTE DE VERDADE

Regra fundamental:

Cada tipo de dado deve ter uma fonte de autoridade clara.

Exemplo possível:

```text
Produto mestre:
nosso sistema

Estoque:
nosso sistema

Pedido criado:
canal externo

Status de envio:
canal/logística

Resultado financeiro:
nosso sistema
```

A autoridade poderá variar conforme integração.

Documentar por adapter.

---

# 45. NÃO CRIAR INTEGRAÇÃO PONTO A PONTO PELO CORE

Evitar:

```text
Produto → código Mercado Livre
Produto → código Shopee
Produto → código WooCommerce
```

espalhado pelo domínio.

Preferir:

```text
Produto
↓
Channel Listing / Mapping
↓
Adapter
```

---

# 46. API PARA SITE CUSTOMIZADO

No futuro, empresas poderão integrar sites próprios utilizando nossa API.

Planejar:

- OAuth/API credentials;
- scopes;
- rate limits;
- webhooks;
- documentação;
- auditoria;
- versionamento.

Não implementar agora sem necessidade.

---

# 47. FUTURO E-COMMERCE PRÓPRIO

A plataforma poderá futuramente oferecer também um storefront próprio.

Se isso acontecer, ele deverá utilizar o mesmo Commerce Hub/Core.

Não criar outro estoque separado.

---

# 48. NOVOS MÓDULOS PLANEJADOS

Adicionar oficialmente:

```text
Printing & Devices
Commerce Hub / Omnichannel
```

---

# 49. DOCUMENTAÇÃO

Atualizar conforme aplicável:

```text
PROJECT_MASTER.md
ARCHITECTURE.md
MODULES.md
ROADMAP.md
INTEGRATIONS.md
DATABASE.md
SECURITY.md
OFFLINE_EDGE.md
```

Pode criar, se adequado:

```text
PRINTING_AND_DEVICES.md
COMMERCE_HUB.md
```

---

# 50. PRIORIDADE

A etapa atual do desenvolvimento continua tendo prioridade.

Nesta tarefa:

1. recupere o contexto;
2. confirme estado real;
3. incorpore essas duas diretrizes à documentação;
4. revise se decisões atuais de banco conflitam com elas;
5. faça apenas ajustes estruturais pequenos se forem necessários para evitar retrabalho imediato;
6. não implemente ainda marketplaces, drivers ou Edge completo.

---

# RELATÓRIO FINAL DESTA TAREFA

Depois de terminar, responda de forma objetiva:

1. versão atual encontrada;
2. última etapa concluída;
3. estado dos testes;
4. arquivos de documentação atualizados/criados;
5. se a modelagem atual suporta quantidades decimais/unidades futuras;
6. se existe algum conflito arquitetural com Printing & Devices;
7. se existe algum conflito arquitetural com Commerce Hub;
8. decisões tomadas;
9. itens que continuam A DEFINIR;
10. próxima tarefa recomendada.

Não comece uma grande implementação além disso sem necessidade.