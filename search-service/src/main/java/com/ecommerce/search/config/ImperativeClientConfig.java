package com.ecommerce.search.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

@Configuration
@EnableElasticsearchRepositories(basePackages = "com.ecommerce.search.repository")
@ComponentScan(basePackages = "com.ecommerce.search.service")
@RequiredArgsConstructor
public class ImperativeClientConfig extends ElasticsearchConfiguration {

    private final ElasticsearchDataConfig elasticsearchConfig;

    @Override
    public ClientConfiguration clientConfiguration() {
        String rawUrl = elasticsearchConfig.getUrl();
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = "localhost:9200";
        }
        boolean isSsl = rawUrl.startsWith("https://");
        String hostAndPort = rawUrl.replaceFirst("^https?://", "");

        ClientConfiguration.MaybeSecureClientConfigurationBuilder builder = ClientConfiguration.builder()
                .connectedTo(hostAndPort);

        if (isSsl) {
            builder.usingSsl();
        }

        String username = elasticsearchConfig.getUsername();
        String password = elasticsearchConfig.getPassword();
        if (username != null && !username.isBlank() && password != null && !password.isBlank()) {
            builder.withBasicAuth(username, password);
        }

        return builder.build();
    }
}
