'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Desktop, Tablet, Mobile, Reset, Wand, X } from '../ui/Icons';

const SIZES = { desktop: '100%', tablet: '820px', mobile: '390px' };

/** Script injeksi: klik komponen -> postMessage ke parent + deteksi error render. */
const bridge = (dark) => `<script>
(function(){
  var DARK=${dark ? 'true' : 'false'};
  function injectStyle(){
    try{
      var style=document.createElement('style');
      style.id='vibeui-canvas-style';
      style.textContent=
         'html{color-scheme:'+(DARK?'dark':'light')+' !important}'
        +'[data-component]{outline-offset:2px;cursor:pointer}'
        +'[data-component]:hover{outline:1.5px dashed rgba(120,120,130,.85)}'
        +'[data-vibe-sel]{outline:2px solid #6366f1 !important;box-shadow:0 0 0 4px rgba(99,102,241,.22)}'
        +'html,body,*{scrollbar-width:thin !important;scrollbar-color:'+(DARK?'rgba(82,82,91,.85)':'rgba(161,161,170,.7)')+' transparent !important}'
        +'::-webkit-scrollbar{width:10px !important;height:10px !important;background:transparent !important}'
        +'::-webkit-scrollbar-track{background:transparent !important;box-shadow:none !important;border:0 !important}'
        +'::-webkit-scrollbar-track-piece{background:transparent !important}'
        +'::-webkit-scrollbar-corner{background:transparent !important}'
        +'::-webkit-scrollbar-button{display:none !important;width:0 !important;height:0 !important}'
        +'::-webkit-scrollbar-thumb{background-color:'+(DARK?'rgba(82,82,91,.85)':'rgba(161,161,170,.7)')+' !important;border-radius:99px !important;border:3px solid transparent !important;background-clip:content-box !important}'
        +'::-webkit-scrollbar-thumb:hover{background-color:'+(DARK?'rgba(113,113,122,1)':'rgba(113,113,122,.85)')+' !important}';
      (document.head||document.documentElement).appendChild(style);
      if(document.documentElement) document.documentElement.style.colorScheme = DARK?'dark':'light';
    }catch(e){}
  }
  injectStyle();
  // Tailwind CDN / skrip AI kadang menimpa <head> setelah load — pasang ulang.
  if(document.readyState!=='complete'){window.addEventListener('load',function(){if(!document.getElementById('vibeui-canvas-style'))injectStyle();});}
  setTimeout(function(){if(!document.getElementById('vibeui-canvas-style'))injectStyle();},600);
  try{
    document.addEventListener('click',function(e){
      var el=e.target.closest('[data-component]'); if(!el) return;
      e.preventDefault(); e.stopPropagation();
      document.querySelectorAll('[data-vibe-sel]').forEach(function(n){n.removeAttribute('data-vibe-sel')});
      el.setAttribute('data-vibe-sel','1');
      var r=el.getBoundingClientRect();
      parent.postMessage({vibe:'select',name:el.getAttribute('data-component'),
        html:el.outerHTML.slice(0,4000),x:r.left+r.width/2,y:r.top},'*');
    },true);
    window.addEventListener('error',function(ev){parent.postMessage({vibe:'error',message:String(ev.message)},'*')});
  }catch(err){parent.postMessage({vibe:'error',message:String(err)},'*')}
})();
</script>`;

