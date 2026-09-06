// Adapter DB: pakai @vercel/postgres kalau POSTGRES_URL ada,
// kalau tidak -> fallback memori (mode demo/localhost tanpa DB).
import { FREE_DAILY, GLOBAL_POOL_CAP } from './utils';

const PG_URL = process.env.POSTGRES_URL || '';
const HAS_PG = !!PG_URL && !/user:pass@host|placeholder|xxx/i.test(PG_URL);
let sql = null;
if (HAS_PG) {
  try { sql = require('@vercel/postgres').sql; } catch (e) { /* noop */ }
}
export const dbReady = () => !!sql;

/* ---------------- fallback memory store ---------------- */
const mem = globalThis.__vibeui_mem || (globalThis.__vibeui_mem = {
  users: new Map(),
  global: { day: today(), used: 0 },
  settings: { maintenance: false, maintenance_message: 'VibeUI sedang perbaikan singkat. Balik lagi sebentar lagi ya.' },
  changelogs: [
    { id: 2, version: '1.1.0', type: 'feature', title: 'AI Self-Healing per komponen', body: 'Klik elemen di kanvas lalu Fix via AI.', created_at: new Date().toISOString() },
    { id: 1, version: '1.0.0', type: 'optimization', title: 'Rilis perdana VibeUI', body: 'Studio kebuka instan tanpa DOM bloat, thumbnail webp di bawah 60KB.', created_at: new Date(Date.now() - 864e5).toISOString() },
  ],
  logs: [],
});
function today() { return new Date().toISOString().slice(0, 10); }

function memUser(id) {
  if (!mem.users.has(id)) {
    mem.users.set(id, {
      clerk_user_id: id, tier: 'free', role: 'user', daily_quota: FREE_DAILY,
      bonus_quota: 0, ad_claimed_today: false, last_reset: today(),
      subscription_expires_at: null,
    });
  }
  const u = mem.users.get(id);
  if (u.last_reset !== today()) { u.daily_quota = FREE_DAILY; u.ad_claimed_today = false; u.last_reset = today(); }
  if (mem.global.day !== today()) { mem.global = { day: today(), used: 0 }; }
  return u;
}

