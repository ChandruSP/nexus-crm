import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  await prisma.pastProject.delete({ where: { id: projectId } });
  return new NextResponse(null, { status: 204 });
}
