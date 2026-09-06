import { NextResponse } from 'next/server';
import { setTier, addBonus, logError, getUser } from '@/lib/db';
import { currentUserId } from '@/lib/auth';

// Tombol rahasia "Cek Status Transaksi": tembak langsung API Pakasir.
export async function POST(req) {
  let body = {}; try { body = await req.json(); } catch {}
  req.__body = body;
  const userId = await currentUserId(req);
  const slug = process.env.PAKASIR_PROJECT_SLUG, key = process.env.PAKASIR_API_KEY;
  if (!slug || !key || key.includes('xxx'))
    return NextResponse.json({ success: false, error: 'Pakasir belum dikonfigurasi.' }, { status: 501 });

  let pending = [];
  try {
    const { sql } = await import('@vercel/postgres');
    const { rows } = await sql`SELECT * FROM invoices WHERE clerk_user_id=${userId} AND status='pending' ORDER BY created_at DESC LIMIT 5`;
    pending = rows;
  } catch (e) { await logError('sync-db', userId, e.message); }
  if (body.orderId) pending.unshift({ order_id: body.orderId, plan: (body.orderId.match(/^vibeui-([a-z_]+)-/) || [])[1], amount: body.amount });

  let applied = null;
  for (const inv of pending) {
    try {
      const r = await fetch(`https://pakasir.zone.id/api/transactiondetail?project=${slug}&amount=${inv.amount}&order_id=${encodeURIComponent(inv.order_id)}&api_key=${key}`);
      const j = await r.json();
      if (String(j?.transaction?.status).toLowerCase() === 'completed') {
        if (inv.plan === 'starter' || inv.plan === 'pro') await setTier(userId, inv.plan, 30);
        else if (inv.plan === 'booster') await addBonus(userId, 25);
        applied = inv.plan;
        try { const { sql } = await import('@vercel/postgres'); await sql`UPDATE invoices SET status='paid' WHERE order_id=${inv.order_id}`; } catch {}
        break;
      }
    } catch (e) { await logError('sync', inv.order_id, e.message); }
  }
  const u = await getUser(userId).catch(() => null);
  return NextResponse.json({ success: true, applied, tier: u?.tier, message: applied ? `Pembayaran ditemukan! Akun kamu naik ke ${applied}.` : 'Belum ada transaksi lunas yang terdeteksi.' });
}
