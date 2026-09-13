/** Formatação pt-BR: R$ 1.234,56 e dd/mm/aaaa. */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

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

export const moeda = (n: number) =>
  brl.format(n)

export const moedaCurta = (n: number) =>
  brlCurto.format(n)

/** R$ 1,2 mi — para eixos de gráfico e KPIs grandes. */
export const moedaCompacta = (n: number) =>
  `R$ ${compacto.format(n)}`

/** Valor para dentro de um input de texto: 129.900,00, sem o símbolo. */
export const moedaCampo = (n: number) =>
  decimal.format(n)

export const numero = (n: number) =>
  inteiro.format(n)

export const dataBR = (iso: string) => {
  if (!iso) {
    return ""
  }

  const [a, m, d] = iso.split("-")

  if (!a || !m || !d) {
    return iso
  }

  return `${d}/${m}/${a}`
}

/** "12 set" — para listas compactas. */
export const dataCurta = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number)

  return new Date(a, m - 1, d)
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })
    .replace(".", "")
}

export const hojeISO = () =>
  new Date().toISOString().slice(0, 10)

export const diasDesde = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number)

  const inicio = new Date(
    a,
    m - 1,
    d
  ).getTime()

  return Math.max(
    0,
    Math.floor(
      (Date.now() - inicio) / 86_400_000
    )
  )
}

/**
 * "112.000,00" ou "112000.00" → 112000.
 * Retorna null quando não há número válido.
 */
export function paraNumero(
  txt: string | number | null | undefined
): number | null {
  if (
    txt === null ||
    txt === undefined
  ) {
    return null
  }

  const limpo = String(txt)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")

  if (
    limpo === "" ||
    limpo === "-"
  ) {
    return null
  }

  const n = Number(limpo)

  return Number.isFinite(n)
    ? n
    : null
}

export const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) =>
      p[0]!.toUpperCase()
    )
    .join("")

/* --------------------------------------------------------------------------
   Utilitários básicos
   -------------------------------------------------------------------------- */

/** Remove tudo que não for número. */
export function somenteNumeros(
  valor: string
) {
  return valor.replace(/\D/g, "")
}

/* --------------------------------------------------------------------------
   CPF
   -------------------------------------------------------------------------- */

/**
 * Máscara de CPF.
 *
 * 84588873584
 * → 845.888.735-84
 */
export function mascaraCPF(
  valor: string
) {
  const numeros = somenteNumeros(
    valor
  ).slice(0, 11)

  return numeros
    .replace(
      /^(\d{3})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{3})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1-$2"
    )
}

/* --------------------------------------------------------------------------
   Telefone
   -------------------------------------------------------------------------- */

/**
 * Máscara de telefone brasileiro.
 *
 * 3432321234
 * → (34) 3232-1234
 *
 * 34988653285
 * → (34) 98865-3285
 */
export function mascaraTelefone(
  valor: string
) {
  const numeros = somenteNumeros(
    valor
  ).slice(0, 11)

  if (!numeros) {
    return ""
  }

  if (numeros.length <= 2) {
    return numeros.replace(
      /^(\d{0,2})/,
      "($1"
    )
  }

  if (numeros.length <= 6) {
    return numeros.replace(
      /^(\d{2})(\d+)/,
      "($1) $2"
    )
  }

  if (numeros.length <= 10) {
    return numeros.replace(
      /^(\d{2})(\d{4})(\d+)/,
      "($1) $2-$3"
    )
  }

  return numeros.replace(
    /^(\d{2})(\d{5})(\d{4})/,
    "($1) $2-$3"
  )
}

/* --------------------------------------------------------------------------
   Moeda
   -------------------------------------------------------------------------- */

/**
 * Máscara monetária brasileira.
 *
 * Digitação:
 *
 * 1
 * → 0,01
 *
 * 100
 * → 1,00
 *
 * 150000
 * → 1.500,00
 *
 * 9000000
 * → 90.000,00
 *
 * Não inclui "R$" dentro do input.
 */
export function mascaraMoeda(
  valor: string
) {
  const numeros = somenteNumeros(valor)

  if (!numeros) {
    return ""
  }

  const centavos =
    Number(numeros) / 100

  return centavos.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )
}

/**
 * Converte um valor monetário mascarado
 * para number.
 *
 * "90.000,00"
 * → 90000
 *
 * "1.500,50"
 * → 1500.5
 *
 * ""
 * → 0
 */
export function valorDaMascaraMoeda(
  valor: string
) {
  if (!valor.trim()) {
    return 0
  }

  const numeros =
    somenteNumeros(valor)

  if (!numeros) {
    return 0
  }

  return Number(numeros) / 100
}

/**
 * Converte number para o formato de input
 * monetário sem "R$".
 *
 * 90000
 * → "90.000,00"
 */
export function numeroParaMascaraMoeda(
  valor: number
) {
  if (
    !Number.isFinite(valor) ||
    valor < 0
  ) {
    return ""
  }

  return valor.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )
}

/* --------------------------------------------------------------------------
   Data
   -------------------------------------------------------------------------- */

/**
 * Máscara de data brasileira.
 *
 * 1
 * → 1
 *
 * 12
 * → 12
 *
 * 120
 * → 12/0
 *
 * 1209
 * → 12/09
 *
 * 12092026
 * → 12/09/2026
 */
export function mascaraData(
  valor: string
) {
  const numeros = somenteNumeros(
    valor
  ).slice(0, 8)

  if (!numeros) {
    return ""
  }

  if (numeros.length <= 2) {
    return numeros
  }

  if (numeros.length <= 4) {
    return `${numeros.slice(
      0,
      2
    )}/${numeros.slice(2)}`
  }

  return `${numeros.slice(
    0,
    2
  )}/${numeros.slice(
    2,
    4
  )}/${numeros.slice(4)}`
}

/**
 * Converte uma data brasileira mascarada
 * para o padrão ISO usado pelo sistema.
 *
 * "12/09/2026"
 * → "2026-09-12"
 *
 * Retorna "" se a data estiver incompleta
 * ou for inválida.
 */
export function dataMascaraParaISO(
  valor: string
) {
  const numeros =
    somenteNumeros(valor)

  if (numeros.length !== 8) {
    return ""
  }

  const dia = Number(
    numeros.slice(0, 2)
  )

  const mes = Number(
    numeros.slice(2, 4)
  )

  const ano = Number(
    numeros.slice(4, 8)
  )

  if (
    ano < 1900 ||
    mes < 1 ||
    mes > 12 ||
    dia < 1 ||
    dia > 31
  ) {
    return ""
  }

  const data = new Date(
    ano,
    mes - 1,
    dia
  )

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return ""
  }

  return `${String(ano).padStart(
    4,
    "0"
  )}-${String(mes).padStart(
    2,
    "0"
  )}-${String(dia).padStart(
    2,
    "0"
  )}`
}

/**
 * Converte a data ISO usada internamente
 * para o formato brasileiro.
 *
 * "2026-09-12"
 * → "12/09/2026"
 */
export function dataISOParaMascara(
  iso: string
) {
  if (!iso) {
    return ""
  }

  const [ano, mes, dia] =
    iso.split("-")

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return ""
  }

  return `${dia}/${mes}/${ano}`
}

/**
 * Verifica se uma data no formato
 * dd/mm/aaaa representa uma data real.
 */
export function dataMascaraValida(
  valor: string
) {
  return (
    dataMascaraParaISO(valor) !== ""
  )
}