import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin protection - check cookie set on login
  if (pathname.startsWith('/admin') && pathname !== '/admin') {
    const token = request.cookies.get('bf_admin_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // User route protection
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/editor')) {
    const token = request.cookies.get('bf_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/editor/:path*'],
};
