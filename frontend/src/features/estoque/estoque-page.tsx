import { useEffect, useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Car,
  ChevronDown,
  Columns3,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Rows3,
  Search,
  Trash2,
  X,
} from "lucide-react"

import { useApp } from "@/app-context"
import { EmptyState } from "@/components/empty-state"
import { Segmented } from "@/components/segmented"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CorSwatch, VeiculoTile } from "@/components/veiculo-tile"
import {
  filtrosVazios,
  ROTULO_STATUS,
  store,
  useEstado,
  type Filtros,
  type Status,
  type Veiculo,
} from "@/data/store"
import { diasDesde, moeda, moedaCompacta, moedaCurta, numero, paraNumero } from "@/lib/format"
import { cn } from "@/lib/utils"

import { ExcluirDialog } from "./excluir-dialog"
import { QuadroView } from "./quadro-view"
import { VeiculoSheet } from "./veiculo-sheet"

type Visao = "tabela" | "quadro"
type ChaveOrdem = "veiculo" | "ano" | "quilometragem" | "preco" | "status" | "dias"
type Ordem = { chave: ChaveOrdem; dir: "asc" | "desc" }

const ABAS: { valor: Status | "todos"; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "disponivel", rotulo: "Disponíveis" },
  { valor: "reservado", rotulo: "Reservados" },
  { valor: "vendido", rotulo: "Vendidos" },
]

function ordenar(lista: Veiculo[], ordem: Ordem) {
  const dir = ordem.dir === "asc" ? 1 : -1
  return [...lista].sort((a, b) => {
    switch (ordem.chave) {
      case "veiculo":
        return dir * `${a.marca} ${a.modelo}`.localeCompare(`${b.marca} ${b.modelo}`, "pt-BR")
      case "ano":
        return dir * (a.ano - b.ano)
      case "quilometragem":
        return dir * (a.quilometragem - b.quilometragem)
      case "preco":
        return dir * (a.preco - b.preco)
      case "status":
        return dir * a.status.localeCompare(b.status)
      case "dias":
        return dir * (diasDesde(a.criado_em) - diasDesde(b.criado_em))
    }
  })
}

function FiltroPreco({
  filtros,
  setFiltros,
}: {
  filtros: Filtros
  setFiltros: React.Dispatch<React.SetStateAction<Filtros>>
}) {
  const [min, setMin] = useState("")
  const [max, setMax] = useState("")
  const [aberto, setAberto] = useState(false)
  const ativo = filtros.precoMin !== null || filtros.precoMax !== null

  useEffect(() => {
    if (aberto) {
      setMin(filtros.precoMin !== null ? String(filtros.precoMin) : "")
      setMax(filtros.precoMax !== null ? String(filtros.precoMax) : "")
    }
  }, [aberto, filtros.precoMin, filtros.precoMax])

  const rotulo = ativo
    ? `${filtros.precoMin !== null ? moedaCompacta(filtros.precoMin) : "até"}${
        filtros.precoMin !== null && filtros.precoMax !== null ? " – " : " "
      }${filtros.precoMax !== null ? moedaCompacta(filtros.precoMax) : filtros.precoMin !== null ? "ou mais" : ""}`
    : "Preço"

  const aplicar = (e: React.FormEvent) => {
    e.preventDefault()
    setFiltros((f) => ({ ...f, precoMin: paraNumero(min), precoMax: paraNumero(max) }))
    setAberto(false)
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-8 gap-1.5", ativo && "border-primary/40 bg-primary/5 text-primary")}>
          {rotulo}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="glass shadow-pop w-72 rounded-xl border-0 p-4">
        <form onSubmit={aplicar} className="space-y-3">
          <p className="text-[13px] font-semibold">Faixa de preço</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="preco-min" className="text-[12px]">
                Mínimo
              </Label>
              <Input
                id="preco-min"
                inputMode="numeric"
                className="tabular h-8"
                placeholder="0"
                value={min}
                onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preco-max" className="text-[12px]">
                Máximo
              </Label>
              <Input
                id="preco-max"
                inputMode="numeric"
                className="tabular h-8"
                placeholder="Sem limite"
                value={max}
                onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["até 60 mil", "", "60000"],
              ["60 a 100 mil", "60000", "100000"],
              ["100 mil+", "100000", ""],
            ].map(([r, a, b]) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setMin(a!)
                  setMax(b!)
                }}
                className="bg-secondary hover:bg-accent rounded-full px-2 py-0.5 text-[11.5px] transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex justify-between gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltros((f) => ({ ...f, precoMin: null, precoMax: null }))
                setAberto(false)
              }}
            >
              Limpar
            </Button>
            <Button type="submit" size="sm">
              Aplicar
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

