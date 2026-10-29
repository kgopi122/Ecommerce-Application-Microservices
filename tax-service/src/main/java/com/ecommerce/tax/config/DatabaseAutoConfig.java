package com.ecommerce.tax.config;

import com.ecommerce.commonlib.data.audit.AuditorAwareImpl;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories("com.ecommerce.tax.repository")
@EntityScan("com.ecommerce.tax.model")
@EnableJpaAuditing(auditorAwareRef = "platformAuditorAware")
public class DatabaseAutoConfig {

    @Bean
    @ConditionalOnMissingBean(name = "platformAuditorAware")
    public AuditorAware<String> platformAuditorAware() {
        return new AuditorAwareImpl();
    }
}
