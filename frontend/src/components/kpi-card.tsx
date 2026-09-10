import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

export type Tendencia = { valor: number; rotulo: string } | null

/**
 * Cartão de indicador. Ícone em bloco arredondado à esquerda (como os widgets
 * do macOS), rótulo pequeno em cima, valor grande, e um chip de tendência ou
 * de estado à direita. Quatro deles em linha formam a faixa da visão geral.
 */
export function KpiCard({
  rotulo,
  valor,
  detalhe,
  icone: Icone,
  tom = "primary",
  tendencia,
  chip,
  className,
}: {
  rotulo: string
  valor: React.ReactNode
  detalhe?: React.ReactNode
  icone: React.ComponentType<{ className?: string }>
  tom?: "primary" | "success" | "warning" | "neutral"
  tendencia?: Tendencia
  chip?: { texto: string; tom: "success" | "warning" | "neutral" | "info" }
  className?: string
}) {
  const tons = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
    neutral: "bg-neutral text-neutral-foreground",
  }
  const chips = {
    success: "bg-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
    neutral: "bg-neutral text-neutral-foreground",
    info: "bg-info text-info-foreground",
  }

  return (
    <div
      className={cn(
        "bg-card shadow-card flex min-w-0 items-start gap-3.5 rounded-xl p-4",
        className
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-[10px]",
          tons[tom]
        )}
      >
        <Icone className="size-[18px]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground truncate text-[12.5px] font-medium">{rotulo}</p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="tabular truncate text-[22px] leading-7 font-semibold tracking-[-0.02em]">
            {valor}
          </p>
          {tendencia && (
            <span
              className={cn(
                "tabular inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] font-medium",
                tendencia.valor > 0 && "bg-success text-success-foreground",
                tendencia.valor < 0 && "bg-destructive/10 text-destructive",
                tendencia.valor === 0 && "bg-neutral text-neutral-foreground"
              )}
              title={tendencia.rotulo}
            >
              {tendencia.valor > 0 ? (
                <ArrowUpRight className="size-3" />
              ) : tendencia.valor < 0 ? (
                <ArrowDownRight className="size-3" />
              ) : (
                <Minus className="size-3" />
              )}
              {Math.abs(tendencia.valor)}%
            </span>
          )}
          {chip && (
            <span
              className={cn(
                "rounded-full px-1.5 py-px text-[11px] font-medium",
                chips[chip.tom]
              )}
            >
              {chip.texto}
            </span>
          )}
        </div>
        {detalhe && (
          <p className="text-muted-foreground mt-1 truncate text-[12px]">{detalhe}</p>
        )}
      </div>
    </div>
  )
}
