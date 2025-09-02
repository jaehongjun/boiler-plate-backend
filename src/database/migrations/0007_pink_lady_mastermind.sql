-- 나머지 테이블들의 시퀀스 생성 (customer는 이미 0004에서 처리됨)
CREATE SEQUENCE IF NOT EXISTS tb_contact_history_contact_id_seq;--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS tb_account_account_id_seq;--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS tb_product_product_id_seq;--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS tb_transaction_transaction_id_seq;--> statement-breakpoint

-- 시퀀스 소유권 설정
ALTER SEQUENCE tb_contact_history_contact_id_seq OWNED BY "tb_contact_history"."contact_id";--> statement-breakpoint
ALTER SEQUENCE tb_account_account_id_seq OWNED BY "tb_account"."account_id";--> statement-breakpoint
ALTER SEQUENCE tb_product_product_id_seq OWNED BY "tb_product"."product_id";--> statement-breakpoint
ALTER SEQUENCE tb_transaction_transaction_id_seq OWNED BY "tb_transaction"."transaction_id";--> statement-breakpoint

-- 기본값 설정 (자동 증가)
ALTER TABLE "tb_contact_history" ALTER COLUMN "contact_id" SET DEFAULT nextval('tb_contact_history_contact_id_seq');--> statement-breakpoint
ALTER TABLE "tb_account" ALTER COLUMN "account_id" SET DEFAULT nextval('tb_account_account_id_seq');--> statement-breakpoint
ALTER TABLE "tb_product" ALTER COLUMN "product_id" SET DEFAULT nextval('tb_product_product_id_seq');--> statement-breakpoint
ALTER TABLE "tb_transaction" ALTER COLUMN "transaction_id" SET DEFAULT nextval('tb_transaction_transaction_id_seq');--> statement-breakpoint

-- 시퀀스의 현재 값을 기존 데이터의 최대값 + 1로 설정
SELECT setval('tb_contact_history_contact_id_seq', COALESCE((SELECT MAX("contact_id") FROM "tb_contact_history"), 0) + 1, false);--> statement-breakpoint
SELECT setval('tb_account_account_id_seq', COALESCE((SELECT MAX("account_id") FROM "tb_account"), 0) + 1, false);--> statement-breakpoint
SELECT setval('tb_product_product_id_seq', COALESCE((SELECT MAX("product_id") FROM "tb_product"), 0) + 1, false);--> statement-breakpoint
SELECT setval('tb_transaction_transaction_id_seq', COALESCE((SELECT MAX("transaction_id") FROM "tb_transaction"), 0) + 1, false);