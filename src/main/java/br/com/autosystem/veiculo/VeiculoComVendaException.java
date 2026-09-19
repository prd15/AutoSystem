package br.com.autosystem.veiculo;

import br.com.autosystem.commons.exception.BusinessException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

// Exclusao bloqueada: o veiculo tem uma venda registrada. Carrega os dados da venda para o
// GlobalExceptionHandler devolver no corpo do 409 (contrato docs/04), que o front usa para
// montar o dialogo de bloqueio.
public class VeiculoComVendaException extends BusinessException {

    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final VendaVinculada venda;

    public VeiculoComVendaException(Long id, LocalDate dataVenda, BigDecimal valorVenda, String cliente) {
        super("Este veiculo possui uma venda registrada em " + dataVenda.format(DATA_BR) + ".");
        this.venda = new VendaVinculada(id, dataVenda, valorVenda, cliente);
    }

    public VendaVinculada getVenda() {
        return venda;
    }

    // Bloco 'venda' do corpo do 409 (serializado em snake_case pela config global do Jackson).
    public record VendaVinculada(Long id, LocalDate dataVenda, BigDecimal valorVenda, String cliente) {
    }
}
