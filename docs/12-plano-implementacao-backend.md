# 12 — Plano de implementação do back-end (sprint de 18/09/2026)

Plano de execução para o desenvolvedor de back-end e para o agente de código dele. Cada
etapa abaixo corresponde a um card do Trello (board "AutoSystem | Product Backlog", lista
Sprint Backlog) e contém tudo o que o card diz, na ordem em que deve ser feito. O objetivo
da sprint é **desligar o banco em memória do front (`frontend/src/data/store.ts`)**: todas
as rotas que as telas usam hoje precisam existir na API.

Referências que complementam este plano: [11 — Auditoria](11-auditoria-2026-09-17.md)
(evidência de cada defeito), [04 — Contrato de API](04-contrato-de-api.md) (que será
atualizado por este plano) e o próprio `frontend/src/data/store.ts`, que é a **fonte da
verdade do comportamento**: cada rota reproduz o método do store citado.

## Convenções (valem para todas as rotas)

- **Fonte da verdade:** o comportamento de cada rota é o do método citado de
  `frontend/src/data/store.ts` (e `frontend/src/auth-context.tsx` para login). Mesmas
  regras, mesma ordenação, mesmas mensagens de erro em português. Não inventar regra nova.
- **JSON** em `snake_case` (já configurado: `spring.jackson.property-naming-strategy=SNAKE_CASE`).
- **Datas** como `"yyyy-mm-dd"` (`LocalDate` nos DTOs).
- **Dinheiro:** `BigDecimal` no Java e `NUMERIC(12,2)` no banco, sempre (nunca `double`/`float`).
  No JSON o `BigDecimal` sai como **número** com 2 casas (`142500.00`), não como string; é o
  padrão do Jackson e o back atual já faz isso. Não trocar para `ToStringSerializer`.
- **Percentual de comissão** como número em % (`1.5` = 1,5 %). **Taxa mensal** de
  financiamento como fração (`0.0189` = 1,89 % a.m.).
- **Enums** com os mesmos valores do `store.ts`, em minúsculas (`disponivel`, `avista`,
  `em_analise`...). Os enums Java já usam `@JsonValue` para isso; seguir o padrão de
  `StatusVeiculo`.
- **Erros:** corpo sempre `{ "erro": "mensagem pronta para o usuário", "campos": { "nome_do_campo": "mensagem" } }`
  (ProblemDetail com propriedades estendidas, já existe em `GlobalExceptionHandler`).
  Códigos: 400 parâmetro inválido · 401 sem login · 403 perfil sem permissão · 404 não
  existe · 409 conflito de regra (duplicado, já vendido, exclusão bloqueada) · 422 validação
  de campo · 500 só erro inesperado. As chaves de `campos` são o nome do campo **em
  snake_case**, como o formulário do front usa.
- **Perfil vendedor:** nas rotas marcadas *filtra vendedor*, o perfil `vendedor` só recebe
  registros cujo `vendedor` = nome do funcionário ligado ao usuário logado (admin e gerente
  veem tudo). Nas rotas marcadas *força vendedor*, o campo `vendedor` enviado é ignorado e
  substituído pelo nome dele. Enquanto o login (etapa 9) não existir, essas regras ficam
  preparadas no service e são ligadas quando a autenticação entrar.
- **Vendedor por id no banco, nome na API:** vendas, lançamentos, financiamentos e
  consórcios guardam `vendedor_id` (FK para `funcionarios`); a API continua recebendo e
  devolvendo o **nome** no campo `vendedor`. O back resolve nome ↔ id. Motivo: a tela de
  Funcionários edita o nome; guardando texto, renomear um vendedor desligaria as vendas e
  comissões antigas dele.
- **Seed de dev:** cada módulo novo porta para `src/main/resources/db/dev/afterMigrate.sql`
  os dados de exemplo do `store.ts` (`seed`, `seedBase`, `seedFinanceiro`), para as telas
  abrirem com os mesmos dados de hoje.
- **Migrations:** uma nova `V<n>__descricao.sql` por mudança de banco; migration já
  mesclada nunca é editada. Tipos: enums como `VARCHAR + CHECK`, dinheiro `NUMERIC(12,2)`,
  datas `DATE`, carimbos `TIMESTAMPTZ`.
- **Testes:** cada rota nova ganha teste de contrato com `@AutoConfigureMockMvc` (status,
  nomes em snake_case, formato de erro) e os testes de service/integração no padrão dos
  existentes (Testcontainers, Postgres real).
- **Git:** um PR por etapa, commits `tipo(escopo): descrição` em português, **sem trailer
  `Co-Authored-By` de IA em nenhum commit**. `./mvnw verify` verde antes do PR. Mudou
  endpoint → atualizar `docs/04-contrato-de-api.md`.

---

## Bloco A — correções (sem dependência; começar hoje)

### A1. Bloquear reversão de status de veículo vendido
Card: `[BACK] Bloquear reversão de status de veículo vendido`. Arquivo: `veiculo/VeiculoService.java` (`atualizar` e `criar`).

- Antes de aplicar o status no `atualizar`, consultar `vendaRepository.findByVeiculoId(id)`.
  Se houver venda, qualquer status diferente de `vendido` → 409 com
  `"erro": "Este veículo possui uma venda registrada e não pode voltar ao estoque."`.
- `criar` não aceita `vendido` como status inicial → 422 `campos.status`.
- Testes de integração dos dois caminhos; conferir que `GET /api/indicadores` volta a bater.

