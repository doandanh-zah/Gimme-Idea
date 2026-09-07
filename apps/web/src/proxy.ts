import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set('x-gimme-locale', request.nextUrl.pathname.split('/')[1] === 'vi' ? 'vi' : 'en');
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ['/en/:path*', '/vi/:path*'] };
