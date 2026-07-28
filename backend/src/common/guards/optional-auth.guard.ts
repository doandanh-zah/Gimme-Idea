import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { extractSessionToken } from '../auth-session';

/**
 * Optional Auth Guard
 * Similar to AuthGuard but doesn't throw error if no token
 * Used for routes that should work for both authenticated and anonymous users
 * but provide enhanced features for authenticated users (e.g., isFollowing status)
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = extractSessionToken(request);

    if (!token) {
      // No token is fine - user is anonymous
      return true;
    }

    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      const payload = jwt.verify(token, jwtSecret);

      // Attach user info to request
      request.user = payload;
    } catch (error) {
      // Invalid token is also fine - treat as anonymous
      // Don't throw, just continue without user
    }

    return true;
  }

}
