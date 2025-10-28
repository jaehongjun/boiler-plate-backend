import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
// Use require to ensure CJS runtime compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const postgres = require('postgres') as unknown as (
  cn: string,
  opts?: unknown,
) => import('postgres').Sql<Record<string, unknown>>;
import * as userSchemas from './schemas/users';
import * as crmSchemas from './schemas/crm.schema';
import * as calendarSchemas from './schemas/calendar.schema';
import * as irSchemas from './schemas/ir.schema';
import * as investorSchemas from './schemas/investor.schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        if (!connectionString) {
          throw new Error('DATABASE_URL is not configured');
        }

        const client = postgres(connectionString, {
          ssl: 'require',
          max: 10,
        });

        return drizzle(client, {
          schema: {
            ...userSchemas,
            ...crmSchemas,
            ...calendarSchemas,
            ...irSchemas,
            ...investorSchemas,
          },
        });
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
