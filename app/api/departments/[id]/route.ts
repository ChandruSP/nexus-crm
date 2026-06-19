import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const department = await prisma.department.update({
    where: { id },
    data: { name: body.name, color: body.color, icon: body.icon },
  });
  return NextResponse.json(department);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.department.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
