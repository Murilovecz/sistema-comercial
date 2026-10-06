# PROMPT MESTRE DO PROJETO

Leia este documento inteiro antes de alterar qualquer arquivo.

Este texto define a visão de longo prazo, os princípios arquiteturais, as regras de segurança e a forma como este projeto deverá evoluir.

NÃO tente implementar tudo descrito aqui imediatamente.

O objetivo deste documento é garantir que todas as decisões tomadas a partir de agora sejam compatíveis com o produto que queremos construir no longo prazo.

O sistema deverá começar simples, mas sua fundação não pode impedir a evolução futura.

---

# 0. PRIMEIRA REGRA: NÃO COMEÇAR PROGRAMANDO

Antes de fazer qualquer alteração:

1. Leia o repositório inteiro.
2. Identifique todas as tecnologias utilizadas.
3. Entenda como o projeto está organizado.
4. Identifique frontend, backend, banco, autenticação e infraestrutura existentes.
5. Liste todas as funcionalidades já implementadas.
6. Identifique código temporário, dívida técnica e possíveis riscos.
7. Analise o banco de dados atual.
8. Identifique o que pode ser preservado.
9. Identifique o que precisará evoluir.
10. NÃO reescreva o projeto inteiro sem motivo.

Primeiro faça um diagnóstico.

Depois proponha alterações.

Depois implemente em pequenos passos.

---

# 1. CRIAR A MEMÓRIA OFICIAL DO PROJETO

Antes de grandes alterações, criar no repositório uma estrutura de documentação permanente.

Sugestão:

```text
/
├── AGENTS.md
└── docs/
    ├── PROJECT_MASTER.md
    ├── VISION.md
    ├── ARCHITECTURE.md
    ├── PROJECT_MAP.md
    ├── DATABASE.md
    ├── MODULES.md
    ├── SECURITY.md
    ├── THREAT_MODEL.md
    ├── API.md
    ├── INTEGRATIONS.md
    ├── OFFLINE_EDGE.md
    ├── ROADMAP.md
    ├── DECISIONS.md
    └── CHANGELOG_ARCHITECTURE.md
```

## PROJECT_MASTER.md

Este deverá ser o documento principal.

Ele deverá conter resumidamente:

- o que o sistema é;
- onde queremos chegar;
- arquitetura;
- módulos;
- segurança;
- infraestrutura;
- integrações;
- regras de desenvolvimento;
- roadmap;
- decisões importantes.

Este arquivo funcionará como uma espécie de memória permanente do projeto.

Sempre que uma decisão arquitetural importante for tomada, verificar se o PROJECT_MASTER.md precisa ser atualizado.

---

# 2. AGENTS.md

Criar também um `AGENTS.md` na raiz.

Esse arquivo deve conter instruções curtas e obrigatórias para qualquer IA ou desenvolvedor que trabalhar no projeto.

Exemplos:

- leia `docs/PROJECT_MASTER.md` antes de alterações arquiteturais;
- nunca comprometa isolamento entre empresas;
- nunca coloque secrets no código;
- nunca implemente autorização apenas no frontend;
- preserve compatibilidade sempre que possível;
- não faça grandes refatorações sem necessidade;
- execute testes antes de concluir;
- atualize documentação quando decisões arquiteturais mudarem;
- explique alterações relevantes.

O AGENTS.md deve ser curto.

O PROJECT_MASTER.md será detalhado.

---

# 3. VISÃO DO PRODUTO

Estamos desenvolvendo uma plataforma de gestão empresarial extremamente ampla.

A ideia NÃO é criar somente um ERP.

Também não queremos simplesmente criar vários sistemas diferentes.

Queremos construir uma plataforma capaz de se adaptar a praticamente qualquer tipo de operação empresarial através de:

```text
CORE EMPRESARIAL
+
MÓDULOS
+
CONFIGURAÇÕES
+
INTEGRAÇÕES
+
AUTOMAÇÕES
+
ANÁLISE
```

O mesmo ecossistema deverá conseguir atender empresas completamente diferentes.

Exemplos:

```text
Loja
Restaurante
Pizzaria
Hamburgueria
Bar
Supermercado
Joalheria
Ótica
Oficina
Transportadora
Logística
Salão
Barbearia
Materiais para construção
Distribuidora
Atacado
Indústria
Prestador de serviços
Imobiliária
Gestor patrimonial
Gestor de fundo imobiliário
E-commerce
Rede de lojas
Empresa de serviços
Franquia
```

E novos segmentos deverão poder ser adicionados futuramente.

---

# 4. FILOSOFIA CENTRAL

O sistema deverá funcionar como:

```text
                    PLATAFORMA
                        │
        ┌───────────────┴───────────────┐
        │                               │
       CORE                           MÓDULOS
        │                               │
        │              ┌────────────────┼────────────────┐
        │              │                │                │
     Comercial     Restaurante       Logística         Salão
        │
     Financeiro
        │
      Fiscal
        │
     Analytics
```

Não queremos:

```text
sistema_loja.exe
sistema_restaurante.exe
sistema_salao.exe
sistema_logistica.exe
```

Queremos:

```text
UMA PLATAFORMA
+
FUNCIONALIDADES ATIVADAS
CONFORME A OPERAÇÃO
```

---

# 5. ARQUITETURA GERAL

A preferência inicial deverá ser:

**monólito modular bem estruturado.**

Não começar criando dezenas de microserviços.

Microserviços deverão existir somente quando houver necessidade real.

O objetivo inicial é:

```text
Frontend(s)
      ↓
API
      ↓
Backend modular
      ↓
Banco de dados
```

Futuramente determinadas áreas poderão ser separadas.

---

# 6. CLOUD-FIRST

A arquitetura deverá ser prioritariamente baseada em nuvem.

Não queremos depender do computador de algum funcionário como servidor principal.

Pequena empresa:

```text
PC
PC
PC
 │
Internet
 │
Nossa nuvem
```

Empresa maior:

```text
             NUVEM
               │
          Internet
               │
         Edge opcional
               │
     Rede interna da empresa
```

---

# 7. EDGE LOCAL

Futuramente deverá existir um componente opcional local.

Nome ainda não definido.

Exemplo conceitual:

```text
Local Edge Service
```

Poderá funcionar em:

- mini-PC;
- servidor local;
- computador dedicado.

Responsabilidades possíveis:

- cache;
- funcionamento temporariamente offline;
- filas;
- impressão;
- dispositivos;
- balanças;
- impressoras térmicas;
- pinpads;
- KDS;
- sincronização;
- comunicação local.

Mas:

**o Edge não será a fonte central dos dados.**

A nuvem continuará sendo a autoridade principal.

---

# 8. MULTIEMPRESA / MULTITENANT

O sistema deverá nascer preparado para múltiplas empresas.

