import { NextResponse } from 'next/server';
import { getSettings, setSetting } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() { return NextResponse.json({ success: true, settings: await getSettings() }); }
export async function POST(req) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  if (b.maintenance !== undefined) await setSetting('maintenance', String(!!b.maintenance));
  if (b.maintenance_message) await setSetting('maintenance_message', b.maintenance_message);
  return NextResponse.json({ success: true, settings: await getSettings() });
}
