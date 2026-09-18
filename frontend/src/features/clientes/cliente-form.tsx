import { Field } from "@/components/field"
import { Input } from "@/components/ui/input"
import { store } from "@/data/store"
import { mascaraCPF, mascaraTelefone } from "@/lib/format"
import { cn } from "@/lib/utils"

export type ClienteFormDados = {
  nome: string
  sobrenome?: string
  cpf: string
  telefone: string
  email: string
}

export const clienteVazio: ClienteFormDados = {
  nome: "",
  sobrenome: "",
  cpf: "",
  telefone: "",
  email: "",
}

function somenteLetras(valor: string) {
  return valor.replace(/[^\p{L}\s]/gu, "").replace(/\s{2,}/g, " ")
}

function nomeValido(valor: string) {
  return /^[\p{L}]+(?:\s+[\p{L}]+)*$/u.test(valor.trim())
}

function cpfValido(cpf: string) {
  const d = cpf.replace(/\D/g, "")

  if (d.length !== 11 || /^(\d)\1+$/.test(d)) {
    return false
  }

  const calc = (n: number) => {
    let soma = 0

    for (let i = 0; i < n; i++) {
      soma += Number(d[i]) * (n + 1 - i)
    }

    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }

  return calc(9) === Number(d[9]) && calc(10) === Number(d[10])
}

export function separarNomeCompleto(nomeCompleto: string) {
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean)

  return {
    nome: partes[0] ?? "",
    sobrenome: partes.slice(1).join(" "),
  }
}

export function validarCliente(
  c: ClienteFormDados,
  ignorarId?: number,
  cpfOriginal?: string
): Partial<Record<keyof ClienteFormDados, string>> {
  const e: Partial<Record<keyof ClienteFormDados, string>> = {}

  if (!c.nome.trim()) {
    e.nome = "Informe o nome do cliente."
  } else if (!nomeValido(c.nome)) {
    e.nome = "Use apenas letras no nome."
  } else if (c.nome.trim().length > 50) {
    e.nome = "O nome deve ter até 50 caracteres."
  }

  if (!c.sobrenome?.trim()) {
    e.sobrenome = "Informe o sobrenome do cliente."
  } else if (!nomeValido(c.sobrenome)) {
    e.sobrenome = "Use apenas letras no sobrenome."
  } else if (c.sobrenome.trim().length > 80) {
    e.sobrenome = "O sobrenome deve ter até 80 caracteres."
  }

  const cpfAtual = c.cpf.replace(/\D/g, "")
  const cpfAnterior = cpfOriginal?.replace(/\D/g, "")
  const cpfFoiAlterado = !cpfAnterior || cpfAtual !== cpfAnterior

  if (!c.cpf.trim()) {
    e.cpf = "Informe o CPF."
  } else if (cpfFoiAlterado && !cpfValido(c.cpf)) {
    e.cpf = "CPF inválido. Confira os dígitos."
  } else if (store.cpfEmUso(c.cpf, ignorarId)) {
    e.cpf = "Já existe um cliente com este CPF."
  }

  if (!c.telefone.trim()) {
    e.telefone = "Informe o telefone."
  } else if (c.telefone.replace(/\D/g, "").length < 10) {
    e.telefone = "Telefone incompleto. Inclua o DDD."
  }

  if (
    c.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())
  ) {
    e.email = "E-mail em formato inválido."
  }

  return e
}

/**
 * Campos de cliente.
 * Usado no cadastro completo e no cadastro rápido dentro da venda.
 */
export function ClienteForm({
  dados,
  onChange,
  erros,
  compacto,
}: {
  dados: ClienteFormDados
  onChange: (d: ClienteFormDados) => void
  erros: Partial<Record<keyof ClienteFormDados, string>>
  compacto?: boolean
}) {
  const set = <K extends keyof ClienteFormDados>(k: K, v: string) => {
    onChange({
      ...dados,
      [k]: v,
    })
  }

  const h = compacto ? "h-9" : "h-10"

  return (
    <div className={cn("grid gap-4", "sm:grid-cols-2")}>
      <Field label="Nome" erro={erros.nome}>
        {(p) => (
          <Input
            {...p}
            className={cn("bg-card", h)}
            value={dados.nome}
            onChange={(e) => set("nome", somenteLetras(e.target.value))}
            placeholder="Marina"
            maxLength={50}
            autoComplete="given-name"
            autoFocus
          />
        )}
      </Field>

      <Field label="Sobrenome" erro={erros.sobrenome}>
        {(p) => (
          <Input
            {...p}
            className={cn("bg-card", h)}
            value={dados.sobrenome ?? ""}
            onChange={(e) => set("sobrenome", somenteLetras(e.target.value))}
            placeholder="Alves Ribeiro"
            maxLength={80}
            autoComplete="family-name"
          />
        )}
      </Field>

      <Field label="CPF" erro={erros.cpf}>
        {(p) => (
          <Input
            {...p}
            inputMode="numeric"
            className={cn("bg-card tabular", h)}
            value={dados.cpf}
            onChange={(e) => set("cpf", mascaraCPF(e.target.value))}
            placeholder="000.000.000-00"
            autoComplete="off"
          />
        )}
      </Field>

      <Field label="Telefone" erro={erros.telefone}>
        {(p) => (
          <Input
            {...p}
            inputMode="numeric"
            className={cn("bg-card tabular", h)}
            value={dados.telefone}
            onChange={(e) =>
              set("telefone", mascaraTelefone(e.target.value))
            }
            placeholder="(11) 90000-0000"
            autoComplete="tel"
          />
        )}
      </Field>

      <Field
        label="E-mail"
        erro={erros.email}
        opcional
        className="sm:col-span-2"
      >
        {(p) => (
          <Input
            {...p}
            type="email"
            className={cn("bg-card", h)}
            value={dados.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="nome@email.com"
            maxLength={100}
            autoComplete="email"
          />
        )}
      </Field>
    </div>
  )
}
