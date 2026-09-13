import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { store } from "@/data/store"

import {
  ClienteForm,
  clienteVazio,
  validarCliente,
  type ClienteFormDados,
} from "./cliente-form"

export function ClienteDialog({
  aberto,
  onOpenChange,
  clienteId = null,
}: {
  aberto: boolean
  onOpenChange: (v: boolean) => void
  clienteId?: number | null
}) {
  const [dados, setDados] = useState<ClienteFormDados>(clienteVazio)
  const [erros, setErros] = useState<
    Partial<Record<keyof ClienteFormDados, string>>
  >({})
  const [cpfOriginal, setCpfOriginal] = useState("")

  const editando = clienteId !== null

  useEffect(() => {
    if (!aberto) return

    setErros({})

    if (clienteId === null) {
      setDados(clienteVazio)
      setCpfOriginal("")
      return
    }

    const cliente = store.obterCliente(clienteId)

    if (!cliente) {
      setDados(clienteVazio)
      setCpfOriginal("")
      return
    }

    setCpfOriginal(cliente.cpf)
    setDados({
      nome: cliente.nome,
      cpf: cliente.cpf,
      telefone: cliente.telefone,
      email: cliente.email,
    })
  }, [aberto, clienteId])

  const salvar = (e: React.FormEvent) => {
    e.preventDefault()

    const encontrados = validarCliente(
      dados,
      clienteId ?? undefined,
      editando ? cpfOriginal : undefined
    )

    setErros(encontrados)

    if (Object.keys(encontrados).length > 0) return

    const payload = {
      nome: dados.nome.trim(),
      cpf: dados.cpf,
      telefone: dados.telefone,
      email: dados.email.trim(),
    }

    if (clienteId !== null) {
      const resultado = store.atualizarCliente(clienteId, payload)

      if ("erro" in resultado) {
        toast.error("Não foi possível atualizar o cliente", {
          description: resultado.erro,
        })
        return
      }

      toast.success("Cliente atualizado", {
        description: payload.nome,
      })
      onOpenChange(false)
      return
    }

    store.criarCliente(payload)

    toast.success("Cliente cadastrado", {
      description: payload.nome,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="glass shadow-pop gap-0 overflow-hidden rounded-2xl border-0 p-0 sm:max-w-[520px]">
        <form onSubmit={salvar} noValidate>
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="text-[17px] tracking-[-0.01em]">
              {editando ? "Editar cliente" : "Novo cliente"}
            </DialogTitle>

            <DialogDescription className="text-[13px]">
              {editando
                ? "Atualize os dados cadastrais do cliente."
                : "CPF único. E-mail é opcional."}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5">
            <ClienteForm
              dados={dados}
              onChange={setDados}
              erros={erros}
            />
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" className="min-w-28">
              {editando ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
