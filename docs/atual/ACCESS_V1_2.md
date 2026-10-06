# Acesso, sessões e manutenção — Fundação V1.2

Desenho registrado em 02/10/2026 antes da migration 008; estado atualizado no fechamento local em **03/10/2026**. Passos 3–5 implementados/integrados no runtime e interface, homologação global **B, 610/610**, migrations 001–010, versão **1.2.0-foundation.1**. [Estado/fontes](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md). Não declara publicação remota, MFA ou confiança de dispositivo.

## Decisões e compatibilidade

Identidade e senha são globais; vínculos/permissões pertencem à empresa/unidade. A troca voluntária exige senha atual real, nova senha e confirmação, política existente (12–128 caracteres), Argon2id, Origin/CSRF e revalidação depois de cálculos assíncronos. Troca e reset revogam todas as sessões: o usuário entra novamente, sem preservar a sessão atual. Invalidam convites de recuperação e grants pendentes em que o usuário executa ou autoriza. Auditoria e atualização são transacionais.

Reset exige `users.reset_password`, senha real do executor e motivo. Reset próprio é recusado. Alvo deve estar ativo e vinculado à unidade atual; qualquer vínculo em outra empresa, inclusive inativo, impede reset global por administrador de tenant. Direitos ativos do alvo nas unidades da empresa não podem exceder os direitos do executor no contexto. Revalidar essas condições na emissão e conclusão. Não informar dados de outra empresa.

O administrador recebe um código aleatório novo uma única vez; não vê senha/hash anteriores nem recupera código armazenado. Código de 32 bytes, hash-only, 15 minutos, uso único; o usuário escolhe sua própria nova senha na tela pré-login. Na emissão, substituir a senha anterior por Argon2id de uma credencial aleatória nunca exposta e revogar sessões: senha anterior não funciona durante recuperação. Expiração exige novo convite. Não há senha universal nem backdoor para recuperar o único administrador.

Migration 008 aditiva: convites e journal de upgrade do direito, sem mudar colunas existentes ou checksums 001–007. Conceder o novo direito uma única vez aos papéis com todos os 19 direitos V1.1 explícitos. Nome do papel não concede privilégio; revogação não é reposta no seed. Backup/ensaio isolado antes de migração operacional; schema aditivo preservado, sem downgrade automático.

## API e interface

| Operação | Entrada | Resultado |
| --- | --- | --- |
| POST `/api/auth/password/change` | currentPassword, newPassword, confirmPassword | changed, loggedOut |
| POST `/api/foundation/password-reset` | id, operatorPassword, reason | resetCode (somente nesta resposta), resetId, expiresAt |
| POST `/api/auth/password/reset` | login, resetCode, newPassword, confirmPassword | changed, loggedOut; não inicia sessão |
| GET `/api/auth/sessions` | sessão própria | sessions: id, current, createdAt, lastSeenAt, expiresAt, origin Local |
| POST `/api/auth/sessions/revoke` | sessionId próprio | revoked, loggedOut |
| POST `/api/auth/sessions/revoke-others` | objeto vazio | revoked, count |

POSTs exigem JSON, Origin e CSRF; conclusão de recuperação usa pré-login. IDs de sessão não são tokens. Listagem só mostra sessões próprias ainda ativas; não inventa fabricante/dispositivo confiável. Falhas de credencial/código usam mensagens genéricas; rate limit/KDF existentes limitam tentativas. Corpo com campos não previstos é recusado. Nenhuma senha/código/hash vai para auditoria, logs, snapshots ou armazenamento do navegador. Na interface, código de recuperação é temporário em memória e copiado manualmente; nunca enviado por mensagem automaticamente.

## Grants temporários e retenção

Validade de aprovação existente permanece 120 segundos. Purge limitado e transacional: não consumidos expirados há pelo menos 24 horas; consumidos há pelo menos sete dias, somente se venda, vínculo de aprovação e metadados permanentes forem conferidos. Inconsistência impede remoção do registro afetado e é reportada. Convites consumidos/revogados/expirados são transitórios e removíveis após 24 horas. Prazo de retenção pode ser aumentado na configuração, sem apagar registros válidos.

Não apagar `audit_events`, vendas, itens, movimentos ou metadados de execução. Retry comercial procura venda/fingerprint antes do grant; manter essa ordem, permitindo reenvio idêntico após purge sem duplicar operação. Replay de código removido não encontra grant válido. Revogação de sessão remove grants ainda não consumidos dessa sessão; auditoria de emissão/revogação permanece.

Manutenção na inicialização e periodicamente, com lote limitado e timer que não mantém o processo vivo; parada explícita antes de fechar SQLite. Falhas geram estado operacional sanitizado e callback, sem expor SQL/secrets. Não purgar sessões históricas nesta etapa.

## Aceite e limitações

Testes isolados: troca/erro/confirmação/política, reset autorizado/sem direito/multiempresa inclusive vínculo inativo/privilégio superior, revalidação durante KDF, convite expirado/replay/reemissão, revogação backend, IDs de outro usuário, rollback de auditoria, purge e retry comercial, preservação de cadeia/metadados históricos. Nunca usar banco da loja como massa de teste.

Limites: controle local de tentativas, relógio do host e administrador do computador; sem MFA, recuperação por e-mail, secret manager/cloud ou modelo de dispositivo confiável. Reset multiempresa exige outra solução futura de identidade global; não contornar isolamento por um administrador de tenant.

## Implementação e evidências locais

Backend em [identity.js](../../foundation/identity.js) / [auth-maintenance.js](../../foundation/auth-maintenance.js), catálogo em rbac.js, migration 008. [Runtime](../../foundation/runtime.js) inicia e interrompe manutenção antes de fechar SQLite; [foundation-operations.js](../../public/foundation-operations.js) integra telas de senha/reset/sessões. Export `startMaintenance(runtime, options)` retorna `{status, run, stop}`; `maintainAuth(runtime, options)` permite ensaio direto isolado. Configuração: unusedMs ≥ 24h, consumedMs ≥ sete dias, resetMs ≥ 24h, batchSize 1–1000 (padrão 100), intervalMs ≥ 1s (padrão cinco minutos), onError recebe somente code sanitizado. Timer unref; falha/inconsistência permanece visível em status.lastError.

**Histórico de 02/10/2026:** 26/26 específicos em access-v1-2.test.js; predecessora identidade/aprovação/RBAC 49/49. Fixtures da 007 congelam os 18 códigos históricos; upgrade 008 comprova 19 direitos prévios explícitos/concessão única. Esses totais pertencem à rodada e não substituem os **610/610 globais de 03/10**. A homologação final cobriu revalidação/rollback/recuperação, sessões e purge conservador, incluindo SQL de Vendas e preservação de metadados permanentes; [relatório geral](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md).
