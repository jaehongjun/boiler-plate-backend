import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  smallint,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users } from './users';

// ==================== Enums ====================

export const investorTypeEnum = pgEnum('investor_type', [
  'INVESTMENT_ADVISOR',
  'HEDGE_FUND',
  'PENSION',
  'SOVEREIGN',
  'MUTUAL_FUND',
  'ETF',
  'BANK',
  'INSURANCE',
  'OTHER',
]);

export const turnoverEnum = pgEnum('turnover', ['LOW', 'MEDIUM', 'HIGH']);

export const orientationEnum = pgEnum('orientation', ['ACTIVE', 'INACTIVE']);

export const styleTagEnum = pgEnum('style_tag', [
  'POSITIVE',
  'NEUTRAL',
  'NEGATIVE',
  'QUESTION_HEAVY',
  'PICKY',
  'OTHER',
]);

export const uploadStatusEnum = pgEnum('upload_status', [
  'PENDING',
  'PROCESSED',
  'FAILED',
]);

// ==================== Reference Tables ====================

// Countries reference table
export const countries = pgTable(
  'countries',
  {
    code: varchar('code', { length: 2 }).primaryKey(), // ISO-3166-1 alpha-2
    nameKo: varchar('name_ko', { length: 100 }).notNull(),
    nameEn: varchar('name_en', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    nameKoIdx: index('countries_name_ko_idx').on(t.nameKo),
    nameEnIdx: index('countries_name_en_idx').on(t.nameEn),
  }),
);

// ==================== Core: Investors (Parent/Child hierarchy) ====================

export const investors = pgTable(
  'investors',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull(), // 기관명 (예: BlackRock Investment)
    parentId: integer('parent_id').references((): any => investors.id, {
      onDelete: 'set null',
    }), // null이면 모회사(그룹 대표)
    countryCode: varchar('country_code', { length: 2 }).references(
      () => countries.code,
      { onDelete: 'set null' },
    ),
    city: varchar('city', { length: 120 }), // 도시 (도쿄/완차이/포트루이스)
    isGroupRepresentative: boolean('is_group_representative')
      .default(false)
      .notNull(), // 대표 row 여부

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    nameIdx: index('investors_name_idx').on(t.name),
    parentIdx: index('investors_parent_idx').on(t.parentId),
    countryIdx: index('investors_country_idx').on(t.countryCode),
  }),
);

// ==================== Snapshots (Year/Quarter metrics + ranking) ====================

export const investorSnapshots = pgTable(
  'investor_snapshots',
  {
    id: serial('id').primaryKey(),
    investorId: integer('investor_id')
      .notNull()
      .references(() => investors.id, { onDelete: 'cascade' }),

    year: smallint('year').notNull(), // 예: 2024
    quarter: smallint('quarter').notNull(), // 1~4

    // 그룹 대표 행의 순위 (예: 1, 2, 3 ...). 자회사 행은 null
    groupRank: smallint('group_rank'),
    // 그룹 내 자회사 수 (대표 스냅샷에만 의미)
    groupChildCount: smallint('group_child_count'),

    sOverO: smallint('s_over_o'), // & S/O (percentage)
    ord: integer('ord'), // Ordinary shares - need larger range
    adr: integer('adr'), // ADR shares - need larger range

    investorType: investorTypeEnum('investor_type'),
    styleTag: styleTagEnum('style_tag'), // 태그 (긍정적 등)
    styleNote: varchar('style_note', { length: 120 }), // 자유 메모 (질문 많음, 까칠함 등)

    turnover: turnoverEnum('turnover'),
    orientation: orientationEnum('orientation'),

    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }), // 마지막 활동일자

    // GID 업로드 배치 연동
    uploadBatchId: integer('upload_batch_id').references(
      (): any => gidUploadBatches.id,
      { onDelete: 'set null' },
    ),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    // 동일 투자자/연도/분기 1건 보장 (스냅샷 정규화)
    uq: uniqueIndex('investor_snapshots_uq').on(
      t.investorId,
      t.year,
      t.quarter,
    ),
    periodIdx: index('investor_snapshots_period_idx').on(t.year, t.quarter),
    rankIdx: index('investor_snapshots_rank_idx').on(t.groupRank),
  }),
);

