# Modelo de ameaças inicial

## Atualização de governança — 05/10/2026

Referência desejada: [mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md), §§15–17; implementação e limites abaixo continuam locais. [Auditoria](../auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md) registra o replay legado comprovado, não mais apenas variabilidade abstrata de idempotência.

Riscos a especificar: confusão organização/entidade/unidade durante migração; usuário de cliente alcançando funções de plataforma; alteração local de entitlement/estação; comprometimento de endpoint/Agente alcançando Tier 0; licença offline copiada/expirada; cadeia de release ou backups comprometidos. Controles alvo: APIs fail-closed, planos separados, identidade revogável, autorização offline assinada, cloud-only crítico, releases assinados, recuperação protegida e incidentes com evidências. Não há exploração ou nova certificação nesta revisão. [Fases B–E](ROADMAP.md) ordenam correção/especificação sem ativá-las.

Estado atual em **03/10/2026**: Fundação V1.2 fechada localmente, checkpoint `2a2177c7b80734722f71bd9e72029cf9e1b39df0`: **B — homologação condicional, 610/610 aprovados**, migrations **001–010**, seis agregados relacionais. Versão **1.2.0-foundation.1**; fechamento local concluído, com tag `v1.2.0-foundation.1`. Evidências e limites no [estado consolidado V1.2](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md); [V1.1](../atualizacoes/v1.1/FOUNDATION_V1_1_REPORT.md) permanece histórico. Esta revisão documental não verifica nem altera o banco operacional e não certifica produção/cloud.

## Ativos e limites de confiança

Ativos: dados pessoais, vendas, preços/custos, saldos, pagamentos, estoque, auditoria, sessões, credenciais futuras, autorização de assinatura e disponibilidade da loja.

Limites ATUAIS no código: navegador → API autenticada/DTO; API → SQL/espelhos/auditoria; empresa A → empresa B; unidade/usuário → documento/agregado; aprovador → grant/prova de venda excepcional; administrador local → arquivos/relógio. Cliente Windows/Edge → nuvem, webhook → domínio, suporte remoto e atualização distribuída são limites PLANEJADOS, ainda sem implementação.

## Controles e riscos residuais ATUAIS

| Cenários | Controle no candidato Fundação V1.2 | Limite residual |
| --- | --- | --- |
| TM-01 / TM-08 | Argon2id, sessão hash/expiração/inatividade, troca/reset administrativo, revogação e manutenção, status/vínculos revalidados | Recuperação global/e-mail, MFA/passkeys/biometria e dispositivos futuros; host comprometido pode furtar credenciais |
| TM-02 / TM-14 | Contexto de sessão, escopo composto SQL, RBAC/DTO allowlist, IDs/exports restritos; resposta completa exige cinco leituras, parciais exigem direito do domínio | IA ausente; snapshot completo compatível continua restrito; novos endpoints devem preservar o contrato e não retornar extras |
| TM-03 / TM-04 | Domínio no servidor, estado fresco/transação, versões 409/replay de cadastros menores e venda, guarda de saldo/histórico; grant excepcional de senha real, uso único/CAS e confirmação atômica | Idempotência varia em legados; outros tipos de exceção não recebem aprovação automática; preview/expectedOffer não são autoridade |
| TM-05 / TM-07 | SQL transacional, WAL/FKs, migrations 001–010, seis agregados/espelhos/âncora técnica, JSON preservado; backup consistente/validação/retenção e restore sintético isolado | Sem criptografia/proteção externa ou procedimento da loja/DR real/RPO/RTO homologados; disco/administrador seguem ameaça; snapshot/escrita custam recursos |
| TM-06 | Executor verificado, trilha append-only/hash encadeado; authorized_by só com prova opaca vinculada a contexto/epoch/venda, motivo/nome/papéis históricos do aprovador | Administrador do arquivo pode remover/reconstruir a trilha; autoria antiga não é inventada; sem âncora externa |
| TM-10 / TM-13 | SQL parametrizado, sanitização de auditoria, erros internos genéricos, Host/Origin/CSRF, teto de corpo e KDF/tentativas locais | Não demonstra imunidade a XSS, exaustão pública ou configuração indevida; rate limit distribuído pendente |
| TM-09 / TM-11 / TM-12 | Nenhuma cobrança, sincronização Edge, conector ou atualização desktop foi incluída | Autorizações offline, assinatura de webhook e distribuição assinada ainda são projeto futuro |

