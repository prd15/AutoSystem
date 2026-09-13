import { useEffect, useMemo, useState } from "react"
import {
  BadgePercent,
  Banknote,
  Check,
  ChevronsUpDown,
  Handshake,
  Landmark,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/auth-context"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { VeiculoTile } from "@/components/veiculo-tile"
import {
  BANCOS,
  PARCELAS_FINANCIAMENTO,
  parcelaPrice,
  store,
  useEstado,
  type TipoPagamentoVenda,
} from "@/data/store"
import {
  hojeISO,
  iniciais,
  moeda,
  moedaCampo,
  paraNumero,
} from "@/lib/format"
import { mascaraMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

import {
  ClienteForm,
  validarCliente,
  type ClienteFormDados,
  clienteVazio,
} from "../clientes/cliente-form"

type Erros = Partial<
  Record<
    | "veiculo"
    | "cliente"
    | "vendedor"
    | "valor"
    | "data"
    | "pagamento"
    | "banco"
    | "entrada"
    | "parcelas"
    | "taxa"
    | "inicio",
    string
  >
>

function percentual(valor: number) {
  return `${valor.toFixed(2).replace(".", ",")}%`
}

function taxaParaNumero(valor: string) {
  const normalizado = valor
    .replace(/[^0-9,]/g, "")
    .replace(",", ".")

  const numero = Number(normalizado)

  return Number.isFinite(numero)
    ? numero
    : 0
}

function mascaraTaxa(valor: string) {
  const limpo = valor
    .replace(/[^0-9,]/g, "")
    .replace(/(,.*),/g, "$1")

  return limpo.slice(0, 6)
}

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
  const { usuario } = useAuth()
  const usuarioVendedor = usuario?.perfil === "vendedor"

  const [veiculoId, setVeiculoId] = useState<number | null>(
    null
  )

  const [clienteId, setClienteId] = useState<number | null>(
    null
  )

  const [novoCliente, setNovoCliente] = useState(false)

  const [cliente, setCliente] =
    useState<ClienteFormDados>(clienteVazio)

  const [errosCliente, setErrosCliente] = useState<
    Partial<Record<keyof ClienteFormDados, string>>
  >({})

  const [vendedor, setVendedor] = useState("")
  const [valor, setValor] = useState("")
  const [data, setData] = useState(hojeISO())

  const [formaPagamento, setFormaPagamento] =
    useState<TipoPagamentoVenda>("avista")

  const [financiamentoId, setFinanciamentoId] =
    useState<number | null>(null)

  const [modoFinanciamento, setModoFinanciamento] =
    useState<"existente" | "novo">("novo")

  const [bancoFinanciamento, setBancoFinanciamento] =
    useState("")

  const [entradaFinanciamento, setEntradaFinanciamento] =
    useState("")

  const [parcelasFinanciamento, setParcelasFinanciamento] =
    useState("48")

  const [taxaFinanciamento, setTaxaFinanciamento] =
    useState("1,89")

  const [inicioFinanciamento, setInicioFinanciamento] =
    useState("")

  const [consorcioId, setConsorcioId] =
    useState<number | null>(null)

  const [erros, setErros] = useState<Erros>({})

  const [buscaVeiculo, setBuscaVeiculo] = useState(false)
  const [buscaCliente, setBuscaCliente] = useState(false)
  const [buscaVendedor, setBuscaVendedor] = useState(false)

  const vendaveis = store.veiculosVendaveis()
  const clientes = store.clientes()
  const vendedoresAtivos = store.vendedoresAtivos()

  const vendedorAutenticado =
    usuarioVendedor && usuario?.funcionarioId !== null
      ? vendedoresAtivos.find(
          (funcionario) =>
            funcionario.id === usuario?.funcionarioId
        ) ?? null
      : null

  const veiculo =
    veiculoId !== null
      ? store.obterVeiculo(veiculoId)
      : null

  const clienteSel =
    clienteId !== null
      ? store.obterCliente(clienteId)
      : null

  const vendedorSel =
    vendedoresAtivos.find(
      (funcionario) =>
        funcionario.nome === vendedor
    ) ?? null

  useEffect(() => {
    if (aberto) {
      const inicial =
        veiculoInicialId !== null
          ? store.obterVeiculo(veiculoInicialId)
          : null

      setVeiculoId(
        inicial && inicial.status !== "vendido"
          ? inicial.id
          : null
      )

      setValor(
        inicial && inicial.status !== "vendido"
          ? moedaCampo(inicial.preco)
          : ""
      )

      setClienteId(null)
      setNovoCliente(false)
      setCliente(clienteVazio)
      setErrosCliente({})
      setVendedor(
        usuarioVendedor
          ? vendedorAutenticado?.nome ?? ""
          : ""
      )
      setData(hojeISO())
      setFormaPagamento("avista")
      setFinanciamentoId(null)
      setModoFinanciamento("novo")
      setBancoFinanciamento("")
      setEntradaFinanciamento("")
      setParcelasFinanciamento("48")
      setTaxaFinanciamento("1,89")
      setInicioFinanciamento("")
      setConsorcioId(null)
      setErros({})
      setBuscaVeiculo(false)
      setBuscaCliente(false)
      setBuscaVendedor(false)
    }
  }, [
    aberto,
    veiculoInicialId,
    usuarioVendedor,
    vendedorAutenticado?.nome,
  ])

  const valorNum = paraNumero(valor)
  const entradaFinanciamentoNum =
    paraNumero(entradaFinanciamento) ?? 0
  const parcelasFinanciamentoNum =
    Number(parcelasFinanciamento)
  const taxaFinanciamentoPercentual =
    taxaParaNumero(taxaFinanciamento)
  const taxaFinanciamentoDecimal =
    taxaFinanciamentoPercentual / 100

  const valorFinanciadoNovo =
    valorNum !== null
      ? Math.max(
          0,
          valorNum - entradaFinanciamentoNum
        )
      : 0

  const valorParcelaNovo =
    valorFinanciadoNovo > 0 &&
    parcelasFinanciamentoNum > 0
      ? parcelaPrice(
          valorFinanciadoNovo,
          taxaFinanciamentoDecimal,
          parcelasFinanciamentoNum
        )
      : 0

  const totalFinanciamentoNovo =
    valorParcelaNovo *
    parcelasFinanciamentoNum

  const jurosEstimadosNovo =
    Math.max(
      0,
      totalFinanciamentoNovo -
        valorFinanciadoNovo
    )

  const financiamentosCompativeis = useMemo(() => {
    if (clienteId === null || veiculoId === null) {
      return []
    }

    return store
      .financiamentos()
      .filter(
        (f) =>
          f.cliente_id === clienteId &&
          f.veiculo_id === veiculoId &&
          (f.status === "aprovado" ||
            f.status === "ativo")
      )
  }, [clienteId, veiculoId])

  const consorciosCompativeis = useMemo(() => {
    if (clienteId === null || veiculoId === null) {
      return []
    }

    return store
      .consorcios()
      .filter(
        (c) =>
          c.cliente_id === clienteId &&
          c.status === "contemplado" &&
          (c.veiculo_id === null ||
            c.veiculo_id === veiculoId) &&
          (valorNum === null ||
            valorNum <= 0 ||
            c.valor_carta >= valorNum)
      )
  }, [clienteId, veiculoId, valorNum])

  const financiamentoSelecionado =
    financiamentoId !== null
      ? store.obterFinanciamento(financiamentoId)
      : null

  const consorcioSelecionado =
    consorcioId !== null
      ? store.obterConsorcio(consorcioId)
      : null

  const diferenca = useMemo(
    () =>
      veiculo && valorNum !== null
        ? valorNum - veiculo.preco
        : null,
    [veiculo, valorNum]
  )

  const salvar = (e: React.FormEvent) => {
    e.preventDefault()

    const novos: Erros = {}

    if (veiculoId === null) {
      novos.veiculo =
        "Selecione o veículo vendido."
    }

    if (!novoCliente && clienteId === null) {
      novos.cliente =
        "Selecione o cliente ou cadastre um novo."
    }

    if (!vendedorSel) {
      novos.vendedor = usuarioVendedor
        ? "Seu usuário não está vinculado a um vendedor ativo."
        : "Selecione um vendedor ativo."
    } else if (
      usuarioVendedor &&
      vendedorAutenticado &&
      vendedorSel.id !== vendedorAutenticado.id
    ) {
      novos.vendedor =
        "Vendedores só podem registrar vendas em seu próprio nome."
    }

    if (valor.trim() === "") {
      novos.valor =
        "Informe o valor da venda."
    } else if (
      valorNum === null ||
      valorNum <= 0
    ) {
      novos.valor =
        "O valor deve ser maior que zero."
    }

    if (!data) {
      novos.data =
        "Informe a data da venda."
    } else if (data > hojeISO()) {
      novos.data =
        "A data não pode estar no futuro."
    }

    if (
      formaPagamento === "financiamento" &&
      modoFinanciamento === "existente" &&
      financiamentoId === null
    ) {
      novos.pagamento =
        "Selecione um financiamento aprovado ou ativo."
    }

    if (
      formaPagamento === "financiamento" &&
      modoFinanciamento === "novo"
    ) {
      if (!bancoFinanciamento) {
        novos.banco =
          "Selecione o banco."
      }

      if (
        valorNum !== null &&
        (entradaFinanciamentoNum < 0 ||
          entradaFinanciamentoNum >= valorNum)
      ) {
        novos.entrada =
          "A entrada deve ser menor que o valor da venda."
      }

      if (
        !PARCELAS_FINANCIAMENTO.includes(
          parcelasFinanciamentoNum as
            (typeof PARCELAS_FINANCIAMENTO)[number]
        )
      ) {
        novos.parcelas =
          "Selecione uma quantidade válida."
      }

      if (taxaFinanciamentoPercentual < 0) {
        novos.taxa =
          "A taxa não pode ser negativa."
      }

      if (!inicioFinanciamento) {
        novos.inicio =
          "Informe a data da primeira parcela."
      }
    }

    if (
      formaPagamento === "consorcio" &&
      consorcioId === null
    ) {
      novos.pagamento =
        "Selecione uma cota contemplada compatível."
    }

    const errosC = novoCliente
      ? validarCliente(cliente)
      : {}

    setErros(novos)
    setErrosCliente(errosC)

    if (
      Object.keys(novos).length > 0 ||
      Object.keys(errosC).length > 0
    ) {
      return
    }

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

    const r =
      formaPagamento === "financiamento" &&
      modoFinanciamento === "novo"
        ? store.registrarVendaComNovoFinanciamento(
            {
              veiculo_id: veiculoId!,
              cliente_id: idCliente,
              vendedor: vendedorSel!.nome,
              valor_venda: valorNum!,
              data_venda: data,
            },
            {
              banco: bancoFinanciamento,
              valor_veiculo: valorNum!,
              entrada: entradaFinanciamentoNum,
              parcelas: parcelasFinanciamentoNum,
              taxa_mensal:
                taxaFinanciamentoDecimal,
              inicio: inicioFinanciamento,
            }
          )
        : store.registrarVenda({
            veiculo_id: veiculoId!,
            cliente_id: idCliente,
            vendedor: vendedorSel!.nome,
            valor_venda: valorNum!,
            data_venda: data,
            forma_pagamento: formaPagamento,
            financiamento_id:
              formaPagamento === "financiamento"
                ? financiamentoId
                : null,
            consorcio_id:
              formaPagamento === "consorcio"
                ? consorcioId
                : null,
          })

    if ("erro" in r) {
      toast.error(
        "Não foi possível registrar a venda",
        {
          description: r.erro,
        }
      )

      return
    }

    toast.success("Venda registrada", {
      description: `${veiculo!.marca} ${veiculo!.modelo} por ${moeda(
        valorNum!
      )}. O veículo passou para vendido.`,
    })

    onOpenChange(false)
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="glass shadow-pop gap-0 overflow-hidden rounded-2xl border-0 p-0 sm:max-w-[560px]">
        <form
          onSubmit={salvar}
          noValidate
        >
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="text-[17px] tracking-[-0.01em]">
              Registrar venda
            </DialogTitle>

            <DialogDescription className="text-[13px]">
              O veículo passa automaticamente para vendido e
              sai da contagem de estoque.
            </DialogDescription>
          </DialogHeader>

          <div className="scroll-mac max-h-[65svh] space-y-5 overflow-y-auto px-6 py-5">
            <Field
              label="Veículo"
              erro={erros.veiculo}
              dica={
                vendaveis.length === 0
                  ? "Não há veículos disponíveis para venda."
                  : undefined
              }
            >
              {(p) => (
                <Popover
                  open={buscaVeiculo}
                  onOpenChange={setBuscaVeiculo}
                >
                  <PopoverTrigger asChild>
                    <Button
                      id={p.id}
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={buscaVeiculo}
                      aria-invalid={p["aria-invalid"]}
                      aria-describedby={
                        p["aria-describedby"]
                      }
                      disabled={
                        vendaveis.length === 0
                      }
                      className="bg-card h-auto min-h-10 w-full justify-between px-3 py-1.5 font-normal"
                    >
                      {veiculo ? (
                        <span className="flex min-w-0 items-center gap-2.5">
                          <VeiculoTile
                            marca={veiculo.marca}
                            cor={veiculo.cor}
                            size="sm"
                          />

                          <span className="min-w-0 text-left leading-tight">
                            <span className="block truncate font-medium">
                              {veiculo.marca}{" "}
                              {veiculo.modelo}
                            </span>

                            <span className="text-muted-foreground tabular block text-[11.5px]">
                              {veiculo.ano} ·{" "}
                              {veiculo.placa ||
                                "sem placa"}{" "}
                              · tabela{" "}
                              {moeda(
                                veiculo.preco
                              )}
                            </span>
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Escolher veículo
                        </span>
                      )}

                      <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="glass shadow-pop w-[var(--radix-popover-trigger-width)] rounded-xl border-0 p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Buscar marca, modelo ou placa" />

                      <CommandList className="scroll-mac max-h-60">
                        <CommandEmpty>
                          Nenhum veículo encontrado.
                        </CommandEmpty>

                        <CommandGroup>
                          {vendaveis.map((v) => (
                            <CommandItem
                              key={v.id}
                              value={`${v.marca} ${v.modelo} ${v.placa} ${v.ano}`}
                              onSelect={() => {
                                setVeiculoId(v.id)

                                if (
                                  !valor ||
                                  (veiculo &&
                                    paraNumero(
                                      valor
                                    ) ===
                                      veiculo.preco)
                                ) {
                                  setValor(
                                    moedaCampo(
                                      v.preco
                                    )
                                  )
                                }

                                setErros((e) => ({
                                  ...e,
                                  veiculo:
                                    undefined,
                                }))

                                setBuscaVeiculo(
                                  false
                                )
                              }}
                            >
                              <StatusDot
                                status={v.status}
                              />

                              <span className="truncate">
                                {v.marca}{" "}
                                {v.modelo}
                              </span>

                              <span className="text-muted-foreground tabular text-xs">
                                {v.ano}
                              </span>

                              <span className="tabular ml-auto text-xs">
                                {moeda(v.preco)}
                              </span>

                              <Check
                                className={cn(
                                  "size-4",
                                  veiculoId ===
                                    v.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </Field>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium">
                  Cliente
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setNovoCliente((v) => !v)

                    setErros((e) => ({
                      ...e,
                      cliente: undefined,
                    }))
                  }}
                  className="text-primary inline-flex items-center gap-1 text-[12.5px] font-medium hover:underline"
                >
                  {novoCliente ? (
                    "Escolher existente"
                  ) : (
                    <>
                      <UserPlus className="size-3.5" />
                      Cadastrar novo
                    </>
                  )}
                </button>
              </div>

              {novoCliente ? (
                <div className="bg-card/60 hairline rounded-xl p-4">
                  <ClienteForm
                    dados={cliente}
                    onChange={setCliente}
                    erros={errosCliente}
                    compacto
                  />
                </div>
              ) : (
                <Field
                  label="Cliente existente"
                  erro={erros.cliente}
                  className="[&>div:first-child]:sr-only"
                >
                  {(p) => (
                    <Popover
                      open={buscaCliente}
                      onOpenChange={
                        setBuscaCliente
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          id={p.id}
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={
                            buscaCliente
                          }
                          aria-invalid={
                            p["aria-invalid"]
                          }
                          aria-describedby={
                            p["aria-describedby"]
                          }
                          className="bg-card h-10 w-full justify-between px-3 font-normal"
                        >
                          {clienteSel ? (
                            <span className="flex min-w-0 items-center gap-2.5">
                              <span className="bg-secondary flex size-7 items-center justify-center rounded-full text-[11px] font-semibold">
                                {iniciais(
                                  clienteSel.nome
                                )}
                              </span>

                              <span className="truncate">
                                {
                                  clienteSel.nome
                                }
                              </span>

                              <span className="text-muted-foreground tabular text-[12px]">
                                {
                                  clienteSel.cpf
                                }
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Buscar por nome
                              ou CPF
                            </span>
                          )}

                          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent
                        className="glass shadow-pop w-[var(--radix-popover-trigger-width)] rounded-xl border-0 p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput placeholder="Nome ou CPF" />

                          <CommandList className="scroll-mac max-h-56">
                            <CommandEmpty>
                              <p className="text-[13px]">
                                Nenhum cliente
                                encontrado.
                              </p>

                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="mt-1"
                                onClick={() => {
                                  setNovoCliente(
                                    true
                                  )

                                  setBuscaCliente(
                                    false
                                  )
                                }}
                              >
                                Cadastrar novo
                                cliente
                              </Button>
                            </CommandEmpty>

                            <CommandGroup>
                              {clientes.map(
                                (c) => (
                                  <CommandItem
                                    key={c.id}
                                    value={`${c.nome} ${c.cpf}`}
                                    onSelect={() => {
                                      setClienteId(
                                        c.id
                                      )

                                      setErros(
                                        (e) => ({
                                          ...e,
                                          cliente:
                                            undefined,
                                        })
                                      )

                                      setBuscaCliente(
                                        false
                                      )
                                    }}
                                  >
                                    <span className="bg-secondary flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                                      {iniciais(
                                        c.nome
                                      )}
                                    </span>

                                    <span className="truncate">
                                      {c.nome}
                                    </span>

                                    <span className="text-muted-foreground tabular ml-auto text-xs">
                                      {c.cpf}
                                    </span>

                                    <Check
                                      className={cn(
                                        "size-4",
                                        clienteId ===
                                          c.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                )
                              )}
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
              <Field
                label="Vendedor"
                erro={erros.vendedor}
                className="sm:col-span-1"
              >
                {(p) => (
                  <Popover
                    open={buscaVendedor}
                    onOpenChange={
                      setBuscaVendedor
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        id={p.id}
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={
                          buscaVendedor
                        }
                        aria-invalid={
                          p["aria-invalid"]
                        }
                        aria-describedby={
                          p["aria-describedby"]
                        }
                        disabled={
                          vendedoresAtivos.length === 0 ||
                          usuarioVendedor
                        }
                        className="bg-card h-10 w-full justify-between px-3 font-normal"
                      >
                        {vendedorSel ? (
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="bg-secondary flex size-6 shrink-0 items-center justify-center rounded-full text-[9.5px] font-semibold">
                              {iniciais(
                                vendedorSel.nome
                              )}
                            </span>

                            <span className="truncate">
                              {
                                vendedorSel.nome
                              }
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground truncate">
                            Selecionar
                          </span>
                        )}

                        {!usuarioVendedor && (
                          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                        )}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent
                      className="glass shadow-pop w-[280px] rounded-xl border-0 p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Buscar vendedor" />

                        <CommandList className="scroll-mac max-h-60">
                          <CommandEmpty>
                            Nenhum vendedor ativo
                            encontrado.
                          </CommandEmpty>

                          <CommandGroup>
                            {vendedoresAtivos.map(
                              (funcionario) => (
                                <CommandItem
                                  key={
                                    funcionario.id
                                  }
                                  value={`${funcionario.nome} ${funcionario.comissao}`}
                                  onSelect={() => {
                                    setVendedor(
                                      funcionario.nome
                                    )

                                    setErros(
                                      (e) => ({
                                        ...e,
                                        vendedor:
                                          undefined,
                                      })
                                    )

                                    setBuscaVendedor(
                                      false
                                    )
                                  }}
                                  className="gap-2.5 py-2"
                                >
                                  <span className="bg-secondary flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
                                    {iniciais(
                                      funcionario.nome
                                    )}
                                  </span>

                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[13px] font-medium">
                                      {
                                        funcionario.nome
                                      }
                                    </span>

                                    <span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                                      <BadgePercent className="size-3" />
                                      Comissão{" "}
                                      {percentual(
                                        funcionario.comissao
                                      )}
                                    </span>
                                  </span>

                                  <Check
                                    className={cn(
                                      "size-4 shrink-0",
                                      vendedor ===
                                        funcionario.nome
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              )
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </Field>

              <Field
                label="Valor da venda"
                erro={erros.valor}
                dica={
                  diferenca !== null &&
                  diferenca !== 0
                    ? `${
                        diferenca < 0
                          ? "Desconto"
                          : "Acima da tabela"
                      } de ${moeda(
                        Math.abs(diferenca)
                      )}`
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
                      onChange={(e) => {
                        setValor(
                          mascaraMoeda(e.target.value)
                        )
                        setErros((atual) => ({
                          ...atual,
                          valor: undefined,
                        }))
                      }}
                      placeholder="0,00"
                    />
                  </div>
                )}
              </Field>

              <Field
                label="Data"
                erro={erros.data}
              >
                {(p) => (
                  <Input
                    {...p}
                    type="date"
                    max={hojeISO()}
                    className="bg-card tabular h-10"
                    value={data}
                    onChange={(e) =>
                      setData(e.target.value)
                    }
                  />
                )}
              </Field>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[13px] font-medium">
                  Forma de pagamento
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11.5px]">
                  Escolha como esta venda será concluída.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormaPagamento("avista")
                    setFinanciamentoId(null)
                    setModoFinanciamento("novo")
                    setConsorcioId(null)
                    setErros((e) => ({
                      ...e,
                      pagamento: undefined,
                    }))
                  }}
                  className={cn(
                    "bg-card hover:bg-accent flex min-h-20 flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                    formaPagamento === "avista" &&
                      "border-primary bg-primary/5"
                  )}
                >
                  <Banknote className="size-4" />
                  <span>
                    <span className="block text-[12.5px] font-medium">
                      À vista
                    </span>
                    <span className="text-muted-foreground block text-[10.5px]">
                      Pagamento direto
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormaPagamento("financiamento")
                    setConsorcioId(null)
                    setModoFinanciamento("novo")
                    setFinanciamentoId(null)
                    setErros((e) => ({
                      ...e,
                      pagamento: undefined,
                    }))
                  }}
                  className={cn(
                    "bg-card hover:bg-accent flex min-h-20 flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                    formaPagamento === "financiamento" &&
                      "border-primary bg-primary/5"
                  )}
                >
                  <Landmark className="size-4" />
                  <span>
                    <span className="block text-[12.5px] font-medium">
                      Financiamento
                    </span>
                    <span className="text-muted-foreground block text-[10.5px]">
                      Novo ou existente
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormaPagamento("consorcio")
                    setFinanciamentoId(null)
                    setErros((e) => ({
                      ...e,
                      pagamento: undefined,
                    }))
                  }}
                  className={cn(
                    "bg-card hover:bg-accent flex min-h-20 flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                    formaPagamento === "consorcio" &&
                      "border-primary bg-primary/5"
                  )}
                >
                  <Handshake className="size-4" />
                  <span>
                    <span className="block text-[12.5px] font-medium">
                      Consórcio
                    </span>
                    <span className="text-muted-foreground block text-[10.5px]">
                      Cota contemplada
                    </span>
                  </span>
                </button>
              </div>

              {formaPagamento === "financiamento" && (
                <div className="space-y-3">
                  <div className="bg-muted/40 grid grid-cols-2 gap-1 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setModoFinanciamento("novo")
                        setFinanciamentoId(null)
                        setErros((e) => ({
                          ...e,
                          pagamento: undefined,
                        }))
                      }}
                      className={cn(
                        "rounded-lg px-3 py-2 text-[12px] font-medium transition-colors",
                        modoFinanciamento === "novo"
                          ? "bg-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Criar novo
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModoFinanciamento("existente")
                        setErros((e) => ({
                          ...e,
                          pagamento: undefined,
                        }))
                      }}
                      className={cn(
                        "rounded-lg px-3 py-2 text-[12px] font-medium transition-colors",
                        modoFinanciamento === "existente"
                          ? "bg-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Usar existente
                    </button>
                  </div>

                  {modoFinanciamento === "existente" ? (
                    <>
                      <Field
                        label="Financiamento vinculado"
                        erro={erros.pagamento}
                        dica={
                          novoCliente
                            ? "Um cliente recém-cadastrado não possui contrato anterior. Use Criar novo."
                            : clienteId === null ||
                                veiculoId === null
                              ? "Selecione primeiro o cliente e o veículo."
                              : financiamentosCompativeis.length === 0
                                ? "Não há contrato aprovado ou ativo para este cliente e veículo. Você pode criar um novo."
                                : undefined
                        }
                      >
                        {(p) => (
                          <select
                            id={p.id}
                            aria-invalid={p["aria-invalid"]}
                            aria-describedby={
                              p["aria-describedby"]
                            }
                            value={financiamentoId ?? ""}
                            onChange={(e) => {
                              const id = Number(
                                e.target.value
                              )

                              setFinanciamentoId(
                                e.target.value
                                  ? id
                                  : null
                              )

                              setErros((atual) => ({
                                ...atual,
                                pagamento: undefined,
                              }))
                            }}
                            disabled={
                              novoCliente ||
                              financiamentosCompativeis.length ===
                                0
                            }
                            className="border-input bg-card h-10 w-full rounded-md border px-3 text-[13px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">
                              Selecione o contrato
                            </option>

                            {financiamentosCompativeis.map(
                              (f) => (
                                <option
                                  key={f.id}
                                  value={f.id}
                                >
                                  #{f.id} · {f.banco} ·{" "}
                                  {f.parcelas}x de{" "}
                                  {moeda(
                                    f.valor_parcela
                                  )}
                                </option>
                              )
                            )}
                          </select>
                        )}
                      </Field>

                      {financiamentoSelecionado && (
                        <div className="bg-card/60 hairline grid gap-2 rounded-xl p-3 text-[11.5px] sm:grid-cols-3">
                          <div>
                            <span className="text-muted-foreground block">
                              Entrada
                            </span>
                            <strong className="tabular">
                              {moeda(
                                financiamentoSelecionado.entrada
                              )}
                            </strong>
                          </div>

                          <div>
                            <span className="text-muted-foreground block">
                              Financiado
                            </span>
                            <strong className="tabular">
                              {moeda(
                                financiamentoSelecionado.valor_financiado
                              )}
                            </strong>
                          </div>

                          <div>
                            <span className="text-muted-foreground block">
                              Parcelamento
                            </span>
                            <strong className="tabular">
                              {
                                financiamentoSelecionado.parcelas
                              }
                              x de{" "}
                              {moeda(
                                financiamentoSelecionado.valor_parcela
                              )}
                            </strong>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Banco"
                          erro={erros.banco}
                        >
                          {(p) => (
                            <select
                              id={p.id}
                              aria-invalid={p["aria-invalid"]}
                              aria-describedby={
                                p["aria-describedby"]
                              }
                              value={bancoFinanciamento}
                              onChange={(e) => {
                                setBancoFinanciamento(
                                  e.target.value
                                )
                                setErros((atual) => ({
                                  ...atual,
                                  banco: undefined,
                                }))
                              }}
                              className="border-input bg-card h-10 w-full rounded-md border px-3 text-[13px] outline-none"
                            >
                              <option value="">
                                Selecione
                              </option>
                              {BANCOS.map((banco) => (
                                <option
                                  key={banco}
                                  value={banco}
                                >
                                  {banco}
                                </option>
                              ))}
                            </select>
                          )}
                        </Field>

                        <Field
                          label="Primeira parcela"
                          erro={erros.inicio}
                        >
                          {(p) => (
                            <Input
                              {...p}
                              type="date"
                              className="bg-card tabular h-10"
                              value={inicioFinanciamento}
                              onChange={(e) => {
                                setInicioFinanciamento(
                                  e.target.value
                                )
                                setErros((atual) => ({
                                  ...atual,
                                  inicio: undefined,
                                }))
                              }}
                            />
                          )}
                        </Field>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field
                          label="Entrada"
                          erro={erros.entrada}
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
                                value={entradaFinanciamento}
                                onChange={(e) => {
                                  setEntradaFinanciamento(
                                    mascaraMoeda(
                                      e.target.value
                                    )
                                  )
                                  setErros((atual) => ({
                                    ...atual,
                                    entrada: undefined,
                                  }))
                                }}
                                placeholder="0,00"
                              />
                            </div>
                          )}
                        </Field>

                        <Field
                          label="Parcelas"
                          erro={erros.parcelas}
                        >
                          {(p) => (
                            <select
                              id={p.id}
                              aria-invalid={p["aria-invalid"]}
                              aria-describedby={
                                p["aria-describedby"]
                              }
                              value={parcelasFinanciamento}
                              onChange={(e) => {
                                setParcelasFinanciamento(
                                  e.target.value
                                )
                                setErros((atual) => ({
                                  ...atual,
                                  parcelas: undefined,
                                }))
                              }}
                              className="border-input bg-card h-10 w-full rounded-md border px-3 text-[13px] outline-none"
                            >
                              {PARCELAS_FINANCIAMENTO.map(
                                (quantidade) => (
                                  <option
                                    key={quantidade}
                                    value={quantidade}
                                  >
                                    {quantidade}x
                                  </option>
                                )
                              )}
                            </select>
                          )}
                        </Field>

                        <Field
                          label="Taxa mensal"
                          erro={erros.taxa}
                        >
                          {(p) => (
                            <div className="relative">
                              <Input
                                {...p}
                                inputMode="decimal"
                                className="bg-card tabular h-10 pr-9"
                                value={taxaFinanciamento}
                                onChange={(e) => {
                                  setTaxaFinanciamento(
                                    mascaraTaxa(
                                      e.target.value
                                    )
                                  )
                                  setErros((atual) => ({
                                    ...atual,
                                    taxa: undefined,
                                  }))
                                }}
                                placeholder="1,89"
                              />

                              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[12px]">
                                %
                              </span>
                            </div>
                          )}
                        </Field>
                      </div>

                      <div className="bg-primary/5 border-primary/10 rounded-xl border p-3.5">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className="text-[12.5px] font-medium">
                              Simulação do financiamento
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-[10.5px]">
                              O contrato será criado junto com a venda.
                            </p>
                          </div>

                          <Landmark className="text-primary size-4" />
                        </div>

                        <div className="grid gap-2 text-[11.5px] sm:grid-cols-2">
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              Valor negociado
                            </span>
                            <strong className="tabular">
                              {valorNum !== null
                                ? moeda(valorNum)
                                : "—"}
                            </strong>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              Entrada
                            </span>
                            <strong className="tabular">
                              {moeda(
                                entradaFinanciamentoNum
                              )}
                            </strong>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              Financiado
                            </span>
                            <strong className="tabular">
                              {moeda(
                                valorFinanciadoNovo
                              )}
                            </strong>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              Juros estimados
                            </span>
                            <strong className="tabular">
                              {moeda(
                                jurosEstimadosNovo
                              )}
                            </strong>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              Total das parcelas
                            </span>
                            <strong className="tabular">
                              {moeda(
                                totalFinanciamentoNovo
                              )}
                            </strong>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              Parcela estimada
                            </span>
                            <strong className="tabular">
                              {valorParcelaNovo > 0
                                ? `${parcelasFinanciamentoNum}x de ${moeda(
                                    valorParcelaNovo
                                  )}`
                                : "—"}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {erros.pagamento && (
                        <p className="text-destructive text-[11.5px]">
                          {erros.pagamento}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {formaPagamento === "consorcio" && (
                <Field
                  label="Cota contemplada"
                  erro={erros.pagamento}
                  dica={
                    novoCliente
                      ? "Um cliente recém-cadastrado ainda não possui cota vinculada."
                      : clienteId === null ||
                          veiculoId === null
                        ? "Selecione primeiro o cliente e o veículo."
                        : consorciosCompativeis.length === 0
                          ? "Não há cota contemplada com crédito suficiente para esta venda."
                          : undefined
                  }
                >
                  {(p) => (
                    <select
                      id={p.id}
                      aria-invalid={p["aria-invalid"]}
                      aria-describedby={
                        p["aria-describedby"]
                      }
                      value={consorcioId ?? ""}
                      onChange={(e) => {
                        const id = Number(
                          e.target.value
                        )

                        setConsorcioId(
                          e.target.value
                            ? id
                            : null
                        )

                        setErros((atual) => ({
                          ...atual,
                          pagamento: undefined,
                        }))
                      }}
                      disabled={
                        novoCliente ||
                        consorciosCompativeis.length ===
                          0
                      }
                      className="border-input bg-card h-10 w-full rounded-md border px-3 text-[13px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        Selecione a cota
                      </option>

                      {consorciosCompativeis.map(
                        (c) => (
                          <option
                            key={c.id}
                            value={c.id}
                          >
                            Cota #{c.numero_cota} ·{" "}
                            {c.administradora} ·{" "}
                            {moeda(c.valor_carta)}
                          </option>
                        )
                      )}
                    </select>
                  )}
                </Field>
              )}

              {formaPagamento ===
                "consorcio" &&
                consorcioSelecionado && (
                  <div className="bg-card/60 hairline grid gap-2 rounded-xl p-3 text-[11.5px] sm:grid-cols-3">
                    <div>
                      <span className="text-muted-foreground block">
                        Cota
                      </span>
                      <strong>
                        #
                        {
                          consorcioSelecionado.numero_cota
                        }
                      </strong>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">
                        Carta
                      </span>
                      <strong className="tabular">
                        {moeda(
                          consorcioSelecionado.valor_carta
                        )}
                      </strong>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">
                        Parcelamento
                      </span>
                      <strong className="tabular">
                        {
                          consorcioSelecionado.parcelas
                        }
                        x de{" "}
                        {moeda(
                          consorcioSelecionado.valor_parcela
                        )}
                      </strong>
                    </div>
                  </div>
                )}
            </div>

            {vendedorSel && (
              <div className="bg-primary/5 border-primary/10 flex items-center justify-between rounded-xl border px-3.5 py-3">
                <div>
                  <p className="text-[12px] font-medium">
                    Comissão desta venda
                  </p>

                  <p className="text-muted-foreground mt-0.5 text-[11.5px]">
                    {vendedorSel.nome} recebe{" "}
                    {percentual(
                      vendedorSel.comissao
                    )}{" "}
                    sobre o valor negociado.
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-muted-foreground text-[10.5px]">
                    Previsão
                  </p>

                  <p className="tabular text-[13px] font-semibold">
                    {valorNum !== null &&
                    valorNum > 0
                      ? moeda(
                          valorNum *
                            (vendedorSel.comissao /
                              100)
                        )
                      : "—"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              className="min-w-32"
              disabled={
                vendaveis.length === 0 ||
                vendedoresAtivos.length === 0
              }
            >
              Registrar venda
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}