// ==================== History (Timestamp/Period/User + Changes) ====================

export const investorHistories = pgTable(
  'investor_histories',
  {
    id: serial('id').primaryKey(),
    investorId: integer('investor_id')
      .notNull()
      .references(() => investors.id, { onDelete: 'cascade' }),

    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .defaultNow()
      .notNull(), // 기록 시각
    year: smallint('year').notNull(),
    quarter: smallint('quarter').notNull(),

    // 담당자 (누가 업데이트했는지)
    updatedBy: uuid('updated_by').references(() => users.id, {
      onDelete: 'set null',
    }),

    // 변경 내용 (diff 스냅샷)
    // 예: { orientation: ["INACTIVE","ACTIVE"], turnover: ["LOW","HIGH"] }
    changes: jsonb('changes').$type<
      Partial<{
        sOverO: [number | null, number | null];
        ord: [number | null, number | null];
        adr: [number | null, number | null];
        investorType: [string | null, string | null];
        styleTag: [string | null, string | null];
        styleNote: [string | null, string | null];
        turnover: [string | null, string | null];
        orientation: [string | null, string | null];
        lastActivityAt: [string | null, string | null]; // ISO
        groupRank: [number | null, number | null];
        groupChildCount: [number | null, number | null];
      }>
    >(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    investorIdx: index('investor_histories_investor_idx').on(t.investorId),
    periodIdx: index('investor_histories_period_idx').on(t.year, t.quarter),
    updatedByIdx: index('investor_histories_updated_by_idx').on(t.updatedBy),
  }),
);

// ==================== Meeting History ====================

export const investorMeetings = pgTable(
  'investor_meetings',
  {
    id: serial('id').primaryKey(),
    investorId: integer('investor_id')
      .notNull()
      .references(() => investors.id, { onDelete: 'cascade' }),

    meetingDate: timestamp('meeting_date', { withTimezone: true }).notNull(),
    meetingType: varchar('meeting_type', { length: 50 }).notNull(), // One-on-One, NDR, CEO 방문, Conference 등
    topic: varchar('topic', { length: 200 }),
    participants: text('participants'), // John, Harold, Rahul 등
    tags: jsonb('tags').$type<string[]>(), // 방문형태, 주주총회 등

    changeRate: varchar('change_rate', { length: 20 }), // +5.2%, -5.2% 등

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    investorIdx: index('investor_meetings_investor_idx').on(t.investorId),
    dateIdx: index('investor_meetings_date_idx').on(t.meetingDate),
  }),
);

// ==================== Interests (Word Cloud) ====================

export const investorInterests = pgTable(
  'investor_interests',
  {
    id: serial('id').primaryKey(),
    investorId: integer('investor_id')
      .notNull()
      .references(() => investors.id, { onDelete: 'cascade' }),

    topic: varchar('topic', { length: 100 }).notNull(), // 주조환원, 탄력 리스크, CEO 방문 등
    frequency: smallint('frequency').default(1).notNull(), // 빈도수 (word cloud 크기용)

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    investorIdx: index('investor_interests_investor_idx').on(t.investorId),
    topicIdx: index('investor_interests_topic_idx').on(t.topic),
  }),
);

// ==================== Activities Timeline ====================

export const investorActivities = pgTable(
  'investor_activities',
  {
    id: serial('id').primaryKey(),
    investorId: integer('investor_id')
      .notNull()
      .references(() => investors.id, { onDelete: 'cascade' }),

    activityDate: timestamp('activity_date', { withTimezone: true }).notNull(),
    activityType: varchar('activity_type', { length: 50 }).notNull(), // One-on-One, NDR, 방문예약, Conference 등
    description: varchar('description', { length: 300 }),
    participants: text('participants'),
    tags: jsonb('tags').$type<string[]>(),

    changeRate: varchar('change_rate', { length: 20 }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    investorIdx: index('investor_activities_investor_idx').on(t.investorId),
    dateIdx: index('investor_activities_date_idx').on(t.activityDate),
    typeIdx: index('investor_activities_type_idx').on(t.activityType),
  }),
);

// ==================== Communications ====================

