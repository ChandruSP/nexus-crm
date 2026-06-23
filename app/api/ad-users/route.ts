import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/getAccessToken';

export async function GET(req: NextRequest) {
  const baseRes = NextResponse.next();
  const result  = await getAccessToken(req, baseRes);
  if (!result) return NextResponse.json({ error: 'no_session' }, { status: 401 });

  const { accessToken, res: updatedRes } = result;

  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q) {
    const empty = NextResponse.json([]);
    updatedRes.cookies.getAll().forEach(c => empty.cookies.set(c.name, c.value));
    return empty;
  }

  const searchUrl = `https://graph.microsoft.com/v1.0/users?$search="displayName:${encodeURIComponent(q)}" OR "mail:${encodeURIComponent(q)}"&$top=15&$select=displayName,mail,userPrincipalName`;

  const resp = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, ConsistencyLevel: 'eventual' },
  });

  if (resp.ok) {
    const data   = await resp.json();
    const people = (data.value || []).map((p: any) => ({
      name:  p.displayName,
      email: p.mail || p.userPrincipalName || '',
    }));
    const jsonRes = NextResponse.json(people);
    updatedRes.cookies.getAll().forEach(c => jsonRes.cookies.set(c.name, c.value));
    return jsonRes;
  }

  // Fallback: /me/people (requires People.Read)
  const peopleUrl = `https://graph.microsoft.com/v1.0/me/people?$search="${encodeURIComponent(q)}"&$top=15`;
  const resp2 = await fetch(peopleUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, ConsistencyLevel: 'eventual' },
  });

  if (!resp2.ok) {
    const err = await resp2.text();
    return NextResponse.json({ error: err }, { status: resp2.status });
  }

  const data2  = await resp2.json();
  const people2 = (data2.value || []).map((p: any) => ({
    name:  p.displayName,
    email: p.scoredEmailAddresses?.[0]?.address || '',
  }));
  const jsonRes2 = NextResponse.json(people2);
  updatedRes.cookies.getAll().forEach(c => jsonRes2.cookies.set(c.name, c.value));
  return jsonRes2;
}
