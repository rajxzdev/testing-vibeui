import { NextResponse } from 'next/server';
import { PLANS } from '@/lib/plans';
import { currentUserId, originGuard } from '@/lib/auth';
import { logError } from '@/lib/db';

export async function POST(req) {
  if (!originGuard(req)) return NextResponse.json({ success: false, error: 'Origin ditolak.' }, { status: 403 });
  let body = {}; try { body = await req.json(); } catch {}
  req.__body = body;
  const plan = PLANS[body.plan];
  if (!plan) return NextResponse.json({ success: false, error: 'Paket tidak dikenal.' }, { status: 400 });

  const userId = await currentUserId(req);
  const orderId = `vibeui-${plan.id}-${userId.slice(-8)}-${Date.now()}`;
  const slug = process.env.PAKASIR_PROJECT_SLUG;
  const apiKey = process.env.PAKASIR_API_KEY;
  const base = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || 'http://localhost:3000';

  if (!slug || !apiKey || apiKey.includes('xxx')) {
    return NextResponse.json({ success: false, error: 'Gateway Pakasir belum dikonfigurasi (isi PAKASIR_API_KEY & PAKASIR_PROJECT_SLUG).' }, { status: 501 });
  }

  try {
    const url = `https://pakasir.zone.id/pay/${slug}/${plan.price}?order_id=${encodeURIComponent(orderId)}&qris_only=0&redirect=${encodeURIComponent(base + '/dashboard?paid=1')}`;
    try {
      const { sql } = await import('@vercel/postgres');
      await sql`INSERT INTO invoices (order_id, clerk_user_id, plan, amount, status)
                VALUES (${orderId},${userId},${plan.id},${plan.price},'pending')
                ON CONFLICT (order_id) DO NOTHING`;
    } catch (e) { await logError('invoice-insert', orderId, e.message); }
    return NextResponse.json({ success: true, orderId, amount: plan.price, paymentUrl: url });
  } catch (e) {
    await logError('checkout', orderId, e.message);
    return NextResponse.json({ success: false, error: 'Gagal membuat invoice.' }, { status: 500 });
  }
}
