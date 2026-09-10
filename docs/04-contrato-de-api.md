# 04 — Contrato de API

Derivado método a método de `frontend/src/data/store.ts`. O protótipo já foi escrito
com esse formato em mente: o comentário do arquivo diz que cada método vira um `fetch`.

Convenções: JSON em todas as respostas, datas em ISO `yyyy-mm-dd`, dinheiro como string
decimal (`"129900.00"`) para não perder precisão em ponto flutuante no trânsito.

## Veículos

### `GET /api/veiculos`

Query params — todos opcionais e combináveis (`store.ts:334`):

| Param | Tipo | Efeito |
|---|---|---|
| `busca` | string | Casa com marca, modelo **ou placa**, sem distinção de caixa |
| `status` | `disponivel` \| `reservado` \| `vendido` | Filtra por status |
| `marca` | string | Igualdade exata |
| `preco_min` | decimal | `preco >= valor` |
| `preco_max` | decimal | `preco <= valor` |
| `ordem` | `veiculo` \| `ano` \| `quilometragem` \| `preco` \| `status` \| `dias` | Padrão: `dias` |
| `dir` | `asc` \| `desc` | Padrão: `asc` |
| `pagina`, `tamanho` | int | **Não existe no protótipo** — ver observação |

Resposta:

```json
{
  "itens": [
    {
      "id": 1, "marca": "Honda", "modelo": "Civic EXL", "ano": 2021,
      "cor": "Prata", "quilometragem": 42300, "preco": "129900.00",
      "placa": "RKA2B31", "status": "disponivel",
      "criado_em": "2026-08-22", "dias_em_estoque": 18
    }
  ],
  "total": 15,
  "resumo": { "valor_em_estoque": "1136700.00", "por_status": { "disponivel": 9, "reservado": 2, "vendido": 4 } }
}
```

`dias_em_estoque` pode vir calculado do servidor ou do cliente. Vindo do servidor, o valor
não muda se a máquina do usuário estiver com a data errada — preferível.

O bloco `resumo` evita uma segunda chamada: a tela precisa da contagem por status **antes**
de aplicar o filtro de status (`estoque-page.tsx:266`).

### `GET /api/veiculos/{id}`

Devolve o veículo ou 404.

### `POST /api/veiculos`

Corpo: marca, modelo, ano, cor, quilometragem, preco, placa, status.
Respostas: `201` com o veículo criado · `422` com erros por campo · `409` se a placa já existe.

```json
{ "erros": { "placa": "Já existe um veículo cadastrado com esta placa." } }
```

### `PUT /api/veiculos/{id}`

Mesmos campos. `200` · `404` · `422` · `409`.

### `DELETE /api/veiculos/{id}`

`204` em sucesso. **`409` quando existe venda registrada** (`store.ts:384`), com o motivo:

```json
{ "erro": "Este veículo possui uma venda registrada em 03/09/2026.",
  "venda": { "id": 1, "data_venda": "2026-09-03", "valor_venda": "109500.00", "cliente": "Marina Alves Ribeiro" } }
```

A tela usa esses dados para montar o diálogo de bloqueio, então vale devolvê-los.

### `GET /api/veiculos/marcas`

Lista de marcas distintas em ordem alfabética (`store.ts:352`), para o filtro.

### `GET /api/veiculos/vendaveis`

Veículos com status ≠ `vendido` (`store.ts:393`), para a seleção no registro de venda.
Pode ser `GET /api/veiculos?vendavel=true` — decisão de estilo.

## Clientes

| Método | Rota | Notas |
|---|---|---|
| `GET` | `/api/clientes?busca=` | Busca por nome, CPF (sem pontuação) ou e-mail; ordena por nome |
| `GET` | `/api/clientes/{id}` | |
| `POST` | `/api/clientes` | `409` quando o CPF já existe; `422` com erros por campo |

A listagem da tela precisa de campos derivados por cliente (`clientes-page.tsx:29`):

```json
{ "id": 1, "nome": "...", "cpf": "48211390027", "telefone": "...", "email": "...",
  "criado_em": "2026-07-01", "compras": 2, "total_gasto": "226500.00", "ultima_compra": "2026-09-03" }
```

Sem isso, a tela faz N+1 requisições. Melhor resolver com `LEFT JOIN` e agregação.

## Vendas

### `GET /api/vendas`

| Param | Efeito |
|---|---|
| `de`, `ate` | Intervalo de `data_venda`, inclusivo |

Ordem: mais recente primeiro, desempate por id decrescente (`store.ts:444`).

Cada item precisa trazer veículo e cliente embutidos — a tela mostra marca, modelo, ano,
placa, preço de tabela e nome do cliente (`vendas-page.tsx:181`):

```json
{ "id": 3, "data_venda": "2026-09-07", "vendedor": "Alan Ferreira", "valor_venda": "129900.00",
  "veiculo": { "id": 1, "marca": "Honda", "modelo": "Civic EXL", "ano": 2021, "placa": "RKA2B31", "preco": "129900.00" },
  "cliente": { "id": 2, "nome": "Rodrigo Pacheco Lima" },
  "diferenca": "0.00" }
```

### `POST /api/vendas` — endpoint transacional

Corpo: `veiculo_id`, `cliente_id`, `vendedor`, `valor_venda`, `data_venda`.

Executa **em uma transação** (`store.ts:398`):

1. Valida que o veículo existe e não está vendido → `409` se estiver
2. Insere a venda
3. Atualiza o veículo para `vendido`
4. Insere lançamento de entrada (categoria `venda`, status `pago`)
5. Insere lançamento de comissão (categoria `comissao`, 1,5 %, pendente, vence no fim do mês)

Resposta `201` com a venda e, idealmente, os indicadores recalculados — a tela atualiza os
quatro KPIs logo depois.

