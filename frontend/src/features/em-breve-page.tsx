import { ArrowLeft } from "lucide-react"

import { ROTAS, useApp } from "@/app-context"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"

const PLANOS: Partial<Record<keyof typeof ROTAS, string[]>> = {
  oficina: ["Ordens de serviço com checklist", "Agenda de revisões por placa", "Controle de peças e mão de obra"],
  "test-drive": ["Agenda por vendedor e por carro", "Termo de responsabilidade digital", "Bloqueio automático do veículo em uso"],
  relatorios: ["Exportação em PDF e planilha", "Relatório de giro de estoque", "Comparativo mês a mês"],
  configuracoes: ["Dados da loja", "Usuários e perfis de acesso", "Metas de venda"],
}

/** Módulos fora do escopo da primeira entrega, mostrados como roteiro. */
export function EmBrevePage() {
  const { rota, navegar } = useApp()
  const meta = ROTAS[rota]
  const planos = PLANOS[rota] ?? []

  return (
    <div className="mx-auto max-w-xl">
      <div className="bg-card shadow-card rounded-xl">
        <EmptyState
          icone={meta.icone}
          titulo={`${meta.titulo} chega nas próximas entregas`}
          descricao={meta.descricao}
          acao={
            <Button variant="outline" size="sm" onClick={() => navegar("visao-geral")}>
              <ArrowLeft className="size-4" />
              Voltar para a visão geral
            </Button>
          }
        />
        {planos.length > 0 && (
          <div className="border-t px-6 py-5">
            <p className="text-muted-foreground mb-3 text-[12px] font-semibold tracking-[0.02em]">
              O que está previsto
            </p>
            <ul className="space-y-2">
              {planos.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[13px]">
                  <span className="bg-primary/60 size-1.5 rounded-full" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
