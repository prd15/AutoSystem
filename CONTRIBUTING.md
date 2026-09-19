# Como trabalhar neste repositório

Regras de contribuição do AutoSystem. Valem para todas as pessoas do time **e para os agentes
de IA** que elas usam: quem abre o PR é responsável por o agente seguir este guia.

Resumo em cinco linhas:

1. **Uma branch por card do Trello**, criada a partir da `main` atualizada.
2. **Commits atômicos**: um assunto por commit, no formato `tipo(escopo): descrição`.
3. **Nenhum co-autor**: nenhum commit, em nenhuma branch, leva `Co-Authored-By` nem atribuição automática de ferramenta.
4. **Nada entra na `main` sem Pull Request revisado** por outra pessoa do time.
5. **Build e testes verdes** antes de abrir o PR.

---

## Antes de começar a codar, todo dia

```bash
git checkout main
git pull
```

`git push` envia para o GitHub, mas **não** atualiza a máquina de mais ninguém. Quem não roda
`git pull` continua com a versão antiga e sobrescreve o trabalho dos outros no próximo commit.

Se alguém renomear ou mover pastas, o `git pull` só consegue aplicar a mudança com a pasta
livre: feche o servidor de desenvolvimento, o editor e o Explorer apontando para ela antes.

---

## Branches: uma por card

Cada card do Trello vira **uma branch** e **um Pull Request**. Não misture dois cards na mesma
branch, e não comece um card novo em cima da branch de outro.

**Nome da branch:** `tipo/descricao-curta`, em minúsculas, com hífen, sem acento.

| Prefixo da branch | Quando usar | Exemplo |
|---|---|---|
| `feat/` | Funcionalidade ou rota nova | `feat/modulo-funcionarios` |
| `fix/` | Correção de bug | `fix/reversao-status-veiculo` |
| `refactor/` | Mudança de código sem mudar comportamento | `refactor/estoque-consome-api` |
| `chore/` | Configuração, dependências, build | `chore/frontend-maven-plugin` |
| `docs/` | Só documentação | `docs/contrato-api-vendas` |
| `test/` | Só testes | `test/contrato-http-veiculos` |
| `ci/` | Pipeline do GitHub Actions | `ci/build-do-front` |

**Ciclo de um card:**

```bash
git checkout main
git pull
git checkout -b feat/modulo-funcionarios

# ... trabalha, com commits atômicos (próxima seção) ...

git push -u origin feat/modulo-funcionarios
```

Depois abra o Pull Request no GitHub, cite o card do Trello na descrição e peça revisão.

**A `main` é protegida por regra do time:** ninguém commita nem faz push direto nela. Toda
mudança entra por PR, inclusive documentação.

---

## Commits: atômicos e com prefixo

### Um assunto por commit

Cada commit faz **uma coisa só** e deixa o projeto compilando. Se para descrever o commit
você precisa de "e", provavelmente são dois commits.

- Bom: entidade num commit, DTOs em outro, service e controller em outro, testes em outro.
- Ruim: um commit único com 13 arquivos misturando login, estoque, vendas e README.

Para separar mudanças que já estão no seu disco, use `git add <arquivo>` ou `git add -p`
(escolhe trecho por trecho), em vez de `git add .`.

### Formato da mensagem

Padrão **Conventional Commits, em português**:

```
tipo(escopo): descrição no imperativo, curta
```

- **Assunto em uma linha**, até ~72 caracteres, sem ponto final.
- **Descrição no imperativo**: "adiciona", "corrige", "remove" — não "adicionado" nem "adicionando".
- **Corpo opcional**, depois de uma linha em branco, para explicar o *porquê* quando não for óbvio.

| Tipo | Quando usar |
|---|---|
| `feat` | Funcionalidade, rota ou tela nova |
| `fix` | Correção de bug |
| `refactor` | Muda o código sem mudar comportamento |
| `chore` | Configuração, dependências, build, seed |
| `docs` | Só documentação |
| `test` | Só testes |
| `ci` | Pipeline do GitHub Actions |

**Escopo** é o módulo afetado, em minúsculas e sem acento. Os que o projeto já usa:

| Back-end | Front-end | Geral |
|---|---|---|
| `veiculo`, `cliente`, `venda`, `indicador`, `usuario`, `funcionario`, `auth`, `financeiro`, `comissao`, `financiamento`, `consorcio`, `relatorio`, `configuracao`, `commons`, `db` | `estoque`, `vendas`, `clientes`, `visao-geral`, `funcionarios`, `financeiro`, `consorcios`, `financiamentos`, `relatorios`, `configuracoes`, `auth`, `api` | `build`, `config`, `readme`, `docs` |

Exemplos bons, tirados do histórico:

```
feat(veiculo): lista de vendaveis (GET /api/veiculos/vendaveis)
fix(db): cpf como VARCHAR(11) na V1 (compatibilidade JPA)
test(indicador): agregacoes e serie mensal no Postgres real (Testcontainers)
chore(build): adiciona spring-security-crypto (BCrypt)
docs(auditoria): adiciona o relatorio da auditoria de 17/09/2026
```

Exemplos ruins: `ajustes`, `wip`, `fix`, `update`, `corrige coisas`, `fix: corrige cadastros, permissoes e regras comerciais` (três assuntos num commit).

---

## Sem co-autor, em nenhuma branch

**Nenhum commit do AutoSystem leva co-autor**, em nenhuma branch — `main`, `feat/*`,
`fix/*`, local ou publicada, com ou sem PR. Isso inclui:

