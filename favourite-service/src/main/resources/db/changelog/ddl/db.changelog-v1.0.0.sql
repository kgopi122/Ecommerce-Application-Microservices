--liquibase formatted sql
--changeset system:favourite-service-v1.0.0-create-tables
CREATE TABLE IF NOT EXISTS favourites (
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    like_date TIMESTAMP NOT NULL,
    CONSTRAINT favourites_pkey PRIMARY KEY (user_id, product_id, like_date)
);

CREATE INDEX IF NOT EXISTS idx_favourites_user_id ON favourites (user_id);
CREATE INDEX IF NOT EXISTS idx_favourites_product_id ON favourites (product_id);
