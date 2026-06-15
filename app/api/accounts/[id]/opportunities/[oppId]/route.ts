import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ oppId: string }> }) {
  const { oppId } = await params;
  const body = await req.json();
  const opp = await prisma.opportunity.update({
    where: { id: oppId },
    data: {
      title: body.title,
      stage: body.stage,
      value: body.value,
      probability: body.probability,
      closeDate: body.closeDate ? new Date(body.closeDate) : null,
      notes: body.notes,
    },
  });
  return NextResponse.json(opp);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ oppId: string }> }) {
  const { oppId } = await params;
  await prisma.opportunity.delete({ where: { id: oppId } });
  return new NextResponse(null, { status: 204 });
}
