import {
  pgTable,
  serial,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Enums
export const calendarEventStatusEnum = pgEnum('calendar_event_status', [
  'CONFIRMED',
  'TENTATIVE',
  'CANCELLED',
]);

export const calendarEventTypeEnum = pgEnum('calendar_event_type', [
  'MEETING',
  'CALL',
  'TASK',
  'REMINDER',
  'OTHER',
]);

// Calendar events
export const calendarEvents = pgTable('tb_calendar_event', {
  eventId: serial('event_id').primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id), // optional owner
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  eventType: calendarEventTypeEnum('event_type').default('MEETING'),
  startAt: timestamp('start_at', { withTimezone: false }).notNull(),
  endAt: timestamp('end_at', { withTimezone: false }).notNull(),
  allDay: boolean('all_day').default(false).notNull(),
  location: varchar('location', { length: 200 }),
  status: calendarEventStatusEnum('status').default('CONFIRMED').notNull(),
  // last modifier
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Audit history
export const calendarEventActionEnum = pgEnum('calendar_event_action', [
  'CREATE',
  'UPDATE',
  'DELETE',
]);

export const calendarEventHistory = pgTable('tb_calendar_event_history', {
  historyId: serial('history_id').primaryKey(),
  eventId: integer('event_id')
    .notNull()
    .references(() => calendarEvents.eventId),
  action: calendarEventActionEnum('action').notNull(),
  changedBy: uuid('changed_by'), // users.id
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
});

export const calendarRelations = relations(calendarEvents, ({ many }) => ({
  histories: many(calendarEventHistory),
}));
