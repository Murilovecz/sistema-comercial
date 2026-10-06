# QA — Fundação V1

Verificação do novo especialista **QA / Testing**, em 02/10/2026. Diretor e tester antigos permanecem desativados. Este relatório cobre a fundação implementada e os cenários abaixo; não certifica produção, todos os módulos ou todos os fluxos visuais.

## Resultado observado

- Suíte HTTP desta entrega: **27 testes aprovados, zero falhas**.
- Regressão completa observada nesta rodada: **297 testes aprovados, zero falhas**, incluindo os 205 testes anteriores e os testes novos presentes no projeto naquele momento.
- Banco de todos os testes HTTP: SQLite **`:memory:`**, ambiente `test`, `importLegacy:false`, diretório temporário exclusivo e porta local aleatória.
- Nenhum teste desta suíte abre o SQLite operacional ou escreve no JSON da loja. Fixtures usam nomes, senhas e registros sintéticos.

Fonte executável: [foundation/http.test.js](../../../foundation/http.test.js). Evidências: [HTTP final desta rodada](../../../.qa/foundation-v1/qa-http-final.txt), [regressão completa](../../../.qa/foundation-v1/qa-regression-final.txt), [resumo com hashes](../../../.qa/foundation-v1/qa-summary.json).

O total de testes acima é uma observação datada. Novas alterações e testes dos demais especialistas poderão aumentar o total; o relatório final da entrega deve usar a última execução completa.

## Cobertura real da suíte HTTP

| Área | Comportamentos verificados |
| --- | --- |
| Primeiro acesso | Instalação única, usuário e sessão reais, segunda instalação rejeitada sem criar segundo dono, status público sem código de instalação |
| Autenticação | Login válido, senha errada, usuário inexistente e desativado; erro genérico igual; usuário desativado perde sessão existente |
| Sessões | Cookie HttpOnly/SameSite, logout invalida cookie antigo, token aleatório inválido, expiração absoluta e por inatividade |
| Proteção de escrita | CSRF ausente/forjado, Origin diferente/ausente, Content-Type inadequado e Host forjado; nenhum produto criado |
| Permissões em tempo real | Remoção de permissão do papel e desativação de vínculos empresa/unidade atingem sessão aberta |
| Respostas completas | Falta de financial.view nega estado completo, escrita que devolveria snapshot, CSV direto e preparação de exportação |
| Permissões específicas | Perfil de leitura não cria/cancela venda, ajusta estoque nem administra usuários/papéis |
| Isolamento entre empresas | Leitura A não revela B; contexto B não autorizado e headers manipulados negados; IDs iguais editados/desativados somente em A |
| IDs estrangeiros | Produto existente só em B não é editado, desativado, reposto ou vendido em A; estado de B permanece idêntico |
| Referências cruzadas | Cliente/fornecedor de B não entra em venda/compra de A; não há operação ou baixa parcial |
| Troca de contexto | Seleção autorizada troca CSRF, janela com token anterior falha; headers do escopo anterior recebem conflito |
| Exportações | URL temporária pertence à sessão e empresa/unidade; outra sessão do mesmo usuário e outra unidade não baixam o arquivo |
| CSV direto e janela anterior | IDs ausentes no escopo recebem 404; links com empresa/unidade esperadas recebem 409 após troca, mesmo com IDs de caixa/produto iguais; contexto esperado é comparação, não escolha de tenant |
| Identidade e autoria | Body não define tenant, sessão, executor, autorizador ou permissões; responsible declarado é substituído pelo usuário verificado |
| Rollback de venda | Falha SQL injetada na auditoria produz 500 genérico e reverte venda, estoque, índice e revisão; nenhuma resposta 201 antecipada |
| Concorrência | Duas requisições disputando a última unidade produzem uma venda integral e uma recusa; estoque, pagamento e movimentos ficam coerentes |
| Reenvio de venda | Mesma confirmação não duplica venda, baixa, recebimento, auditoria ou revisão; conteúdo alterado é recusado |
| Administração atômica | Papel inexistente/unidade estrangeira não deixam usuário órfão; criação válida e revogação de acesso são verificadas |
| Administração própria | Edição do papel/acesso não remove users.manage ou roles.manage do próprio administrador; 409 e rollback preservam administração |
| Papéis por empresa | ID de papel de B não pode ser concedido/editado em A |
| Isolamento entre unidades | Mesmo ID de produto em duas unidades da mesma empresa mantém cadastros/saldos independentes; exportação de uma não vale na outra |
| Situação do escopo | Unidade/empresa desativadas invalidam sessão existente imediatamente |
| Compra recebida | Falha auditada reverte recebimento/estoque/custo/revisão; sucesso registra custo e executor, reenvio não duplica; recebimento não inventa despesa |
| Produto inativo e auditoria | Venda continua recusada sem fluxo excepcional definido; body não inventa autorização; desativação tem antes/depois e executor; consulta auditada é scoped |
| Rotas/erros | Rotas desconhecidas, caminhos codificados e query inesperada não burlam acesso; JSON inválido/array/corpo grande recusados sem stack ou detalhes SQL |
| Entrega da interface | HTML/CSS/scripts principais continuam disponíveis; JSON/SQLite/código de instalação/arquivos privados retornam 404; health responde |

