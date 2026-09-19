package br.com.autosystem.indicador.dto;

import java.math.BigDecimal;

// Valor imobilizado por marca (apenas veiculos nao vendidos).
public record EstoquePorMarca(
        String marca,
        long quantidade,
        BigDecimal valor
) {
}
