import { api } from "./client"
import type { UsuarioDTO, UsuarioEntrada } from "./tipos"

/**
 * Camada HTTP de usuários.
 *
 * Endpoints disponíveis no backend:
 * - GET  /api/usuarios
 * - GET  /api/usuarios/{id}
 * - POST /api/usuarios
 */
export const usuariosApi = {
  /** Lista usuários. A busca opcional é enviada como ?busca=. */
  listar: (busca?: string, signal?: AbortSignal) =>
    api.get<UsuarioDTO[]>("/usuarios", { busca }, signal),

  /** Busca um usuário pelo id. */
  obter: (id: number) =>
    api.get<UsuarioDTO>(`/usuarios/${id}`),

  /** Cadastra um usuário. A senha nunca retorna na resposta. */
  criar: (dados: UsuarioEntrada) =>
    api.post<UsuarioDTO>("/usuarios", dados),
}