O protótipo não oferece exclusão física genérica de produtos. Os testes de DELETE confirmam que essa superfície é recusada com 404 e nenhum registro muda; não afirmam uma funcionalidade de exclusão que não existe.

## Achados e revalidação

Na revisão anterior da infraestrutura foram identificados três problemas: migrations desconhecidas ignoradas, proteção de banco de teste dependente apenas de NODE_ENV e callback assíncrono continuando após rollback. O implementador corrigiu os três e acrescentou regressões à suíte de infraestrutura; a regressão completa registrada acima passou.

O implementador também reforçou a preservação da administração própria em papéis e vínculos. A suíte HTTP reproduz as tentativas e confirma **409**, manutenção das permissões e acesso administrativo após a rejeição.

A primeira execução HTTP teve duas expectativas incorretas da fixture: segundo setup utilizava CSRF de sessão em vez de pré-autenticação e fetch normalizava o Host de teste. A fixture foi corrigida: novo cliente com pré-autenticação para setup repetido e HTTP nativo para Host forjado. Isso não foi defeito do produto. A segunda execução passou 20/20; a terceira ampliou a cobertura para 26/26 e a rodada posterior verificou a proteção de links CSV em 27/27.

## Limitações e tarefas ainda separadas

- Disponibilidade de assets HTTP não é validação visual. Navegação, layout e experiência de login devem constar na verificação de interface dos especialistas/implementador.
- Migração, preservação das 42 coleções e recuperação em disco possuem testes próprios; esta suíte HTTP não usa o JSON operacional para testar importação.
- Concorrência verificada aqui usa um servidor real e SQLite em memória. Falha de energia, múltiplos processos, recuperação WAL/backup e PostgreSQL não foram certificados por estes testes.
- Snapshot completo continua exigindo as cinco permissões de leitura; a Fundação V1 não entrega leitura parcial comercial por perfil.
- Catálogos entre unidades ainda não são compartilhados; a bridge por unidade é uma transição documentada.
- A trilha de auditoria encadeada não possui âncora externa e não protege contra administrador com controle total do arquivo.
- PIN, biometria, aprovação excepcional de produto inativo, recuperação de senha e autenticação multifator permanecem fora da implementação deste conjunto.
- Cloud, Edge, executável Windows, cobrança SaaS, fiscal e conectores externos não foram iniciados.

## Reproduzir

Executar a suíte HTTP: `node --test --test-isolation=none foundation/http.test.js`.

Executar a regressão: `node --test --test-isolation=none`.

Os testes criam servidores temporários na interface local e os encerram ao final. Não apontar fixtures para a pasta data da loja nem desativar os guards de ambiente.
