import { useEffect, useState } from "react"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
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
import {
  ROTULO_CATEGORIA,
  ROTULO_FORMA,
  store,
  type CategoriaLancamento,
  type FormaPagamento,
  type Lancamento,
  type StatusLancamento,
  type TipoLancamento,
} from "@/data/store"
import { hojeISO, moeda, moedaCampo, paraNumero } from "@/lib/format"

type Form = {
  tipo: TipoLancamento
  categoria: CategoriaLancamento
  descricao: string
  valor: string
  data: string
  status: StatusLancamento
  forma: FormaPagamento | ""
  veiculo_id: string
}

type Erros = Partial<Record<keyof Form, string>>

const vazio = (): Form => ({
  tipo: "saida",
  categoria: "despesa_fixa",
  descricao: "",
  valor: "",
  data: hojeISO(),
  status: "pendente",
  forma: "",
  veiculo_id: "",
})

const CATEGORIAS_POR_TIPO: Record<TipoLancamento, CategoriaLancamento[]> = {
  entrada: ["venda", "oficina", "financiamento", "outros"],
  saida: ["compra_veiculo", "comissao", "despesa_fixa", "oficina", "marketing", "impostos", "outros"],
}

function validar(f: Form): Erros {
  const e: Erros = {}
  if (!f.descricao.trim()) e.descricao = "Descreva o lançamento."
  const valor = paraNumero(f.valor)
  if (f.valor.trim() === "") e.valor = "Informe o valor."
  else if (valor === null || valor <= 0) e.valor = "O valor deve ser maior que zero."
  if (!f.data) e.data = "Informe a data."
  if (f.status === "pago" && !f.forma) e.forma = "Informe como foi pago."
  return e
}

