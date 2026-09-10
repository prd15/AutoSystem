import { Badge } from "@/components/ui/badge"
import type { Lancamento } from "@/data/store"
import { dataCurta, hojeISO } from "@/lib/format"

export function estadoLancamento(l: Lancamento): "pago" | "pendente" | "atrasado" {
  if (l.status === "pago") return "pago"
  return l.data < hojeISO() ? "atrasado" : "pendente"
}

export function LancamentoStatusBadge({ l }: { l: Lancamento }) {
  const e = estadoLancamento(l)
  if (e === "pago") return <Badge variant="success">Pago</Badge>
  if (e === "atrasado")
    return <Badge className="bg-destructive/10 text-destructive">Atrasado · {dataCurta(l.data)}</Badge>
  return <Badge variant="warning">Vence {dataCurta(l.data)}</Badge>
}
