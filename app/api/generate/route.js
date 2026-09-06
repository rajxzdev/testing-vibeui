import { NextResponse } from 'next/server';
import { sanitizePrompt, validRefUrl, scrapeReference, streamOpenRouter } from '@/lib/ai';
import { consumeQuota, getUser, isUnlimited, getGlobalPool, logError, getSettings, addBonus } from '@/lib/db';
import { currentUserId, originGuard, verifyTurnstile } from '@/lib/auth';
import { GLOBAL_POOL_CAP, COST_FAST, COST_LIVE, genCost } from '@/lib/utils';
import templates from '@/lib/templates.json';

export const runtime = 'nodejs';
export const maxDuration = 60;

const enc = new TextEncoder();
const sse = (obj) => enc.encode(`data: ${JSON.stringify(obj)}\n\n`);

export async function POST(req) {
  if (!originGuard(req)) return NextResponse.json({ success: false, error: 'Origin ditolak.' }, { status: 403 });

  let body = {};
  try { body = await req.json(); } catch {}
  req.__body = body;

  const settings = await getSettings().catch(() => ({ maintenance: false }));
  if (settings.maintenance) return NextResponse.json({ success: false, error: settings.maintenance_message }, { status: 503 });

  const s = sanitizePrompt(body.userPrompt || body.prompt);
  if (!s.ok) return NextResponse.json({ success: false, error: s.error }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for') || '';
  if (!(await verifyTurnstile(body.turnstileToken, ip)))
    return NextResponse.json({ success: false, error: 'Verifikasi Captcha gagal. Coba lagi.' }, { status: 403 });

  const userId = await currentUserId(req);

  // ---- mode & biaya kredit ----
  // 'fast' = 1 kredit (hasil langsung), 'live' = 2 kredit (streaming progres detail)
  const genMode = body.genMode === 'live' ? 'live' : 'fast';
  const cost = body.mode === 'heal' ? COST_FAST : genCost(genMode);

  // ---- kuota (fail-safe bila DB bermasalah) ----
  let user = null, dbDown = false, charged = 0;
  try {
    const q = await consumeQuota(userId, cost);
    user = q.user;
    charged = q.cost ?? 0;
    if (!q.ok) {
      if (q.reason === 'global') return NextResponse.json({
        success: false, code: 'GLOBAL_CAP',
        error: `🌍 Kuota gratis sedunia hari ini (${GLOBAL_POOL_CAP}) sudah habis. Upgrade untuk lanjut tanpa antre.`,
      }, { status: 429 });
      const need = q.needed ?? cost;
      return NextResponse.json({
        success: false, code: 'NO_QUOTA', needed: need,
        error: need > 1
          ? `⚠️ Kredit tidak cukup. Mode "Generate Berjalan" butuh ${need} kredit — sisa Anda kurang. Pakai mode Cepat (1 kredit), tonton iklan untuk +2, atau upgrade paket.`
          : '⚠️ Kuota harian habis! Tonton iklan untuk +2 generasi atau upgrade paket.',
      }, { status: 429 });
    }
  } catch (e) { dbDown = true; await logError('quota', userId, e.message); }

  const tier = user?.tier || 'free';
  const role = user?.role || 'user';
  const mode = body.mode === 'heal' ? 'heal' : 'generate';
  if (mode === 'heal' && !(tier === 'pro' || ['owner', 'tester', 'maintainer'].includes(role)))
    return NextResponse.json({ success: false, code: 'PRO_ONLY', error: '🔒 AI Self-Healing khusus Paket Pro (Rp 49.000/bln).' }, { status: 402 });

  const model = (tier === 'pro' || role === 'tester')
    ? (process.env.OPENROUTER_PRO_MODEL || 'meta-llama/llama-3.3-70b-instruct:free')
    : (process.env.OPENROUTER_FREE_MODEL || 'meta-llama/llama-3.1-8b-instruct:free');

  // ---- template sebagai REFERENSI (bukan langsung ke kanvas) ----
  let referenceHtml = '';
  let refTemplateName = null;
  if (body.templateId) {
    const t = templates.find((x) => String(x.id) === String(body.templateId) || x.slug === body.templateId);
    if (t) {
      const locked = t.is_premium && !(tier === 'pro' || tier === 'starter' || ['owner', 'tester', 'maintainer'].includes(role));
      if (locked) return NextResponse.json({ success: false, code: 'LOCKED', error: '🔒 Template premium. Upgrade Starter/Pro untuk memakainya sebagai referensi.' }, { status: 402 });
      referenceHtml = t.code_html;
      refTemplateName = t.template_name;
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (o) => { try { controller.enqueue(sse(o)); } catch (_) {} };
      try {
        send({ type: 'status', stage: 'start', message: 'Menyiapkan permintaan…', genMode, cost: charged });
        if (refTemplateName) send({ type: 'status', stage: 'reference', message: `Memakai "${refTemplateName}" sebagai referensi gaya` });

        // scraper URL referensi
        let referenceText = '';
        const ref = validRefUrl(body.referenceUrl);
        if (ref) {
          send({ type: 'status', stage: 'scrape', message: 'Membaca URL referensi…' });
          const sc = await scrapeReference(ref);
          if (sc.ok) { referenceText = sc.text; send({ type: 'status', stage: 'scrape-ok', message: 'Referensi berhasil dibaca' }); }
          else send({ type: 'notice', message: sc.error });
        } else if (body.referenceUrl) send({ type: 'notice', message: 'URL referensi tidak valid, diabaikan.' });

        send({ type: 'status', stage: 'thinking', message: 'AI menyusun struktur halaman…' });

        let chars = 0;
        const r = await streamOpenRouter({
          prompt: s.prompt, model, referenceText, mode,
          targetHtml: body.targetHtml || '', referenceHtml,
          onDelta: (piece, full) => {
            chars = full.length;
            // hanya mode "berjalan" yang menampilkan progres per token
            if (genMode === 'live') send({ type: 'delta', chars, piece: piece.slice(0, 400) });
          },
        });

        if (!r.ok) {
          try { if (!dbDown && charged > 0) await addBonus(userId, charged); } catch (_) {}
          await logError('openrouter', userId, r.detail || r.error);
          send({ type: 'error', error: r.error });
          controller.close(); return;
        }

        send({ type: 'status', stage: 'render', message: 'Merender pratinjau…' });
        const fresh = dbDown ? null : await getUser(userId).catch(() => null);
        send({
          type: 'done', html: r.html, mode, model, genMode, cost: charged,
          quota: fresh ? {
            daily: fresh.daily_quota, bonus: fresh.bonus_quota, monthly: fresh.monthly_quota,
            tier: fresh.tier, role: fresh.role, unlimited: isUnlimited(fresh),
            adClaimed: fresh.ad_claimed_today,
            pool: await getGlobalPool().catch(() => 0), poolCap: GLOBAL_POOL_CAP,
          } : null,
        });
      } catch (e) {
        send({ type: 'error', error: 'Terjadi kesalahan tak terduga. Coba lagi.' });
      } finally { controller.close(); }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
