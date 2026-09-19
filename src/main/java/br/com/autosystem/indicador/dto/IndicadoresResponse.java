package br.com.autosystem.indicador.dto;

import java.math.BigDecimal;

// Os 8 numeros da tela gerencial (JSON em snake_case). Vendas/faturamento comparam com o mes anterior.
public record IndicadoresResponse(
        long veiculosEmEstoque,
        long disponiveis,
        long reservados,
        BigDecimal valorEstoque,
        long vendasNoMes,
        long vendasMesAnterior,
        BigDecimal faturamentoMes,
        BigDecimal faturamentoMesAnterior
) {
}
