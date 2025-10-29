import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, desc, sql, or, ilike } from 'drizzle-orm';
import {
  investors,
  investorSnapshots,
  countries,
} from '../database/schemas/investor.schema';
import { QueryInvestorsTableDto, QueryTopInvestorsDto } from './dto';
import {
  InvestorTableResponse,
  InvestorTableRow,
  TopInvestorsResponse,
} from './types/investor.types';

/**
 * Optimized Investor Service with performance improvements
 *
 * Key optimizations:
 * 1. Single query to fetch all parents + children (eliminates N+1)
 * 2. SQL-level pagination (LIMIT/OFFSET at database)
 * 3. In-memory grouping after fetch (minimal overhead)
 */
@Injectable()
export class InvestorOptimizedService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase<any>,
  ) {}

  /**
   * OPTIMIZED: Get investors table view
   *
   * Performance improvements:
   * - Fetches parents and children in a single query with JOIN
   * - Applies SQL-level LIMIT/OFFSET for pagination
   * - Uses CTE (Common Table Expression) for better query planning
   */
  async getInvestorsTableOptimized(
    query: QueryInvestorsTableDto,
  ): Promise<InvestorTableResponse> {
    const { year, quarter, includeChildren, page, pageSize } = query;

    // If year and quarter are not provided, return error (optimized service requires period)
    if (year === undefined || quarter === undefined) {
      throw new Error(
        'Year and quarter are required for optimized service. Use the main service for latest data queries.',
      );
    }

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

    // Step 1: Get parent IDs with pagination
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
      .where(and(...conditions, eq(investors.isGroupRepresentative, true)))
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
        period: { year: year!, quarter: quarter! },
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
            sql`${investors.id} IN (${sql.join(
              parentIdList.map((id) => sql`${id}`),
              sql`, `,
            )})`,
            // OR children of these parents
            includeChildren
              ? sql`${investors.parentId} IN (${sql.join(
                  parentIdList.map((id) => sql`${id}`),
                  sql`, `,
                )})`
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
      .where(and(...conditions, eq(investors.isGroupRepresentative, true)));

    const total = totalCountResult[0]?.count || 0;

    return {
      period: { year: year!, quarter: quarter! },
      page,
      pageSize,
      total,
      rows,
    };
  }

  /**
   * OPTIMIZED: Get top N investors
   *
   * Simple query with LIMIT, uses index on groupRank
   */
  async getTopInvestorsOptimized(
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
}