Conceitualmente:

```text
PLATAFORMA
│
├── Empresa A
│   ├── Unidade 1
│   └── Unidade 2
│
├── Empresa B
│   └── Unidade 1
│
└── Empresa C
```

Dados jamais poderão atravessar tenants indevidamente.

Cada recurso que pertença a uma empresa deverá possuir relacionamento correto com seu tenant.

Quando aplicável:

```text
empresa_id
unidade_id
```

Mas não duplicar campos desnecessariamente quando a associação puder ser determinada de maneira segura através da modelagem.

A arquitetura do banco deverá ser cuidadosamente projetada.

---

# 9. MULTIUNIDADE

Uma empresa poderá possuir:

```text
Matriz
Loja 1
Loja 2
Loja 3
Centro de distribuição
Escritório
```

Cada unidade poderá ter:

- estoque;
- caixas;
- usuários;
- vendas;
- pedidos;
- despesas;
- contas;
- equipamentos;
- regras.

A matriz poderá visualizar informações consolidadas.

---

# 10. USUÁRIOS

Possíveis tipos de usuários:

```text
Proprietário
Administrador
Diretor
Gerente
Supervisor
Financeiro
Comprador
Vendedor
Caixa
Estoquista
Operador
Entregador
Contador
Cozinha
Garçom
Profissional
Motorista
Analista
Gestor
```

Cargo NÃO deve automaticamente determinar tudo.

---

# 11. PERMISSÕES

Precisamos de controle de acesso granular.

Exemplo:

```text
Vendedor João

✓ cadastrar cliente
✓ criar venda
✓ consultar estoque

✗ visualizar custo
✗ visualizar margem
✗ cancelar venda
✗ acessar financeiro
✗ alterar estoque
```

Outra pessoa:

```text
Gerente

✓ conceder desconto até 20%
✓ cancelar venda
✓ visualizar margem

✗ alterar permissões administrativas
```

RBAC deverá ser utilizado.

No futuro, se necessário, também poderemos utilizar políticas mais sofisticadas.

---

# 12. AUTORIZAÇÃO EXCEPCIONAL

Algumas ações podem exigir autorização superior.

Exemplo:

```text
Funcionário tenta dar desconto de 35%.

Limite dele: 10%.

Sistema:
SOLICITAR AUTORIZAÇÃO.
```

Gerente aprova.

Auditoria registra:

```text
Solicitado por: funcionário
Autorizado por: gerente
Valor original
Valor final
Data/hora
Motivo
```

---

# 13. CORE EMPRESARIAL

O núcleo deverá possuir, progressivamente:

```text
Empresas
Unidades
Usuários
Permissões
Clientes
Fornecedores
Produtos
Serviços
Estoque
Compras
Orçamentos
Pedidos
Vendas
Caixa
Financeiro
Relatórios
Dashboards
Auditoria
Arquivos
Configurações
Integrações
Notificações
Assinaturas
Licenças
```

---

# 14. CLIENTES

Cadastro capaz de suportar:

- pessoa física;
- pessoa jurídica;
- documentos;
- endereços;
- contatos;
- observações;
- histórico;
- tags;
- limite;
- crédito;
- compras;
- contas;
- documentos;
- anexos;
- relacionamento comercial.

---

# 15. FORNECEDORES

Deverá possuir:

- cadastro;
- documentos;
- contatos;
- produtos;
- condições comerciais;
- pedidos de compra;
- contas;
- histórico;
- anexos.

---

# 16. PRODUTOS

Precisamos suportar:

```text
SKU
Código de barras
Nome
Descrição
Categoria
Marca
Fornecedor
Custo
Preço
Margem
Estoque
Estoque mínimo
Variações
Imagens
Unidade
Localização
Dados fiscais
Histórico de preço
```

Também produtos compostos, kits e combos futuramente.

---

# 17. SERVIÇOS

Serviços deverão ser entidade própria.

Exemplos:

```text
Corte
Manutenção
Instalação
Consultoria
Frete
Mão de obra
```

Podem possuir:

- preço;
- custo;
- duração;
- profissional;
- comissão;
- impostos;
- unidade.

---

# 18. ESTOQUE

O estoque deverá evoluir para suportar:

- entrada;
- saída;
- reserva;
- transferência;
- ajuste;
- inventário;
- devolução;
- lote;
- validade;
- localização;
- múltiplos depósitos;
- custo médio;
- histórico;
- rastreabilidade.

---

# 19. COMPRAS

Futuramente:

```text
Solicitação
Cotação
Pedido de compra
Recebimento
Conferência
Entrada em estoque
Financeiro
```

Possibilitar comparação de fornecedores.

---

# 20. VENDAS

Fluxos possíveis:

```text
Orçamento
Pré-venda
Pedido
Venda
PDV
Faturamento
Entrega
Troca
Devolução
Cancelamento
```

Origem:

```text
Balcão
PDV
Vendedor
Telefone
WhatsApp
E-commerce
Cardápio
iFood
Delivery Much
Marketplace
API
```

---

# 21. PAGAMENTOS

Suportar futuramente:

```text
Dinheiro
PIX
Cartão
Boleto
Crediário
Vale
Carteira
Transferência
Múltiplos meios
```

Uma venda poderá ter múltiplos pagamentos.

---

# 22. CREDIÁRIO

Precisamos futuramente suportar:

- limite;
- parcelas;
- vencimentos;
- juros;
- multa;
- desconto;
- pagamento parcial;
- inadimplência;
- histórico.

---

# 23. FINANCEIRO

O financeiro deverá ser uma das áreas centrais.

Incluir:

```text
Contas a pagar
Contas a receber
Caixas
Bancos
Transferências
Fluxo de caixa
Centros de custo
Plano de contas
Categorias
Receitas
Despesas
Parcelas
Juros
Multas
Descontos
Conciliação
Previsões
Realizado
```

Diferenciar adequadamente:

```text
Competência
Vencimento
Pagamento
Recebimento
Caixa
```

---

# 24. DRE

Queremos geração automática de DRE gerencial.

Possíveis estruturas:

```text
Receita bruta
(-) deduções
= Receita líquida

(-) CMV / custos
= Lucro bruto

(-) despesas operacionais
= Resultado operacional

etc.
```

Configurações poderão variar conforme empresa.

---

# 25. GESTÃO DE FUNDOS / PATRIMÔNIO

O sistema deverá poder futuramente atender gestores patrimoniais e gestores de fundos imobiliários.

O módulo deverá registrar:

```text
Fundos
Ativos
Imóveis
Participações
Aquisições
Vendas
Receitas
Aluguéis
Custos
Despesas
Reformas
Impostos
Taxas
Contratos
Vacância
Patrimônio
Caixa
```

E produzir:

