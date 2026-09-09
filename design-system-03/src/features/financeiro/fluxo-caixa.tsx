import { useMemo, useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleCheck,
  Landmark,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Scale,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { Segmented } from "@/components/segmented"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ROTULO_CATEGORIA,
  ROTULO_FORMA,
  store,
  type CategoriaLancamento,
  type FormaPagamento,
  type Lancamento,
  type TipoLancamento,
} from "@/data/store"
import { dataBR, moeda, moedaCompacta, moedaCurta } from "@/lib/format"
import { cn } from "@/lib/utils"

import { LancamentoStatusBadge, estadoLancamento } from "./lancamento-status"

type Faixa = { de: string | null; ate: string | null }
type FiltroStatus = "todos" | "pago" | "pendente" | "atrasado"

const FORMAS_RAPIDAS: FormaPagamento[] = ["pix", "transferencia", "boleto", "cartao", "dinheiro"]

type PontoTooltip = {
  active?: boolean
  payload?: Array<{ payload: { rotulo: string; entradas: number; saidas: number; saldo: number; acumulado: number } }>
}

function TooltipFluxo({ active, payload }: PontoTooltip) {
  if (!active || !payload?.length) return null
  const p = payload[0]!.payload
  return (
    <div className="glass shadow-pop tabular rounded-lg px-3 py-2 text-[12.5px]">
      <p className="text-muted-foreground capitalize">{p.rotulo}</p>
      <p className="text-success-foreground">Entradas {moeda(p.entradas)}</p>
      <p className="text-destructive">Saídas {moeda(p.saidas)}</p>
      <p className="mt-1 border-t pt-1 font-semibold">
        Saldo {p.saldo < 0 ? "−" : ""}
        {moeda(Math.abs(p.saldo))}
      </p>
    </div>
  )
}

