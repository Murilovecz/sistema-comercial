# Segurança

## Direção vigente e gaps — 05/10/2026

[Documento Mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md), §§4, 11–12 e 15–17, é a referência normativa. Os controles V1.2 abaixo são **ATUAIS locais**, não garantias de implantação SaaS ou de estação confiável.

**APROVADO / PLANEJADO:** cloud autoridade; plano administrativo da plataforma separado do cliente; backend valida tenant/entidade/unidade, entitlement, permissão, escopo, estação e operação. Nenhum cliente acessa banco cloud. Endpoint/LAN/Agente são não confiáveis; identidades por instalação, privilégio mínimo, revogação granular e proteção independente de Tier 0. MFA/step-up proporcionais ao risco; a tendência de security keys obrigatórias na administração de produção ainda exige especificação.

Offline requer autorização cloud assinada/temporária/limitada, sem autorrenovação e com fail-closed das capacidades protegidas; configuração crítica/administrativa é cloud-only. Atualizações/release são assinados, com rollout e ponto seguro. Secrets centrais ficam em cofre adequado fora do cliente/Git/logs; backups/recuperação protegidos e separados da produção, auditoria append-only e resposta a incidentes verificável. Números/fornecedores/mecanismos são abertos, não garantias já implantadas.

**Gap comprovado:** venda legada sem `requestId` admite duplicação; proteção contra replay não é opcional em operação crítica. [Auditoria](../auditorias/TECHNICAL_GAP_ANALYSIS_2026_10_05.md); fase B isolada com TDD/compatibilidade. Entitlement/dispositivo/Agente/sync/updater não existem. A especificação técnica de segurança derivada dos 14 blocos, com requisitos/testes, é futura nas fases C–E e incrementos pertinentes; esta rodada não implementa nem homologa esses controles.

## ATUAL no código — Fundação V1.2 fechada localmente

Estado atual em **03/10/2026**: Fundação V1.2 fechada localmente, checkpoint `2a2177c7b80734722f71bd9e72029cf9e1b39df0`: **B — homologação condicional, 610/610 aprovados**, migrations **001–010**, seis agregados relacionais. Versão **1.2.0-foundation.1**; fechamento local concluído, com tag `v1.2.0-foundation.1`. Evidências e limites no [estado consolidado V1.2](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md); [V1.1](../atualizacoes/v1.1/FOUNDATION_V1_1_REPORT.md) permanece histórico. Esta revisão documental não verifica nem altera o banco operacional e não certifica produção/cloud.

O servidor principal escuta em loopback `127.0.0.1`; configuração de produção é recusada. Login real usa Argon2id, com salt aleatório por senha e custos limitados. O primeiro responsável escolhe suas credenciais, sem senha padrão, usando código aleatório privado de instalação; setup exige loopback, CSRF, Host/Origin permitido e ausência de usuários, conferida novamente em transação.

Sessão opaca fica em cookie HttpOnly/SameSite=Strict; o banco guarda seu hash. Prazo padrão: 12 horas, com inatividade máxima de 30 minutos. Logout revoga sessão. Usuário, empresa, unidade, vínculos e permissões são revalidados a cada requisição, incluindo dentro da transação comercial. CSRF fica apenas em memória da interface e vincula-se ao contexto; headers de empresa/unidade detectam aba desatualizada, sem conceder autoridade. Senha incorreta, login inexistente e usuário inativo não distinguem a causa pública.

RBAC nega rotas desconhecidas e exige permissões no backend. Catálogo atual contém **20 códigos explícitos**, incluindo users.reset_password. Snapshot comercial/exports exigem as cinco leituras; escritas também sua ação. DTOs allowlist não liberam snapshot bruto a perfis parciais. Lista/detalhe de Vendas são SQL sem payload completo; detalhe financeiro exige financial.view e filtros financeiros não integram a allowlist. MinStock por ID exige inventory.view; custo recebido exige financial.view. IDs/estado vêm do contexto verificado; export pertence à sessão/empresa/unidade. Administração não altera vínculos de outra empresa ou concede direitos superiores aos do operador; há proteção contra perda do próprio acesso administrativo. Interface completa exige as cinco leituras.

### Senhas, sessões e manutenção ATUAIS

