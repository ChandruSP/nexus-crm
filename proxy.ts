import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow auth API routes and login page
  if (pathname.startsWith('/api/auth') || pathname === '/login') {
    return NextResponse.next();
  }

  // NextAuth v5 uses different cookie names for HTTP vs HTTPS
  const sessionToken =
    request.cookies.get('__Secure-authjs.session-token') ??
    request.cookies.get('authjs.session-token');

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
