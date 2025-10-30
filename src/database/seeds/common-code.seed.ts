import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const postgres = require('postgres') as unknown as (
  cn: string,
  opts?: unknown,
) => import('postgres').Sql<Record<string, unknown>>;

import { commonCodes, CODE_GROUPS } from '../schemas/common-code.schema';
import { eq } from 'drizzle-orm';

/**
 * Common Code Seed Data
 *
 * IR_ACTIVITY_CONSTANTS.md에 정의된 모든 상수를 공통코드 테이블에 삽입합니다.
 */
const COMMON_CODE_DATA = [
  // ==========================================
  // IR_ACTIVITY_STATUS (IR 활동 상태)
  // ==========================================
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_STATUS,
    codeKey: 'SCHEDULED',
    codeLabel: '예정',
    description: '예정된 활동 - 기본값, 아직 시작하지 않은 활동',
    displayOrder: 1,
    isActive: true,
  },
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_STATUS,
    codeKey: 'IN_PROGRESS',
    codeLabel: '진행중',
    description: '진행 중인 활동',
    displayOrder: 2,
    isActive: true,
  },
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_STATUS,
    codeKey: 'COMPLETED',
    codeLabel: '완료',
    description: '완료된 활동 - resolvedAt 타임스탬프 설정',
    displayOrder: 3,
    isActive: true,
  },
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_STATUS,
    codeKey: 'SUSPENDED',
    codeLabel: '중단',
    description: '중단된 활동 - 취소되거나 중단된 활동',
    displayOrder: 4,
    isActive: true,
  },

  // ==========================================
  // IR_ACTIVITY_CATEGORY (IR 활동 카테고리)
  // ==========================================
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_CATEGORY,
    codeKey: 'INTERNAL',
    codeLabel: '내부',
    description: '내부 활동',
    displayOrder: 1,
    isActive: true,
    extraData: JSON.stringify({ color: 'blue' }),
  },
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_CATEGORY,
    codeKey: 'EXTERNAL',
    codeLabel: '외부',
    description: '외부 활동 (IR, 미팅 등)',
    displayOrder: 2,
    isActive: true,
    extraData: JSON.stringify({ color: 'green' }),
  },
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_CATEGORY,
    codeKey: 'VACATION',
    codeLabel: '휴가',
    description: '휴가',
    displayOrder: 3,
    isActive: true,
    extraData: JSON.stringify({ color: 'orange' }),
  },
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_CATEGORY,
    codeKey: 'HOLIDAY',
    codeLabel: '공휴일',
    description: '공휴일',
    displayOrder: 4,
    isActive: true,
    extraData: JSON.stringify({ color: 'red' }),
  },

  // ==========================================
  // IR_ACTIVITY_TYPE_PRIMARY (IR 활동 유형 - 대분류)
  // ==========================================
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_TYPE_PRIMARY,
    codeKey: 'NDR',
    codeLabel: 'NDR',
    description: 'Non-Deal Roadshow',
    displayOrder: 1,
    isActive: true,
  },
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_TYPE_PRIMARY,
    codeKey: 'CONFERENCE_CALL',
    codeLabel: '컨퍼런스콜',
    description: 'Conference Call',
    displayOrder: 2,
    isActive: true,
  },
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_TYPE_PRIMARY,
    codeKey: 'SHAREHOLDERS_MEETING',
    codeLabel: '주주총회',
    description: 'Shareholders Meeting',
    displayOrder: 3,
    isActive: true,
  },
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_TYPE_PRIMARY,
    codeKey: 'EARNINGS_ANNOUNCEMENT',
    codeLabel: '실적발표',
    description: 'Earnings Announcement',
    displayOrder: 4,
    isActive: true,
  },
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_TYPE_PRIMARY,
    codeKey: 'OTHER',
    codeLabel: '기타',
    description: 'Other activities',
    displayOrder: 5,
    isActive: true,
  },

  // ==========================================
  // IR_ACTIVITY_TYPE_SECONDARY (IR 활동 유형 - 소분류)
  // ==========================================
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_TYPE_SECONDARY,
    codeKey: 'STRATEGY_MEETING',
    codeLabel: '전략회의',
    description: 'Strategy Meeting',
    displayOrder: 1,
    isActive: true,
  },
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_TYPE_SECONDARY,
    codeKey: 'ONE_ON_ONE',
    codeLabel: '1:1미팅',
    description: 'One-on-one Meeting',
    displayOrder: 2,
    isActive: true,
  },
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_TYPE_SECONDARY,
    codeKey: 'GROUP_MEETING',
    codeLabel: '그룹미팅',
    description: 'Group Meeting',
    displayOrder: 3,
    isActive: true,
  },
  {
    codeGroup: CODE_GROUPS.IR_ACTIVITY_TYPE_SECONDARY,
    codeKey: 'OTHER',
    codeLabel: '기타',
    description: 'Other meeting types',
    displayOrder: 4,
    isActive: true,
  },
];

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

  console.log('🌱 Starting Common Code Seed...');

  // Insert or update common codes
  let insertedCount = 0;
  let updatedCount = 0;

  for (const code of COMMON_CODE_DATA) {
    try {
      // Check if code already exists
      const existing = await db
        .select()
        .from(commonCodes)
        .where(eq(commonCodes.codeGroup, code.codeGroup))
        .then((rows) => rows.find((row) => row.codeKey === code.codeKey));

      if (existing) {
        // Update existing code
        await db
          .update(commonCodes)
          .set({
            codeLabel: code.codeLabel,
            description: code.description,
            displayOrder: code.displayOrder,
            isActive: code.isActive,
            extraData: code.extraData,
            updatedAt: new Date(),
          })
          .where(eq(commonCodes.codeGroup, code.codeGroup));

        updatedCount++;
        console.log(
          `  ✅ Updated: ${code.codeGroup}.${code.codeKey} = "${code.codeLabel}"`,
        );
      } else {
        // Insert new code
        await db.insert(commonCodes).values(code);
        insertedCount++;
        console.log(
          `  ✨ Inserted: ${code.codeGroup}.${code.codeKey} = "${code.codeLabel}"`,
        );
      }
    } catch (error) {
      console.error(
        `  ❌ Error processing ${code.codeGroup}.${code.codeKey}:`,
        error,
      );
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  - Total codes: ${COMMON_CODE_DATA.length}`);
  console.log(`  - Inserted: ${insertedCount}`);
  console.log(`  - Updated: ${updatedCount}`);
  console.log('✅ Common Code Seed Completed!');

  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
