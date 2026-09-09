import { AlertTriangle, ArrowRight, Car, CircleDollarSign, Clock, Receipt, Tag, Wallet } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { useApp } from "@/app-context"
import { KpiCard } from "@/components/kpi-card"
import { StatusDot } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { VeiculoTile } from "@/components/veiculo-tile"
import { ORDEM_STATUS, ROTULO_STATUS, store, useEstado } from "@/data/store"
import { dataCurta, diasDesde, moeda, moedaCompacta, moedaCurta } from "@/lib/format"
import { cn } from "@/lib/utils"

function variacao(atual: number, anterior: number) {
  if (anterior === 0) return atual === 0 ? 0 : 100
  return Math.round(((atual - anterior) / anterior) * 100)
}

function Painel({
  titulo,
  acao,
  children,
  className,
}: {
  titulo: string
  acao?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("bg-card shadow-card flex flex-col rounded-xl", className)}>
      <header className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
        <h2 className="text-[14px] font-semibold tracking-[-0.01em]">{titulo}</h2>
        {acao}
      </header>
      {children}
    </section>
  )
}

type PontoTooltip = { active?: boolean; payload?: Array<{ payload: { rotulo: string; faturamento: number; vendas: number } }> }

function TooltipGrafico({ active, payload }: PontoTooltip) {
  if (!active || !payload?.length) return null
  const p = payload[0]!.payload
  return (
    <div className="glass shadow-pop rounded-lg px-3 py-2 text-[12.5px]">
      <p className="text-muted-foreground capitalize">{p.rotulo}</p>
      <p className="tabular font-semibold">{moeda(p.faturamento)}</p>
      <p className="text-muted-foreground tabular">
        {p.vendas} {p.vendas === 1 ? "venda" : "vendas"}
      </p>
    </div>
  )
}

