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

  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json([]);

  // Try /users search first (works with User.Read.All or in some tenants with User.Read)
  const searchUrl = `https://graph.microsoft.com/v1.0/users?$search="displayName:${encodeURIComponent(q)}" OR "mail:${encodeURIComponent(q)}"&$top=15&$select=displayName,mail,userPrincipalName`;

  const resp = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ConsistencyLevel: 'eventual',
    },
  });

  if (resp.ok) {
    const data = await resp.json();
    const people = (data.value || []).map((p: any) => ({
      name:  p.displayName,
      email: p.mail || p.userPrincipalName || '',
    }));
    return NextResponse.json(people);
  }

  // Fallback: /me/people (requires People.Read)
  const peopleUrl = q
    ? `https://graph.microsoft.com/v1.0/me/people?$search="${encodeURIComponent(q)}"&$top=15`
    : `https://graph.microsoft.com/v1.0/me/people?$top=15`;

  const resp2 = await fetch(peopleUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, ConsistencyLevel: 'eventual' },
  });

  if (!resp2.ok) {
    const err = await resp2.text();
    return NextResponse.json({ error: err }, { status: resp2.status });
  }

  const data2 = await resp2.json();
  const people2 = (data2.value || []).map((p: any) => ({
    name:  p.displayName,
    email: p.scoredEmailAddresses?.[0]?.address || '',
  }));
  return NextResponse.json(people2);
}
