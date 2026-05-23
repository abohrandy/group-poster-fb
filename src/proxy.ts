import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  const path = request.nextUrl.pathname;

  // Paths starting with /dashboard need protection
  if (path.startsWith('/dashboard')) {
    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Paths for login and signup should redirect to dashboard if user already has cookie
  if (path === '/login' || path === '/signup') {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
