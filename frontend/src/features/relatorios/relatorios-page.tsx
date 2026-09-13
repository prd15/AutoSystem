import {
  BarChart3,
  CalendarRange,
  Car,
  CircleDollarSign,
  Receipt,
  Trophy,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Segmented } from "@/components/segmented"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { store, useEstado } from "@/data/store"
import { hojeISO, moeda } from "@/lib/format"

type Periodo =
  | "mes"
  | "30"
  | "90"
  | "tudo"
  | "personalizado"

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

function intervalo(
  periodo: Periodo,
  de: string,
  ate: string
): {
  de: string | null
  ate: string | null
} {
  const hoje = new Date()

  switch (periodo) {
    case "mes":
      return {
        de: iso(
          new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            1
          )
        ),
        ate: iso(
          new Date(
            hoje.getFullYear(),
            hoje.getMonth() + 1,
            0
          )
        ),
      }

    case "30": {
      const d = new Date()

      d.setDate(
        d.getDate() - 30
      )

      return {
        de: iso(d),
        ate: null,
      }
    }

    case "90": {
      const d = new Date()

      d.setDate(
        d.getDate() - 90
      )

      return {
        de: iso(d),
        ate: null,
      }
    }

    case "tudo":
      return {
        de: null,
        ate: null,
      }

    case "personalizado":
      return {
        de: de || null,
        ate: ate || null,
      }
  }
}

function dataNoIntervalo(
  data: string,
  de: string | null,
  ate: string | null
) {
  if (de && data < de) {
    return false
  }

  if (ate && data > ate) {
    return false
  }

  return true
}

const ROTULO_PERIODO: Record<
  Periodo,
  string
> = {
  mes: "este mês",
  "30": "últimos 30 dias",
  "90": "últimos 90 dias",
  tudo: "todo o período",
  personalizado:
    "período selecionado",
}

