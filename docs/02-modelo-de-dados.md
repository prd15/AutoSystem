# 02 — Modelo de dados

Tudo extraído de `frontend/src/data/store.ts`. As três primeiras entidades vêm do
escopo aprovado; as duas últimas foram criadas pelo protótipo para o módulo financeiro.

## Visão geral

```
clientes ──< vendas >── veiculos
                │           │
                │           └──< lancamentos (compra do veículo, comissão)
                └──────────────< lancamentos (entrada da venda, comissão)

clientes ──< financiamentos >── veiculos
```

Cardinalidade real hoje: uma venda por veículo (a regra impede vender duas vezes), vários
lançamentos por venda, vários financiamentos por cliente.

## `veiculos`

`store.ts:11`

| Campo | Tipo no protótipo | Tipo no banco | Regras |
|---|---|---|---|
| `id` | number | `BIGSERIAL PK` | |
| `marca` | string | `VARCHAR(50) NOT NULL` | obrigatório, até 50 |
| `modelo` | string | `VARCHAR(50) NOT NULL` | obrigatório, até 50 |
| `ano` | number | `SMALLINT NOT NULL` | inteiro entre 1950 e ano atual + 1 |
| `cor` | string | `VARCHAR(30) NOT NULL` | obrigatório, até 30 |
| `quilometragem` | number | `INTEGER NOT NULL` | inteiro ≥ 0 |
| `preco` | number | `NUMERIC(12,2) NOT NULL` | > 0 |
| `placa` | string | `VARCHAR(7)` | opcional; quando preenchida, única e no padrão Mercosul/antigo |
| `status` | enum | `veiculo_status NOT NULL` | `disponivel` \| `reservado` \| `vendido`, padrão `disponivel` |
| `criado_em` | string yyyy-mm-dd | `TIMESTAMPTZ NOT NULL` | usado para "dias em estoque" |
| — | — | `atualizado_em TIMESTAMPTZ` | previsto no escopo, ausente no protótipo |

Observações:

- A placa é guardada **sem máscara**, só letras e números maiúsculos (`veiculo-sheet.tsx:158`).
  A formatação com hífen é só de exibição.
- O escopo previa `placa VARCHAR(8)`; o protótipo normaliza para 7 caracteres.
- `criado_em` deixou de ser um carimbo técnico e virou dado de negócio: alimenta "dias em
  estoque", o alerta de veículo parado e a ordenação padrão da listagem.

## `clientes`

`store.ts:25`

| Campo | Tipo no protótipo | Tipo no banco | Regras |
|---|---|---|---|
| `id` | number | `BIGSERIAL PK` | |
| `nome` | string | `VARCHAR(100) NOT NULL` | obrigatório, até 100 |
| `cpf` | string | `VARCHAR(14) NOT NULL UNIQUE` | com máscara no protótipo; validado com dígito verificador |
| `telefone` | string | `VARCHAR(20) NOT NULL` | mínimo 10 dígitos (com DDD) |
| `email` | string | `VARCHAR(100)` | opcional; formato validado quando preenchido |
| `criado_em` | string yyyy-mm-dd | `TIMESTAMPTZ NOT NULL` | exibido como "cliente desde" |

**Decisão pendente:** o protótipo guarda o CPF formatado (`482.113.900-27`) e compara
ignorando pontuação (`store.ts:459`). No banco, guardar só os 11 dígitos e formatar na
exibição evita duplicata mascarada. Recomendado: `CHAR(11)`.

## `vendas`

`store.ts:34`

| Campo | Tipo no protótipo | Tipo no banco | Regras |
|---|---|---|---|
| `id` | number | `BIGSERIAL PK` | |
| `veiculo_id` | number | `BIGINT NOT NULL REFERENCES veiculos` | obrigatório |
| `cliente_id` | number | `BIGINT NOT NULL REFERENCES clientes` | obrigatório |
| `vendedor` | string | `VARCHAR(100) NOT NULL` | texto livre nesta entrega |
| `valor_venda` | number | `NUMERIC(12,2) NOT NULL` | > 0; pode diferir do preço |
| `data_venda` | string yyyy-mm-dd | `DATE NOT NULL` | não pode ser futura |
| — | — | `criado_em TIMESTAMPTZ` | previsto no escopo, ausente no protótipo |

