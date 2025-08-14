import { Injectable, type CanActivate } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { CurrentUserData } from '../decorators/current-user.decorator';

const OptionalJwtAuthGuardBase = AuthGuard('jwt') as unknown as new (
  ...args: any[]
) => CanActivate;

@Injectable()
export class OptionalJwtAuthGuard
  extends OptionalJwtAuthGuardBase
  implements CanActivate
{
  // 인증이 실패해도 요청을 계속 진행 (user는 undefined)
  handleRequest<TUser = CurrentUserData | null>(
    _err: any,
    user: any,
    _info: any,
    _context: any,
    _status?: any,
  ): TUser {
    void _err;
    void _info;
    void _context;
    void _status;
    return (user as TUser) ?? (null as TUser);
  }
}
