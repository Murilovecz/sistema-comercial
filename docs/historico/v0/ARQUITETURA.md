# Destino do Sistema Comercial

O endereço 127.0.0.1 é o próprio computador. A versão atual é local e abre no navegador para desenvolvimento e testes; não está hospedada publicamente.

O produto pretendido terá um executável Windows em cada computador cliente, com armazenamento local para trabalhar sem internet. Um servidor central hospedado em infraestrutura escolhida futuramente manterá empresas, usuários, assinaturas e serviços de sincronização. Não é necessário transformar a interface do sistema em um site público.

O aplicativo poderá usar a mesma interface em uma janela própria, por exemplo com Electron, mas ainda será necessário desenvolver empacotamento, instalação, atualização e sincronização. Trocar o endereço local por um servidor remoto não resolve o funcionamento offline.

A autorização de uso offline terá validade limitada desde uma validação no servidor. O prazo offline ainda deve ser definido e é diferente da carência por atraso de pagamento. Regras de conflito entre máquinas, sincronização, proteção das contas e assinaturas serão implementadas em etapas próprias. A V0.x ainda não oferece esses serviços.

## Extensões da V0.11

Os módulos pricing, quarantine, supplier-returns, store-credits, deliveries, supplier-quotes e budgets usam comandos com identificação de confirmação e versões. A gravação local valida o conjunto e substitui o arquivo somente após escrever o temporário. Coleções novas são opcionais para a base anterior; schemaVersion continua 2. Valores monetários permanecem centavos inteiros, com cálculos de percentuais/rateios exatos e limites numéricos.

product.stock representa físico vendável; quarantineEntries guarda retenções separadas. Crédito de loja conserva origem e alocações por venda, permitindo restaurar a parcela interna em devolução sem tratá-la como recebimento real. Restituição do fornecedor integra o fluxo efetivo uma vez, sem reduzir a obrigação a pagar. Ordem de entrega acompanha a baixa já feita pela venda.

A estação de atendimento mantém rascunhos nomeados e preferências no armazenamento deste navegador. Análises são consultas sobre datas e saldos conhecidos; não alteram documentos. A V0.11 segue local, sem serviço de sincronização, autenticação real, empacotamento Windows, cobrança ou assinatura.

## Extensões da V0.12

checkout conserva recebimentos efetivos separados de valores entregues/troco; cash recebe apenas dinheiro líquido. catalogue-next associa embalagens/aliases e famílias aos mesmos SKUs, preservando snapshots nos documentos. positions reconcilia todos os novos movimentos de stock com saldos atribuídos; Não distribuído é a diferença derivada. Transferências mantêm product.stock. Inventários por posição ajustam posição/global juntos, conservam coletas e detectam versões/movimentos posteriores.

purchase-next mantém apresentação/recusa/aceitação separadas; aceitas retidas passam atomicamente ao recebido e à quarentena. Aditamento amplia o pedido com custo comercial original explicitamente revisado; diferenças de custo efetivo exigem justificativa na conferência. Não gera obrigação financeira automática.

agreements bloqueia alocações diretas nas origens enquanto o acordo estiver ativo. Receber cria recebimentos nas vendas originais; pagar cria uma única despesa com payableAllocations recíprocas e preserva classificação por origem. Agenda, relatórios, contas e orçamento usam vencimentos do acordo sem somar originais transferidos. Devoluções/perdões/cancelamentos comerciais reduzem saldos e parcelas finais abertas; cancelar acordo sem efetivos libera os saldos atuais.

recurring são modelos/previsões manuais, sem agendamento externo. orçamento separa recorrência adicional e parcela já coberta por obrigação válida; vínculo inconsistente fica sinalizado. procedures registra checklists declarados com snapshot da revisão; referências não executam operações. price-reviews mantém propostas e aplicação atômica futura, compara regras relacionadas e prepara reversão com referências atuais.

Persistência continua JSON local atômica, schemaVersion2 e coleções opcionais. Novas escritas reutilizam comandos com requestId/assinatura, versões e validação do conjunto. Posições capturadas numa confirmação conservam o mesmo envelope no reenvio. Rascunhos preservam metadados de embalagem e substituição, recebimentos e vencimento. Sem dependências adicionais, nuvem, autenticação real, licenciamento ou empacotamento Windows nesta rodada.
