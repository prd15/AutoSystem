package br.com.autosystem.cliente;

import br.com.autosystem.IntegracaoTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Contrato HTTP do CPF no cadastro de clientes: aceita CPF com mascara (201) e, no CPF
// duplicado, devolve 409 com campos.cpf -- a mensagem que o front mostra no campo.
@AutoConfigureMockMvc
class ClienteCpfContratoTest extends IntegracaoTest {

    @Autowired
    MockMvc mockMvc;

    private String corpo(String cpf) {
        return """
                {"nome":"Ana Souza","cpf":"%s","telefone":"(34) 99999-0000","email":"ana@x.com"}"""
                .formatted(cpf);
    }

    @Test
    void cadastro_comCpfMascarado_retorna201() throws Exception {
        mockMvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("529.982.247-25")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cpf").value("52998224725"));
    }

    @Test
    void cadastro_comCpfDuplicado_retorna409_comCampoCpf() throws Exception {
        mockMvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("529.982.247-25")))
                .andExpect(status().isCreated());

        // Mesmo CPF, agora sem mascara -> continua sendo duplicado (comparado por digitos).
        mockMvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("52998224725")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Já existe um cliente com este CPF."))
                .andExpect(jsonPath("$.campos.cpf").value("Já existe um cliente com este CPF."));
    }
}
