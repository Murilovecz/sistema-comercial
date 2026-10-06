# Fundação V1 — relatório da entrega

02/10/2026. Projeto exclusivo: `D:\Projeto Sistema Local`. Versão local `1.0.0-foundation.1`, sobre a baseline V0.12.0. Os [20 passos solicitados](FOUNDATION_V1_SOURCE.md) foram implementados em sequência; o [quadro de execução](FOUNDATION_V1_STEPS.md) registra cada entrega. Diretor e tester antigos permanecem desativados.

## Antes e depois

| Área | Antes — V0.12.0 | Depois — Fundação V1 |
| --- | --- | --- |
| Acesso | Nome digitado no navegador | Login/senha Argon2id, sessão no servidor, expiração e logout |
| Primeiro responsável | Visitante da demonstração | Cadastro local protegido por código de instalação aleatório; sem senha padrão |
| Empresas e unidades | Uma base global | Entidades relacionais, vínculos ativos e contexto verificado em cada requisição |
| Permissões | Escritas sem autorização | Catálogo de 18 permissões, papéis por empresa/unidade e negação por padrão |
| Persistência | Arquivo JSON substituído após validação | SQLite com migrations/checksum, FK de identidade/escopo e transações |
| Dados comerciais | JSON único em memória | Snapshot transitório por unidade dentro do SQL, carregado novamente na transação |
| Venda/recebimento | Persistência por arquivo | Estoque, venda, recebimento/custo e auditoria confirmados juntos ou desfeitos juntos |
| Auditoria | Responsável declarado em alguns registros | Executor autenticado, antes/depois, contexto, evento e cadeia de hashes com triggers contra edição/exclusão |
| Autorização excepcional | Sem identidade comprovada | Campos e separação executor/autorizador preparados; aprovação ainda não habilitada |
| Exportação | Token temporário sem proprietário | Permissões verificadas, proprietário por sessão/empresa/unidade e comparação de contexto nos links diretos |
| Rascunhos | Chaves globais no navegador | Namespace por usuário/empresa/unidade; chaves antigas preservadas sem adoção automática |
| Verificação | 205 testes | **302 testes aprovados, zero falhas e zero testes ignorados** na execução completa final |

## Preservação e migração

A baseline tem **195 arquivos** preservados, todos conferidos por SHA-256. O JSON original conserva o hash da baseline. A importação conferiu igualdade canônica integral, IDs de registros e históricos, datas/snapshots e agregados de campos monetários em centavos. Os agregados por caminho são provas de transferência, não novos saldos contábeis.

O arquivo da loja possui 12 listas presentes; o mapeamento e a conferência reconhecem 42 coleções. Campos desconhecidos ficam preservados como dados opacos. Listas desconhecidas não recebem restrições de unicidade inventadas. Não foram atribuídos usuários a autores antigos nem convertidos responsáveis declarados em aprovadores autenticados.

O ensaio foi feito primeiro sobre cópia privada em `.qa`. Na abertura local, o importador grava o SQL e o relatório em uma transação; o marcador de importação impede que reinícios restaurem o JSON antigo por cima da operação atual. Reimportação idêntica é idempotente, e origem diferente exige revisão explícita. A origem nunca é sobrescrita. [Procedimento e testes de migração](FOUNDATION_V1_MIGRATION.md).

## Evidências e alcance

- [Suíte completa final: 302/302](../../../.qa/foundation-v1/final-tests.txt): 205 testes anteriores e 97 novos.
- [27 cenários HTTP](FOUNDATION_V1_QA.md): autenticação/expiração/logout, permissões revogadas, empresas/unidades, IDs manipulados, CSRF/Origin/Host, exportações, rollback, cadastro administrativo atômico e proteção da administração própria.
- [Rechecagem HTTP final: 27/27](../../../.qa/foundation-v1/final-http-cache.txt), após incluir a orientação de não armazenar respostas em cache.
- [Testes de runtime](../../../foundation/runtime.integration.test.js): importação/reinício/rollback e duas instâncias com conexões SQLite independentes no mesmo arquivo isolado. Vender a última unidade confirma apenas uma venda, um recebimento e uma saída.
- [Testes de migração](../../../foundation/migration.test.js): 22 cenários, incluindo campos desconhecidos, histórico, centavos, referência inválida, idempotência, precisão numérica e UTF-8 inválido.
- [Testes de armazenamento/interface](../../../foundation/frontend.test.js): seis cenários de namespaces, autoridade de contexto, leitura financeira e aba desatualizada.
- [Integridade da baseline e do original](../../../.qa/foundation-v1/integrity-final.json), [verificações de sintaxe/links/padrões de secrets](../../../.qa/foundation-v1/verification-final.json).

