# Relatório da Fundação V1.1

Entrega local **1.1.0-foundation.1**, em **02/10/2026**, somente em `D:\Projeto Sistema Local`. Os [dez passos autorizados](FOUNDATION_V1_1_SOURCE.md) foram implementados em ordem, sem iniciar rodadas históricas. Diretor e tester antigos permaneceram desativados; os especialistas de Banco/Backend, Arquitetura/Segurança, Produto/UX, QA e Documentação participaram conforme a responsabilidade necessária.

## Antes e depois

| Área | Fundação V1 anterior | Fundação V1.1 |
| --- | --- | --- |
| Versão | 1.0.0-foundation.1 | 1.1.0-foundation.1 |
| Regressão completa | 302 testes aprovados | **457 aprovados; 0 falhas, cancelados, ignorados ou pendentes** |
| Persistência comercial | Snapshot por empresa/unidade no SQL | Cinco agregados relacionais e espelho conferido; restantes ainda transitórios |
| Leitura por perfil | Estado completo exigia cinco leituras | DTOs menores por direito; SQL paginado nos agregados normalizados |
| Cadastros | Comandos compatíveis com estado completo | Criação/edição/situação com resposta menor, versão e proteção de reenvio |
| Produto inativo | Bloqueado sem exceção implementada | Venda direta autorizada por senha real, direito explícito e motivo |
| Interface | Formulários fixos e ajustes do passeio pendentes | Quick views, filtros visíveis, autoria e navegação contextual |
| Recuperação desta atualização | Origem/baseline preservadas | Cópia consistente e ensaio de migração/equivalência antes de atualizar |

São **155 testes adicionais** em relação à V1. Os 205 testes do diagnóstico inicial e a V0.12 são históricos anteriores à V1, não o total imediatamente anterior desta entrega.

## Persistência e compatibilidade

Migrations aditivas `002_products.sql`, `003_customers.sql`, `004_suppliers.sql`, `005_purchases.sql` e `006_inventory.sql` normalizam Produtos, Clientes, Fornecedores, Compras/Recebimentos e Estoque/Movimentações. `007_inactive_sale_approval.sql` acrescenta a autorização excepcional. A migration 001 original conserva seu checksum.

Há campos reais, filhos relacionais, relações compostas empresa/unidade/ID e equivalência canônica com o espelho. IDs, ordem, extras desconhecidos, ausência/null, centavos e quantidades são preservados. SQL é autoridade do agregado migrado: divergência do espelho interrompe a operação, sem reimportação silenciosa. Escritas comerciais mantêm validação, agregado, espelho, revisão e auditoria na mesma transação.

Saldos novos exigem movimentos correspondentes, com saldo posterior e origem validados. Histórico anterior não pode ser apagado/alterado por comando comercial. Distribuição física exige movimento novo correspondente. Âncora técnica representa a diferença entre saldo histórico e movimentos disponíveis; não é entrada comercial nem identidade inventada. Autores declarados de registros antigos são preservados, sem atribuir identidade verificada retroativa.

Compra, recebimento parcial, estoque, fonte de custo e financeiro aplicável usam o fluxo existente, sem segunda entrada/despesa. O custo acessível é o último efetivamente recebido, com fornecedor/compra/data, ou ausente. Não equivale a custo médio ou novo cálculo de lucro.

**Ainda em snapshot:** Vendas, Orçamentos, Caixa, Financeiro, contas, despesas, devoluções, reservas, inventários, configurações de posições e módulos complementares. Algumas referências a essas origens são validadas pelo domínio, sem FK SQL universal. Vendas/financeiro têm projeções menores, mas suas consultas ainda leem documentos do snapshot. A interface completa legada mantém as cinco leituras por compatibilidade.

Quantidades são representadas por decimal textual exato e cálculos técnicos BigInt, sem REAL. Unidades existentes são preservadas; não inferidas. Os comandos atuais continuam com quantidades inteiras. Precisão, arredondamento, unidades e conversões precisam ser especificados antes de habilitar operação fracionada. Fiscal brasileiro permanece planejado e separado.

