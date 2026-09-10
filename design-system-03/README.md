# AutoSystem — Aqua (proposta 04)

Protótipo de front-end para o sistema de gestão da concessionária, cobrindo o escopo da
primeira entrega (estoque com CRUD e filtros; gerencial com indicadores, registro de venda
e histórico) e já mostrando o caminho dos módulos seguintes.

Referência visual: macOS (Sonoma/Sequoia). Barra lateral translúcida, tipografia SF Pro com
Inter como substituto, azul de sistema como única cor de ação, controles segmentados, painéis
com hairline em vez de sombra pesada. A aplicação ocupa a tela inteira e não imita a janela
do macOS: vai rodar em qualquer navegador e sistema, servida pelo back-end Spring Boot.

## Integração com o back-end

Todo acesso a dados passa por `src/data/store.ts`, que hoje guarda o estado em memória e
expõe métodos com os mesmos nomes dos endpoints (`listarVeiculos`, `criarVeiculo`,
`registrarVenda`, `indicadores`…). Para ligar ao Spring Boot, cada método vira um `fetch`
em `/api/...`; as telas não mudam.

Em desenvolvimento o Vite já faz proxy de `/api` para `http://localhost:8080` (troque com a
variável `VITE_API_URL`), então não há CORS. Em produção, `npm run build` gera `dist/`, que
pode ser copiado para `src/main/resources/static` do projeto Java e servido pelo próprio
Spring Boot. Como a navegação é por hash (`#/estoque`), não precisa de fallback de rota.

As propostas anteriores seguem intactas em `../design-system` (Ink & Lime),
`../design-system-02` (Stone & Sage) e `../app` (Signal).

## Rodar

```bash
npm install
npm run dev
```

Abre em http://localhost:5174. Build de produção: `npm run build`. Tudo em memória, sem
back-end: o botão de restaurar na barra lateral recarrega os dados de exemplo.

## Stack

| | |
|---|---|
| React 19 + TypeScript | Vite 8 |
| Tailwind CSS v4 | plugin oficial do Vite, tokens no `src/index.css` |
| shadcn/ui | componentes em `src/components/ui`, estilo new-york, `radix-ui` unificado |
| cmdk | paleta ⌘K |
| lucide-react | ícones (substituem SF Symbols) |
| recharts | gráfico de faturamento |
| sonner | toasts |

`components.json` está configurado: `npx shadcn@latest add <componente>` traz novos componentes
no mesmo estilo. Observação: no Windows a CLI pode gravar em uma pasta literal `@/`; basta
mover para `src/components/ui` e trocar `from "cn"` por `from "@/lib/utils"`.

## Telas

| Rota | O que tem |
|---|---|
| `#/visao-geral` | Os quatro indicadores do escopo com variação vs. mês anterior, faturamento de 6 meses, estoque por status e marca, últimas vendas, lista de atenção (reservas antigas, veículos parados, sem placa) |
| `#/estoque` | Busca por marca/modelo/placa, status em controle segmentado, marca, faixa de preço, ordenação por coluna, alternância **Tabela / Quadro**. Quadro é uma coluna por status, com nota de atenção por cartão |
| `#/vendas` | Período (este mês, 30 d, 90 d, tudo, personalizado), indicadores do período, histórico com diferença entre tabela e valor negociado |
| `#/clientes` | Listagem com compras, total gasto e última compra; cadastro com CPF validado e máscaras |
| `#/financeiro` | Três áreas em controle segmentado. **Fluxo de caixa**: entradas, saídas, saldo e pendências do período, gráfico entradas × saídas × saldo mensal, saídas por categoria, lançamentos com busca/tipo/situação/categoria, quitação rápida por forma de pagamento. **Comissões**: 1,5% sobre a venda, geradas automaticamente ao vender, por vendedor com pagamento em lote ou individual. **Financiamentos**: contratos com progresso das parcelas, próxima parcela, atraso; simulador Tabela Price com registro de contrato |
| demais | Oficina, Test drive, Relatórios e Configurações aparecem como "em breve", com o que está previsto |

Ações globais: `Ctrl+K` (`⌘K` no Mac) abre a paleta (navegar, cadastrar veículo, registrar venda,
novo cliente, trocar tema, pular para um veículo pelo nome ou placa).

## Formulários

- **Veículo** (`veiculo-sheet.tsx`): painel lateral, mesmo formulário para cadastro e edição.
  Valida obrigatórios, ano entre 1950 e ano atual + 1, km inteiro ≥ 0, preço > 0, placa no
  padrão Mercosul/antigo e única quando preenchida. Erro por campo com `role="alert"`.