```text
DRE
Fluxo de caixa
Resultado
Rentabilidade
Receita por ativo
Despesa por ativo
Margens
Indicadores
Patrimônio
```

---

# 26. DASHBOARDS

Dashboard deverá ser operacional e analítico.

Exemplo:

```text
Vendas outubro/2026

R$ 185.000

+12,4% vs setembro
+8,7% vs outubro/2025
+6,2% vs média mensal do ano
```

Comparações possíveis:

```text
Hoje vs ontem
Hoje vs mesmo dia da semana anterior
Mês vs mês anterior
Mês vs mesmo mês do ano anterior
Ano vs ano anterior
Mês vs média do ano
Ticket médio
Margem
Lucro
```

---

# 27. DASHBOARD GERENCIAL

Outros indicadores:

```text
Melhores vendedores
Melhores produtos
Produtos encalhados
Maior margem
Menor margem
Estoque baixo
Estoque parado
Despesas
Receitas
Inadimplência
Contas vencendo
Compras
Fluxo de caixa
```

---

# 28. RELATÓRIOS

Relatórios com filtros avançados.

Possíveis filtros:

```text
Período
Empresa
Unidade
Usuário
Vendedor
Produto
Categoria
Cliente
Fornecedor
Origem
Status
```

Exportação futura:

```text
Excel
CSV
PDF
API
```

---

# 29. BI

No futuro queremos análise mais avançada.

Exemplo:

```text
Vendas caíram 14% nas últimas quatro semanas.

Margem da unidade Bauru está 7,8 pontos abaixo da média.

Produto X vende 42% mais às sextas-feiras.

Estoque atual deve durar aproximadamente 18 dias.
```

IA poderá futuramente ajudar nisso.

IA não é prioridade do MVP.

---

# 30. RESTAURANTES

Módulo específico para:

```text
Restaurante
Pizzaria
Hamburgueria
Bar
Lanchonete
```

Recursos:

- mesas;
- comandas;
- garçons;
- cardápio;
- tamanhos;
- sabores;
- adicionais;
- complementos;
- combos;
- bordas;
- observações;
- delivery;
- retirada;
- balcão.

---

# 31. KDS

Kitchen Display System.

Exemplo:

```text
PEDIDO #9182

Mesa 14

2 X-Bacon
1 Batata
2 Coca-Cola

Tempo:
00:06:37

[PREPARANDO]
```

Status:

```text
Recebido
Em preparação
Pronto
Entregue
```

---

# 32. CARDÁPIO DIGITAL

Cardápio web próprio.

Exemplo:

```text
pedido.plataforma.com/restaurante
```

Ou QR por mesa:

```text
pedido.plataforma.com/restaurante/mesa/12
```

Cliente poderá:

- escolher produto;
- tamanho;
- sabor;
- adicionais;
- observações;
- quantidade;
- fazer pedido.

Futuramente:

- PIX;
- cartão;
- pagamento integrado.

---

# 33. DELIVERY

Centralizar:

```text
Cardápio próprio
Telefone
WhatsApp
iFood
Delivery Much
Outros
```

Tudo deve virar um formato interno padrão de pedido.

---

# 34. INTEGRAÇÕES

Criar camada própria para integrações.

Conceitualmente:

```text
integrations/
├── ifood/
├── delivery_much/
├── whatsapp/
├── ecommerce/
├── marketplaces/
├── banks/
├── payments/
├── shipping/
└── others/
```

Nunca espalhar código específico de fornecedor pelo domínio principal.

---

# 35. IFOOD / DELIVERY MUCH

Arquitetura deverá suportar futuramente:

- pedidos;
- catálogo;
- preço;
- disponibilidade;
- eventos;
- cancelamento;
- status;
- lojas;
- autenticação;
- webhooks.

Podemos possuir preço por canal:

```text
Produto: X-Bacon

Loja        R$30
Cardápio    R$30
iFood       R$36
```

---

# 36. SALÃO / BARBEARIA

Módulo futuro:

```text
Agenda
Profissionais
Clientes
Serviços
Duração
Preços
Comissão
Horários
Bloqueios
Recorrência
Histórico
Produtos utilizados
Venda de produtos
Caixa
```

Agendamento online futuramente.

---

# 37. LOGÍSTICA

Suportar:

```text
Veículos
Motoristas
Rotas
Entregas
Cargas
Romaneios
Ocorrências
Custos
Combustível
Manutenção
Pneus
Documentos
Quilometragem
Rastreamento
Comprovantes
```

---

# 38. MATERIAL PARA CONSTRUÇÃO

Necessidades especiais:

```text
Orçamento
Pedido
Separação
Carga
Expedição
Entrega
Rota
Veículo
Motorista
```

Múltiplas unidades:

```text
unidade
metro
m²
m³
kg
tonelada
saco
caixa
```

Conversões entre unidades quando necessário.

---

# 39. OFICINA

Futuro módulo:

```text
Veículos
Clientes
Ordens de serviço
Peças
Mão de obra
Mecânicos
Orçamentos
Fotos
Checklist
Histórico
Garantias
```

---

# 40. ÓTICA

Possíveis recursos:

```text
Clientes
Receitas
Armações
Lentes
Pedidos
Laboratórios
Medições
Histórico
```

---

# 41. IMOBILIÁRIO

Possivelmente:

```text
Imóveis
Proprietários
Locatários
Contratos
Aluguéis
Repasses
Despesas
Manutenções
Vistorias
Documentos
```

---

# 42. MANUTENÇÃO / FIELD SERVICE

Futuramente:

```text
Ordens de serviço
Técnicos
Agendamentos
Equipamentos
Peças
Deslocamento
Checklists
Fotos
Assinaturas
```

---

# 43. PRODUÇÃO / INDÚSTRIA

Não implementar agora.

Mas preservar possibilidade futura:

```text
Matéria-prima
Ficha técnica
BOM
Ordens de produção
Consumo
Produção
Perdas
Custos
Lotes
```

---

# 44. CRM

Futuro:

```text
Leads
Oportunidades
Funil
Follow-up
Tarefas
Interações
Campanhas
Segmentação
```

---

# 45. CONTRATOS

Módulo genérico futuro:

```text
Contratos
Partes
Vencimentos
Valores
Reajustes
Anexos
Alertas
Renovações
```

---

# 46. ATIVOS / PATRIMÔNIO EMPRESARIAL

Controle:

```text
Máquinas
Computadores
Veículos
Móveis
Equipamentos
Aquisição
Localização
Responsável
Depreciação gerencial
Manutenção
```

---

# 47. ASSINATURAS DO NOSSO SaaS

Nosso sistema será SaaS.

Possíveis planos:

```text
Essencial
Pro
Business
Enterprise
```

Valores NÃO devem ser hardcoded.

