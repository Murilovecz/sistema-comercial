# Operação e recuperação — Fundação V1.2

Contrato registrado antes dos passos 6–8; reconciliado em **03/10/2026** como implementado/integrado e homologado sinteticamente na Fundação V1.2 fechada localmente, **B, 610/610**, migrations 001–010, versão **1.2.0-foundation.1**. [Estado/fontes](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md). Backup local não substitui cópia externa/cloud; sem promessa de RPO/RTO ou DR de produção.

## Backup e compatibilidade

O servidor usa `node:sqlite.backup`, que inclui dados confirmados no WAL, sem copiar simplesmente o arquivo aberto. Cada pacote contém `database.sqlite` e `manifest.json`. Pasta temporária só vira pacote final após integridade, foreign keys, checksum e migrations conferidos. Manifest: `formatVersion:1`, `id`, `createdAt`, `appVersion`, `database:{filename,sizeBytes,sha256}`, `schema:[{version,checksum}]`, `validation:{integrity,foreignKeys,scopes}`. Não há secrets/conteúdo comercial no manifest; banco contém dados privados/credenciais hash, exigindo acesso restrito no SO.

As migrations do pacote precisam corresponder a um prefixo conhecido, com checksums originais. Schema desconhecido/alterado ou manifest divergente falha explicitamente. Restore não aplica migrations nem reimporta JSON histórico. Backup antigo conhecido pode ser restaurado como cópia para revisão; abrir essa cópia com aplicação posterior é outra etapa e pode migrar seu schema.

A cópia consistente é selada em journal DELETE antes de calcular seu checksum; a origem operacional permanece em WAL. Assim o pacote não depende de arquivos auxiliares mutáveis durante validação/restauração.

## Configuração e execução

Defaults técnicos configuráveis: habilitado fora de testes, intervalo de 6 horas, retenção de 30 dias e mínimo de 3 backups válidos. `:memory:` não produz backup. Configuração por `options.backup` ou variáveis `BACKUP_ENABLED`, `BACKUP_DIR`, `BACKUP_INTERVAL_MS`, `BACKUP_RETENTION_DAYS`, `BACKUP_MIN_VALID`; limites são validados. Em testes o default é desabilitado e banco/pasta precisam ser isolados. O primeiro backup ocorre após runtime pronto, fora de transação. O processo precisa permanecer aberto para executar o agendamento.

Geração e purge compartilham lock exclusivo da pasta. Falha é registrada sem abortar venda. Purge só considera pacotes próprios válidos, preserva o mínimo e não apaga o único válido. Pacotes inválidos/temporários ficam disponíveis para investigação e não contam como proteção. Não seguir links simbólicos/junctions; não excluir fora da pasta configurada.

## Recuperação isolada

Ferramenta implementada: `node scripts/restore-local-sql.js PASTA_DO_PACOTE DESTINO_NOVO.sqlite`. Destino novo fora da pasta operacional/pacote; aliases/links recusados. Confere manifest/checksum/schema/integridade/FKs antes/depois e gera `DESTINO_NOVO.sqlite.restore-report.json`. Recusa sobrescrever arquivos, origem/banco operacional. Nenhum restore é aplicado automaticamente à loja.

Em falha, manter a origem e os backups anteriores. Um lock residual de processo interrompido exige conferir que nenhum gerador/servidor está usando a pasta; retirar somente o arquivo `.backup.lock` após essa conferência. Não remover pacote para liberar espaço sem conferir outras cópias válidas. Restauração operacional e troca de banco exigem procedimento separado com servidor parado, cópia de segurança e confirmação de compatibilidade; esta entrega implementa restore isolado.

## Critérios de aceite

Testes somente em bancos sintéticos isolados: backup captura WAL; manifest/checksum/schema coerentes; corrupto recusado; lock bloqueia concorrência; falha não publica pacote; retenção preserva mínimo válido mesmo com arquivos inválidos; restore novo preserva dados de identidade, unidade, agregados e auditoria; integridade/FKs conferidas. Registrar resultados reais após executar testes e ensaio, sem declarar certificação geral.

## Evidência dos passos 6–8 — 02/10/2026

Implementados `foundation/backup-service.js` e `scripts/restore-local-sql.js`. **18 testes novos + 1 teste legado de backup, 19/19 aprovados**, sem banco operacional. O ensaio executa geração, restore pela função e pela CLI, abertura read-only do restaurado, equivalência dos cinco agregados comerciais, conferência da identidade e cadeia da auditoria. Há casos negativos para manifest/checksum/schema, foreign keys adulteradas com checksum recalculado, WAL externo, destino operacional/existente, sidecars preexistentes, junctions, raiz inacessível, geração concorrente, falha e retenção. Resultado salvo em `.qa/foundation-v1-2/backup-results.txt`; bancos sintéticos e relatórios de restore ficam em `.qa/foundation-v1-2/backup-tests/`.

Esses **19/19 são históricos da rodada de 02/10**, com cinco agregados à época. O runtime atual inicia backup após preparação e interrompe o serviço antes de fechar SQLite. Homologação de 03/10 validou ciclo backup→retenção→restore com Argon2/login real, **seis agregados**, migrations/integridade/FKs, estados/revisões/marcadores, três escopos A1/A2/B1 e auditoria; digest de todas as tabelas coincide antes do login novo. [Teste cruzado](../../foundation/v1-2-homologation.test.js) e [resultado global 610/610](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md). Nenhuma restauração foi aplicada à loja. `runNow()` e `purge()` são entradas locais programáticas; sem endpoint público de restore.

**NÃO VALIDADO COMO PRODUÇÃO:** procedimento operacional da loja/troca de banco, disaster recovery real, RPO/RTO, falha física, disponibilidade prolongada ou infraestrutura externa. Retenção implementada é local, configurável e dependente do processo aberto; não é armazenamento externo protegido. Esses critérios precisam de tarefa própria, sem usar banco da loja como massa de QA.

Manifest/checksum detectam corrupção e divergência; não autenticam um banco contra alguém que consegue alterar simultaneamente banco e manifest. Não há assinatura/criptografia de pacote ou proteção absoluta contra administrador da máquina. Restore recusa também arquivos auxiliares preexistentes do destino; validação recusa sidecars do pacote selado antes de abrir SQLite.