/* ---------------- schema ---------------- */
export async function ensureSchema() {
  if (!sql) return false;
  await sql`CREATE TABLE IF NOT EXISTS user_limits (
    clerk_user_id VARCHAR(191) PRIMARY KEY,
    email VARCHAR(255),
    tier VARCHAR(20) DEFAULT 'free',
    role VARCHAR(20) DEFAULT 'user',
    daily_quota INT DEFAULT 5,
    bonus_quota INT DEFAULT 0,
    monthly_quota INT DEFAULT 0,
    ad_claimed_today BOOLEAN DEFAULT FALSE,
    last_reset DATE DEFAULT CURRENT_DATE,
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS web_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(120) NOT NULL,
    category VARCHAR(60) DEFAULT 'landing',
    is_premium BOOLEAN DEFAULT FALSE,
    screenshot_url TEXT,
    code_html TEXT
  )`;
  await sql`CREATE TABLE IF NOT EXISTS global_pool (
    pool_date DATE PRIMARY KEY,
    used INT DEFAULT 0
  )`;
  await sql`CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(60) PRIMARY KEY,
    value TEXT
  )`;
  await sql`CREATE TABLE IF NOT EXISTS changelogs (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20),
    type VARCHAR(20) DEFAULT 'feature',
    title VARCHAR(160),
    body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  // migrasi lembut untuk DB lama yang belum punya kolom version
  await sql`ALTER TABLE changelogs ADD COLUMN IF NOT EXISTS version VARCHAR(20)`;
  await sql`ALTER TABLE user_limits ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ`;
  await sql`CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(120) UNIQUE,
    clerk_user_id VARCHAR(191),
    plan VARCHAR(30),
    amount INT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS api_error_logs (
    id SERIAL PRIMARY KEY,
    scope VARCHAR(60),
    ref VARCHAR(160),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  return true;
}

/* ---------------- user ---------------- */
export async function getUser(userId, email = null) {
  if (!sql) return memUser(userId);
  await ensureSchema();
  await sql`INSERT INTO user_limits (clerk_user_id, email) VALUES (${userId}, ${email})
            ON CONFLICT (clerk_user_id) DO NOTHING`;
  await sql`UPDATE user_limits SET daily_quota = 5, ad_claimed_today = FALSE, last_reset = CURRENT_DATE
            WHERE clerk_user_id = ${userId} AND last_reset < CURRENT_DATE`;
  const { rows } = await sql`SELECT * FROM user_limits WHERE clerk_user_id = ${userId}`;
  const u = rows[0];
  if (u && u.subscription_expires_at && new Date(u.subscription_expires_at) < new Date() && u.tier !== 'free') {
    await sql`UPDATE user_limits SET tier='free' WHERE clerk_user_id=${userId}`;
    u.tier = 'free';
  }
  return u;
}

export function isUnlimited(u) {
  return u.tier === 'pro' || u.role === 'tester' || u.role === 'owner' || u.role === 'maintainer';
}

export async function consumeQuota(userId, cost = 1) {
  const u = await getUser(userId);
  if (isUnlimited(u)) return { ok: true, user: u, unlimited: true, cost: 0 };

  const c = Math.max(1, Number(cost) || 1);

  if (u.tier === 'starter') {
    if ((u.monthly_quota ?? 0) + (u.bonus_quota ?? 0) < c)
      return { ok: false, reason: 'quota', user: u, needed: c };
  } else {
    const pool = await getGlobalPool();
    if (pool + c > GLOBAL_POOL_CAP) return { ok: false, reason: 'global', user: u, needed: c };
    if ((u.daily_quota ?? 0) + (u.bonus_quota ?? 0) < c)
      return { ok: false, reason: 'quota', user: u, needed: c };
  }

  // ---- mode in-memory (tanpa DB) ----
  if (!sql) {
    let left = c;
    if (u.tier === 'starter') {
      const take = Math.min(u.monthly_quota ?? 0, left);
      u.monthly_quota -= take; left -= take;
      if (left > 0) { u.bonus_quota -= left; left = 0; }
    } else {
      const take = Math.min(u.daily_quota ?? 0, left);
      u.daily_quota -= take; left -= take;
      if (left > 0) { u.bonus_quota -= left; left = 0; }
      mem.global.used += c;
    }
    return { ok: true, user: u, cost: c };
  }

  // ---- mode Postgres: potong daily dulu, sisanya dari bonus ----
  if (u.tier === 'starter') {
    const fromMonthly = Math.min(u.monthly_quota ?? 0, c);
    const fromBonus = c - fromMonthly;
    await sql`UPDATE user_limits
              SET monthly_quota = GREATEST(monthly_quota - ${fromMonthly}, 0),
                  bonus_quota   = GREATEST(bonus_quota   - ${fromBonus}, 0)
              WHERE clerk_user_id = ${userId}`;
  } else {
    const fromDaily = Math.min(u.daily_quota ?? 0, c);
    const fromBonus = c - fromDaily;
    await sql`UPDATE user_limits
              SET daily_quota = GREATEST(daily_quota - ${fromDaily}, 0),
                  bonus_quota = GREATEST(bonus_quota - ${fromBonus}, 0)
              WHERE clerk_user_id = ${userId}`;
    await sql`INSERT INTO global_pool (pool_date, used) VALUES (CURRENT_DATE, ${c})
              ON CONFLICT (pool_date) DO UPDATE SET used = global_pool.used + ${c}`;
  }
  return { ok: true, user: await getUser(userId), cost: c };
}

export async function claimAdBonus(userId) {
  const u = await getUser(userId);
  if (u.ad_claimed_today) return { ok: false, reason: 'sudah klaim hari ini' };
  if (!sql) { u.ad_claimed_today = true; u.bonus_quota = (u.bonus_quota || 0) + 2; return { ok: true, user: u }; }
  await sql`UPDATE user_limits SET bonus_quota = bonus_quota + 2, ad_claimed_today = TRUE WHERE clerk_user_id=${userId}`;
  return { ok: true, user: await getUser(userId) };
}

export async function getGlobalPool() {
  if (!sql) { if (mem.global.day !== today()) mem.global = { day: today(), used: 0 }; return mem.global.used; }
  const { rows } = await sql`SELECT used FROM global_pool WHERE pool_date = CURRENT_DATE`;
  return rows[0]?.used ?? 0;
}

export async function setTier(userId, tier, days = 30) {
  if (!sql) {
    const u = memUser(userId); u.tier = tier;
    u.subscription_expires_at = new Date(Date.now() + days * 864e5).toISOString();
    if (tier === 'starter') u.monthly_quota = 100;
    return u;
  }
  await sql`INSERT INTO user_limits (clerk_user_id) VALUES (${userId}) ON CONFLICT DO NOTHING`;
  await sql`UPDATE user_limits SET tier=${tier},
            subscription_expires_at = NOW() + (${days} || ' days')::interval,
            monthly_quota = CASE WHEN ${tier}='starter' THEN 100 ELSE monthly_quota END
            WHERE clerk_user_id=${userId}`;
  return getUser(userId);
}

export async function addBonus(userId, n) {
  if (!sql) { const u = memUser(userId); u.bonus_quota += n; return u; }
  await sql`UPDATE user_limits SET bonus_quota = bonus_quota + ${n} WHERE clerk_user_id=${userId}`;
  return getUser(userId);
}

export async function setRole(userId, role) {
  if (!sql) { const u = memUser(userId); u.role = role; return u; }
  await sql`UPDATE user_limits SET role=${role} WHERE clerk_user_id=${userId}`;
  return getUser(userId);
}

/* ---------------- settings & changelogs ---------------- */
export async function getSettings() {
  if (!sql) return mem.settings;
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM app_settings`;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    maintenance: map.maintenance === 'true',
    maintenance_message: map.maintenance_message || 'VibeUI sedang perbaikan singkat.',
  };
}
export async function setSetting(key, value) {
  if (!sql) { mem.settings[key] = key === 'maintenance' ? value === 'true' || value === true : value; return mem.settings; }
  await sql`INSERT INTO app_settings (key, value) VALUES (${key}, ${String(value)})
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  return getSettings();
}
export async function getChangelogs() {
  if (!sql) return mem.changelogs;
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM changelogs ORDER BY created_at DESC LIMIT 50`;
  return rows;
}
export async function addChangelog(type, title, body, version) {
  const v = version || (await suggestNextVersion(type));
  if (!sql) {
    mem.changelogs.unshift({ id: Date.now(), version: v, type, title, body, created_at: new Date().toISOString() });
    return mem.changelogs;
  }
  await sql`INSERT INTO changelogs (version,type,title,body) VALUES (${v},${type},${title},${body})`;
  return getChangelogs();
}

/* ---- Versioning semver otomatis ----
   feature -> minor (1.2.0), fix/optimization -> patch (1.1.3) */
export function bumpVersion(latest = '0.0.0', type = 'feature') {
  const [a, b, c] = String(latest).split('.').map((n) => parseInt(n, 10) || 0);
  return type === 'feature' ? `${a}.${b + 1}.0` : `${a}.${b}.${c + 1}`;
}

export async function getLatestVersion() {
  const items = await getChangelogs();
  const versions = items.map((i) => i.version).filter(Boolean);
  if (!versions.length) return '1.0.0';
  // urutkan semver menurun, ambil tertinggi
  versions.sort((x, y) => {
    const px = x.split('.').map(Number), py = y.split('.').map(Number);
    return (py[0] - px[0]) || (py[1] - px[1]) || (py[2] - px[2]);
  });
  return versions[0];
}

export async function suggestNextVersion(type = 'feature') {
  return bumpVersion(await getLatestVersion(), type);
}

/* ---------------- daftar user untuk Admin ---------------- */
export async function listUsers({ q = '', limit = 100 } = {}) {
  if (!sql) {
    const all = Array.from(mem.users.values());
    const filtered = q
      ? all.filter((u) => (u.clerk_user_id + ' ' + (u.email || '')).toLowerCase().includes(q.toLowerCase()))
      : all;
    return filtered.slice(0, limit);
  }
  await ensureSchema();
  if (q) {
    const like = `%${q}%`;
    const { rows } = await sql`SELECT * FROM user_limits
      WHERE clerk_user_id ILIKE ${like} OR email ILIKE ${like}
      ORDER BY created_at DESC LIMIT ${limit}`;
    return rows;
  }
  const { rows } = await sql`SELECT * FROM user_limits ORDER BY created_at DESC LIMIT ${limit}`;
  return rows;
}

export async function adminStats() {
  if (!sql) {
    const all = Array.from(mem.users.values());
    return {
      total: all.length,
      pro: all.filter((u) => u.tier === 'pro').length,
      starter: all.filter((u) => u.tier === 'starter').length,
      free: all.filter((u) => u.tier === 'free').length,
      pool: mem.global.used,
    };
  }
  await ensureSchema();
  const { rows } = await sql`SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE tier='pro')::int AS pro,
    COUNT(*) FILTER (WHERE tier='starter')::int AS starter,
    COUNT(*) FILTER (WHERE tier='free')::int AS free
    FROM user_limits`;
  return { ...rows[0], pool: await getGlobalPool() };
}
export async function logError(scope, ref, message) {
  try {
    if (!sql) { mem.logs.push({ scope, ref, message, at: Date.now() }); return; }
    await sql`INSERT INTO api_error_logs (scope, ref, message) VALUES (${scope},${ref},${message})`;
  } catch (_) {}
}
export async function resetDaily() {
  if (!sql) {
    for (const u of mem.users.values()) { u.daily_quota = FREE_DAILY; u.ad_claimed_today = false; u.last_reset = today(); }
    mem.global = { day: today(), used: 0 };
    return { updated: mem.users.size };
  }
  await ensureSchema();
  const r = await sql`UPDATE user_limits SET daily_quota = 5, ad_claimed_today = FALSE, last_reset = CURRENT_DATE`;
  await sql`INSERT INTO global_pool (pool_date, used) VALUES (CURRENT_DATE, 0)
            ON CONFLICT (pool_date) DO UPDATE SET used = 0`;
  return { updated: r.rowCount };
}
