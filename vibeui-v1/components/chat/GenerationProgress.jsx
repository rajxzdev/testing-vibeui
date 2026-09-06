'use client';
import { useEffect, useRef } from 'react';
import { Check } from '../ui/Icons';

const STEPS = [
  { key: 'start',     label: 'Menyiapkan permintaan' },
  { key: 'reference', label: 'Membaca referensi', optional: true },
  { key: 'scrape',    label: 'Mengambil URL referensi', optional: true },
  { key: 'thinking',  label: 'AI menyusun struktur' },
  { key: 'render',    label: 'Merender pratinjau' },
];

/** Panel progres "berjalan" saat AI bekerja — meniru rasa Stitch. */
export default function GenerationProgress({ stage, chars, log = [], stream = '', genMode = 'fast', cost = 1 }) {
  const preRef = useRef(null);
  useEffect(() => { if (preRef.current) preRef.current.scrollTop = preRef.current.scrollHeight; }, [stream]);

  const order = ['start', 'reference', 'scrape', 'scrape-ok', 'thinking', 'render', 'done'];
  const idx = Math.max(0, order.indexOf(stage));
  const stateOf = (k) => {
    const i = order.indexOf(k);
    if (stage === 'done') return 'done';
    if (i < idx) return 'done';
    if (i === idx) return 'active';
    return 'todo';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 md:p-7">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <h3 className="font-semibold tracking-tight">Sedang membuat desain…</h3>
          <span className="rounded-full border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-500">
            {genMode === 'live' ? 'Berjalan' : 'Cepat'} · {cost} kredit
          </span>
          {chars > 0 && (
            <span className="ml-auto text-xs text-zinc-500 tabular-nums">{chars.toLocaleString('id-ID')} karakter</span>
          )}
        </div>

        <ol className="mt-6 space-y-3">
          {STEPS.map((s) => {
            const st = stateOf(s.key);
            const skipped = s.optional && !log.some((l) => l.stage === s.key);
            if (skipped && st === 'todo') return null;
            return (
              <li key={s.key} className="flex items-center gap-3 text-sm">
                <span className={'h-5 w-5 rounded-full grid place-items-center shrink-0 border transition ' +
                  (st === 'done'
                    ? 'bg-zinc-900 dark:bg-white border-transparent text-white dark:text-black'
                    : st === 'active'
                      ? 'border-zinc-900 dark:border-white'
                      : 'border-zinc-300 dark:border-zinc-700')}>
                  {st === 'done'
                    ? <Check className="h-3 w-3" />
                    : st === 'active'
                      ? <span className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-white animate-pulse" />
                      : null}
                </span>
                <span className={st === 'todo' ? 'text-zinc-400 dark:text-zinc-600' : ''}>{s.label}</span>
              </li>
            );
          })}
        </ol>

        {stream && (
          <pre ref={preRef}
            className="mt-6 max-h-40 overflow-auto rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 text-[11px] leading-relaxed font-mono text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap break-all">
            {stream.slice(-1200)}
          </pre>
        )}
      </div>
    </div>
  );
}
