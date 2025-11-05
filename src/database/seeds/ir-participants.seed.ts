import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const postgres = require('postgres') as unknown as (
  cn: string,
  opts?: unknown,
) => import('postgres').Sql<Record<string, unknown>>;

import {
  irActivities,
  irSubActivities,
  irActivityKbParticipants,
  irActivityVisitors,
  irSubActivityKbParticipants,
  irSubActivityVisitors,
} from '../schemas/ir.schema';
import { users } from '../schemas/users';

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

  console.log('🌱 Adding IR participants and visitors data...');

  // Get all users for KB participants
  const allUsers = await db.select().from(users);
  if (allUsers.length === 0) {
    console.error('❌ No users found. Please seed users first.');
    process.exit(1);
  }

  console.log(`Found ${allUsers.length} users for KB participants`);

  // Get all activities
  const activities = await db.select().from(irActivities);
  console.log(`Found ${activities.length} activities`);

  // Sample investor names
  const investors = [
    { name: 'BlackRock Investment', company: 'BlackRock Inc.' },
    { name: 'Fidelity Investments', company: 'Fidelity Investments Inc.' },
    { name: 'Vanguard Group', company: 'The Vanguard Group' },
    { name: 'State Street Global', company: 'State Street Corporation' },
    { name: 'Capital Group', company: 'Capital Group Companies' },
    {
      name: 'JP Morgan Asset Management',
      company: 'JPMorgan Chase & Co.',
    },
    {
      name: 'Goldman Sachs Asset Management',
      company: 'Goldman Sachs Group Inc.',
    },
    { name: 'Morgan Stanley Investment', company: 'Morgan Stanley' },
    { name: 'UBS Asset Management', company: 'UBS Group AG' },
    {
      name: 'Credit Suisse Asset Management',
      company: 'Credit Suisse Group AG',
    },
    { name: 'T. Rowe Price Associates', company: 'T. Rowe Price Group' },
    {
      name: 'Wellington Management',
      company: 'Wellington Management Company',
    },
    { name: 'Invesco Ltd.', company: 'Invesco Ltd.' },
    { name: 'Allianz Global Investors', company: 'Allianz SE' },
    {
      name: 'Northern Trust Asset Management',
      company: 'Northern Trust Corporation',
    },
  ];

  // Sample broker names
  const brokers = [
    { name: 'John Smith', company: 'Morgan Stanley' },
    { name: 'Sarah Johnson', company: 'Goldman Sachs' },
    { name: 'Michael Chen', company: 'JP Morgan' },
    { name: 'Emily Williams', company: 'Citigroup' },
    { name: 'David Park', company: 'Bank of America Securities' },
    { name: 'Jennifer Lee', company: 'Deutsche Bank' },
    { name: 'Robert Kim', company: 'Barclays' },
    { name: 'Lisa Anderson', company: 'Credit Suisse' },
    { name: 'Tom Harris', company: 'UBS Investment Bank' },
    { name: 'Jessica Brown', company: 'Morgan Stanley' },
    { name: 'Daniel Martinez', company: 'Goldman Sachs' },
    { name: 'Amanda Taylor', company: 'JP Morgan' },
  ];

  let addedParticipants = 0;
  let addedVisitors = 0;

  // Add participants and visitors to each activity
  for (const activity of activities) {
    // Only add to external activities
    if (activity.category !== 'EXTERNAL') continue;

    // Add 2-3 KB participants per activity
    const numParticipants = 2 + Math.floor(Math.random() * 2);
    const selectedUsers = allUsers
      .sort(() => Math.random() - 0.5)
      .slice(0, numParticipants);

    for (const user of selectedUsers) {
      try {
        await db
          .insert(irActivityKbParticipants)
          .values({
            activityId: activity.id,
            userId: user.id,
            role: Math.random() > 0.5 ? 'IR Manager' : 'IR Coordinator',
          })
          .onConflictDoNothing();
        addedParticipants++;
      } catch (error) {
        // Skip if already exists
      }
    }

    // Add 1-3 investors per activity
    const numInvestors = 1 + Math.floor(Math.random() * 3);
    const selectedInvestors = investors
      .sort(() => Math.random() - 0.5)
      .slice(0, numInvestors);

    for (const investor of selectedInvestors) {
      try {
        await db
          .insert(irActivityVisitors)
          .values({
            activityId: activity.id,
            visitorName: investor.name,
            visitorType: 'investor',
            company: investor.company,
          })
          .onConflictDoNothing();
        addedVisitors++;
      } catch (error) {
        // Skip if already exists
      }
    }

    // Add 1-2 brokers per activity
    const numBrokers = 1 + Math.floor(Math.random() * 2);
    const selectedBrokers = brokers
      .sort(() => Math.random() - 0.5)
      .slice(0, numBrokers);

    for (const broker of selectedBrokers) {
      try {
        await db
          .insert(irActivityVisitors)
          .values({
            activityId: activity.id,
            visitorName: broker.name,
            visitorType: 'broker',
            company: broker.company,
          })
          .onConflictDoNothing();
        addedVisitors++;
      } catch (error) {
        // Skip if already exists
      }
    }
  }

  console.log(
    `✅ Added ${addedParticipants} KB participants to activities`,
  );
  console.log(`✅ Added ${addedVisitors} visitors to activities`);

  // Get all sub-activities
  const subActivities = await db.select().from(irSubActivities);
  console.log(`Found ${subActivities.length} sub-activities`);

  let addedSubParticipants = 0;
  let addedSubVisitors = 0;

  // Add participants and visitors to sub-activities
  for (const subActivity of subActivities) {
    // Add 1-2 KB participants per sub-activity
    const numParticipants = 1 + Math.floor(Math.random() * 2);
    const selectedUsers = allUsers
      .sort(() => Math.random() - 0.5)
      .slice(0, numParticipants);

    for (const user of selectedUsers) {
      try {
        await db
          .insert(irSubActivityKbParticipants)
          .values({
            subActivityId: subActivity.id,
            userId: user.id,
            role: 'IR Staff',
          })
          .onConflictDoNothing();
        addedSubParticipants++;
      } catch (error) {
        // Skip if already exists
      }
    }

    // Add 0-2 investors per sub-activity (not all sub-activities need visitors)
    if (Math.random() > 0.3) {
      const numInvestors = 1 + Math.floor(Math.random() * 2);
      const selectedInvestors = investors
        .sort(() => Math.random() - 0.5)
        .slice(0, numInvestors);

      for (const investor of selectedInvestors) {
        try {
          await db
            .insert(irSubActivityVisitors)
            .values({
              subActivityId: subActivity.id,
              visitorName: investor.name,
              visitorType: 'investor',
              company: investor.company,
            })
            .onConflictDoNothing();
          addedSubVisitors++;
        } catch (error) {
          // Skip if already exists
        }
      }
    }

    // Add 0-1 brokers per sub-activity
    if (Math.random() > 0.5) {
      const selectedBroker = brokers[Math.floor(Math.random() * brokers.length)];
      try {
        await db
          .insert(irSubActivityVisitors)
          .values({
            subActivityId: subActivity.id,
            visitorName: selectedBroker.name,
            visitorType: 'broker',
            company: selectedBroker.company,
          })
          .onConflictDoNothing();
        addedSubVisitors++;
      } catch (error) {
        // Skip if already exists
      }
    }
  }

  console.log(
    `✅ Added ${addedSubParticipants} KB participants to sub-activities`,
  );
  console.log(`✅ Added ${addedSubVisitors} visitors to sub-activities`);

  // Show summary
  console.log('\n📊 Summary:');
  console.log('─────────────────────────────────────');
  const activityParticipants = await db
    .select({ count: sql<number>`count(*)` })
    .from(irActivityKbParticipants);
  const activityVisitorsInvestors = await db
    .select({ count: sql<number>`count(*)` })
    .from(irActivityVisitors)
    .where(eq(irActivityVisitors.visitorType, 'investor'));
  const activityVisitorsBrokers = await db
    .select({ count: sql<number>`count(*)` })
    .from(irActivityVisitors)
    .where(eq(irActivityVisitors.visitorType, 'broker'));
  const subActivityParticipants = await db
    .select({ count: sql<number>`count(*)` })
    .from(irSubActivityKbParticipants);
  const subActivityVisitorsInvestors = await db
    .select({ count: sql<number>`count(*)` })
    .from(irSubActivityVisitors)
    .where(eq(irSubActivityVisitors.visitorType, 'investor'));
  const subActivityVisitorsBrokers = await db
    .select({ count: sql<number>`count(*)` })
    .from(irSubActivityVisitors)
    .where(eq(irSubActivityVisitors.visitorType, 'broker'));

  console.log(
    `Activity KB Participants: ${activityParticipants[0]?.count || 0}`,
  );
  console.log(
    `Activity Visitors (Investors): ${activityVisitorsInvestors[0]?.count || 0}`,
  );
  console.log(
    `Activity Visitors (Brokers): ${activityVisitorsBrokers[0]?.count || 0}`,
  );
  console.log(
    `Sub-Activity KB Participants: ${subActivityParticipants[0]?.count || 0}`,
  );
  console.log(
    `Sub-Activity Visitors (Investors): ${subActivityVisitorsInvestors[0]?.count || 0}`,
  );
  console.log(
    `Sub-Activity Visitors (Brokers): ${subActivityVisitorsBrokers[0]?.count || 0}`,
  );
  console.log('─────────────────────────────────────');

  await client.end({ timeout: 5 });
  console.log('\n✨ Done!');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