Troca própria exige senha atual real, nova senha/confirmação e política de 12–128 caracteres (até 512 bytes UTF-8). Reset administrativo exige users.reset_password, senha real do executor e motivo; recusa reset próprio, alvo fora da unidade, vínculo em outra empresa inclusive inativo e privilégios superiores. Código hash-only de 15 minutos/uso único permite ao alvo escolher nova senha no pré-login; a senha anterior fica inutilizável desde a emissão. Troca/reset revogam todas as sessões e grants pendentes relacionados ao usuário, exigindo novo login. Sessões próprias podem ser listadas/revogadas individualmente ou em conjunto preservando a atual; IDs de terceiros são recusados. Revalidação após KDF e auditoria/transação preservam rollback. Sem recuperação por e-mail ou backdoor para o único administrador.

auth-maintenance inicia no runtime e faz purge conservador de grants/convites transitórios, preservando venda/motivo/autoria/auditoria e grants consumidos sem evidência consistente. Timer para antes de fechar SQLite; não constitui identidade de dispositivo ou monitoramento distribuído. [Contratos e evidências](ACCESS_V1_2.md).

Tabelas comerciais normalizadas, espelhos, índice e auditoria são gravados juntos. A trilha identifica executor, escopo e antes/depois sanitizados; triggers impedem update/delete e hashes encadeados detectam alterações simples. Consulta de auditoria restringe before/after ao domínio permitido. O administrador do arquivo pode remover/reconstruir a trilha: não é prova inviolável nem possui âncora externa. O histórico `auditLog` declarado permanece intacto, sem autoria retroativa. `authorizedBy` só é preenchido por prova interna de aprovação válida; nomes digitados não comprovam liberação.

### Aprovação excepcional implementada para venda direta

Executor exige catalog.view + sales.view + sales.create. Aprovador usa login/senha real Argon2id e precisa de sales.authorize_inactive, conta/vínculos ativos na mesma empresa/unidade. O próprio executor pode liberar se possuir esse direito e confirmar a senha. Motivo obrigatório; item continua desativado. Não há PIN/biometria nem extensão automática a orçamento/reserva.

Grant aleatório dura até 120 segundos; somente hash fica em `inactive_sale_approvals`. Vincula executor/sessão/escopo/requestId/fingerprint do draft/produtos. Senha/token cru nunca entram em snapshot, auditoria, logs ou armazenamento do navegador. Cálculo de senha ocorre fora da transação; contexto, hash da conta e direitos são revalidados depois do await e na confirmação. Credencial ausente/incorreta/inativa ou sem direito recebe negativa genérica. Tentativa negada registra evento genérico em transação separada, sem login tentado/senha e sem grant/venda.

Consumo SQL usa compare-and-swap na mesma transação de venda/estoque/auditoria. Prova opaca em WeakMap só vale na instância SQL, epoch da transação e contexto/fingerprint; depois é vinculada à venda. Objeto copiado/forjado ou prova depois de COMMIT/ROLLBACK não autoriza. Falha desfaz consumo e venda; retry da venda confirmada é conferido antes de consumir. Mudança de produtos/estoque/preço/versão ou revogação invalida a liberação pendente. Nome/papéis históricos, motivo e itens realmente inativos acompanham venda e movimentos correspondentes; itens ativos não são marcados como exceção. Preview/expectedOffer não concedem aprovação e não dispensam preço, saldo, caixa e demais regras.

Migration 007 concedeu o direito excepcional uma única vez a papéis com todos os 18 códigos anteriores explícitos; 008 concede reset aos 19 anteriores explícitos, com journal/auditoria técnica. Nome de cargo não concede privilégio; revogação não é reposta no seed/reinício. Purge automático conservador existe na V1.2; metadados permanentes e evidência são preservados. Tentativas/KDF são limitados localmente; administrador do computador/relógio comprometido não são neutralizados. [Aprovação histórica V1.1](../atualizacoes/v1.1/FOUNDATION_V1_1_APPROVAL.md) e [manutenção V1.2](ACCESS_V1_2.md).

### Integridade e recuperação

Seis agregados SQL usam escopo composto, espelho/revisão/marcador e transação. `saveBusinessState` impede alterar/apagar movimentos/entradas anteriores ou mudar saldo global/físico sem movimentos equivalentes. Importação/fixtures têm caminho técnico interno, sem bypass de body. Âncora histórica não inventa operação/autor. FKs cobrem relações comprovadas; documentos restantes usam domínio, sem FK universal. Auditoria encadeia hashes e sequência, com executor/escopo/autorizador/motivo quando comprovados. Falha reverte operação/consumo; replay válido não duplica efeitos nos fluxos cobertos. Cadeia local não neutraliza administrador capaz de editar SQLite e o mecanismo local; âncora externa continua futura.

