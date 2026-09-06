import { NextResponse } from 'next/server';
import { claimAdBonus, getUser } from '@/lib/db';
import { currentUserId, originGuard } from '@/lib/auth';

export async function POST(req) {
  if (!originGuard(req)) return NextResponse.json({ success: false, error: 'Origin ditolak.' }, { status: 403 });
  let body = {}; try { body = await req.json(); } catch {}
  req.__body = body;
  if ((body.watchedMs ?? 0) < 10000)
    return NextResponse.json({ success: false, error: 'Iklan minimal harus 10 detik.' }, { status: 400 });
  const userId = await currentUserId(req);
  try {
    const r = await claimAdBonus(userId);
    if (!r.ok) return NextResponse.json({ success: false, error: '🔒 Bonus iklan hanya 1x per hari. Balik lagi besok ya!' }, { status: 429 });
    const u = await getUser(userId);
    return NextResponse.json({ success: true, message: '+2 generasi berhasil ditambahkan!', quota: { daily: u.daily_quota, bonus: u.bonus_quota, adClaimed: true } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Database sibuk, coba lagi sebentar.' }, { status: 500 });
  }
}
