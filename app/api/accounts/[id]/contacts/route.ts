import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const contact = await prisma.contact.create({
    data: {
      name: body.name,
      role: body.role,
      email: body.email,
      phone: body.phone,
      isPrimary: body.isPrimary ?? false,
      notes: body.notes,
      accountId: id,
    },
  });
  return NextResponse.json(contact, { status: 201 });
}
