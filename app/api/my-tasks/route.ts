import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function GET(req: NextRequest) {
  const token = req.cookies.get('nexus-session')?.value;
  if (!token) return NextResponse.json({ error: 'no_session' }, { status: 401 });

  let userName: string;
  try {
    const { payload } = await jwtVerify(token, secret());
    userName = payload.name as string;
  } catch {
    return NextResponse.json({ error: 'invalid_session' }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { assignee: userName },
    include: {
      account:    { select: { id: true, name: true, departmentId: true } },
      department: { select: { id: true, name: true, icon: true, color: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  // Fetch all departments to resolve dept for account tasks
  const departments = await prisma.department.findMany({ select: { id: true, name: true, icon: true, color: true } });
  const deptMap = Object.fromEntries(departments.map(d => [d.id, d]));

  const result = tasks.map(t => {
    const dept = t.department ?? (t.account ? deptMap[t.account.departmentId] : null);
    return {
      id:          t.id,
      title:       t.title,
      status:      t.status,
      priority:    t.priority,
      dueDate:     t.dueDate?.toISOString() ?? null,
      description: t.description ?? '',
      assignee:    t.assignee ?? '',
      comments:    t.comments ?? [],
      createdAt:   t.createdAt.getTime(),
      accountId:   t.accountId ?? '',
      accountName: t.account?.name ?? '',
      departmentId:   dept?.id   ?? '',
      departmentName: dept?.name ?? '',
      departmentIcon: dept?.icon ?? '',
      departmentColor: (dept as any)?.color ?? '',
    };
  });

  return NextResponse.json(result);
}
