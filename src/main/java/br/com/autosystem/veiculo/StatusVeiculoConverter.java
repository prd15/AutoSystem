package br.com.autosystem.veiculo;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

// Grava o status em minusculo no banco (coluna VARCHAR + CHECK) e reconverte para o enum.
@Converter
public class StatusVeiculoConverter implements AttributeConverter<StatusVeiculo, String> {

    @Override
    public String convertToDatabaseColumn(StatusVeiculo status) {
        return status == null ? null : status.getValor();
    }

    @Override
    public StatusVeiculo convertToEntityAttribute(String valor) {
        return valor == null ? null : StatusVeiculo.fromValor(valor);
    }
}