function CabecalhoOrdenavel({
  chave,
  ordem,
  setOrdem,
  children,
  className,
}: {
  chave: ChaveOrdem
  ordem: Ordem
  setOrdem: (o: Ordem) => void
  children: React.ReactNode
  className?: string
}) {
  const ativo = ordem.chave === chave
  const Icone = !ativo ? ArrowUpDown : ordem.dir === "asc" ? ArrowUp : ArrowDown
  return (
    <TableHead className={cn("h-10", className)}>
      <button
        type="button"
        onClick={() => setOrdem({ chave, dir: ativo && ordem.dir === "asc" ? "desc" : "asc" })}
        className={cn(
          "hover:text-foreground -mx-1 inline-flex items-center gap-1 rounded px-1 text-[12px] font-medium transition-colors",
          ativo ? "text-foreground" : "text-muted-foreground"
        )}
        aria-sort={ativo ? (ordem.dir === "asc" ? "ascending" : "descending") : "none"}
      >
        {children}
        <Icone className={cn("size-3", !ativo && "opacity-50")} />
      </button>
    </TableHead>
  )
}

export function EstoquePage() {
  useEstado()
  const { novoVeiculo, setNovoVeiculo, buscaEstoque, setBuscaEstoque, setVenda, setVendaVeiculoId } = useApp()

  const [filtros, setFiltros] = useState<Filtros>(filtrosVazios)
  const [visao, setVisao] = useState<Visao>("tabela")
  const [ordem, setOrdem] = useState<Ordem>({ chave: "dias", dir: "asc" })
  const [editando, setEditando] = useState<Veiculo | null>(null)
  const [excluindo, setExcluindo] = useState<Veiculo | null>(null)
  const [statusNovo, setStatusNovo] = useState<Status>("disponivel")

  // Busca vinda da paleta ⌘K entra no campo e é consumida uma vez.
  useEffect(() => {
    if (buscaEstoque) {
      setFiltros((f) => ({ ...f, busca: buscaEstoque, status: "todos" }))
      setBuscaEstoque("")
    }
  }, [buscaEstoque, setBuscaEstoque])

  const marcas = store.marcas()
  const lista = useMemo(() => ordenar(store.listarVeiculos(filtros), ordem), [filtros, ordem])
  const total = store.listarVeiculos().length

  // Contagem de cada aba respeita busca, marca e faixa de preço já aplicadas.
  const parcial = useMemo(() => store.listarVeiculos({ ...filtros, status: "todos" }), [filtros])
  const contagem = (v: Status | "todos") =>
    v === "todos" ? parcial.length : parcial.filter((x) => x.status === v).length

  const filtroAtivo =
    filtros.busca !== "" ||
    filtros.status !== "todos" ||
    filtros.marca !== "" ||
    filtros.precoMin !== null ||
    filtros.precoMax !== null

  const valorFiltrado = lista.filter((v) => v.status !== "vendido").reduce((s, v) => s + v.preco, 0)

  const vender = (v: Veiculo) => {
    setVendaVeiculoId(v.id)
    setVenda(true)
  }

  const sheetAberto = novoVeiculo || editando !== null
  const fecharSheet = (v: boolean) => {
    if (!v) {
      setNovoVeiculo(false)
      setEditando(null)
      setStatusNovo("disponivel")
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de ferramentas */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-72">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))}
            placeholder="Marca, modelo ou placa"
            aria-label="Buscar veículo"
            className="bg-card h-8 rounded-[8px] pl-8 text-[13px]"
          />
          {filtros.busca && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setFiltros((f) => ({ ...f, busca: "" }))}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Segmented
          aria-label="Filtrar por status"
          valor={filtros.status}
          onChange={(v) => setFiltros((f) => ({ ...f, status: v }))}
          opcoes={ABAS.map((a) => ({ valor: a.valor, rotulo: a.rotulo, contagem: contagem(a.valor) }))}
        />

        <Select
          value={filtros.marca || "todas"}
          onValueChange={(v) => setFiltros((f) => ({ ...f, marca: v === "todas" ? "" : v }))}
        >
          <SelectTrigger
            size="sm"
            aria-label="Filtrar por marca"
            className={cn("bg-card h-8 min-w-32 text-[13px]", filtros.marca && "border-primary/40 bg-primary/5 text-primary")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass shadow-pop">
            <SelectItem value="todas">Todas as marcas</SelectItem>
            {marcas.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FiltroPreco filtros={filtros} setFiltros={setFiltros} />

        {filtroAtivo && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8"
            onClick={() => setFiltros(filtrosVazios)}
          >
            <X className="size-3.5" />
            Limpar
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Segmented
            aria-label="Visualização"
            valor={visao}
            onChange={setVisao}
            opcoes={[
              { valor: "tabela", rotulo: "Tabela", icone: Rows3 },
              { valor: "quadro", rotulo: "Quadro", icone: Columns3 },
            ]}
          />
        </div>
      </div>

      {/* Resumo */}
      <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-[12.5px]">
        <span className="tabular text-foreground font-medium">
          {lista.length} {lista.length === 1 ? "veículo" : "veículos"}
        </span>
        {filtroAtivo && <span>de {total}</span>}
        <span aria-hidden>·</span>
        <span>
          <span className="tabular text-foreground font-medium">{moedaCurta(valorFiltrado)}</span> em
          estoque {filtroAtivo ? "nesta seleção" : ""}
        </span>
      </p>

      {lista.length === 0 ? (
        <div className="bg-card shadow-card rounded-xl">
          <EmptyState
            icone={filtroAtivo ? Filter : Car}
            titulo={filtroAtivo ? "Nenhum veículo com estes filtros" : "Nenhum veículo cadastrado"}
            descricao={
              filtroAtivo
                ? "Ajuste a busca, o status, a marca ou a faixa de preço."
                : "Cadastre o primeiro veículo para começar a controlar o estoque."
            }
            acao={
              filtroAtivo ? (
                <Button variant="outline" size="sm" onClick={() => setFiltros(filtrosVazios)}>
                  Limpar filtros
                </Button>
              ) : (
                <Button size="sm" onClick={() => setNovoVeiculo(true)}>
                  <Plus className="size-4" />
                  Cadastrar veículo
                </Button>
              )
            }
          />
        </div>
      ) : visao === "quadro" ? (
        <QuadroView
          veiculos={lista}
          onNovo={(s) => {
            setStatusNovo(s)
            setNovoVeiculo(true)
          }}
          onEditar={setEditando}
          onExcluir={setExcluindo}
          onVender={vender}
        />
      ) : (
        <div className="bg-card shadow-card overflow-hidden rounded-xl">
          <div className="scroll-mac overflow-x-auto">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 dark:bg-white/3">
                  <CabecalhoOrdenavel chave="veiculo" ordem={ordem} setOrdem={setOrdem} className="pl-4">
                    Veículo
                  </CabecalhoOrdenavel>
                  <CabecalhoOrdenavel chave="ano" ordem={ordem} setOrdem={setOrdem}>
                    Ano
                  </CabecalhoOrdenavel>
                  <TableHead className="text-muted-foreground h-10 text-[12px] font-medium">Cor</TableHead>
                  <CabecalhoOrdenavel chave="quilometragem" ordem={ordem} setOrdem={setOrdem} className="text-right">
                    Km
                  </CabecalhoOrdenavel>
                  <CabecalhoOrdenavel chave="preco" ordem={ordem} setOrdem={setOrdem} className="text-right">
                    Preço
                  </CabecalhoOrdenavel>
                  <CabecalhoOrdenavel chave="status" ordem={ordem} setOrdem={setOrdem}>
                    Status
                  </CabecalhoOrdenavel>
                  <CabecalhoOrdenavel chave="dias" ordem={ordem} setOrdem={setOrdem} className="text-right">
                    Em estoque
                  </CabecalhoOrdenavel>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((v) => {
                  const dias = diasDesde(v.criado_em)
                  const parado = v.status !== "vendido" && dias >= 60
                  return (
                    <TableRow
                      key={v.id}
                      className="group cursor-default"
                      onDoubleClick={() => setEditando(v)}
                    >
                      <TableCell className="py-2.5 pl-4">
                        <div className="flex items-center gap-3">
                          <VeiculoTile marca={v.marca} cor={v.cor} size="sm" />
                          <div className="min-w-0 leading-tight">
                            <p className="truncate font-medium">
                              {v.marca} {v.modelo}
                            </p>
                            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.06em]">
                              {v.placa || <span className="font-sans tracking-normal italic">sem placa</span>}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="tabular">{v.ano}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5">
                          <CorSwatch cor={v.cor} />
                          {v.cor}
                        </span>
                      </TableCell>
                      <TableCell className="tabular text-right">{numero(v.quilometragem)}</TableCell>
                      <TableCell className="tabular text-right font-medium">{moeda(v.preco)}</TableCell>
                      <TableCell>
                        <StatusBadge status={v.status} />
                      </TableCell>
                      <TableCell className={cn("tabular text-right", parado ? "text-warning-foreground font-medium" : "text-muted-foreground")}>
                        {dias} {dias === 1 ? "dia" : "dias"}
                      </TableCell>
                      <TableCell className="pr-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Ações de ${v.marca} ${v.modelo}`}
                              className="text-muted-foreground"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass shadow-pop min-w-44">
                            <DropdownMenuItem onClick={() => setEditando(v)}>
                              <Pencil />
                              Editar
                            </DropdownMenuItem>
                            {v.status !== "vendido" && (
                              <DropdownMenuItem onClick={() => vender(v)}>
                                <Receipt />
                                Registrar venda
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => setExcluindo(v)}>
                              <Trash2 />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <div className="text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-[12px]">
            <span>Clique duas vezes em uma linha para editar.</span>
            <span>
              {Object.entries(ROTULO_STATUS).map(([s, r]) => (
                <span key={s} className="ml-3">
                  <span className="tabular text-foreground font-medium">{contagem(s as Status)}</span> {r.toLowerCase()}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}

      <VeiculoSheet
        aberto={sheetAberto}
        onOpenChange={fecharSheet}
        veiculo={editando}
        statusInicial={statusNovo}
      />
      <ExcluirDialog veiculo={excluindo} onOpenChange={(a) => !a && setExcluindo(null)} />
    </div>
  )
}
