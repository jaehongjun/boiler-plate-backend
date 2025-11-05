import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, gte, lte, sql, count, desc } from 'drizzle-orm';
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
  QueryIrInsightsDto,
  IrInsightsResponse,
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
      message: `${user?.name || 'Unknown'} 님이 "${createDto.title}" 활동을 생성했습니다.`,
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
        subActivities: {
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
          orderBy: (subActivities, { asc }) => [asc(subActivities.displayOrder)],
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
        createdAtISO: activity.createdAt.toISOString(),
        updatedAtISO: activity.updatedAt.toISOString(),
        parentId: null, // Parent activities have no parent
        children: activity.subActivities?.map((sub: any) => ({
          id: sub.id,
          title: sub.title,
          startISO: sub.startDatetime?.toISOString() || activity.startDatetime.toISOString(),
          endISO: sub.endDatetime?.toISOString() || activity.endDatetime?.toISOString(),
          typePrimary: sub.typePrimary || activity.typePrimary,
          status: sub.status,
          category: sub.category || activity.category,
          investors: sub.visitors
            ?.filter((v: any) => v.visitorType === 'investor')
            .map((v: any) => v.visitorName) || [],
          brokers: sub.visitors
            ?.filter((v: any) => v.visitorType === 'broker')
            .map((v: any) => v.visitorName) || [],
          kbParticipants: sub.kbParticipants?.map((p: any) => p.user.name) || [],
          owner: sub.owner?.name,
          createdAtISO: sub.createdAt.toISOString(),
          updatedAtISO: sub.updatedAt.toISOString(),
          parentId: activity.id,
          children: [], // Sub-activities don't have children
        })) || [],
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

    // Determine what was updated
    const updatedFields: string[] = [];
    if (updateDto.title !== undefined) updatedFields.push('활동명');
    if (updateDto.contentHtml !== undefined) updatedFields.push('내용');
    if (updateDto.keywords !== undefined) updatedFields.push('키워드');
    if (updateDto.location !== undefined) updatedFields.push('장소');
    if (updateDto.startDatetime !== undefined || updateDto.endDatetime !== undefined) updatedFields.push('일시');

    const changedFieldsText = updatedFields.length > 0
      ? updatedFields.join(', ')
      : '활동 정보';

    await this.db.insert(irActivityLogs).values({
      id: this.generateId('log'),
      activityId: id,
      logType: 'update',
      userId,
      userName: user?.name || 'Unknown',
      message: `${user?.name || 'Unknown'} 님이 ${changedFieldsText}를 수정했습니다.`,
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

    // Map status to Korean labels
    const statusLabels: Record<string, string> = {
      SCHEDULED: '예정',
      IN_PROGRESS: '진행중',
      COMPLETED: '완료',
      SUSPENDED: '중단',
    };
    const newStatusLabel = statusLabels[statusDto.status] || statusDto.status;

    await this.db.insert(irActivityLogs).values({
      id: this.generateId('log'),
      activityId: id,
      logType: 'status',
      userId,
      userName: user?.name || 'Unknown',
      message: `${user?.name || 'Unknown'} 님이 상태를 "${newStatusLabel}"(으)로 변경했습니다.`,
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
        ownerId: subDto.ownerId || userId,
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
      message: `${user?.name || 'Unknown'} 님이 "${subDto.title}" 상세활동을 추가했습니다.`,
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

  /**
   * Get IR Insights
   * Aggregates activity data for analytics dashboard
   */
  async getInsights(query: QueryIrInsightsDto): Promise<IrInsightsResponse> {
    // Determine date range
    const endDate = query.endISO
      ? new Date(query.endISO)
      : new Date(); // Default to now
    const startDate = query.startISO
      ? new Date(query.startISO)
      : new Date(new Date().setFullYear(endDate.getFullYear() - 1)); // Default to 1 year ago

    // Build base where clause for date filtering
    const dateFilter = and(
      gte(irActivities.startDatetime, startDate),
      lte(irActivities.startDatetime, endDate),
    );

    // 1. Summary Statistics
    const [summaryResult] = await this.db
      .select({
        totalActivities: count(irActivities.id),
      })
      .from(irActivities)
      .where(dateFilter);

    const [subActivitiesResult] = await this.db
      .select({
        totalSubActivities: count(irSubActivities.id),
      })
      .from(irSubActivities)
      .innerJoin(
        irActivities,
        eq(irSubActivities.parentActivityId, irActivities.id),
      )
      .where(dateFilter);

    const [investorsResult] = await this.db
      .select({
        uniqueInvestors: sql<number>`COUNT(DISTINCT ${irActivityVisitors.visitorName})`,
        uniqueCompanies: sql<number>`COUNT(DISTINCT ${irActivityVisitors.company})`,
      })
      .from(irActivityVisitors)
      .innerJoin(
        irActivities,
        eq(irActivityVisitors.activityId, irActivities.id),
      )
      .where(
        and(
          dateFilter,
          eq(irActivityVisitors.visitorType, 'investor'),
        ),
      );

    const [staffResult] = await this.db
      .select({
        activeKbStaff: sql<number>`COUNT(DISTINCT ${irActivityKbParticipants.userId})`,
      })
      .from(irActivityKbParticipants)
      .innerJoin(
        irActivities,
        eq(irActivityKbParticipants.activityId, irActivities.id),
      )
      .where(dateFilter);

    // 2. Activity Stats by Month
    const monthlyStats = await this.db
      .select({
        period: sql<string>`TO_CHAR(${irActivities.startDatetime}, 'YYYY-MM')`,
        total: count(irActivities.id),
        scheduled: sql<number>`SUM(CASE WHEN ${irActivities.status} = '예정' THEN 1 ELSE 0 END)`,
        inProgress: sql<number>`SUM(CASE WHEN ${irActivities.status} = '진행중' THEN 1 ELSE 0 END)`,
        completed: sql<number>`SUM(CASE WHEN ${irActivities.status} = '완료' THEN 1 ELSE 0 END)`,
        cancelled: sql<number>`SUM(CASE WHEN ${irActivities.status} = '중단' THEN 1 ELSE 0 END)`,
      })
      .from(irActivities)
      .where(dateFilter)
      .groupBy(sql`TO_CHAR(${irActivities.startDatetime}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${irActivities.startDatetime}, 'YYYY-MM')`);

    // 3. Activity Stats by Quarter
    const quarterlyStats = await this.db
      .select({
        period: sql<string>`TO_CHAR(${irActivities.startDatetime}, 'YYYY-"Q"Q')`,
        total: count(irActivities.id),
        scheduled: sql<number>`SUM(CASE WHEN ${irActivities.status} = '예정' THEN 1 ELSE 0 END)`,
        inProgress: sql<number>`SUM(CASE WHEN ${irActivities.status} = '진행중' THEN 1 ELSE 0 END)`,
        completed: sql<number>`SUM(CASE WHEN ${irActivities.status} = '완료' THEN 1 ELSE 0 END)`,
        cancelled: sql<number>`SUM(CASE WHEN ${irActivities.status} = '중단' THEN 1 ELSE 0 END)`,
      })
      .from(irActivities)
      .where(dateFilter)
      .groupBy(sql`TO_CHAR(${irActivities.startDatetime}, 'YYYY-"Q"Q')`)
      .orderBy(sql`TO_CHAR(${irActivities.startDatetime}, 'YYYY-"Q"Q')`);

    // 4. Distribution by Type
    const typeDistribution = await this.db
      .select({
        typePrimary: irActivities.typePrimary,
        count: count(irActivities.id),
      })
      .from(irActivities)
      .where(dateFilter)
      .groupBy(irActivities.typePrimary)
      .orderBy(desc(count(irActivities.id)));

    const totalForTypePercentage = summaryResult.totalActivities;

    // 5. Distribution by Category
    const categoryDistribution = await this.db
      .select({
        category: irActivities.category,
        count: count(irActivities.id),
      })
      .from(irActivities)
      .where(dateFilter)
      .groupBy(irActivities.category)
      .orderBy(desc(count(irActivities.id)));

    // 6. Status Overview
    const statusOverview = await this.db
      .select({
        status: irActivities.status,
        count: count(irActivities.id),
      })
      .from(irActivities)
      .where(dateFilter)
      .groupBy(irActivities.status)
      .orderBy(desc(count(irActivities.id)));

    // 7. Top Investors (by activity count)
    const topInvestors = await this.db
      .select({
        visitorName: irActivityVisitors.visitorName,
        company: irActivityVisitors.company,
        activityCount: count(irActivityVisitors.activityId),
        lastActivityDate: sql<string>`MAX(${irActivities.startDatetime})`,
      })
      .from(irActivityVisitors)
      .innerJoin(
        irActivities,
        eq(irActivityVisitors.activityId, irActivities.id),
      )
      .where(
        and(
          dateFilter,
          eq(irActivityVisitors.visitorType, 'investor'),
        ),
      )
      .groupBy(irActivityVisitors.visitorName, irActivityVisitors.company)
      .orderBy(desc(count(irActivityVisitors.activityId)))
      .limit(10);

    // 8. Staff Activity Ranking
    const staffAsOwner = await this.db
      .select({
        userId: irActivities.ownerId,
        count: count(irActivities.id),
      })
      .from(irActivities)
      .where(and(dateFilter, sql`${irActivities.ownerId} IS NOT NULL`))
      .groupBy(irActivities.ownerId);

    const staffAsParticipant = await this.db
      .select({
        userId: irActivityKbParticipants.userId,
        count: count(irActivityKbParticipants.activityId),
      })
      .from(irActivityKbParticipants)
      .innerJoin(
        irActivities,
        eq(irActivityKbParticipants.activityId, irActivities.id),
      )
      .where(dateFilter)
      .groupBy(irActivityKbParticipants.userId);

    // Merge staff rankings
    const staffMap = new Map<
      string,
      { userId: string; asOwner: number; asParticipant: number }
    >();

    staffAsOwner.forEach((s) => {
      if (s.userId) {
        staffMap.set(s.userId, {
          userId: s.userId,
          asOwner: s.count,
          asParticipant: 0,
        });
      }
    });

    staffAsParticipant.forEach((s) => {
      const existing = staffMap.get(s.userId);
      if (existing) {
        existing.asParticipant = s.count;
      } else {
        staffMap.set(s.userId, {
          userId: s.userId,
          asOwner: 0,
          asParticipant: s.count,
        });
      }
    });

    // Fetch user names and sort
    const staffWithNames = await Promise.all(
      Array.from(staffMap.values()).map(async (staff) => {
        const [user] = await this.db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, staff.userId));

        return {
          userId: staff.userId,
          userName: user?.name || 'Unknown',
          activityCount: staff.asOwner + staff.asParticipant,
          asOwner: staff.asOwner,
          asParticipant: staff.asParticipant,
        };
      }),
    );

    staffWithNames.sort((a, b) => b.activityCount - a.activityCount);

    // 9. Top Keywords
    const topKeywords = await this.db
      .select({
        keyword: irActivityKeywords.keyword,
        count: count(irActivityKeywords.keyword),
      })
      .from(irActivityKeywords)
      .innerJoin(
        irActivities,
        eq(irActivityKeywords.activityId, irActivities.id),
      )
      .where(dateFilter)
      .groupBy(irActivityKeywords.keyword)
      .orderBy(desc(count(irActivityKeywords.keyword)))
      .limit(20);

    // 10. Meeting Type Efficiency by Quarter
    // Calculate current quarter and previous quarter
    const currentQuarterEnd = endDate;
    const currentQuarterStart = new Date(
      currentQuarterEnd.getFullYear(),
      Math.floor(currentQuarterEnd.getMonth() / 3) * 3,
      1,
    );

    const previousQuarterEnd = new Date(currentQuarterStart);
    previousQuarterEnd.setDate(previousQuarterEnd.getDate() - 1);
    const previousQuarterStart = new Date(
      previousQuarterEnd.getFullYear(),
      Math.floor(previousQuarterEnd.getMonth() / 3) * 3,
      1,
    );

    // Mock data for meeting type efficiency (TODO: Connect with real share change data)
    const meetingTypes = ['대면미팅', '비대면미팅', 'NDR', '기타'];
    const meetingTypeEfficiency = meetingTypes.map((meetingType) => {
      // Mock share change rates - replace with actual data later
      const mockRates: Record<string, { current: number; previous: number }> = {
        '대면미팅': { current: 0.2, previous: 0.3 },
        '비대면미팅': { current: 0.5, previous: 0.4 },
        'NDR': { current: 0.8, previous: 0.6 },
        '기타': { current: 0.2, previous: 0.15 },
      };

      return {
        meetingType,
        currentQuarter: {
          count: 30 + Math.floor(Math.random() * 20), // Mock count
          avgShareChangeRate: mockRates[meetingType]?.current || 0,
        },
        previousQuarter: {
          count: 25 + Math.floor(Math.random() * 20), // Mock count
          avgShareChangeRate: mockRates[meetingType]?.previous || 0,
        },
      };
    });

    // 11. Investor Responsiveness Heatmap
    // Mock data for investor responsiveness (TODO: Connect with real investor data)
    const investorStyles = [
      'Growth',
      'Momentum',
      'Deep Value',
      'ESG',
      'GARP',
      'Index',
      'Factor',
      'Smart Beta',
      'Thematic',
      'Event Driven',
    ];
    const strategies = ['Active', 'Passive', 'Opportunistic', 'Long-term'];

    // Generate mock heatmap data
    const investorResponsivenessCells = investorStyles.flatMap(
      (style, styleIndex) =>
        strategies.map((strategy, strategyIndex) => {
          // Create pattern where certain combinations have higher values
          let baseValue = 0.1;

          // ESG + Long-term = high
          if (style === 'ESG' && strategy === 'Long-term') baseValue = 1.0;
          else if (style === 'ESG' && strategy === 'Opportunistic') baseValue = 0.5;
          else if (style === 'GARP' && strategy === 'Long-term') baseValue = 0.8;
          else if (style === 'GARP' && strategy === 'Opportunistic') baseValue = 0.8;
          else if (style === 'Index' && strategy === 'Long-term') baseValue = 1.0;
          else if (style === 'Index' && strategy === 'Passive') baseValue = 0.5;
          else if (style === 'Factor' && strategy === 'Long-term') baseValue = 1.0;
          else if (style === 'Factor' && strategy === 'Opportunistic') baseValue = 0.8;
          else if (style === 'Smart Beta' && strategy === 'Long-term')
            baseValue = 1.0;
          else if (style === 'Smart Beta' && strategy === 'Opportunistic')
            baseValue = 0.8;
          else if (style === 'Thematic' && strategy === 'Long-term')
            baseValue = 1.0;
          else if (style === 'Thematic' && strategy === 'Opportunistic')
            baseValue = 0.8;
          else if (style === 'Event Driven' && strategy === 'Long-term')
            baseValue = 1.0;
          else if (style === 'Event Driven' && strategy === 'Opportunistic')
            baseValue = 0.8;
          else if (style === 'Deep Value' && strategy === 'Opportunistic')
            baseValue = 0.5;
          else if (strategy === 'Long-term') baseValue = 0.3;
          else if (strategy === 'Opportunistic') baseValue = 0.3;

          return {
            investorStyle: style,
            strategy: strategy,
            value: baseValue,
            shareChangeRate: baseValue * 0.12, // Mock rate
            shareCountChange: baseValue > 0.5 ? 10200 : -10200, // Mock change
            investorCount: Math.floor(baseValue * 20) + 5, // Mock count
          };
        }),
    );

    const investorResponsiveness = {
      investorStyles,
      strategies,
      cells: investorResponsivenessCells,
    };

    // 12. Keyword and Event Impact
    // Mock data for keyword/event correlation (TODO: Connect with real event data)
    const quarters = [
      '1Q22', '2Q22', '3Q22', '4Q22',
      '1Q23', '2Q23', '3Q23', '4Q23',
      '1Q24', '2Q24', '3Q24', '4Q24',
    ];

    const keywordEventImpact = {
      quarters: quarters.map((quarter, index) => {
        const isHighlighted = quarter === '3Q22';
        const baseEventCount = 800 + Math.floor(Math.random() * 600);

        return {
          quarter,
          previousQuarterEventCount: baseEventCount - 200,
          currentQuarterEventCount: isHighlighted ? 2000 : baseEventCount,
          stockPriceChange: isHighlighted ? -8.5 : (Math.random() * 10 - 5),
          events: isHighlighted
            ? [
                {
                  keyword: '주주환원',
                  eventDate: '2022-10-01',
                  eventName: '금리 정책 발표',
                  stockPriceChange: -8.5,
                },
              ]
            : [],
        };
      }),
    };

    // Build response
    return {
      summary: {
        totalActivities: summaryResult.totalActivities,
        totalSubActivities: subActivitiesResult.totalSubActivities,
        uniqueInvestors: Number(investorsResult.uniqueInvestors || 0),
        uniqueCompanies: Number(investorsResult.uniqueCompanies || 0),
        activeKbStaff: Number(staffResult.activeKbStaff || 0),
      },
      activityStatsByMonth: monthlyStats.map((stat) => ({
        period: stat.period,
        total: stat.total,
        byStatus: {
          SCHEDULED: Number(stat.scheduled),
          IN_PROGRESS: Number(stat.inProgress),
          COMPLETED: Number(stat.completed),
          CANCELLED: Number(stat.cancelled),
        },
      })),
      activityStatsByQuarter: quarterlyStats.map((stat) => ({
        period: stat.period,
        total: stat.total,
        byStatus: {
          SCHEDULED: Number(stat.scheduled),
          IN_PROGRESS: Number(stat.inProgress),
          COMPLETED: Number(stat.completed),
          CANCELLED: Number(stat.cancelled),
        },
      })),
      distributionByType: typeDistribution.map((item) => ({
        typePrimary: item.typePrimary,
        count: item.count,
        percentage:
          totalForTypePercentage > 0
            ? Math.round((item.count / totalForTypePercentage) * 100 * 10) / 10
            : 0,
      })),
      distributionByCategory: categoryDistribution.map((item) => ({
        category: item.category,
        count: item.count,
        percentage:
          totalForTypePercentage > 0
            ? Math.round((item.count / totalForTypePercentage) * 100 * 10) / 10
            : 0,
      })),
      statusOverview: statusOverview.map((item) => ({
        status: item.status,
        count: item.count,
        percentage:
          totalForTypePercentage > 0
            ? Math.round((item.count / totalForTypePercentage) * 100 * 10) / 10
            : 0,
      })),
      topInvestors: topInvestors.map((item) => ({
        visitorName: item.visitorName,
        company: item.company,
        activityCount: item.activityCount,
        lastActivityDate: new Date(item.lastActivityDate).toISOString(),
      })),
      staffRanking: staffWithNames.slice(0, 10), // Top 10
      topKeywords: topKeywords.map((item) => ({
        keyword: item.keyword,
        count: item.count,
      })),
      meetingTypeEfficiency,
      investorResponsiveness,
      keywordEventImpact,
      networkEfficiency: this.generateMockNetworkEfficiency(),
      regionalEfficiency: await this.generateMockRegionalEfficiencyMap(),
      meetingShareCorrelation: this.generateMockMeetingShareCorrelation(),
      eventMarketCorrelation: this.generateMockEventMarketCorrelation(),
      irEfficiencyLeaderboard: this.generateMockIrEfficiencyLeaderboard(),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  }

  /**
   * Generate mock network efficiency data
   * TODO: Replace with real data from database
   */
  private generateMockNetworkEfficiency() {
    const nodes = [
      // Staff nodes
      { id: 'staff-1', name: 'IR전무', type: 'staff' as const, size: 'large' as const, level: 'high' as const, avgShareChangeRate: 0.9 },
      { id: 'staff-2', name: 'IR팀장', type: 'staff' as const, size: 'medium' as const, level: 'medium' as const, avgShareChangeRate: 0.6 },
      { id: 'staff-3', name: 'IR대리', type: 'staff' as const, size: 'medium' as const, level: 'medium' as const, avgShareChangeRate: 0.4 },

      // Broker nodes
      { id: 'broker-1', name: 'B증권', type: 'broker' as const, size: 'large' as const, level: 'high' as const, avgShareChangeRate: 0.9 },
      { id: 'broker-2', name: 'A증권', type: 'broker' as const, size: 'medium' as const, level: 'medium' as const, avgShareChangeRate: 0.5 },
      { id: 'broker-3', name: 'C증권', type: 'broker' as const, size: 'medium' as const, level: 'medium' as const, avgShareChangeRate: 0.3 },

      // Investor nodes
      { id: 'investor-1', name: 'P사', type: 'investor' as const, size: 'small' as const, level: 'none' as const, avgShareChangeRate: 0.1 },
      { id: 'investor-2', name: 'S사', type: 'investor' as const, size: 'medium' as const, level: 'high' as const, avgShareChangeRate: 0.7 },
      { id: 'investor-3', name: 'Q사', type: 'investor' as const, size: 'small' as const, level: 'none' as const, avgShareChangeRate: 0.2 },
      { id: 'investor-4', name: 'T사', type: 'investor' as const, size: 'medium' as const, level: 'high' as const, avgShareChangeRate: 0.8 },
      { id: 'investor-5', name: 'R사', type: 'investor' as const, size: 'small' as const, level: 'none' as const, avgShareChangeRate: 0.1 },
      { id: 'investor-6', name: 'U사', type: 'investor' as const, size: 'medium' as const, level: 'high' as const, avgShareChangeRate: 0.6 },
      { id: 'investor-7', name: 'V사', type: 'investor' as const, size: 'medium' as const, level: 'high' as const, avgShareChangeRate: 0.5 },
      { id: 'investor-8', name: 'W사', type: 'investor' as const, size: 'small' as const, level: 'none' as const, avgShareChangeRate: 0.2 },
      { id: 'investor-9', name: 'X사', type: 'investor' as const, size: 'small' as const, level: 'none' as const, avgShareChangeRate: 0.1 },
      { id: 'investor-10', name: 'Y사', type: 'investor' as const, size: 'small' as const, level: 'none' as const, avgShareChangeRate: 0.15 },
    ];

    const edges = [
      // Staff to staff
      { source: 'staff-1', target: 'staff-2', strength: 'medium' as const },
      { source: 'staff-1', target: 'staff-3', strength: 'medium' as const },

      // Staff to brokers
      { source: 'staff-2', target: 'broker-2', strength: 'weak' as const },
      { source: 'staff-2', target: 'broker-3', strength: 'medium' as const },
      { source: 'staff-1', target: 'broker-1', strength: 'strong' as const },

      // Brokers to investors
      { source: 'broker-2', target: 'investor-1', strength: 'weak' as const },
      { source: 'broker-2', target: 'investor-3', strength: 'weak' as const },
      { source: 'broker-2', target: 'investor-5', strength: 'weak' as const },
      { source: 'broker-1', target: 'investor-2', strength: 'medium' as const },
      { source: 'broker-1', target: 'investor-4', strength: 'medium' as const },
      { source: 'broker-1', target: 'investor-6', strength: 'medium' as const },
      { source: 'broker-1', target: 'investor-7', strength: 'medium' as const },
      { source: 'broker-3', target: 'investor-8', strength: 'weak' as const },
      { source: 'broker-3', target: 'investor-9', strength: 'weak' as const },
      { source: 'broker-3', target: 'investor-10', strength: 'weak' as const },
    ];

    const staffRanking = [
      { name: 'IR전무', avgShareChangeRate: 0.9 },
      { name: 'IR팀장', avgShareChangeRate: 0.6 },
      { name: 'IR대리', avgShareChangeRate: 0.4 },
    ];

    const brokerRanking = [
      { name: 'B증권', avgShareChangeRate: 0.9 },
      { name: 'A증권', avgShareChangeRate: 0.5 },
      { name: 'C증권', avgShareChangeRate: 0.3 },
    ];

    return {
      nodes,
      edges,
      staffRanking,
      brokerRanking,
    };
  }

  private async generateMockRegionalEfficiencyMap(): Promise<any> {
    // Mock data for global cities/regions
    const regions = [
      { regionCode: 'US-NY', regionName: 'New York', efficiency: 88, meetingCount: 65, purchaseResponseRate: 78.5, investorCount: 45 },
      { regionCode: 'GB-LDN', regionName: 'London', efficiency: 85, meetingCount: 58, purchaseResponseRate: 76.2, investorCount: 42 },
      { regionCode: 'JP-TYO', regionName: 'Tokyo', efficiency: 82, meetingCount: 52, purchaseResponseRate: 73.8, investorCount: 38 },
      { regionCode: 'HK', regionName: 'Hong Kong', efficiency: 80, meetingCount: 48, purchaseResponseRate: 71.5, investorCount: 35 },
      { regionCode: 'SG', regionName: 'Singapore', efficiency: 78, meetingCount: 45, purchaseResponseRate: 69.3, investorCount: 32 },
      { regionCode: 'DE-FRA', regionName: 'Frankfurt', efficiency: 75, meetingCount: 38, purchaseResponseRate: 66.8, investorCount: 28 },
      { regionCode: 'KR-SEL', regionName: 'Seoul', efficiency: 73, meetingCount: 42, purchaseResponseRate: 64.5, investorCount: 30 },
      { regionCode: 'CN-SHA', regionName: 'Shanghai', efficiency: 70, meetingCount: 35, purchaseResponseRate: 61.2, investorCount: 25 },
      { regionCode: 'FR-PAR', regionName: 'Paris', efficiency: 68, meetingCount: 32, purchaseResponseRate: 58.9, investorCount: 23 },
      { regionCode: 'AU-SYD', regionName: 'Sydney', efficiency: 65, meetingCount: 28, purchaseResponseRate: 56.4, investorCount: 20 },
      { regionCode: 'AE-DXB', regionName: 'Dubai', efficiency: 62, meetingCount: 25, purchaseResponseRate: 53.7, investorCount: 18 },
      { regionCode: 'CA-TOR', regionName: 'Toronto', efficiency: 60, meetingCount: 22, purchaseResponseRate: 51.2, investorCount: 16 },
      { regionCode: 'CH-ZRH', regionName: 'Zurich', efficiency: 58, meetingCount: 20, purchaseResponseRate: 48.8, investorCount: 14 },
      { regionCode: 'IN-MUM', regionName: 'Mumbai', efficiency: 55, meetingCount: 18, purchaseResponseRate: 46.3, investorCount: 12 },
      { regionCode: 'BR-SAO', regionName: 'São Paulo', efficiency: 52, meetingCount: 15, purchaseResponseRate: 43.5, investorCount: 10 },
    ];

    const topRegions = regions
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 3)
      .map(r => ({
        regionName: r.regionName,
        efficiency: r.efficiency,
        purchaseResponseRate: r.purchaseResponseRate,
      }));

    return {
      regions,
      topRegions,
    };
  }

  /**
   * Generate mock meeting-share correlation data (scatter plot)
   */
  private generateMockMeetingShareCorrelation() {
    const investorStyles = ['Long-term', 'High turnover', 'Value', 'Growth', 'Activist'];
    const investorNames = [
      'Fidelity', 'BlackRock', 'Vanguard', 'State Street', 'T. Rowe Price',
      'Capital Group', 'Wellington', 'Norges Bank', 'UBS', 'Goldman Sachs',
      'JP Morgan', 'Morgan Stanley', 'Credit Suisse', 'BNP Paribas', 'Deutsche Bank',
      'Allianz', 'AXA', 'Prudential', 'Legal & General', 'Aberdeen',
    ];

    const dataPoints = investorNames.map((name, index) => {
      const meetingCount = Math.floor(Math.random() * 6) + 1; // 1-6 meetings
      const investorStyle = investorStyles[Math.floor(Math.random() * investorStyles.length)];

      // Create correlation: more meetings -> higher share change
      // But High turnover style has lower correlation
      let baseShareChange = meetingCount * 0.6 + Math.random() * 1.2; // Base correlation

      if (investorStyle === 'High turnover') {
        baseShareChange = Math.random() * 2.5; // Random, low correlation
      } else if (investorStyle === 'Long-term') {
        baseShareChange = meetingCount * 0.8 + Math.random() * 0.8; // Strong correlation
      }

      const shareChangeRate = Math.min(Math.max(baseShareChange, 0), 5); // Clamp 0-5%

      // Determine performance level
      let performanceLevel: 'high' | 'medium' | 'low' = 'low';
      if (shareChangeRate >= 3.5) performanceLevel = 'high';
      else if (shareChangeRate >= 2.0) performanceLevel = 'medium';

      return {
        investorName: name,
        investorStyle,
        meetingCount,
        shareChangeRate: Math.round(shareChangeRate * 10) / 10, // Round to 1 decimal
        eum: Math.floor(Math.random() * 900 + 100), // 100-1000 million USD
        performanceLevel,
      };
    });

    // Calculate correlation coefficient (Pearson's r)
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.meetingCount, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.shareChangeRate, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + p.meetingCount * p.shareChangeRate, 0);
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.meetingCount ** 2, 0);
    const sumY2 = dataPoints.reduce((sum, p) => sum + p.shareChangeRate ** 2, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
    const correlationCoefficient = Math.round((numerator / denominator) * 100) / 100;

    // Calculate trend line (linear regression)
    const meanX = sumX / n;
    const meanY = sumY / n;
    const slope = dataPoints.reduce((sum, p) =>
      sum + (p.meetingCount - meanX) * (p.shareChangeRate - meanY), 0
    ) / dataPoints.reduce((sum, p) => sum + (p.meetingCount - meanX) ** 2, 0);
    const intercept = meanY - slope * meanX;

    // Calculate average share change
    const averageShareChange = Math.round((sumY / n) * 10) / 10;

    return {
      dataPoints,
      correlationCoefficient,
      trendLine: {
        slope: Math.round(slope * 100) / 100,
        intercept: Math.round(intercept * 100) / 100,
      },
      averageShareChange,
    };
  }

  /**
   * Generate mock event-market correlation data
   */
  private generateMockEventMarketCorrelation() {
    const eventTypes = ['이벤트 1', '이벤트 2', '이벤트 3', '이벤트 4'];
    const marketIndicators = ['주가 변화', '지분 변화', '지분율 변화'];

    // Generate correlation matrix
    const correlationMatrix: Array<{
      eventType: string;
      marketIndicator: string;
      correlation: number;
      pValue: number;
      eventCount: number;
      avgChange: number;
    }> = [];
    for (const indicator of marketIndicators) {
      for (const eventType of eventTypes) {
        let correlation = Math.random() * 2 - 1; // -1 to 1

        // Make some patterns
        if (eventType === '이벤트 1' && indicator === '주가 변화') {
          correlation = 0.7 + Math.random() * 0.1;
        } else if (eventType === '이벤트 1' && indicator === '지분 변화') {
          correlation = 0.6 + Math.random() * 0.1;
        }

        correlationMatrix.push({
          eventType,
          marketIndicator: indicator,
          correlation: Math.round(correlation * 10) / 10,
          pValue: Math.random() * 0.1, // 0-0.1
          eventCount: Math.floor(Math.random() * 15) + 5, // 5-20
          avgChange: Math.round((Math.random() * 6 - 1) * 10) / 10, // -1 to 5
        });
      }
    }

    // Generate quarterly stock data
    const quarters = ['1Q22', '2Q22', '3Q22', '4Q22', '1Q23', '2Q23', '3Q23', '4Q23', '1Q24', '2Q24', '3Q24', '4Q24'];
    const quarterlyData = quarters.map((quarter, index) => {
      const basePrice = 1000 + index * 150;
      const meetingVolume = Math.floor(Math.random() * 1000) + 500; // 500-1500
      const isHighlight = quarter === '1Q24';

      // Generate events for some quarters
      const events: Array<{
        eventName: string;
        eventType: string;
        eventDate: string;
        shortTermChange: number;
        cumulativeChange: number;
      }> = [];
      if (Math.random() > 0.6 || isHighlight) {
        const eventCount = Math.floor(Math.random() * 2) + 1; // 1-2 events

        // Parse quarter to get year and quarter number
        const year = parseInt('20' + quarter.slice(-2));
        const quarterNum = parseInt(quarter.charAt(0));

        // Calculate start month of quarter (1Q=1, 2Q=4, 3Q=7, 4Q=10)
        const startMonth = (quarterNum - 1) * 3 + 1;

        for (let i = 0; i < eventCount; i++) {
          // Generate random date within the quarter
          const monthOffset = Math.floor(Math.random() * 3); // 0, 1, or 2 months into quarter
          const eventMonth = startMonth + monthOffset;
          const daysInMonth = new Date(year, eventMonth, 0).getDate();
          const eventDay = Math.floor(Math.random() * daysInMonth) + 1;

          const eventDate = `${year}-${String(eventMonth).padStart(2, '0')}-${String(eventDay).padStart(2, '0')}`;

          events.push({
            eventName: `이벤트명 ${i + 1}`,
            eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
            eventDate,
            shortTermChange: Math.round((Math.random() * 6 - 1) * 10) / 10,
            cumulativeChange: Math.round((Math.random() * 4 - 2) * 10) / 10,
          });
        }
      }

      return {
        quarter,
        meetingVolume,
        stockPrice: basePrice + Math.floor(Math.random() * 200),
        stockChangeRate: Math.round((Math.random() * 10 - 2) * 10) / 10, // -2% to 8%
        isHighlight,
        events,
      };
    });

    return {
      correlationMatrix,
      quarterlyData,
      eventTypes,
      marketIndicators,
    };
  }

  private generateMockIrEfficiencyLeaderboard() {
    const meetingTypes = [
      'One-on-One',
      'ConferenceCall',
      '화상미팅',
      '국내 NDR',
      '국내 Conference',
      '해외 NDR',
      '해외 Conference',
      'CEO 투어',
      'Lunch Meeting',
      'Dinner Meeting',
      '기타',
    ];

    const keywords = [
      '배당정책',
      'CET1 비율',
      'ESG',
      '주주환원',
      '법적리스크',
      '글로벌',
      '수익성',
      '성장성',
      'ROE 개선',
      'Northern Trust',
    ];

    // Generate meeting type efficiencies
    const meetingTypeEfficiencies = meetingTypes.map((meetingType) => ({
      meetingType,
      irei: Math.round((Math.random() * 1.5 + 0.5) * 100) / 100, // 0.5 to 2.0
      meetingCount: Math.floor(Math.random() * 1500) + 500, // 500-2000
    }));

    // Generate keyword efficiencies (top 3 have IREI, rest are null)
    const keywordEfficiencies = keywords.map((keyword, index) => ({
      rank: index + 1,
      keyword,
      irei: index < 3 ? Math.round((Math.random() * 1.5 + 0.8) * 100) / 100 : null, // Top 3: 0.8-2.3, Rest: null
    }));

    const currentIrei = 1.42;
    const averageIrei = 0.82;
    const irEfficiency = 32.21; // Percentage
    const comparedToAverage = 73; // Percentage

    return {
      currentIrei,
      averageIrei,
      irEfficiency,
      comparedToAverage,
      meetingTypeEfficiencies,
      keywordEfficiencies,
    };
  }
}
