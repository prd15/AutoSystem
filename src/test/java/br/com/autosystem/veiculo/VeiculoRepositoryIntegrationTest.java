package br.com.autosystem.veiculo;

import br.com.autosystem.IntegracaoTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Testa os filtros (Specification), o conversor de status e as agregacoes contra um Postgres real.
class VeiculoRepositoryIntegrationTest extends IntegracaoTest {

    @Autowired
    VeiculoRepository repository;

    private Veiculo veiculo(String marca, String modelo, StatusVeiculo status, String preco, String placa) {
        Veiculo v = new Veiculo();
        v.setMarca(marca);
        v.setModelo(modelo);
        v.setAno(2022);
        v.setCor("Prata");
        v.setQuilometragem(1000);
        v.setPreco(new BigDecimal(preco));
        v.setPlaca(placa);
        v.setStatus(status);
        return v;
    }

    @Test
    void filtraPorStatus_contaPorStatus_eSomaValorEmEstoque() {
        repository.save(veiculo("Honda", "Civic", StatusVeiculo.DISPONIVEL, "100000.00", "AAA1A11"));
        repository.save(veiculo("Toyota", "Corolla", StatusVeiculo.RESERVADO, "120000.00", "BBB2B22"));
        repository.save(veiculo("Fiat", "Argo", StatusVeiculo.VENDIDO, "70000.00", "CCC3C33"));

        List<Veiculo> disponiveis = repository.findAll(
                VeiculoSpecification.comFiltros(null, StatusVeiculo.DISPONIVEL, null, null, null));
        assertThat(disponiveis).hasSize(1);
        assertThat(disponiveis.get(0).getStatus()).isEqualTo(StatusVeiculo.DISPONIVEL);

        assertThat(repository.countByStatus(StatusVeiculo.VENDIDO)).isEqualTo(1);
        assertThat(repository.somarPrecoExcetoStatus(StatusVeiculo.VENDIDO))
                .isEqualByComparingTo("220000.00");
    }

    @Test
    void buscaPorTexto_casaMarcaModeloOuPlaca_semDistincaoDeCaixa() {
        repository.save(veiculo("Honda", "Civic", StatusVeiculo.DISPONIVEL, "100000.00", "HND1A11"));
        repository.save(veiculo("Toyota", "Corolla", StatusVeiculo.DISPONIVEL, "120000.00", "TYT2B22"));

        assertThat(repository.findAll(VeiculoSpecification.comFiltros("hond", null, null, null, null)))
                .hasSize(1);
        assertThat(repository.findAll(VeiculoSpecification.comFiltros("corolla", null, null, null, null)))
                .hasSize(1);
        assertThat(repository.findAll(VeiculoSpecification.comFiltros("tyt2", null, null, null, null)))
                .hasSize(1);
    }

    @Test
    void faixaDePreco_filtraCorretamente() {
        repository.save(veiculo("Honda", "Civic", StatusVeiculo.DISPONIVEL, "80000.00", "AAA1A11"));
        repository.save(veiculo("Toyota", "Corolla", StatusVeiculo.DISPONIVEL, "150000.00", "BBB2B22"));

        var filtrados = repository.findAll(VeiculoSpecification.comFiltros(
                null, null, null, new BigDecimal("100000"), new BigDecimal("200000")));
        assertThat(filtrados).hasSize(1);
        assertThat(filtrados.get(0).getMarca()).isEqualTo("Toyota");
    }

    @Test
    void placaUnicaParcial_permiteVariosVeiculosSemPlaca() {
        repository.save(veiculo("Honda", "Civic", StatusVeiculo.DISPONIVEL, "100000.00", null));
        repository.save(veiculo("Toyota", "Corolla", StatusVeiculo.DISPONIVEL, "120000.00", null));
        assertThat(repository.count()).isEqualTo(2);
    }

    @Test
    void vendaveis_excluiVendidos_eOrdenaPorMarcaEModelo() {
        repository.save(veiculo("Toyota", "Corolla", StatusVeiculo.DISPONIVEL, "120000.00", "TYT2B22"));
        repository.save(veiculo("Fiat", "Argo", StatusVeiculo.VENDIDO, "70000.00", "FIA3C33"));
        repository.save(veiculo("Honda", "Civic", StatusVeiculo.RESERVADO, "100000.00", "HND1A11"));

        List<Veiculo> vendaveis = repository.findByStatusNotOrderByMarcaAscModeloAsc(StatusVeiculo.VENDIDO);

        assertThat(vendaveis).extracting(Veiculo::getMarca).containsExactly("Honda", "Toyota");
        assertThat(vendaveis).noneMatch(v -> v.getStatus() == StatusVeiculo.VENDIDO);
    }
}
