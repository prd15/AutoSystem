package br.com.autosystem.indicador;

import br.com.autosystem.IntegracaoTest;
import br.com.autosystem.cliente.Cliente;
import br.com.autosystem.cliente.ClienteRepository;
import br.com.autosystem.indicador.dto.EstoquePorMarca;
import br.com.autosystem.indicador.dto.FaturamentoMensal;
import br.com.autosystem.indicador.dto.IndicadoresResponse;
import br.com.autosystem.veiculo.StatusVeiculo;
import br.com.autosystem.veiculo.Veiculo;
import br.com.autosystem.veiculo.VeiculoRepository;
import br.com.autosystem.venda.Venda;
import br.com.autosystem.venda.VendaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Valida as agregacoes (JdbcClient) e a serie mensal (generate_series) num Postgres real.
class IndicadorServiceIntegrationTest extends IntegracaoTest {

    @Autowired
    IndicadorService service;
    @Autowired
    VeiculoRepository veiculoRepository;
    @Autowired
    ClienteRepository clienteRepository;
    @Autowired
    VendaRepository vendaRepository;

    private Veiculo salvarVeiculo(String marca, StatusVeiculo status, String preco) {
        Veiculo v = new Veiculo();
        v.setMarca(marca);
        v.setModelo("Modelo");
        v.setAno(2022);
        v.setCor("Prata");
        v.setQuilometragem(1000);
        v.setPreco(new BigDecimal(preco));
        v.setStatus(status);
        return veiculoRepository.save(v);
    }

    private Cliente salvarCliente(String cpf) {
        Cliente c = new Cliente();
        c.setNome("Cliente " + cpf);
        c.setCpf(cpf);
        c.setTelefone("34999990000");
        return clienteRepository.save(c);
    }

    private void registrarVenda(Veiculo veiculo, Cliente cliente, String valor, LocalDate data) {
        Venda venda = new Venda();
        venda.setVeiculo(veiculo);
        venda.setCliente(cliente);
        venda.setVendedor("Alan");
        venda.setValorVenda(new BigDecimal(valor));
        venda.setDataVenda(data);
        vendaRepository.save(venda);
        veiculo.setStatus(StatusVeiculo.VENDIDO);
        veiculoRepository.save(veiculo);
    }

    @Test
    void indicadores_refletemEstoqueEVendasDoMes() {
        LocalDate hoje = LocalDate.now();
        salvarVeiculo("Honda", StatusVeiculo.DISPONIVEL, "100000.00");
        salvarVeiculo("Toyota", StatusVeiculo.DISPONIVEL, "120000.00");
        salvarVeiculo("Fiat", StatusVeiculo.RESERVADO, "70000.00");

        Cliente c = salvarCliente("11111111111");
        registrarVenda(salvarVeiculo("Chevrolet", StatusVeiculo.DISPONIVEL, "90000.00"), c, "88000.00", hoje);
        registrarVenda(salvarVeiculo("Hyundai", StatusVeiculo.DISPONIVEL, "85000.00"), c, "83000.00", hoje);
        registrarVenda(salvarVeiculo("Renault", StatusVeiculo.DISPONIVEL, "60000.00"), c, "59000.00", hoje.minusMonths(1));

        IndicadoresResponse ind = service.indicadores();

        assertThat(ind.veiculosEmEstoque()).isEqualTo(3);
        assertThat(ind.disponiveis()).isEqualTo(2);
        assertThat(ind.reservados()).isEqualTo(1);
        assertThat(ind.valorEstoque()).isEqualByComparingTo("290000.00");
        assertThat(ind.vendasNoMes()).isEqualTo(2);
        assertThat(ind.vendasMesAnterior()).isEqualTo(1);
        assertThat(ind.faturamentoMes()).isEqualByComparingTo("171000.00");
        assertThat(ind.faturamentoMesAnterior()).isEqualByComparingTo("59000.00");
    }

    @Test
    void faturamentoMensal_retornaSeisMeses_comMesesVaziosZerados() {
        Cliente c = salvarCliente("22222222222");
        registrarVenda(salvarVeiculo("Honda", StatusVeiculo.DISPONIVEL, "100000.00"), c, "95000.00", LocalDate.now());

        List<FaturamentoMensal> serie = service.faturamentoMensal(6);

        assertThat(serie).hasSize(6);
        FaturamentoMensal mesAtual = serie.get(serie.size() - 1);
        assertThat(mesAtual.vendas()).isEqualTo(1);
        assertThat(mesAtual.faturamento()).isEqualByComparingTo("95000.00");
        assertThat(serie.get(0).vendas()).isEqualTo(0); // mes mais antigo, sem venda
    }

    @Test
    void estoquePorMarca_agrupaNaoVendidos_ordenadoPorValor() {
        salvarVeiculo("Honda", StatusVeiculo.DISPONIVEL, "100000.00");
        salvarVeiculo("Honda", StatusVeiculo.DISPONIVEL, "120000.00");
        salvarVeiculo("Fiat", StatusVeiculo.DISPONIVEL, "70000.00");

        List<EstoquePorMarca> lista = service.estoquePorMarca();

        assertThat(lista).hasSize(2);
        assertThat(lista.get(0).marca()).isEqualTo("Honda");
        assertThat(lista.get(0).quantidade()).isEqualTo(2);
        assertThat(lista.get(0).valor()).isEqualByComparingTo("220000.00");
    }
}
