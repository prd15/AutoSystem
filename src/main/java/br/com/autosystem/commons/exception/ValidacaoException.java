package br.com.autosystem.commons.exception;

import java.util.Map;

// Regra de campo violada no service -> tratada como HTTP 422 no GlobalExceptionHandler,
// no mesmo formato { erro, campos } que as validacoes de Bean Validation. Serve para regras
// que so podem ser checadas no service (ex.: desconto acima do permitido), mantendo a chave
// do campo em snake_case, como o formulario do front usa.
public class ValidacaoException extends RuntimeException {

    private final transient Map<String, String> campos;

    public ValidacaoException(String campo, String mensagem) {
        super("Verifique os campos destacados e tente novamente.");
        this.campos = Map.of(campo, mensagem);
    }

    public Map<String, String> getCampos() {
        return campos;
    }
}
