/**
 * Investor 도메인 조회 쿼리 패턴 모음
 *
 * 사용 예시:
 * - 연도/분기별 그룹 정렬
 * - 대표+자회사 조인
 * - 순위별 필터링
 */

import { desc, eq, and, isNull, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  investors,
  investorSnapshots,
  countries,
} from '../schemas/investor.schema';

export type DB = PostgresJsDatabase<any>;

// ==================== 1. 연도/분기별 투자자 목록 (그룹 대표 + 자회사) ====================
/**
 * UI 테이블 렌더링용 쿼리
 * - 그룹 대표 먼저 (groupRank 정렬)
 * - 각 대표 밑에 자회사들 (parentId로 묶음)
 *
 * @returns 대표 행들의 배열, 각 행은 children 필드에 자회사 배열 포함
 */
export async function getInvestorsByPeriod(
  db: DB,
  year: number,
  quarter: number,
) {
  // Step 1: 대표 투자자들 조회 (groupRank 정렬)
  const parentInvestors = await db
    .select({
      investorId: investors.id,
      name: investors.name,
      countryCode: investors.countryCode,
      city: investors.city,
      countryNameKo: countries.nameKo,
      countryNameEn: countries.nameEn,
      // 스냅샷 데이터
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
        eq(investors.isGroupRepresentative, true),
        eq(investorSnapshots.year, year),
        eq(investorSnapshots.quarter, quarter),
      ),
    )
    .orderBy(desc(investorSnapshots.groupRank));

  // Step 2: 각 대표의 자회사들 조회
  const result: any[] = [];
  for (const parent of parentInvestors) {
    const children = await db
      .select({
        investorId: investors.id,
        name: investors.name,
        countryCode: investors.countryCode,
        city: investors.city,
        countryNameKo: countries.nameKo,
        countryNameEn: countries.nameEn,
        // 스냅샷 데이터
        snapshotId: investorSnapshots.id,
        groupRank: investorSnapshots.groupRank,
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
          eq(investors.parentId, parent.investorId),
          eq(investorSnapshots.year, year),
          eq(investorSnapshots.quarter, quarter),
        ),
      );

    result.push({
      ...parent,
      children,
    });
  }

  return result;
}

// ==================== 2. 단일 투자자 상세 (과거 스냅샷 포함) ====================
/**
 * 특정 투자자의 전체 스냅샷 히스토리 조회
 */
export async function getInvestorWithSnapshots(db: DB, investorId: number) {
  const investor = await (db.query as any).investors.findFirst({
    where: eq(investors.id, investorId),
    with: {
      country: true,
      parent: true,
      children: true,
      snapshots: {
        orderBy: [
          desc(investorSnapshots.year),
          desc(investorSnapshots.quarter),
        ],
      },
    },
  });

  return investor;
}

// ==================== 3. 히스토리 조회 (담당자 포함) ====================
/**
 * 특정 투자자의 변경 히스토리 조회 (담당자 정보 포함)
 */
export async function getInvestorHistories(
  db: DB,
  investorId: number,
  limit = 50,
) {
  const histories = await (db.query as any).investorHistories.findMany({
    where: eq(investors.id, investorId),
    with: {
      updater: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: (histories, { desc }) => [desc(histories.occurredAt)],
    limit,
  });

  return histories;
}

// ==================== 4. Top N 투자자 (순위별) ====================
/**
 * 특정 연도/분기의 상위 N개 투자자 그룹
 */
export async function getTopInvestors(
  db: DB,
  year: number,
  quarter: number,
  topN = 10,
) {
  const topInvestors = await db
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

  return topInvestors;
}

// ==================== 5. 통계: 분기별 투자자 타입 분포 ====================
/**
 * 특정 분기의 투자자 타입별 카운트
 */
export async function getInvestorTypeDistribution(
  db: DB,
  year: number,
  quarter: number,
) {
  const distribution = await db
    .select({
      investorType: investorSnapshots.investorType,
      count: sql<number>`count(*)::int`,
    })
    .from(investorSnapshots)
    .where(
      and(
        eq(investorSnapshots.year, year),
        eq(investorSnapshots.quarter, quarter),
      ),
    )
    .groupBy(investorSnapshots.investorType);

  return distribution;
}

// ==================== 6. 검색: 이름/국가 필터링 ====================
/**
 * 투자자명 또는 국가로 검색 (LIKE)
 */
export async function searchInvestors(
  db: DB,
  searchTerm: string,
  year?: number,
  quarter?: number,
) {
  const conditions = [sql`${investors.name} ILIKE ${`%${searchTerm}%`}`];

  if (year && quarter) {
    conditions.push(eq(investorSnapshots.year, year));
    conditions.push(eq(investorSnapshots.quarter, quarter));
  }

  const results = await db
    .select({
      investorId: investors.id,
      name: investors.name,
      countryCode: investors.countryCode,
      city: investors.city,
      groupRank: investorSnapshots.groupRank,
    })
    .from(investors)
    .leftJoin(investorSnapshots, eq(investors.id, investorSnapshots.investorId))
    .where(and(...conditions))
    .limit(100);

  return results;
}
