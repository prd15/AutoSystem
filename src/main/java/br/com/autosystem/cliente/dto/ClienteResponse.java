package br.com.autosystem.cliente.dto;

import br.com.autosystem.cliente.Cliente;

import java.time.Instant;

// Saida em snake_case. Campos derivados (compras, total gasto, ultima compra) entram
// junto com a feature de Venda (dependem do relacionamento cliente 1--N venda).
public record ClienteResponse(
        Long id,
        String nome,
        String cpf,
        String telefone,
        String email,
        Instant criadoEm
) {
    public static ClienteResponse from(Cliente c) {
        return new ClienteResponse(
                c.getId(), c.getNome(), c.getCpf(), c.getTelefone(), c.getEmail(), c.getCriadoEm());
    }
}
