export const Logo = ({ className = 'h-6 w-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2L2 22h20L12 2z" /></svg>
);
const S = ({ children, className = 'h-4 w-4', ...p }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
export const Sparkles = (p) => <S {...p}><path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" /><path d="M19 15l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9L19 15z" /></S>;
export const Copy = (p) => <S {...p}><rect x="9" y="9" width="12" height="12" rx="2.5" /><path d="M5 15V5a2 2 0 012-2h10" /></S>;
export const Check = (p) => <S {...p}><path d="M20 6L9 17l-5-5" /></S>;
export const Download = (p) => <S {...p}><path d="M12 3v12" /><path d="M7 12l5 5 5-5" /><path d="M4 21h16" /></S>;
export const Zip = (p) => <S {...p}><rect x="4" y="3" width="16" height="18" rx="2.5" /><path d="M12 3v3M12 8v2M12 12v2" /></S>;
export const Doc = (p) => <S {...p}><path d="M14 3v5h5" /><path d="M19 8v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5z" /><path d="M9 13h6M9 17h4" /></S>;
export const Reset = (p) => <S {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></S>;
export const Wand = (p) => <S {...p}><path d="M15 4V2M15 10V8M11 6H9M21 6h-2" /><path d="M4 20l10-10 2 2L6 22z" /></S>;
export const Desktop = (p) => <S {...p}><rect x="2.5" y="4" width="19" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></S>;
export const Tablet = (p) => <S {...p}><rect x="6" y="3" width="12" height="18" rx="2.5" /><path d="M11 18h2" /></S>;
export const Mobile = (p) => <S {...p}><rect x="8" y="2.5" width="8" height="19" rx="2.5" /><path d="M11 19h2" /></S>;
export const Search = (p) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></S>;
export const Lock = (p) => <S {...p}><rect x="4" y="10" width="16" height="10" rx="2.5" /><path d="M8 10V7a4 4 0 118 0v3" /></S>;
export const Play = (p) => <S {...p}><path d="M7 4l12 8-12 8V4z" /></S>;
export const Sun = (p) => <S {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></S>;
export const Moon = (p) => <S {...p}><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /></S>;
export const Bolt = (p) => <S {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></S>;
export const X = (p) => <S {...p}><path d="M6 6l12 12M18 6L6 18" /></S>;
