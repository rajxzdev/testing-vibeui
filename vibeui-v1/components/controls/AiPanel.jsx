'use client';
import { useEffect, useRef, useState } from 'react';
import { Sparkles, Bolt, Play, Lock } from '../ui/Icons';
import ExportPanel from './ExportPanel';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const AD_URL = process.env.NEXT_PUBLIC_MONETAG_SMARTLINK_URL;

export default function AiPanel({ onGenerate, loading, quota, code, prompt, onClaimAd, notice }) {
  const [p, setP] = useState('');
  const [ref, setRef] = useState('');
  const [token, setToken] = useState('');
  const [adCount, setAdCount] = useState(0);
  const [adBusy, setAdBusy] = useState(false);
  const boxRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!SITE_KEY || SITE_KEY.includes('AAAAAAA')) return;
    let tries = 0;
    const t = setInterval(() => {
      if (window.turnstile && boxRef.current && widgetRef.current == null) {
        widgetRef.current = window.turnstile.render(boxRef.current, { sitekey: SITE_KEY, theme: 'auto', size: 'flexible', callback: setToken });
        clearInterval(t);
      }
      if (++tries > 40) clearInterval(t);
    }, 300);
    return () => clearInterval(t);
  }, []);

  const isStarter = quota?.tier === 'starter';
  const base = isStarter ? (quota?.monthly ?? 0) : (quota?.daily ?? 0);
  const bonus = quota?.bonus ?? 0;
  const total = base + bonus;
  const cap = isStarter ? 100 : 5;
  const empty = !quota?.unlimited && total <= 0;
  const poolFull = (quota?.pool ?? 0) >= (quota?.poolCap ?? 140);

  const watchAd = async () => {
    if (!AD_URL || AD_URL.includes('your-smartlink')) {
      alert('Link Monetag belum diisi di .env (NEXT_PUBLIC_MONETAG_SMARTLINK_URL).'); return;
    }
    window.open(AD_URL, '_blank', 'noopener');
    setAdBusy(true); setAdCount(10);
    const iv = setInterval(() => setAdCount((c) => {
      if (c <= 1) { clearInterval(iv); onClaimAd?.(10500).finally(() => setAdBusy(false)); return 0; }
      return c - 1;
    }), 1000);
  };

  const label = 'text-xs font-medium text-zinc-500';

  return (
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-zinc-950">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-6">

        {/* ---- Kartu kuota ---- */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800/60 p-5">
          <div className="absolute inset-0 opacity-50 dark:opacity-100 bg-[linear-gradient(110deg,#f4f4f5,#e4e4e7,#f4f4f5)] dark:bg-[linear-gradient(110deg,#09090b,#27272a,#09090b)] bg-[length:200%_200%] animate-slow-pan" />
          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {isStarter ? 'Kuota bulan ini' : 'Kuota hari ini'}
              </span>
              <span className="shrink-0 text-[10px] uppercase tracking-wider rounded-full border border-zinc-300 dark:border-zinc-700 px-2 py-0.5">
                {quota?.tier || 'free'}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-1.5">
              {quota?.unlimited ? (
                <span className="text-3xl font-bold tracking-tight leading-none">∞</span>
              ) : (
                <>
                  <span className="text-3xl font-bold tracking-tight leading-none">{base}</span>
                  <span className="text-base font-normal text-zinc-500 leading-none">/{cap}</span>
                  {bonus > 0 && (
                    <span className="ml-1.5 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-2 py-0.5">
                      +{bonus} bonus
                    </span>
                  )}
                </>
              )}
            </div>

            {!quota?.unlimited && (
              <div className="mt-4 h-1 rounded-full bg-zinc-300 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full bg-zinc-900 dark:bg-white transition-all duration-500"
                  style={{ width: Math.min(100, (base / cap) * 100) + '%' }} />
              </div>
            )}
          </div>
        </div>

        {/* ---- Kuota habis / pool penuh ---- */}
        {(empty || poolFull) && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/60 p-5 space-y-3.5">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {poolFull
                ? '🌍 Kuota gratis sedunia hari ini sudah habis diserbu. Upgrade paket biar nggak ikut antre.'
                : 'Kuota habis. Tonton iklan 10 detik untuk bonus +2 generasi.'}
            </p>
            {!poolFull && (
              <button onClick={watchAd} disabled={adBusy || quota?.adClaimed}
                className="w-full rounded-full border border-zinc-200 dark:border-zinc-800 py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">
                <Play className="h-3.5 w-3.5" />
                {quota?.adClaimed ? 'Bonus iklan sudah dipakai' : adBusy ? `Menghitung… ${adCount}s` : 'Tonton Iklan +2 Generasi'}
              </button>
            )}
            <a href="/#harga" className="block text-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black py-2.5 text-sm font-medium hover:opacity-90 transition">
              Upgrade mulai Rp 19.000
            </a>
          </div>
        )}

        {/* ---- Prompt ---- */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className={label + ' flex items-center gap-1.5'}>
              <Sparkles className="h-3.5 w-3.5" /> Deskripsi desain
            </span>
            <span className={'text-xs tabular-nums ' + (p.length > 280 ? 'text-amber-500' : 'text-zinc-500')}>
              {p.length}/300
            </span>
          </div>
          <textarea value={p} maxLength={300} onChange={(e) => setP(e.target.value)} rows={5}
            placeholder="Landing page SaaS monokromatik dengan hero besar, 3 kartu fitur bento, dan tabel harga…"
            className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 text-sm leading-relaxed outline-none resize-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 placeholder:text-zinc-400 dark:placeholder:text-zinc-600" />
        </div>

        {/* ---- URL referensi ---- */}
        <div className="space-y-2.5">
          <span className={label}>URL referensi (opsional)</span>
          <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="https://21st.dev/..."
            className="w-full rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 placeholder:text-zinc-400 dark:placeholder:text-zinc-600" />
          <p className="text-[11px] text-zinc-500 leading-relaxed">Diambil via Jina Reader, timeout 4 detik.</p>
        </div>

        <div ref={boxRef} className="empty:hidden" />

        {/* ---- Tombol generate ---- */}
        <div className="space-y-3">
          <button onClick={() => onGenerate({ prompt: p, referenceUrl: ref, turnstileToken: token })}
            disabled={loading || !p.trim() || poolFull}
            className="w-full rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black py-3.5 font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition">
            {poolFull ? <Lock className="h-4 w-4" /> : <Bolt className="h-4 w-4" />}
            {loading ? 'Menyusun desain…' : 'Generate Desain'}
          </button>

          {notice && (
            <p className="text-xs leading-relaxed rounded-2xl border border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/60 px-4 py-3 text-zinc-600 dark:text-zinc-400 animate-blur-in">
              {notice}
            </p>
          )}
        </div>

        <ExportPanel code={code} prompt={prompt} />
      </div>
    </div>
  );
}
