# Versionamento local do código

Git local inicializado em 02/10/2026, branch `main`, sem remoto/publicação. Baseline V1.1: commit `79b418a`, tag `foundation-v1.1-baseline`, obtida antes de alterações V1.2 após 457 testes. Migrações preservam bytes/checksums (`.gitattributes` sem conversão de texto e `core.autocrlf=false`).

**ATUAL, 03/10/2026:** Fundação V1.2 **fechada localmente**, versão **1.2.0-foundation.1**, tag local anotada `v1.2.0-foundation.1`. Homologação **B, 610/610**, migrations 001–010. Checkpoint funcional `2a2177c7b80734722f71bd9e72029cf9e1b39df0` — Fundação V1.2: checkpoint do release candidate homologado; reconciliação documental em `33b4efc80bc0f3edf9c4b76873719d06e49cc323`. Condições B aceitas no fechamento local, sem nova homologação ou push. A tag anterior é de baseline, sem convenção de release numerado; a entrega usa `v` + versão e anotação. [Estado/fontes](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md), [registro do fechamento](../atualizacoes/v1.2/FOUNDATION_V1_2_CLOSURE.md).

Versionar código, testes sintéticos e documentação; nunca bancos, backups, códigos privados, ambientes, credenciais, logs, QA privado, dependências ou mídia histórica potencialmente privada. `.gitignore` é prevenção, não detector de secrets: revisar arquivos preparados e conteúdo antes de cada commit. A inspeção inicial não encontrou padrões de credenciais reais; senhas dos testes são explicitamente sintéticas.

Usar commits pequenos identificáveis e tag de entrega somente após testes/aceite. Versões seguem `MAJOR.MINOR.PATCH-foundation.N`; V1.2 adiciona capacidades compatíveis e schema aditivo. Não construir CI/CD nesta rodada. Configurar/publicar remoto depende de pedido explícito.

`git status`, `git log --oneline` e `git show foundation-v1.1-baseline:package.json` permitem revisar estado e baseline. Recuperar código pelo Git não restaura dados. Não abrir banco com schema novo em código antigo nem substituir a loja por JSON histórico; recuperação de dados exige o procedimento de backup/restore e compatibilidade correspondente. Backups e evidências de QA permanecem fora do histórico.
