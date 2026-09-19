import { useSyncExternalStore } from "react"

/**
 * Estado da aplicação em memória, com as regras de negócio do escopo.
 * Nenhuma chamada de rede: quando o back existir, cada método vira um fetch
 * para o endpoint correspondente e a interface não muda.
 */

export type Status = "disponivel" | "reservado" | "vendido"

export type Combustivel =
  | "gasolina"
  | "etanol"
  | "flex"
  | "diesel"
  | "hibrido"
  | "eletrico"

export type Cambio =
  | "manual"
  | "automatico"
  | "automatizado"
  | "cvt"

export type Veiculo = {
  id: number
  marca: string
  modelo: string
  versao?: string
  ano: number
  cor: string
  quilometragem: number
  combustivel?: Combustivel
  cambio?: Cambio
  preco: number
  placa: string
  status: Status
  /** timestamp do escopo, usado para "dias em estoque". */
  criado_em: string // yyyy-mm-dd
}

export type Cliente = {
  id: number
  nome: string
  cpf: string
  telefone: string
  email: string
  criado_em: string
}

export type StatusFuncionario = "ativo" | "inativo"

export type CargoFuncionario =
  | "gerente"
  | "vendedor"
  | "financeiro"
  | "administrativo"
  | "mecanico"

export type Funcionario = {
  id: number
  nome: string
  cpf: string
  telefone: string
  email: string
  cargo: CargoFuncionario
  comissao: number
  status: StatusFuncionario
  data_admissao: string
}

export const ROTULO_CARGO: Record<CargoFuncionario, string> = {
  gerente: "Gerente",
  vendedor: "Vendedor(a)",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
  mecanico: "Mecânico",
}

export type TipoPagamentoVenda =
  | "avista"
  | "financiamento"
  | "consorcio"

export type Venda = {
  id: number
  veiculo_id: number
  cliente_id: number
  vendedor: string
  valor_venda: number
  data_venda: string // yyyy-mm-dd
  forma_pagamento: TipoPagamentoVenda
  financiamento_id: number | null
  consorcio_id: number | null
}

/* ---------------------------------------------------------------------------
   Financeiro
   --------------------------------------------------------------------------- */

export type TipoLancamento = "entrada" | "saida"
export type StatusLancamento = "pago" | "pendente"
export type CategoriaLancamento =
  | "venda"
  | "compra_veiculo"
  | "comissao"
  | "despesa_fixa"
  | "oficina"
  | "marketing"
  | "impostos"
  | "financiamento"
  | "outros"
export type FormaPagamento = "pix" | "transferencia" | "boleto" | "cartao" | "dinheiro" | "financiamento" | "consorcio"

export type Lancamento = {
  id: number
  tipo: TipoLancamento
  categoria: CategoriaLancamento
  descricao: string
  valor: number
  /** Data de competência ou vencimento (yyyy-mm-dd). */
  data: string
  status: StatusLancamento
  forma: FormaPagamento | null
  /** Vínculos: lançamentos gerados por uma venda não podem ser excluídos. */
  venda_id: number | null
  veiculo_id: number | null
  vendedor: string | null
}

export type StatusFinanciamento =
  | "em_analise"
  | "aprovado"
  | "ativo"
  | "quitado"
  | "cancelado"

export type Financiamento = {
  id: number
  cliente_id: number
  veiculo_id: number
  vendedor: string | null
  banco: string
  valor_veiculo: number
  entrada: number
  valor_financiado: number
  parcelas: number
  taxa_mensal: number // 0.0189 = 1,89% a.m.
  valor_parcela: number
  valor_total_financiamento: number
  inicio: string // yyyy-mm-dd da primeira parcela
  parcelas_pagas: number
  status: StatusFinanciamento
}

export type NovoFinanciamentoVenda = {
  banco: string
  valor_veiculo: number
  entrada: number
  parcelas: number
  taxa_mensal: number
  inicio: string
}

export type StatusConsorcio =
  | "em_analise"
  | "ativo"
  | "contemplado"
  | "cancelado"
  | "encerrado"

export type TipoLanceConsorcio =
  | "sem_lance"
  | "livre"
  | "fixo"

export type Consorcio = {
  id: number
  numero_cota: number
  cliente_id: number
  vendedor: string
  administradora: string
  grupo: string
  valor_carta: number
  taxa_administracao?: number
  fundo_reserva?: number
  seguro?: number
  valor_total_plano?: number
  parcelas: number
  valor_parcela: number
  data_adesao: string
  status: StatusConsorcio
  tipo_lance: TipoLanceConsorcio
  valor_lance: number | null
  veiculo_id: number | null
}

export type GrupoConsorcio = {
  codigo: string
  descricao: string
  limite_carta: number
  taxa_administracao: number
  fundo_reserva: number
  seguro: number
}

export const GRUPOS_CONSORCIO: GrupoConsorcio[] = [
  {
    codigo: "GRP-2026-01",
    descricao: "Automóveis até R$ 80 mil",
    limite_carta: 80000,
    taxa_administracao: 16,
    fundo_reserva: 2,
    seguro: 0,
  },
  {
    codigo: "GRP-2026-02",
    descricao: "Automóveis até R$ 120 mil",
    limite_carta: 120000,
    taxa_administracao: 17,
    fundo_reserva: 2,
    seguro: 0,
  },
  {
    codigo: "GRP-2026-03",
    descricao: "Automóveis até R$ 160 mil",
    limite_carta: 160000,
    taxa_administracao: 18,
    fundo_reserva: 2,
    seguro: 0,
  },
  {
    codigo: "GRP-2026-04",
    descricao: "Automóveis até R$ 220 mil",
    limite_carta: 220000,
    taxa_administracao: 19,
    fundo_reserva: 2,
    seguro: 0,
  },
  {
    codigo: "GRP-2026-05",
    descricao: "Automóveis Premium",
    limite_carta: 400000,
    taxa_administracao: 20,
    fundo_reserva: 2,
    seguro: 0,
  },
]

export function calcularPlanoConsorcio(
  valorCarta: number,
  taxaAdministracao: number,
  fundoReserva: number,
  seguro: number,
  parcelas: number
) {
  const taxaAdministracaoValor =
    valorCarta * (taxaAdministracao / 100)
  const fundoReservaValor =
    valorCarta * (fundoReserva / 100)
  const seguroValor =
    valorCarta * (seguro / 100)

  const valorTotalPlano =
    valorCarta +
    taxaAdministracaoValor +
    fundoReservaValor +
    seguroValor

  const valorParcela =
    parcelas > 0 ? valorTotalPlano / parcelas : 0

  return {
    taxa_administracao_valor:
      Math.round(taxaAdministracaoValor * 100) / 100,
    fundo_reserva_valor:
      Math.round(fundoReservaValor * 100) / 100,
    seguro_valor:
      Math.round(seguroValor * 100) / 100,
    valor_total_plano:
      Math.round(valorTotalPlano * 100) / 100,
    valor_parcela:
      Math.round(valorParcela * 100) / 100,
  }
}

export const ROTULO_STATUS_CONSORCIO: Record<StatusConsorcio, string> = {
  em_analise: "Em análise",
  ativo: "Ativo",
  contemplado: "Contemplado",
  cancelado: "Cancelado",
  encerrado: "Encerrado",
}

export const ROTULO_TIPO_LANCE: Record<TipoLanceConsorcio, string> = {
  sem_lance: "Sem lance",
  livre: "Lance livre",
  fixo: "Lance fixo",
}

export const ROTULO_CATEGORIA: Record<CategoriaLancamento, string> = {
  venda: "Venda de veículo",
  compra_veiculo: "Compra de veículo",
  comissao: "Comissão",
  despesa_fixa: "Despesa fixa",
  oficina: "Oficina e peças",
  marketing: "Marketing",
  impostos: "Impostos e taxas",
  financiamento: "Parcela de financiamento",
  outros: "Outros",
}

export const ROTULO_FORMA: Record<FormaPagamento, string> = {
  pix: "Pix",
  transferencia: "Transferência",
  boleto: "Boleto",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  financiamento: "Financiamento",
  consorcio: "Consórcio",
}

