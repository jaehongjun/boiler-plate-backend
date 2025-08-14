import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface CurrentUserData {
  id: string;
  email: string;
  name: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: CurrentUserData }>();
    return request.user as CurrentUserData;
  },
);
