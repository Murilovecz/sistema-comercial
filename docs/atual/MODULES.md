# Módulos e capacidades

Reconciliado em **05/10/2026** com o [Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md), §§3–5, 10, 13–14. O mapa alvo abaixo é **APROVADO COMO DIREÇÃO**, não implementação de entitlement. **ATUAL** significa recurso local da Fundação V1.2 fechada localmente, **B/610**, migrations 001–010, versão **1.2.0-foundation.1**; fechamento local não certifica produção cloud. [Estado/fontes](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md). Cobrança, planos e integrações continuam PLANEJADOS.

## ATUAL — comercial preservado da V1.2 e base React V1.3

| Área | Recursos existentes | Limites relevantes |
| --- | --- | --- |
| Base React | Skeleton/roteamento, integração SPA, HTTP, sessão/contexto, login/logout, troca de contexto e Design System mínimo | Sem página comercial Produtos; migração comercial condicionada à fase G do roadmap |
| Acesso e empresa | Argon2id, sessões, empresas/unidades/RBAC, troca/reset administrativo, revogação/manutenção e auditoria | Local; sem e-mail/MFA/dispositivo confiável/produção remota; company comercial não concede acesso |
| Dashboard e consultas | Visão geral, consultas, filtros, relatórios e análises gerenciais | Escopo local; indicadores dependem da base disponível |
| Produtos/catálogo | Cadastro/edição, desativação, códigos/aliases, embalagens, famílias/atributos | Quick views e consulta paginada SQL; custo somente da fonte recebida e com direito financeiro; não presumir produto/serviço separado |
| Clientes | Cadastro/edição, situação, detalhes e histórico vinculado | Registros antigos sem cliente ID não se vinculam por nome automaticamente |
| Fornecedores | Cadastro, edição, situação e relações com compras | Cadastro não é conexão com sistema do fornecedor |
| Compras | Pedido, confirmação, recebimentos parciais, custo, fechamento/reprogramação; SQL/FKs de compra/recibos | Custos/consultas operacionais/comandos ainda usam estado completo; sem API proporcional de todo módulo ou custo médio definido |
| Controle de compras | Conferências, alterações, ocorrências e cotações manuais | Sem importação fiscal/API de fornecedor |
| Vendas/atendimento | Carrinho/códigos/embalagens/pagamentos; cabeçalho/filhos e lista/detalhe/busca/filtros/paginação SQL sem payload integral | Escritas ainda materializam snapshot; exceção por senha/direito/motivo, produto permanece inativo; orçamentos/reservas sem liberação automática |
| Orçamentos | Preparação, edição, preços, cancelamento e conversão em venda | Sem portal externo ou assinatura eletrônica |
| Estoque | Entradas, histórico, inventário, reservas, posições/transferências e quarentena; executor verificado nas novas ações | Saldos/movimentos SQL; receber compra navega ao fluxo existente; aprovação da venda inativa fica explícita, sem fabricar autoria histórica |
| Devoluções | Rotinas comerciais e devolução ao fornecedor com vínculos/histórico | Movimento físico, crédito e dinheiro devem ser analisados separadamente |
| Preços | Descontos, tabelas, promoções, revisões de preços e controles comerciais | Permissão verificada no backend; sem motor genérico de regras ou aprovação excepcional por operação |
| Caixa | Abertura, suprimento, sangria, devolução, fechamento e relatório | Snapshot transitório; normalização completa pendente; sem conciliação bancária integrada |
| Financeiro | Despesas, contas a pagar, parcelas, pagamentos, recebimentos, alocações e negociação | Snapshot transitório; sem normalização completa/banco/gateway/contabilidade/DRE completa |
| Crédito/entrega | Crédito de loja e acompanhamento de entrega | Entrega não deve gerar segunda baixa de estoque |
| Planejamento | Reposição planejada, centros/limites de despesas, acordos e previsões recorrentes | Previsão não é pagamento; geração manual não é automação agendada |
| Operação | Agenda/tarefas, procedimentos declarados e ocultação visual | Checklist não comprova permissão; ocultar não apaga histórico |
| Posto de trabalho | Rascunhos/preferências/atendimentos separados por usuário/empresa/unidade verificados | Chaves antigas preservadas sem adoção automática; sem sincronização multi-PC ou criptografia do navegador |
| Exportação | CSV autenticado/escopado; temporário vinculado à sessão/unidade; impressão interna | Exige todas as leituras comerciais; sem fiscal, anexos ou portal de contador |
| Recuperação local | Backup consistente/validação/agendamento/retenção, restore novo isolado | Restore sintético validado; procedimento da loja/DR real/RPO/RTO/proteção externa pendentes |

Seis agregados são relacionais: Produtos, Clientes, Fornecedores, Compras/Recebimentos, Estoque/Movimentações e Vendas. Escritas de Vendas, Caixa/Financeiro e complementos conservam snapshot transitório. Resposta completa exige cinco leituras; DTOs/cadastros/venda direta respeitam direitos necessários. Catálogo compartilhado é planejado. Login sozinho não autoriza inativo: exceção exige senha/direito/motivo/grant e consumo atômico. Quantidades técnicas são exatas; operações comerciais inteiras, UOM/conversões/fracionamento futuros.