- **Venda** (`venda-dialog.tsx`): veículo (só não vendidos, com busca), cliente existente
  ou cadastro rápido, vendedor com sugestões, valor pré-preenchido pela tabela e editável
  (mostra desconto ou acréscimo), data não futura. Ao salvar, o veículo vira vendido.
- **Exclusão** (`excluir-dialog.tsx`): confirmação com marca e modelo. Se houver venda,
  a ação some e o diálogo mostra data, valor e cliente da venda.
- **Lançamento** (`financeiro/lancamento-dialog.tsx`): entrada ou saída, categoria por tipo,
  valor, vencimento ou data de pagamento, situação, forma (obrigatória quando pago) e veículo
  vinculado. Lançamentos gerados por venda só permitem mudar situação, forma e data.
- **Simulador** (`financeiro/simulador-dialog.tsx`): valor (pode vir do estoque), entrada,
  prazo 12–60×, taxa mensal e banco. Mostra parcela, total, juros, CET anual aproximado e as
  primeiras linhas da Tabela Price. Com cliente, registra o contrato.

## Financeiro — modelo

Duas tabelas novas em `store.ts`, sem tocar nas do escopo:

| Tabela | Campos |
|---|---|
| `lancamentos` | tipo (entrada/saída), categoria, descrição, valor, data, status (pago/pendente), forma, `venda_id`, `veiculo_id`, vendedor |
| `financiamentos` | cliente, veículo, banco, valor financiado, entrada, parcelas, taxa mensal, valor da parcela, início, parcelas pagas |

Regras:

1. Registrar venda cria uma entrada paga (a venda) e uma saída pendente (comissão de 1,5%
   com vencimento no fim do mês).
2. Lançamento com `venda_id` não pode ser excluído; só situação, forma e data mudam.
3. "Atrasado" é derivado: pendente com data anterior a hoje.
4. Saldo do período considera só o que foi pago; pendências aparecem à parte.
5. Custo de aquisição do veículo é um lançamento de saída vinculado (`compra_veiculo`),
   disponível para calcular margem por venda no futuro.

Cálculo de parcela em `lib/financeiro.ts` (`simular`, Tabela Price) e no store
(`parcelaPrice`).

## Design system

Tokens em `src/index.css` no contrato do shadcn (oklch, par claro/escuro, `@theme inline`).
Além do padrão:

| Token | Uso |
|---|---|
| `--success` / `--success-solid` | disponível (fundo suave / ponto) |
| `--warning` / `--warning-solid` | reservado, alertas de tempo em estoque |
| `--neutral` / `--neutral-solid` | vendido |
| `--info` | destaques neutros |
| `--wallpaper` | gradiente suave visível através da barra lateral translúcida |
| `--shadow-card / raised / pop / window` | quatro níveis de elevação |
| `--font-sans` | `-apple-system, "SF Pro Text", Inter, …` — SF onde existir, Inter como substituto |

Utilitários próprios: `vibrancy` (blur + saturação da barra lateral), `glass` (popovers,
diálogos), `hairline`, `scroll-mac`, `tabular`.

Componentes de produto em `src/components`: `Segmented` (controle segmentado),
`KpiCard`, `StatusBadge` / `StatusDot`, `VeiculoTile` (iniciais da marca + faixa na cor do
carro, já que upload de foto está fora do escopo), `Field` (rótulo + erro), `EmptyState`.

## Estrutura

```
src/
  app-context.tsx       rota (hash), estado global de diálogos, mapa de rotas
  index.css             tokens e utilitários
  components/
    ui/                 shadcn
    app-shell.tsx       janela, barra lateral, toolbar
    command-palette.tsx ⌘K
  data/store.ts         estado em memória + regras de negócio (espelha os endpoints)
  lib/format.ts         moeda, data, número em pt-BR; máscaras
  lib/financeiro.ts     simulação Price, próxima parcela, percentual
  features/
    visao-geral/  estoque/  vendas/  clientes/  em-breve-page.tsx
    financeiro/         financeiro-page (abas + período), fluxo-caixa, comissoes,
                        financiamentos, lancamento-dialog, simulador-dialog
```

## Regras de negócio implementadas

1. Registrar venda muda o veículo para `vendido`
2. Veículo vendido não aparece na seleção de venda
3. Veículo com venda registrada não pode ser excluído
4. Valor da venda pode diferir do preço de tabela
5. Vendido não conta no estoque nem no valor imobilizado

## Próximos passos

- Trocar `store.ts` por chamadas HTTP aos endpoints do escopo
- Paginação da tabela quando o estoque passar de algumas dezenas
- Arrastar cartões entre colunas do quadro para mudar status
- Módulos "em breve" conforme priorização do time
