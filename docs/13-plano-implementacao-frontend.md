# 13 — Plano de implementação do front-end (sprint de 18/09/2026)

Plano de execução para a equipe de front-end e para o agente de código dela. Cada etapa
corresponde a um card do Trello (board "AutoSystem | Product Backlog") e contém tudo o que
o card diz, na ordem de execução. Objetivo da sprint: **todas as telas passam a usar a API
e `frontend/src/data/store.ts` é apagado**, sem mudar o comportamento visível de nenhuma tela.

O contrato de cada rota do back-end está em [12 — Plano do back-end](12-plano-implementacao-backend.md);
este plano se refere a ele por etapa (`back A5`, `back C1` etc.). Antes de ligar uma tela,
conferir no Trello se a etapa do back correspondente já está mesclada na `main`.

## Regras da sprint

- **Nenhuma funcionalidade nova.** A tela faz exatamente o que faz hoje; só a fonte dos
  dados muda (do `store.ts` para `src/api`). Exceções já aprovadas pelo P.O.: regras de
  desconto, nome + sobrenome no cliente, mudança de status de financiamento e edição/
  exclusão/status de consórcio.
- **Perfis continuam como estão** (`app-context.tsx:140-176`, `auth-context.tsx`): admin,
  gerente e vendedor, com as mesmas telas e restrições. O back passa a impor as mesmas regras.
- **Contrato de transporte:** JSON em snake_case (já é o que o `store.ts` usa), datas
  `"yyyy-mm-dd"`, **dinheiro como número** (mudança em relação ao `tipos.ts` atual),
  enums em minúsculas, erros `{ erro, campos }` (`ApiError` em `client.ts` já entende).
- **Padrão de tela ligada à API** (definido no piloto, etapa 3, e repetido em todas):
  carregar com `useEffect` + `AbortController` (ou React Query, se a equipe escolher e
  registrar em `frontend/src/api/README.md`); estados de carregando, erro e vazio; ao gravar,
  **recarregar da API** em vez de confiar no estado local; `ApiError.message` no toast e
  `ApiError.campos` nos erros por campo (o componente `Field` já exibe).
- **`npm run build` verde** antes de todo PR (typecheck + build; o CI ainda não roda o front).
- **Git:** branch por etapa, um PR por etapa, commits `tipo(escopo): descrição` em
  português, um assunto por commit, **sem trailer `Co-Authored-By` de IA em nenhum
  commit**. `git pull` na `main` antes de abrir branch nova.
- **Vendedor logado:** onde a tela usa `store.obterFuncionario`/`obterFuncionarioPorNome`
  para saber o vendedor logado, passar a usar `usuario.funcionario` que o `GET /api/auth/eu`
  devolve (etapa 11). Até lá, manter o store só para isso.

---

## Etapa 0 — fechar o PR `fix/correcoes-front-qa` (hoje, primeira coisa)

Estado em 18/09 à tarde: PR aberto com **1 commit** (`6926bc5 fix: corrige cadastros,
permissoes e regras comerciais`), **45 commits atrás da `main`**, conflito no `README.md`,
review do P.O. pedindo correções ainda **não aplicado**. O conteúdo está bom: typecheck e
build passam e ele resolve os cards `[FRONT] Criar usuários admin e gerente no seed do
front`, `[FRONT] Corrigir botão "Cadastrar veículo"` e a parte de front de `[FRONT/BACK]
Limitar desconto a 10%`, `[FRONT/BACK] Permitir desconto somente em vendas à vista` e
`[FRONT/BACK/QA] ...CPF...`.

