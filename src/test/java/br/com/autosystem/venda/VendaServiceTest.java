package br.com.autosystem.venda;

import br.com.autosystem.cliente.Cliente;
import br.com.autosystem.cliente.ClienteRepository;
import br.com.autosystem.commons.exception.BusinessException;
import br.com.autosystem.commons.exception.EntityNotFoundException;
import br.com.autosystem.veiculo.StatusVeiculo;
import br.com.autosystem.veiculo.Veiculo;
import br.com.autosystem.veiculo.VeiculoRepository;
import br.com.autosystem.venda.dto.VendaRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VendaServiceTest {

    @Mock
    VendaRepository vendaRepository;
    @Mock
    VeiculoRepository veiculoRepository;
    @Mock
    ClienteRepository clienteRepository;
    @InjectMocks
    VendaService service;

    private Veiculo veiculo(StatusVeiculo status) {
        Veiculo v = new Veiculo();
        v.setId(1L);
        v.setMarca("Honda");
        v.setModelo("Civic");
        v.setAno(2021);
        v.setCor("Prata");
        v.setQuilometragem(1000);
        v.setPreco(new BigDecimal("100000.00"));
        v.setStatus(status);
        return v;
    }

    private Cliente cliente() {
        Cliente c = new Cliente();
        c.setId(2L);
        c.setNome("Ana Souza");
        c.setCpf("52998224725");
        c.setTelefone("34999990000");
        return c;
    }

    private VendaRequest req() {
        return new VendaRequest(1L, 2L, "Alan Ferreira", new BigDecimal("95000.00"), LocalDate.of(2026, 9, 10));
    }

    @Test
    void registrar_marcaVeiculoComoVendido_eCalculaDiferenca() {
        Veiculo v = veiculo(StatusVeiculo.DISPONIVEL);
        when(veiculoRepository.findById(1L)).thenReturn(Optional.of(v));
        when(clienteRepository.findById(2L)).thenReturn(Optional.of(cliente()));
        when(vendaRepository.save(any(Venda.class))).thenAnswer(inv -> inv.getArgument(0));

        var resp = service.registrar(req());

        assertThat(v.getStatus()).isEqualTo(StatusVeiculo.VENDIDO);
        assertThat(resp.diferenca()).isEqualByComparingTo("5000.00"); // 100000 - 95000
        verify(vendaRepository).save(any(Venda.class));
    }

    @Test
    void registrar_veiculoJaVendido_lancaBusinessException_eNaoSalva() {
        when(veiculoRepository.findById(1L)).thenReturn(Optional.of(veiculo(StatusVeiculo.VENDIDO)));
        when(clienteRepository.findById(2L)).thenReturn(Optional.of(cliente()));

        assertThatThrownBy(() -> service.registrar(req()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ja foi vendido");

        verify(vendaRepository, never()).save(any());
    }

    @Test
    void registrar_veiculoInexistente_lancaEntityNotFound() {
        when(veiculoRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.registrar(req())).isInstanceOf(EntityNotFoundException.class);
        verify(vendaRepository, never()).save(any());
    }

    @Test
    void registrar_clienteInexistente_lancaEntityNotFound() {
        when(veiculoRepository.findById(1L)).thenReturn(Optional.of(veiculo(StatusVeiculo.DISPONIVEL)));
        when(clienteRepository.findById(2L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.registrar(req())).isInstanceOf(EntityNotFoundException.class);
        verify(vendaRepository, never()).save(any());
    }
}
