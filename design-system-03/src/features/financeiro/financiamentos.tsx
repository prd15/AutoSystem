import { Calculator, CalendarClock, CircleCheck, FileText, Landmark, PiggyBank } from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VeiculoTile } from "@/components/veiculo-tile"
import { store } from "@/data/store"
import { percentual, proximaParcela } from "@/lib/financeiro"
import { dataBR, hojeISO, iniciais, moeda, moedaCompacta, moedaCurta } from "@/lib/format"
import { cn } from "@/lib/utils"

export function Financiamentos({ onSimular }: { onSimular: () => void }) {
  const contratos = store.financiamentos()
  const ativos = contratos.filter((f) => f.parcelas_pagas < f.parcelas)
  const financiado = contratos.reduce((s, f) => s + f.valor_financiado, 0)
  const recebido = contratos.reduce((s, f) => s + f.parcelas_pagas * f.valor_parcela, 0)
  const mes = hojeISO().slice(0, 7)
  const vencendoMes = ativos.filter((f) => proximaParcela(f)?.startsWith(mes))
  const valorMes = vencendoMes.reduce((s, f) => s + f.valor_parcela, 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard rotulo="Contratos ativos" valor={ativos.length} icone={FileText} tom="primary" detalhe={`${contratos.length - ativos.length} quitados`} />
        <KpiCard rotulo="Total financiado" valor={moedaCompacta(financiado)} icone={Landmark} tom="neutral" detalhe="Soma dos contratos em carteira" />
        <KpiCard rotulo="Parcelas recebidas" valor={moedaCompacta(recebido)} icone={PiggyBank} tom="success" detalhe={financiado ? `${Math.round((recebido / financiado) * 100)}% do financiado` : "—"} />
        <KpiCard rotulo="Vencendo este mês" valor={moedaCompacta(valorMes)} icone={CalendarClock} tom={vencendoMes.length ? "warning" : "neutral"} chip={vencendoMes.length ? { texto: `${vencendoMes.length} ${vencendoMes.length === 1 ? "parcela" : "parcelas"}`, tom: "warning" } : undefined} detalhe="Próximas parcelas dos clientes" />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Contratos</h2>
          <Button size="sm" variant="outline" className="bg-card h-8" onClick={onSimular}>
            <Calculator className="size-4" />
            Simular financiamento
          </Button>
        </div>

        {contratos.length === 0 ? (
          <div className="bg-card shadow-card rounded-xl">
            <EmptyState icone={Landmark} titulo="Nenhum contrato registrado" descricao="Simule um financiamento e registre o contrato para acompanhar as parcelas." acao={<Button size="sm" onClick={onSimular}><Calculator className="size-4" />Simular</Button>} />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {contratos.map((f) => {
              const veic = store.obterVeiculo(f.veiculo_id)
              const cli = store.obterCliente(f.cliente_id)
              const proxima = proximaParcela(f)
              const quitado = proxima === null
              const atrasada = proxima !== null && proxima < hojeISO()
              const progresso = (f.parcelas_pagas / f.parcelas) * 100
              const saldo = (f.parcelas - f.parcelas_pagas) * f.valor_parcela

              return (
                <article key={f.id} className={cn("bg-card shadow-card flex flex-col gap-3 rounded-xl p-4", quitado && "opacity-75")}>
                  <div className="flex items-start gap-3">
                    {veic ? <VeiculoTile marca={veic.marca} cor={veic.cor} /> : <div className="bg-secondary size-10 rounded-[10px]" />}
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-[13.5px] font-semibold tracking-[-0.01em]">
                        {veic ? `${veic.marca} ${veic.modelo}` : "Veículo removido"}
                      </p>
                      <p className="text-muted-foreground flex items-center gap-1.5 text-[12px]">
                        <span className="bg-secondary flex size-4 items-center justify-center rounded-full text-[8px] font-semibold">
                          {cli ? iniciais(cli.nome) : "—"}
                        </span>
                        <span className="truncate">{cli?.nome ?? "—"}</span>
                      </p>
                    </div>
                    {quitado ? (
                      <Badge variant="success">Quitado</Badge>
                    ) : atrasada ? (
                      <Badge className="bg-destructive/10 text-destructive">Em atraso</Badge>
                    ) : (
                      <Badge variant="info">{f.banco}</Badge>
                    )}
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between text-[12.5px]">
                      <span className="text-muted-foreground">
                        Parcela <span className="tabular text-foreground font-medium">{Math.min(f.parcelas_pagas + 1, f.parcelas)}</span> de {f.parcelas}
                      </span>
                      <span className="tabular font-semibold">{moeda(f.valor_parcela)}</span>
                    </div>
                    <div className="bg-secondary mt-1.5 h-1.5 overflow-hidden rounded-full">
                      <div className={cn("h-full rounded-full", quitado ? "bg-success-solid" : atrasada ? "bg-destructive/70" : "bg-primary")} style={{ width: `${progresso}%` }} />
                    </div>
                  </div>

                  <dl className="tabular grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                    <dt className="text-muted-foreground">Financiado</dt>
                    <dd className="text-right">{moedaCurta(f.valor_financiado)}</dd>
                    <dt className="text-muted-foreground">Entrada</dt>
                    <dd className="text-right">{moedaCurta(f.entrada)}</dd>
                    <dt className="text-muted-foreground">Taxa</dt>
                    <dd className="text-right">{percentual(f.taxa_mensal)} a.m.</dd>
                    <dt className="text-muted-foreground">Saldo a receber</dt>
                    <dd className="text-right font-medium">{moedaCurta(saldo)}</dd>
                  </dl>

                  <div className="mt-auto flex items-center justify-between border-t pt-3">
                    <span className={cn("text-[12px]", atrasada ? "text-destructive font-medium" : "text-muted-foreground")}>
                      {quitado ? "Contrato encerrado" : `Próxima ${dataBR(proxima!)}`}
                    </span>
                    {!quitado && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary h-7"
                        onClick={() => {
                          store.registrarParcelaPaga(f.id)
                          toast.success("Parcela registrada", { description: `${f.parcelas_pagas + 1} de ${f.parcelas} · ${moeda(f.valor_parcela)}` })
                        }}
                      >
                        <CircleCheck className="size-3.5" />
                        Parcela paga
                      </Button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
