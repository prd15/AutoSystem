import {
  CalendarDays,
  Car,
  CircleDollarSign,
  Hash,
  Percent,
  Receipt,
  User,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { VeiculoTile } from "@/components/veiculo-tile"
import {
  store,
  type Venda,
} from "@/data/store"
import {
  dataBR,
  moeda,
} from "@/lib/format"

type VendaDetalhesSheetProps = {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  venda: Venda | null
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

export function VendaDetalhesSheet({
  aberto,
  onOpenChange,
  venda,
}: VendaDetalhesSheetProps) {
  if (!venda) {
    return null
  }

  const veiculo = store.obterVeiculo(venda.veiculo_id)
  const cliente = store.obterCliente(venda.cliente_id)

  const precoTabela = veiculo?.preco ?? 0
  const diferenca = veiculo
    ? venda.valor_venda - precoTabela
    : 0

  const percentualNegociacao =
    veiculo && precoTabela > 0
      ? (Math.abs(diferenca) / precoTabela) * 100
      : 0

  const nomeVeiculo = veiculo
    ? `${veiculo.marca} ${veiculo.modelo}`
    : "Veículo removido"

  const textoNegociacao =
    !veiculo || diferenca === 0
      ? "Sem diferença da tabela"
      : diferenca < 0
        ? `Desconto de ${moeda(Math.abs(diferenca))}`
        : `${moeda(diferenca)} acima da tabela`

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="glass shadow-pop flex w-full flex-col gap-0 border-l-0 p-0 sm:max-w-[520px]">
        <SheetHeader className="border-b px-6 py-5">
          <div className="pr-8">
            <div className="flex items-center gap-3">
              {veiculo ? (
                <VeiculoTile
                  marca={veiculo.marca}
                  cor={veiculo.cor}
                  size="sm"
                />
              ) : (
                <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                  <Receipt className="size-5" />
                </div>
              )}

              <div className="min-w-0">
                <SheetTitle className="truncate text-[18px] tracking-[-0.01em]">
                  {nomeVeiculo}
                </SheetTitle>

                <SheetDescription className="mt-0.5">
                  Venda realizada em {dataBR(venda.data_venda)}
                </SheetDescription>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="scroll-mac flex-1 overflow-y-auto px-6 py-5">
          <section>
            <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-[0.08em] uppercase">
              Dados da venda
            </p>

            <div className="rounded-xl border px-4">
              <LinhaDetalhe
                icone={<CalendarDays className="size-4" />}
                rotulo="Data da venda"
                valor={dataBR(venda.data_venda)}
              />

              <LinhaDetalhe
                icone={<UserRound className="size-4" />}
                rotulo="Vendedor"
                valor={venda.vendedor}
              />

              <LinhaDetalhe
                icone={<User className="size-4" />}
                rotulo="Cliente"
                valor={cliente?.nome || "Cliente não encontrado"}
              />
            </div>
          </section>

          <section className="mt-6">
            <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-[0.08em] uppercase">
              Veículo
            </p>

            <div className="rounded-xl border px-4">
              <LinhaDetalhe
                icone={<Car className="size-4" />}
                rotulo="Marca e modelo"
                valor={nomeVeiculo}
              />

              <LinhaDetalhe
                icone={<CalendarDays className="size-4" />}
                rotulo="Ano"
                valor={veiculo?.ano ?? "Não informado"}
              />

              <LinhaDetalhe
                icone={<Hash className="size-4" />}
                rotulo="Placa"
                valor={
                  veiculo?.placa?.trim() ? (
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
              Valores
            </p>

            <div className="rounded-xl border px-4">
              <LinhaDetalhe
                icone={<CircleDollarSign className="size-4" />}
                rotulo="Preço de tabela"
                valor={veiculo ? moeda(precoTabela) : "Não disponível"}
              />

              <LinhaDetalhe
                icone={<Receipt className="size-4" />}
                rotulo="Valor da venda"
                valor={moeda(venda.valor_venda)}
                destaque
              />

              <LinhaDetalhe
                icone={<Percent className="size-4" />}
                rotulo="Negociação"
                valor={
                  <div>
                    <span>{textoNegociacao}</span>

                    {veiculo && diferenca !== 0 && (
                      <span className="text-muted-foreground ml-1.5 text-[12px] font-normal">
                        ({percentualNegociacao.toFixed(1).replace(".", ",")}%)
                      </span>
                    )}
                  </div>
                }
              />
            </div>
          </section>
        </div>

        <SheetFooter className="flex-row items-center justify-end gap-2 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}