[Estado/homologação V1.2](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md), [acesso](ACCESS_V1_2.md), [operação](OPERATIONS_V1_2.md) e [Vendas](SALES_V1_2_MODEL.md) descrevem o candidato atual. V1/V1.1 preservam evidências históricas. Banco da loja não é massa de QA. Não publicar servidor loopback como SaaS nem tratar namespace/cadeia de hash local como proteção contra administrador capaz de modificar arquivos/mecanismo; âncora externa é futura.

### Riscos específicos da transição — ATUAL V1.2

- SQL/espelho divergente: hidratação/comandos interrompem a operação, sem repopular SQL silenciosamente do JSON. Leituras paginadas confiam em revisão/marcador do agregado preparado; não são verificação integral de cada campo a cada GET. Administrador do arquivo ainda pode adulterar ambos.
- Saldo/histórico adulterado: comandos recusam apagar/alterar movimentos/entradas antigos e exigem novos movimentos que expliquem deltas globais/físicos. Escrita técnica de importação/fixture permanece interna, sem bypass no body; âncora antiga explícita não prova origem/autoria inexistente. FKs não cobrem todo documento ainda em snapshot.
- Autorização roubada/reusada ou aprovador revogado: grant hash-only de até 120 segundos vincula draft/produtos/executor/sessão/escopo; senha/hash/membership/direitos revalidados depois do await e na confirmação. Consumo CAS/venda/auditoria atômicos, rollback devolve consumo, retry não duplica. Prova clonada/forjada ou de outro epoch não autoriza; item permanece inativo. Token não vai para browser storage. Purge automático é conservador e preserva evidência permanente; PIN/biometria e proteção contra administrador/relógio comprometido não existem.
- Ampliação de privilégio no upgrade: migration concede sales.authorize_inactive somente a papéis com todos os 18 direitos anteriores explícitos, uma vez e com journal/auditoria. Revogação não é reposta por seed; cargo nunca concede automaticamente. Gestão legítima de papéis ainda exige proteção da conta administrativa.
- Exaustão: limites de corpo/paginação/KDF/tentativas são locais. Escritas materializam/reconciliam estado; índice/acumuladores/lookup locais reduziram percursos, sem eliminar gargalo large ~2 s. Estado/Financeiro crescem; RSS merece acompanhamento, sem leak comprovado/ausência comprovada. Grants/convites têm purge conservador; limites distribuídos/hardening cloud permanecem futuros.
- Recuperação: backup/agendamento/retenção/restore isolado existem, mas validação sintética não garante disponibilidade após falha física. Downgrade/JSON antigo podem perder vínculos/dados; procedimento operacional da loja, cópia externa, DR real e RPO/RTO continuam futuros.

## Cenários históricos — diagnóstico V0.12 de 01/10/2026

A coluna “situação atual” desta tabela registra a baseline anterior à Fundação V1. Os controles atualizados estão na tabela acima; os cenários e sua prioridade continuam referências para a evolução.

