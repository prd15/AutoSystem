import {
  CalendarDays,
  Car,
  CircleDollarSign,
  Fuel,
  Gauge,
  Hash,
  Palette,
  Pencil,
  Settings2,
  ShoppingCart,
} from "lucide-react"

import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type {
  Cambio,
  Combustivel,
  Veiculo,
} from "@/data/store"
import {
  dataBR,
  diasDesde,
  moeda,
  numero,
} from "@/lib/format"

const ROTULO_COMBUSTIVEL: Record<Combustivel, string> = {
  gasolina: "Gasolina",
  etanol: "Etanol",
  flex: "Flex",
  diesel: "Diesel",
  hibrido: "Híbrido",
  eletrico: "Elétrico",
}

const ROTULO_CAMBIO: Record<Cambio, string> = {
  manual: "Manual",
  automatico: "Automático",
  automatizado: "Automatizado",
  cvt: "CVT",
}

type VeiculoDetalhesSheetProps = {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  veiculo: Veiculo | null
  onEditar?: (veiculo: Veiculo) => void
  onRegistrarVenda?: (veiculo: Veiculo) => void
}

function LinhaDetalhe({
  icone,
  rotulo,
  valor,
  destaque = false,
}: {
  icone: React.ReactNode
  rotulo: string
  valor: React.ReactNode
  destaque?: boolean
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 border-b py-3 last:border-b-0">
      <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
        {icone}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[12px]">
          {rotulo}
        </p>

        <div
          className={
            destaque
              ? "mt-0.5 text-[15px] font-semibold"
              : "mt-0.5 text-[14px] font-medium"
          }
        >
          {valor}
        </div>
      </div>
    </div>
  )
}

export function VeiculoDetalhesSheet({
  aberto,
  onOpenChange,
  veiculo,
  onEditar,
  onRegistrarVenda,
}: VeiculoDetalhesSheetProps) {
  if (!veiculo) {
    return null
  }

  const nomeVeiculo = `${veiculo.marca} ${veiculo.modelo}`
  const diasEstoque = diasDesde(veiculo.criado_em)

  const combustivel = veiculo.combustivel
    ? ROTULO_COMBUSTIVEL[veiculo.combustivel]
    : "Não informado"

  const cambio = veiculo.cambio
    ? ROTULO_CAMBIO[veiculo.cambio]
    : "Não informado"

  const versao = veiculo.versao?.trim() || "Não informada"

  const textoTempoEstoque =
    diasEstoque === 0
      ? "Entrou hoje"
      : diasEstoque === 1
        ? "1 dia"
        : `${diasEstoque} dias`

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="glass shadow-pop flex w-full flex-col gap-0 border-l-0 p-0 sm:max-w-[520px]">
        <SheetHeader className="border-b px-6 py-5">
          <div className="pr-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                <Car className="size-5" />
              </div>

              <div className="min-w-0">
                <SheetTitle className="truncate text-[18px] tracking-[-0.01em]">
                  {nomeVeiculo}
                </SheetTitle>

                <SheetDescription className="mt-0.5">
                  {veiculo.versao
                    ? `${veiculo.versao} • ${veiculo.ano}`
                    : String(veiculo.ano)}
                </SheetDescription>
              </div>
            </div>

            <StatusBadge status={veiculo.status} />
          </div>
        </SheetHeader>

        <div className="scroll-mac flex-1 overflow-y-auto px-6 py-5">
          <section>
            <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-[0.08em] uppercase">
              Dados do veículo
            </p>

            <div className="rounded-xl border px-4">
              <LinhaDetalhe
                icone={<Car className="size-4" />}
                rotulo="Marca e modelo"
                valor={nomeVeiculo}
              />

              <LinhaDetalhe
                icone={<Settings2 className="size-4" />}
                rotulo="Versão"
                valor={versao}
              />

              <LinhaDetalhe
                icone={<CalendarDays className="size-4" />}
                rotulo="Ano"
                valor={veiculo.ano}
              />

              <LinhaDetalhe
                icone={<Palette className="size-4" />}
                rotulo="Cor"
                valor={veiculo.cor}
              />

              <LinhaDetalhe
                icone={<Gauge className="size-4" />}
                rotulo="Quilometragem"
                valor={`${numero(veiculo.quilometragem)} km`}
              />

              <LinhaDetalhe
                icone={<Fuel className="size-4" />}
                rotulo="Combustível"
                valor={combustivel}
              />

              <LinhaDetalhe
                icone={<Settings2 className="size-4" />}
                rotulo="Câmbio"
                valor={cambio}
              />

              <LinhaDetalhe
                icone={<Hash className="size-4" />}
                rotulo="Placa"
                valor={
                  veiculo.placa?.trim() ? (
                    <span className="font-mono tracking-[0.08em] uppercase">
                      {veiculo.placa}
                    </span>
                  ) : (
                    "Não informada"
                  )
                }
              />
            </div>
          </section>

          <section className="mt-6">
            <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-[0.08em] uppercase">
              Informações comerciais
            </p>

            <div className="rounded-xl border px-4">
              <LinhaDetalhe
                icone={<CircleDollarSign className="size-4" />}
                rotulo="Preço de venda"
                valor={moeda(veiculo.preco)}
                destaque
              />

              <LinhaDetalhe
                icone={<CalendarDays className="size-4" />}
                rotulo="Entrada no estoque"
                valor={dataBR(veiculo.criado_em)}
              />

              <LinhaDetalhe
                icone={<Gauge className="size-4" />}
                rotulo="Tempo em estoque"
                valor={textoTempoEstoque}
              />
            </div>
          </section>
        </div>

        <SheetFooter className="flex-row items-center justify-end gap-2 border-t px-6 py-4">
          {onEditar && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                onEditar(veiculo)
              }}
            >
              <Pencil className="size-4" />
              Editar
            </Button>
          )}

          {onRegistrarVenda && veiculo.status !== "vendido" && (
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false)
                onRegistrarVenda(veiculo)
              }}
            >
              <ShoppingCart className="size-4" />
              Registrar venda
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}