Recursos deverão ser controlados por configuração.

Exemplo:

```json
{
  "pdv": true,
  "financeiro": true,
  "restaurante": false,
  "ifood": false,
  "multiunidade": true
}
```

---

# 48. MÓDULOS COMO FEATURES

Funcionalidades devem poder ser ativadas/desativadas.

Exemplo:

```text
Core
Financeiro
Fiscal
Restaurante
Delivery
iFood
Logística
Salão
Oficina
FII
E-commerce
Multiunidade
```

Dependências deverão ser documentadas.

---

# 49. LICENCIAMENTO

Não confiar em arquivo local como única forma de licenciamento.

Backend deverá verificar:

```text
Empresa
Plano
Assinatura
Vencimento
Carência
Módulos
Status
```

---

# 50. VENCIMENTO

Exemplo:

```text
Sua assinatura vence em 5 dias.
```

Depois:

```text
Pagamento vencido há 3 dias.
```

Após carência definida comercialmente, recursos poderão ser restringidos.

Políticas deverão ser configuráveis.

---

# 51. SEGURANÇA É PILAR CENTRAL

SEGURANÇA NÃO É FUNCIONALIDADE OPCIONAL.

Ela deverá fazer parte da arquitetura desde o início.

O sistema potencialmente armazenará:

```text
Clientes
Funcionários
Vendas
Financeiro
Estoque
Documentos
Dados fiscais
Contratos
Credenciais externas
Dados empresariais
```

Uma falha poderá causar prejuízos graves.

---

# 52. MODELO DE AMEAÇA

Criar:

```text
docs/THREAT_MODEL.md
```

Identificar pelo menos:

```text
Atacante externo
Usuário malicioso
Funcionário com acesso excessivo
Empresa tentando acessar outra
Máquina comprometida
Roubo de computador
Roubo de sessão
Credential stuffing
API abuse
Supply chain attack
Insider
Integração comprometida
```

O modelo deverá evoluir conforme o produto.

---

# 53. PRINCÍPIO ZERO TRUST

Nunca confiar automaticamente porque:

```text
está na rede local
é administrador
é computador cadastrado
é frontend oficial
```

Cada ação importante deverá ser autenticada e autorizada adequadamente.

---

# 54. CLIENTE É AMBIENTE NÃO CONFIÁVEL

Considerar qualquer computador cliente potencialmente hostil.

Isso significa:

```text
Nunca confiar apenas no frontend.
Nunca armazenar secrets mestres no cliente.
Nunca depender de código local para autorização crítica.
Nunca acreditar cegamente em dados enviados pelo cliente.
```

---

# 55. AUTORIZAÇÃO BACKEND

Exemplo:

Usuário pertence à:

```text
Empresa 100
```

E solicita:

```text
/api/empresas/101/vendas
```

O backend deve negar.

Mesmo que o frontend tenha sido alterado.

---

# 56. ISOLAMENTO DE TENANT

Toda operação deverá garantir que o usuário somente acesse recursos permitidos de sua empresa.

Não confiar em:

```text
empresa_id enviado pelo navegador
```

sem validá-lo.

Precisamos criar testes automáticos específicos de isolamento entre tenants.

---

# 57. DEFESA EM PROFUNDIDADE

Não depender de uma única proteção.

Possíveis camadas:

```text
Autenticação
Autorização
Tenant isolation
Banco
RLS quando adequado
Auditoria
Rate limiting
Criptografia
Monitoramento
```

---

# 58. SENHAS

Nunca armazenar senha em texto puro.

Usar algoritmo adequado de password hashing.

Preferência atual:

```text
Argon2id
```

com parâmetros adequados.

Nunca criar sistema reversível para visualizar senha do usuário.

---

# 59. MFA

Arquitetura deverá permitir autenticação multifator.

Especialmente para:

```text
Proprietários
Administradores
Financeiro
Administradores internos
```

No futuro também passkeys.

---

# 60. SESSÕES

Sessões deverão:

- expirar;
- ser revogáveis;
- possuir proteção adequada;
- poder ser listadas;
- poder ser encerradas.

Possível tela:

```text
SESSÕES

Windows - Chrome
Ativo agora

Android
Ontem

[ENCERRAR]
```

---

# 61. REAUTENTICAÇÃO

Operações extremamente críticas podem exigir nova autenticação.

Exemplos:

```text
Alterar proprietário
Desativar MFA
Trocar dados bancários
Gerar API key
Excluir empresa
```

---

# 62. CRIPTOGRAFIA EM TRÂNSITO

Comunicação deverá utilizar HTTPS/TLS.

Nunca enviar:

```text
Senha
Token
Dados pessoais
Dados financeiros
```

sem transporte seguro.

---

# 63. CRIPTOGRAFIA EM REPOUSO

Banco de dados, volumes e backups deverão possuir criptografia em repouso quando infraestrutura oferecer suporte.

---

# 64. CRIPTOGRAFIA EM NÍVEL DE APLICAÇÃO

Para campos altamente sensíveis, avaliar criptografia adicional.

Exemplos possíveis:

```text
Tokens externos
Credenciais
Alguns dados bancários
Segredos
Documentos sensíveis
```

Não criptografar indiscriminadamente todos os campos sem necessidade.

Considerar:

```text
Segurança
Performance
Busca
Indexação
Operação
```

---

# 65. CLASSIFICAÇÃO DE DADOS

Criar futuramente classificação como:

```text
Público
Interno
Confidencial
Sensível
Segredo
```

Cada categoria poderá possuir controles diferentes.

---

# 66. GESTÃO DE CHAVES

Chaves criptográficas não deverão ficar junto dos dados.

Preferir arquitetura de gerenciamento de chaves.

Conceitualmente:

```text
Dado
 ↓
DEK
 ↓
protegida por
 ↓
KMS / Key Vault / HSM
```

---

# 67. NUNCA HARDCODE SECRETS

Proibido:

```text
DATABASE_PASSWORD="..."
MASTER_KEY="..."
IFOOD_SECRET="..."
```

no código.

Secrets também não deverão ser commitados no Git.

---

# 68. SECRET MANAGER

Produção deverá utilizar mecanismo apropriado de secrets.

Ambientes diferentes:

```text
DEV
STAGING
PRODUÇÃO
```

Cada um com credenciais independentes.

---

# 69. DADOS LOCAIS

Quando precisarmos guardar dados no computador do cliente:

```text
cache
offline
fila
configuração sensível
```

usar proteção adequada.

Não guardar informações sensíveis em arquivos facilmente legíveis.

---

# 70. IDENTIDADE DE DISPOSITIVO

Futuramente cada instalação poderá possuir identidade própria.

Exemplo:

```text
Dispositivo #8237

Empresa: 100
Unidade: 2
Tipo: PDV
Status: autorizado
```

