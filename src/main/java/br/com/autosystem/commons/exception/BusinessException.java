package br.com.autosystem.commons.exception;

// Regra de negocio violada -> tratada como HTTP 409 no GlobalExceptionHandler.
public class BusinessException extends RuntimeException {

    public BusinessException(String mensagem) {
        super(mensagem);
    }
}