O que fazer, na branch dela (reescrever a própria branch é permitido; a `main` nunca):
```bash
git fetch origin
git checkout fix/correcoes-front-qa
git branch backup/correcoes-front-qa                     # segurança
git reset --mixed $(git merge-base origin/main HEAD)     # desfaz o commit, mantém as mudanças
```
1. Em `cliente-form.tsx`, limitar o sobrenome a **49 caracteres** (mensagem "O sobrenome
   deve ter até 49 caracteres."). Motivo: nome (50) + espaço + sobrenome vão juntos no campo
   `nome`, e a coluna do banco tem 100.
2. Commitar por assunto (`git add <arquivos>` / `git add -p`):
   - `fix(auth): cria usuarios admin e gerente no seed do front`
   - `fix(estoque): mostra "Cadastrar veiculo" so para admin e gerente`
   - `feat(vendas): limita desconto a 10% e so em venda a vista`
   - `fix(clientes): exige sobrenome e valida nome so com letras`
   - `docs(readme): <o que mudou no README>`
3. `git rebase origin/main` — no conflito do `README.md`, **manter a linha da main**
   `| docs/11-auditoria-2026-09-17.md | ... |`.
4. `cd frontend && npm run build` → verde.
5. `git push --force-with-lease` (só nesta branch). O PR atualiza sozinho.
6. Na descrição do PR: "O que muda", "Como testar" e os cards resolvidos.

Depois do merge: os dois cards em QA são testados pelo Gustavo com os três perfis
(`admin@` / `gerente@` / `patricia@autosystem.com.br`, senha `123456`).

---

## Etapa 1 — completar `src/api` e ajustar formatadores (hoje; não depende do back)

Card: `[FRONT] Completar camada src/api e ajustar formatadores`.

- `api/tipos.ts`: `Decimal` passa a ser `number`; remover `decimalParaNumero` e
  `numeroParaDecimal` e todo uso deles. `DataISO` continua `"yyyy-mm-dd"`.
- Remover de `api/tipos.ts` e `api/financeiro.ts` os `import type` de `@/data/store`:
  declarar os enums (`Status`, `TipoLancamento`, `CategoriaLancamento`, `FormaPagamento`,
  `StatusLancamento`, `StatusFinanciamento`, `StatusConsorcio`, `TipoLanceConsorcio`,
  `TipoPagamentoVenda`, `CargoFuncionario`, `StatusFuncionario`) dentro de `tipos.ts`, com
  os mesmos valores. O `store.ts` pode importar de `tipos.ts`, nunca o contrário.
- Novas funções, no padrão dos arquivos existentes:
  - `clientesApi.atualizar(id, dados)` → `PUT /api/clientes/{id}`.
  - `vendasApi.obter(id)` → `GET /api/vendas/{id}`; `vendasApi.registrarComFinanciamento(dados)` → `POST /api/vendas/com-financiamento`.
  - `veiculosApi.listar` aceita `ordem`, `dir`, `vendavel` (tirar `pagina`/`tamanho` do tipo `FiltroVeiculos`).
  - `funcionarios.ts`: `listar()`, `vendedoresAtivos()`, `criar(dados)`, `atualizar(id, dados)`, `criarAcesso(id, {email, senha, perfil, ativo})`.
  - `auth.ts`: `login({email, senha})`, `logout()`, `eu()`, `atualizarConta({nome, email})`, `alterarSenha({senha_atual, nova_senha})`.
  - `consorcios.ts` (não existe hoje): `grupos()`, `listar()`, `criar(dados)`, `atualizar(id, dados)`, `excluir(id)`.
  - `financeiro.ts`: acrescentar `financiamentos.atualizarStatus(id, status)` e `financiamentos.simular(dados)`.
  - `relatorios.ts`: `obter({de, ate})` → `GET /api/relatorios`.
  - `configuracoes.ts`: `obter()`, `salvar(dados)`.
  - Tipos novos em `tipos.ts` com os campos exatos das rotas do plano 12
    (`FuncionarioDTO`, `UsuarioDTO`, `ConsorcioDTO`, `GrupoConsorcioDTO`, `RelatorioDTO`,
    `ConfiguracoesDTO`, `VendaDTO` com `forma_pagamento`, `financiamento_id`, `consorcio_id`,
    `financiamento`, `consorcio`; `VeiculoDTO` com `versao`, `combustivel`, `cambio`, `venda`;
    `ClienteDTO` com `compras`, `total_gasto`, `ultima_compra` obrigatórios; `FinanciamentoDTO`
    com os campos de `store.ts:138`).
- `client.ts`: enviar o header `X-XSRF-TOKEN` lido do cookie `XSRF-TOKEN` em POST/PUT/PATCH/DELETE;
  tratar 401 globalmente (limpar a sessão e mandar para o login) — o comportamento entra na etapa 11.
- `lib/format.ts`: `dataBR` e `diasDesde` robustos para qualquer entrada (não quebrar com
  string fora de `yyyy-mm-dd`).
- Atualizar o mapa store → api em `frontend/src/api/README.md`.
- Critério: `npm run build` verde; nenhum arquivo em `src/api` importa `@/data/store`.

---

## Etapa 2 — Piloto: Estoque consumindo a API

Card: `[FRONT] Piloto: Estoque consumindo a API`. Precisa do back **A1–A6 e A8** (o item
`venda` no `GET /api/veiculos/{id}`).

Arquivos: `features/estoque/estoque-page.tsx`, `quadro-view.tsx`, `veiculo-sheet.tsx`,
`veiculo-detalhes-sheet.tsx`, `excluir-dialog.tsx`, `components/command-palette.tsx` (busca de veículo).

- Listagem: `veiculosApi.listar({busca, status, marca, preco_min, preco_max, ordem, dir})`.
  A ordenação e o filtro passam a ser do servidor; usar `resumo.por_status` para as
  contagens do filtro e `resumo.valor_em_estoque`. Marcas: `veiculosApi.marcas()`.
- Cadastro/edição: `criar`/`atualizar` com `versao`, `combustivel`, `cambio`; 409 de placa
  destaca o campo `placa`; 422 preenche os campos pelo `ApiError.campos`.
- Exclusão: `veiculosApi.obter(id)` traz `venda` — se existir, o diálogo esconde o botão e
  mostra data, valor e cliente (como hoje com `store.vendaDoVeiculo`); no 409 do DELETE,
  `ApiError.dados.venda` traz o mesmo.
- Vendedor continua só consultando (`podeGerenciarEstoque`).
- **Registrar o padrão escolhido** (hook próprio, ex. `useCarregar`, ou React Query) em
  `frontend/src/api/README.md`; as outras telas copiam.
- Pronto quando criar, editar, excluir e filtrar persistem no Postgres e o browser mostra chamadas para `/api`.

## Etapa 3 — Clientes

Card: `[FRONT] Clientes consumindo a API`. Precisa do back **A7 e A8**.

Arquivos: `features/clientes/clientes-page.tsx`, `cliente-dialog.tsx`, `cliente-form.tsx`.
- `clientesApi.listar(busca)` (busca por CPF com máscara já funciona no servidor); colunas
  compras, total gasto e última compra vêm do DTO.
- Criar/editar via API; 409 de CPF destaca `cpf`; erro de CPF do servidor exibido.
- `cliente-form.tsx` continua sendo usado pelo cadastro rápido em venda, consórcio e
  financiamento — não mudar a assinatura.

## Etapa 4 — Funcionários

Card: parte de `[FRONT] Funcionários, Relatórios e bloco financeiro consumindo a API`
(sugestão: abrir um card só para Funcionários). Precisa do back **B1 e B2**.

Arquivo: `features/funcionarios/funcionarios-page.tsx`.
- Lista, cadastro e edição via `funcionariosApi`; inativação pelo status (não há exclusão).
- Conta de acesso: `funcionariosApi.criarAcesso(id, ...)`; o campo `acesso` de cada
  funcionário substitui `usuarioDoFuncionario` do `auth-context`; "Conta administrativa
  protegida" quando `acesso.email` vier `null`.
- Erros 422/409/403 exibidos com as mensagens da API.

## Etapa 5 — Financiamentos e Consórcios

Cards: `[FRONT] Financiamentos: mudar status e simulação pelo servidor`, `[FRONT]
Consórcios: editar, excluir e mudar status da cota` e a parte correspondente do card
grande. Precisa do back **C3 e C4**.

Financiamentos (`features/financiamentos/*`, `features/financeiro/financiamentos.tsx`, `simulador-dialog.tsx`):
- Lista e cadastro via `financeiroApi.financiamentos`; "parcela paga" via `PATCH .../parcela`.
- **Novo:** ação de mudar status (em análise → aprovado → ativo, e cancelar), só admin/gerente,
  via `atualizarStatus`; contrato quitado/cancelado sem a ação (API devolve 409).
- **Novo:** simulador e simulação dentro do cadastro chamam `POST /api/financiamentos/simular`
  em vez de `lib/financeiro.ts`; a parcela mostrada tem que ser igual, centavo a centavo, à gravada.

Consórcios (`features/consorcios/*`, `features/financeiro/consorcios.tsx`):
- Grupos de `consorciosApi.grupos()` no lugar de `GRUPOS_CONSORCIO`; lista e cadastro via API
  (o servidor calcula o plano e gera o número da cota — a tela só exibe).
- **Novo:** "Editar" reabre o `consorcio-sheet.tsx` preenchido e faz `PUT`; o status ganha a
  opção "Cancelado" e pode ser mudado direto na lista/detalhe (é assim que a cota vira
  contemplada); "Excluir" com confirmação, só admin/gerente, escondido para contemplada/
  encerrada; cota encerrada fica só leitura; 409 da API no toast.
- Vendedor edita só as próprias cotas.

## Etapa 6 — Gestão Financeira e Comissões

Card: parte do card grande. Precisa do back **C1 e C2**.

Arquivos: `features/financeiro/financeiro-page.tsx`, `fluxo-caixa.tsx`, `lancamento-dialog.tsx`, `comissoes.tsx`, `lancamento-status.tsx`.
- Lançamentos: `financeiroApi.lancamentos.*` (listar com filtros, criar, editar, quitar,
  excluir); o campo `data` continua único como hoje; lançamento com `venda_id` só edita
  status/forma/data e não exclui (409 no toast).
- Resumo, fluxo mensal e saídas por categoria via `financeiroApi.resumo`/`fluxoMensal`/`saidasPorCategoria`.
- Comissões: `financeiroApi.comissoes.listar({de, ate})` e `pagar({vendedor, forma})`; item a item via quitar lançamento.
- Só admin e gerente veem a tela (já é assim).

## Etapa 7 — Vendas (só depois do back D1)

Card: `[FRONT] Vendas consumindo a API`. Precisa do back **D1** e das etapas 3 e 5.

Arquivos: `features/vendas/vendas-page.tsx`, `venda-dialog.tsx`, `venda-detalhes-sheet.tsx`.
- Listagem e período via `vendasApi.listar({de, ate})`; detalhe via `vendasApi.obter(id)`
  (traz `financiamento`/`consorcio` embutidos para o painel de detalhes).
- Registro: `vendasApi.registrar` com `cliente_id` **ou** `cliente` embutido, `forma_pagamento`,
  `financiamento_id`/`consorcio_id`; venda com financiamento novo via `registrarComFinanciamento`.
- Desconto: com forma ≠ à vista, o valor não pode ficar abaixo do preço; à vista, limite lido
  de `configuracoesApi.obter().comercial.limite_desconto` (em vez de `limiteDescontoConfigurado`
  do localStorage); o 422 `campos.valor_venda` aparece no campo.
- `diferenca` exibida com o sinal do servidor (negativo = desconto).
- KPIs atualizados pelo envelope `{ venda, indicadores }` da resposta, sem segunda chamada.
- 409 de veículo já vendido no toast. Vendedor vê só as próprias vendas e registra só no
  próprio nome (o servidor força).
- Toda a validação de venda sai do `store.ts`: o servidor é a fonte; a tela só faz
  validação de formato antes de enviar.

## Etapa 8 — Visão geral

Card: `[FRONT] Visão geral consumindo a API`. Precisa do back **A8** (rótulo) e da etapa 7.

Arquivo: `features/visao-geral/visao-geral-page.tsx`, `components/app-shell.tsx` (contadores).
- KPIs de `indicadoresApi.resumo()`; gráfico de `faturamentoMensal(6)` usando `rotulo`
  do servidor; estoque por marca do endpoint; "últimas vendas" de `vendasApi.listar`.
- Alertas de dias em estoque calculados com as datas `yyyy-mm-dd`.
- Carregamento paralelo (`Promise.all`) com skeleton; recarga após registrar venda.
- Barra lateral: contadores de estoque, vendas do mês, clientes, financiamentos e consórcios
  pelas rotas; **o resumo financeiro (pendências) só é buscado e exibido para admin e gerente**
  (o vendedor não tem acesso a `/api/financeiro/**`).

## Etapa 9 — Relatórios

Card: parte do card grande. Precisa do back **D2**.

Arquivo: `features/relatorios/relatorios-page.tsx`.
- Trocar todos os cálculos locais por `relatoriosApi.obter({de, ate})`; a "forma mais usada"
  continua derivada de `por_pagamento` na tela; ranking mostra os 5 primeiros.

## Etapa 10 — Configurações

Card: `[FRONT] Login pelo back-end e remoção do store em memória` (parte de configurações). Precisa do back **B4**.

Arquivo: `features/configuracoes/configuracoes-page.tsx`.
- Dados da loja via `configuracoesApi.obter()`/`salvar()`; só admin salva (já é assim).
- "Minha conta" via `authApi.atualizarConta` e `alterarSenha`, com as mensagens da API.
- Tema continua no `localStorage` (`theme-provider.tsx`) — não mexer.
- Remover `CHAVE = "autosystem.configuracoes"` e `limiteDescontoConfigurado` do `store.ts`.

## Etapa 11 — Login pelo back-end e remoção do `store.ts` (último)

Card: `[FRONT] Login pelo back-end e remoção do store em memória`. Precisa do back **B3** e de **todas** as etapas anteriores.

- `auth-context.tsx`: `entrar` → `authApi.login`; `sair` → `logout`; ao abrir a aplicação,
  `authApi.eu()` decide se está logado. Nenhuma senha e nenhum usuário em memória ou
  `localStorage` (remover `autosystem.usuarios` e `autosystem.sessao`). `usuario.funcionario`
  substitui `store.obterFuncionario` nas telas.
- `client.ts`: 401 global → limpar sessão e ir para o login.
- Proteção de rotas e menu continuam por `usuario.perfil`, agora vindo do servidor.
- Apagar `frontend/src/data/store.ts` e o botão "Restaurar dados de exemplo" (`app-shell.tsx`).
- `npm run build` verde sem o arquivo; regra de lint proibindo `import ... from "@/data/store"`.
- Pronto quando o arquivo não existe mais e a aplicação funciona só com o Postgres.

---

## Ordem e dependências

| Dia | Etapa do front | Espera do back |
|---|---|---|
| 1 | 0 (PR), 1 (`src/api`) | nada |
| 1–2 | 2 (Estoque piloto), 3 (Clientes) | A1–A8 |
| 2 | 4 (Funcionários) | B1, B2 |
| 3 | 5 (Financiamentos/Consórcios), 6 (Financeiro/Comissões) | C1–C4 |
| 4 | 7 (Vendas), 8 (Visão geral), 9 (Relatórios), 10 (Configurações) | D1, D2, B4 |
| 4 | 11 (Login + apagar store) | B3 |

Com dois devs de front: um pega Estoque → Clientes → Funcionários → Vendas; o outro pega
`src/api` → Financiamentos/Consórcios → Financeiro/Comissões → Relatórios/Configurações.
Visão geral e Login ficam para quem terminar primeiro.

---

## Zonas de conflito e pontos de conversa com o back

Onde os dois lados mexem no mesmo contrato e precisam combinar antes de codar:

| Assunto | Quem decide | Como combinar |
|---|---|---|
| Nome exato dos campos de cada DTO novo (funcionário, consórcio, financiamento, relatório, configurações) | Plano 12 (back) é a referência | O front escreve `tipos.ts` a partir do plano 12; se o back precisar mudar um nome, avisa **antes** de mesclar e atualiza `docs/04` no mesmo PR |
| Envelope `{ venda, indicadores }` e `GET /api/vendas/{id}` com `financiamento`/`consorcio` | Decidido pelo P.O. | Front espera exatamente isso; back não devolve a venda "solta" |
| Padrão de carregamento (hook próprio × React Query) | Front | Registrar em `src/api/README.md` na etapa 2; o back não é afetado |
| Cookie de sessão + CSRF (`XSRF-TOKEN` / `X-XSRF-TOKEN`) | Back B3 | Back avisa o nome do cookie e do header; front implementa em `client.ts` (etapa 1) e testa na etapa 11 |
| `versao`, `combustivel`, `cambio` (valores das listas) | Front já tem as listas (`store.ts:11-23`) | Back copia os mesmos valores no CHECK; qualquer diferença → 422 na tela |
| Vendedor: nome na API, id no banco | Back | Front continua enviando/lendo o **nome**; nunca o id |
| Seed de dev (usuários e senhas de teste) | Back B2 | Mesmos e-mails/senha que o front usa hoje (`admin@`, `gerente@`, vendedores, `123456`) |
| Regras de desconto (limite lido de Configurações) | P.O. (10 %) | Front lê `GET /api/configuracoes`; back valida no POST de venda com o mesmo campo |

Arquivos que os **dois lados não devem editar ao mesmo tempo**: `docs/04-contrato-de-api.md`
(quem muda a rota atualiza) e `README.md` (só o card de docs do Newton). Em `frontend/`,
o back só mexe via `frontend-maven-plugin` (etapa E1 do plano 12), sem tocar em `src/`.

**Quando falar com o outro dev (antes de codar, não depois):**
1. Front vai começar uma tela e a etapa do back correspondente ainda não está na `main` →
   perguntar a previsão; enquanto isso, escrever a tela contra o `tipos.ts` e testar com o
   back rodando localmente na branch do Lucas.
2. Back vai mudar qualquer nome de campo, código de status ou mensagem de erro em relação
   ao plano 12 → avisar o front no card do Trello antes de mesclar.
3. Front achou uma regra da tela que o plano 12 não cobre (ex.: uma validação do `store.ts`
   que ficou de fora) → abrir comentário no card do back com o trecho do `store.ts`.
4. Teste de integração de uma tela (front + back juntos) falhou → os dois olham juntos o
   `ApiError.status` e o log do Spring antes de mudar contrato.
