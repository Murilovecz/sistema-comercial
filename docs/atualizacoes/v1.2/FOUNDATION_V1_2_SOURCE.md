# FUNDAÇÃO V1.2 — RECUPERAÇÃO, OPERAÇÃO, DESEMPENHO E VENDAS

Continuar o projeto existente em:

`D:\Projeto Sistema Local\`

A versão de partida esperada é:

`1.1.0-foundation.1`

Antes de executar qualquer alteração, CONFIRME isso diretamente no repositório.

A Fundação V1.1 já foi concluída.

NÃO refazer tarefas da V1.1.

O baseline conhecido possui:

- 457 testes aprovados;
- Produtos relacionais;
- Clientes relacionais;
- Fornecedores relacionais;
- Compras/Recebimentos relacionais;
- Estoque/Movimentações relacionais;
- autenticação real;
- sessões;
- empresas/unidades;
- RBAC;
- auditoria;
- autorização excepcional de venda de produto inativo;
- migrations 001..007.

Considere código + migrations + documentação atual como fonte de verdade.

---

# OBJETIVO DA V1.2

A V1.2 deverá preparar o sistema para evoluir de uma aplicação local tecnicamente funcional para uma base operacional recuperável, mensurável e cada vez menos dependente do snapshot comercial.

Objetivos principais:

1. criar versionamento confiável do código;
2. melhorar recuperação de acesso;
3. melhorar gerenciamento de sessões;
4. criar backup e restauração operacional testáveis;
5. medir desempenho real antes de otimizações;
6. reduzir dependência da materialização completa do estado;
7. normalizar Vendas;
8. criar consultas relacionais de Vendas;
9. preservar atomicidade Venda ↔ Estoque ↔ Auditoria;
10. encerrar com regressão completa e relatório técnico.

---

# REGRA FUNDAMENTAL

NÃO implementar nesta rodada:

- Fiscal completo;
- Cloud;
- PostgreSQL;
- Edge;
- Printing & Devices completo;
- Commerce Hub;
- Mercado Livre;
- Shopee;
- WooCommerce;
- cobrança SaaS;
- módulos de novos nichos;
- biometria;
- MFA completo.

Esses itens continuam planejados.

A V1.2 deve fortalecer a fundação antes de abrir novas frentes.

---

# PASSO 1 — BASELINE E PRÉ-FLIGHT

Antes de alterar qualquer arquivo:

1. confirmar versão;
2. confirmar migrations;
3. executar regressão completa;
4. confirmar os 457 testes existentes ou o total atual real;
5. verificar integridade SQLite;
6. verificar foreign keys;
7. verificar equivalência dos cinco agregados relacionais já migrados;
8. verificar documentação atual;
9. registrar estado inicial da V1.2.

Se houver qualquer divergência em relação ao relatório da V1.1:

PARE a implementação da etapa afetada e investigue a divergência.

Não adapte silenciosamente o sistema para fazer os testes passarem.

---

# PASSO 2 — GIT E VERSIONAMENTO DO CÓDIGO

O projeto ainda não deve depender apenas de cópias locais como histórico.

Inicializar/configurar Git local adequadamente, caso ainda não exista.

IMPORTANTE:

NÃO publicar repositório remotamente automaticamente.

NÃO enviar código para GitHub/GitLab ou qualquer serviço externo sem autorização.

Criar `.gitignore` adequado para impedir versionamento acidental de:

- bancos operacionais;
- backups;
- códigos de primeiro acesso;
- secrets;
- tokens;
- arquivos privados;
- artefatos temporários;
- logs sensíveis;
- pastas de QA que contenham dados privados;
- dependências geradas;
- arquivos de ambiente.

Revisar antes do primeiro commit para garantir que nenhum segredo esteja entrando no histórico.

Criar baseline local identificável da V1.1 antes das mudanças da V1.2.

Definir política simples de versionamento compatível com o projeto.

Não inventar CI/CD agora.

---

# PASSO 3 — TROCA E RECUPERAÇÃO DE SENHA

Implementar recuperação operacional segura de acesso.

Separar claramente:

## Troca voluntária de senha

Usuário autenticado:

```text id="w4fbxg"
Senha atual
↓
Nova senha
↓
Confirmação
```

Exigir validação real da senha atual.

Aplicar política atual de senha.

Hash Argon2id.

Nunca armazenar senha em texto puro.

---

## Reset administrativo

Usuário autorizado poderá redefinir o acesso de outro usuário conforme permissão específica.

O administrador NÃO deve visualizar:

- senha atual;
- hash;
- segredo recuperável.

O reset deverá:

- ser auditado;
- identificar executor;
- identificar usuário afetado;
- invalidar sessões existentes quando apropriado;
- exigir criação segura de nova credencial.

Não criar senha padrão universal.

Não criar backdoor.

---

# PASSO 4 — GERENCIAMENTO DE SESSÕES

Melhorar a infraestrutura existente de sessões.

Permitir ao usuário visualizar, quando tecnicamente possível:

```text id="mccjvm"
Sessão atual
Outras sessões ativas
Data de criação
Última atividade
Informações não sensíveis do dispositivo/origem
```

Permitir:

```text id="qwj364"
Encerrar esta sessão
Encerrar outra sessão
Encerrar todas as outras sessões
```

Revogação deverá ser efetiva no backend.

Não confiar somente no frontend para logout.

Troca/reset de senha deverá ter política explícita de revogação de sessões.

Não chamar um dispositivo de "confiável" sem implementar realmente um modelo de confiança.

MFA, passkeys, Windows Hello e biometria permanecem para uma etapa futura.

---

# PASSO 5 — GRANTS TEMPORÁRIOS E LIMPEZA

A V1.1 introduziu grants temporários para autorização excepcional.

Formalizar manutenção desses grants.

Implementar:

- expiração;
- purge seguro;
- retenção apropriada;
- impossibilidade de reutilização;
- proteção contra replay;
- limpeza de registros transitórios expirados.

Preservar a auditoria histórica necessária.

Não apagar evidências de operações já realizadas.

Diferenciar:

```text id="wq1v6o"
grant temporário operacional
```

de:

```text id="o5enxz"
registro permanente de auditoria
```

---

# PASSO 6 — BACKUP AUTOMÁTICO E RESTAURAÇÃO

A cópia usada na V1.1 foi evidência de release.

Agora precisamos de um mecanismo operacional verdadeiro.

Implementar backup local seguro do SQLite utilizando mecanismo consistente.

NÃO fazer simples cópia insegura de arquivo durante escrita.

Definir estrutura para:

- criação;
- identificação;
- integridade;
- retenção;
- restauração;
- validação.

Exemplo conceitual:

```text id="3b2mtw"
backup
├── versão
├── schema
├── data/hora
├── checksum
└── banco consistente
```

---

# PASSO 7 — POLÍTICA DE RETENÇÃO DE BACKUPS

Criar política configurável/conservadora inicialmente.

Não apagar automaticamente o único backup válido.

Antes de qualquer purge:

- identificar backups válidos;
- preservar quantidade mínima;
- impedir exclusão durante geração;
- registrar falhas.

Documentar que backup local NÃO substitui futuro backup externo/cloud.

Não prometer RPO/RTO que ainda não foram comprovados.

---

# PASSO 8 — TESTE REAL DE RESTAURAÇÃO

Backup sem teste de restore não deve ser considerado certificado.

Criar teste automatizado ou procedimento reproduzível que:

```text id="vbpt3r"
gera backup
↓
cria ambiente isolado
↓
restaura
↓
abre banco
↓
valida integridade
↓
valida foreign keys
↓
executa verificações importantes
```

Nunca testar restauração sobre o banco operacional.

A restauração de QA deverá ocorrer em cópia/ambiente isolado.

Gerar evidência do ensaio.

---

# PASSO 9 — BENCHMARK DE DESEMPENHO

Antes de otimizar, medir.

Criar benchmark reproduzível usando dados SINTÉTICOS.

Não usar dados comerciais reais.

Avaliar pelo menos:

- inicialização;
- login;
- leitura de produtos;
- busca;
- paginação;
- clientes;
- fornecedores;
- compras;
- estoque;
- movimentações;
- venda;
- auditoria;
- materialização do estado;
- gravação;
- consultas que ainda dependem de snapshot.

Criar volumes progressivos razoáveis.

Exemplo conceitual:

```text id="ke9ex8"
pequeno
médio
grande
```

Não fixar números arbitrários se o domínio atual já possuir ferramenta melhor para geração de massa.

Medir:

- tempo;
- memória quando possível;
- queries;
- quantidade de registros processados;
- operações que crescem de forma inadequada.

---

# PASSO 10 — IDENTIFICAR MATERIALIZAÇÕES DESNECESSÁRIAS

O relatório V1.1 informou que algumas escritas ainda materializam o estado comercial e reconstroem tabelas/espelhos.

Mapear exatamente:

```text id="p2e1or"
qual operação
↓
materializa o quê
↓
por quê
↓
custo aproximado
↓
necessidade real
```

Não remover a camada de compatibilidade às cegas.

Primeiro identificar dependências.

Classificar:

```text id="fhqmb9"
necessário temporariamente
removível
substituível por query
dependência de tela legada
dependência de snapshot
```

Documentar o mapa.

---

# PASSO 11 — NORMALIZAÇÃO DE VENDAS

Depois das etapas anteriores, normalizar o agregado de Vendas.

Este é o principal agregado novo da V1.2.

Criar modelo relacional compatível com o comportamento existente.

Preservar integralmente:

- IDs;
- empresa;
- unidade;
- datas;
- itens;
- quantidades;
- preços;
- descontos existentes;
- totais;
- cliente quando existente;
- executor;
- autorizador quando existente;
- situação;
- vínculos com estoque;
- referências existentes;
- informações adicionais/legadas necessárias;
- ausência/null quando semanticamente diferente.

NÃO inventar informações antigas.

NÃO atribuir usuários autenticados retroativamente a vendas antigas.

---

# PASSO 12 — VALORES MONETÁRIOS

Manter regra:

NÃO utilizar floating point binário para dinheiro.

Utilizar representação exata compatível com a arquitetura existente.

Centavos e valores precisam sobreviver:

```text id="th1l28"
migração
↓
persistência
↓
consulta
↓
serialização
↓
reimportação/equivalência
```

sem alteração silenciosa.

---

# PASSO 13 — QUANTIDADES DE VENDA

A arquitetura futura suporta produtos fracionados.

Portanto:

NÃO modelar Vendas de maneira que obrigue quantidade inteira em definitivo.

Entretanto:

NÃO habilitar venda fracionada ainda sem especificação das regras de:

- unidades;
- precisão;
- arredondamento;
- conversão;
- embalagem.

Preservar comportamento atual.

A modelagem deverá permitir evolução futura.

---

# PASSO 14 — ITENS DE VENDA RELACIONAIS

Itens deverão possuir identidade e vínculo consistente.

Conceitualmente:

```text id="l8c0vw"
sale
↓
sale_items
↓
product / variation
```

Mas adaptar ao domínio REAL existente.

Não introduzir modelo simplificado que destrua:

- snapshots históricos de descrição/preço;
- variações;
- códigos;
- informação necessária para reconstruir a venda original.

Venda histórica deve continuar representando o que aconteceu no momento da operação.

---

# PASSO 15 — VENDA ↔ ESTOQUE

Preservar atomicidade já alcançada.

Uma venda que movimenta estoque deve garantir:

```text id="jad3ke"
Venda
+
Itens
+
Movimentos de estoque
+
Auditoria
```

na mesma operação transacional quando fizerem parte da mesma confirmação.

Se qualquer etapa obrigatória falhar:

ROLLBACK.

Não permitir:

```text id="9n0cu2"
venda gravada
+
estoque não baixado
```

ou:

```text id="3nw6j6"
estoque baixado
+
venda inexistente
```

---

# PASSO 16 — IDEMPOTÊNCIA DE VENDA

Preservar e fortalecer proteção contra reenvio.

Exemplo:

```text id="l3f2go"
usuário confirma
↓
rede demora
↓
frontend reenvia
```

Resultado esperado:

UMA venda.

Não duas.

A mesma regra deverá futuramente ajudar Commerce Hub e integrações externas.

---

# PASSO 17 — CONCORRÊNCIA

Testar cenários de concorrência.

Exemplo:

```text id="e7wqia"
Estoque disponível: 1

