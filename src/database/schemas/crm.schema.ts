import {
  pgTable,
  bigint,
  varchar,
  text,
  date,
  timestamp,
  decimal,
  pgEnum,
  serial,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum 정의
export const customerGradeEnum = pgEnum('customer_grade', [
  'VIP',
  'GENERAL',
  'POTENTIAL',
]);
export const customerStatusEnum = pgEnum('customer_status', [
  'ACTIVE',
  'INACTIVE',
]);
export const contactTypeEnum = pgEnum('contact_type', [
  'PHONE',
  'VISIT',
  'ONLINE',
  'EMAIL',
]);
export const contactPurposeEnum = pgEnum('contact_purpose', [
  'INQUIRY',
  'COMPLAINT',
  'CONSULTATION',
  'INVESTMENT_INQUIRY',
]);
export const accountTypeEnum = pgEnum('account_type', [
  'TRUST',
  'PENSION',
  'CMA',
]);
export const accountStatusEnum = pgEnum('account_status', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
]);
export const productTypeEnum = pgEnum('product_type', [
  'STOCK',
  'BOND',
  'FUND',
  'ELS',
  'ETF',
]);
export const riskLevelEnum = pgEnum('risk_level', ['HIGH', 'MEDIUM', 'LOW']);
export const tradeTypeEnum = pgEnum('trade_type', ['BUY', 'SELL']);

// 고객 테이블
// PK는 serial() 사용 (drizzle serial -> int4). 만약 bigint ID 유지가 필요하면 bigint + 시퀀스 직접 지정 필요.
export const customers = pgTable('tb_customer', {
  customerId: serial('customer_id').primaryKey(),
  customerName: varchar('customer_name', { length: 100 }).notNull(),
  residentNo: varchar('resident_no', { length: 20 }), // 주민번호(암호화/마스킹 필요)
  phoneNo: varchar('phone_no', { length: 20 }),
  email: varchar('email', { length: 100 }),
  address: varchar('address', { length: 200 }),
  customerGrade: customerGradeEnum('customer_grade'),
  joinDate: date('join_date').notNull(),
  lastContactDate: timestamp('last_contact_date'),
  status: customerStatusEnum('status').default('ACTIVE'),
  regDate: timestamp('reg_date').defaultNow(),
});

// 상담/문의 이력 테이블
export const contactHistory = pgTable('tb_contact_history', {
  contactId: serial('contact_id').primaryKey(),
  customerId: bigint('customer_id', { mode: 'number' }).notNull(),
  contactType: contactTypeEnum('contact_type'),
  contactPurpose: contactPurposeEnum('contact_purpose'),
  contactNote: text('contact_note'),
  contactDate: timestamp('contact_date').defaultNow(),
  managerId: bigint('manager_id', { mode: 'number' }),
});

// 투자계좌 테이블
export const accounts = pgTable('tb_account', {
  accountId: serial('account_id').primaryKey(),
  customerId: bigint('customer_id', { mode: 'number' }).notNull(),
  accountNo: varchar('account_no', { length: 30 }).unique().notNull(),
  accountType: accountTypeEnum('account_type'),
  openDate: date('open_date'),
  balance: decimal('balance', { precision: 20, scale: 2 }).default('0'),
  status: accountStatusEnum('status').default('ACTIVE'),
});

// 투자상품 테이블
export const products = pgTable('tb_product', {
  productId: serial('product_id').primaryKey(),
  productName: varchar('product_name', { length: 100 }).notNull(),
  productType: productTypeEnum('product_type'),
  riskLevel: riskLevelEnum('risk_level'),
  issuer: varchar('issuer', { length: 100 }),
  regDate: timestamp('reg_date').defaultNow(),
});

// 거래내역 테이블
export const transactions = pgTable('tb_transaction', {
  transactionId: serial('transaction_id').primaryKey(),
  accountId: bigint('account_id', { mode: 'number' }).notNull(),
  productId: bigint('product_id', { mode: 'number' }).notNull(),
  tradeType: tradeTypeEnum('trade_type'),
  tradeAmount: decimal('trade_amount', { precision: 20, scale: 2 }),
  tradePrice: decimal('trade_price', { precision: 20, scale: 2 }),
  tradeDate: timestamp('trade_date').defaultNow(),
});

// 관계 정의
export const customersRelations = relations(customers, ({ many }) => ({
  contactHistory: many(contactHistory),
  accounts: many(accounts),
}));

export const contactHistoryRelations = relations(contactHistory, ({ one }) => ({
  customer: one(customers, {
    fields: [contactHistory.customerId],
    references: [customers.customerId],
  }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [accounts.customerId],
    references: [customers.customerId],
  }),
  transactions: many(transactions),
}));

export const productsRelations = relations(products, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.accountId],
  }),
  product: one(products, {
    fields: [transactions.productId],
    references: [products.productId],
  }),
}));
