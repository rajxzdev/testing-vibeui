import { NextResponse } from 'next/server';
import templates from '@/lib/templates.json';
import { getUser } from '@/lib/db';
import { currentUserId } from '@/lib/auth';

export async function GET(req, ctx) {
  const params = await ctx.params;
  const t = templates.find((x) => String(x.id) === String(params.id) || x.slug === params.id);
  if (!t) return NextResponse.json({ success: false, error: 'Template tidak ditemukan' }, { status: 404 });
  if (t.is_premium) {
    let u = null;
    try { u = await getUser(await currentUserId(req)); } catch {}
    const allowed = u && (u.tier === 'pro' || u.tier === 'starter' || ['owner', 'tester', 'maintainer'].includes(u.role));
    if (!allowed) return NextResponse.json({ success: false, code: 'LOCKED', error: '🔒 Template premium. Upgrade Starter/Pro atau beli lisensi single Rp 10.000.' }, { status: 402 });
  }
  return NextResponse.json({ success: true, template: t });
}
