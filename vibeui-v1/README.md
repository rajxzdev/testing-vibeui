# VibeUI — AI Web Design Generator (Next.js Monolith)

Studio desain web bertenaga AI ala Stitch. Prompt teks → HTML + Tailwind siap pakai,
kanvas interaktif tersandbox, klik komponen untuk Self-Healing, ekspor .html / .zip / brief.

---

## 🚀 Quick Start (localhost)

```bash
npm install
cp .env.example .env.local     # isi kredensialmu
npm run dev
```

Buka **http://localhost:3000** (landing) atau **http://localhost:3000/dashboard** (Studio).

> **Mode Demo**: aplikasi tetap jalan walau `.env.local` belum diisi.
> Tanpa `POSTGRES_URL` → kuota disimpan di memori. Tanpa Clerk → user `demo_user_local`.
> Tanpa Turnstile → captcha di-skip. Hanya `OPENROUTER_KEY_*` yang wajib agar AI berfungsi.

---

## 🔑 Environment Variables

Semua ada di `.env.example`. Yang wajib untuk produksi:

| Grup | Variabel |
|---|---|
| Clerk | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| Database | `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING` |
| OpenRouter | `OPENROUTER_KEY_1..3`, `OPENROUTER_FREE_MODEL`, `OPENROUTER_PRO_MODEL` |
| Monetag | `NEXT_PUBLIC_MONETAG_SMARTLINK_URL` |
| Pakasir | `PAKASIR_API_KEY`, `PAKASIR_PROJECT_SLUG`, `PAKASIR_WEBHOOK_TOKEN` |
| Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| Sistem | `CRON_SECRET`, `NEXT_PUBLIC_ALLOWED_ORIGIN`, `OWNER_EMAILS` |

---

## 🗄️ Setup Database

1. Vercel Dashboard → **Storage** → Create Postgres (env otomatis ter-inject).
2. Jalankan `db/schema.sql` di SQL editor.
3. (Opsional) seed 100 template ke DB: `npm run seed`
   — tidak wajib, app membaca `lib/templates.json` secara default (lebih cepat, 0 query).

---

## 🖼️ Regenerasi Thumbnail Template

Thumbnail di `public/assets/thumbnails/` adalah **screenshot asli** tiap template yang
dirender di Chromium (bukan mockup). Kalau Anda mengubah/menambah template di
`lib/templates.json`, buat ulang gambarnya dengan:

```bash
npm i -D playwright && npx playwright install chromium
npm run shoot
```

Nama berkas mengikuti slug deskriptif dari nama + palet template
(mis. `nimbus-hero-center-noir.webp`, `console-dashboard-bone.webp`),
bukan penomoran `tpl-001`, supaya mudah dikenali dan tidak rawan tertukar.

Script `db/shoot_templates.mjs` merender tiap template pada viewport 1280×800,
memotretnya, lalu menurunkannya ke `.webp` 480×300 dengan kualitas adaptif
(turun otomatis sampai file di bawah 60KB). Saat ini file terbesar hanya ~8KB.
Tailwind CDN di-inline dari `db/.tailwind-cdn.js` supaya render cepat dan tidak
bergantung jaringan; request eksternal lain diblokir.

> Catatan: jangan menaruh `playwright` di `dependencies` — cukup `devDependencies`,
> agar build Vercel tetap ramping.

---

## 🧪 Testing cURL

**Generate AI**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_test_123","userPrompt":"Bikin tombol checkout ungu","turnstileToken":"XXXX"}'
```

**Simulasi reset jam 12 malam**
```bash
curl -X POST http://localhost:3000/api/cron-reset \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Klaim bonus iklan (+2)**
```bash
curl -X POST http://localhost:3000/api/refill-ad \
  -H "Content-Type: application/json" -d '{"watchedMs":11000}'
```

**Cek kuota**
```bash
curl http://localhost:3000/api/me
```

---

## 📁 Struktur

```
app/
  layout.jsx              ClerkProvider + script Turnstile
  page.jsx                Landing (hero Text Pressure, pricing, changelog)
  dashboard/page.jsx      Studio (next/dynamic)
  dashboard/loading.jsx   Skeleton loader 0.1s
  admin/page.jsx          Admin Control Panel
  maintenance/page.jsx    Halaman beku global
  api/generate            Proxy AI: rotasi key, sanitize, kuota, scraper
  api/refill-ad           Bonus +2 dari Monetag (1x/hari)
  api/cron-reset          Reset kuota, dikunci CRON_SECRET
  api/templates[/id]      Katalog + gating premium
  api/me                  Status kuota user
  api/billing/checkout    Invoice Pakasir (QRIS/VA)
  api/billing/webhook     Notifikasi lunas → naikkan tier
  api/billing/sync        Tombol "Cek Status Transaksi" manual
  api/admin/users         GET daftar user + statistik, POST ubah tier/role/bonus
  api/admin/changelogs    GET histori versi + saran versi berikutnya, POST terbitkan
  api/admin/settings      Maintenance global
components/
  sidebar/TemplateSelector.jsx   100 template + thumbnail .webp
  canvas/LivePreview.jsx         iframe sandbox + useMemo + klik komponen
  controls/AiPanel.jsx           Prompt, URL ref, Turnstile, kartu kuota
  controls/ExportPanel.jsx       Copy, .html, .zip, brief .txt
  StudioClient.jsx               Orkestrator state Studio
lib/
  utils.js  db.js  ai.js  auth.js  plans.js  exportHelpers.js  templates.json
public/assets/thumbnails/        100 file .webp (~1.5KB each)
db/schema.sql  db/seed.mjs  vercel.json  middleware.js
```

