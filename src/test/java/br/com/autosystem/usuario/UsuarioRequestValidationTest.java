package br.com.autosystem.usuario;

import br.com.autosystem.usuario.dto.UsuarioRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// Teste puro de Bean Validation (sem subir contexto Spring) — rapido e cobre as regras de campo.
class UsuarioRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setup() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void emailInvalido_geraViolacao() {
        var req = new UsuarioRequest("Ana", "nao-eh-email", "senha123", null);
        assertThat(validator.validate(req))
                .anyMatch(v -> v.getPropertyPath().toString().equals("email"));
    }

    @Test
    void senhaCurta_geraViolacao() {
        var req = new UsuarioRequest("Ana", "ana@exemplo.com", "123", null);
        assertThat(validator.validate(req))
                .anyMatch(v -> v.getPropertyPath().toString().equals("senha"));
    }

    @Test
    void nomeEmBranco_geraViolacao() {
        var req = new UsuarioRequest("   ", "ana@exemplo.com", "senha123", null);
        assertThat(validator.validate(req))
                .anyMatch(v -> v.getPropertyPath().toString().equals("nome"));
    }

    @Test
    void requestValido_naoTemViolacoes() {
        var req = new UsuarioRequest("Ana", "ana@exemplo.com", "senha123", null);
        assertThat(validator.validate(req)).isEmpty();
    }
}
