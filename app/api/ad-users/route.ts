import { auth } from '@/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  const accessToken = (session as any)?.accessToken;

  if (!accessToken) {
    return Response.json({ error: 'no_token' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q') || '';

  // Use /me/people for people the user interacts with (no admin consent needed)
  // $search and $filter cannot be combined, use only $search when query provided
  const url = q
    ? `https://graph.microsoft.com/v1.0/me/people?$search="${encodeURIComponent(q)}"&$top=15`
    : `https://graph.microsoft.com/v1.0/me/people?$top=15`;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ConsistencyLevel: 'eventual',
    },
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error('Graph API error:', resp.status, err);
    return Response.json({ error: err }, { status: resp.status });
  }

  const data = await resp.json();
  const people = (data.value || []).map((p: any) => ({
    name: p.displayName,
    email: p.scoredEmailAddresses?.[0]?.address || '',
  }));

  return Response.json(people);
}