export const BANCOS = [
  "Banco do Brasil",
  "Bradesco",
  "Itaú",
  "Santander",
  "Caixa",
  "BV Financeira",
]

export const PARCELAS_FINANCIAMENTO = [
  12,
  24,
  36,
  48,
  60,
  72,
] as const

export const ROTULO_STATUS_FINANCIAMENTO: Record<
  StatusFinanciamento,
  string
> = {
  em_analise: "Em análise",
  aprovado: "Aprovado",
  ativo: "Ativo",
  quitado: "Quitado",
  cancelado: "Cancelado",
}

export const ROTULO_STATUS: Record<Status, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
}

export const ORDEM_STATUS: Status[] = ["disponivel", "reservado", "vendido"]

/**
 * Lista legada mantida temporariamente para compatibilidade com componentes
 * que ainda serão migrados para store.vendedoresAtivos().
 */
export const VENDEDORES = ["Patrícia Gomes", "Alan Ferreira", "Beatriz Ramos", "Caio Monteiro"]

function diasAtras(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/** Último dia do mês da data informada: comissões vencem no fechamento do mês da venda. */
function fimDoMes(iso: string) {
  const [a, m] = iso.split("-").map(Number)
  return new Date(a!, m!, 0).toISOString().slice(0, 10)
}

/** Dia `dia` de `n` meses atrás; dia 0 = último dia do mês. */
function mesAtras(n: number, dia: number) {
  const hoje = new Date()
  const d = dia === 0 ? new Date(hoje.getFullYear(), hoje.getMonth() - n + 1, 0) : new Date(hoje.getFullYear(), hoje.getMonth() - n, dia)
  return d.toISOString().slice(0, 10)
}

export const LIMITE_DESCONTO_PADRAO = 10

const CHAVE_CONFIGURACOES = "autosystem.configuracoes"

export function limiteDescontoConfigurado() {
  if (typeof window === "undefined") {
    return LIMITE_DESCONTO_PADRAO
  }

  try {
    const salvo = window.localStorage.getItem(CHAVE_CONFIGURACOES)
    if (!salvo) return LIMITE_DESCONTO_PADRAO

    const dados = JSON.parse(salvo)
    const bruto = dados?.comercial?.limiteDesconto
    const numero =
      typeof bruto === "number"
        ? bruto
        : Number(String(bruto ?? "").replace(",", "."))

    return Number.isFinite(numero) && numero >= 0 && numero <= LIMITE_DESCONTO_PADRAO
      ? numero
      : LIMITE_DESCONTO_PADRAO
  } catch {
    return LIMITE_DESCONTO_PADRAO
  }
}

function validarDescontoVenda(
  precoTabela: number,
  valorVenda: number,
  formaPagamento: TipoPagamentoVenda
): { ok: true; percentual: number } | { erro: string } {
  if (valorVenda <= 0) {
    return { erro: "O valor da venda deve ser maior que zero." }
  }

  if (precoTabela <= 0 || valorVenda >= precoTabela) {
    return { ok: true, percentual: 0 }
  }

  const desconto = ((precoTabela - valorVenda) / precoTabela) * 100

  if (formaPagamento !== "avista") {
    return { erro: "Desconto é permitido somente em vendas à vista." }
  }

  const limite = limiteDescontoConfigurado()

  if (desconto > limite + 0.000001) {
    return {
      erro: `O desconto de ${desconto.toFixed(2).replace(".", ",")}% ultrapassa o limite permitido de ${limite.toFixed(2).replace(".", ",")}%.`,
    }
  }

  return { ok: true, percentual: desconto }
}

type Estado = {
  veiculos: Veiculo[]
  clientes: Cliente[]
  funcionarios: Funcionario[]
  vendas: Venda[]
  lancamentos: Lancamento[]
  financiamentos: Financiamento[]
  consorcios: Consorcio[]
}

/** Parcela pela Tabela Price. */
export function parcelaPrice(principal: number, taxaMensal: number, n: number) {
  if (n <= 0) return 0
  if (taxaMensal === 0) return principal / n
  return (principal * taxaMensal) / (1 - Math.pow(1 + taxaMensal, -n))
}

function taxaComissaoDoVendedor(
  vendedor: string,
  funcionarios: Funcionario[]
) {
  const funcionario = funcionarios.find(
    (f) =>
      f.nome === vendedor &&
      f.cargo === "vendedor"
  )

  return funcionario ? funcionario.comissao / 100 : 0
}

function seedFinanceiro(
  vendas: Venda[],
  veiculos: Veiculo[],
  funcionarios: Funcionario[]
): { lancamentos: Lancamento[]; financiamentos: Financiamento[] } {
  const l: Omit<Lancamento, "id">[] = []
  const base = { forma: null, venda_id: null, veiculo_id: null, vendedor: null } as const

  // Entradas de venda + comissão de cada venda do seed.
  for (const v of vendas) {
    const veic = veiculos.find((x) => x.id === v.veiculo_id)!
    l.push({
      ...base,
      tipo: "entrada",
      categoria: "venda",
      descricao: `Venda ${veic.marca} ${veic.modelo}`,
      valor: v.valor_venda,
      data: v.data_venda,
      status: "pago",
      forma:
        v.forma_pagamento === "financiamento"
          ? "financiamento"
          : v.forma_pagamento === "consorcio"
            ? "consorcio"
            : "pix",
      venda_id: v.id,
      veiculo_id: v.veiculo_id,
    })
    l.push({
      ...base,
      tipo: "saida",
      categoria: "comissao",
      descricao: `Comissão ${v.vendedor} · ${veic.marca} ${veic.modelo}`,
      valor:
        Math.round(
          v.valor_venda *
            taxaComissaoDoVendedor(v.vendedor, funcionarios) *
            100
        ) / 100,
      data: fimDoMes(v.data_venda),
      status: v.id === 2 || v.id === 4 ? "pago" : "pendente",
      forma: v.id === 2 || v.id === 4 ? "pix" : null,
      venda_id: v.id,
      veiculo_id: v.veiculo_id,
      vendedor: v.vendedor,
    })
  }

  // Compra dos veículos (custo de aquisição ≈ 82% do preço de tabela).
  const custos: Record<number, number> = { 1: 0.8, 2: 0.83, 3: 0.81, 5: 0.84, 6: 0.85, 7: 0.8, 8: 0.86, 10: 0.82, 12: 0.79, 13: 0.83, 14: 0.82, 15: 0.81 }
  for (const veic of veiculos) {
    const fator = custos[veic.id]
    if (!fator) continue
    l.push({
      ...base,
      tipo: "saida",
      categoria: "compra_veiculo",
      descricao: `Compra ${veic.marca} ${veic.modelo}`,
      valor: Math.round((veic.preco * fator) / 100) * 100,
      data: veic.criado_em,
      status: "pago",
      forma: "transferencia",
      veiculo_id: veic.id,
    })
  }

  // Despesas fixas e variáveis dos últimos 6 meses.
  for (let m = 5; m >= 0; m--) {
    const atual = m === 0
    l.push({ ...base, tipo: "saida", categoria: "despesa_fixa", descricao: "Aluguel do pátio e loja", valor: 8500, data: mesAtras(m, 10), status: atual ? "pendente" : "pago", forma: atual ? null : "boleto" })
    l.push({ ...base, tipo: "saida", categoria: "despesa_fixa", descricao: "Folha de pagamento", valor: 21400, data: mesAtras(m, 5), status: atual ? "pendente" : "pago", forma: atual ? null : "transferencia" })
    l.push({ ...base, tipo: "saida", categoria: "despesa_fixa", descricao: "Energia, água e internet", valor: 1250 + m * 40, data: mesAtras(m, 15), status: atual ? "pendente" : "pago", forma: atual ? null : "boleto" })
    l.push({ ...base, tipo: "saida", categoria: "marketing", descricao: "Anúncios em portais de veículos", valor: 1800, data: mesAtras(m, 3), status: "pago", forma: "cartao" })
    if (m % 2 === 0) l.push({ ...base, tipo: "saida", categoria: "oficina", descricao: "Peças e preparação de veículos", valor: 2350 + m * 120, data: mesAtras(m, 18), status: "pago", forma: "pix" })
    if (m > 0) l.push({ ...base, tipo: "saida", categoria: "impostos", descricao: "Simples Nacional", valor: 3900 + m * 150, data: mesAtras(m, 20), status: "pago", forma: "boleto" })
    if (m > 0 && m < 5) l.push({ ...base, tipo: "entrada", categoria: "oficina", descricao: "Serviços de oficina a terceiros", valor: 3200 + m * 300, data: mesAtras(m, 25), status: "pago", forma: "pix" })
  }
  // Pendências do mês atual.
  l.push({ ...base, tipo: "saida", categoria: "impostos", descricao: "IPVA de veículos em estoque", valor: 4620, data: mesAtras(0, 22), status: "pendente" })
  l.push({ ...base, tipo: "entrada", categoria: "outros", descricao: "Repasse de seguro (sinistro pátio)", valor: 6800, data: mesAtras(0, 12), status: "pendente" })
  l.push({ ...base, tipo: "saida", categoria: "oficina", descricao: "Retífica de motor · Fiat Argo", valor: 2900, data: mesAtras(1, 27), status: "pendente", veiculo_id: 4 })

  // Vendas com financiamento viram contratos; a loja recebe do banco, o cliente paga parcelas.
  const financiamentos: Financiamento[] = [
    (() => {
      const valorVeiculo = 109500
      const entrada = 25000
      const valorFinanciado = valorVeiculo - entrada
      const taxa = 0.0189
      const parcelas = 48
      const valorParcela =
        Math.round(
          parcelaPrice(
            valorFinanciado,
            taxa,
            parcelas
          ) * 100
        ) / 100

      return {
        id: 1,
        cliente_id: 1,
        veiculo_id: 3,
        vendedor: "Patrícia Gomes",
        banco: "Itaú",
        valor_veiculo: valorVeiculo,
        entrada,
        valor_financiado: valorFinanciado,
        parcelas,
        taxa_mensal: taxa,
        valor_parcela: valorParcela,
        valor_total_financiamento:
          Math.round(
            valorParcela * parcelas * 100
          ) / 100,
        inicio: mesAtras(0, 5),
        parcelas_pagas: 1,
        status: "ativo" as StatusFinanciamento,
      }
    })(),
    (() => {
      const valorVeiculo = 101900
      const entrada = 30000
      const valorFinanciado = valorVeiculo - entrada
      const taxa = 0.0175
      const parcelas = 36
      const valorParcela =
        Math.round(
          parcelaPrice(
            valorFinanciado,
            taxa,
            parcelas
          ) * 100
        ) / 100

      return {
        id: 2,
        cliente_id: 4,
        veiculo_id: 14,
        vendedor: "Beatriz Ramos",
        banco: "Banco do Brasil",
        valor_veiculo: valorVeiculo,
        entrada,
        valor_financiado: valorFinanciado,
        parcelas,
        taxa_mensal: taxa,
        valor_parcela: valorParcela,
        valor_total_financiamento:
          Math.round(
            valorParcela * parcelas * 100
          ) / 100,
        inicio: mesAtras(3, 10),
        parcelas_pagas: 3,
        status: "ativo" as StatusFinanciamento,
      }
    })(),
    (() => {
      const valorVeiculo = 51000
      const entrada = 11000
      const valorFinanciado = valorVeiculo - entrada
      const taxa = 0.021
      const parcelas = 24
      const valorParcela =
        Math.round(
          parcelaPrice(
            valorFinanciado,
            taxa,
            parcelas
          ) * 100
        ) / 100

      return {
        id: 3,
        cliente_id: 2,
        veiculo_id: 6,
        vendedor: "Alan Ferreira",
        banco: "BV Financeira",
        valor_veiculo: valorVeiculo,
        entrada,
        valor_financiado: valorFinanciado,
        parcelas,
        taxa_mensal: taxa,
        valor_parcela: valorParcela,
        valor_total_financiamento:
          Math.round(
            valorParcela * parcelas * 100
          ) / 100,
        inicio: mesAtras(1, 15),
        parcelas_pagas: 1,
        status: "ativo" as StatusFinanciamento,
      }
    })(),
  ]

  return {
    lancamentos: l.map((x, i) => ({ id: i + 1, ...x })).sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id),
    financiamentos,
  }
}