export function FluxoCaixa({
  faixa,
  rotuloPeriodo,
  onNovo,
  onEditar,
}: {
  faixa: Faixa
  rotuloPeriodo: string
  onNovo: () => void
  onEditar: (l: Lancamento) => void
}) {
  const [busca, setBusca] = useState("")
  const [tipo, setTipo] = useState<TipoLancamento | "todos">("todos")
  const [status, setStatus] = useState<FiltroStatus>("todos")
  const [categoria, setCategoria] = useState<CategoriaLancamento | "todas">("todas")
  const [excluindo, setExcluindo] = useState<Lancamento | null>(null)

  const resumo = store.resumoFinanceiro(faixa)
  const meses = store.fluxoPorMes()
  const porCategoria = store.saidasPorCategoria(faixa)
  const totalCategorias = porCategoria.reduce((s, c) => s + c.valor, 0) || 1

  const lista = useMemo(
    () => store.listarLancamentos({ ...faixa, tipo, status, categoria, busca }),
    [faixa, tipo, status, categoria, busca]
  )
  const filtroAtivo = busca !== "" || tipo !== "todos" || status !== "todos" || categoria !== "todas"
  const totalLista = lista.reduce((s, l) => s + (l.tipo === "entrada" ? l.valor : -l.valor), 0)

  const quitar = (l: Lancamento, forma: FormaPagamento) => {
    store.quitarLancamento(l.id, forma)
    toast.success(l.tipo === "entrada" ? "Recebimento confirmado" : "Pagamento registrado", {
      description: `${l.descricao} · ${moeda(l.valor)} via ${ROTULO_FORMA[forma]}`,
    })
  }

  const confirmarExclusao = () => {
    if (!excluindo) return
    const r = store.excluirLancamento(excluindo.id)
    if ("erro" in r) toast.error("Não foi possível excluir", { description: r.erro })
    else toast.success("Lançamento excluído", { description: excluindo.descricao })
    setExcluindo(null)
  }

  return (
    <div className="space-y-4">
      {/* Indicadores */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard rotulo={`Entradas ${rotuloPeriodo}`} valor={moedaCompacta(resumo.entradas)} icone={ArrowDownLeft} tom="success" detalhe={`${moedaCurta(resumo.previstoEntradas - resumo.entradas)} ainda a receber no período`} />
        <KpiCard rotulo={`Saídas ${rotuloPeriodo}`} valor={moedaCompacta(resumo.saidas)} icone={ArrowUpRight} tom="warning" detalhe={`${moedaCurta(resumo.previstoSaidas - resumo.saidas)} ainda a pagar no período`} />
        <KpiCard
          rotulo="Saldo do período"
          valor={`${resumo.saldo < 0 ? "−" : ""}${moedaCompacta(Math.abs(resumo.saldo))}`}
          icone={Scale}
          tom={resumo.saldo >= 0 ? "primary" : "warning"}
          chip={{ texto: resumo.saldo >= 0 ? "positivo" : "negativo", tom: resumo.saldo >= 0 ? "success" : "warning" }}
          detalhe="Entradas menos saídas já realizadas"
        />
        <KpiCard
          rotulo="Pendências"
          valor={moedaCompacta(resumo.aPagar)}
          icone={Wallet}
          tom={resumo.atrasados > 0 ? "warning" : "neutral"}
          chip={resumo.atrasados > 0 ? { texto: `${resumo.atrasados} em atraso`, tom: "warning" } : undefined}
          detalhe={`a pagar · ${moedaCurta(resumo.aReceber)} a receber`}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {/* Gráfico */}
        <section className="bg-card shadow-card rounded-xl xl:col-span-2">
          <header className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3.5 pb-1">
            <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Entradas × saídas nos últimos 6 meses</h2>
            <div className="text-muted-foreground flex items-center gap-3 text-[11.5px]">
              <span className="flex items-center gap-1.5"><span className="bg-success-solid size-2 rounded-sm" /> Entradas</span>
              <span className="flex items-center gap-1.5"><span className="bg-destructive/70 size-2 rounded-sm" /> Saídas</span>
              <span className="flex items-center gap-1.5"><span className="bg-primary h-0.5 w-3 rounded-full" /> Saldo do mês</span>
            </div>
          </header>
          <div className="h-[240px] px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={meses} margin={{ top: 12, right: 12, bottom: 0, left: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="rotulo" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} dy={6} />
                <YAxis axisLine={false} tickLine={false} width={56} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v: number) => (v === 0 ? "0" : moedaCompacta(v).replace("R$ ", ""))} />
                <Tooltip content={<TooltipFluxo />} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="entradas" fill="var(--success-solid)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="saidas" fill="color-mix(in oklch, var(--destructive) 70%, transparent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Line type="monotone" dataKey="saldo" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--card)", strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Saídas por categoria */}
        <section className="bg-card shadow-card flex flex-col rounded-xl">
          <header className="flex items-center justify-between px-4 pt-3.5 pb-2">
            <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Saídas por categoria</h2>
            <span className="text-muted-foreground tabular text-[12px]">{rotuloPeriodo}</span>
          </header>
          {porCategoria.length === 0 ? (
            <p className="text-muted-foreground px-4 py-8 text-center text-[13px]">Nenhuma saída paga no período.</p>
          ) : (
            <ul className="space-y-2.5 px-4 pb-4">
              {porCategoria.map((c) => (
                <li key={c.categoria} className="text-[12.5px]">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate">{ROTULO_CATEGORIA[c.categoria]}</span>
                    <span className="tabular text-muted-foreground shrink-0">
                      {Math.round((c.valor / totalCategorias) * 100)}% · {moedaCurta(c.valor)}
                    </span>
                  </div>
                  <div className="bg-secondary mt-1 h-1.5 overflow-hidden rounded-full">
                    <div
                      className={cn("h-full rounded-full", c.categoria === "compra_veiculo" ? "bg-primary/70" : c.categoria === "comissao" ? "bg-warning-solid" : "bg-neutral-solid")}
                      style={{ width: `${(c.valor / totalCategorias) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Lançamentos */}
      <section className="bg-card shadow-card overflow-hidden rounded-xl">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <h2 className="mr-2 text-[14px] font-semibold tracking-[-0.01em]">Lançamentos</h2>
          <div className="relative min-w-48 flex-1 sm:max-w-64">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Descrição ou categoria" aria-label="Buscar lançamento" className="h-8 rounded-[8px] pl-8 text-[13px]" />
            {busca && (
              <button type="button" aria-label="Limpar busca" onClick={() => setBusca("")} className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Segmented
            aria-label="Tipo"
            valor={tipo}
            onChange={setTipo}
            opcoes={[
              { valor: "todos", rotulo: "Todos" },
              { valor: "entrada", rotulo: "Entradas" },
              { valor: "saida", rotulo: "Saídas" },
            ]}
          />
          <Select value={status} onValueChange={(v) => setStatus(v as FiltroStatus)}>
            <SelectTrigger size="sm" aria-label="Situação" className={cn("h-8 min-w-28 text-[13px]", status !== "todos" && "border-primary/40 bg-primary/5 text-primary")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass shadow-pop">
              <SelectItem value="todos">Qualquer situação</SelectItem>
              <SelectItem value="pago">Pagos</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="atrasado">Em atraso</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaLancamento | "todas")}>
            <SelectTrigger size="sm" aria-label="Categoria" className={cn("h-8 min-w-36 text-[13px]", categoria !== "todas" && "border-primary/40 bg-primary/5 text-primary")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass shadow-pop">
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {(Object.keys(ROTULO_CATEGORIA) as CategoriaLancamento[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {ROTULO_CATEGORIA[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtroAtivo && (
            <Button variant="ghost" size="sm" className="text-muted-foreground h-8" onClick={() => { setBusca(""); setTipo("todos"); setStatus("todos"); setCategoria("todas") }}>
              <X className="size-3.5" />
              Limpar
            </Button>
          )}
          <Button size="sm" variant="outline" className="ml-auto h-8" onClick={onNovo}>
            <Plus className="size-4" />
            Lançamento
          </Button>
        </div>

        {lista.length === 0 ? (
          <div className="border-t">
            <EmptyState icone={Landmark} titulo="Nenhum lançamento" descricao={filtroAtivo ? "Ajuste os filtros ou o período." : "Registre a primeira entrada ou saída do caixa."} />
          </div>
        ) : (
          <>
            <div className="scroll-mac overflow-x-auto border-t">
              <Table className="text-[13px]">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40 dark:bg-white/3 [&>th]:text-muted-foreground [&>th]:h-10 [&>th]:text-[12px] [&>th]:font-medium">
                    <TableHead className="pl-4">Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map((l) => {
                    const automatico = l.venda_id !== null
                    const veic = l.veiculo_id !== null ? store.obterVeiculo(l.veiculo_id) : null
                    const estado = estadoLancamento(l)
                    return (
                      <TableRow key={l.id} className={cn(estado === "atrasado" && "bg-destructive/[0.03]")} onDoubleClick={() => onEditar(l)}>
                        <TableCell className="tabular py-2.5 pl-4 whitespace-nowrap">{dataBR(l.data)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-[7px]", l.tipo === "entrada" ? "bg-success text-success-foreground" : "bg-secondary text-muted-foreground")}>
                              {l.categoria === "venda" ? <Receipt className="size-3.5" /> : l.tipo === "entrada" ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                            </span>
                            <div className="min-w-0 leading-tight">
                              <p className="flex items-center gap-1.5 truncate font-medium">
                                {l.descricao}
                                {automatico && <Lock className="text-muted-foreground size-3" aria-label="Gerado por venda" />}
                              </p>
                              {veic && (
                                <p className="text-muted-foreground text-[11.5px]">
                                  {veic.marca} {veic.modelo} · {veic.placa || "sem placa"}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{ROTULO_CATEGORIA[l.categoria]}</TableCell>
                        <TableCell className="text-muted-foreground">{l.forma ? ROTULO_FORMA[l.forma] : "—"}</TableCell>
                        <TableCell>
                          <LancamentoStatusBadge l={l} />
                        </TableCell>
                        <TableCell className={cn("tabular text-right font-medium whitespace-nowrap", l.tipo === "entrada" ? "text-success-foreground" : "text-foreground")}>
                          {l.tipo === "entrada" ? "+" : "−"} {moeda(l.valor)}
                        </TableCell>
                        <TableCell className="pr-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${l.descricao}`} className="text-muted-foreground">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass shadow-pop min-w-48">
                              {l.status === "pendente" && (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <CircleCheck />
                                    {l.tipo === "entrada" ? "Confirmar recebimento" : "Marcar como pago"}
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="glass shadow-pop">
                                    {FORMAS_RAPIDAS.map((f) => (
                                      <DropdownMenuItem key={f} onClick={() => quitar(l, f)}>
                                        {ROTULO_FORMA[f]}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              )}
                              <DropdownMenuItem onClick={() => onEditar(l)}>
                                <Pencil />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => setExcluindo(l)}>
                                <Trash2 />
                                Excluir
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
                {lista.length} {lista.length === 1 ? "lançamento" : "lançamentos"} · duplo clique para editar
              </span>
              <span>
                Resultado da seleção{" "}
                <span className={cn("tabular font-semibold", totalLista >= 0 ? "text-success-foreground" : "text-destructive")}>
                  {totalLista < 0 ? "−" : "+"} {moeda(Math.abs(totalLista))}
                </span>
              </span>
            </div>
          </>
        )}
      </section>

      <AlertDialog open={excluindo !== null} onOpenChange={(a) => !a && setExcluindo(null)}>
        <AlertDialogContent className="glass shadow-pop rounded-2xl border-0 sm:max-w-[420px]">
          <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
            <div className={cn("flex size-12 items-center justify-center rounded-2xl", excluindo?.venda_id !== null && excluindo?.venda_id !== undefined ? "bg-warning text-warning-foreground" : "bg-destructive/10 text-destructive")}>
              {excluindo?.venda_id !== null && excluindo?.venda_id !== undefined ? <Lock className="size-5" /> : <Trash2 className="size-5" />}
            </div>
            <AlertDialogTitle className="text-[17px] tracking-[-0.01em]">
              {excluindo?.venda_id !== null && excluindo?.venda_id !== undefined ? "Este lançamento não pode ser excluído" : "Excluir lançamento?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-relaxed">
              {excluindo && (
                <>
                  <span className="text-foreground font-medium">{excluindo.descricao}</span> · {moeda(excluindo.valor)}
                  <br />
                  {excluindo.venda_id !== null
                    ? "Ele foi gerado por uma venda registrada. Para removê-lo, a venda precisaria ser cancelada."
                    : "Esta ação não pode ser desfeita."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            {excluindo?.venda_id !== null && excluindo?.venda_id !== undefined ? (
              <AlertDialogCancel className="min-w-28">Entendi</AlertDialogCancel>
            ) : (
              <>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmarExclusao() }} className="bg-destructive hover:bg-destructive/90 min-w-28 text-white">
                  Excluir
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
