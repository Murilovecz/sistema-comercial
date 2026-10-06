# Pedido do proprietário — sincronização de governança, 05/10/2026

Fonte preservada do texto fornecido pelo Murilo nesta rodada. Autoriza reconciliação documental, não implementação B–G ou commit/push. Decisões conceituais: [mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md); execução documental/ordem: [roadmap vigente](../atual/ROADMAP.md).

---

SINCRONIZAÇÃO DE GOVERNANÇA — DOCUMENTO MESTRE v1.0
Existe agora na raiz do repositório o arquivo:
Documento_Mestre_Sistema_Comercial_v1.0.md
Ele representa a nova referência conceitual oficial aprovada pelo proprietário do produto após a auditoria anterior.
Sua tarefa nesta rodada é somente reconciliar documentação, governança e plano de construção com essa nova referência.
NÃO implemente funcionalidades de negócio nesta rodada.
Antes de alterar qualquer coisa:
1. leia integralmente Documento_Mestre_Sistema_Comercial_v1.0.md;
2. leia o AGENTS.md;
3. leia docs/atual/PROJECT_MASTER.md;
4. leia MODULES.md, roadmap/plano de construção e demais documentos atuais que definem arquitetura, estado ou próximos passos;
5. inspecione git status;
6. compare as novas decisões com o código real e com os documentos existentes.
O código e os testes continuam sendo a fonte do estado implementado.
O Documento Mestre v1.0 passa a ser a fonte principal das decisões de produto e arquitetura desejadas.
Não reescreva documentos históricos da V1.1/V1.2/V1.3 como se o passado nunca tivesse acontecido. Preserve histórico. Atualize apenas documentos que representam o estado/arquitetura/plano vigente ou crie documentos novos quando isso for mais correto.
OBJETIVO 1 — Tornar o Documento Mestre a referência oficial
Proponha e execute a organização documental adequada para que não existam dois “mestres” conflitantes.
O resultado deve deixar inequivocamente claro:
- qual documento define decisões atuais de produto;
- qual documento descreve estado implementado;
- quais documentos são históricos;
- quais decisões ainda estão abertas;
- como futuras mudanças devem ser registradas.
Você pode renomear/mover/incorporar conteúdo documental quando necessário, preservando histórico e links úteis.
OBJETIVO 2 — Atualizar AGENTS.md
Atualize AGENTS.md apenas onde necessário para refletir as decisões aprovadas.
Preserve todas as regras úteis já existentes, especialmente:
- evolução incremental do produto;
- TDD Red → Green → Refactor;
- backend authority / fail closed;
- dinheiro e quantidades exatas;
- atomicidade;
- idempotência;
- auditoria;
- não mascarar defeitos;
- não desabilitar testes;
- decisões destrutivas/de alto impacto dependem do proprietário;
- sem commit/push sem autorização;
- inspeção de Git antes de trabalhar;
- definição explícita de regras de negócio ambíguas.
Acrescente, quando ainda não estiver contemplado:
- hierarquia Conta/Organização → Entidade Legal/Titular PF ou PJ → Unidade;
- contrato ≠ entitlement ≠ permission ≠ scope ≠ station;
- Core sempre ativo;
- Financeiro Básico sempre presente;
- módulos de negócio opcionais;
- cloud como autoridade definitiva;
- clientes/estações/Agente Local considerados não confiáveis;
- nenhum cliente acessa banco cloud diretamente;
- isolamento multi-tenant obrigatório;
- dispositivo operacional com identidade própria quando aplicável;
- offline somente com autorização válida e limitada;
- regras críticas/administrativas cloud-only;
- atualizações assinadas;
- segredos fora do cliente;
- software cliente pode ser inspecionado, portanto segurança nunca depende de esconder código;
- auditoria append-only;
- proteção contra replay obrigatória em operações críticas;
- nenhuma recomendação arquitetural de agente é automaticamente decisão: alternativas e trade-offs devem ser apresentados quando houver impacto relevante.
Evite transformar AGENTS.md em cópia do Documento Mestre. Ele deve continuar sendo um conjunto conciso de regras operacionais para agentes.
OBJETIVO 3 — Atualizar MODULES.md / mapa modular
Reconciliar o mapa de módulos com a definição aprovada:
Core Platform
+
Financeiro Básico
+
módulos opcionais
+
add-ons
+
integrações
+
produtos independentes futuros.
Não trate pacotes comerciais como sistemas separados.
Fiscal deve ser representado como domínio independente tecnicamente e transversal na experiência operacional.
Inteligência de Mercado e futura Gestão Financeira Pessoal não devem ser confundidas com módulos ordinários do ERP.
OBJETIVO 4 — Substituir o plano de construção antigo
O plano anterior que parte diretamente para o piloto React de Produtos não deve mais ser considerado o próximo milestone automaticamente.
Crie/revise o plano atual considerando a auditoria técnica e o Documento Mestre.
Neste momento, o próximo ciclo deve priorizar alinhamento de fundação e integridade, não expansão visual.
Minha orientação inicial para a sequência é:
Fase A — Governança/documentação
Esta rodada.
Fase B — Correção de integridade já comprovada
Tratar o gap de replay/idempotência da venda legada identificado na auditoria.
Deve ser feito isoladamente, com TDD, análise dos consumidores e estratégia de compatibilidade. Não implemente nesta rodada.
Fase C — Especificação da nova fundação organizacional
Formalizar antes de migrar:
Conta/Organização
→ Entidade Legal/Titular PF/PJ
→ Unidade
Mapear explicitamente como os atuais company_id e unit_id entram no novo modelo, preservando IDs, histórico, auditoria e isolamento.
Não criar migrations até a especificação ser revisada e aprovada.
Fase D — Contrato / Entitlement / Permission / Scope / Station
Formalizar modelo e invariantes antes de implementar cobrança/licenciamento.
Fase E — Identidade de dispositivo e fronteira cliente/plataforma
Somente especificação inicialmente.
Fase F — Evolução incremental dos agregados/persistência
Com prioridade baseada em dependências e gargalos reais.
Fase G — Retomada da migração comercial React
Apenas depois que as fundações das quais o módulo depende estiverem estabilizadas.
Produtos React continua sendo candidato a piloto, mas NÃO está autorizado para implementação nesta rodada.
Agente Local, offline cloud, fiscal real e updater continuam posteriores e dependem das respectivas especificações.
OBJETIVO 5 — Registrar corretamente a auditoria anterior
Preserve as descobertas comprovadas da auditoria.
Em especial, não descarte:
- gap real de idempotência/replay da venda legada;
- persistência híbrida atual;
- React já parcialmente implementado;
- inexistência atual de entitlement;
- inexistência atual de identidade confiável de dispositivo;
- inexistência atual de Agente Local/sincronização cloud;
- necessidade futura de administração da plataforma separada da administração do cliente;
- itens sólidos que a auditoria recomendou preservar.
Porém, reclassifique aderência quando necessário usando agora o Documento Mestre v1.0 que antes não estava disponível.
OBJETIVO 6 — Não fazer arquitetura especulativa
Não implemente agora:
- PostgreSQL;
- microserviços;
- Agente Local;
- fiscal;
- entitlement;
- novo modelo organizacional;
- dispositivo confiável;
- offline cloud;
- updater;
- React Produtos;
- normalização total da persistência.
Primeiro precisamos especificar e ordenar corretamente.
Ao terminar, entregue um relatório contendo:
1. arquivos documentais alterados/criados/movidos;
2. o que mudou no AGENTS.md;
3. novo mapa modular;
4. novo plano de construção;
5. decisões do Documento Mestre que mudaram a interpretação da auditoria anterior;
6. eventuais contradições que ainda restaram;
7. proposta do primeiro único trabalho de código após esta sincronização;
8. git diff --stat;
9. git status.
Não faça commit nem push.
Pare após o relatório.
