# Conferências durante a Fundação V1.1

Registro de problemas identificados durante a entrega. Não avançar de agregado com falha aberta.

- Passo 3: fixture tentou usar filhos de produto `null`, formato que o domínio anterior já recusava. Corrigida a massa sintética para respeitar o contrato existente, sem enfraquecer validações. Os 19 testes específicos e 336 da regressão passaram.
- Passo 6: revisão independente identificou que a primeira hidratação de Compras incluía os filhos em `present_fields`, mas a restauração só admitia filhos de Produtos. Corrigido antes da liberação; 14 específicos, HTTP transacional, ensaio em cópia e regressão completa 374/374 aprovados.
- Passo 7: primeira regressão teve quatro falhas em fixtures de Produtos que desmontavam apenas o schema antigo ou esperavam quatro agregados. Atualizada a desmontagem de fixtures para respeitar as novas FKs e a contagem para cinco agregados. Nenhuma FK foi retirada. Fixture física precisou do número obrigatório já previsto no contrato V0.12. Regressão corrigida: 387/387; ensaio em cópia equivalente.
- Passo 7: revisão independente demonstrou lacunas sem rota HTTP explorável atual: `stockAfter` novo não era conferido, documento de origem não exigia o mesmo SKU, a ordem do histórico podia ser trocada e movimento físico podia reutilizar origem antiga. Corrigidos saldo intermediário, SKU/sinal, prefixo imutável e origem física nova/correspondente. Cinco negativos novos passaram; revisão independente aprovada e regressão final 392/392.
- Execução de teste isolado com processos filhos recebeu `spawn EPERM` no ambiente. A suíte usa `--test-isolation=none`, mantendo bases de dados sintéticas e isoladas. Isso é uma restrição de execução, não um resultado aprovado do teste.
- Passo 8: a fixture restrita de autenticação passou a ter o novo direito no catálogo por migration. Atualizada a expectativa de bootstrap para os dois códigos realmente presentes na fixture, sem apagar permissões para ocultar a mudança; 13 testes de identidade aprovados.
- Passo 8: teste HTTP real encontrou conflito anterior entre o identificador do documento Caixa e o da sessão de login. As telas passaram a enviar `cashSessionId`; o nome legado permanece aceito somente nas quatro operações correspondentes, com rejeição de ambiguidade. Identidade continua exclusivamente no cookie/contexto. Três testes específicos de compatibilidade, reenvio e negação passaram; regressão 428/428.

- Passo 9: primeiros negativos exigiram classificar a versão obsoleta como conflito 409 nos comandos menores, mantendo o domínio legado. Após correção, 8 unitários e 20 HTTP passaram; regressão 456/456.
- Passo 9: revisão da interface identificou que fechar uma quick view interrompia o observador da lista, Novo cadastro podia manter editId e alterações do carrinho dentro do bloqueio assíncrono não invalidavam a revisão/liberação. Corrigidos antes do aceite; sequência editar/fechar/filtrar/editar/cadastrar e liberação/alterar carrinho conferidas visualmente.
- Integração visual: o novo script estava no HTML mas faltava na allowlist estática do servidor. Corrigido e adicionado teste HTTP que exige servir todos os scripts na ordem de inicialização; passou.
- Conferência visual: data civil de despesa era apresentada como instante UTC e recuava um dia no fuso local. Corrigida a apresentação sem converter a data civil em horário; a despesa sintética de 02/10 permaneceu 02/10 na tela.

Todos os problemas acima foram corrigidos; limites e evidências finais constam do relatório V1.1.
