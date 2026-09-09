import { useState } from "react"
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Moon,
  PanelLeft,
  RotateCcw,
  Search,
  Sun,
} from "lucide-react"
import { toast } from "sonner"

import { ROTAS, useApp, type Rota } from "@/app-context"
import { Segmented } from "@/components/segmented"
import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { store, useEstado } from "@/data/store"
import { cn } from "@/lib/utils"

const GRUPOS: Array<{ nome: string; rotas: Rota[] }> = [
  { nome: "Operação", rotas: ["visao-geral", "estoque", "vendas", "clientes"] },
  { nome: "Pós-venda", rotas: ["oficina", "test-drive"] },
  { nome: "Gestão", rotas: ["financeiro", "relatorios"] },
]

/** Os três botões da janela do macOS. Decorativos: identificam a estética. */
function TrafficLights() {
  return (
    <div aria-hidden className="flex items-center gap-2 px-1">
      <span className="size-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.15)]" />
      <span className="size-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.15)]" />
      <span className="size-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.15)]" />
    </div>
  )
}

function Logo({ compacto }: { compacto?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div
        className="from-primary flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-b to-[oklch(0.5_0.22_262)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_2px_rgb(0_0_0/0.2)]"
        aria-hidden
      >
        <svg viewBox="0 0 32 32" className="size-5" fill="currentColor">
          <path d="M8 19l2.2-5.5A2 2 0 0 1 12.1 12h7.8a2 2 0 0 1 1.9 1.5L24 19v4a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1h-9v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-4zm3.2-1h9.6l-1.3-3.4H12.5L11.2 18zm-.7 3.5a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zm11 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z" />
        </svg>
      </div>
      {!compacto && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-semibold tracking-[-0.01em]">AutoSystem</p>
          <p className="text-muted-foreground truncate text-[11px]">Concessionária Central</p>
        </div>
      )}
    </div>
  )
}

function ItemNav({
  rota,
  compacto,
  contagem,
}: {
  rota: Rota
  compacto: boolean
  contagem?: number | null
}) {
  const { rota: atual, navegar } = useApp()
  const meta = ROTAS[rota]
  const ativo = atual === rota
  const Icone = meta.icone

  const botao = (
    <button
      type="button"
      onClick={() => navegar(rota)}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "ease-mac group flex h-8 w-full items-center gap-2.5 rounded-[7px] px-2 text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        ativo
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        compacto && "justify-center px-0"
      )}
    >
      <Icone
        className={cn(
          "size-4 shrink-0",
          ativo ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80",
          meta.emBreve && "opacity-70"
        )}
      />
      {!compacto && (
        <>
          <span className={cn("truncate", meta.emBreve && "text-sidebar-foreground/60")}>
            {meta.titulo}
          </span>
          {meta.emBreve ? (
            <span className="text-muted-foreground/80 ml-auto rounded-full border border-current/20 px-1.5 py-px text-[10px] font-medium">
              breve
            </span>
          ) : contagem !== undefined && contagem !== null ? (
            <span className="tabular text-muted-foreground ml-auto text-[12px]">{contagem}</span>
          ) : null}
        </>
      )}
    </button>
  )

  if (!compacto) return botao
  return (
    <Tooltip>
      <TooltipTrigger asChild>{botao}</TooltipTrigger>
      <TooltipContent side="right">{meta.titulo}</TooltipContent>
    </Tooltip>
  )
}

function SeletorTema({ compacto }: { compacto: boolean }) {
  const { tema, setTema } = useTheme()
  if (compacto) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Alternar tema"
        onClick={() => setTema(tema === "dark" ? "light" : "dark")}
      >
        <Sun className="size-4 dark:hidden" />
        <Moon className="hidden size-4 dark:block" />
      </Button>
    )
  }
  return (
    <Segmented
      aria-label="Tema"
      size="sm"
      valor={tema}
      onChange={setTema}
      className="w-full [&>button]:flex-1 [&>button]:justify-center"
      opcoes={[
        { valor: "light", rotulo: <Sun className="size-3.5" /> },
        { valor: "dark", rotulo: <Moon className="size-3.5" /> },
        { valor: "system", rotulo: <Monitor className="size-3.5" /> },
      ]}
    />
  )
}

