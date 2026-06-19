import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('d') ?? '';
  const groups = await prisma.group.findMany({ where: { departmentId }, orderBy: { name: 'asc' } });
  return NextResponse.json(groups);
}

export async function POST(req: Request) {
  const body = await req.json();
  const group = await prisma.group.create({
    data: {
      name: body.name,
      industry: body.industry,
      description: body.description,
      departmentId: body.departmentId,
    },
  });
  return NextResponse.json(group, { status: 201 });
}
