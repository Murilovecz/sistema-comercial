# Fundação V1 — execução em ordem

Pedido do Murilo: [20 passos originais](FOUNDATION_V1_SOURCE.md). Diretor e tester antigos desativados; usar os novos especialistas conforme a etapa. Cloud, Edge, executável final, cobrança, fiscal completo, integrações setoriais e IA continuam fora do escopo.

| Passo | Entrega | Estado |
| --- | --- | --- |
| 1 | Baseline V0.12.0 | CONCLUÍDO: 195 arquivos preservados, hashes e 205 testes aprovados |
| 2 | Mapa completo do JSON | CONCLUÍDO: 42 coleções, campos/tipos/vínculos, 205 testes e hash preservado |
| 3 | Modelo conceitual | CONCLUÍDO: Architect, Database e Security aprovaram com invariantes registradas |
| 4 | Banco e camada de acesso | CONCLUÍDO: SQLite local, SQL parametrizado; PostgreSQL alvo futuro |
| 5 | Migrations e ambientes | CONCLUÍDO: checksum/transação/FK/config isolada; 208 testes aprovados |
| 6 | Empresa | CONCLUÍDO: entidade/CRUD técnico/validação/rollback; 210 testes aprovados |
| 7 | Unidade | CONCLUÍDO: vínculo composto e validação de escopo; 211 testes aprovados |
| 8 | Usuário e hash de senha | CONCLUÍDO: Argon2id assíncrono, status/login, 214 testes aprovados |
| 9 | Autenticação e sessão | CONCLUÍDO: sessão/CSRF/pairing/expiração/logout; 227 testes na evidência |
| 10 | Vínculos de acesso | CONCLUÍDO: vínculos compostos e multiempresa/unidade; 229 testes |
| 11 | RBAC | CONCLUÍDO: catálogo extensível, papéis scoped, revogação; 230 testes |
| 12 | Autorização central | CONCLUÍDO: deny-default, leitura completa+ação, exports; 232 testes |
| 13 | Isolamento | CONCLUÍDO na camada SQL/domínio; cenários HTTP finais em19/20; 234 testes |
| 14 | Contexto de requisição | CONCLUÍDO: sessão autoritativa, contexto imutável, aba desatualizada; 236 testes |
| 15 | Auditoria | CONCLUÍDO: eventos estruturados, sanitização, triggers e cadeia de hashes; 238 testes |
| 16 | Executor e autorizador | CONCLUÍDO: executor verificado nos novos registros; autorização excepcional preparada, sem fluxo inventado; 239 testes |
| 17 | Transações | CONCLUÍDO: venda/estoque/recebimento/auditoria e compra/custo/estoque atômicos; 243 testes |
| 18 | Migração preservando original | CONCLUÍDO: 22 testes próprios, cópia conferida, IDs/centavos/JSON preservados |
| 19 | Troca de persistência e regressão | CONCLUÍDO: SQL operacional importado e conferido, login real, telas preservadas, quatro testes de runtime e 27 HTTP; servidor local aberto |
| 20 | Revisão geral e relatório | CONCLUÍDO: 302 testes aprovados, rechecagem HTTP 27/27, revisão de segurança, documentos atualizados e primeiro acesso aberto localmente |

## Baseline

[Manifesto](../../../.qa/foundation-v1/baseline-v0.12.0/MANIFEST.json) e [testes](../../../.qa/foundation-v1/baseline-tests.txt). A cópia não deve ser sobrescrita ou usada como banco de operação; arquivos marcados somente leitura e hashes permitem detectar alterações. Isso não é armazenamento inviolável nem serviço de backup. Dados da cópia são privados e não devem ser publicados/versionados.

Preservar IDs, centavos, datas, snapshots e responsáveis declarados antigos. Arquivos da baseline registram o antes; o código do projeto registra o depois. Este quadro só avança com entrega e verificação reais.


