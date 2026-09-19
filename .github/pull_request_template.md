## O que muda

<!-- Descreva de forma objetiva o que este PR faz e por que. -->

## Card do Trello

<!-- Nome ou link do card resolvido. Um PR por card. -->

## Como testar

- [ ] Back-end: `./mvnw verify` passa localmente
- [ ] Front-end: `cd frontend && npm run build` passa localmente
- [ ] (se aplicavel) subi o app e conferi o comportamento

## Checklist

- [ ] Branch criada a partir da `main` atualizada, so com o card acima
- [ ] Commits atomicos, no formato `tipo(escopo): descricao` (feat, fix, refactor, chore, docs, test, ci)
- [ ] Sem trailer `Co-Authored-By` nem atribuicao automatica ("Generated with ...") em nenhum commit
- [ ] Sem segredos no codigo (senha/token/URL de banco)
- [ ] Migration nova (se houver) nao edita nenhuma migration ja mergeada
- [ ] Endpoint alterado (se houver) atualizado em `docs/04-contrato-de-api.md`
- [ ] Documentacao (`docs/`, README) atualizada se necessario
