export function cn(...inputs) {
  const out = [];
  const walk = (v) => {
    if (!v) return;
    if (typeof v === 'string' || typeof v === 'number') out.push(String(v));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === 'object') Object.keys(v).forEach((k) => v[k] && out.push(k));
  };
  inputs.forEach(walk);
  // dedupe utility bentrok sederhana (kelas terakhir menang untuk prefix sama)
  const seen = new Map();
  for (const cls of out.join(' ').split(/\s+/).filter(Boolean)) {
    const prefix = cls.replace(/-[^-]*$/, '') || cls;
    seen.set(prefix + '|' + (cls.match(/^(sm|md|lg|xl|2xl|hover|focus|dark):/)?.[1] || ''), cls);
  }
  return Array.from(seen.values()).join(' ');
}
export const FREE_DAILY = 5;
export const GLOBAL_POOL_CAP = 140;
export const MAX_PROMPT = 300;

/** Biaya kredit per mode generate. */
export const COST_FAST = 1;   // generate biasa: hasil langsung
export const COST_LIVE = 2;   // generate berjalan: streaming + progres detail
export const genCost = (m) => (m === 'live' ? COST_LIVE : COST_FAST);
