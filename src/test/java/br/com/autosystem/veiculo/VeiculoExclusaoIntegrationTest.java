package br.com.autosystem.veiculo;

import br.com.autosystem.IntegracaoTest;
import br.com.autosystem.cliente.Cliente;
import br.com.autosystem.cliente.ClienteRepository;
import br.com.autosystem.venda.FormaPagamentoVenda;
import br.com.autosystem.venda.VendaService;
import br.com.autosystem.venda.dto.VendaRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Exercita DELETE /api/veiculos/{id} de ponta a ponta (controller -> service -> handler -> JSON)
// contra o Postgres real, confirmando o 409 com o bloco 'venda' que o front consome (docs/04).
@AutoConfigureMockMvc
class VeiculoExclusaoIntegrationTest extends IntegracaoTest {

    @Autowired
    MockMvc mockMvc;
    @Autowired
    VeiculoRepository veiculoRepository;
    @Autowired
    ClienteRepository clienteRepository;
    @Autowired
    VendaService vendaService;

    @Test
    void excluir_veiculoComVenda_retorna409_comDadosDaVenda_eNaoRemove() throws Exception {
        Long veiculoId = novoVeiculo();
        Long clienteId = novoCliente();
        vendaService.registrar(new VendaRequest(
                veiculoId, clienteId, "Alan Ferreira", new BigDecimal("95000.00"),
                LocalDate.of(2026, 9, 3), FormaPagamentoVenda.AVISTA));

        mockMvc.perform(delete("/api/veiculos/{id}", veiculoId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Este veiculo possui uma venda registrada em 03/09/2026."))
                .andExpect(jsonPath("$.venda.id").isNumber())
                .andExpect(jsonPath("$.venda.data_venda").value("2026-09-03"))
                .andExpect(jsonPath("$.venda.valor_venda").exists())
                .andExpect(jsonPath("$.venda.cliente").value("Ana Souza"));

        assertThat(veiculoRepository.existsById(veiculoId)).isTrue();
    }

    @Test
    void excluir_veiculoSemVenda_retorna204_eRemove() throws Exception {
        Long veiculoId = novoVeiculo();

        mockMvc.perform(delete("/api/veiculos/{id}", veiculoId))
                .andExpect(status().isNoContent());

        assertThat(veiculoRepository.existsById(veiculoId)).isFalse();
    }

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
}
