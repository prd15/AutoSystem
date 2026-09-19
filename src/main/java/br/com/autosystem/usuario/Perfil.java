package br.com.autosystem.usuario;

// Perfil de acesso do usuario. Mapeado como VARCHAR + CHECK no banco (@Enumerated(STRING)).
public enum Perfil {
    ADMIN,
    GERENTE,
    VENDEDOR
}
