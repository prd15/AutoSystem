package br.com.autosystem.commons.exception;

// Recurso inexistente -> tratado como HTTP 404 no GlobalExceptionHandler.
public class EntityNotFoundException extends RuntimeException {

    public EntityNotFoundException(String mensagem) {
        super(mensagem);
    }
}
