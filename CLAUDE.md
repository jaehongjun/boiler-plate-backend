# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Development with hot reload (Swagger enabled at /docs)
npm run start:dev

# Production build and run
npm run start:prod

# Build only
npm run build

# Lint and fix code
npm run lint

# Format code
npm run format
```

### Testing
```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Debug tests
npm run test:debug
```

### Database Operations
```bash
# Generate migrations from schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed
```

### Memory-Optimized Deployment
```bash
# Standard production (512MB memory)
npm run start:prod

# Low memory deployment (256MB)
npm run start:low-memory

# Environment-based memory setting
NODE_OPTIONS=256 npm run start:env-memory
```

## Architecture Overview

### Database Layer (Drizzle ORM + PostgreSQL)
- **ORM**: Drizzle ORM with Zod schema generation for type safety
- **Database**: Supabase PostgreSQL with SSL required
- **Schemas**: Located in `src/database/schemas/`
  - `users.ts` - User management with favorites, alerts, refresh tokens
  - `crm.schema.ts` - Investment CRM with customers, contacts, accounts, products, transactions
- **Migrations**: Auto-generated in `src/database/migrations/`
- **Configuration**: `drizzle.config.ts` with environment-based connection strings

### Module Architecture
- **AppModule**: Root module with global configuration
- **DatabaseModule**: Global database connection provider using dependency injection
- **AuthModule**: JWT authentication with refresh token rotation, bcrypt hashing
- **CrmModule**: Investment CRM business logic with CRUD operations
- **PortfolioModule**: Portfolio management features

### Authentication System
- **JWT Strategy**: Access tokens (7 days) + Refresh tokens (14 days)
- **Security**: bcrypt password hashing, SHA-256 hashed refresh tokens
- **Guards**: JwtAuthGuard with Passport.js integration
- **Token Management**: Automatic rotation and blacklisting support

### API Structure
- **Global Prefix**: All routes prefixed with `/api`
- **Swagger**: Auto-generated docs at `/docs` (development only)
- **CORS**: Enabled for all origins with credentials support
- **Validation**: Zod schemas with custom validation pipes
- **Error Handling**: Custom exception filters per module

## CRM Business Domain

This application is designed for investment/securities CRM with the following entities:

### Core Entities
- **Customers**: Customer information with grades (VIP, GENERAL, POTENTIAL) and status tracking
- **Contact History**: Customer interaction tracking with types (PHONE, VISIT, ONLINE, EMAIL)
- **Accounts**: Investment accounts with types (TRUST, PENSION, CMA)
- **Products**: Investment products (STOCK, BOND, FUND, ELS, ETF) with risk levels
- **Transactions**: Trading records with buy/sell operations

### Key Business Rules
- Customer grades determine service levels and access
- Risk levels (HIGH, MEDIUM, LOW) affect product recommendations
- Contact history tracks all customer interactions for compliance
- Account balances must be maintained for trading operations
- Transaction history provides audit trail for regulatory compliance

## Environment Configuration

### Required Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://...
# OR individual components:
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_NAME=
DB_SCHEMA=public
DB_SSL_MODE=require

# JWT Configuration
JWT_SECRET=
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=14d

# Application
NODE_ENV=development|production
PORT=3000
```

### Memory Management
- Production builds use memory limits (--max-old-space-size)
- Default: 512MB, Low-memory option: 256MB
- Environment variable NODE_OPTIONS can override memory settings

## Development Notes

### Code Quality
- TypeScript with strict configuration
- ESLint + Prettier for consistent formatting
- Zod schemas provide runtime validation and type safety
- Drizzle generates type-safe database queries

### API Development
- All endpoints require JWT authentication (except auth routes)
- Use ValidationPipe for request validation
- Follow existing pattern: Controller → Service → Database
- CRM endpoints follow RESTful conventions with search/filtering support

### Database Development
- Schema changes require migration generation (`npm run db:generate`)
- Use Drizzle relations for foreign key constraints
- Enum types are defined in schemas for business logic
- Always test migrations on development database first

### Testing Strategy
- Unit tests using Jest for service layer logic
- E2E tests for complete API workflows
- Focus on authentication flows and business logic validation
- Mock database connections for unit tests