/** Cadastro e edição de lançamento manual do fluxo de caixa. */
export function LancamentoDialog({
  aberto,
  onOpenChange,
  lancamento,
}: {
  aberto: boolean
  onOpenChange: (v: boolean) => void
  lancamento: Lancamento | null
}) {
  const editando = lancamento !== null
  const automatico = lancamento?.venda_id !== null && lancamento?.venda_id !== undefined
  const [form, setForm] = useState<Form>(vazio)
  const [erros, setErros] = useState<Erros>({})

  useEffect(() => {
    if (aberto) {
      setForm(
        lancamento
          ? {
              tipo: lancamento.tipo,
              categoria: lancamento.categoria,
              descricao: lancamento.descricao,
              valor: moedaCampo(lancamento.valor),
              data: lancamento.data,
              status: lancamento.status,
              forma: lancamento.forma ?? "",
              veiculo_id: lancamento.veiculo_id !== null ? String(lancamento.veiculo_id) : "",
            }
          : vazio()
      )
      setErros({})
    }
  }, [aberto, lancamento])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))
  const veiculos = store.listarVeiculos()

  const salvar = (e: React.FormEvent) => {
    e.preventDefault()
    const encontrados = validar(form)
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) return

    const dados = {
      tipo: form.tipo,
      categoria: form.categoria,
      descricao: form.descricao.trim(),
      valor: paraNumero(form.valor)!,
      data: form.data,
      status: form.status,
      forma: form.status === "pago" ? (form.forma as FormaPagamento) : null,
      veiculo_id: form.veiculo_id ? Number(form.veiculo_id) : null,
    }

    if (editando) {
      store.atualizarLancamento(lancamento.id, automatico ? { status: dados.status, forma: dados.forma, data: dados.data } : dados)
      toast.success("Lançamento atualizado", { description: dados.descricao })
    } else {
      store.criarLancamento({ ...dados, vendedor: null })
      toast.success(dados.tipo === "entrada" ? "Entrada lançada" : "Saída lançada", {
        description: `${dados.descricao} · ${moeda(dados.valor)}`,
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="glass shadow-pop gap-0 overflow-hidden rounded-2xl border-0 p-0 sm:max-w-[540px]">
        <form onSubmit={salvar} noValidate>
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="text-[17px] tracking-[-0.01em]">
              {editando ? "Editar lançamento" : "Novo lançamento"}
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              {automatico
                ? "Gerado por uma venda: só status, forma e data podem mudar."
                : "Entrada ou saída do caixa. Pendente entra em contas a pagar ou receber."}
            </DialogDescription>
          </DialogHeader>

          <div className="scroll-mac max-h-[65svh] space-y-5 overflow-y-auto px-6 py-5">
            <Segmented
              aria-label="Tipo"
              valor={form.tipo}
              onChange={(t) => {
                set("tipo", t)
                if (!CATEGORIAS_POR_TIPO[t].includes(form.categoria)) set("categoria", CATEGORIAS_POR_TIPO[t][0]!)
              }}
              className="w-full [&>button]:flex-1 [&>button]:justify-center"
              opcoes={[
                { valor: "entrada", rotulo: "Entrada", icone: ArrowDownLeft },
                { valor: "saida", rotulo: "Saída", icone: ArrowUpRight },
              ]}
            />

            <Field label="Descrição" erro={erros.descricao}>
              {(p) => (
                <Input
                  {...p}
                  className="bg-card h-10"
                  value={form.descricao}
                  onChange={(e) => set("descricao", e.target.value)}
                  placeholder={form.tipo === "entrada" ? "Serviço de oficina, repasse…" : "Aluguel, folha, peças…"}
                  disabled={automatico}
                  autoFocus={!editando}
                />
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria">
                {(p) => (
                  <Select value={form.categoria} onValueChange={(v) => set("categoria", v as CategoriaLancamento)} disabled={automatico}>
                    <SelectTrigger id={p.id} className="bg-card h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass shadow-pop">
                      {CATEGORIAS_POR_TIPO[form.tipo].map((c) => (
                        <SelectItem key={c} value={c}>
                          {ROTULO_CATEGORIA[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
              <Field label="Valor" erro={erros.valor}>
                {(p) => (
                  <div className="relative">
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px]">R$</span>
                    <Input
                      {...p}
                      inputMode="decimal"
                      className="bg-card tabular h-10 pl-9"
                      value={form.valor}
                      onChange={(e) => set("valor", e.target.value)}
                      onBlur={() => {
                        const n = paraNumero(form.valor)
                        if (n !== null) set("valor", moedaCampo(n))
                      }}
                      placeholder="0,00"
                      disabled={automatico}
                    />
                  </div>
                )}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={form.status === "pago" ? "Data do pagamento" : "Vencimento"} erro={erros.data}>
                {(p) => (
                  <Input {...p} type="date" className="bg-card tabular h-10" value={form.data} onChange={(e) => set("data", e.target.value)} />
                )}
              </Field>
              <Field label="Situação">
                {() => (
                  <Segmented
                    aria-label="Situação"
                    valor={form.status}
                    onChange={(s) => set("status", s)}
                    className="h-10 w-full [&>button]:h-8 [&>button]:flex-1 [&>button]:justify-center"
                    opcoes={[
                      { valor: "pendente", rotulo: form.tipo === "entrada" ? "A receber" : "A pagar" },
                      { valor: "pago", rotulo: form.tipo === "entrada" ? "Recebido" : "Pago" },
                    ]}
                  />
                )}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Forma de pagamento" erro={erros.forma} opcional={form.status !== "pago"}>
                {(p) => (
                  <Select value={form.forma || "nenhuma"} onValueChange={(v) => set("forma", v === "nenhuma" ? "" : (v as FormaPagamento))}>
                    <SelectTrigger id={p.id} className="bg-card h-10 w-full" aria-invalid={p["aria-invalid"]}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass shadow-pop">
                      <SelectItem value="nenhuma">Não informada</SelectItem>
                      {(Object.keys(ROTULO_FORMA) as FormaPagamento[]).map((f) => (
                        <SelectItem key={f} value={f}>
                          {ROTULO_FORMA[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
              <Field label="Veículo vinculado" opcional dica="Custo de compra entra na margem da venda.">
                {(p) => (
                  <Select value={form.veiculo_id || "nenhum"} onValueChange={(v) => set("veiculo_id", v === "nenhum" ? "" : v)} disabled={automatico}>
                    <SelectTrigger id={p.id} className="bg-card h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass shadow-pop">
                      <SelectItem value="nenhum">Nenhum</SelectItem>
                      {veiculos.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.marca} {v.modelo} · {v.ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="min-w-28">
              {editando ? "Salvar" : "Lançar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
