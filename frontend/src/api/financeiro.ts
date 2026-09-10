import type { FormaPagamento } from "@/data/store"

import { api } from "./client"
import type {
  ComissaoVendedorDTO,
  DataISO,
  FiltroLancamentos,
  FinanciamentoDTO,
  FinanciamentoEntrada,
  FluxoMensalDTO,
  LancamentoDTO,
  LancamentoEntrada,
  ResumoFinanceiroDTO,
  SaidaPorCategoriaDTO,
  SimulacaoDTO,
  SimulacaoEntrada,
} from "./tipos"

type Periodo = { de?: DataISO | null; ate?: DataISO | null }

/**
 * Módulo financeiro. Fora do escopo aprovado da primeira entrega; os endpoints
 * existem aqui para o dia em que o módulo entrar no plano.
 */
export const financeiroApi = {
  lancamentos: {
    /** GET /api/lancamentos — `status=atrasado` é derivado no servidor. */
    listar: (filtro: FiltroLancamentos = {}, signal?: AbortSignal) =>
      api.get<LancamentoDTO[]>("/lancamentos", filtro, signal),
    /** POST /api/lancamentos — lançamento manual. */
    criar: (dados: LancamentoEntrada) => api.post<LancamentoDTO>("/lancamentos", dados),
    /** PUT /api/lancamentos/{id} — com venda_id, só status, forma e data são aceitos. */
    atualizar: (id: number, dados: Partial<LancamentoEntrada>) =>
      api.put<LancamentoDTO>(`/lancamentos/${id}`, dados),
    /** PATCH /api/lancamentos/{id}/quitar — se vencido, a data vira hoje. */
    quitar: (id: number, forma: FormaPagamento) =>
      api.patch<LancamentoDTO>(`/lancamentos/${id}/quitar`, { forma }),
    /** DELETE /api/lancamentos/{id} — 409 quando gerado por venda. */
    excluir: (id: number) => api.delete(`/lancamentos/${id}`),
  },

  /** GET /api/financeiro/resumo?de=&ate=. */
  resumo: (periodo: Periodo = {}, signal?: AbortSignal) =>
    api.get<ResumoFinanceiroDTO>("/financeiro/resumo", periodo, signal),

  /** GET /api/financeiro/fluxo-mensal?meses=6. */
  fluxoMensal: (meses = 6, signal?: AbortSignal) =>
    api.get<FluxoMensalDTO[]>("/financeiro/fluxo-mensal", { meses }, signal),

  /** GET /api/financeiro/saidas-por-categoria?de=&ate= — só saídas pagas. */
  saidasPorCategoria: (periodo: Periodo = {}, signal?: AbortSignal) =>
    api.get<SaidaPorCategoriaDTO[]>("/financeiro/saidas-por-categoria", periodo, signal),

  comissoes: {
    /** GET /api/comissoes?de=&ate= — agrupado por vendedor. */
    listar: (periodo: Periodo = {}, signal?: AbortSignal) =>
      api.get<ComissaoVendedorDTO[]>("/comissoes", periodo, signal),
    /** POST /api/comissoes/pagar — quita todas as pendentes do vendedor em uma transação. */
    pagar: (vendedor: string, forma: FormaPagamento) =>
      api.post<{ total_pago: string }>("/comissoes/pagar", { vendedor, forma }),
  },

  financiamentos: {
    /** GET /api/financiamentos — início decrescente, com veículo e cliente. */
    listar: (signal?: AbortSignal) => api.get<FinanciamentoDTO[]>("/financiamentos", undefined, signal),
    /** POST /api/financiamentos — o servidor calcula a parcela (Tabela Price). */
    criar: (dados: FinanciamentoEntrada) => api.post<FinanciamentoDTO>("/financiamentos", dados),
    /** PATCH /api/financiamentos/{id}/parcela — incrementa parcelas_pagas. */
    registrarParcela: (id: number) => api.patch<FinanciamentoDTO>(`/financiamentos/${id}/parcela`),
    /** POST /api/financiamentos/simular — sem gravar. O front também sabe simular (lib/financeiro.ts). */
    simular: (dados: SimulacaoEntrada) => api.post<SimulacaoDTO>("/financiamentos/simular", dados),
  },
}
