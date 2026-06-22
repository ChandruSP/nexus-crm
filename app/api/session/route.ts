import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const secret   = () => new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE   = 'nexus-session';
const MAX_AGE  = 8 * 60 * 60;
const TENANT   = process.env.NEXT_PUBLIC_AZURE_TENANT_ID!;
const CLIENT   = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!;
const SECRET   = process.env.AZURE_CLIENT_SECRET!;
const REDIRECT = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;

// POST — exchange PKCE code for tokens, create session
export async function POST(req: NextRequest) {
  const { code, verifier } = await req.json();
  if (!code || !verifier) return NextResponse.json({ error: 'missing_params' }, { status: 400 });

  // Exchange code for tokens at Microsoft's token endpoint
  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     CLIENT,
        client_secret: SECRET,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  REDIRECT,
        code_verifier: verifier,
        scope:         'openid profile email User.Read People.Read',
      }),
    }
  );

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return NextResponse.json({ error: err }, { status: 401 });
  }

  const tokens = await tokenRes.json();
  const accessToken: string = tokens.access_token;

  // Get user info from Graph
  const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) return NextResponse.json({ error: 'graph_me_failed' }, { status: 401 });
  const me = await meRes.json();

  const jwt = await new SignJWT({ name: me.displayName, email: me.userPrincipalName, accessToken })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret());

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, jwt, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   MAX_AGE,
    path:     '/',
  });
  return res;
}

// GET — return current session user
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null });
  try {
    const { payload } = await jwtVerify(token, secret());
    return NextResponse.json({ user: { name: payload.name, email: payload.email } });
  } catch {
    return NextResponse.json({ user: null });
  }
}

// DELETE — sign out
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', { maxAge: 0, path: '/' });
  return res;
}
