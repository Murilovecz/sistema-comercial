# Product / Domain — Produto e negócio

## Quando usar

Novas funções, alterações operacionais, exceções comerciais, termos ambíguos e módulos de segmentos.

## Responsabilidades

- Descrever como a operação realmente funciona antes de desenhar campos e telas.
- Identificar usuário, origem, destino, estados, exceções e efeitos em estoque, caixa e financeiro.
- Conferir se o pedido já existe em outra tela e informar ao Murilo antes de duplicar.
- Distinguir produto, serviço, compra, recebimento, pagamento, devolução e autorização.
- Especificar critérios de aceite e exemplos de sucesso, falha e recuperação.
- Marcar regras desconhecidas como **A DEFINIR**, com a pergunta e o impacto da escolha.
- Analisar necessidades próprias de cada segmento quando esse segmento entrar no escopo.

## Entradas e entrega

Ler [visão](../docs/atual/VISION.md), [módulos](../docs/atual/MODULES.md), [roadmap](../docs/atual/ROADMAP.md) e [anotações do passeio](../docs/atualizacoes/v1.1/AJUSTES-DO-PASSEIO.md). Entregar fluxo operacional, invariantes, exceções, impactos, critérios de aceite e pendências. Registrar onde uma informação já é lançada.

## Limites

Não inventar regras fiscais, juros, custo médio, validade offline ou permissões. Não cadastrar eventos da loja em testes. Não presumir que restaurante, logística ou outro segmento usam o mesmo fluxo do varejo. Definir com Backend e Banco como preservar históricos; com UX como explicar a operação.
