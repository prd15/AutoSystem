package br.com.autosystem.veiculo.dto;

import java.util.List;

// Envelope da listagem, no formato que o front espera: { itens, total, resumo }.
public record VeiculoListaResponse(
        List<VeiculoResponse> itens,
        long total,
        VeiculoResumo resumo
) {
}
