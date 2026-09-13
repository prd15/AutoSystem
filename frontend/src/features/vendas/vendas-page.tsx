import { useMemo, useState } from "react"
import {
  CalendarRange,
  Eye,
  MoreHorizontal,
  Receipt,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react"

import { useApp } from "@/app-context"
import { useAuth } from "@/auth-context"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { Segmented } from "@/components/segmented"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { VeiculoTile } from "@/components/veiculo-tile"
import {
  store,
  useEstado,
  type Venda,
} from "@/data/store"
import {
  dataBR,
  hojeISO,
  iniciais,
  moeda,
  moedaCurta,
} from "@/lib/format"
import { cn } from "@/lib/utils"

import { VendaDetalhesSheet } from "./venda-detalhes-sheet"

type Periodo = "mes" | "30" | "90" | "tudo" | "personalizado"

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

function intervalo(
  p: Periodo,
  de: string,
  ate: string
): { de: string | null; ate: string | null } {
  const hoje = new Date()

  switch (p) {
    case "mes":
      return {
        de: iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
        ate: null,
      }

    case "30": {
      const d = new Date()
      d.setDate(d.getDate() - 30)

      return {
        de: iso(d),
        ate: null,
      }
    }

    case "90": {
      const d = new Date()
      d.setDate(d.getDate() - 90)

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

export function VendasPage() {
  const estado = useEstado()
  const { usuario } = useAuth()
  const vendedor = usuario?.perfil === "vendedor"

  const {
    setVenda,
    setVendaVeiculoId,
  } = useApp()

  const [periodo, setPeriodo] = useState<Periodo>("mes")
  const [de, setDe] = useState("")
  const [ate, setAte] = useState(hojeISO())
  const [visualizando, setVisualizando] = useState<Venda | null>(null)

  const faixa = useMemo(
    () => intervalo(periodo, de, ate),
    [periodo, de, ate]
  )

  const vendas = useMemo(() => {
    const vendasDoPeriodo = store.listarVendas(faixa)

    if (!vendedor) return vendasDoPeriodo

    const nomeUsuario = usuario?.nome.trim().toLocaleLowerCase("pt-BR") ?? ""

    return vendasDoPeriodo.filter(
      (venda) =>
        venda.vendedor.trim().toLocaleLowerCase("pt-BR") === nomeUsuario
    )
  }, [faixa, estado, vendedor, usuario?.nome])

  const todas = useMemo(() => {
    const lista = store.listarVendas()

    if (!vendedor) return lista

    const nomeUsuario = usuario?.nome.trim().toLocaleLowerCase("pt-BR") ?? ""

    return lista.filter(
      (venda) =>
        venda.vendedor.trim().toLocaleLowerCase("pt-BR") === nomeUsuario
    )
  }, [estado, vendedor, usuario?.nome])

  const faturamento = vendas.reduce(
    (s, v) => s + v.valor_venda,
    0
  )

  const ticket = vendas.length
    ? faturamento / vendas.length
    : 0

  const descontoTotal = vendas.reduce((s, v) => {
    const veic = store.obterVeiculo(v.veiculo_id)

    return s + (veic ? veic.preco - v.valor_venda : 0)
  }, 0)

  const porVendedor = useMemo(() => {
    const m = new Map<
      string,
      {
        n: number
        total: number
      }
    >()

    for (const v of vendas) {
      const item = m.get(v.vendedor) ?? {
        n: 0,
        total: 0,
      }

      item.n += 1
      item.total += v.valor_venda

      m.set(v.vendedor, item)
    }

    return [...m.entries()].sort(
      (a, b) => b[1].total - a[1].total
    )
  }, [vendas])

  const melhor = porVendedor[0]

  const rotuloPeriodo =
    periodo === "mes"
      ? "neste mês"
      : periodo === "30"
        ? "nos últimos 30 dias"
        : periodo === "90"
          ? "nos últimos 90 dias"
          : periodo === "tudo"
            ? "no total"
            : "no período"

  return (
    <div className="space-y-5">
      {/* Período */}
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          aria-label="Período"
          valor={periodo}
          onChange={setPeriodo}
          opcoes={[
            {
              valor: "mes",
              rotulo: "Este mês",
            },
            {
              valor: "30",
              rotulo: "30 dias",
            },
            {
              valor: "90",
              rotulo: "90 dias",
            },
            {
              valor: "tudo",
              rotulo: "Tudo",
            },
            {
              valor: "personalizado",
              rotulo: "Período",
              icone: CalendarRange,
            },
          ]}
        />

        {periodo === "personalizado" && (
          <div className="flex items-center gap-2">
            <Label
              htmlFor="de"
              className="text-muted-foreground text-[12px]"
            >
              de
            </Label>

            <Input
              id="de"
              type="date"
              value={de}
              max={ate || hojeISO()}
              onChange={(e) => setDe(e.target.value)}
              className="bg-card tabular h-8 w-36 text-[13px]"
            />

            <Label
              htmlFor="ate"
              className="text-muted-foreground text-[12px]"
            >
              até
            </Label>

            <Input
              id="ate"
              type="date"
              value={ate}
              min={de}
              max={hojeISO()}
              onChange={(e) => setAte(e.target.value)}
              className="bg-card tabular h-8 w-36 text-[13px]"
            />
          </div>
        )}

        <p className="text-muted-foreground ml-auto text-[12.5px]">
          <span className="tabular text-foreground font-medium">
            {vendas.length}
          </span>{" "}
          {vendas.length === 1 ? "venda" : "vendas"}{" "}
          {rotuloPeriodo}

          {periodo !== "tudo" && (
            <>
              {" "}
              ·{" "}
              <span className="tabular">
                {todas.length}
              </span>{" "}
              no total
            </>
          )}
        </p>
      </div>

      {/* Indicadores do período */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          rotulo={vendedor ? `Minhas vendas ${rotuloPeriodo}` : `Vendas ${rotuloPeriodo}`}
          valor={vendas.length}
          icone={Receipt}
          tom="primary"
          detalhe={
            vendedor
              ? vendas.length > 0
                ? "Vendas vinculadas ao seu usuário"
                : "Nenhuma venda sua no período"
              : melhor
                ? `${porVendedor.length} ${
                    porVendedor.length === 1 ? "vendedor" : "vendedores"
                  } ativos`
                : "Nenhuma venda no período"
          }
        />

        <KpiCard
          rotulo={vendedor ? "Meu faturamento" : "Faturamento"}
          valor={moedaCurta(faturamento)}
          icone={Wallet}
          tom="success"
          detalhe={
            descontoTotal > 0
              ? `${moedaCurta(descontoTotal)} concedidos em desconto`
              : descontoTotal < 0
                ? `${moedaCurta(-descontoTotal)} acima da tabela`
                : "Sem negociação sobre a tabela"
          }
        />

        <KpiCard
          rotulo={vendedor ? "Meu ticket médio" : "Ticket médio"}
          valor={ticket ? moedaCurta(ticket) : "—"}
          icone={TrendingUp}
          tom="neutral"
          detalhe="Valor médio por venda"
        />

        <KpiCard
          rotulo={vendedor ? "Meu total histórico" : "Destaque"}
          valor={
            vendedor
              ? todas.length
              : melhor
                ? melhor[0].split(" ")[0]
                : "—"
          }
          icone={Trophy}
          tom="warning"
          detalhe={
            vendedor
              ? todas.length > 0
                ? `${todas.length} ${
                    todas.length === 1 ? "venda" : "vendas"
                  } · ${moedaCurta(
                    todas.reduce((total, venda) => total + venda.valor_venda, 0)
                  )}`
                : "Nenhuma venda registrada"
              : melhor
                ? `${melhor[1].n} ${
                    melhor[1].n === 1 ? "venda" : "vendas"
                  } · ${moedaCurta(melhor[1].total)}`
                : "Sem vendas no período"
          }
        />
      </div>

      {/* Histórico */}
      {vendas.length === 0 ? (
        <div className="bg-card shadow-card rounded-xl">
          <EmptyState
            icone={Receipt}
            titulo={vendedor ? "Nenhuma venda sua neste período" : "Nenhuma venda neste período"}
            descricao={
              vendedor
                ? "Amplie o período ou registre uma nova venda."
                : "Amplie o período ou registre a primeira venda."
            }
            acao={
              <Button
                size="sm"
                onClick={() => {
                  setVendaVeiculoId(null)
                  setVenda(true)
                }}
              >
                <Receipt className="size-4" />
                Registrar venda
              </Button>
            }
          />
        </div>
      ) : (
        <div className="bg-card shadow-card overflow-hidden rounded-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-[14px] font-semibold tracking-[-0.01em]">
              {vendedor ? "Meu histórico de vendas" : "Histórico de vendas"}
            </h2>

            <p className="text-muted-foreground text-[12px]">
              Da mais recente para a mais antiga
            </p>
          </div>

          <div className="scroll-mac overflow-x-auto border-t">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 dark:bg-white/3 [&>th]:text-muted-foreground [&>th]:h-10 [&>th]:text-[12px] [&>th]:font-medium">
                  <TableHead className="pl-4">
                    Data
                  </TableHead>

                  <TableHead>
                    Veículo
                  </TableHead>

                  <TableHead>
                    Cliente
                  </TableHead>

                  <TableHead>
                    Vendedor
                  </TableHead>

                  <TableHead className="text-right">
                    Tabela
                  </TableHead>

                  <TableHead className="text-right">
                    Valor da venda
                  </TableHead>

                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {vendas.map((v) => {
                  const veic = store.obterVeiculo(v.veiculo_id)
                  const cli = store.obterCliente(v.cliente_id)

                  const dif = veic
                    ? v.valor_venda - veic.preco
                    : 0

                  return (
                    <TableRow
                      key={v.id}
                      className="group"
                      onDoubleClick={() => setVisualizando(v)}
                    >
                      <TableCell className="tabular py-2.5 pl-4">
                        {dataBR(v.data_venda)}
                      </TableCell>

                      <TableCell>
                        {veic ? (
                          <div className="flex items-center gap-2.5">
                            <VeiculoTile
                              marca={veic.marca}
                              cor={veic.cor}
                              size="sm"
                            />

                            <div className="min-w-0 leading-tight">
                              <p className="truncate font-medium">
                                {veic.marca} {veic.modelo}
                              </p>

                              <p className="text-muted-foreground tabular text-[11.5px]">
                                {veic.ano} ·{" "}
                                {veic.placa || "sem placa"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Veículo removido
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {cli ? (
                          <span className="flex items-center gap-2">
                            <span className="bg-secondary flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                              {iniciais(cli.nome)}
                            </span>

                            <span className="truncate">
                              {cli.nome}
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      <TableCell>
                        {v.vendedor}
                      </TableCell>

                      <TableCell className="tabular text-muted-foreground text-right">
                        {veic
                          ? moeda(veic.preco)
                          : "—"}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex flex-col items-end leading-tight">
                          <span className="tabular font-medium">
                            {moeda(v.valor_venda)}
                          </span>

                          {dif !== 0 && (
                            <span
                              className={cn(
                                "tabular text-[11px]",
                                dif < 0
                                  ? "text-warning-foreground"
                                  : "text-success-foreground"
                              )}
                            >
                              {dif < 0 ? "−" : "+"}
                              {moedaCurta(Math.abs(dif))}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="pr-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Ações da venda"
                              className="text-muted-foreground"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="glass shadow-pop min-w-44"
                          >
                            <DropdownMenuItem
                              onClick={() => setVisualizando(v)}
                            >
                              <Eye />
                              Visualizar detalhes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="text-muted-foreground flex items-center justify-between border-t px-4 py-2.5 text-[12.5px]">
            <span>
              {vendas.length}{" "}
              {vendas.length === 1
                ? "venda"
                : "vendas"}
            </span>

            <span>
              Total{" "}
              <span className="tabular text-foreground font-semibold">
                {moeda(faturamento)}
              </span>
            </span>
          </div>
        </div>
      )}

      <VendaDetalhesSheet
        aberto={visualizando !== null}
        onOpenChange={(aberto) => {
          if (!aberto) {
            setVisualizando(null)
          }
        }}
        venda={visualizando}
      />
    </div>
  )
}