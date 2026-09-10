/** Formatação pt-BR: R$ 1.234,56 e dd/mm/aaaa (requisito não funcional do escopo). */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const brlCurto = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
})
const decimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const inteiro = new Intl.NumberFormat("pt-BR")
const compacto = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
})

export const moeda = (n: number) => brl.format(n)
export const moedaCurta = (n: number) => brlCurto.format(n)
/** R$ 1,2 mi — para eixos de gráfico e KPIs grandes. */
export const moedaCompacta = (n: number) => `R$ ${compacto.format(n)}`
/** Valor para dentro de um input de texto: 129.900,00, sem o símbolo. */
export const moedaCampo = (n: number) => decimal.format(n)
export const numero = (n: number) => inteiro.format(n)

export const dataBR = (iso: string) => {
  const [a, m, d] = iso.split("-")
  return `${d}/${m}/${a}`
}

/** "12 set" — para listas compactas. */
export const dataCurta = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number)
  return new Date(a, m - 1, d)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "")
}

export const hojeISO = () => new Date().toISOString().slice(0, 10)

export const diasDesde = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number)
  const inicio = new Date(a, m - 1, d).getTime()
  return Math.max(0, Math.floor((Date.now() - inicio) / 86_400_000))
}

/** "112.000,00" ou "112000.00" → 112000. null quando não há número. */
export function paraNumero(txt: string | number | null | undefined): number | null {
  if (txt === null || txt === undefined) return null
  const limpo = String(txt).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")
  if (limpo === "" || limpo === "-") return null
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

export const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("")
