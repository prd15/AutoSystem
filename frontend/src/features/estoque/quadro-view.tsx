import { Clock, MoreHorizontal, Pencil, Plus, Receipt, Trash2 } from "lucide-react"

import { StatusDot } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CorSwatch, VeiculoTile } from "@/components/veiculo-tile"
import { ORDEM_STATUS, ROTULO_STATUS, type Status, type Veiculo } from "@/data/store"
import { diasDesde, moedaCurta, numero } from "@/lib/format"
import { cn } from "@/lib/utils"

const LIMITE_PARADO = 60
const LIMITE_RESERVA = 30

/** Notas de atenção por cartão, no espírito dos avisos do print de referência. */
function nota(v: Veiculo): { texto: string; tom: "warning" | "info" } | null {
  const dias = diasDesde(v.criado_em)
  if (v.status === "disponivel" && dias >= LIMITE_PARADO)
    return { texto: `${dias} dias em estoque. Considere revisar o preço.`, tom: "warning" }
  if (v.status === "reservado" && dias >= LIMITE_RESERVA)
    return { texto: `Reserva aberta há ${dias} dias. Confirmar com o cliente.`, tom: "warning" }
  if (v.status === "disponivel" && dias <= 3)
    return { texto: "Entrou esta semana.", tom: "info" }
  return null
}

function Cartao({
  v,
  onEditar,
  onExcluir,
  onVender,
}: {
  v: Veiculo
  onEditar: (v: Veiculo) => void
  onExcluir: (v: Veiculo) => void
  onVender: (v: Veiculo) => void
}) {
  const dias = diasDesde(v.criado_em)
  const n = nota(v)
  const vendido = v.status === "vendido"

  return (
    <article
      className={cn(
        "group bg-card shadow-card ease-mac hover:shadow-raised relative rounded-xl p-3 transition-all duration-200 hover:-translate-y-px",
        vendido && "opacity-80"
      )}
    >
      <div className="flex items-start gap-3">
        <VeiculoTile marca={v.marca} cor={v.cor} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] leading-5 font-semibold tracking-[-0.01em]">
            {v.marca} {v.modelo}
          </p>
          <p className="text-muted-foreground flex items-center gap-1.5 text-[12px]">
            <span className="tabular">{v.ano}</span>
            <span aria-hidden>·</span>
            <CorSwatch cor={v.cor} />
            {v.cor}
            <span aria-hidden>·</span>
            <span className="tabular">{numero(v.quilometragem)} km</span>
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Ações de ${v.marca} ${v.modelo}`}
              className="text-muted-foreground -mt-0.5 -mr-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass shadow-pop min-w-44">
            <DropdownMenuItem onClick={() => onEditar(v)}>
              <Pencil />
              Editar
            </DropdownMenuItem>
            {!vendido && (
              <DropdownMenuItem onClick={() => onVender(v)}>
                <Receipt />
                Registrar venda
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onExcluir(v)}>
              <Trash2 />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="tabular text-[15px] font-semibold tracking-[-0.02em]">{moedaCurta(v.preco)}</p>
        <div className="flex items-center gap-1.5">
          {v.placa && (
            <span className="bg-secondary text-secondary-foreground rounded-[5px] px-1.5 py-px font-mono text-[10.5px] tracking-[0.06em]">
              {v.placa}
            </span>
          )}
          <span
            className={cn(
              "tabular inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[11px] font-medium",
              !vendido && dias >= LIMITE_PARADO
                ? "bg-warning text-warning-foreground"
                : "bg-neutral text-neutral-foreground"
            )}
            title="Dias em estoque"
          >
            <Clock className="size-3" />
            {dias}d
          </span>
        </div>
      </div>

      {n && (
        <p
          className={cn(
            "mt-2.5 rounded-lg px-2.5 py-1.5 text-[12px] leading-snug",
            n.tom === "warning" ? "bg-warning text-warning-foreground" : "bg-info text-info-foreground"
          )}
        >
          {n.texto}
        </p>
      )}
    </article>
  )
}

/**
 * Visualização em quadro: uma coluna por status. Mesma lista da tabela, mesmo
 * filtro; troca só o arranjo. Pensada para a recepção olhar de longe.
 */
export function QuadroView({
  veiculos,
  onNovo,
  onEditar,
  onExcluir,
  onVender,
}: {
  veiculos: Veiculo[]
  onNovo: (status: Status) => void
  onEditar: (v: Veiculo) => void
  onExcluir: (v: Veiculo) => void
  onVender: (v: Veiculo) => void
}) {
  return (
    <div className="scroll-mac -mx-1 grid gap-3 overflow-x-auto px-1 pb-2 md:grid-cols-3">
      {ORDEM_STATUS.map((status) => {
        const lista = veiculos
          .filter((v) => v.status === status)
          .sort((a, b) => a.criado_em.localeCompare(b.criado_em))
        const valor = lista.reduce((s, v) => s + v.preco, 0)

        return (
          <section
            key={status}
            aria-label={ROTULO_STATUS[status]}
            className="bg-secondary/60 dark:bg-white/4 flex min-w-[260px] flex-col rounded-2xl p-2"
          >
            <header className="flex items-center gap-2 px-2 py-2">
              <StatusDot status={status} />
              <h3 className="text-[13px] font-semibold">{ROTULO_STATUS[status]}</h3>
              <span className="tabular bg-card text-muted-foreground shadow-card rounded-full px-1.5 py-px text-[11px]">
                {lista.length}
              </span>
              <span className="tabular text-muted-foreground ml-auto text-[12px]">
                {status === "vendido" ? "" : moedaCurta(valor)}
              </span>
            </header>

            <div className="flex flex-col gap-2">
              {lista.map((v) => (
                <Cartao key={v.id} v={v} onEditar={onEditar} onExcluir={onExcluir} onVender={onVender} />
              ))}
              {lista.length === 0 && (
                <p className="text-muted-foreground px-2 py-6 text-center text-[12.5px]">
                  Nenhum veículo {ROTULO_STATUS[status].toLowerCase()} com estes filtros.
                </p>
              )}
            </div>

            {status !== "vendido" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground mt-1 justify-start"
                onClick={() => onNovo(status)}
              >
                <Plus className="size-4" />
                Adicionar veículo
              </Button>
            )}
          </section>
        )
      })}
    </div>
  )
}
