package br.com.autosystem.venda;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface VendaRepository extends JpaRepository<Venda, Long> {

    // @EntityGraph carrega veiculo+cliente na mesma consulta (evita N+1).
    @EntityGraph(attributePaths = {"veiculo", "cliente"})
    List<Venda> findByDataVendaBetweenOrderByDataVendaDescIdDesc(LocalDate de, LocalDate ate);

    @EntityGraph(attributePaths = {"veiculo", "cliente"})
    List<Venda> findAllByOrderByDataVendaDescIdDesc();

    @EntityGraph(attributePaths = {"veiculo", "cliente"})
    Optional<Venda> findById(Long id);

    boolean existsByVeiculoId(Long veiculoId);
}
