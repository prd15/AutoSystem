package br.com.autosystem.veiculo.dto;

import br.com.autosystem.veiculo.StatusVeiculo;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Year;

public record VeiculoRequest(

        @NotBlank(message = "A marca e obrigatoria")
        @Size(max = 50, message = "A marca deve ter no maximo 50 caracteres")
        String marca,

        @NotBlank(message = "O modelo e obrigatorio")
        @Size(max = 50, message = "O modelo deve ter no maximo 50 caracteres")
        String modelo,

        @NotNull(message = "O ano e obrigatorio")
        Integer ano,

        @NotBlank(message = "A cor e obrigatoria")
        @Size(max = 30, message = "A cor deve ter no maximo 30 caracteres")
        String cor,

        @NotNull(message = "A quilometragem e obrigatoria")
        @PositiveOrZero(message = "A quilometragem deve ser igual ou maior que zero")
        Integer quilometragem,

        @NotNull(message = "O preco e obrigatorio")
        @DecimalMin(value = "0.01", message = "O preco deve ser maior que zero")
        BigDecimal preco,

        // Opcional; aceita minusculo/maiusculo. Padrao antigo (ABC1234) e Mercosul (ABC1D23).
        @Pattern(regexp = "^$|^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$",
                message = "Placa invalida (use ABC1D23 ou ABC1234)")
        String placa,

        // Opcional; ausente vira DISPONIVEL no servico.
        StatusVeiculo status
) {

    // Limite superior do ano (ano atual + 1) nao cabe em anotacao estatica.
    @AssertTrue(message = "O ano deve estar entre 1950 e o ano seguinte")
    public boolean isAnoValido() {
        return ano == null || (ano >= 1950 && ano <= Year.now().getValue() + 1);
    }
}
