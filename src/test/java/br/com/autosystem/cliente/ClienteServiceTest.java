package br.com.autosystem.cliente;

import br.com.autosystem.cliente.dto.ClienteRequest;
import br.com.autosystem.commons.exception.BusinessException;
import br.com.autosystem.commons.exception.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {

    @Mock
    ClienteRepository repository;

    @InjectMocks
    ClienteService service;

    @Test
    void cadastrar_removeMascaraDoCpf_eNormalizaEmail() {
        when(repository.findByCpf("52998224725")).thenReturn(Optional.empty());
        when(repository.save(any(Cliente.class))).thenAnswer(inv -> inv.getArgument(0));

        service.cadastrar(new ClienteRequest("Ana Souza", "529.982.247-25", "(34) 99999-0001", "ANA@Exemplo.com"));

        ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getCpf()).isEqualTo("52998224725");
        assertThat(captor.getValue().getEmail()).isEqualTo("ana@exemplo.com");
    }

    @Test
    void cadastrar_comCpfDuplicado_lancaBusinessException_eNaoSalva() {
        when(repository.findByCpf("52998224725")).thenReturn(Optional.of(new Cliente()));

        assertThatThrownBy(() -> service.cadastrar(
                new ClienteRequest("Ana", "529.982.247-25", "(34) 99999-0001", "ana@x.com")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("CPF ja cadastrado");

        verify(repository, never()).save(any());
    }

    @Test
    void buscarPorId_inexistente_lancaEntityNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.buscarPorId(99L)).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void atualizar_removeMascaraDoCpf_eAtualizaCampos() {
        Cliente existente = cliente(1L, "Ana", "52998224725");
        when(repository.findById(1L)).thenReturn(Optional.of(existente));
        when(repository.findByCpf("52998224725")).thenReturn(Optional.of(existente)); // proprio CPF
        when(repository.save(any(Cliente.class))).thenAnswer(inv -> inv.getArgument(0));

        service.atualizar(1L, new ClienteRequest("Ana Souza", "529.982.247-25", "(34) 90000-0000", "NOVA@X.com"));

        ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getNome()).isEqualTo("Ana Souza");
        assertThat(captor.getValue().getCpf()).isEqualTo("52998224725");
        assertThat(captor.getValue().getEmail()).isEqualTo("nova@x.com");
    }

    @Test
    void atualizar_inexistente_lancaEntityNotFound_eNaoSalva() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.atualizar(99L,
                new ClienteRequest("Ana", "529.982.247-25", "(34) 90000-0000", "ana@x.com")))
                .isInstanceOf(EntityNotFoundException.class);

        verify(repository, never()).save(any());
    }

    @Test
    void atualizar_comCpfDeOutroCliente_lancaBusinessException_eNaoSalva() {
        when(repository.findById(1L)).thenReturn(Optional.of(cliente(1L, "Ana", "52998224725")));
        when(repository.findByCpf("52998224725")).thenReturn(Optional.of(cliente(2L, "Bruno", "52998224725")));

        assertThatThrownBy(() -> service.atualizar(1L,
                new ClienteRequest("Ana", "529.982.247-25", "(34) 90000-0000", "ana@x.com")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("CPF ja cadastrado");

        verify(repository, never()).save(any());
    }

    private Cliente cliente(Long id, String nome, String cpf) {
        Cliente c = new Cliente();
        c.setId(id);
        c.setNome(nome);
        c.setCpf(cpf);
        c.setTelefone("34999990000");
        return c;
    }
}
