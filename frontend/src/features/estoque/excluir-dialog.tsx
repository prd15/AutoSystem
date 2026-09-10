import { Lock, Trash2 } from "lucide-react"
import { toast } from "sonner"

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
import { store, type Veiculo } from "@/data/store"
import { dataBR, moeda } from "@/lib/format"

/**
 * Confirmação de exclusão com marca e modelo em destaque. Quando o veículo já
 * tem venda registrada, a ação some e o diálogo explica o motivo (regra 3).
 */
export function ExcluirDialog({
  veiculo,
  onOpenChange,
}: {
  veiculo: Veiculo | null
  onOpenChange: (aberto: boolean) => void
}) {
  const venda = veiculo ? store.vendaDoVeiculo(veiculo.id) : null
  const cliente = venda ? store.obterCliente(venda.cliente_id) : null

  const confirmar = () => {
    if (!veiculo) return
    const r = store.excluirVeiculo(veiculo.id)
    if ("erro" in r) {
      toast.error("Não foi possível excluir", { description: r.erro })
      return
    }
    toast.success("Veículo excluído", { description: `${veiculo.marca} ${veiculo.modelo} saiu do estoque.` })
    onOpenChange(false)
  }

  return (
    <AlertDialog open={veiculo !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass shadow-pop rounded-2xl border-0 sm:max-w-[420px]">
        <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
          <div
            className={
              venda
                ? "bg-warning text-warning-foreground flex size-12 items-center justify-center rounded-2xl"
                : "bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-2xl"
            }
          >
            {venda ? <Lock className="size-5" /> : <Trash2 className="size-5" />}
          </div>
          <AlertDialogTitle className="text-[17px] tracking-[-0.01em]">
            {venda ? "Este veículo não pode ser excluído" : "Excluir veículo?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-muted-foreground space-y-3 text-[13px] leading-relaxed">
              {veiculo && (
                <p>
                  <span className="text-foreground font-medium">
                    {veiculo.marca} {veiculo.modelo}
                  </span>
                  {veiculo.placa ? ` · ${veiculo.placa}` : ""} · {veiculo.ano}
                </p>
              )}
              {venda ? (
                <div className="bg-card/70 hairline rounded-xl p-3 text-left">
                  <p className="text-foreground mb-1 text-[12.5px] font-medium">Venda registrada</p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[12.5px]">
                    <dt>Data</dt>
                    <dd className="tabular text-foreground">{dataBR(venda.data_venda)}</dd>
                    <dt>Valor</dt>
                    <dd className="tabular text-foreground">{moeda(venda.valor_venda)}</dd>
                    <dt>Cliente</dt>
                    <dd className="text-foreground truncate">{cliente?.nome ?? "—"}</dd>
                  </dl>
                  <p className="mt-2">
                    O histórico de vendas depende deste registro. Para tirá-lo da listagem, mantenha o status como vendido.
                  </p>
                </div>
              ) : (
                <p>Esta ação remove o veículo do estoque e não pode ser desfeita.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          {venda ? (
            <AlertDialogCancel className="min-w-28">Entendi</AlertDialogCancel>
          ) : (
            <>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  confirmar()
                }}
                className="bg-destructive hover:bg-destructive/90 min-w-28 text-white"
              >
                Excluir
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
