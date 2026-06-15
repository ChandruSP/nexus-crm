import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const opp = await prisma.opportunity.create({
    data: {
      title: body.title,
      stage: body.stage ?? 'Prospecting',
      value: body.value ?? 0,
      probability: body.probability ?? 25,
      closeDate: body.closeDate ? new Date(body.closeDate) : null,
      notes: body.notes,
      accountId: id,
    },
  });
  return NextResponse.json(opp, { status: 201 });
}
