import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * CurrentUserId extracts the authenticated user's id from request.user
 * Fallback: returns undefined if not present.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: { id?: string } }>();
    return request.user?.id;
  },
);