Possibilitar revogação.

---

# 71. ROUBO DE COMPUTADOR

Roubar ou copiar o disco não deverá automaticamente permitir acesso aos dados.

Dados locais importantes deverão estar protegidos.

Credenciais deverão utilizar mecanismos seguros do sistema operacional/hardware quando adequado.

---

# 72. OBFUSCAÇÃO

Podemos utilizar obfuscação em clientes distribuídos para dificultar engenharia reversa.

Mas:

**OBFUSCAÇÃO NÃO É SEGURANÇA PRINCIPAL.**

Assumir que alguém determinado poderá eventualmente analisar o aplicativo.

---

# 73. CÓDIGO CRÍTICO

Lógica extremamente importante deverá, sempre que possível, permanecer no backend.

Exemplo:

```text
Licenciamento
Autorização
Regras críticas
Segredos
Integrações sensíveis
```

Não confiar somente no executável.

---

# 74. FRONTEND MODIFICADO NÃO PODE LIBERAR FUNÇÃO

Exemplo:

Atacante altera localmente:

```text
enterprise=true
```

Servidor deve continuar respondendo:

```text
403
Módulo não contratado.
```

---

# 75. ASSINATURA DE CÓDIGO

Quando distribuirmos aplicativo desktop:

avaliar assinatura digital do executável.

Atualizações deverão ser verificadas.

---

# 76. ATUALIZAÇÕES

Canal de atualização deverá ser protegido contra substituição maliciosa.

Nunca baixar e executar arquivo sem validação adequada.

---

# 77. SUPPLY CHAIN

Dependências externas representam risco.

Controlar:

```text
Dependências
Versões
Lockfiles
Vulnerabilidades
Atualizações
Origem
```

Evitar dependências desnecessárias.

---

# 78. CI/CD

Pipeline futuro deverá possuir controles como:

```text
Testes
Lint
SAST
Dependency scanning
Secret scanning
Build
Assinatura
Deploy controlado
```

---

# 79. SQL INJECTION

Preferir:

```text
ORM
Queries parametrizadas
Prepared statements
```

Nunca concatenar entrada do usuário em SQL.

---

# 80. INPUT VALIDATION

Toda entrada deve ser validada no backend.

Frontend pode validar para UX.

Backend deve validar para segurança.

---

# 81. UPLOAD DE ARQUIVOS

Uploads deverão possuir:

```text
Tamanho máximo
Tipo permitido
Nome seguro
Armazenamento adequado
Validação
Controle de acesso
```

Não confiar apenas na extensão.

---

# 82. RATE LIMIT

APIs públicas e autenticação precisarão de rate limiting.

Especialmente:

```text
Login
Recuperação de senha
APIs
Webhooks
Consultas pesadas
```

---

# 83. BRUTE FORCE

Criar controles contra:

```text
brute force
credential stuffing
enumeração de usuários
```

---

# 84. WEBHOOKS

Nunca confiar simplesmente em:

```text
POST /webhook
```

Validar autenticidade de acordo com cada fornecedor.

Quando disponível:

```text
assinatura
timestamp
nonce
proteção contra replay
```

---

# 85. AUDITORIA

Ações importantes deverão gerar eventos de auditoria.

Exemplo:

```text
Usuário João

Alterou preço:
R$100 → R$70

01/10/2026 14:33
```

---

# 86. LOG DE SEGURANÇA

Registrar eventos relevantes como:

```text
Login
Falha de login
Alteração de senha
MFA
Mudança de permissão
Exportação de dados
Cancelamento
Alteração financeira
Alteração de configuração
Acesso administrativo
```

---

# 87. LOGS NÃO DEVEM EXPOR SEGREDOS

Nunca registrar em log:

```text
senha
token completo
secret
chave privada
```

Sanitizar dados quando necessário.

---

# 88. AUDITORIA RESISTENTE A ALTERAÇÃO

Usuário comum não deverá poder apagar seus próprios rastros.

Mesmo administradores da empresa não deverão conseguir simplesmente apagar auditorias críticas.

---

# 89. ACESSO DO NOSSO SUPORTE

Nossos próprios funcionários não deverão possuir acesso irrestrito aos clientes sem necessidade.

Preferir:

```text
Cliente solicita suporte
↓
Acesso temporário
↓
Permissão limitada
↓
Auditoria
↓
Expiração automática
```

---

# 90. PRINCÍPIO DO MENOR PRIVILÉGIO

Aplicar a:

```text
Usuários
Serviços
Banco
CI/CD
Suporte
Integrações
Dispositivos
```

---

# 91. BANCO DE DADOS

Aplicação NÃO deverá utilizar usuário de banco com privilégios administrativos desnecessários.

Separar permissões quando adequado.

---

# 92. BACKUP

Criar política de backup.

Considerar:

```text
Banco
Arquivos
Configurações
Auditoria
```

---

# 93. BACKUP CRIPTOGRAFADO

Backups devem possuir proteção adequada.

Nunca deixar dump completo de produção exposto.

---

# 94. TESTE DE RESTAURAÇÃO

Backup só é confiável quando conseguimos restaurar.

Futuramente criar testes periódicos de restore.

---

# 95. RPO / RTO

Conforme sistema crescer, documentar:

```text
RPO
quanto dado podemos perder?

RTO
quanto tempo podemos ficar fora?
```

Podem variar por plano Enterprise.

---

# 96. ALTA DISPONIBILIDADE

Não implementar complexidade prematuramente.

Mas arquitetura não deverá impedir:

```text
Replicação
Failover
Escala horizontal
CDN
Load balancer
```

quando necessário.

---

# 97. OBSERVABILIDADE

Futuramente:

```text
Logs
Métricas
Tracing
Alertas
Health checks
```

---

# 98. DETECÇÃO DE ANOMALIAS

Exemplos:

```text
500 tentativas de login
Exportação incomum
Acesso entre tenants
Volume fora do padrão
Mudança administrativa suspeita
```

---

# 99. INCIDENT RESPONSE

Criar futuramente processo documentado:

```text
Detectar
Conter
Investigar
Corrigir
Restaurar
Registrar
Comunicar quando necessário
```

---

# 100. LGPD

O sistema deverá ser desenvolvido considerando LGPD.

Precisamos considerar:

```text
Finalidade
Minimização
Acesso
Retenção
Correção
Exportação
Exclusão quando aplicável
Anonimização quando aplicável
Auditoria
Incidentes
```

Questões jurídicas deverão ser confirmadas profissionalmente quando chegarmos à operação real.

---

# 101. AMBIENTES

Separar:

```text
DEV
STAGING
PRODUÇÃO
```

Nunca desenvolver rotineiramente diretamente em produção.

---

