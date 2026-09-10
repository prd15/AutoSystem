import { useEffect, useMemo, useState } from "react"
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Field } from "@/components/field"
import { StatusDot } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { VeiculoTile } from "@/components/veiculo-tile"
import { store, useEstado, VENDEDORES } from "@/data/store"
import { hojeISO, iniciais, moeda, moedaCampo, paraNumero } from "@/lib/format"
import { cn } from "@/lib/utils"

import { ClienteForm, validarCliente, type ClienteFormDados, clienteVazio } from "../clientes/cliente-form"

type Erros = Partial<Record<"veiculo" | "cliente" | "vendedor" | "valor" | "data", string>>

/**
 * Registro de venda: veículo (só não vendidos), cliente existente ou cadastro
 * rápido, vendedor, valor negociado e data. Ao salvar, o veículo vira vendido
 * e os indicadores atualizam (regras 1, 2 e 4).
 */
export function VendaDialog({
  aberto,
  onOpenChange,
  veiculoInicialId,
}: {
  aberto: boolean
  onOpenChange: (v: boolean) => void
  veiculoInicialId: number | null
}) {
  useEstado()
  const [veiculoId, setVeiculoId] = useState<number | null>(null)
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [novoCliente, setNovoCliente] = useState(false)
  const [cliente, setCliente] = useState<ClienteFormDados>(clienteVazio)
  const [errosCliente, setErrosCliente] = useState<Partial<Record<keyof ClienteFormDados, string>>>({})
  const [vendedor, setVendedor] = useState("")
  const [valor, setValor] = useState("")
  const [data, setData] = useState(hojeISO())
  const [erros, setErros] = useState<Erros>({})
  const [buscaVeiculo, setBuscaVeiculo] = useState(false)
  const [buscaCliente, setBuscaCliente] = useState(false)

  const vendaveis = store.veiculosVendaveis()
  const clientes = store.clientes()
  const veiculo = veiculoId !== null ? store.obterVeiculo(veiculoId) : null
  const clienteSel = clienteId !== null ? store.obterCliente(clienteId) : null

  useEffect(() => {
    if (aberto) {
      const inicial = veiculoInicialId !== null ? store.obterVeiculo(veiculoInicialId) : null
      setVeiculoId(inicial && inicial.status !== "vendido" ? inicial.id : null)
      setValor(inicial && inicial.status !== "vendido" ? moedaCampo(inicial.preco) : "")
      setClienteId(null)
      setNovoCliente(false)
      setCliente(clienteVazio)
      setErrosCliente({})
      setVendedor("")
      setData(hojeISO())
      setErros({})
    }
  }, [aberto, veiculoInicialId])

  const valorNum = paraNumero(valor)
  const diferenca = useMemo(
    () => (veiculo && valorNum !== null ? valorNum - veiculo.preco : null),
    [veiculo, valorNum]
  )

  const salvar = (e: React.FormEvent) => {
    e.preventDefault()
    const novos: Erros = {}
    if (veiculoId === null) novos.veiculo = "Selecione o veículo vendido."
    if (!novoCliente && clienteId === null) novos.cliente = "Selecione o cliente ou cadastre um novo."
    if (!vendedor.trim()) novos.vendedor = "Informe o nome do vendedor."
    if (valor.trim() === "") novos.valor = "Informe o valor da venda."
    else if (valorNum === null || valorNum <= 0) novos.valor = "O valor deve ser maior que zero."
    if (!data) novos.data = "Informe a data da venda."
    else if (data > hojeISO()) novos.data = "A data não pode estar no futuro."

    const errosC = novoCliente ? validarCliente(cliente) : {}
    setErros(novos)
    setErrosCliente(errosC)
    if (Object.keys(novos).length > 0 || Object.keys(errosC).length > 0) return

    let idCliente = clienteId!
    if (novoCliente) {
      const criado = store.criarCliente({
        nome: cliente.nome.trim(),
        cpf: cliente.cpf,
        telefone: cliente.telefone,
        email: cliente.email.trim(),
      })
      idCliente = criado.id
    }

    const r = store.registrarVenda({
      veiculo_id: veiculoId!,
      cliente_id: idCliente,
      vendedor: vendedor.trim(),
      valor_venda: valorNum!,
      data_venda: data,
    })
    if ("erro" in r) {
      toast.error("Não foi possível registrar a venda", { description: r.erro })
      return
    }
    toast.success("Venda registrada", {
      description: `${veiculo!.marca} ${veiculo!.modelo} por ${moeda(valorNum!)}. O veículo passou para vendido.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="glass shadow-pop gap-0 overflow-hidden rounded-2xl border-0 p-0 sm:max-w-[560px]">
        <form onSubmit={salvar} noValidate>
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="text-[17px] tracking-[-0.01em]">Registrar venda</DialogTitle>
            <DialogDescription className="text-[13px]">
              O veículo passa automaticamente para vendido e sai da contagem de estoque.
            </DialogDescription>
          </DialogHeader>

          <div className="scroll-mac max-h-[65svh] space-y-5 overflow-y-auto px-6 py-5">
            {/* Veículo */}
            <Field label="Veículo" erro={erros.veiculo} dica={vendaveis.length === 0 ? "Não há veículos disponíveis para venda." : undefined}>
              {(p) => (
                <Popover open={buscaVeiculo} onOpenChange={setBuscaVeiculo}>
                  <PopoverTrigger asChild>
                    <Button
                      id={p.id}
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={buscaVeiculo}
                      aria-invalid={p["aria-invalid"]}
                      aria-describedby={p["aria-describedby"]}
                      disabled={vendaveis.length === 0}
                      className="bg-card h-auto min-h-10 w-full justify-between px-3 py-1.5 font-normal"
                    >
                      {veiculo ? (
                        <span className="flex min-w-0 items-center gap-2.5">
                          <VeiculoTile marca={veiculo.marca} cor={veiculo.cor} size="sm" />
                          <span className="min-w-0 text-left leading-tight">
                            <span className="block truncate font-medium">
                              {veiculo.marca} {veiculo.modelo}
                            </span>
                            <span className="text-muted-foreground tabular block text-[11.5px]">
                              {veiculo.ano} · {veiculo.placa || "sem placa"} · tabela {moeda(veiculo.preco)}
                            </span>
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Escolher veículo</span>
                      )}
                      <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="glass shadow-pop w-[var(--radix-popover-trigger-width)] rounded-xl border-0 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar marca, modelo ou placa" />
                      <CommandList className="scroll-mac max-h-60">
                        <CommandEmpty>Nenhum veículo encontrado.</CommandEmpty>
                        <CommandGroup>
                          {vendaveis.map((v) => (
                            <CommandItem
                              key={v.id}
                              value={`${v.marca} ${v.modelo} ${v.placa} ${v.ano}`}
                              onSelect={() => {
                                setVeiculoId(v.id)
                                if (!valor || (veiculo && paraNumero(valor) === veiculo.preco)) {
                                  setValor(moedaCampo(v.preco))
                                }
                                setErros((e) => ({ ...e, veiculo: undefined }))
                                setBuscaVeiculo(false)
                              }}
                            >
                              <StatusDot status={v.status} />
                              <span className="truncate">
                                {v.marca} {v.modelo}
                              </span>
                              <span className="text-muted-foreground tabular text-xs">{v.ano}</span>
                              <span className="tabular ml-auto text-xs">{moeda(v.preco)}</span>
                              <Check className={cn("size-4", veiculoId === v.id ? "opacity-100" : "opacity-0")} />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </Field>

            {/* Cliente */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium">Cliente</p>
                <button
                  type="button"
                  onClick={() => {
                    setNovoCliente((v) => !v)
                    setErros((e) => ({ ...e, cliente: undefined }))
                  }}
                  className="text-primary inline-flex items-center gap-1 text-[12.5px] font-medium hover:underline"
                >
                  {novoCliente ? "Escolher existente" : (
                    <>
                      <UserPlus className="size-3.5" />
                      Cadastrar novo
                    </>
                  )}
                </button>
              </div>

              {novoCliente ? (
                <div className="bg-card/60 hairline rounded-xl p-4">
                  <ClienteForm dados={cliente} onChange={setCliente} erros={errosCliente} compacto />
                </div>
              ) : (
                <Field label="Cliente existente" erro={erros.cliente} className="[&>div:first-child]:sr-only">
                  {(p) => (
                    <Popover open={buscaCliente} onOpenChange={setBuscaCliente}>
                      <PopoverTrigger asChild>
                        <Button
                          id={p.id}
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={buscaCliente}
                          aria-invalid={p["aria-invalid"]}
                          aria-describedby={p["aria-describedby"]}
                          className="bg-card h-10 w-full justify-between px-3 font-normal"
                        >
                          {clienteSel ? (
                            <span className="flex min-w-0 items-center gap-2.5">
                              <span className="bg-secondary flex size-7 items-center justify-center rounded-full text-[11px] font-semibold">
                                {iniciais(clienteSel.nome)}
                              </span>
                              <span className="truncate">{clienteSel.nome}</span>
                              <span className="text-muted-foreground tabular text-[12px]">{clienteSel.cpf}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Buscar por nome ou CPF</span>
                          )}
                          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="glass shadow-pop w-[var(--radix-popover-trigger-width)] rounded-xl border-0 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Nome ou CPF" />
                          <CommandList className="scroll-mac max-h-56">
                            <CommandEmpty>
                              <p className="text-[13px]">Nenhum cliente encontrado.</p>
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="mt-1"
                                onClick={() => {
                                  setNovoCliente(true)
                                  setBuscaCliente(false)
                                }}
                              >
                                Cadastrar novo cliente
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {clientes.map((c) => (
                                <CommandItem
                                  key={c.id}
                                  value={`${c.nome} ${c.cpf}`}
                                  onSelect={() => {
                                    setClienteId(c.id)
                                    setErros((e) => ({ ...e, cliente: undefined }))
                                    setBuscaCliente(false)
                                  }}
                                >
                                  <span className="bg-secondary flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                                    {iniciais(c.nome)}
                                  </span>
                                  <span className="truncate">{c.nome}</span>
                                  <span className="text-muted-foreground tabular ml-auto text-xs">{c.cpf}</span>
                                  <Check className={cn("size-4", clienteId === c.id ? "opacity-100" : "opacity-0")} />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </Field>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Vendedor" erro={erros.vendedor} className="sm:col-span-1">
                {(p) => (
                  <>
                    <Input
                      {...p}
                      list="vendedores"
                      value={vendedor}
                      onChange={(e) => setVendedor(e.target.value)}
                      placeholder="Nome"
                      className="bg-card h-10"
                    />
                    <datalist id="vendedores">
                      {VENDEDORES.map((v) => (
                        <option key={v} value={v} />
                      ))}
                    </datalist>
                  </>
                )}
              </Field>
              <Field
                label="Valor da venda"
                erro={erros.valor}
                dica={
                  diferenca !== null && diferenca !== 0
                    ? `${diferenca < 0 ? "Desconto" : "Acima da tabela"} de ${moeda(Math.abs(diferenca))}`
                    : veiculo
                      ? "Igual ao preço de tabela."
                      : undefined
                }
              >
                {(p) => (
                  <div className="relative">
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px]">
                      R$
                    </span>
                    <Input
                      {...p}
                      inputMode="decimal"
                      className="bg-card tabular h-10 pl-9"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      onBlur={() => {
                        const n = paraNumero(valor)
                        if (n !== null) setValor(moedaCampo(n))
                      }}
                      placeholder="0,00"
                    />
                  </div>
                )}
              </Field>
              <Field label="Data" erro={erros.data}>
                {(p) => (
                  <Input
                    {...p}
                    type="date"
                    max={hojeISO()}
                    className="bg-card tabular h-10"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                )}
              </Field>
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="min-w-32" disabled={vendaveis.length === 0}>
              Registrar venda
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
