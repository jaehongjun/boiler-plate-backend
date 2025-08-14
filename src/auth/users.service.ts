import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import {
  users,
  favorites,
  priceAlerts,
  refreshTokens,
} from '../database/schemas/users';
import type {
  User,
  NewUser,
  Favorite,
  PriceAlert,
  NewPriceAlert,
  RefreshToken,
} from '../database/schemas/users';
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

  // 즐겨찾기 관련
  async getFavorites(userId: string): Promise<string[]> {
    const userFavorites = await this.db
      .select({ symbol: favorites.symbol })
      .from(favorites)
      .where(eq(favorites.userId, userId));

    return userFavorites.map((f) => f.symbol);
  }

  async addToFavorites(userId: string, symbol: string): Promise<Favorite> {
    const [favorite] = await this.db
      .insert(favorites)
      .values({ userId, symbol })
      .returning();

    return favorite;
  }

  async removeFromFavorites(userId: string, symbol: string): Promise<void> {
    await this.db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.symbol, symbol)));
  }

  async isFavorite(userId: string, symbol: string): Promise<boolean> {
    const [favorite] = await this.db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.symbol, symbol)))
      .limit(1);

    return !!favorite;
  }

  // 가격 알림 관련
  getPriceAlerts(userId: string): Promise<PriceAlert[]> {
    return this.db
      .select()
      .from(priceAlerts)
      .where(
        and(eq(priceAlerts.userId, userId), eq(priceAlerts.isActive, true)),
      );
  }

  async createPriceAlert(
    userId: string,
    alertData: Pick<NewPriceAlert, 'symbol' | 'targetPrice' | 'condition'>,
  ): Promise<PriceAlert> {
    const [alert] = await this.db
      .insert(priceAlerts)
      .values({
        userId,
        ...alertData,
      })
      .returning();

    return alert;
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
