package br.com.autosystem.indicador.dto;

import java.math.BigDecimal;

// Um ponto da serie mensal (meses sem venda aparecem com zero).
public record FaturamentoMensal(
        String mes,
        BigDecimal faturamento,
        long vendas
) {
}
