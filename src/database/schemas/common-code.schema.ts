import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  integer,
  text,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

/**
 * Common Code Table
 *
 * 시스템 전체에서 사용되는 공통코드를 관리하는 테이블
 *
 * 코드 그룹 예시:
 * - IR_ACTIVITY_STATUS: IR 활동 상태
 * - IR_ACTIVITY_CATEGORY: IR 활동 카테고리
 * - IR_ACTIVITY_TYPE_PRIMARY: IR 활동 유형 (대분류)
 * - IR_ACTIVITY_TYPE_SECONDARY: IR 활동 유형 (소분류)
 */
export const commonCodes = pgTable(
  'common_codes',
  {
    // 코드 그룹 (예: IR_ACTIVITY_STATUS)
    codeGroup: varchar('code_group', { length: 50 }).notNull(),

    // 코드 키 (영문, 예: SCHEDULED)
    codeKey: varchar('code_key', { length: 50 }).notNull(),

    // 코드 라벨 (한글, UI 표시용, 예: 예정)
    codeLabel: varchar('code_label', { length: 100 }).notNull(),

    // 코드 설명
    description: text('description'),

    // 표시 순서
    displayOrder: integer('display_order').default(0).notNull(),

    // 사용 여부
    isActive: boolean('is_active').default(true).notNull(),

    // 추가 데이터 (JSON 형태로 저장 가능, 예: { color: 'blue' })
    extraData: text('extra_data'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.codeGroup, table.codeKey] }),
  }),
);

// Zod Schemas
export const insertCommonCodeSchema = createInsertSchema(commonCodes);
export const selectCommonCodeSchema = createSelectSchema(commonCodes);

// TypeScript Types
export type CommonCode = typeof commonCodes.$inferSelect;
export type NewCommonCode = typeof commonCodes.$inferInsert;

/**
 * 코드 그룹 상수
 */
export const CODE_GROUPS = {
  // IR Activity Status
  IR_ACTIVITY_STATUS: 'IR_ACTIVITY_STATUS',

  // IR Activity Category
  IR_ACTIVITY_CATEGORY: 'IR_ACTIVITY_CATEGORY',

  // IR Activity Type Primary
  IR_ACTIVITY_TYPE_PRIMARY: 'IR_ACTIVITY_TYPE_PRIMARY',

  // IR Activity Type Secondary
  IR_ACTIVITY_TYPE_SECONDARY: 'IR_ACTIVITY_TYPE_SECONDARY',
} as const;

export type CodeGroup = (typeof CODE_GROUPS)[keyof typeof CODE_GROUPS];
