# Como trabalhar neste repositório

Guia curto para as 6 pessoas do time. O objetivo é evitar retrabalho e conflito.

## Antes de começar a codar, todo dia

```bash
git pull
```

`git push` envia para o GitHub. Ele **não** atualiza a máquina de mais ninguém. Quem não
roda `git pull` continua vendo a versão antiga dos arquivos e sobrescreve o trabalho dos
outros no próximo commit.

Se alguém renomear ou mover pastas, o `git pull` só consegue aplicar a mudança com a pasta
livre. Feche o servidor de desenvolvimento, o editor e o Explorer apontando para ela antes.

## Ciclo normal

```bash
git pull
git checkout -b feat/nome-curto
# ... trabalha ...
git add .
git commit -m "feat: descrição curta"
git push -u origin feat/nome-curto
```

Depois abra um Pull Request no GitHub e peça revisão de alguém do time.

## Mensagens de commit

Padrão Conventional Commits, em português, uma linha, direto ao ponto.

| Prefixo | Quando usar |
|---|---|
| `feat:` | Funcionalidade nova |
| `fix:` | Correção de bug |
| `refactor:` | Muda o código sem mudar comportamento |
| `chore:` | Configuração, dependências, build |
| `docs:` | Só documentação |
| `test:` | Só teste |

Exemplos bons: `feat: filtro de preço no estoque`, `fix: comissão duplicada ao editar venda`.

## Antes de abrir o Pull Request

No front-end:

```bash
cd frontend
npm run build
```

O `build` roda o TypeScript e o Vite. Se passar, não tem erro de tipo nem de compilação.

## O que nunca entra no repositório

Já estão no `.gitignore`, mas vale saber o porquê:

- `node_modules/` — cada pessoa gera o seu com `npm install`
- `dist/` — gerado pelo build
- `.env`, `.env.local` — configuração da máquina de cada um. Use o `.env.example` como base
- `.claude/` — configuração local de ferramenta

## Fim de linha

O `.gitattributes` grava tudo em LF no repositório. No Windows o Git converte para CRLF na
sua pasta e de volta para LF ao commitar. Não mexa nessa configuração: sem ela, cada
commit apareceria como "arquivo inteiro alterado" para quem usa Linux ou macOS.

## Estrutura

| Pasta | Responsável |
|---|---|
| `frontend/` | React, TypeScript, Vite. Ver [`frontend/README.md`](frontend/README.md) |
| `backend/` | Java, Spring Boot, PostgreSQL |
| `docs/` | Escopo, modelo de dados, regras e contrato de API |

O contrato entre front e back está em [`docs/04-contrato-de-api.md`](docs/04-contrato-de-api.md).
Mudou um endpoint? Atualize o documento e avise o time, porque o front tem a assinatura
espelhada em [`frontend/src/api`](frontend/src/api).
