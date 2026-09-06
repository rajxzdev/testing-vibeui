'use client';
import { useState } from 'react';
import { copyCode, downloadHtml, downloadZip, downloadBrief } from '@/lib/exportHelpers';
import { Copy, Check, Download, Zip, Doc } from '../ui/Icons';

const btn = 'w-full rounded-full border border-zinc-200 dark:border-zinc-800 py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition disabled:opacity-40 disabled:cursor-not-allowed';

export default function ExportPanel({ code, prompt, compact = false }) {
  const [copied, setCopied] = useState(false);
  const [zipping, setZipping] = useState(false);
  const disabled = !code;

  const doCopy = async () => { await copyCode(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const doZip = async () => { setZipping(true); try { await downloadZip(code, prompt); } finally { setZipping(false); } };

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button onClick={doCopy} disabled={disabled} className={btn + ' !w-auto shrink-0 px-4'}>
          {copied ? <><Check className="h-4 w-4 text-emerald-500" /><span className="text-emerald-500">Tersalin</span></> : <><Copy className="h-4 w-4" />Copy</>}
        </button>
        <button onClick={() => downloadHtml(code)} disabled={disabled} className={btn + ' !w-auto shrink-0 px-4'}><Download className="h-4 w-4" />.html</button>
        <button onClick={doZip} disabled={disabled || zipping} className={btn + ' !w-auto shrink-0 px-4'}><Zip className="h-4 w-4" />{zipping ? '…' : '.zip'}</button>
        <button onClick={() => downloadBrief(code, prompt)} disabled={disabled} className={btn + ' !w-auto shrink-0 px-4'}><Doc className="h-4 w-4" />Brief</button>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <span className="text-xs font-semibold tracking-tight">Ekspor</span>
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600">gratis semua tier</span>
      </div>
      <div className="space-y-2.5">
        <button onClick={doCopy} disabled={disabled} className={btn}>
          {copied
            ? <><Check className="h-4 w-4 text-emerald-500" /><span className="text-emerald-500">Tersalin!</span></>
            : <><Copy className="h-4 w-4" /> Copy Code</>}
        </button>
        <button onClick={() => downloadHtml(code)} disabled={disabled} className={btn}><Download className="h-4 w-4" /> Download .html</button>
        <button onClick={doZip} disabled={disabled || zipping} className={btn}><Zip className="h-4 w-4" /> {zipping ? 'Mengompres…' : 'Download .zip'}</button>
        <button onClick={() => downloadBrief(code, prompt)} disabled={disabled} className={btn}><Doc className="h-4 w-4" /> Project Brief .txt</button>
      </div>
      {disabled && <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed">Generate desain dulu untuk mengaktifkan ekspor.</p>}
    </div>
  );
}
