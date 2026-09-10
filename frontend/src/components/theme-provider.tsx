import { createContext, useContext, useEffect, useState } from "react"

export type Tema = "light" | "dark" | "system"

type Contexto = {
  tema: Tema
  temaResolvido: "light" | "dark"
  setTema: (t: Tema) => void
}

const ThemeContext = createContext<Contexto | null>(null)
const CHAVE = "autosystem.tema"

function preferenciaSistema(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(() => {
    try {
      return (localStorage.getItem(CHAVE) as Tema) || "system"
    } catch {
      return "system"
    }
  })
  const [sistema, setSistema] = useState<"light" | "dark">(preferenciaSistema)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const ouvir = () => setSistema(mq.matches ? "dark" : "light")
    mq.addEventListener("change", ouvir)
    return () => mq.removeEventListener("change", ouvir)
  }, [])

  const temaResolvido = tema === "system" ? sistema : tema

  useEffect(() => {
    const raiz = document.documentElement
    raiz.classList.toggle("dark", temaResolvido === "dark")
    raiz.style.colorScheme = temaResolvido
  }, [temaResolvido])

  const setTema = (t: Tema) => {
    setTemaState(t)
    try {
      localStorage.setItem(CHAVE, t)
    } catch {
      /* armazenamento indisponível */
    }
  }

  return (
    <ThemeContext.Provider value={{ tema, temaResolvido, setTema }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme precisa estar dentro de ThemeProvider")
  return ctx
}
