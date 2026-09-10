# 01 — Inventário funcional

Tudo que o protótipo `frontend` faz hoje. Serve como base de estimativa: cada linha
aqui é trabalho que o back-end precisa sustentar.

## Navegação

Roteamento por hash (`#/estoque`), sem biblioteca de rotas — `app-context.tsx:124`.
Nove rotas declaradas em `ROTAS` (`app-context.tsx:38`), cinco funcionais e quatro marcadas
como "em breve".

| Rota | Grupo | Situação |
|---|---|---|
| `#/visao-geral` | Operação | Funcional |
| `#/estoque` | Operação | Funcional |
| `#/vendas` | Operação | Funcional |
| `#/clientes` | Operação | Funcional |
| `#/financeiro` | Gestão | Funcional |
| `#/oficina` | Pós-venda | Em breve |
| `#/test-drive` | Pós-venda | Em breve |
| `#/relatorios` | Gestão | Em breve |
| `#/configuracoes` | Sistema | Em breve |

O escopo aprovado (`autosystem-escopo-primeira-entrega.md`) previa duas telas: Estoque e
Gerencial. O protótipo desdobrou "Gerencial" em **Visão geral + Vendas** e acrescentou
**Clientes** e **Financeiro**.

## Estrutura da janela (`app-shell.tsx`)

- Barra lateral recolhível (236 px ↔ 68 px), com contadores ao vivo: veículos em estoque,
  vendas do mês, clientes, pendências financeiras (`app-shell.tsx:166`)
- Cabeçalho com voltar/avançar do histórico, título da rota, campo de busca que abre a
  paleta, ações contextuais da tela e sino de notificação ligado ao número de reservas
- Navegação horizontal alternativa abaixo de 768 px
- Seletor de tema claro / escuro / sistema, persistido
- Botão de restaurar dados de exemplo

## Tela: Visão geral

Fonte: `features/visao-geral/visao-geral-page.tsx`

| Bloco | Conteúdo |
|---|---|
| Saudação | Data por extenso em pt-BR e nome fixo do usuário |
| 4 indicadores | Veículos em estoque · Valor em estoque · Vendas no mês · Faturamento do mês |
| Variação | Vendas e faturamento comparam com o mês anterior, em % |
| Gráfico | Faturamento dos últimos 6 meses (área, recharts) com tooltip próprio |
| Estoque por status | Barra proporcional + lista com % e contagem |
| Estoque por marca | Top 5 marcas por valor imobilizado |
| Últimas vendas | 5 mais recentes com veículo, cliente, vendedor e valor |
| Precisa de atenção | Até 5 alertas derivados: reserva ≥ 30 dias, veículo parado ≥ 60 dias, veículo sem placa |

Os quatro indicadores são exatamente os do escopo. A lista de atenção e a comparação com o
mês anterior são acréscimos do protótipo.

## Tela: Estoque

Fonte: `features/estoque/estoque-page.tsx`, `quadro-view.tsx`, `veiculo-sheet.tsx`, `excluir-dialog.tsx`

### Listagem

- **Duas visualizações**: tabela e quadro (uma coluna por status), alternadas por controle
  segmentado
- **Ordenação** por veículo, ano, km, preço, status e dias em estoque — clique no cabeçalho
  alterna asc/desc (`estoque-page.tsx:78`)
- **Ordem inicial**: dias em estoque, ascendente
- Duplo clique na linha abre a edição
- Rodapé com contagem por status
- Coluna "Em estoque" (dias desde `criado_em`) destacada em laranja a partir de 60 dias

### Filtros (combináveis)

| Filtro | Comportamento |
|---|---|
| Busca | Marca, modelo **ou placa**, sem distinção de caixa (`store.ts:339`) |
| Status | Todos / Disponíveis / Reservados / Vendidos, com contagem que respeita os outros filtros |
| Marca | Lista derivada do que está cadastrado |
| Faixa de preço | Popover com mínimo, máximo e três atalhos ("até 60 mil", "60 a 100 mil", "100 mil+") |
| Limpar | Aparece só quando há filtro ativo |

Resumo dinâmico: quantidade filtrada, total geral e valor em estoque da seleção (exclui
vendidos do somatório — `estoque-page.tsx:277`).

### Quadro

Uma coluna por status com valor somado no topo, cartão por veículo (marca, ano, cor, km,
preço, placa, dias em estoque) e **nota de atenção automática**: parado há ≥ 60 dias,
reserva aberta há ≥ 30 dias, ou "entrou esta semana" (≤ 3 dias) — `quadro-view.tsx:21`.
Botão "Adicionar veículo" por coluna, que já pré-seleciona o status.

### Cadastro e edição

Painel lateral (`Sheet`), mesmo formulário para os dois casos. Campos: marca (com sugestões
de 11 montadoras), modelo, ano, cor, quilometragem, preço, placa e status. Validação
descrita em [03](03-regras-e-calculos.md). Erro por campo, foco automático no primeiro campo
inválido, revalidação a cada tecla depois da primeira tentativa.