function seed(): Estado {
  const base = seedBase()

  const consorcios: Consorcio[] = [
    {
      id: 1,
      numero_cota: 18427,
      cliente_id: 5,
      vendedor: "Beatriz Ramos",
      administradora: "AutoSystem Consórcios",
      grupo: "GRP-2026-01",
      valor_carta: 120000,
      taxa_administracao: 17,
      fundo_reserva: 2,
      seguro: 0,
      valor_total_plano: 142800,
      parcelas: 80,
      valor_parcela: 1785,
      data_adesao: diasAtras(24),
      status: "ativo",
      tipo_lance: "sem_lance",
      valor_lance: null,
      veiculo_id: null,
    },
    {
      id: 2,
      numero_cota: 57361,
      cliente_id: 3,
      vendedor: "Patrícia Gomes",
      administradora: "AutoSystem Consórcios",
      grupo: "GRP-2026-02",
      valor_carta: 150000,
      taxa_administracao: 18,
      fundo_reserva: 2,
      seguro: 0,
      valor_total_plano: 180000,
      parcelas: 100,
      valor_parcela: 1800,
      data_adesao: diasAtras(47),
      status: "contemplado",
      tipo_lance: "livre",
      valor_lance: 30000,
      veiculo_id: 12,
    },
  ]

  return {
    ...base,
    ...seedFinanceiro(
      base.vendas,
      base.veiculos,
      base.funcionarios
    ),
    consorcios,
  }
}

function seedBase(): Pick<
  Estado,
  "veiculos" | "clientes" | "funcionarios" | "vendas"
