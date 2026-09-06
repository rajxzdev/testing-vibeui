/**
 * Membungkus proyek jadi vibeui-v1.zip, lalu v2, v3, ... otomatis.
 * Jalankan: npm run pack
 */
import { execSync } from 'node:child_process';
import { readdirSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, '..');

// cari versi terbesar yang sudah ada -> pakai angka berikutnya
const used = readdirSync(outDir)
  .map((f) => /^vibeui-v(\d+)\.zip$/.exec(f))
  .filter(Boolean)
  .map((m) => Number(m[1]));
const next = used.length ? Math.max(...used) + 1 : 1;
const name = `vibeui-v${next}`;

const SKIP = new Set(['node_modules', '.next', '.env.local', '.git', '.vercel']);
const stageRoot = '/tmp/vibeui-pack';
const staging = join(stageRoot, name);

rmSync(stageRoot, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

for (const entry of execSync(`ls -A "${root}"`).toString().trim().split('\n')) {
  if (SKIP.has(entry)) continue;
  cpSync(join(root, entry), join(staging, entry), { recursive: true });
}
rmSync(join(staging, 'db/.tailwind-cdn.js'), { force: true });

const out = join(outDir, `${name}.zip`);
rmSync(out, { force: true });
execSync(`cd "${stageRoot}" && zip -rq -X "${out}" "${name}"`);
rmSync(stageRoot, { recursive: true, force: true });

const count = execSync(`unzip -l "${out}" | tail -1`).toString().trim();
console.log(`✅ ${name}.zip`);
console.log(`   ${count}`);
console.log(`   Folder di dalam zip: ${name}/`);
