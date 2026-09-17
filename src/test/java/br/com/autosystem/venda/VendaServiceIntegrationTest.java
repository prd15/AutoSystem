package br.com.autosystem.venda;

import br.com.autosystem.IntegracaoTest;
import br.com.autosystem.cliente.Cliente;
import br.com.autosystem.cliente.ClienteRepository;
import br.com.autosystem.commons.exception.BusinessException;
import br.com.autosystem.veiculo.StatusVeiculo;
import br.com.autosystem.veiculo.Veiculo;
import br.com.autosystem.veiculo.VeiculoRepository;
import br.com.autosystem.venda.dto.VendaRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Valida a transacao de venda de ponta a ponta no Postgres real.
class VendaServiceIntegrationTest extends IntegracaoTest {

    @Autowired
    VendaService vendaService;
    @Autowired
    VeiculoRepository veiculoRepository;
    @Autowired
    ClienteRepository clienteRepository;
    @Autowired
    VendaRepository vendaRepository;

    private Long novoVeiculo() {
        Veiculo v = new Veiculo();
        v.setMarca("Honda");
        v.setModelo("Civic");
        v.setAno(2021);
        v.setCor("Prata");
        v.setQuilometragem(1000);
        v.setPreco(new BigDecimal("100000.00"));
        v.setStatus(StatusVeiculo.DISPONIVEL);
        return veiculoRepository.save(v).getId();
    }

    private Long novoCliente() {
        Cliente c = new Cliente();
        c.setNome("Ana Souza");
        c.setCpf("52998224725");
        c.setTelefone("34999990000");
        return clienteRepository.save(c).getId();
    }

    @Test
    void registrar_persisteVenda_eMudaVeiculoParaVendido() {
        Long veiculoId = novoVeiculo();
        Long clienteId = novoCliente();

        var resp = vendaService.registrar(
                new VendaRequest(veiculoId, clienteId, "Alan Ferreira", new BigDecimal("95000.00"), LocalDate.now()));

        assertThat(resp.id()).isNotNull();
        assertThat(resp.diferenca()).isEqualByComparingTo("5000.00");
        assertThat(resp.veiculo().marca()).isEqualTo("Honda");
        assertThat(resp.cliente().nome()).isEqualTo("Ana Souza");
        assertThat(veiculoRepository.findById(veiculoId).orElseThrow().getStatus())
                .isEqualTo(StatusVeiculo.VENDIDO);
        assertThat(vendaRepository.count()).isEqualTo(1);
    }

    @Test
    void registrar_veiculoJaVendido_naoRegistraSegundaVenda() {
        Long veiculoId = novoVeiculo();
        Long clienteId = novoCliente();
        vendaService.registrar(
                new VendaRequest(veiculoId, clienteId, "Alan", new BigDecimal("95000.00"), LocalDate.now()));

        assertThatThrownBy(() -> vendaService.registrar(
                new VendaRequest(veiculoId, clienteId, "Bruna", new BigDecimal("90000.00"), LocalDate.now())))
                .isInstanceOf(BusinessException.class);

        assertThat(vendaRepository.count()).isEqualTo(1);
    }
}