### A2. Retornar 404/400/405 em vez de 500
Card: `[BACK] Retornar 404/400/405 em vez de 500 no tratamento de erros`. Arquivo: `commons/handler/GlobalExceptionHandler.java`.

- Estender `ResponseEntityExceptionHandler` (ou declarar handlers explícitos) para
  `NoHandlerFoundException`/`NoResourceFoundException` → 404,
  `MethodArgumentTypeMismatchException` e `MissingServletRequestParameterException` → 400,
  `HttpRequestMethodNotSupportedException` → 405. Sempre no formato `{ erro, campos }`.
- O catch-all de `Exception` fica só para o que sobrar, e só ele faz `log.error`.
- `IllegalArgumentException` → 400 com mensagem fixa em português, sem `ex.getMessage()`.
- Testes: rota inexistente → 404, `GET /api/veiculos/abc` → 400, `PATCH /api/veiculos/1` → 405.

### A3. Datas em `yyyy-mm-dd`
Card: `[BACK] Devolver datas no formato yyyy-mm-dd`. Arquivos: `VeiculoResponse`, `ClienteResponse`, `VendaResponse` (inclusive `VeiculoBreve`), `UsuarioResponse`.

- `criado_em`/`atualizado_em` como `LocalDate` nos DTOs
  (`LocalDate.ofInstant(instant, ZoneId.of("America/Sao_Paulo"))`); `Instant` continua na entidade.
- Teste afirmando `"criado_em":"2026-09-17"` em cada recurso.

### A4. Erros 422 com chaves em snake_case
Card: `[BACK] Erros de validação (422) com chaves em snake_case`. Arquivos: `GlobalExceptionHandler.java`, `VeiculoRequest.java`.

- Converter a chave de `FieldError.getField()` para snake_case ao montar `campos`
  (`clienteId` → `cliente_id`).
- Mover a regra do ano de `@AssertTrue isAnoValido` para uma validação ligada ao campo
  `ano` (validador próprio ou checagem no service lançando 422 com `campos.ano`), para a
  chave virar `ano`.
- Os 409 de placa e CPF duplicados passam a trazer `campos` (`{"placa": ...}` / `{"cpf": ...}`).
- Ajustar `VeiculoRequestValidationTest:94` e `VendaRequestValidationTest:156`, que fixam o nome errado.

### A5. Ordenação e filtro "vendável" em `GET /api/veiculos`
Card: `[BACK] Ordenação e filtro "vendável" em GET /api/veiculos`. Arquivos: `VeiculoController`, `VeiculoService`, `VeiculoSpecification`.

- Novos parâmetros: `ordem` ∈ {`veiculo`, `ano`, `quilometragem`, `preco`, `status`, `dias`}
  (padrão `dias`), `dir` ∈ {`asc`, `desc`} (padrão `asc`), `vendavel=true` (status ≠ vendido).
- `veiculo` ordena por marca + modelo; `dias` = `criado_em` invertido (asc = mais dias primeiro).
- `ordem` ou `dir` inválidos → 400. **Paginação não entra** (decisão do P.O.); `pagina`/`tamanho` continuam ignorados.
- Testes de cada ordenação e do filtro.

### A6. Veículo: `versao`, `combustivel`, `cambio`
Card: `[BACK] Veículo: campos versão, combustível e câmbio`.

- Migration `V3__veiculo_versao_combustivel_cambio.sql`: três colunas nuláveis; `combustivel`
  com CHECK em (`gasolina`, `etanol`, `flex`, `diesel`, `hibrido`, `eletrico`); `cambio` com
  CHECK em (`manual`, `automatico`, `automatizado`, `cvt`); `versao VARCHAR(50)`.
- Entidade, `VeiculoRequest` (`versao` até 50 → 422 "A versão deve ter até 50 caracteres.";
  valor fora da lista → 422 no campo), `VeiculoResponse` (inclusive dentro do envelope
  `{ itens, total, resumo }`).
- Seed de dev preenchendo os três campos como no `store.ts` (`seedBase`).

### A7. Clientes com `compras`, `total_gasto`, `ultima_compra`
Card: `[BACK] Clientes com compras, total gasto e última compra`. Arquivo: `ClienteResponse`, `ClienteRepository`/`ClienteService`.

- Uma única consulta com `LEFT JOIN vendas` + `count/sum/max` (ou projeção `JdbcClient`) para a
  listagem inteira; nunca uma consulta por cliente.
- Cliente sem compra devolve `compras: 0`, `total_gasto: 0.00`, `ultima_compra: null`
  (campos presentes). Mesmos campos no `GET /{id}`, `POST` e `PUT`.

### A8. Ajustes de validação, dados e fuso
Card: `[BACK] Ajustes de validação, dados e fuso horário`.

- Busca de cliente por CPF com máscara: normalizar o termo removendo não-dígitos antes do
  `LIKE` quando ele tiver dígitos (`?busca=049.985.290-17` precisa achar).
- `meses` em `/api/indicadores/faturamento-mensal` validado entre 1 e 36 → 400 fora da faixa.
- `setScale(2, HALF_UP)` em todo dinheiro de entrada; `@Digits(integer=10, fraction=2)` nos campos monetários.
- `Clock.system(ZoneId.of("America/Sao_Paulo"))` em `AppConfig`.
- Telefone com 10 ou 11 dígitos após remover a máscara → 422 `campos.telefone`.
- Escapar `%` e `_` nas buscas com `LIKE`.
- `DataIntegrityViolationException`: mapear pelo nome da constraint (`idx_veiculos_placa`,
  `clientes_cpf_key`, `venda_unica_por_veiculo`) para a mensagem de regra correspondente.
