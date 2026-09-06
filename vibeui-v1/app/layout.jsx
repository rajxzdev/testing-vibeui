import './globals.css';
import Script from 'next/script';
import { ThemeProvider, ThemeScript } from '@/components/ui/Providers';

export const metadata = {
  title: 'VibeUI — AI Web Design Generator Rp 0',
  description: 'Ubah teks jadi desain website Tailwind dalam hitungan detik. Gratis 5x sehari, ekspor .html & .zip.',
  icons: { icon: '/favicon.svg' },
};

const CLERK_ON = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('xxx');

function Shell({ children }) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body className="bg-white text-zinc-900 dark:bg-black dark:text-zinc-50 antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}

export default function RootLayout({ children }) {
  if (CLERK_ON) {
    const { ClerkProvider } = require('@clerk/nextjs');
    return <ClerkProvider appearance={{ variables: { colorPrimary: '#ffffff', borderRadius: '1rem' } }}><Shell>{children}</Shell></ClerkProvider>;
  }
  return <Shell>{children}</Shell>;
}
