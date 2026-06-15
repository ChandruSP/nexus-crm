import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      priority: body.priority ?? 'Medium',
      status: body.status ?? 'To Do',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      assignee: body.assignee,
      category: body.category,
      comments: body.comments ?? [],
      accountId: id,
    },
  });
  return NextResponse.json(task, { status: 201 });
}
