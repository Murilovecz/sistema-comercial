# Recuperação do projeto e incorporação de Printing / Commerce

**02/10/2026.** Escopo: [pedido integral](../briefings/PRINTING_COMMERCE_SOURCE.md), exclusivamente neste projeto. Revisão de Banco, Arquitetura/Produto e Integrações/Segurança, com consolidação documental e verificações do Codex. Diretor/tester antigos não foram reativados.

## Estado real recuperado

Na leitura inicial `package.json` declarava `1.0.0-foundation.1` e o quadro V1.1 tinha passos 1–9 concluídos / passo 10 em implementação. Durante esta tarefa os arquivos foram atualizados por outra execução. A conferência final encontrou **1.1.0-foundation.1**, passo 10 **CONCLUÍDO**, [relatório V1.1](../atualizacoes/v1.1/FOUNDATION_V1_1_REPORT.md) e [evidência operacional](../../.qa/foundation-v1.1/operational-release.json). Essa entrega/migração não foi executada por esta tarefa documental; não sobrescrevemos suas alterações nem utilizamos banco da loja para testes.

| Item | Estado confirmado e fonte |
| --- | --- |
| Versão | `package.json` e [health consultado nesta tarefa](../../.qa/product-directions/health.json): 1.1.0-foundation.1, pronto/local; Node observado 24.19.0, mínimo declarado 24.7 |
| Última etapa | Fundação V1.1, passo 10: regressão, visual, documentação e aplicação operacional, conforme [quadro](../atualizacoes/v1.1/FOUNDATION_V1_1_STEPS.md) e relatório |
| Testes atuais | Nova execução desta tarefa: **457 aprovados, 0 falhas/cancelados/ignorados/pendentes**, 78,63 s; [saída](../../.qa/product-directions/tests.txt) |
| SQL comercial | Produtos/aliases/embalagens, Clientes, Fornecedores, Compras/itens/Recebimentos, saldos globais/por posição, movimentos globais/físicos e entradas históricas; migrations 002–006 e stores |
| Fundação SQL | Identidade, empresas/unidades, vínculos/RBAC, sessões, auditoria, importação; migration 007 acrescenta aprovação, não normaliza Vendas |
| Ainda snapshots | Vendas/Orçamentos, Caixa/Financeiro/contas/despesas, reservas/inventários/devoluções, preços/promoções, documentos de posições/transferências, entregas e módulos complementares. Saldos/movimentos físicos SQL não significam todo o documento de transferência normalizado |
| Compatibilidade | `unit_states` conserva espelho dos agregados normalizados, com igualdade/ordem/presença/extras conferidos; SQL é autoridade, divergência aborta |
| Próxima sequência registrada | Recuperação de senha, backup/restauração/retenção/RPO/RTO e Git; medição de desempenho; consultas avançadas e normalização de Vendas, depois Caixa/Financeiro, conforme [roadmap](../atual/ROADMAP.md) |

Principais riscos: comandos ainda materializam/reconstroem estado/espelhos; volume de produção não medido; catálogo por unidade; snapshots/referências sem FK universal; backup consistente/ensaio existentes não são rotina operacional automática; recuperação de senha, Git, MFA, proteção de dados locais e limites distribuídos pendentes. Auditoria local não é inviolável contra administrador do arquivo. Cloud/PostgreSQL, API pública, cliente Windows final, Edge, SaaS/fiscal/integrações continuam planejados.

## Compatibilidade e decisões

**Quantidades/unidades:** base SQL adequada para evolução, sem operações fracionadas prontas. `decimal.js` conserva decimal textual e aritmética BigInt; projeções/hidratação usam inteiro seguro/`legacyInteger`. Unidade declarada é preservada, mas fracionável, unidade base/compra/venda e conversões por produto não têm contrato completo. Dinheiro conserva centavos inteiros; quantidade × preço/custo requer precisão/arredondamento a definir. Não inserir frações diretamente nas tabelas como atalho. Exemplos e critérios em [DATABASE](../atual/DATABASE.md).

**Printing & Devices:** nenhum conflito estrutural imediato. Impressão atual é HTML/`window.print()` e scanner em modo teclado. Print Service/adapters futuros podem ser adicionados por contrato; Fiscal separado; Desktop/Edge limitado. Falha/reimpressão não repete efeitos comerciais/fiscais. Não declarar fabricantes/equipamentos testados.

