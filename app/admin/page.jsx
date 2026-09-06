'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/Providers';
import { Search, Check, Lock, Bolt } from '@/components/ui/Icons';

const card = 'rounded-3xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 p-6';
const inp = 'w-full rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600';
const btn = 'rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black px-5 py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-40';
const ghost = 'rounded-full border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition';

const TIER_STYLE = {
  pro: 'bg-zinc-900 text-white dark:bg-white dark:text-black',
  starter: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
  free: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};
const TYPE_STYLE = {
  feature: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  fix: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/30',
  optimization: 'bg-sky-500/12 text-sky-600 dark:text-sky-400 border-sky-500/30',
};

export default function Admin() {
  const [tab, setTab] = useState('users');
  const [msg, setMsg] = useState('');

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [q, setQ] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({ tier: '', role: '', bonus: '', days: 30 });

  const [logs, setLogs] = useState([]);
  const [latest, setLatest] = useState('1.0.0');
  const [nextV, setNextV] = useState({ feature: '1.1.0', fix: '1.0.1', optimization: '1.0.1' });
  const [cl, setCl] = useState({ type: 'feature', title: '', body: '', version: '', auto: true });

  const [settings, setSettings] = useState({ maintenance: false, maintenance_message: '' });

  const loadUsers = useCallback((query = '') => {
    setLoadingUsers(true);
    fetch('/api/admin/users?q=' + encodeURIComponent(query))
      .then((r) => r.json())
      .then((j) => { if (j.success) { setUsers(j.users || []); setStats(j.stats); } else setMsg('❌ ' + j.error); })
      .catch(() => setMsg('❌ Gagal memuat user'))
      .finally(() => setLoadingUsers(false));
  }, []);

  const loadLogs = useCallback(() => {
    fetch('/api/admin/changelogs').then((r) => r.json()).then((j) => {
      if (j.success) { setLogs(j.items || []); setLatest(j.latest); setNextV(j.next); }
    });
  }, []);

  useEffect(() => { loadUsers(); loadLogs();
    fetch('/api/admin/settings').then(r => r.json()).then(j => j.settings && setSettings(j.settings));
  }, [loadUsers, loadLogs]);

  // debounce pencarian
  useEffect(() => { const t = setTimeout(() => loadUsers(q), 300); return () => clearTimeout(t); }, [q, loadUsers]);

  const pick = (u) => {
    setSel(u);
    setForm({ tier: u.tier || '', role: u.role || '', bonus: '', days: 30 });
    setMsg('');
  };

  const applyUser = async () => {
    if (!sel) return;
    const r = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: sel.clerk_user_id, ...form }),
    });
    const j = await r.json();
    setMsg(j.success ? `✅ ${sel.clerk_user_id.slice(0, 18)}… diperbarui.` : '❌ ' + j.error);
    if (j.success) { loadUsers(q); setSel(j.user); }
  };

  const publish = async () => {
    const payload = { type: cl.type, title: cl.title, body: cl.body };
    if (!cl.auto && cl.version) payload.version = cl.version;
    const r = await fetch('/api/admin/changelogs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const j = await r.json();
    setMsg(j.success ? `✅ Changelog v${j.latest} terbit.` : '❌ ' + j.error);
    if (j.success) { setCl({ type: 'feature', title: '', body: '', version: '', auto: true }); loadLogs(); }
  };

  const saveSettings = async () => {
    const r = await fetch('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
    });
    const j = await r.json();
    setMsg(j.success ? '✅ Pengaturan tersimpan.' : '❌ ' + j.error);
  };

  const suggested = cl.auto ? (nextV?.[cl.type] || '—') : cl.version;

  return (
    <main className="min-h-[100dvh] bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <svg className="h-6 w-6 dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5.5 L12 19 L20 5.5 L16.4 5.5 L12 13.2 L7.6 5.5 Z" /></svg>
            <span className="font-bold tracking-tight">VibeUI</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-full px-2 py-0.5">Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-zinc-500">Versi live <b className="text-zinc-900 dark:text-white">v{latest}</b></span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Statistik */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[['Total user', stats?.total], ['Pro', stats?.pro], ['Starter', stats?.starter], ['Free', stats?.free], ['Pool hari ini', stats?.pool]].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 p-4">
              <div className="text-xs text-zinc-500">{k}</div>
              <div className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{v ?? '—'}</div>
            </div>
          ))}
        </div>

        {msg && <p className="text-sm rounded-2xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 px-4 py-3">{msg}</p>}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-full border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 w-fit">
          {[['users', 'Pengguna'], ['changelog', 'Changelog'], ['system', 'Sistem']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={'rounded-full px-5 py-2 text-sm font-medium transition ' +
                (tab === id ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800')}>
              {label}
            </button>
          ))}
        </div>

        {/* ---------------- PENGGUNA ---------------- */}
        {tab === 'users' && (
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] items-start">
            <section className={card}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-semibold tracking-tight">Daftar Pengguna</h2>
                <button onClick={() => loadUsers(q)} className={ghost}>Muat ulang</button>
              </div>
              <div className="relative mb-4">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari ID atau email…" className={inp + ' pl-10'} />
              </div>

              <div className="max-h-[26rem] overflow-y-auto -mx-2 px-2 space-y-2">
                {loadingUsers && Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />)}
                {!loadingUsers && users.length === 0 && <p className="text-sm text-zinc-500 py-8 text-center">Belum ada user terdaftar.</p>}
                {!loadingUsers && users.map((u) => {
                  const active = sel?.clerk_user_id === u.clerk_user_id;
                  return (
                    <button key={u.clerk_user_id} onClick={() => pick(u)}
                      className={'w-full text-left rounded-2xl border p-3.5 transition ' +
                        (active ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/60'
                                : 'border-zinc-200 dark:border-zinc-800/60 hover:border-zinc-400 dark:hover:border-zinc-600')}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{u.email || u.clerk_user_id}</div>
                          <div className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">{u.clerk_user_id}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={'rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide font-medium ' + (TIER_STYLE[u.tier] || TIER_STYLE.free)}>{u.tier}</span>
                          {u.role !== 'user' && <span className="rounded-full border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 text-[10px] uppercase">{u.role}</span>}
                        </div>
                      </div>
                      <div className="mt-2 flex gap-4 text-[11px] text-zinc-500">
                        <span>Harian {u.daily_quota ?? 0}</span>
                        <span>Bonus {u.bonus_quota ?? 0}</span>
                        {u.ad_claimed_today && <span>Iklan ✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Editor user terpilih */}
            <section className={card + ' lg:sticky lg:top-24'}>
              <h2 className="font-semibold tracking-tight">Kelola Akun</h2>
              {!sel ? (
                <p className="text-sm text-zinc-500 mt-4 leading-relaxed">Pilih salah satu pengguna di daftar untuk mengubah tier, role, atau menambah kuota. Tidak perlu menyalin ID.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5">
                    <div className="text-sm font-medium truncate">{sel.email || '(tanpa email)'}</div>
                    <div className="text-[11px] font-mono text-zinc-500 break-all mt-1">{sel.clerk_user_id}</div>
                    {sel.subscription_expires_at && (
                      <div className="text-[11px] text-zinc-500 mt-2">Aktif s/d {new Date(sel.subscription_expires_at).toLocaleDateString('id-ID')}</div>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-medium text-zinc-500">Tier</label>
                    <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} className={inp}>
                      <option value="">— tidak diubah —</option>
                      <option value="free">free</option><option value="starter">starter</option><option value="pro">pro</option>
                    </select>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-medium text-zinc-500">Role</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inp}>
                      <option value="">— tidak diubah —</option>
                      <option value="user">user</option><option value="tester">tester</option>
                      <option value="maintainer">maintainer</option><option value="owner">owner</option>
                    </select>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-medium text-zinc-500">Tambah bonus kuota</label>
                    <input type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} placeholder="mis. 25" className={inp} />
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">Langganan dikunci maksimal +30 hari sesuai kebijakan billing manual.</p>
                  <div className="flex gap-2">
                    <button onClick={applyUser} className={btn}>Terapkan</button>
                    <button onClick={() => setSel(null)} className={ghost}>Batal</button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ---------------- CHANGELOG ---------------- */}
        {tab === 'changelog' && (
          <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] items-start">
            <section className={card}>
              <h2 className="font-semibold tracking-tight">Terbitkan Update</h2>

              <div className="mt-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Versi live sekarang</span>
                  <span className="font-mono font-semibold">v{latest}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-2.5 pt-2.5 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500">Versi berikutnya</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">v{suggested}</span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500">Jenis update</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['feature', 'fix', 'optimization'].map((t) => (
                      <button key={t} onClick={() => setCl({ ...cl, type: t })}
                        className={'rounded-full py-2 text-xs font-medium capitalize border transition ' +
                          (cl.type === t ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent'
                                         : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900')}>
                        {t === 'optimization' ? 'optimize' : t}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    {cl.type === 'feature' ? 'Feature menaikkan minor (x.Y.0).' : 'Fix & optimization menaikkan patch (x.y.Z).'}
                  </p>
                </div>

                <label className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <input type="checkbox" checked={cl.auto} onChange={(e) => setCl({ ...cl, auto: e.target.checked })} className="h-4 w-4 rounded" />
                  Nomor versi otomatis
                </label>
                {!cl.auto && (
                  <input value={cl.version} onChange={(e) => setCl({ ...cl, version: e.target.value })} placeholder="contoh 2.0.0" className={inp + ' font-mono'} />
                )}

                <input value={cl.title} onChange={(e) => setCl({ ...cl, title: e.target.value })} placeholder="Judul update" className={inp} />
                <textarea rows={3} value={cl.body} onChange={(e) => setCl({ ...cl, body: e.target.value })} placeholder="Deskripsi singkat…" className={inp + ' resize-none'} />
                <button onClick={publish} disabled={!cl.title.trim()} className={btn + ' w-full flex items-center justify-center gap-2'}>
                  <Bolt className="h-4 w-4" /> Terbitkan v{suggested}
                </button>
              </div>
            </section>

            <section className={card}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold tracking-tight">Histori Versi</h2>
                <span className="text-xs text-zinc-500">{logs.length} rilis</span>
              </div>
              <div className="max-h-[32rem] overflow-y-auto pr-1">
                <ol className="relative border-l border-zinc-200 dark:border-zinc-800 ml-3 space-y-5">
                  {logs.length === 0 && <p className="text-sm text-zinc-500 pl-6">Belum ada catatan rilis.</p>}
                  {logs.map((l, i) => (
                    <li key={l.id} className="pl-6">
                      <span className={'absolute -left-[6.5px] h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ' +
                        (i === 0 ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700')} />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold">v{l.version || '—'}</span>
                        {i === 0 && <span className="rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] uppercase tracking-wide">live</span>}
                        <span className={'rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ' + (TYPE_STYLE[l.type] || TYPE_STYLE.feature)}>{l.type}</span>
                      </div>
                      <h4 className="mt-1.5 text-sm font-medium">{l.title}</h4>
                      {l.body && <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{l.body}</p>}
                      <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-600">
                        {new Date(l.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          </div>
        )}

        {/* ---------------- SISTEM ---------------- */}
        {tab === 'system' && (
          <section className={card + ' max-w-2xl'}>
            <h2 className="font-semibold tracking-tight flex items-center gap-2"><Lock className="h-4 w-4" /> Sistem Beku Maintenance Global</h2>
            <label className="flex items-center gap-3 mt-4 text-sm">
              <input type="checkbox" checked={settings.maintenance} onChange={(e) => setSettings({ ...settings, maintenance: e.target.checked })} className="h-4 w-4 rounded" />
              Aktifkan mode perbaikan (dashboard dibekukan)
            </label>
            <textarea rows={3} value={settings.maintenance_message} onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })} className={inp + ' mt-3 resize-none'} placeholder="Pesan kustom ke user…" />
            <button className={btn + ' mt-4'} onClick={saveSettings}>Simpan</button>
            <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">Untuk mengunci seluruh situs dari sisi server, set variabel <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">MAINTENANCE_MODE=true</code>.</p>
          </section>
        )}
      </div>
    </main>
  );
}