- Mensagens ao usuário com acentuação (ajustar os testes que fixam texto sem acento).
- `GET /api/indicadores/faturamento-mensal` passa a devolver `rotulo` (mês abreviado em
  pt-BR, minúsculo, sem ponto: `"set"`), como `store.faturamentoPorMes` — o gráfico usa `dataKey="rotulo"`.
- `GET /api/veiculos/{id}` passa a trazer `"venda": { id, data_venda, valor_venda, cliente: { id, nome } }`
  ou `null` — o diálogo de exclusão consulta a venda **antes** de excluir.
- **Nome do cliente** (regra aceita pelo P.O.): em `POST/PUT /api/clientes` e no cliente
  embutido de vendas/consórcios/financiamentos, `nome` precisa de pelo menos 2 palavras e só
  letras/espaços (regex `^[\p{L}]+(\s+[\p{L}]+)*$`) → 422 `campos.nome`
  "Informe nome e sobrenome do cliente." / "Use apenas letras no nome.". Limite continua 100.

### A9. Testes de contrato HTTP por recurso
Card: `[BACK/QA] Testes de contrato HTTP por recurso`. Feito **junto** com A1–A8, não depois.

- Uma classe `@AutoConfigureMockMvc` por recurso (veículo, cliente, venda, indicador, usuário
  e cada módulo novo), afirmando: status de cada caminho (200/201/204/400/404/405/409/422),
  nomes de campo em snake_case, datas `yyyy-mm-dd`, dinheiro numérico, formato `{ erro, campos }`.

---

## Bloco B — Funcionários e autenticação (caminho crítico)

### B1. Módulo Funcionários
Card: `[BACK] Módulo Funcionários`. Origem: `store.ts:1345-1416`, `funcionarios-page.tsx`.

Migration `V4__funcionarios.sql`:
```sql
CREATE TABLE funcionarios (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  cargo VARCHAR(20) NOT NULL CHECK (cargo IN ('gerente','vendedor','financeiro','administrativo','mecanico')),
  comissao NUMERIC(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(10) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  data_admissao DATE NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE vendas ADD COLUMN vendedor_id BIGINT REFERENCES funcionarios(id);
```
Migrar `vendas.vendedor` (texto) casando pelo nome com o seed de funcionários; manter a
coluna de texto até o fim da migração e depois removê-la numa migration posterior.

Rotas:

| Rota | Quem | Comportamento |
|---|---|---|
| `GET /api/funcionarios` | admin, gerente | `store.funcionarios()`: todos, ordem por nome (pt-BR). Item `{id, nome, cpf, telefone, email, cargo, comissao, status, data_admissao, acesso}`; `acesso` = `{email, perfil, ativo}` da conta de login ou `null`. Se a conta for admin e quem pede não for admin: `acesso = {perfil: "admin", email: null, ativo}`. |
| `GET /api/funcionarios/vendedores-ativos` | todos | `store.vendedoresAtivos()`: cargo `vendedor` e status `ativo`, por nome. Item `{id, nome, comissao}`. |
| `POST /api/funcionarios` | admin, gerente | `store.criarFuncionario`. Corpo `{nome, cpf, telefone, email, cargo, comissao, status, data_admissao}`. nome/cpf/telefone/data_admissao obrigatórios; `comissao ≥ 0`; se `cargo ≠ vendedor`, gravar `comissao = 0`; CPF comparado só pelos dígitos. 422 "Preencha corretamente os campos obrigatórios." · 409 `campos.cpf` "Já existe um funcionário cadastrado com este CPF.". 201 com o funcionário. |
| `PUT /api/funcionarios/{id}` | admin, gerente | `store.atualizarFuncionario`. Mesmo corpo/regras; status pode virar `inativo`. **Não há DELETE.** 404 · 422 · 409 `campos.cpf` "Já existe outro funcionário cadastrado com este CPF.". |

Seed de dev: os 4 vendedores do `store.ts` (Patrícia Gomes, Alan Ferreira, Beatriz Ramos,
Caio Monteiro, com o percentual de comissão de cada um) **mais um gerente**
(`gerente@autosystem.com.br`, cargo `gerente`).

### B2. Vincular usuário a funcionário
Card: `[BACK] Vincular usuário a funcionário (perfis como no front)`.

- Migration `V5__usuarios_funcionario.sql`: `ALTER TABLE usuarios ADD COLUMN funcionario_id BIGINT UNIQUE REFERENCES funcionarios(id)`.
- Perfil no JSON em minúsculo (`admin | gerente | vendedor`); enum `Perfil` já existe, só o `@JsonValue`.
- `POST /api/funcionarios/{id}/acesso` (admin, gerente): cria a conta de login do funcionário.
  Corpo `{email, senha, perfil, ativo}`. Erros: 404 "Funcionário não encontrado." · 409 "Este
  funcionário já possui acesso ao sistema." · 422 `campos.email` "Informe o e-mail de acesso." ·
  409 `campos.email` "Este e-mail já está sendo utilizado por outro usuário." · 422
  `campos.senha` "A senha inicial deve ter pelo menos 6 caracteres." · 403 "Somente
  administradores podem criar contas com perfil de Administrador." (gerente não cria admin).
  E-mail sem diferenciar maiúsculas; senha BCrypt; nome da conta = nome do funcionário. 201 `{email, perfil, ativo}`.
