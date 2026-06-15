import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;
  const body = await req.json();
  const contact = await prisma.contact.update({
    where: { id: contactId },
    data: {
      name: body.name,
      role: body.role,
      email: body.email,
      phone: body.phone,
      whatsapp: body.whatsapp,
      isPrimary: body.isPrimary,
      notes: body.notes,
    },
  });
  return NextResponse.json(contact);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;
  await prisma.contact.delete({ where: { id: contactId } });
  return new NextResponse(null, { status: 204 });
}