> {
  return {
    veiculos: [
      { id: 1, marca: "Honda", modelo: "Civic EXL", ano: 2021, cor: "Prata", quilometragem: 42300, preco: 129900, placa: "RKA2B31", status: "disponivel", criado_em: diasAtras(18) },
      { id: 2, marca: "Toyota", modelo: "Corolla XEi", ano: 2020, cor: "Preto", quilometragem: 58910, preco: 118500, placa: "PQT7C09", status: "reservado", criado_em: diasAtras(41) },
      { id: 3, marca: "Volkswagen", modelo: "Nivus Highline", ano: 2022, cor: "Branco", quilometragem: 21040, preco: 112000, placa: "SDF4J77", status: "vendido", criado_em: diasAtras(66) },
      { id: 4, marca: "Fiat", modelo: "Argo Drive", ano: 2019, cor: "Vermelho", quilometragem: 76500, preco: 62400, placa: "MNB1A22", status: "disponivel", criado_em: diasAtras(97) },
      { id: 5, marca: "Chevrolet", modelo: "Onix LTZ", ano: 2021, cor: "Cinza", quilometragem: 38200, preco: 74900, placa: "LKJ9F55", status: "disponivel", criado_em: diasAtras(9) },
      { id: 6, marca: "Hyundai", modelo: "HB20 Comfort", ano: 2018, cor: "Branco", quilometragem: 91300, preco: 52800, placa: "GTR3E18", status: "vendido", criado_em: diasAtras(120) },
      { id: 7, marca: "Jeep", modelo: "Renegade Sport", ano: 2022, cor: "Verde", quilometragem: 18700, preco: 128700, placa: "BVC6H44", status: "disponivel", criado_em: diasAtras(27) },
      { id: 8, marca: "Renault", modelo: "Kwid Zen", ano: 2023, cor: "Laranja", quilometragem: 9800, preco: 59900, placa: "ZXC8K90", status: "disponivel", criado_em: diasAtras(4) },
      { id: 9, marca: "Ford", modelo: "Ka SE", ano: 2019, cor: "Prata", quilometragem: 68400, preco: 48900, placa: "QWE5L31", status: "reservado", criado_em: diasAtras(73) },
      { id: 10, marca: "Volkswagen", modelo: "T-Cross 200TSI", ano: 2021, cor: "Azul", quilometragem: 44900, preco: 118900, placa: "TYU2M67", status: "vendido", criado_em: diasAtras(55) },
      { id: 11, marca: "Toyota", modelo: "Yaris XL Plus", ano: 2020, cor: "Prata", quilometragem: 52100, preco: 79900, placa: "IOP4N12", status: "disponivel", criado_em: diasAtras(34) },
      { id: 12, marca: "Honda", modelo: "HR-V EX", ano: 2022, cor: "Preto", quilometragem: 27600, preco: 149900, placa: "ASD7P83", status: "disponivel", criado_em: diasAtras(12) },
      { id: 13, marca: "Chevrolet", modelo: "Tracker Premier", ano: 2023, cor: "Branco", quilometragem: 15200, preco: 139900, placa: "", status: "disponivel", criado_em: diasAtras(2) },
      { id: 14, marca: "Nissan", modelo: "Kicks Advance", ano: 2021, cor: "Cinza", quilometragem: 36800, preco: 104900, placa: "HJK2Q45", status: "vendido", criado_em: diasAtras(140) },
      { id: 15, marca: "Fiat", modelo: "Pulse Audace", ano: 2022, cor: "Vermelho", quilometragem: 24100, preco: 98900, placa: "UIO6R21", status: "disponivel", criado_em: diasAtras(88) },
    ],
    clientes: [
      { id: 1, nome: "Marina Alves Ribeiro", cpf: "529.982.247-25", telefone: "(11) 98812-4471", email: "marina.alves@email.com", criado_em: diasAtras(70) },
      { id: 2, nome: "Rodrigo Pacheco Lima", cpf: "168.995.350-09", telefone: "(11) 99143-2280", email: "rodrigo.lima@email.com", criado_em: diasAtras(50) },
      { id: 3, nome: "Camila Duarte Nogueira", cpf: "111.444.777-35", telefone: "(19) 98220-7719", email: "", criado_em: diasAtras(20) },
      { id: 4, nome: "Eduardo Tavares Melo", cpf: "123.456.789-09", telefone: "(11) 97455-1102", email: "eduardo.melo@email.com", criado_em: diasAtras(130) },
      { id: 5, nome: "Letícia Barbosa Faria", cpf: "987.654.321-00", telefone: "(21) 98771-0034", email: "leticia.faria@email.com", criado_em: diasAtras(8) },
    ],
    funcionarios: [
      {
        id: 1,
        nome: "Patrícia Gomes",
        cpf: "123.456.789-10",
        telefone: "(34) 99999-1001",
        email: "patricia@autosystem.com.br",
        cargo: "vendedor",
        comissao: 1.5,
        status: "ativo",
        data_admissao: "2025-02-10",
      },
      {
        id: 2,
        nome: "Alan Ferreira",
        cpf: "234.567.890-21",
        telefone: "(34) 99999-1002",
        email: "alan@autosystem.com.br",
        cargo: "vendedor",
        comissao: 1.8,
        status: "ativo",
        data_admissao: "2025-05-15",
      },
      {
        id: 3,
        nome: "Beatriz Ramos",
        cpf: "345.678.901-32",
        telefone: "(34) 99999-1003",
        email: "beatriz@autosystem.com.br",
        cargo: "vendedor",
        comissao: 2,
        status: "ativo",
        data_admissao: "2026-01-08",
      },
      {
        id: 4,
        nome: "Caio Monteiro",
        cpf: "456.789.012-43",
        telefone: "(34) 99999-1004",
        email: "caio@autosystem.com.br",
        cargo: "vendedor",
        comissao: 1.5,
        status: "ativo",
        data_admissao: "2026-03-20",
      },
      {
        id: 5,
        nome: "Gerente AutoSystem",
        cpf: "567.890.123-54",
        telefone: "(34) 99999-1005",
        email: "gerente@autosystem.com.br",
        cargo: "gerente",
        comissao: 0,
        status: "ativo",
        data_admissao: "2025-01-06",
      },
    ],
    vendas: [
      {
        id: 1,
        veiculo_id: 3,
        cliente_id: 1,
        vendedor: "Patrícia Gomes",
        valor_venda: 109500,
        data_venda: diasAtras(6),
        forma_pagamento: "financiamento",
        financiamento_id: 1,
        consorcio_id: null,
      },
      {
        id: 2,
        veiculo_id: 6,
        cliente_id: 2,
        vendedor: "Alan Ferreira",
        valor_venda: 51000,
        data_venda: diasAtras(38),
        forma_pagamento: "avista",
        financiamento_id: null,
        consorcio_id: null,
      },
      {
        id: 3,
        veiculo_id: 10,
        cliente_id: 3,
        vendedor: "Patrícia Gomes",
        valor_venda: 117000,
        data_venda: diasAtras(2),
        forma_pagamento: "avista",
        financiamento_id: null,
        consorcio_id: null,
      },
      {
        id: 4,
        veiculo_id: 14,
        cliente_id: 4,
        vendedor: "Beatriz Ramos",
        valor_venda: 101900,
        data_venda: diasAtras(95),
        forma_pagamento: "financiamento",
        financiamento_id: 2,
        consorcio_id: null,
      },
    ],
  }
}

let estado: Estado = seed()
const ouvintes = new Set<() => void>()

function emitir() {
  estado = { ...estado }
  ouvintes.forEach((f) => f())
}

function proximoId(lista: { id: number }[]) {
  return lista.reduce((m, x) => Math.max(m, x.id), 0) + 1
}

function gerarNumeroCota(consorcios: Consorcio[]) {
  const usadas = new Set(consorcios.map((c) => c.numero_cota))

  for (let tentativa = 0; tentativa < 1000; tentativa++) {
    const numero = Math.floor(10000 + Math.random() * 90000)

    if (!usadas.has(numero)) {
      return numero
    }
  }

  for (let numero = 10000; numero <= 99999; numero++) {
    if (!usadas.has(numero)) {
      return numero
    }
  }

  throw new Error("Não há números de cota disponíveis.")
}

function subscribe(f: () => void) {
  ouvintes.add(f)
  return () => ouvintes.delete(f)
}

export function useEstado() {
  return useSyncExternalStore(subscribe, () => estado)
}

export type Filtros = {
  busca: string
  status: Status | "todos"
  marca: string
  precoMin: number | null
  precoMax: number | null
}

export const filtrosVazios: Filtros = {
  busca: "",
  status: "todos",
  marca: "",
  precoMin: null,
  precoMax: null,
}

