import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Field } from "@/components/field"
import { StatusDot } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  ORDEM_STATUS,
  ROTULO_STATUS,
  store,
  type Cambio,
  type Combustivel,
  type Status,
  type Veiculo,
} from "@/data/store"
import { moedaCampo, paraNumero } from "@/lib/format"

type Form = {
  marca: string
  modelo: string
  versao: string
  ano: string
  cor: string
  quilometragem: string
  combustivel: Combustivel | ""
  cambio: Cambio | ""
  preco: string
  placa: string
  status: Status
}

type Erros = Partial<Record<keyof Form, string>>

const vazio: Form = {
  marca: "",
  modelo: "",
  versao: "",
  ano: "",
  cor: "",
  quilometragem: "",
  combustivel: "",
  cambio: "",
  preco: "",
  placa: "",
  status: "disponivel",
}

const MARCAS_SUGERIDAS = [
  "Chevrolet",
  "Fiat",
  "Ford",
  "Honda",
  "Hyundai",
  "Jeep",
  "Nissan",
  "Peugeot",
  "Renault",
  "Toyota",
  "Volkswagen",
]

const COMBUSTIVEIS: Array<{
  valor: Combustivel
  rotulo: string
}> = [
  { valor: "gasolina", rotulo: "Gasolina" },
  { valor: "etanol", rotulo: "Etanol" },
  { valor: "flex", rotulo: "Flex" },
  { valor: "diesel", rotulo: "Diesel" },
  { valor: "hibrido", rotulo: "Híbrido" },
  { valor: "eletrico", rotulo: "Elétrico" },
]

const CAMBIOS: Array<{
  valor: Cambio
  rotulo: string
}> = [
  { valor: "manual", rotulo: "Manual" },
  { valor: "automatico", rotulo: "Automático" },
  { valor: "automatizado", rotulo: "Automatizado" },
  { valor: "cvt", rotulo: "CVT" },
]

function deVeiculo(v: Veiculo): Form {
  return {
    marca: v.marca,
    modelo: v.modelo,
    versao: v.versao ?? "",
    ano: String(v.ano),
    cor: v.cor,
    quilometragem: String(v.quilometragem),
    combustivel: v.combustivel ?? "",
    cambio: v.cambio ?? "",
    preco: moedaCampo(v.preco),
    placa: v.placa,
    status: v.status,
  }
}

function validar(f: Form, idAtual?: number): Erros {
  const e: Erros = {}
  const anoMax = new Date().getFullYear() + 1

  if (!f.marca.trim()) {
    e.marca = "Informe a marca."
  } else if (f.marca.trim().length > 50) {
    e.marca = "A marca deve ter até 50 caracteres."
  }

  if (!f.modelo.trim()) {
    e.modelo = "Informe o modelo."
  } else if (f.modelo.trim().length > 50) {
    e.modelo = "O modelo deve ter até 50 caracteres."
  }

  if (f.versao.trim().length > 50) {
    e.versao = "A versão deve ter até 50 caracteres."
  }

  const ano = Number(f.ano)

  if (!f.ano.trim()) {
    e.ano = "Informe o ano."
  } else if (!Number.isInteger(ano) || ano < 1950 || ano > anoMax) {
    e.ano = `O ano deve estar entre 1950 e ${anoMax}.`
  }

  if (!f.cor.trim()) {
    e.cor = "Informe a cor."
  } else if (f.cor.trim().length > 30) {
    e.cor = "A cor deve ter até 30 caracteres."
  }

  const km = paraNumero(f.quilometragem)

  if (f.quilometragem.trim() === "") {
    e.quilometragem = "Informe a quilometragem."
  } else if (km === null || km < 0 || !Number.isInteger(km)) {
    e.quilometragem =
      "A quilometragem deve ser um número inteiro igual ou maior que zero."
  }

  const preco = paraNumero(f.preco)

  if (f.preco.trim() === "") {
    e.preco = "Informe o preço."
  } else if (preco === null || preco <= 0) {
    e.preco = "O preço deve ser maior que zero."
  }

  const placa = f.placa.replace(/[^A-Z0-9]/gi, "").toUpperCase()

  if (placa && !/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(placa)) {
    e.placa = "Use o formato ABC1D23 ou ABC1234."
  } else if (placa && store.placaEmUso(placa, idAtual)) {
    e.placa = "Já existe um veículo cadastrado com esta placa."
  }

  return e
}

