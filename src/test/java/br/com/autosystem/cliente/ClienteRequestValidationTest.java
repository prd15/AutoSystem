package br.com.autosystem.cliente;

import br.com.autosystem.cliente.dto.ClienteRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ClienteRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setup() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void cpfInvalido_geraViolacao() {
        var req = new ClienteRequest("Ana", "111.111.111-11", "(34) 99999-0001", "ana@x.com");
        assertThat(validator.validate(req)).anyMatch(v -> v.getPropertyPath().toString().equals("cpf"));
    }

    @Test
    void nomeVazio_geraViolacao() {
        var req = new ClienteRequest("   ", "529.982.247-25", "(34) 99999-0001", "ana@x.com");
        assertThat(validator.validate(req)).anyMatch(v -> v.getPropertyPath().toString().equals("nome"));
    }

    @Test
    void emailInvalido_geraViolacao() {
        var req = new ClienteRequest("Ana", "529.982.247-25", "(34) 99999-0001", "nao-eh-email");
        assertThat(validator.validate(req)).anyMatch(v -> v.getPropertyPath().toString().equals("email"));
    }

    @Test
    void requestValido_semViolacoes() {
        var req = new ClienteRequest("Ana", "529.982.247-25", "(34) 99999-0001", "ana@x.com");
        assertThat(validator.validate(req)).isEmpty();
    }
}
