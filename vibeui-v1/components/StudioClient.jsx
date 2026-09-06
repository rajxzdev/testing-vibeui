'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ThemeToggle } from './ui/Providers';
import ChatComposer from './chat/ChatComposer';
import GenerationProgress from './chat/GenerationProgress';
import { Play, Reset, X } from './ui/Icons';

const Pulse = ({ className }) => <div className={'bg-zinc-100 dark:bg-zinc-900 animate-pulse ' + className} />;
const TemplateSelector = dynamic(() => import('./sidebar/TemplateSelector'), { ssr: false, loading: () => <Pulse className="h-full w-full" /> });
const LivePreview = dynamic(() => import('./canvas/LivePreview'), { ssr: false, loading: () => <Pulse className="h-full w-full" /> });
const ExportPanel = dynamic(() => import('./controls/ExportPanel'), { ssr: false });

const AD_URL = process.env.NEXT_PUBLIC_MONETAG_SMARTLINK_URL;

export default function StudioClient() {
  const [code, setCode] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [chars, setChars] = useState(0);
  const [stream, setStream] = useState('');
  const [log, setLog] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reference, setReference] = useState(null);
  const [notice, setNotice] = useState('');
  const [me, setMe] = useState(null);
  const [showRefs, setShowRefs] = useState(false);
  const [genMode, setGenMode] = useState('fast');
  const [adBusy, setAdBusy] = useState(false);
  const [adCount, setAdCount] = useState(0);
  const abortRef = useRef(null);

  const refreshMe = useCallback(() => {
    fetch('/api/me').then((r) => r.json()).then((j) => {
      if (j.success) setMe({ ...j.user, pool: j.pool, poolCap: j.poolCap });
    }).catch(() => {});
  }, []);
  useEffect(refreshMe, [refreshMe]);

  const quotaLeft = me?.unlimited ? '∞'
    : (me?.tier === 'starter' ? (me?.monthly ?? 0) : (me?.daily ?? 0)) + (me?.bonus ?? 0);
  const outOfQuota = !me?.unlimited && Number(quotaLeft) <= 0;
  const cost = genMode === 'live' ? 2 : 1;
  // kredit kurang untuk mode berjalan (tapi masih cukup untuk mode cepat)
  const notEnoughForLive = !me?.unlimited && Number(quotaLeft) > 0 && Number(quotaLeft) < cost;

  /** Baca SSE dari /api/generate supaya progres terlihat berjalan. */
  const runStream = async (payload) => {
    setLoading(true); setNotice(''); setStage('start'); setChars(0); setStream(''); setLog([]);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: ctrl.signal,
      });

      const ctype = res.headers.get('content-type') || '';
      if (!ctype.includes('text/event-stream')) {
        const j = await res.json().catch(() => ({}));
        setNotice(j.error || 'Gagal memproses permintaan.');
        return null;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '', result = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() || '';
        for (const p of parts) {
          const line = p.split('\n').find((x) => x.startsWith('data:'));
          if (!line) continue;
          let ev; try { ev = JSON.parse(line.slice(5).trim()); } catch { continue; }

          if (ev.type === 'status') { setStage(ev.stage); setLog((l) => [...l, ev]); }
          else if (ev.type === 'delta') { setChars(ev.chars); setStream((s) => (s + ev.piece).slice(-4000)); }
          else if (ev.type === 'notice') setNotice(ev.message);
          else if (ev.type === 'error') { setNotice(ev.error); setStage(null); }
          else if (ev.type === 'done') {
            setStage('done'); result = ev;
            if (ev.quota) setMe((m) => ({ ...m, ...ev.quota })); else refreshMe();
          }
        }
      }
      return result;
    } catch (e) {
      if (e.name !== 'AbortError') setNotice('Koneksi bermasalah. Coba lagi.');
      return null;
    } finally {
      setLoading(false); abortRef.current = null;
      setTimeout(() => setStage(null), 400);
    }
  };

  const generate = async ({ prompt: p, referenceUrl, turnstileToken, genMode: gm }) => {
    const mode = gm || genMode;
    if (!me?.unlimited && mode === 'live' && Number(quotaLeft) < 2) {
      setNotice('⚠️ Mode "Berjalan" butuh 2 kredit, sisa Anda ' + quotaLeft + '. Pakai mode Cepat (1 kredit) atau tambah kredit dulu.');
      return;
    }
    setPrompt(p);
    const r = await runStream({
      userPrompt: p, referenceUrl, turnstileToken,
      templateId: reference?.id, genMode: mode,
    });
    if (r?.html) setCode(r.html);
  };

  const heal = async (instruction) => {
    if (!selected || !instruction?.trim()) return;
    const r = await runStream({ mode: 'heal', userPrompt: instruction, targetHtml: selected.html, genMode: 'fast' });
    if (r?.html) {
      const fixed = r.html.replace(/^```(html)?|```$/g, '').trim();
      setCode((c) => (c.includes(selected.html) ? c.replace(selected.html, fixed) : c));
      setSelected(null); setNotice('✅ Komponen diperbaiki AI.');
    }
  };

  const pickReference = (t, locked) => {
    if (locked) { setNotice('🔒 Referensi premium. Upgrade Starter/Pro untuk memakainya.'); return; }
    setReference((cur) => (cur?.id === t.id ? null : t));
    setShowRefs(false);
  };

  const claimAd = async () => {
    if (!AD_URL || AD_URL.includes('your-smartlink')) { setNotice('Link Monetag belum diisi di .env.'); return; }
    window.open(AD_URL, '_blank', 'noopener');
    setAdBusy(true); setAdCount(10);
    const iv = setInterval(() => setAdCount((c) => {
      if (c <= 1) {
        clearInterval(iv);
        fetch('/api/refill-ad', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchedMs: 10500 }),
        }).then((r) => r.json()).then((j) => {
          setNotice(j.success ? j.message : j.error); refreshMe();
        }).finally(() => setAdBusy(false));
        return 0;
      }
      return c - 1;
    }), 1000);
  };

  const resetAll = () => {
    setCode(''); setSelected(null); setPrompt(''); setNotice(''); setStream(''); setChars(0);
  };

  const canHeal = me?.tier === 'pro' || ['owner', 'tester', 'maintainer'].includes(me?.role);
  const hasResult = !!code;
  const showProgress = loading || stage;

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-zinc-50">
      {/* Header */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-3 px-4 border-b border-zinc-200 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur z-40">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg className="h-6 w-6 dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22h20L12 2z" />
          </svg>
          <span className="font-bold tracking-tight">VibeUI</span>
        </Link>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowRefs(true)}
            className="rounded-full border border-zinc-200 dark:border-zinc-800 px-3.5 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2">
            {reference
              ? <><img src={reference.screenshot_url} alt="" className="h-4 w-6 rounded object-cover" /><span className="hidden sm:inline max-w-[10rem] truncate">{reference.template_name}</span></>
              : <span>Referensi</span>}
          </button>
          {hasResult && (
            <button onClick={resetAll} title="Mulai baru"
              className="rounded-full border border-zinc-200 dark:border-zinc-800 h-8 w-8 grid place-items-center hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">
              <Reset className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="hidden sm:inline text-xs text-zinc-500 tabular-nums px-1">{quotaLeft}</span>
          <ThemeToggle />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col">
        {!hasResult ? (
          /* ---------- STATE AWAL: kolom chat di tengah ---------- */
          <div className="flex-1 min-h-0 overflow-y-auto vibe-grid">
            <div className="min-h-full flex items-center justify-center px-5 py-10">
              {showProgress
                ? <GenerationProgress stage={stage} chars={chars} log={log} stream={stream} genMode={genMode} cost={cost} />
                : (
                  <div className="w-full">
                    <ChatComposer
                      variant="hero" onSend={generate} loading={loading} disabled={outOfQuota}
                      reference={reference} onClearReference={() => setReference(null)} quotaLeft={quotaLeft}
                      genMode={genMode} onGenMode={setGenMode}
                    />
                    {notice && (
                      <div className="mt-6 max-w-2xl mx-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 animate-blur-in">
                        {notice}
                      </div>
                    )}
                    {notEnoughForLive && !notice && (
                      <p className="mt-5 max-w-2xl mx-auto text-center text-xs text-zinc-500">
                        Sisa {quotaLeft} kredit — mode “Berjalan” (2 kredit) belum bisa dipakai.
                      </p>
                    )}
                    {outOfQuota && (
                      <div className="mt-4 max-w-2xl mx-auto flex flex-wrap gap-2 justify-center">
                        <button onClick={claimAd} disabled={adBusy || me?.adClaimed}
                          className="rounded-full border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium flex items-center gap-2 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">
                          <Play className="h-3.5 w-3.5" />
                          {me?.adClaimed ? 'Bonus iklan sudah dipakai' : adBusy ? `Menghitung… ${adCount}s` : 'Tonton Iklan +2'}
                        </button>
                        <a href="/#harga" className="rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 transition">
                          Upgrade Rp 19.000
                        </a>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        ) : (
          /* ---------- SETELAH ADA HASIL: kanvas + chat dock ---------- */
          <>
            <div className="flex-1 min-h-0 flex">
              <div className="flex-1 min-w-0 min-h-0">
                <LivePreview
                  code={code} loading={loading} onSelect={setSelected} onClearSelect={() => setSelected(null)}
                  selected={selected} onHeal={heal} onReset={resetAll} canHeal={canHeal}
                />
              </div>
              <aside className="hidden lg:flex w-72 shrink-0 border-l border-zinc-200 dark:border-zinc-800/60 overflow-y-auto p-4">
                <div className="w-full">
                  <ExportPanel code={code} prompt={prompt} />
                </div>
              </aside>
            </div>

            <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur px-4 py-3">
              {showProgress && (
                <div className="max-w-3xl mx-auto mb-3 flex items-center gap-2.5 text-xs text-zinc-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {stage === 'thinking' ? 'AI menyusun ulang…' : stage === 'render' ? 'Merender…' : 'Memproses…'}
                  {chars > 0 && <span className="tabular-nums">· {chars.toLocaleString('id-ID')} karakter</span>}
                </div>
              )}
              {notice && !showProgress && (
                <div className="max-w-3xl mx-auto mb-3 text-xs text-zinc-500">{notice}</div>
              )}
              <ChatComposer
                variant="dock" onSend={generate} loading={loading} disabled={outOfQuota}
                reference={reference} onClearReference={() => setReference(null)} quotaLeft={quotaLeft}
                genMode={genMode} onGenMode={setGenMode}
              />
              <div className="lg:hidden max-w-3xl mx-auto mt-3">
                <ExportPanel code={code} prompt={prompt} compact />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Drawer referensi */}
      {showRefs && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRefs(false)} />
          <div className="relative ml-auto h-full w-full max-w-sm bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl animate-fade-in-up">
            <button onClick={() => setShowRefs(false)}
              className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 grid place-items-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
              <X className="h-3.5 w-3.5" />
            </button>
            <TemplateSelector onPick={pickReference} selectedId={reference?.id} tier={me?.tier} role={me?.role} />
          </div>
        </div>
      )}
    </div>
  );
}
