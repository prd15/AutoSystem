/**
 * Tipos do contrato HTTP (`docs/04-contrato-de-api.md`).
 *
 * São o formato de transporte usado entre o front e a API.
 * Dinheiro trafega como número no JSON e datas como `yyyy-mm-dd`.
 *
 * Esta camada não depende de `data/store.ts`, para que o mock possa ser
 * removido futuramente sem afetar o contrato HTTP.
 */

/** Valor decimal transportado como número no JSON, ex.: 129900.00. */
export type Decimal = number;

/** Data ISO sem hora: "2026-09-10". */
export type DataISO = string;

export type Status = "disponivel" | "reservado" | "vendido";

export type TipoLancamento = "entrada" | "saida";

export type StatusLancamento = "pago" | "pendente";

export type CategoriaLancamento =
  | "venda"
  | "compra_veiculo"
  | "comissao"
  | "despesa_fixa"
  | "oficina"
  | "marketing"
  | "impostos"
  | "financiamento"
  | "outros";

export type FormaPagamento =
  | "pix"
  | "transferencia"
  | "boleto"
  | "cartao"
  | "dinheiro"
  | "financiamento"
  | "consorcio";

/** Formas aceitas pelo POST /api/vendas. */
export type TipoPagamentoVenda =
  | "avista"
  | "financiamento"
  | "consorcio";

/** Formato único de erro do back-end. */
export type ErroApi = {
  erro: string;
  campos?: Record<string, string>;
};

/* ----------------------------------------------------------------------------
   Usuários
   ---------------------------------------------------------------------------- */

/** Perfis aceitos pela API de usuários. */
export type PerfilUsuario = "ADMIN" | "GERENTE" | "VENDEDOR";

/**
 * Usuário devolvido pela API.
 *
 * A senha nunca faz parte da resposta.
 * Os campos de data/hora seguem o snake_case configurado globalmente no back.
 */
