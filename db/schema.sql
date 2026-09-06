-- VibeUI — jalankan di Vercel Postgres / Neon
CREATE TABLE IF NOT EXISTS user_limits (
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
);
CREATE TABLE IF NOT EXISTS web_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(120) NOT NULL,
  category VARCHAR(60) DEFAULT 'landing',
  is_premium BOOLEAN DEFAULT FALSE,
  screenshot_url TEXT,
  code_html TEXT
);
CREATE TABLE IF NOT EXISTS global_pool (pool_date DATE PRIMARY KEY, used INT DEFAULT 0);
CREATE TABLE IF NOT EXISTS app_settings (key VARCHAR(60) PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS changelogs (
  id SERIAL PRIMARY KEY,
  version VARCHAR(20),
  type VARCHAR(20) DEFAULT 'feature',
  title VARCHAR(160), body TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
-- migrasi untuk DB yang sudah terlanjur dibuat sebelum fitur versi
ALTER TABLE changelogs ADD COLUMN IF NOT EXISTS version VARCHAR(20);
ALTER TABLE user_limits ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY, order_id VARCHAR(120) UNIQUE, clerk_user_id VARCHAR(191),
  plan VARCHAR(30), amount INT, status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS api_error_logs (
  id SERIAL PRIMARY KEY, scope VARCHAR(60), ref VARCHAR(160),
  message TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manual billing (Owner): perpanjang tepat +30 hari
-- UPDATE user_limits SET tier='pro', subscription_expires_at = NOW() + INTERVAL '30 days' WHERE clerk_user_id='user_xxx';
