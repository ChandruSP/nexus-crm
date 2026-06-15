import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_CONFIG: Record<string, string[]> = {
  industries: ['Banking & Finance','Supply Chain & Logistics','Healthcare & Life Sciences','Media & Entertainment','Technology','Manufacturing','Retail','Real Estate','Education','Government','Telecom','Energy'],
  teamMembers: ['Priya Nair','Dev Sharma','Tanvi Kapila','Tech Team','Finance'],
  oppStages: ['Prospecting','Qualified','Proposal','Negotiation','Closed Won','Closed Lost'],
  accountGroups: [],
};

export async function GET() {
  const rows = await prisma.config.findMany();
  const config = { ...DEFAULT_CONFIG };
  for (const row of rows) {
    config[row.key] = row.values;
  }
  return NextResponse.json(config);
}

export async function PATCH(req: Request) {
  const body: { key: string; values: string[] } = await req.json();
  const row = await prisma.config.upsert({
    where: { key: body.key },
    update: { values: body.values },
    create: { key: body.key, values: body.values },
  });
  return NextResponse.json(row);
}
