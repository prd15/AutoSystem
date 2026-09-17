package br.com.autosystem.veiculo;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

// Monta o WHERE dinamico combinando os filtros opcionais do estoque
// (busca por marca/modelo/placa, status, marca exata, faixa de preco).
public final class VeiculoSpecification {

    private VeiculoSpecification() {
    }

    public static Specification<Veiculo> comFiltros(String busca, StatusVeiculo status, String marca,
                                                    BigDecimal precoMin, BigDecimal precoMax) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();

            if (busca != null && !busca.isBlank()) {
                String like = "%" + busca.trim().toLowerCase() + "%";
                predicados.add(cb.or(
                        cb.like(cb.lower(root.get("marca")), like),
                        cb.like(cb.lower(root.get("modelo")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("placa"), "")), like)
                ));
            }
            if (status != null) {
                predicados.add(cb.equal(root.get("status"), status));
            }
            if (marca != null && !marca.isBlank()) {
                predicados.add(cb.equal(root.get("marca"), marca.trim()));
            }
            if (precoMin != null) {
                predicados.add(cb.greaterThanOrEqualTo(root.get("preco"), precoMin));
            }
            if (precoMax != null) {
                predicados.add(cb.lessThanOrEqualTo(root.get("preco"), precoMax));
            }

            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
