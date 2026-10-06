# Banco e acesso — análise do passo 4

Status: DECISÃO ADOTADA após aprovação técnica do modelo (passo 3). A escolha é delimitada à Fundação V1 local; produção cloud permanece fora do escopo.

| Opção | Adequação e riscos |
| --- | --- |
| PostgreSQL | Alvo estratégico para servidor central, múltiplos clientes e concorrência. Requer instalação/operação de servidor, credenciais, driver e ambiente de teste próprio. Não está configurado neste computador. |
| SQLite | Adequado à Fundação local: SQL transacional, arquivo próprio, constraints e acesso nativo pelo Node instalado. Escritor serializado, não banco compartilhado por rede nem destino definitivo de cloud multi-instância. |
| SQL parametrizado + repository | Mantém CommonJS e domínio atual sem geração de cliente ou dependências extras. Migrations e consultas explícitas; exige disciplina nos parâmetros, constraints e testes. |
| Knex | Query builder/migrations com drivers para vários bancos; depende de drivers adicionais e não remove diferenças de dialeto/transação. Pode ser reconsiderado ao implementar adaptador PostgreSQL. |
| Prisma | ORM/migrations e cliente gerado; exige modelagem e pipeline adicionais, com diferenças entre providers. Ganho menor para a bridge documental temporária atual. |
| Drizzle | SQL/ORM orientado a schemas, com drivers distintos. Avaliar quando normalizar domínio e escolher linguagem/tooling; não é requisito da stack CommonJS atual. |

## Recomendação consolidada

**SQLite local via node:sqlite, repositories SQL parametrizados e migrations SQL versionadas com checksum.** PostgreSQL é o alvo estratégico futuro, não um adapter já implementado. Desenvolvimento/testes usam SQLite isolado nesta etapa; antes de produção PostgreSQL, criar seu adapter/migrations e executar a mesma suíte de integração naquele banco. Não declarar portabilidade automática ou paridade de ambientes sem essas provas.

Node mínimo passa a **24.7**, porque Argon2 nativo existe nessa linha; a máquina possui 24.19.0 e suporte a ambos confirmado. APIs nativas recentes precisam de revisão a cada atualização e testes de compatibilidade. Camadas isolam essas APIs para troca futura. Não há instalação de serviço cloud ou ORM nesta etapa.

Fundação de identidade/RBAC relacional; snapshot comercial temporário por empresa/unidade para preservar contratos e históricos. Migrations com ordem, hash e transação, FK ligada, WAL para arquivo local, busy timeout e synchronous FULL. Não abrir banco operacional implicitamente em testes; exigir caminho isolado ou :memory:.

## Fontes primárias consultadas

- [SQLite: usos adequados](https://www.sqlite.org/whentouse.html): fundamenta uso local e limite de concorrência/servidor.
- [Node 24.19: SQLite](https://nodejs.org/download/release/v24.19.0/docs/api/sqlite.html): API nativa disponível.
- [Node: crypto e Argon2](https://nodejs.org/docs/latest-v24.x/api/crypto.html): hash disponível desde 24.7.
- [PostgreSQL: isolamento transacional](https://www.postgresql.org/docs/current/transaction-iso.html): estratégia de transações no alvo futuro.
- [Knex](https://knexjs.org/guide/), [Prisma](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases) e [Drizzle](https://orm.drizzle.team/docs/overview): alternativas consideradas, sem instalação automática.

## Consequências e pendências

Local continua simples e funciona sem dependência de servidor instalado. Escritas comerciais ainda atualizam snapshot completo, com custos proporcionais ao estado e normalização pendente. Compartilhamento de catálogo entre unidades, futura arquitetura PostgreSQL, operação cloud e políticas comerciais continuam A DEFINIR. Esta escolha não implementa Edge/offline SaaS.