export function VeiculoSheet({
  aberto,
  onOpenChange,
  veiculo,
  statusInicial = "disponivel",
}: {
  aberto: boolean
  onOpenChange: (v: boolean) => void
  veiculo: Veiculo | null
  statusInicial?: Status
}) {
  const editando = veiculo !== null

  const [form, setForm] = useState<Form>(vazio)
  const [erros, setErros] = useState<Erros>({})
  const [tocado, setTocado] = useState(false)

  useEffect(() => {
    if (aberto) {
      setForm(
        veiculo
          ? deVeiculo(veiculo)
          : {
              ...vazio,
              status: statusInicial,
            },
      )

      setErros({})
      setTocado(false)
    }
  }, [aberto, veiculo, statusInicial])

  const campo =
    <K extends keyof Form>(k: K) =>
    (valor: Form[K]) => {
      setForm((f) => {
        const novo = {
          ...f,
          [k]: valor,
        }

        if (tocado) {
          setErros(validar(novo, veiculo?.id))
        }

        return novo
      })
    }

  const salvar = (e: React.FormEvent) => {
    e.preventDefault()

    const encontrados = validar(form, veiculo?.id)

    setErros(encontrados)
    setTocado(true)

    if (Object.keys(encontrados).length > 0) {
      const primeiro = Object.keys(encontrados)[0]

      if (primeiro) {
        document.getElementById(`campo-${primeiro}`)?.focus()
      }

      return
    }

    const dados = {
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      versao: form.versao.trim() || undefined,
      ano: Number(form.ano),
      cor: form.cor.trim(),
      quilometragem: paraNumero(form.quilometragem)!,
      combustivel: form.combustivel || undefined,
      cambio: form.cambio || undefined,
      preco: paraNumero(form.preco)!,
      placa: form.placa.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
      status: form.status,
    }

    if (editando) {
      store.atualizarVeiculo(veiculo.id, dados)

      toast.success("Veículo atualizado", {
        description: `${dados.marca} ${dados.modelo}`,
      })
    } else {
      store.criarVeiculo(dados)

      toast.success("Veículo cadastrado", {
        description: `${dados.marca} ${dados.modelo} foi adicionado ao estoque.`,
      })
    }

    onOpenChange(false)
  }

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="glass shadow-pop flex w-full flex-col gap-0 border-l-0 p-0 sm:max-w-[560px]">
        <form
          onSubmit={salvar}
          className="flex h-full flex-col"
          noValidate
        >
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle className="text-[17px] tracking-[-0.01em]">
              {editando ? "Editar veículo" : "Cadastrar veículo"}
            </SheetTitle>

            <SheetDescription className="text-[13px]">
              {editando
                ? `Alterando ${veiculo.marca} ${veiculo.modelo}. Revise os dados e salve as alterações.`
                : "Preencha as informações do veículo e defina como ele deve entrar no estoque."}
            </SheetDescription>
          </SheetHeader>

          <div className="scroll-mac flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Marca" erro={erros.marca}>
                {(p) => (
                  <>
                    <Input
                      {...p}
                      id="campo-marca"
                      list="marcas-sugeridas"
                      value={form.marca}
                      onChange={(e) => campo("marca")(e.target.value)}
                      placeholder="Honda"
                      maxLength={50}
                      autoFocus={!editando}
                    />

                    <datalist id="marcas-sugeridas">
                      {MARCAS_SUGERIDAS.map((marca) => (
                        <option
                          key={marca}
                          value={marca}
                        />
                      ))}
                    </datalist>
                  </>
                )}
              </Field>

              <Field label="Modelo" erro={erros.modelo}>
                {(p) => (
                  <Input
                    {...p}
                    id="campo-modelo"
                    value={form.modelo}
                    onChange={(e) => campo("modelo")(e.target.value)}
                    placeholder="Civic"
                    maxLength={50}
                  />
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Versão"
                erro={erros.versao}
                opcional
                dica="Ex.: EXL, LTZ, Limited."
              >
                {(p) => (
                  <Input
                    {...p}
                    id="campo-versao"
                    value={form.versao}
                    onChange={(e) => campo("versao")(e.target.value)}
                    placeholder="EXL"
                    maxLength={50}
                  />
                )}
              </Field>

              <Field label="Ano" erro={erros.ano}>
                {(p) => (
                  <Input
                    {...p}
                    id="campo-ano"
                    inputMode="numeric"
                    className="tabular"
                    value={form.ano}
                    onChange={(e) =>
                      campo("ano")(
                        e.target.value.replace(/\D/g, "").slice(0, 4),
                      )
                    }
                    placeholder={String(new Date().getFullYear())}
                  />
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Cor" erro={erros.cor}>
                {(p) => (
                  <Input
                    {...p}
                    id="campo-cor"
                    value={form.cor}
                    onChange={(e) => campo("cor")(e.target.value)}
                    placeholder="Prata"
                    maxLength={30}
                  />
                )}
              </Field>

              <Field
                label="Quilometragem"
                erro={erros.quilometragem}
              >
                {(p) => (
                  <div className="relative">
                    <Input
                      {...p}
                      id="campo-quilometragem"
                      inputMode="numeric"
                      className="tabular pr-10"
                      value={form.quilometragem}
                      onChange={(e) =>
                        campo("quilometragem")(
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      placeholder="0"
                    />

                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[12px]">
                      km
                    </span>
                  </div>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Combustível">
                {(p) => (
                  <Select
                    value={form.combustivel}
                    onValueChange={(valor) =>
                      campo("combustivel")(valor as Combustivel)
                    }
                  >
                    <SelectTrigger
                      id="campo-combustivel"
                      className="w-full"
                      aria-describedby={p["aria-describedby"]}
                    >
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>

                    <SelectContent className="glass shadow-pop">
                      {COMBUSTIVEIS.map((item) => (
                        <SelectItem
                          key={item.valor}
                          value={item.valor}
                        >
                          {item.rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>

              <Field label="Câmbio">
                {(p) => (
                  <Select
                    value={form.cambio}
                    onValueChange={(valor) =>
                      campo("cambio")(valor as Cambio)
                    }
                  >
                    <SelectTrigger
                      id="campo-cambio"
                      className="w-full"
                      aria-describedby={p["aria-describedby"]}
                    >
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>

                    <SelectContent className="glass shadow-pop">
                      {CAMBIOS.map((item) => (
                        <SelectItem
                          key={item.valor}
                          value={item.valor}
                        >
                          {item.rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Placa"
                erro={erros.placa}
                opcional
                dica="Única quando preenchida."
              >
                {(p) => (
                  <Input
                    {...p}
                    id="campo-placa"
                    className="font-mono uppercase tracking-[0.08em]"
                    value={form.placa}
                    onChange={(e) =>
                      campo("placa")(
                        e.target.value
                          .replace(/[^A-Z0-9]/gi, "")
                          .toUpperCase()
                          .slice(0, 7),
                      )
                    }
                    placeholder="ABC1D23"
                  />
                )}
              </Field>

              <Field label="Preço" erro={erros.preco}>
                {(p) => (
                  <div className="relative">
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px]">
                      R$
                    </span>

                    <Input
                      {...p}
                      id="campo-preco"
                      inputMode="decimal"
                      className="tabular pl-9"
                      value={form.preco}
                      onChange={(e) =>
                        campo("preco")(e.target.value)
                      }
                      onBlur={() => {
                        const numero = paraNumero(form.preco)

                        if (numero !== null) {
                          campo("preco")(moedaCampo(numero))
                        }
                      }}
                      placeholder="0,00"
                    />
                  </div>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1">
              <Field label="Status">
                {(p) => (
                  <Select
                    value={form.status}
                    onValueChange={(valor) =>
                      campo("status")(valor as Status)
                    }
                  >
                    <SelectTrigger
                      id="campo-status"
                      className="w-full"
                      aria-describedby={p["aria-describedby"]}
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent className="glass shadow-pop">
                      {ORDEM_STATUS.map((status) => (
                        <SelectItem
                          key={status}
                          value={status}
                        >
                          <StatusDot status={status} />
                          {ROTULO_STATUS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
            </div>
          </div>

          <SheetFooter className="flex-row items-center justify-end gap-2 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              className="min-w-28"
            >
              {editando ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}