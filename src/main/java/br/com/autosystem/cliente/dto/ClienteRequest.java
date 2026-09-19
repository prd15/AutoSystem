package br.com.autosystem.cliente.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CPF;

// @CPF valida o digito verificador (aceita com ou sem mascara); o servico guarda so os digitos.
public record ClienteRequest(

        @NotBlank(message = "O nome e obrigatorio")
        @Size(max = 100, message = "O nome deve ter no maximo 100 caracteres")
        String nome,

        @NotBlank(message = "O CPF e obrigatorio")
        @CPF(message = "CPF invalido")
        String cpf,

        @NotBlank(message = "O telefone e obrigatorio")
        @Size(max = 20, message = "O telefone deve ter no maximo 20 caracteres")
        String telefone,

        @Email(message = "E-mail em formato invalido")
        @Size(max = 100, message = "O e-mail deve ter no maximo 100 caracteres")
        String email
) {
}
