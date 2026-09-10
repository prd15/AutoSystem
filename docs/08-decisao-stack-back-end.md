# 08 — Decisão de stack do back-end

**Status:** Decidido · **Responsável:** Lucas (back-end) · **Data:** 2026-09-09
**Base:** [06](06-stack-e-arquitetura.md), [07](07-decisoes-arquiteturais.md), o escopo aprovado e o
protótipo `design-system-03`.

Este documento fecha o rumo que o `07` deixou em aberto, na parte que cabe ao responsável pelo
back-end. As decisões de **produto/time** (ver o fim) seguem pendentes.

## Decisão — plataforma e persistência

| Item | Escolha |
|---|---|
| Linguagem | **Java 21** (LTS), virtual threads ligadas |
| Framework | **Spring Boot 3.5.16** (última 3.5.x — menos atrito de tutorial que o 4.1) |
| Build | **Maven** + Maven Wrapper (`mvnw`) |
| Banco | **PostgreSQL**, `NUMERIC(12,2)` para dinheiro |
| Persistência | **Spring Data JPA** no CRUD + **`JdbcClient`** nas agregações/séries (`generate_series`) |
| Migrations | **Flyway** (`flyway-core` + `flyway-database-postgresql`), `ddl-auto=validate` |
| Filtros | **JPA Specifications** (WHERE dinâmico combinável) |
| Mapeamento DTO | **`record` + manual** (sem ModelMapper) |
| Validação | **Bean Validation**; o back é a **fonte única** (front valida por UX) |
| Erros | **ProblemDetail (RFC 9457)** com propriedades estendidas `erro` e `campos` |
| Doc / tipos | **springdoc** (2.x para Boot 3.5) → **OpenAPI → TypeScript** para o front |
| Testes | **Testcontainers** (Postgres real: migrations/repositórios) + **H2** (unitário/slice rápido) |
| Organização | **Monólito**, package-by-feature, pacote raiz `br.com.autosystem` |
| Front no monólito | **SPA servido pelo Spring** via `frontend-maven-plugin` → `resources/static`; mesma origem, **sem CORS**, hash routing (sem fallback de 404) |
| Auditoria | `@CreatedDate/@LastModifiedDate` + `@EnableJpaAuditing`; `criado_por/atualizado_por` já criados nulos |

## Decisão — convenções de API (ajusta o [04](04-contrato-de-api.md))

- **JSON em `snake_case`** (`spring.jackson.property-naming-strategy=SNAKE_CASE`) — o `store.ts` do
  front já é snake_case; manter evita reescrever os tipos do protótipo.
- **Dinheiro como número** no JSON (o front tipa `number`; valores < R$ 10 mi são seguros); `BigDecimal(12,2)` no back.
- **Datas** `yyyy-mm-dd` (`LocalDate`) + `spring.jackson.time-zone=America/Sao_Paulo`; "hoje" vem de um `Clock` injetado (regra do mês/atraso testável).
- **HTTP:** `201/200/204` · `404` · **`409`** conflito (placa/CPF duplicado, veículo já vendido, exclusão bloqueada) · **`422`** validação · `500` genérico.
- **Corpo de erro:** `{ erro, campos }` (via ProblemDetail estendido).
- **Listagem de veículos:** envelope `{ itens, total, resumo }` com `Pageable` interno.
- **Enums:** `@Enumerated(STRING)` + `VARCHAR` + `CHECK` (não o ENUM nativo do `02`).
- **CPF** `CHAR(11)` (só dígitos) · **placa** `VARCHAR(7)` normalizada.

## Por quê (resumo do trade-off)

Node e Spring Boot atendem. No porte deste projeto **performance empata** (I/O-bound, dezenas a
centenas de registros). A decisão pende para os critérios que de fato pesam:

- **Manutenção/refatoração** e **força do responsável** favorecem Java/Spring (tooling, estrutura
  opinativa, padrões já provados em projeto anterior, melhor caminho para a autenticação futura).
- A única vantagem real do Node (uma linguagem só, validação compartilhada) **encolhe** num time
  com back-end dedicado, e é **neutralizada** por: **OpenAPI → TS** (contrato sempre sincronizado),
  **JSON snake_case** (front intocado) e **validação única no back**.

## Consequências

- Verbosidade do Java e JVM na máquina de quem for mexer no back (aceitável).
- springdoc **2.x** (porque é Boot 3.5, não 4).
- Front permanece **sem alterações** de contrato (snake_case + dinheiro número).

## Em aberto — decisão de time/professor

1. **Módulo Financeiro entra na 1ª entrega?** Define 3 vs 5 tabelas e 2 vs 4 escritas na venda.
   Recomendação: **não** — 1ª entrega só com o escopo aprovado (`veiculos`, `clientes`, `vendas`).
2. **Onde a aplicação roda na apresentação** (rede local vs internet) → se auth deixa de ser opcional.
3. **Paginação** agora (`tamanho` padrão 50) ou depois.
