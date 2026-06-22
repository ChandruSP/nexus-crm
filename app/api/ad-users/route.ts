import { auth } from '@/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  const accessToken = (session as any)?.accessToken;
  if (!accessToken) return Response.json([], { status: 401 });

  const q = req.nextUrl.searchParams.get('q') || '';
  const url = q
    ? `https://graph.microsoft.com/v1.0/me/people?$search="${encodeURIComponent(q)}"&$top=10&$filter=personType/class eq 'Person'`
    : `https://graph.microsoft.com/v1.0/me/people?$top=10&$filter=personType/class eq 'Person'`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await resp.json();
  const people = (data.value || []).map((p: any) => ({
    name: p.displayName,
    email: p.scoredEmailAddresses?.[0]?.address || '',
  }));
  return Response.json(people);
}
