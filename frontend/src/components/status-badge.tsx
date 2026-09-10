import { Badge } from "@/components/ui/badge"
import { ROTULO_STATUS, type Status } from "@/data/store"
import { cn } from "@/lib/utils"

const VARIANTE: Record<Status, "success" | "warning" | "neutral"> = {
  disponivel: "success",
  reservado: "warning",
  vendido: "neutral",
}

const PONTO: Record<Status, string> = {
  disponivel: "bg-success-solid",
  reservado: "bg-warning-solid",
  vendido: "bg-neutral-solid",
}

/** Ponto colorido (verde / laranja / cinza) — o indicador visual exigido pelo escopo. */
export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", PONTO[status], className)}
    />
  )
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <Badge variant={VARIANTE[status]} className={cn("pl-1.5", className)}>
      <StatusDot status={status} />
      {ROTULO_STATUS[status]}
    </Badge>
  )
}
