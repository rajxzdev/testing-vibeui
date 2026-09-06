// Wrapper Clerk yang tetap jalan (mode demo) kalau key Clerk belum diisi.
export const CLERK_ON = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('xxx');

export async function currentUserId(req) {
  if (CLERK_ON) {
    try {
      const { auth } = await import('@clerk/nextjs/server');
      const { userId } = await auth();
      if (userId) return userId;
    } catch (_) {}
  }
  try {
    const body = req?.__body;
    if (body?.userId) return String(body.userId).slice(0, 190);
  } catch (_) {}
  return 'demo_user_local';
}

export function originGuard(req) {
  const allowed = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN;
  if (!allowed) return true;
  const origin = req.headers.get('origin');
  if (!origin) return true; // cURL / server-to-server
  try { return new URL(origin).host === new URL(allowed).host || origin.includes('e2b.app') || origin.includes('localhost'); }
  catch { return false; }
}

export async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || secret.includes('AAAAAAA')) return true; // belum dikonfigurasi -> skip
  if (!token) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    });
    const j = await r.json();
    return !!j.success;
  } catch { return true; }
}

export async function requireAdmin() {
  if (!CLERK_ON) return { ok: true, role: 'owner', userId: 'demo_user_local' };
  try {
    const { auth, currentUser } = await import('@clerk/nextjs/server');
    const { userId } = await auth();
    if (!userId) return { ok: false };
    const u = await currentUser();
    const email = u?.emailAddresses?.[0]?.emailAddress || '';
    const owners = (process.env.OWNER_EMAILS || '').split(',').map((s) => s.trim().toLowerCase());
    if (owners.includes(email.toLowerCase())) return { ok: true, role: 'owner', userId };
    const { getUser } = await import('./db');
    const row = await getUser(userId, email);
    if (['owner', 'maintainer'].includes(row?.role)) return { ok: true, role: row.role, userId };
    return { ok: false };
  } catch { return { ok: false }; }
}
