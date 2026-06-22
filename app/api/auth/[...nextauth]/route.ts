import { handlers } from '@/auth';

const originalGET = handlers.GET;
const originalPOST = handlers.POST;

export async function GET(req: Request, ctx: any) {
  try {
    return await originalGET(req, ctx);
  } catch (e: any) {
    console.error('[AUTH ERROR]', e?.message, e?.stack);
    return Response.json({ error: e?.message }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: any) {
  try {
    return await originalPOST(req, ctx);
  } catch (e: any) {
    console.error('[AUTH ERROR]', e?.message, e?.stack);
    return Response.json({ error: e?.message }, { status: 500 });
  }
}