`vendedor` é string solta. Quando o módulo de usuários existir (rota "Configurações", hoje
"em breve"), isso vira `vendedor_id` apontando para `usuarios`. Vale já nascer como
`vendedor_id BIGINT NULL` + `vendedor_nome VARCHAR(100)` para não migrar duas vezes.

## `lancamentos` — fora do escopo aprovado

`store.ts:61`

| Campo | Tipo no protótipo | Tipo no banco | Regras |
|---|---|---|---|
| `id` | number | `BIGSERIAL PK` | |
| `tipo` | enum | `lancamento_tipo NOT NULL` | `entrada` \| `saida` |
| `categoria` | enum | `lancamento_categoria NOT NULL` | 9 valores (abaixo) |
| `descricao` | string | `VARCHAR(200) NOT NULL` | obrigatório |
| `valor` | number | `NUMERIC(12,2) NOT NULL` | > 0 (o sinal vem do `tipo`) |
| `data` | string yyyy-mm-dd | `DATE NOT NULL` | competência quando pendente, pagamento quando pago |
| `status` | enum | `lancamento_status NOT NULL` | `pago` \| `pendente` |
| `forma` | enum \| null | `forma_pagamento` | obrigatória quando `status = pago` |
| `venda_id` | number \| null | `BIGINT REFERENCES vendas` | quando preenchido, o lançamento é derivado e imutável |
| `veiculo_id` | number \| null | `BIGINT REFERENCES veiculos` | vincula custo de aquisição, oficina etc. |
| `vendedor` | string \| null | `VARCHAR(100)` | preenchido nas comissões |

O campo `data` acumula dois significados (vencimento e data de pagamento). Funciona no
protótipo, mas no banco convém separar: `vencimento DATE NOT NULL` + `pago_em DATE NULL`.
"Atrasado" deixa de ser derivado de um campo ambíguo.

## `financiamentos` — fora do escopo aprovado

`store.ts:77`

| Campo | Tipo no protótipo | Tipo no banco | Regras |
|---|---|---|---|
| `id` | number | `BIGSERIAL PK` | |
| `cliente_id` | number | `BIGINT NOT NULL REFERENCES clientes` | |
| `veiculo_id` | number | `BIGINT NOT NULL REFERENCES veiculos` | |
| `banco` | string | `VARCHAR(60) NOT NULL` | lista fixa de 6 no protótipo |
| `valor_financiado` | number | `NUMERIC(12,2) NOT NULL` | valor − entrada |
| `entrada` | number | `NUMERIC(12,2) NOT NULL` | ≥ 0 e menor que o valor |
| `parcelas` | number | `SMALLINT NOT NULL` | 12, 24, 36, 48 ou 60 |
| `taxa_mensal` | number | `NUMERIC(6,5) NOT NULL` | fração: 0,0189 = 1,89 % a.m. |
| `valor_parcela` | number | `NUMERIC(12,2) NOT NULL` | calculado pela Tabela Price |
| `inicio` | string yyyy-mm-dd | `DATE NOT NULL` | primeira parcela |
| `parcelas_pagas` | number | `SMALLINT NOT NULL` | contador, começa em 0 |

`parcelas_pagas` como contador é a simplificação mais frágil do modelo: não guarda quando
cada parcela foi paga, nem permite atraso parcial ou pagamento fora de ordem. Se
financiamento entrar no produto real, vira tabela `parcelas` (uma linha por parcela, com
vencimento, valor, pago_em). O contador serve só para o protótipo.

## Enumerações

