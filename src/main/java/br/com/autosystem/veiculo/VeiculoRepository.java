package br.com.autosystem.veiculo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface VeiculoRepository
        extends JpaRepository<Veiculo, Long>, JpaSpecificationExecutor<Veiculo> {

    Optional<Veiculo> findByPlaca(String placa);

    long countByStatus(StatusVeiculo status);

    @Query("select distinct v.marca from Veiculo v order by v.marca")
    List<String> buscarMarcas();

    // Valor imobilizado em estoque = soma dos precos que NAO estao vendidos.
    @Query("select coalesce(sum(v.preco), 0) from Veiculo v where v.status <> :status")
    BigDecimal somarPrecoExcetoStatus(@Param("status") StatusVeiculo status);
}