- Seed de dev (contas): **sempre** `admin@autosystem.com.br` / `123456` (admin) e
  `gerente@autosystem.com.br` / `123456` (gerente, ligado ao funcionário gerente); uma conta
  `vendedor` para cada vendedor ativo do seed (`patricia@`, `alan@`, `beatriz@`, `caio@autosystem.com.br`, senha `123456`).

### B3. Login, sessão e controle de acesso
Card: `[BACK] Login, sessão e controle de acesso por perfil`. Origem: `auth-context.tsx`.

- Dependência: `spring-boot-starter-security`. Sessão com cookie `HttpOnly` (não JWT), CSRF
  ligado com `CookieCsrfTokenRepository` (o front envia `X-XSRF-TOKEN`).
- `POST /api/auth/login` (público). Corpo `{email, senha}`; e-mail sem diferenciar maiúsculas,
  sem espaços nas pontas. 401 "E-mail ou senha incorretos." (mesma mensagem para usuário
  inexistente e senha errada) · 403 "Este usuário está inativo.". 200 cria a sessão e devolve
  `{id, nome, email, perfil, ativo, funcionario_id, funcionario: {id, nome, cargo, comissao} | null}`.
- `POST /api/auth/logout` → 204. `GET /api/auth/eu` → usuário da sessão no mesmo formato; 401 sem sessão.
- `PUT /api/auth/conta` (logado). Corpo `{nome, email}`. 422 `campos.nome` "Informe o nome do
  usuário." · 422 `campos.email` "Informe o e-mail do usuário." · 409 `campos.email` "Este
  e-mail já está sendo utilizado.". 200 com o usuário.
- `PUT /api/auth/senha` (logado). Corpo `{senha_atual, nova_senha}`. 422 `campos.senha_atual`
  "A senha atual está incorreta." · 422 `campos.nova_senha` "A nova senha deve ter pelo
  menos 6 caracteres." / "A nova senha deve ser diferente da senha atual.". 204.
- **Matriz de acesso** (igual a `app-context.tsx:140-176`): todas as rotas `/api/**` exigem
  login, exceto `/api/auth/login`, `/actuator/health` e os arquivos do front. Só admin e
  gerente: `/api/funcionarios` (exceto `/vendedores-ativos`), `/api/lancamentos`,
  `/api/financeiro/**`, `/api/comissoes/**`, `/api/relatorios`, e escrita em `/api/veiculos`
  (POST/PUT/DELETE — vendedor só lê). `PUT /api/configuracoes` só admin. Demais rotas
  liberadas aos três perfis, com *filtra vendedor* / *força vendedor* onde indicado. Negado → 403.
- Ligar o *filtra vendedor* em `GET /api/vendas`, `/api/consorcios`, `/api/financiamentos` e
  nos indicadores (`vendas_no_mes`, `faturamento_mes`, mês anterior e série mensal contam
  só as vendas do vendedor logado; estoque continua da loja inteira).
- **Remover** a rota pública `POST /api/usuarios`; `GET /api/usuarios` só admin.
- Colunas `criado_por`/`atualizado_por` + `@CreatedBy`/`@LastModifiedBy` nas tabelas (migration).
- Swagger e actuator restritos a usuário logado. Testes de autenticação e de 403 por perfil.

### B4. Configurações da concessionária
Card: `[BACK] Configurações da concessionária no servidor`. Origem: `configuracoes-page.tsx:28-70`.

- Migration `V6__configuracoes.sql`: tabela de registro único com os campos abaixo.
- `GET /api/configuracoes` (todos): `{concessionaria: {nome, cnpj, telefone, email, cidade, uf}, comercial: {comissao_padrao, limite_desconto}, financeiro: {dia_pagamento_comissao, prazo_primeira_parcela}}`.
  Seed: nome "Concessionária Central", demais vazios, `comissao_padrao 1.50`,
  `limite_desconto 10.00`, `dia_pagamento_comissao 30`, `prazo_primeira_parcela 30`.
- `PUT /api/configuracoes` (só admin): mesmo objeto completo; 200 com o salvo; gerente/vendedor → 403.
- `limite_desconto` é usado pelo `POST /api/vendas` (etapa D1).

---

## Bloco C — módulos financeiros

### C1. Gestão Financeira (lançamentos e fluxo de caixa)
Card: `[BACK] Módulo Gestão Financeira: lançamentos e fluxo de caixa`. Origem: `store.ts:1536-1656`, `financeiro/*.tsx`. Contrato do front já escrito em `frontend/src/api/financeiro.ts`.

Migration `V7__lancamentos.sql`: `lancamentos` com `tipo` (`entrada|saida`), `categoria`
(`venda, compra_veiculo, comissao, despesa_fixa, oficina, marketing, impostos, financiamento, outros`),
`descricao VARCHAR(200)`, `valor NUMERIC(12,2) > 0`, **`vencimento DATE NOT NULL` e `pago_em DATE`
separados**, `status` (`pago|pendente`), `forma` (`pix, transferencia, boleto, cartao, dinheiro, financiamento, consorcio`, nulo quando pendente),
`venda_id` (FK, nulo), `veiculo_id` (FK, nulo), `vendedor_id` (FK funcionarios, nulo).
A API expõe o campo **`data`** como o front usa: `data = pago_em` quando pago, senão `vencimento`;
ao criar/editar, `data` vira `vencimento` (pendente) ou `pago_em` (pago). `atrasado` = pendente com `vencimento < hoje`.

