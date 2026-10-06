# Migração conferida do legado — Fundação V1, passo 18

**ATUAL:** importador transacional e ensaio em banco SQLite isolado implementados. A cópia real foi conferida sem alterar `data/database.json`. O banco SQL operacional não foi aberto nesta etapa. A troca do servidor para essa persistência pertence ao passo 19 e deve seguir os mesmos critérios de preservação.

## O que é preservado

O snapshot importado contém o objeto JSON inteiro, não uma seleção dos campos conhecidos. IDs antigos, datas civis e instantes, nomes históricos, centavos, listas ausentes, propriedades desconhecidas, dados de apresentação `company` e a presença/ausência de `schemaVersion` permanecem como estavam. Não se adiciona `schemaVersion: 2` ao legado durante esta importação. As 42 coleções reconhecidas são conferidas; propriedades desconhecidas permanecem no payload.

Identidade histórica não é reinterpretada: textos de responsável, conferente e autor anterior continuam declarados. Empresa/unidade SQL do ensaio são contexto técnico fornecido explicitamente. A importação não cria usuários, senhas ou liberadores históricos.

O importador lê a origem em UTF-8 estrito. JSON inválido, número não finito ou inteiro fora da precisão segura é rejeitado antes de gravar, inclusive em campo desconhecido. Isso evita substituir caractere inválido, transformar infinito em null ou arredondar inteiro silenciosamente. Não se altera a origem para resolver a rejeição: o caso exige revisão explícita. Valores monetários conhecidos já têm as constraints de inteiros seguros do legado.

## Contrato do importador

[foundation/migration.js](../../../foundation/migration.js) exporta a função síncrona:

```javascript
importLegacy(store, {companyId, unitId}, legacyFile)
```

Empresa/unidade ativas precisam existir. Sem transação aberta, a função inicia `BEGIN IMMEDIATE` pelo `SqlStore`. Se o chamador já está em transação, usa um savepoint: não abre transação aninhada e consegue desfazer somente seus efeitos mesmo se o chamador capturar a falha. A confirmação da transação externa ainda pertence ao chamador.

Fluxo atômico:

1. Ler bytes e SHA-256 da origem; analisar JSON, validar pelo `storage.js` e pelos cinco validadores complementares.
2. Conferir referências comerciais registradas: cliente/produto, fornecedor/compra/recebimento, centro/posição, crédito, reserva, acordo, cotação, procedimentos e vínculos de tarefa, conforme validação existente e complemento de importação. Campos legados ausentes não viram vínculos inventados.
3. Conferir o registro anterior de importação e a ausência de estado comercial de destino quando é a primeira importação.
4. Gravar o payload por `writeState` com revisão esperada zero, reconstruindo o índice do escopo na mesma transação.
5. Reabrir o estado SQL e comparar igualdade canônica, contagens, digests de IDs e agregados de centavos.
6. Conferir novamente SHA-256 da origem, registrar `import_runs` e evento `IMPORT` de auditoria, e conferir a origem novamente antes de retornar.
7. Só confirmar a transação após sucesso de todo o fluxo. Falha em estado, índice, relatório, auditoria ou verificação desfaz os efeitos da importação.

O evento de auditoria possui escopo explícito e ator técnico nulo (`user_id`/`executed_by`/`authorized_by` nulos). Guarda o relatório de conferência, sem copiar registros pessoais inteiros para o evento.

## Idempotência e proteção contra sobrescrita

| Situação | Resultado |
| --- | --- |
| Destino vazio e origem válida | Importa uma vez, revisão inicial 1, relatório e um evento IMPORT |
| Mesmo hash e mesma unidade já importada | Retorna relatório salvo com `alreadyImported: true`; não escreve estado nem duplica auditoria |
| Mesmo hash após operações comerciais no SQL | Reconhece importação anterior e preserva as operações/revisões novas; não restaura o snapshot inicial |
| Outra origem/hash na unidade já importada | Conflito 409, `LEGACY_ALREADY_IMPORTED`, sem sobrescrita |
| Estado SQL existente sem essa importação registrada | Conflito 409, `LEGACY_STATE_EXISTS`, sem sobrescrita |
| Origem mudou durante a importação | Conflito 409, `LEGACY_SOURCE_CHANGED`, rollback |
| JSON, estrutura, precisão ou referência inválidos | Erro de validação 422, origem preservada e nenhuma importação parcial |

O critério de reenvio é o hash dos bytes: mudança só de formatação também é outra origem. O relatório salvo descreve a conferência inicial, não promete que o SQL atual ainda é igual ao snapshot após vendas/alterações legítimas.

## Relatório sem registros pessoais

O relatório inclui SHA-256 da origem e do conteúdo canônico, revisão inicial, presença de schemaVersion, contagem por coleção, digests de IDs por coleção/caminho e somas por caminho de campo terminado em `Cents`. IDs de registros da loja e conteúdo de nomes/contatos/notas não são publicados no relatório. IDs técnicos da empresa/unidade identificam o escopo SQL.

Somar muitos centavos seguros pode ultrapassar a precisão do Number: o acumulador utiliza `BigInt` e o resultado vai como texto decimal. Somas de snapshots, origens, parcelas e acordos servem à comparação entre origem/destino; **não são saldos contábeis para somar entre caminhos**.

## Ensaio local executado

