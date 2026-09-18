package br.com.autosystem.venda;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

// Forma de pagamento da venda. No JSON o valor e minusculo (avista/financiamento/consorcio),
// batendo com o front (store.ts: TipoPagamentoVenda). No Java o nome e maiusculo.
public enum FormaPagamentoVenda {
    AVISTA("avista"),
    FINANCIAMENTO("financiamento"),
    CONSORCIO("consorcio");

    private final String valor;

    FormaPagamentoVenda(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static FormaPagamentoVenda fromValor(String valor) {
        if (valor == null) {
            return null;
        }
        for (FormaPagamentoVenda f : values()) {
            if (f.valor.equalsIgnoreCase(valor) || f.name().equalsIgnoreCase(valor)) {
                return f;
            }
        }
        throw new IllegalArgumentException("Forma de pagamento invalida: " + valor);
    }
}
