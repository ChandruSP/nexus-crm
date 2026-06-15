import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const body = await req.json();
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: body.title,
      description: body.description,
      priority: body.priority,
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      assignee: body.assignee,
      category: body.category,
      comments: body.comments,
    },
  });
  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  await prisma.task.delete({ where: { id: taskId } });
  return new NextResponse(null, { status: 204 });
}
