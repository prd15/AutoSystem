import { useState } from "react"
import {
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginPage() {
  const { entrar } = useAuth()

  const [email, setEmail] =
    useState("")

  const [senha, setSenha] =
    useState("")

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false)

  const [carregando, setCarregando] =
    useState(false)

  const fazerLogin = (
    evento: React.FormEvent
  ) => {
    evento.preventDefault()

    if (!email.trim()) {
      toast.error(
        "Informe seu e-mail."
      )
      return
    }

    if (!senha) {
      toast.error(
        "Informe sua senha."
      )
      return
    }

    setCarregando(true)

    const resultado = entrar(
      email,
      senha
    )

    setCarregando(false)

    if (!resultado.sucesso) {
      toast.error(
        resultado.mensagem ??
          "Não foi possível entrar."
      )
      return
    }

    toast.success(
      "Login realizado com sucesso."
    )
  }

  return (
    <main className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="bg-primary text-primary-foreground mx-auto flex size-12 items-center justify-center rounded-xl shadow-sm">
            <span className="text-[15px] font-bold tracking-[-0.04em]">
              AS
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
            AutoSystem
          </h1>

          <p className="text-muted-foreground mt-1 text-[13px]">
            Gestão de concessionárias
          </p>
        </div>

        <Card className="p-6">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">
              Acessar sistema
            </h2>

            <p className="text-muted-foreground mt-1 text-[12px]">
              Entre com o e-mail
              cadastrado no seu
              usuário.
            </p>
          </div>

          <form
            onSubmit={fazerLogin}
            className="mt-6 space-y-4"
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="login-email"
              >
                E-mail
              </Label>

              <div className="relative">
                <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="seuemail@empresa.com.br"
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="login-senha"
              >
                Senha
              </Label>

              <div className="relative">
                <LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

                <Input
                  id="login-senha"
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) =>
                    setSenha(
                      e.target.value
                    )
                  }
                  placeholder="Digite sua senha"
                  className="px-9"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarSenha(
                      (atual) =>
                        !atual
                    )
                  }
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center transition-colors"
                  aria-label={
                    mostrarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {mostrarSenha ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={carregando}
            >
              <LogIn className="size-4" />

              {carregando
                ? "Entrando..."
                : "Entrar"}
            </Button>
          </form>

          <div className="bg-muted/60 mt-5 rounded-lg border p-3">
            <p className="text-[12px] font-medium">
              Acesso inicial
            </p>

            <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
              Use o e-mail de um
              funcionário ativo
              cadastrado no sistema.
              A senha inicial do
              protótipo é
              <span className="text-foreground font-medium">
                {" "}
                123456
              </span>
              .
            </p>
          </div>
        </Card>

        <p className="text-muted-foreground mt-4 text-center text-[11px]">
          AutoSystem · Sistema de
          gestão automotiva
        </p>
      </div>
    </main>
  )
}