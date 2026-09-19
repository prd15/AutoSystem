package br.com.autosystem.venda;

import br.com.autosystem.venda.dto.VendaRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class VendaRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setup() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void dataFutura_geraViolacao() {
        var req = new VendaRequest(1L, 2L, "Alan", new BigDecimal("95000.00"),
                LocalDate.now().plusDays(1), FormaPagamentoVenda.AVISTA);
        assertThat(validator.validate(req)).anyMatch(v -> v.getPropertyPath().toString().equals("dataVenda"));
    }

    @Test
    void valorZeroOuNegativo_geraViolacao() {
        var req = new VendaRequest(1L, 2L, "Alan", new BigDecimal("0.00"),
                LocalDate.now(), FormaPagamentoVenda.AVISTA);
        assertThat(validator.validate(req)).anyMatch(v -> v.getPropertyPath().toString().equals("valorVenda"));
    }

    @Test
    void veiculoIdNulo_geraViolacao() {
        var req = new VendaRequest(null, 2L, "Alan", new BigDecimal("95000.00"),
                LocalDate.now(), FormaPagamentoVenda.AVISTA);
        assertThat(validator.validate(req)).anyMatch(v -> v.getPropertyPath().toString().equals("veiculoId"));
    }

    @Test
    void formaPagamentoNula_geraViolacao() {
        var req = new VendaRequest(1L, 2L, "Alan", new BigDecimal("95000.00"), LocalDate.now(), null);
        assertThat(validator.validate(req)).anyMatch(v -> v.getPropertyPath().toString().equals("formaPagamento"));
    }

    @Test
    void requestValido_semViolacoes() {
        var req = new VendaRequest(1L, 2L, "Alan", new BigDecimal("95000.00"),
                LocalDate.now(), FormaPagamentoVenda.AVISTA);
        assertThat(validator.validate(req)).isEmpty();
    }
}