| Rota | Quem | Comportamento |
|---|---|---|
| `GET /api/lancamentos` | admin, gerente | `store.listarLancamentos`. Query opcional: `de`, `ate` (sobre `data`), `tipo`, `categoria`, `status` (`pago|pendente|atrasado`), `busca` (sem diferenciar maiúsculas, em descrição + rótulo da categoria `ROTULO_CATEGORIA` + vendedor). Ordem: `data` desc, id desc. Item `{id, tipo, categoria, descricao, valor, data, status, forma, venda_id, veiculo_id, vendedor}`. |
| `POST /api/lancamentos` | admin, gerente | `store.criarLancamento` + `lancamento-dialog.tsx:62`. Corpo `{tipo, categoria, descricao, valor, data, status, forma, veiculo_id}`. Categoria compatível com o tipo (entrada: venda, oficina, financiamento, outros · saída: compra_veiculo, comissao, despesa_fixa, oficina, marketing, impostos, outros); `forma` obrigatória se pago e nula se pendente; `venda_id`/`vendedor` sempre nulos. 422: `campos.descricao` "Descreva o lançamento." · `campos.valor` "Informe o valor." / "O valor deve ser maior que zero." · `campos.data` "Informe a data." · `campos.forma` "Informe como foi pago.". 201. |
| `PUT /api/lancamentos/{id}` | admin, gerente | `store.atualizarLancamento`. Mesmo corpo. Se tiver `venda_id`, aplicar **só** status, forma e data. 404 · 422. 200. |
| `PATCH /api/lancamentos/{id}/quitar` | admin, gerente | `store.quitarLancamento`. Corpo `{forma}`. status = pago; `pago_em` = hoje se vencido, senão o vencimento (mesmo resultado visível de hoje). 404 · 422 `campos.forma`. 200. |
| `DELETE /api/lancamentos/{id}` | admin, gerente | `store.excluirLancamento`. 404 "Lançamento não encontrado." · 409 "Este lançamento foi gerado por uma venda. Para removê-lo, a venda precisaria ser cancelada." (`venda_id ≠ null`). 204. |
| `GET /api/financeiro/resumo?de=&ate=` | admin, gerente | `store.resumoFinanceiro`. `{entradas, saidas, saldo, a_receber, a_pagar, atrasados, pendentes, previsto_entradas, previsto_saidas}`. entradas/saidas = soma dos **pagos** do período por tipo; saldo = entradas − saidas; a_receber/a_pagar = soma de **todos** os pendentes (ignora período); atrasados = qtd de pendentes com vencimento < hoje (ignora período); pendentes = qtd de todos os pendentes; previsto_* = soma do período pagos ou não. Assimetria proposital. |
| `GET /api/financeiro/fluxo-mensal` | admin, gerente | `store.fluxoPorMes`. Últimos 6 meses até o atual, mês sem movimento incluído (`generate_series`), só pagos. Item `{mes: "2026-09", rotulo: "set", entradas, saidas, saldo, acumulado}`; acumulado = soma corrida a partir do primeiro dos 6 meses. |
| `GET /api/financeiro/saidas-por-categoria?de=&ate=` | admin, gerente | `store.saidasPorCategoria`. Só saídas pagas do período, somadas por categoria, valor desc. Item `{categoria, valor}`. |

Seed de dev: portar `seedFinanceiro` do `store.ts`.

### C2. Comissões
Card: `[BACK] Módulo Comissões`. Depende de C1. Origem: `store.ts:1667-1697`.

- `GET /api/comissoes?de=&ate=` (admin, gerente): lançamentos de categoria `comissao` do
  período agrupados por vendedor. Item `{vendedor, vendas, faturamento, gerada, paga, pendente, itens}`;
  `vendas` = qtd de lançamentos; `faturamento` = soma do `valor_venda` das vendas ligadas;
  `gerada` = soma de todos; `paga`/`pendente` por status; `itens` no formato do GET de
  lançamentos. Ordem: `gerada` desc.
- `POST /api/comissoes/pagar` (admin, gerente): corpo `{vendedor, forma}`; numa transação,
  todos os lançamentos comissão pendentes do vendedor viram pagos com a forma e `pago_em` = hoje.
  200 `{total_pago}` (0 se nada pendente).
- Regra de geração (aplicada em D1): comissão = `valor_venda × comissao% do vendedor`,
  `setScale(2, HALF_UP)`, vencimento no último dia do mês da venda.

### C3. Financiamentos
Card: `[BACK] Módulo Financiamentos`. Origem: `store.ts:1703-1885`, `financiamento-sheet.tsx`, `simulador-dialog.tsx`, `lib/financeiro.ts`.

Migration `V8__financiamentos.sql`: campos do tipo `Financiamento` (`store.ts:138`) com
`vendedor_id` nulo, `status` CHECK em (`em_analise, aprovado, ativo, quitado, cancelado`),
`parcelas_pagas` contador.

