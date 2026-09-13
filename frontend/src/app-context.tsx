import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  BarChart3,
  Car,
  Handshake,
  Landmark,
  LayoutGrid,
  Receipt,
  Settings,
  Users,
  Wallet,
} from "lucide-react"

import {
  useAuth,
  type PerfilUsuario,
} from "@/auth-context"

export type Rota =
  | "visao-geral"
  | "estoque"
  | "vendas"
  | "clientes"
  | "funcionarios"
  | "consorcios"
  | "financiamentos"
  | "financeiro"
  | "relatorios"
  | "configuracoes"

export type RotaMeta = {
  titulo: string
  descricao: string
  icone: React.ComponentType<{
    className?: string
  }>
  grupo:
    | "Operação"
    | "Gestão"
    | "Sistema"
  emBreve?: boolean
}

export const ROTAS: Record<
  Rota,
  RotaMeta
> = {
  "visao-geral": {
    titulo: "Visão geral",
    descricao:
      "Indicadores do mês, estoque e últimas vendas",
    icone: LayoutGrid,
    grupo: "Operação",
  },

  estoque: {
    titulo: "Estoque",
    descricao:
      "Veículos cadastrados, filtros e cadastro",
    icone: Car,
    grupo: "Operação",
  },

  vendas: {
    titulo: "Vendas",
    descricao:
      "Registro de venda e histórico por período",
    icone: Receipt,
    grupo: "Operação",
  },

  clientes: {
    titulo: "Clientes",
    descricao:
      "Cadastro e histórico de compradores",
    icone: Users,
    grupo: "Operação",
  },

  funcionarios: {
    titulo: "Funcionários",
    descricao:
      "Equipe, cargos e comissões",
    icone: Users,
    grupo: "Gestão",
  },

  consorcios: {
    titulo: "Consórcios",
    descricao:
      "Cartas de crédito, cotas e contemplações",
    icone: Handshake,
    grupo: "Gestão",
  },

  financiamentos: {
    titulo: "Financiamentos",
    descricao:
      "Contratos, bancos, parcelas e saldos",
    icone: Landmark,
    grupo: "Gestão",
  },

  financeiro: {
    titulo: "Gestão Financeira",
    descricao:
      "Fluxo de caixa, comissões, financiamentos e consórcios",
    icone: Wallet,
    grupo: "Gestão",
  },

  relatorios: {
    titulo: "Relatórios",
    descricao:
      "Indicadores de vendas, estoque e desempenho",
    icone: BarChart3,
    grupo: "Gestão",
  },

  configuracoes: {
    titulo: "Configurações",
    descricao:
      "Concessionária, conta e preferências do sistema",
    icone: Settings,
    grupo: "Sistema",
  },
}

const ACESSOS: Record<
  PerfilUsuario,
  Rota[]
> = {
  admin: [
    "visao-geral",
    "estoque",
    "vendas",
    "clientes",
    "funcionarios",
    "consorcios",
    "financiamentos",
    "financeiro",
    "relatorios",
    "configuracoes",
  ],

  gerente: [
    "visao-geral",
    "estoque",
    "vendas",
    "clientes",
    "funcionarios",
    "consorcios",
    "financiamentos",
    "financeiro",
    "relatorios",
    "configuracoes",
  ],

  vendedor: [
    "visao-geral",
    "estoque",
    "vendas",
    "clientes",
    "consorcios",
    "financiamentos",
    "configuracoes",
  ],
}

export function podeAcessarRota(
  perfil: PerfilUsuario,
  rota: Rota
) {
  return ACESSOS[
    perfil
  ].includes(rota)
}

export function rotasDoPerfil(
  perfil: PerfilUsuario
) {
  return [...ACESSOS[perfil]]
}

type Contexto = {
  rota: Rota
  navegar: (r: Rota) => void
  podeAcessar: (
    rota: Rota
  ) => boolean
  rotasPermitidas: Rota[]

  paleta: boolean
  setPaleta: (v: boolean) => void

  novoVeiculo: boolean
  setNovoVeiculo: (
    v: boolean
  ) => void

  venda: boolean
  setVenda: (v: boolean) => void

  vendaVeiculoId:
    | number
    | null
  setVendaVeiculoId: (
    id: number | null
  ) => void

  novoCliente: boolean
  setNovoCliente: (
    v: boolean
  ) => void

  novoLancamento: boolean
  setNovoLancamento: (
    v: boolean
  ) => void

  simulador: boolean
  setSimulador: (
    v: boolean
  ) => void

  buscaEstoque: string
  setBuscaEstoque: (
    s: string
  ) => void
}

