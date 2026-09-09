# 07 — Decisões arquiteturais para a reunião

Pauta de decisões do monólito, front e back, partindo do rumo que a equipe já sinalizou:
**Java 17/21 + Spring Boot + PostgreSQL + Flyway + Spring Security**.

Cada item traz opções, recomendação e o que muda na prática. Nada aqui está decidido — o
documento existe para a reunião bater o martelo e registrar o porquê.

Base factual: [01](01-inventario-funcional.md) a [06](06-stack-e-arquitetura.md), extraídos do
protótipo em `design-system-03`.

## Contexto em uma tela

| | |
|---|---|
| Front pronto | React 19 + TS + Vite + Tailwind v4 + shadcn/ui, 5 telas, ~8.200 linhas |
| Domínio | 5 tabelas, 5 enums, ~25 endpoints, 13 regras de negócio |
| Exigência dura | `POST /api/vendas` escreve em 4 lugares na mesma transação |
| Equipe | 6 pessoas, Scrum, projeto acadêmico |
| Restrição | Monólito: front e back no mesmo projeto e repositório |

---

# Bloco A — Plataforma

## A1. Versão do Java

| Opção | A favor | Contra |
|---|---|---|
| **Java 17** | Baseline do Spring Boot 3 e 4; instalado em qualquer lugar | Sem virtual threads; pattern matching incompleto |
| **Java 21** (recomendado) | LTS maduro, virtual threads, `switch` com pattern matching, records patterns; suportado por todo o ecossistema | Precisa garantir o JDK na máquina de todos |
| Java 25 | LTS mais recente (set/2025), suportado pelo Boot 4 | Bibliotecas periféricas ainda podem tropeçar; ganho pequeno para este escopo |

**Recomendado: Java 21.** É o denominador comum entre "moderno" e "todo mundo consegue
rodar". Virtual threads (`spring.threads.virtual.enabled=true`) saem de graça e ajudam num
back-end que passa a vida esperando o banco responder.

Custo de escolher 17: nenhum recurso do escopo fica inviável. É uma escolha defensável se
alguma máquina da equipe travar no 17.

**Decisão a registrar:** versão do JDK e como todo mundo instala (SDKMAN, Temurin,
`.sdkmanrc` no repositório).

## A2. Versão do Spring Boot

Linha atual em setembro/2026: **Spring Boot 4.1.x**, sobre Spring Framework 7.

| Opção | A favor | Contra |
|---|---|---|
| **Spring Boot 4.1.x** | Linha ativa, documentação atual, suporte mais longo | Jackson 3 obrigatório; Spring Security 7 quebra configuração antiga; tutoriais antigos não colam |
| Spring Boot 3.5.x | Oceano de tutoriais e respostas no Stack Overflow escritos para 3.x | Linha anterior; migrar depois custa |

**Recomendado: 4.1.x**, com uma ressalva honesta — a maioria do material que a equipe vai
achar no Google é de 3.x, e três coisas mudaram o suficiente para confundir:

1. **Jackson 3** no lugar do 2 (pacote e algumas propriedades mudam)
2. **Spring Security 7** só aceita lambda DSL; `.and()` encadeado não compila mais
3. Codebase modularizada em 70+ JARs (os *starters* continuam iguais, então o impacto no
   `pom.xml` é pequeno)

Se a equipe preferir caminho de menor atrito com tutoriais, 3.5.x resolve o escopo inteiro
sem prejuízo técnico. É uma troca de "atual" por "mais material pronto".