A origem foi copiada para `.qa/foundation-v1/migration-copy-source.json` e importada em `.qa/foundation-v1/migration-copy.sqlite`, com contexto técnico explicitamente denominado para conferência. Estes dois arquivos são cópias privadas locais com dados da loja; não são relatórios para publicar.

Conferência realizada:

- 12 coleções presentes na origem, 42 reconhecidas/conferidas, objeto `company` preservado separadamente.
- Igualdade canônica integral entre cópia JSON e payload reaberto do SQL.
- Contagens, IDs e centavos coincidentes; origem operacional e cópia com SHA-256 inalterado.
- Uma importação e um evento IMPORT, cadeia de auditoria válida, zero usuários criados.
- Segundo envio reconhecido como já importado, sem criar outra revisão.
- Testes de rollback, vínculos inválidos, versão ausente, campos desconhecidos, SQL evoluído, precisão e isolamento em [migration.test.js](../../../foundation/migration.test.js).

Evidências que podem ser consultadas sem abrir registros brutos:

- [Relatório de importação](../../../.qa/foundation-v1/migration-copy-report.json).
- [Conferência isolada](../../../.qa/foundation-v1/migration-copy-verification.json).
- [Resultado da suíte](../../../.qa/foundation-v1/migration-copy-tests.tap).
- [Comparação de hashes de origem/cópia](../../../.qa/foundation-v1/migration-copy-source-hash.json).

## Comando para ensaio em destino explícito

[scripts/migrate-legacy.js](../../../scripts/migrate-legacy.js) exige origem, destino, empresa e unidade. Exemplo usando uma nova cópia de teste, com nomes e caminhos intencionais:

```powershell
node scripts/migrate-legacy.js --source ".qa/foundation-v1/migration-copy-source.json" --database ".qa/foundation-v1/nova-conferencia.sqlite" --company-name "Empresa de conferência V1" --unit-name "Unidade de conferência V1"
```

A CLI usa ambiente `test` e bloqueia destino na pasta operacional. Também bloqueia o mesmo arquivo de origem como destino, incluindo alias/hardlink detectável, antes de abrir SQLite. Não escolha `data/database.json` como destino.

Em banco sem contexto/usuário, cria empresa/unidade técnicas na mesma transação da importação. Em banco existente aceita somente um contexto compatível com os nomes explícitos; múltiplos contextos ou contexto diferente exigem revisão. Não cria usuários automaticamente. Erro de origem desfaz também empresa/unidade criadas nessa transação; a estrutura SQL vazia pode permanecer como arquivo de ensaio.

## Compatibilidade, recuperação e limites

- O original JSON nunca é apagado nem sobrescrito. Preserve-o junto ao hash e ao relatório de importação.
- Para este ensaio, recuperação consiste em manter o JSON original e não utilizar a cópia SQL que falhou. A migração do servidor operacional só deve começar após backup e validação previstos no passo 19.
- Importador preserva o payload em `unit_states`, sem normalização das tabelas comerciais. Isolamento SQL protege o escopo, mas não transforma automaticamente vínculos dentro de JSON em FKs SQL.
- Referências históricas polimórficas/snapshots não têm schema universal; o catálogo legado detalha as constraints e suas lacunas. Campos desconhecidos permanecem opacos; não se infere relação/entidade a partir do nome do campo.
- O índice inclui somente coleções conhecidas pelo `storage`, excluindo logs `*Commands`. Uma lista desconhecida pode conter IDs repetidos: preserva-se integralmente no payload, sem impor unicidade SQL a esses elementos nem inferir novas entidades.
- Não há restauração automática sobre SQL já em uso: origem divergente ou estado prévio gera conflito. Não remover `import_runs` para forçar nova importação.
- Esta conferência não publica um SaaS, não implementa sincronização Edge e não cria assinatura/biometria/fiscal/identidade histórica.

## Verificação da integração do passo 19

[runtime.integration.test.js](../../../foundation/runtime.integration.test.js) verifica a primeira abertura por `createRuntime`, com importação e meta `initial_import_complete` confirmadas juntas. Origem inválida desfaz contexto, estado, índice, registro de importação e auditoria. Os ensaios usam somente dados sintéticos e SQLite isolado em `.qa`.

Após essa meta, reiniciar o runtime usa o SQL atual e não reimporta o JSON antigo, mesmo se o arquivo foi alterado ou ficou inválido. Isso é diferente de chamar explicitamente a ferramenta de importação: a ferramenta continua recusando uma origem divergente. O original permanece preservado; ele deixa de ser a autoridade de escrita depois da transição confirmada.

Um teste HTTP abre duas instâncias de servidor com conexões SQLite distintas para o mesmo arquivo sintético. As duas sessões recebem seus tokens CSRF da instância correspondente e tentam vender simultaneamente a última unidade: somente uma venda retorna sucesso, a outra lê o saldo atualizado e é recusada. Estado, recebimento e movimento de estoque permanecem únicos, e ambas as conexões enxergam o mesmo resultado. Este ensaio comprova o fluxo local com duas conexões na mesma execução; não representa homologação de rede, processos distribuídos ou infraestrutura cloud.

Relacionados: [schema legado](DATABASE_SCHEMA_V0.12.md), [modelo V1](FOUNDATION_V1_MODEL.md), [banco](../../atual/DATABASE.md).
