import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE = 'nexus-session';
const MAX_AGE = 8 * 60 * 60; // 8 hours

// POST — create session from MSAL token
export async function POST(req: NextRequest) {
  const { accessToken, name, email } = await req.json();
  if (!accessToken) return NextResponse.json({ error: 'missing_token' }, { status: 400 });

  // Verify the token is real by hitting Graph
  const me = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!me.ok) return NextResponse.json({ error: 'invalid_token' }, { status: 401 });

  const jwt = await new SignJWT({ name, email, accessToken })
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

// GET — return current session user (for client components)
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
