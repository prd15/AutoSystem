package br.com.autosystem.veiculo;

import br.com.autosystem.commons.exception.BusinessException;
import br.com.autosystem.commons.exception.EntityNotFoundException;
import br.com.autosystem.veiculo.dto.VeiculoListaResponse;
import br.com.autosystem.veiculo.dto.VeiculoRequest;
import br.com.autosystem.veiculo.dto.VeiculoResponse;
import br.com.autosystem.veiculo.dto.VeiculoResumo;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class VeiculoService {

    private final VeiculoRepository repository;
    private final Clock clock;

    public VeiculoService(VeiculoRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public VeiculoListaResponse listar(String busca, StatusVeiculo status, String marca,
                                       BigDecimal precoMin, BigDecimal precoMax) {
        Specification<Veiculo> spec = VeiculoSpecification.comFiltros(busca, status, marca, precoMin, precoMax);
        List<VeiculoResponse> itens = repository.findAll(spec).stream().map(this::toResponse).toList();
        return new VeiculoListaResponse(itens, itens.size(), montarResumo());
    }

    @Transactional(readOnly = true)
    public VeiculoResponse buscarPorId(Long id) {
        return repository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Veiculo nao encontrado."));
    }

    @Transactional(readOnly = true)
    public List<String> listarMarcas() {
        return repository.buscarMarcas();
    }

    @Transactional(readOnly = true)
    public List<VeiculoResponse> listarVendaveis() {
        return repository.findByStatusNotOrderByMarcaAscModeloAsc(StatusVeiculo.VENDIDO)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public VeiculoResponse criar(VeiculoRequest req) {
        Veiculo veiculo = new Veiculo();
        aplicar(req, veiculo);
        validarPlacaDisponivel(veiculo.getPlaca(), null);
        return toResponse(repository.save(veiculo));
    }

    @Transactional
    public VeiculoResponse atualizar(Long id, VeiculoRequest req) {
        Veiculo veiculo = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Veiculo nao encontrado."));
        aplicar(req, veiculo);
        validarPlacaDisponivel(veiculo.getPlaca(), id);
        return toResponse(repository.save(veiculo));
    }

    @Transactional
    public void excluir(Long id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Veiculo nao encontrado.");
        }
        // FK ON DELETE RESTRICT bloqueia se houver venda -> vira 409 no handler.
        repository.deleteById(id);
    }

    // ---- apoio ----

    private void aplicar(VeiculoRequest req, Veiculo v) {
        v.setMarca(req.marca().trim());
        v.setModelo(req.modelo().trim());
        v.setAno(req.ano());
        v.setCor(req.cor().trim());
        v.setQuilometragem(req.quilometragem());
        v.setPreco(req.preco());
        v.setPlaca(normalizarPlaca(req.placa()));
        v.setStatus(req.status() != null ? req.status() : StatusVeiculo.DISPONIVEL);
    }

    private String normalizarPlaca(String placa) {
        if (placa == null || placa.isBlank()) {
            return null;
        }
        return placa.trim().toUpperCase();
    }

    // save com idAtual=null (bloqueia qualquer placa igual); update passa o id (permite manter a propria).
    private void validarPlacaDisponivel(String placa, Long idAtual) {
        if (placa == null) {
            return;
        }
        repository.findByPlaca(placa)
                .filter(existente -> idAtual == null || !existente.getId().equals(idAtual))
                .ifPresent(existente -> {
                    throw new BusinessException("Placa ja cadastrada.");
                });
    }

    private VeiculoResumo montarResumo() {
        Map<String, Long> porStatus = new LinkedHashMap<>();
        porStatus.put(StatusVeiculo.DISPONIVEL.getValor(), repository.countByStatus(StatusVeiculo.DISPONIVEL));
        porStatus.put(StatusVeiculo.RESERVADO.getValor(), repository.countByStatus(StatusVeiculo.RESERVADO));
        porStatus.put(StatusVeiculo.VENDIDO.getValor(), repository.countByStatus(StatusVeiculo.VENDIDO));
        BigDecimal valorEmEstoque = repository.somarPrecoExcetoStatus(StatusVeiculo.VENDIDO);
        return new VeiculoResumo(valorEmEstoque, porStatus);
    }

    private VeiculoResponse toResponse(Veiculo v) {
        return VeiculoResponse.from(v, diasEmEstoque(v));
    }

    private long diasEmEstoque(Veiculo v) {
        if (v.getCriadoEm() == null) {
            return 0;
        }
        LocalDate criado = LocalDate.ofInstant(v.getCriadoEm(), clock.getZone());
        long dias = ChronoUnit.DAYS.between(criado, LocalDate.now(clock));
        return Math.max(0, dias);
    }
}
