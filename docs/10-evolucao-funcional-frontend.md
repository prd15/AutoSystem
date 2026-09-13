# Evolução Funcional do Front-end — AutoSystem

Este documento registra a evolução funcional realizada no front-end do AutoSystem após a estruturação inicial do projeto.

A etapa teve como objetivo transformar o protótipo inicial em uma aplicação mais completa para gerenciamento de concessionárias, mantendo a arquitetura React + TypeScript existente e preparando os fluxos para futura integração com o back-end.

## 1. Visão Geral

A Visão Geral foi ampliada para apresentar informações gerenciais e comerciais de acordo com o perfil autenticado.

Foram implementados:

- indicadores de estoque;
- quantidade de veículos disponíveis e reservados;
- valor financeiro do estoque;
- vendas realizadas no período;
- faturamento;
- ticket médio;
- gráfico de faturamento;
- distribuição do estoque;
- últimas vendas;
- indicadores específicos para vendedores.

Administradores e gerentes possuem visão global da concessionária.

Vendedores visualizam indicadores relacionados ao próprio desempenho comercial.

---

## 2. Estoque

O módulo de estoque foi ampliado para permitir gerenciamento completo dos veículos.

Foram implementados:

- cadastro de veículos;
- edição de veículos;
- exclusão;
- visualização detalhada;
- controle de status;
- pesquisa;
- filtros;
- ordenação;
- visualização em tabela;
- visualização em quadro;
- integração com o processo de venda.

Também foram adicionadas regras de autorização.

Administradores e gerentes podem gerenciar o estoque.

Vendedores possuem acesso para consulta e utilização dos veículos durante operações comerciais, sem permissão para editar ou excluir registros.

---

## 3. Vendas

O fluxo de vendas foi ampliado para representar diferentes formas de negociação.

Foram implementadas vendas:

- à vista;
- por financiamento;
- por consórcio.

O registro de venda passou a integrar:

- cliente;
- veículo;
- vendedor responsável;
- valor negociado;
- desconto;
- comissão;
- forma de pagamento;
- financiamento vinculado;
- consórcio vinculado.

Também foi criada uma visualização detalhada das vendas registradas.

O sistema atualiza os dados relacionados à operação e gera reflexos na Gestão Financeira.

Vendedores somente podem registrar operações utilizando sua própria identidade comercial.

---

## 4. Clientes

O cadastro de clientes foi integrado aos principais fluxos comerciais.

Foram implementados:

- cadastro de cliente;
- pesquisa;
- formatação de CPF;
- formatação de telefone;
- cadastro rápido durante operações.

O cadastro rápido pode ser utilizado durante:

- vendas;
- consórcios;
- financiamentos.

---

## 5. Funcionários

Foi criado um módulo específico para gerenciamento dos funcionários da concessionária.

O cadastro contempla:

- nome;
- CPF;
- telefone;
- e-mail;
- cargo;
- data de admissão;
- status;
- percentual individual de comissão.

Também foi criada integração entre funcionário e conta de acesso ao AutoSystem.

Durante o cadastro, um funcionário pode receber acesso ao sistema com:

- e-mail de acesso;
- senha inicial;
- perfil de autorização.

Cargo e perfil de acesso são tratados separadamente.

---

## 6. Comissões

O sistema passou a utilizar percentuais individuais de comissão definidos no cadastro dos vendedores.

As vendas geram informações de comissão automaticamente.

A Gestão Financeira permite acompanhar:

- comissão gerada;
- comissão paga;
- comissão pendente;
- faturamento por vendedor;
- desempenho comercial.

---

## 7. Consórcios

Foi desenvolvido um módulo específico para gerenciamento de consórcios.

O cadastro contempla:

- cliente;
- vendedor responsável;
- administradora;
- grupo;
- número da cota;
- carta de crédito;
- taxa administrativa;
- fundo de reserva;
- quantidade de parcelas;
- valor das parcelas;
- lance;
- situação;
- data de adesão;
- veículo vinculado.

O sistema calcula o custo do plano com base nas características cadastradas.

Também foi implementada visualização detalhada da cota.

Consórcios contemplados podem ser vinculados ao fluxo de venda de veículos.

---

## 8. Financiamentos

Foi desenvolvido um módulo para gerenciamento e simulação de financiamentos.

O financiamento contempla:

- cliente;
- veículo;
- vendedor responsável;
- instituição financeira;
- valor do veículo;
- entrada;
- principal financiado;
- taxa mensal;
- prazo;
- valor da parcela;
- custo total;
- parcelas pagas;
- saldo restante;
- situação do contrato.

Os cálculos de prestação utilizam a Tabela Price.

Também foi implementado um simulador de financiamento.

O financiamento pode ser criado diretamente durante uma venda ou previamente no módulo específico.

---

## 9. Gestão Financeira

O módulo financeiro foi ampliado e passou a ser apresentado como **Gestão Financeira**.

A área foi organizada em quatro seções:

1. Fluxo de caixa;
2. Comissões;
3. Financiamentos;
4. Consórcios.

### Fluxo de caixa

Foram implementados:

- entradas;
- saídas;
- categorias;
- situação do lançamento;
- vencimentos;
- formas de pagamento;
- lançamentos vinculados a veículos;
- filtros por período;
- indicadores financeiros;
- gráfico de entradas e saídas;
- distribuição das despesas por categoria.

Também é possível realizar lançamentos financeiros manuais.

### Comissões

Permite acompanhar valores gerados e pendentes por vendedor.

### Financiamentos

Apresenta os contratos ativos, valores financiados, parcelas, saldos e vencimentos.

### Consórcios

Apresenta cartas de crédito, valores dos planos, parcelas e situação das cotas.