[backup-service.js](../../foundation/backup-service.js) produz backup consistente, valida migrations/integridade/FKs/checksum, agenda e aplica retenção local. Restore em destino novo isolado foi validado sinteticamente com login real, seis agregados, tenant/unidade e auditoria. Isso não homologa procedimento da loja, disaster recovery real, RPO/RTO, falha física ou infraestrutura externa. Pacote/manifest podem ser reconstruídos por administrador com controle de ambos; não há assinatura/criptografia ou retenção externa protegida. Não restaurar JSON sobre SQL ou presumir downgrade sem perda. [Operação](OPERATIONS_V1_2.md).

SQLite, JSON preservado e rascunhos continuam sem criptografia de aplicação. Namespace separa identidade/empresa/unidade, mas não protege contra XSS/administrador local. Gestão de dispositivos, MFA/passkeys/biometria/Windows Hello, atualização assinada, monitoramento central, KMS/HSM, âncora externa, segurança Edge e hardening cloud continuam futuros. Reset administrativo já existe; recuperação global multiempresa/por e-mail e recuperação operacional da loja não estão prontas. Testes locais não são pentest completo nem certificação de infraestrutura.

## Regras para a evolução

### Printing & Devices e Commerce Hub — PLANEJADO

Credenciais externas somente backend/secret storage, segregadas por empresa/conexão, com scopes mínimos, renovação/rotação e revogação. Nunca frontend, executável, Edge, logs, exports ou auditoria. Webhooks resolvem conexão/tenant no backend e validam mecanismo vigente do fornecedor, replay e limites; empresa informada no payload não concede acesso. Jobs/reconciliadores mantêm autorização e isolamento, inclusive entre duas contas da mesma empresa.

Desktop/Edge recebe comandos tipados permitidos, autenticados, ligados a dispositivo revogável, empresa/unidade, destino cadastrado, validade e ID de operação. Sem shell, executável, caminho ou rede arbitrários. Modelos/imagens/etiquetas e conteúdo externo são entradas não confiáveis; impor limites de tamanho, cópias, taxa e fila. Reimpressão e configuração terão direitos próprios, ainda **A DEFINIR**. Fiscal autoriza; imprimir não emite.

Testes futuros: empresa/conta erradas, ID externo igual em contas diferentes, webhook adulterado/repetido/fora de ordem, token/dispositivo revogado, comando proibido, destino livre, crash/reenvio, resultado desconhecido e reconciliação sem duplicação. Esses controles são requisitos, não implementação/testes atuais. [Commerce](COMMERCE_HUB.md), [Printing](PRINTING_AND_DEVICES.md) e [ameaças](THREAT_MODEL.md).

