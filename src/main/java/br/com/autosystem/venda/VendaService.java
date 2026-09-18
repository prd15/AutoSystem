package br.com.autosystem.venda;

import br.com.autosystem.cliente.Cliente;
import br.com.autosystem.cliente.ClienteRepository;
import br.com.autosystem.commons.exception.BusinessException;
import br.com.autosystem.commons.exception.EntityNotFoundException;
import br.com.autosystem.commons.exception.ValidacaoException;
import br.com.autosystem.veiculo.StatusVeiculo;
import br.com.autosystem.veiculo.Veiculo;
import br.com.autosystem.veiculo.VeiculoRepository;
import br.com.autosystem.venda.dto.VendaRequest;
import br.com.autosystem.venda.dto.VendaResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class VendaService {

    private static final LocalDate DATA_MINIMA = LocalDate.of(2000, 1, 1);
    private static final LocalDate DATA_MAXIMA = LocalDate.of(2100, 12, 31);

    // Teto de desconto (em %). Provisorio: vira configuracoes.comercial.limite_desconto no card B4.
    private static final BigDecimal LIMITE_DESCONTO_PERCENTUAL = new BigDecimal("10");
    private static final BigDecimal CEM = new BigDecimal("100");
    // Mesma tolerancia do front (store.validarDescontoVenda) na comparacao com o teto.
    private static final BigDecimal TOLERANCIA_DESCONTO = new BigDecimal("0.000001");

    private final VendaRepository vendaRepository;
    private final VeiculoRepository veiculoRepository;
    private final ClienteRepository clienteRepository;

    public VendaService(VendaRepository vendaRepository,
                        VeiculoRepository veiculoRepository,
                        ClienteRepository clienteRepository) {
        this.vendaRepository = vendaRepository;
        this.veiculoRepository = veiculoRepository;
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public List<VendaResponse> listar(LocalDate de, LocalDate ate) {
        List<Venda> vendas = (de == null && ate == null)
                ? vendaRepository.findAllByOrderByDataVendaDescIdDesc()
                : vendaRepository.findByDataVendaBetweenOrderByDataVendaDescIdDesc(
                        de != null ? de : DATA_MINIMA, ate != null ? ate : DATA_MAXIMA);
        return vendas.stream().map(VendaResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public VendaResponse buscarPorId(Long id) {
        return vendaRepository.findById(id)
                .map(VendaResponse::from)
                .orElseThrow(() -> new EntityNotFoundException("Venda nao encontrada."));
    }

    // Endpoint transacional: registra a venda e muda o veiculo para VENDIDO, tudo ou nada.
    @Transactional
    public VendaResponse registrar(VendaRequest req) {
        Veiculo veiculo = veiculoRepository.findById(req.veiculoId())
                .orElseThrow(() -> new EntityNotFoundException("Veiculo nao encontrado."));
        Cliente cliente = clienteRepository.findById(req.clienteId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente nao encontrado."));

        // Regra: veiculo vendido nao pode ser vendido de novo.
        if (veiculo.getStatus() == StatusVeiculo.VENDIDO) {
            throw new BusinessException("Este veiculo ja foi vendido.");
        }

        validarDesconto(veiculo.getPreco(), req.valorVenda(), req.formaPagamento());

        Venda venda = new Venda();
        venda.setVeiculo(veiculo);
        venda.setCliente(cliente);
        venda.setVendedor(req.vendedor().trim());
        venda.setValorVenda(req.valorVenda());
        venda.setDataVenda(req.dataVenda());
        Venda salva = vendaRepository.save(venda);

        // Regra: registrar a venda muda o status do veiculo automaticamente.
        veiculo.setStatus(StatusVeiculo.VENDIDO);

        return VendaResponse.from(salva);
    }

    // Desconto = preco de tabela menos o valor negociado (so quando ha desconto de fato;
    // venda a tabela ou acima dela -- agio -- e sempre livre). Regra: desconto so em venda
    // a vista. Erro 422 no campo valor_venda, como o formulario do front espera.
    private void validarDesconto(BigDecimal preco, BigDecimal valorVenda, FormaPagamentoVenda forma) {
        boolean temDesconto = preco != null && preco.signum() > 0 && valorVenda.compareTo(preco) < 0;
        if (!temDesconto) {
            return;
        }
        if (forma != FormaPagamentoVenda.AVISTA) {
            throw new ValidacaoException("valor_venda", "Desconto é permitido somente em vendas à vista.");
        }
        // Regra: desconto (a vista) nao pode passar do teto. Mesma mensagem/formato do front
        // (store.validarDescontoVenda): mostra o percentual com 2 casas e virgula.
        BigDecimal percentual = preco.subtract(valorVenda)
                .multiply(CEM)
                .divide(preco, 6, RoundingMode.HALF_UP);
        if (percentual.compareTo(LIMITE_DESCONTO_PERCENTUAL.add(TOLERANCIA_DESCONTO)) > 0) {
            throw new ValidacaoException("valor_venda",
                    "O desconto de " + formatarPercentual(percentual)
                            + "% ultrapassa o limite permitido de "
                            + formatarPercentual(LIMITE_DESCONTO_PERCENTUAL) + "%.");
        }
    }

    // Percentual com 2 casas e virgula decimal, como o front exibe (ex.: "15,00").
    private String formatarPercentual(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP).toPlainString().replace('.', ',');
    }
}
