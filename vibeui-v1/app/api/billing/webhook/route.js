import { NextResponse } from 'next/server';
import { setTier, addBonus, logError } from '@/lib/db';

export async function POST(req) {
  let body = {}; try { body = await req.json(); } catch {}
  const token = req.headers.get('x-webhook-token') || body.token || body.webhook_token;
  if (process.env.PAKASIR_WEBHOOK_TOKEN && token !== process.env.PAKASIR_WEBHOOK_TOKEN) {
    await logError('webhook', body.order_id || '-', 'token mismatch');
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 });
  }
  const status = String(body.status || '').toLowerCase();
  const orderId = body.order_id || '';
  if (!['paid', 'completed', 'success'].includes(status))
    return NextResponse.json({ ok: true, ignored: status });

  try {
    let plan = null, userId = null;
    try {
      const { sql } = await import('@vercel/postgres');
      const { rows } = await sql`SELECT * FROM invoices WHERE order_id=${orderId}`;
      if (rows[0]) { plan = rows[0].plan; userId = rows[0].clerk_user_id; }
      await sql`UPDATE invoices SET status='paid' WHERE order_id=${orderId}`;
    } catch (e) { await logError('webhook-db', orderId, e.message); }

    if (!plan) { const m = orderId.match(/^vibeui-([a-z_]+)-/); plan = m?.[1]; }
    if (!userId) return NextResponse.json({ ok: false, error: 'user tidak ditemukan, dicatat di log' }, { status: 202 });

    if (plan === 'starter' || plan === 'pro') await setTier(userId, plan, 30);
    else if (plan === 'booster') await addBonus(userId, 25);

    return NextResponse.json({ ok: true, applied: plan, userId });
  } catch (e) {
    await logError('webhook', orderId, e.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
