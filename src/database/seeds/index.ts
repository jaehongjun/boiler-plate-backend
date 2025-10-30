import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const postgres = require('postgres') as unknown as (
  cn: string,
  opts?: unknown,
) => import('postgres').Sql<Record<string, unknown>>;

import {
  irActivities,
  irSubActivities,
  irActivityKeywords,
  irActivityVisitors,
  // irActivityLogs, // Currently unused, kept for future use
} from '../../database/schemas/ir.schema';
import { inArray } from 'drizzle-orm';

// function generateId(prefix: string): string {
//   const timestamp = Date.now();
//   const random = Math.random().toString(36).substring(2, 9);
//   return `${prefix}-${timestamp}-${random}`;
// }

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      'DATABASE_URL is not set. Provide it in your environment or .env file.',
    );
    process.exit(1);
  }

  const client = postgres(url, { ssl: 'require', max: 5 });
  const db = drizzle(client);

  // Define deterministic sample IDs to make seeding idempotent
  const ACT1 = 'act-sample-001';
  const ACT2 = 'act-sample-002';

  // Clean up previous sample data (cascade will remove children)
  await db.delete(irActivities).where(inArray(irActivities.id, [ACT1, ACT2]));

  // Insert sample activities
  await db.insert(irActivities).values([
    {
      id: ACT1,
      title: '정기 IR 미팅',
      startDatetime: new Date('2025-10-22T01:00:00Z'),
      endDatetime: new Date('2025-10-24T09:00:00Z'),
      status: 'SCHEDULED',
      allDay: false,
      category: 'EXTERNAL',
      location: '서울 본사 회의실',
      description: '분기 실적 발표 및 투자자 미팅',
      typePrimary: 'NDR',
      typeSecondary: 'STRATEGY_MEETING',
      memo: '주요 논의사항: Q3 실적, 향후 전략',
    },
    {
      id: ACT2,
      title: '투자 브리핑',
      startDatetime: new Date('2025-10-23T02:00:00Z'),
      endDatetime: new Date('2025-10-23T05:00:00Z'),
      status: 'SCHEDULED',
      allDay: false,
      category: 'EXTERNAL',
      location: '여의도 금융센터',
      description: '주요 투자 브리핑 세션',
      typePrimary: 'CONFERENCE_CALL',
      typeSecondary: 'GROUP_MEETING',
    },
  ]);

  // Sub-activities for ACT1
  await db.insert(irSubActivities).values([
    {
      id: 'sub-sample-001-1',
      parentActivityId: ACT1,
      title: 'Morgan Capital 미팅',
      status: 'SCHEDULED',
      displayOrder: 0,
    },
    {
      id: 'sub-sample-001-2',
      parentActivityId: ACT1,
      title: '투자 계약서 검토',
      status: 'SCHEDULED',
      displayOrder: 1,
    },
  ]);

  // Visitors
  await db.insert(irActivityVisitors).values([
    {
      activityId: ACT1,
      visitorName: 'ABC투자사',
      visitorType: 'investor',
      company: 'ABC Capital',
    },
    {
      activityId: ACT1,
      visitorName: 'Morgan Capital',
      visitorType: 'broker',
      company: 'Morgan Securities',
    },
    {
      activityId: ACT2,
      visitorName: 'DEF펀드',
      visitorType: 'investor',
      company: 'DEF Asset',
    },
  ]);

  // Keywords
  await db.insert(irActivityKeywords).values([
    { activityId: ACT1, keyword: '정기미팅', displayOrder: 0 },
    { activityId: ACT1, keyword: '실적발표', displayOrder: 1 },
    { activityId: ACT1, keyword: '투자전략', displayOrder: 2 },
  ]);

  // Initial logs (skip - requires valid user)
  // await db.insert(irActivityLogs).values([
  //   {
  //     id: generateId('log'),
  //     activityId: ACT1,
  //     logType: 'create',
  //     userId: '00000000-0000-0000-0000-000000000000',
  //     userName: '시스템',
  //     message: '활동 생성: 정기 IR 미팅',
  //   },
  // ]);

  console.log('✅ Seeded sample IR activities:', [ACT1, ACT2]);

  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
