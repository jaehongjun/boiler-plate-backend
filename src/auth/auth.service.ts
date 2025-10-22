import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import type { User } from '../database/schemas/users';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async register(email: string, password: string, name: string) {
    // 이메일 중복 확인
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    // 비밀번호 해싱
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 사용자 생성
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      name,
    });

    // JWT 토큰 생성
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);
    await this.persistRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  async login(email: string, password: string) {
    // 사용자 찾기
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // JWT 토큰 생성
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);
    await this.persistRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  async getUser(userId: string): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private signAccessToken(payload: JwtPayload): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresInConf = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '7d',
    );
    if (!secret) throw new Error('JWT_SECRET is not configured');
    const expiresInSeconds = Math.floor(
      this.parseDurationMs(expiresInConf) / 1000,
    );
    return this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresInSeconds,
    });
  }

  private signRefreshToken(payload: JwtPayload): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const expiresInConf = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '14d',
    );
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not configured');
    const expiresInSeconds = Math.floor(
      this.parseDurationMs(expiresInConf) / 1000,
    );
    return this.jwtService.sign({ ...payload, typ: 'refresh' } as JwtPayload, {
      secret,
      expiresIn: expiresInSeconds,
    });
  }

  async refresh(refreshToken: string) {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not configured');
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };
    const accessToken = this.signAccessToken(newPayload);
    const newRefreshToken = this.signRefreshToken(newPayload);

    // 토큰 로테이션: 기존 토큰 폐기, 새 토큰 저장
    const prevHash = this.hashToken(refreshToken);
    const existing = await this.usersService.findRefreshTokenByHash(
      user.id,
      prevHash,
    );
    if (existing) {
      await this.usersService.revokeRefreshToken(existing.id);
    }
    await this.persistRefreshToken(user.id, newRefreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
    } as const;
  }

  private async persistRefreshToken(userId: string, refreshToken: string) {
    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '14d',
    );
    const ms = this.parseDurationMs(expiresIn);
    const expiresAt = new Date(Date.now() + ms);
    const tokenHash = this.hashToken(refreshToken);
    await this.usersService.saveRefreshToken(userId, tokenHash, expiresAt);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseDurationMs(duration: string): number {
    const match = duration.match(/^(\d+)([smhdw])$/);
    if (!match) {
      // fallback: days as number
      const days = Number(duration);
      return isNaN(days)
        ? 14 * 24 * 60 * 60 * 1000
        : days * 24 * 60 * 60 * 1000;
    }
    const value = Number(match[1]);
    const unit = match[2];
    const unitToMs: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
    };
    return value * unitToMs[unit];
  }
}
