package br.com.autosystem.commons.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

// Encoder de senha (BCrypt). O professor pede a senha criptografada no cadastro (slide 002).
// Usamos apenas spring-security-crypto, sem ativar o filtro de seguranca (auth vem depois).
@Configuration
public class CriptografiaConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