export const investorCommunications = pgTable(
  'investor_communications',
  {
    id: serial('id').primaryKey(),
    investorId: integer('investor_id')
      .notNull()
      .references(() => investors.id, { onDelete: 'cascade' }),

    communicationDate: timestamp('communication_date', {
      withTimezone: true,
    }).notNull(),
    communicationType: varchar('communication_type', { length: 50 }).notNull(), // One-on-One, NDR, 등
    description: varchar('description', { length: 300 }),
    participants: text('participants'),
    tags: jsonb('tags').$type<string[]>(),

    changeRate: varchar('change_rate', { length: 20 }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    investorIdx: index('investor_communications_investor_idx').on(t.investorId),
    dateIdx: index('investor_communications_date_idx').on(t.communicationDate),
  }),
);

// ==================== GID Upload Batch / Raw row storage ====================

export const gidUploadBatches = pgTable(
  'gid_upload_batches',
  {
    id: serial('id').primaryKey(),
    originalFilename: varchar('original_filename', { length: 200 }),
    status: uploadStatusEnum('status').default('PENDING').notNull(),
    meta: jsonb('meta'), // 시트명, 컬럼매핑, 행수 등
    uploadedBy: uuid('uploaded_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (t) => ({
    statusIdx: index('gid_upload_batches_status_idx').on(t.status),
    uploadedByIdx: index('gid_upload_batches_uploaded_by_idx').on(t.uploadedBy),
  }),
);

// 원본 행 스토리지 (파싱 전/후 검증용)
export const gidUploadRows = pgTable(
  'gid_upload_rows',
  {
    id: serial('id').primaryKey(),
    batchId: integer('batch_id')
      .notNull()
      .references(() => gidUploadBatches.id, { onDelete: 'cascade' }),
    raw: jsonb('raw').notNull(), // 업로드 당시 원본 1행 (JSON)
    parsed: jsonb('parsed'), // 파싱 결과 (필요 시)
    // 어떤 investor에 매핑됐는지 (파싱/머지 후)
    mappedInvestorId: integer('mapped_investor_id').references(
      () => investors.id,
      { onDelete: 'set null' },
    ),
    error: text('error'), // 파싱 실패 사유
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    batchIdx: index('gid_upload_rows_batch_idx').on(t.batchId),
    investorIdx: index('gid_upload_rows_mapped_investor_idx').on(
      t.mappedInvestorId,
    ),
  }),
);

// ==================== Relations ====================

export const countriesRelations = relations(countries, ({ many }) => ({
  investors: many(investors),
}));

export const investorsRelations = relations(investors, ({ one, many }) => ({
  country: one(countries, {
    fields: [investors.countryCode],
    references: [countries.code],
  }),
  parent: one(investors, {
    fields: [investors.parentId],
    references: [investors.id],
    relationName: 'investor_hierarchy',
  }),
  children: many(investors, {
    relationName: 'investor_hierarchy',
  }),
  snapshots: many(investorSnapshots),
  histories: many(investorHistories),
  meetings: many(investorMeetings),
  interests: many(investorInterests),
  activities: many(investorActivities),
  communications: many(investorCommunications),
}));

export const investorSnapshotsRelations = relations(
  investorSnapshots,
  ({ one }) => ({
    investor: one(investors, {
      fields: [investorSnapshots.investorId],
      references: [investors.id],
    }),
    uploadBatch: one(gidUploadBatches, {
      fields: [investorSnapshots.uploadBatchId],
      references: [gidUploadBatches.id],
    }),
  }),
);

export const investorHistoriesRelations = relations(
  investorHistories,
  ({ one }) => ({
    investor: one(investors, {
      fields: [investorHistories.investorId],
      references: [investors.id],
    }),
    updater: one(users, {
      fields: [investorHistories.updatedBy],
      references: [users.id],
    }),
  }),
);

export const gidUploadBatchesRelations = relations(
  gidUploadBatches,
  ({ one, many }) => ({
    uploader: one(users, {
      fields: [gidUploadBatches.uploadedBy],
      references: [users.id],
    }),
    rows: many(gidUploadRows),
    snapshots: many(investorSnapshots),
  }),
);