| ID / prioridade | Ativo e ameaça | Situação atual / controle existente | Mitigação PLANEJADA | Risco residual ou decisão |
| --- | --- | --- | --- | --- |
| TM-01 / alta | Operações: chamar API sem passar pelo login | Login fictício; loopback restringe rede, API sem autenticação | Sessão real e autorização em toda ação | PC local continua ambiente não confiável |
| TM-02 / crítica antes de SaaS | Dados de outra empresa: trocar IDs/tenant na requisição | Tenants não existem; estado global único | Ownership, contexto verificado, consultas restritas e testes A contra B | Todas as rotas/exports/jobs precisam manter o escopo |
| TM-03 / alta | Dinheiro/estoque: adulterar preço, saldo ou perfil no cliente | Validação comercial parcial no backend; perfil real ausente | Regras no servidor, permissões e aprovação vinculada | Inventariar entradas e cálculos de cada operação |
| TM-04 / alta | Financeiro: reenviar pagamento/venda ou concorrer por último item | Idempotência/versão em vários fluxos; não uniforme | Chaves persistentes, transações e concorrência testada | Idempotência não valida identidade nem substitui lock |
| TM-05 / alta | Base: editar/excluir/roubar JSON ou rascunhos | Arquivos locais sem criptografia de aplicação; permissões do SO dependem da máquina | Minimização, proteção local, centralização e backups protegidos | Máquina comprometida não oferece inviolabilidade |
| TM-06 / alta | Histórico: alterar arquivo ou alegar aprovador falso | Responsáveis declarados; trilha editável | Identidade verificada, trilha protegida, suporte auditado | Registros antigos não ganham autoria retroativa |
| TM-07 / alta | Disponibilidade/integridade: disco falha ou instâncias sobrescrevem estado | Temporário/rename e validação; sem coordenação multiprocesso | Banco transacional, backup/restauração e recuperação testada | RPO/RTO A DEFINIR |
| TM-08 / alta | Sessão/dispositivo: furto e reuso de credencial | Não há sessão real/dispositivo registrado | Expiração, revogação, reautenticação e MFA conforme risco | Revogação offline sofre atraso até reconexão/prazo |
| TM-09 / alta | Assinatura: ficar offline, voltar relógio, restaurar cópia | Assinatura/offline cloud não implementados | Autorização offline assinada, prazo e reconciliação central | Prazo, relógio confiável e bloqueio A DEFINIR; não prometer inviolabilidade |
| TM-10 / alta | Secrets/dados: vazar em bundle, log ou acesso de suporte | Gestão cloud inexistente | Secrets no servidor, acessos limitados, logs minimizados e rotação | Revisar exports, dumps, suporte e CI/CD |
| TM-11 / alta | Integrações: webhook falso/repetido, evento fora de ordem | Conectores externos não existem | Assinatura, replay, idempotência, estados e reconciliação | Provedor e seus contratos A DEFINIR |
| TM-12 / alta | Cliente: atualização/dependência comprometida | Sem instalador/atualizador ou pipeline cloud | Verificação de atualização, assinatura, proveniência e revisão de dependências | Cadeia de distribuição precisa de procedimento operacional |
| TM-13 / média local, alta remoto | Interface/API: entrada maliciosa, XSS, upload, exaustão | Há escape/validações/limites; cobertura não auditada integralmente | Revisão de saída/entrada, cabeçalhos adequados, rate limit e upload protegido | Não afirmar imunidade a XSS apenas por helper de escape |
| TM-14 / alta futura | IA/relatórios: revelar tenant ou executar ação indevida | IA ausente; relatórios locais sem RBAC | Escopo e permissões comuns, auditoria e revisão de ações | IA deve respeitar todos os limites de acesso |

## Validação a incorporar

Printing/Commerce, **PLANEJADO**, 02/10/2026: considerar confusão de conta/tenant em webhook/job, vazamento/roubo de credencial externa, notificação repetida/fora de ordem, saldo publicado defasado, repetição após timeout ambíguo e conteúdo malicioso em etiqueta/documento. Edge adiciona riscos de comando arbitrário, destino de rede/arquivo livre e dispositivo revogado. Mitigações e testes negativos estão em [SECURITY](SECURITY.md), [Printing](PRINTING_AND_DEVICES.md) e [Commerce](COMMERCE_HUB.md); nenhum desses controles futuros foi implementado nesta tarefa.

Testar chamada direta à API, leitura/escrita/export de empresa alheia, usuário sem permissão, sessão/dispositivo revogado, reenvio idêntico e alterado, conflito de versões, falha de persistência e recuperação. Para offline: fila duplicada, dois caixas com última unidade, relógio alterado e autorização expirada.

Usar ambiente e dados isolados. Segurança é critério de entrada para publicação, não uma etapa a adicionar depois. As prioridades indicam impacto arquitetural e não contagem de vulnerabilidades exploradas nesta tarefa. Manter este documento ao mudar qualquer limite de confiança.