# 102. DADOS REAIS EM DESENVOLVIMENTO

Evitar usar dados reais de clientes em desenvolvimento.

Quando necessário, utilizar dados anonimizados ou sintéticos.

---

# 103. API-FIRST

Backend deve ser pensado como API.

Isso permitirá:

```text
Desktop
Web
Mobile
KDS
Cardápio
Integrações
Portal
Aplicativos futuros
```

---

# 104. API PÚBLICA FUTURA

Clientes Enterprise poderão eventualmente integrar seus sistemas.

Precisaremos futuramente de:

```text
API keys
OAuth
Scopes
Rate limits
Auditoria
Webhooks
```

---

# 105. DESKTOP

Podemos ter cliente desktop.

Mas desktop deve ser principalmente interface/integração local.

Nunca confiar nele como autoridade de segurança.

---

# 106. MOBILE

Futuramente poderá existir aplicativo para:

```text
Gestores
Vendedores
Entregadores
Motoristas
Profissionais
Clientes
```

---

# 107. PORTAL DO CONTADOR

Futuro:

```text
Documentos
Relatórios
Exportações
Dados fiscais
```

Com permissões próprias.

---

# 108. PORTAL DO CLIENTE

Futuro:

```text
Pedidos
Boletos
Notas
Agendamentos
Histórico
Documentos
```

---

# 109. NOTIFICAÇÕES

Sistema poderá possuir:

```text
Notificação interna
E-mail
Push
WhatsApp
```

---

# 110. AUTOMAÇÕES

Exemplos:

```text
SE estoque < mínimo
ENTÃO avisar comprador.
```

```text
SE conta vencer amanhã
ENTÃO notificar financeiro.
```

```text
SE venda cair 20%
ENTÃO alertar gestor.
```

---

# 111. ENGINE DE REGRAS FUTURO

Não construir agora.

Mas evitar arquitetura que impeça regras configuráveis no futuro.

---

# 112. E-COMMERCE

Possivelmente teremos:

```text
Catálogo
Pedidos
Estoque
Clientes
Preços
Promoções
Integrações
```

---

# 113. MARKETPLACES

Integrações poderão incluir:

```text
Mercado Livre
Shopee
Amazon
Outros
```

Sem acoplamento direto ao core.

---

# 114. FISCAL

Brasil possui alta complexidade fiscal.

Isolar módulo fiscal.

Possíveis recursos:

```text
NF-e
NFC-e
NFS-e
NCM
CFOP
CST
CSOSN
Tributos
```

Nunca espalhar regras fiscais por todo o código.

---

# 115. INTERNACIONALIZAÇÃO FUTURA

Mesmo começando no Brasil, evitar decisões desnecessárias que impeçam:

```text
Moedas
Idiomas
Fusos
Países
Formatos de data
```

Não precisamos implementar agora.

---

# 116. MOEDA

Nunca utilizar float comum para valores financeiros quando isso puder causar erro.

Usar tipo decimal adequado.

---

# 117. DATA E HORA

Armazenar timestamps de forma consistente.

Considerar:

```text
UTC internamente
fuso da empresa/unidade na apresentação
```

Quando adequado à stack.

---

# 118. IDs

Não depender exclusivamente de IDs sequenciais expostos como mecanismo de segurança.

ID não é autorização.

Mesmo usando UUID/ULID/etc., backend deverá validar acesso.

---

# 119. IDEMPOTÊNCIA

Operações financeiras, pagamentos e integrações deverão futuramente suportar idempotência quando necessário.

Evitar duplicação por retry.

---

# 120. TRANSAÇÕES

Operações críticas deverão utilizar transações corretamente.

Exemplo:

```text
Venda
↓
Pagamento
↓
Estoque
↓
Financeiro
```

Não podemos deixar metade concluída sem tratamento.

---

# 121. EVENTOS

Futuramente podemos utilizar eventos.

Exemplo:

```text
VendaConcluida
```

Pode gerar:

```text
Estoque
Financeiro
Comissão
Analytics
Integração
Notificação
```

Mas não criar arquitetura distribuída exagerada agora.

---

# 122. OFFLINE

Planejar possibilidade futura.

Problemas a considerar:

```text
IDs
Conflitos
Filas
Retry
Ordenação
Timestamp
Idempotência
Sincronização
```

---

# 123. CONFLITOS OFFLINE

Precisaremos decidir posteriormente regras por domínio.

Exemplo:

```text
dois caixas vendem a última unidade offline
```

Esse tipo de problema deverá ter estratégia explícita.

---

# 124. PERFORMANCE

Não fazer otimizações prematuras.

Mas manter:

```text
Índices
Paginação
Queries eficientes
Cache quando necessário
```

---

# 125. PAGINAÇÃO

Nunca retornar milhões de registros de uma vez.

APIs de listagem deverão possuir paginação.

---

# 126. PESQUISA

Futuramente podemos ter mecanismo de busca global.

Exemplo:

```text
Cliente
Produto
Venda
Pedido
Documento
```

---

# 127. ARQUIVOS

Uploads deverão preferencialmente ser armazenados fora do banco quando adequado, com metadados e controle de acesso no sistema.

---

# 128. CUSTOMIZAÇÃO

Cada empresa poderá configurar:

```text
Logo
Nome
Tema
Unidades
Moeda
Fuso
Regras
Módulos
Parâmetros
```

---

# 129. WHITE-LABEL

Possibilidade futura para clientes maiores.

Não implementar agora.

---

# 130. FEATURE FLAGS

Podemos utilizar feature flags para:

```text
Testes
Rollout gradual
Módulos
Beta
```

---

# 131. TESTES

Precisamos progressivamente criar:

```text
Unit tests
Integration tests
API tests
Security tests
Tenant isolation tests
End-to-end tests
```

---

# 132. TESTES DE TENANT

Obrigatório criar testes que tentem:

```text
Empresa A acessar Empresa B
```

E confirmem bloqueio.

---

# 133. TESTES DE PERMISSÃO

Exemplo:

```text
Vendedor tenta acessar financeiro
→ negado.
```

---

# 134. MIGRATIONS

Mudanças de banco deverão utilizar migrations.

Evitar alteração manual de produção.

---

# 135. SOFT DELETE

Usar apenas quando fizer sentido.

Dados contábeis/auditoria podem possuir regras diferentes.

Nunca adotar soft delete indiscriminadamente.

---

# 136. EXCLUSÃO

Algumas entidades talvez não devam ser apagadas fisicamente por motivos de integridade/auditoria.

Decidir por domínio.

---

# 137. VERSIONAMENTO DE API

Planejar evolução sem quebrar clientes.

Não precisa criar várias versões desde o início.

Mas evitar contratos caóticos.

---

# 138. DOCUMENTAÇÃO DE API

