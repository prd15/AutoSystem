package br.com.autosystem.venda.dto;

import br.com.autosystem.venda.FormaPagamentoVenda;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

// JSON em snake_case: veiculo_id, cliente_id, valor_venda, data_venda, forma_pagamento.
public record VendaRequest(

        @NotNull(message = "O veiculo e obrigatorio")
        Long veiculoId,

        @NotNull(message = "O cliente e obrigatorio")
        Long clienteId,

        @NotBlank(message = "O vendedor e obrigatorio")
        @Size(max = 100, message = "O vendedor deve ter no maximo 100 caracteres")
        String vendedor,

        @NotNull(message = "O valor da venda e obrigatorio")
        @DecimalMin(value = "0.01", message = "O valor da venda deve ser maior que zero")
        BigDecimal valorVenda,

        @NotNull(message = "A data da venda e obrigatoria")
        @PastOrPresent(message = "A data da venda nao pode ser futura")
        LocalDate dataVenda,

        @NotNull(message = "A forma de pagamento e obrigatoria")
        FormaPagamentoVenda formaPagamento
) {
}
