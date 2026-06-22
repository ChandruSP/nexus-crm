import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  await prisma.task.delete({ where: { id: taskId } });
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const body = await req.json();
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(body.title       !== undefined && { title: body.title }),
      ...(body.status      !== undefined && { status: body.status }),
      ...(body.priority    !== undefined && { priority: body.priority }),
      ...(body.assignee    !== undefined && { assignee: body.assignee }),
      ...(body.dueDate     !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
      ...(body.description !== undefined && { description: body.description }),
    },
  });
  return NextResponse.json(task);
}
