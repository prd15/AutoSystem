# `src/api` — camada de acesso ao back-end

Funções tipadas, uma por endpoint, seguindo `docs/04-contrato-de-api.md`. As telas ainda
usam o estado em memória de `src/data/store.ts`; esta pasta é o ponto de encaixe para o
back-end Spring Boot.

| Arquivo | Conteúdo |
|---|---|
| `client.ts` | `fetch` com base `/api`, JSON, query string, `ApiError` com `status`, `campos` e `dados` |
| `tipos.ts` | DTOs de transporte. Dinheiro é `Decimal` (`number` no JSON) e data é `yyyy-mm-dd` |
| `veiculos.ts`, `clientes.ts`, `vendas.ts`, `usuarios.ts`, `indicadores.ts` | Recursos tipados da API |
| `financeiro.ts` | Lançamentos, resumo, comissões e financiamentos |

## Mapa store → api

| `store.ts` | `src/api` | Endpoint |
|---|---|---|
| `listarVeiculos(filtros)` | `veiculosApi.listar(filtro)` | `GET /api/veiculos` |
| `obterVeiculo(id)` | `veiculosApi.obter(id)` | `GET /api/veiculos/{id}` |
| `marcas()` | `veiculosApi.marcas()` | `GET /api/veiculos/marcas` |
| `veiculosVendaveis()` | `veiculosApi.vendaveis()` | `GET /api/veiculos/vendaveis` |
| `criarVeiculo(dados)` | `veiculosApi.criar(dados)` | `POST /api/veiculos` |
| `atualizarVeiculo(id, dados)` | `veiculosApi.atualizar(id, dados)` | `PUT /api/veiculos/{id}` |
| `excluirVeiculo(id)` | `veiculosApi.excluir(id)` | `DELETE /api/veiculos/{id}` |
| `placaEmUso(placa)` | validação do servidor (409) | — |
| `clientes()` | `clientesApi.listar(busca)` | `GET /api/clientes` |
| `obterCliente(id)` | `clientesApi.obter(id)` | `GET /api/clientes/{id}` |
| `criarCliente(dados)` | `clientesApi.criar(dados)` | `POST /api/clientes` |
| `cpfEmUso(cpf)` | validação do servidor (409) | — |
| `listarVendas({de, ate})` | `vendasApi.listar(periodo)` | `GET /api/vendas` |
| `obterVenda(id)` | `vendasApi.obter(id)` | `GET /api/vendas/{id}` |
| `registrarVenda(dados)` | `vendasApi.registrar(dados)` | `POST /api/vendas` |
| usuários | `usuariosApi.listar(busca)` | `GET /api/usuarios` |
| obter usuário | `usuariosApi.obter(id)` | `GET /api/usuarios/{id}` |
| criar usuário | `usuariosApi.criar(dados)` | `POST /api/usuarios` |
| `indicadores()` | `indicadoresApi.resumo()` | `GET /api/indicadores` |
| `faturamentoPorMes()` | `indicadoresApi.faturamentoMensal(6)` | `GET /api/indicadores/faturamento-mensal` |
| `estoquePorMarca()` | `indicadoresApi.estoquePorMarca()` | `GET /api/indicadores/estoque-por-marca` |
| `listarLancamentos(f)` | `financeiroApi.lancamentos.listar(f)` | `GET /api/lancamentos` |
| `criarLancamento` / `atualizarLancamento` / `quitarLancamento` / `excluirLancamento` | `financeiroApi.lancamentos.*` | `POST` / `PUT` / `PATCH .../quitar` / `DELETE` |
| `resumoFinanceiro` / `fluxoPorMes` / `saidasPorCategoria` | `financeiroApi.resumo` / `fluxoMensal` / `saidasPorCategoria` | `GET /api/financeiro/...` |
| `comissoes` / `pagarComissoes` | `financeiroApi.comissoes.listar` / `pagar` | `GET /api/comissoes` / `POST /api/comissoes/pagar` |
| `financiamentos` / `criarFinanciamento` / `registrarParcelaPaga` | `financeiroApi.financiamentos.*` | `GET` / `POST` / `PATCH .../parcela` |

## Como ligar uma tela

1. Trocar a leitura síncrona do `store` por um `useEffect` (ou React Query, se a equipe
   preferir) chamando a função equivalente daqui, com estado de carregamento e erro.
2. Valores monetários já são transportados como `number` no JSON. Não é necessária
   conversão entre string decimal e `number` na camada de API.
3. Nos formulários, capturar `ApiError`: `erro` vai para o toast, `campos` vai para os
   erros por campo, que já existem em `Field`.
4. Ao gravar, recarregar a lista (ou atualizar o item na memória) em vez de confiar no
   `useEstado()`.

Exemplo mínimo:

```ts
import { ApiError, veiculosApi } from "@/api"

const [lista, setLista] = useState<VeiculoDTO[]>([])
const [erro, setErro] = useState<string | null>(null)

useEffect(() => {
  const ctrl = new AbortController()

  veiculosApi
    .listar({ busca, status }, ctrl.signal)
    .then((r) => setLista(r.itens))
    .catch((e) => {
      if (!(e instanceof DOMException)) {
        setErro(e instanceof ApiError ? e.message : "Erro inesperado.")
      }
    })

  return () => ctrl.abort()
}, [busca, status])
```

## Usuários

A camada de usuários acompanha os endpoints disponíveis no back-end:

- `usuariosApi.listar(busca)` → `GET /api/usuarios`
- `usuariosApi.obter(id)` → `GET /api/usuarios/{id}`
- `usuariosApi.criar(dados)` → `POST /api/usuarios`

Os perfis aceitos são `ADMIN`, `GERENTE` e `VENDEDOR`. No cadastro, `perfil` é opcional;
quando não informado, o back-end assume `VENDEDOR`. A senha é enviada apenas no cadastro
e nunca faz parte de `UsuarioDTO`.

## Configuração

| Variável | Onde | Padrão |
|---|---|---|
| `VITE_API_URL` | `vite.config.ts` (proxy em dev) | `http://localhost:8080` |
| `VITE_API_BASE` | `client.ts` (prefixo das rotas) | `/api` |

Copie `.env.example` para `.env.local` para sobrescrever.