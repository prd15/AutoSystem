package br.com.autosystem.usuario;

import br.com.autosystem.usuario.dto.UsuarioRequest;
import br.com.autosystem.usuario.dto.UsuarioResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    // POST /api/usuarios -> cadastra (senha criptografada) e retorna 201, como no slide 002.
    @PostMapping
    public ResponseEntity<UsuarioResponse> cadastrar(@Valid @RequestBody UsuarioRequest request) {
        UsuarioResponse criado = usuarioService.cadastrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @GetMapping
    public List<UsuarioResponse> listar(@RequestParam(required = false) String busca) {
        return usuarioService.listar(busca);
    }

    @GetMapping("/{id}")
    public UsuarioResponse buscarPorId(@PathVariable("id") Long id) {
        return usuarioService.buscarPorId(id);
    }
}
