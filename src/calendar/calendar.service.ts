import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import {
  calendarEvents,
  calendarEventHistory,
} from '../database/schemas/calendar.schema';
import type {
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  QueryCalendarRangeDto,
} from './dto/calendar.dto';
import type { CalendarEvent } from './types/calendar.types';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: PostgresJsDatabase,
  ) {}

  private async writeHistory(
    eventId: number,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    changedBy?: string,
    before?: unknown,
    after?: unknown,
  ) {
    await this.db.insert(calendarEventHistory).values({
      eventId,
      action,
      changedBy: changedBy ?? null,
      before: before ?? null,
      after: after ?? null,
    });
  }

  async create(
    dto: CreateCalendarEventDto,
    actorId?: string,
  ): Promise<CalendarEvent> {
    this.logger.log(`Create event: ${dto.title}`);
    const [created] = await this.db
      .insert(calendarEvents)
      .values({
        title: dto.title,
        description: dto.description ?? null,
        eventType: dto.eventType ?? 'MEETING',
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        allDay: dto.allDay ?? false,
        location: dto.location ?? null,
        status: dto.status ?? 'CONFIRMED',
        ownerId: actorId ?? null,
        updatedBy: actorId ?? null,
      })
      .returning();

    await this.writeHistory(created.eventId, 'CREATE', actorId, null, created);
    return created as CalendarEvent;
  }

  async findById(eventId: number): Promise<CalendarEvent | null> {
    const [event] = await this.db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.eventId, eventId));
    return (event ?? null) as CalendarEvent | null;
  }

  async update(
    eventId: number,
    dto: UpdateCalendarEventDto,
    actorId?: string,
  ): Promise<CalendarEvent> {
    const before = await this.findById(eventId);
    if (!before) throw new Error('Event not found');

    const [updated] = await this.db
      .update(calendarEvents)
      .set({
        title: dto.title ?? before.title,
        description: dto.description ?? before.description,
        startAt: dto.startAt ? new Date(dto.startAt) : before.startAt,
        endAt: dto.endAt ? new Date(dto.endAt) : before.endAt,
        allDay: dto.allDay ?? before.allDay,
        location: dto.location ?? before.location,
        status: dto.status ?? before.status,
        eventType: dto.eventType ?? before.eventType,
        updatedBy: actorId ?? before.updatedBy ?? null,
        updatedAt: new Date(),
      })
      .where(eq(calendarEvents.eventId, eventId))
      .returning();

    await this.writeHistory(eventId, 'UPDATE', actorId, before, updated);
    return updated as CalendarEvent;
  }

  async remove(eventId: number, actorId?: string): Promise<void> {
    const before = await this.findById(eventId);
    if (!before) return;
    await this.db
      .delete(calendarEvents)
      .where(eq(calendarEvents.eventId, eventId));
    await this.writeHistory(eventId, 'DELETE', actorId, before, null);
  }

  // Range query: events that INTERSECT with [from, to]
  async listInRange(query: QueryCalendarRangeDto): Promise<CalendarEvent[]> {
    const from = new Date(query.from);
    const to = new Date(query.to);

    // overlap condition: start < to AND end > from
    const conditions = [
      lte(calendarEvents.startAt, to),
      gte(calendarEvents.endAt, from),
    ];

    if (query.ownerId) {
      conditions.push(eq(calendarEvents.ownerId, query.ownerId));
    }
    if (query.status) {
      conditions.push(eq(calendarEvents.status, query.status));
    }
    if (query.eventType) {
      conditions.push(eq(calendarEvents.eventType, query.eventType));
    }

    const items = await this.db
      .select()
      .from(calendarEvents)
      .where(and(...conditions))
      .orderBy(desc(calendarEvents.startAt));

    return items as CalendarEvent[];
  }

  async listHistory(eventId: number) {
    const rows = await this.db
      .select()
      .from(calendarEventHistory)
      .where(eq(calendarEventHistory.eventId, eventId))
      .orderBy(desc(calendarEventHistory.changedAt));
    return rows;
  }
}
