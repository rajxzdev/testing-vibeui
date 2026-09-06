import { NextResponse } from 'next/server';

const CLERK_ON = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('xxx');

export default function middleware(req) {
  // Maintenance freeze global untuk dashboard (flag dibaca via cookie/env cepat)
  if (process.env.MAINTENANCE_MODE === 'true' && req.nextUrl.pathname.startsWith('/dashboard')) {
    const url = req.nextUrl.clone();
    url.pathname = '/maintenance';
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|.*\\..*).*)'] };
