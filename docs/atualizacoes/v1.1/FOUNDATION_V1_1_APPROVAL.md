# Aprovação excepcional — passo 8

**Registro histórico da entrega V1.1, 02/10/2026.** As referências à ausência de purge/recuperação pertencem àquela etapa; a regra de exceção permanece, com manutenção posterior em [ACCESS_V1_2](../../atual/ACCESS_V1_2.md). [Estado atual homologado](../v1.2/FOUNDATION_V1_2_REPORT.md). Corpo e contagens originais preservados.

**IMPLEMENTADO no código**, sujeito à regressão completa/ensaio e aplicação da entrega. Necessidade do Murilo: vender produto desativado mediante identidade confirmada, motivo e registro de quem executou e quem liberou. Produto continua desativado.

## Regra consolidada por Produto e Segurança

Primeiro fluxo: venda direta. Executor precisa de sales.create e leituras de catálogo/vendas; quem libera precisa do novo direito explícito sales.authorize_inactive na mesma empresa/unidade, com vínculos e conta ativos. O próprio executor pode liberar se tiver esse direito e confirmar novamente a senha. Não impor outra pessoa sem requisito, não interpretar sales.create como poder de liberação. PIN/biometria não serão usados: autenticação existente por login/senha Argon2id.

Motivo obrigatório, de 1 a 500 caracteres após trim. Grant aleatório de uso único, até 120 segundos, vinculado a executor, sessão, empresa, unidade, tipo de operação, requestId, conteúdo canônico da venda e versões/situação dos produtos. Hash do grant no SQL; senha/token não entram em snapshot, auditoria, logs ou armazenamento do navegador. Não trocar a sessão do executor para a pessoa que autoriza.

Hash de senha fora da transação; limites de tentativas e custo usam a identidade atual. Revalidar contexto, usuário/hash/permissões após o await dentro de transação. Credencial inexistente/errada/inativa ou sem direito não revela a causa individual.

Consumo da autorização, venda, estoque, recebimentos, histórico e auditoria confirmados juntos. Revalidar executor e autorizador, expiração, escopo, fingerprint, versões e permissão na confirmação. Reenvio da venda já confirmada retorna resultado idempotente, sem nova venda ou autorização; alterações de conteúdo e reutilização em outra operação são recusadas. Falha SQL desfaz também o consumo da autorização. Aprovação não dispensa preço, saldo, cliente, caixa ou regras de embalagem.

Registrar approvalId, executor e autorizador verificados, nome e papéis históricos do autorizador na unidade, motivo/data e quais itens estavam inativos; não marcar itens ativos como exceção. Auditoria aceita autoria excepcional somente mediante prova interna validada. Não aceitar authorizedBy ou outra identidade no corpo como autoridade.

## Concessão inicial do novo direito — IMPLEMENTADA

[007_inactive_sale_approval.sql](../../../foundation/migrations/007_inactive_sale_approval.sql) adiciona sales.authorize_inactive e o concede uma única vez somente aos papéis que já contêm todas as 18 permissões anteriores explícitas. Papéis parciais não recebem o direito. `inactive_permission_upgrade` registra a concessão técnica e `seedPermissions` acrescenta auditoria encadeada uma única vez, sem atribuir ator histórico ou unidade inventada. Depois o direito pode ser revogado independentemente; seed/reinício não o repõe. Papéis de novos proprietários recebem o catálogo atual de 19 permissões no bootstrap existente. Nenhum privilégio implícito pelo nome do cargo.

## Contratos e persistência ATUAIS

`POST /api/commercial/sales/inactive-approval` recebe `{saleDraft,approverLogin,approverPassword,reason}` e devolve `{approvalToken,approvalId,expiresAt}`. `POST /api/commercial/sales` recebe o mesmo draft com `approvalToken`. Campos comerciais e estruturas aninhadas são explicitamente permitidos; identidades e campos adicionais são recusados. Fingerprint canônico inclui identificação, conteúdo comercial e expectedCashSessionId; exclui apenas approvalToken e responsible declarado, pois executor vem da sessão. Os limites comerciais e validações de preço/caixa/estoque continuam aplicáveis.

[inactive-sale-approval.js](../../../foundation/inactive-sale-approval.js) usa `inactive_sale_approvals`: token somente hash, fingerprint/hash dos produtos selecionados, sessão/executor/escopo, autorizador/nome/papéis/hashes técnicos, motivo, instantes, consumo e vínculo à venda. Não gravar senha ou token cru em documentos comerciais, auditoria, log ou armazenamento do navegador. Alteração de cadastro/estoque/preço/versão/situação após emissão invalida autorização pendente; senha/direitos/vínculos/conta do autorizador são revalidados após await e na confirmação.

O relógio confiável é o da Identity registrada no runtime. A prova de consumo é opaca, guardada em WeakMap, vinculada à instância SQL e ao epoch da transação. Depois é vinculada ao ID e fingerprint da venda. Objeto copiado/forjado/prova após COMMIT ou ROLLBACK não autoriza. `saveBusinessState` aceita prova interna, registra metadata na nova venda e apenas nos movimentos dos produtos realmente desativados; `audit_events.authorized_by` somente aceita essa prova. Credenciais negadas geram evento genérico confirmado separadamente da negativa, sem registrar login tentado/senha ou criar grant/venda.

Não há purge automático dos grants expirados ou recuperação de senha nesta etapa; política de retenção continua pendente. Limites de tentativas/KDF são locais ao processo, como na autenticação atual. Backup/ensaio precedem migration operacional; schema é aditivo. Não substituir o banco por snapshot antigo nem presumir downgrade automático após operações novas.

## Evidências de testes do módulo

[inactive-sale-approval.test.js](../../../foundation/inactive-sale-approval.test.js): **12 testes específicos passaram**, cobrindo hash-only/segredos/motivo/DTO, credenciais/conta/direito negados com resposta genérica, autoautorização explícita, fingerprint/caixa, identidade nos itens inativos, adulteração/contexto/sessão, produto alterado, prazo/revogação, revogação após await, prova forjada/epoch, rollback de consumo e grant inicial único/revogável sem cargo implícito. Verificações HTTP, regressão completa e visual são coordenadas separadamente e constam do relatório final da etapa.

## Aceite e limites

Testar senha/motivo/perfil, outro tenant/unidade/sessão, requestId ou conteúdo adulterado, estoque/preço/versão mudados, expiração, revogação após senha e após grant, concorrência/replay e rollback auditado. Cadastro permanece inativo. Fluxos de orçamento/reserva não recebem liberação automática. Aprovações e tokens não são uma proteção contra administrador do computador local. Passo 8 concluído: 12 testes unitários e 21 HTTP, incluindo permissões, isolamento, revogação, concorrência/replay e rollback. A regressão final de 457 testes e a conferência visual estão no [relatório](FOUNDATION_V1_1_REPORT.md). O preview da venda calcula preço sem consumir grant, gravar venda ou conferir autoridade excepcional; só a confirmação com prova válida pode liberar o item.