| Enum | Valores | Onde |
|---|---|---|
| `veiculo_status` | `disponivel`, `reservado`, `vendido` | `store.ts:9` |
| `lancamento_tipo` | `entrada`, `saida` | `store.ts:47` |
| `lancamento_status` | `pago`, `pendente` | `store.ts:48` |
| `lancamento_categoria` | `venda`, `compra_veiculo`, `comissao`, `despesa_fixa`, `oficina`, `marketing`, `impostos`, `financiamento`, `outros` | `store.ts:49` |
| `forma_pagamento` | `pix`, `transferencia`, `boleto`, `cartao`, `dinheiro`, `financiamento` | `store.ts:59` |

Categorias válidas dependem do tipo (`lancamento-dialog.tsx:60`):

- **entrada**: venda, oficina, financiamento, outros
- **saída**: compra_veiculo, comissao, despesa_fixa, oficina, marketing, impostos, outros

Essa restrição hoje só existe na tela. No banco vira `CHECK` ou fica na camada de serviço.

## Dinheiro: o ponto que não pode passar batido

O protótipo guarda valores como `number` — ponto flutuante IEEE 754. Isso é aceitável para
uma tela, mas em banco de dados produz erro de centavo em soma e comparação.

No banco: `NUMERIC(12,2)` (ou `DECIMAL(12,2)`). Na aplicação: tipo decimal da linguagem
(`BigDecimal` em Java, `decimal` em C#, `Decimal`/`bcmath` em PHP, biblioteca decimal em
Node). Nunca `float`/`double`.

`NUMERIC(12,2)` comporta até R$ 9.999.999.999,99 — folgado para o negócio.

## Índices sugeridos

Derivados dos filtros e ordenações que as telas já usam:

```sql
-- Estoque: filtro por status e ordenação por dias em estoque
CREATE INDEX idx_veiculos_status      ON veiculos (status);
CREATE INDEX idx_veiculos_criado_em   ON veiculos (criado_em);
CREATE INDEX idx_veiculos_marca       ON veiculos (marca);
CREATE INDEX idx_veiculos_preco       ON veiculos (preco);

-- Placa única só quando preenchida
CREATE UNIQUE INDEX idx_veiculos_placa ON veiculos (placa) WHERE placa IS NOT NULL AND placa <> '';

-- Busca por marca/modelo/placa
CREATE INDEX idx_veiculos_busca ON veiculos
  USING gin (to_tsvector('portuguese', marca || ' ' || modelo || ' ' || coalesce(placa,'')));

-- Vendas: histórico por período e indicadores do mês
CREATE INDEX idx_vendas_data        ON vendas (data_venda DESC);
CREATE INDEX idx_vendas_veiculo     ON vendas (veiculo_id);
CREATE INDEX idx_vendas_cliente     ON vendas (cliente_id);

-- Clientes
CREATE UNIQUE INDEX idx_clientes_cpf ON clientes (cpf);

-- Financeiro
CREATE INDEX idx_lanc_data      ON lancamentos (data DESC);
CREATE INDEX idx_lanc_status    ON lancamentos (status) WHERE status = 'pendente';
CREATE INDEX idx_lanc_categoria ON lancamentos (categoria);
CREATE INDEX idx_lanc_venda     ON lancamentos (venda_id);
```

Com o volume de uma revenda pequena (dezenas a poucas centenas de veículos), quase nada
disso é gargalo. A lista existe para não esquecer a **unicidade parcial da placa**, que é
regra de negócio e não otimização.

## DDL de referência (PostgreSQL)

