import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { users, refreshTokens } from '../database/schemas/users';
import type { User, NewUser, RefreshToken } from '../database/schemas/users';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schemas/users';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(
    userData: Pick<NewUser, 'email' | 'password' | 'name'>,
  ): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({
        email: userData.email,
        password: userData.password,
        name: userData.name,
      })
      .returning();

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user || null;
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<User, 'name' | 'avatar'>>,
  ): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // 리프레시 토큰 관련
  async saveRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const [row] = await this.db
      .insert(refreshTokens)
      .values({ userId, tokenHash, expiresAt })
      .returning();
    return row;
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.id, id));
  }

  async revokeUserTokens(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.userId, userId));
  }

  async findRefreshTokenByHash(
    userId: string,
    tokenHash: string,
  ): Promise<RefreshToken | null> {
    const [row] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.tokenHash, tokenHash),
        ),
      )
      .limit(1);
    return row ?? null;
  }
}