| Rota | Quem | Comportamento |
|---|---|---|
| `GET /api/financiamentos` | todos, *filtra vendedor* | `store.financiamentos()`: `inicio` desc, id desc. Item `{id, cliente_id, veiculo_id, vendedor, banco, valor_veiculo, entrada, valor_financiado, parcelas, taxa_mensal, valor_parcela, valor_total_financiamento, inicio, parcelas_pagas, status}`. |
| `POST /api/financiamentos` | todos, *força vendedor* | `store.criarFinanciamento`. Corpo `{cliente_id, veiculo_id, vendedor (ou null), banco, valor_veiculo, entrada, valor_financiado, parcelas, taxa_mensal, inicio, status}`; status inicial `em_analise|aprovado|ativo`. O servidor calcula `valor_parcela = parcelaPrice(valor_financiado, taxa_mensal, parcelas)` (Tabela Price; taxa 0 → principal/n) com 2 casas e `valor_total_financiamento = valor_parcela × parcelas`; `parcelas_pagas = 0`. 422: "Informe um valor de veículo válido." · "A entrada deve ser menor que o valor do veículo." · "O valor financiado deve ser maior que zero." · "O valor financiado deve corresponder ao valor do veículo menos a entrada." (tolerância 0,01) · "Selecione uma quantidade de parcelas válida." (12, 24, 36, 48, 60, 72) · "A taxa mensal não pode ser negativa." · 409 "Este veículo já possui um financiamento ativo." (existe do veículo com status ≠ cancelado) · 404 cliente/veículo. 201. |
| `PATCH /api/financiamentos/{id}/parcela` | admin, gerente | `store.registrarParcelaPaga`: +1 em `parcelas_pagas`; ao chegar ao total, status `quitado`, senão `ativo`. Cancelado/quitado/completo → 409. 200. |
| `PATCH /api/financiamentos/{id}/status` | admin, gerente | **novo na tela** (`store.atualizarStatusFinanciamento`). Corpo `{status}` ∈ `em_analise|aprovado|ativo|cancelado`; `quitado` só pela última parcela → 422. Quitado/cancelado não muda mais → 409 "Este contrato não pode mais mudar de status.". 200. |
| `POST /api/financiamentos/simular` | todos | **novo**. Não grava. Corpo `{valor_veiculo, entrada, parcelas, taxa_mensal}`, mesmas validações do POST. Resposta `{valor_financiado, valor_parcela, total, juros, cet_anual, amortizacao: [{parcela, juros, amortizacao, saldo}]}` (5 primeiras linhas), fórmulas de `lib/financeiro.ts` e docs/03 (CET ≈ (1+i)^12 − 1). |

Seed de dev: contratos do `store.ts`.

### C4. Consórcios
Card: `[BACK] Módulo Consórcios`. Origem: `store.ts:1891-2040`, `consorcio-sheet.tsx`, `GRUPOS_CONSORCIO` (`store.ts:207`), `calcularPlanoConsorcio` (`store.ts:250`).

Migrations `V9__consorcios.sql`: tabela `consorcio_grupos` (seed dos 5 grupos abaixo) e
`consorcios` com os campos do tipo `Consorcio` (`store.ts:177`), `vendedor_id`, `status`
CHECK (`em_analise, ativo, contemplado, cancelado, encerrado`), `tipo_lance` CHECK (`sem_lance, livre, fixo`).

Grupos: GRP-2026-01 até 80 mil (16 %, 2 %, 0 %) · GRP-2026-02 até 120 mil (17 %, 2 %, 0 %) ·
GRP-2026-03 até 160 mil (18 %, 2 %, 0 %) · GRP-2026-04 até 220 mil (19 %, 2 %, 0 %) ·
GRP-2026-05 Premium até 400 mil (20 %, 2 %, 0 %) — (taxa administrativa, fundo de reserva, seguro).

| Rota | Quem | Comportamento |
|---|---|---|
| `GET /api/consorcios/grupos` | todos | Item `{codigo, descricao, limite_carta, taxa_administracao, fundo_reserva, seguro}`. |
| `GET /api/consorcios` | todos, *filtra vendedor* | `store.consorcios()`: `data_adesao` desc, id desc. Item `{id, numero_cota, cliente_id, vendedor, administradora, grupo, valor_carta, taxa_administracao, fundo_reserva, seguro, valor_total_plano, parcelas, valor_parcela, data_adesao, status, tipo_lance, valor_lance, veiculo_id}`. |
| `POST /api/consorcios` | todos, *força vendedor* | `store.criarConsorcio` + `consorcio-sheet.tsx:188`. Corpo `{cliente_id, vendedor, administradora, grupo, valor_carta, parcelas, data_adesao, status, tipo_lance, valor_lance}`; status inicial `em_analise|ativo|contemplado`; parcelas ∈ {36, 48, 60, 72, 80, 100, 120}. Servidor: taxas do grupo; `valor_total_plano = carta + carta×taxa% + carta×fundo% + carta×seguro%`; `valor_parcela = total / parcelas` (2 casas); `numero_cota` 5 dígitos aleatório e único; `valor_lance = null` se `sem_lance`; `veiculo_id = null`. 422: "Selecione um cliente." · "Selecione um vendedor." · "Informe a administradora." · "Selecione um grupo de consórcio." · "Informe o valor da carta." · "O valor da carta ultrapassa o limite deste grupo." · "Informe a quantidade de parcelas." · "Informe a data de adesão." · "Informe o valor do lance.". 201. |
| `PUT /api/consorcios/{id}` | todos, *força vendedor* | **novo na tela** (`store.atualizarConsorcio`). Corpo e validações do POST; status passa a aceitar também `cancelado` (é assim que a cota vira `contemplado`). Recalcula taxas/total/parcela; `numero_cota` não muda. Encerrada → 409 "Consórcios encerrados não podem ser alterados.". 404 · 422. 200. |
| `DELETE /api/consorcios/{id}` | admin, gerente | **novo na tela** (`store.excluirConsorcio`). 404 "Consórcio não encontrado." · 409 "Consórcios contemplados ou encerrados não podem ser excluídos.". 204. |

