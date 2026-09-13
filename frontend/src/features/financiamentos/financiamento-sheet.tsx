import { useEffect, useMemo, useState } from "react"
import { Plus, UserPlus, X } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/auth-context"

import {
  ClienteForm,
  clienteVazio,
  validarCliente,
  type ClienteFormDados,
} from "@/features/clientes/cliente-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  BANCOS,
  PARCELAS_FINANCIAMENTO,
  parcelaPrice,
  store,
  useEstado,
  type StatusFinanciamento,
} from "@/data/store"
import {
  mascaraMoeda,
  moeda,
  numeroParaMascaraMoeda,
  valorDaMascaraMoeda,
} from "@/lib/format"

type Props = {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function taxaParaNumero(valor: string) {
  const normalizado = valor
    .trim()
    .replace(/\./g, "")
    .replace(",", ".")

  const numero = Number(normalizado)

  return Number.isFinite(numero)
    ? numero
    : 0
}

function mascaraTaxa(valor: string) {
  const limpo = valor
    .replace(/[^\d,.]/g, "")
    .replace(/\./g, ",")

  const partes = limpo.split(",")

  if (partes.length <= 1) {
    return partes[0]?.slice(0, 2) ?? ""
  }

  return `${partes[0]?.slice(0, 2) ?? ""},${partes
    .slice(1)
    .join("")
    .slice(0, 4)}`
}

export function FinanciamentoSheet({
  aberto,
  onOpenChange,
}: Props) {
  useEstado()

  const { usuario } = useAuth()
  const vendedores = store.vendedoresAtivos()
  const vendedorLogado =
    usuario?.funcionarioId != null
      ? store.obterFuncionario(usuario.funcionarioId)
      : null
  const vendedorAutenticado = usuario?.perfil === "vendedor"

  const clientes = store.clientes()
  const veiculos = store.listarVeiculos()

  const [clienteId, setClienteId] =
    useState("")
  const [veiculoId, setVeiculoId] =
    useState("")
  const [vendedorId, setVendedorId] =
    useState("")
  const [banco, setBanco] =
    useState("")
  const [valorVeiculo, setValorVeiculo] =
    useState("")
  const [entrada, setEntrada] =
    useState("")
  const [parcelas, setParcelas] =
    useState("")
  const [taxaMensal, setTaxaMensal] =
    useState("")
  const [inicio, setInicio] =
    useState(hojeISO())
  const [status, setStatus] =
    useState<StatusFinanciamento>(
      "em_analise"
    )

  const [
    cadastroRapido,
    setCadastroRapido,
  ] = useState(false)

  const [novoCliente, setNovoCliente] =
    useState<ClienteFormDados>(
      clienteVazio
    )

  const [
    errosCliente,
    setErrosCliente,
  ] = useState<
    Partial<
      Record<
        keyof ClienteFormDados,
        string
      >
    >
  >({})

  const veiculoSelecionado =
    useMemo(
      () =>
        veiculos.find(
          (veiculo) =>
            veiculo.id ===
            Number(veiculoId)
        ) ?? null,
      [veiculoId, veiculos]
    )

  const valorVeiculoNumero =
    valorDaMascaraMoeda(valorVeiculo)

  const entradaNumero =
    valorDaMascaraMoeda(entrada)

  const valorFinanciado =
    Math.max(
      valorVeiculoNumero -
        entradaNumero,
      0
    )

  const parcelasNumero =
    Number(parcelas)

  const taxaMensalPercentual =
    taxaParaNumero(taxaMensal)

  const taxaMensalDecimal =
    taxaMensalPercentual / 100

  const simulacao = useMemo(() => {
    if (
      valorFinanciado <= 0 ||
      parcelasNumero <= 0 ||
      taxaMensalPercentual < 0
    ) {
      return null
    }

    const valorParcela =
      parcelaPrice(
        valorFinanciado,
        taxaMensalDecimal,
        parcelasNumero
      )

    const valorTotal =
      valorParcela *
      parcelasNumero

    return {
      valorParcela:
        Math.round(
          valorParcela * 100
        ) / 100,
      valorTotal:
        Math.round(
          valorTotal * 100
        ) / 100,
      jurosTotais:
        Math.round(
          (valorTotal -
            valorFinanciado) *
            100
        ) / 100,
    }
  }, [
    valorFinanciado,
    parcelasNumero,
    taxaMensalPercentual,
    taxaMensalDecimal,
  ])

  useEffect(() => {
    if (!aberto) return

    setClienteId("")
    setVeiculoId("")
    setVendedorId(
      vendedorAutenticado && vendedorLogado
        ? String(vendedorLogado.id)
        : ""
    )
    setBanco("")
    setValorVeiculo("")
    setEntrada("")
    setParcelas("")
    setTaxaMensal("")
    setInicio(hojeISO())
    setStatus("em_analise")
    setCadastroRapido(false)
    setNovoCliente(clienteVazio)
    setErrosCliente({})
  }, [aberto, vendedorAutenticado, vendedorLogado])

  useEffect(() => {
    if (!veiculoSelecionado) {
      return
    }

    setValorVeiculo(
      numeroParaMascaraMoeda(
        veiculoSelecionado.preco
      )
    )
  }, [veiculoSelecionado])

  function salvarClienteRapido() {
    const erros =
      validarCliente(novoCliente)

    setErrosCliente(erros)

    if (
      Object.keys(erros).length > 0
    ) {
      return
    }

    const cliente =
      store.criarCliente({
        nome: novoCliente.nome.trim(),
        cpf: novoCliente.cpf.trim(),
        telefone:
          novoCliente.telefone.trim(),
        email:
          novoCliente.email.trim(),
      })

    setClienteId(
      String(cliente.id)
    )
    setCadastroRapido(false)
    setNovoCliente(clienteVazio)
    setErrosCliente({})

    toast.success(
      "Cliente cadastrado",
      {
        description: `${cliente.nome} foi selecionado no financiamento.`,
      }
    )
  }

  function salvar() {
    if (!clienteId) {
      toast.error(
        "Selecione um cliente."
      )
      return
    }

    if (!veiculoId) {
      toast.error(
        "Selecione um veículo."
      )
      return
    }

    if (!vendedorId) {
      toast.error(
        "Selecione o vendedor responsável."
      )
      return
    }

    const vendedorSelecionado =
      store.obterFuncionario(
        Number(vendedorId)
      )

    if (
      !vendedorSelecionado ||
      vendedorSelecionado.status !== "ativo" ||
      vendedorSelecionado.cargo !== "vendedor"
    ) {
      toast.error(
        "Selecione um vendedor ativo."
      )
      return
    }

    if (
      vendedorAutenticado &&
      vendedorLogado?.id !==
        vendedorSelecionado.id
    ) {
      toast.error(
        "Vendedores só podem cadastrar financiamentos em seu próprio nome."
      )
      return
    }

    if (!banco) {
      toast.error(
        "Selecione o banco."
      )
      return
    }

    if (
      valorVeiculoNumero <= 0
    ) {
      toast.error(
        "Informe o valor do veículo."
      )
      return
    }

    if (entradaNumero < 0) {
      toast.error(
        "A entrada não pode ser negativa."
      )
      return
    }

    if (
      entradaNumero >=
      valorVeiculoNumero
    ) {
      toast.error(
        "A entrada deve ser menor que o valor do veículo."
      )
      return
    }

    if (
      valorFinanciado <= 0
    ) {
      toast.error(
        "O valor financiado deve ser maior que zero."
      )
      return
    }

    if (!parcelasNumero) {
      toast.error(
        "Selecione a quantidade de parcelas."
      )
      return
    }

    if (
      taxaMensalPercentual < 0
    ) {
      toast.error(
        "A taxa mensal não pode ser negativa."
      )
      return
    }

    if (!inicio) {
      toast.error(
        "Informe a data da primeira parcela."
      )
      return
    }

    const resultado =
      store.criarFinanciamento({
        cliente_id:
          Number(clienteId),
        veiculo_id:
          Number(veiculoId),
        vendedor:
          vendedorSelecionado.nome,
        banco,
        valor_veiculo:
          valorVeiculoNumero,
        entrada: entradaNumero,
        valor_financiado:
          valorFinanciado,
        parcelas:
          parcelasNumero,
        taxa_mensal:
          taxaMensalDecimal,
        inicio,
        status,
      })

    if ("erro" in resultado) {
      toast.error(
        "Não foi possível cadastrar o financiamento.",
        {
          description:
            resultado.erro,
        }
      )
      return
    }

    toast.success(
      "Financiamento cadastrado",
      {
        description: `Contrato #${String(
          resultado.id
        ).padStart(
          4,
          "0"
        )} criado com sucesso.`,
      }
    )

    onOpenChange(false)
  }

  return (
    <Sheet
      open={aberto}
      onOpenChange={onOpenChange}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            Novo financiamento
          </SheetTitle>

          <SheetDescription>
            Cadastre a proposta e simule
            automaticamente as parcelas pela
            Tabela Price.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 py-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Cliente e veículo
              </h3>

              <p className="text-muted-foreground mt-1 text-xs">
                Selecione quem está financiando e
                o veículo vinculado ao contrato.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Cliente
                </label>

                <select
                  value={clienteId}
                  onChange={(e) =>
                    setClienteId(
                      e.target.value
                    )
                  }
                  className="bg-background border-input h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="">
                    Selecione
                  </option>

                  {clientes.map(
                    (cliente) => (
                      <option
                        key={cliente.id}
                        value={cliente.id}
                      >
                        {cliente.nome}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Veículo
                </label>

                <select
                  value={veiculoId}
                  onChange={(e) =>
                    setVeiculoId(
                      e.target.value
                    )
                  }
                  className="bg-background border-input h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="">
                    Selecione
                  </option>

                  {veiculos.map(
                    (veiculo) => (
                      <option
                        key={veiculo.id}
                        value={veiculo.id}
                      >
                        {veiculo.marca}{" "}
                        {veiculo.modelo} ·{" "}
                        {veiculo.ano}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Vendedor responsável
              </label>

              <select
                value={vendedorId}
                onChange={(e) =>
                  setVendedorId(
                    e.target.value
                  )
                }
                disabled={vendedorAutenticado}
                className="bg-background border-input h-10 w-full rounded-md border px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">
                  Selecione
                </option>

                {vendedores.map(
                  (vendedor) => (
                    <option
                      key={vendedor.id}
                      value={vendedor.id}
                    >
                      {vendedor.nome} ·{" "}
                      {vendedor.comissao.toLocaleString(
                        "pt-BR",
                        {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        }
                      )}
                      %
                    </option>
                  )
                )}
              </select>

              {vendedorAutenticado && (
                <p className="text-muted-foreground text-xs">
                  O responsável é definido automaticamente pela sua conta.
                </p>
              )}
            </div>

            {!cadastroRapido ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() =>
                  setCadastroRapido(
                    true
                  )
                }
              >
                <UserPlus className="size-4" />
                Cadastrar cliente rápido
              </Button>
            ) : (
              <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      Cadastro rápido de cliente
                    </p>

                    <p className="text-muted-foreground mt-0.5 text-xs">
                      O novo cliente será
                      selecionado automaticamente.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Fechar cadastro rápido"
                    onClick={() => {
                      setCadastroRapido(
                        false
                      )
                      setNovoCliente(
                        clienteVazio
                      )
                      setErrosCliente({})
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <ClienteForm
                  dados={novoCliente}
                  onChange={(dados) => {
                    setNovoCliente(dados)
                    setErrosCliente({})
                  }}
                  erros={errosCliente}
                  compacto
                />

                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={
                      salvarClienteRapido
                    }
                  >
                    <Plus className="size-4" />
                    Salvar cliente
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Instituição e contrato
              </h3>

              <p className="text-muted-foreground mt-1 text-xs">
                Banco responsável, início das
                parcelas e situação da proposta.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">
                  Banco
                </label>

                <select
                  value={banco}
                  onChange={(e) =>
                    setBanco(
                      e.target.value
                    )
                  }
                  className="bg-background border-input h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="">
                    Selecione um banco
                  </option>

                  {BANCOS.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Primeira parcela
                </label>

                <Input
                  type="date"
                  value={inicio}
                  onChange={(e) =>
                    setInicio(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target
                        .value as StatusFinanciamento
                    )
                  }
                  className="bg-background border-input h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="em_analise">
                    Em análise
                  </option>

                  <option value="aprovado">
                    Aprovado
                  </option>

                  <option value="ativo">
                    Ativo
                  </option>

                  <option value="quitado">
                    Quitado
                  </option>

                  <option value="cancelado">
                    Cancelado
                  </option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Valores
              </h3>

              <p className="text-muted-foreground mt-1 text-xs">
                O valor financiado é calculado
                automaticamente descontando a
                entrada.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Valor do veículo
                </label>

                <Input
                  inputMode="numeric"
                  value={valorVeiculo}
                  onChange={(e) =>
                    setValorVeiculo(
                      mascaraMoeda(
                        e.target.value
                      )
                    )
                  }
                  placeholder="90.000,00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Entrada
                </label>

                <Input
                  inputMode="numeric"
                  value={entrada}
                  onChange={(e) =>
                    setEntrada(
                      mascaraMoeda(
                        e.target.value
                      )
                    )
                  }
                  placeholder="20.000,00"
                />
              </div>
            </div>

            <div className="bg-muted/40 rounded-lg border p-4">
              <p className="text-muted-foreground text-xs">
                Valor financiado
              </p>

              <p className="mt-1 text-xl font-semibold">
                {moeda(
                  valorFinanciado
                )}
              </p>

              {entradaNumero >=
                valorVeiculoNumero &&
                valorVeiculoNumero >
                  0 && (
                  <p className="text-destructive mt-2 text-xs">
                    A entrada deve ser menor
                    que o valor do veículo.
                  </p>
                )}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Condições do financiamento
              </h3>

              <p className="text-muted-foreground mt-1 text-xs">
                Informe o prazo e a taxa mensal
                para calcular a prestação pela
                Tabela Price.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Parcelas
                </label>

                <select
                  value={parcelas}
                  onChange={(e) =>
                    setParcelas(
                      e.target.value
                    )
                  }
                  className="bg-background border-input h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="">
                    Selecione
                  </option>

                  {PARCELAS_FINANCIAMENTO.map(
                    (quantidade) => (
                      <option
                        key={quantidade}
                        value={quantidade}
                      >
                        {quantidade} parcelas
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Taxa mensal (%)
                </label>

                <Input
                  inputMode="decimal"
                  value={taxaMensal}
                  onChange={(e) =>
                    setTaxaMensal(
                      mascaraTaxa(
                        e.target.value
                      )
                    )
                  }
                  placeholder="1,89"
                />

                <p className="text-muted-foreground text-xs">
                  Ex.: 1,89 para 1,89% ao mês.
                </p>
              </div>
            </div>

            {simulacao && (
              <div className="bg-primary/5 border-primary/10 space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground text-sm">
                    Valor do veículo
                  </span>

                  <span className="font-medium">
                    {moeda(
                      valorVeiculoNumero
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground text-sm">
                    Entrada
                  </span>

                  <span className="font-medium">
                    {moeda(
                      entradaNumero
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground text-sm">
                    Valor financiado
                  </span>

                  <span className="font-medium">
                    {moeda(
                      valorFinanciado
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground text-sm">
                    Taxa mensal
                  </span>

                  <span className="font-medium">
                    {taxaMensalPercentual.toLocaleString(
                      "pt-BR",
                      {
                        minimumFractionDigits:
                          2,
                        maximumFractionDigits:
                          4,
                      }
                    )}
                    %
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground text-sm">
                    Juros estimados
                  </span>

                  <span className="font-medium">
                    {moeda(
                      simulacao.jurosTotais
                    )}
                  </span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold">
                      Total das parcelas
                    </span>

                    <span className="text-base font-semibold">
                      {moeda(
                        simulacao.valorTotal
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span className="text-muted-foreground text-sm">
                      {parcelasNumero} parcelas
                      de
                    </span>

                    <span className="text-primary font-semibold">
                      {moeda(
                        simulacao.valorParcela
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className="bg-muted/40 rounded-lg border p-4">
            <p className="text-sm font-medium">
              Cálculo automático
            </p>

            <p className="text-muted-foreground mt-1 text-xs">
              O sistema calcula a prestação e o
              custo total a partir do valor
              financiado, taxa mensal e prazo
              selecionado.
            </p>
          </div>
        </div>

        <SheetFooter className="border-t">
          <Button
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancelar
          </Button>

          <Button onClick={salvar}>
            Cadastrar financiamento
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