export function AppShell({
  acoes,
  children,
}: {
  acoes?: React.ReactNode
  children: React.ReactNode
}) {
  useEstado()
  const { rota, setPaleta, navegar } = useApp()
  const [compacto, setCompacto] = useState(false)
  const meta = ROTAS[rota]
  const ind = store.indicadores()

  const contagens: Partial<Record<Rota, number>> = {
    estoque: ind.veiculosEmEstoque,
    vendas: ind.vendasNoMes,
    clientes: store.clientes().length,
    financeiro: store.resumoFinanceiro().pendentes,
  }

  return (
    <div className="min-h-svh xl:h-svh xl:p-5">
      <div className="bg-background xl:shadow-window flex min-h-svh xl:h-full xl:min-h-0 xl:overflow-hidden xl:rounded-[14px]">
        {/* Barra lateral — translúcida sobre o papel de parede, como no Finder. */}
        <aside
          className={cn(
            "vibrancy border-sidebar-border ease-mac hidden shrink-0 flex-col border-r transition-[width] duration-300 md:flex",
            compacto ? "w-[68px]" : "w-[236px]"
          )}
        >
          <div className="flex h-[52px] items-center justify-between px-3">
            <TrafficLights />
            {!compacto && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Recolher barra lateral"
                onClick={() => setCompacto(true)}
                className="text-muted-foreground"
              >
                <PanelLeft className="size-4" />
              </Button>
            )}
          </div>

          <div className="px-2 pb-3">
            <Logo compacto={compacto} />
          </div>

          <nav className="scroll-mac flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-2">
            {GRUPOS.map((g) => (
              <div key={g.nome} className="flex flex-col gap-px">
                {!compacto && (
                  <p className="text-muted-foreground/80 px-2 pb-1 text-[11px] font-semibold tracking-[0.02em]">
                    {g.nome}
                  </p>
                )}
                {g.rotas.map((r) => (
                  <ItemNav key={r} rota={r} compacto={compacto} contagem={contagens[r]} />
                ))}
              </div>
            ))}
            <div className="mt-auto flex flex-col gap-px pt-2">
              <ItemNav rota="configuracoes" compacto={compacto} />
            </div>
          </nav>

          <div className="border-sidebar-border flex flex-col gap-2 border-t p-3">
            <div className={cn("flex items-center gap-2", compacto && "justify-center")}>
              <Avatar className="size-8">
                <AvatarFallback className="bg-gradient-to-br from-[oklch(0.75_0.12_60)] to-[oklch(0.62_0.18_25)] text-[11px] font-semibold text-white">
                  PS
                </AvatarFallback>
              </Avatar>
              {!compacto && (
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[13px] font-medium">Pedro Silva</p>
                  <p className="text-muted-foreground truncate text-[11px]">Gerente</p>
                </div>
              )}
              {compacto ? null : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Restaurar dados de exemplo"
                      className="text-muted-foreground"
                      onClick={() => {
                        store.restaurar()
                        toast.success("Dados de exemplo restaurados")
                      }}
                    >
                      <RotateCcw className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Restaurar dados de exemplo</TooltipContent>
                </Tooltip>
              )}
            </div>
            <SeletorTema compacto={compacto} />
            {compacto && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Expandir barra lateral"
                onClick={() => setCompacto(false)}
                className="text-muted-foreground mx-auto"
              >
                <PanelLeft className="size-4" />
              </Button>
            )}
          </div>
        </aside>

        {/* Conteúdo */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[52px] shrink-0 items-center gap-2 border-b px-4">
            <div className="hidden items-center gap-0.5 md:flex">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Voltar"
                className="text-muted-foreground"
                onClick={() => window.history.back()}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Avançar"
                className="text-muted-foreground"
                onClick={() => window.history.forward()}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em]">
                {meta.titulo}
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaleta(true)}
                className="bg-muted/70 text-muted-foreground hover:bg-muted dark:bg-white/6 dark:hover:bg-white/10 hidden h-8 w-56 items-center gap-2 rounded-[8px] px-2.5 text-[13px] transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:flex"
              >
                <Search className="size-3.5" />
                <span className="flex-1 text-left">Buscar</span>
                <kbd className="bg-card text-muted-foreground rounded-[5px] px-1.5 py-px font-sans text-[11px] shadow-[0_0_0_1px_rgb(0_0_0/0.08)]">
                  ⌘K
                </kbd>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Buscar"
                className="text-muted-foreground sm:hidden"
                onClick={() => setPaleta(true)}
              >
                <Search className="size-4" />
              </Button>
              {acoes}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Notificações"
                    className="text-muted-foreground relative"
                    onClick={() => navegar("estoque")}
                  >
                    <Bell className="size-4" />
                    {ind.reservados > 0 && (
                      <span className="bg-warning-solid absolute top-1.5 right-1.5 size-1.5 rounded-full" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {ind.reservados} {ind.reservados === 1 ? "reserva aguardando" : "reservas aguardando"}
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Navegação em telas estreitas */}
          <div className="scroll-mac flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden">
            {GRUPOS[0]!.rotas.map((r) => {
              const Icone = ROTAS[r].icone
              return (
                <Button
                  key={r}
                  variant={rota === r ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navegar(r)}
                >
                  <Icone className="size-4" />
                  {ROTAS[r].titulo}
                </Button>
              )
            })}
          </div>

          <main className="scroll-mac min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-5">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
