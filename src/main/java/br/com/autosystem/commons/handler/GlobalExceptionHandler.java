package br.com.autosystem.commons.handler;

import br.com.autosystem.commons.exception.BusinessException;
import br.com.autosystem.commons.exception.EntityNotFoundException;
import br.com.autosystem.veiculo.VeiculoComVendaException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

// Tratamento de erro global. Devolve ProblemDetail (RFC 9457) com as propriedades
// estendidas { erro, campos } que o front espera (docs/04). Regra de seguranca do
// professor: mensagem em linguagem natural ao cliente; detalhe tecnico so no log.
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidacao(MethodArgumentNotValidException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        pd.setTitle("Dados invalidos");
        pd.setProperty("erro", "Verifique os campos destacados e tente novamente.");

        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            campos.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }
        pd.setProperty("campos", campos);
        return pd;
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ProblemDetail handleNaoEncontrado(EntityNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        pd.setTitle("Nao encontrado");
        pd.setProperty("erro", ex.getMessage());
        return pd;
    }

    @ExceptionHandler(BusinessException.class)
    public ProblemDetail handleRegraDeNegocio(BusinessException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        pd.setTitle("Conflito de regra");
        pd.setProperty("erro", ex.getMessage());
        return pd;
    }

    // Especializa o 409 da exclusao bloqueada: alem do 'erro', devolve o bloco 'venda'
    // (id, data_venda, valor_venda, cliente) que o front usa no dialogo de bloqueio.
    @ExceptionHandler(VeiculoComVendaException.class)
    public ProblemDetail handleVeiculoComVenda(VeiculoComVendaException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        pd.setTitle("Conflito de regra");
        pd.setProperty("erro", ex.getMessage());
        pd.setProperty("venda", ex.getVenda());
        return pd;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleArgumentoInvalido(IllegalArgumentException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Requisicao invalida");
        pd.setProperty("erro", ex.getMessage());
        return pd;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleJsonMalformado(HttpMessageNotReadableException ex) {
        log.warn("JSON malformado ou tipo invalido: {}", ex.getMostSpecificCause().getMessage());
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Requisicao invalida");
        pd.setProperty("erro", "JSON malformado ou valor de campo invalido.");
        return pd;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleIntegridade(DataIntegrityViolationException ex) {
        // detalhe do banco (nomes de tabela/coluna) so no log; corpo generico ao cliente
        log.warn("Violacao de integridade: {}", ex.getMostSpecificCause().getMessage());
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        pd.setTitle("Conflito");
        pd.setProperty("erro", "Operacao viola uma restricao de integridade (registro duplicado ou em uso).");
        return pd;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleInesperado(Exception ex) {
        log.error("Erro inesperado", ex);
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        pd.setTitle("Erro interno");
        pd.setProperty("erro", "Erro interno do servidor.");
        return pd;
    }
}
