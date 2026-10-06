# Diagnóstico inicial

## Escopo e evidência

Inspeção estrutural em **01/10/2026**: inventário de arquivos, manifest, inicialização, rotas, armazenamento/validadores, comandos/auditoria, pontos principais de interface e relatórios históricos. Não foi revisão linha a linha de toda a aplicação nem auditoria completa de segurança. Documentos de origem foram lidos para consolidar a direção. A tarefa não alterou funcionalidades ou arquitetura.

Stack verificada: JavaScript, Node.js **v24.19.0** disponível nesta máquina; requisito do projeto **Node >=22**. Backend HTTP/CommonJS e frontend HTML/CSS/JavaScript sem framework. package.json V0.12.0 não declara dependências externas. npm não foi encontrado no PATH nesta sessão; o Node permitiu executar os testes diretamente. Não há banco SQL, bundler ou instalador Windows identificado.

## O que já está bom

- Fluxos locais comerciais/estoque/financeiro interligados, além de relatórios e atendimento por código de barras/manual.
- Dinheiro em centavos, validações de estado e referências, preservação de valores históricos.
- Controles de reenvio e versão em vários comandos; testes de cenários negativos existentes.
- Leitura validada e gravação por arquivo temporário, com mensagem de falha preservando contexto.
- Arquivos por área, cálculos compartilháveis e interface por categorias com visual verde já adotado.
- Histórico de rodadas, verificações e pedidos do usuário preservado.

## Problemas e dívida técnica

| Achado | Impacto | Evolução recomendada |
| --- | --- | --- |
| Nome no navegador usado como login fictício | Não verifica identidade nem permissões | Usuários/sessões reais e autorização de servidor |
| Base global sem tenant/unidade | Não suporta SaaS multiempresa | Ownership e isolamento com testes cruzados |
| JSON inteiro e estado em memória por processo | Limita escala, consulta e concorrência | Banco transacional e migração validada |
| `/api/state` e escritas devolvem toda a base | Sem minimização/paginação/escopo | Contratos menores, filtros e contexto de acesso |
| Transporte e despacho centralizados em server.js | Crescimento torna contratos/erros difíceis de manter | Modularização incremental por domínio |
| Estado global, wrappers e scripts em ordem fixa | Dependências implícitas na interface | Encapsular gradualmente, manter testes de fluxo |
| Backend importa cálculos de `public/` | Acoplamento entre distribuição de interface e domínio | Extrair cálculos puros quando a tarefa exigir |
| Responsável digitado e trilha em JSON | Rastreabilidade não verifica autorização nem resiste a edição | Identidade, aprovação e auditoria protegida |
| Controles de versão/reenvio variam por rota | Garantias não uniformes | Inventário por operação e consistência transacional |
| Sem cloud/instalador/Edge/fiscal/conectores reais | Visão futura ainda não disponível | Fases com critérios de aceite, sem falsa equivalência |
| Sem .git na raiz inspecionada | Recuperação por histórico de código não está configurada aqui | Definir versionamento e recuperação antes de grandes mudanças |

## Riscos de segurança

API sem identidade/autorização, dados locais sem proteção de aplicação, falta de tenant e auditoria declarada são os principais limites atuais. Loopback ajuda a conter exposição, mas não resolve acesso direto por processos locais. Não publicar o servidor atual como SaaS. A análise detalhada está em [SECURITY](../../atual/SECURITY.md) e [THREAT_MODEL](../../atual/THREAT_MODEL.md).

## Diferença para a visão

O produto alvo usa servidor central, monólito modular, API autenticada, banco transacional, multiempresa/multiunidade, cliente Windows e Edge opcional. O protótipo atual roda e armazena dados no mesmo computador. É uma base útil de regras e experiência, ainda sem fundação SaaS de identidade, isolamento e operação.

Manter os fluxos e testes úteis, dinheiro exato, IDs/vínculos históricos, experiência visual e entradas por código/manual. Evoluir persistência, contratos, identidade, propriedade de dados e infraestrutura por etapas, preservando dados antigos. Não há motivo demonstrado para reescrever tudo agora.

## Validação desta entrega

Os **205 testes de regras passaram novamente**, sem falhas, em execução do runner nativo do Node. Resultado em [.qa/foundation-docs/unit-results.txt](../../../.qa/foundation-docs/unit-results.txt). A base da loja foi lida/validada, sem gravação operacional; hashes de código e dados foram capturados para comparação. O resultado final de preservação e links está em [.qa/foundation-docs/verification.json](../../../.qa/foundation-docs/verification.json).

Evidência anterior da V0.12: 126 arquivos JavaScript conferidos, 205 testes e 40 cenários HTTP, mais fluxos visuais representativos, registrados em [.qa/round10/final-results.json](../../../.qa/round10/final-results.json) e [VERIFICACAO-V0.12.md](../../historico/v0/VERIFICACAO-V0.12.md). Nesta entrega documental não repetimos os 40 cenários HTTP nem o passeio visual. O agente tester permanece pausado; não atribuir esta execução a ele.

Passar os testes existentes não valida identidade, tenants, cloud, Edge, fiscal ou segurança integral, porque essas capacidades não estão implementadas.

## Próxima sequência recomendada

Consolidar a primeira entrega real de fundação: regras de usuário/empresa/unidade e permissões; escolha de persistência e migração segura; contratos de acesso e auditoria; primeira fatia implementada e testada em ambiente isolado. Depois ampliar núcleo comercial e financeiro, mantendo solicitações de interface já anotadas. Offline deve ter desenho e prioridade definidos cedo, embora implementação esteja mais adiante no briefing. Ver [ROADMAP](../../atual/ROADMAP.md).
