import { useSyncExternalStore } from "react"

/**
 * Estado da aplicação em memória, com as regras de negócio do escopo.
 * Nenhuma chamada de rede: quando o back existir, cada método vira um fetch
 * para o endpoint correspondente e a interface não muda.
 */

export type Status = "disponivel" | "reservado" | "vendido"

export type Veiculo = {
  id: number
  marca: string
  modelo: string
  ano: number
  cor: string
  quilometragem: number
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

export type Venda = {
  id: number
  veiculo_id: number
  cliente_id: number
  vendedor: string
  valor_venda: number
  data_venda: string // yyyy-mm-dd
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
export type FormaPagamento = "pix" | "transferencia" | "boleto" | "cartao" | "dinheiro" | "financiamento"

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

export type Financiamento = {
  id: number
  cliente_id: number
  veiculo_id: number
  banco: string
  valor_financiado: number
  entrada: number
  parcelas: number
  taxa_mensal: number // 0.0189 = 1,89% a.m.
  valor_parcela: number
  inicio: string // yyyy-mm-dd da primeira parcela
  parcelas_pagas: number
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
}

export const BANCOS = ["Banco do Brasil", "Bradesco", "Itaú", "Santander", "Caixa", "BV Financeira"]

/** Percentual de comissão sobre o valor da venda. Fixo nesta entrega. */
export const COMISSAO_PERCENTUAL = 0.015

export const ROTULO_STATUS: Record<Status, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
}

export const ORDEM_STATUS: Status[] = ["disponivel", "reservado", "vendido"]

/** Vendedores da loja. Texto livre no escopo; a lista serve só de sugestão. */
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

type Estado = {
  veiculos: Veiculo[]
  clientes: Cliente[]
  vendas: Venda[]
  lancamentos: Lancamento[]
  financiamentos: Financiamento[]
}

/** Parcela pela Tabela Price. */
export function parcelaPrice(principal: number, taxaMensal: number, n: number) {
  if (n <= 0) return 0
  if (taxaMensal === 0) return principal / n
  return (principal * taxaMensal) / (1 - Math.pow(1 + taxaMensal, -n))
}

function seedFinanceiro(vendas: Venda[], veiculos: Veiculo[]): { lancamentos: Lancamento[]; financiamentos: Financiamento[] } {
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
      forma: v.id === 1 ? "financiamento" : v.id === 4 ? "financiamento" : "pix",
      venda_id: v.id,
      veiculo_id: v.veiculo_id,
    })
    l.push({
      ...base,
      tipo: "saida",
      categoria: "comissao",
      descricao: `Comissão ${v.vendedor} · ${veic.marca} ${veic.modelo}`,
      valor: Math.round(v.valor_venda * COMISSAO_PERCENTUAL),
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
      const valor = 109500 - 25000
      const taxa = 0.0189
      return { id: 1, cliente_id: 1, veiculo_id: 3, banco: "Itaú", valor_financiado: valor, entrada: 25000, parcelas: 48, taxa_mensal: taxa, valor_parcela: Math.round(parcelaPrice(valor, taxa, 48) * 100) / 100, inicio: mesAtras(0, 5), parcelas_pagas: 1 }
    })(),
    (() => {
      const valor = 101900 - 30000
      const taxa = 0.0175
      return { id: 2, cliente_id: 4, veiculo_id: 14, banco: "Banco do Brasil", valor_financiado: valor, entrada: 30000, parcelas: 36, taxa_mensal: taxa, valor_parcela: Math.round(parcelaPrice(valor, taxa, 36) * 100) / 100, inicio: mesAtras(3, 10), parcelas_pagas: 3 }
    })(),
    (() => {
      const valor = 51000 - 11000
      const taxa = 0.021
      return { id: 3, cliente_id: 2, veiculo_id: 6, banco: "BV Financeira", valor_financiado: valor, entrada: 11000, parcelas: 24, taxa_mensal: taxa, valor_parcela: Math.round(parcelaPrice(valor, taxa, 24) * 100) / 100, inicio: mesAtras(1, 15), parcelas_pagas: 1 }
    })(),
  ]

  return {
    lancamentos: l.map((x, i) => ({ id: i + 1, ...x })).sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id),
    financiamentos,
  }
}

function seed(): Estado {
  const base = seedBase()
  return { ...base, ...seedFinanceiro(base.vendas, base.veiculos) }
}

