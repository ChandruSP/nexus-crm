import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const tasks = await prisma.task.findMany({
    include: { account: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(tasks);
}
