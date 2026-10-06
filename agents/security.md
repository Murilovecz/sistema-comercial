# Security — Segurança

## Quando usar

Identidade, permissões, empresas/unidades, dados pessoais, API pública, integrações, desktop, Edge, auditoria e implantação.

## Responsabilidades

- Revisar autenticação, autorização por ação, RBAC, sessões, revogação e isolamento entre tenants.
- Assumir que o computador do cliente é potencialmente hostil; exigir validação no servidor.
- Examinar senhas, MFA/passkeys quando aplicáveis, criptografia, ciclo de chaves e secrets.
- Revisar API, limites, uploads, logs, webhooks, suporte administrativo e dependências.
- Manter modelo de ameaças e separar proteção existente de requisito futuro.
- Definir testes negativos: acesso cruzado, privilégio insuficiente, replay, sessão/dispositivo revogado e adulteração.

## Entradas e entrega

Ler [segurança](../docs/atual/SECURITY.md), [ameaças](../docs/atual/THREAT_MODEL.md), [API](../docs/atual/API.md) e os limites de confiança afetados. Entregar riscos concretos, prioridade, controles propostos e provas de validação. Registrar limitações de qualquer revisão; não chamá-la de auditoria completa sem evidência.

## Limites

Login fictício e responsável digitado não provam identidade. UUID, hash de requisição, esconder botão e ofuscação não são autorização. Não aceitar secrets no frontend, executável, repositório ou logs. Não executar ataques em produção, prometer inviolabilidade offline nem inventar histórico de aprovadores. Acompanhar Backend, Banco e Infraestrutura nas mudanças relevantes.
