// IR Insights 전용 스키마
// - 지분 변화 추적
// - 주가 및 시장 데이터 (실제 API 연동 예정)
// - IREI 효율성 지수 계산

import {
  pgTable,
  varchar,
  timestamp,
  integer,
  numeric,
  boolean,
  text,
  bigint,
  serial,
  smallint,
  pgEnum,
  index,
  uniqueIndex,
  uuid,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { irActivities } from './ir.schema';
import { investors, investorSnapshots } from './investor.schema';
import { users } from './users';

// ==================== Enums ====================

export const responseTypeEnum = pgEnum('response_type', [
  'BUY',
  'SELL',
  'ADJUST',
  'HOLD',
  'NO_CHANGE',
]);

export const marketEventCategoryEnum = pgEnum('market_event_category', [
  'MACRO', // 거시경제
  'COMPANY', // 기업 공시
  'INDUSTRY', // 산업 이슈
  'REGULATORY', // 규제/정책
]);

export const marketIndicatorCategoryEnum = pgEnum('market_indicator_category', [
  'INDEX', // 주가지수
  'FX', // 환율
  'INTEREST_RATE', // 금리
  'COMMODITY', // 원자재
]);

export const ireiCalculationTypeEnum = pgEnum('irei_calculation_type', [
  'INVESTOR',
  'MEETING_TYPE',
  'KEYWORD',
  'STAFF',
  'REGION',
]);

// ==================== 1. Investor Activity Outcomes ====================

export const investorActivityOutcomes = pgTable(
  'investor_activity_outcomes',
  {
    id: serial('id').primaryKey(),

    // 연결
    irActivityId: varchar('ir_activity_id', { length: 50 })
      .references(() => irActivities.id, { onDelete: 'cascade' })
      .notNull(),
    investorId: integer('investor_id')
      .references(() => investors.id, { onDelete: 'cascade' })
      .notNull(),

    // 전후 스냅샷 참조
    snapshotBeforeId: integer('snapshot_before_id').references(
      () => investorSnapshots.id,
      { onDelete: 'set null' },
    ),
    snapshotAfterId: integer('snapshot_after_id').references(
      () => investorSnapshots.id,
      { onDelete: 'set null' },
    ),

    // 계산된 변화량
    shareChangeRate: numeric('share_change_rate', { precision: 10, scale: 4 }), // 지분율 변화 (%)
    shareCountChange: bigint('share_count_change', { mode: 'number' }), // 주식수 변화
    sOverOChange: numeric('s_over_o_change', { precision: 10, scale: 4 }), // S/O 변화

    // 반응 분류
    purchaseResponse: boolean('purchase_response').default(false),
    responseType: responseTypeEnum('response_type'),

    // 효율성 지표
    efficiencyScore: numeric('efficiency_score', { precision: 10, scale: 4 }),

    // 메타데이터
    measurementPeriodDays: integer('measurement_period_days').default(90),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    activityIdx: index('iao_activity_idx').on(table.irActivityId),
    investorIdx: index('iao_investor_idx').on(table.investorId),
    responseIdx: index('iao_response_idx').on(table.purchaseResponse),
    createdIdx: index('iao_created_idx').on(table.createdAt),
  }),
);

// ==================== 2. Stock Prices (실제 API 연동 예정) ====================

export const stockPrices = pgTable(
  'stock_prices',
  {
    id: serial('id').primaryKey(),

    date: timestamp('date', { withTimezone: true, mode: 'date' }).notNull(),
    ticker: varchar('ticker', { length: 20 }).default('KB'),

    // OHLCV
    openPrice: numeric('open_price', { precision: 12, scale: 2 }),
    highPrice: numeric('high_price', { precision: 12, scale: 2 }),
    lowPrice: numeric('low_price', { precision: 12, scale: 2 }),
    closePrice: numeric('close_price', { precision: 12, scale: 2 }),
    volume: bigint('volume', { mode: 'number' }),

    // 계산 값
    changeAmount: numeric('change_amount', { precision: 12, scale: 2 }),
    changeRate: numeric('change_rate', { precision: 10, scale: 4 }),

    // 메타
    dataSource: varchar('data_source', { length: 100 }), // 'KRX', 'YAHOO_FINANCE', 'MANUAL'
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueDateTicker: uniqueIndex('stock_prices_date_ticker_idx').on(
      table.date,
      table.ticker,
    ),
    dateIdx: index('stock_prices_date_idx').on(table.date),
  }),
);

// ==================== 3. Market Events ====================

