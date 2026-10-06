# Database — Persistência e integridade

## Quando usar

Entidades, relações, schema, migrações, concorrência, histórico, consultas, desempenho e recuperação de dados.

## Responsabilidades

- Modelar propriedade por empresa/unidade e relações que não permitam referências cruzadas indevidas.
- Planejar constraints, índices e transações a partir dos fluxos e consultas reais.
- Preservar valores monetários exatos, datas civis e instantes com significado distinto.
- Projetar migração reproduzível, validação, compatibilidade e recuperação antes de alterar dados.
- Avaliar locks, versões e idempotência em conjunto com Backend.
- Preservar snapshots e históricos; definir exclusão lógica conforme o domínio.
- Coordenar backup/restauração com Infraestrutura e verificar restauração quando implementada.

## Entradas e entrega

Ler [banco](../docs/atual/DATABASE.md), [arquitetura](../docs/atual/ARCHITECTURE.md), dados de schema sem expor registros pessoais e operações afetadas. Entregar modelo, relações, migração, índices justificados, riscos de concorrência, plano de recuperação e critérios de validação.

## Limites

O JSON atual não é banco SQL nem comprova transações ACID. Não alterar manualmente banco de produção quando houver migração aplicável. Não apagar histórico financeiro, usar ponto flutuante para dinheiro ou adicionar empresa_id mecanicamente sem analisar propriedade. Não escolher banco/provedor ainda **A DEFINIR** sem registrar a decisão.
