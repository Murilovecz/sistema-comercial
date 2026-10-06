# PRÓXIMOS 10 PASSOS — FUNDAÇÃO V1.1

Objetivo desta etapa:

**reduzir a dependência dos snapshots comerciais, melhorar autorização por perfil e preparar a camada comercial para crescer com segurança.**

Não iniciar ainda:

- cloud de produção;
- Edge/offline;
- cobrança SaaS;
- executável final;
- iFood;
- fiscal completo;
- novos nichos.

Executar em ordem. Não avançar deixando regressões abertas.

---

## 1. Separar leituras comerciais por permissão

**Agentes:** Architect + Security + Backend + QA

Hoje o painel comercial exige várias permissões ao mesmo tempo para receber o snapshot completo.

Criar respostas/endpoints menores.

Exemplo:

```text
catalog.view
→ catálogo

inventory.view
→ estoque

sales.view
→ vendas

financial.view
→ financeiro

operations.view
→ operações
```

Um usuário não deve receber dados que não pode visualizar.

Critério:

- vendedor pode acessar catálogo/vendas sem receber financeiro;
- financeiro pode acessar financeiro sem precisar receber estoque completo;
- testes de negação obrigatórios.

---

## 2. Criar camada comercial de consulta paginada

**Agentes:** Backend + Database + QA

Não retornar listas gigantes completas.

Preparar:

- paginação;
- filtros;
- ordenação;
- busca;
- limites seguros.

Aplicar inicialmente a Produtos.

Exemplo conceitual:

```text
GET /products?page=1&pageSize=50
```

Sem quebrar a interface atual.

---

## 3. Normalizar Produtos

**Agentes:** Architect + Database + Backend + QA

Mover Produtos do snapshot para tabelas relacionais reais.

Preservar:

- IDs;
- SKU;
- código de barras;
- nome;
- descrição;
- preço;
- custo quando existente;
- status;
- estoque relacionado;
- campos desconhecidos quando necessário.

Criar migration e ferramenta de conferência.

Não remover imediatamente a representação antiga sem validar equivalência.

---

## 4. Normalizar Clientes

**Agentes:** Database + Backend + Security + QA

Mover Clientes para estrutura relacional.

Preservar:

- IDs;
- contatos;
- documentos;
- histórico;
- observações;
- vínculos;
- dados desconhecidos.

Garantir tenant/unidade corretamente.

Testar tentativa de acesso cruzado entre empresas.

---

## 5. Normalizar Fornecedores

**Agentes:** Database + Backend + QA

Transformar Fornecedores em entidade relacional real.

Preservar vínculos necessários com:

- compras;
- produtos;
- custos;
- documentos.

Não criar regras de fornecedor ainda inexistentes.

---

## 6. Normalizar Compras e Recebimentos

**Agentes:** Product + Architect + Database + Backend + QA

Este passo deve respeitar uma regra já definida:

**não criar uma segunda entrada de estoque paralela.**

Fluxo desejado:

```text
Compra
↓
Recebimento
↓
Entrada de estoque
↓
Atualização de custo
↓
Financeiro quando aplicável
```

Recebimento parcial deve continuar possível se já existir.

Tudo dentro de transação.

---

## 7. Normalizar Estoque e Movimentações

**Agentes:** Product + Database + Backend + Security + QA

Criar estrutura real para:

- saldo;
- entrada;
- saída;
- ajuste;
- venda;
- compra;
- transferência;
- cancelamento.

Toda movimentação deve ter origem rastreável.

Exemplo:

```text
movimento_id
produto_id
unidade_id
tipo
quantidade
origem_tipo
origem_id
executado_por
autorizado_por
timestamp
```

Não aceitar alteração silenciosa de saldo sem histórico.

---

## 8. Implementar autorização excepcional inicial

**Agentes:** Product + Security + Backend + QA

Definir e implementar um primeiro fluxo controlado de autorização excepcional para atender a necessidade já registrada de:

**venda de produto desativado.**

Fluxo conceitual:

```text
Produto desativado
↓
Usuário tenta vender
↓
Sistema bloqueia
↓
Solicita autorização
↓
Usuário autorizado confirma identidade
↓
Motivo obrigatório
↓
Venda liberada
↓
Auditoria registra executor + autorizador
```

Não usar PIN, biometria ou outro mecanismo sem decisão explícita.

Usar mecanismo compatível com a autenticação existente.

---

## 9. Aplicar melhorias pendentes do passeio que já possuem base segura

**Agentes:** Product + Frontend/UX + Backend + QA

Implementar os ajustes já registrados que agora podem ser feitos sem improvisação:

- quick view em Produtos;
- quick view em Clientes;
- quick view em cadastros semelhantes onde fizer sentido;
- executor/autorizador no histórico de estoque;
- custo acessível pela fonte já existente de Compras/Custos recebidos;
- tornar limpeza de filtros mais visível.

Não duplicar:

- lançamento de custo;
- entrada de estoque;
- recebimento de compra.

---

## 10. Regressão completa e relatório V1.1

**Agentes:** Architect + Security + Backend + Database + Frontend + QA + Documentation

Ao terminar:

1. rodar toda a suíte anterior;
2. rodar novos testes;
3. confirmar isolamento entre tenants;
4. confirmar permissões parciais;
5. confirmar paginação;
6. confirmar equivalência da migração;
7. confirmar compras/estoque transacionais;
8. confirmar autorização excepcional;
9. conferir visualmente fluxos principais;
10. atualizar documentação.

Atualizar:

```text
PROJECT_MASTER.md
PROJECT_MAP.md
DATABASE.md
MODULES.md
SECURITY.md
ROADMAP.md
DECISIONS.md
CHANGELOG_ARCHITECTURE.md
```

Gerar relatório contendo:

```text
Antes — foundation.1
Depois — V1.1
```

Informar:

- número total de testes;
- regressões encontradas;
- mudanças no banco;
- entidades já normalizadas;
- entidades ainda em snapshot;
- riscos restantes;
- dívida técnica;
- próximo conjunto recomendado.

---

# REGRA DA ETAPA

Normalizar **um agregado por vez**.

Não fazer migração comercial completa em uma única refatoração.

A sequência preferida é:

```text
Produtos
↓
Clientes
↓
Fornecedores
↓
Compras
↓
Estoque
```

Somente depois atacar:

```text
Vendas
Caixa
Financeiro
```

porque possuem impacto maior em integridade contábil e operacional.

O sistema deve continuar utilizável durante toda a transição.