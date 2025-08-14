import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
// Use require to ensure CJS runtime compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const postgres = require('postgres') as unknown as (
  cn: string,
  opts?: unknown,
) => import('postgres').Sql<any>;
import * as userSchemas from './schemas/users';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL')!;

        const client = postgres(connectionString, {
          ssl: 'require',
          max: 10,
        });

        return drizzle(client, {
          schema: { ...userSchemas },
        });
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
