import { NextResponse } from 'next/server';
import { getUser, getGlobalPool, isUnlimited, getSettings } from '@/lib/db';
import { currentUserId, CLERK_ON } from '@/lib/auth';
import { GLOBAL_POOL_CAP } from '@/lib/utils';

export async function GET(req) {
  const userId = await currentUserId(req);
  let email = null;
  if (CLERK_ON) {
    try {
      const { currentUser } = await import('@clerk/nextjs/server');
      const cu = await currentUser();
      email = cu?.emailAddresses?.[0]?.emailAddress || null;
    } catch (_) {}
  }
  try {
    const u = await getUser(userId, email);
    return NextResponse.json({
      success: true,
      user: {
        id: userId, tier: u.tier, role: u.role, daily: u.daily_quota, bonus: u.bonus_quota,
        monthly: u.monthly_quota ?? 0, adClaimed: u.ad_claimed_today,
        unlimited: isUnlimited(u), expires: u.subscription_expires_at,
      },
      pool: await getGlobalPool(), poolCap: GLOBAL_POOL_CAP,
      settings: await getSettings(),
    });
  } catch (e) {
    return NextResponse.json({ success: true, failSafe: true, user: { id: userId, tier: 'free', role: 'user', daily: 5, bonus: 0, unlimited: false, adClaimed: false }, pool: 0, poolCap: GLOBAL_POOL_CAP, settings: { maintenance: false } });
  }
}
