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

  console.log('🌱 Seeding Full Investor Detail data...');

  // ==================== 1. Countries ====================
  const countryCodes = ['JP', 'HK', 'MU', 'NL', 'US', 'UK', 'FR'];
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
    { code: 'UK', nameKo: '영국', nameEn: 'United Kingdom' },
    { code: 'FR', nameKo: '프랑스', nameEn: 'France' },
  ]);

  console.log('✅ Countries seeded');

  // ==================== 2. Delete existing data ====================
  await db.delete(investors).execute();
  console.log('✅ Cleared existing data');

  // ==================== 3. Create all investors ====================
  // First create all parent investors
  const parentInvestors = [
    { name: 'BlackRock Investment', country: 'JP', city: '도쿄' },
    { name: 'Fidelity Asset Management', country: 'HK', city: '완차이' },
    { name: 'Northern Trust Capital', country: 'NL', city: '포트루이스' },
    { name: 'Nomura Asset Management', country: 'JP', city: '도쿄' },
    { name: 'Vanguard Group', country: 'US', city: '뉴욕' },
    { name: 'Daiwa Securities', country: 'JP', city: '도쿄' },
    { name: 'HSBC Asset Management', country: 'HK', city: '홍콩' },
    { name: 'State Street Global Advisors', country: 'US', city: '보스턴' },
    { name: 'Sumitomo Mitsui Trust', country: 'JP', city: '오사카' },
    {
      name: 'Legal & General Investment Management',
      country: 'UK',
      city: '런던',
    },
  ];

  const createdInvestors: any[] = [];
  for (const inv of parentInvestors) {
    const [created] = await db
      .insert(investors)
      .values({
        name: inv.name,
        countryCode: inv.country,
        city: inv.city,
        parentId: null,
        isGroupRepresentative: true,
      })
      .returning();
    createdInvestors.push(created);
  }

  console.log(`✅ Created ${createdInvestors.length} parent investors`);

  // Then create child investors
  const blackrockParent = createdInvestors.find(
    (inv) => inv.name === 'BlackRock Investment',
  );
  const fidelityParent = createdInvestors.find(
    (inv) => inv.name === 'Fidelity Asset Management',
  );

  const childInvestors = await db
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
      {
        name: 'Fidelity HK Limited',
        parentId: fidelityParent.id,
        countryCode: 'HK',
        city: '완차이',
        isGroupRepresentative: false,
      },
    ])
    .returning();

  console.log(`✅ Created ${childInvestors.length} child investors`);

  // ==================== 4. Snapshots for all investors ====================
  const snapshotData = [
    {
      rank: 1,
      sOverO: 70,
      ord: 132675,
      adr: 169522,
      type: 'HEDGE_FUND',
      style: 'POSITIVE',
      note: '긍정적',
      turnover: 'LOW',
      orientation: 'ACTIVE',
    },
    {
      rank: 2,
      sOverO: 65,
      ord: 120000,
      adr: 150000,
      type: 'PENSION',
      style: 'NEUTRAL',
      note: '중립적',
      turnover: 'MEDIUM',
      orientation: 'ACTIVE',
    },
    {
      rank: 3,
      sOverO: 60,
      ord: 110000,
      adr: 140000,
      type: 'MUTUAL_FUND',
      style: 'POSITIVE',
      note: '긍정적',
      turnover: 'LOW',
      orientation: 'ACTIVE',
    },
    {
      rank: 4,
      sOverO: 58,
      ord: 105000,
      adr: 135000,
      type: 'INVESTMENT_ADVISOR',
      style: 'QUESTION_HEAVY',
      note: '질문 많음',
      turnover: 'HIGH',
      orientation: 'ACTIVE',
    },
    {
      rank: 5,
      sOverO: 55,
      ord: 100000,
      adr: 130000,
      type: 'HEDGE_FUND',
      style: 'POSITIVE',
      note: '긍정적',
      turnover: 'MEDIUM',
      orientation: 'ACTIVE',
    },
    {
      rank: 6,
      sOverO: 52,
      ord: 95000,
      adr: 125000,
      type: 'ETF',
      style: 'NEUTRAL',
      note: '중립적',
      turnover: 'LOW',
      orientation: 'INACTIVE',
    },
    {
      rank: 7,
      sOverO: 50,
      ord: 90000,
      adr: 120000,
      type: 'SOVEREIGN',
      style: 'PICKY',
      note: '까칠함',
      turnover: 'LOW',
      orientation: 'ACTIVE',
    },
    {
      rank: 8,
      sOverO: 48,
      ord: 85000,
      adr: 115000,
      type: 'PENSION',
      style: 'POSITIVE',
      note: '긍정적',
      turnover: 'MEDIUM',
      orientation: 'ACTIVE',
    },
    {
      rank: 9,
      sOverO: 45,
      ord: 80000,
      adr: 110000,
      type: 'MUTUAL_FUND',
      style: 'NEUTRAL',
      note: '중립적',
      turnover: 'HIGH',
      orientation: 'ACTIVE',
    },
    {
      rank: 10,
      sOverO: 42,
      ord: 75000,
      adr: 105000,
      type: 'BANK',
      style: 'NEGATIVE',
      note: '부정적',
      turnover: 'MEDIUM',
      orientation: 'INACTIVE',
    },
  ];

  // Create snapshots for multiple quarters
  const quarters = [
    { year: 2022, quarter: 1 },
    { year: 2022, quarter: 2 },
    { year: 2022, quarter: 3 },
    { year: 2022, quarter: 4 },
    { year: 2023, quarter: 1 },
    { year: 2023, quarter: 2 },
    { year: 2023, quarter: 3 },
    { year: 2023, quarter: 4 },
    { year: 2024, quarter: 1 },
    { year: 2024, quarter: 2 },
    { year: 2024, quarter: 3 },
    { year: 2024, quarter: 4 },
  ];

  // Create snapshots for parent investors
  for (let i = 0; i < createdInvestors.length; i++) {
    const investor = createdInvestors[i];
    if (investor.isGroupRepresentative) {
      // Calculate child count
      let childCount = 0;
      if (investor.id === blackrockParent.id) childCount = 3;
      if (investor.id === fidelityParent.id) childCount = 1;

      for (const period of quarters) {
        const baseData = snapshotData[i];
        // Add some variation by quarter
        const variation = Math.floor(Math.random() * 10) - 5;
        const month = String(period.quarter * 3).padStart(2, '0');
        await db.insert(investorSnapshots).values({
          investorId: investor.id,
          year: period.year,
          quarter: period.quarter,
          groupRank: baseData.rank,
          groupChildCount: childCount,
          sOverO: baseData.sOverO + variation,
          ord: baseData.ord + variation * 1000,
          adr: baseData.adr + variation * 1000,
          investorType: baseData.type as any,
          styleTag: baseData.style as any,
          styleNote: baseData.note,
          turnover: baseData.turnover as any,
          orientation: baseData.orientation as any,
          lastActivityAt: new Date(`${period.year}-${month}-15T14:00:00Z`),
        });
      }
    }
  }

  // Create snapshots for child investors (자회사)
  const childSnapshotTemplate = {
    sOverO: 30,
    ord: 25000,
    adr: 30000,
    type: 'HEDGE_FUND',
    style: 'NEUTRAL',
    note: '중립적',
    turnover: 'MEDIUM',
    orientation: 'ACTIVE',
  };

  for (const child of childInvestors) {
    for (const period of quarters) {
      const variation = Math.floor(Math.random() * 10) - 5;
      const month = String(period.quarter * 3).padStart(2, '0');
      await db.insert(investorSnapshots).values({
        investorId: child.id,
        year: period.year,
        quarter: period.quarter,
        groupRank: null, // 자회사는 랭킹 없음
        groupChildCount: null,
        sOverO: childSnapshotTemplate.sOverO + variation,
        ord: childSnapshotTemplate.ord + variation * 500,
        adr: childSnapshotTemplate.adr + variation * 500,
        investorType: childSnapshotTemplate.type as any,
        styleTag: childSnapshotTemplate.style as any,
        styleNote: childSnapshotTemplate.note,
        turnover: childSnapshotTemplate.turnover as any,
        orientation: childSnapshotTemplate.orientation as any,
        lastActivityAt: new Date(`${period.year}-${month}-15T14:00:00Z`),
      });
    }
  }

  console.log('✅ Snapshots created for all periods (parents + children)');

  // ==================== 5. Meetings for each investor ====================
  const meetingTemplates = [
    {
      type: 'One-on-One',
      topic: '비대면',
      participants: 'John Smith',
      tags: ['영업현황', '수주현황', 'CETI 매출'],
      rate: '+5.2%',
    },
    {
      type: 'NDR',
      topic: 'CEO, 비대면, IR비대면',
      participants: 'Harold Kim, Rahul Patel',
      tags: ['영업현황', '재무제표', '투자전략'],
      rate: '-2.1%',
    },
    {
      type: 'Conference',
      topic: '방문형태',
      participants: 'Sarah Johnson',
      tags: ['시장전망', 'ESG 전략', '수익성'],
      rate: '+3.5%',
    },
    {
      type: 'One-on-One',
      topic: 'CEO 방문',
      participants: 'Michael Chen',
      tags: ['신규사업', '성장성', '배당정책'],
      rate: '+1.8%',
    },
    {
      type: 'Lunch Meeting',
      topic: '주주총회',
      participants: 'Emily Park',
      tags: ['경영권', '주주환원', '자본비용'],
      rate: '-0.5%',
    },
  ];

  for (const investor of createdInvestors) {
    if (investor.isGroupRepresentative) {
      for (let i = 0; i < 3; i++) {
        const template = meetingTemplates[i % meetingTemplates.length];
        const month = String(9 - i).padStart(2, '0');
        const day = String(15 + i).padStart(2, '0');
        await db.insert(investorMeetings).values({
          investorId: investor.id,
          meetingDate: new Date(`2025-${month}-${day}T14:00:00Z`),
          meetingType: template.type,
          topic: template.topic,
          participants: template.participants,
          tags: template.tags,
          changeRate: template.rate,
        });
      }
    }
  }

  console.log('✅ Meetings created');

  // ==================== 6. Interests for each investor ====================
  const interestTopics = [
    [
      '주주환원',
      '탑직 리스크',
      '경영권',
      '성장성',
      '자본비용',
      '수익성',
      '일반 관리비',
    ],
    [
      'ESG 전략',
      '배당정책',
      '시장점유율',
      '신규사업',
      '재무구조',
      '영업이익',
      '투자전략',
    ],
    [
      '경영진 교체',
      '사업다각화',
      '리스크 관리',
      '매출성장',
      '비용절감',
      '현금흐름',
      '자산관리',
    ],
    [
      '주가 안정',
      '시장 트렌드',
      '경쟁력',
      '기술혁신',
      '글로벌 확장',
      '수익구조',
      '지배구조',
    ],
    [
      '브랜드 가치',
      '고객만족',
      '품질관리',
      '생산성',
      '인재육성',
      '조직문화',
      '협력관계',
    ],
  ];

  for (let idx = 0; idx < createdInvestors.length; idx++) {
    const investor = createdInvestors[idx];
    if (investor.isGroupRepresentative) {
      const topics = interestTopics[idx % interestTopics.length];
      for (const topic of topics) {
        await db.insert(investorInterests).values({
          investorId: investor.id,
          topic: topic,
          frequency: Math.floor(Math.random() * 60) + 50, // 50-110
        });
      }
    }
  }

  console.log('✅ Interests created');

  // ==================== 7. Activities for each investor ====================
  const activityTemplates = [
    {
      type: 'One-on-One',
      desc: 'SQ 실적 취약',
      participants: 'John',
      tags: ['영업현황', '수주현황'],
      rate: '+1.2%',
    },
    {
      type: 'NDR',
      desc: '신년 투자 계획',
      participants: 'Harold',
      tags: ['투자전략', '포트폴리오'],
      rate: '-5.2%',
    },
    {
      type: 'Conference',
      desc: '분기 실적 검토',
      participants: 'Sarah',
      tags: ['재무제표', '영업이익'],
      rate: '+0.8%',
    },
  ];

  for (const investor of createdInvestors) {
    if (investor.isGroupRepresentative) {
      for (let i = 0; i < 2; i++) {
        const template = activityTemplates[i % activityTemplates.length];
        const month = String(9 - i).padStart(2, '0');
        const day = String(20 + i).padStart(2, '0');
        await db.insert(investorActivities).values({
          investorId: investor.id,
          activityDate: new Date(`2025-${month}-${day}T00:00:00Z`),
          activityType: template.type,
          description: template.desc,
          participants: template.participants,
          tags: template.tags,
          changeRate: template.rate,
        });
      }
    }
  }

  console.log('✅ Activities created');

  // ==================== 8. Communications for each investor ====================
  const commTemplates = [
    { type: '대면미팅', desc: '1Q25 미팅', tags: [] },
    { type: '비대면미팅', desc: '2Q25 화상회의', tags: [] },
    {
      type: 'One-on-One',
      desc: '3Q25 - 지역별(6)',
      tags: ['단독만남', 'IR 전략', '수익성'],
    },
    {
      type: 'Conference',
      desc: '4Q25 컨퍼런스',
      tags: ['시장전망', '투자전략'],
    },
  ];

  for (const investor of createdInvestors) {
    if (investor.isGroupRepresentative) {
      for (let i = 0; i < 3; i++) {
        const template = commTemplates[i % commTemplates.length];
        const month = String(i * 3 + 1).padStart(2, '0');
        await db.insert(investorCommunications).values({
          investorId: investor.id,
          communicationDate: new Date(`2025-${month}-15T00:00:00Z`),
          communicationType: template.type,
          description: template.desc,
          participants: `Participant ${i + 1}`,
          tags: template.tags,
        });
      }
    }
  }

  console.log('✅ Communications created');

  console.log('🎉 Full Investor Detail seed 완료!');
  console.log('');
  console.log('📊 생성된 데이터:');
  console.log('  - 국가: 7개 (JP, HK, MU, NL, US, UK, FR)');
  console.log('  - 투자자: 14개 (대표 10 + 자회사 4)');
  console.log('    * BlackRock Investment (자회사 3개)');
  console.log('    * Fidelity Asset Management (자회사 1개)');
  console.log('  - 스냅샷: 168개 (10개 대표 × 12분기 + 4개 자회사 × 12분기)');
  console.log('  - 면담 이력: 30개 (10개 대표 × 3개씩)');
  console.log('  - 관심사: 70개 (10개 대표 × 7개씩)');
  console.log('  - 활동: 20개 (10개 대표 × 2개씩)');
  console.log('  - 커뮤니케이션: 30개 (10개 대표 × 3개씩)');

  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error('❌ Seed 실패:', err);
  process.exit(1);
});
