package br.com.autosystem.cliente;

import br.com.autosystem.IntegracaoTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

class ClienteRepositoryIntegrationTest extends IntegracaoTest {

    @Autowired
    ClienteRepository repository;

    private Cliente cliente(String nome, String cpf, String email) {
        Cliente c = new Cliente();
        c.setNome(nome);
        c.setCpf(cpf);
        c.setTelefone("34999990000");
        c.setEmail(email);
        return c;
    }

    @Test
    void findByCpf_encontraOClienteCerto() {
        repository.save(cliente("Ana Souza", "52998224725", "ana@x.com"));
        assertThat(repository.findByCpf("52998224725")).isPresent();
        assertThat(repository.findByCpf("00000000000")).isEmpty();
    }

    @Test
    void buscar_casaPorNomeEmailOuCpf() {
        repository.save(cliente("Ana Souza", "11111111111", "ana@x.com"));
        repository.save(cliente("Bruno Lima", "22222222222", "bruno@y.com"));

        assertThat(repository.buscar("ana")).hasSize(1);
        assertThat(repository.buscar("bruno@y")).hasSize(1);
        assertThat(repository.buscar("2222")).hasSize(1);
        assertThat(repository.buscar("souza")).hasSize(1);
    }
}
