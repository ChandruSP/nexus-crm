import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const project = await prisma.pastProject.create({
    data: {
      name: body.name,
      revenue: body.revenue ?? 0,
      year: body.year ?? new Date().getFullYear(),
      description: body.description,
      accountId: id,
    },
  });
  return NextResponse.json(project, { status: 201 });
}