Seed de dev: cotas do `store.ts`.

---

## Bloco D — venda completa e relatórios

### D1. `POST /api/vendas` completo
Card: `[BACK] POST /api/vendas completo: cliente embutido, pagamento, caixa e comissão`. Depende de B1, B4, C1, C3, C4. Origem: `store.ts:919-1339`.

**`POST /api/vendas`** (todos, *força vendedor*). Corpo:
`{veiculo_id, cliente_id OU cliente: {nome, cpf, telefone, email}, vendedor, valor_venda, data_venda, forma_pagamento, financiamento_id, consorcio_id}`,
`forma_pagamento ∈ avista|financiamento|consorcio`. Cliente embutido: mesmas validações do
`POST /api/clientes`, criado na mesma transação.

Regras e mensagens (na ordem do `store.registrarVenda`):
- 404 "Veículo não encontrado." · 409 "Este veículo já foi vendido."
- 422 "Selecione um vendedor ativo cadastrado." (funcionário cargo vendedor, status ativo)
- `valor_venda > 0`; `data_venda` não futura.
- **Desconto** (limite em `configuracoes.comercial.limite_desconto`, 10 no seed):
  `desconto = (preco − valor_venda) / preco`. Se desconto > 0 e forma ≠ avista → 422
  `campos.valor_venda` "Desconto só é permitido em vendas à vista.". Se desconto > limite →
  422 `campos.valor_venda` "O desconto máximo permitido é de {limite}%.". Venda acima da tabela continua livre.
- À vista: "Venda à vista não deve possuir financiamento ou consórcio vinculado."
- Financiamento: "Selecione o financiamento utilizado na venda." · "Financiamento não
  encontrado." · "O financiamento selecionado pertence a outro cliente." · "O financiamento
  selecionado pertence a outro veículo." · "Este financiamento está vinculado a outro
  vendedor." · "O financiamento precisa estar aprovado ou ativo para concluir a venda." ·
  "Uma venda financiada não pode usar consórcio ao mesmo tempo."
- Consórcio: "Selecione a cota de consórcio utilizada na venda." · "Consórcio não
  encontrado." · "A cota selecionada pertence a outro cliente." · "Somente uma cota
  contemplada pode ser utilizada na venda." · "Esta cota já está vinculada a outro
  veículo." · "O valor da carta de crédito é menor que o valor desta venda." · "Uma venda
  por consórcio não pode usar financiamento ao mesmo tempo."

O que gravar, **tudo numa única `@Transactional`** (`store.ts:1026-1105`):
1. a venda (com `vendedor_id`, `forma_pagamento`, `financiamento_id`, `consorcio_id`);
2. `veiculo.status = vendido`;
3. se financiamento: `vendedor` do contrato = vendedor da venda quando vazio; status `ativo`;
4. se consórcio: `veiculo_id` da cota = veículo da venda; status `encerrado`;
5. lançamento **entrada**: categoria `venda`, descrição `"Venda {marca} {modelo}"`, valor =
   `valor_venda`, data = `data_venda`, status `pago`, forma = `financiamento|consorcio|pix`
   (à vista = pix), `venda_id`, `veiculo_id`, vendedor nulo;
6. lançamento **saída**: categoria `comissao`, descrição `"Comissão {vendedor} · {marca} {modelo}"`,
   valor = `valor_venda × comissao% do vendedor` (2 casas, HALF_UP), vencimento = último dia
   do mês da venda, status `pendente`, forma nula, `venda_id`, `veiculo_id`, `vendedor_id`.

Resposta **201 `{ venda, indicadores }`** (venda no formato do `GET /api/vendas/{id}`,
indicadores no formato do `GET /api/indicadores`).

**`POST /api/vendas/com-financiamento`** (todos, *força vendedor*) — `store.registrarVendaComNovoFinanciamento`.
Corpo `{veiculo_id, cliente_id OU cliente, vendedor, valor_venda, data_venda, financiamento: {banco, valor_veiculo, entrada, parcelas, taxa_mensal, inicio}}`.
Regras extras: "Cliente não encontrado." · "O valor da venda deve ser maior que zero." ·
"Selecione o banco do financiamento." · "Informe um valor de veículo válido." · "O valor do
veículo no financiamento deve ser igual ao valor negociado na venda." (tolerância 0,01) · "A
entrada deve ser menor que o valor do veículo." · "Selecione uma quantidade de parcelas
válida." · "A taxa mensal não pode ser negativa." · "Informe a data da primeira parcela." ·
409 "Este veículo já possui um financiamento ativo.". Cria o financiamento (status `ativo`,
parcela pela Price) e a venda com `forma_pagamento = financiamento`; depois grava igual ao
POST acima. 201 `{ venda, indicadores }`.

**`GET /api/vendas?de=&ate=` e `GET /api/vendas/{id}`** (todos, *filtra vendedor*) — já
existem; ajustar: item `{id, data_venda, vendedor, valor_venda, forma_pagamento, financiamento_id, consorcio_id, diferenca, veiculo: {id, marca, modelo, ano, placa, preco}, cliente: {id, nome}}`;
**`diferenca = valor_venda − preco`** (inverter o sinal atual: negativo = desconto). O
`GET /{id}` traz também `financiamento` e `consorcio` (objeto completo ou `null`).

