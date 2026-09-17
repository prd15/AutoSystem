package br.com.autosystem.usuario;

import br.com.autosystem.commons.exception.BusinessException;
import br.com.autosystem.usuario.dto.UsuarioRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    UsuarioRepository repository;

    @Mock
    PasswordEncoder passwordEncoder;

    @InjectMocks
    UsuarioService service;

    @Test
    void cadastrar_criptografaSenha_normalizaEmail_ePerfilPadraoVendedor() {
        when(repository.findByEmail(any())).thenReturn(Optional.empty());
        when(passwordEncoder.encode("senha123")).thenReturn("$2a$hash");
        when(repository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        var resposta = service.cadastrar(
                new UsuarioRequest("Ana Gerente", "ANA@Exemplo.com", "senha123", null));

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(passwordEncoder).encode("senha123");
        verify(repository).save(captor.capture());

        Usuario salvo = captor.getValue();
        assertThat(salvo.getSenha()).isEqualTo("$2a$hash");
        assertThat(salvo.getSenha()).isNotEqualTo("senha123");     // nunca em texto puro
        assertThat(salvo.getEmail()).isEqualTo("ana@exemplo.com"); // normalizado
        assertThat(salvo.getPerfil()).isEqualTo(Perfil.VENDEDOR);  // padrao
        assertThat(resposta.email()).isEqualTo("ana@exemplo.com");
    }

    @Test
    void cadastrar_comEmailDuplicado_lancaBusinessException_eNaoSalva() {
        when(repository.findByEmail("ana@exemplo.com")).thenReturn(Optional.of(new Usuario()));

        assertThatThrownBy(() -> service.cadastrar(
                new UsuarioRequest("Ana", "ana@exemplo.com", "senha123", Perfil.ADMIN)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("E-mail ja cadastrado");

        verify(repository, never()).save(any());
    }
}
