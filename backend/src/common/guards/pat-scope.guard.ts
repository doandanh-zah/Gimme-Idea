import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ApiTokensService, TokenScope } from "../../api-tokens/api-tokens.service";
import { REQUIRED_PAT_SCOPES_KEY } from "../decorators/require-pat-scope.decorator";

@Injectable()
export class PatScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private apiTokensService: ApiTokensService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes =
      this.reflector.getAllAndOverride<TokenScope[]>(REQUIRED_PAT_SCOPES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (request.authType !== "pat") {
      return true;
    }

    const scopes = (request.user?.scopes || []) as TokenScope[];
    for (const scope of requiredScopes) {
      this.apiTokensService.ensureScope(scopes, scope);
    }

    return true;
  }
}
