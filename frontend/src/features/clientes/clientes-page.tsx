import { useMemo, useState } from "react"

import {
  Eye,
  Mail,
  Pencil,
  Phone,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react"

import { useApp } from "@/app-context"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const [clienteDetalhesId, setClienteDetalhesId] = useState<
    number | null
  >(null)
  const [clienteEdicaoId, setClienteEdicaoId] = useState<
    number | null
  >(null)

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
          c.cpf
            .replace(/\D/g, "")
            .includes(termo.replace(/\D/g, "") || "§") ||
          c.email.toLowerCase().includes(termo)
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  }, [clientes, vendas, busca])

  const totalGasto = linhas.reduce((s, c) => s + c.total, 0)

  const clienteDetalhes =
    clienteDetalhesId !== null
      ? store.obterCliente(clienteDetalhesId)
      : null

  const comprasClienteDetalhes =
    clienteDetalhesId !== null
      ? vendas.filter((v) => v.cliente_id === clienteDetalhesId)
      : []

  const totalClienteDetalhes = comprasClienteDetalhes.reduce(
    (s, v) => s + v.valor_venda,
    0
  )

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
          <span className="tabular text-foreground font-medium">
            {linhas.length}
          </span>{" "}
          {linhas.length === 1 ? "cliente" : "clientes"} ·{" "}
          <span className="tabular text-foreground font-medium">
            {moedaCurta(totalGasto)}
          </span>{" "}
          em compras
        </p>
      </div>

      {linhas.length === 0 ? (
        <div className="bg-card shadow-card rounded-xl">
          <EmptyState
            icone={Users}
            titulo={
              busca
                ? "Nenhum cliente encontrado"
                : "Nenhum cliente cadastrado"
            }
            descricao={
              busca
                ? "Tente outro nome ou CPF."
                : "Clientes também podem ser cadastrados durante o registro de uma venda."
            }
            acao={
              !busca && (
                <Button
                  size="sm"
                  onClick={() => setNovoCliente(true)}
                >
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
                  <TableHead className="text-right">
                    Última compra
                  </TableHead>
                  <TableHead className="pr-4 text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {linhas.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => setClienteDetalhesId(c.id)}
                  >
                    <TableCell className="py-2.5 pl-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-secondary flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                          {iniciais(c.nome)}
                        </span>

                        <div className="min-w-0 leading-tight">
                          <p className="truncate font-medium">
                            {c.nome}
                          </p>
                          <p className="text-muted-foreground text-[11.5px]">
                            cliente desde {dataBR(c.criado_em)}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="tabular text-muted-foreground">
                      {c.cpf}
                    </TableCell>

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
                      {c.total > 0 ? (
                        moeda(c.total)
                      ) : (
                        <span className="text-muted-foreground font-normal">
                          —
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="tabular text-muted-foreground text-right">
                      {c.ultima ? dataBR(c.ultima) : "—"}
                    </TableCell>

                    <TableCell className="pr-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            setClienteDetalhesId(c.id)
                          }}
                        >
                          <Eye className="size-3.5" />
                          Ver
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            setClienteEdicaoId(c.id)
                          }}
                        >
                          <Pencil className="size-3.5" />
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ClienteDialog
        aberto={novoCliente}
        onOpenChange={setNovoCliente}
      />

      <ClienteDialog
        aberto={clienteEdicaoId !== null}
        clienteId={clienteEdicaoId}
        onOpenChange={(aberto) => {
          if (!aberto) setClienteEdicaoId(null)
        }}
      />

      <Dialog
        open={clienteDetalhesId !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setClienteDetalhesId(null)
        }}
      >
        <DialogContent className="glass shadow-pop gap-0 overflow-hidden rounded-2xl border-0 p-0 sm:max-w-[620px]">
          {clienteDetalhes && (
            <>
              <DialogHeader className="border-b px-6 py-5">
                <DialogTitle className="text-[17px] tracking-[-0.01em]">
                  {clienteDetalhes.nome}
                </DialogTitle>

                <DialogDescription className="text-[13px]">
                  Cliente desde {dataBR(clienteDetalhes.criado_em)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 px-6 py-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-[11.5px]">
                      CPF
                    </p>
                    <p className="tabular text-[13px] font-medium">
                      {clienteDetalhes.cpf}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-[11.5px]">
                      Telefone
                    </p>
                    <p className="tabular text-[13px] font-medium">
                      {clienteDetalhes.telefone}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground text-[11.5px]">
                      E-mail
                    </p>
                    <p className="text-[13px] font-medium">
                      {clienteDetalhes.email || "Não informado"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="bg-secondary/60 rounded-lg px-3 py-2.5">
                    <p className="text-muted-foreground text-[11.5px]">
                      Compras
                    </p>
                    <p className="tabular text-[15px] font-semibold">
                      {comprasClienteDetalhes.length}
                    </p>
                  </div>

                  <div className="bg-secondary/60 rounded-lg px-3 py-2.5 sm:col-span-2">
                    <p className="text-muted-foreground text-[11.5px]">
                      Total gasto
                    </p>
                    <p className="tabular text-[15px] font-semibold">
                      {moeda(totalClienteDetalhes)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[13px] font-semibold">
                    Histórico de compras
                  </p>

                  {comprasClienteDetalhes.length === 0 ? (
                    <p className="text-muted-foreground rounded-lg border px-3 py-5 text-center text-[12.5px]">
                      Nenhuma compra registrada para este cliente.
                    </p>
                  ) : (
                    <div className="divide-y overflow-hidden rounded-lg border">
                      {comprasClienteDetalhes.map((venda) => {
                        const veiculo = store.obterVeiculo(
                          venda.veiculo_id
                        )

                        return (
                          <div
                            key={venda.id}
                            className="flex items-center justify-between gap-3 px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[12.5px] font-medium">
                                {veiculo
                                  ? `${veiculo.marca} ${veiculo.modelo}`
                                  : "Veículo removido"}
                              </p>
                              <p className="text-muted-foreground text-[11.5px]">
                                {dataBR(venda.data_venda)} ·{" "}
                                {venda.vendedor}
                              </p>
                            </div>

                            <p className="tabular shrink-0 text-[12.5px] font-semibold">
                              {moeda(venda.valor_venda)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setClienteDetalhesId(null)}
                >
                  Fechar
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    const id = clienteDetalhes.id
                    setClienteDetalhesId(null)
                    setClienteEdicaoId(id)
                  }}
                >
                  <Pencil className="size-4" />
                  Editar cliente
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
