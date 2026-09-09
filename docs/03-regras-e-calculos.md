# 03 — Regras de negócio, validações e cálculos

Cada item aponta onde está implementado no protótipo. Tudo aqui precisa existir **também no
back-end** — validação de front é conveniência, não garantia.

## Regras de negócio

### Do escopo aprovado

| # | Regra | Onde | Observação |
|---|---|---|---|
| 1 | Registrar venda muda o veículo para `vendido` | `store.ts:405` | Automático, sem escolha do usuário |
| 2 | Veículo `vendido` não pode ser vendido de novo | `store.ts:401` e `store.ts:393` | O vendido nem aparece na seleção |
| 3 | Veículo com venda registrada não pode ser excluído | `store.ts:384` | Diálogo mostra data, valor e cliente |
| 4 | `valor_venda` pode diferir do `preco` | `venda-dialog.tsx:83` | Diferença exibida como desconto ou acréscimo |
| 5 | Veículo `vendido` não conta no estoque | `store.ts:476` | Vale para contagem e para valor imobilizado |

### Criadas pelo protótipo (módulo financeiro)

| # | Regra | Onde |
|---|---|---|
| 6 | Registrar venda cria **uma entrada paga** (o valor da venda) e **uma saída pendente** (comissão) | `store.ts:409-439` |
| 7 | Comissão é **1,5 % do valor negociado**, com vencimento no último dia do mês da venda | `store.ts:115`, `store.ts:135` |
| 8 | Lançamento com `venda_id` não pode ser excluído; só situação, forma e data mudam | `store.ts:588`, `lancamento-dialog.tsx:132` |
| 9 | "Atrasado" é derivado: pendente com data anterior a hoje | `store.ts:548` |
| 10 | Saldo do período considera **só o que foi pago**; pendências aparecem à parte | `store.ts:597` |
| 11 | Ao quitar um lançamento vencido, a data passa a ser hoje | `store.ts:579` |
| 12 | Custo de aquisição é um lançamento `compra_veiculo` vinculado ao veículo | `store.ts:654` |
| 13 | Pagar comissões em lote quita todas as pendentes do vendedor de uma vez | `store.ts:680` |

**Ponto de atenção na regra 6.** O protótipo assume que toda venda é recebida à vista, em
Pix (`store.ts:420`). Na vida real, venda financiada entra em parcelas ou como repasse do
banco. O seed até distingue formas de pagamento, mas o fluxo de registro não. Definir antes
de implementar: a venda gera **uma** entrada paga, ou um plano de recebimento?

## Validações de formulário

### Veículo (`veiculo-sheet.tsx:68`)

| Campo | Regra | Mensagem |
|---|---|---|
| Marca | Obrigatória, até 50 caracteres | "Informe a marca." |
| Modelo | Obrigatório, até 50 | "Informe o modelo." |
| Ano | Obrigatório, inteiro, entre 1950 e ano atual + 1 | "O ano deve estar entre 1950 e 2027." |
| Cor | Obrigatória, até 30 | "Informe a cor." |
| Quilometragem | Obrigatória, inteiro ≥ 0 | "A quilometragem deve ser um número inteiro igual ou maior que zero." |
| Preço | Obrigatório, > 0 | "O preço deve ser maior que zero." |
| Placa | Opcional; se preenchida, `^[A-Z]{3}\d[A-Z0-9]\d{2}$` e única | "Use o formato ABC1D23 ou ABC1234." / "Já existe um veículo cadastrado com esta placa." |
| Status | Sempre válido, padrão `disponivel` | — |

A expressão da placa cobre os dois padrões brasileiros: antigo (ABC1234) e Mercosul
(ABC1D23), porque a quarta posição aceita letra ou número.

### Cliente (`cliente-form.tsx:41`)

| Campo | Regra |
|---|---|
| Nome | Obrigatório, até 100 caracteres |
| CPF | Obrigatório, **11 dígitos com dígito verificador válido**, não repetido (`111.111.111-11` rejeitado), único no cadastro |
| Telefone | Obrigatório, ≥ 10 dígitos (com DDD) |
| E-mail | Opcional; se preenchido, `^[^\s@]+@[^\s@]+\.[^\s@]+$` |

O algoritmo de CPF está em `cliente-form.tsx:29` e é o oficial (dois dígitos verificadores
por módulo 11). Máscaras de CPF e telefone em `cliente-form.tsx:15` e `:23`.

### Venda (`venda-dialog.tsx:88`)

| Campo | Regra |
|---|---|
| Veículo | Obrigatório, só entre os não vendidos |
| Cliente | Obrigatório — existente ou cadastrado na hora (com as validações acima) |
| Vendedor | Obrigatório, texto livre |
| Valor | Obrigatório, > 0 |
| Data | Obrigatória, **não pode ser futura** |

### Lançamento (`lancamento-dialog.tsx:65`)

| Campo | Regra |
|---|---|
| Descrição | Obrigatória |
| Valor | Obrigatório, > 0 |
| Data | Obrigatória |
| Forma | **Obrigatória quando a situação é "pago"** |
| Categoria | Restrita ao conjunto do tipo escolhido |

### Simulador de financiamento (`simulador-dialog.tsx:82`)

Valor > 0; entrada ≥ 0 e **menor** que o valor; taxa ≥ 0. Para registrar contrato, veículo e
cliente passam a ser obrigatórios.

## Cálculos

### Indicadores da visão geral (`store.ts:475`)

