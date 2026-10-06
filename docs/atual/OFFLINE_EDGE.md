# Offline e Agente Local — direção e limites

Referência vigente: [mestre v1.0](../../Documento_Mestre_Sistema_Comercial_v1.0.md), §§11–12 e 16. O termo Edge nos registros anteriores corresponde a propostas históricas; este documento usa **Agente Local** para o coordenador limitado aprovado. Implementação continua ausente; [plano A–G](ROADMAP.md).

## ATUAL

Fundação V1.2 fechada localmente em **03/10/2026**, versão **1.2.0-foundation.1**: servidor/SQLite local, login real e permissões por empresa/unidade; homologação B/610, migrations 001–010, [estado/fontes](../atualizacoes/v1.2/FOUNDATION_V1_2_REPORT.md). Persistência ativa `data/foundation.sqlite`, JSON como origem preservada. Operação local sem internet permanece possível com servidor iniciado; isso não cria SaaS offline autorizado, Edge ou distribuição Windows concluídos.

O protótipo roda e salva dados no próprio computador. Depois de iniciado com seus arquivos locais, seus fluxos internos não dependem de servidor remoto. Isso permite demonstrar operação local sem internet, mas não constitui sincronização offline de um SaaS.

Não há nuvem, fila de sincronização, autorização offline assinada, identidade de dispositivo, proteção contra relógio alterado, lease de assinatura ou reconciliação de conflitos implementados. Rascunhos agora são separados por usuário/empresa/unidade verificados, mas não equivalem a Edge confiável ou armazenamento criptografado. O executável Windows ainda não existe como pacote de distribuição.

## Requisito do Murilo e direção PLANEJADA

A loja deverá continuar funcionando sem internet dentro das condições que forem definidas. O servidor central é autoridade; cliente Windows e Edge opcional poderão executar um conjunto limitado de operações e sincronizar quando a conexão retornar. Edge pode apoiar cache, fila, impressão, balanças, pinpads, KDS e comunicação na rede local.

Não depender do computador de um funcionário como servidor central da plataforma. A necessidade de Edge dedicado ou cache somente no cliente depende do perfil da loja e está **A DEFINIR**.

A antiga posição de Edge na fase 9 é histórica. O plano vigente prioriza replay e especificações C–E; Agente/offline cloud permanecem posteriores, sem início automático. Conforme o mestre, app/Agente podem coexistir em 1 PC; em 2–5 PCs a continuidade crítica não depende do PC do dono; agente dedicado por unidade atende ambientes maiores. Topologia, protocolos e fallback precisam de especificação; nenhum desses cenários está implementado.

## Políticas distintas

| Política | Estado |
| --- | --- |
| Aviso da assinatura | Pedido histórico: avisar nos cinco dias anteriores ao vencimento |
| Carência de pagamento | Pedido histórico: sete dias, depois suspensão; sem implementação |
| Juros e multa | Pedido histórico de cobrança proporcional; valores/regras e validação aplicável A DEFINIR |
| Prazo máximo sem consultar servidor | A DEFINIR; não é automaticamente sete dias |
| Operações disponíveis offline | A DEFINIR por risco e segmento |
| Bloqueio e recuperação após expiração | A DEFINIR com comunicação clara e preservação dos registros |

Políticas SaaS serão configuráveis e verificadas no servidor. Pagamento confirmado, período contratado e capacidade offline não devem ser confundidos. Não hardcodar uma regra como se já tivesse sido implementada/aprovada para todos os planos.

## Desenho PLANEJADO

**Printing & Devices:** Cloud → comando autenticado/permitido → Desktop/Edge → adapter → USB/rede local/hardware. Dispositivo/destino cadastrado, escopo, permissões, validade, idempotência e replay serão validados. Nunca executor remoto genérico. Fila de impressão não é fila de vendas; uma reimpressão não repete efeito comercial/fiscal. Resultado físico pode ser desconhecido. Ver [requisitos](PRINTING_AND_DEVICES.md).

**Commerce Hub:** publicação/notificações/reconciliação ocorrem centralmente, com contas e disponibilidade coerentes. Desconexão da loja pode deixar publicação remota defasada e vendas simultâneas; política de reserva, alocação, buffer e revisão de conflitos é **A DEFINIR**, sem prometer eliminar overselling. Credenciais de marketplaces não vão para Edge. Separação/etiquetas usam Logística e Print Service compartilhados. Ver [requisitos](COMMERCE_HUB.md).

Autorização offline emitida pelo servidor, com assinatura verificável, empresa/unidade/dispositivo, permissões limitadas e validade. O cliente não carrega a chave privada que emite essa autorização. Revalidação online, revogação e tratamento de relógio/restauração precisam ser definidos; não há proteção absoluta contra dono da máquina ou sistema comprometido.

Fila local durável com IDs, origem, sequência/versão e estado de sincronização. O servidor aplica autorização, idempotência e regras; reconhece operações aceitas e sinaliza rejeições/conflitos. Dados de cache e credenciais locais devem ser minimizados e protegidos adequadamente.

A política conceitual já foi decidida: fatos/eventos válidos realmente ocorridos são preservados e reconciliados, inclusive vendas válidas da última unidade que resultem em negativo/divergência; não apagar venda para ajustar saldo. Registros editáveis usam base revision/conflito explícito; configuração crítica (permissões, alçadas, entitlement, assinatura, administração, segurança/fiscal crítico) é cloud-only. Validade dos fatos, matriz por operação, autorização, limites e tratamento de revogação ainda precisam de contrato; não adotar last-write-wins para fatos financeiros/estoque.

## Casos obrigatórios de projeto/teste

- Dois caixas vendem a última unidade offline: preservar fatos válidos e gerar negativo/divergência reconciliável, sem apagar venda, mascarar saldo ou presumir validade sem autorização.
- Reenvio da fila após queda: não duplicar venda, pagamento ou baixa de estoque.
- Edição local contra versão nova na nuvem: revisão explícita quando necessário.
- Usuário/dispositivo revogado durante desconexão: limitar janela e reconciliar com política definida.
- Relógio voltado, restauração de cópia ou token copiado: decidir mitigação e limites de proteção.
- Pagamento de assinatura confirmado durante desconexão: não presumir renovação sem evidência autorizada.
- Erro de sincronização: manter dados e estado compreensível, com recuperação e auditoria.

Ver [decisões pendentes](DECISIONS.md) e [modelo de ameaças](THREAT_MODEL.md). Este documento não implementa nem garante controles offline.

## Estação, atualização e parâmetros abertos

Estação operacional/offline é registrada e revogável, com identidade própria não clonada por copiar a pasta. Agente tem identidade criptográfica por instalação, conta de serviço mínima, APIs autenticadas e nenhuma credencial master. Clientes/Agente/LAN são não confiáveis; banco cloud só via API. A estação não emite nem renova sua autorização offline. Contexto mínimo de operação inclui ID/replay, tenant/entidade/unidade, estação, usuário, tempo local conhecido, base revision e referência à autorização.

Atualizações são centralizadas/assinadas, baixadas e validadas antes da troca; updater separado revalida em ponto seguro, sem interromper transações. Pipeline oficial constrói/testa/assina; chaves não ficam no PC comum. Stack, janelas, compatibilidade e recuperação continuam a especificar. Hipótese de ~72h, carência histórica e valores locais de retenção não fixam janela/SLA/RPO/RTO do produto. Configuração administrativa protegida expirada falha fechada; continuidade comercial emergencial/jurídica permanece pendente.
