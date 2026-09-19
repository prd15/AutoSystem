package br.com.autosystem.veiculo;

import br.com.autosystem.veiculo.dto.VeiculoRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class VeiculoRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setup() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private VeiculoRequest base(Integer ano, BigDecimal preco, Integer km, String placa, String marca) {
        return new VeiculoRequest(marca, "Civic", ano, "Prata", km, preco, placa, null);
    }

    @Test
    void requestValido_semViolacoes() {
        var req = base(2021, new BigDecimal("100000.00"), 1000, "ABC1D23", "Honda");
        assertThat(validator.validate(req)).isEmpty();
    }

    @Test
    void placaVazia_ehPermitida() {
        var req = base(2021, new BigDecimal("100000.00"), 1000, "", "Honda");
        assertThat(validator.validate(req)).noneMatch(v -> v.getPropertyPath().toString().equals("placa"));
    }

    @Test
    void marcaVazia_geraViolacao() {
        var req = base(2021, new BigDecimal("100000.00"), 1000, "ABC1D23", "  ");
        assertThat(validator.validate(req)).anyMatch(v -> v.getPropertyPath().toString().equals("marca"));
    }

    @Test
    void anoForaDoIntervalo_geraViolacao() {
        assertThat(validator.validate(base(1800, new BigDecimal("100000.00"), 1000, "ABC1D23", "Honda")))
                .anyMatch(v -> v.getPropertyPath().toString().equals("anoValido"));
        assertThat(validator.validate(base(3000, new BigDecimal("100000.00"), 1000, "ABC1D23", "Honda")))
                .anyMatch(v -> v.getPropertyPath().toString().equals("anoValido"));
    }

    @Test
    void precoZeroOuNegativo_geraViolacao() {
        var req = base(2021, new BigDecimal("0.00"), 1000, "ABC1D23", "Honda");
        assertThat(validator.validate(req)).anyMatch(v -> v.getPropertyPath().toString().equals("preco"));
    }

    @Test
    void quilometragemNegativa_geraViolacao() {
        var req = base(2021, new BigDecimal("100000.00"), -1, "ABC1D23", "Honda");
        assertThat(validator.validate(req)).anyMatch(v -> v.getPropertyPath().toString().equals("quilometragem"));
    }

    @Test
    void placaEmFormatoInvalido_geraViolacao() {
        var req = base(2021, new BigDecimal("100000.00"), 1000, "PLACA!!", "Honda");
        assertThat(validator.validate(req)).anyMatch(v -> v.getPropertyPath().toString().equals("placa"));
    }
}
