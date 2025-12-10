import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

/**
 * Interceptor to add cache control headers for Cloudflare CDN
 * Use this on public GET endpoints to enable edge caching
 *
 * Usage:
 * @UseInterceptors(new CacheControlInterceptor(300)) // 5 minutes
 * @Get()
 * async getProjects() { ... }
 */
@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(
    private readonly maxAge: number = 300, // Default 5 minutes
    private readonly staleWhileRevalidate: number = 60 // Default 1 minute
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();

        // Standard Cache-Control header
        response.setHeader(
          "Cache-Control",
          `public, max-age=${this.maxAge}, s-maxage=${this.maxAge}, stale-while-revalidate=${this.staleWhileRevalidate}`
        );

        // Cloudflare specific headers
        response.setHeader("CDN-Cache-Control", `max-age=${this.maxAge}`);
        response.setHeader(
          "Cloudflare-CDN-Cache-Control",
          `max-age=${this.maxAge}`
        );

        // Vary header for proper cache key
        response.setHeader("Vary", "Accept-Encoding");
      })
    );
  }
}

/**
 * Interceptor to bypass cache (for authenticated/dynamic endpoints)
 */
@Injectable()
export class NoCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        response.setHeader(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, private"
        );
        response.setHeader("CDN-Cache-Control", "no-store");
        response.setHeader("Cloudflare-CDN-Cache-Control", "no-store");
      })
    );
  }
}
