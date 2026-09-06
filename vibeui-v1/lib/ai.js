import { MAX_PROMPT } from './utils';

const URL_RE = /(https?:\/\/|www\.)[^\s]+/gi;
const BAD_RE = /(<script|javascript:|onerror\s*=|onload\s*=|drop\s+table|union\s+select|insert\s+into|delete\s+from|--\s|\/\*|ignore\s+(all\s+)?previous|system\s+prompt|you\s+are\s+now)/i;

export function sanitizePrompt(raw = '') {
  let p = String(raw).trim().slice(0, MAX_PROMPT);
  if (!p) return { ok: false, error: 'Prompt kosong.' };
  if (BAD_RE.test(p)) return { ok: false, error: 'Prompt ditolak: terdeteksi skrip/injeksi berbahaya.' };
  if (URL_RE.test(p)) return { ok: false, error: 'Dilarang menempel URL di kolom prompt. Pakai kolom "URL Referensi" resmi.' };
  p = p.replace(/[<>]/g, '');
  return { ok: true, prompt: p };
}

const ALLOWED_REF_PROTO = /^https:\/\//i;
export function validRefUrl(u = '') {
  if (!u) return null;
  if (!ALLOWED_REF_PROTO.test(u)) return null;
  try { const x = new URL(u); if (/localhost|127\.0\.0\.1|169\.254|\.local$/i.test(x.hostname)) return null; return x.toString(); }
  catch { return null; }
}

/** Scraper gratis via Jina Reader, hard timeout 4 detik. */
export async function scrapeReference(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch('https://r.jina.ai/' + url, { signal: ctrl.signal, headers: { 'x-no-cache': 'true' } });
    if (!r.ok) throw new Error('status ' + r.status);
    const txt = await r.text();
    return { ok: true, text: txt.slice(0, 4000) };
  } catch (e) {
    return { ok: false, error: 'Gagal memuat referensi, beralih ke mode teks' };
  } finally { clearTimeout(t); }
}

export function getKeys() {
  const keys = [process.env.OPENROUTER_KEY_1, process.env.OPENROUTER_KEY_2, process.env.OPENROUTER_KEY_3].filter(Boolean);
  // rotasi acak Math.random()
  return keys.sort(() => Math.random() - 0.5);
}

const SYSTEM = `Kamu adalah VibeUI, generator UI web profesional.
ATURAN MUTLAK:
1. Balas HANYA kode HTML utuh. Tanpa penjelasan, tanpa markdown fence.
2. Wajib satu file <!doctype html> lengkap dan pakai <script src="https://cdn.tailwindcss.com"></script>.
2b. WAJIB sisipkan di <head>: <meta name="color-scheme" content="dark"> dan <style>html{color-scheme:dark}</style> (ganti ke light bila desainnya terang) agar scrollbar mengikuti tema.
3. WAJIB beri atribut data-component="nama-unik" pada SETIAP elemen blok penting (navbar, hero, hero-title, card-1, cta-primary, footer, dst).
4. Estetika anti-slop: monokromatik (black/zinc), rounded-2xl s/d rounded-full, whitespace lega p-6..p-12, bento grid, kontras tajam.
5. DILARANG gradasi pelangi/violet/neon. Ikon wajib inline SVG murni.
6. Responsif mobile-first, tidak boleh scroll horizontal.`;

/** Versi streaming: mengirim potongan teks lewat onDelta saat AI mengetik. */
export async function streamOpenRouter({ prompt, model, referenceText = '', mode = 'generate', targetHtml = '', referenceHtml = '', onDelta }) {
  const keys = getKeys();
  if (!keys.length) return { ok: false, status: 500, error: 'OPENROUTER_KEY belum diisi di environment.' };

  const user = buildUserMessage({ prompt, referenceText, mode, targetHtml, referenceHtml });
  let lastErr = 'unknown';

  for (const key of keys) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 60000);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', signal: ctrl.signal,
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || 'http://localhost:3000',
          'X-Title': 'VibeUI',
        },
        body: JSON.stringify({
          model, temperature: 0.6, max_tokens: 4000, stream: true,
          messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }],
        }),
      });
      clearTimeout(t);
      if (res.status === 429) { lastErr = '429'; continue; }
      if (!res.ok || !res.body) { lastErr = 'status ' + res.status; continue; }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = '', buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith('data:')) continue;
          const data = l.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const j = JSON.parse(data);
            const piece = j?.choices?.[0]?.delta?.content || '';
            if (piece) { full += piece; onDelta?.(piece, full); }
          } catch (_) {}
        }
      }
      if (!full.trim()) { lastErr = 'empty'; continue; }
      return { ok: true, html: cleanCode(full) };
    } catch (e) { lastErr = e.name === 'AbortError' ? 'timeout' : e.message; }
  }
  return {
    ok: false, status: 429,
    error: '⚠️ Server AI sedang sangat padat! Sesi Anda aman dalam antrean. Mohon tunggu 15 detik dan klik tombol Generate kembali.',
    detail: lastErr,
  };
}

function buildUserMessage({ prompt, referenceText = '', mode = 'generate', targetHtml = '', referenceHtml = '' }) {
  if (mode === 'heal') {
    return `Perbaiki HANYA komponen berikut sesuai instruksi. Balas hanya potongan HTML komponen itu saja (pertahankan atribut data-component).
INSTRUKSI: ${prompt}
KOMPONEN:
${targetHtml}`;
  }
  let msg = `Buatkan halaman web sesuai instruksi: ${prompt}`;
  if (referenceHtml) {
    msg += `\n\nGunakan STRUKTUR & GAYA VISUAL dari template referensi berikut sebagai acuan utama (jangan disalin mentah — sesuaikan isinya dengan instruksi user):\n${referenceHtml.slice(0, 6000)}`;
  }
  if (referenceText) {
    msg += `\n\nReferensi tambahan dari URL (ambil nuansanya saja):\n${referenceText}`;
  }
  return msg;
}

export async function callOpenRouter({ prompt, model, referenceText = '', mode = 'generate', targetHtml = '', referenceHtml = '' }) {
  const keys = getKeys();
  if (!keys.length) return { ok: false, status: 500, error: 'OPENROUTER_KEY belum diisi di environment.' };

  const user = buildUserMessage({ prompt, referenceText, mode, targetHtml, referenceHtml });

  let lastErr = 'unknown';
  for (const key of keys) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 13000);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', signal: ctrl.signal,
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || 'http://localhost:3000',
          'X-Title': 'VibeUI',
        },
        body: JSON.stringify({
          model, temperature: 0.6, max_tokens: 3000,
          messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }],
        }),
      });
      clearTimeout(t);
      if (res.status === 429) { lastErr = '429'; continue; }
      if (!res.ok) { lastErr = 'status ' + res.status; continue; }
      const j = await res.json();
      const out = j?.choices?.[0]?.message?.content?.trim();
      if (!out) { lastErr = 'empty'; continue; }
      return { ok: true, html: cleanCode(out) };
    } catch (e) { lastErr = e.name === 'AbortError' ? 'timeout' : e.message; }
  }
  return {
    ok: false, status: 429,
    error: '⚠️ Server AI sedang sangat padat! Sesi Anda aman dalam antrean. Mohon tunggu 15 detik dan klik tombol Generate kembali.',
    detail: lastErr,
  };
}

export function cleanCode(s) {
  let out = s.replace(/^```(?:html)?/i, '').replace(/```$/m, '').trim();
  const i = out.toLowerCase().indexOf('<!doctype');
  if (i > 0) out = out.slice(i);
  return out;
}