export function RelatoriosPage() {
  useEstado()

  const [
    periodo,
    setPeriodo,
  ] = useState<Periodo>("mes")

  const [de, setDe] =
    useState("")

  const [ate, setAte] =
    useState(hojeISO())

  const faixa = useMemo(
    () =>
      intervalo(
        periodo,
        de,
        ate
      ),
    [
      periodo,
      de,
      ate,
    ]
  )

  const vendasTodas =
    store.listarVendas()

  const vendas =
    useMemo(
      () =>
        vendasTodas.filter(
          (venda) =>
            dataNoIntervalo(
              venda.data_venda,
              faixa.de,
              faixa.ate
            )
        ),
      [
        vendasTodas,
        faixa.de,
        faixa.ate,
      ]
    )

  const veiculos =
    store.listarVeiculos()

  const funcionarios =
    store.funcionarios()

  const faturamento =
    vendas.reduce(
      (soma, venda) =>
        soma +
        venda.valor_venda,
      0
    )

  const ticketMedio =
    vendas.length > 0
      ? faturamento /
        vendas.length
      : 0

  const veiculosDisponiveis =
    veiculos.filter(
      (veiculo) =>
        veiculo.status !==
        "vendido"
    )

  const valorEstoque =
    veiculosDisponiveis.reduce(
      (soma, veiculo) =>
        soma +
        veiculo.preco,
      0
    )

  const vendasPorVendedor =
    funcionarios
      .filter(
        (funcionario) =>
          funcionario.cargo ===
          "vendedor"
      )
      .map(
        (
          funcionario
        ) => {
          const vendasFuncionario =
            vendas.filter(
              (venda) =>
                venda.vendedor ===
                funcionario.nome
            )

          const total =
            vendasFuncionario.reduce(
              (
                soma,
                venda
              ) =>
                soma +
                venda.valor_venda,
              0
            )

          return {
            nome:
              funcionario.nome,
            quantidade:
              vendasFuncionario.length,
            total,
            comissao:
              funcionario.comissao,
          }
        }
      )
      .sort(
        (a, b) =>
          b.total - a.total
      )

  const ranking =
    vendasPorVendedor.slice(
      0,
      5
    )

  const porPagamento = [
    {
      tipo: "À vista",
      quantidade:
        vendas.filter(
          (venda) =>
            venda.forma_pagamento ===
            "avista"
        ).length,
    },
    {
      tipo: "Financiamento",
      quantidade:
        vendas.filter(
          (venda) =>
            venda.forma_pagamento ===
            "financiamento"
        ).length,
    },
    {
      tipo: "Consórcio",
      quantidade:
        vendas.filter(
          (venda) =>
            venda.forma_pagamento ===
            "consorcio"
        ).length,
    },
  ]

  const maiorFormaPagamento =
    [...porPagamento].sort(
      (a, b) =>
        b.quantidade -
        a.quantidade
    )[0]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          aria-label="Período dos relatórios"
          valor={periodo}
          onChange={
            setPeriodo
          }
          opcoes={[
            {
              valor:
                "mes",
              rotulo:
                "Este mês",
            },
            {
              valor:
                "30",
              rotulo:
                "30 dias",
            },
            {
              valor:
                "90",
              rotulo:
                "90 dias",
            },
            {
              valor:
                "tudo",
              rotulo:
                "Tudo",
            },
            {
              valor:
                "personalizado",
              rotulo:
                "Período",
              icone:
                CalendarRange,
            },
          ]}
        />

        {periodo ===
          "personalizado" && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Label
              htmlFor="rel-de"
              className="text-muted-foreground text-[12px]"
            >
              de
            </Label>

            <Input
              id="rel-de"
              type="date"
              value={de}
              max={
                ate ||
                undefined
              }
              onChange={(
                e
              ) =>
                setDe(
                  e.target
                    .value
                )
              }
              className="bg-card tabular h-8 w-36 text-[13px]"
            />

            <Label
              htmlFor="rel-ate"
              className="text-muted-foreground text-[12px]"
            >
              até
            </Label>

            <Input
              id="rel-ate"
              type="date"
              value={ate}
              min={de}
              onChange={(
                e
              ) =>
                setAte(
                  e.target
                    .value
                )
              }
              className="bg-card tabular h-8 w-36 text-[13px]"
            />
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-[12px] font-medium">
                Faturamento
              </p>

              <p className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                {moeda(
                  faturamento
                )}
              </p>

              <p className="text-muted-foreground mt-1 text-[11px]">
                {
                  vendas.length
                }{" "}
                {vendas.length ===
                1
                  ? "venda registrada"
                  : "vendas registradas"}{" "}
                em{" "}
                {
                  ROTULO_PERIODO[
                    periodo
                  ]
                }
              </p>
            </div>

            <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
              <CircleDollarSign className="text-muted-foreground size-4" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-[12px] font-medium">
                Ticket médio
              </p>

              <p className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                {moeda(
                  ticketMedio
                )}
              </p>

              <p className="text-muted-foreground mt-1 text-[11px]">
                Valor médio por
                venda
              </p>
            </div>

            <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
              <Receipt className="text-muted-foreground size-4" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-[12px] font-medium">
                Estoque disponível
              </p>

              <p className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                {
                  veiculosDisponiveis.length
                }
              </p>

              <p className="text-muted-foreground mt-1 text-[11px]">
                {moeda(
                  valorEstoque
                )}{" "}
                em veículos
              </p>
            </div>

            <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
              <Car className="text-muted-foreground size-4" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-[12px] font-medium">
                Forma mais usada
              </p>

              <p className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                {maiorFormaPagamento
                  ?.quantidade
                  ? maiorFormaPagamento.tipo
                  : "Sem vendas"}
              </p>

              <p className="text-muted-foreground mt-1 text-[11px]">
                {maiorFormaPagamento
                  ?.quantidade
                  ? `${maiorFormaPagamento.quantidade} ${
                      maiorFormaPagamento.quantidade ===
                      1
                        ? "venda"
                        : "vendas"
                    }`
                  : "Nenhuma venda no período"}
              </p>
            </div>

            <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
              <BarChart3 className="text-muted-foreground size-4" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Trophy className="text-muted-foreground size-4" />

              <div>
                <h2 className="text-[14px] font-semibold">
                  Ranking de
                  vendedores
                </h2>

                <p className="text-muted-foreground mt-0.5 text-[12px]">
                  Desempenho por
                  faturamento no
                  período
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {ranking.length ===
            0 ? (
              <div className="text-muted-foreground px-4 py-10 text-center text-[13px]">
                Nenhuma venda
                registrada neste
                período.
              </div>
            ) : (
              ranking.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      item.nome
                    }
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold">
                      {index +
                        1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {
                          item.nome
                        }
                      </p>

                      <p className="text-muted-foreground text-[11px]">
                        {
                          item.quantidade
                        }{" "}
                        {item.quantidade ===
                        1
                          ? "venda"
                          : "vendas"}{" "}
                        · comissão{" "}
                        {
                          item.comissao
                        }
                        %
                      </p>
                    </div>

                    <p className="tabular text-[13px] font-semibold">
                      {moeda(
                        item.total
                      )}
                    </p>
                  </div>
                )
              )
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Users className="text-muted-foreground size-4" />

              <div>
                <h2 className="text-[14px] font-semibold">
                  Formas de
                  pagamento
                </h2>

                <p className="text-muted-foreground mt-0.5 text-[12px]">
                  Distribuição das
                  vendas no período
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {porPagamento.map(
              (item) => {
                const percentual =
                  vendas.length >
                  0
                    ? Math.round(
                        (item.quantidade /
                          vendas.length) *
                          100
                      )
                    : 0

                return (
                  <div
                    key={
                      item.tipo
                    }
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium">
                        {
                          item.tipo
                        }
                      </p>

                      <p className="text-muted-foreground text-[11px]">
                        {
                          percentual
                        }
                        % das
                        vendas
                      </p>
                    </div>

                    <p className="tabular text-[13px] font-semibold">
                      {
                        item.quantidade
                      }
                    </p>
                  </div>
                )
              }
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}