import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      title:       body.title,
      description: body.description ?? null,
      priority:    body.priority ?? 'Medium',
      status:      body.status   ?? 'To do',
      dueDate:     body.dueDate  ? new Date(body.dueDate) : null,
      assignee:    body.assignee ?? null,
      category:    body.category ?? null,
      departmentId: params.id,
    },
  });
  return NextResponse.json(task, { status: 201 });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const tasks = await prisma.task.findMany({
    where: { departmentId: params.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(tasks);
}
