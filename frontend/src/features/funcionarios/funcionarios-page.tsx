import { useMemo, useState } from "react"
import {
  BadgePercent,
  BriefcaseBusiness,
  KeyRound,
  Mail,
  Pencil,
  ShieldCheck,
  Phone,
  Plus,
  Search,
  UserCheck,
  UserRound,
  UserX,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth, type PerfilUsuario } from "@/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ROTULO_CARGO,
  store,
  useEstado,
  type CargoFuncionario,
  type Funcionario,
  type StatusFuncionario,
} from "@/data/store"
import { mascaraCPF, mascaraTelefone } from "@/lib/format"

function dataBR(data: string) {
  if (!data) {
    return "—"
  }

  const [ano, mes, dia] = data.split("-")

  return `${dia}/${mes}/${ano}`
}

function percentual(valor: number) {
  return `${valor.toFixed(2).replace(".", ",")}%`
}

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase()
}

export function FuncionariosPage() {
  const estado = useEstado()

  const {
    usuario,
    criarUsuarioParaFuncionario,
    usuarioDoFuncionario,
  } = useAuth()

  const administrador = usuario?.perfil === "admin"

  const [busca, setBusca] = useState("")
  const [status, setStatus] = useState<
    StatusFuncionario | "todos"
  >("todos")

  const [aberto, setAberto] = useState(false)

  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [cargo, setCargo] =
    useState<CargoFuncionario>("vendedor")
  const [comissao, setComissao] = useState("1.5")
  const [statusNovo, setStatusNovo] =
    useState<StatusFuncionario>("ativo")
  const [dataAdmissao, setDataAdmissao] = useState("")

  const [criarAcesso, setCriarAcesso] = useState(false)
  const [perfilAcesso, setPerfilAcesso] =
    useState<PerfilUsuario>("vendedor")
  const [senhaInicial, setSenhaInicial] = useState("")
  const [confirmarSenhaInicial, setConfirmarSenhaInicial] =
    useState("")

  const [funcionarioSelecionado, setFuncionarioSelecionado] =
    useState<Funcionario | null>(null)

  const [editando, setEditando] = useState(false)

  const [nomeEdicao, setNomeEdicao] = useState("")
  const [cpfEdicao, setCpfEdicao] = useState("")
  const [telefoneEdicao, setTelefoneEdicao] = useState("")
  const [emailEdicao, setEmailEdicao] = useState("")
  const [cargoEdicao, setCargoEdicao] =
    useState<CargoFuncionario>("vendedor")
  const [comissaoEdicao, setComissaoEdicao] = useState("1.5")
  const [statusEdicao, setStatusEdicao] =
    useState<StatusFuncionario>("ativo")
  const [dataAdmissaoEdicao, setDataAdmissaoEdicao] =
    useState("")

  const funcionarios = store.funcionarios()

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return store.funcionarios().filter((funcionario) => {
      const cargoRotulo =
        ROTULO_CARGO[funcionario.cargo].toLowerCase()

      const correspondeBusca =
        termo === "" ||
        funcionario.nome.toLowerCase().includes(termo) ||
        funcionario.cpf.toLowerCase().includes(termo) ||
        cargoRotulo.includes(termo)

      const correspondeStatus =
        status === "todos" ||
        funcionario.status === status

      return correspondeBusca && correspondeStatus
    })
  }, [busca, status, estado])

  const ativos = funcionarios.filter(
    (funcionario) => funcionario.status === "ativo"
  ).length

  const vendedoresAtivos = store.vendedoresAtivos()

  const mediaComissao =
    vendedoresAtivos.length > 0
      ? vendedoresAtivos.reduce(
          (soma, funcionario) =>
            soma + funcionario.comissao,
          0
        ) / vendedoresAtivos.length
      : 0

  const limparFormulario = () => {
    setNome("")
    setCpf("")
    setTelefone("")
    setEmail("")
    setCargo("vendedor")
    setComissao("1.5")
    setStatusNovo("ativo")
    setDataAdmissao("")
    setCriarAcesso(false)
    setPerfilAcesso("vendedor")
    setSenhaInicial("")
    setConfirmarSenhaInicial("")
  }

  const alterarCargo = (
    novoCargo: CargoFuncionario
  ) => {
    setCargo(novoCargo)

    if (novoCargo === "gerente") {
      setPerfilAcesso("gerente")
    } else if (novoCargo === "vendedor") {
      setPerfilAcesso("vendedor")
    } else {
      setPerfilAcesso(administrador ? "admin" : "vendedor")
    }

    if (novoCargo === "vendedor") {
      if (
        comissao.trim() === "" ||
        Number(comissao.replace(",", ".")) === 0
      ) {
        setComissao("1.5")
      }
    } else {
      setComissao("0")
    }
  }

  const alterarCargoEdicao = (
    novoCargo: CargoFuncionario
  ) => {
    setCargoEdicao(novoCargo)

    if (novoCargo === "vendedor") {
      if (
        comissaoEdicao.trim() === "" ||
        Number(
          comissaoEdicao.replace(",", ".")
        ) === 0
      ) {
        setComissaoEdicao("1.5")
      }
    } else {
      setComissaoEdicao("0")
    }
  }

  const cadastrarFuncionario = (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    const percentualComissao =
      cargo === "vendedor"
        ? Number(comissao.replace(",", "."))
        : 0

    if (
      !nome.trim() ||
      !cpf.trim() ||
      !telefone.trim() ||
      !dataAdmissao ||
      Number.isNaN(percentualComissao) ||
      percentualComissao < 0
    ) {
      toast.error(
        "Preencha corretamente os campos obrigatórios."
      )

      return
    }

    if (store.cpfFuncionarioEmUso(cpf)) {
      toast.error(
        "Já existe um funcionário cadastrado com este CPF."
      )

      return
    }

    if (criarAcesso) {
      if (!administrador && perfilAcesso === "admin") {
        toast.error(
          "Somente administradores podem criar contas com perfil de Administrador."
        )

        return
      }

      if (!email.trim()) {
        toast.error(
          "Informe o e-mail do funcionário para criar o acesso ao AutoSystem."
        )

        return
      }

      if (senhaInicial.length < 6) {
        toast.error(
          "A senha inicial deve ter pelo menos 6 caracteres."
        )

        return
      }

      if (senhaInicial !== confirmarSenhaInicial) {
        toast.error(
          "A confirmação da senha inicial não confere."
        )

        return
      }
    }

    const funcionario = store.criarFuncionario({
      nome: nome.trim(),
      cpf: cpf.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      cargo,
      comissao: percentualComissao,
      status: statusNovo,
      data_admissao: dataAdmissao,
    })

    if (criarAcesso) {
      const resultadoAcesso =
        criarUsuarioParaFuncionario(
          funcionario.id,
          {
            email: email.trim(),
            senha: senhaInicial,
            perfil: perfilAcesso,
            ativo:
              statusNovo === "ativo",
          }
        )

      if (!resultadoAcesso.sucesso) {
        toast.error(
          "Funcionário cadastrado, mas o acesso não foi criado.",
          {
            description:
              resultadoAcesso.mensagem,
          }
        )
      } else {
        toast.success(
          "Funcionário e acesso cadastrados",
          {
            description: `${funcionario.nome} já pode entrar no AutoSystem.`,
          }
        )
      }
    } else {
      toast.success("Funcionário cadastrado", {
        description: `${funcionario.nome} foi adicionado à equipe.`,
      })
    }

    limparFormulario()
    setAberto(false)
  }

  const abrirFuncionario = (
    funcionario: Funcionario
  ) => {
    setFuncionarioSelecionado(funcionario)
    setEditando(false)

    setNomeEdicao(funcionario.nome)
    setCpfEdicao(funcionario.cpf)
    setTelefoneEdicao(funcionario.telefone)
    setEmailEdicao(funcionario.email)
    setCargoEdicao(funcionario.cargo)
    setComissaoEdicao(
      funcionario.comissao.toString()
    )
    setStatusEdicao(funcionario.status)
    setDataAdmissaoEdicao(
      funcionario.data_admissao
    )
  }

  const fecharFuncionario = () => {
    setFuncionarioSelecionado(null)
    setEditando(false)
  }

  const salvarEdicao = (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    if (!funcionarioSelecionado) {
      return
    }

    const percentualComissao =
      cargoEdicao === "vendedor"
        ? Number(
            comissaoEdicao.replace(",", ".")
          )
        : 0

    if (
      !nomeEdicao.trim() ||
      !cpfEdicao.trim() ||
      !telefoneEdicao.trim() ||
      !dataAdmissaoEdicao ||
      Number.isNaN(percentualComissao) ||
      percentualComissao < 0
    ) {
      toast.error(
        "Preencha corretamente os campos obrigatórios."
      )

      return
    }

    if (
      store.cpfFuncionarioEmUso(
        cpfEdicao,
        funcionarioSelecionado.id
      )
    ) {
      toast.error(
        "Já existe outro funcionário cadastrado com este CPF."
      )

      return
    }

    store.atualizarFuncionario(
      funcionarioSelecionado.id,
      {
        nome: nomeEdicao.trim(),
        cpf: cpfEdicao.trim(),
        telefone: telefoneEdicao.trim(),
        email: emailEdicao.trim(),
        cargo: cargoEdicao,
        comissao: percentualComissao,
        status: statusEdicao,
        data_admissao: dataAdmissaoEdicao,
      }
    )

    const atualizado = store.obterFuncionario(
      funcionarioSelecionado.id
    )

    if (atualizado) {
      setFuncionarioSelecionado(atualizado)
    }

    setEditando(false)

    toast.success("Funcionário atualizado", {
      description: `${nomeEdicao.trim()} teve os dados atualizados.`,
    })
  }

  const alternarStatus = () => {
    if (!funcionarioSelecionado) {
      return
    }

    const novoStatus: StatusFuncionario =
      funcionarioSelecionado.status === "ativo"
        ? "inativo"
        : "ativo"

    store.atualizarFuncionario(
      funcionarioSelecionado.id,
      {
        nome: funcionarioSelecionado.nome,
        cpf: funcionarioSelecionado.cpf,
        telefone: funcionarioSelecionado.telefone,
        email: funcionarioSelecionado.email,
        cargo: funcionarioSelecionado.cargo,
        comissao:
          funcionarioSelecionado.comissao,
        status: novoStatus,
        data_admissao:
          funcionarioSelecionado.data_admissao,
      }
    )

    const atualizado = store.obterFuncionario(
      funcionarioSelecionado.id
    )

    if (atualizado) {
      setFuncionarioSelecionado(atualizado)
      setStatusEdicao(atualizado.status)
    }

    if (novoStatus === "ativo") {
      toast.success("Funcionário ativado", {
        description: `${funcionarioSelecionado.nome} está ativo novamente.`,
      })
    } else {
      toast.success("Funcionário inativado", {
        description: `${funcionarioSelecionado.nome} não aparecerá em novas vendas enquanto estiver inativo.`,
      })
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-card shadow-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <Users className="size-5" />
            </div>

            <div>
              <p className="text-muted-foreground text-[12px]">
                Funcionários
              </p>

              <p className="text-[21px] font-semibold">
                {funcionarios.length}
              </p>

              <p className="text-muted-foreground text-[11.5px]">
                Total cadastrado
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card shadow-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-success/10 text-success-foreground flex size-10 items-center justify-center rounded-xl">
              <UserRound className="size-5" />
            </div>

            <div>
              <p className="text-muted-foreground text-[12px]">
                Ativos
              </p>

              <p className="text-[21px] font-semibold">
                {ativos}
              </p>

              <p className="text-muted-foreground text-[11.5px]">
                Funcionários ativos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card shadow-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-secondary text-foreground flex size-10 items-center justify-center rounded-xl">
              <BriefcaseBusiness className="size-5" />
            </div>

            <div>
              <p className="text-muted-foreground text-[12px]">
                Vendedores
              </p>

              <p className="text-[21px] font-semibold">
                {vendedoresAtivos.length}
              </p>

              <p className="text-muted-foreground text-[11.5px]">
                Vendedores ativos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card shadow-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-warning/10 text-warning-foreground flex size-10 items-center justify-center rounded-xl">
              <BadgePercent className="size-5" />
            </div>

            <div>
              <p className="text-muted-foreground text-[12px]">
                Comissão média
              </p>

              <p className="text-[21px] font-semibold">
                {percentual(mediaComissao)}
              </p>

              <p className="text-muted-foreground text-[11.5px]">
                Entre vendedores ativos
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-80">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />

          <Input
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
            placeholder="Buscar por nome, CPF ou cargo"
            className="bg-card h-8 pl-8 text-[13px]"
          />
        </div>

        <Select
          value={status}
          onValueChange={(valor) =>
            setStatus(
              valor as StatusFuncionario | "todos"
            )
          }
        >
          <SelectTrigger className="bg-card h-8 w-36 text-[13px]">
            <SelectValue />
          </SelectTrigger>

          <SelectContent className="glass shadow-pop">
            <SelectItem value="todos">
              Todos
            </SelectItem>

            <SelectItem value="ativo">
              Ativos
            </SelectItem>

            <SelectItem value="inativo">
              Inativos
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          className="ml-auto"
          size="sm"
          onClick={() => setAberto(true)}
        >
          <Plus className="size-4" />
          Cadastrar funcionário
        </Button>
      </div>

      <div className="bg-card shadow-card overflow-hidden rounded-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="text-[14px] font-semibold">
              Equipe
            </h2>

            <p className="text-muted-foreground mt-0.5 text-[12px]">
              Funcionários cadastrados na concessionária
            </p>
          </div>

          <p className="text-muted-foreground text-[12px]">
            {lista.length}{" "}
            {lista.length === 1
              ? "resultado"
              : "resultados"}
          </p>
        </div>

        <div className="scroll-mac overflow-x-auto border-t">
          <Table className="text-[13px]">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 dark:bg-white/3 [&>th]:text-muted-foreground [&>th]:h-10 [&>th]:text-[12px] [&>th]:font-medium">
                <TableHead className="pl-4">
                  Funcionário
                </TableHead>

                <TableHead>
                  Contato
                </TableHead>

                <TableHead>
                  Cargo
                </TableHead>

                <TableHead>
                  Admissão
                </TableHead>

                <TableHead className="text-right">
                  Comissão
                </TableHead>

                <TableHead>
                  Status
                </TableHead>

                <TableHead className="pr-4 text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {lista.map((funcionario) => (
                <TableRow key={funcionario.id}>
                  <TableCell className="py-2.5 pl-4">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-secondary flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                        {iniciais(funcionario.nome)}
                      </div>

                      <div className="min-w-0 leading-tight">
                        <p className="truncate font-medium">
                          {funcionario.nome}
                        </p>

                        <p className="text-muted-foreground mt-0.5 text-[11.5px]">
                          {funcionario.cpf}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Phone className="text-muted-foreground size-3" />
                        {funcionario.telefone}
                      </p>

                      {funcionario.email && (
                        <p className="text-muted-foreground flex items-center gap-1.5 text-[11.5px]">
                          <Mail className="size-3" />
                          {funcionario.email}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {ROTULO_CARGO[
                      funcionario.cargo
                    ]}
                  </TableCell>

                  <TableCell className="tabular">
                    {dataBR(
                      funcionario.data_admissao
                    )}
                  </TableCell>

                  <TableCell className="tabular text-right font-medium">
                    {funcionario.cargo === "vendedor"
                      ? percentual(
                          funcionario.comissao
                        )
                      : "—"}
                  </TableCell>

                  <TableCell>
                    <span
                      className={
                        funcionario.status === "ativo"
                          ? "bg-success/10 text-success-foreground inline-flex rounded-full px-2 py-1 text-[11px] font-medium"
                          : "bg-muted text-muted-foreground inline-flex rounded-full px-2 py-1 text-[11px] font-medium"
                      }
                    >
                      {funcionario.status === "ativo"
                        ? "Ativo"
                        : "Inativo"}
                    </span>
                  </TableCell>

                  <TableCell className="pr-4 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-[12px]"
                      onClick={() =>
                        abrirFuncionario(
                          funcionario
                        )
                      }
                    >
                      Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {lista.length === 0 && (
          <div className="text-muted-foreground px-4 py-10 text-center text-[13px]">
            Nenhum funcionário encontrado.
          </div>
        )}
      </div>

      <Sheet
        open={aberto}
        onOpenChange={(novoEstado) => {
          setAberto(novoEstado)

          if (!novoEstado) {
            limparFormulario()
          }
        }}
      >
        <SheetContent className="glass shadow-pop flex w-full flex-col gap-0 border-l-0 p-0 sm:max-w-[520px]">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>
              Cadastrar funcionário
            </SheetTitle>

            <SheetDescription>
              Adicione um novo integrante à equipe da
              concessionária.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={cadastrarFuncionario}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="scroll-mac flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="nome-funcionario">
                  Nome completo
                </Label>

                <Input
                  id="nome-funcionario"
                  value={nome}
                  onChange={(event) =>
                    setNome(event.target.value)
                  }
                  placeholder="Nome do funcionário"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf-funcionario">
                  CPF
                </Label>

                <Input
                  id="cpf-funcionario"
                  value={cpf}
                  onChange={(event) =>
                    setCpf(mascaraCPF(event.target.value))
                  }
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefone-funcionario">
                    Telefone
                  </Label>

                  <Input
                    id="telefone-funcionario"
                    value={telefone}
                    onChange={(event) =>
                      setTelefone(mascaraTelefone(event.target.value))
                    }
                    placeholder="(00) 00000-0000"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-admissao">
                    Data de admissão
                  </Label>

                  <Input
                    id="data-admissao"
                    type="date"
                    value={dataAdmissao}
                    onChange={(event) =>
                      setDataAdmissao(
                        event.target.value
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-funcionario">
                  E-mail

                  <span className="text-muted-foreground ml-1 font-normal">
                    opcional
                  </span>
                </Label>

                <Input
                  id="email-funcionario"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="nome@email.com"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Cargo
                  </Label>

                  <Select
                    value={cargo}
                    onValueChange={(valor) =>
                      alterarCargo(
                        valor as CargoFuncionario
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent className="glass shadow-pop">
                      <SelectItem value="gerente">
                        Gerente
                      </SelectItem>

                      <SelectItem value="vendedor">
                        Vendedor(a)
                      </SelectItem>

                      <SelectItem value="financeiro">
                        Financeiro
                      </SelectItem>

                      <SelectItem value="administrativo">
                        Administrativo
                      </SelectItem>

                      <SelectItem value="mecanico">
                        Mecânico
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comissao-funcionario">
                    Comissão (%)
                  </Label>

                  <Input
                    id="comissao-funcionario"
                    inputMode="decimal"
                    value={comissao}
                    onChange={(event) =>
                      setComissao(
                        event.target.value
                      )
                    }
                    placeholder="1,50"
                    disabled={
                      cargo !== "vendedor"
                    }
                    required={
                      cargo === "vendedor"
                    }
                  />

                  <p className="text-muted-foreground text-[11.5px]">
                    {cargo === "vendedor"
                      ? "Percentual aplicado sobre as vendas realizadas."
                      : "Este cargo não utiliza comissão de venda."}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Status
                </Label>

                <Select
                  value={statusNovo}
                  onValueChange={(valor) =>
                    setStatusNovo(
                      valor as StatusFuncionario
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="glass shadow-pop">
                    <SelectItem value="ativo">
                      Ativo
                    </SelectItem>

                    <SelectItem value="inativo">
                      Inativo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-dashed p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <KeyRound className="size-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">
                      Acesso ao AutoSystem
                    </p>

                    <p className="text-muted-foreground mt-0.5 text-[11.5px]">
                      Crie uma conta de login vinculada a este funcionário.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Permitir acesso ao sistema
                    </Label>

                    <Select
                      value={criarAcesso ? "sim" : "nao"}
                      onValueChange={(valor) =>
                        setCriarAcesso(valor === "sim")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent className="glass shadow-pop">
                        <SelectItem value="nao">
                          Não
                        </SelectItem>

                        <SelectItem value="sim">
                          Sim
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {criarAcesso && (
                    <>
                      <div className="space-y-2">
                        <Label>
                          Perfil de acesso
                        </Label>

                        <Select
                          value={perfilAcesso}
                          onValueChange={(valor) =>
                            setPerfilAcesso(
                              valor as PerfilUsuario
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent className="glass shadow-pop">
                            {administrador && (
                              <SelectItem value="admin">
                                Administrador
                              </SelectItem>
                            )}

                            <SelectItem value="gerente">
                              Gerente
                            </SelectItem>

                            <SelectItem value="vendedor">
                              Vendedor
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <p className="text-muted-foreground text-[11.5px]">
                          O perfil controla o nível de acesso e pode ser diferente do cargo.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email-acesso-funcionario">
                          E-mail de acesso
                        </Label>

                        <Input
                          id="email-acesso-funcionario"
                          type="email"
                          value={email}
                          onChange={(event) =>
                            setEmail(event.target.value)
                          }
                          placeholder="nome@empresa.com.br"
                          required={criarAcesso}
                        />

                        <p className="text-muted-foreground text-[11.5px]">
                          É o mesmo e-mail informado nos dados do funcionário.
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="senha-inicial-funcionario">
                            Senha inicial
                          </Label>

                          <Input
                            id="senha-inicial-funcionario"
                            type="password"
                            value={senhaInicial}
                            onChange={(event) =>
                              setSenhaInicial(
                                event.target.value
                              )
                            }
                            autoComplete="new-password"
                            placeholder="Mínimo 6 caracteres"
                            required={criarAcesso}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmar-senha-inicial-funcionario">
                            Confirmar senha
                          </Label>

                          <Input
                            id="confirmar-senha-inicial-funcionario"
                            type="password"
                            value={confirmarSenhaInicial}
                            onChange={(event) =>
                              setConfirmarSenhaInicial(
                                event.target.value
                              )
                            }
                            autoComplete="new-password"
                            required={criarAcesso}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <SheetFooter className="flex-row items-center justify-end gap-2 border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setAberto(false)
                }
              >
                Cancelar
              </Button>

              <Button type="submit">
                <Plus className="size-4" />
                Cadastrar funcionário
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet
        open={funcionarioSelecionado !== null}
        onOpenChange={(novoEstado) => {
          if (!novoEstado) {
            fecharFuncionario()
          }
        }}
      >
        <SheetContent className="glass shadow-pop flex w-full flex-col gap-0 border-l-0 p-0 sm:max-w-[520px]">
          {funcionarioSelecionado && (
            <>
              <SheetHeader className="border-b px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="bg-secondary flex size-11 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold">
                    {iniciais(
                      funcionarioSelecionado.nome
                    )}
                  </div>

                  <div className="min-w-0">
                    <SheetTitle>
                      {editando
                        ? "Editar funcionário"
                        : funcionarioSelecionado.nome}
                    </SheetTitle>

                    <SheetDescription className="mt-1">
                      {editando
                        ? "Atualize os dados do funcionário."
                        : `${ROTULO_CARGO[funcionarioSelecionado.cargo]} · ${
                            funcionarioSelecionado.status ===
                            "ativo"
                              ? "Ativo"
                              : "Inativo"
                          }`}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {editando ? (
                <form
                  onSubmit={salvarEdicao}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="scroll-mac flex-1 space-y-5 overflow-y-auto px-6 py-5">
                    <div className="space-y-2">
                      <Label htmlFor="nome-edicao">
                        Nome completo
                      </Label>

                      <Input
                        id="nome-edicao"
                        value={nomeEdicao}
                        onChange={(event) =>
                          setNomeEdicao(
                            event.target.value
                          )
                        }
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                        autoComplete="off"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf-edicao">
                        CPF
                      </Label>

                      <Input
                        id="cpf-edicao"
                        value={cpfEdicao}
                        onChange={(event) =>
                          setCpfEdicao(
                            mascaraCPF(event.target.value)
                          )
                        }
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="telefone-edicao">
                          Telefone
                        </Label>

                        <Input
                          id="telefone-edicao"
                          value={telefoneEdicao}
                          onChange={(event) =>
                            setTelefoneEdicao(
                              mascaraTelefone(event.target.value)
                            )
                          }
                          placeholder="(00) 00000-0000"
                          inputMode="numeric"
                          autoComplete="tel"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admissao-edicao">
                          Data de admissão
                        </Label>

                        <Input
                          id="admissao-edicao"
                          type="date"
                          value={
                            dataAdmissaoEdicao
                          }
                          onChange={(event) =>
                            setDataAdmissaoEdicao(
                              event.target.value
                            )
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-edicao">
                        E-mail

                        <span className="text-muted-foreground ml-1 font-normal">
                          opcional
                        </span>
                      </Label>

                      <Input
                        id="email-edicao"
                        type="email"
                        value={emailEdicao}
                        onChange={(event) =>
                          setEmailEdicao(
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>
                          Cargo
                        </Label>

                        <Select
                          value={cargoEdicao}
                          onValueChange={(valor) =>
                            alterarCargoEdicao(
                              valor as CargoFuncionario
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent className="glass shadow-pop">
                            <SelectItem value="gerente">
                              Gerente
                            </SelectItem>

                            <SelectItem value="vendedor">
                              Vendedor(a)
                            </SelectItem>

                            <SelectItem value="financeiro">
                              Financeiro
                            </SelectItem>

                            <SelectItem value="administrativo">
                              Administrativo
                            </SelectItem>

                            <SelectItem value="mecanico">
                              Mecânico
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comissao-edicao">
                          Comissão (%)
                        </Label>

                        <Input
                          id="comissao-edicao"
                          inputMode="decimal"
                          value={
                            comissaoEdicao
                          }
                          onChange={(event) =>
                            setComissaoEdicao(
                              event.target.value
                            )
                          }
                          disabled={
                            cargoEdicao !==
                            "vendedor"
                          }
                          required={
                            cargoEdicao ===
                            "vendedor"
                          }
                        />

                        <p className="text-muted-foreground text-[11.5px]">
                          {cargoEdicao ===
                          "vendedor"
                            ? "Percentual aplicado sobre novas vendas."
                            : "Este cargo não utiliza comissão de venda."}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Status
                      </Label>

                      <Select
                        value={statusEdicao}
                        onValueChange={(valor) =>
                          setStatusEdicao(
                            valor as StatusFuncionario
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent className="glass shadow-pop">
                          <SelectItem value="ativo">
                            Ativo
                          </SelectItem>

                          <SelectItem value="inativo">
                            Inativo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <SheetFooter className="flex-row items-center justify-end gap-2 border-t px-6 py-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setEditando(false)
                      }
                    >
                      Cancelar
                    </Button>

                    <Button type="submit">
                      Salvar alterações
                    </Button>
                  </SheetFooter>
                </form>
              ) : (
                <>
                  <div className="scroll-mac flex-1 space-y-5 overflow-y-auto px-6 py-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-card/60 rounded-xl border p-4">
                        <p className="text-muted-foreground text-[11.5px]">
                          CPF
                        </p>

                        <p className="mt-1 text-[13px] font-medium">
                          {
                            funcionarioSelecionado.cpf
                          }
                        </p>
                      </div>

                      <div className="bg-card/60 rounded-xl border p-4">
                        <p className="text-muted-foreground text-[11.5px]">
                          Admissão
                        </p>

                        <p className="mt-1 text-[13px] font-medium">
                          {dataBR(
                            funcionarioSelecionado.data_admissao
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="bg-card/60 rounded-xl border p-4">
                      <p className="text-muted-foreground text-[11.5px]">
                        Contato
                      </p>

                      <div className="mt-2 space-y-2">
                        <p className="flex items-center gap-2 text-[13px]">
                          <Phone className="text-muted-foreground size-4" />
                          {
                            funcionarioSelecionado.telefone
                          }
                        </p>

                        <p className="flex items-center gap-2 text-[13px]">
                          <Mail className="text-muted-foreground size-4" />

                          {funcionarioSelecionado.email ||
                            "Não informado"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-card/60 rounded-xl border p-4">
                        <p className="text-muted-foreground text-[11.5px]">
                          Cargo
                        </p>

                        <p className="mt-1 text-[13px] font-medium">
                          {
                            ROTULO_CARGO[
                              funcionarioSelecionado
                                .cargo
                            ]
                          }
                        </p>
                      </div>

                      <div className="bg-card/60 rounded-xl border p-4">
                        <p className="text-muted-foreground text-[11.5px]">
                          Comissão
                        </p>

                        <p className="mt-1 text-[13px] font-medium">
                          {funcionarioSelecionado.cargo ===
                          "vendedor"
                            ? percentual(
                                funcionarioSelecionado.comissao
                              )
                            : "Não se aplica"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-card/60 rounded-xl border p-4">
                      <p className="text-muted-foreground text-[11.5px]">
                        Status atual
                      </p>

                      <div className="mt-2">
                        <span
                          className={
                            funcionarioSelecionado.status ===
                            "ativo"
                              ? "bg-success/10 text-success-foreground inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium"
                              : "bg-muted text-muted-foreground inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium"
                          }
                        >
                          {funcionarioSelecionado.status ===
                          "ativo"
                            ? "Ativo"
                            : "Inativo"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-card/60 rounded-xl border p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                          <ShieldCheck className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium">
                            Acesso ao AutoSystem
                          </p>

                          {usuarioDoFuncionario(
                            funcionarioSelecionado.id
                          )?.perfil === "admin" &&
                          !administrador ? (
                            <p className="text-muted-foreground mt-1 text-[12px]">
                              Conta administrativa protegida. Somente administradores podem visualizar os dados de acesso.
                            </p>
                          ) : usuarioDoFuncionario(
                              funcionarioSelecionado.id
                            ) ? (
                            <div className="mt-2 space-y-1 text-[12px]">
                              <p>
                                <span className="text-muted-foreground">
                                  E-mail:
                                </span>{" "}
                                {
                                  usuarioDoFuncionario(
                                    funcionarioSelecionado.id
                                  )!.email
                                }
                              </p>

                              <p>
                                <span className="text-muted-foreground">
                                  Perfil:
                                </span>{" "}
                                {
                                  usuarioDoFuncionario(
                                    funcionarioSelecionado.id
                                  )!.perfil === "admin"
                                    ? "Administrador"
                                    : usuarioDoFuncionario(
                                          funcionarioSelecionado.id
                                        )!.perfil === "gerente"
                                      ? "Gerente"
                                      : "Vendedor"
                                }
                              </p>

                              <p>
                                <span className="text-muted-foreground">
                                  Situação:
                                </span>{" "}
                                {
                                  usuarioDoFuncionario(
                                    funcionarioSelecionado.id
                                  )!.ativo
                                    ? "Acesso ativo"
                                    : "Acesso inativo"
                                }
                              </p>
                            </div>
                          ) : (
                            <p className="text-muted-foreground mt-1 text-[12px]">
                              Este funcionário não possui conta de acesso vinculada.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-dashed p-4">
                      <p className="text-[13px] font-medium">
                        Disponibilidade para vendas
                      </p>

                      <p className="text-muted-foreground mt-1 text-[12px] leading-relaxed">
                        {funcionarioSelecionado.cargo !==
                        "vendedor"
                          ? "Este funcionário não possui cargo de vendedor."
                          : funcionarioSelecionado.status ===
                              "ativo"
                            ? "Este vendedor está disponível para novas vendas."
                            : "Este vendedor está inativo e não aparece em novas vendas."}
                      </p>
                    </div>
                  </div>

                  <SheetFooter className="flex-row flex-wrap items-center justify-end gap-2 border-t px-6 py-4">
                    {administrador ||
                    usuarioDoFuncionario(funcionarioSelecionado.id)?.perfil !==
                      "admin" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={alternarStatus}
                        >
                          {funcionarioSelecionado.status === "ativo" ? (
                            <>
                              <UserX className="size-4" />
                              Inativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="size-4" />
                              Ativar
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          onClick={() => setEditando(true)}
                        >
                          <Pencil className="size-4" />
                          Editar funcionário
                        </Button>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-[12px]">
                        Conta administrativa protegida.
                      </p>
                    )}
                  </SheetFooter>
                </>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}