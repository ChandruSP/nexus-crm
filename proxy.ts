import { auth } from '@/auth';

export const proxy = auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isLoginPage = nextUrl.pathname === '/login';
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth');

  if (isApiAuth) return;
  if (isLoginPage && isLoggedIn) {
    return Response.redirect(new URL('/', nextUrl));
  }
  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(new URL('/login', nextUrl));
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
