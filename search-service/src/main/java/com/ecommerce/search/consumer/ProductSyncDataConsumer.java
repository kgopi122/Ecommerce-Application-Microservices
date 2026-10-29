package com.ecommerce.search.consumer;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.ecommerce.search.constants.Action;
import com.ecommerce.search.service.ProductSyncDataService;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductSyncDataConsumer {

    private static final Logger LOGGER = LoggerFactory.getLogger(KafkaConsumer.class);

    private final ProductSyncDataService productSyncDataService;

    @KafkaListener(topics = "${product.topic.name}")
    public void listen(ConsumerRecord<?, ?> consumerRecord) {

        if (consumerRecord != null) {
            try {
                Object rawKey = consumerRecord.key();
                Object rawVal = consumerRecord.value();
                if (rawKey == null || rawVal == null) {
                    LOGGER.warn("Received Kafka record with null key or value on topic {}", consumerRecord.topic());
                    return;
                }

                JsonObject keyObject = new Gson().fromJson(rawKey.toString(), JsonObject.class);
                JsonObject valueObject = new Gson().fromJson(rawVal.toString(), JsonObject.class);

                if (keyObject != null && keyObject.has("id") && valueObject != null && valueObject.has("op")) {
                    String action = valueObject.get("op").getAsString().replaceAll("\"", "");
                    Long id = keyObject.get("id").getAsLong();

                    LOGGER.info("Processing CDC event for product id: {}, action: {}", id, action);

                    switch (action) {
                        case Action.CREATE, Action.READ:
                            productSyncDataService.createProduct(id);
                            break;
                        case Action.UPDATE:
                            productSyncDataService.updateProduct(id);
                            break;
                        case Action.DELETE:
                            productSyncDataService.deleteProduct(id);
                            break;
                        default:
                            LOGGER.warn("Unknown CDC action: {}", action);
                            break;
                    }
                } else {
                    LOGGER.warn("Kafka record payload missing 'id' or 'op' field: key={}, value={}", rawKey, rawVal);
                }
            } catch (Exception e) {
                LOGGER.error("Error processing CDC event on topic {}: {}", consumerRecord.topic(), e.getMessage());
            }
        }
    }
}
