# AutoSystem

Sistema de gestão para concessionárias de veículos: estoque, vendas, clientes e visão
gerencial. Monólito com front-end React e back-end Java + Spring Boot no mesmo repositório.

## Estrutura

```
AutoSystem/
  frontend/   SPA em React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui
  backend/    API em Java + Spring Boot + PostgreSQL (a criar)
  docs/       escopo, modelo de dados, regras, contrato de API e decisões de arquitetura
```

## Rodar em desenvolvimento

Pré-requisitos: Node 24 (`frontend/.node-version`), JDK 21, PostgreSQL.

Front-end (porta 5174):

```bash
cd frontend && npm install && npm run dev
```

Back-end (porta 8080), quando existir:

```bash
cd backend && ./mvnw spring-boot:run
```

O Vite faz proxy de `/api` para `http://localhost:8080`, então o front chama a API sem
CORS. Sem back-end rodando, o front funciona com dados em memória.

## Build de produção

```bash
cd frontend && npm run build
```

Gera `frontend/dist/`. O Spring Boot serve esses arquivos como estáticos
(`src/main/resources/static`) e expõe `/api/*` na mesma origem: um artefato, um processo.
A navegação do front é por hash (`#/estoque`), então não precisa de fallback de rota.

## Contrato entre front e back

- Endpoints, parâmetros, corpos e códigos de erro: [`docs/04-contrato-de-api.md`](docs/04-contrato-de-api.md)
- Cliente HTTP tipado, um método por endpoint: [`frontend/src/api`](frontend/src/api)
- Formato único de erro: `{ "erro": "mensagem", "campos": { "placa": "..." } }`
- Dinheiro em string decimal (`"129900.00"`), datas em `yyyy-mm-dd`

## Documentação

| | |
|---|---|
| [Escopo da primeira entrega](docs/autosystem-escopo-primeira-entrega.md) | O que entra na sprint 1 |
| [Modelo de dados](docs/02-modelo-de-dados.md) | Tabelas, tipos, restrições e DDL |
| [Regras e cálculos](docs/03-regras-e-calculos.md) | Regras de negócio e fórmulas |
| [Stack e arquitetura](docs/06-stack-e-arquitetura.md) | Comparativo e recomendação |
| [Decisões arquiteturais](docs/07-decisoes-arquiteturais.md) | Pauta de decisões do monólito |
| [Front-end](frontend/README.md) | Telas, design system, formulários |
| [Como contribuir](CONTRIBUTING.md) | Fluxo de git, padrão de commit e checagens antes do PR |
