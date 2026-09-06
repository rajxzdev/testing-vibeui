'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, Lock, Check } from '../ui/Icons';

/**
 * Galeri template — dipakai sebagai REFERENSI GAYA untuk AI,
 * bukan langsung ditaruh ke kanvas.
 */
export default function TemplateSelector({ onPick, selectedId, tier = 'free', role = 'user' }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/templates').then((r) => r.json())
      .then((j) => { setItems(j.templates || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cats = useMemo(() => ['all', ...Array.from(new Set(items.map((i) => i.category)))], [items]);
  const filtered = useMemo(() => items.filter((t) =>
    (cat === 'all' || t.category === cat) && t.template_name.toLowerCase().includes(q.toLowerCase())), [items, q, cat]);

  const unlocked = tier === 'pro' || tier === 'starter' || ['owner', 'tester', 'maintainer'].includes(role);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-zinc-950">
      <div className="shrink-0 px-4 pt-4 pb-3 space-y-3 border-b border-zinc-200 dark:border-zinc-800/60">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Referensi Gaya</h2>
          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
            Pilih satu untuk dijadikan acuan visual AI. Tidak langsung jadi hasil.
          </p>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari referensi…"
            className="w-full rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600" />
        </div>
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 w-max pb-0.5">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={'shrink-0 rounded-full px-3.5 py-1.5 text-xs capitalize border transition whitespace-nowrap ' +
                  (cat === c
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent font-medium'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900')}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 h-40 animate-pulse" />))}

          {!loading && filtered.map((t, i) => {
            const locked = t.is_premium && !unlocked;
            const active = String(selectedId) === String(t.id);
            return (
              <button key={t.id} onClick={() => onPick(t, locked)}
                style={{ animationDelay: Math.min(i, 8) * 40 + 'ms' }}
                className={'group w-full text-left rounded-2xl border overflow-hidden bg-white dark:bg-zinc-950 transition animate-fade-in-up ' +
                  (active
                    ? 'border-zinc-900 dark:border-white ring-1 ring-zinc-900 dark:ring-white'
                    : 'border-zinc-200 dark:border-zinc-800/60 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-lg dark:hover:shadow-black/40')}>
                <div className="relative overflow-hidden">
                  <img src={t.screenshot_url} alt={t.template_name} loading="lazy" width="720" height="450"
                    className="w-full aspect-[8/5] object-cover object-top group-hover:scale-[1.04] transition duration-500" />
                  {locked && (
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="flex items-center gap-1.5 text-[11px] text-white rounded-full bg-white/10 border border-white/25 px-3 py-1.5">
                        <Lock className="h-3 w-3" />Pro
                      </span>
                    </div>
                  )}
                  {active && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black grid place-items-center shadow-lg">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
                <div className="px-3.5 py-3">
                  <div className="text-sm font-medium leading-snug truncate">{t.template_name}</div>
                  <div className="text-[11px] mt-1 text-zinc-500 capitalize">
                    {active ? 'Dipakai sebagai referensi' : t.category}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {!loading && filtered.length === 0 && (
          <p className="text-sm text-zinc-500 py-10 text-center">Tidak ada template yang cocok.</p>
        )}
        <div className="h-2" />
      </div>

      <div className="shrink-0 px-4 py-3 text-[11px] text-zinc-500 border-t border-zinc-200 dark:border-zinc-800/60 text-right">
        {loading ? 'Memuat…' : `${filtered.length} referensi tersedia`}
      </div>
    </div>
  );
}