Migration: `vendas` ganha `forma_pagamento` (CHECK), `financiamento_id`, `consorcio_id`.
Testes: caminho completo de cada forma de pagamento e rollback (falha no lançamento não pode deixar veículo vendido).

### D2. Relatórios
Card: `[BACK] Relatórios`. Depende de B1 e D1. Origem: `relatorios-page.tsx:150-330`.

`GET /api/relatorios?de=&ate=` (admin, gerente). Filtra vendas por `data_venda` (sem
parâmetros = tudo). Resposta:
`{vendas, faturamento, ticket_medio, veiculos_em_estoque, valor_estoque, ranking: [{nome, quantidade, total, comissao}], por_pagamento: [{forma, quantidade}]}`.
`ticket_medio = faturamento / vendas` (0 sem venda); estoque = status ≠ vendido, sem
período; `ranking` com **todos** os funcionários cargo vendedor (inclusive 0 vendas), `total`
desc, `comissao` = % cadastrado; `por_pagamento` sempre com as 3 formas (`avista`,
`financiamento`, `consorcio`). Uma consulta agregada por bloco, sem N+1.

---

## Bloco E — infra (em paralelo, quando sobrar folga)

### E1. Spring Boot servindo o front
Card: `[BACK] Spring Boot servindo o build do front (monólito)`. `frontend-maven-plugin` no
`pom.xml` rodando `npm ci` e `npm run build` e copiando `frontend/dist` para
`src/main/resources/static`; perfil Maven para pular o build do front no dia a dia. **Sem
fallback de rota** (o front usa hash routing) e **sem CORS** (mesma origem). Teste de fumaça:
`java -jar` sobe app e API na 8080.

### E2. Perfil de produção
Card: `[BACK] Perfil de produção, segredos e observabilidade`. `application-prod.yml` com
datasource por variável de ambiente sem valor padrão; Flyway `validate-on-migrate` e
`clean-disabled`; Swagger desligado; actuator só `health` sem detalhe para anônimo; log sem
stack trace de erro de cliente; política de backup definida.

### E3. Docker
Card: `[BACK] Imagem Docker e compose de produção`. `Dockerfile` multi-stage (build front,
build jar, imagem final só JRE 21, usuário não-root); `compose.prod.yaml` com app + Postgres,
volume nomeado, healthcheck, `depends_on: service_healthy`, variáveis por `.env`. Pronto
quando `docker compose -f compose.prod.yaml up -d` sobe tudo numa máquina limpa.

---

## Zonas de conflito e pontos de conversa com o front

Onde back e front mexem no mesmo contrato e precisam combinar **antes** de codar:

| Assunto | Referência | Regra |
|---|---|---|
| Nome dos campos de cada DTO novo | Este plano | Se precisar mudar um nome, status ou mensagem em relação ao que está aqui, avisar o front no card do Trello **antes** de mesclar e atualizar `docs/04-contrato-de-api.md` no mesmo PR |
| Envelope `{ venda, indicadores }` e `GET /api/vendas/{id}` com `financiamento`/`consorcio` | Decisão do P.O. | Nunca devolver a venda "solta" |
| Cookie de sessão e CSRF | B3 | Avisar o front o nome do cookie (`XSRF-TOKEN`) e do header (`X-XSRF-TOKEN`); o front implementa em `client.ts` |
| Valores de `combustivel`, `cambio`, cargos, status | Listas do `store.ts` (`:11-23`, `:53`, `:131`, `:165`) | Copiar exatamente; qualquer valor diferente vira 422 na tela |
| Vendedor: nome na API, id no banco | Convenções | O front nunca vai enviar id |
| Seed de dev (usuários de teste) | B2 | Mesmos e-mails e senha que o front usa hoje |
| Limite de desconto | B4 + D1 | O front lê `GET /api/configuracoes`; o back valida no POST com o mesmo campo |

Arquivos que os dois lados **não editam ao mesmo tempo**: `docs/04-contrato-de-api.md`
(quem muda a rota atualiza) e `README.md` (só o card de docs). O back não toca em
`frontend/src/`; em `frontend/` só entra o `frontend-maven-plugin` (E1).

**Quando falar com o front (antes de codar):**
1. Antes de mesclar uma etapa, conferir se o `tipos.ts` do front já tem os mesmos nomes; se
   não, combinar no card.
2. O front reportou um `ApiError` inesperado numa tela → olhar juntos o status e o log do
   Spring antes de mudar contrato.
3. Descobriu uma regra do `store.ts` que este plano não cobre → registrar no card do back e
   implementar igual ao store; não inventar comportamento.
4. E1 (Spring servindo o front) muda o `pom.xml` e o fluxo de build → avisar o front antes,
   porque o `npm run build` passa a rodar dentro do Maven.

## Ordem de entrega e o que destrava no front

| Dia | Entregar | Destrava no front |
|---|---|---|
| 1 | A1–A5 + A9 (testes junto) | Piloto Estoque |
| 1–2 | A6, A7, A8 | Estoque completo, Clientes, Visão geral |
| 2 | B1, B2 | Funcionários |
| 2–3 | B3, B4 | Login, Configurações |
| 3 | C1, C2, C3, C4 | Gestão Financeira, Comissões, Financiamentos, Consórcios |
| 4 | D1, D2 | Vendas, Relatórios → apagar o `store.ts` |
| paralelo | E1, E2, E3 | Apresentação |

Ponto de controle: no fim do dia 2, Bloco A e B1–B2 precisam estar na `main`; senão, replanejar.
