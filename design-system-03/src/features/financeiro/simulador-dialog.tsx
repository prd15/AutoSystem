import { useEffect, useMemo, useState } from "react"
import { Calculator } from "lucide-react"
import { toast } from "sonner"

import { Field } from "@/components/field"
import { Segmented } from "@/components/segmented"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BANCOS, store, useEstado } from "@/data/store"
import { percentual, simular } from "@/lib/financeiro"
import { hojeISO, moeda, moedaCampo, moedaCurta, paraNumero } from "@/lib/format"
import { cn } from "@/lib/utils"

const PARCELAS = ["12", "24", "36", "48", "60"] as const

/**
 * Simulador de financiamento (Tabela Price) com opção de registrar o contrato
 * para acompanhar as parcelas. O valor pode vir de um veículo do estoque.
 */
export function SimuladorDialog({
  aberto,
  onOpenChange,
}: {
  aberto: boolean
  onOpenChange: (v: boolean) => void
}) {
  useEstado()
  const [veiculoId, setVeiculoId] = useState("")
  const [valor, setValor] = useState("")
  const [entrada, setEntrada] = useState("")
  const [parcelas, setParcelas] = useState<(typeof PARCELAS)[number]>("48")
  const [taxa, setTaxa] = useState("1,89")
  const [banco, setBanco] = useState(BANCOS[2]!)
  const [clienteId, setClienteId] = useState("")
  const [erros, setErros] = useState<{ valor?: string; entrada?: string; taxa?: string; cliente?: string; veiculo?: string }>({})

  const veiculos = store.listarVeiculos()
  const clientes = store.clientes()

  useEffect(() => {
    if (aberto) {
      setVeiculoId("")
      setValor("")
      setEntrada("")
      setParcelas("48")
      setTaxa("1,89")
      setClienteId("")
      setErros({})
    }
  }, [aberto])

  const valorNum = paraNumero(valor) ?? 0
  const entradaNum = paraNumero(entrada) ?? 0
  const taxaNum = (paraNumero(taxa) ?? 0) / 100
  const sim = useMemo(() => simular(valorNum, entradaNum, Number(parcelas), taxaNum), [valorNum, entradaNum, parcelas, taxaNum])
  const valido = valorNum > 0 && entradaNum >= 0 && entradaNum < valorNum && taxaNum >= 0

  const escolherVeiculo = (id: string) => {
    setVeiculoId(id)
    const v = store.obterVeiculo(Number(id))
    if (v) {
      setValor(moedaCampo(v.preco))
      if (!entrada) setEntrada(moedaCampo(Math.round(v.preco * 0.2)))
    }
  }

  const registrar = () => {
    const e: typeof erros = {}
    if (valorNum <= 0) e.valor = "Informe o valor do veículo."
    if (entradaNum >= valorNum && valorNum > 0) e.entrada = "A entrada precisa ser menor que o valor."
    if (!veiculoId) e.veiculo = "Escolha o veículo para registrar o contrato."
    if (!clienteId) e.cliente = "Escolha o cliente."
    setErros(e)
    if (Object.keys(e).length > 0) return

    const f = store.criarFinanciamento({
      cliente_id: Number(clienteId),
      veiculo_id: Number(veiculoId),
      banco,
      valor_financiado: sim.financiado,
      entrada: entradaNum,
      parcelas: Number(parcelas),
      taxa_mensal: taxaNum,
      inicio: hojeISO(),
    })
    toast.success("Contrato registrado", {
      description: `${f.parcelas}× de ${moeda(f.valor_parcela)} · ${banco}`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="glass shadow-pop gap-0 overflow-hidden rounded-2xl border-0 p-0 sm:max-w-[760px]">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-[17px] tracking-[-0.01em]">
            <Calculator className="text-primary size-4.5" />
            Simular financiamento
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            Tabela Price. Ajuste entrada, prazo e taxa e veja a parcela na hora.
          </DialogDescription>
        </DialogHeader>

        <div className="scroll-mac grid max-h-[70svh] gap-6 overflow-y-auto px-6 py-5 md:grid-cols-[1fr_300px]">
          {/* Entradas */}
          <div className="space-y-4">
            <Field label="Veículo" erro={erros.veiculo} dica="Preenche o valor de tabela e sugere 20% de entrada.">
              {(p) => (
                <Select value={veiculoId || "nenhum"} onValueChange={(v) => v !== "nenhum" && escolherVeiculo(v)}>
                  <SelectTrigger id={p.id} className="bg-card h-10 w-full" aria-invalid={p["aria-invalid"]}>
                    <SelectValue placeholder="Escolher do estoque" />
                  </SelectTrigger>
                  <SelectContent className="glass shadow-pop">
                    <SelectItem value="nenhum">Sem veículo (valor livre)</SelectItem>
                    {veiculos.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.marca} {v.modelo} · {v.ano} · {moedaCurta(v.preco)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Valor do veículo" erro={erros.valor}>
                {(p) => (
                  <div className="relative">
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px]">R$</span>
                    <Input {...p} inputMode="decimal" className="bg-card tabular h-10 pl-9" value={valor} onChange={(e) => setValor(e.target.value)} onBlur={() => { const n = paraNumero(valor); if (n !== null) setValor(moedaCampo(n)) }} placeholder="0,00" />
                  </div>
                )}
              </Field>
              <Field label="Entrada" erro={erros.entrada} dica={valorNum > 0 && entradaNum > 0 ? `${percentual(entradaNum / valorNum, 0)} do valor` : undefined}>
                {(p) => (
                  <div className="relative">
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px]">R$</span>
                    <Input {...p} inputMode="decimal" className="bg-card tabular h-10 pl-9" value={entrada} onChange={(e) => setEntrada(e.target.value)} onBlur={() => { const n = paraNumero(entrada); if (n !== null) setEntrada(moedaCampo(n)) }} placeholder="0,00" />
                  </div>
                )}
              </Field>
            </div>

            <Field label="Prazo">
              {() => (
                <Segmented
                  aria-label="Parcelas"
                  valor={parcelas}
                  onChange={setParcelas}
                  className="w-full [&>button]:flex-1 [&>button]:justify-center"
                  opcoes={PARCELAS.map((n) => ({ valor: n, rotulo: `${n}×` }))}
                />
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Taxa mensal" erro={erros.taxa} dica={taxaNum > 0 ? `≈ ${percentual(sim.cetAnual, 1)} ao ano` : undefined}>
                {(p) => (
                  <div className="relative">
                    <Input {...p} inputMode="decimal" className="bg-card tabular h-10 pr-9" value={taxa} onChange={(e) => setTaxa(e.target.value.replace(/[^\d,.]/g, ""))} placeholder="1,89" />
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px]">% a.m.</span>
                  </div>
                )}
              </Field>
              <Field label="Banco">
                {(p) => (
                  <Select value={banco} onValueChange={setBanco}>
                    <SelectTrigger id={p.id} className="bg-card h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass shadow-pop">
                      {BANCOS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
            </div>

            <Field label="Cliente" erro={erros.cliente} dica="Necessário só para registrar o contrato.">
              {(p) => (
                <Select value={clienteId || "nenhum"} onValueChange={(v) => setClienteId(v === "nenhum" ? "" : v)}>
                  <SelectTrigger id={p.id} className="bg-card h-10 w-full" aria-invalid={p["aria-invalid"]}>
                    <SelectValue placeholder="Escolher cliente" />
                  </SelectTrigger>
                  <SelectContent className="glass shadow-pop">
                    <SelectItem value="nenhum">Sem cliente</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>

          {/* Resultado */}
          <aside className="bg-card shadow-card flex flex-col rounded-xl p-4">
            <p className="text-muted-foreground text-[12.5px] font-medium">Parcela mensal</p>
            <p className={cn("tabular mt-0.5 text-[28px] leading-8 font-semibold tracking-[-0.02em]", !valido && "text-muted-foreground")}>
              {valido ? moeda(sim.parcela) : "—"}
            </p>
            <p className="text-muted-foreground tabular mt-1 text-[12px]">
              {parcelas} parcelas · {percentual(taxaNum)} a.m.
            </p>

            <dl className="mt-4 space-y-2 border-t pt-4 text-[13px]">
              {[
                ["Valor financiado", sim.financiado],
                ["Total pago", sim.total],
                ["Juros totais", sim.juros],
              ].map(([r, v]) => (
                <div key={r as string} className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">{r}</dt>
                  <dd className="tabular font-medium">{valido ? moeda(v as number) : "—"}</dd>
                </div>
              ))}
            </dl>

            {valido && (
              <div className="mt-4 border-t pt-4">
                <p className="text-muted-foreground mb-2 text-[12px] font-medium">Primeiras parcelas</p>
                <table className="tabular w-full text-[11.5px]">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="pb-1 text-left font-medium">Nº</th>
                      <th className="pb-1 text-right font-medium">Juros</th>
                      <th className="pb-1 text-right font-medium">Amort.</th>
                      <th className="pb-1 text-right font-medium">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sim.tabela.slice(0, 5).map((l) => (
                      <tr key={l.n} className="border-t border-border/60">
                        <td className="py-1">{l.n}</td>
                        <td className="py-1 text-right">{moedaCurta(l.juros)}</td>
                        <td className="py-1 text-right">{moedaCurta(l.amortizacao)}</td>
                        <td className="py-1 text-right">{moedaCurta(l.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </aside>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button type="button" className="min-w-36" disabled={!valido} onClick={registrar}>
            Registrar contrato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
