package br.com.autosystem.veiculo;

import br.com.autosystem.commons.exception.BusinessException;
import br.com.autosystem.commons.exception.EntityNotFoundException;
import br.com.autosystem.veiculo.dto.VeiculoRequest;
import br.com.autosystem.veiculo.dto.VeiculoResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VeiculoServiceTest {

    @Mock
    VeiculoRepository repository;

    VeiculoService service;

    @BeforeEach
    void init() {
        Clock clock = Clock.fixed(Instant.parse("2026-09-16T12:00:00Z"), ZoneOffset.UTC);
        service = new VeiculoService(repository, clock);
    }

    private VeiculoRequest req(String placa) {
        return new VeiculoRequest("Honda", "Civic EXL", 2021, "Prata", 1000,
                new BigDecimal("100000.00"), placa, null);
    }

    private Veiculo veiculo(String marca, String modelo, StatusVeiculo status) {
        Veiculo v = new Veiculo();
        v.setMarca(marca);
        v.setModelo(modelo);
        v.setAno(2021);
        v.setCor("Prata");
        v.setQuilometragem(1000);
        v.setPreco(new BigDecimal("100000.00"));
        v.setStatus(status);
        return v;
    }

    @Test
    void criar_normalizaPlacaParaMaiusculo_eDefineDisponivelPorPadrao() {
        when(repository.findByPlaca("ABC1D23")).thenReturn(Optional.empty());
        when(repository.save(any(Veiculo.class))).thenAnswer(inv -> inv.getArgument(0));

        service.criar(req("abc1d23"));

        ArgumentCaptor<Veiculo> captor = ArgumentCaptor.forClass(Veiculo.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getPlaca()).isEqualTo("ABC1D23");
        assertThat(captor.getValue().getStatus()).isEqualTo(StatusVeiculo.DISPONIVEL);
    }

    @Test
    void criar_comPlacaDuplicada_lancaBusinessException_eNaoSalva() {
        when(repository.findByPlaca("ABC1D23")).thenReturn(Optional.of(new Veiculo()));

        assertThatThrownBy(() -> service.criar(req("ABC1D23")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Placa ja cadastrada");

        verify(repository, never()).save(any());
    }

    @Test
    void listarVendaveis_consultaStatusDiferenteDeVendido_eMapeiaParaResponse() {
        when(repository.findByStatusNotOrderByMarcaAscModeloAsc(StatusVeiculo.VENDIDO))
                .thenReturn(List.of(
                        veiculo("Honda", "Civic", StatusVeiculo.DISPONIVEL),
                        veiculo("Toyota", "Corolla", StatusVeiculo.RESERVADO)));

        List<VeiculoResponse> vendaveis = service.listarVendaveis();

        assertThat(vendaveis).extracting(VeiculoResponse::marca).containsExactly("Honda", "Toyota");
        assertThat(vendaveis).extracting(VeiculoResponse::status)
                .doesNotContain(StatusVeiculo.VENDIDO);
    }

    @Test
    void excluir_inexistente_lancaEntityNotFound() {
        when(repository.existsById(99L)).thenReturn(false);
        assertThatThrownBy(() -> service.excluir(99L)).isInstanceOf(EntityNotFoundException.class);
        verify(repository, never()).deleteById(any());
    }

    @Test
    void buscarPorId_inexistente_lancaEntityNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.buscarPorId(99L)).isInstanceOf(EntityNotFoundException.class);
    }
}
