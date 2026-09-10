import { api } from "./client"
import type { DataISO, VendaCriadaDTO, VendaDTO, VendaEntrada } from "./tipos"

/** Equivalentes no protótipo: store.listarVendas, registrarVenda. */
export const vendasApi = {
  /** GET /api/vendas?de=&ate= — mais recente primeiro, com veículo e cliente embutidos. */
  listar: (periodo: { de?: DataISO | null; ate?: DataISO | null } = {}, signal?: AbortSignal) =>
    api.get<VendaDTO[]>("/vendas", periodo, signal),

  /**
   * POST /api/vendas — transacional no servidor: cria a venda, marca o veículo como
   * vendido, lança a entrada de caixa e a comissão. Aceita `cliente_id` ou um
   * `cliente` novo na mesma transação. 201 · 404 · 409 já vendido · 422.
   */
  registrar: (dados: VendaEntrada) => api.post<VendaCriadaDTO>("/vendas", dados),
}
