import {
  Calculator,
  Plus,
  Receipt,
  UserPlus,
} from "lucide-react"
import { useState } from "react"

import {
  AppProvider,
  useApp,
} from "@/app-context"
import {
  AuthProvider,
  useAuth,
} from "@/auth-context"
import { AppShell } from "@/components/app-shell"
import { CommandPalette } from "@/components/command-palette"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { LoginPage } from "@/features/auth/login-page"
import { ClientesPage } from "@/features/clientes/clientes-page"
import { ConsorcioSheet } from "@/features/consorcios/consorcio-sheet"
import { ConsorciosPage } from "@/features/consorcios/consorcios-page"
import { EmBrevePage } from "@/features/em-breve-page"
import { EstoquePage } from "@/features/estoque/estoque-page"
import { FinanciamentoSheet } from "@/features/financiamentos/financiamento-sheet"
import { FinanciamentosPage } from "@/features/financiamentos/financiamentos-page"
import { FinanceiroPage } from "@/features/financeiro/financeiro-page"
import { FuncionariosPage } from "@/features/funcionarios/funcionarios-page"
import { ConfiguracoesPage } from "@/features/configuracoes/configuracoes-page"
import { RelatoriosPage } from "@/features/relatorios/relatorios-page"
import { VendaDialog } from "@/features/vendas/venda-dialog"
import { VendasPage } from "@/features/vendas/vendas-page"
import { VisaoGeralPage } from "@/features/visao-geral/visao-geral-page"

function Conteudo() {
  const {
    rota,
    setNovoVeiculo,
    venda,
    setVenda,
    vendaVeiculoId,
    setVendaVeiculoId,
    setNovoCliente,
    setNovoLancamento,
    setSimulador,
  } = useApp()

  const [
    novoConsorcio,
    setNovoConsorcio,
  ] = useState(false)

  const [
    novoFinanciamento,
    setNovoFinanciamento,
  ] = useState(false)

  let pagina: React.ReactNode
  let acoes: React.ReactNode = null

  const abrirVenda = () => {
    setVendaVeiculoId(null)
    setVenda(true)
  }

  switch (rota) {
    case "visao-geral":
      pagina = <VisaoGeralPage />
      break

    case "estoque":
      pagina = <EstoquePage />

      acoes = (
        <Button
          size="sm"
          onClick={() =>
            setNovoVeiculo(true)
          }
        >
          <Plus className="size-4" />
          Cadastrar veículo
        </Button>
      )
      break

    case "vendas":
      pagina = <VendasPage />

      acoes = (
        <Button
          size="sm"
          onClick={abrirVenda}
        >
          <Receipt className="size-4" />
          Registrar venda
        </Button>
      )
      break

    case "clientes":
      pagina = <ClientesPage />

      acoes = (
        <Button
          size="sm"
          onClick={() =>
            setNovoCliente(true)
          }
        >
          <UserPlus className="size-4" />
          Novo cliente
        </Button>
      )
      break

    case "funcionarios":
      pagina = <FuncionariosPage />
      break

    case "consorcios":
      pagina = <ConsorciosPage />

      acoes = (
        <Button
          size="sm"
          onClick={() =>
            setNovoConsorcio(true)
          }
        >
          <Plus className="size-4" />
          Novo consórcio
        </Button>
      )
      break

    case "financiamentos":
      pagina = <FinanciamentosPage />

      acoes = (
        <Button
          size="sm"
          onClick={() =>
            setNovoFinanciamento(true)
          }
        >
          <Plus className="size-4" />
          Novo financiamento
        </Button>
      )
      break

    case "financeiro":
      pagina = <FinanceiroPage />

      acoes = (
        <>
          <Button
            size="sm"
            variant="outline"
            className="bg-card hidden sm:inline-flex"
            onClick={() =>
              setSimulador(true)
            }
          >
            <Calculator className="size-4" />
            Simular
          </Button>

          <Button
            size="sm"
            onClick={() =>
              setNovoLancamento(true)
            }
          >
            <Plus className="size-4" />
            Novo lançamento
          </Button>
        </>
      )
      break

    case "relatorios":
      pagina = <RelatoriosPage />
      break

    case "configuracoes":
      pagina = <ConfiguracoesPage />
      break

    default:
      pagina = <EmBrevePage />
  }

  return (
    <>
      <AppShell acoes={acoes}>
        {pagina}
      </AppShell>

      <VendaDialog
        aberto={venda}
        onOpenChange={(v) => {
          setVenda(v)

          if (!v) {
            setVendaVeiculoId(null)
          }
        }}
        veiculoInicialId={
          vendaVeiculoId
        }
      />

      <ConsorcioSheet
        aberto={novoConsorcio}
        onOpenChange={
          setNovoConsorcio
        }
      />

      <FinanciamentoSheet
        aberto={novoFinanciamento}
        onOpenChange={
          setNovoFinanciamento
        }
      />

      <CommandPalette />

      <Toaster />
    </>
  )
}

function AplicacaoAutenticada() {
  const { autenticado } = useAuth()

  if (!autenticado) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    )
  }

  return (
    <AppProvider>
      <TooltipProvider
        delayDuration={300}
      >
        <Conteudo />
      </TooltipProvider>
    </AppProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AplicacaoAutenticada />
      </AuthProvider>
    </ThemeProvider>
  )
}