**Commerce Hub:** nenhum impedimento irreversível, mas não está pronto. Exige identidade/mapeamento de catálogo/variações entre unidades, contas externas próprias, disponibilidade/reservas centrais, estados de pedidos, eventos duráveis e reconciliação. Não duplicar estoque, Produto, impressão ou contabilidade por canal. `product.stock` já exclui retenção no fluxo atual; evitar descontar quarentena duas vezes. Offline/sincronização externa mantêm risco de venda simultânea.

Decisões [D-019..D-022](../atual/DECISIONS.md): incluir os dois módulos planejados; adapters e fronteiras compartilhadas; multitenant/multiconta; autoridade por dado; jobs/eventos idempotentes e recuperação; preservar representação/históricos; **nenhuma alteração de código, migration ou dados por esta tarefa**. Não surgiu necessidade de ajuste estrutural imediato. Próximas alterações comerciais devem revisar esses contratos antes de aprovação.

**A DEFINIR:** precisão/escala/limites e arredondamento; unidades/conversões; primeiro equipamento/protocolo/canal; estados e retenção de jobs; catálogo/variações; estoque agregado/unidade de atendimento; reservas/expiração/buffer/offline; autoridade de preços/promoções; taxas/competência/classificação/DRE; API/autenticação externa, secret storage e retenção. Documentação oficial vigente dos fornecedores será consultada antes da implementação, sem endpoints ou homologações inventados agora.

## Documentação desta tarefa

Criados [PRINTING_AND_DEVICES](../atual/PRINTING_AND_DEVICES.md), [COMMERCE_HUB](../atual/COMMERCE_HUB.md), este relatório e [briefing integral](../briefings/PRINTING_COMMERCE_SOURCE.md).

Atualizados: PROJECT_MASTER, PROJECT_MAP, VISION, ARCHITECTURE, MODULES, ROADMAP, INTEGRATIONS, DATABASE, SECURITY, OFFLINE_EDGE, API, THREAT_MODEL, README, DECISIONS e CHANGELOG_ARCHITECTURE. Documentos/evidências históricos permanecem preservados; não transformar testes antigos em homologação dos novos módulos.

| Itens do pedido | Registro consolidado |
| --- | --- |
| 1–8 | Printing: categorias, Print Service, drivers/protocolos, etiquetas, térmicas, A4/PDF, Fiscal separado, Edge limitado |
| 9–10 | Banco/Printing: quantidades/unidades/conversões e adapters de balança |
| 11–19 | Commerce: núcleo/canais, adapters, sites/API, escopos dos fornecedores, listings e variações |
| 20–24 | Commerce/Banco: disponibilidade, reservas, buffer, preço por canal e promoção/origem |
| 25–30 | Commerce: pedidos/IDs, idempotência, webhook/reconciliação, retries e conflitos |
| 31–37 | Commerce/Segurança: status/erros/logs, secrets, empresa, multiconta e unidade |
| 38–44 | Commerce/Printing: fulfillment, impressão compartilhada, dashboard, taxas/DRE, reversões e autoridade |
| 45–48 | Commerce/Módulos: mapping/adapter, API customizada, storefront e módulos oficiais |
| 49–50 | Documentos/Decisões/Roadmap: impactos e prioridade preservada |

## Verificação e próxima tarefa

Regressão nativa com bases sintéticas/isoladas, incluindo cenários HTTP, SQL/rollback, permissões e aprovação existentes. Nenhum teste comercial gravou na loja. A saída está acima; conferência documental registra 18 documentos, 301 links locais válidos e diferenças de arquivos de aplicação em [verification.json](../../.qa/product-directions/verification.json). [Briefing preservado byte a byte](../../.qa/product-directions/source-verification.json). A única diferença de aplicação observada durante a tarefa foi a versão em `package.json`, alterada na entrega V1.1 concorrente. Revisão final de Banco e Integrações/Segurança não identificou omissão relevante; pequenas correções de texto/semântica foram incorporadas. Não repetimos conferência visual/homologação de hardware nesta tarefa sem mudança de interface.

Próxima tarefa recomendada: a primeira entrega de **recuperação operacional e versionamento** registrada no roadmap, com restauração em base isolada e critérios definidos; depois medir desempenho e continuar normalização de Vendas. Printing/Commerce entram quando um fluxo prioritário for escolhido, respeitando dependências. Esta recomendação não inicia nova implementação.
