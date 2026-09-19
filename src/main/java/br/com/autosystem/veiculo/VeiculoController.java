package br.com.autosystem.veiculo;

import br.com.autosystem.veiculo.dto.VeiculoListaResponse;
import br.com.autosystem.veiculo.dto.VeiculoRequest;
import br.com.autosystem.veiculo.dto.VeiculoResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/veiculos")
public class VeiculoController {

    private final VeiculoService service;

    public VeiculoController(VeiculoService service) {
        this.service = service;
    }

    @GetMapping
    public VeiculoListaResponse listar(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String marca,
            @RequestParam(name = "preco_min", required = false) BigDecimal precoMin,
            @RequestParam(name = "preco_max", required = false) BigDecimal precoMax) {
        StatusVeiculo statusFiltro = StatusVeiculo.fromValor(status); // null-safe; invalido -> 400
        return service.listar(busca, statusFiltro, marca, precoMin, precoMax);
    }

    @GetMapping("/marcas")
    public List<String> marcas() {
        return service.listarMarcas();
    }

    @GetMapping("/vendaveis")
    public List<VeiculoResponse> vendaveis() {
        return service.listarVendaveis();
    }

    @GetMapping("/{id}")
    public VeiculoResponse buscarPorId(@PathVariable("id") Long id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<VeiculoResponse> criar(@Valid @RequestBody VeiculoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request));
    }

    @PutMapping("/{id}")
    public VeiculoResponse atualizar(@PathVariable("id") Long id, @Valid @RequestBody VeiculoRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable("id") Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
