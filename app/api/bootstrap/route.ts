import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_CONFIG: Record<string, string[]> = {
  industries:  ['Banking & Finance','Supply Chain & Logistics','Healthcare & Life Sciences','Media & Entertainment','Technology','Manufacturing','Retail','Real Estate','Education','Government','Telecom','Energy'],
  teamMembers: ['Priya Nair','Dev Sharma','Tanvi Kapila','Tech Team','Finance'],
  oppStages:   ['Prospecting','Qualified','Proposal','Negotiation','Closed Won','Closed Lost'],
  accountGroups: [],
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('d') ?? '';

  // Run all 3 queries in parallel — single cold start, one connection
  const [accounts, groups, configRows] = await Promise.all([
    prisma.account.findMany({
      where: { departmentId },
      include: { contacts: true, tasks: true, opportunities: true, pastProjects: true, group: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.group.findMany({ where: { departmentId }, orderBy: { name: 'asc' } }),
    prisma.config.findMany({ where: { departmentId } }),
  ]);

  const config = { ...DEFAULT_CONFIG };
  for (const row of configRows) config[row.key] = row.values;

  return NextResponse.json({ accounts, groups, config });
}
