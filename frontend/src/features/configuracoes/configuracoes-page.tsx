import { useEffect, useState } from "react"
import {
  BadgePercent,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Monitor,
  Moon,
  Save,
  Sun,
  UserRound,
  WalletCards,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/auth-context"
import { Segmented } from "@/components/segmented"
import {
  useTheme,
  type Tema,
} from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Configuracoes = {
  concessionaria: {
    nome: string
    cnpj: string
    telefone: string
    email: string
    cidade: string
    uf: string
  }

  comercial: {
    comissaoPadrao: string
    limiteDesconto: string
  }

  financeiro: {
    diaPagamentoComissao: string
    prazoPrimeiraParcela: string
  }
}

const CHAVE = "autosystem.configuracoes"

const CONFIGURACOES_INICIAIS: Configuracoes = {
  concessionaria: {
    nome: "Concessionária Central",
    cnpj: "",
    telefone: "",
    email: "",
    cidade: "",
    uf: "",
  },

  comercial: {
    comissaoPadrao: "1,50",
    limiteDesconto: "10,00",
  },

  financeiro: {
    diaPagamentoComissao: "30",
    prazoPrimeiraParcela: "30",
  },
}

function carregarConfiguracoes(): Configuracoes {
  try {
    const salvo = localStorage.getItem(CHAVE)

    if (!salvo) {
      return CONFIGURACOES_INICIAIS
    }

    const dados = JSON.parse(salvo)

    return {
      concessionaria: {
        ...CONFIGURACOES_INICIAIS.concessionaria,
        ...dados.concessionaria,
      },

      comercial: {
        ...CONFIGURACOES_INICIAIS.comercial,
        ...dados.comercial,
      },

      financeiro: {
        ...CONFIGURACOES_INICIAIS.financeiro,
        ...dados.financeiro,
      },
    }
  } catch {
    return CONFIGURACOES_INICIAIS
  }
}

function mascaraCNPJ(valor: string) {
  const numeros = valor
    .replace(/\D/g, "")
    .slice(0, 14)

  return numeros
    .replace(
      /^(\d{2})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{2})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1/$2"
    )
    .replace(
      /(\d{4})(\d)/,
      "$1-$2"
    )
}

function mascaraTelefone(
  valor: string
) {
  const numeros = valor
    .replace(/\D/g, "")
    .slice(0, 11)

  if (numeros.length <= 10) {
    return numeros
      .replace(
        /^(\d{2})(\d)/,
        "($1) $2"
      )
      .replace(
        /(\d{4})(\d)/,
        "$1-$2"
      )
  }

  return numeros
    .replace(
      /^(\d{2})(\d)/,
      "($1) $2"
    )
    .replace(
      /(\d{5})(\d)/,
      "$1-$2"
    )
}

function mascaraPercentual(
  valor: string
) {
  const limpo = valor.replace(
    /[^\d,]/g,
    ""
  )

  const partes = limpo.split(",")
  const inteiro = partes[0].slice(0, 3)
  const decimal =
    partes[1]?.slice(0, 2)

  if (limpo.includes(",")) {
    return `${inteiro},${decimal ?? ""}`
  }

  return inteiro
}

function rotuloPerfil(
  perfil:
    | "admin"
    | "gerente"
    | "vendedor"
) {
  switch (perfil) {
    case "admin":
      return "Administrador"

    case "gerente":
      return "Gerente"

    case "vendedor":
      return "Vendedor"
  }
}

