import { NextResponse } from 'next/server';
import { resetDaily } from '@/lib/db';

async function handle(req) {
  const auth = req.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: 'CRON_SECRET belum diset.' }, { status: 500 });
  if (auth !== `Bearer ${secret}`) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const r = await resetDaily();
  return NextResponse.json({ ok: true, message: 'Kuota harian dipulihkan ke 5/5 & gembok iklan dibuka.', ...r });
}
export const GET = handle;
export const POST = handle;
