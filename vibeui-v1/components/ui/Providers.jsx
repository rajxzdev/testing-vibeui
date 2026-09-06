'use client';
import { useEffect, useState, createContext, useContext } from 'react';

const ThemeCtx = createContext({ theme: 'dark', setTheme: () => {}, toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('vibeui-theme');
    const initial = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    apply(initial); setThemeState(initial);

    // ikuti preferensi OS selama user belum memilih manual
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e) => {
      if (localStorage.getItem('vibeui-theme')) return;
      const t = e.matches ? 'light' : 'dark';
      apply(t); setThemeState(t);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const apply = (t) => {
    const el = document.documentElement;
    el.classList.toggle('dark', t === 'dark');
    el.style.colorScheme = t; // scrollbar & form control native ikut tema
  };

  const setTheme = (t) => { apply(t); setThemeState(t); localStorage.setItem('vibeui-theme', t); };
  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return <ThemeCtx.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeCtx.Provider>;
}

/** Script anti-kedip: jalan sebelum paint pertama. */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('vibeui-theme')||(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');var e=document.documentElement;e.classList.toggle('dark',t==='dark');e.style.colorScheme=t;}catch(_){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button onClick={toggle} type="button"
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
      className={'relative h-9 w-9 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition ' + className}>
      <svg className={'h-4 w-4 absolute transition-all duration-300 ' + (isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50')}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
      </svg>
      <svg className={'h-4 w-4 absolute transition-all duration-300 ' + (isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100')}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
      </svg>
    </button>
  );
}

export function Reveal({ children, className = '', delay = 0 }) {
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.12 });
    document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
  return <div className={'reveal ' + className} style={{ transitionDelay: delay + 'ms' }}>{children}</div>;
}
