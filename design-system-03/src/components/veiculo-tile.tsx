import { cn } from "@/lib/utils"

/** Cor cadastrada em texto livre → amostra visual. Fallback cinza. */
const CORES: Record<string, string> = {
  prata: "#c9ccd1",
  preto: "#1f2023",
  branco: "#f3f3f3",
  vermelho: "#d8342b",
  cinza: "#8b8e94",
  verde: "#3f8f4e",
  laranja: "#f0872b",
  azul: "#2e6fd6",
  amarelo: "#f1c232",
  marrom: "#7a4e2d",
  bege: "#d9c8a9",
  dourado: "#c8a951",
  vinho: "#7a1f3a",
  grafite: "#4a4d52",
}

export function corParaHex(cor: string) {
  return CORES[cor.trim().toLowerCase()] ?? "#a3a6ab"
}

export function CorSwatch({ cor, className }: { cor: string; className?: string }) {
  return (
    <span
      aria-hidden
      title={cor}
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{
        background: corParaHex(cor),
        boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.12)",
      }}
    />
  )
}

/**
 * Identidade visual de um veículo sem foto (upload está fora do escopo):
 * bloco arredondado com as iniciais da marca e uma faixa na cor do carro.
 */
export function VeiculoTile({
  marca,
  cor,
  size = "md",
  className,
}: {
  marca: string
  cor: string
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const iniciais = marca.slice(0, 2).toUpperCase()
  const tamanhos = {
    sm: "size-8 rounded-[8px] text-[11px]",
    md: "size-10 rounded-[10px] text-xs",
    lg: "size-12 rounded-xl text-sm",
  }
  return (
    <div
      aria-hidden
      className={cn(
        "bg-secondary text-secondary-foreground relative flex shrink-0 items-center justify-center overflow-hidden font-semibold tracking-wide",
        tamanhos[size],
        className
      )}
      style={{ boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.06)" }}
    >
      {iniciais}
      <span
        className="absolute inset-x-0 bottom-0 h-[3px]"
        style={{ background: corParaHex(cor) }}
      />
    </div>
  )
}
