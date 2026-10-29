--liquibase formatted sql

--changeset dieunguyen:issue-tax-002
ALTER TABLE tax_rate ALTER COLUMN state_or_province_id DROP NOT NULL;
