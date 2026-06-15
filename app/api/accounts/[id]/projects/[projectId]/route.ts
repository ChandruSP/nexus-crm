import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();
  const project = await prisma.pastProject.update({
    where: { id: projectId },
    data: {
      name: body.name,
      revenue: body.revenue,
      year: body.year,
      description: body.description,
    },
  });
  return NextResponse.json(project);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  await prisma.pastProject.delete({ where: { id: projectId } });
  return new NextResponse(null, { status: 204 });
}
