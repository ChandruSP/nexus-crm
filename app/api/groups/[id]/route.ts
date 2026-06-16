import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await prisma.group.findUnique({ where: { id }, include: { accounts: true } });
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(group);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const group = await prisma.group.update({
    where: { id },
    data: {
      name: body.name,
      industry: body.industry,
      description: body.description,
    },
  });
  return NextResponse.json(group);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Unlink accounts before deleting
  await prisma.account.updateMany({ where: { groupId: id }, data: { groupId: null } });
  await prisma.group.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