Caixa A tenta vender
Caixa B tenta vender
```

O sistema não pode permitir resultado inconsistente.

Não resolver somente pela interface.

A autoridade está no backend/transação.

---

# PASSO 18 — AUTORIZAÇÃO DE PRODUTO INATIVO

A funcionalidade introduzida na V1.1 deve sobreviver integralmente à normalização de Vendas.

Preservar:

- executor;
- autorizador;
- permissão;
- senha real;
- motivo;
- expiração;
- vínculo ao conteúdo;
- prevenção contra replay;
- auditoria;
- identificação dos itens realmente excepcionais.

Não reimplementar de maneira mais fraca.

---

# PASSO 19 — MIGRAÇÃO DE VENDAS EXISTENTES

Criar migration aditiva.

Não modificar checksums de migrations anteriores.

A migração deverá verificar equivalência entre:

```text id="ub9d9p"
origem histórica
e
modelo relacional
```

Validar pelo menos:

- quantidade de vendas;
- IDs;
- itens;
- quantidades;
- totais;
- centavos;
- datas;
- situação;
- relacionamentos;
- extras relevantes;
- executor/autorizador quando realmente verificados;
- ausência/null.

Se a equivalência não puder ser provada:

falhar explicitamente.

Não importar silenciosamente dados divergentes.

---

# PASSO 20 — SQL COMO AUTORIDADE DE VENDAS

Depois da migração validada:

o agregado relacional de Vendas deverá caminhar para ser sua autoridade.

Não manter indefinidamente duas fontes independentes concorrentes.

Se um espelho de compatibilidade continuar necessário temporariamente:

- documentar;
- verificar equivalência;
- escrever atomicamente;
- definir caminho de remoção.

Não permitir divergência silenciosa.

---

# PASSO 21 — CONSULTA RELACIONAL DE VENDAS

Criar endpoint/query específico.

Suportar conforme domínio atual:

- paginação;
- busca;
- filtros;
- ordenação;
- período;
- situação;
- cliente;
- usuário;
- unidade.

Todos os filtros/ordenação devem ser validados no servidor.

Não permitir SQL arbitrário vindo do frontend.

---

# PASSO 22 — DTOs DE VENDAS

Não devolver o estado comercial inteiro para listar vendas.

Criar respostas proporcionais à tela.

Exemplo conceitual:

```text id="oh3qms"
lista
→ resumo da venda

