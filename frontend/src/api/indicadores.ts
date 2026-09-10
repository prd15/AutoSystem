import { api } from "./client"
import type { EstoquePorMarcaDTO, FaturamentoMensalDTO, IndicadoresDTO } from "./tipos"

/** Equivalentes no protótipo: store.indicadores, faturamentoPorMes, estoquePorMarca. */
export const indicadoresApi = {
  /** GET /api/indicadores — os quatro KPIs do escopo mais o mês anterior. */
  resumo: (signal?: AbortSignal) => api.get<IndicadoresDTO>("/indicadores", undefined, signal),

  /** GET /api/indicadores/faturamento-mensal?meses=6 — meses sem venda vêm com zero. */
  faturamentoMensal: (meses = 6, signal?: AbortSignal) =>
    api.get<FaturamentoMensalDTO[]>("/indicadores/faturamento-mensal", { meses }, signal),

  /** GET /api/indicadores/estoque-por-marca — só não vendidos, ordenado por valor. */
  estoquePorMarca: (signal?: AbortSignal) =>
    api.get<EstoquePorMarcaDTO[]>("/indicadores/estoque-por-marca", undefined, signal),
}