---

## 10. Relatórios

Foi criado o módulo de Relatórios.

A tela consolida indicadores como:

- faturamento;
- ticket médio;
- estoque disponível;
- forma de pagamento mais utilizada;
- ranking de vendedores;
- distribuição das formas de pagamento.

Também foram implementados filtros de período:

- este mês;
- últimos 30 dias;
- últimos 90 dias;
- todo o período;
- período personalizado.

---

## 11. Autenticação

Foi implementado um sistema de autenticação para o protótipo do AutoSystem.

Foram adicionados:

- tela de login;
- sessão do usuário;
- logout;
- identificação do usuário autenticado;
- alteração dos dados da própria conta;
- alteração de senha.

Atualmente, essa autenticação é executada no front-end e utiliza armazenamento local do navegador.

Essa solução é destinada somente ao estágio atual do protótipo.

Na implementação do back-end, a autenticação deverá ser migrada para uma solução segura, com validação no servidor e armazenamento de senhas utilizando hash.

---

## 12. Perfis e autorização

Foram definidos três perfis de acesso:

### Administrador

Possui acesso completo ao sistema, incluindo configurações administrativas e gerenciamento de acessos.

### Gerente

Possui acesso às funções operacionais e gerenciais, porém não pode realizar determinadas alterações administrativas sensíveis.

### Vendedor

Possui acesso direcionado à operação comercial.

Entre as restrições estão:

- não acessar Gestão Financeira;
- não acessar gerenciamento de funcionários;
- não acessar relatórios gerenciais;
- não editar ou excluir veículos;
- visualizar somente suas próprias vendas;
- visualizar somente seus próprios consórcios;
- visualizar somente seus próprios financiamentos;
- registrar operações somente em seu próprio nome.

---

## 13. Proteção de rotas

A navegação passou a considerar o perfil do usuário autenticado.

Foram implementados:

- bloqueio de rotas não autorizadas;
- redirecionamento de acessos inválidos;
- menu lateral adaptado ao perfil;
- proteção das ações disponíveis dentro das telas.

A autorização, portanto, não depende apenas da ocultação dos itens do menu.

---

## 14. Visibilidade dos dados por vendedor

Os dados comerciais passaram a respeitar o usuário autenticado.

Quando o perfil é Vendedor, são filtrados:

- vendas;
- faturamento;
- indicadores da Visão Geral;
- consórcios;
- financiamentos.

Gerentes e administradores mantêm visão global da concessionária.

---

## 15. Proteção da autoria das operações comerciais

Foi adicionada uma regra para impedir que um vendedor registre operações em nome de outro funcionário.

A regra foi aplicada em:

- vendas;
- consórcios;
- financiamentos.

Quando um vendedor está autenticado, seu nome é definido automaticamente como responsável pela operação.

Administradores e gerentes continuam podendo selecionar o vendedor responsável.

---

## 16. Configurações

Foi criado o módulo de Configurações.

Para administradores, estão disponíveis parâmetros relacionados a:

- concessionária;
- preferências comerciais;
- financeiro;
- conta pessoal;
- tema.

Gerentes e vendedores visualizam somente configurações compatíveis com suas permissões, como:

- Minha conta;
- tema da interface.

---

## 17. Tema da interface

O sistema permite utilizar:

- tema claro;
- tema escuro;
- tema do sistema operacional.

A preferência é armazenada no navegador.

---

## 18. Padronização e máscaras

Foram centralizadas funções de formatação utilizadas em diferentes módulos.

Entre elas:

- CPF;
- telefone;
- moeda;
- datas;
- percentuais.

Essa padronização reduz duplicação de código e mantém consistência entre os formulários.

---

## 19. Navegação

A navegação principal foi reorganizada.

### Operação

- Visão Geral
- Estoque
- Vendas
- Clientes

### Gestão

- Funcionários
- Consórcios
- Financiamentos
- Gestão Financeira
- Relatórios

### Sistema

- Configurações

Módulos que não faziam mais parte do escopo atual, como Oficina e Test Drive, foram removidos da navegação.

---

## 20. Integração entre módulos

Um dos principais avanços desta etapa foi deixar de tratar as telas como módulos isolados.

Atualmente existem relações entre:

- funcionários e usuários;
- funcionários e comissões;
- vendedores e vendas;
- vendedores e consórcios;
- vendedores e financiamentos;
- clientes e operações comerciais;
- veículos e vendas;
- veículos e financiamentos;
- veículos e consórcios;
- vendas e fluxo financeiro;
- vendas e comissões.

Essa integração prepara o front-end para a futura implementação do modelo relacional no back-end.

---

## 21. Situação atual da persistência

Nesta etapa, o AutoSystem continua utilizando dados em memória no front-end.

Isso permite validar:

- fluxos;
- regras;
- cálculos;
- permissões;
- relacionamentos;
- experiência de uso.

A persistência definitiva deverá ser implementada posteriormente com Spring Boot e PostgreSQL.

---

## 22. Próximas etapas

Após a consolidação funcional desta versão, estão previstas:

1. evolução da identidade visual e experiência de uso;
2. revisão da responsividade;
3. consolidação dos protótipos e documentação de UX;
4. implementação do back-end;
5. criação do banco de dados;
6. substituição do armazenamento local por autenticação segura;
7. integração do front-end com a API;
8. validações e regras críticas também no servidor.

---

## Resultado da etapa

O AutoSystem evoluiu de uma interface inicial focada principalmente em estoque e operações básicas para um protótipo funcional integrado de gestão de concessionária.

A aplicação atual permite validar os principais fluxos comerciais e gerenciais antes da implementação definitiva da camada de persistência e do back-end.