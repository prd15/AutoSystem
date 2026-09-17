package br.com.autosystem;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

// Sobe o Postgres real (Testcontainers), aplica as migrations do zero e confere o esquema.
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class MigrationTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void migrationV1CriaAsTresTabelas() {
        var tabelas = jdbc.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
                String.class);
        assertThat(tabelas).contains("veiculos", "clientes", "vendas");
    }

    @Test
    void travaDeVeiculoVendidoExisteNoBanco() {
        Integer qtd = jdbc.queryForObject(
                "SELECT count(*) FROM pg_constraint WHERE conname = 'venda_unica_por_veiculo'",
                Integer.class);
        assertThat(qtd).isEqualTo(1);
    }
}
