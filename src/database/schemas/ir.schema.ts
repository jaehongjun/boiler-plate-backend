import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  uuid,
  text,
  bigint,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users } from './users';

// Enums
export const irActivityStatusEnum = pgEnum('ir_activity_status', [
  '예정',
  '진행중',
  '완료',
  '중단',
]);

export const irActivityCategoryEnum = pgEnum('ir_activity_category', [
  '내부',
  '외부',
  '휴가',
  '공휴일',
]);

export const irLogTypeEnum = pgEnum('ir_log_type', [
  'create',
  'update',
  'status',
  'title',
  'attachment',
  'sub_activity',
  'keyword',
  'delete',
]);

// Main IR Activities Table
export const irActivities = pgTable('ir_activities', {
  id: varchar('id', { length: 50 }).primaryKey(),

  // Core Information
  title: varchar('title', { length: 255 }).notNull(),
  startDatetime: timestamp('start_datetime', { withTimezone: true }).notNull(),
  endDatetime: timestamp('end_datetime', { withTimezone: true }),
  status: irActivityStatusEnum('status').notNull().default('예정'),

  // Calendar Display
  allDay: boolean('all_day').default(false),
  category: irActivityCategoryEnum('category').notNull(),
  location: varchar('location', { length: 255 }),
  description: text('description'),

  // Activity Classification
  typePrimary: varchar('type_primary', { length: 50 }).notNull(),
  typeSecondary: varchar('type_secondary', { length: 50 }),

  // Rich Content
  memo: text('memo'),
  contentHtml: text('content_html'),

  // Ownership
  ownerId: uuid('owner_id').references(() => users.id),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

// Sub-Activities Table
export const irSubActivities = pgTable('ir_sub_activities', {
  id: varchar('id', { length: 50 }).primaryKey(),

  // Foreign Key to Parent Activity
  parentActivityId: varchar('parent_activity_id', { length: 50 })
    .references(() => irActivities.id, { onDelete: 'cascade' })
    .notNull(),

  // Core Information
  title: varchar('title', { length: 255 }).notNull(),
  ownerId: uuid('owner_id').references(() => users.id),
  status: irActivityStatusEnum('status').notNull().default('예정'),

  // Optional dates (inherits from parent if null)
  startDatetime: timestamp('start_datetime', { withTimezone: true }),
  endDatetime: timestamp('end_datetime', { withTimezone: true }),

  // Calendar Display (optional - can inherit from parent)
  allDay: boolean('all_day').default(false),
  category: irActivityCategoryEnum('category'),
  location: varchar('location', { length: 255 }),
  description: text('description'),

  // Activity Classification (optional - can inherit from parent)
  typePrimary: varchar('type_primary', { length: 50 }),
  typeSecondary: varchar('type_secondary', { length: 50 }),

  // Rich Content
  memo: text('memo'),
  contentHtml: text('content_html'),

  // Display Order
  displayOrder: integer('display_order').default(0),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// KB Staff Participants (Many-to-Many)
export const irActivityKbParticipants = pgTable(
  'ir_activity_kb_participants',
  {
    activityId: varchar('activity_id', { length: 50 })
      .references(() => irActivities.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    role: varchar('role', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: { columns: [table.activityId, table.userId] },
  }),
);

// External Visitors (Many-to-Many)
export const irActivityVisitors = pgTable(
  'ir_activity_visitors',
  {
    activityId: varchar('activity_id', { length: 50 })
      .references(() => irActivities.id, { onDelete: 'cascade' })
      .notNull(),
    visitorName: varchar('visitor_name', { length: 255 }).notNull(),
    visitorType: varchar('visitor_type', { length: 20 }), // 'investor' or 'broker'
    company: varchar('company', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: { columns: [table.activityId, table.visitorName] },
  }),
);

// Keywords/Tags (Max 5 per activity)
export const irActivityKeywords = pgTable(
  'ir_activity_keywords',
  {
    activityId: varchar('activity_id', { length: 50 })
      .references(() => irActivities.id, { onDelete: 'cascade' })
      .notNull(),
    keyword: varchar('keyword', { length: 50 }).notNull(),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: { columns: [table.activityId, table.keyword] },
  }),
);

// File Attachments
export const irActivityAttachments = pgTable('ir_activity_attachments', {
  id: varchar('id', { length: 50 }).primaryKey(),
  activityId: varchar('activity_id', { length: 50 })
    .references(() => irActivities.id, { onDelete: 'cascade' })
    .notNull(),

  // File Information
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }), // bytes
  mimeType: varchar('mime_type', { length: 100 }),
  storageUrl: varchar('storage_url', { length: 500 }),

  // Upload Information
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Activity Logs (Audit Trail)
export const irActivityLogs = pgTable('ir_activity_logs', {
  id: varchar('id', { length: 50 }).primaryKey(),
  activityId: varchar('activity_id', { length: 50 })
    .references(() => irActivities.id, { onDelete: 'cascade' })
    .notNull(),

  // Log Information
  logType: irLogTypeEnum('log_type').notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  userName: varchar('user_name', { length: 100 }).notNull(), // Denormalized for display
  message: text('message').notNull(),

  // Optional: Store old/new values for detailed history
  oldValue: text('old_value'),
  newValue: text('new_value'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const irActivitiesRelations = relations(
  irActivities,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [irActivities.ownerId],
      references: [users.id],
    }),
    subActivities: many(irSubActivities),
    kbParticipants: many(irActivityKbParticipants),
    visitors: many(irActivityVisitors),
    keywords: many(irActivityKeywords),
    attachments: many(irActivityAttachments),
    logs: many(irActivityLogs),
  }),
);

export const irSubActivitiesRelations = relations(
  irSubActivities,
  ({ one }) => ({
    parentActivity: one(irActivities, {
      fields: [irSubActivities.parentActivityId],
      references: [irActivities.id],
    }),
    owner: one(users, {
      fields: [irSubActivities.ownerId],
      references: [users.id],
    }),
  }),
);

// Sub-Activity KB Staff Participants (Many-to-Many)
export const irSubActivityKbParticipants = pgTable(
  'ir_sub_activity_kb_participants',
  {
    subActivityId: varchar('sub_activity_id', { length: 50 })
      .references(() => irSubActivities.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    role: varchar('role', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: { columns: [table.subActivityId, table.userId] },
  }),
);

// Sub-Activity External Visitors (Many-to-Many)
export const irSubActivityVisitors = pgTable(
  'ir_sub_activity_visitors',
  {
    subActivityId: varchar('sub_activity_id', { length: 50 })
      .references(() => irSubActivities.id, { onDelete: 'cascade' })
      .notNull(),
    visitorName: varchar('visitor_name', { length: 255 }).notNull(),
    visitorType: varchar('visitor_type', { length: 20 }), // 'investor' or 'broker'
    company: varchar('company', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: { columns: [table.subActivityId, table.visitorName] },
  }),
);

// Sub-Activity Keywords/Tags (Max 5 per sub-activity)
export const irSubActivityKeywords = pgTable(
  'ir_sub_activity_keywords',
  {
    subActivityId: varchar('sub_activity_id', { length: 50 })
      .references(() => irSubActivities.id, { onDelete: 'cascade' })
      .notNull(),
    keyword: varchar('keyword', { length: 50 }).notNull(),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: { columns: [table.subActivityId, table.keyword] },
  }),
);

export const irSubActivityKbParticipantsRelations = relations(
  irSubActivityKbParticipants,
  ({ one }) => ({
    subActivity: one(irSubActivities, {
      fields: [irSubActivityKbParticipants.subActivityId],
      references: [irSubActivities.id],
    }),
    user: one(users, {
      fields: [irSubActivityKbParticipants.userId],
      references: [users.id],
    }),
  }),
);

export const irSubActivityVisitorsRelations = relations(
  irSubActivityVisitors,
  ({ one }) => ({
    subActivity: one(irSubActivities, {
      fields: [irSubActivityVisitors.subActivityId],
      references: [irSubActivities.id],
    }),
  }),
);

export const irSubActivityKeywordsRelations = relations(
  irSubActivityKeywords,
  ({ one }) => ({
    subActivity: one(irSubActivities, {
      fields: [irSubActivityKeywords.subActivityId],
      references: [irSubActivities.id],
    }),
  }),
);

export const irActivityKbParticipantsRelations = relations(
  irActivityKbParticipants,
  ({ one }) => ({
    activity: one(irActivities, {
      fields: [irActivityKbParticipants.activityId],
      references: [irActivities.id],
    }),
    user: one(users, {
      fields: [irActivityKbParticipants.userId],
      references: [users.id],
    }),
  }),
);

export const irActivityVisitorsRelations = relations(
  irActivityVisitors,
  ({ one }) => ({
    activity: one(irActivities, {
      fields: [irActivityVisitors.activityId],
      references: [irActivities.id],
    }),
  }),
);

export const irActivityKeywordsRelations = relations(
  irActivityKeywords,
  ({ one }) => ({
    activity: one(irActivities, {
      fields: [irActivityKeywords.activityId],
      references: [irActivities.id],
    }),
  }),
);

export const irActivityAttachmentsRelations = relations(
  irActivityAttachments,
  ({ one }) => ({
    activity: one(irActivities, {
      fields: [irActivityAttachments.activityId],
      references: [irActivities.id],
    }),
    uploadedByUser: one(users, {
      fields: [irActivityAttachments.uploadedBy],
      references: [users.id],
    }),
  }),
);

export const irActivityLogsRelations = relations(irActivityLogs, ({ one }) => ({
  activity: one(irActivities, {
    fields: [irActivityLogs.activityId],
    references: [irActivities.id],
  }),
  user: one(users, {
    fields: [irActivityLogs.userId],
    references: [users.id],
  }),
}));

// Zod Schemas
export const insertIrActivitySchema = createInsertSchema(irActivities);
export const selectIrActivitySchema = createSelectSchema(irActivities);
export const insertIrSubActivitySchema = createInsertSchema(irSubActivities);
export const selectIrSubActivitySchema = createSelectSchema(irSubActivities);
export const insertIrSubActivityKbParticipantSchema = createInsertSchema(
  irSubActivityKbParticipants,
);
export const selectIrSubActivityKbParticipantSchema = createSelectSchema(
  irSubActivityKbParticipants,
);
export const insertIrSubActivityVisitorSchema = createInsertSchema(
  irSubActivityVisitors,
);
export const selectIrSubActivityVisitorSchema = createSelectSchema(
  irSubActivityVisitors,
);
export const insertIrSubActivityKeywordSchema = createInsertSchema(
  irSubActivityKeywords,
);
export const selectIrSubActivityKeywordSchema = createSelectSchema(
  irSubActivityKeywords,
);
export const insertIrActivityKbParticipantSchema = createInsertSchema(
  irActivityKbParticipants,
);
export const selectIrActivityKbParticipantSchema = createSelectSchema(
  irActivityKbParticipants,
);
export const insertIrActivityVisitorSchema =
  createInsertSchema(irActivityVisitors);
export const selectIrActivityVisitorSchema =
  createSelectSchema(irActivityVisitors);
export const insertIrActivityKeywordSchema =
  createInsertSchema(irActivityKeywords);
export const selectIrActivityKeywordSchema =
  createSelectSchema(irActivityKeywords);
export const insertIrActivityAttachmentSchema = createInsertSchema(
  irActivityAttachments,
);
export const selectIrActivityAttachmentSchema = createSelectSchema(
  irActivityAttachments,
);
export const insertIrActivityLogSchema = createInsertSchema(irActivityLogs);
export const selectIrActivityLogSchema = createSelectSchema(irActivityLogs);

// TypeScript Types
export type IrActivity = typeof irActivities.$inferSelect;
export type NewIrActivity = typeof irActivities.$inferInsert;
export type IrSubActivity = typeof irSubActivities.$inferSelect;
export type NewIrSubActivity = typeof irSubActivities.$inferInsert;
export type IrSubActivityKbParticipant =
  typeof irSubActivityKbParticipants.$inferSelect;
export type NewIrSubActivityKbParticipant =
  typeof irSubActivityKbParticipants.$inferInsert;
export type IrSubActivityVisitor = typeof irSubActivityVisitors.$inferSelect;
export type NewIrSubActivityVisitor = typeof irSubActivityVisitors.$inferInsert;
export type IrSubActivityKeyword = typeof irSubActivityKeywords.$inferSelect;
export type NewIrSubActivityKeyword = typeof irSubActivityKeywords.$inferInsert;
export type IrActivityKbParticipant =
  typeof irActivityKbParticipants.$inferSelect;
export type NewIrActivityKbParticipant =
  typeof irActivityKbParticipants.$inferInsert;
export type IrActivityVisitor = typeof irActivityVisitors.$inferSelect;
export type NewIrActivityVisitor = typeof irActivityVisitors.$inferInsert;
export type IrActivityKeyword = typeof irActivityKeywords.$inferSelect;
export type NewIrActivityKeyword = typeof irActivityKeywords.$inferInsert;
export type IrActivityAttachment = typeof irActivityAttachments.$inferSelect;
export type NewIrActivityAttachment = typeof irActivityAttachments.$inferInsert;
export type IrActivityLog = typeof irActivityLogs.$inferSelect;
export type NewIrActivityLog = typeof irActivityLogs.$inferInsert;