export function ConfiguracoesPage() {
  const { tema, setTema } =
    useTheme()

  const {
    usuario,
    atualizarConta,
    alterarSenha,
  } = useAuth()

  const podeAlterarConfiguracoesGerais = usuario?.perfil === "admin"
  const podeAlterarConfiguracoesComerciais =
    usuario?.perfil === "admin" || usuario?.perfil === "gerente"

  const [
    configuracoes,
    setConfiguracoes,
  ] = useState<Configuracoes>(
    carregarConfiguracoes
  )

  const [alterado, setAlterado] =
    useState(false)

  const [nomeConta, setNomeConta] =
    useState(usuario?.nome ?? "")

  const [emailConta, setEmailConta] =
    useState(usuario?.email ?? "")

  const [
    alterandoSenha,
    setAlterandoSenha,
  ] = useState(false)

  const [
    senhaAtual,
    setSenhaAtual,
  ] = useState("")

  const [
    novaSenha,
    setNovaSenha,
  ] = useState("")

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("")

  const [
    mostrarSenhaAtual,
    setMostrarSenhaAtual,
  ] = useState(false)

  const [
    mostrarNovaSenha,
    setMostrarNovaSenha,
  ] = useState(false)

  const [
    mostrarConfirmacao,
    setMostrarConfirmacao,
  ] = useState(false)

  useEffect(() => {
    setNomeConta(
      usuario?.nome ?? ""
    )

    setEmailConta(
      usuario?.email ?? ""
    )
  }, [
    usuario?.nome,
    usuario?.email,
  ])

  useEffect(() => {
    const antesDeSair = (
      evento: BeforeUnloadEvent
    ) => {
      if (!alterado) {
        return
      }

      evento.preventDefault()
    }

    window.addEventListener(
      "beforeunload",
      antesDeSair
    )

    return () =>
      window.removeEventListener(
        "beforeunload",
        antesDeSair
      )
  }, [alterado])

  const alterarConcessionaria = <
    K extends keyof Configuracoes["concessionaria"],
  >(
    campo: K,
    valor: Configuracoes["concessionaria"][K]
  ) => {
    setConfiguracoes(
      (atual) => ({
        ...atual,
        concessionaria: {
          ...atual.concessionaria,
          [campo]: valor,
        },
      })
    )

    setAlterado(true)
  }

  const alterarComercial = <
    K extends keyof Configuracoes["comercial"],
  >(
    campo: K,
    valor: Configuracoes["comercial"][K]
  ) => {
    setConfiguracoes(
      (atual) => ({
        ...atual,
        comercial: {
          ...atual.comercial,
          [campo]: valor,
        },
      })
    )

    setAlterado(true)
  }

  const alterarFinanceiro = <
    K extends keyof Configuracoes["financeiro"],
  >(
    campo: K,
    valor: Configuracoes["financeiro"][K]
  ) => {
    setConfiguracoes(
      (atual) => ({
        ...atual,
        financeiro: {
          ...atual.financeiro,
          [campo]: valor,
        },
      })
    )

    setAlterado(true)
  }

  const alterarNomeConta = (
    valor: string
  ) => {
    setNomeConta(valor)
    setAlterado(true)
  }

  const alterarEmailConta = (
    valor: string
  ) => {
    setEmailConta(valor)
    setAlterado(true)
  }

  const salvar = () => {
    if (
      podeAlterarConfiguracoesGerais &&
      !configuracoes.concessionaria
        .nome.trim()
    ) {
      toast.error(
        "Informe o nome da concessionária."
      )

      return
    }

    if (!usuario) {
      toast.error(
        "Nenhum usuário autenticado."
      )

      return
    }

    if (podeAlterarConfiguracoesComerciais) {
      const limite = Number(
        configuracoes.comercial.limiteDesconto.replace(",", ".")
      )

      if (!Number.isFinite(limite) || limite < 0 || limite > 10) {
        toast.error(
          "Informe um limite de desconto entre 0% e 10%."
        )
        return
      }
    }

    const resultadoConta =
      atualizarConta({
        nome: nomeConta,
        email: emailConta,
      })

    if (!resultadoConta.sucesso) {
      toast.error(
        resultadoConta.mensagem ??
          "Não foi possível atualizar a conta."
      )

      return
    }

    try {
      if (
        podeAlterarConfiguracoesGerais ||
        podeAlterarConfiguracoesComerciais
      ) {
        localStorage.setItem(
          CHAVE,
          JSON.stringify(
            configuracoes
          )
        )
      }

      setAlterado(false)

      toast.success(
        "Configurações salvas"
      )
    } catch {
      toast.error(
        "Não foi possível salvar as configurações."
      )
    }
  }

  const trocarTema = (
    novoTema: Tema
  ) => {
    setTema(novoTema)
  }

  const cancelarAlteracaoSenha =
    () => {
      setAlterandoSenha(false)
      setSenhaAtual("")
      setNovaSenha("")
      setConfirmarSenha("")
      setMostrarSenhaAtual(false)
      setMostrarNovaSenha(false)
      setMostrarConfirmacao(false)
    }

  const salvarNovaSenha = () => {
    if (!senhaAtual) {
      toast.error(
        "Informe sua senha atual."
      )
      return
    }

    if (!novaSenha) {
      toast.error(
        "Informe a nova senha."
      )
      return
    }

    if (
      novaSenha !==
      confirmarSenha
    ) {
      toast.error(
        "A confirmação da nova senha não confere."
      )
      return
    }

    const resultado = alterarSenha(
      senhaAtual,
      novaSenha
    )

    if (!resultado.sucesso) {
      toast.error(
        resultado.mensagem ??
          "Não foi possível alterar a senha."
      )
      return
    }

    cancelarAlteracaoSenha()

    toast.success(
      "Senha alterada com sucesso."
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
            Preferências do
            AutoSystem
          </h2>

          <p className="text-muted-foreground mt-0.5 text-[12px]">
            Dados da empresa,
            parâmetros comerciais
            e preferências do
            sistema
          </p>
        </div>

        <Button
          size="sm"
          onClick={salvar}
          disabled={!alterado}
        >
          <Save className="size-4" />
          Salvar alterações
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {podeAlterarConfiguracoesGerais && (
          <Card className="p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Building2 className="text-muted-foreground size-4" />
            </div>

            <div>
              <h3 className="text-[14px] font-semibold">
                Concessionária
              </h3>

              <p className="text-muted-foreground mt-0.5 text-[12px]">
                Dados institucionais
                utilizados pelo
                sistema
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="config-nome-empresa">
                Nome da
                concessionária
              </Label>

              <Input
                id="config-nome-empresa"
                value={
                  configuracoes
                    .concessionaria
                    .nome
                }
                onChange={(e) =>
                  alterarConcessionaria(
                    "nome",
                    e.target.value
                  )
                }
                placeholder="Nome da concessionária"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="config-cnpj">
                CNPJ
              </Label>

              <Input
                id="config-cnpj"
                value={
                  configuracoes
                    .concessionaria
                    .cnpj
                }
                onChange={(e) =>
                  alterarConcessionaria(
                    "cnpj",
                    mascaraCNPJ(
                      e.target.value
                    )
                  )
                }
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="config-telefone">
                Telefone
              </Label>

              <Input
                id="config-telefone"
                value={
                  configuracoes
                    .concessionaria
                    .telefone
                }
                onChange={(e) =>
                  alterarConcessionaria(
                    "telefone",
                    mascaraTelefone(
                      e.target.value
                    )
                  )
                }
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="config-email-empresa">
                E-mail
              </Label>

              <Input
                id="config-email-empresa"
                type="email"
                value={
                  configuracoes
                    .concessionaria
                    .email
                }
                onChange={(e) =>
                  alterarConcessionaria(
                    "email",
                    e.target.value
                  )
                }
                placeholder="contato@empresa.com.br"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="config-cidade">
                Cidade
              </Label>

              <Input
                id="config-cidade"
                value={
                  configuracoes
                    .concessionaria
                    .cidade
                }
                onChange={(e) =>
                  alterarConcessionaria(
                    "cidade",
                    e.target.value
                  )
                }
                placeholder="Cidade"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="config-uf">
                UF
              </Label>

              <Input
                id="config-uf"
                value={
                  configuracoes
                    .concessionaria
                    .uf
                }
                onChange={(e) =>
                  alterarConcessionaria(
                    "uf",
                    e.target.value
                      .replace(
                        /[^A-Za-z]/g,
                        ""
                      )
                      .toUpperCase()
                      .slice(0, 2)
                  )
                }
                placeholder="MG"
                maxLength={2}
              />
            </div>
          </div>
        </Card>
        )}

        {podeAlterarConfiguracoesComerciais && (
          <Card className="p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
              <BadgePercent className="text-muted-foreground size-4" />
            </div>

            <div>
              <h3 className="text-[14px] font-semibold">
                Preferências
                comerciais
              </h3>

              <p className="text-muted-foreground mt-0.5 text-[12px]">
                Parâmetros padrão
                utilizados nas
                negociações
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="config-comissao">
                Comissão padrão
              </Label>

              <div className="relative">
                <Input
                  id="config-comissao"
                  value={
                    configuracoes
                      .comercial
                      .comissaoPadrao
                  }
                  onChange={(e) =>
                    alterarComercial(
                      "comissaoPadrao",
                      mascaraPercentual(
                        e.target.value
                      )
                    )
                  }
                  className="pr-8"
                  inputMode="decimal"
                  disabled={!podeAlterarConfiguracoesGerais}
                />

                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[12px]">
                  %
                </span>
              </div>

              <p className="text-muted-foreground text-[11px]">
                Aplicada como
                sugestão ao cadastrar
                novos vendedores.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="config-desconto">
                Limite de desconto
              </Label>

              <div className="relative">
                <Input
                  id="config-desconto"
                  value={
                    configuracoes
                      .comercial
                      .limiteDesconto
                  }
                  onChange={(e) =>
                    alterarComercial(
                      "limiteDesconto",
                      mascaraPercentual(
                        e.target.value
                      )
                    )
                  }
                  className="pr-8"
                  inputMode="decimal"
                />

                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[12px]">
                  %
                </span>
              </div>

              <p className="text-muted-foreground text-[11px]">
                Limite máximo permitido em vendas à vista.
                Gerentes e administradores podem alterar este valor.
              </p>
            </div>
          </div>
        </Card>
        )}

        {podeAlterarConfiguracoesGerais && (
          <Card className="p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
              <WalletCards className="text-muted-foreground size-4" />
            </div>

            <div>
              <h3 className="text-[14px] font-semibold">
                Financeiro
              </h3>

              <p className="text-muted-foreground mt-0.5 text-[12px]">
                Parâmetros usados em
                comissões e
                financiamentos
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="config-dia-comissao">
                Dia de pagamento das
                comissões
              </Label>

              <Input
                id="config-dia-comissao"
                type="number"
                min={1}
                max={31}
                value={
                  configuracoes
                    .financeiro
                    .diaPagamentoComissao
                }
                onChange={(e) =>
                  alterarFinanceiro(
                    "diaPagamentoComissao",
                    e.target.value
                  )
                }
              />

              <p className="text-muted-foreground text-[11px]">
                Dia padrão para
                vencimento das
                comissões.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="config-prazo-parcela">
                Primeira parcela
              </Label>

              <div className="relative">
                <Input
                  id="config-prazo-parcela"
                  type="number"
                  min={1}
                  max={180}
                  value={
                    configuracoes
                      .financeiro
                      .prazoPrimeiraParcela
                  }
                  onChange={(e) =>
                    alterarFinanceiro(
                      "prazoPrimeiraParcela",
                      e.target.value
                    )
                  }
                  className="pr-14"
                />

                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[12px]">
                  dias
                </span>
              </div>

              <p className="text-muted-foreground text-[11px]">
                Prazo sugerido para
                novos financiamentos.
              </p>
            </div>
          </div>
        </Card>
        )}

        <Card className="p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
              <UserRound className="text-muted-foreground size-4" />
            </div>

            <div>
              <h3 className="text-[14px] font-semibold">
                Minha conta
              </h3>

              <p className="text-muted-foreground mt-0.5 text-[12px]">
                Dados do usuário
                autenticado no
                AutoSystem
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="config-conta-nome">
                Nome de exibição
              </Label>

              <Input
                id="config-conta-nome"
                value={nomeConta}
                onChange={(e) =>
                  alterarNomeConta(
                    e.target.value
                  )
                }
                placeholder="Nome do usuário"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="config-conta-email">
                E-mail
              </Label>

              <Input
                id="config-conta-email"
                type="email"
                value={emailConta}
                onChange={(e) =>
                  alterarEmailConta(
                    e.target.value
                  )
                }
                placeholder="usuario@empresa.com.br"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>
                Perfil de acesso
              </Label>

              <div className="bg-muted/50 flex h-9 items-center rounded-md border px-3">
                <span className="text-[13px] font-medium">
                  {usuario
                    ? rotuloPerfil(
                        usuario.perfil
                      )
                    : "—"}
                </span>
              </div>

              <p className="text-muted-foreground text-[11px]">
                O perfil de acesso é
                definido pelo
                cadastro do usuário
                e não pode ser
                alterado pela própria
                conta.
              </p>
            </div>

            <div className="sm:col-span-2">
              {!alterandoSenha ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAlterandoSenha(
                      true
                    )
                  }
                >
                  <KeyRound className="size-4" />
                  Alterar senha
                </Button>
              ) : (
                <div className="space-y-4 rounded-lg border p-4">
                  <div>
                    <p className="text-[13px] font-semibold">
                      Alterar senha
                    </p>

                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      Informe a senha
                      atual e escolha
                      uma nova senha
                      com pelo menos 6
                      caracteres.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="senha-atual">
                      Senha atual
                    </Label>

                    <div className="relative">
                      <Input
                        id="senha-atual"
                        type={
                          mostrarSenhaAtual
                            ? "text"
                            : "password"
                        }
                        value={
                          senhaAtual
                        }
                        onChange={(e) =>
                          setSenhaAtual(
                            e.target
                              .value
                          )
                        }
                        autoComplete="current-password"
                        className="pr-10"
                      />

                      <button
                        type="button"
                        aria-label={
                          mostrarSenhaAtual
                            ? "Ocultar senha"
                            : "Mostrar senha"
                        }
                        onClick={() =>
                          setMostrarSenhaAtual(
                            (atual) =>
                              !atual
                          )
                        }
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                      >
                        {mostrarSenhaAtual ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="nova-senha">
                        Nova senha
                      </Label>

                      <div className="relative">
                        <Input
                          id="nova-senha"
                          type={
                            mostrarNovaSenha
                              ? "text"
                              : "password"
                          }
                          value={
                            novaSenha
                          }
                          onChange={(e) =>
                            setNovaSenha(
                              e.target
                                .value
                            )
                          }
                          autoComplete="new-password"
                          className="pr-10"
                        />

                        <button
                          type="button"
                          aria-label={
                            mostrarNovaSenha
                              ? "Ocultar senha"
                              : "Mostrar senha"
                          }
                          onClick={() =>
                            setMostrarNovaSenha(
                              (atual) =>
                                !atual
                            )
                          }
                          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                        >
                          {mostrarNovaSenha ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmar-senha">
                        Confirmar nova
                        senha
                      </Label>

                      <div className="relative">
                        <Input
                          id="confirmar-senha"
                          type={
                            mostrarConfirmacao
                              ? "text"
                              : "password"
                          }
                          value={
                            confirmarSenha
                          }
                          onChange={(e) =>
                            setConfirmarSenha(
                              e.target
                                .value
                            )
                          }
                          autoComplete="new-password"
                          className="pr-10"
                        />

                        <button
                          type="button"
                          aria-label={
                            mostrarConfirmacao
                              ? "Ocultar senha"
                              : "Mostrar senha"
                          }
                          onClick={() =>
                            setMostrarConfirmacao(
                              (atual) =>
                                !atual
                            )
                          }
                          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                        >
                          {mostrarConfirmacao ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={
                        salvarNovaSenha
                      }
                    >
                      <KeyRound className="size-4" />
                      Salvar nova
                      senha
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={
                        cancelarAlteracaoSenha
                      }
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Monitor className="text-muted-foreground size-4" />
              </div>

              <div>
                <h3 className="text-[14px] font-semibold">
                  Sistema
                </h3>

                <p className="text-muted-foreground mt-0.5 text-[12px]">
                  Aparência da
                  interface neste
                  dispositivo
                </p>
              </div>
            </div>

            <Segmented
              aria-label="Tema da aplicação"
              valor={tema}
              onChange={trocarTema}
              opcoes={[
                {
                  valor: "light",
                  rotulo: "Claro",
                  icone: Sun,
                },
                {
                  valor: "dark",
                  rotulo: "Escuro",
                  icone: Moon,
                },
                {
                  valor: "system",
                  rotulo: "Sistema",
                  icone: Monitor,
                },
              ]}
            />
          </div>

          <div className="mt-4 rounded-lg border p-3">
            <p className="text-[13px] font-medium">
              Tema da interface
            </p>

            <p className="text-muted-foreground mt-1 text-[11px]">
              Esta preferência já é
              salva automaticamente
              no navegador e é a
              mesma utilizada pelo
              seletor da barra
              lateral.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
