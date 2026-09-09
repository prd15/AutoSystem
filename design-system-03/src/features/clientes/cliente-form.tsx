import { Field } from "@/components/field"
import { Input } from "@/components/ui/input"
import { store } from "@/data/store"
import { cn } from "@/lib/utils"

export type ClienteFormDados = {
  nome: string
  cpf: string
  telefone: string
  email: string
}

export const clienteVazio: ClienteFormDados = { nome: "", cpf: "", telefone: "", email: "" }

export function mascaraCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

export function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2")
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2")
}

function cpfValido(cpf: string) {
  const d = cpf.replace(/\D/g, "")
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  const calc = (n: number) => {
    let soma = 0
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i)
    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10])
}

export function validarCliente(c: ClienteFormDados): Partial<Record<keyof ClienteFormDados, string>> {
  const e: Partial<Record<keyof ClienteFormDados, string>> = {}
  if (!c.nome.trim()) e.nome = "Informe o nome do cliente."
  else if (c.nome.trim().length > 100) e.nome = "O nome deve ter até 100 caracteres."

  if (!c.cpf.trim()) e.cpf = "Informe o CPF."
  else if (!cpfValido(c.cpf)) e.cpf = "CPF inválido. Confira os dígitos."
  else if (store.cpfEmUso(c.cpf)) e.cpf = "Já existe um cliente com este CPF."

  if (!c.telefone.trim()) e.telefone = "Informe o telefone."
  else if (c.telefone.replace(/\D/g, "").length < 10) e.telefone = "Telefone incompleto. Inclua o DDD."

  if (c.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()))
    e.email = "E-mail em formato inválido."
  return e
}

/** Campos de cliente. Usado no cadastro completo e no cadastro rápido dentro da venda. */
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
  const set = <K extends keyof ClienteFormDados>(k: K, v: string) => onChange({ ...dados, [k]: v })
  const h = compacto ? "h-9" : "h-10"

  return (
    <div className={cn("grid gap-4", compacto ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
      <Field label="Nome completo" erro={erros.nome} className="sm:col-span-2">
        {(p) => (
          <Input
            {...p}
            className={cn("bg-card", h)}
            value={dados.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="Marina Alves Ribeiro"
            maxLength={100}
            autoFocus
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
          />
        )}
      </Field>
      <Field label="Telefone" erro={erros.telefone}>
        {(p) => (
          <Input
            {...p}
            inputMode="tel"
            className={cn("bg-card tabular", h)}
            value={dados.telefone}
            onChange={(e) => set("telefone", mascaraTelefone(e.target.value))}
            placeholder="(11) 90000-0000"
          />
        )}
      </Field>
      <Field label="E-mail" erro={erros.email} opcional className="sm:col-span-2">
        {(p) => (
          <Input
            {...p}
            type="email"
            className={cn("bg-card", h)}
            value={dados.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="nome@email.com"
            maxLength={100}
          />
        )}
      </Field>
    </div>
  )
}
