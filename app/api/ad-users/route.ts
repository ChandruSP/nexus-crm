import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function GET(req: NextRequest) {
  const token = req.cookies.get('nexus-session')?.value;
  if (!token) return NextResponse.json({ error: 'no_session' }, { status: 401 });

  let accessToken: string;
  try {
    const { payload } = await jwtVerify(token, secret());
    accessToken = payload.accessToken as string;
  } catch {
    return NextResponse.json({ error: 'invalid_session' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q') || '';
  const url = q
    ? `https://graph.microsoft.com/v1.0/me/people?$search="${encodeURIComponent(q)}"&$top=15`
    : `https://graph.microsoft.com/v1.0/me/people?$top=15`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, ConsistencyLevel: 'eventual' },
  });
  if (!resp.ok) {
    const err = await resp.text();
    return NextResponse.json({ error: err }, { status: resp.status });
  }
  const data = await resp.json();
  const people = (data.value || []).map((p: any) => ({
    name:  p.displayName,
    email: p.scoredEmailAddresses?.[0]?.address || '',
  }));
  return NextResponse.json(people);
}
