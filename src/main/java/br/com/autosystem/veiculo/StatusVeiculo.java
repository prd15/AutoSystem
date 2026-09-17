package br.com.autosystem.veiculo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

// Status do veiculo. No banco e no JSON o valor e minusculo (disponivel/reservado/vendido),
// batendo com o front (store.ts) e com o CHECK da migration. No Java o nome e maiusculo.
public enum StatusVeiculo {
    DISPONIVEL("disponivel"),
    RESERVADO("reservado"),
    VENDIDO("vendido");

    private final String valor;

    StatusVeiculo(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static StatusVeiculo fromValor(String valor) {
        if (valor == null) {
            return null;
        }
        for (StatusVeiculo s : values()) {
            if (s.valor.equalsIgnoreCase(valor) || s.name().equalsIgnoreCase(valor)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Status invalido: " + valor);
    }
}
