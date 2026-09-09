# 06 — Stack e arquitetura

Insumos para a decisão. As restrições vêm do escopo (`autosystem-escopo-primeira-entrega.md`)
e do que o protótipo já construiu.

## Restrições que a decisão precisa respeitar

| # | Restrição | Origem |
|---|---|---|
| 1 | Aplicação **monolítica**: front e back no mesmo projeto e repositório | Escopo |
| 2 | Equipe de **6 pessoas**, projeto acadêmico, Scrum | Escopo |
| 3 | Precisa **rodar localmente** seguindo o README | Escopo |
| 4 | Front-end já existe: **8.200 linhas de React + TypeScript** | Protótipo |
| 5 | Registrar venda exige **transação** de 4 escritas | `store.ts:398` |
| 6 | Dinheiro exige **decimal**, não ponto flutuante | Todo valor monetário |
| 7 | Sem autenticação nesta entrega, **mas prevista** para a seguinte | Escopo + `em-breve-page.tsx` |
| 8 | 5 tabelas, ~25 endpoints, agregações mensais | [02](02-modelo-de-dados.md), [04](04-contrato-de-api.md) |

## O front-end, na prática, já está decidido

React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui, com 5 telas funcionais, 22
componentes de UI e as regras de negócio já implementadas e testadas manualmente.

Trocar essa base (por Blade, Thymeleaf, Razor, Angular, Vue) significa reescrever tudo. Não
existe justificativa técnica para isso dado o que já está pronto.

A pergunta real de front-end não é "qual framework", e sim **"como esse SPA vive dentro de
um monólito"**. Duas respostas viáveis:

| Modelo | Como funciona | Prós | Contras |
|---|---|---|---|
| **SPA servido pelo back** (recomendado) | `npm run build` gera `dist/`; o back-end serve esses arquivos estáticos e expõe `/api/*` | Um processo em produção, um deploy, cumpre "monólito" ao pé da letra | Precisa de um passo de build no pipeline; rota desconhecida tem que cair no `index.html` |
| **Dois processos em dev, um artefato no fim** | Vite em `:5174` com proxy para a API em dev; build embutido no artefato final | Hot reload no front | Duas coisas rodando no `npm run dev` da equipe |

Na prática usam-se os dois: proxy no desenvolvimento, estático embutido no artefato. É a
configuração padrão de qualquer stack da lista abaixo.

## Banco de dados

| Critério | PostgreSQL | MySQL / MariaDB | SQLite |
|---|---|---|---|
| Transação ACID (restrição 5) | Sim | Sim (InnoDB) | Sim |
| Decimal exato (restrição 6) | `NUMERIC` | `DECIMAL` | Sem tipo decimal real — usa REAL/TEXT |
| Unicidade parcial (placa só quando preenchida) | Índice parcial nativo | Precisa de contorno (coluna gerada) | Índice parcial nativo |
| Enum | Tipo nativo | Tipo nativo | Só `CHECK` |
| Série temporal com meses vazios | `generate_series` | Precisa de tabela auxiliar | Complicado |
| Concorrência de escrita | Alta | Alta | Um escritor por vez |
| Rodar localmente | Docker ou instalador | Docker ou instalador | Um arquivo, zero instalação |
| Custo de hospedagem | Grátis em vários provedores | Grátis em vários | Nenhum |

**Recomendado: PostgreSQL.** Ganha nos três pontos que o protótipo realmente exige —
decimal, índice parcial para a placa e `generate_series` para as séries de 6 meses com mês
vazio. Nenhum deles é confortável em MySQL, e o segundo e o terceiro são chatos.

SQLite é tentador pela simplicidade acadêmica, mas ausência de tipo decimal com dinheiro é
exatamente o erro que [02](02-modelo-de-dados.md) alerta. Serve para teste automatizado, não
para o banco do produto.

## Back-end: comparativo

Avaliado para **esta** equipe, **este** escopo e **este** front.