const emptyDoc = (dark) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
html,body{height:100%;margin:0;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;
background:${dark ? '#09090b' : '#ffffff'};color:${dark ? '#71717a' : '#a1a1aa'};
background-image:linear-gradient(to right,${dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'} 1px,transparent 1px),linear-gradient(to bottom,${dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'} 1px,transparent 1px);
background-size:32px 32px}
.c{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:24px}
svg{filter:${dark ? 'drop-shadow(0 0 10px rgba(255,255,255,.35))' : 'none'}}
</style></head>
<body><div class="c">
<svg width="34" height="34" viewBox="0 0 24 24" fill="${dark ? '#fff' : '#18181b'}"><path d="M12 2L2 22h20L12 2z"/></svg>
<div style="font-weight:600;color:${dark ? '#e4e4e7' : '#27272a'}">Kanvas kosong</div>
<div style="font-size:13px;max-width:320px;line-height:1.6">Tulis prompt di panel kanan atau pilih template dari sidebar kiri untuk mulai mendesain.</div>
</div></body></html>`;

export default function LivePreview({ code, loading, onSelect, onReset, selected, onClearSelect, onHeal, canHeal }) {
  const [view, setView] = useState('desktop');
  const [pop, setPop] = useState(null);
  const [instr, setInstr] = useState('');
  const [dark, setDark] = useState(true);
  const ref = useRef(null);

  // Ikuti tema app supaya kanvas kosong tidak menyilaukan di light mode
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setDark(el.classList.contains('dark'));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  const srcDoc = useMemo(() => {
    const base = code && code.trim() ? code : emptyDoc(dark);
    if (!code) return base;
    const B = bridge(dark);
    return base.includes('</body>') ? base.replace('</body>', B + '</body>') : base + B;
  }, [code, dark]);

  useEffect(() => {
    const h = (e) => {
      if (e.data?.vibe === 'select') { setPop({ x: e.data.x, y: e.data.y }); onSelect?.({ name: e.data.name, html: e.data.html }); }
      if (e.data?.vibe === 'error') console.error('[canvas]', e.data.message);
    };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, [onSelect]);

  useEffect(() => { if (!selected) setPop(null); }, [selected]);

  return (
    <div className="flex-1 w-full h-full min-h-0 relative flex flex-col vibe-grid bg-zinc-100 dark:bg-black">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur">
        <div className="flex items-center gap-2 text-xs text-zinc-500 min-w-0 truncate">
          <span className={'h-2 w-2 rounded-full ' + (loading ? 'bg-amber-400 animate-pulse' : code ? 'bg-emerald-400' : 'bg-zinc-500')} />
          {loading ? 'AI sedang menyusun kode…' : code ? 'Kanvas aktif' : 'Kanvas kosong'}
        </div>
        <button onClick={onReset} className="shrink-0 flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 px-3.5 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">
          <Reset className="h-3.5 w-3.5" /> Reset Canvas
        </button>
      </div>

      {/* Kanvas */}
      <div className="flex-1 min-h-0 w-full relative overflow-auto px-4 pt-4 pb-20 md:px-6 md:pt-6 md:pb-24 flex justify-center">
        <div className={'w-full h-full transition-all duration-300 ' + (loading ? 'border-beam rounded-3xl p-[1.5px]' : '')}
          style={{ maxWidth: SIZES[view] }}>
          <div className="relative w-full h-full rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 shadow-2xl shadow-black/20">
            <iframe ref={ref} key={view} title="VibeUI Canvas" srcDoc={srcDoc}
              sandbox="allow-scripts" style={{ colorScheme: dark ? 'dark' : 'light' }}
              className="w-full h-full object-contain block border-0 bg-white dark:bg-zinc-950" />
          </div>
        </div>

        {/* Floating component menu */}
        {pop && selected && (
          <div className="absolute z-40 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 backdrop-blur p-3 w-72 shadow-2xl animate-fade-in-up"
            style={{ left: Math.min(Math.max(pop.x - 100, 12), (typeof window !== 'undefined' ? window.innerWidth : 1200) - 320), top: Math.max(pop.y + 60, 80) }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono truncate text-zinc-500">&lt;{selected.name}&gt;</span>
              <button onClick={() => { setPop(null); onClearSelect?.(); }} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><X className="h-3.5 w-3.5" /></button>
            </div>
            <input value={instr} onChange={(e) => setInstr(e.target.value)} maxLength={300}
              placeholder='mis. "bikin teksnya ke tengah"'
              className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm outline-none" />
            <button onClick={() => { onHeal?.(instr); setInstr(''); }} disabled={!instr.trim() || loading}
              className="mt-2 w-full rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 hover:opacity-90 transition">
              <Wand className="h-3.5 w-3.5" /> {canHeal ? 'Fix via AI' : 'Fix via AI (Pro)'}
            </button>
          </div>
        )}
      </div>

      {/* Dock menu responsif */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-1.5 py-1.5 shadow-xl">
        {[['desktop', Desktop], ['tablet', Tablet], ['mobile', Mobile]].map(([k, Ico]) => (
          <button key={k} onClick={() => setView(k)} title={k}
            className={'h-9 w-9 rounded-full flex items-center justify-center transition ' +
              (view === k ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800')}>
            <Ico className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
