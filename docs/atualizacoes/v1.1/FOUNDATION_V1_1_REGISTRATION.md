# Cadastros com comandos menores — passo 9

**Registro histórico da entrega V1.1, 02/10/2026.** Contratos/contagens abaixo registram aquela etapa e continuam referência de compatibilidade; não são contagem global atual. Ver [API vigente](../../atual/API.md) e [estado V1.2](../v1.2/FOUNDATION_V1_2_REPORT.md). Corpo original preservado.

## ATUAL no código

[commercial-registration.js](../../../foundation/commercial-registration.js) reconhece POST em `/api/commercial/products` e `/customers` para criar; `/products/edit|active` e `/customers/edit|active` para editar/situação; `/suppliers/create|edit|active` para Fornecedores. Não adicionar custo ou uma segunda entrada de estoque ao cadastro.

Respostas `201 {record,revision,replayed}` possuem apenas DTO de catálogo/cadastro autorizado. Não retornam snapshot, saldo, custo, campos desconhecidos, comandos, identidades técnicas ou vínculos financeiros internos. Os outros módulos comerciais continuam funcionando pela API compatível existente.

Exigem catalog.view + catalog.manage, sessão/contexto/CSRF verificados novamente dentro da transação. Produto com saldo inicial positivo exige inventory.adjust. `minStock` informado, inclusive zero, exige inventory.view + inventory.adjust; campo omitido conserva o mínimo atual. Editar produto não aceita `stock`, custo ou execução/autorização fornecidos no corpo.

Criação exige requestId textual não vazio de até 80 caracteres. Fingerprint canônico inclui tipo/ação e campos recebidos, excluindo responsável declarado substituído pela sessão. O registro criado recebe metadata técnica de confirmação/autor; retry idêntico do mesmo executor/contexto retorna o registro atual sem nova criação/movimento/auditoria. Confirmação usada em outro cadastro, conteúdo ou executor é recusada. IDs criados são sempre do servidor.

Edição/situação exige ID e expectedVersion inteiro não negativo; zero preserva compatibilidade com registros legados sem versão. Não inventar versão antiga. Registro inexistente neste escopo retorna 404; versão desatualizada retorna 409 `STALE_REGISTRATION`, conferida no estado fresco dentro da transação. Reutiliza change/activeAction/supplierAction, mantendo validações e históricos existentes e sem alterar contratos legados. Campos aceitos são os já suportados por esses fluxos: Produto nome/preço/código/barcode/categoria/mínimo (saldo somente inicial); Cliente/Fornecedor nome/telefone/email/observações. Metadados adicionais ainda seguem os comandos originais, sem fingir que são editados por esta API.

[catalog-registration.js](../../../catalog-registration.js) compartilha a criação original de Produtos/Clientes com o servidor legado. Autorização e replay pertencem ao handler, não ao domínio compartilhado. Escrita SQL, espelhos, movimentação inicial, executor e auditoria permanecem atômicos em saveBusinessState. Limite de corpo 16 KiB; campos não previstos são recusados. Bases existentes/extras não são descartados durante edição.

## Limites

Persistência de transição ainda materializa/valida internamente o estado comercial da unidade em comandos; resposta menor não implica eliminação completa do snapshot. Exclusão lógica usa situação ativo/inativo; histórico e vínculos permanecem. Sem edição direta de custo/estoque, regra fiscal nova ou migração de financeiro. Senhas e tokens não fazem parte dos cadastros.

Verificação concluída: 8 testes unitários e 20 HTTP cobrem permissões parciais, mínimo/saldo inicial, versão desatualizada, tentativa cruzada, replay, rollback e ausência de dados internos na resposta. Consulta by-id só inclui mínimo quando inventory.view está presente; custo usa recebimento e financeiro. Regressão final de 457 testes e quick views conferidas em base isolada no [relatório](FOUNDATION_V1_1_REPORT.md).