| Critério | Node + TypeScript | Java + Spring Boot | C# + .NET | PHP + Laravel |
|---|---|---|---|---|
| Mesma linguagem do front | **Sim** | Não | Não | Não |
| Reaproveita tipos e validação do protótipo | **Sim, direto** | Não | Não | Não |
| Curva para quem já escreveu o front | **Nenhuma** | Média | Média | Média |
| Servir o SPA + API | Trivial | Trivial | Trivial | Trivial |
| Transação | Prisma / Drizzle / TypeORM | JPA + `@Transactional` | EF Core | Eloquent |
| Decimal | Precisa de biblioteca e disciplina | `BigDecimal` nativo | `decimal` nativo | `bcmath` / `Decimal` |
| Migrations | Prisma Migrate / Drizzle Kit | Flyway / Liquibase | EF Migrations | Artisan |
| Autenticação depois | Boa | **Excelente** (Spring Security) | Excelente | **Excelente** (nativa) |
| CRUD escrito rápido | Bom | Verboso | Bom | **Excelente** |
| Peso para rodar na máquina do time | Leve | Pesado (JVM, Maven/Gradle) | Médio | Leve |
| Comum em curso / banca | Menos | **Muito** | Médio | Médio |

### Leitura honesta de cada opção

**Node + TypeScript** (Fastify ou NestJS + Prisma). Maior vantagem: uma linguagem só no
projeto inteiro. Os tipos de `store.ts` viram os tipos da API; as validações do
`cliente-form.tsx` e do `veiculo-sheet.tsx` viram schemas Zod compartilhados entre front e
back, resolvendo a duplicação apontada em [03](03-regras-e-calculos.md) sem escrever duas
vezes. Para uma equipe que acabou de escrever 8.200 linhas de TypeScript, é o menor atrito.
Ponto fraco: dinheiro exige disciplina (Prisma devolve `Decimal`; usar sem converter para
`number`).

**Java + Spring Boot.** A escolha mais defensável em banca e a mais forte quando a
autenticação entrar. `BigDecimal` e JPA resolvem decimal e transação sem esforço. Custo:
verbosidade (cada uma das 5 entidades vira entidade, repositório, serviço, controller e
DTO), JVM na máquina de todo mundo, e a equipe alternando entre duas linguagens. Se o curso
exige Java ou a maioria já sabe Java, o custo compensa.

**C# + .NET.** Tecnicamente equivalente ao Spring com menos cerimônia. Só faz sentido se a
equipe já usa .NET — não há nada no projeto que puxe para essa direção.

**PHP + Laravel.** O caminho mais rápido para CRUD e o mais barato de hospedar. Eloquent,
migrations e validação resolvem o escopo com pouco código. Perde por não compartilhar nada
com o front e por ser a stack menos alinhada ao que a equipe acabou de praticar.

## Recomendação

**Primeira opção: Node + TypeScript (Fastify + Prisma) + PostgreSQL**, com o SPA já pronto
servido pelo próprio back-end.

Motivo em uma frase: a equipe acabou de provar que escreve TypeScript, o contrato de API já
está descrito em TypeScript, e usar a mesma linguagem nos dois lados elimina a duplicação de
validação — que é o maior risco de bug deste escopo.

**Se o curso exigir Java, ou se a maioria da equipe for mais forte em Java: Spring Boot +
PostgreSQL.** Não é uma escolha pior; é uma troca de "menos atrito de linguagem" por "mais
estrutura e melhor caminho para autenticação". Nada no protótipo impede.

**Critério de desempate, se a equipe estiver dividida:** conte quantas pessoas conseguem
abrir um repositório na linguagem X e entregar um endpoint sozinhas na primeira semana. A
linguagem com mais gente nessa condição vence. Com 6 pessoas e prazo de sprint, quem
consegue codar importa mais que a elegância da stack.

**O que não recomendo, e por quê:**

- Reescrever o front em template de servidor — joga fora o protótipo inteiro
- MySQL — atrapalha em três pontos que este projeto usa de verdade
- SQLite como banco do produto — sem decimal para dinheiro
- Microsserviços — o escopo diz monólito, e são 5 tabelas

## Arquitetura proposta

```
AutoSystem/
├── web/                     front-end (o protótipo, promovido)
│   ├── src/
│   └── package.json
├── api/                     back-end
│   ├── src/
│   │   ├── modules/
│   │   │   ├── veiculos/    rota + serviço + repositório
│   │   │   ├── clientes/
│   │   │   ├── vendas/      contém a transação de venda
│   │   │   ├── indicadores/
│   │   │   └── financeiro/  se o módulo entrar no plano
│   │   ├── db/              migrations e seed
│   │   └── compartilhado/   schemas de validação, tipos, erros
│   └── package.json
├── docs/                    esta documentação
└── README.md                como subir tudo
```

