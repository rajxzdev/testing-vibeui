/**
 * Render tiap template di Chromium lalu simpan screenshot .webp asli.
 * Jalankan: node db/shoot_templates.mjs
 * Butuh: npm i -D playwright && npx playwright install chromium
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'public/assets/thumbnails');
const rows = JSON.parse(readFileSync(join(root, 'lib/templates.json'), 'utf8'));

// Tailwind CDN di-inline supaya render tidak bergantung jaringan & jauh lebih cepat
const TW = join(root, 'db/.tailwind-cdn.js');
const twSrc = existsSync(TW) ? readFileSync(TW, 'utf8') : null;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1200, height: 750 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

// blokir request eksternal; suntik Tailwind lokal
await page.route('**/*', (route) => {
  const url = route.request().url();
  if (url.includes('cdn.tailwindcss.com')) {
    if (twSrc) return route.fulfill({ status: 200, contentType: 'application/javascript', body: twSrc });
    return route.continue();
  }
  if (url.startsWith('data:') || url.startsWith('about:')) return route.continue();
  if (/^https?:/.test(url)) return route.abort();
  return route.continue();
});

let done = 0;
for (const t of rows) {
  const file = join(OUT, `${t.slug}.webp`);
  try {
    await page.setContent(t.code_html, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(450); // beri waktu Tailwind menyusun kelas
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 750 } });
    const tmp = join(OUT, `${t.slug}.tmp.png`);
    writeFileSync(tmp, png);
    // resize + konversi ke webp ringan
    execFileSync('python3', ['-c', `
from PIL import Image
im = Image.open(r"${tmp}").convert("RGB").resize((720, 450), Image.LANCZOS)
q = 82
while q >= 40:
    im.save(r"${file}", "WEBP", quality=q, method=6)
    import os
    if os.path.getsize(r"${file}") <= 60000: break
    q -= 8
`]);
    execFileSync('rm', ['-f', tmp]);
    done++;
    if (done % 10 === 0) console.log(`  ${done}/${rows.length}`);
  } catch (e) {
    console.warn(`  ! gagal ${t.slug}: ${e.message.slice(0, 80)}`);
  }
}

await browser.close();
console.log(`Selesai: ${done}/${rows.length} screenshot asli tersimpan di public/assets/thumbnails/`);
