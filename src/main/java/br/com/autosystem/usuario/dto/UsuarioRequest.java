package br.com.autosystem.usuario.dto;

import br.com.autosystem.usuario.Perfil;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Dados de entrada do cadastro. Validacao de formato no front e AQUI (back = fonte da verdade).
public record UsuarioRequest(

        @NotBlank(message = "O nome e obrigatorio")
        @Size(max = 100, message = "O nome deve ter no maximo 100 caracteres")
        String nome,

        @NotBlank(message = "O e-mail e obrigatorio")
        @Email(message = "E-mail em formato invalido")
        @Size(max = 150, message = "O e-mail deve ter no maximo 150 caracteres")
        String email,

        @NotBlank(message = "A senha e obrigatoria")
        @Size(min = 6, max = 72, message = "A senha deve ter entre 6 e 72 caracteres")
        String senha,

        // Opcional: quando ausente, o servico assume VENDEDOR.
        Perfil perfil
) {
}
