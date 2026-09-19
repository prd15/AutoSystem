import {
  Calculator,
  Car,
  Landmark,
  Moon,
  Plus,
  Receipt,
  Sun,
  UserPlus,
} from "lucide-react"

import {
  ROTAS,
  useApp,
  type Rota,
} from "@/app-context"

import { useAuth } from "@/auth-context"

import { StatusDot } from "@/components/status-badge"

import { useTheme } from "@/components/theme-provider"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

import {
  ROTULO_STATUS,
  store,
  useEstado,
} from "@/data/store"

import { moedaCurta } from "@/lib/format"

/**
 * Paleta ⌘K no estilo Spotlight: navegar, disparar ações e pular direto para
 * um veículo pelo nome ou pela placa.
 */
export function CommandPalette() {
  useEstado()

  const {
    paleta,
    setPaleta,
    navegar,
    setNovoVeiculo,
    setVenda,
    setNovoCliente,
    setNovoLancamento,
    setSimulador,
    setBuscaEstoque,
  } = useApp()

  const { usuario } = useAuth()

  const {
    temaResolvido,
    setTema,
  } = useTheme()

  const podeGerenciarEstoque =
    usuario?.perfil === "admin" ||
    usuario?.perfil === "gerente"

  const fechar = () => setPaleta(false)

  const ir = (r: Rota) => {
    navegar(r)
    fechar()
  }

  const rotasAtivas = (
    Object.keys(ROTAS) as Rota[]
  ).filter(
    (r) => !ROTAS[r].emBreve
  )

  const veiculos =
    store.listarVeiculos()

  return (
    <CommandDialog
      open={paleta}
      onOpenChange={setPaleta}
      title="Buscar e executar"
      description="Navegue entre telas, crie registros ou encontre um veículo"
      showCloseButton={false}
      className="glass shadow-pop top-[18%] translate-y-0 overflow-hidden rounded-2xl border-0 p-0 sm:max-w-[600px]"
    >
      <CommandInput
        placeholder="Buscar veículo, tela ou ação…"
        className="h-12 text-[15px]"
      />

      <CommandList className="scroll-mac max-h-[380px]">
        <CommandEmpty>
          Nada encontrado.
        </CommandEmpty>

        <CommandGroup heading="Ações">
          {podeGerenciarEstoque && (
            <CommandItem
              onSelect={() => {
                navegar("estoque")
                setNovoVeiculo(true)
                fechar()
              }}
            >
              <Plus />
              Cadastrar veículo
              <CommandShortcut>
                N
              </CommandShortcut>
            </CommandItem>
          )}

          <CommandItem
            onSelect={() => {
              navegar("vendas")
              setVenda(true)
              fechar()
            }}
          >
            <Receipt />
            Registrar venda
            <CommandShortcut>
              V
            </CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              navegar("clientes")
              setNovoCliente(true)
              fechar()
            }}
          >
            <UserPlus />
            Novo cliente
          </CommandItem>

          <CommandItem
            onSelect={() => {
              navegar("financeiro")
              setNovoLancamento(true)
              fechar()
            }}
          >
            <Landmark />
            Novo lançamento no caixa
          </CommandItem>

          <CommandItem
            onSelect={() => {
              navegar("financeiro")
              setSimulador(true)
              fechar()
            }}
          >
            <Calculator />
            Simular financiamento
          </CommandItem>

          <CommandItem
            onSelect={() => {
              setTema(
                temaResolvido === "dark"
                  ? "light"
                  : "dark"
              )
              fechar()
            }}
          >
            {temaResolvido === "dark" ? (
              <Sun />
            ) : (
              <Moon />
            )}

            {temaResolvido === "dark"
              ? "Tema claro"
              : "Tema escuro"}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ir para">
          {rotasAtivas.map((r) => {
            const Icone =
              ROTAS[r].icone

            return (
              <CommandItem
                key={r}
                value={`tela ${ROTAS[r].titulo}`}
                onSelect={() => ir(r)}
              >
                <Icone />

                {ROTAS[r].titulo}

                <span className="text-muted-foreground ml-auto text-xs">
                  {ROTAS[r].descricao}
                </span>
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Veículos">
          {veiculos.map((v) => (
            <CommandItem
              key={v.id}
              value={`${v.marca} ${v.modelo} ${v.placa} ${v.ano} ${ROTULO_STATUS[v.status]}`}
              onSelect={() => {
                setBuscaEstoque(
                  `${v.marca} ${v.modelo}`
                )
                ir("estoque")
              }}
            >
              <Car />

              <span className="truncate">
                {v.marca} {v.modelo}
              </span>

              <span className="text-muted-foreground tabular text-xs">
                {v.ano}
              </span>

              <span className="ml-auto flex items-center gap-2 text-xs">
                <span className="tabular text-muted-foreground">
                  {moedaCurta(v.preco)}
                </span>

                <StatusDot
                  status={v.status}
                />
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}