detalhe
→ venda completa autorizada
```

Evitar transportar catálogo, estoque, financeiro e outras áreas sem necessidade.

---

# PASSO 23 — PERMISSÕES

Reutilizar modelo deny-by-default existente.

Consulta de vendas exige direito adequado.

Detalhes sensíveis não deverão aparecer simplesmente porque o usuário conhece um ID.

Validar sempre:

- sessão;
- empresa;
- unidade;
- vínculo;
- permissão;
- recurso.

Testar manipulação direta de IDs.

---

# PASSO 24 — PREPARAÇÃO PARA OMNICHANNEL SEM IMPLEMENTÁ-LO

A normalização de Vendas NÃO deve implementar Mercado Livre/Shopee agora.

Mas deve evitar impedir futuramente a identificação de origem da venda.

Se já houver conceito equivalente no domínio, reutilizar.

Caso seja necessária pequena extensão arquitetural, planejar algo semanticamente semelhante a:

```text id="7l5m3o"
origem/canal
identificador externo opcional
```

SEM acoplar Mercado Livre, Shopee ou WooCommerce ao core.

Não criar dezenas de campos específicos de marketplace em `sales`.

Futuras integrações usarão Commerce Hub/adapters.

---

# PASSO 25 — DESEMPENHO APÓS NORMALIZAÇÃO

Reexecutar benchmarks.

Comparar:

```text id="ihkv9f"
antes
vs
depois
```

Especialmente:

- listar vendas;
- buscar;
- filtrar;
- abrir detalhe;
- gravar venda;
- movimentar estoque;
- auditoria.

Não declarar melhoria sem medição.

Se houver regressão significativa:

investigar.

---

# PASSO 26 — NÃO NORMALIZAR TODO O RESTO NESTA MESMA RODADA

Depois de Vendas:

PARE.

Não avançar automaticamente para:

- Caixa;
- Financeiro;
- Orçamentos;
- Reservas;
- Devoluções;
- Fiscal.

Primeiro concluir, testar e documentar Vendas.

Queremos entregas auditáveis e recuperáveis.

---

# PASSO 27 — TESTES

O baseline conhecido é 457.

Todos devem continuar passando.

Adicionar testes específicos para a V1.2.

Cobrir pelo menos:

## Senhas/sessões

- troca válida;
- senha atual errada;
- reset autorizado;
- reset sem permissão;
- revogação;
- isolamento entre tenants.

## Backup

- criação;
- integridade;
- retenção;
- falha;
- restore isolado;
- banco restaurado válido.

## Vendas

- migração;
- equivalência;
- itens;
- centavos;
- quantidade;
- datas;
- null;
- extras;
- autorização de inativo;
- concorrência;
- idempotência;
- rollback;
- auditoria;
- estoque;
- tenant;
- unidade;
- manipulação de ID;
- filtros;
- paginação;
- permissão.

Nunca executar testes destrutivos sobre o banco operacional.

---

# PASSO 28 — CONFERÊNCIA VISUAL

Após backend e testes:

conferir interface usando ambiente sintético.

Verificar pelo menos:

- login;
- troca de senha;
- sessões;
- lista de vendas;
- filtros;
- paginação;
- detalhes;
- venda normal;
- venda excepcional;
- histórico relacionado.

Não gravar operações de QA na loja operacional.

---

# PASSO 29 — DOCUMENTAÇÃO

Atualizar conforme necessário:

```text id="u87cs4"
PROJECT_MASTER.md
PROJECT_MAP.md
ROADMAP.md
DATABASE.md
SECURITY.md
ARCHITECTURE.md
DECISIONS.md
CHANGELOG_ARCHITECTURE.md
```

Se houver documentação operacional adequada, registrar:

- Git;
- backup;
- restore;
- benchmark;
- migração de Vendas.

Não transformar `AGENTS.md` em um documento gigantesco.

Ele deve continuar funcionando principalmente como mapa/instrução para agentes.

---

# PASSO 30 — NOVA VERSÃO

Se todos os critérios forem cumpridos:

preparar versão:

`1.2.0-foundation.1`

ou seguir a convenção de versão já estabelecida no repositório caso ela determine outro identificador.

Não alterar versão antes de testes e critérios de entrega estarem concluídos.

---

# CRITÉRIOS DE ACEITAÇÃO

A V1.2 somente será considerada concluída quando:

1. baseline anterior continuar íntegro;
2. Git local estiver seguro e sem secrets;
3. troca/reset de senha estiverem testados;
4. revogação de sessões estiver testada;
5. grants expirados possuírem manutenção segura;
6. backup operacional estiver implementado;
7. restore tiver sido realmente ensaiado;
8. benchmark antes/depois existir;
9. Vendas estiverem relacionais;
10. migração de Vendas provar equivalência;
11. venda/estoque/auditoria permanecerem atômicos;
12. idempotência continuar funcionando;
13. concorrência estiver coberta;
14. venda excepcional permanecer segura;
15. listagem não depender do estado comercial completo;
16. permissões/tenant/unit continuarem isolados;
17. regressão completa passar;
18. documentação estiver atualizada.

---

# USO DOS ESPECIALISTAS

Utilize especialistas somente quando agregarem valor.

Não chamar todos os agentes indiscriminadamente.

Sugestão:

## Git / backup / operação

- Arquitetura
- Segurança
- Backend
- QA
- Documentação

## Vendas / persistência

- Arquitetura
- Produto/Domínio
- Backend
- Banco
- Segurança
- QA

## Interface

- Frontend/UX
- Produto/Domínio
- QA

O coordenador principal deve consolidar decisões e impedir implementações conflitantes.

---

# PRINCÍPIOS QUE NÃO PODEM SER QUEBRADOS

Continuam obrigatórios:

- deny-by-default;
- backend como autoridade;
- isolamento multiempresa;
- isolamento por unidade;
- dinheiro sem float binário;
- quantidade preparada para decimal;
- transações nas operações críticas;
- auditoria;
- idempotência;
- migrations aditivas;
- nenhum segredo hardcoded;
- nenhum usuário histórico inventado;
- nenhuma autoria retroativa falsa;
- nenhum teste destrutivo no banco operacional;
- nenhuma regra específica de marketplace espalhada pelo core;
- nenhuma dependência do frontend para segurança.

---

# RELATÓRIO FINAL

Quando terminar toda a V1.2, não inicie outra fase automaticamente.

Entregue relatório contendo:

1. versão final;
2. estado inicial confirmado;
3. tarefas executadas;
4. migrations criadas;
5. quantidade total de testes;
6. testes aprovados/falhos/ignorados;
7. mudanças de senha/sessão;
8. funcionamento do backup;
9. resultado real do teste de restore;
10. benchmark antes/depois;
11. modelo relacional de Vendas;
12. quantidade de vendas migradas no ambiente de teste aplicável;
13. prova de equivalência;
14. atomicidade Venda/Estoque/Auditoria;
15. comportamento de concorrência;
16. comportamento da venda excepcional;
17. dependências de snapshot ainda existentes;
18. dívida técnica restante;
19. riscos ainda não resolvidos;
20. arquivos/documentação atualizados;
21. evidências de QA;
22. recomendação para a próxima fase.

Também informar explicitamente o que NÃO foi implementado.

Após o relatório:

PARE E AGUARDE NOVA ORDEM.