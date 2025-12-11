import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return undefined;

    // Map 'id' to 'userId' since JWT payload uses 'userId'
    if (data === 'id') {
      return user.userId || user.id;
    }

    return data ? user?.[data] : user;
  },
);