APIs deverão ser documentadas.

Quando a stack permitir:

```text
OpenAPI / Swagger
```

---

# 139. OBSERVAÇÕES SOBRE COMPLEXIDADE

Este projeto é enorme.

NÃO devemos tentar construir tudo simultaneamente.

O valor estará em:

```text
Arquitetura boa
Fundação sólida
Evolução incremental
```

---

# 140. ROADMAP GERAL

## FASE 1 — FUNDAÇÃO

```text
Arquitetura
Banco
Migrations
Empresas
Unidades
Usuários
Autenticação
Permissões
Módulos
Configurações
Auditoria inicial
Segurança básica
```

## FASE 2 — CORE

```text
Clientes
Fornecedores
Produtos
Serviços
Estoque
```

## FASE 3 — COMERCIAL

```text
Orçamento
Pedido
Venda
PDV
Pagamentos
```

## FASE 4 — FINANCEIRO

```text
Contas
Caixas
Bancos
Fluxo
Categorias
DRE inicial
```

## FASE 5 — ANALYTICS

```text
Dashboard
Comparativos
Relatórios
Indicadores
```

## FASE 6 — FISCAL

## FASE 7 — PRIMEIRO NICHO

Escolher segmento e construir módulo especializado.

## FASE 8 — INTEGRAÇÕES

## FASE 9 — EDGE/OFFLINE

## FASE 10 — AUTOMAÇÃO / BI / IA

---

# 141. MAPA DO PROJETO

Criar:

```text
docs/PROJECT_MAP.md
```

Esse arquivo deve mostrar o estado real do projeto.

Exemplo:

```text
COMPONENTE                 STATUS

Autenticação               ✅ funcionando
Empresas                   🟡 parcial
Unidades                   ❌ não iniciado
Permissões                 🟡 parcial
Clientes                   ✅ funcionando
Produtos                   ✅ funcionando
Estoque                    ❌ não iniciado
Financeiro                 ❌ não iniciado
```

Também registrar:

```text
Dependências
Riscos
Próxima etapa
Débitos técnicos
```

---

# 142. ROADMAP VIVO

`ROADMAP.md` deverá ser atualizado conforme o desenvolvimento.

Não colocar datas fictícias.

Utilizar:

```text
Agora
Próximo
Depois
Futuro
```

quando ainda não houver cronograma real.

---

# 143. DECISÕES ARQUITETURAIS

Criar:

```text
docs/DECISIONS.md
```

Registrar decisões importantes.

Exemplo:

```text
DEC-001
Escolhemos monólito modular.

Motivo:
reduzir complexidade inicial.

Alternativa considerada:
microserviços.

Data:
...
```

Isso evita rediscutir decisões meses depois sem saber o motivo original.

---

# 144. NÃO CRIAR CÓDIGO MÁGICO

Preferir código simples, legível e previsível.

Evitar abstrações desnecessárias.

---

# 145. NÃO OVERENGINEER

Não implementar Kafka, Kubernetes, dezenas de microserviços ou infraestrutura complexa apenas porque poderá ser útil algum dia.

Construir quando houver necessidade.

---

# 146. MAS NÃO CRIAR BECOS SEM SAÍDA

Também não implementar atalhos que claramente inviabilizem:

```text
Multiempresa
Multiunidade
Permissões
Módulos
Integrações
Segurança
```

---

# 147. DESENVOLVEDOR DO PROJETO

O proprietário do projeto ainda está aprendendo programação.

Portanto:

- explique decisões;
- evite jargão sem explicar;
- descreva riscos;
- mostre mudanças importantes;
- trabalhe incrementalmente;
- não esconda complexidade real.

---

# 148. QUANDO HOUVER DÚVIDA

Se existir uma decisão arquitetural relevante com várias alternativas válidas:

não escolha silenciosamente.

Apresente:

```text
Opção A
vantagens
desvantagens

Opção B
vantagens
desvantagens

Recomendação técnica
```

---

# 149. NÃO INVENTAR REQUISITOS

Quando algo ainda não foi definido:

marcar como:

```text
A DEFINIR
```

em vez de assumir silenciosamente.

---

# 150. SEGURANÇA ANTES DE VELOCIDADE

Nunca aceitar atalho inseguro apenas porque facilita desenvolvimento.

Especialmente:

```text
Auth
Tenant
Financeiro
Secrets
Permissões
Integrações
```

---

# 151. NÃO USAR SEGURANÇA POR OBSCURIDADE

Podemos ocultar detalhes e obfuscar aplicações distribuídas.

Mas o sistema deverá continuar seguro mesmo se alguém entender como o frontend funciona.

---

# 152. O CÓDIGO DO BACKEND É NOSSO PRINCIPAL SEGREDO OPERACIONAL

O backend não deve ser distribuído aos clientes.

Clientes recebem somente aquilo que precisam para operar.

---

# 153. REGRA DE SEGURANÇA DO CLIENTE

Assumir sempre:

```text
o cliente controla sua própria máquina.
```

Portanto ele pode:

```text
editar arquivos
observar tráfego
analisar processos
alterar frontend
tentar chamar API
copiar executável
```

Nossa segurança não pode depender de impedir essas ações.

---

# 154. RESULTADO ESPERADO

Mesmo que alguém copie toda a pasta do programa:

```text
C:\Sistema\
```

e leve para outra máquina, queremos que:

```text
Dados locais protegidos
Dispositivo não autorizado
Sessões inválidas
Secrets ausentes
Servidor valide permissões
```

---

# 155. VISÃO DE LONGO PRAZO

O sistema deverá evoluir de:

```text
Sistema comercial
```

para:

```text
Plataforma operacional empresarial
```

E posteriormente:

```text
Plataforma empresarial completa
```

---

# 156. OBJETIVO FINAL

Queremos que uma empresa possa utilizar nossa plataforma para:

```text
Vender
Comprar
Estocar
Entregar
Cobrar
Pagar
Gerenciar
Agendar
Produzir
Transportar
Atender
Analisar
Comparar
Controlar
Automatizar
Integrar
Decidir
```

---

# 157. NÃO QUEREMOS APENAS ARMAZENAR DADOS

Queremos que o sistema transforme dados em informação útil.

Exemplo:

Não apenas:

```text
Vendas: R$180.000
```

Mas:

```text
Vendas: R$180.000

+12% vs mês passado
+8% vs ano passado
+4% vs média do ano

Margem caiu 2,3 pontos.
```

---

# 158. FUTURO COM IA

IA poderá eventualmente:

```text
Explicar dashboards
Detectar anomalias
Gerar insights
Prever demanda
Auxiliar estoque
Sugerir compras
Identificar inadimplência
Responder perguntas sobre dados
```

Mas sempre respeitando:

```text
Permissões
Tenant
Segurança
Privacidade
```

