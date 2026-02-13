import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { ApiTokensService } from '../../api-tokens/api-tokens.service';

// Accept either JWT (existing) or PAT (gi_pat_...)
@Injectable()
export class AnyAuthGuard implements CanActivate {
  constructor(
    private jwtGuard: AuthGuard,
    private apiTokensService: ApiTokensService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    // Try JWT first
    try {
      const ok = this.jwtGuard.canActivate(context);
      if (ok) {
        request.authType = 'jwt';
        return true;
      }
    } catch {
      // ignore
    }

    if (!authHeader) throw new UnauthorizedException('No token provided');
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) throw new UnauthorizedException('Invalid authorization header');

    const pat = await this.apiTokensService.authenticateFromHeaderToken(token);

    // Attach compatible payload for @CurrentUser decorator
    request.user = { userId: pat.userId, tokenId: pat.tokenId, scopes: pat.scopes };
    request.authType = 'pat';

    return true;
  }
}
