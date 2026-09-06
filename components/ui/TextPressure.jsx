'use client';
import { useRef } from 'react';

/** Text Pressure — huruf membesar merespon kursor (reactbits style). */
export default function TextPressure({ text, className = '' }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const spans = ref.current?.querySelectorAll('span[data-l]');
    if (!spans) return;
    spans.forEach((s) => {
      const r = s.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      const f = Math.max(0, 1 - d / 220);
      s.style.transform = `translateY(${-10 * f}px) scale(${1 + f * 0.28})`;
      s.style.opacity = String(0.72 + f * 0.28);
    });
  };
  const reset = () => ref.current?.querySelectorAll('span[data-l]').forEach((s) => { s.style.transform = ''; s.style.opacity = ''; });
  return (
    <h1 ref={ref} onMouseMove={onMove} onMouseLeave={reset} className={className}>
      {text.split('').map((c, i) => (
        <span key={i} data-l className="inline-block transition-transform duration-200 ease-out will-change-transform">
          {c === ' ' ? '\u00A0' : c}
        </span>
      ))}
    </h1>
  );
}
