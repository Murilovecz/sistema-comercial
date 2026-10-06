# Identidade e autenticação — Fundação V1

**Registro histórico da Fundação V1, 02/10/2026.** Descreve a entrega daquela etapa; referências a recuperação/troca ainda pendentes pertencem à V1. Estado atual: [candidato V1.2](../v1.2/FOUNDATION_V1_2_REPORT.md), [manutenção de acesso](../../atual/ACCESS_V1_2.md) e [API](../../atual/API.md). Corpo e resultados históricos preservados.

## Passo 8 — implementado

Usuários reais em SQL têm ID, nome, login normalizado único, situação e timestamps UTC. A criação recebe a senha, gera hash Argon2id assíncrono no Node 24.19 e só depois abre uma transação. Não há senha padrão nem senha reversível. A resposta pública nunca contém o hash.

Parâmetros técnicos desta versão: memória 65.536 KiB, três passes, paralelismo 1, saída de 32 bytes e salt aleatório de 16 bytes. O formato identifica algoritmo/versão e parâmetros. A verificação limita os parâmetros aceitos, compara resultado em tempo constante e não remove espaços da senha. Senhas de cadastro têm de 12 a 128 caracteres e limite adicional de bytes.

A implementação exige Node com `crypto.argon2`, disponível a partir de 24.7. Não utilizar uma versão antiga que simplesmente omita hashing. Esses custos devem ser medidos antes de exposição remota e podem evoluir com rehash versionado. [Documentação oficial do Node](https://nodejs.org/api/crypto.html#cryptoargon2algorithm-parameters-callback).

## Passo 9 — implementado no módulo

`foundation/identity.js` oferece autenticação HTTP, ainda aguardando a integração com servidor e interface no passo 19. As rotas são:

| Método / rota | Contrato |
| --- | --- |
| GET `/api/auth/status` | Informa `needsSetup`, `authenticated` e token CSRF; nunca revela código de instalação |
| POST `/api/auth/setup` | Código de instalação + nome/login/senha; cria primeiro usuário, vínculos e sessão em transação |
| POST `/api/auth/login` | Login/senha; resposta genérica para senha errada, usuário inexistente ou inativo |
| GET `/api/auth/me` | Identidade pública, contexto ativo, permissões, token CSRF e contextos permitidos |
| POST `/api/auth/context` | Empresa/unidade escolhidas somente entre vínculos ativos; audita mudança |
| POST `/api/auth/logout` | Revoga sessão e limpa cookies |

Sessão usa token aleatório de 32 bytes somente em cookie `foundation_session`, com `HttpOnly`, `SameSite=Strict`, `Path=/` e prazo. SQL mantém apenas SHA-256 do token. Não há JWT nem identidade confiada ao nome no navegador. Novo login gera nova sessão e revoga o token anterior apresentado. Defaults técnicos: 12 horas absolutas e 30 minutos de inatividade; configuráveis e testáveis, não são regras de plano comercial.

O cookie `Secure` depende de configuração explícita de HTTPS; cabeçalhos `Forwarded`/`X-Forwarded-*` não definem confiança. HTTP local em loopback é exceção documentada desta fundação e não configuração de cloud. Sessão e vínculos de usuário, empresa e unidade são revalidados em cada requisição; permissões são consultadas novamente em SQL. A expiração não é renovada indefinidamente.

Contexto inicial é automático apenas se há exatamente uma unidade permitida. Com mais de uma, a sessão fica autenticada sem contexto comercial até seleção. `publicContext` inclui `user`, `companyId`, `unitId`, `sessionId`, `permissions`, `csrfToken` e `contexts`; não inclui token da sessão, hash, senha ou código de instalação.

## CSRF, origem e consumo de recursos

Todas as mutações de autenticação exigem Origin exato permitido, Host permitido, `application/json` e `X-CSRF-Token`. Antes de login/setup, status prepara cookie aleatório `foundation_preauth` HttpOnly e token CSRF derivado por HMAC. Depois de login, token CSRF depende da sessão e da empresa/unidade; trocar contexto invalida solicitações de abas antigas. O token CSRF é metadado público necessário à proteção e não é a credencial de sessão.

Sem origem explicitamente configurada, o módulo só aceita Host literal `127.0.0.1` ou `localhost`, com porta opcional, e Origin correspondente. Isso evita confiar em hostname arbitrário apontando para localhost. Configuração remota precisa de origens/hosts explícitos, TLS e controles operacionais próprios; não deve liberar qualquer Origin.

Login limita oito tentativas por login e trinta por endereço de conexão a cada minuto; no máximo duas derivações simultâneas neste módulo. Não confia em IP de cabeçalho fornecido pelo cliente. Usuário inexistente usa hash fictício gerado aleatoriamente e derivação real. Corpo de autenticação é limitado a 16 KiB. Rate limits são locais ao processo e reiniciam com ele; proteção distribuída e tuning antes de cloud continuam pendentes.

## Bootstrap e vínculos

O código de instalação é fornecido por `options.pairingToken`, gerado aleatoriamente pelo inicializador e preservado fora do diretório público. Não é senha fixa, não aparece em status e é comparado em tempo constante. Endpoint aceita apenas conexão loopback e só funciona enquanto não existem usuários. IP em cabeçalhos não satisfaz esse requisito. O hash é calculado antes da transação; dentro dela, a inexistência do primeiro usuário é conferida novamente. Configuração concorrente cria no máximo um dono. Falha de auditoria reverte usuário, vínculos, papel e sessão.

O bootstrap usa a primeira empresa/unidade ativa já existente, ou cria entidades genéricas se não há nenhuma. Não presume catálogo compartilhado entre unidades. Cria vínculos e papel inicial com as permissões já cadastradas; portanto o catálogo RBAC deve ser instalado antes de abrir a configuração ao usuário. `options.bootstrapAccess` permite que o coordenador estabeleça o papel dentro da mesma transação. Não há fluxo de PIN, biometria ou gestão de usuários no módulo de autenticação.

## Auditoria e limites

`options.audit(event)` é callback síncrono, executado dentro da transação para CREATE inicial, LOGIN, LOGOUT, CONTEXT_CHANGE e LOGIN_FAILURE. Eventos contêm IDs verificados e informações públicas pertinentes; nunca senha, hash, cookie, código de instalação ou token CSRF. LOGIN_FAILURE não guarda login informado nem atribui ator não confirmado. O armazenamento append-only está integrado pelo passo 15. Falhas de credenciais retornam erro genérico; proteção distribuída, recuperação de senha e MFA não estão implementadas.

Este módulo fornece `authenticate`, `requirePermission` e `validateCsrf` ao servidor. A integração deve exigir as leituras necessárias antes de retornar snapshot completo e validar novamente contexto/autorização dentro da transação comercial. Autenticação isoladamente não autoriza cada rota nem protege uma exportação — isso permanece responsabilidade da camada central nos passos 12–19.

O administrador do computador pode alterar arquivos e bancos locais; não existe promessa de inviolabilidade. Proteção da instalação, criptografia, TLS remoto, revogação de todas as sessões ao trocar senha e recuperação operacional terão de ser integradas nos fluxos correspondentes antes de publicação. Tentativas com credenciais inválidas já geram evento genérico local; observabilidade distribuída e auditoria de todas as negações continuam pendentes.

## Verificação

Passo 8: 214 testes gerais aprovados, incluindo os 205 originais. Passo 9: testes de hashing, cadastro, bootstrap/repetição/corrida/rollback, login correto/errado/inexistente/inativo, logout, cookies, expiração/inatividade, contexto entre empresas, vínculo revogado, permissões atualizadas, CSRF de aba antiga, Host/Origin/JSON, corpos inválidos e limitação de tentativas/derivações. Os testes usam somente SQL em memória e relógio controlado; não gravam a base da loja.
