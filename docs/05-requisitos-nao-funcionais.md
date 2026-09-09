# 05 — Requisitos não funcionais

O que o protótipo já cumpre, o que ele assume e o que o projeto real vai precisar decidir.

## Idioma e formatação — cumprido

Requisito do escopo: interface em pt-BR, dinheiro em real, datas em dd/mm/aaaa.

| Item | Como está | Onde |
|---|---|---|
| Idioma | Toda a interface, incluindo nomes de variáveis e comentários, em português | — |
| Dinheiro | `Intl.NumberFormat("pt-BR", { currency: "BRL" })` em quatro variantes: completa (R$ 129.900,00), curta (R$ 129.900), compacta (R$ 1,1 mi) e de campo (129.900,00) | `lib/format.ts:19` |
| Data | `dataBR` (03/09/2026) e `dataCurta` (03 set) | `lib/format.ts:27` |
| Números | `Intl.NumberFormat("pt-BR")` para quilometragem | `lib/format.ts:25` |
| Alinhamento | Classe `.tabular` (`font-variant-numeric: tabular-nums`) em toda coluna numérica | `index.css` |
| Ordenação | `localeCompare(..., "pt-BR")` respeita acentuação | `estoque-page.tsx:83` |

**Ponto de atenção para o back-end:** o protótipo trata datas como string `yyyy-mm-dd` e usa
`new Date().toISOString()`, que devolve UTC. Numa máquina em UTC−3 depois das 21h, "hoje"
vira amanhã. Não afeta o protótipo, mas no servidor a decisão precisa ser explícita:
guardar `DATE` puro para data de venda e vencimento, e `TIMESTAMPTZ` com fuso
`America/Sao_Paulo` para carimbos de criação.

## Responsividade — cumprido

- Layout de janela com barra lateral fixa acima de 768 px; abaixo disso, navegação
  horizontal rolável (`app-shell.tsx:343`)
- Barra lateral recolhível para 68 px
- Grades de indicadores: 1 coluna no celular, 2 no tablet, 4 no desktop
- Tabelas com rolagem horizontal própria, sem estourar a página
- Conteúdo limitado a 1400 px de largura
- Requisito do escopo era "desktop e tablet"; o protótipo vai além e funciona no celular

## Acessibilidade — bem servido

| Item | Situação |
|---|---|
| Rótulo em todo controle | Sim — componente `Field` liga `label`, erro e `aria-describedby` |
| Erro anunciado | `role="alert"` + `aria-invalid` nos campos inválidos |
| Foco visível | Anel de 3px em todos os interativos |
| Foco preso em diálogo | Radix cuida (dialog, sheet, alert-dialog, popover, dropdown) |
| Esc fecha, rolagem travada | Radix |
| Ordenação anunciada | `aria-sort` nos cabeçalhos ordenáveis |
| Estado atual da navegação | `aria-current="page"` |
| Ícones decorativos | `aria-hidden` |
| Preferência de movimento | `prefers-reduced-motion` respeitado |
| Contraste | Tokens de estado têm degrau próprio de texto, pensado para AA |

Não verificado: leitura ponta a ponta com leitor de tela e auditoria automatizada de
contraste. Vale rodar antes da entrega final.

## Tema claro e escuro — presente

Três estados (claro, escuro, sistema), persistidos em `localStorage`, acompanhando a
mudança do sistema operacional em tempo real (`theme-provider.tsx`). Não é requisito do
escopo — é um acréscimo do protótipo que a equipe precisa decidir se mantém (custa manter
dois temas em toda tela nova).

## Desempenho

| Medida | Valor |
|---|---|
| Bundle JS | 955 KB cru · **274 KB gzip** |
| CSS | 79 KB cru · 13 KB gzip |

274 KB de JavaScript é grande para uma aplicação com 5 telas. A maior parte é `recharts`
(gráficos) e o conjunto do Radix. Não é problema em rede local ou banda larga; é notável em
4G. Caminhos, se virar preocupação:

