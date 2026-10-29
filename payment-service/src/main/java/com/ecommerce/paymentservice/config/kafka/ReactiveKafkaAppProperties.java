package com.ecommerce.paymentservice.config.kafka;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ReactiveKafkaAppProperties {
    @Value("${spring.kafka.bootstrap-servers:${KAFKA_SERVERS:localhost:9092}}")
    String bootstrapServers;

    @Value("${payment.kafka.consumer-group-id:payment-groupId}")
    String consumerGroupId;
}
