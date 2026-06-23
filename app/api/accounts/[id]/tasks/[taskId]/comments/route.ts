import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const comment = await req.json();
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { comments: { push: JSON.stringify(comment) } },
  });
  return NextResponse.json(task);
}