A conferência visual usou somente massa sintética em servidor separado. Primeiro acesso, login, painel, Produtos, Clientes, Vendas e Administração abriram com a paleta verde atual. A venda de teste adicionou um mouse manualmente e outro por código de barras: dois itens a R$ 49,90, total R$ 99,80, estoque de dez para oito após confirmação. Nenhum teste de escrita usou os dados operacionais da loja.

Capturas da verificação isolada: [Produtos](../../../.qa/foundation-v1/visual-products.png), [Vendas](../../../.qa/foundation-v1/visual-sales.png), [Usuários e acessos](../../../.qa/foundation-v1/visual-admin.png). Essa conferência não equivale a teste visual exaustivo, pentest ou certificação de produção.

## Riscos e dívida técnica

1. A camada comercial ainda guarda snapshots completos. Identidade/RBAC/escopo são relacionais; os vínculos comerciais internos não viraram todos FKs SQL. Normalização incremental e respostas projetadas/paginadas são próximas entregas.
2. O painel comercial exige as cinco leituras `catalog.view`, `inventory.view`, `sales.view`, `financial.view` e `operations.view`. Perfil parcial não recebe esse snapshot; pode acessar Administração/Auditoria conforme permissões. Leitura comercial por perfil e visibilidade fina de botões ainda precisam de evolução.
3. O catálogo comercial ainda pertence à unidade na bridge. Compartilhamento por empresa e transferências entre unidades não foram implementados. Transferências físicas existentes continuam dentro do contexto atual.
4. Auditoria local tem triggers e hashes, mas um administrador com controle total do arquivo pode adulterar o banco e recalcular a cadeia. Não há âncora externa, criptografia de dados locais ou proteção contra administrador do computador.
5. Recuperação/troca de senha, MFA, gestão de dispositivos, revogação distribuída, âncora de auditoria e observabilidade central não estão prontos. Limites de login são por processo. O código de instalação fica privado fora do diretório público; as permissões reais do arquivo no Windows dependem do sistema operacional.
6. Não há serviço de backup operacional, restauração certificada, CI/CD ou Git configurado nesta pasta. A baseline é uma cópia de comparação, não substitui backup. Falha de energia, carga elevada e PostgreSQL ainda exigem provas específicas.
7. Rascunhos anteriores permanecem no navegador, sem identificação confiável. Não são apresentados automaticamente à nova conta. A eventual adoção desses rascunhos precisa de decisão explícita; os registros salvos da loja são migrados normalmente.

## A DEFINIR e próximo conjunto recomendado

As regras de aprovação excepcional continuam A DEFINIR: quem pode liberar item desativado, prova de autenticação, motivo, validade e vínculo com a operação. PIN/biometria e venda excepcional não foram inventados. As anotações do passeio seguem em [AJUSTES-DO-PASSEIO](../v1.1/AJUSTES-DO-PASSEIO.md); registrar custo e recebimento pela fonte existente para evitar duplicação.

Recomenda-se avançar primeiro para consultas/respostas comerciais por permissão, normalização de um agregado por vez e recuperação operacional de acesso/dados. Depois, aplicar as melhorias de cadastros e estoque já anotadas com a base de identidade real. Antes de exposição remota, validar PostgreSQL, TLS, proteção de secrets, backup/restauração, retenção e homologação.

Cloud de produção, Edge/offline SaaS, executável Windows final, cobrança, fiscal completo, iFood, Delivery Much, novos setores e IA **não foram iniciados**. O servidor desta entrega continua local, na porta 3210; o desenho de servidor central e aplicativo cliente permanece planejado.

## Para abrir

Use `INICIAR.cmd` ou o atalho já existente do inicializador. No primeiro acesso, abra `data/PRIMEIRO-ACESSO.txt` e use o código privado para escolher seu login e sua senha (12 a 128 caracteres). Não publique o arquivo nem o código. Depois, Administração → Usuários e acessos permite cadastrar pessoas e papéis; Administração → Auditoria mostra as novas alterações.

A primeira abertura operacional foi conferida em [operational-summary.json](../../../.qa/foundation-v1/operational-summary.json): revisão SQL 1, uma migration, igualdade de dados/IDs/centavos e original intacto. Nenhum usuário real foi criado pela equipe; a tela de configuração ficou aberta para o Murilo escolher suas credenciais. [Captura do primeiro acesso](../../../.qa/foundation-v1/first-access-ready.png).