const AppContext =
  createContext<Contexto | null>(
    null
  )

function rotaDoHash(): Rota {
  const h =
    window.location.hash.replace(
      /^#\/?/,
      ""
    ) as Rota

  return h in ROTAS
    ? h
    : "visao-geral"
}

export function AppProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { usuario } =
    useAuth()

  const perfil =
    usuario?.perfil ?? "vendedor"

  const [rota, setRota] =
    useState<Rota>(
      rotaDoHash
    )

  const [paleta, setPaleta] =
    useState(false)

  const [
    novoVeiculo,
    setNovoVeiculo,
  ] = useState(false)

  const [venda, setVenda] =
    useState(false)

  const [
    vendaVeiculoId,
    setVendaVeiculoId,
  ] = useState<
    number | null
  >(null)

  const [
    novoCliente,
    setNovoCliente,
  ] = useState(false)

  const [
    novoLancamento,
    setNovoLancamento,
  ] = useState(false)

  const [
    simulador,
    setSimulador,
  ] = useState(false)

  const [
    buscaEstoque,
    setBuscaEstoque,
  ] = useState("")

  const rotasPermitidas =
    useMemo(
      () =>
        rotasDoPerfil(
          perfil
        ),
      [perfil]
    )

  const podeAcessar =
    useCallback(
      (r: Rota) =>
        podeAcessarRota(
          perfil,
          r
        ),
      [perfil]
    )

  const irParaRotaSegura =
    useCallback(
      (destino: Rota) => {
        const rotaSegura =
          podeAcessar(destino)
            ? destino
            : "visao-geral"

        if (
          rotaSegura !==
          destino
        ) {
          window.location.hash =
            `/${rotaSegura}`
        }

        setRota(
          rotaSegura
        )
      },
      [podeAcessar]
    )

  useEffect(() => {
    const atual =
      rotaDoHash()

    irParaRotaSegura(
      atual
    )
  }, [
    perfil,
    irParaRotaSegura,
  ])

  useEffect(() => {
    const ouvir = () => {
      irParaRotaSegura(
        rotaDoHash()
      )
    }

    window.addEventListener(
      "hashchange",
      ouvir
    )

    return () =>
      window.removeEventListener(
        "hashchange",
        ouvir
      )
  }, [
    irParaRotaSegura,
  ])

  const navegar =
    useCallback(
      (r: Rota) => {
        const destino =
          podeAcessar(r)
            ? r
            : "visao-geral"

        window.location.hash =
          `/${destino}`

        setRota(
          destino
        )
      },
      [podeAcessar]
    )

  useEffect(() => {
    const atalho = (
      e: KeyboardEvent
    ) => {
      if (
        (e.metaKey ||
          e.ctrlKey) &&
        e.key.toLowerCase() ===
          "k"
      ) {
        e.preventDefault()

        setPaleta(
          (v) => !v
        )
      }
    }

    window.addEventListener(
      "keydown",
      atalho
    )

    return () =>
      window.removeEventListener(
        "keydown",
        atalho
      )
  }, [])

  const valor =
    useMemo<Contexto>(
      () => ({
        rota,
        navegar,
        podeAcessar,
        rotasPermitidas,
        paleta,
        setPaleta,
        novoVeiculo,
        setNovoVeiculo,
        venda,
        setVenda,
        vendaVeiculoId,
        setVendaVeiculoId,
        novoCliente,
        setNovoCliente,
        novoLancamento,
        setNovoLancamento,
        simulador,
        setSimulador,
        buscaEstoque,
        setBuscaEstoque,
      }),
      [
        rota,
        navegar,
        podeAcessar,
        rotasPermitidas,
        paleta,
        novoVeiculo,
        venda,
        vendaVeiculoId,
        novoCliente,
        novoLancamento,
        simulador,
        buscaEstoque,
      ]
    )

  return (
    <AppContext.Provider
      value={valor}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx =
    useContext(AppContext)

  if (!ctx) {
    throw new Error(
      "useApp precisa estar dentro de AppProvider"
    )
  }

  return ctx
}
