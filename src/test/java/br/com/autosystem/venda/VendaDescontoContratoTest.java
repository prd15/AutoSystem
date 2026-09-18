package br.com.autosystem.venda;

import br.com.autosystem.IntegracaoTest;
import br.com.autosystem.cliente.Cliente;
import br.com.autosystem.cliente.ClienteRepository;
import br.com.autosystem.veiculo.StatusVeiculo;
import br.com.autosystem.veiculo.Veiculo;
import br.com.autosystem.veiculo.VeiculoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Contrato HTTP do POST /api/vendas quanto ao desconto (controller -> service -> handler -> JSON)
// no Postgres real: status 422, formato { erro, campos } com a chave em snake_case, data yyyy-mm-dd.
@AutoConfigureMockMvc
class VendaDescontoContratoTest extends IntegracaoTest {

    @Autowired
    MockMvc mockMvc;
    @Autowired
    VeiculoRepository veiculoRepository;
    @Autowired
    ClienteRepository clienteRepository;

    private Long veiculoDe100k() {
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

    private String corpo(Long veiculoId, Long clienteId, String valorVenda, String forma) {
        return """
                {"veiculo_id":%d,"cliente_id":%d,"vendedor":"Alan Ferreira",\
                "valor_venda":%s,"data_venda":"2026-09-10","forma_pagamento":"%s"}"""
                .formatted(veiculoId, clienteId, valorVenda, forma);
    }

    @Test
    void descontoEmFormaNaoAVista_retorna422_comCampoValorVendaEmSnakeCase() throws Exception {
        Long veiculoId = veiculoDe100k();
        Long clienteId = novoCliente();

        mockMvc.perform(post("/api/vendas").contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(veiculoId, clienteId, "95000.00", "financiamento")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.erro").exists())
                .andExpect(jsonPath("$.campos.valor_venda").value("Desconto é permitido somente em vendas à vista."));
    }

    @Test
    void descontoAcimaDe10PorCento_retorna422() throws Exception {
        Long veiculoId = veiculoDe100k();
        Long clienteId = novoCliente();

        mockMvc.perform(post("/api/vendas").contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(veiculoId, clienteId, "85000.00", "avista")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.campos.valor_venda")
                        .value("O desconto de 15,00% ultrapassa o limite permitido de 10,00%."));
    }

    @Test
    void vendaAVistaDentroDoLimite_retorna201_comCamposSnakeCase_eDataIso() throws Exception {
        Long veiculoId = veiculoDe100k();
        Long clienteId = novoCliente();

        mockMvc.perform(post("/api/vendas").contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(veiculoId, clienteId, "95000.00", "avista")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.valor_venda").exists())
                .andExpect(jsonPath("$.data_venda").value("2026-09-10"));
    }
}
