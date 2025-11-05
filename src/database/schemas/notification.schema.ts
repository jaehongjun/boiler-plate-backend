import { boolean, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';

import { users } from './users';

/**
 * Notification event types
 */
export enum NotificationEventType {
  IR_ACTIVITY_CREATED = 'IR_ACTIVITY_CREATED',
  IR_ACTIVITY_UPDATED = 'IR_ACTIVITY_UPDATED',
  IR_ACTIVITY_FIELD_UPDATED = 'IR_ACTIVITY_FIELD_UPDATED',
  IR_ACTIVITY_DELETED = 'IR_ACTIVITY_DELETED',
  INVESTOR_BULK_UPDATED = 'INVESTOR_BULK_UPDATED',
  INVESTOR_UPDATED = 'INVESTOR_UPDATED',
  TRIP_CREATED = 'TRIP_CREATED',
  TRIP_UPDATED = 'TRIP_UPDATED',
}

/**
 * Notification metadata structure
 */
export interface NotificationMetadata {
  // IR Activity related
  activityId?: string;
  activityTitle?: string;
  fieldName?: string;

  // Investor related
  investorCount?: number;
  quarter?: string;

  // Trip related
  tripId?: string;
  tripTitle?: string;

  // Multiple actors
  additionalActorCount?: number;
  additionalActorIds?: string[];
}

/**
 * Notifications table
 */
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  title: varchar('title', { length: 500 }),
  metadata: jsonb('metadata').$type<NotificationMetadata>(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Relations
 */
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);

// Types
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
