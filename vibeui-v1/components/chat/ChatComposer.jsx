'use client';
import { useEffect, useRef, useState } from 'react';
import { Sparkles, Bolt, X, Lock } from '../ui/Icons';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const IDEAS = [
  'Landing page SaaS monokromatik dengan hero besar dan 3 kartu fitur',
  'Halaman harga 3 paket dengan badge populer di tengah',
  'Dashboard analitik dengan sidebar, kartu statistik, dan tabel',
  'Portofolio fotografer bergaya galeri masonry',
];

/**
 * Kolom chat ala Stitch.
 * variant="hero" -> besar di tengah layar (state awal)
 * variant="dock" -> ramping di bawah kanvas (setelah ada hasil)
 */
export default function ChatComposer({
  variant = 'hero', onSend, loading, disabled, reference, onClearReference, quotaLeft,
  genMode = 'fast', onGenMode,
}) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [showUrl, setShowUrl] = useState(false);
  const [token, setToken] = useState('');
  const boxRef = useRef(null);
  const widgetRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    if (!SITE_KEY || SITE_KEY.includes('AAAAAAA')) return;
    let n = 0;
    const t = setInterval(() => {
      if (window.turnstile && boxRef.current && widgetRef.current == null) {
        widgetRef.current = window.turnstile.render(boxRef.current, {
          sitekey: SITE_KEY, theme: 'auto', size: 'flexible', callback: setToken,
        });
        clearInterval(t);
      }
      if (++n > 40) clearInterval(t);
    }, 300);
    return () => clearInterval(t);
  }, []);

  const autosize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  };

  const submit = () => {
    if (!text.trim() || loading || disabled) return;
    onSend({ prompt: text.trim(), referenceUrl: url.trim(), turnstileToken: token, genMode });
    setText('');
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const hero = variant === 'hero';

  return (
    <div className={hero ? 'w-full max-w-2xl mx-auto' : 'w-full max-w-3xl mx-auto'}>
      {hero && (
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Mau desain apa hari ini?</h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Jelaskan idenya dengan bahasa biasa. VibeUI menyusun HTML + Tailwind siap pakai.
          </p>
        </div>
      )}

      <div className={'rounded-3xl border bg-white dark:bg-zinc-900/60 backdrop-blur transition ' +
        (loading ? 'border-zinc-300 dark:border-zinc-700' : 'border-zinc-200 dark:border-zinc-800') +
        (hero ? ' shadow-xl shadow-black/5 dark:shadow-black/40' : '')}>

        {reference && (
          <div className="flex items-center gap-2 px-4 pt-3.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 pl-1.5 pr-2.5 py-1 text-xs max-w-full">
              <img src={reference.screenshot_url} alt="" className="h-5 w-8 rounded object-cover shrink-0" />
              <span className="truncate">Referensi: {reference.template_name}</span>
              <button onClick={onClearReference} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white shrink-0">
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}

        <textarea
          ref={taRef} rows={hero ? 3 : 1} value={text} maxLength={300}
          onChange={(e) => { setText(e.target.value); autosize(e.target); }}
          onKeyDown={onKey}
          placeholder={disabled ? 'Kuota habis — tonton iklan atau upgrade untuk lanjut' : 'Deskripsikan halaman yang kamu mau…'}
          disabled={disabled}
          className="w-full bg-transparent px-4 pt-4 pb-2 text-sm leading-relaxed outline-none resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 disabled:opacity-60"
        />

        {showUrl && (
          <div className="px-4 pb-1">
            <input
              value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://21st.dev/... (referensi gaya, opsional)"
              className="w-full rounded-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 text-xs outline-none"
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 p-0.5 mr-1">
              {[
                { k: 'fast', label: 'Cepat', cost: 1, hint: 'Hasil langsung tampil — 1 kredit' },
                { k: 'live', label: 'Berjalan', cost: 2, hint: 'Lihat AI menyusun langkah demi langkah — 2 kredit' },
              ].map((m) => (
                <button key={m.k} onClick={() => onGenMode?.(m.k)} title={m.hint}
                  className={'rounded-full px-2.5 py-1 text-[11px] font-medium transition flex items-center gap-1 ' +
                    (genMode === m.k
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white')}>
                  {m.label}
                  <span className={'tabular-nums ' + (genMode === m.k ? 'opacity-70' : 'opacity-50')}>{m.cost}c</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowUrl((v) => !v)} title="Tempel URL referensi"
              className={'rounded-full border px-3 py-1.5 text-xs transition ' +
                (showUrl
                  ? 'border-zinc-900 dark:border-white'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800')}>
              URL
            </button>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-600 tabular-nums">{text.length}/300</span>
          </div>

          <div className="flex items-center gap-2">
            {typeof quotaLeft !== 'undefined' && (
              <span className="hidden sm:inline text-[11px] text-zinc-400 dark:text-zinc-600">{quotaLeft} tersisa</span>
            )}
            <button onClick={submit} disabled={!text.trim() || loading || disabled}
              className="rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black h-9 px-4 text-sm font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition">
              {disabled ? <Lock className="h-4 w-4" /> : loading
                ? <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                : <Bolt className="h-4 w-4" />}
              {loading ? 'Membuat…' : `Generate · ${genMode === 'live' ? 2 : 1}c`}
            </button>
          </div>
        </div>
      </div>

      <div ref={boxRef} className="empty:hidden mt-3" />

      {hero && (
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {IDEAS.map((i) => (
            <button key={i} onClick={() => { setText(i); setTimeout(() => autosize(taRef.current), 0); }}
              className="rounded-full border border-zinc-200 dark:border-zinc-800 px-3.5 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition">
              <Sparkles className="h-3 w-3 inline mr-1.5 -mt-0.5" />{i.length > 46 ? i.slice(0, 46) + '…' : i}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
