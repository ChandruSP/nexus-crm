import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const departments = await prisma.department.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(departments);
}

export async function POST(req: Request) {
  const body = await req.json();
  const department = await prisma.department.create({
    data: { name: body.name, color: body.color, icon: body.icon, hasAccounts: body.hasAccounts ?? false },
  });
  return NextResponse.json(department, { status: 201 });
}
