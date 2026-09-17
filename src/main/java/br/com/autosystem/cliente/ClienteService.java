package br.com.autosystem.cliente;

import br.com.autosystem.cliente.dto.ClienteRequest;
import br.com.autosystem.cliente.dto.ClienteResponse;
import br.com.autosystem.commons.exception.BusinessException;
import br.com.autosystem.commons.exception.EntityNotFoundException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository repository;

    public ClienteService(ClienteRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar(String busca) {
        List<Cliente> clientes = (busca == null || busca.isBlank())
                ? repository.findAll(Sort.by(Sort.Direction.ASC, "nome"))
                : repository.buscar(busca.trim());
        return clientes.stream().map(ClienteResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse buscarPorId(Long id) {
        return repository.findById(id)
                .map(ClienteResponse::from)
                .orElseThrow(() -> new EntityNotFoundException("Cliente nao encontrado."));
    }

    @Transactional
    public ClienteResponse cadastrar(ClienteRequest req) {
        String cpf = soDigitos(req.cpf());
        validarCpfDisponivel(cpf, null);

        Cliente cliente = new Cliente();
        cliente.setNome(req.nome().trim());
        cliente.setCpf(cpf);
        cliente.setTelefone(req.telefone().trim());
        cliente.setEmail(normalizarEmail(req.email()));

        return ClienteResponse.from(repository.save(cliente));
    }

    private String soDigitos(String valor) {
        return valor == null ? null : valor.replaceAll("\\D", "");
    }

    private String normalizarEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase();
    }

    private void validarCpfDisponivel(String cpf, Long idAtual) {
        repository.findByCpf(cpf)
                .filter(existente -> idAtual == null || !existente.getId().equals(idAtual))
                .ifPresent(existente -> {
                    throw new BusinessException("CPF ja cadastrado.");
                });
    }
}