export const gidUploadRowsRelations = relations(gidUploadRows, ({ one }) => ({
  batch: one(gidUploadBatches, {
    fields: [gidUploadRows.batchId],
    references: [gidUploadBatches.id],
  }),
  mappedInvestor: one(investors, {
    fields: [gidUploadRows.mappedInvestorId],
    references: [investors.id],
  }),
}));

export const investorMeetingsRelations = relations(
  investorMeetings,
  ({ one }) => ({
    investor: one(investors, {
      fields: [investorMeetings.investorId],
      references: [investors.id],
    }),
  }),
);

export const investorInterestsRelations = relations(
  investorInterests,
  ({ one }) => ({
    investor: one(investors, {
      fields: [investorInterests.investorId],
      references: [investors.id],
    }),
  }),
);

export const investorActivitiesRelations = relations(
  investorActivities,
  ({ one }) => ({
    investor: one(investors, {
      fields: [investorActivities.investorId],
      references: [investors.id],
    }),
  }),
);

export const investorCommunicationsRelations = relations(
  investorCommunications,
  ({ one }) => ({
    investor: one(investors, {
      fields: [investorCommunications.investorId],
      references: [investors.id],
    }),
  }),
);

// ==================== Zod Schemas ====================

export const insertCountrySchema = createInsertSchema(countries);
export const selectCountrySchema = createSelectSchema(countries);

export const insertInvestorSchema = createInsertSchema(investors);
export const selectInvestorSchema = createSelectSchema(investors);

export const insertInvestorSnapshotSchema =
  createInsertSchema(investorSnapshots);
export const selectInvestorSnapshotSchema =
  createSelectSchema(investorSnapshots);

export const insertInvestorHistorySchema =
  createInsertSchema(investorHistories);
export const selectInvestorHistorySchema =
  createSelectSchema(investorHistories);

export const insertGidUploadBatchSchema = createInsertSchema(gidUploadBatches);
export const selectGidUploadBatchSchema = createSelectSchema(gidUploadBatches);

export const insertGidUploadRowSchema = createInsertSchema(gidUploadRows);
export const selectGidUploadRowSchema = createSelectSchema(gidUploadRows);

export const insertInvestorMeetingSchema = createInsertSchema(investorMeetings);
export const selectInvestorMeetingSchema = createSelectSchema(investorMeetings);

export const insertInvestorInterestSchema =
  createInsertSchema(investorInterests);
export const selectInvestorInterestSchema =
  createSelectSchema(investorInterests);

export const insertInvestorActivitySchema =
  createInsertSchema(investorActivities);
export const selectInvestorActivitySchema =
  createSelectSchema(investorActivities);

export const insertInvestorCommunicationSchema = createInsertSchema(
  investorCommunications,
);
export const selectInvestorCommunicationSchema = createSelectSchema(
  investorCommunications,
);

// ==================== TypeScript Types ====================

export type Country = typeof countries.$inferSelect;
export type NewCountry = typeof countries.$inferInsert;

export type Investor = typeof investors.$inferSelect;
export type NewInvestor = typeof investors.$inferInsert;

export type InvestorSnapshot = typeof investorSnapshots.$inferSelect;
export type NewInvestorSnapshot = typeof investorSnapshots.$inferInsert;

export type InvestorHistory = typeof investorHistories.$inferSelect;
export type NewInvestorHistory = typeof investorHistories.$inferInsert;

export type GidUploadBatch = typeof gidUploadBatches.$inferSelect;
export type NewGidUploadBatch = typeof gidUploadBatches.$inferInsert;

export type GidUploadRow = typeof gidUploadRows.$inferSelect;
export type NewGidUploadRow = typeof gidUploadRows.$inferInsert;

export type InvestorMeeting = typeof investorMeetings.$inferSelect;
export type NewInvestorMeeting = typeof investorMeetings.$inferInsert;

export type InvestorInterest = typeof investorInterests.$inferSelect;
export type NewInvestorInterest = typeof investorInterests.$inferInsert;

export type InvestorActivity = typeof investorActivities.$inferSelect;
export type NewInvestorActivity = typeof investorActivities.$inferInsert;

export type InvestorCommunication = typeof investorCommunications.$inferSelect;
export type NewInvestorCommunication =
  typeof investorCommunications.$inferInsert;