```
veiculosEmEstoque  = contagem de veículos com status ≠ vendido
disponiveis        = contagem com status = disponivel
reservados         = contagem com status = reservado
valorEstoque       = soma de preco dos veículos com status ≠ vendido
vendasNoMes        = contagem de vendas com data_venda no mês corrente
faturamentoMes     = soma de valor_venda dessas vendas
vendasMesAnterior      = mesma contagem no mês anterior
faturamentoMesAnterior = mesma soma no mês anterior
variação (%)       = round(((atual − anterior) / anterior) × 100); 100 % quando anterior = 0 e atual > 0
```

### Séries de 6 meses

- **Faturamento** (`store.ts:496`): por mês, soma de `valor_venda` e contagem de vendas.
- **Fluxo de caixa** (`store.ts:619`): por mês, só lançamentos **pagos** — entradas, saídas,
  saldo do mês e saldo acumulado.

Os dois iteram os 6 meses a partir do mês corrente, inclusive meses vazios. No SQL, isso
pede `generate_series` (ou equivalente) para não sumir com mês sem movimento.

### Resumo financeiro (`store.ts:597`)

```
entradas         = soma de lançamentos pagos, tipo entrada, dentro do período
saidas           = soma de lançamentos pagos, tipo saída, dentro do período
saldo            = entradas − saidas
aReceber         = soma de TODOS os pendentes de entrada (ignora o período)
aPagar           = soma de TODOS os pendentes de saída (ignora o período)
atrasados        = contagem de pendentes com data < hoje (ignora o período)
previstoEntradas = soma de entradas do período, pagas ou não
previstoSaidas   = soma de saídas do período, pagas ou não
```

Note a assimetria proposital: realizado é filtrado por período, pendência é global. Faz
sentido na tela ("o que devo, independente de quando"), mas precisa estar explícito no
contrato da API para o back-end não "corrigir" isso por engano.

### Comissões (`store.ts:662`)

Agrupa lançamentos de categoria `comissao` por vendedor e devolve: número de vendas,
faturamento correspondente, comissão gerada, paga, pendente e os itens.

```
comissão de uma venda = round(valor_venda × 0,015)
vencimento            = último dia do mês da data da venda
```

O arredondamento é para inteiro (`Math.round`, `store.ts:186`), não para centavo. No
back-end com `NUMERIC`, decidir: arredondar para 2 casas (recomendado) ou manter inteiro.

### Financiamento — Tabela Price (`store.ts:156`, `lib/financeiro.ts:30`)

```
parcela = principal × i / (1 − (1 + i)^−n)          i = taxa mensal em fração, n = parcelas
juros da parcela k     = saldo devedor × i
amortização da parcela = parcela − juros
saldo                  = saldo − amortização
total pago             = parcela × n
juros totais           = total − principal
CET anual aproximado   = (1 + i)^12 − 1
```

Quando a taxa é zero, a parcela é `principal / n` (evita divisão por zero).

O simulador mostra as 5 primeiras linhas da tabela de amortização. A próxima parcela de um
contrato é `inicio + parcelas_pagas` meses, preservando o dia quando o mês seguinte tem
menos dias (`lib/financeiro.ts:4`).

### Derivações da tela de estoque

```
dias em estoque = hoje − criado_em, em dias, mínimo 0        (lib/format.ts:42)
veículo parado  = status ≠ vendido e dias ≥ 60               (estoque-page.tsx:452)
reserva antiga  = status = reservado e dias ≥ 30             (quadro-view.tsx:25)
recém-chegado   = status = disponivel e dias ≤ 3             (quadro-view.tsx:27)
valor filtrado  = soma de preco da seleção, excluindo vendidos (estoque-page.tsx:277)
```

Os limites 60, 30 e 3 estão fixos no código. Se a loja quiser ajustar, viram configuração.

### Derivações da tela de vendas

```
ticket médio     = faturamento do período / número de vendas
desconto total   = Σ (preco do veículo − valor_venda)          negativo = vendeu acima da tabela
vendedor destaque = maior soma de valor_venda no período
```

## Transações — o requisito mais duro para o back-end

`registrarVenda` (`store.ts:398`) faz **quatro escritas que precisam acontecer juntas**:

1. Insere a venda
2. Muda o status do veículo para `vendido`
3. Insere o lançamento de entrada (valor da venda, pago)
4. Insere o lançamento de comissão (1,5 %, pendente, vence no fim do mês)

Se a terceira falhar, o carro fica vendido e o caixa não registra a entrada. Uma venda
registrada pela metade é pior que uma venda não registrada.

Consequência prática: o banco precisa de **transação ACID** e o back-end precisa expor esse
fluxo em **um único endpoint** (`POST /api/vendas`), nunca em quatro chamadas do front.

`pagarComissoes` (`store.ts:680`) tem a mesma característica: quita N lançamentos de uma vez.

## Duplicação de validação — decisão a tomar

Toda validação listada aqui está no front. O back-end vai precisar das mesmas regras. Três
caminhos:

| Caminho | Custo | Risco |
|---|---|---|
| Escrever duas vezes (TS no front, linguagem X no back) | Médio | Divergirem com o tempo |
| Back-end como fonte única; front só exibe o erro que voltou | Baixo | Formulário fica lento, pior experiência |
| Regras no back, validação de formato repetida no front | Médio | O que o time normalmente faz — recomendado |

O terceiro é o equilíbrio: front valida formato e obrigatoriedade (resposta imediata), back
valida tudo de novo, inclusive unicidade e regras de negócio, e é ele quem manda.
