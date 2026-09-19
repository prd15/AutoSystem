package br.com.autosystem.veiculo.dto;

import java.math.BigDecimal;
import java.util.Map;

// Resumo do estoque (evita 2a chamada do front): valor imobilizado e contagem por status.
public record VeiculoResumo(
        BigDecimal valorEmEstoque,
        Map<String, Long> porStatus
) {
}
