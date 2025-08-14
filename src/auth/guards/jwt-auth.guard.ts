import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  type CanActivate,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { CurrentUserData } from '../decorators/current-user.decorator';

const JwtAuthGuardBase = AuthGuard('jwt') as unknown as new (
  ...args: any[]
) => CanActivate & {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
};

@Injectable()
export class JwtAuthGuard extends JwtAuthGuardBase implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  handleRequest<TUser = CurrentUserData>(
    err: any,
    user: any,
    _info: any,
    _context: ExecutionContext,
    _status?: any,
  ): TUser {
    void _info;
    void _context;
    void _status;
    if (err) {
      throw err;
    }
    if (!user) {
      throw new UnauthorizedException('Access denied. Please login.');
    }
    return user as TUser;
  }
}
