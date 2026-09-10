import { parcelaPrice, type Financiamento } from "@/data/store"

/** Soma `n` meses a uma data ISO, preservando o dia quando possível. */
export function somarMeses(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number)
  const alvo = new Date(a!, m! - 1 + n, 1)
  const ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate()
  alvo.setDate(Math.min(d!, ultimo))
  return alvo.toISOString().slice(0, 10)
}

export function proximaParcela(f: Financiamento): string | null {
  if (f.parcelas_pagas >= f.parcelas) return null
  return somarMeses(f.inicio, f.parcelas_pagas)
}

export type LinhaPrice = { n: number; parcela: number; juros: number; amortizacao: number; saldo: number }

export type Simulacao = {
  financiado: number
  parcela: number
  total: number
  juros: number
  /** Custo efetivo anual aproximado: (1 + i)^12 − 1. */
  cetAnual: number
  tabela: LinhaPrice[]
}

/** Simulação pela Tabela Price. `taxa` em fração mensal (0.0189 = 1,89%). */
export function simular(valorVeiculo: number, entrada: number, parcelas: number, taxa: number): Simulacao {
  const financiado = Math.max(0, valorVeiculo - entrada)
  const parcela = parcelaPrice(financiado, taxa, parcelas)
  const tabela: LinhaPrice[] = []
  let saldo = financiado
  for (let n = 1; n <= parcelas; n++) {
    const juros = saldo * taxa
    const amortizacao = parcela - juros
    saldo = Math.max(0, saldo - amortizacao)
    tabela.push({ n, parcela, juros, amortizacao, saldo })
  }
  const total = parcela * parcelas
  return {
    financiado,
    parcela,
    total,
    juros: total - financiado,
    cetAnual: Math.pow(1 + taxa, 12) - 1,
    tabela,
  }
}

export const percentual = (fracao: number, casas = 2) =>
  `${(fracao * 100).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`
