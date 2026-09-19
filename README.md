# AutoSystem

Sistema web de gestão para concessionárias de veículos, desenvolvido para centralizar operações comerciais, estoque, clientes, equipe, consórcios, financiamentos, gestão financeira e relatórios em uma única aplicação.

O projeto está atualmente com o **front-end funcional**, utilizando dados em memória para simular as operações do sistema. A arquitetura foi preparada para futura integração com uma API em **Java + Spring Boot + PostgreSQL**.

## Funcionalidades implementadas

### Visão Geral

Dashboard gerencial com indicadores da concessionária, incluindo:

- veículos disponíveis e reservados;

- valor do estoque;

- vendas e faturamento;

- ticket médio;

- evolução do faturamento;

- distribuição do estoque;

- últimas vendas;

- indicadores adaptados ao perfil do usuário.

Vendedores visualizam seus próprios resultados comerciais, enquanto gerentes e administradores possuem visão global da operação.

### Estoque

Gerenciamento dos veículos da concessionária:

- cadastro de veículos;

- edição;

- exclusão;

- visualização de detalhes;

- pesquisa e filtros;

- ordenação;

- visualização em tabela e quadro;

- controle de status;

- integração com vendas.

Vendedores possuem acesso somente para consulta e registro de vendas, enquanto alterações no estoque são restritas aos perfis autorizados.

### Vendas

Registro e acompanhamento das vendas realizadas:

- venda à vista;

- venda por financiamento;

- venda por consórcio;

- seleção de cliente, veículo e vendedor;

- cálculo de comissão;

- controle de descontos;

- histórico de vendas;

- filtros por período;

- visualização detalhada da venda;

- integração automática com estoque e gestão financeira.

O sistema impede que vendedores registrem operações em nome de outro vendedor.

### Clientes

Cadastro e consulta de clientes utilizados nas operações comerciais.

Inclui:

- cadastro de cliente;

- pesquisa;

- CPF formatado;

- telefone formatado;

- cadastro rápido durante vendas, consórcios e financiamentos.

### Funcionários

Gerenciamento da equipe da concessionária:

- cadastro de funcionários;

- cargo;

- status;

- data de admissão;

- percentual individual de comissão;

- criação opcional de acesso ao AutoSystem;

- definição do perfil de acesso.

O sistema diferencia o cargo do funcionário do perfil de autorização utilizado na aplicação.

### Consórcios

Gerenciamento de propostas e cotas de consórcio:

- cliente;

- vendedor responsável;

- administradora;

- grupo;

- carta de crédito;

- taxas administrativas;

- fundo de reserva;

- quantidade de parcelas;

- valor das parcelas;

- lance;

- status da cota;

- contemplação;

- vínculo com veículo;

- visualização detalhada.

Os custos do plano são calculados a partir da carta de crédito, taxas e prazo configurados.

### Financiamentos

Gerenciamento e simulação de financiamentos:

- cliente;

- veículo;

- vendedor responsável;

- banco;

- valor do veículo;

- entrada;

- valor financiado;

- taxa mensal;

- quantidade de parcelas;

- cálculo de prestação;

- custo total;

- parcelas pagas;

- saldo restante;

- status do contrato.

As simulações utilizam o sistema de amortização da **Tabela Price**.

### Gestão Financeira

Área financeira integrada às operações do sistema.

Possui quatro áreas:

- Fluxo de caixa;

- Comissões;

- Financiamentos;

- Consórcios.

O fluxo de caixa permite:

- entradas e saídas;

- lançamentos manuais;

- categorias financeiras;

- contas pagas e pendentes;

- filtros por período;

- acompanhamento do saldo;

- visualização de despesas por categoria.

As vendas geram reflexos financeiros automaticamente conforme a forma de pagamento utilizada.

### Comissões

As comissões são vinculadas ao percentual configurado individualmente no cadastro de cada vendedor.

A área financeira permite acompanhar:

- comissão gerada;

- comissão paga;

- valores pendentes;

- desempenho por vendedor.

### Relatórios

Área consolidada para análise da operação:

- faturamento;

- ticket médio;

- estoque disponível;

- forma de pagamento mais utilizada;

- ranking de vendedores;

- distribuição das formas de pagamento;

- filtros por período.

### Configurações

Configurações do AutoSystem divididas conforme o nível de acesso.

Administrador:

- dados da concessionária;

- preferências comerciais;

- parâmetros financeiros;

- conta pessoal;

- alteração de senha;

- tema da interface.

Gerentes e vendedores possuem acesso apenas às configurações permitidas para seus perfis.

### Autenticação e autorização

O AutoSystem possui sistema de login com três perfis:

- **Administrador**

- **Gerente**

- **Vendedor**

Cada perfil possui permissões específicas de telas, dados e ações.

O sistema também possui:

- sessão do usuário;

- logout;

- alteração de dados da própria conta;

- alteração de senha;

- proteção de rotas;

- menus adaptados ao perfil;

- restrições de ações;

- visualização de dados conforme o vendedor autenticado.

> Atualmente a autenticação é executada no front-end e utiliza armazenamento local do navegador. Essa implementação é adequada para o protótipo acadêmico, mas deverá ser substituída por autenticação segura no back-end, com senhas armazenadas por hash.

## Tecnologias

### Front-end

- React 19

- TypeScript

- Vite

- Tailwind CSS v4

- shadcn/ui

- Radix UI

- Lucide React

- Recharts

- Sonner

### Back-end planejado

- Java

- Spring Boot

- PostgreSQL

O back-end ainda será implementado. Atualmente os dados utilizados pela aplicação são mantidos em memória no front-end.

## Estrutura