```sql
CREATE TYPE veiculo_status       AS ENUM ('disponivel', 'reservado', 'vendido');
CREATE TYPE lancamento_tipo      AS ENUM ('entrada', 'saida');
CREATE TYPE lancamento_status    AS ENUM ('pago', 'pendente');
CREATE TYPE lancamento_categoria AS ENUM ('venda','compra_veiculo','comissao','despesa_fixa','oficina','marketing','impostos','financiamento','outros');
CREATE TYPE forma_pagamento      AS ENUM ('pix','transferencia','boleto','cartao','dinheiro','financiamento');

CREATE TABLE veiculos (
  id            BIGSERIAL PRIMARY KEY,
  marca         VARCHAR(50)  NOT NULL,
  modelo        VARCHAR(50)  NOT NULL,
  ano           SMALLINT     NOT NULL CHECK (ano BETWEEN 1950 AND EXTRACT(YEAR FROM now())::INT + 1),
  cor           VARCHAR(30)  NOT NULL,
  quilometragem INTEGER      NOT NULL CHECK (quilometragem >= 0),
  preco         NUMERIC(12,2) NOT NULL CHECK (preco > 0),
  placa         VARCHAR(7),
  status        veiculo_status NOT NULL DEFAULT 'disponivel',
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE clientes (
  id        BIGSERIAL PRIMARY KEY,
  nome      VARCHAR(100) NOT NULL,
  cpf       CHAR(11)     NOT NULL UNIQUE,
  telefone  VARCHAR(20)  NOT NULL,
  email     VARCHAR(100),
  criado_em TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE vendas (
  id          BIGSERIAL PRIMARY KEY,
  veiculo_id  BIGINT NOT NULL REFERENCES veiculos(id) ON DELETE RESTRICT,
  cliente_id  BIGINT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  vendedor    VARCHAR(100) NOT NULL,
  valor_venda NUMERIC(12,2) NOT NULL CHECK (valor_venda > 0),
  data_venda  DATE NOT NULL CHECK (data_venda <= CURRENT_DATE),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT venda_unica_por_veiculo UNIQUE (veiculo_id)
);

CREATE TABLE lancamentos (
  id         BIGSERIAL PRIMARY KEY,
  tipo       lancamento_tipo      NOT NULL,
  categoria  lancamento_categoria NOT NULL,
  descricao  VARCHAR(200) NOT NULL,
  valor      NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  vencimento DATE NOT NULL,
  pago_em    DATE,
  status     lancamento_status NOT NULL DEFAULT 'pendente',
  forma      forma_pagamento,
  venda_id   BIGINT REFERENCES vendas(id)   ON DELETE RESTRICT,
  veiculo_id BIGINT REFERENCES veiculos(id) ON DELETE SET NULL,
  vendedor   VARCHAR(100),
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT forma_obrigatoria_quando_pago CHECK (status <> 'pago' OR forma IS NOT NULL)
);

CREATE TABLE financiamentos (
  id               BIGSERIAL PRIMARY KEY,
  cliente_id       BIGINT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  veiculo_id       BIGINT NOT NULL REFERENCES veiculos(id) ON DELETE RESTRICT,
  banco            VARCHAR(60) NOT NULL,
  valor_financiado NUMERIC(12,2) NOT NULL CHECK (valor_financiado > 0),
  entrada          NUMERIC(12,2) NOT NULL CHECK (entrada >= 0),
  parcelas         SMALLINT NOT NULL CHECK (parcelas BETWEEN 1 AND 120),
  taxa_mensal      NUMERIC(6,5) NOT NULL CHECK (taxa_mensal >= 0),
  valor_parcela    NUMERIC(12,2) NOT NULL,
  inicio           DATE NOT NULL,
  parcelas_pagas   SMALLINT NOT NULL DEFAULT 0,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT parcelas_pagas_validas CHECK (parcelas_pagas BETWEEN 0 AND parcelas)
);
```

`venda_unica_por_veiculo` traduz em banco a regra "veículo vendido não pode ser vendido de
novo". Se a loja precisar registrar recompra e revenda do mesmo carro, essa restrição cai e
a regra volta para a aplicação — decisão de produto.

## Dados de exemplo (seed)

O protótipo carrega 15 veículos, 5 clientes, 4 vendas, ~40 lançamentos e 3 financiamentos
(`store.ts:255`). O escopo pedia no mínimo 10 veículos e 3 vendas — atendido com folga.
Vale portar esse mesmo seed para o banco: os cálculos das telas já foram conferidos contra
ele.
