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
  GRUPOS_CONSORCIO,
  calcularPlanoConsorcio,
  store,
  useEstado,
  type StatusConsorcio,
  type TipoLanceConsorcio,
} from "@/data/store"
import {
  mascaraMoeda,
  moeda,
  valorDaMascaraMoeda,
} from "@/lib/format"

type Props = {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

const PARCELAS_CONSORCIO = [
  36,
  48,
  60,
  72,
  80,
  100,
  120,
] as const

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

export function ConsorcioSheet({
  aberto,
  onOpenChange,
}: Props) {
  useEstado()
  const { usuario } = useAuth()
  const usuarioVendedor = usuario?.perfil === "vendedor"

  const clientes = store.clientes()
  const vendedores = store.vendedoresAtivos()

  const vendedorAutenticado =
    usuarioVendedor && usuario?.funcionarioId !== null
      ? vendedores.find(
          (funcionario) =>
            funcionario.id === usuario?.funcionarioId
        ) ?? null
      : null

  const [clienteId, setClienteId] = useState("")
  const [vendedor, setVendedor] = useState("")
  const [administradora, setAdministradora] = useState(
    "AutoSystem Consórcios"
  )
  const [grupo, setGrupo] = useState("")
  const [valorCarta, setValorCarta] = useState("")
  const [parcelas, setParcelas] = useState("")
  const [dataAdesao, setDataAdesao] = useState(hojeISO())
  const [status, setStatus] =
    useState<StatusConsorcio>("em_analise")
  const [tipoLance, setTipoLance] =
    useState<TipoLanceConsorcio>("sem_lance")
  const [valorLance, setValorLance] = useState("")

  const [cadastroRapido, setCadastroRapido] = useState(false)
  const [novoCliente, setNovoCliente] =
    useState<ClienteFormDados>(clienteVazio)
  const [errosCliente, setErrosCliente] = useState<
    Partial<Record<keyof ClienteFormDados, string>>
  >({})

  const grupoSelecionado = useMemo(
    () =>
      GRUPOS_CONSORCIO.find(
        (item) => item.codigo === grupo
      ) ?? null,
    [grupo]
  )

  const valorCartaNumero =
    valorDaMascaraMoeda(valorCarta)

  const parcelasNumero = Number(parcelas)

  const valorLanceNumero =
    tipoLance === "sem_lance"
      ? null
      : valorDaMascaraMoeda(valorLance)

  const plano = useMemo(() => {
    if (
      !grupoSelecionado ||
      !valorCartaNumero ||
      valorCartaNumero <= 0 ||
      !parcelasNumero ||
      parcelasNumero <= 0
    ) {
      return null
    }

    return calcularPlanoConsorcio(
      valorCartaNumero,
      grupoSelecionado.taxa_administracao,
      grupoSelecionado.fundo_reserva,
      grupoSelecionado.seguro,
      parcelasNumero
    )
  }, [
    grupoSelecionado,
    valorCartaNumero,
    parcelasNumero,
  ])

  useEffect(() => {
    if (!aberto) return

    setClienteId("")
    setVendedor(
      usuarioVendedor
        ? vendedorAutenticado?.nome ?? ""
        : ""
    )
    setAdministradora("AutoSystem Consórcios")
    setGrupo("")
    setValorCarta("")
    setParcelas("")
    setDataAdesao(hojeISO())
    setStatus("em_analise")
    setTipoLance("sem_lance")
    setValorLance("")
    setCadastroRapido(false)
    setNovoCliente(clienteVazio)
    setErrosCliente({})
  }, [
    aberto,
    usuarioVendedor,
    vendedorAutenticado?.nome,
  ])

  function salvarClienteRapido() {
    const erros = validarCliente(novoCliente)
    setErrosCliente(erros)

    if (Object.keys(erros).length > 0) {
      return
    }

    const cliente = store.criarCliente({
      nome: novoCliente.nome.trim(),
      cpf: novoCliente.cpf.trim(),
      telefone: novoCliente.telefone.trim(),
      email: novoCliente.email.trim(),
    })

    setClienteId(String(cliente.id))
    setCadastroRapido(false)
    setNovoCliente(clienteVazio)
    setErrosCliente({})

    toast.success("Cliente cadastrado", {
      description: `${cliente.nome} foi selecionado no consórcio.`,
    })
  }

  function salvar() {
    if (!clienteId) {
      toast.error("Selecione um cliente.")
      return
    }

    if (!vendedor) {
      toast.error(
        usuarioVendedor
          ? "Seu usuário não está vinculado a um vendedor ativo."
          : "Selecione um vendedor."
      )
      return
    }

    if (
      usuarioVendedor &&
      vendedorAutenticado &&
      vendedor !== vendedorAutenticado.nome
    ) {
      toast.error(
        "Vendedores só podem cadastrar consórcios em seu próprio nome."
      )
      return
    }

    if (!administradora.trim()) {
      toast.error("Informe a administradora.")
      return
    }

    if (!grupoSelecionado) {
      toast.error("Selecione um grupo de consórcio.")
      return
    }

    if (
      !valorCartaNumero ||
      valorCartaNumero <= 0
    ) {
      toast.error("Informe o valor da carta.")
      return
    }

    if (
      valorCartaNumero >
      grupoSelecionado.limite_carta
    ) {
      toast.error(
        "O valor da carta ultrapassa o limite deste grupo.",
        {
          description: `Limite do grupo: ${moeda(
            grupoSelecionado.limite_carta
          )}.`,
        }
      )
      return
    }

    if (
      !parcelasNumero ||
      parcelasNumero <= 0
    ) {
      toast.error("Informe a quantidade de parcelas.")
      return
    }

    if (!dataAdesao) {
      toast.error("Informe a data de adesão.")
      return
    }

    if (
      tipoLance !== "sem_lance" &&
      (!valorLanceNumero ||
        valorLanceNumero <= 0)
    ) {
      toast.error("Informe o valor do lance.")
      return
    }

    if (!plano) {
      toast.error("Não foi possível calcular o plano.")
      return
    }

    const consorcio = store.criarConsorcio({
      cliente_id: Number(clienteId),
      vendedor,
      administradora:
        administradora.trim(),
      grupo: grupoSelecionado.codigo,
      valor_carta: valorCartaNumero,
      taxa_administracao:
        grupoSelecionado.taxa_administracao,
      fundo_reserva:
        grupoSelecionado.fundo_reserva,
      seguro: grupoSelecionado.seguro,
      valor_total_plano:
        plano.valor_total_plano,
      parcelas: parcelasNumero,
      valor_parcela:
        plano.valor_parcela,
      data_adesao: dataAdesao,
      status,
      tipo_lance: tipoLance,
      valor_lance:
        valorLanceNumero,
      veiculo_id: null,
    })

    toast.success("Consórcio cadastrado", {
      description: `Cota #${consorcio.numero_cota} gerada automaticamente.`,
    })

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
            Novo consórcio
          </SheetTitle>

          <SheetDescription>
            Cadastre a proposta. O grupo define as taxas do
            plano e o número da cota será gerado
            automaticamente.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 py-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Participantes
              </h3>

              <p className="text-muted-foreground mt-1 text-xs">
                Cliente e vendedor responsável.
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
                    setClienteId(e.target.value)
                  }
                  className="bg-background border-input h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="">
                    Selecione
                  </option>

                  {clientes.map((cliente) => (
                    <option
                      key={cliente.id}
                      value={cliente.id}
                    >
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Vendedor
                </label>

                <select
                  value={vendedor}
                  onChange={(e) =>
                    setVendedor(e.target.value)
                  }
                  disabled={usuarioVendedor}
                  className="bg-background border-input h-10 w-full rounded-md border px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="">
                    Selecione
                  </option>

                  {vendedores.map(
                    (funcionario) => (
                      <option
                        key={funcionario.id}
                        value={funcionario.nome}
                      >
                        {funcionario.nome} ·{" "}
                        {funcionario.comissao.toLocaleString(
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
              </div>
            </div>

            {!cadastroRapido ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() =>
                  setCadastroRapido(true)
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
                      O novo cliente será selecionado
                      automaticamente.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Fechar cadastro rápido"
                    onClick={() => {
                      setCadastroRapido(false)
                      setNovoCliente(clienteVazio)
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
                    onClick={salvarClienteRapido}
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
                Dados da cota
              </h3>

              <p className="text-muted-foreground mt-1 text-xs">
                Administradora e grupo do plano.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">
                  Administradora
                </label>

                <Input
                  value={administradora}
                  onChange={(e) =>
                    setAdministradora(
                      e.target.value
                    )
                  }
                  placeholder="Nome da administradora"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">
                  Grupo
                </label>

                <select
                  value={grupo}
                  onChange={(e) =>
                    setGrupo(e.target.value)
                  }
                  className="bg-background border-input h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="">
                    Selecione um grupo
                  </option>

                  {GRUPOS_CONSORCIO.map(
                    (item) => (
                      <option
                        key={item.codigo}
                        value={item.codigo}
                      >
                        {item.codigo} ·{" "}
                        {item.descricao}
                      </option>
                    )
                  )}
                </select>
              </div>

              {grupoSelecionado && (
                <div className="bg-muted/40 grid gap-3 rounded-lg border p-3 text-xs sm:col-span-2 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">
                      Limite da carta
                    </p>
                    <p className="mt-1 font-medium">
                      {moeda(
                        grupoSelecionado.limite_carta
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">
                      Taxa administrativa
                    </p>
                    <p className="mt-1 font-medium">
                      {grupoSelecionado.taxa_administracao.toLocaleString(
                        "pt-BR",
                        {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        }
                      )}
                      %
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">
                      Fundo de reserva
                    </p>
                    <p className="mt-1 font-medium">
                      {grupoSelecionado.fundo_reserva.toLocaleString(
                        "pt-BR",
                        {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        }
                      )}
                      %
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">
                      Seguro
                    </p>
                    <p className="mt-1 font-medium">
                      {grupoSelecionado.seguro.toLocaleString(
                        "pt-BR",
                        {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        }
                      )}
                      %
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">
                  Data de adesão
                </label>

                <Input
                  type="date"
                  value={dataAdesao}
                  onChange={(e) =>
                    setDataAdesao(
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Plano financeiro
              </h3>

              <p className="text-muted-foreground mt-1 text-xs">
                A parcela é calculada automaticamente a
                partir da carta, das taxas do grupo e do
                prazo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Valor da carta
                </label>

                <Input
                  inputMode="numeric"
                  value={valorCarta}
                  onChange={(e) =>
                    setValorCarta(
                      mascaraMoeda(
                        e.target.value
                      )
                    )
                  }
                  placeholder="90.000,00"
                />

                {grupoSelecionado &&
                  valorCartaNumero >
                    grupoSelecionado.limite_carta && (
                    <p className="text-destructive text-xs">
                      Este grupo aceita cartas de até{" "}
                      {moeda(
                        grupoSelecionado.limite_carta
                      )}
                      .
                    </p>
                  )}
              </div>

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

                  {PARCELAS_CONSORCIO.map(
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
            </div>

            {plano && grupoSelecionado && (
              <div className="bg-primary/5 border-primary/10 space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground text-sm">
                    Carta de crédito
                  </span>
                  <span className="font-medium">
                    {moeda(valorCartaNumero)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground text-sm">
                    Taxa administrativa
                  </span>
                  <span className="font-medium">
                    {moeda(
                      plano.taxa_administracao_valor
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground text-sm">
                    Fundo de reserva
                  </span>
                  <span className="font-medium">
                    {moeda(
                      plano.fundo_reserva_valor
                    )}
                  </span>
                </div>

                {plano.seguro_valor > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground text-sm">
                      Seguro
                    </span>
                    <span className="font-medium">
                      {moeda(
                        plano.seguro_valor
                      )}
                    </span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold">
                      Custo total do plano
                    </span>
                    <span className="text-base font-semibold">
                      {moeda(
                        plano.valor_total_plano
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span className="text-muted-foreground text-sm">
                      {parcelasNumero} parcelas de
                    </span>
                    <span className="text-primary font-semibold">
                      {moeda(
                        plano.valor_parcela
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Situação
              </h3>

              <p className="text-muted-foreground mt-1 text-xs">
                Status atual e condições de lance.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target
                        .value as StatusConsorcio
                    )
                  }
                  className="bg-background border-input h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="em_analise">
                    Em análise
                  </option>

                  <option value="ativo">
                    Ativo
                  </option>

                  <option value="contemplado">
                    Contemplado
                  </option>

                  <option value="cancelado">
                    Cancelado
                  </option>

                  <option value="encerrado">
                    Encerrado
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Tipo de lance
                </label>

                <select
                  value={tipoLance}
                  onChange={(e) => {
                    const tipo =
                      e.target
                        .value as TipoLanceConsorcio

                    setTipoLance(tipo)

                    if (
                      tipo === "sem_lance"
                    ) {
                      setValorLance("")
                    }
                  }}
                  className="bg-background border-input h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="sem_lance">
                    Sem lance
                  </option>

                  <option value="livre">
                    Lance livre
                  </option>

                  <option value="fixo">
                    Lance fixo
                  </option>
                </select>
              </div>

              {tipoLance !==
                "sem_lance" && (
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">
                    Valor do lance
                  </label>

                  <Input
                    inputMode="numeric"
                    value={valorLance}
                    onChange={(e) =>
                      setValorLance(
                        mascaraMoeda(
                          e.target.value
                        )
                      )
                    }
                    placeholder="15.000,00"
                  />
                </div>
              )}
            </div>
          </section>

          <div className="bg-muted/40 rounded-lg border p-4">
            <p className="text-sm font-medium">
              Número da cota
            </p>

            <p className="text-muted-foreground mt-1 text-xs">
              Será gerado automaticamente no momento do
              cadastro, com verificação para evitar números
              repetidos.
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
            Cadastrar consórcio
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
