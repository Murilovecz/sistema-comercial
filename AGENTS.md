# Protocolo dos especialistas

Trabalhar somente em `D:\Projeto Sistema Local`. Antes de trabalhar, conferir `git status`, código e testes. A referência conceitual oficial é o [Documento Mestre v1.0](Documento_Mestre_Sistema_Comercial_v1.0.md). O [índice de governança e estado](docs/atual/PROJECT_MASTER.md) descreve a implementação; o [roadmap vigente](docs/atual/ROADMAP.md) ordena os trabalhos. Plano e recomendação não autorizam execução.

As definições em [agents](agents/) são papéis permanentes, não processos que precisam ficar executando.

Antes de um trabalho relevante:

1. Escolher somente os especialistas necessários e ler seus arquivos.
2. Atribuir a cada especialista uma responsabilidade e uma entrega claras.
3. Conferir código, documentos e funcionalidades existentes; evitar duplicação.
4. Apresentar divergências, alternativas e trade-offs relevantes; nenhuma recomendação de agente vira decisão automaticamente.
5. Implementar uma mudança por vez, preservando compatibilidade e dados. Para mudanças de comportamento e correções, usar TDD **Red → Green → Refactor**; refatorar somente quando necessário ao escopo.
6. Verificar com os testes adequados. Não mascarar defeitos, enfraquecer regras ou desabilitar testes para obter aprovação.
7. Atualizar documentos afetados e registrar decisões estruturais com fonte, status, impactos e aceite.

O diretor antigo e o tester antigo continuam desativados por solicitação do Murilo. Não reativar agentes antigos nem ciclos históricos. O especialista QA / Testing é distinto do tester antigo e participa conforme o escopo; as verificações do Codex continuam necessárias.

## Papéis disponíveis

| Especialista | Definição |
| --- | --- |
| Arquitetura | [architect](agents/architect.md) |
| Produto e domínio | [product-domain](agents/product-domain.md) |
| Segurança | [security](agents/security.md) |
| Backend | [backend](agents/backend.md) |
| Banco de dados | [database](agents/database.md) |
| Interface e experiência | [frontend-ux](agents/frontend-ux.md) |
| Qualidade e testes | [qa-testing](agents/qa-testing.md) |
| Integrações | [integrations](agents/integrations.md) |
| Infraestrutura | [devops-infrastructure](agents/devops-infrastructure.md) |
| Documentação | [documentation](agents/documentation.md) |

## Regras comuns

- Diferenciar **ATUAL**, **PLANEJADO** e **A DEFINIR**. Código/testes provam implementação; o mestre define o produto desejado. Não inventar regras comerciais/fiscais, identidade histórica ou garantias de segurança.
- Evoluir incrementalmente como monólito modular e API-first. A hierarquia aprovada é **Conta/Organização (tenant) → Entidade Legal/Titular PF ou PJ → Unidade**. A correspondência dos atuais `company_id`/`unit_id` precisa de especificação revisada e aprovada antes de migrations; preservar IDs, autoria e entidade responsável histórica.
- **Contrato ≠ entitlement ≠ permission ≠ scope ≠ station**. Core Platform sempre ativo; Financeiro Básico sempre presente, mesmo sem Produtos/Vendas/Estoque; módulos de negócio opcionais e add-ons ativados pelo backend. Presets/pacotes/cargos não criam sistemas separados nem concedem autoridade por si.
- Cloud é a autoridade definitiva. Backend valida acesso e regras em **deny-by-default/fail-closed**; administração da plataforma é separada da administração do cliente. Nenhum cliente acessa diretamente o banco cloud.
- Navegador, cliente Windows, estação, LAN e Agente Local são não confiáveis. Dispositivo operacional/offline tem identidade própria e revogável quando aplicável; estação/turno digitados não provam identidade. Software cliente pode ser inspecionado: esconder código ou ofuscar nunca é mecanismo principal de segurança.
- Offline exige autorização válida, assinada, temporária, limitada e vinculada ao contexto; estação não emite/renova sua própria autorização. Regras/configurações críticas e administrativas são **cloud-only**. Preservar fatos offline válidos e reconciliar conflitos; carência comercial não define janela offline.
- Atualizações/artefatos oficiais são assinados, rastreáveis e aplicados em ponto seguro. Segredos mestres e credenciais centrais ficam fora do cliente, código, Git, logs e documentos; identidade limitada de dispositivo não equivale a segredo mestre.
- Isolamento multi-tenant é obrigatório em APIs, consultas, vínculos, arquivos, caches, eventos, relatórios e exports. Testes negativos cross-tenant e de permissão são obrigatórios para mudanças nesses caminhos; frontend não é autoridade.
- Dinheiro e quantidades usam representação exata. Operações críticas exigem atomicidade, proteção obrigatória contra **replay/idempotência** e auditoria **append-only**. Histórico financeiro/estoque não é apagado; correções usam eventos/reversões vinculadas conforme especificação.
- Usar dados isolados nas verificações que gravam; nunca usar o banco da loja como massa de teste. Não fabricar autores antigos nem substituir SQL por JSON histórico.
- Documentar migrações, compatibilidade, recuperação e critérios de aceite antes de alterações estruturais. Decisões destrutivas/de alto impacto, mudança de stack, contratos externos e regras financeiras/fiscais ambíguas dependem de decisão explícita do proprietário.
- **Sem commit/push sem autorização explícita**. Uma fase planejada não reabre autorização histórica. Registrar mudança contraditória ao mestre com seções afetadas, alternativas, decisão do proprietário, transição e testes.
- Explicar resultados em português acessível ao Murilo. Instruções explícitas do usuário e limites de autorização prevalecem.

## Estado e sequência atuais — 05/10/2026

Fundação V1.2 fechada localmente, homologação histórica B/610, versão `1.2.0-foundation.1`, migrations 001–010. Seis agregados SQL; escritas e Caixa/Financeiro conservam persistência híbrida. React/TypeScript/Vite já têm base, sessão/login/contexto e Design System; Produtos React ainda não existe. Entitlement, identidade confiável de dispositivo, Agente Local e sync cloud não estão implementados.

Nesta sincronização, somente documentação está autorizada. Próximo trabalho de código **proposto**, isolado: replay da venda legada, com TDD, análise de consumidores e compatibilidade. Fases B–G dependem de solicitação/aprovação conforme o [roadmap](docs/atual/ROADMAP.md); nenhuma começa automaticamente. [Auditoria preservada e reclassificada](docs/auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md).
