package br.com.autosystem.usuario.dto;

import br.com.autosystem.usuario.Perfil;
import br.com.autosystem.usuario.Usuario;

import java.time.Instant;

// Dados de saida. Nunca inclui a senha. JSON sai em snake_case (config global).
public record UsuarioResponse(
        Long id,
        String nome,
        String email,
        Perfil perfil,
        Boolean ativo,
        Instant criadoEm,
        Instant atualizadoEm
) {
    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(
                u.getId(),
                u.getNome(),
                u.getEmail(),
                u.getPerfil(),
                u.getAtivo(),
                u.getCriadoEm(),
                u.getAtualizadoEm()
        );
    }
}
