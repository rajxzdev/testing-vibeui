import { NextResponse } from 'next/server';
import { setTier, setRole, addBonus, getUser, listUsers, adminStats } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Daftar user langsung — admin tidak perlu copy-paste ID lagi. */
export async function GET(req) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  const q = req.nextUrl.searchParams.get('q') || '';
  const [users, stats] = await Promise.all([listUsers({ q }), adminStats()]);
  return NextResponse.json({ success: true, users, stats });
}

export async function POST(req) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  const { userId, tier, role, bonus, days } = await req.json();
  if (!userId) return NextResponse.json({ success: false, error: 'userId wajib.' }, { status: 400 });
  if (tier) await setTier(userId, tier, Math.min(Number(days) || 30, 30));
  if (role) await setRole(userId, role);
  if (bonus) await addBonus(userId, Number(bonus));
  return NextResponse.json({ success: true, user: await getUser(userId) });
}
