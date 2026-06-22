import { handlers } from '@/auth';

export async function GET(req: Request) {
  try {
    return await handlers.GET(req);
  } catch (e: any) {
    console.error('[AUTH ERROR]', e?.message, e?.stack);
    return Response.json({ error: e?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    return await handlers.POST(req);
  } catch (e: any) {
    console.error('[AUTH ERROR]', e?.message, e?.stack);
    return Response.json({ error: e?.message }, { status: 500 });
  }
}
