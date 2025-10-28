/**
 * Investor 스냅샷 변경 히스토리 Diff 생성 유틸
 *
 * 사용 시나리오:
 * - 스냅샷 업데이트 시 이전/현재 값 비교
 * - 자동으로 investorHistories 테이블에 diff 기록
 */

import type { InvestorSnapshot } from '../schemas/investor.schema';

type SnapshotDiff = Partial<{
  sOverO: [number | null, number | null];
  ord: [number | null, number | null];
  adr: [number | null, number | null];
  investorType: [string | null, string | null];
  styleTag: [string | null, string | null];
  styleNote: [string | null, string | null];
  turnover: [string | null, string | null];
  orientation: [string | null, string | null];
  lastActivityAt: [string | null, string | null]; // ISO string
  groupRank: [number | null, number | null];
  groupChildCount: [number | null, number | null];
}>;

/**
 * 두 스냅샷을 비교해서 변경점만 추출
 *
 * @param oldSnapshot 이전 스냅샷 (없으면 null)
 * @param newSnapshot 새로운 스냅샷
 * @returns 변경된 필드들의 [이전값, 새값] 맵 (변경 없으면 빈 객체)
 */
export function createSnapshotDiff(
  oldSnapshot: InvestorSnapshot | null,
  newSnapshot: Partial<InvestorSnapshot>,
): SnapshotDiff {
  const diff: SnapshotDiff = {};

  // 비교할 필드 목록
  const fieldsToCompare: (keyof SnapshotDiff)[] = [
    'sOverO',
    'ord',
    'adr',
    'investorType',
    'styleTag',
    'styleNote',
    'turnover',
    'orientation',
    'groupRank',
    'groupChildCount',
  ];

  for (const field of fieldsToCompare) {
    const oldValue = oldSnapshot?.[field] ?? null;
    const newValue = newSnapshot[field] ?? null;

    // 값이 다르면 diff에 추가
    if (oldValue !== newValue) {
      // @ts-expect-error - dynamic field assignment
      diff[field] = [oldValue, newValue];
    }
  }

  // lastActivityAt은 Date → ISO string 변환
  if (
    oldSnapshot?.lastActivityAt?.getTime() !==
    newSnapshot.lastActivityAt?.getTime()
  ) {
    diff.lastActivityAt = [
      oldSnapshot?.lastActivityAt?.toISOString() ?? null,
      newSnapshot.lastActivityAt?.toISOString() ?? null,
    ];
  }

  return diff;
}

/**
 * Diff를 사람이 읽을 수 있는 텍스트로 변환
 *
 * @param diff createSnapshotDiff의 결과
 * @returns 변경점 요약 메시지 배열
 */
export function formatDiffMessage(diff: SnapshotDiff): string[] {
  const messages: string[] = [];

  const fieldLabels: Record<keyof SnapshotDiff, string> = {
    sOverO: 'S/O',
    ord: 'ORD',
    adr: 'ADR',
    investorType: '투자자 타입',
    styleTag: '스타일 태그',
    styleNote: '스타일 메모',
    turnover: 'Turnover',
    orientation: 'Orientation',
    lastActivityAt: '마지막 활동일자',
    groupRank: '그룹 순위',
    groupChildCount: '자회사 수',
  };

  for (const [field, [oldVal, newVal]] of Object.entries(diff)) {
    const label = fieldLabels[field as keyof SnapshotDiff] || field;
    messages.push(`${label}: ${oldVal ?? '(없음)'} → ${newVal ?? '(없음)'}`);
  }

  return messages;
}

/**
 * 예시: 스냅샷 업데이트 + 히스토리 기록
 *
 * ```ts
 * import { db } from './database';
 * import { investorSnapshots, investorHistories } from './schemas/investor.schema';
 * import { createSnapshotDiff } from './utils/investor-history-diff';
 * import { eq, and } from 'drizzle-orm';
 *
 * async function updateSnapshot(
 *   investorId: number,
 *   year: number,
 *   quarter: number,
 *   updates: Partial<InvestorSnapshot>,
 *   userId: string,
 * ) {
 *   // 1. 기존 스냅샷 조회
 *   const [oldSnapshot] = await db
 *     .select()
 *     .from(investorSnapshots)
 *     .where(
 *       and(
 *         eq(investorSnapshots.investorId, investorId),
 *         eq(investorSnapshots.year, year),
 *         eq(investorSnapshots.quarter, quarter),
 *       ),
 *     )
 *     .limit(1);
 *
 *   // 2. Diff 생성
 *   const diff = createSnapshotDiff(oldSnapshot ?? null, updates);
 *
 *   // 변경 없으면 종료
 *   if (Object.keys(diff).length === 0) {
 *     console.log('변경사항 없음');
 *     return;
 *   }
 *
 *   // 3. 스냅샷 업데이트 (upsert)
 *   await db
 *     .insert(investorSnapshots)
 *     .values({
 *       investorId,
 *       year,
 *       quarter,
 *       ...updates,
 *     })
 *     .onConflictDoUpdate({
 *       target: [
 *         investorSnapshots.investorId,
 *         investorSnapshots.year,
 *         investorSnapshots.quarter,
 *       ],
 *       set: updates,
 *     });
 *
 *   // 4. 히스토리 기록
 *   await db.insert(investorHistories).values({
 *     investorId,
 *     year,
 *     quarter,
 *     updatedBy: userId,
 *     changes: diff,
 *   });
 *
 *   console.log('✅ 스냅샷 업데이트 + 히스토리 기록 완료');
 * }
 * ```
 */
