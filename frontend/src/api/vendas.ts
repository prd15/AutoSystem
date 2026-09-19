import { api } from "./client";
import type { DataISO, VendaDTO, VendaEntrada } from "./tipos";

/** Equivalentes no protótipo: store.listarVendas, registrarVenda. */
export const vendasApi = {
  /** GET /api/vendas?de=&ate= — mais recente primeiro, com veículo e cliente embutidos. */
  listar: (
    periodo: { de?: DataISO | null; ate?: DataISO | null } = {},
    signal?: AbortSignal,
  ) => api.get<VendaDTO[]>("/vendas", periodo, signal),

  /** GET /api/vendas/{id} — detalhe de uma venda sem precisar varrer a listagem. */
  obter: (id: number, signal?: AbortSignal) =>
    api.get<VendaDTO>(`/vendas/${id}`, undefined, signal),

  /**
   * POST /api/vendas — registra a venda e marca o veículo como vendido.
   * O cliente deve existir previamente e `forma_pagamento` é obrigatória.
   *
   * O backend responde diretamente com a venda criada.
   */
  registrar: (dados: VendaEntrada) => api.post<VendaDTO>("/vendas", dados),
};
