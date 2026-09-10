import { useMemo, useState } from "react"
import { Mail, Phone, Search, UserPlus, Users, X } from "lucide-react"

import { useApp } from "@/app-context"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { store, useEstado } from "@/data/store"
import { dataBR, iniciais, moeda, moedaCurta } from "@/lib/format"

import { ClienteDialog } from "./cliente-dialog"

export function ClientesPage() {
  useEstado()
  const { novoCliente, setNovoCliente } = useApp()
  const [busca, setBusca] = useState("")

  const clientes = store.clientes()
  const vendas = store.listarVendas()

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return clientes
      .map((c) => {
        const compras = vendas.filter((v) => v.cliente_id === c.id)
        return {
          ...c,
          compras: compras.length,
          total: compras.reduce((s, v) => s + v.valor_venda, 0),
          ultima: compras[0]?.data_venda ?? null,
        }
      })
      .filter(
        (c) =>
          !termo ||
          c.nome.toLowerCase().includes(termo) ||
          c.cpf.replace(/\D/g, "").includes(termo.replace(/\D/g, "") || "§") ||
          c.email.toLowerCase().includes(termo)
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  }, [clientes, vendas, busca])

  const totalGasto = linhas.reduce((s, c) => s + c.total, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-72">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, CPF ou e-mail"
            aria-label="Buscar cliente"
            className="bg-card h-8 rounded-[8px] pl-8 text-[13px]"
          />
          {busca && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setBusca("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <p className="text-muted-foreground ml-auto text-[12.5px]">
          <span className="tabular text-foreground font-medium">{linhas.length}</span>{" "}
          {linhas.length === 1 ? "cliente" : "clientes"} ·{" "}
          <span className="tabular text-foreground font-medium">{moedaCurta(totalGasto)}</span> em compras
        </p>
      </div>

      {linhas.length === 0 ? (
        <div className="bg-card shadow-card rounded-xl">
          <EmptyState
            icone={Users}
            titulo={busca ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            descricao={busca ? "Tente outro nome ou CPF." : "Clientes também podem ser cadastrados durante o registro de uma venda."}
            acao={
              !busca && (
                <Button size="sm" onClick={() => setNovoCliente(true)}>
                  <UserPlus className="size-4" />
                  Novo cliente
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="bg-card shadow-card overflow-hidden rounded-xl">
          <div className="scroll-mac overflow-x-auto">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 dark:bg-white/3 [&>th]:text-muted-foreground [&>th]:h-10 [&>th]:text-[12px] [&>th]:font-medium">
                  <TableHead className="pl-4">Cliente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Compras</TableHead>
                  <TableHead className="text-right">Total gasto</TableHead>
                  <TableHead className="text-right pr-4">Última compra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="py-2.5 pl-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-secondary flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                          {iniciais(c.nome)}
                        </span>
                        <div className="min-w-0 leading-tight">
                          <p className="truncate font-medium">{c.nome}</p>
                          <p className="text-muted-foreground text-[11.5px]">
                            cliente desde {dataBR(c.criado_em)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="tabular text-muted-foreground">{c.cpf}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 leading-tight">
                        <span className="tabular inline-flex items-center gap-1.5">
                          <Phone className="text-muted-foreground size-3" />
                          {c.telefone}
                        </span>
                        {c.email && (
                          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[12px]">
                            <Mail className="size-3" />
                            {c.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {c.compras > 0 ? (
                        <span className="bg-info text-info-foreground rounded-full px-2 py-px text-[11.5px] font-medium">
                          {c.compras}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {c.total > 0 ? moeda(c.total) : <span className="text-muted-foreground font-normal">—</span>}
                    </TableCell>
                    <TableCell className="tabular text-muted-foreground pr-4 text-right">
                      {c.ultima ? dataBR(c.ultima) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ClienteDialog aberto={novoCliente} onOpenChange={setNovoCliente} />
    </div>
  )
}