### Exclusão

Diálogo de confirmação. Quando o veículo tem venda registrada, o botão de excluir some e o
diálogo mostra data, valor e cliente da venda.

## Tela: Vendas

Fonte: `features/vendas/vendas-page.tsx`, `venda-dialog.tsx`

- **Período**: este mês, 30 dias, 90 dias, tudo, personalizado (de/até)
- **4 indicadores do período**: vendas, faturamento (com total de desconto concedido),
  ticket médio, vendedor destaque
- **Histórico**: data, veículo, cliente, vendedor, preço de tabela e valor negociado, com a
  diferença calculada e colorida (desconto em laranja, acima da tabela em verde)
- Rodapé com contagem e total

### Registro de venda

- Seleção de veículo por busca (`cmdk`), só entre os não vendidos, mostrando status, ano e
  preço de tabela
- Cliente existente por busca (nome ou CPF) **ou** cadastro rápido embutido, com as mesmas
  validações do cadastro completo
- Vendedor com sugestões (`datalist`, 4 nomes fixos)
- Valor pré-preenchido com o preço de tabela e editável; mostra desconto ou acréscimo em
  tempo real
- Data limitada a hoje (não aceita futuro)
- Pode ser aberta já com um veículo pré-selecionado, a partir do estoque ou da paleta

## Tela: Clientes

Fonte: `features/clientes/clientes-page.tsx`, `cliente-form.tsx`, `cliente-dialog.tsx`

- Busca por nome, CPF (ignorando pontuação) ou e-mail
- Listagem ordenada por nome com: iniciais, data de cadastro, CPF, telefone, e-mail,
  número de compras, total gasto e data da última compra
- Cadastro com máscara de CPF e telefone, validação de dígitos verificadores do CPF e
  verificação de duplicidade

## Tela: Financeiro

Fonte: `features/financeiro/*`. Três áreas em controle segmentado, com seletor de período
compartilhado (este mês / 30 / 90 / tudo / personalizado).

### Fluxo de caixa

- **4 indicadores**: entradas, saídas, saldo do período (com chip positivo/negativo) e
  pendências (a pagar, com contagem de atrasados e total a receber)
- **Gráfico composto** (barras de entrada e saída + linha de saldo) dos últimos 6 meses
- **Saídas por categoria** com barra proporcional e percentual
- **Tabela de lançamentos** com busca por descrição/categoria/vendedor, filtro de tipo,
  situação (inclui "em atraso") e categoria
- **Quitação rápida**: submenu com forma de pagamento marca o lançamento como pago
- Lançamentos gerados por venda aparecem com cadeado e não podem ser excluídos
- Linha em atraso ganha fundo avermelhado
- Rodapé com o resultado líquido da seleção

### Comissões

- **4 indicadores**: comissão gerada, já paga, a pagar e a regra vigente (1,5 %)
- **Por vendedor**: vendas, faturamento, comissão gerada, pendente, com botão de pagar tudo
  escolhendo a forma
- **Aguardando pagamento**: lista item a item com quitação individual

### Financiamentos

- **4 indicadores**: contratos ativos, total financiado, parcelas recebidas, vencendo no mês
- **Cartão por contrato**: veículo, cliente, banco, progresso das parcelas, valor da parcela,
  financiado, entrada, taxa, saldo a receber, próxima parcela, estado (quitado / em atraso)
- Botão "parcela paga" que avança o contador
- **Simulador Tabela Price**: veículo do estoque (preenche valor e sugere 20 % de entrada),
  entrada, prazo 12–60×, taxa mensal, banco; devolve parcela, total, juros, CET anual
  aproximado e as 5 primeiras linhas de amortização; com cliente escolhido, registra o contrato

## Ações globais

**Paleta ⌘K / Ctrl+K** (`command-palette.tsx`): cadastrar veículo, registrar venda, novo
cliente, novo lançamento, simular financiamento, alternar tema, ir para qualquer tela e
pular direto para um veículo pelo nome, placa, ano ou status.

## Estados de interface já tratados

| Estado | Onde |
|---|---|
| Vazio sem filtro | "Nenhum veículo cadastrado" com ação de cadastrar |
| Vazio com filtro | "Nenhum veículo com estes filtros" com ação de limpar |
| Vazio por período | Vendas e lançamentos |
| Bloqueio | Exclusão de veículo com venda; exclusão de lançamento gerado por venda |
| Erro de campo | Mensagem com `role="alert"` e `aria-invalid` em todos os formulários |
| Sucesso | Toast (`sonner`) em toda operação que grava |
| Atenção | Reserva antiga, veículo parado, veículo sem placa, lançamento atrasado |

## O que o protótipo **não** faz

- Não persiste nada: recarregar a página zera para o seed
- Não tem login, usuários, perfis nem permissões
- Não tem paginação — renderiza a lista inteira
- Não faz upload de foto de veículo
- Não exporta PDF nem planilha
- Não cancela nem estorna venda (só o caminho feliz)
- Não tem back-end, nenhuma chamada de rede
