import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  const [departments, accounts, tasks, contacts, opportunities, projects] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
    prisma.account.findMany({ include: { department: true, group: true }, orderBy: { name: 'asc' } }),
    prisma.task.findMany({ include: { account: { include: { department: true } } }, orderBy: { dueDate: 'asc' } }),
    prisma.contact.findMany({ include: { account: { include: { department: true } } }, orderBy: { name: 'asc' } }),
    prisma.opportunity.findMany({ include: { account: { include: { department: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.pastProject.findMany({ include: { account: { include: { department: true } } }, orderBy: { year: 'desc' } }),
  ]);

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    departments.map(d => ({
      ID: d.id,
      Name: d.name,
      Icon: d.icon,
      Color: d.color,
      'KAM Mode': d.hasAccounts ? 'Yes' : 'No',
      'Created At': d.createdAt.toISOString().slice(0, 10),
    }))
  ), 'Departments');

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    accounts.map(a => ({
      ID: a.id,
      Department: a.department?.name ?? '',
      Group: a.group?.name ?? '',
      Name: a.name,
      Industry: a.industry,
      Segment: a.segment,
      Owner: a.owner,
      Location: a.location ?? '',
      Website: a.website ?? '',
      Description: a.description ?? '',
      'Created At': a.createdAt.toISOString().slice(0, 10),
    }))
  ), 'Accounts');

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    tasks.map(t => ({
      ID: t.id,
      Department: t.account?.department?.name ?? '',
      Account: t.account?.name ?? '',
      Title: t.title,
      Status: t.status,
      Priority: t.priority,
      Category: t.category ?? '',
      'Due Date': t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '',
      Assignee: t.assignee ?? '',
      Description: t.description ?? '',
    }))
  ), 'Tasks');

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    contacts.map(c => ({
      ID: c.id,
      Department: c.account?.department?.name ?? '',
      Account: c.account?.name ?? '',
      Name: c.name,
      Role: c.role ?? '',
      Email: c.email ?? '',
      Phone: c.phone ?? '',
      WhatsApp: c.whatsapp ? 'Yes' : 'No',
      'Primary Contact': c.isPrimary ? 'Yes' : 'No',
      Notes: c.notes ?? '',
    }))
  ), 'Contacts');

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    opportunities.map(o => ({
      ID: o.id,
      Department: o.account?.department?.name ?? '',
      Account: o.account?.name ?? '',
      Title: o.title,
      Stage: o.stage,
      Value: o.value,
      Probability: o.probability,
      'Close Date': o.closeDate ? new Date(o.closeDate).toISOString().slice(0, 10) : '',
      'Next Step': o.nextStep ?? '',
      Notes: o.notes ?? '',
    }))
  ), 'Opportunities');

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    projects.map(p => ({
      ID: p.id,
      Department: p.account?.department?.name ?? '',
      Account: p.account?.name ?? '',
      Name: p.name,
      Revenue: p.revenue,
      Year: p.year,
      Description: p.description ?? '',
    }))
  ), 'Past Projects');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="nexus-export-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