| ID | Regra | Situação atual |
| --- | --- | --- |
| SEC-001 | Operações de tenant validam empresa/unidade e autorização no backend | ATUAL no código: contexto/vínculos/RBAC, DTOs por permissão e agregados SQL por unidade |
| SEC-002 | Senhas nunca em texto puro; hash apropriado, preferência Argon2id do briefing | ATUAL: Argon2id; sem credenciais padrão |
| SEC-003 | Secrets fora de repositório, frontend, executável e logs | Diretriz; solução cloud/secret manager A DEFINIR |
| SEC-004 | Frontend não decide autorização nem direitos de assinatura | ATUAL: autorização backend; assinatura não implementada |
| SEC-005 | Testes de isolamento entre empresas e permissões por ação | HOMOLOGADO B no candidato V1.2: suíte global 610/610 em bases isoladas; não é pentest completo |
| SEC-006 | Logs minimizados, sem tokens, senhas ou segredos | Diretriz; observabilidade central pendente |
| SEC-007 | Acesso administrativo/suporte temporário, limitado e auditado | PLANEJADO; suporte administrativo não existe |
| SEC-008 | Dados locais sensíveis protegidos conforme classificação e ameaça | PLANEJADO; JSON/rascunhos sem proteção de aplicação |
| SEC-009 | Ofuscação é apenas camada adicional, nunca controle principal | Diretriz; não há promessa de proteção por ofuscação |
| SEC-010 | Regras críticas no backend e invariantes também na persistência | PARCIAL: regras comerciais existem; revisar cada fluxo na evolução |
| SEC-011 | Sessões com expiração, revogação e proteção contra roubo/reuso | ATUAL: cookie opaco/hash, expiração/inatividade, logout, listagem/revogação própria e revogação por troca/reset; MFA futura |
| SEC-012 | Reautenticação e aprovação excepcional vinculadas à operação | ATUAL no código para venda direta inativa: senha real, direito explícito, motivo e grant de uso único; demais exceções PLANEJADAS |
| SEC-013 | TLS em comunicação remota e criptografia em repouso apropriada | PLANEJADO; HTTP local atual |
| SEC-014 | Chaves separadas de dados, rotação e gestão segura de acesso | PLANEJADO; gestão A DEFINIR |
| SEC-015 | Dispositivos identificados/revogáveis; autorizações offline limitadas | PLANEJADO; prazo A DEFINIR |
| SEC-016 | Atualizações verificadas e estratégia de assinatura/distribuição | PLANEJADO; cliente Windows ainda não empacotado |
| SEC-017 | API com validação, rate limits, proteção a brute force e limites de recurso | PARCIAL: tamanho, Host/Origin/CSRF, tentativas e KDF locais; controles distribuídos pendentes |
| SEC-018 | Webhooks com assinatura, replay protegido, idempotência e reconciliação | PLANEJADO; integrações não implementadas |
| SEC-019 | Auditoria de ator, alvo, antes/depois, motivo e aprovação com proteção contra alteração | PARCIAL: executor/escopo/aprovação comprovada/append-only transacionais; âncora externa pendente |
| SEC-020 | Backups protegidos e restauração testada, com RPO/RTO definidos | PARCIAL: backup/validação/agendamento/retenção local e restore sintético isolado; proteção externa, procedimento da loja e RPO/RTO pendentes |
| SEC-021 | Ambientes separados, menor privilégio e dependências revisadas | PLANEJADO para operação cloud; não há CI/CD registrado |
| SEC-022 | Uploads com tipo/tamanho/acesso e armazenamento protegido; SQL parametrizado quando adotado | ATUAL: SQL parametrizado; uploads não implementados |
| SEC-023 | IA, relatórios, exports e busca respeitam o mesmo isolamento/permissões | ATUAL: consultas/exports locais com escopo e leituras; IA ausente |

## Identidade: complementos PLANEJADOS

Usuário autenticado, vínculos, DTOs, troca de senha com revogação e reset administrativo já existem localmente; cargo não concede direitos. Recuperação global multiempresa/por e-mail, MFA/passkeys/biometria e suporte remoto permanecem planejados/A DEFINIR. Módulos legados completos exigem as cinco leituras.

Expandir o modelo de exceções vinculado à operação para outros fluxos conforme definição de domínio. Venda direta inativa já registra executor/aprovador, escopo, motivo, instante, papéis históricos e situação dos itens, sem reativar o cadastro. Não inventar autores dos registros antigos.

## Dados e operação PLANEJADOS

Classificar dados de cadastro, pessoais, financeiros, fiscais e secrets; escolher proteção segundo risco. Não usar uma chave mestre embutida no cliente. Definir criptografia por infraestrutura e, quando necessário, campo/aplicação com chaves separadas. Dados reais de clientes não devem virar massa de desenvolvimento sem minimização/anonimização adequada.

Preparar gestão de acesso, retenção, exportação e exclusão conforme obrigações aplicáveis, incluindo LGPD; critérios jurídicos e prazos precisam de validação específica. Excluir dado não pode destruir documentos obrigatórios ou históricos financeiros. Isso é requisito de projeto, não comprovação atual de conformidade.

## Critérios antes de acesso remoto real

Identidade, isolamento, autorização, transações, manutenção de senha e backup/restore isolado possuem implementação/testes locais. Antes de acesso remoto, definir e homologar TLS, secrets, menor privilégio, identidade/recuperação global, proteção externa e recuperação operacional, logs mínimos/resposta a incidentes. Revalidar acesso cruzado, API direta, privilégio insuficiente, replay/conflitos na infraestrutura escolhida. Ver [ameaças](THREAT_MODEL.md) e [estado V1.2](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md).