Erros: `409` "Este veículo já foi vendido." · `422` validações · `404` veículo ou cliente
inexistente.

**Este é o endpoint que define a exigência de banco transacional.**

### `POST /api/clientes` embutido

O diálogo de venda pode criar o cliente junto (`venda-dialog.tsx:105`). Duas opções:

- front chama `POST /api/clientes` e depois `POST /api/vendas` — mais simples, mas cria
  cliente órfão se a venda falhar;
- `POST /api/vendas` aceita `cliente: { nome, cpf, ... }` no lugar de `cliente_id` e cria os
  dois na mesma transação — mais correto.

Recomendado o segundo.

## Indicadores e séries

| Rota | Devolve | Origem |
|---|---|---|
| `GET /api/indicadores` | Os 8 números da visão geral, incluindo mês anterior | `store.ts:475` |
| `GET /api/indicadores/faturamento-mensal?meses=6` | Série com mês, rótulo, faturamento e nº de vendas | `store.ts:496` |
| `GET /api/indicadores/estoque-por-marca` | Marca, quantidade e valor, ordenado por valor | `store.ts:515` |

```json
// GET /api/indicadores
{ "veiculos_em_estoque": 11, "disponiveis": 9, "reservados": 2,
  "valor_estoque": "1136700.00",
  "vendas_no_mes": 2, "vendas_mes_anterior": 1,
  "faturamento_mes": "226500.00", "faturamento_mes_anterior": "101900.00" }
```

Meses sem movimento precisam aparecer na série com zero, não sumir.

## Financeiro — fora do escopo aprovado

Documentado porque existe no protótipo. Só implementar se o módulo entrar no plano.

### Lançamentos

| Método | Rota | Notas |
|---|---|---|
| `GET` | `/api/lancamentos` | Params: `de`, `ate`, `tipo`, `categoria`, `status` (inclui `atrasado`), `busca` |
| `POST` | `/api/lancamentos` | Cria lançamento manual |
| `PUT` | `/api/lancamentos/{id}` | Se `venda_id` != null, só `status`, `forma` e `data` são aceitos (`store.ts:573`) |
| `PATCH` | `/api/lancamentos/{id}/quitar` | Corpo `{ "forma": "pix" }`; se estava vencido, a data vira hoje |
| `DELETE` | `/api/lancamentos/{id}` | `409` quando `venda_id` != null |

`status=atrasado` é um filtro derivado: pendente com data anterior a hoje.

### Resumo e séries

| Rota | Devolve |
|---|---|
| `GET /api/financeiro/resumo?de=&ate=` | entradas, saídas, saldo, a receber, a pagar, atrasados, previsto (ver [03](03-regras-e-calculos.md)) |
| `GET /api/financeiro/fluxo-mensal?meses=6` | Por mês: entradas, saídas, saldo, acumulado |
| `GET /api/financeiro/saidas-por-categoria?de=&ate=` | Categoria e valor, só saídas pagas |

### Comissões

| Método | Rota | Notas |
|---|---|---|
| `GET` | `/api/comissoes?de=&ate=` | Agrupado por vendedor: vendas, faturamento, gerada, paga, pendente, itens |
| `POST` | `/api/comissoes/pagar` | Corpo `{ "vendedor": "...", "forma": "pix" }`; quita todas as pendentes **em uma transação**; devolve o total pago |

### Financiamentos

| Método | Rota | Notas |
|---|---|---|
| `GET` | `/api/financiamentos` | Ordenado por início decrescente; inclui veículo e cliente |
| `POST` | `/api/financiamentos` | Servidor calcula `valor_parcela` pela Tabela Price — nunca aceitar o valor do cliente |
| `PATCH` | `/api/financiamentos/{id}/parcela` | Incrementa `parcelas_pagas`, respeitando o total |
| `POST` | `/api/financiamentos/simular` | Sem gravar: devolve parcela, total, juros, CET e tabela de amortização |

A simulação pode continuar no front (a fórmula é curta e está em `lib/financeiro.ts`), mas
o **registro do contrato** tem que recalcular no servidor. Valor de parcela é dinheiro.

## Paginação — decisão pendente

O protótipo renderiza a lista inteira, sem paginação. Com 15 veículos funciona; com 300 a
tabela fica pesada e a resposta grande.

Três opções:

| Opção | Quando faz sentido |
|---|---|
| Sem paginação | Estoque real da loja fica abaixo de ~200 veículos e o time aceita a listagem completa |
| Paginação clássica (`pagina`, `tamanho`, `total`) | Escolha segura, casa com tabela e com o rodapé de contagem que já existe |
| Rolagem infinita (cursor) | Melhor no quadro/kanban, mais trabalho no front |

Recomendado: paginação clássica com `tamanho` padrão de 50, e o front pedindo tudo enquanto
o volume for pequeno. Definir isso **antes** de escrever os endpoints evita retrabalho.

## Padrão de erro

Um formato só, para o front tratar de forma uniforme:

```json
{
  "erro": "Mensagem em linguagem natural, pronta para exibir",
  "campos": { "placa": "Já existe um veículo cadastrado com esta placa." }
}
```

Requisito do escopo: "mensagens de erro claras e em linguagem natural, nunca códigos
técnicos expostos ao usuário". O `erro` vai para o toast; `campos` vai para os campos do
formulário, que já sabem exibir mensagem com `role="alert"`.

| Código | Uso |
|---|---|
| `200` / `201` / `204` | Sucesso |
| `404` | Registro inexistente |
| `409` | Conflito de regra: placa duplicada, CPF duplicado, veículo já vendido, exclusão bloqueada |
| `422` | Validação de campo |
| `500` | Erro inesperado — mensagem genérica para o usuário, detalhe no log |
