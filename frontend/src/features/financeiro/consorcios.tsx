import {
  CircleDollarSign,
  Handshake,
  Landmark,
  ReceiptText,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  store,
  useEstado,
  type StatusConsorcio,
} from "@/data/store"
import {
  dataBR,
  moeda,
} from "@/lib/format"

const ROTULO_STATUS: Record<
  StatusConsorcio,
  string
> = {
  em_analise: "Em análise",
  ativo: "Ativo",
  contemplado: "Contemplado",
  cancelado: "Cancelado",
  encerrado: "Encerrado",
}

function statusVariant(
  status: StatusConsorcio
) {
  if (status === "ativo") {
    return "default"
  }

  if (
    status === "contemplado"
  ) {
    return "secondary"
  }

  if (
    status === "encerrado"
  ) {
    return "outline"
  }

  if (
    status === "cancelado"
  ) {
    return "destructive"
  }

  return "outline"
}

export function Consorcios() {
  useEstado()

  const consorcios =
    store.consorcios()

  const totalCartas =
    consorcios.reduce(
      (soma, item) =>
        soma +
        item.valor_carta,
      0
    )

  const totalPlanos =
    consorcios.reduce(
      (soma, item) =>
        soma +
        (item.valor_total_plano ??
          item.valor_parcela *
            item.parcelas),
      0
    )

  const compromissoMensal =
    consorcios
      .filter(
        (item) =>
          item.status ===
            "ativo" ||
          item.status ===
            "contemplado"
      )
      .reduce(
        (soma, item) =>
          soma +
          item.valor_parcela,
        0
      )

  const ativos =
    consorcios.filter(
      (item) =>
        item.status ===
        "ativo"
    ).length

  const contemplados =
    consorcios.filter(
      (item) =>
        item.status ===
        "contemplado"
    ).length

  const encerrados =
    consorcios.filter(
      (item) =>
        item.status ===
        "encerrado"
    ).length

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-[12px] font-medium">
                Cartas de crédito
              </p>

              <p className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                {moeda(
                  totalCartas
                )}
              </p>

              <p className="text-muted-foreground mt-1 text-[11px]">
                {consorcios.length}{" "}
                {consorcios.length ===
                1
                  ? "cota cadastrada"
                  : "cotas cadastradas"}
              </p>
            </div>

            <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
              <Handshake className="text-muted-foreground size-4" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-[12px] font-medium">
                Valor dos planos
              </p>

              <p className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                {moeda(
                  totalPlanos
                )}
              </p>

              <p className="text-muted-foreground mt-1 text-[11px]">
                Inclui taxas e
                custos previstos
              </p>
            </div>

            <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
              <ReceiptText className="text-muted-foreground size-4" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-[12px] font-medium">
                Compromisso mensal
              </p>

              <p className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                {moeda(
                  compromissoMensal
                )}
              </p>

              <p className="text-muted-foreground mt-1 text-[11px]">
                Cotas ativas e
                contempladas
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
                Situação das cotas
              </p>

              <p className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                {ativos} ativas
              </p>

              <p className="text-muted-foreground mt-1 text-[11px]">
                {
                  contemplados
                }{" "}
                contempladas ·{" "}
                {encerrados}{" "}
                encerradas
              </p>
            </div>

            <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
              <Landmark className="text-muted-foreground size-4" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b px-4 py-3">
          <div>
            <h2 className="text-[14px] font-semibold">
              Visão financeira dos
              consórcios
            </h2>

            <p className="text-muted-foreground mt-0.5 text-[12px]">
              Cartas de crédito,
              parcelas e situação
              das cotas cadastradas
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-[13px]">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">
                  Cota
                </th>

                <th className="px-4 py-2.5 font-medium">
                  Cliente
                </th>

                <th className="px-4 py-2.5 font-medium">
                  Administradora
                </th>

                <th className="px-4 py-2.5 font-medium">
                  Grupo
                </th>

                <th className="px-4 py-2.5 text-right font-medium">
                  Carta
                </th>

                <th className="px-4 py-2.5 text-right font-medium">
                  Plano
                </th>

                <th className="px-4 py-2.5 text-right font-medium">
                  Parcela
                </th>

                <th className="px-4 py-2.5 font-medium">
                  Parcelamento
                </th>

                <th className="px-4 py-2.5 font-medium">
                  Adesão
                </th>

                <th className="px-4 py-2.5 font-medium">
                  Veículo
                </th>

                <th className="px-4 py-2.5 font-medium">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {consorcios.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="text-muted-foreground px-4 py-10 text-center"
                  >
                    Nenhum
                    consórcio
                    cadastrado.
                  </td>
                </tr>
              ) : (
                consorcios.map(
                  (item) => {
                    const cliente =
                      store.obterCliente(
                        item.cliente_id
                      )

                    const veiculo =
                      item.veiculo_id
                        ? store.obterVeiculo(
                            item.veiculo_id
                          )
                        : null

                    const totalPlano =
                      item.valor_total_plano ??
                      item.valor_parcela *
                        item.parcelas

                    return (
                      <tr
                        key={
                          item.id
                        }
                        className="border-t"
                      >
                        <td className="px-4 py-3 font-medium">
                          #
                          {
                            item.numero_cota
                          }
                        </td>

                        <td className="px-4 py-3">
                          <div className="max-w-[220px]">
                            <p className="truncate font-medium">
                              {cliente?.nome ??
                                "Cliente não encontrado"}
                            </p>

                            <p className="text-muted-foreground truncate text-[11px]">
                              {
                                item.vendedor
                              }
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {
                            item.administradora
                          }
                        </td>

                        <td className="px-4 py-3">
                          {
                            item.grupo
                          }
                        </td>

                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {moeda(
                            item.valor_carta
                          )}
                        </td>

                        <td className="px-4 py-3 text-right tabular-nums">
                          {moeda(
                            totalPlano
                          )}
                        </td>

                        <td className="px-4 py-3 text-right tabular-nums">
                          {moeda(
                            item.valor_parcela
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {
                            item.parcelas
                          }
                          x
                        </td>

                        <td className="px-4 py-3">
                          {dataBR(
                            item.data_adesao
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {veiculo ? (
                            <div className="max-w-[220px]">
                              <p className="truncate font-medium">
                                {
                                  veiculo.marca
                                }{" "}
                                {
                                  veiculo.modelo
                                }
                              </p>

                              <p className="text-muted-foreground truncate text-[11px]">
                                {veiculo.placa ||
                                  "Sem placa"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Não vinculado
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            variant={statusVariant(
                              item.status
                            )}
                          >
                            {
                              ROTULO_STATUS[
                                item.status
                              ]
                            }
                          </Badge>
                        </td>
                      </tr>
                    )
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}