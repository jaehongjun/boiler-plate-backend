-- 수정: bigserial은 직접 변경할 수 없으므로 시퀀스로 처리
CREATE SEQUENCE IF NOT EXISTS tb_customer_customer_id_seq;
ALTER SEQUENCE tb_customer_customer_id_seq OWNED BY "tb_customer"."customer_id";
ALTER TABLE "tb_customer" ALTER COLUMN "customer_id" SET DEFAULT nextval('tb_customer_customer_id_seq');
SELECT setval('tb_customer_customer_id_seq', COALESCE((SELECT MAX("customer_id") FROM "tb_customer"), 0) + 1, false);