```text

AutoSystem/

├── frontend/    SPA em React + TypeScript + Vite

├── backend/     API Java + Spring Boot + PostgreSQL (planejada)

├── docs/        documentação técnica e decisões do projeto

├── README.md

└── CONTRIBUTING.md

```

## Rodar em desenvolvimento

### Pré-requisitos

Para executar o front-end:

- Node.js 24

- npm

Para o back-end futuro:

- JDK 21

- PostgreSQL

### Front-end

```bash

cd frontend

npm install

npm run dev

```

O servidor de desenvolvimento utiliza a porta:

```text

http://localhost:5174

```

A navegação utiliza hash routing, por exemplo:

```text

#/visao-geral

#/estoque

#/vendas

#/clientes

#/funcionarios

#/consorcios

#/financiamentos

#/financeiro

#/relatorios

#/configuracoes

```

## Usuários de teste

O ambiente de desenvolvimento possui usuários iniciais para validação dos diferentes perfis de acesso.

Perfil

E-mail

Senha

Administrador

admin@autosystem.com.br

123456

Gerente

gerente@autosystem.com.br

123456

Os funcionários ativos cadastrados no seed também podem gerar usuários de acesso conforme o cargo e as regras de autenticação do front-end.

### Atualização dos usuários locais

Caso o navegador já possua dados de uma versão anterior do AutoSystem, pode ser necessário limpar os usuários armazenados no localStorage para que o seed atualizado seja carregado.

No Console do navegador:

localStorage.removeItem("autosystem.usuarios")

localStorage.removeItem("autosystem.sessao")

location.reload()

Essa limpeza é necessária apenas no ambiente de desenvolvimento quando houver dados antigos armazenados no navegador. Depois que o novo seed for carregado, não é necessário repetir o procedimento em cada acesso.

## Dados durante o desenvolvimento

Nesta etapa do projeto, os dados são controlados pelo front-end.

Isso permite testar os fluxos do sistema antes da implementação definitiva da API.

Algumas informações podem ser reinicializadas ao recarregar ou reiniciar o ambiente de desenvolvimento.

A persistência definitiva será implementada posteriormente utilizando Spring Boot e PostgreSQL.

## Build de produção

```bash

cd frontend

npm run build

```

O build gera:

```text

frontend/dist/

```

Na arquitetura planejada, o Spring Boot poderá servir os arquivos estáticos do front-end e disponibilizar a API através de `/api`.

## Integração futura com o back-end

O Vite está preparado para encaminhar requisições `/api` para:

```text

http://localhost:8080

```

A arquitetura prevista utiliza:

```text

React

   ↓

/api

   ↓

Spring Boot

   ↓

PostgreSQL

```

O contrato inicial da API está documentado em:

`docs/04-contrato-de-api.md`

Esse contrato poderá evoluir conforme os novos módulos implementados no front-end forem incorporados ao back-end.

## Formatação de dados

O projeto possui funções centralizadas para padronização e máscaras de dados, incluindo:

- CPF;

- telefone;

- valores monetários;

- datas;

- percentuais.

Para integração futura com a API:

- valores monetários deverão utilizar representação decimal adequada;

- datas deverão utilizar formato padronizado;

- validações críticas também deverão existir no back-end.

## Perfis de acesso

| Recurso | Administrador | Gerente | Vendedor |

|---|:---:|:---:|:---:|

| Visão Geral | ✓ | ✓ | ✓ |

| Estoque | Completo | Completo | Consulta |

| Vendas | Todas | Todas | Próprias |

| Clientes | ✓ | ✓ | ✓ |

| Funcionários | Completo | Limitado | — |

| Consórcios | Todos | Todos | Próprios |

| Financiamentos | Todos | Todos | Próprios |

| Gestão Financeira | ✓ | ✓ | — |

| Relatórios | ✓ | ✓ | — |

| Configurações administrativas | ✓ | — | — |

| Minha conta | ✓ | ✓ | ✓ |

## Documentação

| Documento | Conteúdo |

|---|---|

| `docs/01-inventario-funcional.md` | Inventário funcional do sistema |

| `docs/02-modelo-de-dados.md` | Modelo de dados planejado |

| `docs/03-regras-e-calculos.md` | Regras de negócio e cálculos |

| `docs/04-contrato-de-api.md` | Contrato planejado entre front-end e back-end |

| `docs/05-requisitos-nao-funcionais.md` | Requisitos não funcionais do projeto |

| `docs/06-stack-e-arquitetura.md` | Stack tecnológica e arquitetura |

| `docs/07-decisoes-arquiteturais.md` | Decisões arquiteturais |

| `docs/08-decisao-stack-back-end.md` | Decisão da stack utilizada no back-end |

| `docs/09-modelo-conceitual-mer.md` | Modelo conceitual e MER |

| `docs/10-evolucao-funcional-frontend.md` | Evolução funcional implementada no front-end |

| docs/11-auditoria-2026-09-17.md | Auditoria de 17/09/2026: achados, evidências e como reproduzir |
| docs/12-plano-implementacao-backend.md | Plano de implementação do back-end para a sprint de 18/09/2026 |
| docs/13-plano-implementacao-frontend.md | Plano de implementação do front-end para a sprint de 18/09/2026 |*

| `docs/autosystem-escopo-primeira-entrega.md` | Escopo original da primeira entrega |

| `frontend/README.md` | Informações específicas do front-end |

| `CONTRIBUTING.md` | Fluxo de contribuição e padrões do repositório |

## Estado atual do projeto

O AutoSystem possui atualmente um protótipo funcional de front-end cobrindo os principais fluxos de uma concessionária.

A próxima etapa técnica prevista é a implementação do back-end e da persistência dos dados.

Antes disso, o front-end passará por uma etapa de evolução da identidade visual e experiência de uso, mantendo as regras e funcionalidades já implementadas.