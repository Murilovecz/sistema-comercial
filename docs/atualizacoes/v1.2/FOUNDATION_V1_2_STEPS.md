# Fundação V1.2 — execução e critérios

Fonte autorizada: [30 passos integrais](FOUNDATION_V1_2_SOURCE.md). Partida confirmada em 02/10/2026: 1.1.0-foundation.1, 457/457 testes, migrations 001..007 com checksums intactos, SQLite íntegro/FKs válidas e cinco agregados equivalentes em leitura. Evidência privada em `.qa/foundation-v1.2/preflight.json`; baseline Git local `79b418a`, tag `foundation-v1.1-baseline`, sem remoto.

**Fechamento local em 03/10/2026:** Fundação V1.2 concluída, versão **1.2.0-foundation.1**, tag local `v1.2.0-foundation.1`, homologação preservada **B, 610/610**, migrations **001–010**, checkpoint funcional `2a2177c7b80734722f71bd9e72029cf9e1b39df0`. Partida e contagens anteriores são históricas. [Estado, fontes e limites](FOUNDATION_V1_2_REPORT.md).

| Passos | Entrega | Estado |
| --- | --- | --- |
| 1 | Pré-flight e regressão inicial | CONCLUÍDO: 457 aprovados; integridade/FKs/checksums/equivalência |
| 2 | Git local, ignore e baseline segura | CONCLUÍDO: dados/QA/backups/secrets/mídia privados ignorados; bytes de migrations preservados |
| 3–5 | Senha/reset, sessões e manutenção de grants | CONCLUÍDO / HOMOLOGADO B; contrato em ACCESS_V1_2; sem e-mail/MFA |
| 6–8 | Backup automático, retenção e restore isolado | CONCLUÍDO / HOMOLOGADO B; contrato em OPERATIONS_V1_2; validação sintética, procedimento da loja pendente |
| 9–10 | Benchmark sintético e mapa de materializações | CONCLUÍDO antes de Vendas; 19 operações × 3 volumes, PERFORMANCE_V1_2 |
| 11–24 | Vendas relacionais, equivalência, consultas e direitos | CONCLUÍDO / HOMOLOGADO B; migration 009 e SALES_V1_2_MODEL; escritas ainda materializam snapshot |
| 25–27 | Benchmark posterior e regressão | CONCLUÍDO: interno before/after, HTTP e sanity final; 010 + quatro melhorias locais aprovadas; 610/610 global |
| 28 | Conferência visual sintética | CONCLUÍDO: três perfis, 1024×768/1440×900; observação cosmética de favicon |
| 29 | Documentação consolidada | CONCLUÍDO: reconciliação e portabilidade registradas no commit 33b4efc; relatórios/evidências históricos preservados |
| 30 | Versionamento final, tag e fechamento formal | CONCLUÍDO LOCALMENTE: 1.2.0-foundation.1, tag v1.2.0-foundation.1, condições B aceitas; sem push |

Codex consolidou integração/interface/Git/medição e documentação; a homologação revisou segurança/integridade/QA e cenários cruzados. Não repetir os cinco agregados V1.1 nem normalizar Caixa/Financeiro/Orçamentos/Reservas automaticamente. Cloud/PostgreSQL, Windows/Edge/offline, canais, fiscal, Printing/hardware, cobrança, nichos, MFA/passkeys/biometria e fracionamento continuam futuros. Nenhum teste de escrita/restauração usa o banco operacional.

Desenhos foram registrados antes das migrations; SQL, espelho, estoque e auditoria são transacionais, com extras/ausência/null históricos preservados. Schema aditivo/checkpoints permitem revisão; restaurar código não autoriza banco antigo sobre operações novas. Aplicação operacional não é QA e requer backup/ensaio/procedimento próprio. A classificação B preserva snapshot/custo de escrita/RSS a acompanhar/restore operacional não homologado e favicon; não há SLA ou produção pronta. Fechamento local autorizado separadamente e concluído; nenhuma publicação ou execução da V1.3 foi iniciada.
