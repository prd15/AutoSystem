package br.com.autosystem.veiculo.dto;

import br.com.autosystem.veiculo.StatusVeiculo;
import br.com.autosystem.veiculo.Veiculo;

import java.math.BigDecimal;
import java.time.Instant;

// Saida em snake_case (config global). status sai minusculo (via @JsonValue do enum).
public record VeiculoResponse(
        Long id,
        String marca,
        String modelo,
        Integer ano,
        String cor,
        Integer quilometragem,
        BigDecimal preco,
        String placa,
        StatusVeiculo status,
        Instant criadoEm,
        Instant atualizadoEm,
        long diasEmEstoque
) {
    public static VeiculoResponse from(Veiculo v, long diasEmEstoque) {
        return new VeiculoResponse(
                v.getId(), v.getMarca(), v.getModelo(), v.getAno(), v.getCor(),
                v.getQuilometragem(), v.getPreco(), v.getPlaca(), v.getStatus(),
                v.getCriadoEm(), v.getAtualizadoEm(), diasEmEstoque
        );
    }
}
