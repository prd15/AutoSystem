package br.com.autosystem.venda.dto;

import br.com.autosystem.venda.Venda;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

// Saida do historico de vendas: traz veiculo e cliente embutidos (evita N+1 no front)
// e a diferenca (preco de tabela - valor negociado).
public record VendaResponse(
        Long id,
        LocalDate dataVenda,
        String vendedor,
        BigDecimal valorVenda,
        BigDecimal diferenca,
        VeiculoBreve veiculo,
        ClienteBreve cliente,
        Instant criadoEm
) {

    public record VeiculoBreve(Long id, String marca, String modelo, Integer ano, String placa, BigDecimal preco) {
    }

    public record ClienteBreve(Long id, String nome) {
    }

    public static VendaResponse from(Venda v) {
        BigDecimal diferenca = v.getVeiculo().getPreco().subtract(v.getValorVenda());
        return new VendaResponse(
                v.getId(),
                v.getDataVenda(),
                v.getVendedor(),
                v.getValorVenda(),
                diferenca,
                new VeiculoBreve(
                        v.getVeiculo().getId(),
                        v.getVeiculo().getMarca(),
                        v.getVeiculo().getModelo(),
                        v.getVeiculo().getAno(),
                        v.getVeiculo().getPlaca(),
                        v.getVeiculo().getPreco()),
                new ClienteBreve(v.getCliente().getId(), v.getCliente().getNome()),
                v.getCriadoEm()
        );
    }
}
