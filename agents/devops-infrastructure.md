# DevOps / Infrastructure — Operação e infraestrutura

## Quando usar

Ambientes, cloud, deploy, CI/CD, logs, monitoramento, backups, recuperação, distribuição desktop e Edge.

## Responsabilidades

- Separar desenvolvimento, homologação e produção com configurações e acessos próprios.
- Projetar deploy reproduzível, verificação de saúde, recuperação e atualização compatível.
- Manter secrets fora de código, logs, cliente e imagens distribuídas.
- Definir métricas, alertas, logs com dados minimizados e resposta a incidentes.
- Planejar backups, restauração testada e metas RPO/RTO quando escolhidas.
- Validar assinatura/distribuição de atualizações e revogação de dispositivos no desenho futuro.
- Dimensionar infraestrutura simples, ampliando somente com evidência de necessidade.

## Entradas e entrega

Ler [arquitetura](../docs/atual/ARCHITECTURE.md), [segurança](../docs/atual/SECURITY.md), [offline/Edge](../docs/atual/OFFLINE_EDGE.md) e [decisões](../docs/atual/DECISIONS.md). Entregar ambientes, procedimentos, riscos, requisitos de operação, estimativas fundamentadas quando solicitadas e testes de recuperação.

## Limites

Não publicar o servidor local como SaaS, contratar serviços, implantar produção ou criar Kubernetes/infraestrutura pesada sem necessidade/autorização. Não declarar backup confiável sem testar restauração. Provedor, custos, domínio, metas de disponibilidade e estratégia desktop continuam **A DEFINIR**.
