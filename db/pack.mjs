/**
 * Membungkus proyek jadi vibeui-v1.zip, lalu v2, v3, ... otomatis.
 * Jalankan: npm run pack
 */
import { execSync } from 'node:child_process';
import { readdirSync, mkdirSync, rmSync, cpSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, '..');

// Nomor versi disimpan di db/.packver supaya TIDAK ikut mundur
// walaupun file zip lama dihapus/dipindahkan.
const verFile = join(root, 'db/.packver');
const saved = existsSync(verFile) ? Number(readFileSync(verFile, 'utf8').trim()) || 0 : 0;

// tetap lihat zip yang ada, ambil yang paling besar di antara keduanya
const onDisk = readdirSync(outDir)
  .map((f) => /^vibeui-v(\d+)\.zip$/.exec(f))
  .filter(Boolean)
  .map((m) => Number(m[1]));
const highest = Math.max(saved, ...(onDisk.length ? onDisk : [0]));

const next = highest + 1;
const name = `vibeui-v${next}`;

const SKIP = new Set(['node_modules', '.next', '.env.local', '.git', '.vercel']);
const stageRoot = '/tmp/vibeui-pack';
const staging = stageRoot;   // isi langsung di root zip, tanpa folder pembungkus

rmSync(stageRoot, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

for (const entry of execSync(`ls -A "${root}"`).toString().trim().split('\n')) {
  if (SKIP.has(entry)) continue;
  cpSync(join(root, entry), join(staging, entry), { recursive: true });
}
rmSync(join(staging, 'db/.tailwind-cdn.js'), { force: true });

const out = join(outDir, `${name}.zip`);
rmSync(out, { force: true });
// zip isinya langsung (termasuk berkas tersembunyi seperti .gitignore/.env.example)
execSync(`cd "${stageRoot}" && zip -rq -X "${out}" . -x '.DS_Store'`);
rmSync(stageRoot, { recursive: true, force: true });

writeFileSync(verFile, String(next));   // ingat untuk pack berikutnya

const count = execSync(`unzip -l "${out}" | tail -1`).toString().trim();
console.log(`✅ ${name}.zip`);
console.log(`   ${count}`);
console.log('   Isi langsung di root (package.json, app/, components/, …)');
