import { NextRequest, NextResponse } from 'next/server';

const PUBLIC = ['/login', '/auth/callback', '/api/session', '/api/auth'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Check session cookie (MSAL flow)
  if (request.cookies.get('nexus-session')) return NextResponse.next();

  // Redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