export type UsuarioDTO = {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

/**
 * Corpo aceito pelo POST /api/usuarios.
 *
 * Quando perfil não é informado, o backend assume VENDEDOR.
 */
export type UsuarioEntrada = {
  nome: string;
  email: string;
  senha: string;
  perfil?: PerfilUsuario;
};

/* ----------------------------------------------------------------------------
   Veículos
   ---------------------------------------------------------------------------- */

export type VeiculoDTO = {
  id: number;
  marca: string;
  modelo: string;
  ano: number;
  cor: string;
  quilometragem: number;
  preco: Decimal;
  placa: string | null;
  status: Status;
  criado_em: DataISO;
  atualizado_em?: DataISO;
  /** Calculado no servidor para não depender do relógio do cliente. */
  dias_em_estoque?: number;
};

export type VeiculoEntrada = {
  marca: string;
  modelo: string;
  ano: number;
  cor: string;
  quilometragem: number;
  preco: Decimal;
  placa: string | null;
  status: Status;
};

export type OrdemVeiculos =
  | "veiculo"
  | "ano"
  | "quilometragem"
  | "preco"
  | "status"
  | "dias";

export type FiltroVeiculos = {
  busca?: string;
  status?: Status;
  marca?: string;
  preco_min?: Decimal;
  preco_max?: Decimal;
  ordem?: OrdemVeiculos;
  dir?: "asc" | "desc";
  vendavel?: boolean;
  pagina?: number;
  tamanho?: number;
};

export type ListaVeiculosDTO = {
  itens: VeiculoDTO[];
  total: number;
  resumo: {
    valor_em_estoque: Decimal;
    por_status: Record<Status, number>;
  };
};

/** Corpo do 409 em DELETE /veiculos/{id} quando há venda. */
export type ExclusaoBloqueadaDTO = {
  venda: {
    id: number;
    data_venda: DataISO;
    valor_venda: Decimal;
    cliente: string;
  };
};

/* ----------------------------------------------------------------------------
   Clientes
   ---------------------------------------------------------------------------- */

export type ClienteDTO = {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string | null;
  criado_em: DataISO;
  compras?: number;
  total_gasto?: Decimal;
  ultima_compra?: DataISO | null;
};

export type ClienteEntrada = {
  nome: string;
  cpf: string;
  telefone: string;
  email: string | null;
};

/* ----------------------------------------------------------------------------
   Vendas
   ---------------------------------------------------------------------------- */

export type VendaDTO = {
  id: number;
  data_venda: DataISO;
  vendedor: string;
  valor_venda: Decimal;
  veiculo: Pick<
    VeiculoDTO,
    "id" | "marca" | "modelo" | "ano" | "placa" | "preco"
  >;
  cliente: Pick<ClienteDTO, "id" | "nome">;
  /** valor_venda − preco de tabela. */
  diferenca?: Decimal;
};

/**
 * Corpo aceito pelo POST /api/vendas.
 *
 * O cliente deve existir previamente na API. O cadastro rápido deve criar
 * o cliente primeiro e então usar o id retornado no registro da venda.
 */
export type VendaEntrada = {
  veiculo_id: number;
  cliente_id: number;
  vendedor: string;
  valor_venda: Decimal;
  data_venda: DataISO;
  forma_pagamento: TipoPagamentoVenda;
};

/* ----------------------------------------------------------------------------
   Indicadores
   ---------------------------------------------------------------------------- */

export type IndicadoresDTO = {
  veiculos_em_estoque: number;
  disponiveis: number;
  reservados: number;
  valor_estoque: Decimal;
  vendas_no_mes: number;
  vendas_mes_anterior: number;
  faturamento_mes: Decimal;
  faturamento_mes_anterior: Decimal;
};

export type FaturamentoMensalDTO = {
  mes: string; // "2026-09"
  rotulo: string; // "set"
  faturamento: Decimal;
  vendas: number;
};

export type EstoquePorMarcaDTO = {
  marca: string;
  quantidade: number;
  valor: Decimal;
};

/* ----------------------------------------------------------------------------
   Financeiro
   ---------------------------------------------------------------------------- */

export type LancamentoDTO = {
  id: number;
  tipo: TipoLancamento;
  categoria: CategoriaLancamento;
  descricao: string;
  valor: Decimal;
  data: DataISO;
  status: StatusLancamento;
  forma: FormaPagamento | null;
  venda_id: number | null;
  veiculo_id: number | null;
  vendedor: string | null;
};

export type LancamentoEntrada = Omit<
  LancamentoDTO,
  "id" | "venda_id" | "vendedor"
> & {
  vendedor?: string | null;
};

export type FiltroLancamentos = {
  de?: DataISO;
  ate?: DataISO;
  tipo?: TipoLancamento;
  categoria?: CategoriaLancamento;
  status?: StatusLancamento | "atrasado";
  busca?: string;
};

export type ResumoFinanceiroDTO = {
  entradas: Decimal;
  saidas: Decimal;
  saldo: Decimal;
  a_receber: Decimal;
  a_pagar: Decimal;
  atrasados: number;
  pendentes: number;
  previsto_entradas: Decimal;
  previsto_saidas: Decimal;
};

export type FluxoMensalDTO = {
  mes: string;
  rotulo: string;
  entradas: Decimal;
  saidas: Decimal;
  saldo: Decimal;
  acumulado: Decimal;
};

export type SaidaPorCategoriaDTO = {
  categoria: CategoriaLancamento;
  valor: Decimal;
};

export type ComissaoVendedorDTO = {
  vendedor: string;
  vendas: number;
  faturamento: Decimal;
  gerada: Decimal;
  paga: Decimal;
  pendente: Decimal;
  itens: LancamentoDTO[];
};

export type FinanciamentoDTO = {
  id: number;
  banco: string;
  valor_financiado: Decimal;
  entrada: Decimal;
  parcelas: number;
  taxa_mensal: Decimal; // 0.0189
  valor_parcela: Decimal;
  inicio: DataISO;
  parcelas_pagas: number;
  veiculo: Pick<
    VeiculoDTO,
    "id" | "marca" | "modelo" | "ano" | "cor" | "placa"
  >;
  cliente: Pick<ClienteDTO, "id" | "nome">;
};

export type FinanciamentoEntrada = {
  cliente_id: number;
  veiculo_id: number;
  banco: string;
  valor_financiado: Decimal;
  entrada: Decimal;
  parcelas: number;
  taxa_mensal: Decimal;
  inicio: DataISO;
};

export type SimulacaoEntrada = {
  valor_veiculo: Decimal;
  entrada: Decimal;
  parcelas: number;
  taxa_mensal: Decimal;
};

export type SimulacaoDTO = {
  financiado: Decimal;
  parcela: Decimal;
  total: Decimal;
  juros: Decimal;
  cet_anual: Decimal;
  tabela: Array<{
    n: number;
    parcela: Decimal;
    juros: Decimal;
    amortizacao: Decimal;
    saldo: Decimal;
  }>;
};