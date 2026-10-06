# Fundação V1.1 — execução em ordem

Fonte autorizada: [dez demandas integrais](FOUNDATION_V1_1_SOURCE.md). Especialistas selecionados: Arquitetura/Segurança e QA para revisão e testes; Banco/Backend para agregados; Produto/UX para operação; Documentação ao encerrar. Diretor e tester antigos desativados.

| Passo | Entrega | Estado |
| --- | --- | --- |
| 1 | Leituras por permissão e respostas sem vazamento | CONCLUÍDO: consultas por área, auditoria parcial protegida, 14 testes HTTP novos e 302 anteriores aprovados |
| 2 | Produtos paginados, filtros e busca exata | CONCLUÍDO na consulta/novo shell: limites, ordenação estável e busca independente da página; consulta SQL evolui no passo 3 |
| 3 | Produtos relacionais | CONCLUÍDO: 19 testes específicos, SQL paginado e 336 testes na regressão |
| 4 | Clientes relacionais | CONCLUÍDO: 12 testes específicos, consultas SQL e regressão 348/348 |
| 5 | Fornecedores relacionais | CONCLUÍDO: 11 testes específicos e regressão 359/359 |
| 6 | Compras e recebimentos relacionais | CONCLUÍDO: 14 específicos, HTTP transacional, ensaio em cópia e regressão 374/374 |
| 7 | Saldos e movimentos relacionais | CONCLUÍDO: 17 específicos, revisão independente, ensaio em cópia e regressão 392/392 |
| 8 | Venda excepcional de produto inativo | CONCLUÍDO: 12 unitários, 21 HTTP, correção do Caixa, ensaio em cópia e regressão 428/428 |
| 9 | Quick views, autoria, custo e filtros | CONCLUÍDO: 8 unitários + 20 HTTP, regressão 456/456 e conferência visual isolada |
| 10 | Regressão, visual e documentação | CONCLUÍDO: 457/457 testes, visual isolado, documentos, backup/ensaio e migração operacional conferida |

## Decisões antes das alterações estruturais

Um agregado por migration, em sequência Produtos → Clientes → Fornecedores → Compras/Recebimentos → Estoque. SQL será autoridade para cada agregado migrado; espelho compatível em unit_states permanecerá conferido. Leituras não reimportam o espelho silenciosamente. Escritas de domínio validado, agregado SQL, snapshot, revisão e auditoria na mesma transação. Campos comerciais reais, extras desconhecidos preservados, ordem e distinção ausência/null preservadas. Não alegar normalização completa de Vendas/Caixa/Financeiro.

Quantidades do novo modelo usam decimal textual exato, sem REAL, unidade declarada quando existir e contratos futuros de conversão. Regras atuais de entrada inteira permanecem até especificação de venda fracionada. Não inferir custo zero, unidade ou autoria de registro antigo. O fiscal brasileiro fica planejado e separado.

PK/FK compostas company/unit/ID. Catálogo permanece por unidade, sem compartilhamento implícito. Recebimento parcial reaproveita o fluxo existente: não gera segunda entrada, nova despesa automática ou nova fonte de custo. Novas mudanças de saldo exigem correspondência com movimentos; saldo histórico inicial técnico não inventa operador.

Antes da aplicação operacional: backup consistente do SQLite, verificar cópia em ambiente isolado e relatórios de equivalência. Não copiar .sqlite enquanto WAL estiver ativo. Rollback de migration/espelho transacional em falha. Reversão de código requer exportar o SQL conferido para espelho atualizado; não restaurar o JSON histórico para apagar operações recentes. Schema aditivo preservado; nunca apagar tabelas automaticamente.

Aceite: equivalência canônica por agregado, IDs/ordem/extras/ausências/centavos/quantidades preservados; consulta paginada e contexto isolado; cenários cruzados/revogação; rollback compra/estoque/custo/auditoria; reenvios sem duplicação; identidade excepcional verificada e escopo/operação vinculados. Testes somente com bases isoladas.

Endpoints menores usam allowlists explícitas. /api/state transitório mantém cinco leituras, não usado pelo shell parcial. Auditoria parcial não expõe snapshots completos. Nenhuma inferência por filtro/ordem de custo ou estoque no catálogo.
