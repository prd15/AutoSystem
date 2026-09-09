# AutoSystem — Escopo da Primeira Entrega

## Contexto

Sistema de gestão para concessionárias de veículos. Aplicação **monolítica** (front-end e back-end no mesmo projeto e repositório). Projeto acadêmico desenvolvido por equipe de 6 pessoas seguindo Scrum.

**Problema que resolve:** concessionárias de pequeno porte controlam estoque e vendas em planilhas ou no papel, sem visibilidade de quantos veículos estão disponíveis, quais já foram vendidos e qual o valor imobilizado em estoque.

**Escopo desta entrega:** duas telas principais — controle de estoque e visão gerencial — com CRUD completo de veículos.

---

## Fora do escopo (não implementar)

- Autenticação e login
- Controle de permissão por perfil de usuário
- Site institucional em WordPress
- Upload de imagens dos veículos
- Geração de PDF ou relatórios exportáveis
- Integração com sistemas externos

---

## Modelo de dados

### Tabela `veiculos`

| Campo | Tipo | Regras |
|---|---|---|
| `id` | int | PK, auto-incremento |
| `marca` | string(50) | obrigatório |
| `modelo` | string(50) | obrigatório |
| `ano` | int | obrigatório, entre 1950 e ano atual + 1 |
| `cor` | string(30) | obrigatório |
| `quilometragem` | int | obrigatório, >= 0 |
| `preco` | decimal(10,2) | obrigatório, > 0 |
| `placa` | string(8) | opcional, única quando preenchida |
| `status` | enum | `disponivel`, `reservado`, `vendido` — padrão `disponivel` |
| `criado_em` | timestamp | automático |
| `atualizado_em` | timestamp | automático |

### Tabela `clientes`

| Campo | Tipo | Regras |
|---|---|---|
| `id` | int | PK, auto-incremento |
| `nome` | string(100) | obrigatório |
| `cpf` | string(14) | obrigatório, único |
| `telefone` | string(20) | obrigatório |
| `email` | string(100) | opcional, formato válido |
| `criado_em` | timestamp | automático |

### Tabela `vendas`

| Campo | Tipo | Regras |
|---|---|---|
| `id` | int | PK, auto-incremento |
| `veiculo_id` | int | FK → veiculos, obrigatório |
| `cliente_id` | int | FK → clientes, obrigatório |
| `vendedor` | string(100) | obrigatório (texto livre nesta entrega) |
| `valor_venda` | decimal(10,2) | obrigatório, > 0 |
| `data_venda` | date | obrigatório, padrão data atual |
| `criado_em` | timestamp | automático |

---

## Regras de negócio

1. Ao registrar uma venda, o veículo vinculado muda automaticamente para status `vendido`.
2. Não é possível registrar venda de veículo que já esteja com status `vendido`.
3. Não é possível excluir um veículo que possua venda registrada.
4. O `valor_venda` pode ser diferente do `preco` cadastrado (negociação).
5. Veículos com status `vendido` não aparecem na contagem de estoque disponível.

---

## Tela 1 — Estoque

### Listagem de veículos

- Exibe todos os veículos cadastrados em tabela ou grid
- Colunas visíveis: marca, modelo, ano, cor, quilometragem, preço, status
- Status exibido como indicador visual colorido (verde = disponível, amarelo = reservado, cinza = vendido)
- Ações por linha: editar e excluir
- Botão destacado para cadastrar novo veículo

### Filtros e busca

- Campo de busca por texto que procura em marca e modelo
- Filtro por status (todos, disponível, reservado, vendido)
- Filtro por marca (lista das marcas cadastradas)
- Filtro por faixa de preço (valor mínimo e máximo)
- Os filtros podem ser combinados

### Cadastro de veículo

- Formulário com todos os campos da tabela `veiculos` (exceto `id` e timestamps)
- Campos obrigatórios validados antes do envio, com mensagem de erro por campo
- Status inicial padrão: `disponivel`
- Após salvar, retorna à listagem com o novo veículo visível e mensagem de sucesso

### Edição de veículo

- Mesmo formulário do cadastro, com os dados preenchidos
- Permite alterar qualquer campo, inclusive o status
- Após salvar, mensagem de sucesso e dados atualizados na listagem

### Exclusão de veículo

- Modal de confirmação exibindo marca e modelo do veículo
- Bloqueia a exclusão caso o veículo tenha venda registrada, com mensagem explicativa
- Após excluir, mensagem de sucesso e veículo removido da listagem

---

## Tela 2 — Gerencial

### Indicadores (cards no topo)

| Indicador | Cálculo |
|---|---|
| Veículos em estoque | contagem de veículos com status `disponivel` ou `reservado` |
| Valor total em estoque | soma do `preco` dos veículos disponíveis e reservados |
| Vendas no mês | contagem de vendas com `data_venda` no mês corrente |
| Faturamento do mês | soma do `valor_venda` das vendas do mês corrente |

### Registro de venda

- Formulário com: seleção de veículo (apenas os não vendidos), seleção ou cadastro rápido de cliente, nome do vendedor, valor da venda e data
- Ao salvar, aplica a regra de mudança automática de status do veículo
- Mensagem de sucesso e atualização dos indicadores

### Histórico de vendas

- Tabela com as vendas registradas, ordenadas da mais recente para a mais antiga
- Colunas: data, veículo (marca e modelo), cliente, vendedor, valor da venda
- Filtro por período (data inicial e final)

---

## Endpoints da API

### Veículos

```
GET    /api/veiculos              lista veículos, aceita query params de filtro
GET    /api/veiculos/{id}         retorna um veículo
POST   /api/veiculos              cria veículo — 201 em sucesso, 400 em validação
PUT    /api/veiculos/{id}         atualiza veículo — 200 em sucesso, 404 se não existir
DELETE /api/veiculos/{id}         remove veículo — 204 em sucesso, 409 se houver venda
```

Query params aceitos em `GET /api/veiculos`: `busca`, `status`, `marca`, `preco_min`, `preco_max`

### Clientes

```
GET    /api/clientes              lista clientes
POST   /api/clientes              cria cliente
```

### Vendas

```
GET    /api/vendas                lista vendas, aceita data_inicio e data_fim
POST   /api/vendas                registra venda e atualiza status do veículo
```

### Indicadores

```
GET    /api/indicadores           retorna os quatro indicadores da tela gerencial
```

---

## Requisitos não funcionais

- Interface em português do Brasil
- Valores monetários formatados em real (R$ 1.234,56)
- Datas no formato brasileiro (dd/mm/aaaa)
- Layout responsivo, funcional em desktop e tablet
- Mensagens de erro claras e em linguagem natural, nunca códigos técnicos expostos ao usuário
- Banco de dados com dados de exemplo (seed) para demonstração: ao menos 10 veículos e 3 vendas

---

## Critérios de aceite da entrega

- [ ] É possível cadastrar, listar, editar e excluir veículos
- [ ] Validações impedem o cadastro com campos obrigatórios vazios ou inválidos
- [ ] Filtros e busca retornam os resultados corretos, inclusive combinados
- [ ] Status do veículo é exibido visualmente na listagem
- [ ] É possível registrar uma venda e o veículo passa automaticamente a `vendido`
- [ ] Veículo com venda registrada não pode ser excluído
- [ ] Os quatro indicadores da tela gerencial exibem valores corretos
- [ ] Histórico de vendas lista as vendas com filtro por período
- [ ] Aplicação roda localmente seguindo as instruções do README
