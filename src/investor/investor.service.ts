import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, desc, sql, or, ilike, isNull } from 'drizzle-orm';
import {
  investors,
  investorSnapshots,
  investorHistories,
  countries,
} from '../database/schemas/investor.schema';
import { users } from '../database/schemas/users';
import {
  QueryInvestorsTableDto,
  QueryInvestorHistoryDto,
  QueryInvestorDetailDto,
  QueryTopInvestorsDto,
  UpdateInvestorDto,
  UpdateInvestorSnapshotDto,
} from './dto';
import {
  InvestorTableResponse,
  InvestorDetailResponse,
  InvestorHistoryResponse,
  FiltersResponse,
  PeriodsResponse,
  SummaryMetricsResponse,
  TopInvestorsResponse,
  InvestorTableRow,
} from './types/investor.types';
import { createSnapshotDiff } from '../database/utils/investor-history-diff';

@Injectable()
export class InvestorService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase<any>,
  ) {}

  /**
   * GET /api/investors/table
   * Get investors table view (grouped by parent/children)
   * OPTIMIZED: Eliminates N+1 queries, uses SQL-level pagination
   */
  async getInvestorsTable(
    query: QueryInvestorsTableDto,
  ): Promise<InvestorTableResponse> {
    const { year, quarter, includeChildren, page, pageSize } = query;

    // Build WHERE conditions
    const conditions: any[] = [
      eq(investorSnapshots.year, year),
      eq(investorSnapshots.quarter, quarter),
    ];

    // Additional filters
    if (query.country) {
      conditions.push(eq(investors.countryCode, query.country));
    }
    if (query.orientation) {
      conditions.push(eq(investorSnapshots.orientation, query.orientation));
    }
    if (query.turnover) {
      conditions.push(eq(investorSnapshots.turnover, query.turnover));
    }
    if (query.investorType) {
      conditions.push(eq(investorSnapshots.investorType, query.investorType));
    }
    if (query.styleTag) {
      conditions.push(eq(investorSnapshots.styleTag, query.styleTag));
    }
    if (query.search) {
      conditions.push(
        or(
          ilike(investors.name, `%${query.search}%`),
          ilike(investors.city, `%${query.search}%`),
        ) as any,
      );
    }

    // Step 1: Get parent IDs with pagination (SQL LIMIT/OFFSET)
    const parentIdsQuery = this.db
      .select({
        id: investors.id,
        groupRank: investorSnapshots.groupRank,
      })
      .from(investors)
      .innerJoin(
        investorSnapshots,
        eq(investors.id, investorSnapshots.investorId),
      )
      .where(
        and(
          ...conditions,
          eq(investors.isGroupRepresentative, true),
        ),
      )
      .orderBy(
        query.order === 'desc'
          ? desc(investorSnapshots.groupRank)
          : investorSnapshots.groupRank,
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const parentIds = await parentIdsQuery;

    if (parentIds.length === 0) {
      return {
        period: { year, quarter },
        page,
        pageSize,
        total: 0,
        rows: [],
      };
    }

    const parentIdList = parentIds.map((p) => p.id);

    // Step 2: Fetch all parent + children data in ONE query
    const allInvestorsData = await this.db
      .select({
        investorId: investors.id,
        name: investors.name,
        countryCode: investors.countryCode,
        city: investors.city,
        parentId: investors.parentId,
        isGroupRep: investors.isGroupRepresentative,
        countryNameKo: countries.nameKo,
        countryNameEn: countries.nameEn,
        snapshotId: investorSnapshots.id,
        groupRank: investorSnapshots.groupRank,
        groupChildCount: investorSnapshots.groupChildCount,
        sOverO: investorSnapshots.sOverO,
        ord: investorSnapshots.ord,
        adr: investorSnapshots.adr,
        investorType: investorSnapshots.investorType,
        styleTag: investorSnapshots.styleTag,
        styleNote: investorSnapshots.styleNote,
        turnover: investorSnapshots.turnover,
        orientation: investorSnapshots.orientation,
        lastActivityAt: investorSnapshots.lastActivityAt,
      })
      .from(investors)
      .innerJoin(
        investorSnapshots,
        eq(investors.id, investorSnapshots.investorId),
      )
      .leftJoin(countries, eq(investors.countryCode, countries.code))
      .where(
        and(
          eq(investorSnapshots.year, year),
          eq(investorSnapshots.quarter, quarter),
          or(
            // Parent investors
            sql`${investors.id} IN (${sql.join(parentIdList.map((id) => sql`${id}`), sql`, `)})`,
            // OR children of these parents
            includeChildren
              ? sql`${investors.parentId} IN (${sql.join(parentIdList.map((id) => sql`${id}`), sql`, `)})`
              : sql`false`,
          ) as any,
        ),
      );

    // Step 3: Group in-memory (fast, already fetched)
    const parentMap = new Map<number, any>();
    const childrenMap = new Map<number, any[]>();

    for (const row of allInvestorsData) {
      const investor = {
        id: row.investorId,
        name: row.name,
        country: {
          code: row.countryCode,
          name: row.countryNameKo || row.countryNameEn || '-',
          city: row.city || undefined,
        },
      };

      const metrics = {
        sOverO: row.sOverO,
        ord: row.ord,
        adr: row.adr,
        investorType: row.investorType,
        style: {
          tag: row.styleTag,
          note: row.styleNote,
        },
        turnover: row.turnover,
        orientation: row.orientation,
        lastActivityAt: row.lastActivityAt?.toISOString() || null,
      };

      if (row.isGroupRep) {
        // Parent
        parentMap.set(row.investorId, {
          rowType: 'PARENT' as const,
          group: {
            rank: row.groupRank,
            childCount: row.groupChildCount,
          },
          investor,
          metrics,
        });
      } else {
        // Child
        const parentId = row.parentId!;
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, []);
        }
        childrenMap.get(parentId)!.push({
          rowType: 'CHILD' as const,
          parentId,
          investor,
          metrics,
        });
      }
    }

    // Step 4: Build final rows array (parents sorted by their rank)
    const rows: InvestorTableRow[] = [];

    // Sort parents by their original rank order
    const sortedParents = Array.from(parentMap.entries()).sort((a, b) => {
      const rankA = a[1].group.rank || 9999;
      const rankB = b[1].group.rank || 9999;
      return query.order === 'desc' ? rankB - rankA : rankA - rankB;
    });

    for (const [parentId, parentRow] of sortedParents) {
      rows.push(parentRow);

      // Add children
      const children = childrenMap.get(parentId) || [];
      rows.push(...children);
    }

    // Get total count of parents (for pagination)
    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(investors)
      .innerJoin(
        investorSnapshots,
        eq(investors.id, investorSnapshots.investorId),
      )
      .where(
        and(
          ...conditions,
          eq(investors.isGroupRepresentative, true),
        ),
      );

    const total = totalCountResult[0]?.count || 0;

    return {
      period: { year, quarter },
      page,
      pageSize,
      total,
      rows,
    };
  }

  /**
   * GET /api/investors/:id
   * Get single investor detail with snapshot
   */
  async getInvestorDetail(
    id: number,
    query: QueryInvestorDetailDto,
  ): Promise<InvestorDetailResponse> {
    const { year, quarter } = query;

    const investor = await (this.db.query as any).investors.findFirst({
      where: eq(investors.id, id),
    });

    if (!investor) {
      throw new NotFoundException(`Investor with ID ${id} not found`);
    }

    // Get snapshot for the period
    const snapshot = await (this.db.query as any).investorSnapshots.findFirst({
      where: and(
        eq(investorSnapshots.investorId, id),
        eq(investorSnapshots.year, year),
        eq(investorSnapshots.quarter, quarter),
      ),
    });

    return {
      investor: {
        id: investor.id,
        name: investor.name,
        country: investor.countryCode,
        city: investor.city,
        parentId: investor.parentId,
        isGroupRepresentative: investor.isGroupRepresentative,
      },
      snapshot: snapshot
        ? {
            year: snapshot.year,
            quarter: snapshot.quarter,
            groupRank: snapshot.groupRank,
            childCount: snapshot.groupChildCount,
            sOverO: snapshot.sOverO,
            ord: snapshot.ord,
            adr: snapshot.adr,
            investorType: snapshot.investorType,
            style: {
              tag: snapshot.styleTag,
              note: snapshot.styleNote,
            },
            turnover: snapshot.turnover,
            orientation: snapshot.orientation,
            lastActivityAt: snapshot.lastActivityAt?.toISOString() || null,
          }
        : null,
    };
  }

  /**
   * GET /api/investors/:id/history
   * Get investor change history
   */
  async getInvestorHistory(
    id: number,
    query: QueryInvestorHistoryDto,
  ): Promise<InvestorHistoryResponse> {
    const { year, quarter, page, pageSize } = query;

    const conditions = [eq(investorHistories.investorId, id)];

    if (year) conditions.push(eq(investorHistories.year, year));
    if (quarter) conditions.push(eq(investorHistories.quarter, quarter));

    const histories = await this.db
      .select({
        id: investorHistories.id,
        occurredAt: investorHistories.occurredAt,
        year: investorHistories.year,
        quarter: investorHistories.quarter,
        changes: investorHistories.changes,
        updatedBy: investorHistories.updatedBy,
        // User info
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
      })
      .from(investorHistories)
      .leftJoin(users, eq(investorHistories.updatedBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(investorHistories.occurredAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const total = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(investorHistories)
      .where(and(...conditions))
      .then((rows) => rows[0]?.count || 0);

    return {
      investorId: id,
      history: histories.map((h) => ({
        occurredAt: h.occurredAt.toISOString(),
        year: h.year,
        quarter: h.quarter,
        updatedBy: h.updatedBy
          ? {
              id: h.userId!,
              name: h.userName!,
              email: h.userEmail!,
            }
          : null,
        changes: (h.changes as any) || {},
      })),
      page,
      pageSize,
      total,
    };
  }

  /**
   * GET /api/filters/periods
   * Get available periods (year/quarter combinations)
   */
  async getAvailablePeriods(): Promise<PeriodsResponse> {
    const periods = await this.db
      .selectDistinct({
        year: investorSnapshots.year,
        quarter: investorSnapshots.quarter,
      })
      .from(investorSnapshots)
      .orderBy(
        desc(investorSnapshots.year),
        desc(investorSnapshots.quarter),
      );

    return { periods };
  }

  /**
   * GET /api/filters/dictionaries
   * Get filter dictionaries (countries, types, etc.)
   */
  async getFilterDictionaries(): Promise<FiltersResponse> {
    const countriesData = await this.db
      .select({
        code: countries.code,
        name: countries.nameKo,
      })
      .from(countries)
      .orderBy(countries.nameKo);

    return {
      countries: countriesData,
      investorTypes: [
        'INVESTMENT_ADVISOR',
        'HEDGE_FUND',
        'PENSION',
        'SOVEREIGN',
        'MUTUAL_FUND',
        'ETF',
        'BANK',
        'INSURANCE',
        'OTHER',
      ],
      styleTags: [
        'POSITIVE',
        'NEUTRAL',
        'NEGATIVE',
        'QUESTION_HEAVY',
        'PICKY',
        'OTHER',
      ],
      turnovers: ['LOW', 'MEDIUM', 'HIGH'],
      orientations: ['ACTIVE', 'INACTIVE'],
    };
  }

  /**
   * GET /api/metrics/summary
   * Get summary metrics for a period
   */
  async getSummaryMetrics(
    year: number,
    quarter: number,
  ): Promise<SummaryMetricsResponse> {
    // Total investors with snapshots in this period
    const total = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(investorSnapshots)
      .where(
        and(
          eq(investorSnapshots.year, year),
          eq(investorSnapshots.quarter, quarter),
        ),
      )
      .then((rows) => rows[0]?.count || 0);

    // Parents count
    const parentsCount = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(investors)
      .innerJoin(
        investorSnapshots,
        eq(investors.id, investorSnapshots.investorId),
      )
      .where(
        and(
          eq(investors.isGroupRepresentative, true),
          eq(investorSnapshots.year, year),
          eq(investorSnapshots.quarter, quarter),
        ),
      )
      .then((rows) => rows[0]?.count || 0);

    // Active count
    const activeCount = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(investorSnapshots)
      .where(
        and(
          eq(investorSnapshots.year, year),
          eq(investorSnapshots.quarter, quarter),
          eq(investorSnapshots.orientation, 'ACTIVE'),
        ),
      )
      .then((rows) => rows[0]?.count || 0);

    // Turnover distribution
    const turnoverDist = await this.db
      .select({
        turnover: investorSnapshots.turnover,
        count: sql<number>`count(*)::int`,
      })
      .from(investorSnapshots)
      .where(
        and(
          eq(investorSnapshots.year, year),
          eq(investorSnapshots.quarter, quarter),
        ),
      )
      .groupBy(investorSnapshots.turnover);

    const turnoverMap = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    for (const item of turnoverDist) {
      if (item.turnover === 'LOW') turnoverMap.LOW = item.count;
      if (item.turnover === 'MEDIUM') turnoverMap.MEDIUM = item.count;
      if (item.turnover === 'HIGH') turnoverMap.HIGH = item.count;
    }

    return {
      totalInvestors: total,
      parents: parentsCount,
      children: total - parentsCount,
      activeRate: total > 0 ? activeCount / total : 0,
      turnoverDist: turnoverMap,
    };
  }

  /**
   * GET /api/investors/top
   * Get top N investors by rank
   */
  async getTopInvestors(
    query: QueryTopInvestorsDto,
  ): Promise<TopInvestorsResponse> {
    const { year, quarter, topN } = query;

    const topInvestors = await this.db
      .select({
        investorId: investors.id,
        name: investors.name,
        countryCode: investors.countryCode,
        city: investors.city,
        groupRank: investorSnapshots.groupRank,
        groupChildCount: investorSnapshots.groupChildCount,
        orientation: investorSnapshots.orientation,
      })
      .from(investors)
      .innerJoin(
        investorSnapshots,
        eq(investors.id, investorSnapshots.investorId),
      )
      .where(
        and(
          eq(investors.isGroupRepresentative, true),
          eq(investorSnapshots.year, year),
          eq(investorSnapshots.quarter, quarter),
        ),
      )
      .orderBy(investorSnapshots.groupRank)
      .limit(topN);

    return {
      topN,
      investors: topInvestors,
    };
  }

  /**
   * PATCH /api/investors/:id
   * Update investor basic info
   */
  async updateInvestor(
    id: number,
    updateDto: UpdateInvestorDto,
    userId: string,
  ): Promise<InvestorDetailResponse> {
    const existing = await (this.db.query as any).investors.findFirst({
      where: eq(investors.id, id),
    });

    if (!existing) {
      throw new NotFoundException(`Investor with ID ${id} not found`);
    }

    const updateData: any = { updatedAt: new Date() };
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.countryCode !== undefined)
      updateData.countryCode = updateDto.countryCode;
    if (updateDto.city !== undefined) updateData.city = updateDto.city;
    if (updateDto.parentId !== undefined)
      updateData.parentId = updateDto.parentId;
    if (updateDto.isGroupRepresentative !== undefined)
      updateData.isGroupRepresentative = updateDto.isGroupRepresentative;

    await this.db.update(investors).set(updateData).where(eq(investors.id, id));

    // Return updated detail (need to pass year/quarter, use latest)
    const latestPeriod = await this.db
      .select({
        year: investorSnapshots.year,
        quarter: investorSnapshots.quarter,
      })
      .from(investorSnapshots)
      .where(eq(investorSnapshots.investorId, id))
      .orderBy(
        desc(investorSnapshots.year),
        desc(investorSnapshots.quarter),
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!latestPeriod) {
      // No snapshot exists, return basic info only
      return this.getInvestorDetail(id, { year: 2024, quarter: 1 });
    }

    return this.getInvestorDetail(id, latestPeriod);
  }

  /**
   * PATCH /api/investors/:id/snapshot
   * Update investor snapshot (creates history record)
   */
  async updateInvestorSnapshot(
    id: number,
    updateDto: UpdateInvestorSnapshotDto,
    userId: string,
  ): Promise<InvestorDetailResponse> {
    const { year, quarter, ...snapshotUpdates } = updateDto;

    // Get existing snapshot
    const existingSnapshot = await (this.db.query as any).investorSnapshots.findFirst({
      where: and(
        eq(investorSnapshots.investorId, id),
        eq(investorSnapshots.year, year),
        eq(investorSnapshots.quarter, quarter),
      ),
    });

    if (!existingSnapshot) {
      throw new NotFoundException(
        `Snapshot not found for investor ${id} in ${year} Q${quarter}`,
      );
    }

    // Create diff
    const diff = createSnapshotDiff(existingSnapshot, snapshotUpdates as any);

    // If no changes, skip
    if (Object.keys(diff).length === 0) {
      return this.getInvestorDetail(id, { year, quarter });
    }

    // Update snapshot
    const updateData: any = {};
    if (snapshotUpdates.groupRank !== undefined)
      updateData.groupRank = snapshotUpdates.groupRank;
    if (snapshotUpdates.groupChildCount !== undefined)
      updateData.groupChildCount = snapshotUpdates.groupChildCount;
    if (snapshotUpdates.sOverO !== undefined)
      updateData.sOverO = snapshotUpdates.sOverO;
    if (snapshotUpdates.ord !== undefined)
      updateData.ord = snapshotUpdates.ord;
    if (snapshotUpdates.adr !== undefined)
      updateData.adr = snapshotUpdates.adr;
    if (snapshotUpdates.investorType !== undefined)
      updateData.investorType = snapshotUpdates.investorType;
    if (snapshotUpdates.styleTag !== undefined)
      updateData.styleTag = snapshotUpdates.styleTag;
    if (snapshotUpdates.styleNote !== undefined)
      updateData.styleNote = snapshotUpdates.styleNote;
    if (snapshotUpdates.turnover !== undefined)
      updateData.turnover = snapshotUpdates.turnover;
    if (snapshotUpdates.orientation !== undefined)
      updateData.orientation = snapshotUpdates.orientation;
    if (snapshotUpdates.lastActivityAt !== undefined)
      updateData.lastActivityAt = new Date(snapshotUpdates.lastActivityAt!);

    await this.db
      .update(investorSnapshots)
      .set(updateData)
      .where(eq(investorSnapshots.id, existingSnapshot.id));

    // Create history record
    await this.db.insert(investorHistories).values({
      investorId: id,
      year,
      quarter,
      updatedBy: userId,
      changes: diff as any,
    });

    return this.getInvestorDetail(id, { year, quarter });
  }
}
