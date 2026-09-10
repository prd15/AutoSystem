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

import { ClienteForm, clienteVazio, validarCliente, type ClienteFormDados } from "./cliente-form"

export function ClienteDialog({
  aberto,
  onOpenChange,
}: {
  aberto: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [dados, setDados] = useState<ClienteFormDados>(clienteVazio)
  const [erros, setErros] = useState<Partial<Record<keyof ClienteFormDados, string>>>({})

  useEffect(() => {
    if (aberto) {
      setDados(clienteVazio)
      setErros({})
    }
  }, [aberto])

  const salvar = (e: React.FormEvent) => {
    e.preventDefault()
    const encontrados = validarCliente(dados)
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) return
    store.criarCliente({
      nome: dados.nome.trim(),
      cpf: dados.cpf,
      telefone: dados.telefone,
      email: dados.email.trim(),
    })
    toast.success("Cliente cadastrado", { description: dados.nome.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="glass shadow-pop gap-0 overflow-hidden rounded-2xl border-0 p-0 sm:max-w-[520px]">
        <form onSubmit={salvar} noValidate>
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="text-[17px] tracking-[-0.01em]">Novo cliente</DialogTitle>
            <DialogDescription className="text-[13px]">
              CPF único. E-mail é opcional.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5">
            <ClienteForm dados={dados} onChange={setDados} erros={erros} />
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="min-w-28">
              Cadastrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