function seedBase(): Pick<Estado, "veiculos" | "clientes" | "vendas"> {
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
      { id: 1, nome: "Marina Alves Ribeiro", cpf: "482.113.900-27", telefone: "(11) 98812-4471", email: "marina.alves@email.com", criado_em: diasAtras(70) },
      { id: 2, nome: "Rodrigo Pacheco Lima", cpf: "318.774.220-04", telefone: "(11) 99143-2280", email: "rodrigo.lima@email.com", criado_em: diasAtras(50) },
      { id: 3, nome: "Camila Duarte Nogueira", cpf: "905.226.118-63", telefone: "(19) 98220-7719", email: "", criado_em: diasAtras(20) },
      { id: 4, nome: "Eduardo Tavares Melo", cpf: "271.008.554-90", telefone: "(11) 97455-1102", email: "eduardo.melo@email.com", criado_em: diasAtras(130) },
      { id: 5, nome: "Letícia Barbosa Faria", cpf: "633.410.782-15", telefone: "(21) 98771-0034", email: "leticia.faria@email.com", criado_em: diasAtras(8) },
    ],
    vendas: [
      { id: 1, veiculo_id: 3, cliente_id: 1, vendedor: "Patrícia Gomes", valor_venda: 109500, data_venda: diasAtras(6) },
      { id: 2, veiculo_id: 6, cliente_id: 2, vendedor: "Alan Ferreira", valor_venda: 51000, data_venda: diasAtras(38) },
      { id: 3, veiculo_id: 10, cliente_id: 3, vendedor: "Patrícia Gomes", valor_venda: 117000, data_venda: diasAtras(2) },
      { id: 4, veiculo_id: 14, cliente_id: 4, vendedor: "Beatriz Ramos", valor_venda: 101900, data_venda: diasAtras(95) },
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

  /** Regras 1, 2 e 4. */
  registrarVenda(dados: Omit<Venda, "id">): Venda | { erro: string } {
    const veiculo = estado.veiculos.find((v) => v.id === dados.veiculo_id)
    if (!veiculo) return { erro: "Veículo não encontrado." }
    if (veiculo.status === "vendido") return { erro: "Este veículo já foi vendido." }

    const venda = { id: proximoId(estado.vendas), ...dados }
    estado.vendas = [...estado.vendas, venda]
    estado.veiculos = estado.veiculos.map((v) =>
      v.id === veiculo.id ? { ...v, status: "vendido" as Status } : v
    )

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
        forma: "pix",
        venda_id: venda.id,
        veiculo_id: veiculo.id,
        vendedor: null,
      },
      {
        id: idBase + 1,
        tipo: "saida",
        categoria: "comissao",
        descricao: `Comissão ${venda.vendedor} · ${veiculo.marca} ${veiculo.modelo}`,
        valor: Math.round(venda.valor_venda * COMISSAO_PERCENTUAL),
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

  cpfEmUso(cpf: string) {
    const n = cpf.replace(/\D/g, "")
    return estado.clientes.some((c) => c.cpf.replace(/\D/g, "") === n)
  },

  criarCliente(dados: Omit<Cliente, "id" | "criado_em">) {
    const cliente: Cliente = {
      id: proximoId(estado.clientes),
      criado_em: new Date().toISOString().slice(0, 10),
      ...dados,
    }
    estado.clientes = [...estado.clientes, cliente]
    emitir()
    return cliente
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
    return [...estado.financiamentos].sort((a, b) => b.inicio.localeCompare(a.inicio))
  },

  criarFinanciamento(dados: Omit<Financiamento, "id" | "valor_parcela" | "parcelas_pagas">) {
    const f: Financiamento = {
      id: proximoId(estado.financiamentos),
      valor_parcela: Math.round(parcelaPrice(dados.valor_financiado, dados.taxa_mensal, dados.parcelas) * 100) / 100,
      parcelas_pagas: 0,
      ...dados,
    }
    estado.financiamentos = [f, ...estado.financiamentos]
    emitir()
    return f
  },

  registrarParcelaPaga(id: number) {
    estado.financiamentos = estado.financiamentos.map((f) =>
      f.id === id && f.parcelas_pagas < f.parcelas ? { ...f, parcelas_pagas: f.parcelas_pagas + 1 } : f
    )
    emitir()
  },

  restaurar() {
    estado = seed()
    emitir()
  },
}
