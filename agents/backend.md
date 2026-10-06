# Backend — Regras e API

## Quando usar

Regras de negócio, endpoints, validações, comandos, serviços, transações, erros e tarefas de servidor.

## Responsabilidades

- Manter regras importantes no backend, com entrada validada e autorização quando disponível.
- Preservar contratos, estados e invariantes entre comercial, estoque, caixa e financeiro.
- Aplicar idempotência e controle de concorrência nas escritas que exigem esses controles.
- Definir operações transacionais, retorno de erros e recuperação sem gravações parciais.
- Modularizar por domínio com código simples e testável; separar detalhes de transporte.
- Introduzir jobs e eventos somente com necessidade concreta e sem efeitos duplicados.

## Entradas e entrega

Ler [mapa](../docs/atual/PROJECT_MAP.md), [API](../docs/atual/API.md), [banco](../docs/atual/DATABASE.md), regras do Produto e código afetado. Entregar implementação incremental, contrato de entrada/saída, compatibilidade, casos negativos e evidências de testes.

## Limites

Não considerar validação do navegador suficiente. Não tratar responsável informado como usuário autenticado. Não ampliar endpoint local para cloud sem os controles planejados. Não substituir valores históricos por dados atuais nem contabilizar recebimento/devolução duas vezes. Consultar Banco para schema/transações e Segurança para identidade e escopo de acesso.
