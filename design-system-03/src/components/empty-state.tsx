import { cn } from "@/lib/utils"

export function EmptyState({
  icone: Icone,
  titulo,
  descricao,
  acao,
  className,
}: {
  icone: React.ComponentType<{ className?: string }>
  titulo: string
  descricao?: string
  acao?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className
      )}
    >
      <div className="bg-secondary text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
        <Icone className="size-5" />
      </div>
      <p className="mt-4 text-[15px] font-semibold">{titulo}</p>
      {descricao && (
        <p className="text-muted-foreground mt-1 max-w-sm text-[13px] leading-relaxed">
          {descricao}
        </p>
      )}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  )
}
