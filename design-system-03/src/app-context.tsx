import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  Car,
  KeyRound,
  LayoutGrid,
  Receipt,
  Settings,
  Users,
  Wallet,
  Wrench,
} from "lucide-react"

export type Rota =
  | "visao-geral"
  | "estoque"
  | "vendas"
  | "clientes"
  | "oficina"
  | "test-drive"
  | "financeiro"
  | "relatorios"
  | "configuracoes"

export type RotaMeta = {
  titulo: string
  descricao: string
  icone: React.ComponentType<{ className?: string }>
  grupo: "Operação" | "Pós-venda" | "Gestão" | "Sistema"
  emBreve?: boolean
}

/**
 * Mapa de navegação. As quatro primeiras rotas cobrem o escopo da primeira
 * entrega; as demais são módulos previstos para a evolução do produto e
 * aparecem como "em breve" para a equipe enxergar o caminho.
 */
export const ROTAS: Record<Rota, RotaMeta> = {
  "visao-geral": {
    titulo: "Visão geral",
    descricao: "Indicadores do mês, estoque e últimas vendas",
    icone: LayoutGrid,
    grupo: "Operação",
  },
  estoque: {
    titulo: "Estoque",
    descricao: "Veículos cadastrados, filtros e cadastro",
    icone: Car,
    grupo: "Operação",
  },
  vendas: {
    titulo: "Vendas",
    descricao: "Registro de venda e histórico por período",
    icone: Receipt,
    grupo: "Operação",
  },
  clientes: {
    titulo: "Clientes",
    descricao: "Cadastro de compradores",
    icone: Users,
    grupo: "Operação",
  },
  oficina: {
    titulo: "Oficina",
    descricao: "Ordens de serviço, revisões e peças",
    icone: Wrench,
    grupo: "Pós-venda",
    emBreve: true,
  },
  "test-drive": {
    titulo: "Test drive",
    descricao: "Agenda de test drives e disponibilidade de carros",
    icone: KeyRound,
    grupo: "Pós-venda",
    emBreve: true,
  },
  financeiro: {
    titulo: "Financeiro",
    descricao: "Fluxo de caixa, comissões e financiamentos",
    icone: Wallet,
    grupo: "Gestão",
  },
  relatorios: {
    titulo: "Relatórios",
    descricao: "Exportação em PDF e planilha",
    icone: BarChart3,
    grupo: "Gestão",
    emBreve: true,
  },
  configuracoes: {
    titulo: "Configurações",
    descricao: "Loja, usuários e permissões",
    icone: Settings,
    grupo: "Sistema",
    emBreve: true,
  },
}

type Contexto = {
  rota: Rota
  navegar: (r: Rota) => void
  paleta: boolean
  setPaleta: (v: boolean) => void
  novoVeiculo: boolean
  setNovoVeiculo: (v: boolean) => void
  venda: boolean
  setVenda: (v: boolean) => void
  /** Veículo pré-selecionado ao abrir o registro de venda a partir do estoque. */
  vendaVeiculoId: number | null
  setVendaVeiculoId: (id: number | null) => void
  novoCliente: boolean
  setNovoCliente: (v: boolean) => void
  novoLancamento: boolean
  setNovoLancamento: (v: boolean) => void
  simulador: boolean
  setSimulador: (v: boolean) => void
  /** Busca disparada pela paleta ⌘K, consumida pela tela de estoque. */
  buscaEstoque: string
  setBuscaEstoque: (s: string) => void
}

const AppContext = createContext<Contexto | null>(null)

function rotaDoHash(): Rota {
  const h = window.location.hash.replace(/^#\/?/, "") as Rota
  return h in ROTAS ? h : "visao-geral"
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [rota, setRota] = useState<Rota>(rotaDoHash)
  const [paleta, setPaleta] = useState(false)
  const [novoVeiculo, setNovoVeiculo] = useState(false)
  const [venda, setVenda] = useState(false)
  const [vendaVeiculoId, setVendaVeiculoId] = useState<number | null>(null)
  const [novoCliente, setNovoCliente] = useState(false)
  const [novoLancamento, setNovoLancamento] = useState(false)
  const [simulador, setSimulador] = useState(false)
  const [buscaEstoque, setBuscaEstoque] = useState("")

  useEffect(() => {
    const ouvir = () => setRota(rotaDoHash())
    window.addEventListener("hashchange", ouvir)
    return () => window.removeEventListener("hashchange", ouvir)
  }, [])

  const navegar = useCallback((r: Rota) => {
    window.location.hash = `/${r}`
    setRota(r)
  }, [])

  // ⌘K / Ctrl+K abre a paleta de comandos de qualquer tela.
  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaleta((v) => !v)
      }
    }
    window.addEventListener("keydown", atalho)
    return () => window.removeEventListener("keydown", atalho)
  }, [])

  const valor = useMemo<Contexto>(
    () => ({
      rota,
      navegar,
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
    [rota, navegar, paleta, novoVeiculo, venda, vendaVeiculoId, novoCliente, novoLancamento, simulador, buscaEstoque]
  )

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp precisa estar dentro de AppProvider")
  return ctx
}
