import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, gte, lte } from 'drizzle-orm';
import {
  irActivities,
  irSubActivities,
  irActivityKbParticipants,
  irActivityVisitors,
  irActivityKeywords,
  // irActivityAttachments, // Kept for future use
  irActivityLogs,
  irSubActivityKbParticipants,
  irSubActivityVisitors,
  irSubActivityKeywords,
} from '../database/schemas/ir.schema';
import { users } from '../database/schemas/users';
import {
  CreateIrActivityDto,
  CreateIrSubActivityDto,
  UpdateIrActivityDto,
  // UpdateIrSubActivityDto, // Kept for future use
  UpdateIrActivityStatusDto,
  QueryIrActivitiesDto,
} from './dto';
import {
  IrActivityEntityResponse,
  IrCalendarEventResponse,
  IrTimelineActivityResponse,
  IrActivitySubActivityResponse,
  IrActivityListItemResponse,
} from './types/ir-activity.types';

@Injectable()
export class IrService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase<any>,
  ) {}

  /**
   * Generate a unique ID for IR activities
   */
  private generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Create a new IR activity
   */
  async create(
    createDto: CreateIrActivityDto,
    userId: string,
  ): Promise<IrActivityEntityResponse> {
    const activityId = this.generateId('act');

    // Create main activity
    await this.db.insert(irActivities).values({
      id: activityId,
      title: createDto.title,
      startDatetime: new Date(createDto.startDatetime),
      endDatetime: createDto.endDatetime
        ? new Date(createDto.endDatetime)
        : undefined,
      status: createDto.status || '예정',
      allDay: createDto.allDay,
      category: createDto.category,
      location: createDto.location,
      description: createDto.description,
      typePrimary: createDto.typePrimary,
      typeSecondary: createDto.typeSecondary,
      memo: createDto.memo,
      contentHtml: createDto.contentHtml,
      ownerId: createDto.ownerId || userId, // Default to creator if not specified
    });

    // Add KB participants (legacy format with userId)
    if (createDto.kbParticipants && createDto.kbParticipants.length > 0) {
      await this.db.insert(irActivityKbParticipants).values(
        createDto.kbParticipants.map((p) => ({
          activityId,
          userId: p.userId,
          role: p.role,
        })),
      );
    }

    // Add visitors - collect all visitors
    const allVisitors: Array<{
      visitorName: string;
      visitorType?: 'investor' | 'broker' | 'kb';
      company?: string;
    }> = [];

    // Add KB staff as visitors (simple name array)
    if (createDto.kbs && createDto.kbs.length > 0) {
      allVisitors.push(
        ...createDto.kbs.map((name) => ({
          visitorName: name,
          visitorType: 'kb' as const,
          company: undefined,
        })),
      );
    }

    // Add regular visitors
    if (createDto.visitors && createDto.visitors.length > 0) {
      if (typeof createDto.visitors[0] === 'string') {
        // String array format
        allVisitors.push(
          ...(createDto.visitors as string[]).map((name) => ({
            visitorName: name,
            visitorType: 'investor' as const,
            company: undefined,
          })),
        );
      } else {
        // Object array format
        allVisitors.push(
          ...(
            createDto.visitors as Array<{
              visitorName: string;
              visitorType?: 'investor' | 'broker';
              company?: string;
            }>
          ).map((v) => ({
            visitorName: v.visitorName,
            visitorType: v.visitorType || ('investor' as const),
            company: v.company,
          })),
        );
      }
    }

    // Insert all visitors
    if (allVisitors.length > 0) {
      await this.db.insert(irActivityVisitors).values(
        allVisitors.map((v) => ({
          activityId,
          visitorName: v.visitorName,
          visitorType: v.visitorType,
          company: v.company,
        })),
      );
    }

    // Add keywords
    if (createDto.keywords && createDto.keywords.length > 0) {
      await this.db.insert(irActivityKeywords).values(
        createDto.keywords.slice(0, 5).map((keyword, index) => ({
          activityId,
          keyword,
          displayOrder: index,
        })),
      );
    }

    // Add sub-activities
    if (createDto.subActivities && createDto.subActivities.length > 0) {
      for (let i = 0; i < createDto.subActivities.length; i++) {
        const sub = createDto.subActivities[i];
        const subId = this.generateId('sub');

        // Try extended insert first; fallback to legacy columns if migration not applied
        try {
          await this.db.insert(irSubActivities).values({
            id: subId,
            parentActivityId: activityId,
            title: sub.title,
            ownerId: sub.ownerId,
            status: sub.status || '예정',
            startDatetime: sub.startDatetime
              ? new Date(sub.startDatetime)
              : undefined,
            endDatetime: sub.endDatetime
              ? new Date(sub.endDatetime)
              : undefined,
            allDay: sub.allDay ?? false,
            category: sub.category,
            location: sub.location,
            description: sub.description,
            typePrimary: sub.typePrimary,
            typeSecondary: sub.typeSecondary,
            memo: sub.memo,
            contentHtml: sub.contentHtml,
            displayOrder: i,
          });
        } catch (e: unknown) {
          // Likely due to missing columns; insert minimal columns only
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes('column') && msg.includes('does not exist')) {
            await this.db.insert(irSubActivities).values({
              id: subId,
              parentActivityId: activityId,
              title: sub.title,
              ownerId: sub.ownerId,
              status: sub.status || '예정',
              startDatetime: sub.startDatetime
                ? new Date(sub.startDatetime)
                : undefined,
              endDatetime: sub.endDatetime
                ? new Date(sub.endDatetime)
                : undefined,
              displayOrder: i,
            });
          } else {
            throw e;
          }
        }

        // Sub-level participants
        if (sub.kbParticipants && sub.kbParticipants.length > 0) {
          try {
            await this.db.insert(irSubActivityKbParticipants).values(
              sub.kbParticipants.map((p) => ({
                subActivityId: subId,
                userId: p.userId,
                role: p.role,
              })),
            );
          } catch {
            // If table not migrated yet, skip silently
          }
        }

        // Sub-level visitors
        if (sub.visitors && sub.visitors.length > 0) {
          try {
            await this.db.insert(irSubActivityVisitors).values(
              sub.visitors.map((v) => ({
                subActivityId: subId,
                visitorName: v.visitorName,
                visitorType: v.visitorType,
                company: v.company,
              })),
            );
          } catch {
            // Skip if not migrated
          }
        }

        // Sub-level keywords
        if (sub.keywords && sub.keywords.length > 0) {
          try {
            await this.db.insert(irSubActivityKeywords).values(
              sub.keywords.slice(0, 5).map((keyword, index) => ({
                subActivityId: subId,
                keyword,
                displayOrder: index,
              })),
            );
          } catch {
            // Skip if not migrated
          }
        }
      }
    }

    // Create activity log
    const user = await (this.db.query as any).users.findFirst({
      where: eq(users.id, userId),
    });

    await this.db.insert(irActivityLogs).values({
      id: this.generateId('log'),
      activityId,
      logType: 'create',
      userId,
      userName: user?.name || 'Unknown',
      message: `${user?.name || 'Unknown'} 님이 IR활동을 생성했습니다.`,
    });

    // Return the created activity
    return this.findOne(activityId);
  }

  /**
   * Get all activities for calendar view
   */
  async getCalendarEvents(
    query: QueryIrActivitiesDto,
  ): Promise<{ events: IrCalendarEventResponse[] }> {
    const startDate = new Date(query.start);
    const endDate = new Date(query.end);

    const conditions = [
      gte(irActivities.startDatetime, startDate),
      lte(irActivities.startDatetime, endDate),
    ];

    if (query.category) {
      conditions.push(eq(irActivities.category, query.category));
    }

    if (query.status && query.status !== 'ALL') {
      conditions.push(eq(irActivities.status, query.status));
    }

    const activities = await (this.db.query as any).irActivities.findMany({
      where: and(...conditions),
      orderBy: (activities, { asc }) => [asc(activities.startDatetime)],
    });

    const events: IrCalendarEventResponse[] = activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      start: activity.startDatetime.toISOString(),
      end: activity.endDatetime?.toISOString(),
      allDay: activity.allDay || false,
      category: activity.category,
      location: activity.location || undefined,
      description: activity.description || undefined,
      status: activity.status,
    }));

    return { events };
  }

  /**
   * Get all activities for list view (table)
   */
  async getListView(
    query: QueryIrActivitiesDto,
  ): Promise<{ activities: IrActivityListItemResponse[]; total: number }> {
    const startDate = new Date(query.start);
    const endDate = new Date(query.end);

    const conditions = [
      gte(irActivities.startDatetime, startDate),
      lte(irActivities.startDatetime, endDate),
    ];

    if (query.category) {
      conditions.push(eq(irActivities.category, query.category));
    }

    if (query.status && query.status !== 'ALL') {
      conditions.push(eq(irActivities.status, query.status));
    }

    // Determine sort field and order
    const sortBy = query.sortBy || 'startDatetime';
    const sortOrder = query.sortOrder || 'desc';

    const activities = await (this.db.query as any).irActivities.findMany({
      where: and(...conditions),
      with: {
        owner: {
          columns: {
            name: true,
          },
        },
        kbParticipants: {
          with: {
            user: {
              columns: {
                name: true,
              },
            },
          },
        },
        visitors: {
          columns: {
            visitorName: true,
            visitorType: true,
          },
        },
      },
      orderBy: (activities, { asc, desc }) => {
        const sortFn = sortOrder === 'asc' ? asc : desc;
        switch (sortBy) {
          case 'startDatetime':
            return [sortFn(activities.startDatetime)];
          case 'updatedAt':
            return [sortFn(activities.updatedAt)];
          case 'title':
            return [sortFn(activities.title)];
          case 'status':
            return [sortFn(activities.status)];
          default:
            return [desc(activities.startDatetime)];
        }
      },
    });

    const listItems: IrActivityListItemResponse[] = activities.map(
      (activity: any) => ({
        id: activity.id,
        title: activity.title,
        startISO: activity.startDatetime.toISOString(),
        endISO: activity.endDatetime?.toISOString(),
        typePrimary: activity.typePrimary,
        status: activity.status,
        category: activity.category,
        investors: activity.visitors
          .filter((v: any) => v.visitorType === 'investor')
          .map((v: any) => v.visitorName),
        brokers: activity.visitors
          .filter((v: any) => v.visitorType === 'broker')
          .map((v: any) => v.visitorName),
        kbParticipants: activity.kbParticipants.map((p: any) => p.user.name),
        owner: activity.owner?.name,
        updatedAtISO: activity.updatedAt.toISOString(),
      }),
    );

    return {
      activities: listItems,
      total: listItems.length,
    };
  }

  /**
   * Get all activities for timeline view
   */
  async getTimelineActivities(
    query: QueryIrActivitiesDto,
  ): Promise<{ activities: IrTimelineActivityResponse[] }> {
    const startDate = new Date(query.start);
    const endDate = new Date(query.end);

    const conditions = [
      gte(irActivities.startDatetime, startDate),
      lte(irActivities.startDatetime, endDate),
    ];

    if (query.status && query.status !== 'ALL') {
      conditions.push(eq(irActivities.status, query.status));
    }

    const activities = await (this.db.query as any).irActivities.findMany({
      where: and(...conditions),
      with: {
        subActivities: {
          columns: {
            id: true,
            title: true,
            ownerId: true,
            status: true,
            startDatetime: true,
            endDatetime: true,
            displayOrder: true,
            parentActivityId: true,
            createdAt: true,
            updatedAt: true,
          },
          with: {
            owner: true,
          },
          orderBy: (subs, { asc }) => [asc(subs.displayOrder)],
        },
      },
      orderBy: (activities, { asc }) => [asc(activities.startDatetime)],
    });

    const timelineActivities: IrTimelineActivityResponse[] = activities.map(
      (activity) => ({
        id: activity.id,
        title: activity.title,
        startISO: activity.startDatetime.toISOString(),
        endISO:
          activity.endDatetime?.toISOString() ||
          activity.startDatetime.toISOString(),
        status: activity.status,
        subActivities: activity.subActivities.map((sub) => ({
          id: sub.id,
          title: sub.title,
          owner: sub.owner?.name,
          status: sub.status,
          startDatetime: sub.startDatetime?.toISOString(),
          endDatetime: sub.endDatetime?.toISOString(),
          allDay: sub.allDay || false,
          category: sub.category || activity.category,
          location: sub.location || undefined,
          description: sub.description || undefined,
          typePrimary: sub.typePrimary || activity.typePrimary,
          typeSecondary: sub.typeSecondary || undefined,
          memo: sub.memo || undefined,
          contentHtml: sub.contentHtml || undefined,
        })),
      }),
    );

    return { activities: timelineActivities };
  }

  /**
   * Get full activity details by ID
   */
  async findOne(id: string): Promise<IrActivityEntityResponse> {
    const activity = await (this.db.query as any).irActivities.findFirst({
      where: eq(irActivities.id, id),
      with: {
        owner: true,
        subActivities: {
          columns: {
            id: true,
            title: true,
            ownerId: true,
            status: true,
            startDatetime: true,
            endDatetime: true,
            displayOrder: true,
            parentActivityId: true,
            createdAt: true,
            updatedAt: true,
          },
          with: {
            owner: true,
          },
          orderBy: (subs, { asc }) => [asc(subs.displayOrder)],
        },
        kbParticipants: {
          with: {
            user: true,
          },
        },
        visitors: true,
        keywords: {
          orderBy: (keywords, { asc }) => [asc(keywords.displayOrder)],
        },
        attachments: {
          with: {
            uploadedByUser: true,
          },
        },
        logs: {
          orderBy: (logs, { desc }) => [desc(logs.createdAt)],
          limit: 200,
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(`IR Activity with ID ${id} not found`);
    }

    // Transform to response format
    const response: IrActivityEntityResponse = {
      id: activity.id,
      title: activity.title,
      startISO: activity.startDatetime.toISOString(),
      endISO: activity.endDatetime?.toISOString(),
      status: activity.status,
      allDay: activity.allDay || false,
      category: activity.category,
      location: activity.location || undefined,
      description: activity.description || undefined,
      typePrimary: activity.typePrimary,
      typeSecondary: activity.typeSecondary || undefined,
      kbs: [
        ...activity.kbParticipants.map((p) => p.user.name),
        ...activity.visitors
          .filter((v) => v.visitorType === 'kb')
          .map((v) => v.visitorName),
      ],
      visitors: activity.visitors
        .filter((v) => v.visitorType !== 'kb')
        .map((v) => v.visitorName),
      memo: activity.memo || undefined,
      contentHtml: activity.contentHtml || undefined,
      keywords: activity.keywords.map((k) => k.keyword),
      attachments: activity.attachments.map((a) => ({
        id: a.id,
        name: a.fileName,
        url: a.storageUrl || undefined,
        size: a.fileSize || undefined,
        uploadedAtISO: a.uploadedAt.toISOString(),
        uploadedBy: a.uploadedByUser?.name,
        mime: a.mimeType || undefined,
      })),
      files: activity.attachments.map((a) => ({
        id: a.id,
        name: a.fileName,
        url: a.storageUrl || undefined,
        size: a.fileSize || undefined,
        uploadedAtISO: a.uploadedAt.toISOString(),
        uploadedBy: a.uploadedByUser?.name,
        mime: a.mimeType || undefined,
      })),
      subActivities: activity.subActivities.map((sub) => ({
        id: sub.id,
        title: sub.title,
        owner: sub.owner?.name,
        status: sub.status,
        startDatetime: sub.startDatetime?.toISOString(),
        endDatetime: sub.endDatetime?.toISOString(),
      })),
      owner: activity.owner?.name,
      investors: activity.visitors
        .filter((v) => v.visitorType === 'investor')
        .map((v) => v.visitorName),
      brokers: activity.visitors
        .filter((v) => v.visitorType === 'broker')
        .map((v) => v.visitorName),
      logs: activity.logs.map((log) => ({
        id: log.id,
        type: log.logType,
        user: log.userName,
        message: log.message,
        createdAtISO: log.createdAt.toISOString(),
        oldValue: log.oldValue || undefined,
        newValue: log.newValue || undefined,
      })),
      createdAtISO: activity.createdAt.toISOString(),
      updatedAtISO: activity.updatedAt.toISOString(),
      resolvedAtISO: activity.resolvedAt?.toISOString(),
    };

    return response;
  }

  /**
   * Update an IR activity
   */
  async update(
    id: string,
    updateDto: UpdateIrActivityDto,
    userId: string,
  ): Promise<IrActivityEntityResponse> {
    // Check if activity exists
    const existing = await (this.db.query as any).irActivities.findFirst({
      where: eq(irActivities.id, id),
    });

    if (!existing) {
      throw new NotFoundException(`IR Activity with ID ${id} not found`);
    }

    // Update main activity
    const updateData: any = {};
    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.startDatetime !== undefined) {
      updateData.startDatetime = new Date(updateDto.startDatetime);
    }
    if (updateDto.endDatetime !== undefined) {
      updateData.endDatetime = updateDto.endDatetime
        ? new Date(updateDto.endDatetime)
        : null;
    }
    if (updateDto.status !== undefined) updateData.status = updateDto.status;
    if (updateDto.allDay !== undefined) updateData.allDay = updateDto.allDay;
    if (updateDto.category !== undefined)
      updateData.category = updateDto.category;
    if (updateDto.location !== undefined)
      updateData.location = updateDto.location;
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;
    if (updateDto.typePrimary !== undefined)
      updateData.typePrimary = updateDto.typePrimary;
    if (updateDto.typeSecondary !== undefined) {
      updateData.typeSecondary = updateDto.typeSecondary;
    }
    if (updateDto.memo !== undefined) updateData.memo = updateDto.memo;
    if (updateDto.contentHtml !== undefined)
      updateData.contentHtml = updateDto.contentHtml;
    if (updateDto.ownerId !== undefined) updateData.ownerId = updateDto.ownerId;

    updateData.updatedAt = new Date();

    await this.db
      .update(irActivities)
      .set(updateData)
      .where(eq(irActivities.id, id));

    // Update KB participants if provided (legacy format)
    if (updateDto.kbParticipants !== undefined) {
      await this.db
        .delete(irActivityKbParticipants)
        .where(eq(irActivityKbParticipants.activityId, id));
      if (updateDto.kbParticipants.length > 0) {
        await this.db.insert(irActivityKbParticipants).values(
          updateDto.kbParticipants.map((p) => ({
            activityId: id,
            userId: p.userId,
            role: p.role,
          })),
        );
      }
    }

    // Update visitors if provided
    if (updateDto.kbs !== undefined || updateDto.visitors !== undefined) {
      // Delete existing visitors
      await this.db
        .delete(irActivityVisitors)
        .where(eq(irActivityVisitors.activityId, id));

      // Collect all new visitors
      const allVisitors: Array<{
        visitorName: string;
        visitorType?: 'investor' | 'broker' | 'kb';
        company?: string;
      }> = [];

      // Add KB staff as visitors
      if (updateDto.kbs && updateDto.kbs.length > 0) {
        allVisitors.push(
          ...updateDto.kbs.map((name) => ({
            visitorName: name,
            visitorType: 'kb' as const,
            company: undefined,
          })),
        );
      }

      // Add regular visitors
      if (updateDto.visitors && updateDto.visitors.length > 0) {
        if (typeof updateDto.visitors[0] === 'string') {
          // String array format
          allVisitors.push(
            ...(updateDto.visitors as string[]).map((name) => ({
              visitorName: name,
              visitorType: 'investor' as const,
              company: undefined,
            })),
          );
        } else {
          // Object array format
          allVisitors.push(
            ...(
              updateDto.visitors as Array<{
                visitorName: string;
                visitorType?: 'investor' | 'broker';
                company?: string;
              }>
            ).map((v) => ({
              visitorName: v.visitorName,
              visitorType: v.visitorType || ('investor' as const),
              company: v.company,
            })),
          );
        }
      }

      // Insert all visitors
      if (allVisitors.length > 0) {
        await this.db.insert(irActivityVisitors).values(
          allVisitors.map((v) => ({
            activityId: id,
            visitorName: v.visitorName,
            visitorType: v.visitorType,
            company: v.company,
          })),
        );
      }
    }

    // Update keywords if provided
    if (updateDto.keywords !== undefined) {
      await this.db
        .delete(irActivityKeywords)
        .where(eq(irActivityKeywords.activityId, id));
      if (updateDto.keywords.length > 0) {
        await this.db.insert(irActivityKeywords).values(
          updateDto.keywords.slice(0, 5).map((keyword, index) => ({
            activityId: id,
            keyword,
            displayOrder: index,
          })),
        );
      }
    }

    // Update sub-activities if provided
    if (updateDto.subActivities !== undefined) {
      for (const sub of updateDto.subActivities) {
        if (!sub || !sub.id) continue;

        const subUpdate: any = {};
        if (sub.title !== undefined) subUpdate.title = sub.title;
        if (sub.ownerId !== undefined) subUpdate.ownerId = sub.ownerId;
        if (sub.status !== undefined) subUpdate.status = sub.status;
        if (sub.startDatetime !== undefined)
          subUpdate.startDatetime = sub.startDatetime
            ? new Date(sub.startDatetime)
            : null;
        if (sub.endDatetime !== undefined)
          subUpdate.endDatetime = sub.endDatetime
            ? new Date(sub.endDatetime)
            : null;

        // Extended optional fields (safe if migration applied)
        if (sub.allDay !== undefined) subUpdate.allDay = sub.allDay;
        if (sub.category !== undefined) subUpdate.category = sub.category;
        if (sub.location !== undefined) subUpdate.location = sub.location;
        if (sub.description !== undefined)
          subUpdate.description = sub.description;
        if (sub.typePrimary !== undefined)
          subUpdate.typePrimary = sub.typePrimary;
        if (sub.typeSecondary !== undefined)
          subUpdate.typeSecondary = sub.typeSecondary;
        if (sub.memo !== undefined) subUpdate.memo = sub.memo;
        if (sub.contentHtml !== undefined)
          subUpdate.contentHtml = sub.contentHtml;

        subUpdate.updatedAt = new Date();

        // Attempt extended update; fallback to legacy columns if needed
        try {
          await this.db
            .update(irSubActivities)
            .set(subUpdate)
            .where(eq(irSubActivities.id, sub.id));
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes('column') && msg.includes('does not exist')) {
            const legacyUpdate: any = {
              updatedAt: subUpdate.updatedAt,
            };
            if (sub.title !== undefined) legacyUpdate.title = sub.title;
            if (sub.ownerId !== undefined) legacyUpdate.ownerId = sub.ownerId;
            if (sub.status !== undefined) legacyUpdate.status = sub.status;
            if (sub.startDatetime !== undefined)
              legacyUpdate.startDatetime = sub.startDatetime
                ? new Date(sub.startDatetime)
                : null;
            if (sub.endDatetime !== undefined)
              legacyUpdate.endDatetime = sub.endDatetime
                ? new Date(sub.endDatetime)
                : null;
            await this.db
              .update(irSubActivities)
              .set(legacyUpdate)
              .where(eq(irSubActivities.id, sub.id));
          } else {
            throw e;
          }
        }

        // Relations: replace if arrays provided
        if (sub.kbParticipants !== undefined) {
          try {
            await this.db
              .delete(irSubActivityKbParticipants)
              .where(eq(irSubActivityKbParticipants.subActivityId, sub.id));
            if (sub.kbParticipants.length > 0) {
              await this.db.insert(irSubActivityKbParticipants).values(
                sub.kbParticipants.map((p: any) => ({
                  subActivityId: sub.id,
                  userId: p.userId,
                  role: p.role,
                })),
              );
            }
          } catch {
            // Skip if table not migrated
          }
        }

        if (sub.visitors !== undefined) {
          try {
            await this.db
              .delete(irSubActivityVisitors)
              .where(eq(irSubActivityVisitors.subActivityId, sub.id));
            if (sub.visitors.length > 0) {
              await this.db.insert(irSubActivityVisitors).values(
                sub.visitors.map((v: any) => ({
                  subActivityId: sub.id,
                  visitorName: v.visitorName,
                  visitorType: v.visitorType,
                  company: v.company,
                })),
              );
            }
          } catch {
            // Skip if table not migrated
          }
        }

        if (sub.keywords !== undefined) {
          try {
            await this.db
              .delete(irSubActivityKeywords)
              .where(eq(irSubActivityKeywords.subActivityId, sub.id));
            if (sub.keywords.length > 0) {
              await this.db.insert(irSubActivityKeywords).values(
                sub.keywords
                  .slice(0, 5)
                  .map((keyword: string, index: number) => ({
                    subActivityId: sub.id,
                    keyword,
                    displayOrder: index,
                  })),
              );
            }
          } catch {
            // Skip if table not migrated
          }
        }
      }
    }

    // Create update log
    const user = await (this.db.query as any).users.findFirst({
      where: eq(users.id, userId),
    });

    await this.db.insert(irActivityLogs).values({
      id: this.generateId('log'),
      activityId: id,
      logType: 'update',
      userId,
      userName: user?.name || 'Unknown',
      message: `${user?.name || 'Unknown'} 님이 내용을 변경했습니다.`,
    });

    return this.findOne(id);
  }

  /**
   * Update activity status
   */
  async updateStatus(
    id: string,
    statusDto: UpdateIrActivityStatusDto,
    userId: string,
  ): Promise<IrActivityEntityResponse> {
    const existing = await (this.db.query as any).irActivities.findFirst({
      where: eq(irActivities.id, id),
    });

    if (!existing) {
      throw new NotFoundException(`IR Activity with ID ${id} not found`);
    }

    const updateData: any = {
      status: statusDto.status,
      updatedAt: new Date(),
    };

    // Set resolvedAt if status is completed
    if (statusDto.status === 'COMPLETED') {
      updateData.resolvedAt = new Date();
    }

    await this.db
      .update(irActivities)
      .set(updateData)
      .where(eq(irActivities.id, id));

    // Create status change log
    const user = await (this.db.query as any).users.findFirst({
      where: eq(users.id, userId),
    });

    await this.db.insert(irActivityLogs).values({
      id: this.generateId('log'),
      activityId: id,
      logType: 'status',
      userId,
      userName: user?.name || 'Unknown',
      message: `${user?.name || 'Unknown'} 님이 상태를 변경했습니다.`,
      oldValue: existing.status,
      newValue: statusDto.status,
    });

    return this.findOne(id);
  }

  /**
   * Delete an IR activity
   */
  async remove(id: string, _userId: string): Promise<void> {
    const existing = await (this.db.query as any).irActivities.findFirst({
      where: eq(irActivities.id, id),
    });

    if (!existing) {
      throw new NotFoundException(`IR Activity with ID ${id} not found`);
    }

    await this.db.delete(irActivities).where(eq(irActivities.id, id));
  }

  /**
   * Add sub-activity to an activity
   */
  async addSubActivity(
    activityId: string,
    subDto: CreateIrSubActivityDto,
    userId: string,
  ): Promise<IrActivitySubActivityResponse> {
    const activity = await (this.db.query as any).irActivities.findFirst({
      where: eq(irActivities.id, activityId),
    });

    if (!activity) {
      throw new NotFoundException(
        `IR Activity with ID ${activityId} not found`,
      );
    }

    // Get the next display order
    const existingSubs = await (this.db.query as any).irSubActivities.findMany({
      where: eq(irSubActivities.parentActivityId, activityId),
    });

    const subId = this.generateId('sub');

    try {
      await this.db.insert(irSubActivities).values({
        id: subId,
        parentActivityId: activityId,
        title: subDto.title,
        ownerId: subDto.ownerId,
        status: subDto.status || '예정',
        startDatetime: subDto.startDatetime
          ? new Date(subDto.startDatetime)
          : undefined,
        endDatetime: subDto.endDatetime
          ? new Date(subDto.endDatetime)
          : undefined,
        allDay: subDto.allDay ?? false,
        category: subDto.category,
        location: subDto.location,
        description: subDto.description,
        typePrimary: subDto.typePrimary,
        typeSecondary: subDto.typeSecondary,
        memo: subDto.memo,
        contentHtml: subDto.contentHtml,
        displayOrder: existingSubs.length,
      });
    } catch (e: any) {
      if (
        typeof e?.message === 'string' &&
        e.message.includes('column') &&
        e.message.includes('does not exist')
      ) {
        await this.db.insert(irSubActivities).values({
          id: subId,
          parentActivityId: activityId,
          title: subDto.title,
          ownerId: subDto.ownerId,
          status: subDto.status || '예정',
          startDatetime: subDto.startDatetime
            ? new Date(subDto.startDatetime)
            : undefined,
          endDatetime: subDto.endDatetime
            ? new Date(subDto.endDatetime)
            : undefined,
          displayOrder: existingSubs.length,
        });
      } else {
        throw e;
      }
    }

    // Sub-level participants
    if (subDto.kbParticipants && subDto.kbParticipants.length > 0) {
      try {
        await this.db.insert(irSubActivityKbParticipants).values(
          subDto.kbParticipants.map((p) => ({
            subActivityId: subId,
            userId: p.userId,
            role: p.role,
          })),
        );
      } catch {
        // Table not migrated yet; skip silently
      }
    }

    // Sub-level visitors
    if (subDto.visitors && subDto.visitors.length > 0) {
      try {
        await this.db.insert(irSubActivityVisitors).values(
          subDto.visitors.map((v) => ({
            subActivityId: subId,
            visitorName: v.visitorName,
            visitorType: v.visitorType,
            company: v.company,
          })),
        );
      } catch {
        // Skip if not migrated
      }
    }

    // Sub-level keywords
    if (subDto.keywords && subDto.keywords.length > 0) {
      try {
        await this.db.insert(irSubActivityKeywords).values(
          subDto.keywords.slice(0, 5).map((keyword, index) => ({
            subActivityId: subId,
            keyword,
            displayOrder: index,
          })),
        );
      } catch {
        // Skip if not migrated
      }
    }

    // Create log
    const user = await (this.db.query as any).users.findFirst({
      where: eq(users.id, userId),
    });

    await this.db.insert(irActivityLogs).values({
      id: this.generateId('log'),
      activityId,
      logType: 'sub_activity',
      userId,
      userName: user?.name || 'Unknown',
      message: `${user?.name || 'Unknown'} 님이 세부 활동을 추가했습니다.`,
    });

    const created = await (this.db.query as any).irSubActivities.findFirst({
      where: eq(irSubActivities.id, subId),
      with: {
        owner: true,
      },
    });

    return {
      id: created!.id,
      title: created!.title,
      owner: created!.owner?.name,
      status: created!.status,
      startDatetime: created!.startDatetime?.toISOString(),
      endDatetime: created!.endDatetime?.toISOString(),
      allDay: created!.allDay || false,
      category: created!.category || activity.category,
      location: created!.location || undefined,
      description: created!.description || undefined,
      typePrimary: created!.typePrimary || activity.typePrimary,
      typeSecondary: created!.typeSecondary || undefined,
      memo: created!.memo || undefined,
      contentHtml: created!.contentHtml || undefined,
    };
  }
}
