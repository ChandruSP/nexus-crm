import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('d') ?? '';
  const accounts = await prisma.account.findMany({
    where: { departmentId },
    include: { contacts: true, tasks: true, opportunities: true, pastProjects: true, group: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const account = await prisma.account.create({
    data: {
      name: body.name,
      industry: body.industry,
      segment: body.segment,
      owner: body.owner,
      location: body.location,
      website: body.website,
      description: body.description,
      groupId: body.groupId ?? null,
      departmentId: body.departmentId,
    },
    include: { contacts: true, tasks: true, opportunities: true, pastProjects: true, group: true },
  });
  return NextResponse.json(account, { status: 201 });
}
