import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const postgres = require('postgres') as unknown as (
  cn: string,
  opts?: unknown,
) => import('postgres').Sql<Record<string, unknown>>;

import {
  countries,
  investors,
  investorSnapshots,
  investorMeetings,
  investorInterests,
  investorActivities,
  investorCommunications,
} from '../schemas/investor.schema';
import { inArray } from 'drizzle-orm';

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

  console.log('🌱 Seeding Investor data...');

  // ==================== 1. Countries ====================
  const countryCodes = ['JP', 'HK', 'MU', 'NL', 'US'];
  await db
    .delete(countries)
    .where(inArray(countries.code, countryCodes))
    .execute();

  await db.insert(countries).values([
    { code: 'JP', nameKo: '일본', nameEn: 'Japan' },
    { code: 'HK', nameKo: '홍콩', nameEn: 'Hong Kong' },
    { code: 'MU', nameKo: '모리셔스', nameEn: 'Mauritius' },
    { code: 'NL', nameKo: '네덜란드', nameEn: 'Netherlands' },
    { code: 'US', nameKo: '미국', nameEn: 'United States' },
  ]);

  console.log('✅ Countries seeded');

  // ==================== 2. Investors (Parent/Child) ====================
  // 기존 샘플 데이터 정리 (cascade로 스냅샷/히스토리도 삭제됨)
  await db.delete(investors).execute();

  // BlackRock 그룹
  const [blackrockParent] = await db
    .insert(investors)
    .values({
      name: 'BlackRock Investment',
      countryCode: 'JP',
      city: '도쿄',
      isGroupRepresentative: true,
    })
    .returning();

  const blackrockChildren = await db
    .insert(investors)
    .values([
      {
        name: 'BlackRock Japan Investment',
        parentId: blackrockParent.id,
        countryCode: 'JP',
        city: '도쿄',
        isGroupRepresentative: false,
      },
      {
        name: 'BlackRock Japan Investment (II)',
        parentId: blackrockParent.id,
        countryCode: 'JP',
        city: '도쿄',
        isGroupRepresentative: false,
      },
      {
        name: 'BlackRock Japan Investment (III)',
        parentId: blackrockParent.id,
        countryCode: 'JP',
        city: '도쿄',
        isGroupRepresentative: false,
      },
    ])
    .returning();

  console.log(`✅ BlackRock 그룹: 1 대표 + ${blackrockChildren.length} 자회사`);

  // Fidelity 그룹
  const [fidelityParent] = await db
    .insert(investors)
    .values({
      name: 'Fidelity Asset Management',
      countryCode: 'HK',
      city: '완차이',
      isGroupRepresentative: true,
    })
    .returning();

  await db.insert(investors).values([
    {
      name: 'Fidelity HK Limited',
      parentId: fidelityParent.id,
      countryCode: 'HK',
      city: '완차이',
      isGroupRepresentative: false,
    },
  ]);

  console.log('✅ Fidelity 그룹: 1 대표 + 1 자회사');

  // Northern Trust Capital (모회사만)
  const [northernTrust] = await db
    .insert(investors)
    .values({
      name: 'Northern Trust Capital',
      countryCode: 'NL',
      city: '포트루이스',
      isGroupRepresentative: true,
    })
    .returning();

  console.log('✅ Northern Trust: 단독 (자회사 없음)');

  // ==================== 3. Snapshots (2024 Q4 예시) ====================

  // BlackRock 대표 스냅샷
  await db.insert(investorSnapshots).values({
    investorId: blackrockParent.id,
    year: 2024,
    quarter: 4,
    groupRank: 1, // Rank 1위
    groupChildCount: 13, // UI에서 "1(13)" 표시용
    sOverO: 80,
    ord: 40,
    adr: 50,
    investorType: 'INVESTMENT_ADVISOR',
    styleTag: 'POSITIVE',
    styleNote: '긍정적',
    turnover: 'MEDIUM',
    orientation: 'ACTIVE',
    lastActivityAt: new Date('2025-09-23T14:00:00Z'),
  });

  // BlackRock 자회사 스냅샷들 (groupRank null)
  for (const child of blackrockChildren) {
    await db.insert(investorSnapshots).values({
      investorId: child.id,
      year: 2024,
      quarter: 4,
      groupRank: null, // 자회사는 순위 없음 (UI에서 "-" 표시)
      sOverO: 80,
      ord: 40,
      adr: 50,
      investorType: 'INVESTMENT_ADVISOR',
      styleTag: 'QUESTION_HEAVY',
      styleNote: '질문 많음',
      turnover: child.name.includes('(II)') ? 'HIGH' : 'LOW',
      orientation: child.name.includes('(III)') ? 'INACTIVE' : 'ACTIVE',
      lastActivityAt: new Date('2025-09-23T14:00:00Z'),
    });
  }

  // Fidelity 대표 스냅샷
  await db.insert(investorSnapshots).values({
    investorId: fidelityParent.id,
    year: 2024,
    quarter: 4,
    groupRank: 2, // Rank 2위
    groupChildCount: 1,
    sOverO: 20,
    ord: 49,
    adr: 23,
    investorType: 'INVESTMENT_ADVISOR',
    styleTag: 'POSITIVE',
    styleNote: '긍정적',
    turnover: 'HIGH',
    orientation: 'ACTIVE',
    lastActivityAt: new Date('2025-09-23T14:00:00Z'),
  });

  // Northern Trust 스냅샷
  await db.insert(investorSnapshots).values({
    investorId: northernTrust.id,
    year: 2024,
    quarter: 4,
    groupRank: 3, // Rank 3위
    groupChildCount: 0,
    sOverO: 80,
    ord: 40,
    adr: 50,
    investorType: 'INVESTMENT_ADVISOR',
    styleTag: 'POSITIVE',
    styleNote: '긍정적',
    turnover: 'MEDIUM',
    orientation: 'INACTIVE',
    lastActivityAt: new Date('2025-09-23T14:00:00Z'),
  });

  console.log('✅ 2024 Q4 스냅샷 생성 완료');

  // ==================== 4. Meetings ====================
  await db.insert(investorMeetings).values([
    {
      investorId: blackrockParent.id,
      meetingDate: new Date('2025-09-25T14:00:00Z'),
      meetingType: 'One-on-One',
      topic: '비대면',
      participants: 'John',
      tags: ['영업현황', '수주현황', 'CETI 매출'],
      changeRate: '+5.2%',
    },
    {
      investorId: blackrockParent.id,
      meetingDate: new Date('2025-09-25T14:00:00Z'),
      meetingType: 'NDR',
      topic: 'CEO, 비대면, IR비대면',
      participants: 'Harold, Rahul',
      tags: ['영업현황', '수주현황', 'CETI 매출'],
      changeRate: '-5.2%',
    },
    {
      investorId: blackrockParent.id,
      meetingDate: new Date('2025-09-25T14:00:00Z'),
      meetingType: 'One-on-One',
      topic: 'CEO, 비대면, IR비대면',
      participants: 'John',
      tags: ['영업현황', 'CETI 매출'],
      changeRate: '+5.2%',
    },
    {
      investorId: fidelityParent.id,
      meetingDate: new Date('2025-08-15T10:00:00Z'),
      meetingType: 'Conference',
      topic: '방문형태',
      participants: 'Sarah, Michael',
      tags: ['재무현황', '수익성'],
      changeRate: '+2.1%',
    },
  ]);

  console.log('✅ Meeting history seeded');

  // ==================== 5. Interests ====================
  await db.insert(investorInterests).values([
    { investorId: blackrockParent.id, topic: '주주환원', frequency: 100 },
    { investorId: blackrockParent.id, topic: '탑직 리스크', frequency: 60 },
    { investorId: blackrockParent.id, topic: '경영권', frequency: 80 },
    { investorId: blackrockParent.id, topic: '성장성', frequency: 90 },
    { investorId: blackrockParent.id, topic: '자본비용', frequency: 50 },
    { investorId: blackrockParent.id, topic: '수익성', frequency: 110 },
    { investorId: blackrockParent.id, topic: '일반 관리비', frequency: 70 },
    { investorId: fidelityParent.id, topic: 'ESG 전략', frequency: 85 },
    { investorId: fidelityParent.id, topic: '배당정책', frequency: 95 },
    { investorId: fidelityParent.id, topic: '시장점유율', frequency: 70 },
  ]);

  console.log('✅ Interests seeded');

  // ==================== 6. Activities ====================
  await db.insert(investorActivities).values([
    {
      investorId: blackrockParent.id,
      activityDate: new Date('2025-09-25T00:00:00Z'),
      activityType: 'One-on-One',
      description: 'SQ 실적 취약',
      participants: 'John',
      tags: ['영업현황', '수주현황', 'CETI 매출'],
      changeRate: '+1.2%',
    },
    {
      investorId: blackrockParent.id,
      activityDate: new Date('2025-09-25T00:00:00Z'),
      activityType: 'NDR',
      description: '신년 투자 계획',
      participants: 'Harold, Rahul',
      tags: ['영업현황', '수주현황', 'CETI 매출', 'CETI 비중'],
      changeRate: '-5.2%',
    },
    {
      investorId: fidelityParent.id,
      activityDate: new Date('2025-08-10T00:00:00Z'),
      activityType: 'Lunch Meeting',
      description: '분기 실적 검토',
      participants: 'Sarah',
      tags: ['재무현황', '영업이익'],
      changeRate: '+0.8%',
    },
  ]);

  console.log('✅ Activities seeded');

  // ==================== 7. Communications ====================
  await db.insert(investorCommunications).values([
    {
      investorId: blackrockParent.id,
      communicationDate: new Date('2025-01-15T00:00:00Z'),
      communicationType: '대면미팅',
      description: '1Q25',
      participants: 'John',
      tags: [],
    },
    {
      investorId: blackrockParent.id,
      communicationDate: new Date('2025-04-15T00:00:00Z'),
      communicationType: '비대면미팅',
      description: '2Q25',
      participants: 'Harold',
      tags: [],
    },
    {
      investorId: blackrockParent.id,
      communicationDate: new Date('2025-07-15T00:00:00Z'),
      communicationType: 'One-on-One',
      description: '2Q25 - 지역별(6)',
      participants: 'John, Harold',
      tags: ['단독만남', 'IR 전략', '노쇼', '수익성'],
    },
    {
      investorId: fidelityParent.id,
      communicationDate: new Date('2025-03-10T00:00:00Z'),
      communicationType: 'Conference',
      description: '1Q25 결산',
      participants: 'Sarah, Michael',
      tags: ['재무제표', '수익성'],
    },
  ]);

  console.log('✅ Communications seeded');

  console.log('🎉 Investor seed 완료!');
  console.log('');
  console.log('📊 생성된 데이터:');
  console.log('  - 국가: 5개 (JP, HK, MU, NL, US)');
  console.log('  - 투자자 그룹: 3개 (BlackRock, Fidelity, Northern Trust)');
  console.log('  - 투자자 총: 7개 (대표 3 + 자회사 4)');
  console.log('  - 스냅샷: 7개 (2024 Q4)');
  console.log('  - 면담 이력: 4개');
  console.log('  - 관심사: 10개');
  console.log('  - 활동: 3개');
  console.log('  - 커뮤니케이션: 4개');

  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error('❌ Seed 실패:', err);
  process.exit(1);
});
