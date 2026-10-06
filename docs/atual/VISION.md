# Visão do produto

Referência vigente em **05/10/2026**: [Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md). Este é um resumo derivado; a sequência de construção é [A–G](ROADMAP.md). Decisões conceituais não representam capacidades prontas.

## PLANEJADO

Duas áreas oficiais acrescentadas pelo Murilo em 02/10/2026: **[Printing & Devices](PRINTING_AND_DEVICES.md)**, para impressão/periféricos por serviço central e adapters; e **[Commerce Hub / Omnichannel](COMMERCE_HUB.md)**, para loja física, sites e marketplaces sobre o mesmo núcleo comercial/disponibilidade. Fiscal permanece separado da impressão; storefront próprio futuro usa o mesmo Core. A evolução técnica atual mantém prioridade. [Fonte integral](../briefings/PRINTING_COMMERCE_SOURCE.md).

Uma plataforma empresarial com núcleo comum e módulos por necessidade, atendendo progressivamente empresas de diferentes portes e setores. O valor é controlar e entender a operação, com relações consistentes entre registros, históricos, indicadores e decisões. A expansão não exige implementar todos os segmentos agora.

O Core obrigatório contém infraestrutura transversal, Conta/Organização → Entidade Legal/Titular PF/PJ → Unidade e base comum de Pessoas/Organizações com múltiplos papéis. Financeiro Básico é sempre presente e independente da contratação de Produtos/Vendas/Estoque. Produtos, Precificação, Vendas/PDV, Estoque, Compras, Serviços/OS, CRM, Fiscal, Produção e Logística são módulos opcionais; especializações, presets e pacotes usam a mesma plataforma. [Mapa modular](MODULES.md).

BI interno é add-on. Inteligência de Mercado B2B e Gestão Financeira Pessoal são produtos independentes futuros, com finalidades e governança separadas. Backups não alimentam analytics; nome original e identidade canônica são separados, sem bloquear venda.

| Família de expansão | Exemplos de capacidades futuras |
| --- | --- |
| Varejo, distribuição, construção | Comercial, unidades de venda, logística, reposição, preços e estoque |
| Restaurantes | Mesas, comandas, adicionais, cozinha/KDS, cardápio digital e delivery |
| Salão/barbearia e serviços | Agenda, profissionais, serviços, comissões e execução |
| Logística | Cargas, rotas, motoristas, entregas, ocorrências e custos |
| Oficinas, óticas e manutenção/field service | Ordens de serviço e regras específicas de cada segmento |
| Produção/indústria | Estruturas de produto, consumo, produção e custos |
| Imobiliário, fundos e patrimônio | Imóveis, contratos, receitas, despesas, ocupação e análises próprias |
| CRM, contratos e ativos | Relacionamento, recorrência contratual e patrimônio empresarial |
| Canais e ecossistema | E-commerce, marketplaces, franquias, mobile e portais de cliente/contador |

Essas famílias representam direção de longo prazo, não módulos existentes. Primeiro nicho e regras específicas permanecem **A DEFINIR**.

## Experiência esperada

Aplicativo Windows em cada computador do cliente, conectado ao servidor central; interfaces web/mobile conforme o uso. Operação por teclado e código de barras com caminho manual equivalente. Telas claras, cadastros rápidos, mensagens úteis, permissões coerentes e relatórios com comparação e significado, além de totais.

Cloud é a autoridade definitiva. A continuidade offline usa autorização assinada/temporária por estação e capacidades; fatos válidos são preservados e reconciliados, registros editáveis usam versão/conflito e configuração crítica é cloud-only. O Agente Local coordena a unidade, sem virar servidor principal do ERP. Dispositivos têm identidade própria; clientes não acessam banco cloud. Updater/release são assinados e aplicados em ponto seguro. Prazo e especificações continuam abertos.

## Segurança e modelo comercial

Identidade real, controle de acesso por ação, aprovação excepcional, rastreabilidade e proteção dos dados são parte do produto. Planos, módulos, preços e limites serão configuráveis; esconder botão não restringe uso. Cobrança, fiscalização de assinatura e política offline pertencem ao desenho futuro, com autoridade no servidor.

BI, automações e IA entram progressivamente, respeitando permissões, origem dos dados, possibilidade de auditoria e revisão das ações relevantes. IA não deve atravessar empresas ou executar decisões sensíveis sem o controle adequado.

## ATUAL e limite desta etapa

Em **03/10/2026**, a Fundação V1.2 está fechada localmente, homologada **B/610**, migrations 001–010, versão **1.2.0-foundation.1**: seis agregados SQL, acesso real, manutenção de senha/sessões e backup/retenção/restore sintético isolado. [Estado e limites](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md). A criação de papéis/memória foi a etapa documental histórica de 01/10; o fechamento local aceita as condições B e preserva as capacidades futuras, sem iniciar nova implementação. Homologação local não comprova requisitos SaaS/fiscais/setoriais/produção. Ver [módulos](MODULES.md) e [roadmap](ROADMAP.md).

## Estado V1.3 e revisão vigente — 05/10/2026

React/TypeScript/Vite já possuem skeleton, integração, HTTP, sessão/login/contexto e Design System. Módulos comerciais React não foram entregues. A homologação B/610 acima é histórica da V1.2. [Estado real](PROJECT_MASTER.md); [auditoria](../auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md). A próxima proposta de código é o replay legado, sem implementar nesta rodada.
