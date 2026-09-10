import { api } from "./client"
import type { FiltroVeiculos, ListaVeiculosDTO, VeiculoDTO, VeiculoEntrada } from "./tipos"

/** Equivalentes no protótipo: store.listarVeiculos, obterVeiculo, marcas, criarVeiculo, atualizarVeiculo, excluirVeiculo, veiculosVendaveis. */
export const veiculosApi = {
  /** GET /api/veiculos — filtros combináveis; `resumo` traz a contagem por status antes do filtro. */
  listar: (filtro: FiltroVeiculos = {}, signal?: AbortSignal) =>
    api.get<ListaVeiculosDTO>("/veiculos", filtro, signal),

  /** GET /api/veiculos/{id} — 404 se não existir. */
  obter: (id: number) => api.get<VeiculoDTO>(`/veiculos/${id}`),

  /** GET /api/veiculos/marcas — distintas, em ordem alfabética. */
  marcas: () => api.get<string[]>("/veiculos/marcas"),

  /** GET /api/veiculos/vendaveis — status ≠ vendido, para o registro de venda. */
  vendaveis: () => api.get<VeiculoDTO[]>("/veiculos/vendaveis"),

  /** POST /api/veiculos — 201 · 422 campos · 409 placa duplicada. */
  criar: (dados: VeiculoEntrada) => api.post<VeiculoDTO>("/veiculos", dados),

  /** PUT /api/veiculos/{id} — 200 · 404 · 422 · 409. */
  atualizar: (id: number, dados: VeiculoEntrada) => api.put<VeiculoDTO>(`/veiculos/${id}`, dados),

  /** DELETE /api/veiculos/{id} — 204 · 409 quando há venda (ApiError.dados traz a venda). */
  excluir: (id: number) => api.delete(`/veiculos/${id}`),
}
