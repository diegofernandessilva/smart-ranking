import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface IJwtPayload {
  sub: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof IJwtPayload | undefined, ctx: ExecutionContext): IJwtPayload | string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as IJwtPayload;
    return data ? user[data] : user;
  },
);
