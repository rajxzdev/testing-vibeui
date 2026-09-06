import { NextResponse } from 'next/server';
import { getChangelogs, addChangelog, getLatestVersion, suggestNextVersion } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = await getChangelogs();
  const latest = await getLatestVersion();
  return NextResponse.json({
    success: true,
    items,
    latest,
    // saran versi berikutnya per jenis update
    next: {
      feature: await suggestNextVersion('feature'),
      fix: await suggestNextVersion('fix'),
      optimization: await suggestNextVersion('optimization'),
    },
  });
}

export async function POST(req) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  const { type = 'feature', title, body, version } = await req.json();
  if (!title) return NextResponse.json({ success: false, error: 'Judul wajib.' }, { status: 400 });
  if (version && !/^\d+\.\d+\.\d+$/.test(version))
    return NextResponse.json({ success: false, error: 'Format versi harus x.y.z (contoh 1.2.0).' }, { status: 400 });
  const items = await addChangelog(type, title, body || '', version);
  return NextResponse.json({ success: true, items, latest: await getLatestVersion() });
}
