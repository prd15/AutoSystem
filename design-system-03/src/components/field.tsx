import { useId } from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Rótulo + controle + mensagem de erro, no padrão do escopo: erro por campo,
 * em linguagem natural, anunciado por leitores de tela via role="alert".
 */
export function Field({
  label,
  erro,
  dica,
  opcional,
  className,
  children,
}: {
  label: string
  erro?: string | null
  dica?: string
  opcional?: boolean
  className?: string
  children: (props: {
    id: string
    "aria-invalid": boolean
    "aria-describedby": string | undefined
  }) => React.ReactNode
}) {
  const id = useId()
  const descId = `${id}-desc`
  const temDesc = Boolean(erro || dica)

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-[13px]">
          {label}
        </Label>
        {opcional && <span className="text-muted-foreground text-[11px]">opcional</span>}
      </div>
      {children({
        id,
        "aria-invalid": Boolean(erro),
        "aria-describedby": temDesc ? descId : undefined,
      })}
      {erro ? (
        <p id={descId} role="alert" className="text-destructive text-[12px] leading-snug">
          {erro}
        </p>
      ) : dica ? (
        <p id={descId} className="text-muted-foreground text-[12px] leading-snug">
          {dica}
        </p>
      ) : null}
    </div>
  )
}
