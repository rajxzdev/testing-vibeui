import { getSettings } from '@/lib/db';
import { Logo } from '@/components/ui/Icons';
export const dynamic = 'force-dynamic';

export default async function Maintenance() {
  const s = await getSettings().catch(() => ({ maintenance_message: 'VibeUI sedang perbaikan singkat.' }));
  return (
    <main className="min-h-screen bg-black text-zinc-50 flex items-center justify-center p-6 vibe-grid">
      <div className="max-w-lg text-center rounded-4xl border border-zinc-800/60 bg-zinc-900/50 backdrop-blur p-12">
        <div className="flex items-center justify-center gap-2 mb-6"><Logo /><span className="font-bold tracking-tight text-lg">VibeUI</span></div>
        <h1 className="text-3xl font-bold tracking-tight">Mode Perbaikan</h1>
        <p className="text-zinc-400 mt-4 leading-relaxed">{s.maintenance_message}</p>
      </div>
    </main>
  );
}
