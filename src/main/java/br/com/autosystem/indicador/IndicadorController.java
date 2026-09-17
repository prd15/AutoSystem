package br.com.autosystem.indicador;

import br.com.autosystem.indicador.dto.EstoquePorMarca;
import br.com.autosystem.indicador.dto.FaturamentoMensal;
import br.com.autosystem.indicador.dto.IndicadoresResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/indicadores")
public class IndicadorController {

    private final IndicadorService service;

    public IndicadorController(IndicadorService service) {
        this.service = service;
    }

    @GetMapping
    public IndicadoresResponse indicadores() {
        return service.indicadores();
    }

    @GetMapping("/faturamento-mensal")
    public List<FaturamentoMensal> faturamentoMensal(@RequestParam(defaultValue = "6") int meses) {
        return service.faturamentoMensal(meses);
    }

    @GetMapping("/estoque-por-marca")
    public List<EstoquePorMarca> estoquePorMarca() {
        return service.estoquePorMarca();
    }
}