## Permissões, cadastro e venda excepcional

Catálogo não devolve saldo/custo, nem permite inferi-los por filtro/ordenador. Estoque exige seu direito; custo exige catálogo e financeiro. Busca exata por código de barras funciona além da primeira página; aliases/embalagens usam os vínculos existentes. Paginação, busca e ordenação são limitadas e verificadas pelo servidor. Contexto, sessão, revogação, CSRF e isolamento continuam obrigatórios.

Cadastros menores têm campos permitidos explícitos. Criação usa chave/conteúdo/executor para reenvio sem duplicação; edição/situação verifica versão dentro da transação, com 409 em conflito. Saldo inicial positivo exige direito de ajustar estoque; mínimo informado exige leitura/ajuste. Edição não aceita custo, saldo ou identidade fornecida pelo navegador.

A venda direta calcula o preview sem gravar ou conceder autorização. Item inativo exige login/senha Argon2id de pessoa com `sales.authorize_inactive`, além de motivo. Grant de 120 segundos é armazenado como hash, vinculado a sessão, executor, empresa/unidade, conteúdo, caixa e versões dos produtos. Direitos, vínculo, situação e senha do autorizador são revalidados; consumo e gravação/auditoria são atômicos. Prova interna não pode ser substituída por JSON de aprovação. Reenvio confirmado retorna a mesma venda, sem segunda baixa.

Somente itens efetivamente inativos recebem a identificação da exceção nos movimentos. Venda e auditoria registram executor/autorizador verificados, perfil e motivo; cadastro permanece inativo. Modificar carrinho/conteúdo invalida a autorização pendente; senha não persiste no formulário/armazenamento. Orçamento/reserva não recebem exceção automaticamente. Não há PIN ou biometria.

O catálogo passa a 19 direitos. A concessão técnica inicial do novo direito acontece uma única vez aos papéis que já tinham todos os 18 anteriores explicitamente, com registro de upgrade; revogação posterior não é desfeita no reinício. Nome do cargo não concede autorização implicitamente.

## Interface conferida

Produtos, Clientes e Fornecedores abrem cadastro/edição em janela rápida sobre a lista, reutilizando formulários e gravação. Fechar/abrir outro cadastro não conserva o ID editado indevidamente. Limpar filtros fica próximo aos filtros, sem apagar rascunhos. Receber compra filtra os pedidos pelo produto e mantém o rascunho existente. Custos usam a fonte recebida; históricos mostram executor/aprovador e deixam explícita a venda de item desativado.

Conferência visual em servidor/base sintéticos, separados da loja, com **121 produtos** e perfis de proprietário, vendedor e financeiro: quick views, criação/edição, filtros, rascunho de compra, ausência de custo, página 2/3, código fora da primeira página, inclusão manual, aviso/autorização/invalidação, venda com executor diferente do aprovador, histórico de estoque, cadastro ainda inativo e separação financeira. A data civil foi conferida como 02/10, sem deslocamento pelo fuso. Nenhum erro registrado no console da sequência final. Conferência em viewport desktop; não certifica todos os tamanhos ou fluxos de cada tela.

Capturas com dados sintéticos: [produto](../../../.qa/foundation-v1.1/quick-view-product.png), [venda autorizada](../../../.qa/foundation-v1.1/inactive-sale-confirmed.png), [perfil financeiro](../../../.qa/foundation-v1.1/financial-profile.png) e [histórico de estoque](../../../.qa/foundation-v1.1/stock-authorization-history.png).

## Evidências e correções

