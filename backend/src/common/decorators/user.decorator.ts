import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return undefined;

    // Map 'id' to 'userId' since JWT payload uses 'userId'
    // Also support both 'id' and 'userId' as they mean the same thing
    if (data === "id" || data === "userId") {
      return user.userId || user.id;
    }

    return data ? user?.[data] : user;
  }
);
