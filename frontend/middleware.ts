import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const { pathname } = req.nextUrl;

  // Check maintenance mode - redirect all non-API/non-static to /maintenance
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  if (
    maintenanceMode &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/maintenance') &&
    !pathname.startsWith('/_next') &&
    pathname !== '/favicon.ico'
  ) {
    const url = req.nextUrl.clone();
    url.pathname = '/maintenance';
    return NextResponse.rewrite(url);
  }

  const isMobileHost = host.startsWith('mobile.gimmeidea.com') || host.startsWith('www.mobile.gimmeidea.com');

  if (isMobileHost && pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/mobile';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
