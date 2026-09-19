package br.com.autosystem.cliente;

import br.com.autosystem.IntegracaoTest;
import br.com.autosystem.cliente.dto.ClienteRequest;
import br.com.autosystem.cliente.dto.ClienteResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Prova, de ponta a ponta, que a busca por CPF funciona mesmo digitado com mascara
// (o servico normaliza o termo antes de consultar o repositorio).
class ClienteServiceIntegrationTest extends IntegracaoTest {

    @Autowired
    ClienteService service;

    @Test
    void listar_porCpfComMascara_encontraOCliente() {
        service.cadastrar(new ClienteRequest("Ana Souza", "482.113.900-27", "(34) 99999-0000", "ana@x.com"));

        List<ClienteResponse> comMascara = service.listar("482.113.900-27");
        List<ClienteResponse> soDigitos = service.listar("48211390027");

        assertThat(comMascara).hasSize(1);
        assertThat(comMascara.get(0).nome()).isEqualTo("Ana Souza");
        assertThat(soDigitos).hasSize(1);
    }
}
