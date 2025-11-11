# IR Insights DB 스키마 재설계 계획서

> **작성일**: 2025-11-11
> **목적**: IR Insights 페이지 구현을 위한 DB 스키마 확장 및 재설계

---

## 📋 목차

1. [현재 DB 스키마 분석](#현재-db-스키마-분석)
2. [핵심 문제점 및 해결 방안](#핵심-문제점-및-해결-방안)
3. [새로운 스키마 설계](#새로운-스키마-설계)
4. [마이그레이션 전략](#마이그레이션-전략)
5. [구현 우선순위](#구현-우선순위)

---

## 현재 DB 스키마 분석

### ✅ 사용 가능한 구조

#### 1. IR 활동 시스템 (`ir.schema.ts`)

```
irActivities (메인 활동)
├── irSubActivities (하위 활동)
├── irActivityKbParticipants (KB 담당자 - users 참조)
├── irActivityVisitors (외부 방문자 - 텍스트만 저장) ⚠️
├── irActivityKeywords (키워드)
├── irActivityAttachments (첨부파일)
└── irActivityLogs (이력)
```

**문제점**:
- `irActivityVisitors.visitorName`: 단순 텍스트 (투자자 실체와 연결 안 됨)
- `investors` 테이블과 관계 없음

#### 2. 투자자 시스템 (`investor.schema.ts`)

```
investors (투자자 기본 정보)
├── investorSnapshots (분기별 지분 스냅샷) ✅
│   ├── year, quarter
│   ├── sOverO, ord, adr
│   ├── investorType, styleTag, turnover, orientation
│   └── uploadBatchId (GID 연동)
├── investorHistories (변경 이력) ✅
├── investorMeetings (면담 이력)
├── investorInterests (관심 토픽)
├── investorActivities (활동 타임라인)
└── investorCommunications (커뮤니케이션)
```

**문제점**:
- IR activity와 연결 안 됨
- `investorMeetings`, `investorActivities` 등이 `irActivities`와 별도로 존재 (중복)

#### 3. GID 업로드 시스템 (구축 완료)

```
gidUploadBatches (업로드 배치)
└── gidUploadRows (원본 행)
    └── mappedInvestorId (investors 연결)
```

**장점**: 이미 구축되어 있음!

---

## 핵심 문제점 및 해결 방안

### 🔴 Problem 1: IR Activity ↔ Investor 연결 부재

**현재 상황**:
```typescript
// irActivityVisitors
{
  activityId: "ACT001",
  visitorName: "BlackRock Investment",  // 단순 텍스트
  visitorType: "investor",
  company: "BlackRock"
}

// investors
{
  id: 123,
  name: "BlackRock",  // 표기가 다를 수 있음!
  ...
}
```

**문제**:
- `visitorName`과 `investors.name`을 어떻게 매칭?
- 동명이인, 표기 차이 (BlackRock vs BlackRock Investment)
- 지분 변화 추적 불가

**✅ 해결 방안**:

#### Option A: `irActivityVisitors`에 `investorId` 추가 (권장)

```typescript
export const irActivityVisitors = pgTable('ir_activity_visitors', {
  activityId: varchar('activity_id', { length: 50 })
    .references(() => irActivities.id, { onDelete: 'cascade' })
    .notNull(),

  // 🆕 투자자 실체 연결
  investorId: integer('investor_id')
    .references(() => investors.id, { onDelete: 'set null' }),

  // 기존 필드들 (fallback용)
  visitorName: varchar('visitor_name', { length: 255 }).notNull(),
  visitorType: varchar('visitor_type', { length: 20 }), // 'investor' or 'broker'
  company: varchar('company', { length: 255 }),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
```

**장점**:
- 기존 데이터 보존 (`visitorName` 유지)
- 점진적 마이그레이션 가능
- `investorId`가 null이면 브로커 또는 매칭 안 된 투자자

**단점**:
- 기존 데이터에 대해 `investorId` 매칭 작업 필요

#### Option B: 중개 매핑 테이블 생성 (복잡도 높음)

```typescript
export const investorNameMappings = pgTable('investor_name_mappings', {
  id: serial('id').primaryKey(),
  investorId: integer('investor_id')
    .notNull()
    .references(() => investors.id, { onDelete: 'cascade' }),
  alias: varchar('alias', { length: 255 }).notNull(), // "BlackRock Investment"
  isPrimary: boolean('is_primary').default(false),
});
```

**추천**: **Option A**가 더 단순하고 효율적

---

### 🔴 Problem 2: 지분 변화 추적 시스템 부재

**필요한 기능**:
- IR 활동 후 투자자의 지분 변화 추적
- 매수/매도 반응 여부 판단
- 효율성 지표 계산

**✅ 해결 방안**: 새 테이블 `investorActivityOutcomes` 생성

```typescript
export const investorActivityOutcomes = pgTable('investor_activity_outcomes', {
  id: serial('id').primaryKey(),

  // 연결
  irActivityId: varchar('ir_activity_id', { length: 50 })
    .references(() => irActivities.id, { onDelete: 'cascade' })
    .notNull(),
  investorId: integer('investor_id')
    .references(() => investors.id, { onDelete: 'cascade' })
    .notNull(),

  // 전후 스냅샷 참조
  snapshotBeforeId: integer('snapshot_before_id')
    .references(() => investorSnapshots.id, { onDelete: 'set null' }),
  snapshotAfterId: integer('snapshot_after_id')
    .references(() => investorSnapshots.id, { onDelete: 'set null' }),

  // 계산된 변화량
  shareChangeRate: numeric('share_change_rate', { precision: 10, scale: 4 }), // 지분율 변화 (%)
  shareCountChange: bigint('share_count_change', { mode: 'number' }), // 주식수 변화 (ord + adr)
  sOverOChange: numeric('s_over_o_change', { precision: 10, scale: 4 }), // S/O 변화

  // 반응 분류
  purchaseResponse: boolean('purchase_response').default(false), // 매수 반응 여부
  responseType: varchar('response_type', { length: 50 }), // 'BUY', 'SELL', 'HOLD', 'NO_CHANGE'

  // 효율성 지표
  efficiencyScore: numeric('efficiency_score', { precision: 10, scale: 4 }),

  // 메타데이터
  measurementPeriodDays: integer('measurement_period_days').default(90), // 측정 기간 (기본 90일)
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**계산 로직 예시**:

```typescript
async function linkActivityToShareChange(activityId: string) {
  const activity = await getActivity(activityId);
  const visitors = await getActivityVisitors(activityId); // investorId가 있는 것만

  for (const visitor of visitors) {
    if (!visitor.investorId) continue;

    // 활동 전 스냅샷 (활동 시작일 기준 가장 최근)
    const snapshotBefore = await getLatestSnapshotBefore(
      visitor.investorId,
      activity.startDatetime
    );

    // 활동 후 스냅샷 (활동 후 90일 이내 가장 최근)
    const snapshotAfter = await getLatestSnapshotAfter(
      visitor.investorId,
      activity.startDatetime,
      90
    );

    if (!snapshotBefore || !snapshotAfter) continue;

    // 지분 변화율 계산
    const shareChangeRate =
      ((snapshotAfter.sOverO - snapshotBefore.sOverO) / snapshotBefore.sOverO) * 100;

    const shareCountChange =
      (snapshotAfter.ord + snapshotAfter.adr) -
      (snapshotBefore.ord + snapshotBefore.adr);

    // 매수 반응 판단
    const purchaseResponse = shareCountChange > 0;

    await createOutcome({
      irActivityId: activityId,
      investorId: visitor.investorId,
      snapshotBeforeId: snapshotBefore.id,
      snapshotAfterId: snapshotAfter.id,
      shareChangeRate,
      shareCountChange,
      purchaseResponse,
      responseType: classifyResponse(shareCountChange),
    });
  }
}
```

---

### 🔴 Problem 3: 주가 및 시장 데이터 부재

**✅ 해결 방안**: 3개의 새 테이블 생성

#### 1) `stockPrices` - 일별 주가 데이터

```typescript
export const stockPrices = pgTable('stock_prices', {
  id: serial('id').primaryKey(),

  date: timestamp('date', { withTimezone: true, mode: 'date' }).notNull(),
  ticker: varchar('ticker', { length: 20 }).default('KB'), // 향후 복수 종목 대응

  // OHLCV
  openPrice: numeric('open_price', { precision: 12, scale: 2 }),
  highPrice: numeric('high_price', { precision: 12, scale: 2 }),
  lowPrice: numeric('low_price', { precision: 12, scale: 2 }),
  closePrice: numeric('close_price', { precision: 12, scale: 2 }),
  volume: bigint('volume', { mode: 'number' }),

  // 계산 값
  changeAmount: numeric('change_amount', { precision: 12, scale: 2 }), // 전일 대비 변화액
  changeRate: numeric('change_rate', { precision: 10, scale: 4 }), // 전일 대비 변화율 (%)

  // 메타
  dataSource: varchar('data_source', { length: 100 }), // 'KRX', 'YAHOO_FINANCE', 'MANUAL'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueDateTicker: uniqueIndex('stock_prices_date_ticker_idx').on(table.date, table.ticker),
  dateIdx: index('stock_prices_date_idx').on(table.date),
}));
```

#### 2) `marketEvents` - 외부 시장 이벤트

```typescript
export const marketEventCategoryEnum = pgEnum('market_event_category', [
  'MACRO',        // 거시경제
  'COMPANY',      // 기업 공시
  'INDUSTRY',     // 산업 이슈
  'REGULATORY',   // 규제/정책
]);

export const marketEvents = pgTable('market_events', {
  id: serial('id').primaryKey(),

  // 이벤트 정보
  eventDate: timestamp('event_date', { withTimezone: true, mode: 'date' }).notNull(),
  eventName: varchar('event_name', { length: 255 }).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(), // '정부정책', '실적발표', '주주환원', '금리정책' 등
  eventCategory: marketEventCategoryEnum('event_category'),

  // 상세 정보
  description: text('description'),
  source: varchar('source', { length: 255 }), // 출처
  importanceLevel: integer('importance_level').default(5), // 1-10 (중요도)

  // 영향도
  stockPriceImpact: numeric('stock_price_impact', { precision: 10, scale: 4 }), // 주가 영향도 (%)
  shortTermImpact: numeric('short_term_impact', { precision: 10, scale: 4 }), // 단기 영향 (1주일)
  mediumTermImpact: numeric('medium_term_impact', { precision: 10, scale: 4 }), // 중기 영향 (1개월)
  longTermImpact: numeric('long_term_impact', { precision: 10, scale: 4 }), // 장기 영향 (3개월)

  // 연결
  relatedKeywords: text('related_keywords').array(), // 관련 키워드 배열

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dateIdx: index('market_events_date_idx').on(table.eventDate),
  typeIdx: index('market_events_type_idx').on(table.eventType),
  categoryIdx: index('market_events_category_idx').on(table.eventCategory),
}));
```

#### 3) `marketIndicators` - 시장 지표

```typescript
export const marketIndicatorCategoryEnum = pgEnum('market_indicator_category', [
  'INDEX',         // 주가지수
  'FX',            // 환율
  'INTEREST_RATE', // 금리
  'COMMODITY',     // 원자재
]);

export const marketIndicators = pgTable('market_indicators', {
  id: serial('id').primaryKey(),

  // 지표 정보
  indicatorName: varchar('indicator_name', { length: 100 }).notNull(), // 'KOSPI', 'USD_KRW', 'CD_RATE' 등
  indicatorCategory: marketIndicatorCategoryEnum('indicator_category'),
  date: timestamp('date', { withTimezone: true, mode: 'date' }).notNull(),

  // 값
  value: numeric('value', { precision: 18, scale: 6 }).notNull(),
  openValue: numeric('open_value', { precision: 18, scale: 6 }),
  highValue: numeric('high_value', { precision: 18, scale: 6 }),
  lowValue: numeric('low_value', { precision: 18, scale: 6 }),
  closeValue: numeric('close_value', { precision: 18, scale: 6 }),

  // 변화
  changeAmount: numeric('change_amount', { precision: 18, scale: 6 }),
  changeRate: numeric('change_rate', { precision: 10, scale: 4 }), // 변화율 (%)

  // 메타
  dataSource: varchar('data_source', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueNameDate: uniqueIndex('market_indicators_name_date_idx').on(table.indicatorName, table.date),
  dateIdx: index('market_indicators_date_idx').on(table.date),
  categoryIdx: index('market_indicators_category_idx').on(table.indicatorCategory),
}));
```

---

### 🔴 Problem 4: 투자자 세부 속성 부족

**✅ 해결 방안**: `investors` 테이블 확장

```typescript
export const investmentStyleEnum = pgEnum('investment_style', [
  'GROWTH',
  'MOMENTUM',
  'DEEP_VALUE',
  'ESG',
  'GARP',
  'INDEX',
  'FACTOR',
  'SMART_BETA',
  'THEMATIC',
  'EVENT_DRIVEN',
]);

export const investmentStrategyEnum = pgEnum('investment_strategy', [
  'ACTIVE',
  'PASSIVE',
  'OPPORTUNISTIC',
  'LONG_TERM',
]);

// ALTER TABLE investors ADD COLUMN ...
export const investors = pgTable('investors', {
  // ... 기존 필드들 ...

  // 🆕 추가 필드
  eum: numeric('eum', { precision: 18, scale: 2 }), // 자산운용규모 (단위: Million USD)
  investmentStyle: investmentStyleEnum('investment_style'), // 투자 스타일
  strategy: investmentStrategyEnum('strategy'), // 투자 전략

  // ... 기존 필드들 ...
}, (table) => ({
  // ... 기존 인덱스 ...

  // 🆕 새 인덱스
  styleIdx: index('investors_style_idx').on(table.investmentStyle),
  strategyIdx: index('investors_strategy_idx').on(table.strategy),
  eumIdx: index('investors_eum_idx').on(table.eum),
}));
```

---

## 새로운 스키마 설계

### 📁 파일 구조

```
src/database/schemas/
├── users.ts                      # 기존 (변경 없음)
├── ir.schema.ts                  # 🔄 수정 (irActivityVisitors에 investorId 추가)
├── investor.schema.ts            # 🔄 수정 (eum, investmentStyle, strategy 추가)
├── ir-insights.schema.ts         # 🆕 신규 (IR Insights 전용)
│   ├── investorActivityOutcomes
│   ├── stockPrices
│   ├── marketEvents
│   ├── marketIndicators
│   └── ireiCalculations
└── index.ts                      # 전체 export
```

### 🆕 `ir-insights.schema.ts` 전체 코드

아래 코드는 새로 생성할 파일입니다.

```typescript
// src/database/schemas/ir-insights.schema.ts

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
  'MACRO',
  'COMPANY',
  'INDUSTRY',
  'REGULATORY',
]);

export const marketIndicatorCategoryEnum = pgEnum('market_indicator_category', [
  'INDEX',
  'FX',
  'INTEREST_RATE',
  'COMMODITY',
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

// ==================== 2. Stock Prices ====================

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
    dataSource: varchar('data_source', { length: 100 }),
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

    eventDate: timestamp('event_date', { withTimezone: true, mode: 'date' }).notNull(),
    eventName: varchar('event_name', { length: 255 }).notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    eventCategory: marketEventCategoryEnum('event_category'),

    description: text('description'),
    source: varchar('source', { length: 255 }),
    importanceLevel: integer('importance_level').default(5),

    // 영향도
    stockPriceImpact: numeric('stock_price_impact', { precision: 10, scale: 4 }),
    shortTermImpact: numeric('short_term_impact', { precision: 10, scale: 4 }),
    mediumTermImpact: numeric('medium_term_impact', { precision: 10, scale: 4 }),
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

    indicatorName: varchar('indicator_name', { length: 100 }).notNull(),
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

    // 계산 요소 (JSONB로 유연하게 저장)
    factors: text('factors').$type<{
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
```

---

## 마이그레이션 전략

### Phase 1: 스키마 수정 및 신규 테이블 생성 (1주)

#### Step 1.1: `ir.schema.ts` 수정

```typescript
// irActivityVisitors 테이블에 investorId 추가
export const irActivityVisitors = pgTable(
  'ir_activity_visitors',
  {
    activityId: varchar('activity_id', { length: 50 })
      .references(() => irActivities.id, { onDelete: 'cascade' })
      .notNull(),

    // 🆕 추가
    investorId: integer('investor_id').references(() => investors.id, {
      onDelete: 'set null',
    }),

    // 기존 필드들
    visitorName: varchar('visitor_name', { length: 255 }).notNull(),
    visitorType: varchar('visitor_type', { length: 20 }),
    company: varchar('company', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: { columns: [table.activityId, table.visitorName] },
    // 🆕 새 인덱스
    investorIdx: index('ir_activity_visitors_investor_idx').on(table.investorId),
  }),
);

// Relations 추가
export const irActivityVisitorsRelations = relations(
  irActivityVisitors,
  ({ one }) => ({
    activity: one(irActivities, {
      fields: [irActivityVisitors.activityId],
      references: [irActivities.id],
    }),
    // 🆕 추가
    investor: one(investors, {
      fields: [irActivityVisitors.investorId],
      references: [investors.id],
    }),
  }),
);
```

#### Step 1.2: `investor.schema.ts` 수정

```typescript
export const investmentStyleEnum = pgEnum('investment_style', [
  'GROWTH',
  'MOMENTUM',
  'DEEP_VALUE',
  'ESG',
  'GARP',
  'INDEX',
  'FACTOR',
  'SMART_BETA',
  'THEMATIC',
  'EVENT_DRIVEN',
]);

export const investmentStrategyEnum = pgEnum('investment_strategy', [
  'ACTIVE',
  'PASSIVE',
  'OPPORTUNISTIC',
  'LONG_TERM',
]);

export const investors = pgTable(
  'investors',
  {
    // ... 기존 필드들 ...

    // 🆕 추가
    eum: numeric('eum', { precision: 18, scale: 2 }),
    investmentStyle: investmentStyleEnum('investment_style'),
    strategy: investmentStrategyEnum('strategy'),

    // ... 기존 필드들 ...
  },
  (t) => ({
    // ... 기존 인덱스 ...

    // 🆕 새 인덱스
    styleIdx: index('investors_style_idx').on(t.investmentStyle),
    strategyIdx: index('investors_strategy_idx').on(t.strategy),
    eumIdx: index('investors_eum_idx').on(t.eum),
  }),
);
```

#### Step 1.3: `ir-insights.schema.ts` 생성

위의 전체 코드를 새 파일로 생성

#### Step 1.4: Migration 생성 및 적용

```bash
cd boiler-plate-backend

# 마이그레이션 생성
npm run db:generate

# 생성된 SQL 리뷰
# src/database/migrations/XXXX_ir_insights_schema.sql

# 마이그레이션 적용
npm run db:push
```

### Phase 2: 기존 데이터 마이그레이션 (1주)

#### Step 2.1: 투자자 매칭 스크립트

```typescript
// scripts/match-visitors-to-investors.ts

import { db } from '../src/database/db';
import { irActivityVisitors } from '../src/database/schemas/ir.schema';
import { investors } from '../src/database/schemas/investor.schema';
import { eq, sql } from 'drizzle-orm';

async function matchVisitorsToInvestors() {
  console.log('Starting visitor-to-investor matching...');

  // 1. 정확히 일치하는 것들 먼저 매칭
  await db.execute(sql`
    UPDATE ir_activity_visitors v
    SET investor_id = i.id
    FROM investors i
    WHERE v.visitor_name = i.name
      AND v.investor_id IS NULL
      AND v.visitor_type = 'investor';
  `);

  console.log('Exact matches completed.');

  // 2. 유사 매칭 (Levenshtein distance 또는 fuzzy matching)
  // 예: "BlackRock Investment" vs "BlackRock"
  await db.execute(sql`
    UPDATE ir_activity_visitors v
    SET investor_id = i.id
    FROM investors i
    WHERE similarity(v.visitor_name, i.name) > 0.7
      AND v.investor_id IS NULL
      AND v.visitor_type = 'investor';
  `);

  console.log('Fuzzy matches completed.');

  // 3. 매칭 안 된 것들 리포트
  const unmatched = await db
    .select({
      visitorName: irActivityVisitors.visitorName,
      count: sql<number>`count(*)`,
    })
    .from(irActivityVisitors)
    .where(
      sql`${irActivityVisitors.investorId} IS NULL AND ${irActivityVisitors.visitorType} = 'investor'`,
    )
    .groupBy(irActivityVisitors.visitorName);

  console.log('Unmatched visitors:', unmatched);
  console.log('Matching completed.');
}

matchVisitorsToInvestors();
```

#### Step 2.2: 스냅샷 연결 및 지분 변화 계산

```typescript
// scripts/calculate-share-changes.ts

import { db } from '../src/database/db';
import {
  investorActivityOutcomes,
  NewInvestorActivityOutcome,
} from '../src/database/schemas/ir-insights.schema';
import { irActivities } from '../src/database/schemas/ir.schema';
import { investorSnapshots } from '../src/database/schemas/investor.schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';

async function calculateShareChanges() {
  console.log('Calculating share changes for activities...');

  // 모든 IR 활동 가져오기
  const activities = await db
    .select()
    .from(irActivities)
    .orderBy(irActivities.startDatetime);

  for (const activity of activities) {
    // 활동의 투자자 방문자들
    const visitors = await db
      .select()
      .from(irActivityVisitors)
      .where(
        and(
          eq(irActivityVisitors.activityId, activity.id),
          isNull(irActivityVisitors.investorId).not(),
        ),
      );

    for (const visitor of visitors) {
      const investorId = visitor.investorId!;

      // 활동 전 스냅샷 (활동일 기준 가장 최근)
      const snapshotsBefore = await db
        .select()
        .from(investorSnapshots)
        .where(
          and(
            eq(investorSnapshots.investorId, investorId),
            // createdAt을 year/quarter로 비교해야 함 (추가 로직 필요)
          ),
        )
        .orderBy(investorSnapshots.year, investorSnapshots.quarter)
        .limit(1);

      // 활동 후 스냅샷 (활동일 + 90일 이내 가장 최근)
      const snapshotsAfter = await db
        .select()
        .from(investorSnapshots)
        .where(
          and(
            eq(investorSnapshots.investorId, investorId),
            // year/quarter 비교 로직
          ),
        )
        .orderBy(investorSnapshots.year, investorSnapshots.quarter)
        .limit(1);

      if (snapshotsBefore.length === 0 || snapshotsAfter.length === 0) {
        continue;
      }

      const before = snapshotsBefore[0];
      const after = snapshotsAfter[0];

      // 지분 변화 계산
      const shareChangeRate =
        before.sOverO && after.sOverO
          ? ((after.sOverO - before.sOverO) / before.sOverO) * 100
          : null;

      const shareCountChange =
        (after.ord ?? 0) + (after.adr ?? 0) - ((before.ord ?? 0) + (before.adr ?? 0));

      const purchaseResponse = shareCountChange > 0;

      // 저장
      await db.insert(investorActivityOutcomes).values({
        irActivityId: activity.id,
        investorId,
        snapshotBeforeId: before.id,
        snapshotAfterId: after.id,
        shareChangeRate: shareChangeRate?.toString(),
        shareCountChange,
        purchaseResponse,
        responseType: classifyResponse(shareCountChange),
      });
    }

    console.log(`Processed activity ${activity.id}`);
  }

  console.log('Share change calculation completed.');
}

function classifyResponse(change: number): string {
  if (change > 1000000) return 'BUY';
  if (change < -1000000) return 'SELL';
  if (change !== 0) return 'ADJUST';
  return 'HOLD';
}

calculateShareChanges();
```

### Phase 3: 데이터 수집 자동화 (2주)

#### 주가 데이터 수집 배치

```typescript
// src/batch/stock-price-collector.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { db } from '../database/db';
import { stockPrices } from '../database/schemas/ir-insights.schema';
import axios from 'axios';

@Injectable()
export class StockPriceCollectorService {
  private readonly logger = new Logger(StockPriceCollectorService.name);

  @Cron('0 18 * * 1-5') // 평일 오후 6시
  async collectDailyStockPrice() {
    const today = new Date();
    this.logger.log(`Collecting stock price for ${today.toISOString()}`);

    try {
      // Yahoo Finance API 또는 KRX API 호출
      const priceData = await this.fetchStockPrice(today);

      await db.insert(stockPrices).values({
        date: today,
        ticker: 'KB',
        openPrice: priceData.open.toString(),
        highPrice: priceData.high.toString(),
        lowPrice: priceData.low.toString(),
        closePrice: priceData.close.toString(),
        volume: priceData.volume,
        dataSource: 'YAHOO_FINANCE',
      });

      this.logger.log('Stock price collected successfully');
    } catch (error) {
      this.logger.error('Failed to collect stock price', error);
    }
  }

  private async fetchStockPrice(date: Date) {
    // Yahoo Finance API 구현
    const response = await axios.get(
      'https://query1.finance.yahoo.com/v8/finance/chart/105560.KS',
      {
        params: {
          period1: Math.floor(date.getTime() / 1000),
          period2: Math.floor(date.getTime() / 1000) + 86400,
          interval: '1d',
        },
      },
    );

    const quote = response.data.chart.result[0].indicators.quote[0];
    return {
      open: quote.open[0],
      high: quote.high[0],
      low: quote.low[0],
      close: quote.close[0],
      volume: quote.volume[0],
    };
  }
}
```

---

## 구현 우선순위

### 🔥 Phase 0: 데이터팀 미팅 (ASAP)

**체크리스트** (`IR_INSIGHTS_DATA_REQUIREMENTS.md` 참고):

- [ ] GID 파일 샘플 요청
- [ ] GID 파일 구조 확인 (컬럼명, 데이터 타입)
- [ ] 투자자 매칭 룰 협의
- [ ] 과거 데이터 제공 범위 확인
- [ ] 주가/시장 데이터 제공 가능 여부 확인
- [ ] 데이터 제공 주기 및 자동화 방안 협의

### 🔥 Phase 1: 핵심 인프라 (2-3주) - P0

- [ ] `ir.schema.ts` 수정 (`investorId` 추가)
- [ ] `investor.schema.ts` 수정 (`eum`, `investmentStyle`, `strategy` 추가)
- [ ] `ir-insights.schema.ts` 생성
- [ ] Migration 생성 및 적용
- [ ] 투자자 매칭 스크립트 실행
- [ ] 지분 변화 계산 스크립트 실행

### 📈 Phase 2: 데이터 수집 자동화 (2주) - P1

- [ ] 주가 수집 배치 구현
- [ ] 시장 지표 수집 배치 구현
- [ ] 수집 실패 알림 설정

### 🧮 Phase 3: API 구현 (3-4주) - P1

- [ ] IR Insights 집계 API
- [ ] 8개 차트별 데이터 제공 API
- [ ] 통계 분석 모듈 (상관계수, 추세선)

### 🏆 Phase 4: IREI 시스템 (2-3주) - P2

- [ ] IREI 계산 알고리즘 설계
- [ ] 자동 계산 배치 작업
- [ ] 리더보드 API

---

## 다음 단계

1. **데이터팀 미팅 일정 잡기** (최우선)
2. **이 문서 리뷰 및 승인** (PM/아키텍트)
3. **Phase 1 착수** (스키마 수정)

---

**작성자**: Claude Code
**최종 수정일**: 2025-11-11
