package br.com.autosystem.usuario;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Consultas derivadas (Spring Data gera SQL parametrizado — sem risco de SQL Injection).
    Optional<Usuario> findByEmail(String email);

    List<Usuario> findByNomeContainingIgnoreCaseOrderByNomeAsc(String nome);
}
