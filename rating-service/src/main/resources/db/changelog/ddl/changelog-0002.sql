--liquibase formatted sql

--changeset khanhtran:issue-335-2
alter table if exists rating add column product_name varchar(255);
