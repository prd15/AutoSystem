import {
  BadgeCheck,
  CircleDollarSign,
  FileText,
  Search,
  WalletCards,
  Eye,
  X,
} from "lucide-react"
import { useMemo, useState } from "react"

import { useAuth } from "@/auth-context"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ROTULO_STATUS_FINANCIAMENTO,
  store,
  useEstado,
  type StatusFinanciamento,
} from "@/data/store"
import { dataBR, moeda } from "@/lib/format"

function statusBadge(
  status: StatusFinanciamento
) {
  const rotulo =
    ROTULO_STATUS_FINANCIAMENTO[status]

  switch (status) {
    case "ativo":
      return (
        <Badge variant="secondary">
          {rotulo}
        </Badge>
      )

    case "aprovado":
      return <Badge>{rotulo}</Badge>

    case "em_analise":
      return (
        <Badge variant="outline">
          {rotulo}
        </Badge>
      )

    case "cancelado":
      return (
        <Badge variant="destructive">
          {rotulo}
        </Badge>
      )

    case "quitado":
      return (
        <Badge variant="outline">
          {rotulo}
        </Badge>
      )

    default:
      return null
  }
}

function percentualTaxa(valor: number) {
  return (valor * 100).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )
}

export function FinanciamentosPage() {
  useEstado()
  const { usuario } = useAuth()
  const vendedor = usuario?.perfil === "vendedor"

  const [busca, setBusca] = useState("")

  const [status, setStatus] = useState<
    StatusFinanciamento | "todos"
  >("todos")

  const [financiamentoSelecionadoId, setFinanciamentoSelecionadoId] =
    useState<number | null>(null)

  const todosFinanciamentos = store.financiamentos()
  const vendas = store.listarVendas()

  const financiamentos = useMemo(() => {
    if (!vendedor) {
      return todosFinanciamentos
    }

    const nomeUsuario =
      usuario?.nome.trim().toLocaleLowerCase("pt-BR") ?? ""

    return todosFinanciamentos.filter((financiamento) => {
      const vendaVinculada = vendas.find(
        (venda) => venda.financiamento_id === financiamento.id
      )

      const responsavel =
        financiamento.vendedor ?? vendaVinculada?.vendedor ?? ""

      return (
        responsavel.trim().toLocaleLowerCase("pt-BR") === nomeUsuario
      )
    })
  }, [todosFinanciamentos, vendas, vendedor, usuario?.nome])

  const filtrados = useMemo(() => {
    const termo =
      busca.trim().toLowerCase()

    return financiamentos.filter(
      (financiamento) => {
        const cliente =
          store.obterCliente(
            financiamento.cliente_id
          )

        const veiculo =
          store.obterVeiculo(
            financiamento.veiculo_id
          )

        const texto = [
          financiamento.id,
          cliente?.nome ?? "",
          financiamento.banco,
          financiamento.vendedor ?? "",
          veiculo?.marca ?? "",
          veiculo?.modelo ?? "",
          veiculo?.placa ?? "",
        ]
          .join(" ")
          .toLowerCase()

        if (
          termo &&
          !texto.includes(termo)
        ) {
          return false
        }

        if (
          status !== "todos" &&
          financiamento.status !== status
        ) {
          return false
        }

        return true
      }
    )
  }, [
    busca,
    status,
    financiamentos,
  ])

  const ativos =
    financiamentos.filter(
      (f) => f.status === "ativo"
    ).length

  const quitados =
    financiamentos.filter(
      (f) => f.status === "quitado"
    ).length

  const totalFinanciado =
    financiamentos
      .filter(
        (f) => f.status !== "cancelado"
      )
      .reduce(
        (total, financiamento) =>
          total +
          financiamento.valor_financiado,
        0
      )

  const saldoAberto =
    financiamentos
      .filter(
        (f) =>
          f.status === "ativo" ||
          f.status === "aprovado"
      )
      .reduce(
        (total, financiamento) => {
          const parcelasRestantes =
            Math.max(
              financiamento.parcelas -
                financiamento.parcelas_pagas,
              0
            )

          return (
            total +
            parcelasRestantes *
              financiamento.valor_parcela
          )
        },
        0
      )

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {vendedor ? "Meus financiamentos" : "Financiamentos"}
            </p>

            <FileText className="text-muted-foreground size-4" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {financiamentos.length}
          </p>

          <p className="text-muted-foreground mt-1 text-xs">
            contratos cadastrados
          </p>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {vendedor ? "Meus ativos" : "Ativos"}
            </p>

            <BadgeCheck className="text-muted-foreground size-4" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {ativos}
          </p>

          <p className="text-muted-foreground mt-1 text-xs">
            contratos em andamento
          </p>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {vendedor ? "Meu total financiado" : "Total financiado"}
            </p>

            <CircleDollarSign className="text-muted-foreground size-4" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {moeda(totalFinanciado)}
          </p>

          <p className="text-muted-foreground mt-1 text-xs">
            principal contratado
          </p>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {vendedor ? "Meu saldo em parcelas" : "Saldo em parcelas"}
            </p>

            <WalletCards className="text-muted-foreground size-4" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {moeda(saldoAberto)}
          </p>

          <p className="text-muted-foreground mt-1 text-xs">
            {quitados}{" "}
            {quitados === 1
              ? "contrato quitado"
              : "contratos quitados"}
          </p>
        </div>
      </section>

      <section className="bg-card overflow-hidden rounded-xl border">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

            <Input
              value={busca}
              onChange={(event) =>
                setBusca(event.target.value)
              }
              placeholder="Buscar por cliente, banco, veículo ou placa..."
              className="pl-9"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target
                  .value as
                  | StatusFinanciamento
                  | "todos"
              )
            }
            className="bg-background border-input focus-visible:ring-ring h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
          >
            <option value="todos">
              Todos os status
            </option>

            <option value="em_analise">
              Em análise
            </option>

            <option value="aprovado">
              Aprovado
            </option>

            <option value="ativo">
              Ativo
            </option>

            <option value="quitado">
              Quitado
            </option>

            <option value="cancelado">
              Cancelado
            </option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1380px] text-sm">
            <thead>
              <tr className="bg-muted/40 border-b text-left">
                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Contrato
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Cliente
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Veículo
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Banco
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Valor / Entrada
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Financiado
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Taxa
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Parcelamento
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Progresso
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Início
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Status
                </th>

                <th className="text-muted-foreground px-4 py-3 text-right font-medium">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map(
                (financiamento) => {
                  const cliente =
                    store.obterCliente(
                      financiamento.cliente_id
                    )

                  const veiculo =
                    store.obterVeiculo(
                      financiamento.veiculo_id
                    )

                  const parcelasRestantes =
                    Math.max(
                      financiamento.parcelas -
                        financiamento.parcelas_pagas,
                      0
                    )

                  const saldo =
                    parcelasRestantes *
                    financiamento.valor_parcela

                  const progresso =
                    financiamento.parcelas > 0
                      ? Math.round(
                          (financiamento.parcelas_pagas /
                            financiamento.parcelas) *
                            100
                        )
                      : 0

                  return (
                    <tr
                      key={financiamento.id}
                      onClick={() => setFinanciamentoSelecionadoId(financiamento.id)}
                      className="hover:bg-muted/30 cursor-pointer border-b last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold tabular-nums">
                          #
                          {String(
                            financiamento.id
                          ).padStart(4, "0")}
                        </div>

                        <div className="text-muted-foreground mt-0.5 text-xs">
                          financiamento
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {cliente?.nome ??
                          "Cliente não encontrado"}
                      </td>

                      <td className="px-4 py-3">
                        {veiculo ? (
                          <div>
                            <p className="font-medium">
                              {veiculo.marca}{" "}
                              {veiculo.modelo}
                            </p>

                            <p className="text-muted-foreground mt-0.5 text-xs">
                              {veiculo.placa ||
                                "Não informada"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Veículo não encontrado
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {financiamento.banco}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium tabular-nums">
                          {moeda(
                            financiamento.valor_veiculo
                          )}
                        </div>

                        <div className="text-muted-foreground mt-0.5 text-xs">
                          entrada{" "}
                          {moeda(
                            financiamento.entrada
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium tabular-nums">
                          {moeda(
                            financiamento.valor_financiado
                          )}
                        </div>

                        <div className="text-muted-foreground mt-0.5 text-xs">
                          total{" "}
                          {moeda(
                            financiamento.valor_total_financiamento
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 tabular-nums">
                        {percentualTaxa(
                          financiamento.taxa_mensal
                        )}
                        % a.m.
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium tabular-nums">
                          {financiamento.parcelas}x
                        </div>

                        <div className="text-muted-foreground mt-0.5 text-xs">
                          de{" "}
                          {moeda(
                            financiamento.valor_parcela
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium tabular-nums">
                          {
                            financiamento.parcelas_pagas
                          }
                          /
                          {
                            financiamento.parcelas
                          }{" "}
                          pagas
                        </div>

                        <div className="text-muted-foreground mt-0.5 text-xs">
                          {progresso}% · saldo{" "}
                          {moeda(saldo)}
                        </div>
                      </td>

                      <td className="px-4 py-3 tabular-nums">
                        {dataBR(
                          financiamento.inicio
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {statusBadge(
                          financiamento.status
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setFinanciamentoSelecionadoId(financiamento.id)
                          }}
                          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium"
                        >
                          <Eye className="size-3.5" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  )
                }
              )}
            </tbody>
          </table>
        </div>

        {filtrados.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="font-medium">
              Nenhum financiamento encontrado
            </p>

            <p className="text-muted-foreground mt-1 text-sm">
              Altere os filtros ou faça uma nova busca.
            </p>
          </div>
        )}

        <div className="text-muted-foreground border-t px-4 py-3 text-xs">
          {filtrados.length} de{" "}
          {financiamentos.length}{" "}
          {financiamentos.length === 1
            ? "financiamento"
            : "financiamentos"}
        </div>
      </section>

      {financiamentoSelecionadoId !== null && (() => {
        const financiamento = financiamentos.find(
          (item) => item.id === financiamentoSelecionadoId
        )

        if (!financiamento) return null

        const cliente = store.obterCliente(financiamento.cliente_id)
        const veiculo = store.obterVeiculo(financiamento.veiculo_id)

        const parcelasRestantes = Math.max(
          financiamento.parcelas - financiamento.parcelas_pagas,
          0
        )

        const saldo = parcelasRestantes * financiamento.valor_parcela

        const progresso =
          financiamento.parcelas > 0
            ? Math.round(
                (financiamento.parcelas_pagas / financiamento.parcelas) * 100
              )
            : 0

        const vendaVinculada = vendas.find(
          (venda) => venda.financiamento_id === financiamento.id
        )

        const vendedorResponsavel =
          financiamento.vendedor ??
          vendaVinculada?.vendedor ??
          "Não informado"

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setFinanciamentoSelecionadoId(null)}
          >
            <div
              className="bg-card w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b px-6 py-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      Financiamento #{String(financiamento.id).padStart(4, "0")}
                    </h2>
                    {statusBadge(financiamento.status)}
                  </div>

                  <p className="text-muted-foreground mt-1 text-sm">
                    {financiamento.banco}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Fechar detalhes"
                  onClick={() => setFinanciamentoSelecionadoId(null)}
                  className="text-muted-foreground hover:text-foreground rounded-md p-1"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Cliente</p>
                  <p className="mt-1 font-medium">
                    {cliente?.nome ?? "Cliente não encontrado"}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">
                    Vendedor responsável
                  </p>
                  <p className="mt-1 font-medium">{vendedorResponsavel}</p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Banco</p>
                  <p className="mt-1 font-medium">{financiamento.banco}</p>
                </div>

                <div className="rounded-xl border p-4 sm:col-span-2 lg:col-span-3">
                  <p className="text-muted-foreground text-xs">Veículo vinculado</p>

                  {veiculo ? (
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="font-medium">
                        {veiculo.marca} {veiculo.modelo}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {veiculo.placa || "Sem placa informada"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground mt-1 text-sm">
                      Veículo não encontrado
                    </p>
                  )}
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Valor do veículo</p>
                  <p className="mt-1 text-lg font-semibold">
                    {moeda(financiamento.valor_veiculo)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Entrada</p>
                  <p className="mt-1 text-lg font-semibold">
                    {moeda(financiamento.entrada)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">
                    Principal financiado
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {moeda(financiamento.valor_financiado)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Taxa mensal</p>
                  <p className="mt-1 font-medium">
                    {percentualTaxa(financiamento.taxa_mensal)}% a.m.
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Parcelamento</p>
                  <p className="mt-1 font-medium">
                    {financiamento.parcelas}x de{" "}
                    {moeda(financiamento.valor_parcela)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">
                    Custo total do financiamento
                  </p>
                  <p className="mt-1 font-medium">
                    {moeda(financiamento.valor_total_financiamento)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Parcelas pagas</p>
                  <p className="mt-1 font-medium">
                    {financiamento.parcelas_pagas}/{financiamento.parcelas}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Progresso</p>
                  <p className="mt-1 font-medium">{progresso}%</p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Saldo em parcelas</p>
                  <p className="mt-1 font-medium">{moeda(saldo)}</p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Primeira parcela</p>
                  <p className="mt-1 font-medium">{dataBR(financiamento.inicio)}</p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Status</p>
                  <div className="mt-2">{statusBadge(financiamento.status)}</div>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Parcelas restantes</p>
                  <p className="mt-1 font-medium">{parcelasRestantes}</p>
                </div>
              </div>

              <div className="flex justify-end border-t px-6 py-4">
                <button
                  type="button"
                  onClick={() => setFinanciamentoSelecionadoId(null)}
                  className="bg-secondary hover:bg-secondary/80 rounded-md px-4 py-2 text-sm font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
