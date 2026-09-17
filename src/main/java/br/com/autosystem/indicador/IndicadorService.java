package br.com.autosystem.indicador;

import br.com.autosystem.indicador.dto.EstoquePorMarca;
import br.com.autosystem.indicador.dto.FaturamentoMensal;
import br.com.autosystem.indicador.dto.IndicadoresResponse;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

// Consultas de agregacao da tela gerencial. Usa JdbcClient (SQL parametrizado — sem
// concatenacao/SQL Injection) porque relatorio em JPQL vira monstrengo. "Hoje" vem do Clock.
@Service
public class IndicadorService {

    private final JdbcClient jdbcClient;
    private final Clock clock;

    public IndicadorService(JdbcClient jdbcClient, Clock clock) {
        this.jdbcClient = jdbcClient;
        this.clock = clock;
    }

    private static final String SQL_INDICADORES = """
            SELECT
              (SELECT count(*) FROM veiculos WHERE status <> 'vendido')                       AS veiculos_em_estoque,
              (SELECT count(*) FROM veiculos WHERE status = 'disponivel')                      AS disponiveis,
              (SELECT count(*) FROM veiculos WHERE status = 'reservado')                       AS reservados,
              (SELECT COALESCE(SUM(preco), 0) FROM veiculos WHERE status <> 'vendido')         AS valor_estoque,
              (SELECT count(*) FROM vendas
                 WHERE data_venda >= :inicioMes AND data_venda < :proximoMes)                  AS vendas_no_mes,
              (SELECT count(*) FROM vendas
                 WHERE data_venda >= :inicioMesAnterior AND data_venda < :inicioMes)           AS vendas_mes_anterior,
              (SELECT COALESCE(SUM(valor_venda), 0) FROM vendas
                 WHERE data_venda >= :inicioMes AND data_venda < :proximoMes)                  AS faturamento_mes,
              (SELECT COALESCE(SUM(valor_venda), 0) FROM vendas
                 WHERE data_venda >= :inicioMesAnterior AND data_venda < :inicioMes)           AS faturamento_mes_anterior
            """;

    @Transactional(readOnly = true)
    public IndicadoresResponse indicadores() {
        LocalDate inicioMes = LocalDate.now(clock).withDayOfMonth(1);
        LocalDate proximoMes = inicioMes.plusMonths(1);
        LocalDate inicioMesAnterior = inicioMes.minusMonths(1);

        return jdbcClient.sql(SQL_INDICADORES)
                .param("inicioMes", inicioMes)
                .param("proximoMes", proximoMes)
                .param("inicioMesAnterior", inicioMesAnterior)
                .query((rs, n) -> new IndicadoresResponse(
                        rs.getLong("veiculos_em_estoque"),
                        rs.getLong("disponiveis"),
                        rs.getLong("reservados"),
                        rs.getBigDecimal("valor_estoque"),
                        rs.getLong("vendas_no_mes"),
                        rs.getLong("vendas_mes_anterior"),
                        rs.getBigDecimal("faturamento_mes"),
                        rs.getBigDecimal("faturamento_mes_anterior")))
                .single();
    }

    private static final String SQL_FATURAMENTO_MENSAL = """
            SELECT to_char(m.mes, 'YYYY-MM')            AS mes,
                   COALESCE(SUM(v.valor_venda), 0)      AS faturamento,
                   COUNT(v.id)                          AS vendas
            FROM generate_series(CAST(:inicio AS timestamp), CAST(:fim AS timestamp), interval '1 month') AS m(mes)
            LEFT JOIN vendas v ON date_trunc('month', v.data_venda) = m.mes
            GROUP BY m.mes
            ORDER BY m.mes
            """;

    @Transactional(readOnly = true)
    public List<FaturamentoMensal> faturamentoMensal(int meses) {
        int n = meses <= 0 ? 6 : meses;
        LocalDate inicioMes = LocalDate.now(clock).withDayOfMonth(1);
        LocalDate inicio = inicioMes.minusMonths(n - 1L);

        return jdbcClient.sql(SQL_FATURAMENTO_MENSAL)
                .param("inicio", inicio)
                .param("fim", inicioMes)
                .query((rs, r) -> new FaturamentoMensal(
                        rs.getString("mes"),
                        rs.getBigDecimal("faturamento"),
                        rs.getLong("vendas")))
                .list();
    }

    private static final String SQL_ESTOQUE_POR_MARCA = """
            SELECT marca, COUNT(*) AS quantidade, COALESCE(SUM(preco), 0) AS valor
            FROM veiculos
            WHERE status <> 'vendido'
            GROUP BY marca
            ORDER BY valor DESC, marca
            """;

    @Transactional(readOnly = true)
    public List<EstoquePorMarca> estoquePorMarca() {
        return jdbcClient.sql(SQL_ESTOQUE_POR_MARCA)
                .query((rs, r) -> new EstoquePorMarca(
                        rs.getString("marca"),
                        rs.getLong("quantidade"),
                        rs.getBigDecimal("valor")))
                .list();
    }
}
