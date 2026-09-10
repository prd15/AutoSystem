import { useMemo, useState } from "react"
import { CalendarRange, HandCoins, Landmark, Wallet } from "lucide-react"

import { useApp } from "@/app-context"
import { Segmented } from "@/components/segmented"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { store, useEstado, type Lancamento } from "@/data/store"
import { hojeISO } from "@/lib/format"

import { Comissoes } from "./comissoes"
import { Financiamentos } from "./financiamentos"
import { FluxoCaixa } from "./fluxo-caixa"
import { LancamentoDialog } from "./lancamento-dialog"
import { SimuladorDialog } from "./simulador-dialog"

type Aba = "fluxo" | "comissoes" | "financiamentos"
type Periodo = "mes" | "30" | "90" | "tudo" | "personalizado"

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

function intervalo(p: Periodo, de: string, ate: string): { de: string | null; ate: string | null } {
  const hoje = new Date()
  switch (p) {
    case "mes":
      return { de: iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), ate: iso(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)) }
    case "30": {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return { de: iso(d), ate: null }
    }
    case "90": {
      const d = new Date()
      d.setDate(d.getDate() - 90)
      return { de: iso(d), ate: null }
    }
    case "tudo":
      return { de: null, ate: null }
    case "personalizado":
      return { de: de || null, ate: ate || null }
  }
}

const ROTULO_PERIODO: Record<Periodo, string> = {
  mes: "no mês",
  "30": "em 30 dias",
  "90": "em 90 dias",
  tudo: "no total",
  personalizado: "no período",
}

export function FinanceiroPage() {
  useEstado()
  const { novoLancamento, setNovoLancamento, simulador, setSimulador } = useApp()
  const [aba, setAba] = useState<Aba>("fluxo")
  const [periodo, setPeriodo] = useState<Periodo>("mes")
  const [de, setDe] = useState("")
  const [ate, setAte] = useState(hojeISO())
  const [editando, setEditando] = useState<Lancamento | null>(null)

  const faixa = useMemo(() => intervalo(periodo, de, ate), [periodo, de, ate])
  const resumo = store.resumoFinanceiro()
  const comissoesPendentes = store.listarLancamentos({ categoria: "comissao", status: "pendente" }).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          aria-label="Área do financeiro"
          valor={aba}
          onChange={setAba}
          opcoes={[
            { valor: "fluxo", rotulo: "Fluxo de caixa", icone: Wallet, contagem: resumo.pendentes || undefined },
            { valor: "comissoes", rotulo: "Comissões", icone: HandCoins, contagem: comissoesPendentes || undefined },
            { valor: "financiamentos", rotulo: "Financiamentos", icone: Landmark },
          ]}
        />

        {aba !== "financiamentos" && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {periodo === "personalizado" && (
              <div className="flex items-center gap-2">
                <Label htmlFor="fin-de" className="text-muted-foreground text-[12px]">de</Label>
                <Input id="fin-de" type="date" value={de} max={ate || undefined} onChange={(e) => setDe(e.target.value)} className="bg-card tabular h-8 w-36 text-[13px]" />
                <Label htmlFor="fin-ate" className="text-muted-foreground text-[12px]">até</Label>
                <Input id="fin-ate" type="date" value={ate} min={de} onChange={(e) => setAte(e.target.value)} className="bg-card tabular h-8 w-36 text-[13px]" />
              </div>
            )}
            <Segmented
              aria-label="Período"
              valor={periodo}
              onChange={setPeriodo}
              opcoes={[
                { valor: "mes", rotulo: "Este mês" },
                { valor: "30", rotulo: "30 dias" },
                { valor: "90", rotulo: "90 dias" },
                { valor: "tudo", rotulo: "Tudo" },
                { valor: "personalizado", rotulo: "Período", icone: CalendarRange },
              ]}
            />
          </div>
        )}
      </div>

      {aba === "fluxo" && (
        <FluxoCaixa faixa={faixa} rotuloPeriodo={ROTULO_PERIODO[periodo]} onNovo={() => setNovoLancamento(true)} onEditar={setEditando} />
      )}
      {aba === "comissoes" && <Comissoes faixa={faixa} rotuloPeriodo={ROTULO_PERIODO[periodo]} />}
      {aba === "financiamentos" && <Financiamentos onSimular={() => setSimulador(true)} />}

      <LancamentoDialog
        aberto={novoLancamento || editando !== null}
        onOpenChange={(v) => {
          if (!v) {
            setNovoLancamento(false)
            setEditando(null)
          }
        }}
        lancamento={editando}
      />
      <SimuladorDialog aberto={simulador} onOpenChange={setSimulador} />
    </div>
  )
}