- `React.lazy` nas telas de Financeiro e Visão geral (as duas que usam gráfico)
- trocar `recharts` por gráficos em SVG próprio, já que são só três tipos
- deixar como está e não otimizar sem medida — a mais defensável agora

**Renderização.** Sem paginação e sem virtualização, a tabela renderiza todas as linhas.
Com 15 veículos é instantâneo; a partir de algumas centenas, o filtro começa a engasgar. Ver
a decisão de paginação em [04](04-contrato-de-api.md).

**Recálculo.** Toda alteração no store recria o objeto de estado e re-renderiza tudo que o
consome (`store.ts:298`). Simples e correto, mas recalcula os indicadores a cada tecla
digitada na busca. Com dados vindos de API, isso vira cache de requisição.

## Persistência — ausente por opção

Nada é salvo: recarregar a página volta ao seed (`store.ts:295`). É o comportamento
esperado de um protótipo. Toda a camada de persistência é trabalho a fazer.

## Segurança — não endereçada

O escopo tirou autenticação e permissões da primeira entrega, e o protótipo seguiu isso: não
há login, usuário nem perfil. O nome "Pedro Silva / Gerente" na barra lateral é fixo
(`app-shell.tsx:229`).

Consequências para a arquitetura, mesmo sem implementar agora:

1. **Todo endpoint nasce público.** Se a aplicação for para a internet sem autenticação,
   qualquer pessoa lê e apaga o estoque. Ou a aplicação roda só em rede local, ou a
   autenticação entra antes de qualquer publicação.
2. **`vendedor` como texto livre** impede auditoria: não dá para saber quem registrou o quê.
3. A rota "Configurações → Usuários e perfis de acesso" já está prevista como próximo passo
   (`em-breve-page.tsx:11`).

Recomendação: escolher o back-end pensando que sessão/login entra na entrega seguinte, e
guardar `criado_por` nas tabelas desde já (nulo por enquanto).

## Qualidade de código no protótipo

| Item | Situação |
|---|---|
| TypeScript | Sim, mas **`strict` não está ligado** em `tsconfig.app.json` — no projeto real, ligar |
| Lint | `oxlint` configurado com regras de hooks do React |
| Testes | **Nenhum** — sem unitário, sem integração, sem e2e |
| Formatação | Sem Prettier/EditorConfig no repositório |
| Build | `tsc -b && vite build` — o build quebra se a tipagem quebrar |

Para o projeto real, três lacunas viram tarefa: ligar `strict`, adicionar testes das regras
de negócio (as cinco do escopo são candidatas naturais) e padronizar formatação.

## Requisitos de infraestrutura implícitos

Derivados do que o protótipo faz:

| Requisito | Origem |
|---|---|
| Transação ACID | `POST /api/vendas` escreve em 4 lugares |
| Agregação com `GROUP BY` e série temporal | Indicadores, fluxo mensal, saídas por categoria, comissões por vendedor |
| Unicidade parcial (placa só quando preenchida) | Regra de negócio do estoque |
| Precisão decimal | Todo valor monetário |
| Fuso horário definido | "Vendas do mês", "atrasado", "dias em estoque" |
| Seed reproduzível | O protótipo tem um; o banco precisa do equivalente para demonstração |

## Requisitos do escopo — situação

| Requisito | Situação |
|---|---|
| Interface em pt-BR | Cumprido |
| Valores em R$ 1.234,56 | Cumprido |
| Datas dd/mm/aaaa | Cumprido |
| Layout responsivo desktop e tablet | Cumprido, e também no celular |
| Mensagens de erro em linguagem natural | Cumprido no front; precisa do mesmo cuidado na API |
| Seed com 10+ veículos e 3+ vendas | Cumprido (15 veículos, 4 vendas) |
| Roda localmente seguindo o README | Cumprido para o front; falta a parte do back |