export const store = {
  /** GET /api/veiculos com filtros combináveis. */
  listarVeiculos(f: Partial<Filtros> = {}): Veiculo[] {
    const { busca = "", status = "todos", marca = "", precoMin = null, precoMax = null } = f
    const termo = busca.trim().toLowerCase()

    return estado.veiculos.filter((v) => {
      if (termo && !`${v.marca} ${v.modelo} ${v.placa}`.toLowerCase().includes(termo)) return false
      if (status !== "todos" && v.status !== status) return false
      if (marca && v.marca !== marca) return false
      if (precoMin !== null && v.preco < precoMin) return false
      if (precoMax !== null && v.preco > precoMax) return false
      return true
    })
  },

  obterVeiculo(id: number) {
    return estado.veiculos.find((v) => v.id === id) ?? null
  },

  marcas() {
    return [...new Set(estado.veiculos.map((v) => v.marca))].sort()
  },

  /** Placa única quando preenchida. */
  placaEmUso(placa: string, ignorarId?: number) {
    const p = placa.replace(/[^A-Z0-9]/gi, "").toUpperCase()
    if (!p) return false
    return estado.veiculos.some((v) => v.id !== ignorarId && v.placa === p)
  },

  criarVeiculo(dados: Omit<Veiculo, "id" | "criado_em">) {
    const veiculo: Veiculo = {
      id: proximoId(estado.veiculos),
      criado_em: new Date().toISOString().slice(0, 10),
      ...dados,
    }
    estado.veiculos = [veiculo, ...estado.veiculos]
    emitir()
    return veiculo
  },

  atualizarVeiculo(id: number, dados: Omit<Veiculo, "id" | "criado_em">) {
    estado.veiculos = estado.veiculos.map((v) => (v.id === id ? { ...v, ...dados } : v))
    emitir()
  },

  /** Regra 3: veículo com venda registrada não pode ser excluído. */
  vendaDoVeiculo(id: number) {
    return estado.vendas.find((v) => v.veiculo_id === id) ?? null
  },

  excluirVeiculo(id: number): { ok: true } | { erro: string } {
    const venda = this.vendaDoVeiculo(id)
    if (venda) return { erro: `Possui uma venda registrada em ${venda.data_venda}.` }
    estado.veiculos = estado.veiculos.filter((v) => v.id !== id)
    emitir()
    return { ok: true }
  },

  /** Regra 2: vendido não entra na lista de vendáveis. */
  veiculosVendaveis() {
    return estado.veiculos.filter((v) => v.status !== "vendido")
  },

  /** Regras 1, 2 e 4 + integração com forma de pagamento. */
  registrarVenda(dados: Omit<Venda, "id">): Venda | { erro: string } {
    const veiculo = estado.veiculos.find((v) => v.id === dados.veiculo_id)
    if (!veiculo) return { erro: "Veículo não encontrado." }
    if (veiculo.status === "vendido") return { erro: "Este veículo já foi vendido." }

    const validacaoDesconto = validarDescontoVenda(
      veiculo.preco,
      dados.valor_venda,
      dados.forma_pagamento
    )

    if ("erro" in validacaoDesconto) {
      return validacaoDesconto
    }

    const vendedor = estado.funcionarios.find(
      (f) =>
        f.nome === dados.vendedor &&
        f.cargo === "vendedor" &&
        f.status === "ativo"
    )

    if (!vendedor) {
      return { erro: "Selecione um vendedor ativo cadastrado." }
    }

    if (dados.forma_pagamento === "avista") {
      if (dados.financiamento_id !== null || dados.consorcio_id !== null) {
        return { erro: "Venda à vista não deve possuir financiamento ou consórcio vinculado." }
      }
    }

    let financiamento: Financiamento | null = null

    if (dados.forma_pagamento === "financiamento") {
      if (dados.financiamento_id === null) {
        return { erro: "Selecione o financiamento utilizado na venda." }
      }

      financiamento =
        estado.financiamentos.find((f) => f.id === dados.financiamento_id) ?? null

      if (!financiamento) {
        return { erro: "Financiamento não encontrado." }
      }

      if (financiamento.cliente_id !== dados.cliente_id) {
        return { erro: "O financiamento selecionado pertence a outro cliente." }
      }

      if (financiamento.veiculo_id !== dados.veiculo_id) {
        return { erro: "O financiamento selecionado pertence a outro veículo." }
      }

      if (
        financiamento.vendedor &&
        financiamento.vendedor !== dados.vendedor
      ) {
        return {
          erro: "Este financiamento está vinculado a outro vendedor.",
        }
      }

      if (
        financiamento.status !== "aprovado" &&
        financiamento.status !== "ativo"
      ) {
        return {
          erro: "O financiamento precisa estar aprovado ou ativo para concluir a venda.",
        }
      }

      if (dados.consorcio_id !== null) {
        return { erro: "Uma venda financiada não pode usar consórcio ao mesmo tempo." }
      }
    }

    let consorcio: Consorcio | null = null

    if (dados.forma_pagamento === "consorcio") {
      if (dados.consorcio_id === null) {
        return { erro: "Selecione a cota de consórcio utilizada na venda." }
      }

      consorcio =
        estado.consorcios.find((c) => c.id === dados.consorcio_id) ?? null

      if (!consorcio) {
        return { erro: "Consórcio não encontrado." }
      }

      if (consorcio.cliente_id !== dados.cliente_id) {
        return { erro: "A cota selecionada pertence a outro cliente." }
      }

      if (consorcio.status !== "contemplado") {
        return { erro: "Somente uma cota contemplada pode ser utilizada na venda." }
      }

      if (
        consorcio.veiculo_id !== null &&
        consorcio.veiculo_id !== dados.veiculo_id
      ) {
        return { erro: "Esta cota já está vinculada a outro veículo." }
      }

      if (consorcio.valor_carta < dados.valor_venda) {
        return {
          erro: "O valor da carta de crédito é menor que o valor desta venda.",
        }
      }

      if (dados.financiamento_id !== null) {
        return { erro: "Uma venda por consórcio não pode usar financiamento ao mesmo tempo." }
      }
    }

    const venda: Venda = {
      id: proximoId(estado.vendas),
      ...dados,
    }

    estado.vendas = [...estado.vendas, venda]

    estado.veiculos = estado.veiculos.map((v) =>
      v.id === veiculo.id ? { ...v, status: "vendido" as Status } : v
    )

    if (financiamento) {
      estado.financiamentos = estado.financiamentos.map((f) =>
        f.id === financiamento!.id
          ? {
              ...f,
              vendedor: f.vendedor ?? venda.vendedor,
              status: "ativo" as StatusFinanciamento,
            }
          : f
      )
    }

    if (consorcio) {
      estado.consorcios = estado.consorcios.map((c) =>
        c.id === consorcio!.id
          ? {
              ...c,
              veiculo_id: veiculo.id,
              status: "encerrado" as StatusConsorcio,
            }
          : c
      )
    }

    const formaLancamento: FormaPagamento =
      venda.forma_pagamento === "financiamento"
        ? "financiamento"
        : venda.forma_pagamento === "consorcio"
          ? "consorcio"
          : "pix"

    // Financeiro: a venda vira entrada recebida e gera comissão a pagar.
    const idBase = proximoId(estado.lancamentos)

    estado.lancamentos = [
      {
        id: idBase,
        tipo: "entrada",
        categoria: "venda",
        descricao: `Venda ${veiculo.marca} ${veiculo.modelo}`,
        valor: venda.valor_venda,
        data: venda.data_venda,
        status: "pago",
        forma: formaLancamento,
        venda_id: venda.id,
        veiculo_id: veiculo.id,
        vendedor: null,
      },
      {
        id: idBase + 1,
        tipo: "saida",
        categoria: "comissao",
        descricao: `Comissão ${venda.vendedor} · ${veiculo.marca} ${veiculo.modelo}`,
        valor:
          Math.round(
            venda.valor_venda *
              (vendedor.comissao / 100) *
              100
          ) / 100,
        data: fimDoMes(venda.data_venda),
        status: "pendente",
        forma: null,
        venda_id: venda.id,
        veiculo_id: veiculo.id,
        vendedor: venda.vendedor,
      },
      ...estado.lancamentos,
    ]

    emitir()
    return venda
  },

  /**
   * Conclui uma venda financiada criando o contrato e a venda em uma única
   * operação. O contrato nasce ativo e fica vinculado à venda criada.
   */
  registrarVendaComNovoFinanciamento(
    dadosVenda: Omit<
      Venda,
      "id" | "forma_pagamento" | "financiamento_id" | "consorcio_id"
    >,
    dadosFinanciamento: NovoFinanciamentoVenda
  ): Venda | { erro: string } {
    const veiculo = estado.veiculos.find(
      (v) => v.id === dadosVenda.veiculo_id
    )

    if (!veiculo) {
      return { erro: "Veículo não encontrado." }
    }

    if (veiculo.status === "vendido") {
      return { erro: "Este veículo já foi vendido." }
    }

    const validacaoDesconto = validarDescontoVenda(
      veiculo.preco,
      dadosVenda.valor_venda,
      "financiamento"
    )

    if ("erro" in validacaoDesconto) {
      return validacaoDesconto
    }

    const cliente = estado.clientes.find(
      (c) => c.id === dadosVenda.cliente_id
    )

    if (!cliente) {
      return { erro: "Cliente não encontrado." }
    }

    const vendedor = estado.funcionarios.find(
      (f) =>
        f.nome === dadosVenda.vendedor &&
        f.cargo === "vendedor" &&
        f.status === "ativo"
    )

    if (!vendedor) {
      return {
        erro: "Selecione um vendedor ativo cadastrado.",
      }
    }

    if (dadosVenda.valor_venda <= 0) {
      return {
        erro: "O valor da venda deve ser maior que zero.",
      }
    }

    if (!dadosFinanciamento.banco.trim()) {
      return {
        erro: "Selecione o banco do financiamento.",
      }
    }

    if (dadosFinanciamento.valor_veiculo <= 0) {
      return {
        erro: "Informe um valor de veículo válido.",
      }
    }

    if (
      Math.abs(
        dadosFinanciamento.valor_veiculo -
          dadosVenda.valor_venda
      ) > 0.01
    ) {
      return {
        erro:
          "O valor do veículo no financiamento deve ser igual ao valor negociado na venda.",
      }
    }

    if (
      dadosFinanciamento.entrada < 0 ||
      dadosFinanciamento.entrada >=
        dadosFinanciamento.valor_veiculo
    ) {
      return {
        erro:
          "A entrada deve ser menor que o valor do veículo.",
      }
    }

    if (
      !PARCELAS_FINANCIAMENTO.includes(
        dadosFinanciamento.parcelas as
          (typeof PARCELAS_FINANCIAMENTO)[number]
      )
    ) {
      return {
        erro:
          "Selecione uma quantidade de parcelas válida.",
      }
    }

    if (dadosFinanciamento.taxa_mensal < 0) {
      return {
        erro: "A taxa mensal não pode ser negativa.",
      }
    }

    if (!dadosFinanciamento.inicio) {
      return {
        erro: "Informe a data da primeira parcela.",
      }
    }

    const existente =
      this.financiamentoDoVeiculo(
        dadosVenda.veiculo_id
      )

    if (existente) {
      return {
        erro:
          "Este veículo já possui um financiamento ativo.",
      }
    }

    const valorFinanciado =
      Math.round(
        (dadosFinanciamento.valor_veiculo -
          dadosFinanciamento.entrada) *
          100
      ) / 100

    const valorParcela =
      Math.round(
        parcelaPrice(
          valorFinanciado,
          dadosFinanciamento.taxa_mensal,
          dadosFinanciamento.parcelas
        ) * 100
      ) / 100

    const financiamento: Financiamento = {
      id: proximoId(estado.financiamentos),
      cliente_id: dadosVenda.cliente_id,
      veiculo_id: dadosVenda.veiculo_id,
      vendedor: dadosVenda.vendedor,
      banco: dadosFinanciamento.banco.trim(),
      valor_veiculo:
        dadosFinanciamento.valor_veiculo,
      entrada: dadosFinanciamento.entrada,
      valor_financiado: valorFinanciado,
      parcelas: dadosFinanciamento.parcelas,
      taxa_mensal:
        dadosFinanciamento.taxa_mensal,
      valor_parcela: valorParcela,
      valor_total_financiamento:
        Math.round(
          valorParcela *
            dadosFinanciamento.parcelas *
            100
        ) / 100,
      inicio: dadosFinanciamento.inicio,
      parcelas_pagas: 0,
      status: "ativo",
    }

    const venda: Venda = {
      id: proximoId(estado.vendas),
      ...dadosVenda,
      forma_pagamento: "financiamento",
      financiamento_id: financiamento.id,
      consorcio_id: null,
    }

    estado.financiamentos = [
      financiamento,
      ...estado.financiamentos,
    ]

    estado.vendas = [
      ...estado.vendas,
      venda,
    ]

    estado.veiculos = estado.veiculos.map((v) =>
      v.id === veiculo.id
        ? {
            ...v,
            status: "vendido" as Status,
          }
        : v
    )

    const idBase =
      proximoId(estado.lancamentos)

    estado.lancamentos = [
      {
        id: idBase,
        tipo: "entrada",
        categoria: "venda",
        descricao: `Venda ${veiculo.marca} ${veiculo.modelo}`,
        valor: venda.valor_venda,
        data: venda.data_venda,
        status: "pago",
        forma: "financiamento",
        venda_id: venda.id,
        veiculo_id: veiculo.id,
        vendedor: null,
      },
      {
        id: idBase + 1,
        tipo: "saida",
        categoria: "comissao",
        descricao: `Comissão ${venda.vendedor} · ${veiculo.marca} ${veiculo.modelo}`,
        valor:
          Math.round(
            venda.valor_venda *
              (vendedor.comissao / 100) *
              100
          ) / 100,
        data: fimDoMes(venda.data_venda),
        status: "pendente",
        forma: null,
        venda_id: venda.id,
        veiculo_id: veiculo.id,
        vendedor: venda.vendedor,
      },
      ...estado.lancamentos,
    ]

    emitir()
    return venda
  },

  /* ------------------------------------------------------------------------
     Funcionários
     ------------------------------------------------------------------------ */

  funcionarios() {
    return [...estado.funcionarios].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR")
    )
  },

  obterFuncionario(id: number) {
    return estado.funcionarios.find((f) => f.id === id) ?? null
  },

  obterFuncionarioPorNome(nome: string) {
    return estado.funcionarios.find((f) => f.nome === nome) ?? null
  },

  vendedoresAtivos() {
    return estado.funcionarios
      .filter(
        (f) =>
          f.cargo === "vendedor" &&
          f.status === "ativo"
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  },

  cpfFuncionarioEmUso(cpf: string, ignorarId?: number) {
    const normalizado = cpf.replace(/\D/g, "")

    return estado.funcionarios.some(
      (f) =>
        f.id !== ignorarId &&
        f.cpf.replace(/\D/g, "") === normalizado
    )
  },

  criarFuncionario(dados: Omit<Funcionario, "id">) {
    const funcionario: Funcionario = {
      id: proximoId(estado.funcionarios),
      ...dados,
      comissao:
        dados.cargo === "vendedor"
          ? dados.comissao
          : 0,
    }

    estado.funcionarios = [
      ...estado.funcionarios,
      funcionario,
    ]

    emitir()
    return funcionario
  },

  atualizarFuncionario(
    id: number,
    dados: Omit<Funcionario, "id">
  ) {
    estado.funcionarios = estado.funcionarios.map((f) =>
      f.id === id
        ? {
            ...f,
            ...dados,
            comissao:
              dados.cargo === "vendedor"
                ? dados.comissao
                : 0,
          }
        : f
    )

    emitir()
  },

  listarVendas({ de = null, ate = null }: { de?: string | null; ate?: string | null } = {}) {
    return estado.vendas
      .filter((v) => (!de || v.data_venda >= de) && (!ate || v.data_venda <= ate))
      .sort((a, b) => b.data_venda.localeCompare(a.data_venda) || b.id - a.id)
  },

  clientes() {
    return estado.clientes
  },

  obterCliente(id: number) {
    return estado.clientes.find((c) => c.id === id) ?? null
  },

  cpfEmUso(cpf: string, ignorarId?: number) {
    const n = cpf.replace(/\D/g, "")
    return estado.clientes.some(
      (c) =>
        c.id !== ignorarId &&
        c.cpf.replace(/\D/g, "") === n
    )
  },

  criarCliente(
    dados: Omit<Cliente, "id" | "criado_em">
  ): Cliente | { erro: string } {
    if (this.cpfEmUso(dados.cpf)) {
      return { erro: "Já existe um cliente com este CPF." }
    }

    const cliente: Cliente = {
      id: proximoId(estado.clientes),
      criado_em: new Date().toISOString().slice(0, 10),
      ...dados,
    }

    estado.clientes = [...estado.clientes, cliente]
    emitir()
    return cliente
  },

  atualizarCliente(
    id: number,
    dados: Omit<Cliente, "id" | "criado_em">
  ): Cliente | { erro: string } {
    const atual = estado.clientes.find((c) => c.id === id)

    if (!atual) {
      return { erro: "Cliente não encontrado." }
    }

    if (this.cpfEmUso(dados.cpf, id)) {
      return { erro: "Já existe um cliente com este CPF." }
    }

    const atualizado: Cliente = {
      ...atual,
      ...dados,
    }

    estado.clientes = estado.clientes.map((c) =>
      c.id === id ? atualizado : c
    )

    emitir()
    return atualizado
  },

  /** GET /api/indicadores. Regra 5: vendido não conta no estoque. */
  indicadores() {
    const emEstoque = estado.veiculos.filter((v) => v.status !== "vendido")
    const hoje = new Date()
    const mes = hoje.toISOString().slice(0, 7)
    const anterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().slice(0, 7)
    const vendasMes = estado.vendas.filter((v) => v.data_venda.startsWith(mes))
    const vendasAnterior = estado.vendas.filter((v) => v.data_venda.startsWith(anterior))

    return {
      veiculosEmEstoque: emEstoque.length,
      disponiveis: emEstoque.filter((v) => v.status === "disponivel").length,
      reservados: emEstoque.filter((v) => v.status === "reservado").length,
      valorEstoque: emEstoque.reduce((s, v) => s + v.preco, 0),
      vendasNoMes: vendasMes.length,
      vendasMesAnterior: vendasAnterior.length,
      faturamentoMes: vendasMes.reduce((s, v) => s + v.valor_venda, 0),
      faturamentoMesAnterior: vendasAnterior.reduce((s, v) => s + v.valor_venda, 0),
    }
  },

  /** Faturamento dos últimos 6 meses, para o gráfico da visão geral. */
  faturamentoPorMes() {
    const meses: { mes: string; rotulo: string; faturamento: number; vendas: number }[] = []
    const hoje = new Date()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const doMes = estado.vendas.filter((v) => v.data_venda.startsWith(chave))
      meses.push({
        mes: chave,
        rotulo: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        faturamento: doMes.reduce((s, v) => s + v.valor_venda, 0),
        vendas: doMes.length,
      })
    }
    return meses
  },

  /** Estoque agrupado por marca (só não vendidos). */
  estoquePorMarca() {
    const mapa = new Map<string, { marca: string; quantidade: number; valor: number }>()
    for (const v of estado.veiculos) {
      if (v.status === "vendido") continue
      const item = mapa.get(v.marca) ?? { marca: v.marca, quantidade: 0, valor: 0 }
      item.quantidade += 1
      item.valor += v.preco
      mapa.set(v.marca, item)
    }
    return [...mapa.values()].sort((a, b) => b.valor - a.valor)
  },

  /* ------------------------------------------------------------------------
     Financeiro — fluxo de caixa
     ------------------------------------------------------------------------ */

  listarLancamentos(f: {
    de?: string | null
    ate?: string | null
    tipo?: TipoLancamento | "todos"
    categoria?: CategoriaLancamento | "todas"
    status?: StatusLancamento | "atrasado" | "todos"
    busca?: string
  } = {}) {
    const { de = null, ate = null, tipo = "todos", categoria = "todas", status = "todos", busca = "" } = f
    const termo = busca.trim().toLowerCase()
    const hoje = new Date().toISOString().slice(0, 10)
    return estado.lancamentos
      .filter((l) => {
        if (de && l.data < de) return false
        if (ate && l.data > ate) return false
        if (tipo !== "todos" && l.tipo !== tipo) return false
        if (categoria !== "todas" && l.categoria !== categoria) return false
        if (status === "atrasado" && !(l.status === "pendente" && l.data < hoje)) return false
        if ((status === "pago" || status === "pendente") && l.status !== status) return false
        if (termo && !`${l.descricao} ${ROTULO_CATEGORIA[l.categoria]} ${l.vendedor ?? ""}`.toLowerCase().includes(termo)) return false
        return true
      })
      .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id)
  },

  obterLancamento(id: number) {
    return estado.lancamentos.find((l) => l.id === id) ?? null
  },

  criarLancamento(dados: Omit<Lancamento, "id" | "venda_id" | "veiculo_id" | "vendedor"> & Partial<Pick<Lancamento, "veiculo_id" | "vendedor">>) {
    const l: Lancamento = {
      id: proximoId(estado.lancamentos),
      venda_id: null,
      veiculo_id: null,
      vendedor: null,
      ...dados,
    }
    estado.lancamentos = [l, ...estado.lancamentos]
    emitir()
    return l
  },

  atualizarLancamento(id: number, dados: Partial<Omit<Lancamento, "id" | "venda_id">>) {
    estado.lancamentos = estado.lancamentos.map((l) => (l.id === id ? { ...l, ...dados } : l))
    emitir()
  },

  /** Marca como pago com a forma informada. Data passa a ser hoje se estava vencido. */
  quitarLancamento(id: number, forma: FormaPagamento) {
    const hoje = new Date().toISOString().slice(0, 10)
    estado.lancamentos = estado.lancamentos.map((l) =>
      l.id === id ? { ...l, status: "pago", forma, data: l.data < hoje ? hoje : l.data } : l
    )
    emitir()
  },

  /** Lançamentos gerados por venda são derivados dela e não podem ser excluídos. */
  excluirLancamento(id: number): { ok: true } | { erro: string } {
    const l = this.obterLancamento(id)
    if (!l) return { erro: "Lançamento não encontrado." }
    if (l.venda_id !== null) return { erro: "Este lançamento foi gerado por uma venda. Para removê-lo, a venda precisaria ser cancelada." }
    estado.lancamentos = estado.lancamentos.filter((x) => x.id !== id)
    emitir()
    return { ok: true }
  },

  resumoFinanceiro({ de = null, ate = null }: { de?: string | null; ate?: string | null } = {}) {
    const hoje = new Date().toISOString().slice(0, 10)
    const periodo = this.listarLancamentos({ de, ate })
    const soma = (lista: Lancamento[]) => lista.reduce((s, l) => s + l.valor, 0)
    const pagos = periodo.filter((l) => l.status === "pago")
    const pendentes = estado.lancamentos.filter((l) => l.status === "pendente")
    const entradas = soma(pagos.filter((l) => l.tipo === "entrada"))
    const saidas = soma(pagos.filter((l) => l.tipo === "saida"))
    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      aReceber: soma(pendentes.filter((l) => l.tipo === "entrada")),
      aPagar: soma(pendentes.filter((l) => l.tipo === "saida")),
      atrasados: pendentes.filter((l) => l.data < hoje).length,
      pendentes: pendentes.length,
      previstoEntradas: soma(periodo.filter((l) => l.tipo === "entrada")),
      previstoSaidas: soma(periodo.filter((l) => l.tipo === "saida")),
    }
  },

  /** Entradas × saídas pagas dos últimos 6 meses, com saldo acumulado. */
  fluxoPorMes() {
    const meses: { mes: string; rotulo: string; entradas: number; saidas: number; saldo: number; acumulado: number }[] = []
    const hoje = new Date()
    let acumulado = 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const doMes = estado.lancamentos.filter((l) => l.status === "pago" && l.data.startsWith(chave))
      const entradas = doMes.filter((l) => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0)
      const saidas = doMes.filter((l) => l.tipo === "saida").reduce((s, l) => s + l.valor, 0)
      acumulado += entradas - saidas
      meses.push({
        mes: chave,
        rotulo: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        entradas,
        saidas,
        saldo: entradas - saidas,
        acumulado,
      })
    }
    return meses
  },

  /** Saídas pagas do período agrupadas por categoria. */
  saidasPorCategoria({ de = null, ate = null }: { de?: string | null; ate?: string | null } = {}) {
    const mapa = new Map<CategoriaLancamento, number>()
    for (const l of this.listarLancamentos({ de, ate, tipo: "saida", status: "pago" })) {
      mapa.set(l.categoria, (mapa.get(l.categoria) ?? 0) + l.valor)
    }
    return [...mapa.entries()]
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor)
  },

  /** Custo de aquisição registrado para o veículo, quando houver. */
  custoVeiculo(veiculoId: number) {
    return estado.lancamentos.find((l) => l.categoria === "compra_veiculo" && l.veiculo_id === veiculoId)?.valor ?? null
  },

  /* ------------------------------------------------------------------------
     Financeiro — comissões
     ------------------------------------------------------------------------ */

  comissoes({ de = null, ate = null }: { de?: string | null; ate?: string | null } = {}) {
    const lista = this.listarLancamentos({ de, ate, categoria: "comissao" })
    const mapa = new Map<string, { vendedor: string; vendas: number; faturamento: number; gerada: number; paga: number; pendente: number; itens: Lancamento[] }>()
    for (const l of lista) {
      const nome = l.vendedor ?? "—"
      const venda = l.venda_id !== null ? estado.vendas.find((v) => v.id === l.venda_id) : null
      const item = mapa.get(nome) ?? { vendedor: nome, vendas: 0, faturamento: 0, gerada: 0, paga: 0, pendente: 0, itens: [] }
      item.vendas += 1
      item.faturamento += venda?.valor_venda ?? 0
      item.gerada += l.valor
      if (l.status === "pago") item.paga += l.valor
      else item.pendente += l.valor
      item.itens.push(l)
      mapa.set(nome, item)
    }
    return [...mapa.values()].sort((a, b) => b.gerada - a.gerada)
  },

  pagarComissoes(vendedor: string, forma: FormaPagamento) {
    const hoje = new Date().toISOString().slice(0, 10)
    let total = 0
    estado.lancamentos = estado.lancamentos.map((l) => {
      if (l.categoria === "comissao" && l.vendedor === vendedor && l.status === "pendente") {
        total += l.valor
        return { ...l, status: "pago" as StatusLancamento, forma, data: hoje }
      }
      return l
    })
    emitir()
    return total
  },

  /* ------------------------------------------------------------------------
     Financeiro — financiamentos
     ------------------------------------------------------------------------ */

  financiamentos() {
    return [...estado.financiamentos].sort(
      (a, b) =>
        b.inicio.localeCompare(a.inicio) ||
        b.id - a.id
    )
  },

  obterFinanciamento(id: number) {
    return (
      estado.financiamentos.find(
        (f) => f.id === id
      ) ?? null
    )
  },

  financiamentoDoVeiculo(veiculoId: number) {
    return (
      estado.financiamentos.find(
        (f) =>
          f.veiculo_id === veiculoId &&
          f.status !== "cancelado"
      ) ?? null
    )
  },

  criarFinanciamento(
    dados: Omit<
      Financiamento,
      | "id"
      | "valor_parcela"
      | "valor_total_financiamento"
      | "parcelas_pagas"
      | "vendedor"
    > & {
      vendedor?: string | null
    }
  ): Financiamento | { erro: string } {
    if (dados.valor_veiculo <= 0) {
      return {
        erro: "Informe um valor de veículo válido.",
      }
    }

    if (
      dados.entrada < 0 ||
      dados.entrada >= dados.valor_veiculo
    ) {
      return {
        erro:
          "A entrada deve ser menor que o valor do veículo.",
      }
    }

    if (dados.valor_financiado <= 0) {
      return {
        erro:
          "O valor financiado deve ser maior que zero.",
      }
    }

    if (
      Math.abs(
        dados.valor_financiado -
          (dados.valor_veiculo -
            dados.entrada)
      ) > 0.01
    ) {
      return {
        erro:
          "O valor financiado deve corresponder ao valor do veículo menos a entrada.",
      }
    }

    if (
      !PARCELAS_FINANCIAMENTO.includes(
        dados.parcelas as
          (typeof PARCELAS_FINANCIAMENTO)[number]
      )
    ) {
      return {
        erro:
          "Selecione uma quantidade de parcelas válida.",
      }
    }

    if (dados.taxa_mensal < 0) {
      return {
        erro:
          "A taxa mensal não pode ser negativa.",
      }
    }

    const existente =
      this.financiamentoDoVeiculo(
        dados.veiculo_id
      )

    if (existente) {
      return {
        erro:
          "Este veículo já possui um financiamento ativo.",
      }
    }

    const valorParcela =
      Math.round(
        parcelaPrice(
          dados.valor_financiado,
          dados.taxa_mensal,
          dados.parcelas
        ) * 100
      ) / 100

    const f: Financiamento = {
      id: proximoId(
        estado.financiamentos
      ),
      ...dados,
      vendedor: dados.vendedor?.trim() || null,
      valor_parcela: valorParcela,
      valor_total_financiamento:
        Math.round(
          valorParcela *
            dados.parcelas *
            100
        ) / 100,
      parcelas_pagas: 0,
    }

    estado.financiamentos = [
      f,
      ...estado.financiamentos,
    ]

    emitir()
    return f
  },

  atualizarStatusFinanciamento(
    id: number,
    status: StatusFinanciamento
  ) {
    estado.financiamentos =
      estado.financiamentos.map((f) =>
        f.id === id
          ? {
              ...f,
              status,
            }
          : f
      )

    emitir()
  },

  registrarParcelaPaga(id: number) {
    estado.financiamentos =
      estado.financiamentos.map((f) => {
        if (
          f.id !== id ||
          f.status === "cancelado" ||
          f.status === "quitado" ||
          f.parcelas_pagas >= f.parcelas
        ) {
          return f
        }

        const parcelasPagas =
          f.parcelas_pagas + 1

        return {
          ...f,
          parcelas_pagas: parcelasPagas,
          status:
            parcelasPagas >= f.parcelas
              ? ("quitado" as StatusFinanciamento)
              : ("ativo" as StatusFinanciamento),
        }
      })

    emitir()
  },

  /* ------------------------------------------------------------------------
     Consórcios
     ------------------------------------------------------------------------ */

  consorcios() {
    return [...estado.consorcios].sort(
      (a, b) =>
        b.data_adesao.localeCompare(a.data_adesao) ||
        b.id - a.id
    )
  },

  obterConsorcio(id: number) {
    return estado.consorcios.find((c) => c.id === id) ?? null
  },

  numeroCotaEmUso(numeroCota: number) {
    return estado.consorcios.some(
      (c) => c.numero_cota === numeroCota
    )
  },

  criarConsorcio(
    dados: Omit<Consorcio, "id" | "numero_cota">
  ) {
    const grupo = GRUPOS_CONSORCIO.find(
      (g) => g.codigo === dados.grupo
    )

    const taxaAdministracao =
      dados.taxa_administracao ??
      grupo?.taxa_administracao ??
      18

    const fundoReserva =
      dados.fundo_reserva ??
      grupo?.fundo_reserva ??
      2

    const seguro =
      dados.seguro ??
      grupo?.seguro ??
      0

    const plano = calcularPlanoConsorcio(
      dados.valor_carta,
      taxaAdministracao,
      fundoReserva,
      seguro,
      dados.parcelas
    )

    const consorcio: Consorcio = {
      id: proximoId(estado.consorcios),
      numero_cota: gerarNumeroCota(estado.consorcios),
      ...dados,
      taxa_administracao: taxaAdministracao,
      fundo_reserva: fundoReserva,
      seguro,
      valor_total_plano: plano.valor_total_plano,
      valor_parcela: plano.valor_parcela,
      valor_lance:
        dados.tipo_lance === "sem_lance"
          ? null
          : dados.valor_lance,
    }

    estado.consorcios = [
      consorcio,
      ...estado.consorcios,
    ]

    emitir()
    return consorcio
  },

  atualizarConsorcio(
    id: number,
    dados: Omit<Consorcio, "id" | "numero_cota">
  ) {
    const grupo = GRUPOS_CONSORCIO.find(
      (g) => g.codigo === dados.grupo
    )

    const taxaAdministracao =
      dados.taxa_administracao ??
      grupo?.taxa_administracao ??
      18

    const fundoReserva =
      dados.fundo_reserva ??
      grupo?.fundo_reserva ??
      2

    const seguro =
      dados.seguro ??
      grupo?.seguro ??
      0

    const plano = calcularPlanoConsorcio(
      dados.valor_carta,
      taxaAdministracao,
      fundoReserva,
      seguro,
      dados.parcelas
    )

    estado.consorcios = estado.consorcios.map((c) =>
      c.id === id
        ? {
            ...c,
            ...dados,
            taxa_administracao: taxaAdministracao,
            fundo_reserva: fundoReserva,
            seguro,
            valor_total_plano: plano.valor_total_plano,
            valor_parcela: plano.valor_parcela,
            valor_lance:
              dados.tipo_lance === "sem_lance"
                ? null
                : dados.valor_lance,
          }
        : c
    )

    emitir()
  },

  excluirConsorcio(
    id: number
  ): { ok: true } | { erro: string } {
    const consorcio = this.obterConsorcio(id)

    if (!consorcio) {
      return { erro: "Consórcio não encontrado." }
    }

    if (
      consorcio.status === "contemplado" ||
      consorcio.status === "encerrado"
    ) {
      return {
        erro:
          "Consórcios contemplados ou encerrados não podem ser excluídos.",
      }
    }

    estado.consorcios = estado.consorcios.filter(
      (c) => c.id !== id
    )

    emitir()
    return { ok: true }
  },

  restaurar() {
    estado = seed()
    emitir()
  },
}
