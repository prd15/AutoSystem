package br.com.autosystem.commons.exception;

import java.util.Map;

// Regra de negocio violada -> tratada como HTTP 409 no GlobalExceptionHandler.
// Pode carregar 'campos' (opcional) quando o conflito for de um campo especifico
// (ex.: CPF/placa duplicados), para o front destacar o campo -- chave em snake_case.
public class BusinessException extends RuntimeException {

    private final transient Map<String, String> campos;

    public BusinessException(String mensagem) {
        super(mensagem);
        this.campos = null;
    }

    public BusinessException(String mensagem, String campo, String mensagemCampo) {
        super(mensagem);
        this.campos = Map.of(campo, mensagemCampo);
    }

    public Map<String, String> getCampos() {
        return campos;
    }
}