Camadas por módulo, três níveis:

1. **Rota** — recebe HTTP, valida entrada, devolve status e JSON
2. **Serviço** — regras de negócio; é onde a transação de venda vive
3. **Repositório** — acesso ao banco, sem regra

O que **não** fazer: regra de negócio dentro do controller ou dentro do SQL. As cinco regras
do escopo ficam no serviço, com teste unitário cada.

### Fluxo de desenvolvimento

```
npm run dev    →  API em :3000 e Vite em :5174 com proxy de /api
npm run build  →  web/dist embutido no artefato da API
npm start      →  um processo servindo SPA + API
```

### Ordem de implementação sugerida

| Sprint | Entrega | Por quê |
|---|---|---|
| 1 | Banco criado, migrations, seed portado do protótipo, `GET/POST/PUT/DELETE /api/veiculos` | Destrava a tela de Estoque inteira |
| 1 | Trocar `store.ts` do front pelas chamadas HTTP de veículos | Prova o contrato de ponta a ponta cedo |
| 2 | Clientes + `POST /api/vendas` transacional + `GET /api/vendas` | O ponto de maior risco técnico; fazer com folga |
| 2 | `GET /api/indicadores` e séries | Fecha Visão geral e Vendas |
| 3 | Testes das 5 regras, tratamento de erro padronizado, README de execução | Requisitos de aceite |
| Depois | Financeiro, autenticação, relatórios | Fora do escopo aprovado |

A troca do `store.ts` por HTTP já foi prevista pelo protótipo: a superfície dos métodos
espelha os endpoints, então a mudança fica contida em um arquivo.

## Decisões pendentes — precisam de resposta antes de codar

| # | Decisão | Impacto |
|---|---|---|
| 1 | **O módulo Financeiro entra na primeira entrega?** Ele não está no escopo aprovado e representa ~40 % do protótipo (2 tabelas, ~10 endpoints, 3 telas) | Muda o prazo da entrega inteira |
| 2 | Venda financiada gera uma entrada paga à vista, ou um plano de recebimento? | Modelo de `lancamentos` |
| 3 | `vendedor` continua texto livre ou vira usuário do sistema? | Estrutura de `vendas` e caminho da autenticação |
| 4 | Paginação: entra agora ou fica para quando o volume crescer? | Contrato de `GET /api/veiculos` |
| 5 | Um veículo pode ser vendido, recomprado e revendido? | Se sim, cai a restrição `UNIQUE (veiculo_id)` em vendas |
| 6 | Tema claro/escuro fica ou sai? | Custo de manutenção em toda tela nova |
| 7 | Onde a aplicação vai rodar na apresentação: máquina local, rede da faculdade ou internet? | Se for internet, autenticação deixa de ser opcional |
| 8 | Limites 60 dias (parado), 30 dias (reserva) e 1,5 % (comissão) ficam fixos ou viram configuração? | Tabela de parâmetros |

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Escopo do protótipo (5 telas) ser confundido com escopo da entrega (2 telas) | **Alta** | Alto | Decisão 1 acima, registrada no Trello antes da sprint |
| Venda registrada pela metade por falta de transação | Média | Alto | Endpoint único e transacional, com teste |
| Erro de centavo por usar float | Média | Médio | `NUMERIC(12,2)` no banco e tipo decimal na aplicação, revisado em code review |
| Validação divergir entre front e back | Alta | Médio | Schema compartilhado (Node) ou checklist de paridade (outras stacks) |
| Equipe dividida entre duas linguagens de back | Média | Alto | Decidir pelo critério de desempate e registrar a decisão |
| Publicar sem autenticação | Baixa | **Crítico** | Decisão 7; se for internet, autenticação entra no escopo |

## Resumo para levar à reunião

- **Front:** manter React + TypeScript + Vite + Tailwind + shadcn/ui, servido pelo back-end
- **Banco:** PostgreSQL, com `NUMERIC(12,2)` para dinheiro
- **Back:** Node + TypeScript (Fastify + Prisma) se a equipe seguir o critério de menor
  atrito; Spring Boot se o curso ou a equipe puxarem para Java. Ambos atendem
- **Primeiro risco a resolver não é técnico:** decidir se o módulo Financeiro entra na
  primeira entrega
