package br.com.autosystem.usuario;

import br.com.autosystem.commons.exception.BusinessException;
import br.com.autosystem.commons.exception.EntityNotFoundException;
import br.com.autosystem.usuario.dto.UsuarioRequest;
import br.com.autosystem.usuario.dto.UsuarioResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar(String busca) {
        List<Usuario> usuarios = (busca == null || busca.isBlank())
                ? usuarioRepository.findAll()
                : usuarioRepository.findByNomeContainingIgnoreCaseOrderByNomeAsc(busca.trim());
        return usuarios.stream().map(UsuarioResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .map(UsuarioResponse::from)
                .orElseThrow(() -> new EntityNotFoundException("Usuario nao encontrado."));
    }

    @Transactional
    public UsuarioResponse cadastrar(UsuarioRequest req) {
        String email = req.email().toLowerCase().trim();
        validarEmailDisponivel(email);

        Usuario usuario = new Usuario();
        usuario.setNome(req.nome().trim());
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(req.senha()));   // BCrypt — nunca texto puro
        usuario.setPerfil(req.perfil() != null ? req.perfil() : Perfil.VENDEDOR);
        usuario.setAtivo(true);

        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }

    // Regra de negocio do professor: "este e-mail ja existe no banco?"
    private void validarEmailDisponivel(String email) {
        usuarioRepository.findByEmail(email).ifPresent(u -> {
            throw new BusinessException("E-mail ja cadastrado.");
        });
    }
}
