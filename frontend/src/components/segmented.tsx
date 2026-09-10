import { cn } from "@/lib/utils"

export type SegmentoOpcao<T extends string> = {
  valor: T
  rotulo: React.ReactNode
  contagem?: number
  icone?: React.ComponentType<{ className?: string }>
}

/**
 * Controle segmentado no estilo do macOS: trilho cinza, segmento ativo branco
 * com sombra curta. Substitui abas quando as opções são poucas e mutuamente
 * exclusivas (status, visualização, período).
 */
export function Segmented<T extends string>({
  valor,
  onChange,
  opcoes,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: {
  valor: T
  onChange: (v: T) => void
  opcoes: SegmentoOpcao<T>[]
  size?: "sm" | "md"
  className?: string
  "aria-label"?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "bg-muted dark:bg-white/6 inline-flex shrink-0 items-center gap-0.5 rounded-lg p-[3px]",
        className
      )}
    >
      {opcoes.map(({ valor: v, rotulo, contagem, icone: Icone }) => {
        const ativo = v === valor
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(v)}
            className={cn(
              "ease-mac flex items-center gap-1.5 rounded-[7px] font-medium whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              size === "sm" ? "h-6 px-2 text-xs" : "h-7 px-2.5 text-[13px]",
              ativo
                ? "bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.06)] dark:bg-white/12 dark:shadow-none"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {Icone && <Icone className="size-3.5" />}
            {rotulo}
            {contagem !== undefined && (
              <span
                className={cn(
                  "tabular text-[11px]",
                  ativo ? "text-muted-foreground" : "text-muted-foreground/70"
                )}
              >
                {contagem}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
