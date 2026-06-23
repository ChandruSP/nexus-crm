import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const secret   = () => new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE   = 'nexus-session';
const MAX_AGE  = 8 * 60 * 60;
const TENANT   = process.env.NEXT_PUBLIC_AZURE_TENANT_ID!;
const CLIENT   = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!;
const SECRET   = process.env.AZURE_CLIENT_SECRET!;
const REDIRECT = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;

// Returns { accessToken, res } where res may have a Set-Cookie header with the refreshed session.
// Returns null if there is no valid session or the refresh token is missing/expired.
export async function getAccessToken(
  req: NextRequest,
  res: NextResponse,
): Promise<{ accessToken: string; res: NextResponse } | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;

  let payload: any;
  try {
    ({ payload } = await jwtVerify(token, secret()));
  } catch {
    return null;
  }

  const { accessToken, refreshToken, tokenExpiry, name, email } = payload as any;

  // If token is still valid for more than 5 minutes, use it as-is.
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry - 5 * 60 * 1000) {
    return { accessToken, res };
  }

  // Access token expired or about to expire — try to refresh.
  if (!refreshToken) return null;

  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     CLIENT,
        client_secret: SECRET,
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
        redirect_uri:  REDIRECT,
        scope:         'openid profile email User.Read People.Read',
      }),
    }
  );

  if (!tokenRes.ok) return null;

  const tokens = await tokenRes.json();
  const newAccessToken: string  = tokens.access_token;
  const newRefreshToken: string = tokens.refresh_token ?? refreshToken;
  const newExpiry: number       = Date.now() + (tokens.expires_in ?? 3600) * 1000;

  const newJwt = await new SignJWT({ name, email, accessToken: newAccessToken, refreshToken: newRefreshToken, tokenExpiry: newExpiry })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret());

  res.cookies.set(COOKIE, newJwt, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   MAX_AGE,
    path:     '/',
  });

  return { accessToken: newAccessToken, res };
}
