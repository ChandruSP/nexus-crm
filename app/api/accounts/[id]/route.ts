import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await prisma.account.findUnique({
    where: { id },
    include: { contacts: true, tasks: true, opportunities: true, pastProjects: true, group: true },
  });
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(account);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const account = await prisma.account.update({
    where: { id },
    data: {
      name: body.name,
      industry: body.industry,
      segment: body.segment,
      owner: body.owner,
      location: body.location,
      website: body.website,
      description: body.description,
      groupId: body.groupId !== undefined ? (body.groupId ?? null) : undefined,
    },
    include: { contacts: true, tasks: true, opportunities: true, pastProjects: true, group: true },
  });
  return NextResponse.json(account);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.account.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
