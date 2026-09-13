import {
  BadgeCheck,
  CircleDollarSign,
  FileText,
  Search,
  Users,
  Eye,
  X,
} from "lucide-react"
import { useMemo, useState } from "react"

import { useAuth } from "@/auth-context"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  GRUPOS_CONSORCIO,
  ROTULO_TIPO_LANCE,
  store,
  useEstado,
  type StatusConsorcio,
} from "@/data/store"

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function dataBR(data: string) {
  if (!data) return "—"

  const [ano, mes, dia] = data.split("-")

  return `${dia}/${mes}/${ano}`
}

function statusBadge(
  status: StatusConsorcio
) {
  switch (status) {
    case "ativo":
      return (
        <Badge variant="secondary">
          Ativo
        </Badge>
      )

    case "contemplado":
      return (
        <Badge>
          Contemplado
        </Badge>
      )

    case "em_analise":
      return (
        <Badge variant="outline">
          Em análise
        </Badge>
      )

    case "cancelado":
      return (
        <Badge variant="destructive">
          Cancelado
        </Badge>
      )

    case "encerrado":
      return (
        <Badge variant="outline">
          Encerrado
        </Badge>
      )

    default:
      return null
  }
}

export function ConsorciosPage() {
  useEstado()
  const { usuario } = useAuth()
  const vendedor = usuario?.perfil === "vendedor"

  const [busca, setBusca] =
    useState("")

  const [status, setStatus] =
    useState<
      StatusConsorcio | "todos"
    >("todos")

  const [consorcioSelecionadoId, setConsorcioSelecionadoId] =
    useState<number | null>(null)

  const todosConsorcios = store.consorcios()

  const consorcios = useMemo(() => {
    if (!vendedor) {
      return todosConsorcios
    }

    const nomeUsuario =
      usuario?.nome.trim().toLocaleLowerCase("pt-BR") ?? ""

    return todosConsorcios.filter(
      (consorcio) =>
        consorcio.vendedor.trim().toLocaleLowerCase("pt-BR") === nomeUsuario
    )
  }, [todosConsorcios, vendedor, usuario?.nome])

  const filtrados = useMemo(() => {
    const termo =
      busca.trim().toLowerCase()

    return consorcios.filter(
      (consorcio) => {
        const cliente =
          store.obterCliente(
            consorcio.cliente_id
          )

        const texto = [
          consorcio.numero_cota,
          cliente?.nome ?? "",
          consorcio.vendedor,
          consorcio.administradora,
          consorcio.grupo,
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
          consorcio.status !== status
        ) {
          return false
        }

        return true
      }
    )
  }, [
    busca,
    status,
    consorcios,
  ])

  const ativos =
    consorcios.filter(
      (c) => c.status === "ativo"
    ).length

  const contemplados =
    consorcios.filter(
      (c) =>
        c.status === "contemplado"
    ).length

  const valorCartas =
    consorcios.reduce(
      (total, consorcio) =>
        total +
        consorcio.valor_carta,
      0
    )

  const valorPlanos =
    consorcios.reduce(
      (total, consorcio) =>
        total +
        (consorcio.valor_total_plano ??
          consorcio.valor_parcela *
            consorcio.parcelas),
      0
    )

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {vendedor ? "Meus consórcios" : "Consórcios"}
            </p>

            <FileText className="text-muted-foreground size-4" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {consorcios.length}
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

            <Users className="text-muted-foreground size-4" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {ativos}
          </p>

          <p className="text-muted-foreground mt-1 text-xs">
            cotas em andamento
          </p>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {vendedor ? "Meus contemplados" : "Contemplados"}
            </p>

            <BadgeCheck className="text-muted-foreground size-4" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {contemplados}
          </p>

          <p className="text-muted-foreground mt-1 text-xs">
            cartas contempladas
          </p>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {vendedor ? "Valor dos meus planos" : "Valor dos planos"}
            </p>

            <CircleDollarSign className="text-muted-foreground size-4" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {moeda(valorPlanos)}
          </p>

          <p className="text-muted-foreground mt-1 text-xs">
            {moeda(valorCartas)} em cartas de crédito
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
                setBusca(
                  event.target.value
                )
              }
              placeholder="Buscar por cliente, cota, vendedor, grupo..."
              className="pl-9"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target
                  .value as
                  | StatusConsorcio
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

            <option value="ativo">
              Ativo
            </option>

            <option value="contemplado">
              Contemplado
            </option>

            <option value="cancelado">
              Cancelado
            </option>

            <option value="encerrado">
              Encerrado
            </option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-sm">
            <thead>
              <tr className="bg-muted/40 border-b text-left">
                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Cota
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Cliente
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Vendedor
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Grupo
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Carta
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Taxas
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Plano
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Lance
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Status
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Adesão
                </th>

                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Veículo
                </th>

                <th className="text-muted-foreground px-4 py-3 text-right font-medium">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map(
                (consorcio) => {
                  const cliente =
                    store.obterCliente(
                      consorcio.cliente_id
                    )

                  const veiculo =
                    consorcio.veiculo_id !==
                    null
                      ? store.obterVeiculo(
                          consorcio.veiculo_id
                        )
                      : null

                  const grupo =
                    GRUPOS_CONSORCIO.find(
                      (item) =>
                        item.codigo ===
                        consorcio.grupo
                    )

                  const taxaAdministracao =
                    consorcio.taxa_administracao ??
                    grupo?.taxa_administracao ??
                    0

                  const fundoReserva =
                    consorcio.fundo_reserva ??
                    grupo?.fundo_reserva ??
                    0

                  const seguro =
                    consorcio.seguro ??
                    grupo?.seguro ??
                    0

                  const valorTotalPlano =
                    consorcio.valor_total_plano ??
                    consorcio.valor_parcela *
                      consorcio.parcelas

                  return (
                    <tr
                      key={
                        consorcio.id
                      }
                      onClick={() => setConsorcioSelecionadoId(consorcio.id)}
                      className="hover:bg-muted/30 cursor-pointer border-b last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold tabular-nums">
                          #
                          {
                            consorcio.numero_cota
                          }
                        </div>

                        <div className="text-muted-foreground mt-0.5 text-xs">
                          {
                            consorcio.administradora
                          }
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {cliente?.nome ??
                          "Cliente não encontrado"}
                      </td>

                      <td className="px-4 py-3">
                        {
                          consorcio.vendedor
                        }
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {consorcio.grupo}
                        </div>

                        {grupo && (
                          <div className="text-muted-foreground mt-0.5 max-w-40 text-xs">
                            {grupo.descricao}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium tabular-nums">
                          {moeda(
                            consorcio.valor_carta
                          )}
                        </div>

                        <div className="text-muted-foreground mt-0.5 text-xs">
                          crédito contratado
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-xs">
                          Adm.{" "}
                          {taxaAdministracao.toLocaleString(
                            "pt-BR",
                            {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 2,
                            }
                          )}
                          %
                        </div>

                        <div className="text-muted-foreground mt-0.5 text-xs">
                          Reserva{" "}
                          {fundoReserva.toLocaleString(
                            "pt-BR",
                            {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 2,
                            }
                          )}
                          %
                        </div>

                        {seguro > 0 && (
                          <div className="text-muted-foreground mt-0.5 text-xs">
                            Seguro{" "}
                            {seguro.toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 2,
                              }
                            )}
                            %
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium tabular-nums">
                          {moeda(valorTotalPlano)}
                        </div>

                        <div className="text-muted-foreground mt-0.5 text-xs">
                          {consorcio.parcelas}x de{" "}
                          {moeda(
                            consorcio.valor_parcela
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div>
                          {
                            ROTULO_TIPO_LANCE[
                              consorcio
                                .tipo_lance
                            ]
                          }
                        </div>

                        {consorcio.valor_lance !==
                          null && (
                          <div className="text-muted-foreground text-xs">
                            {moeda(
                              consorcio.valor_lance
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {statusBadge(
                          consorcio.status
                        )}
                      </td>

                      <td className="px-4 py-3 tabular-nums">
                        {dataBR(
                          consorcio.data_adesao
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {veiculo ? (
                          <div>
                            <p className="font-medium">
                              {
                                veiculo.marca
                              }{" "}
                              {
                                veiculo.modelo
                              }
                            </p>

                            <p className="text-muted-foreground text-xs">
                              {veiculo.placa ||
                                "Sem placa"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setConsorcioSelecionadoId(consorcio.id)
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
              Nenhum consórcio encontrado
            </p>

            <p className="text-muted-foreground mt-1 text-sm">
              Altere os filtros ou faça uma nova busca.
            </p>
          </div>
        )}

        <div className="text-muted-foreground border-t px-4 py-3 text-xs">
          {filtrados.length} de{" "}
          {consorcios.length}{" "}
          {consorcios.length === 1
            ? "consórcio"
            : "consórcios"}
        </div>
      </section>

      {consorcioSelecionadoId !== null && (() => {
        const consorcio = consorcios.find((item) => item.id === consorcioSelecionadoId)
        if (!consorcio) return null

        const cliente = store.obterCliente(consorcio.cliente_id)
        const veiculo = consorcio.veiculo_id !== null
          ? store.obterVeiculo(consorcio.veiculo_id)
          : null
        const grupo = GRUPOS_CONSORCIO.find((item) => item.codigo === consorcio.grupo)
        const taxaAdministracao = consorcio.taxa_administracao ?? grupo?.taxa_administracao ?? 0
        const fundoReserva = consorcio.fundo_reserva ?? grupo?.fundo_reserva ?? 0
        const seguro = consorcio.seguro ?? grupo?.seguro ?? 0
        const valorTotalPlano = consorcio.valor_total_plano ??
          consorcio.valor_parcela * consorcio.parcelas

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setConsorcioSelecionadoId(null)}
          >
            <div
              className="bg-card w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b px-6 py-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Consórcio #{consorcio.numero_cota}</h2>
                    {statusBadge(consorcio.status)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {consorcio.administradora} · Grupo {consorcio.grupo}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Fechar detalhes"
                  onClick={() => setConsorcioSelecionadoId(null)}
                  className="text-muted-foreground hover:text-foreground rounded-md p-1"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-6 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Cliente</p>
                  <p className="mt-1 font-medium">{cliente?.nome ?? "Cliente não encontrado"}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Vendedor responsável</p>
                  <p className="mt-1 font-medium">{consorcio.vendedor}</p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Carta de crédito</p>
                  <p className="mt-1 text-lg font-semibold">{moeda(consorcio.valor_carta)}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Valor total do plano</p>
                  <p className="mt-1 text-lg font-semibold">{moeda(valorTotalPlano)}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {consorcio.parcelas}x de {moeda(consorcio.valor_parcela)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Taxas do plano</p>
                  <p className="mt-1 text-sm">Administração: {taxaAdministracao.toLocaleString("pt-BR")}%</p>
                  <p className="text-muted-foreground mt-1 text-sm">Fundo de reserva: {fundoReserva.toLocaleString("pt-BR")}%</p>
                  {seguro > 0 && (
                    <p className="text-muted-foreground mt-1 text-sm">Seguro: {seguro.toLocaleString("pt-BR")}%</p>
                  )}
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Lance</p>
                  <p className="mt-1 font-medium">{ROTULO_TIPO_LANCE[consorcio.tipo_lance]}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {consorcio.valor_lance !== null ? moeda(consorcio.valor_lance) : "Sem valor de lance"}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Data de adesão</p>
                  <p className="mt-1 font-medium">{dataBR(consorcio.data_adesao)}</p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Veículo vinculado</p>
                  {veiculo ? (
                    <>
                      <p className="mt-1 font-medium">{veiculo.marca} {veiculo.modelo}</p>
                      <p className="text-muted-foreground mt-1 text-sm">{veiculo.placa || "Sem placa"}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground mt-1 text-sm">Nenhum veículo vinculado</p>
                  )}
                </div>

                {consorcio.status === "contemplado" && (
                  <div className="border-primary/30 bg-primary/5 rounded-xl border p-4 sm:col-span-2">
                    <div className="flex items-start gap-3">
                      <BadgeCheck className="text-primary mt-0.5 size-5 shrink-0" />
                      <div>
                        <p className="font-medium">Carta contemplada</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {veiculo
                            ? `Esta cota já está vinculada ao veículo ${veiculo.marca} ${veiculo.modelo}${veiculo.placa ? ` (${veiculo.placa})` : ""}.`
                            : "Esta cota está contemplada e disponível para vinculação conforme as regras da venda."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t px-6 py-4">
                <button
                  type="button"
                  onClick={() => setConsorcioSelecionadoId(null)}
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