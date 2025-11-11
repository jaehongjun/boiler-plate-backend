import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, desc, eq } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../database/database.module';
import { notifications, users } from '../database/schemas';

import {
  BroadcastNotificationDto,
  CreateNotificationDto,
  UpdateNotificationDto,
} from './dto';

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

  /**
   * Broadcast notification to all users
   * - Creates a notification for every user in the system
   * - Useful for system-wide announcements
   */
  async broadcast(dto: BroadcastNotificationDto) {
    const BATCH_SIZE = 1000; // PostgreSQL parameter limit 방지

    // 1. 모든 활성 유저 ID 조회
    const allUsers = await this.db.select({ id: users.id }).from(users);

    if (allUsers.length === 0) {
      return { sent: 0, totalUsers: 0 };
    }

    let totalInserted = 0;

    // 2. Batch로 나눠서 insert (대량 유저 대비)
    for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
      const batch = allUsers.slice(i, i + BATCH_SIZE);

      const notificationRecords = batch.map((user) => ({
        userId: user.id,
        eventType: dto.eventType,
        title: dto.title,
        metadata: dto.metadata || {},
        read: false,
      }));

      await this.db.insert(notifications).values(notificationRecords);
      totalInserted += notificationRecords.length;
    }

    return {
      sent: totalInserted,
      totalUsers: allUsers.length,
      message: `Successfully sent notification to ${totalInserted} users`,
    };
  }
}