- o trailer `Co-Authored-By:` de qualquer ferramenta de IA (Claude, Codex, Copilot, Cursor, Gemini etc.);
- o trailer `Co-Authored-By:` de pessoas;
- linhas de atribuição automática como `Generated with ...` ou `🤖`, no commit **e** na descrição do PR.

O autor do commit é a pessoa do time que fez o trabalho, mesmo quando ela usou um agente.

**Configure o seu agente antes de começar** para ele não acrescentar essas linhas (a opção de
atribuição/co-autor fica nas configurações de cada ferramenta).

**Para conferir antes do push:**

```bash
git log --format=%B origin/main..HEAD | grep -iE "co-authored-by|generated with"
```

Se aparecer alguma coisa, corrija **na sua branch** antes de abrir ou atualizar o PR
(`git commit --amend` para o último commit, ou `git rebase -i origin/main` para vários) e
envie com `git push --force-with-lease`. O PR não é aprovado enquanto houver ocorrência.
Commit que já está na `main` não é reescrito: a regra vale daqui para a frente.

---

## Manter a branch atualizada com a `main`

Se a `main` andou enquanto você trabalhava, traga as mudanças **para a sua branch**:

```bash
git fetch origin
git rebase origin/main
# resolva os conflitos, se houver, e rode o build e os testes de novo
git push --force-with-lease
```

- `--force-with-lease` só **na sua própria branch**. Nunca na `main` nem em branch de outra pessoa.
- Antes de reescrever histórico (`rebase`, `reset`, `commit --amend`), crie um backup:
  `git branch backup/<nome-da-branch>`.
- Na dúvida sobre um conflito, pergunte a quem escreveu o outro lado antes de escolher.

---

## Antes de abrir o Pull Request

| Mudou | Rode | Tem que |
|---|---|---|
| Back-end (`src/`, `pom.xml`) | `./mvnw verify` | passar (exige Docker ligado, por causa do Testcontainers) |
| Front-end (`frontend/`) | `cd frontend && npm run build` | passar — o CI ainda **não** roda o build do front |
| Qualquer coisa | `git log --format=%B origin/main..HEAD` | não ter co-autor nem mensagem fora do padrão |

**Descrição do PR** (o template em `.github/pull_request_template.md` já traz as seções):

- **O que muda** — objetivo, em poucas linhas.
- **Como testar** — passos para quem revisa conferir o comportamento.
- **Card do Trello** resolvido (nome ou link).
- Checklist do template marcado.

**Revisão:** todo PR é revisado por outra pessoa do time antes do merge. Ninguém mescla o
próprio PR sem revisão. PR com CI vermelho ou com conflito não é mesclado.

Depois do merge, volte para a `main` com `git pull` antes de começar o próximo card. A branch
mesclada **não é apagada**: fica no repositório como histórico do card.

---

## Banco de dados (Flyway)

- Migration **já mesclada nunca é editada**: o checksum quebra para todo mundo. Mudança de
  banco é sempre uma migration nova, `V<n>__descricao.sql`.
- Uma migration por PR, sempre que possível, para evitar colisão de numeração. Se outra pessoa
  mesclar uma migration com o mesmo número antes de você, renumere a sua antes do merge.
- Seed de desenvolvimento fica em `src/main/resources/db/dev/afterMigrate.sql`, não em migration.

## Contrato da API

O contrato entre front e back está em [`docs/04-contrato-de-api.md`](docs/04-contrato-de-api.md),
e o front espelha as assinaturas em [`frontend/src/api`](frontend/src/api). **Mudou um endpoint,
um campo ou uma mensagem de erro? Atualize o `docs/04` no mesmo PR** e avise quem trabalha do
outro lado no card do Trello.

Os planos da sprint atual estão em [`docs/12-plano-implementacao-backend.md`](docs/12-plano-implementacao-backend.md)
e [`docs/13-plano-implementacao-frontend.md`](docs/13-plano-implementacao-frontend.md).

## Segredos

Nunca commite senha, token, chave de API ou URL de banco com credencial. Configuração local vai
em `.env`/`.env.local` (fora do Git) ou em variável de ambiente. Se um segredo entrar num commit,
avise o time na hora: apagar do histórico não basta, ele precisa ser **trocado**.

## O que nunca entra no repositório

Já estão no `.gitignore`, mas vale saber o porquê:

- `node_modules/` — cada pessoa gera o seu com `npm install`
- `dist/` e `target/` — gerados pelo build
- `.env`, `.env.local` — configuração da máquina de cada um; use o `.env.example` como base
- `.claude/` — configuração local de ferramenta

## Fim de linha

O `.gitattributes` grava tudo em LF no repositório. No Windows o Git converte para CRLF na sua
pasta e de volta para LF ao commitar. Não mexa nessa configuração: sem ela, cada commit
apareceria como "arquivo inteiro alterado" para quem usa Linux ou macOS.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| raiz (`pom.xml`, `src/`, `mvnw`) | Back-end: Java 21, Spring Boot 3.5, PostgreSQL, Flyway |
| `frontend/` | Front-end: React, TypeScript, Vite. Ver [`frontend/README.md`](frontend/README.md) |
| `docs/` | Escopo, modelo de dados, regras, contrato de API, auditoria e planos da sprint |
| `.github/` | CI (`workflows/ci.yml`) e template de Pull Request |
