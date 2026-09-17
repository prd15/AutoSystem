package br.com.autosystem.commons.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

// "Hoje" vem de um Clock injetado (nao de LocalDate.now() espalhado) — torna
// testaveis regras que dependem da data (ex.: dias em estoque).
@Configuration
public class AppConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
