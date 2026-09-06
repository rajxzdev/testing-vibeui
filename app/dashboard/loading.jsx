export default function Loading() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white dark:bg-black">
      <div className="h-14 shrink-0 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center px-4 gap-3">
        <div className="h-6 w-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </div>
      <div className="flex-1 flex flex-col md:flex-row">
        <div className="w-full md:w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-800/60 p-3 space-y-3">
          <div className="h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />)}
        </div>
        <div className="flex-1 p-6"><div className="w-full h-full rounded-3xl bg-zinc-100 dark:bg-zinc-900/60 animate-pulse" /></div>
        <div className="w-full md:w-80 shrink-0 border-l border-zinc-200 dark:border-zinc-800/60 p-4 space-y-3">
          <div className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
