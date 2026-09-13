import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { store } from "@/data/store"

export type PerfilUsuario =
  | "admin"
  | "gerente"
  | "vendedor"

export type Usuario = {
  id: number
  funcionarioId: number | null
  nome: string
  email: string
  senha: string
  perfil: PerfilUsuario
  ativo: boolean
}

type ResultadoLogin = {
  sucesso: boolean
  mensagem?: string
}

type ResultadoUsuario = {
  sucesso: boolean
  mensagem?: string
  usuario?: Usuario
}

type AuthContexto = {
  usuario: Usuario | null
  autenticado: boolean

  entrar: (
    email: string,
    senha: string
  ) => ResultadoLogin

  sair: () => void

  atualizarConta: (dados: {
    nome: string
    email: string
  }) => {
    sucesso: boolean
    mensagem?: string
  }

  alterarSenha: (
    senhaAtual: string,
    novaSenha: string
  ) => {
    sucesso: boolean
    mensagem?: string
  }

  usuarioDoFuncionario: (
    funcionarioId: number
  ) => Usuario | null

  criarUsuarioParaFuncionario: (
    funcionarioId: number,
    dados: {
      email: string
      senha: string
      perfil: PerfilUsuario
      ativo?: boolean
    }
  ) => ResultadoUsuario

  atualizarUsuarioDoFuncionario: (
    funcionarioId: number,
    dados: {
      nome?: string
      email?: string
      perfil?: PerfilUsuario
      ativo?: boolean
    }
  ) => ResultadoUsuario

  redefinirSenhaDoFuncionario: (
    funcionarioId: number,
    novaSenha: string
  ) => ResultadoUsuario
}

const AuthContext =
  createContext<AuthContexto | null>(
    null
  )

const CHAVE_USUARIOS =
  "autosystem.usuarios"

const CHAVE_SESSAO =
  "autosystem.sessao"

function perfilDoCargo(
  cargo: string
): PerfilUsuario {
  if (cargo === "gerente") {
    return "gerente"
  }

  if (cargo === "vendedor") {
    return "vendedor"
  }

  return "admin"
}

function usuariosIniciais(): Usuario[] {
  const funcionarios =
    store.funcionarios()

  const ativos =
    funcionarios.filter(
      (funcionario) =>
        funcionario.status ===
        "ativo"
    )

  if (ativos.length === 0) {
    return [
      {
        id: 1,
        funcionarioId: null,
        nome: "Administrador",
        email:
          "admin@autosystem.com.br",
        senha: "123456",
        perfil: "admin",
        ativo: true,
      },
    ]
  }

  return ativos.map(
    (funcionario, index) => ({
      id: index + 1,
      funcionarioId:
        funcionario.id,
      nome: funcionario.nome,
      email:
        funcionario.email ||
        `usuario${index + 1}@autosystem.com.br`,
      senha: "123456",
      perfil: perfilDoCargo(
        funcionario.cargo
      ),
      ativo: true,
    })
  )
}

function carregarUsuarios(): Usuario[] {
  try {
    const salvo =
      localStorage.getItem(
        CHAVE_USUARIOS
      )

    if (salvo) {
      const dados = JSON.parse(
        salvo
      ) as Usuario[]

      if (
        Array.isArray(dados) &&
        dados.length > 0
      ) {
        return dados
      }
    }
  } catch {
    // Usa os dados iniciais.
  }

  const iniciais =
    usuariosIniciais()

  try {
    localStorage.setItem(
      CHAVE_USUARIOS,
      JSON.stringify(iniciais)
    )
  } catch {
    // O sistema continua funcionando
    // mesmo sem armazenamento local.
  }

  return iniciais
}

function carregarSessao(
  usuarios: Usuario[]
): Usuario | null {
  try {
    const idSalvo =
      localStorage.getItem(
        CHAVE_SESSAO
      )

    if (!idSalvo) {
      return null
    }

    const id = Number(idSalvo)

    const usuario =
      usuarios.find(
        (item) =>
          item.id === id &&
          item.ativo
      )

    return usuario ?? null
  } catch {
    return null
  }
}

function emailNormalizado(
  email: string
) {
  return email
    .trim()
    .toLowerCase()
}

