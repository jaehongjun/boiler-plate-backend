import 'dotenv/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const postgres = require('postgres') as unknown as (
  cn: string,
  opts?: unknown,
) => import('postgres').Sql<Record<string, unknown>>;

/**
 * Legacy Data Migration Script
 *
 * IR Activity 테이블의 한글 값을 영어 키로 변경합니다.
 * - status: 예정 → SCHEDULED, 진행중 → IN_PROGRESS, etc.
 * - category: 내부 → INTERNAL, 외부 → EXTERNAL, etc.
 */

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      'DATABASE_URL is not set. Provide it in your environment or .env file.',
    );
    process.exit(1);
  }

  const client = postgres(url, { ssl: 'require', max: 5 });

  console.log('🔄 Starting Legacy Data Migration...\n');

  try {
    // Check current state before migration
    console.log('📊 Before Migration:');
    const beforeActivities = await client`
      SELECT status, category, COUNT(*) as count
      FROM ir_activities
      GROUP BY status, category
      ORDER BY status, category
    `;
    console.log('  ir_activities:', beforeActivities);

    const beforeSubActivities = await client`
      SELECT status, category, COUNT(*) as count
      FROM ir_sub_activities
      GROUP BY status, category
      ORDER BY status, category
    `;
    console.log('  ir_sub_activities:', beforeSubActivities);
    console.log('');

    // Migrate ir_activities - status
    console.log('🔄 Updating ir_activities.status...');
    const result1 = await client`
      UPDATE ir_activities
      SET status = CASE
        WHEN status = '예정' THEN 'SCHEDULED'
        WHEN status = '진행중' THEN 'IN_PROGRESS'
        WHEN status = '완료' THEN 'COMPLETED'
        WHEN status = '중단' THEN 'SUSPENDED'
        ELSE status
      END
      WHERE status IN ('예정', '진행중', '완료', '중단')
    `;
    console.log(`  ✅ Updated ${result1.count} rows`);

    // Migrate ir_activities - category
    console.log('🔄 Updating ir_activities.category...');
    const result2 = await client`
      UPDATE ir_activities
      SET category = CASE
        WHEN category = '내부' THEN 'INTERNAL'
        WHEN category = '외부' THEN 'EXTERNAL'
        WHEN category = '휴가' THEN 'VACATION'
        WHEN category = '공휴일' THEN 'HOLIDAY'
        ELSE category
      END
      WHERE category IN ('내부', '외부', '휴가', '공휴일')
    `;
    console.log(`  ✅ Updated ${result2.count} rows`);

    // Migrate ir_sub_activities - status
    console.log('🔄 Updating ir_sub_activities.status...');
    const result3 = await client`
      UPDATE ir_sub_activities
      SET status = CASE
        WHEN status = '예정' THEN 'SCHEDULED'
        WHEN status = '진행중' THEN 'IN_PROGRESS'
        WHEN status = '완료' THEN 'COMPLETED'
        WHEN status = '중단' THEN 'SUSPENDED'
        ELSE status
      END
      WHERE status IN ('예정', '진행중', '완료', '중단')
    `;
    console.log(`  ✅ Updated ${result3.count} rows`);

    // Migrate ir_sub_activities - category
    console.log('🔄 Updating ir_sub_activities.category...');
    const result4 = await client`
      UPDATE ir_sub_activities
      SET category = CASE
        WHEN category = '내부' THEN 'INTERNAL'
        WHEN category = '외부' THEN 'EXTERNAL'
        WHEN category = '휴가' THEN 'VACATION'
        WHEN category = '공휴일' THEN 'HOLIDAY'
        ELSE category
      END
      WHERE category IN ('내부', '외부', '휴가', '공휴일')
    `;
    console.log(`  ✅ Updated ${result4.count} rows`);

    console.log('');

    // Verify migration
    console.log('📊 After Migration:');
    const afterActivities = await client`
      SELECT status, category, COUNT(*) as count
      FROM ir_activities
      GROUP BY status, category
      ORDER BY status, category
    `;
    console.log('  ir_activities:', afterActivities);

    const afterSubActivities = await client`
      SELECT status, category, COUNT(*) as count
      FROM ir_sub_activities
      GROUP BY status, category
      ORDER BY status, category
    `;
    console.log('  ir_sub_activities:', afterSubActivities);

    console.log('');

    // Check for any remaining legacy values
    console.log('🔍 Checking for remaining legacy values...');
    const legacyCheck = await client`
      SELECT
        'ir_activities.status' as field,
        COUNT(*) as legacy_count
      FROM ir_activities
      WHERE status IN ('예정', '진행중', '완료', '중단')
      UNION ALL
      SELECT
        'ir_activities.category' as field,
        COUNT(*) as legacy_count
      FROM ir_activities
      WHERE category IN ('내부', '외부', '휴가', '공휴일')
      UNION ALL
      SELECT
        'ir_sub_activities.status' as field,
        COUNT(*) as legacy_count
      FROM ir_sub_activities
      WHERE status IN ('예정', '진행중', '완료', '중단')
      UNION ALL
      SELECT
        'ir_sub_activities.category' as field,
        COUNT(*) as legacy_count
      FROM ir_sub_activities
      WHERE category IN ('내부', '외부', '휴가', '공휴일')
    `;

    const hasLegacy = legacyCheck.some(
      (row: any) => Number(row.legacy_count) > 0,
    );

    if (hasLegacy) {
      console.log('  ⚠️  Warning: Legacy values still found:');
      legacyCheck.forEach((row: any) => {
        if (Number(row.legacy_count) > 0) {
          console.log(`    - ${row.field}: ${row.legacy_count} rows`);
        }
      });
    } else {
      console.log('  ✅ No legacy values found - migration successful!');
    }

    console.log('\n✅ Legacy Data Migration Completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
