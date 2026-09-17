package br.com.autosystem;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

// Base dos testes de integracao: sobe UM Postgres real (Testcontainers), reutiliza o contexto
// entre as classes e limpa as tabelas antes de cada teste, na ordem segura (CASCADE),
// evitando poluicao entre testes que compartilham o mesmo banco.
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
public abstract class IntegracaoTest {

    @Autowired
    protected JdbcTemplate jdbc;

    @BeforeEach
    void limparBanco() {
        jdbc.execute("TRUNCATE TABLE vendas, veiculos, clientes, usuarios RESTART IDENTITY CASCADE");
    }
}
