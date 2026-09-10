import { api } from "./client"
import type { ClienteDTO, ClienteEntrada } from "./tipos"

/** Equivalentes no protótipo: store.clientes, obterCliente, criarCliente, cpfEmUso. */
export const clientesApi = {
  /** GET /api/clientes?busca= — nome, CPF sem pontuação ou e-mail; já vem com compras e total gasto. */
  listar: (busca?: string, signal?: AbortSignal) => api.get<ClienteDTO[]>("/clientes", { busca }, signal),

  /** GET /api/clientes/{id}. */
  obter: (id: number) => api.get<ClienteDTO>(`/clientes/${id}`),

  /** POST /api/clientes — 201 · 422 campos · 409 CPF duplicado. */
  criar: (dados: ClienteEntrada) => api.post<ClienteDTO>("/clientes", dados),
}
