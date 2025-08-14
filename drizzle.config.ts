import type { Config } from 'drizzle-kit';

export default {
  schema: './src/database/schemas/*.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=${process.env.DB_SCHEMA || 'public'}&sslmode=${process.env.DB_SSL_MODE || 'prefer'}`,
  },
  verbose: true,
  strict: true,
} satisfies Config;