export const marketEvents = pgTable(
  'market_events',
  {
    id: serial('id').primaryKey(),

    eventDate: timestamp('event_date', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    eventName: varchar('event_name', { length: 255 }).notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(), // '정부정책', '실적발표', '주주환원' 등
    eventCategory: marketEventCategoryEnum('event_category'),

    description: text('description'),
    source: varchar('source', { length: 255 }),
    importanceLevel: integer('importance_level').default(5), // 1-10

    // 영향도
    stockPriceImpact: numeric('stock_price_impact', { precision: 10, scale: 4 }),
    shortTermImpact: numeric('short_term_impact', { precision: 10, scale: 4 }),
    mediumTermImpact: numeric('medium_term_impact', {
      precision: 10,
      scale: 4,
    }),
    longTermImpact: numeric('long_term_impact', { precision: 10, scale: 4 }),

    relatedKeywords: text('related_keywords').array(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    dateIdx: index('market_events_date_idx').on(table.eventDate),
    typeIdx: index('market_events_type_idx').on(table.eventType),
    categoryIdx: index('market_events_category_idx').on(table.eventCategory),
  }),
);

// ==================== 4. Market Indicators ====================

export const marketIndicators = pgTable(
  'market_indicators',
  {
    id: serial('id').primaryKey(),

    indicatorName: varchar('indicator_name', { length: 100 }).notNull(), // 'KOSPI', 'USD_KRW', 'CD_RATE'
    indicatorCategory: marketIndicatorCategoryEnum('indicator_category'),
    date: timestamp('date', { withTimezone: true, mode: 'date' }).notNull(),

    value: numeric('value', { precision: 18, scale: 6 }).notNull(),
    openValue: numeric('open_value', { precision: 18, scale: 6 }),
    highValue: numeric('high_value', { precision: 18, scale: 6 }),
    lowValue: numeric('low_value', { precision: 18, scale: 6 }),
    closeValue: numeric('close_value', { precision: 18, scale: 6 }),

    changeAmount: numeric('change_amount', { precision: 18, scale: 6 }),
    changeRate: numeric('change_rate', { precision: 10, scale: 4 }),

    dataSource: varchar('data_source', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueNameDate: uniqueIndex('market_indicators_name_date_idx').on(
      table.indicatorName,
      table.date,
    ),
    dateIdx: index('market_indicators_date_idx').on(table.date),
    categoryIdx: index('market_indicators_category_idx').on(
      table.indicatorCategory,
    ),
  }),
);

// ==================== 5. IREI Calculations ====================

export const ireiCalculations = pgTable(
  'irei_calculations',
  {
    id: serial('id').primaryKey(),

    calculationDate: timestamp('calculation_date', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    calculationType: ireiCalculationTypeEnum('calculation_type').notNull(),

    // 대상 식별 (nullable - 타입에 따라 다름)
    investorId: integer('investor_id').references(() => investors.id, {
      onDelete: 'cascade',
    }),
    meetingType: varchar('meeting_type', { length: 100 }),
    keyword: varchar('keyword', { length: 100 }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    region: varchar('region', { length: 100 }),

    // IREI 점수
    ireiScore: numeric('irei_score', { precision: 10, scale: 4 }).notNull(),
    rank: integer('rank'),
    percentile: numeric('percentile', { precision: 5, scale: 2 }),

    // 계산 요소 (JSONB)
    factors: jsonb('factors').$type<{
      shareChangeRate?: number;
      meetingCount?: number;
      totalCostKrw?: number;
      meetingDurationHours?: number;
      visitorCount?: number;
      efficiencyPerMillion?: number;
      [key: string]: any;
    }>(),

    // 분기 정보
    year: smallint('year'),
    quarter: smallint('quarter'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    dateTypeIdx: index('irei_date_type_idx').on(
      table.calculationDate,
      table.calculationType,
    ),
    investorIdx: index('irei_investor_idx').on(table.investorId),
    scoreIdx: index('irei_score_idx').on(table.ireiScore),
    quarterIdx: index('irei_quarter_idx').on(table.year, table.quarter),
  }),
);

// ==================== Relations ====================

export const investorActivityOutcomesRelations = relations(
  investorActivityOutcomes,
  ({ one }) => ({
    irActivity: one(irActivities, {
      fields: [investorActivityOutcomes.irActivityId],
      references: [irActivities.id],
    }),
    investor: one(investors, {
      fields: [investorActivityOutcomes.investorId],
      references: [investors.id],
    }),
    snapshotBefore: one(investorSnapshots, {
      fields: [investorActivityOutcomes.snapshotBeforeId],
      references: [investorSnapshots.id],
      relationName: 'snapshot_before',
    }),
    snapshotAfter: one(investorSnapshots, {
      fields: [investorActivityOutcomes.snapshotAfterId],
      references: [investorSnapshots.id],
      relationName: 'snapshot_after',
    }),
  }),
);

export const ireiCalculationsRelations = relations(
  ireiCalculations,
  ({ one }) => ({
    investor: one(investors, {
      fields: [ireiCalculations.investorId],
      references: [investors.id],
    }),
    user: one(users, {
      fields: [ireiCalculations.userId],
      references: [users.id],
    }),
  }),
);

// ==================== Zod Schemas ====================

export const insertInvestorActivityOutcomeSchema = createInsertSchema(
  investorActivityOutcomes,
);
export const selectInvestorActivityOutcomeSchema = createSelectSchema(
  investorActivityOutcomes,
);

export const insertStockPriceSchema = createInsertSchema(stockPrices);
export const selectStockPriceSchema = createSelectSchema(stockPrices);

export const insertMarketEventSchema = createInsertSchema(marketEvents);
export const selectMarketEventSchema = createSelectSchema(marketEvents);

export const insertMarketIndicatorSchema = createInsertSchema(marketIndicators);
export const selectMarketIndicatorSchema = createSelectSchema(marketIndicators);

export const insertIreiCalculationSchema = createInsertSchema(ireiCalculations);
export const selectIreiCalculationSchema = createSelectSchema(ireiCalculations);

// ==================== TypeScript Types ====================

export type InvestorActivityOutcome =
  typeof investorActivityOutcomes.$inferSelect;
export type NewInvestorActivityOutcome =
  typeof investorActivityOutcomes.$inferInsert;

export type StockPrice = typeof stockPrices.$inferSelect;
export type NewStockPrice = typeof stockPrices.$inferInsert;

export type MarketEvent = typeof marketEvents.$inferSelect;
export type NewMarketEvent = typeof marketEvents.$inferInsert;

export type MarketIndicator = typeof marketIndicators.$inferSelect;
export type NewMarketIndicator = typeof marketIndicators.$inferInsert;

export type IreiCalculation = typeof ireiCalculations.$inferSelect;
export type NewIreiCalculation = typeof ireiCalculations.$inferInsert;