**Confirmar na hora de criar o projeto** em [start.spring.io](https://start.spring.io) — é
ele quem dita a versão estável do dia.

## A3. Maven ou Gradle

| Opção | A favor | Contra |
|---|---|---|
| **Maven** (recomendado) | XML declarativo, previsível, é o que aparece em aula e em tutorial | Verboso |
| Gradle | Build mais rápido, Kotlin DSL | Mais uma linguagem para a equipe aprender |

Com 6 pessoas e prazo de sprint, Maven ganha por ser chato e previsível. O build deste
projeto não é complexo o bastante para justificar Gradle.

---

# Bloco B — Como o monólito se monta

Aqui mora a decisão mais concreta: **como o SPA pronto vive dentro do Spring Boot**.

## B1. Empacotamento

| Opção | Como funciona | Avaliação |
|---|---|---|
| **Módulo único** (recomendado) | `web/` (front) + `src/main/java` no mesmo projeto Maven; o build do front joga o `dist/` em `src/main/resources/static/` | Um JAR, um deploy, um `mvn package`. Simples e cumpre "monólito" ao pé da letra |
| Multi-módulo Maven | Módulo `web` (empacota o front) + módulo `api`, agregados por um pai | Organiza melhor projetos grandes; cerimônia demais para 5 tabelas |
| Dois projetos, dois deploys | Front no Vercel/Netlify, API à parte | **Contraria o escopo**, que exige monólito |

Resultado: `java -jar autosystem.jar` sobe a aplicação inteira, front incluído.

## B2. Build do front dentro do Maven

| Opção | Avaliação |
|---|---|
| **`frontend-maven-plugin`** (recomendado) | Baixa Node e npm na versão fixada, roda `npm ci` e `npm run build` durante o `mvn package`. Ninguém precisa ter Node instalado para gerar o JAR |
| Build manual + commit do `dist/` | Simples, mas versiona artefato gerado e sempre alguém esquece de rodar |
| Perfil que só empacota se o `dist/` existir | Meio-termo; boa saída se o plugin der problema no laboratório |

Ponto prático: o plugin torna o build local mais lento. Resolve-se com um perfil `dev` que
pula o front (`-P skip-frontend`) no dia a dia de quem mexe só no back.

## B3. Roteamento do SPA — decisão fácil, hoje

O protótipo usa **hash routing** (`#/estoque`, `app-context.tsx:124`). Isso significa que o
servidor nunca vê a rota: tudo é `/`, o resto vive depois do `#`.

Consequência: **não precisa de fallback de 404 no Spring**. Se um dia o time trocar para
history routing (`/estoque`), aí passa a precisar de um handler que devolva `index.html`
para toda rota desconhecida que não comece com `/api`.

**Decisão:** manter hash routing na primeira entrega (custo zero) ou migrar para history
routing (URLs mais bonitas, um `WebMvcConfigurer` a mais). Recomendo manter e revisitar
depois — não é o que decide o sucesso da entrega.

## B4. Desenvolvimento: dois processos, um artefato

```
Dev:   Vite em :5174  ──proxy /api──▶  Spring Boot em :8080
Build: mvn package  →  dist/ dentro do JAR  →  tudo em :8080
```

No `vite.config.ts` do projeto real:

```ts
server: {
  port: 5174,
  proxy: { "/api": "http://localhost:8080" },
}
```

Assim o front chama `/api/veiculos` sempre — mesma origem em produção, proxy em
desenvolvimento. Sem `VITE_API_URL`, sem CORS, sem variável de ambiente para esquecer.

**Corolário:** com mesma origem, **CORS não precisa ser configurado**. Se alguém propuser
liberar CORS, é sinal de que a arquitetura escorregou para dois deploys.

## B5. Tipos do front: escrever à mão ou gerar da API

O `store.ts` já tem os tipos do domínio em TypeScript. Quando virarem chamadas HTTP:

| Opção | Avaliação |
|---|---|
| **Gerar do OpenAPI** (recomendado) | `springdoc` expõe o schema; `openapi-typescript` gera os tipos. Back e front nunca divergem |
| Manter à mão | Zero ferramenta; divergência silenciosa quando alguém mudar um DTO |
| Compartilhar por convenção | Pior dos dois |

Vale o investimento de uma tarde na sprint 1. É o antídoto contra o risco de "validação
divergente" apontado em [03](03-regras-e-calculos.md).

---

# Bloco C — Organização do código

## C1. Pacote por camada ou por funcionalidade

| Opção | Formato |
|---|---|
| Por camada | `controller/`, `service/`, `repository/`, `model/` — tudo junto por tipo |
| **Por funcionalidade** (recomendado) | `veiculos/`, `clientes/`, `vendas/`, `financeiro/`, cada um com seu controller, service, repository e DTOs |

Pacote por funcionalidade espelha `src/features/` do front, o que ajuda quando a mesma
pessoa mexe nos dois lados. E deixa óbvio onde mora a transação de venda.

```
br.com.autosystem
├── AutoSystemApplication.java
├── comum/            erros, ProblemDetail, validadores (CPF, placa), config
├── veiculos/
│   ├── VeiculoController.java
│   ├── VeiculoService.java
│   ├── VeiculoRepository.java
│   ├── Veiculo.java              entidade JPA
│   └── dto/                      VeiculoRequest, VeiculoResponse
├── clientes/
├── vendas/                       ← a transação vive aqui
├── indicadores/                  consultas de agregação
└── financeiro/                   se o módulo entrar no escopo
```

## C2. Entidade exposta na API ou DTO

**Recomendado: DTO sempre.** Devolver entidade JPA no controller vaza estrutura de banco,
cria ciclo de serialização em relacionamento bidirecional e amarra a API ao modelo.

Com Java 21, DTO é `record` — três linhas, sem Lombok:

```java
public record VeiculoResponse(
    Long id, String marca, String modelo, Integer ano, String cor,
    Integer quilometragem, BigDecimal preco, String placa,
    VeiculoStatus status, LocalDate criadoEm, Integer diasEmEstoque
) {}
```

## C3. Mapeamento entidade ↔ DTO

| Opção | Avaliação |
|---|---|
| **Manual** (recomendado para este tamanho) | Um método estático `from(Veiculo)` no record. 5 entidades não justificam ferramenta |
| MapStruct | Gera o mapeamento em tempo de compilação; ganha a partir de dezenas de DTOs |
| ModelMapper | Reflexão em runtime; evitar |

## C4. Lombok

| A favor | Contra |
|---|---|
| Menos código repetido em entidades JPA | Mais um processador de anotação; records já cobrem os DTOs; `@Data` em entidade JPA causa problema com `equals`/`hashCode` |

**Recomendado: usar só se a equipe já conhece**, e limitado a `@Getter`, `@Setter`,
`@NoArgsConstructor` nas entidades. Nunca `@Data` em entidade. Se ninguém usa Lombok hoje,
dá para viver sem.

---

# Bloco D — Persistência

## D1. Spring Data JPA, JDBC ou jOOQ

| Opção | Onde brilha | Onde sofre |
|---|---|---|
| **JPA/Hibernate** | CRUD das 5 entidades, relacionamentos, transação | Consultas de agregação viram monstrengos |
| **JdbcClient** (Spring 6.1+) | As consultas de indicador, série de 6 meses, comissão por vendedor | Sem mapeamento automático de objeto |
| jOOQ | SQL tipado de ponta a ponta | Curva e geração de código; exagero aqui |

**Recomendado: JPA para o CRUD + `JdbcClient` com SQL escrito à mão para as agregações.**
Não é inconsistência, é usar cada ferramenta onde ela é boa. As consultas de
[04](04-contrato-de-api.md) (`/api/indicadores`, `faturamento-mensal`, `fluxo-mensal`,
`saidas-por-categoria`, `comissoes`) são SQL de relatório — escrever em JPQL só piora.

```java
// Série de 6 meses com mês vazio incluído — SQL puro é mais claro que qualquer abstração
var sql = """
    SELECT to_char(m.mes, 'YYYY-MM') AS mes,
           COALESCE(SUM(v.valor_venda), 0) AS faturamento,
           COUNT(v.id) AS vendas
    FROM generate_series(date_trunc('month', now()) - interval '5 months',
                         date_trunc('month', now()), interval '1 month') AS m(mes)
    LEFT JOIN vendas v ON date_trunc('month', v.data_venda) = m.mes
    GROUP BY m.mes ORDER BY m.mes
    """;
```

## D2. Como mapear os enums

| Opção | Avaliação |
|---|---|
| `@Enumerated(EnumType.STRING)` + coluna `VARCHAR` + `CHECK` | **Recomendado.** Legível no banco, sem drama de migration |
| Tipo `ENUM` nativo do PostgreSQL | Bonito no banco, chato no Hibernate e pior de alterar (`ALTER TYPE`) |
| `@Enumerated(EnumType.ORDINAL)` | **Nunca.** Inserir um valor no meio do enum corrompe os dados existentes |

Isso ajusta o DDL de [02](02-modelo-de-dados.md): trocar os tipos `ENUM` por `VARCHAR` +
`CHECK` se a equipe seguir a recomendação.

## D3. Dinheiro

`BigDecimal` na aplicação, `NUMERIC(12,2)` no banco. Nunca `double`, nunca `float`.

```java
@Column(nullable = false, precision = 12, scale = 2)
private BigDecimal preco;
```

Três armadilhas para o code review vigiar:

1. `new BigDecimal(0.1)` — usar `BigDecimal.valueOf(0.1)` ou `new BigDecimal("0.1")`
2. Comparar com `equals` — usar `compareTo` (`2.0` e `2.00` não são `equals`)
3. Divisão sem escala e arredondamento definidos — sempre `divide(x, 2, RoundingMode.HALF_UP)`

A comissão de 1,5 % ([03](03-regras-e-calculos.md)) é exatamente uma divisão que precisa de
regra de arredondamento explícita.

## D4. Datas e fuso horário

| Campo | Tipo Java | Tipo banco |
|---|---|---|
| `data_venda`, `vencimento` | `LocalDate` | `DATE` |
| `criado_em`, `atualizado_em` | `Instant` ou `OffsetDateTime` | `TIMESTAMPTZ` |

Fixar o fuso da aplicação para não repetir o problema que o protótipo tem com
`toISOString()` (ver [05](05-requisitos-nao-funcionais.md)):

```properties
spring.jackson.time-zone=America/Sao_Paulo
```

E, no serviço, "hoje" vem de um `Clock` injetado — não de `LocalDate.now()` espalhado pelo
código. Isso torna testável a regra de "atrasado" e a de "vendas do mês".

## D5. Auditoria

`@CreatedDate` / `@LastModifiedDate` com `@EnableJpaAuditing` resolve `criado_em` e
`atualizado_em` sem código repetido. Quando a autenticação entrar, `@CreatedBy` preenche
`criado_por` sozinho.

**Recomendado:** já criar as colunas `criado_por`/`atualizado_por` como nulas, para não
migrar tabela de novo depois.

## D6. Paginação

Decisão aberta desde [04](04-contrato-de-api.md).

| Opção | Avaliação |
|---|---|
| `Pageable` + `Page<T>` do Spring | Vem pronto, mas o JSON do `Page` é verboso e o front teria que se adaptar |
| **DTO próprio** (`{ itens, total, resumo }`) | O front já espera esse formato; o `resumo` (contagem por status) não cabe no `Page` |
| Sem paginação | Funciona hoje, quebra com centenas de veículos |

**Recomendado:** usar `Pageable` internamente e traduzir para um envelope próprio na
resposta. Melhor dos dois lados.

---

# Bloco E — Flyway

## E1. Convenção de nomes

```
src/main/resources/db/migration/
├── V1__criar_tabelas_base.sql          veiculos, clientes, vendas
├── V2__indices_e_restricoes.sql        índice parcial da placa, unique de CPF
├── V3__criar_tabelas_financeiro.sql    lancamentos, financiamentos (se entrar)
└── V4__colunas_de_auditoria.sql
```

Regras que evitam dor de cabeça em equipe de 6:

- Migration **nunca** é editada depois de entrar na branch principal — o checksum quebra
  para todo mundo
- Nome descreve a intenção, não o número da task
- Uma migration por PR, sempre que possível — reduz conflito de numeração
- `flyway.clean-disabled=true` em qualquer perfil que não seja o local

## E2. Onde vive o seed

O escopo exige dados de exemplo (10+ veículos, 3+ vendas) e o protótipo já tem um seed
conferido: 15 veículos, 5 clientes, 4 vendas ([02](02-modelo-de-dados.md)).

| Opção | Avaliação |
|---|---|
| Migration versionada `V99__seed.sql` | Vai para produção junto; ruim se um dia existir produção de verdade |
| **`afterMigrate` só no perfil `dev`** (recomendado) | `db/dev/afterMigrate__seed.sql` com `spring.flyway.locations` variando por perfil |
| `data.sql` do Spring | Conflita com Flyway na ordem de execução; evitar |

## E3. Ambientes

| Perfil | Banco | Seed |
|---|---|---|
| `dev` | Postgres local (Docker Compose) | Sim |
| `test` | Testcontainers, banco descartável | Fixtures do teste |
| `prod`/`apresentacao` | Postgres do servidor | Não |

---

# Bloco F — Transação e concorrência

## F1. Onde fica o `@Transactional`

Na **classe de serviço**, nunca no controller nem no repositório.

```java
@Service
public class VendaService {

    @Transactional
    public VendaResponse registrar(NovaVendaRequest req) {
        var veiculo = veiculoRepository.findById(req.veiculoId())
            .orElseThrow(() -> new RecursoNaoEncontrado("Veículo não encontrado."));

        if (veiculo.getStatus() == VeiculoStatus.VENDIDO) {
            throw new ConflitoDeRegra("Este veículo já foi vendido.");
        }

        var venda = vendaRepository.save(Venda.de(req, veiculo));
        veiculo.setStatus(VeiculoStatus.VENDIDO);            // regra 1

        lancamentoRepository.save(Lancamento.entradaDeVenda(venda, veiculo));   // regra 6
        lancamentoRepository.save(Lancamento.comissaoDe(venda, veiculo));       // regra 7

        return VendaResponse.from(venda);
    }
}
```

Se qualquer linha falhar, nada é gravado. É exatamente o comportamento que
[03](03-regras-e-calculos.md) exige.

## F2. Duas pessoas vendendo o mesmo carro ao mesmo tempo

O `if (status == VENDIDO)` sozinho não protege: duas requisições simultâneas podem passar
pela verificação antes de qualquer uma gravar.

| Camada de proteção | Avaliação |
|---|---|
| **`UNIQUE (veiculo_id)` em vendas** (recomendado) | O banco é a última palavra; a segunda gravação estoura e vira `409` |
| `@Version` na entidade Veiculo (lock otimista) | Também resolve, e protege edição concorrente em geral |
| `SELECT ... FOR UPDATE` (lock pessimista) | Funciona, mas segura linha e é exagero aqui |

Recomendo a restrição única **mais** tratamento do erro para virar mensagem em linguagem
natural. Cinto e suspensório custam pouco e o cenário é real na recepção de uma loja.

Lembrete de [02](02-modelo-de-dados.md): se a loja puder recomprar e revender o mesmo
veículo, essa restrição cai e a proteção passa a ser só o `@Version`.

---

# Bloco G — Validação e erros

## G1. Bean Validation nos DTOs de entrada

```java
public record VeiculoRequest(
    @NotBlank @Size(max = 50) String marca,
    @NotBlank @Size(max = 50) String modelo,
    @NotNull @Min(1950) Integer ano,
    @NotBlank @Size(max = 30) String cor,
    @NotNull @PositiveOrZero Integer quilometragem,
    @NotNull @DecimalMin(value = "0.01") BigDecimal preco,
    @Placa String placa,                    // validador próprio, opcional
    VeiculoStatus status
) {}
```

Dois validadores próprios valem o esforço, porque a regra é brasileira e o front já tem a
mesma lógica: **CPF** (dígito verificador, `cliente-form.tsx:29`) e **placa**
(`^[A-Z]{3}\d[A-Z0-9]\d{2}$`, `veiculo-sheet.tsx:95`).

O limite superior do ano (ano atual + 1) não cabe em anotação estática — vira validação no
serviço ou `@AssertTrue`.

## G2. Formato do erro

Spring Boot já devolve `ProblemDetail` (RFC 9457). O front espera `{ erro, campos }`
([04](04-contrato-de-api.md)).

| Opção | Avaliação |
|---|---|
| `ProblemDetail` puro | Padrão, mas o campo `detail` sozinho não carrega erro por campo |
| **`ProblemDetail` + propriedades estendidas** (recomendado) | Padrão respeitado e o front recebe o mapa de campos |
| Formato próprio do zero | Funciona; joga fora um padrão que já vem pronto |

```java
@RestControllerAdvice
class TratadorDeErros {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail campoInvalido(MethodArgumentNotValidException e) {
        var pd = ProblemDetail.forStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        pd.setTitle("Dados inválidos");
        pd.setDetail("Verifique os campos destacados e tente novamente.");
        pd.setProperty("campos", e.getBindingResult().getFieldErrors().stream()
            .collect(toMap(FieldError::getField, FieldError::getDefaultMessage, (a, b) -> a)));
        return pd;
    }
}
```

Requisito do escopo: mensagem em linguagem natural, nunca código técnico. Isso vale para o
`detail` e para cada mensagem de campo — escrever em português, no `messages.properties` ou
direto na anotação.

## G3. Nomenclatura do JSON

O contrato de [04](04-contrato-de-api.md) foi escrito em `snake_case` (`valor_venda`,
`criado_em`), espelhando o banco. Java escreve `camelCase`.

| Opção | Avaliação |
|---|---|
| `spring.jackson.property-naming-strategy=SNAKE_CASE` | Uma linha, converte tudo; atenção que a propriedade mudou de pacote no Jackson 3 |
| **Padronizar `camelCase` no JSON** (recomendado) | Menos configuração, natural nos dois lados; o front é TypeScript, não SQL |
| `@JsonProperty` campo a campo | Trabalhoso e fácil de esquecer |

Se escolherem `camelCase`, atualizar os exemplos de [04](04-contrato-de-api.md) para não
gerar confusão na implementação.

**Dinheiro no JSON:** decidir se `BigDecimal` vai como número ou string. Número é mais
natural; string elimina qualquer risco de o JavaScript arredondar. Com valores até milhões,
número é seguro — mas registrem a escolha.

---

# Bloco H — Spring Security

Autenticação está **fora** da primeira entrega, mas prevista para a seguinte
(`em-breve-page.tsx:11`). A decisão de agora é: como preparar sem atrasar.

## H1. Quando entra

| Opção | Avaliação |
|---|---|
| Já na entrega 1 | Trabalho a mais numa entrega que já cresceu |
| **Dependência no classpath com config explícita liberando tudo** (recomendado) | Custa 10 linhas, evita publicar aberto por acidente, e a estrutura já está pronta |
| Só depois, sem Spring Security no projeto | Adicionar depois é mexer em todo controller |

Sem configuração, o Spring Security bloqueia tudo com um usuário `user` e senha no log —
comportamento que confunde a equipe. Por isso a config explícita:

```java
@Configuration
@EnableWebSecurity
class SecurityConfig {

    // Entrega 1: API aberta, de forma consciente e documentada.
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())               // sem sessão ainda
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .build();
    }
}
```

**Aviso que precisa ser dito na reunião:** enquanto estiver assim, qualquer pessoa com a URL
apaga o estoque inteiro. Se a apresentação for em rede local, tudo bem. Se for na internet,
autenticação deixa de ser opcional.

## H2. Sessão ou JWT

| Opção | A favor | Contra |
|---|---|---|
| **Sessão + cookie** (recomendado) | O SPA é servido pela mesma origem; cookie `HttpOnly` + `SameSite=Lax` é imune a roubo por JavaScript; logout funciona de verdade | Estado no servidor (irrelevante num monólito) |
| JWT no `localStorage` | "Moderno" | Vulnerável a XSS, logout não invalida nada, refresh token vira projeto paralelo |
| JWT em cookie `HttpOnly` | Combina os dois | Complexidade sem ganho aqui |

Para monólito que serve o próprio front, **sessão é a escolha certa e mais simples**. JWT
existe para resolver um problema que este projeto não tem (múltiplos clientes e domínios).

Com sessão, o CSRF volta a importar: habilitar com `CookieCsrfTokenRepository` e o front
enviar o header `X-XSRF-TOKEN`.

## H3. Papéis

O protótipo mostra "Pedro Silva / Gerente" fixo. A rota de configurações prevê "usuários e
perfis de acesso".

Proposta mínima: `ADMIN`, `GERENTE`, `VENDEDOR`. Onde muda o comportamento:

| Ação | Vendedor | Gerente | Admin |
|---|---|---|---|
| Ver estoque, registrar venda | Sim | Sim | Sim |
| Excluir veículo | Não | Sim | Sim |
| Ver financeiro e comissões | Só as próprias | Sim | Sim |
| Gerenciar usuários | Não | Não | Sim |

Aplicado com `@PreAuthorize("hasRole('GERENTE')")` no serviço. Senha com `BCryptPasswordEncoder`.

**Decisão:** essa matriz é a certa, ou o professor/cliente espera outra divisão?

---

# Bloco I — Testes

Hoje o protótipo não tem nenhum teste ([05](05-requisitos-nao-funcionais.md)). Quatro níveis
possíveis, do mais barato ao mais caro:

| Nível | Ferramenta | O que cobre | Prioridade |
|---|---|---|---|
| Unitário de serviço | JUnit 5 + Mockito + AssertJ | **As 13 regras de negócio** | **Alta** |
| Camada web | `@WebMvcTest` | Status HTTP, formato do erro, validação | Média |
| Repositório e migrations | `@DataJpaTest` + **Testcontainers** | SQL real no Postgres real, Flyway rodando | Média |
| Ponta a ponta | Playwright | Fluxo de venda pela interface | Baixa nesta entrega |

**Recomendado:** exigir teste unitário para as 5 regras do escopo + Testcontainers para
garantir que as migrations sobem do zero. É o mínimo que segura a nota e evita regressão.

H2 em memória para teste é tentador, mas mente: `generate_series`, índice parcial e
`NUMERIC` se comportam diferente. Testcontainers roda o Postgres de verdade num container
descartável.

---

# Bloco J — Configuração, perfis e operação

| Item | Recomendação |
|---|---|
| Perfis | `dev`, `test`, `prod` em `application-{perfil}.properties` |
| Segredos | Variável de ambiente; **senha de banco nunca no repositório** |
| Banco local | `compose.yaml` com Postgres + `spring-boot-docker-compose`, que sobe o container junto com a aplicação |
| Saúde | `spring-boot-starter-actuator` com `/actuator/health` exposto e o resto fechado |
| Log | Padrão do Boot; `INFO` na aplicação, `WARN` no Hibernate |
| `ddl-auto` | **`validate`** — nunca `update`. Quem cria tabela é o Flyway |

```properties
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
spring.jackson.time-zone=America/Sao_Paulo
spring.threads.virtual.enabled=true        # Java 21+
```

`ddl-auto=update` junto com Flyway é a receita mais comum de banco corrompido em projeto de
equipe: os dois tentam alterar o schema e ninguém sabe qual venceu.

---

# Dependências do Spring Boot

## Entram na sprint 1

| Dependência | Para quê |
|---|---|
| `spring-boot-starter-web` | Controllers REST, Tomcat embutido |
| `spring-boot-starter-validation` | Bean Validation nos DTOs |
| `spring-boot-starter-data-jpa` | Repositórios, entidades, transação |
| `postgresql` (runtime) | Driver JDBC |
| `flyway-core` | Migrations |
| `flyway-database-postgresql` | **Obrigatório** desde o Flyway 10 para Postgres; esquecer disso quebra o start |
| `spring-boot-starter-actuator` | Health check |
| `spring-boot-devtools` (dev) | Restart automático |

## Entram quando fizerem sentido

| Dependência | Quando | Observação |
|---|---|---|
| `spring-boot-starter-security` | Ao decidir H1 | Já pode entrar liberando tudo |
| `springdoc-openapi-starter-webmvc-ui` | Ao gerar tipos do front (B5) | **Versão 3.x** para Spring Boot 4; a 2.x é para o Boot 3 |
| `spring-boot-docker-compose` | Desde já, se usarem Docker | Sobe o Postgres junto com a aplicação |
| `spring-boot-testcontainers` + `testcontainers:postgresql` + `junit-jupiter` | Ao escrever teste de repositório | Postgres real, descartável |
| `lombok` | Se a equipe já usa | Ver C4 |
| `mapstruct` | Se os mapeamentos incomodarem | Provavelmente desnecessário |
| `spring-boot-starter-mail` | Se um dia enviar e-mail ao cliente | Fora do escopo |

## Não recomendo agora

| Dependência | Por quê |
|---|---|
| Redis / cache distribuído | Não há problema de desempenho a resolver |
| Kafka / RabbitMQ | Não há integração assíncrona no escopo |
| GraphQL | O contrato REST já está descrito e o front já espera REST |
| Spring Batch | Nenhum processamento em lote |
| Elasticsearch | A busca é `ILIKE` em 15 registros |

## Esboço do `pom.xml`

```xml
<properties>
  <java.version>21</java.version>
  <node.version>v22.11.0</node.version>
</properties>

<dependencies>
  <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
  <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-validation</artifactId></dependency>
  <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
  <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-actuator</artifactId></dependency>

  <dependency><groupId>org.flywaydb</groupId><artifactId>flyway-core</artifactId></dependency>
  <dependency><groupId>org.flywaydb</groupId><artifactId>flyway-database-postgresql</artifactId></dependency>
  <dependency><groupId>org.postgresql</groupId><artifactId>postgresql</artifactId><scope>runtime</scope></dependency>

  <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
</dependencies>

<build>
  <plugins>
    <!-- Compila o front e joga em resources/static durante o package -->
    <plugin>
      <groupId>com.github.eirslett</groupId>
      <artifactId>frontend-maven-plugin</artifactId>
      <configuration>
        <workingDirectory>web</workingDirectory>
        <nodeVersion>${node.version}</nodeVersion>
      </configuration>
      <!-- execuções: install-node-and-npm, npm ci, npm run build -->
    </plugin>
  </plugins>
</build>
```

Gerar o esqueleto em [start.spring.io](https://start.spring.io) e ajustar — evita erro de
versão escrita à mão.

---

# Decisões para a reunião bater o martelo

| # | Decisão | Recomendação | Impacto se adiar |
|---|---|---|---|
| 1 | Java 17 ou 21 | **21** | Baixo, dá para mudar depois |
| 2 | Spring Boot 4.1 ou 3.5 | **4.1**, ciente de que os tutoriais são de 3.x | Médio: migrar depois custa |
| 3 | Maven ou Gradle | **Maven** | Baixo |
| 4 | Módulo único ou multi-módulo | **Módulo único** | Médio: reorganizar depois é chato |
| 5 | Build do front no Maven | **`frontend-maven-plugin`** | Baixo |
| 6 | Hash routing ou history | **Manter hash** | Baixo |
| 7 | Gerar tipos do OpenAPI | **Sim, na sprint 1** | Alto: divergência silenciosa |
| 8 | Pacote por camada ou feature | **Feature** | Alto se decidir tarde |
| 9 | JSON em `camelCase` ou `snake_case` | **camelCase** | Alto: refazer o front inteiro depois |
| 10 | Paginação agora ou depois | **Envelope próprio com `Pageable` por trás** | Médio |
| 11 | Enum como VARCHAR ou tipo nativo | **VARCHAR + CHECK** | Médio: migration extra |
| 12 | Onde vive o seed | **`afterMigrate` no perfil dev** | Baixo |
| 13 | Spring Security já no classpath | **Sim, liberando tudo, documentado** | **Crítico** se publicar aberto |
| 14 | Sessão ou JWT | **Sessão** | Alto se escolher JWT sem necessidade |
| 15 | Matriz de papéis | Validar a proposta de H3 | Médio |
| 16 | Cobertura mínima de teste | **13 regras + Testcontainers nas migrations** | Alto para a nota |
| 17 | Onde a aplicação roda na apresentação | Definir | **Crítico**: define se autenticação é opcional |

## Três armadilhas que valem um minuto da reunião

1. **`ddl-auto=update` com Flyway.** Escolham um dono do schema. É o Flyway. `validate` no
   resto.
2. **`double` para dinheiro.** Um code review inteiro pode passar batido nisso e o erro só
   aparece na soma do relatório.
3. **Publicar sem autenticação.** Enquanto o `permitAll` estiver lá, a aplicação não pode
   sair da rede local.

## Fontes das versões

- [Spring Boot — endoflife.date](https://endoflife.date/spring-boot)
- [Spring Boot versions e EOL — HeroDevs](https://www.herodevs.com/blog-posts/spring-boot-versions-eol-dates-and-latest-releases-april-2026)
- [springdoc-openapi para Spring Boot 4](https://springdoc.org/v4/)
- [Spring Security — migração para 7](https://docs.spring.io/spring-security/reference/6.5-SNAPSHOT/migration-7/configuration.html)
