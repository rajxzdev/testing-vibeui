'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import TextPressure from './TextPressure';
import { ThemeToggle } from './Providers';
import { Logo, Sparkles, Bolt, Download, Lock, Check, Zip, Doc, Wand } from './Icons';
import { PLANS } from '@/lib/plans';

const card = 'rounded-4xl border border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/50 dark:backdrop-blur';
const sub = 'text-zinc-500 dark:text-zinc-400';

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function Landing({ changelogs = [], templates = [], version = '1.0.0' }) {
  useReveal();
  const [busy, setBusy] = useState(null);

  const buy = async (plan) => {
    setBusy(plan);
    try {
      const r = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) });
      const j = await r.json();
      if (j.success && j.paymentUrl) window.location.href = j.paymentUrl;
      else alert(j.error || 'Gagal membuat invoice.');
    } finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800/60 bg-white/80 dark:bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-zinc-900 dark:text-white dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z" /></svg>
            <span className="font-bold tracking-tight text-zinc-900 dark:text-white">VibeUI</span>
            <span className="hidden sm:inline text-[10px] font-mono text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-full px-2 py-0.5">v{version}</span>
          </div>
          <nav className={`hidden md:flex items-center gap-7 text-sm ${sub}`}>
            <a href="#fitur" className="hover:text-zinc-900 dark:hover:text-white transition">Fitur</a>
            <a href="#template" className="hover:text-zinc-900 dark:hover:text-white transition">Template</a>
            <a href="#harga" className="hover:text-zinc-900 dark:hover:text-white transition">Harga</a>
            <a href="#changelog" className="hover:text-zinc-900 dark:hover:text-white transition">Changelog</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/dashboard" className="rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 transition">Buka Studio</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden vibe-grid">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className={`inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800/60 px-3.5 py-1.5 text-xs ${sub} reveal`}>
            <Sparkles className="h-3.5 w-3.5" /> Gratis 5x generate tiap hari — tanpa kartu kredit
          </div>
          <TextPressure text="Desain web instan." className="mt-7 text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.02] cursor-default select-none" />
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.02] mt-1"><span className="shiny-text">Cukup ketik idenya.</span></h2>
          <p className={`mt-7 max-w-xl text-lg leading-relaxed ${sub} reveal`}>
            VibeUI mengubah satu kalimat prompt jadi struktur HTML + Tailwind CSS siap pakai.
            Tempel URL referensi dari 21st.dev, klik komponen untuk diperbaiki AI, lalu ekspor .html atau .zip.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 reveal">
            <Link href="/dashboard" className="group rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black px-7 py-3.5 font-medium flex items-center gap-2 hover:opacity-90 transition">
              <Bolt className="h-4 w-4" /> Generate Desain Gratis
            </Link>
            <a href="#harga" className="rounded-full border border-zinc-200 dark:border-zinc-800 px-7 py-3.5 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">Lihat Harga</a>
          </div>
          <div className={`mt-8 flex flex-wrap gap-x-7 gap-y-2 text-sm ${sub} reveal`}>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> 100 template web</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> Ekspor selamanya gratis</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> Mulai Rp 19.000/bln</span>
          </div>
        </div>
      </section>

      {/* BENTO FITUR */}
      <section id="fitur" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight reveal">Semua yang dibutuhin freelancer, dalam satu kanvas.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className={`${card} p-8 md:col-span-2 reveal`}>
            <Wand className="h-5 w-5" />
            <h3 className="mt-5 text-xl font-semibold tracking-tight">AI Wireframe Generator + Self-Healing</h3>
            <p className={`mt-3 ${sub} leading-relaxed max-w-lg`}>Setiap elemen hasil generate diberi label <code className="text-xs px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">data-component</code>. Klik elemen di kanvas, ketik "bikin teksnya ke tengah", lalu tekan Fix via AI — hanya komponen itu yang diperbaiki.</p>
          </div>
          <div className={`${card} p-8 reveal`}>
            <Lock className="h-5 w-5" />
            <h3 className="mt-5 text-xl font-semibold tracking-tight">Kanvas Tersandbox</h3>
            <p className={`mt-3 ${sub} leading-relaxed`}>iframe <code className="text-xs">sandbox="allow-scripts"</code> mengisolasi kode AI supaya tidak menabrak CSS dashboard.</p>
          </div>
          <div className={`${card} p-8 reveal`}>
            <Sparkles className="h-5 w-5" />
            <h3 className="mt-5 text-xl font-semibold tracking-tight">URL Reference Scraper</h3>
            <p className={`mt-3 ${sub} leading-relaxed`}>Tempel link 21st.dev atau reactbits.dev; backend menarik strukturnya via Jina Reader dengan timeout aman 4 detik.</p>
          </div>
          <div className={`${card} p-8 reveal`}>
            <Download className="h-5 w-5" />
            <h3 className="mt-5 text-xl font-semibold tracking-tight">Ekspor Komplit</h3>
            <p className={`mt-3 ${sub} leading-relaxed`}>Copy Code, .html tunggal, paket .zip (jszip) plus Project Brief .txt profesional.</p>
          </div>
          <div className={`${card} p-8 reveal relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-40 bg-[linear-gradient(110deg,#18181b,#3f3f46,#18181b)] bg-[length:200%_200%] animate-slow-pan dark:block hidden" />
            <div className="relative">
              <Bolt className="h-5 w-5" />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Kuota Adil</h3>
              <p className={`mt-3 ${sub} leading-relaxed`}>5 generasi/hari gratis, +2 bonus dari iklan, reset otomatis jam 12 malam via Vercel Cron.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TEMPLATE PREVIEW */}
      <section id="template" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight reveal">100 template web utuh, siap dipakai.</h2>
        <p className={`mt-3 ${sub} reveal`}>Thumbnail .webp ultra-ringan supaya Studio kebuka instan.</p>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {templates.slice(0, 8).map((t, i) => (
            <div key={t.id} className={`${card} p-2 overflow-hidden reveal group`} style={{ transitionDelay: i * 60 + 'ms' }}>
              <img src={t.screenshot_url} alt={t.template_name} loading="lazy" className="rounded-2xl w-full aspect-[8/5] object-cover group-hover:scale-[1.03] transition duration-500" />
              <div className="px-3 py-3 flex items-center justify-between">
                <span className="text-sm font-medium truncate">{t.template_name}</span>
                {t.is_premium && <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HARGA */}
      <section id="harga" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight reveal">Harga jujur, murah untuk kantong Indonesia.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className={`${card} p-8 reveal`}>
            <h3 className="font-semibold tracking-tight">Gratis</h3>
            <div className="mt-4 text-4xl font-bold tracking-tight">Rp 0</div>
            <ul className={`mt-6 space-y-2.5 text-sm ${sub}`}>
              {['5 generasi per hari', 'Bonus +2 via iklan Monetag', 'Template dasar', 'Ekspor .html, .zip, brief'].map((f) => (
                <li key={f} className="flex gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0" />{f}</li>))}
            </ul>
            <Link href="/dashboard" className="mt-8 block text-center rounded-full border border-zinc-200 dark:border-zinc-800 px-6 py-3 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">Mulai Gratis</Link>
          </div>

          <div className={`${card} p-8 reveal ring-1 ring-zinc-900 dark:ring-white relative`}>
            <span className="absolute -top-3 left-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black text-xs px-3 py-1 font-medium">Paling laris</span>
            <h3 className="font-semibold tracking-tight">Starter</h3>
            <div className="mt-4 text-4xl font-bold tracking-tight">Rp 19.000<span className={`text-base font-normal ${sub}`}>/bln</span></div>
            <ul className={`mt-6 space-y-2.5 text-sm ${sub}`}>
              {['100 generasi per bulan', '0 menit cooldown — tanpa iklan', '15 template premium', 'Ekspor berkas dasar'].map((f) => (
                <li key={f} className="flex gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0" />{f}</li>))}
            </ul>
            <button onClick={() => buy('starter')} disabled={busy} className="mt-8 w-full rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3 font-medium hover:opacity-90 transition disabled:opacity-50">
              {busy === 'starter' ? 'Membuat invoice…' : 'Ambil Starter'}
            </button>
          </div>

          <div className={`${card} p-8 reveal`}>
            <h3 className="font-semibold tracking-tight">Pro Agensi</h3>
            <div className="mt-4 text-4xl font-bold tracking-tight">Rp 49.000<span className={`text-base font-normal ${sub}`}>/bln</span></div>
            <ul className={`mt-6 space-y-2.5 text-sm ${sub}`}>
              {['Unlimited generasi AI', 'Buka semua 100 template', 'AI Self-Healing per komponen', 'Ekspor paket .zip lengkap'].map((f) => (
                <li key={f} className="flex gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0" />{f}</li>))}
            </ul>
            <button onClick={() => buy('pro')} disabled={busy} className="mt-8 w-full rounded-full border border-zinc-200 dark:border-zinc-800 px-6 py-3 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition disabled:opacity-50">
              {busy === 'pro' ? 'Membuat invoice…' : 'Ambil Pro'}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className={`${card} p-7 flex items-center justify-between gap-4 reveal`}>
            <div><h4 className="font-semibold flex items-center gap-2"><Zip className="h-4 w-4" />Booster Kuota +25</h4><p className={`text-sm mt-1.5 ${sub}`}>{PLANS.booster.desc}</p></div>
            <button onClick={() => buy('booster')} className="shrink-0 rounded-full border border-zinc-200 dark:border-zinc-800 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">Rp 5.000</button>
          </div>
          <div className={`${card} p-7 flex items-center justify-between gap-4 reveal`}>
            <div><h4 className="font-semibold flex items-center gap-2"><Doc className="h-4 w-4" />Single Template License</h4><p className={`text-sm mt-1.5 ${sub}`}>{PLANS.template_license.desc}</p></div>
            <button onClick={() => buy('template_license')} className="shrink-0 rounded-full border border-zinc-200 dark:border-zinc-800 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">Rp 10.000</button>
          </div>
        </div>
        <p className={`mt-6 text-xs ${sub}`}>Pembayaran via Pakasir: QRIS (Dana, OVO, GoPay) & Virtual Account. Aktif otomatis setelah lunas.</p>
      </section>

      {/* CHANGELOG */}
      <section id="changelog" className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-baseline gap-3 reveal">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Changelog</h2>
          <span className="font-mono text-sm text-zinc-500">saat ini v{version}</span>
        </div>
        <div className="mt-10 space-y-4">
          {changelogs.length === 0 && <p className={sub}>Belum ada catatan update.</p>}
          {changelogs.map((c) => (
            <div key={c.id} className={`${card} p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 reveal`}>
              <div className="shrink-0 flex sm:flex-col items-center sm:items-start gap-2 sm:w-24">
                <span className="font-mono text-sm font-semibold">v{c.version || '—'}</span>
                <span className="rounded-full border border-zinc-200 dark:border-zinc-800 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">{c.type}</span>
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold tracking-tight">{c.title}</h4>
                {c.body && <p className={`text-sm mt-1.5 leading-relaxed ${sub}`}>{c.body}</p>}
                <p className="text-xs mt-2 text-zinc-400 dark:text-zinc-600">{new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-200 dark:border-zinc-800/60">
        <div className={`mx-auto max-w-6xl px-6 py-12 flex flex-col md:flex-row justify-between gap-6 text-sm ${sub}`}>
          <div className="flex items-center gap-2"><Logo className="h-5 w-5 text-zinc-900 dark:text-white" /><span className="font-bold tracking-tight text-zinc-900 dark:text-white">VibeUI</span></div>
          <p>© 2026 VibeUI. Dibuat untuk freelancer & agensi Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}
