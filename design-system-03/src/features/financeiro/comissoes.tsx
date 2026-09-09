import { BadgePercent, CircleCheck, HandCoins, Hourglass, Trophy } from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { VeiculoTile } from "@/components/veiculo-tile"
import { COMISSAO_PERCENTUAL, ROTULO_FORMA, store, type FormaPagamento } from "@/data/store"
import { percentual } from "@/lib/financeiro"
import { dataBR, iniciais, moeda, moedaCompacta, moedaCurta } from "@/lib/format"
import { cn } from "@/lib/utils"

import { LancamentoStatusBadge } from "./lancamento-status"

type Faixa = { de: string | null; ate: string | null }
const FORMAS: FormaPagamento[] = ["pix", "transferencia", "dinheiro"]

export function Comissoes({ faixa, rotuloPeriodo }: { faixa: Faixa; rotuloPeriodo: string }) {
  const porVendedor = store.comissoes(faixa)
  const gerada = porVendedor.reduce((s, v) => s + v.gerada, 0)
  const paga = porVendedor.reduce((s, v) => s + v.paga, 0)
  const pendente = porVendedor.reduce((s, v) => s + v.pendente, 0)
  const pendentes = store.listarLancamentos({ categoria: "comissao", status: "pendente" })
  const melhor = porVendedor[0]

  const pagar = (vendedor: string, forma: FormaPagamento) => {
    const total = store.pagarComissoes(vendedor, forma)
    toast.success("Comissão paga", { description: `${vendedor} · ${moeda(total)} via ${ROTULO_FORMA[forma]}` })
  }

  const quitarUma = (id: number, descricao: string, forma: FormaPagamento) => {
    store.quitarLancamento(id, forma)
    toast.success("Comissão paga", { description: `${descricao} via ${ROTULO_FORMA[forma]}` })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard rotulo={`Comissão gerada ${rotuloPeriodo}`} valor={moedaCompacta(gerada)} icone={HandCoins} tom="primary" detalhe={`${porVendedor.reduce((s, v) => s + v.vendas, 0)} vendas comissionadas`} />
        <KpiCard rotulo="Já paga" valor={moedaCompacta(paga)} icone={CircleCheck} tom="success" detalhe={gerada ? `${Math.round((paga / gerada) * 100)}% do gerado` : "—"} />
        <KpiCard rotulo="A pagar" valor={moedaCompacta(pendente)} icone={Hourglass} tom={pendente > 0 ? "warning" : "neutral"} chip={pendentes.length > 0 ? { texto: `${pendentes.length} ${pendentes.length === 1 ? "pendente" : "pendentes"}`, tom: "warning" } : undefined} detalhe="Comissões ainda não liquidadas" />
        <KpiCard rotulo="Regra vigente" valor={percentual(COMISSAO_PERCENTUAL)} icone={BadgePercent} tom="neutral" detalhe="Sobre o valor negociado da venda" />
      </div>

      <div className="grid gap-3 xl:grid-cols-5">
        {/* Por vendedor */}
        <section className="bg-card shadow-card overflow-hidden rounded-xl xl:col-span-3">
          <header className="flex items-center justify-between px-4 py-3">
            <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Por vendedor</h2>
            {melhor && (
              <span className="text-muted-foreground flex items-center gap-1.5 text-[12px]">
                <Trophy className="text-warning-solid size-3.5" />
                {melhor.vendedor} lidera com {moedaCurta(melhor.faturamento)}
              </span>
            )}
          </header>
          {porVendedor.length === 0 ? (
            <div className="border-t">
              <EmptyState icone={HandCoins} titulo="Nenhuma comissão no período" descricao="As comissões nascem automaticamente ao registrar uma venda." />
            </div>
          ) : (
            <div className="scroll-mac overflow-x-auto border-t">
              <Table className="text-[13px]">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40 dark:bg-white/3 [&>th]:text-muted-foreground [&>th]:h-10 [&>th]:text-[12px] [&>th]:font-medium">
                    <TableHead className="pl-4">Vendedor</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead className="text-right">Pendente</TableHead>
                    <TableHead className="w-28 pr-4 text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {porVendedor.map((v) => (
                    <TableRow key={v.vendedor}>
                      <TableCell className="py-2.5 pl-4">
                        <div className="flex items-center gap-2.5">
                          <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full text-[11px] font-semibold">
                            {iniciais(v.vendedor)}
                          </span>
                          <div className="leading-tight">
                            <p className="font-medium">{v.vendedor}</p>
                            <p className="text-muted-foreground text-[11.5px]">
                              {v.pendente === 0 ? "Em dia" : `${v.itens.filter((i) => i.status === "pendente").length} a liquidar`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="tabular text-right">{v.vendas}</TableCell>
                      <TableCell className="tabular text-right">{moeda(v.faturamento)}</TableCell>
                      <TableCell className="tabular text-right font-medium">{moeda(v.gerada)}</TableCell>
                      <TableCell className={cn("tabular text-right", v.pendente > 0 ? "text-warning-foreground font-medium" : "text-muted-foreground")}>
                        {v.pendente > 0 ? moeda(v.pendente) : "—"}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        {v.pendente > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="h-7">
                                Pagar
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass shadow-pop min-w-44">
                              <DropdownMenuLabel className="text-muted-foreground text-[11.5px]">
                                {moeda(v.pendente)} para {v.vendedor.split(" ")[0]}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {FORMAS.map((f) => (
                                <DropdownMenuItem key={f} onClick={() => pagar(v.vendedor, f)}>
                                  {ROTULO_FORMA[f]}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Pendentes */}
        <section className="bg-card shadow-card flex flex-col overflow-hidden rounded-xl xl:col-span-2">
          <header className="flex items-center justify-between px-4 py-3">
            <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Aguardando pagamento</h2>
            <span className="tabular text-muted-foreground text-[12px]">{moedaCurta(pendente)}</span>
          </header>
          {pendentes.length === 0 ? (
            <p className="text-muted-foreground border-t px-4 py-8 text-center text-[13px]">Todas as comissões estão pagas.</p>
          ) : (
            <ul className="divide-y border-t">
              {pendentes.map((l) => {
                const veic = l.veiculo_id !== null ? store.obterVeiculo(l.veiculo_id) : null
                return (
                  <li key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                    {veic && <VeiculoTile marca={veic.marca} cor={veic.cor} size="sm" />}
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-[13px] font-medium">{l.vendedor}</p>
                      <p className="text-muted-foreground truncate text-[12px]">
                        {veic ? `${veic.marca} ${veic.modelo}` : l.descricao} · venda em {dataBR(l.data)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="tabular text-[13px] font-semibold">{moeda(l.valor)}</span>
                      <LancamentoStatusBadge l={l} />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-sm" variant="ghost" aria-label="Pagar comissão" className="text-muted-foreground">
                          <CircleCheck className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass shadow-pop">
                        {FORMAS.map((f) => (
                          <DropdownMenuItem key={f} onClick={() => quitarUma(l.id, `${l.vendedor} · ${moeda(l.valor)}`, f)}>
                            {ROTULO_FORMA[f]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
