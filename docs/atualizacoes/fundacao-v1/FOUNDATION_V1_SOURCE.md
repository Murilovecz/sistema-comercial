# PRÓXIMOS 20 PASSOS — FUNDAÇÃO V1

Execute os passos abaixo **em ordem**.

Esta tarefa tem como objetivo começar a transformar o protótipo V0.12.0 em uma fundação real de produto, preservando todas as funcionalidades atuais.

Não reescreva o sistema inteiro.

Não implemente ainda cloud, Edge, iFood, cobrança SaaS, executável Windows ou novos módulos setoriais.

A prioridade agora é:

**identidade + empresas + unidades + autorização + persistência transacional + auditoria + contratos sólidos.**

Em cada etapa:

- preserve funcionalidades existentes;
- execute os testes relevantes;
- não avance deixando testes quebrados;
- atualize a documentação quando necessário;
- registre decisões arquiteturais importantes;
- não invente requisitos classificados como A DEFINIR.

---

## 1. Criar uma baseline imutável da V0.12.0

**Agentes:** Architect + QA + Documentation

Antes de modificar a fundação:

- registrar estado atual;
- confirmar versão V0.12.0;
- rodar todos os testes;
- registrar novamente quantidade de testes aprovados;
- identificar arquivos principais;
- registrar comportamento atual.

Criar um ponto claro de comparação antes das mudanças.

Critério de aceite:

**205 testes atuais continuam passando e o estado original está documentado.**

---

## 2. Mapear completamente o `database.json`

**Agentes:** Architect + Database + Backend

Analisar:

```text
data/database.json
```

Identificar todas as coleções/entidades atuais.

Para cada uma, documentar:

- nome;
- campos;
- tipos aparentes;
- IDs;
- relações;
- referências;
- campos obrigatórios;
- campos opcionais;
- datas;
- valores monetários;
- histórico.

Não migrar ainda.

Atualizar:

```text
docs/DATABASE.md
```

---

## 3. Produzir o modelo conceitual futuro do banco

**Agentes:** Architect + Database + Security

Criar o modelo conceitual inicial para:

```text
Empresa
Unidade
Usuário
Sessão
Papel
Permissão
Usuário ↔ Empresa
Usuário ↔ Unidade
Cliente
Fornecedor
Produto
Compra
Estoque
Venda
Caixa
Financeiro
Auditoria
```

Mostrar relacionamentos.

Distinguir:

```text
JÁ EXISTE
```

de:

```text
NOVO
```

Não alterar banco ainda.

---

## 4. Escolher banco SQL e camada de acesso

**Agentes:** Architect + Database + Backend + DevOps

Avaliar opções adequadas ao projeto.

A preferência estratégica pode considerar PostgreSQL, mas NÃO assumir a escolha sem análise.

Comparar pelo menos:

- PostgreSQL;
- SQLite para desenvolvimento/local quando aplicável;
- estratégia de desenvolvimento versus produção;
- ORM/query builder compatível com a stack atual.

Se avaliar ORM/query builder, considerar alternativas adequadas à stack.

Documentar:

- escolha;
- motivos;
- vantagens;
- riscos;
- impacto;
- estratégia de migrations.

Registrar decisão em:

```text
docs/DECISIONS.md
```

---

## 5. Preparar infraestrutura de migrations

**Agentes:** Database + Backend + QA

Depois da escolha anterior:

- instalar/configurar camada de banco;
- criar sistema de migrations;
- não remover `database.json` ainda;
- criar configuração separada para desenvolvimento/testes;
- garantir que testes não utilizem banco de produção.

Criar a primeira migration estrutural apenas quando o modelo estiver aprovado.

---

## 6. Criar entidade `Empresa`

**Agentes:** Architect + Backend + Database + Security + QA

Criar entidade real de tenant.

Campos iniciais mínimos devem ser definidos tecnicamente sem inventar regras comerciais.

Exemplos possíveis:

```text
id
nome
status
created_at
updated_at
```

Outros apenas se necessários.

Criar testes.

---

## 7. Criar entidade `Unidade`

**Agentes:** Product + Backend + Database + Security + QA

Relacionamento:

```text
Empresa
  ↓
Unidades
```

Uma empresa poderá ter uma ou várias unidades.

Preparar estrutura para:

- matriz;
- filial;
- loja;
- depósito;
- escritório;

sem criar regras específicas desnecessárias agora.

---

## 8. Criar usuários reais

**Agentes:** Security + Backend + Database + QA

Substituir conceitualmente o login fictício por estrutura real de usuário.

Criar entidade:

```text
Usuário
```

Preparar:

- identificação;
- login;
- status;
- senha armazenada de forma segura;
- timestamps.

Não armazenar senha reversível.

Utilizar password hashing adequado.

Preferência atual:

```text
Argon2id
```

se compatível com a stack.

---

## 9. Implementar autenticação real

**Agentes:** Security + Backend + QA

Criar fluxo real:

```text
Login
↓
Validação
↓
Sessão autenticada
↓
Logout
```

Não confiar em nome salvo no navegador.

Implementar proteção adequada para sessão conforme arquitetura escolhida.

Criar testes para:

- login correto;
- senha errada;
- usuário inexistente;
- usuário desativado;
- logout;
- sessão inválida;
- sessão expirada.

---

## 10. Criar vínculo Usuário ↔ Empresa ↔ Unidade

**Agentes:** Architect + Security + Backend + Database + QA

Um usuário poderá futuramente participar de:

- uma empresa;
- várias empresas;
- uma ou várias unidades.

Não hardcode usuário = uma empresa para sempre se isso criar limitação futura.

Modelar corretamente os vínculos.

---

## 11. Implementar RBAC inicial

**Agentes:** Security + Product + Backend + Database + QA

