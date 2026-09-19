/**
 * Cliente HTTP do front-end. Toda chamada ao back-end passa por aqui.
 *
 * - Base: `/api` (o Vite faz proxy para VITE_API_URL em dev; em produção o
 *   Spring Boot serve o SPA e a API na mesma origem).
 * - JSON de ida e volta, datas em `yyyy-mm-dd` e dinheiro como número.
 * - Erros seguem o formato de `docs/04-contrato-de-api.md`:
 *   `{ "erro": "mensagem pronta para exibir", "campos": { "placa": "..." } }`
 */

export type Query = Record<
  string,
  string | number | boolean | null | undefined
>

export class ApiError extends Error {
  readonly status: number

  /** Erros por campo (422/409), já em linguagem natural. */
  readonly campos: Record<string, string>

  /** Payload extra devolvido pelo servidor (ex.: a venda que bloqueia uma exclusão). */
  readonly dados: unknown

  constructor(
    status: number,
    mensagem: string,
    campos: Record<string, string> = {},
    dados?: unknown
  ) {
    super(mensagem)
    this.name = "ApiError"
    this.status = status
    this.campos = campos
    this.dados = dados
  }

  get naoEncontrado() {
    return this.status === 404
  }

  get conflito() {
    return this.status === 409
  }

  get validacao() {
    return this.status === 422
  }
}

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api"

function montarQuery(query?: Query) {
  if (!query) return ""

  const params = new URLSearchParams()

  for (const [chave, valor] of Object.entries(query)) {
    if (valor === null || valor === undefined || valor === "") continue
    params.set(chave, String(valor))
  }

  const s = params.toString()
  return s ? `?${s}` : ""
}

async function lerErro(resposta: Response): Promise<ApiError> {
  let corpo: {
    erro?: string
    campos?: Record<string, string>
  } & Record<string, unknown> = {}

  try {
    corpo = await resposta.json()
  } catch {
    /* sem corpo JSON */
  }

  const mensagem =
    corpo.erro ??
    (resposta.status === 404
      ? "Registro não encontrado."
      : resposta.status >= 500
        ? "O servidor encontrou um problema. Tente novamente em instantes."
        : "Não foi possível concluir a operação.")

  const { erro: _e, campos, ...dados } = corpo
  void _e

  return new ApiError(
    resposta.status,
    mensagem,
    campos ?? {},
    Object.keys(dados).length ? dados : undefined
  )
}

async function requisicao<T>(
  metodo: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  caminho: string,
  opcoes: {
    corpo?: unknown
    query?: Query
    signal?: AbortSignal
  } = {}
): Promise<T> {
  let resposta: Response

  try {
    resposta = await fetch(
      `${BASE}${caminho}${montarQuery(opcoes.query)}`,
      {
        method: metodo,
        headers: {
          Accept: "application/json",
          ...(opcoes.corpo !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body:
          opcoes.corpo !== undefined
            ? JSON.stringify(opcoes.corpo)
            : undefined,
        signal: opcoes.signal,
        credentials: "same-origin",
      }
    )
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e

    throw new ApiError(
      0,
      "Não foi possível falar com o servidor. Verifique a conexão."
    )
  }

  if (!resposta.ok) throw await lerErro(resposta)
  if (resposta.status === 204) return undefined as T

  return (await resposta.json()) as T
}

export const api = {
  get: <T>(
    caminho: string,
    query?: Query,
    signal?: AbortSignal
  ) => requisicao<T>("GET", caminho, { query, signal }),

  post: <T>(caminho: string, corpo?: unknown) =>
    requisicao<T>("POST", caminho, { corpo }),

  put: <T>(caminho: string, corpo?: unknown) =>
    requisicao<T>("PUT", caminho, { corpo }),

  patch: <T>(caminho: string, corpo?: unknown) =>
    requisicao<T>("PATCH", caminho, { corpo }),

  delete: <T = void>(caminho: string) =>
    requisicao<T>("DELETE", caminho),
}