---

# 159. GOVERNANÇA DE IA

Quando adicionarmos IA, ela nunca deverá conseguir acessar dados além da permissão do usuário atual.

IA não contorna RBAC.

---

# 160. MODELO DO PRODUTO

A visão conceitual é:

```text
                         PLATAFORMA
                             │
             ┌───────────────┴──────────────┐
             │                              │
           CORE                          MÓDULOS
             │                              │
    ┌────────┼────────┐         ┌───────────┼────────────┐
    │        │        │         │           │            │
 Vendas   Estoque Financeiro Restaurante Logística    Salão
    │        │        │         │           │            │
    └────────┴────────┴─────────┴───────────┴────────────┘
                             │
                         INTEGRAÇÕES
                             │
             ┌───────────────┼──────────────┐
             │               │              │
           iFood        Delivery Much     Outros
                             │
                         ANALYTICS
                             │
                     Automação / IA
```

---

# 161. PRIMEIRA TAREFA CONCRETA AGORA

Depois de ler TODO este documento:

NÃO implemente novas funcionalidades imediatamente.

Primeiro faça o seguinte:

1. Analise completamente o projeto atual.
2. Liste stack e versões.
3. Liste estrutura de diretórios.
4. Liste funcionalidades existentes.
5. Analise autenticação existente.
6. Analise banco existente.
7. Analise segurança existente.
8. Identifique se já há suporte multiempresa.
9. Identifique possíveis vulnerabilidades arquiteturais.
10. Identifique dívida técnica.
11. Identifique o que podemos manter.
12. Identifique o que precisa mudar.
13. Compare o projeto atual com esta visão.
14. Proponha a arquitetura inicial.
15. Proponha uma sequência de pequenas mudanças.
16. Crie a documentação inicial.

---

# 162. CRIAR OS ARQUIVOS DE DOCUMENTAÇÃO

Após analisar o projeto, criar pelo menos:

```text
AGENTS.md

docs/
PROJECT_MASTER.md
VISION.md
ARCHITECTURE.md
PROJECT_MAP.md
DATABASE.md
MODULES.md
SECURITY.md
THREAT_MODEL.md
ROADMAP.md
DECISIONS.md
```

Não inventar conteúdo sobre partes ainda inexistentes.

Separar:

```text
ATUAL
```

de:

```text
PLANEJADO
```

---

# 163. PROJECT_MASTER.md DEVERÁ SER A REFERÊNCIA PRINCIPAL

Registrar nele:

```text
Estado atual
Visão futura
Arquitetura
Princípios
Segurança
Módulos
Integrações
Infraestrutura
Roadmap
```

Ele deverá apontar para documentos detalhados quando necessário.

---

# 164. PROJECT_MAP.md DEVE MOSTRAR ONDE ESTAMOS

O arquivo deverá permitir que qualquer pessoa ou IA que chegue ao projeto entenda rapidamente:

```text
O que existe
O que funciona
O que está incompleto
O que vem depois
Onde existem riscos
```

---

# 165. SECURITY.md

Deverá conter regras obrigatórias de segurança.

Exemplos:

```text
SEC-001
Toda operação de tenant deve validar autorização no backend.

SEC-002
Nenhuma senha pode ser armazenada em texto puro.

SEC-003
Nenhum secret pode existir no repositório.

SEC-004
Frontend nunca é autoridade.

SEC-005
Testes de isolamento de tenant são obrigatórios.

SEC-006
Logs nunca armazenam secrets.

SEC-007
Acesso administrativo deve ser auditado.

SEC-008
Dados sensíveis locais devem possuir proteção apropriada.

SEC-009
Obfuscação é apenas camada adicional.

SEC-010
Regras críticas permanecem no backend quando possível.
```

Expandir conforme necessário.

---

# 166. THREAT_MODEL.md

Registrar:

```text
Ativo
Ameaça
Impacto
Mitigação
Status
```

Exemplo:

```text
Ativo:
dados financeiros.

Ameaça:
usuário da Empresa A acessa Empresa B.

Impacto:
crítico.

Mitigações:
tenant isolation + autorização + testes.

Status:
em desenvolvimento.
```

---

# 167. DATABASE.md

Registrar:

```text
Entidades
Relacionamentos
Tenant ownership
Indexes importantes
Migrations
Convenções
```

---

# 168. MODULES.md

Registrar:

```text
Módulo
Status
Dependências
Responsabilidade
Interfaces
```

---

# 169. ARCHITECTURE.md

Explicar como o código está realmente estruturado.

Não escrever arquitetura imaginária como se já existisse.

Separar:

```text
ARQUITETURA ATUAL
```

e:

```text
DIREÇÃO FUTURA
```

---

# 170. ROADMAP.md

Mostrar evolução em etapas pequenas.

Não criar milhares de tarefas de uma vez.

---

# 171. REGRA DE ATUALIZAÇÃO DE DOCUMENTAÇÃO

Sempre que ocorrer mudança relevante de:

```text
Arquitetura
Banco
Autenticação
Tenant
Segurança
Módulo
Integração
Infraestrutura
```

verificar se documentação correspondente precisa ser atualizada.

---

# 172. ESTADO DO PROJETO DEVE SER RECUPERÁVEL

Queremos que futuramente possamos abrir o repositório em uma nova sessão e perguntar:

```text
"Onde paramos?"
```

E lendo:

```text
AGENTS.md
PROJECT_MASTER.md
PROJECT_MAP.md
ROADMAP.md
DECISIONS.md
```

seja possível compreender praticamente tudo.

---

# 173. AO TERMINAR SUA ANÁLISE INICIAL

Apresente um relatório com:

```text
1. Estado atual.
2. O que já está bom.
3. Problemas encontrados.
4. Riscos de segurança.
5. Dívidas técnicas.
6. Diferenças para a visão futura.
7. Arquitetura recomendada.
8. Próximos passos.
```

Não faça grande refatoração antes desse relatório.

---

# 174. PRINCÍPIO FINAL

Não estamos simplesmente construindo telas.

Estamos construindo uma plataforma que poderá administrar operações empresariais reais.

Logo:

```text
Integridade
Segurança
Confiabilidade
Auditabilidade
Manutenibilidade
Escalabilidade
```

são tão importantes quanto funcionalidades.

---

# 175. RESUMO EM UMA FRASE

**Construir uma plataforma empresarial modular, segura, multiempresa, multiunidade, cloud-first e API-first, capaz de começar como um sistema comercial simples e evoluir progressivamente para controlar praticamente toda a operação de empresas de diferentes setores, sem comprometer segurança, organização ou capacidade de crescimento.**

Agora analise o projeto existente e crie a fundação documental descrita acima antes de começarmos a próxima grande etapa de desenvolvimento.