# AutoSystem — documentação do protótipo

Levantamento completo do protótipo em `frontend` ("Aqua"), feito para embasar a
decisão de stack de front-end, back-end e banco de dados do monólito.

Nada foi alterado no protótipo. Esta pasta só descreve o que existe lá.

## Índice

| Documento | Para que serve |
|---|---|
| [01 — Inventário funcional](01-inventario-funcional.md) | Todas as telas, ações, filtros, estados e componentes já construídos |
| [02 — Modelo de dados](02-modelo-de-dados.md) | Entidades, campos, tipos, chaves, restrições e DDL proposto |
| [03 — Regras e cálculos](03-regras-e-calculos.md) | Regras de negócio, validações e fórmulas, com origem no código |
| [04 — Contrato de API](04-contrato-de-api.md) | Endpoints derivados de cada método do protótipo |
| [05 — Requisitos não funcionais](05-requisitos-nao-funcionais.md) | Idioma, formatação, acessibilidade, desempenho, o que falta |
| [06 — Stack e arquitetura](06-stack-e-arquitetura.md) | Comparativo de opções, recomendação e plano de execução |
| [07 — Decisões arquiteturais](07-decisoes-arquiteturais.md) | Pauta de reunião para o rumo Java + Spring Boot: 17 decisões, dependências e armadilhas |

## Sumário executivo

O protótipo não é uma maquete: é uma aplicação React funcional, com regras de negócio
implementadas e dados de exemplo em memória. Ele já define, na prática, boa parte do
contrato do back-end.

### O que existe

| | |
|---|---|
| Arquivos TypeScript | 74 arquivos, ~8.200 linhas |
| Componentes shadcn/ui | 22 (`src/components/ui`) |
| Componentes de produto | 8 (`Segmented`, `KpiCard`, `StatusBadge`, `VeiculoTile`, `Field`, `EmptyState`, `AppShell`, `CommandPalette`) |
| Telas funcionais | 5 — Visão geral, Estoque, Vendas, Clientes, Financeiro |
| Telas marcadas "em breve" | 4 — Oficina, Test drive, Relatórios, Configurações |
| Diálogos / painéis | 7 — veículo, exclusão, venda, cliente, lançamento, simulador, paleta ⌘K |
| Entidades de dados | 5 — veículos, clientes, vendas, lançamentos, financiamentos |
| Enumerações | 5 — status do veículo, tipo, situação, categoria e forma de pagamento |
| Métodos de domínio no store | ~30, já no formato de endpoints |
| Bundle de produção | JS 955 KB (274 KB gzip) · CSS 79 KB (13 KB gzip) |

### O que isso significa para a decisão

1. **O front-end já está escolhido de fato.** React 19 + TypeScript + Vite + Tailwind v4 +
   shadcn/ui, com 8.200 linhas escritas e testadas manualmente. Trocar essa base joga fora
   o protótipo inteiro. A decisão real de front-end é *como servir* esse SPA dentro de um
   monólito, não *qual framework*.

2. **O escopo cresceu além da primeira entrega.** O documento de escopo previa 2 telas e 3
   tabelas. O protótipo entrega 5 telas e 5 tabelas, incluindo um módulo financeiro
   completo (fluxo de caixa, comissões, financiamentos com Tabela Price) que **não estava
   no escopo aprovado**. Isso precisa de uma decisão explícita: entra na primeira entrega,
   vira segunda entrega, ou fica no protótipo como visão de produto.

3. **O back-end tem uma exigência dura: transação.** Registrar uma venda escreve em quatro
   lugares ao mesmo tempo (cria venda, muda status do veículo, cria entrada de caixa, cria
   comissão a pagar). Ou tudo acontece, ou nada. Isso elimina soluções sem transação real e
   empurra para um banco relacional com ACID.

4. **Dinheiro está em `number` (ponto flutuante).** Aceitável no protótipo, inaceitável no
   banco. Detalhe em [02](02-modelo-de-dados.md).

5. **O contrato de API está pronto para ser escrito.** Cada método do `store.ts` mapeia
   um a um para um endpoint, com filtros e retornos já definidos. Ver [04](04-contrato-de-api.md).

### Recomendação em uma linha

Monólito com **back-end que sirva o SPA já construído** e **PostgreSQL**; a escolha da
linguagem do back-end depende do que a equipe de 6 pessoas já sabe — o comparativo e o
critério de desempate estão em [06](06-stack-e-arquitetura.md).

## Como rodar o protótipo

```bash
cd frontend && npm install && npm run dev
```

Abre em http://localhost:5174. Sem back-end: os dados vivem em memória e o botão de
restaurar na barra lateral recarrega o exemplo.