function proximoId(
  usuarios: Usuario[]
) {
  if (usuarios.length === 0) {
    return 1
  }

  return (
    Math.max(
      ...usuarios.map(
        (item) => item.id
      )
    ) + 1
  )
}

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const usuariosCarregados =
    useMemo(
      () => carregarUsuarios(),
      []
    )

  const [usuarios, setUsuarios] =
    useState<Usuario[]>(
      usuariosCarregados
    )

  const [usuarioId, setUsuarioId] =
    useState<number | null>(() => {
      const sessao =
        carregarSessao(
          usuariosCarregados
        )

      return sessao?.id ?? null
    })

  const usuario = useMemo(
    () =>
      usuarios.find(
        (item) =>
          item.id === usuarioId &&
          item.ativo
      ) ?? null,
    [usuarios, usuarioId]
  )

  const salvarUsuarios = (
    novosUsuarios: Usuario[]
  ) => {
    setUsuarios(novosUsuarios)

    try {
      localStorage.setItem(
        CHAVE_USUARIOS,
        JSON.stringify(
          novosUsuarios
        )
      )
    } catch {
      // Mantém os dados apenas
      // durante a sessão atual.
    }
  }

  const entrar = (
    email: string,
    senha: string
  ): ResultadoLogin => {
    const emailBusca =
      emailNormalizado(email)

    const encontrado =
      usuarios.find(
        (item) =>
          emailNormalizado(
            item.email
          ) === emailBusca
      )

    if (!encontrado) {
      return {
        sucesso: false,
        mensagem:
          "E-mail ou senha incorretos.",
      }
    }

    if (!encontrado.ativo) {
      return {
        sucesso: false,
        mensagem:
          "Este usuário está inativo.",
      }
    }

    if (
      encontrado.senha !== senha
    ) {
      return {
        sucesso: false,
        mensagem:
          "E-mail ou senha incorretos.",
      }
    }

    setUsuarioId(
      encontrado.id
    )

    try {
      localStorage.setItem(
        CHAVE_SESSAO,
        String(encontrado.id)
      )
    } catch {
      // Sessão permanece válida
      // até atualizar a página.
    }

    return {
      sucesso: true,
    }
  }

  const sair = () => {
    setUsuarioId(null)

    try {
      localStorage.removeItem(
        CHAVE_SESSAO
      )
    } catch {
      // Nada a fazer.
    }
  }

  const atualizarConta = (
    dados: {
      nome: string
      email: string
    }
  ) => {
    if (!usuario) {
      return {
        sucesso: false,
        mensagem:
          "Nenhum usuário autenticado.",
      }
    }

    const nome =
      dados.nome.trim()

    const email =
      emailNormalizado(
        dados.email
      )

    if (!nome) {
      return {
        sucesso: false,
        mensagem:
          "Informe o nome do usuário.",
      }
    }

    if (!email) {
      return {
        sucesso: false,
        mensagem:
          "Informe o e-mail do usuário.",
      }
    }

    const emailEmUso =
      usuarios.some(
        (item) =>
          item.id !== usuario.id &&
          emailNormalizado(
            item.email
          ) === email
      )

    if (emailEmUso) {
      return {
        sucesso: false,
        mensagem:
          "Este e-mail já está sendo utilizado.",
      }
    }

    const novosUsuarios =
      usuarios.map((item) =>
        item.id === usuario.id
          ? {
              ...item,
              nome,
              email,
            }
          : item
      )

    salvarUsuarios(
      novosUsuarios
    )

    return {
      sucesso: true,
    }
  }

  const alterarSenha = (
    senhaAtual: string,
    novaSenha: string
  ) => {
    if (!usuario) {
      return {
        sucesso: false,
        mensagem:
          "Nenhum usuário autenticado.",
      }
    }

    if (
      usuario.senha !== senhaAtual
    ) {
      return {
        sucesso: false,
        mensagem:
          "A senha atual está incorreta.",
      }
    }

    if (
      novaSenha.length < 6
    ) {
      return {
        sucesso: false,
        mensagem:
          "A nova senha deve ter pelo menos 6 caracteres.",
      }
    }

    if (
      novaSenha === senhaAtual
    ) {
      return {
        sucesso: false,
        mensagem:
          "A nova senha deve ser diferente da senha atual.",
      }
    }

    const novosUsuarios =
      usuarios.map((item) =>
        item.id === usuario.id
          ? {
              ...item,
              senha: novaSenha,
            }
          : item
      )

    salvarUsuarios(
      novosUsuarios
    )

    return {
      sucesso: true,
    }
  }

  const usuarioDoFuncionario = (
    funcionarioId: number
  ) => {
    return (
      usuarios.find(
        (item) =>
          item.funcionarioId ===
          funcionarioId
      ) ?? null
    )
  }

  const criarUsuarioParaFuncionario = (
    funcionarioId: number,
    dados: {
      email: string
      senha: string
      perfil: PerfilUsuario
      ativo?: boolean
    }
  ): ResultadoUsuario => {
    const funcionario =
      store.obterFuncionario(
        funcionarioId
      )

    if (!funcionario) {
      return {
        sucesso: false,
        mensagem:
          "Funcionário não encontrado.",
      }
    }

    const jaPossuiUsuario =
      usuarios.some(
        (item) =>
          item.funcionarioId ===
          funcionarioId
      )

    if (jaPossuiUsuario) {
      return {
        sucesso: false,
        mensagem:
          "Este funcionário já possui acesso ao sistema.",
      }
    }

    const email =
      emailNormalizado(
        dados.email
      )

    if (!email) {
      return {
        sucesso: false,
        mensagem:
          "Informe o e-mail de acesso.",
      }
    }

    const emailEmUso =
      usuarios.some(
        (item) =>
          emailNormalizado(
            item.email
          ) === email
      )

    if (emailEmUso) {
      return {
        sucesso: false,
        mensagem:
          "Este e-mail já está sendo utilizado por outro usuário.",
      }
    }

    if (
      dados.senha.length < 6
    ) {
      return {
        sucesso: false,
        mensagem:
          "A senha inicial deve ter pelo menos 6 caracteres.",
      }
    }

    const novoUsuario: Usuario = {
      id: proximoId(usuarios),
      funcionarioId,
      nome: funcionario.nome,
      email,
      senha: dados.senha,
      perfil: dados.perfil,
      ativo:
        dados.ativo ?? true,
    }

    salvarUsuarios([
      ...usuarios,
      novoUsuario,
    ])

    return {
      sucesso: true,
      usuario: novoUsuario,
    }
  }

  const atualizarUsuarioDoFuncionario = (
    funcionarioId: number,
    dados: {
      nome?: string
      email?: string
      perfil?: PerfilUsuario
      ativo?: boolean
    }
  ): ResultadoUsuario => {
    const existente =
      usuarioDoFuncionario(
        funcionarioId
      )

    if (!existente) {
      return {
        sucesso: false,
        mensagem:
          "Este funcionário não possui acesso ao sistema.",
      }
    }

    const nome =
      dados.nome !== undefined
        ? dados.nome.trim()
        : existente.nome

    const email =
      dados.email !== undefined
        ? emailNormalizado(
            dados.email
          )
        : existente.email

    if (!nome) {
      return {
        sucesso: false,
        mensagem:
          "Informe o nome do usuário.",
      }
    }

    if (!email) {
      return {
        sucesso: false,
        mensagem:
          "Informe o e-mail de acesso.",
      }
    }

    const emailEmUso =
      usuarios.some(
        (item) =>
          item.id !== existente.id &&
          emailNormalizado(
            item.email
          ) === email
      )

    if (emailEmUso) {
      return {
        sucesso: false,
        mensagem:
          "Este e-mail já está sendo utilizado por outro usuário.",
      }
    }

    const atualizado: Usuario = {
      ...existente,
      nome,
      email,
      perfil:
        dados.perfil ??
        existente.perfil,
      ativo:
        dados.ativo ??
        existente.ativo,
    }

    const novosUsuarios =
      usuarios.map((item) =>
        item.id === existente.id
          ? atualizado
          : item
      )

    salvarUsuarios(
      novosUsuarios
    )

    if (
      usuarioId === existente.id &&
      !atualizado.ativo
    ) {
      sair()
    }

    return {
      sucesso: true,
      usuario: atualizado,
    }
  }

  const redefinirSenhaDoFuncionario = (
    funcionarioId: number,
    novaSenha: string
  ): ResultadoUsuario => {
    const existente =
      usuarioDoFuncionario(
        funcionarioId
      )

    if (!existente) {
      return {
        sucesso: false,
        mensagem:
          "Este funcionário não possui acesso ao sistema.",
      }
    }

    if (
      novaSenha.length < 6
    ) {
      return {
        sucesso: false,
        mensagem:
          "A nova senha deve ter pelo menos 6 caracteres.",
      }
    }

    const atualizado: Usuario = {
      ...existente,
      senha: novaSenha,
    }

    const novosUsuarios =
      usuarios.map((item) =>
        item.id === existente.id
          ? atualizado
          : item
      )

    salvarUsuarios(
      novosUsuarios
    )

    return {
      sucesso: true,
      usuario: atualizado,
    }
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        autenticado:
          usuario !== null,
        entrar,
        sair,
        atualizarConta,
        alterarSenha,
        usuarioDoFuncionario,
        criarUsuarioParaFuncionario,
        atualizarUsuarioDoFuncionario,
        redefinirSenhaDoFuncionario,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const contexto =
    useContext(AuthContext)

  if (!contexto) {
    throw new Error(
      "useAuth precisa estar dentro de AuthProvider"
    )
  }

  return contexto
}
