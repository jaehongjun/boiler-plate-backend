import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, desc, eq } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../database/database.module';
import { notifications, users } from '../database/schemas';

import { CreateNotificationDto, UpdateNotificationDto } from './dto';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase<any>,
  ) {}

  /**
   * Create a new notification
   */
  async create(dto: CreateNotificationDto) {
    const [notification] = await this.db
      .insert(notifications)
      .values({
        userId: dto.userId,
        eventType: dto.eventType,
        title: dto.title || '',
        metadata: dto.metadata || {},
        read: dto.read ?? false,
      })
      .returning();

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  async findByUserId(userId: string, unreadOnly = false) {
    const conditions = [eq(notifications.userId, userId)];

    if (unreadOnly) {
      conditions.push(eq(notifications.read, false));
    }

    const results = await (this.db.query as any).notifications.findMany({
      where: and(...conditions),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: [desc(notifications.createdAt)],
    });

    return results;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string) {
    const [notification] = await this.db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    return { success: true };
  }

  /**
   * Delete a notification
   */
  async delete(id: string, userId: string) {
    const [notification] = await this.db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return { success: true };
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const results = await this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    return results.length;
  }
}