export function VisaoGeralPage() {
  useEstado()
  const { navegar, setNovoVeiculo, setVenda, setVendaVeiculoId } = useApp()

  const ind = store.indicadores()
  const meses = store.faturamentoPorMes()
  const porMarca = store.estoquePorMarca()
  const ultimas = store.listarVendas().slice(0, 5)
  const veiculos = store.listarVeiculos()
  const emEstoque = veiculos.filter((v) => v.status !== "vendido")

  const atencao = [
    ...emEstoque
      .filter((v) => v.status === "reservado" && diasDesde(v.criado_em) >= 30)
      .map((v) => ({ v, tipo: "reserva" as const, texto: `Reservado há ${diasDesde(v.criado_em)} dias` })),
    ...emEstoque
      .filter((v) => v.status === "disponivel" && diasDesde(v.criado_em) >= 60)
      .map((v) => ({ v, tipo: "parado" as const, texto: `${diasDesde(v.criado_em)} dias sem venda` })),
    ...emEstoque
      .filter((v) => !v.placa)
      .map((v) => ({ v, tipo: "placa" as const, texto: "Sem placa cadastrada" })),
  ].slice(0, 5)

  const maxMarca = Math.max(...porMarca.map((m) => m.valor), 1)
  const contagemStatus = ORDEM_STATUS.map((s) => ({ s, n: veiculos.filter((v) => v.status === s).length }))
  const totalVeic = veiculos.length || 1

  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long" })

  return (
    <div className="space-y-4">
      {/* Saudação + ações rápidas */}
      <div className="flex flex-wrap items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-muted-foreground text-[13px] first-letter:uppercase">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Bom dia, Pedro</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-card"
            onClick={() => {
              setVendaVeiculoId(null)
              setVenda(true)
            }}
          >
            <Receipt className="size-4" />
            Registrar venda
          </Button>
          <Button
            size="sm"
            onClick={() => {
              navegar("estoque")
              setNovoVeiculo(true)
            }}
          >
            <Car className="size-4" />
            Cadastrar veículo
          </Button>
        </div>
      </div>

      {/* Os quatro indicadores do escopo */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          rotulo="Veículos em estoque"
          valor={ind.veiculosEmEstoque}
          icone={Car}
          tom="primary"
          detalhe={`${ind.disponiveis} disponíveis · ${ind.reservados} reservados`}
        />
        <KpiCard
          rotulo="Valor em estoque"
          valor={moedaCompacta(ind.valorEstoque)}
          icone={Wallet}
          tom="neutral"
          detalhe={`${moedaCurta(ind.veiculosEmEstoque ? ind.valorEstoque / ind.veiculosEmEstoque : 0)} por veículo`}
        />
        <KpiCard
          rotulo={`Vendas em ${mesAtual}`}
          valor={ind.vendasNoMes}
          icone={Receipt}
          tom="success"
          tendencia={{ valor: variacao(ind.vendasNoMes, ind.vendasMesAnterior), rotulo: "vs. mês anterior" }}
          detalhe={`${ind.vendasMesAnterior} no mês anterior`}
        />
        <KpiCard
          rotulo="Faturamento do mês"
          valor={moedaCompacta(ind.faturamentoMes)}
          icone={CircleDollarSign}
          tom="success"
          tendencia={{ valor: variacao(ind.faturamentoMes, ind.faturamentoMesAnterior), rotulo: "vs. mês anterior" }}
          detalhe={`${moedaCurta(ind.faturamentoMesAnterior)} no mês anterior`}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {/* Gráfico de faturamento */}
        <Painel
          titulo="Faturamento nos últimos 6 meses"
          className="xl:col-span-2"
          acao={
            <span className="text-muted-foreground tabular text-[12px]">
              {meses.reduce((s, m) => s + m.vendas, 0)} vendas · {moedaCurta(meses.reduce((s, m) => s + m.faturamento, 0))}
            </span>
          }
        >
          <div className="h-[240px] px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={meses} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="fat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
                <XAxis
                  dataKey="rotulo"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickFormatter={(v: number) => (v === 0 ? "0" : moedaCompacta(v).replace("R$ ", ""))}
                />
                <Tooltip content={<TooltipGrafico />} cursor={{ stroke: "var(--border)" }} />
                <Area
                  type="monotone"
                  dataKey="faturamento"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#fat)"
                  dot={{ r: 3, fill: "var(--card)", stroke: "var(--chart-1)", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Painel>

        {/* Estoque por status */}
        <Painel
          titulo="Estoque por status"
          acao={
            <Button variant="ghost" size="xs" className="text-muted-foreground -mr-1.5" onClick={() => navegar("estoque")}>
              Ver estoque
              <ArrowRight className="size-3" />
            </Button>
          }
        >
          <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full">
              {contagemStatus.map(({ s, n }) => (
                <span
                  key={s}
                  className={cn(
                    "h-full",
                    s === "disponivel" && "bg-success-solid",
                    s === "reservado" && "bg-warning-solid",
                    s === "vendido" && "bg-neutral-solid"
                  )}
                  style={{ width: `${(n / totalVeic) * 100}%` }}
                />
              ))}
            </div>
            <ul className="space-y-2.5">
              {contagemStatus.map(({ s, n }) => (
                <li key={s} className="flex items-center gap-2.5 text-[13px]">
                  <StatusDot status={s} />
                  <span className="flex-1">{ROTULO_STATUS[s]}</span>
                  <span className="tabular text-muted-foreground text-[12px]">{Math.round((n / totalVeic) * 100)}%</span>
                  <span className="tabular w-6 text-right font-semibold">{n}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto border-t pt-3">
              <p className="text-muted-foreground text-[12px]">Por marca</p>
              <ul className="mt-2 space-y-2">
                {porMarca.slice(0, 5).map((m) => (
                  <li key={m.marca} className="text-[12.5px]">
                    <div className="flex items-baseline justify-between">
                      <span>{m.marca}</span>
                      <span className="tabular text-muted-foreground">
                        {m.quantidade} · {moedaCurta(m.valor)}
                      </span>
                    </div>
                    <div className="bg-secondary mt-1 h-1.5 overflow-hidden rounded-full">
                      <div className="bg-primary/70 h-full rounded-full" style={{ width: `${(m.valor / maxMarca) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Painel>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {/* Últimas vendas */}
        <Painel
          titulo="Últimas vendas"
          acao={
            <Button variant="ghost" size="xs" className="text-muted-foreground -mr-1.5" onClick={() => navegar("vendas")}>
              Ver histórico
              <ArrowRight className="size-3" />
            </Button>
          }
        >
          <ul className="divide-y">
            {ultimas.length === 0 && (
              <li className="text-muted-foreground px-4 py-8 text-center text-[13px]">Nenhuma venda registrada.</li>
            )}
            {ultimas.map((v) => {
              const veic = store.obterVeiculo(v.veiculo_id)
              const cli = store.obterCliente(v.cliente_id)
              return (
                <li key={v.id} className="flex items-center gap-3 px-4 py-2.5">
                  {veic && <VeiculoTile marca={veic.marca} cor={veic.cor} size="sm" />}
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-[13px] font-medium">
                      {veic ? `${veic.marca} ${veic.modelo}` : "Veículo removido"}
                    </p>
                    <p className="text-muted-foreground truncate text-[12px]">
                      {cli?.nome ?? "—"} · {v.vendedor}
                    </p>
                  </div>
                  <div className="text-right leading-tight">
                    <p className="tabular text-[13px] font-semibold">{moedaCurta(v.valor_venda)}</p>
                    <p className="text-muted-foreground tabular text-[11.5px]">{dataCurta(v.data_venda)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Painel>

        {/* Atenção */}
        <Painel
          titulo="Precisa de atenção"
          acao={
            atencao.length > 0 && (
              <span className="bg-warning text-warning-foreground tabular rounded-full px-2 py-px text-[11.5px] font-medium">
                {atencao.length}
              </span>
            )
          }
        >
          {atencao.length === 0 ? (
            <p className="text-muted-foreground px-4 py-8 text-center text-[13px]">Tudo em dia no estoque.</p>
          ) : (
            <ul className="divide-y">
              {atencao.map(({ v, tipo, texto }) => (
                <li key={`${tipo}-${v.id}`} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-[8px]",
                      tipo === "reserva" && "bg-warning text-warning-foreground",
                      tipo === "parado" && "bg-warning text-warning-foreground",
                      tipo === "placa" && "bg-info text-info-foreground"
                    )}
                  >
                    {tipo === "reserva" ? <Clock className="size-4" /> : tipo === "parado" ? <AlertTriangle className="size-4" /> : <Tag className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-[13px] font-medium">
                      {v.marca} {v.modelo}
                    </p>
                    <p className="text-muted-foreground truncate text-[12px]">{texto}</p>
                  </div>
                  <span className="tabular text-muted-foreground text-[12.5px]">{moedaCurta(v.preco)}</span>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>
    </div>
  )
}