Criar fundação de:

```text
Papéis
Permissões
```

Exemplos conceituais:

```text
sales.create
sales.cancel
inventory.view
inventory.adjust
financial.view
financial.manage
users.manage
```

Não precisa criar centenas agora.

Criar estrutura extensível.

Backend será autoridade.

---

## 12. Criar middleware/camada central de autorização

**Agentes:** Security + Backend + Architect + QA

Evitar verificações espalhadas como:

```text
if (user.admin) ...
```

por todo o sistema.

Criar mecanismo central para verificar:

```text
Quem é o usuário?
Qual empresa?
Qual unidade?
Qual recurso?
Qual ação?
Possui permissão?
```

Resposta:

```text
permitido
```

ou:

```text
403
```

---

## 13. Implementar isolamento real entre tenants

**Agentes:** Security + Database + Backend + QA

Este passo é CRÍTICO.

Toda entidade pertencente a uma empresa deverá possuir forma inequívoca de identificar seu tenant.

Criar testes explicitamente tentando:

```text
Empresa A acessar Empresa B.
```

Testar pelo menos:

- leitura;
- alteração;
- exclusão;
- referência cruzada;
- IDs manipulados.

Todos devem falhar.

---

## 14. Criar contexto de requisição

**Agentes:** Architect + Security + Backend

Depois da autenticação, cada requisição deverá conseguir determinar de forma confiável:

```text
user_id
empresa_id
unidade_id
permissões relevantes
session_id
```

Evitar depender de valores arbitrários enviados pelo frontend.

Esse contexto será utilizado pelas regras de autorização e auditoria.

---

## 15. Implementar auditoria estruturada

**Agentes:** Security + Backend + Database + QA

Criar estrutura real de auditoria.

Registrar inicialmente ações críticas como:

```text
LOGIN
LOGOUT
CREATE
UPDATE
DELETE/DEACTIVATE
CANCEL
STOCK_ADJUSTMENT
PERMISSION_CHANGE
```

Quando aplicável armazenar:

```text
usuário
empresa
unidade
ação
entidade
registro
antes
depois
data/hora
```

Não registrar secrets ou senhas.

---

## 16. Implementar executor e autorizador

**Agentes:** Product + Security + Backend + Database + QA

Preparar estrutura para operações que necessitam autorização excepcional.

Precisamos poder registrar:

```text
executado_por
autorizado_por
motivo
data/hora
```

Isso atende também uma das anotações pendentes do passeio.

Aplicar inicialmente somente onde fizer sentido.

Não inventar PIN ou fluxo final sem definição.

---

## 17. Preparar camada de persistência transacional

**Agentes:** Database + Backend + Architect + QA

Operações relacionadas não poderão ficar parcialmente aplicadas.

Preparar transações para fluxos como:

```text
Venda
├── itens
├── estoque
├── pagamento
└── financeiro
```

E:

```text
Compra recebida
├── recebimento
├── estoque
├── custo
└── financeiro
```

Falha em uma parte deve permitir rollback adequado.

---

## 18. Criar estratégia de migração do `database.json`

**Agentes:** Database + Backend + QA + Documentation

NÃO apagar os dados existentes.

Criar ferramenta/script de migração capaz de:

```text
database.json
      ↓
validação
      ↓
transformação
      ↓
SQL
      ↓
verificação
```

O processo deve:

- preservar IDs quando adequado ou criar mapeamento;
- preservar histórico;
- validar totais;
- detectar registros inválidos;
- gerar relatório.

Testar primeiro sobre cópia.

Nunca migrar destruindo o original.

---

## 19. Migrar o protótipo para a nova persistência sem mudar a experiência

**Agentes:** Architect + Backend + Database + Frontend + QA

Depois dos passos anteriores estarem funcionando:

substituir progressivamente o uso direto de:

```text
data/database.json
```

pela nova camada de persistência.

A interface atual deve continuar funcionando praticamente igual.

Não aproveitar esta etapa para redesenhar telas.

Objetivo:

```text
mesmo sistema visível
+
fundação muito mais robusta por baixo
```

Rodar regressão completa.

---

## 20. Fazer auditoria geral da Fundação V1

**Agentes:**

```text
Architect
Product
Security
Backend
Database
Frontend
QA
DevOps
Documentation
```

Integrations somente se necessário.

Ao final:

1. rodar todos os testes antigos;
2. rodar novos testes;
3. testar autenticação;
4. testar permissões;
5. testar isolamento entre empresas;
6. testar transações;
7. testar migração;
8. procurar secrets no código;
9. revisar erros e logs;
10. verificar regressões visuais principais;
11. atualizar documentação;
12. atualizar PROJECT_MAP;
13. atualizar ROADMAP;
14. registrar decisões;
15. gerar relatório final.

O relatório deverá mostrar:

```text
ANTES — V0.12.0
versus
DEPOIS — Fundação V1
```

Listando:

- o que foi implementado;
- o que foi preservado;
- quantidade total de testes;
- riscos restantes;
- dívida técnica restante;
- itens A DEFINIR;
- próximo conjunto recomendado de tarefas.

---

# REGRA FINAL

Não quero 20 refatorações gigantescas.

Quero uma sequência de 20 etapas controladas.

Se uma etapa revelar que a próxima precisa mudar, documente o motivo e ajuste a implementação sem abandonar os princípios do projeto.

Não iniciar ainda:

```text
Cloud de produção
Edge offline
Executável Windows final
Cobrança SaaS
Fiscal completo
iFood
Delivery Much
Novos módulos setoriais
IA
```

antes da Fundação V1 estar confiável.

O objetivo destes 20 passos é transformar:

```text
Protótipo local funcional
```

em:

```text
Núcleo real de uma plataforma empresarial
```

sem perder o que já funciona.