---

## 🎯 Alur Pemakaian (ala Stitch)

1. **Kolom chat di tengah** — Studio dibuka dengan satu kolom prompt besar, belum ada kanvas.
2. **(Opsional) pilih referensi** — tombol *Referensi* membuka galeri 100 template.
   Template **tidak langsung jadi hasil**; ia menempel sebagai chip dan dikirim ke AI
   sebagai acuan struktur & gaya visual.
3. **Pilih mode generate** — ada dua, dengan biaya kredit berbeda:

   | Mode | Biaya | Yang terjadi |
   |---|---|---|
   | **Cepat** | **1 kredit** | Hasil langsung tampil, tanpa progres per token |
   | **Berjalan** | **2 kredit** | Streaming live: tahapan + hitungan karakter + cuplikan kode yang sedang diketik AI |

   Biaya ditampilkan di tombol (`Generate · 1c` / `Generate · 2c`) sebelum diklik.
   Kalau sisa kredit < 2, mode Berjalan otomatis ditolak dengan pesan jelas dan
   user diarahkan memakai mode Cepat. *Fix via AI* (self-healing) selalu 1 kredit.

4. **Generate** — panel progres menampilkan tahapan berjalan secara live
   (menyiapkan → membaca referensi → AI menyusun → merender) lengkap dengan
   hitungan karakter dan cuplikan kode yang sedang diketik AI, via SSE streaming.
5. **Kanvas muncul** — setelah selesai, layar berubah jadi kanvas pratinjau
   dan kolom chat menyusut jadi dock di bawah untuk iterasi lanjutan.

---

## ⚙️ Cara Kerja Fitur Kunci

- **Rotasi API Key** — `lib/ai.js` mengacak `OPENROUTER_KEY_1..3` via `Math.random()`, lompat otomatis saat 429.
- **Scraper Rp 0** — fetch `r.jina.ai/<url>` dengan `AbortController` timeout 4 detik; gagal → fallback mode teks.
- **Sanitasi** — prompt dipotong 300 karakter, regex menolak XSS/SQLi/prompt-injection, dan memblokir URL liar di kolom prompt.
- **Self-Healing** — script bridge di iframe mengirim `postMessage` berisi `outerHTML` komponen; hasil perbaikan AI menggantikan potongan itu saja. Dikunci untuk tier Pro.
- **Kuota** — 5/hari + bonus iklan, pool global 140/hari. DB error → *fail-safe*: request diloloskan tanpa memotong kuota.
- **Refund otomatis** — kalau AI gagal, kuota dikembalikan ke user.

---

## ☁️ Deploy ke Vercel

1. `git init && git add . && git commit -m "launch vibeui" && git push origin main`
2. Import repo di Vercel → tambahkan semua Environment Variables.
3. Ubah `NEXT_PUBLIC_ALLOWED_ORIGIN` → `https://vibeui.vercel.app`.
4. Storage → Postgres → jalankan `db/schema.sql`.
5. Pakasir dashboard → webhook `https://vibeui.vercel.app/api/billing/webhook`.
6. Cloudflare Turnstile → daftarkan domain `vibeui.vercel.app`.
7. Tab **Cron** Vercel: pastikan `/api/cron-reset` terjadwal `0 0 * * *`.

**Freeze maintenance:** set env `MAINTENANCE_MODE=true` (middleware) atau toggle di `/admin`.

---

## 🛠️ Panel Admin (`/admin`)

Akses: email terdaftar di `OWNER_EMAILS`, atau akun ber-`role` **owner/maintainer**.

**Tab Pengguna** — daftar semua akun langsung dari database lengkap dengan email, tier,
role, sisa kuota, dan status klaim iklan. Klik satu baris untuk memuat editor di samping;
**tidak perlu menyalin `clerk_user_id` sama sekali**. Ada pencarian (ID atau email) dan
kartu statistik total/pro/starter/free/pool.

**Tab Changelog** — setiap rilis punya nomor versi semver:

| Jenis | Efek | Contoh |
|---|---|---|
| `feature` | naik **minor** | 1.1.0 → 1.2.0 |
| `fix` | naik **patch** | 1.2.0 → 1.2.1 |
| `optimization` | naik **patch** | 1.2.1 → 1.2.2 |

Panel menampilkan **versi live sekarang** dan **versi berikutnya** sebelum Anda menerbitkan,
jadi selalu jelas update nanti jadi v berapa. Centang *Nomor versi otomatis* dimatikan kalau
Anda mau lompat manual (mis. `2.0.0` untuk major). Histori ditampilkan sebagai timeline;
versi teratas ditandai **LIVE**. Nomor versi juga tampil di navbar dan changelog landing page.

**Tab Sistem** — maintenance global + pesan kustom.
