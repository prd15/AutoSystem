package br.com.autosystem.cliente;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByCpf(String cpf);

    // Busca por nome, e-mail ou CPF (parametrizada — sem SQL Injection). Ordena por nome.
    @Query("""
            select c from Cliente c
            where lower(c.nome) like lower(concat('%', :termo, '%'))
               or lower(coalesce(c.email, '')) like lower(concat('%', :termo, '%'))
               or c.cpf like concat('%', :termo, '%')
            order by c.nome
            """)
    List<Cliente> buscar(@Param("termo") String termo);
}