- Regressão completa: [final-tests.txt](../../../.qa/foundation-v1.1/final-tests.txt), **457/457**, 70,29 segundos, Node 24.19, runner nativo com `--test-isolation=none`. Cada teste de escrita usa memória/arquivo/servidor próprios; não o banco operacional.
- Agregados: 19 testes Produtos, 12 Clientes, 11 Fornecedores, 14 Compras/Recebimentos e 17 Estoque, além da regressão e integrações HTTP.
- Aprovação: 12 testes unitários e 21 HTTP; cadastros: 8 unitários e 20 HTTP; Caixa: 3 HTTP de compatibilidade/autoridade/reenvio; integração de scripts: 1 HTTP.
- Cenários incluem outro tenant/unidade/sessão, revogação, campos indevidos, versão antiga, paginação real SQL, ausência/null/extras, equivalência, origem de estoque, falha de auditoria/SQL, reenvio, concorrência, senha/grant alterado/expirado e prova forjada. Esses grupos fazem parte do total; não somá-los novamente.
- Achados corrigidos estão em [FOUNDATION_V1_1_FINDINGS](FOUNDATION_V1_1_FINDINGS.md), incluindo fixtures antigas, preservação de recebimentos, invariantes de estoque, colisão de ID comercial do Caixa com autoridade de sessão, conflito 409, eventos de modal, invalidação do grant, carregamento do script e data civil. A rodada final não deixou regressão aberta. Isso não afirma ausência de qualquer erro no programa.
- A conferência final de sintaxe, links, padrões de secrets, 195 arquivos da baseline e origem JSON fica em [verification-final.json](../../../.qa/foundation-v1.1/verification-final.json). A checagem de padrões não substitui auditoria completa de segredos.

## Atualização operacional e recuperação

Cópia consistente da origem pelo backup nativo SQLite, antes de abrir a versão nova: `.qa/foundation-v1.1/pre-release-20261002.sqlite`. Integridade e FKs aprovadas, schema 001 e um escopo. SHA256 da cópia: `0a277f44a8cf0f8310e343590eba15eb19befa8db810ce39af5a7b8f3fea7ff1`. Relatório privado ao lado da cópia. O banco/cópias não devem ser publicados.

[Ensaio de atualização](../../../.qa/foundation-v1.1/release-ensayo.json) em outra cópia: migrations 001..007, cinco agregados equivalentes, snapshot e revisões inalterados, FKs válidas. Não houve operação comercial de teste na loja. **Aplicação operacional concluída:** servidor 127.0.0.1:3210 reiniciado em 02/10/2026, health pronto/local na versão 1.1.0-foundation.1; migrations 001..007 aplicadas; integridade/FKs e cinco agregados equivalentes. Snapshot/revisões da loja permanecem iguais à cópia pré-atualização. [Conferência operacional](../../../.qa/foundation-v1.1/operational-release.json); [equivalência](../../../.qa/foundation-v1.1/operational-equivalence.json). Tela de login V1.1 aberta sem gravar dados comerciais de teste. Origem JSON e 195 arquivos da baseline permanecem inalterados.

Reversão não é copiar JSON histórico ou apagar tabelas novas. Falha transacional preserva o estado anterior; depois de operações na versão nova, downgrade/restauração exige cópia consistente atual, revisão de compatibilidade e procedimento específico. Schema é aditivo. Esta cópia e ensaio são evidência da entrega; não constituem rotina automática, retenção, RPO/RTO ou restauração operacional completos.

## Limites e próxima recomendação

Escritas ainda materializam o estado comercial e reconstroem tabelas/espelhos. Parte da conferência de estoque percorre produtos e movimentos; volume/desempenho de produção não foi medido. Essa dívida, ponte das telas avançadas e agregados restantes devem ser reduzidos com entregas separadas, sem prometer que menor DTO eliminou o snapshot.

Recuperação de senha, backup automático/retenção/restauração, Git, MFA/biometria, purge/retenção de grants e limites distribuídos de tentativas permanecem pendentes. Proteções de tentativas/KDF são locais ao processo. Auditoria não é inviolável contra administrador do arquivo, e a versão não fornece proteção de assinatura contra administrador local. Não foi realizado pentest completo ou homologação de produção.

Cloud/PostgreSQL, cliente Windows final, Edge/sincronização, cobrança/licenciamento, módulo fiscal, integrações e novos nichos não foram implementados. Recomendação: recuperação/versionamento e medição de desempenho; depois consultas avançadas e normalização de Vendas, preservando todos os vínculos. Próxima entrega depende do pedido do Murilo, sem ciclos automáticos retomados.