## Mapa modular aprovado — alvo PLANEJADO

```text
ERP / SaaS único
  Core Platform (sempre ativo)
  + Financeiro Básico (sempre presente)
  + módulos de negócio opcionais / especializações
  + add-ons
  + integrações por adapters

Produtos independentes futuros:
  Inteligência de Mercado B2B
  Gestão Financeira Pessoal
```

| Camada | Responsabilidade aprovada | Implementação atual / dependências |
| --- | --- | --- |
| **Core Platform obrigatório** | Conta/Organização → Entidade Legal/Titular PF/PJ → Unidade; identidade/sessões/permissões/escopos; entitlement/configurações/políticas; Pessoas/Organizações comuns; auditoria; anexos; tarefas/notificações/busca por permissão; tags/campos; infraestrutura de workflow/automações/import-export/versionamento/continuidade | Identidade/RBAC/auditoria e partes de tarefas/busca/metadados/import-export existem; hierarquia, pessoas comuns, entitlement, anexos e sync completos não. Core não contém Produtos/Vendas/Estoque |
| **Financeiro Básico obrigatório** | Pagar/receber, caixa/contas internas, categorias/centros, recorrências/previsões, fluxo realizado/projetado, reversões, rateios, relatórios e DRE gerencial básica | Há fluxos financeiros locais, ainda híbridos e ligados a outros agregados; independência de Vendas/Estoque/Produtos e DRE do mestre não estão implementadas |
| **Módulos opcionais** | Vendas/PDV, Produtos/Precificação, Estoque, Compras, Serviços/OS, CRM, Fiscal, Produção e Logística/Entrega | Vários fluxos comerciais existem; ativação por entitlement e isolamento entre capacidades ainda não. Serviço será entidade própria, não variante de produto |
| **Especializações** | Restaurante/Delivery, E-commerce e nichos futuros sobre os mesmos domínios | Planejadas; presets de segmento/governança e pacotes comerciais não criam outros sistemas |
| **Add-ons** | BI/Relatórios Avançados, automação avançada, Fidelidade/Clube, comissão premium e tracking | Análises locais não comprovam add-on contratado; ativação depende de D |
| **Integrações** | Adapters iFood/WooCommerce/WhatsApp/e-mail/SMS/ESL/carriers/gateways/bancos e outros aprovados | Sem conectores externos reais; falha isolada por provedor, trabalho durável, replay e reconciliação exigem especificação |
| **Serviços técnicos compartilhados** | [Printing & Devices](PRINTING_AND_DEVICES.md) e infraestrutura de conectores do [Commerce Hub](COMMERCE_HUB.md) | Planejados; reutilizam os domínios do ERP. Classificação comercial/entitlement de cada capacidade será especificada, sem transformar cada adapter em novo ERP |
| **Inteligência de Mercado** | Produto B2B separado, extração elegível/minimizada/agregada; normalização versionada sem bloquear venda | Futuro, separado do BI por tenant. Backups não são fonte de analytics; limiares/base legal permanecem abertos |
| **Gestão Financeira Pessoal** | Produto separado do ERP; eventual Open Finance por provedor autorizado/finalidade própria | Futuro, não módulo ordinário nem fonte automática da Inteligência de Mercado empresarial |

### Fiscal independente e experiência transversal

Fiscal é módulo opcional tecnicamente independente: documento fiscal tem identidade/estados/numeração próprios. Venda/OS/processo solicita o Motor Fiscal; a experiência reúne documentos, rejeições, filas, contingência e cancelamentos sem fundir emissão com venda ou impressão. Printing representa documentos, não autoriza emissão. Regras por documento/jurisdição/provedor precisam de especificação; XML pré-preenche, mas não confirma entrada física.

### Dependências e ativação

**Contrato ≠ entitlement ≠ permission ≠ scope ≠ station**. Backend valida capacidade, ação, contexto, dispositivo quando aplicável e políticas. Core/Financeiro Básico não são retirados por ausência de contratação de módulos opcionais. Desativar módulo não apaga fatos; comportamento read-only/retenção/suspensão será formalizado em D, sem escolher automaticamente os estados conceituais como enum definitivo.

Não impor que Vendas/Estoque/Produtos estejam ativos para usar Financeiro Básico. Relações entre módulos usam contratos; não duplicar pessoas, pagamentos ou saldos por pacote/nicho/canal. Preservar históricos e especificar dependências antes de liberar novos fluxos.

### Limites atuais e sequência

Entitlement não existe; o snapshot legado exige cinco leituras e acopla agregados. Catálogo comum PF/PJ, produtos sem controle de estoque, estados/negativo/alçadas e independência financeira exigem evolução posterior. [Auditoria reclassificada](../auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md).

A ordem vigente é [A–G](ROADMAP.md), começando por governança e proposta de replay isolado. Produtos React não é o próximo milestone automático. [Anotações do passeio](../atualizacoes/v1.1/AJUSTES-DO-PASSEIO.md) e fontes de custo/recebimento continuam preservadas.
