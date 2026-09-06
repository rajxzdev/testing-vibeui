# -*- coding: utf-8 -*-
"""Generator 100 template dengan 10 arsitektur layout yang benar-benar berbeda."""
import json, random, os

random.seed(11)

PALETTES = [
    # (nama, dark?, bg, surface, border, text, sub, accent_bg, accent_text)
    ("noir",   True,  "#09090b", "rgba(24,24,27,.6)",  "#27272a", "#fafafa", "#a1a1aa", "#ffffff", "#000000"),
    ("carbon", True,  "#000000", "rgba(24,24,27,.5)",  "#1f1f23", "#f4f4f5", "#8b8b93", "#f4f4f5", "#09090b"),
    ("slate",  True,  "#0b0d10", "rgba(30,34,40,.55)", "#242a32", "#f8fafc", "#94a3b8", "#e2e8f0", "#0b0d10"),
    ("paper",  False, "#ffffff", "#fafafa",            "#e4e4e7", "#18181b", "#71717a", "#18181b", "#ffffff"),
    ("bone",   False, "#fafaf9", "#ffffff",            "#e7e5e4", "#1c1917", "#78716c", "#1c1917", "#fafaf9"),
]

def sv(p, extra=""):
    """SVG ikon segitiga."""
    return f'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {extra}><path d="M12 2L2 22h20L12 2z"/></svg>'

def head(name, pal):
    _, dark, bg, surf, bd, tx, sub, ab, at = pal
    scheme = "dark" if dark else "light"
    return f'''<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="{scheme}"><style>html{{color-scheme:{scheme}}}</style>
<title>{name}</title><script src="https://cdn.tailwindcss.com"></script>
<style>
:root{{--bg:{bg};--surf:{surf};--bd:{bd};--tx:{tx};--sub:{sub};--ab:{ab};--at:{at}}}
body{{background:var(--bg);color:var(--tx);-webkit-font-smoothing:antialiased}}
.surf{{background:var(--surf);border:1px solid var(--bd)}}
.sub{{color:var(--sub)}} .acc{{background:var(--ab);color:var(--at)}}
.bd{{border-color:var(--bd)}}
.grid-bg{{background-image:linear-gradient(to right,{'rgba(255,255,255,.04)' if dark else 'rgba(0,0,0,.04)'} 1px,transparent 1px),linear-gradient(to bottom,{'rgba(255,255,255,.04)' if dark else 'rgba(0,0,0,.04)'} 1px,transparent 1px);background-size:32px 32px}}
</style></head><body>'''

def nav(name, links, cta="Get Started", center=False):
    ls = "".join(f'<a href="#" class="sub hover:opacity-70 transition">{l}</a>' for l in links)
    just = "justify-center" if center else "justify-between"
    return f'''<header data-component="navbar" class="sticky top-0 z-40 border-b bd backdrop-blur" style="background:var(--bg)">
<div class="mx-auto max-w-6xl px-6 py-4 flex items-center {just} gap-8">
<div class="flex items-center gap-2 font-bold tracking-tight">{sv(None)}{name}</div>
<nav class="hidden md:flex gap-7 text-sm">{ls}</nav>
<button data-component="nav-cta" class="acc rounded-full px-4 py-2 text-sm font-medium">{cta}</button>
</div></header>'''

def foot(name):
    return f'''<footer data-component="footer" class="border-t bd mt-auto">
<div class="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm sub">
<div class="flex items-center gap-2">{sv(None)}<span class="font-semibold">{name}</span></div>
<p>© 2026 {name} — dibuat dengan VibeUI</p></div></footer></body></html>'''

# ---------- 10 ARSITEKTUR LAYOUT BERBEDA ----------

def L_hero_center(n, p, f):
    """Hero tengah + 3 kartu."""
    cards = "".join(f'''<div data-component="card-{i+1}" class="surf rounded-2xl p-6">
<div class="acc h-9 w-9 rounded-full grid place-items-center mb-4">{sv(None)}</div>
<h3 class="font-semibold tracking-tight">{x}</h3>
<p class="sub text-sm mt-2 leading-relaxed">Modul {x.lower()} dengan whitespace lega dan kontras tajam.</p></div>''' for i, x in enumerate(f[:3]))
    return f'''{nav(n, ["Product","Docs","Pricing"])}
<main class="grid-bg"><section data-component="hero" class="mx-auto max-w-3xl px-6 py-28 text-center">
<span class="surf rounded-full px-3 py-1 text-xs sub">Baru · 2026</span>
<h1 data-component="hero-title" class="mt-6 text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">{n}</h1>
<p data-component="hero-sub" class="mt-6 sub text-lg leading-relaxed">Bangun halaman profesional dalam hitungan menit, bukan hari.</p>
<div class="mt-9 flex gap-3 justify-center"><button data-component="cta-primary" class="acc rounded-full px-6 py-3 font-medium">Mulai Gratis</button>
<button class="border bd rounded-full px-6 py-3 font-medium">Lihat Demo</button></div></section>
<section data-component="features" class="mx-auto max-w-6xl px-6 pb-28 grid md:grid-cols-3 gap-5">{cards}</section></main>{foot(n)}'''

def L_split(n, p, f):
    """Hero kiri-kanan dengan panel visual."""
    rows = "".join(f'<li class="flex gap-3 items-start"><span class="acc h-5 w-5 rounded-full grid place-items-center text-[10px] mt-0.5">✓</span><span class="sub text-sm">{x}</span></li>' for x in f[:4])
    return f'''{nav(n, ["Fitur","Harga","Blog"])}
<main><section data-component="hero" class="mx-auto max-w-6xl px-6 py-24 grid md:grid-cols-2 gap-14 items-center">
<div><h1 data-component="hero-title" class="text-5xl font-bold tracking-tight leading-[1.05]">{n} untuk tim modern.</h1>
<p data-component="hero-sub" class="mt-6 sub leading-relaxed">Semua yang Anda butuhkan untuk meluncur cepat, tanpa konfigurasi rumit.</p>
<ul class="mt-8 space-y-3">{rows}</ul>
<button data-component="cta-primary" class="acc rounded-full px-6 py-3 font-medium mt-9">Coba Sekarang</button></div>
<div data-component="hero-visual" class="surf rounded-3xl p-6 aspect-[4/3] flex flex-col gap-3">
<div class="flex gap-1.5"><span class="h-2.5 w-2.5 rounded-full acc"></span><span class="h-2.5 w-2.5 rounded-full border bd"></span><span class="h-2.5 w-2.5 rounded-full border bd"></span></div>
<div class="flex-1 rounded-2xl border bd grid-bg"></div>
<div class="grid grid-cols-3 gap-3">{"".join('<div class="h-12 rounded-xl border bd"></div>' for _ in range(3))}</div></div>
</section></main>{foot(n)}'''

def L_bento(n, p, f):
    """Bento grid asimetris."""
    return f'''{nav(n, ["Platform","Solusi","Harga"])}
<main class="mx-auto max-w-6xl px-6 py-20">
<h1 data-component="hero-title" class="text-5xl font-bold tracking-tight max-w-2xl leading-[1.05]">{n}</h1>
<p data-component="hero-sub" class="sub mt-5 max-w-lg leading-relaxed">Satu platform untuk semua kebutuhan produk digital Anda.</p>
<section data-component="bento" class="mt-12 grid md:grid-cols-3 md:grid-rows-2 gap-4 md:h-[420px]">
<div data-component="bento-1" class="surf rounded-3xl p-7 md:col-span-2 flex flex-col justify-between">
<div class="acc h-10 w-10 rounded-2xl grid place-items-center">{sv(None)}</div>
<div><h3 class="text-xl font-semibold tracking-tight">{f[0]}</h3><p class="sub text-sm mt-2 max-w-sm leading-relaxed">Modul utama dengan performa tinggi dan konfigurasi minimum.</p></div></div>
<div data-component="bento-2" class="surf rounded-3xl p-7 md:row-span-2 flex flex-col justify-between">
<div class="acc h-10 w-10 rounded-2xl grid place-items-center">{sv(None)}</div>
<div><h3 class="text-xl font-semibold tracking-tight">{f[1]}</h3><p class="sub text-sm mt-2 leading-relaxed">Terintegrasi penuh di seluruh alur kerja tim.</p></div></div>
<div data-component="bento-3" class="surf rounded-3xl p-7"><h3 class="font-semibold tracking-tight">{f[2]}</h3><p class="sub text-sm mt-2 leading-relaxed">Cepat & ringan.</p></div>
<div data-component="bento-4" class="surf rounded-3xl p-7"><h3 class="font-semibold tracking-tight">Analitik</h3><p class="sub text-sm mt-2 leading-relaxed">Data real-time.</p></div>
</section></main>{foot(n)}'''

def L_pricing(n, p, f):
    """Tabel harga 3 kolom."""
    tiers = [("Basic","Rp 0",["1 proyek","Komunitas","Ekspor dasar"]),("Pro","Rp 49k",["Proyek tanpa batas","Prioritas","Semua ekspor","Kolaborasi tim"]),("Bisnis","Rp 149k",["SLA 99.9%","SSO & audit","Manajer akun"])]
    cols = ""
    for i,(t,pr,items) in enumerate(tiers):
        hi = i==1
        li = "".join(f'<li class="flex gap-2 text-sm sub"><span>✓</span>{x}</li>' for x in items)
        cols += f'''<div data-component="plan-{i+1}" class="surf rounded-3xl p-8 {'ring-2' if hi else ''}" style="{'--tw-ring-color:var(--ab)' if hi else ''}">
{'<span class="acc rounded-full px-3 py-1 text-xs font-medium">Populer</span>' if hi else ''}
<h3 class="font-semibold tracking-tight mt-3">{t}</h3>
<div class="mt-4 text-4xl font-bold tracking-tight">{pr}<span class="sub text-base font-normal">/bln</span></div>
<ul class="mt-6 space-y-2.5">{li}</ul>
<button class="{'acc' if hi else 'border bd'} w-full rounded-full py-3 mt-8 font-medium text-sm">Pilih {t}</button></div>'''
    return f'''{nav(n, ["Produk","Harga","FAQ"])}
<main class="mx-auto max-w-6xl px-6 py-20 text-center">
<h1 data-component="hero-title" class="text-5xl font-bold tracking-tight">Harga transparan.</h1>
<p data-component="hero-sub" class="sub mt-5 max-w-md mx-auto leading-relaxed">Tanpa biaya tersembunyi. Batalkan kapan saja.</p>
<section data-component="pricing" class="mt-14 grid md:grid-cols-3 gap-5 text-left">{cols}</section></main>{foot(n)}'''

def L_dashboard(n, p, f):
    """Shell aplikasi: sidebar + statistik + tabel."""
    nav_items = "".join(f'<a class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm {"acc" if i==0 else "sub hover:opacity-70"}">{sv(None)}{x}</a>' for i,x in enumerate(["Overview","Analitik","Proyek","Tim","Setelan"]))
    stats = "".join(f'<div data-component="stat-{i+1}" class="surf rounded-2xl p-5"><div class="sub text-xs">{k}</div><div class="text-2xl font-bold tracking-tight mt-1">{v}</div></div>' for i,(k,v) in enumerate([("Pengguna","12.480"),("Pendapatan","Rp 84jt"),("Konversi","3,2%"),("Aktif","1.204")]))
    rows = "".join(f'<tr class="border-t bd"><td class="py-3 text-sm">Proyek {chr(65+i)}</td><td class="py-3 text-sm sub">Aktif</td><td class="py-3 text-sm sub text-right">{(i+3)*17}%</td></tr>' for i in range(4))
    return f'''<div class="flex min-h-screen">
<aside data-component="sidebar" class="w-60 shrink-0 border-r bd p-4 hidden md:flex flex-col gap-1">
<div class="flex items-center gap-2 font-bold tracking-tight px-3 py-3">{sv(None)}{n}</div>{nav_items}</aside>
<div class="flex-1 flex flex-col">
<header data-component="topbar" class="border-b bd px-6 py-4 flex items-center justify-between">
<h1 data-component="hero-title" class="font-semibold tracking-tight">Ringkasan</h1>
<button class="acc rounded-full px-4 py-2 text-sm font-medium">Proyek Baru</button></header>
<main class="p-6 space-y-5"><section data-component="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">{stats}</section>
<section data-component="chart" class="surf rounded-2xl p-6"><h3 class="font-semibold tracking-tight text-sm">Tren 30 hari</h3>
<div class="mt-5 flex items-end gap-1.5 h-32">{"".join(f'<div class="flex-1 rounded-t acc" style="height:{random.randint(25,100)}%;opacity:.75"></div>' for _ in range(24))}</div></section>
<section data-component="table" class="surf rounded-2xl p-6"><table class="w-full"><thead><tr class="sub text-xs text-left"><th class="pb-2">Nama</th><th class="pb-2">Status</th><th class="pb-2 text-right">Progres</th></tr></thead><tbody>{rows}</tbody></table></section>
</main></div></div></body></html>'''

def L_gallery(n, p, f):
    """Galeri masonry untuk portofolio/foto."""
    hs = [200,280,240,320,220,300,260,290,230]
    tiles = "".join(f'''<div data-component="tile-{i+1}" class="surf rounded-2xl overflow-hidden break-inside-avoid mb-4 grid-bg" style="height:{h}px">
<div class="h-full w-full p-4 flex items-end"><span class="text-sm font-medium">Karya {i+1}</span></div></div>''' for i,h in enumerate(hs))
    return f'''{nav(n, ["Karya","Tentang","Kontak"])}
<main class="mx-auto max-w-6xl px-6 py-16">
<h1 data-component="hero-title" class="text-5xl font-bold tracking-tight max-w-xl leading-[1.05]">{n}</h1>
<p data-component="hero-sub" class="sub mt-5 max-w-md leading-relaxed">Kumpulan karya pilihan 2024–2026.</p>
<section data-component="gallery" class="mt-12 columns-2 md:columns-3 gap-4">{tiles}</section></main>{foot(n)}'''

def L_docs(n, p, f):
    """Dokumentasi: sidebar navigasi + artikel."""
    side = "".join(f'<a class="block rounded-lg px-3 py-1.5 text-sm {"acc" if i==1 else "sub hover:opacity-70"}">{x}</a>' for i,x in enumerate(["Pengantar","Instalasi","Konfigurasi","API","Contoh","FAQ"]))
    return f'''{nav(n, ["Docs","API","Changelog"])}
<div class="mx-auto max-w-6xl px-6 py-12 flex gap-10">
<aside data-component="doc-nav" class="w-52 shrink-0 hidden md:block sticky top-24 self-start space-y-1">
<div class="sub text-xs font-semibold uppercase tracking-wider px-3 pb-2">Panduan</div>{side}</aside>
<article data-component="doc-body" class="flex-1 max-w-2xl">
<div class="sub text-xs">Panduan / Instalasi</div>
<h1 data-component="hero-title" class="text-4xl font-bold tracking-tight mt-2">Instalasi {n}</h1>
<p class="sub mt-5 leading-relaxed">Ikuti langkah berikut untuk memasang dan menjalankan proyek pertama Anda.</p>
<div data-component="code" class="surf rounded-2xl p-5 mt-7 font-mono text-sm"><div class="sub">$ npm install {n.split()[-1].lower()}</div><div class="sub mt-1">$ npm run dev</div></div>
<h2 class="text-2xl font-semibold tracking-tight mt-10">Konfigurasi</h2>
<p class="sub mt-3 leading-relaxed">Buat berkas konfigurasi di direktori utama, lalu sesuaikan opsi sesuai kebutuhan tim Anda.</p>
<div class="surf rounded-2xl p-5 mt-5 space-y-2">{"".join(f'<div class="flex justify-between text-sm"><span class="font-mono">{k}</span><span class="sub">{v}</span></div>' for k,v in [("mode","production"),("cache","true"),("region","sgp1")])}</div>
<div class="flex justify-between mt-12 pt-6 border-t bd text-sm"><span class="sub">← Pengantar</span><span class="sub">Konfigurasi →</span></div>
</article></div>{foot(n)}'''

def L_ecommerce(n, p, f):
    """Katalog produk + filter."""
    prods = "".join(f'''<div data-component="product-{i+1}" class="surf rounded-2xl overflow-hidden">
<div class="aspect-square grid-bg border-b bd"></div>
<div class="p-4"><div class="text-sm font-medium">Produk {i+1}</div>
<div class="flex items-center justify-between mt-2"><span class="text-sm sub">Rp {(i+2)*49}.000</span>
<button class="acc rounded-full px-3 py-1 text-xs font-medium">Beli</button></div></div></div>''' for i in range(8))
    chips = "".join(f'<button class="rounded-full px-4 py-1.5 text-sm {"acc" if i==0 else "border bd sub"}">{x}</button>' for i,x in enumerate(["Semua","Baru","Terlaris","Diskon"]))
    return f'''{nav(n, ["Toko","Koleksi","Tentang"], cta="Keranjang")}
<main class="mx-auto max-w-6xl px-6 py-12">
<h1 data-component="hero-title" class="text-4xl font-bold tracking-tight">{n}</h1>
<div data-component="filters" class="flex gap-2 mt-7 flex-wrap">{chips}</div>
<section data-component="products" class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">{prods}</section></main>{foot(n)}'''

def L_blog(n, p, f):
    """Majalah: artikel utama + daftar."""
    posts = "".join(f'''<article data-component="post-{i+1}" class="flex gap-5 py-5 border-t bd">
<div class="w-28 h-20 shrink-0 rounded-xl surf grid-bg"></div>
<div><div class="sub text-xs">{["Engineering","Desain","Budaya"][i%3]} · {5+i} menit</div>
<h3 class="font-semibold tracking-tight mt-1.5">Judul artikel menarik nomor {i+1}</h3>
<p class="sub text-sm mt-1.5 leading-relaxed">Ringkasan singkat isi artikel yang membuat pembaca ingin melanjutkan.</p></div></article>''' for i in range(4))
    return f'''{nav(n, ["Artikel","Topik","Penulis"], cta="Berlangganan")}
<main class="mx-auto max-w-4xl px-6 py-14">
<article data-component="featured" class="surf rounded-3xl overflow-hidden">
<div class="aspect-[21/9] grid-bg border-b bd"></div>
<div class="p-8"><div class="sub text-xs">Unggulan · 8 menit</div>
<h1 data-component="hero-title" class="text-3xl font-bold tracking-tight mt-2 leading-tight">{n}: cerita di balik peluncuran produk kami</h1>
<p class="sub mt-4 leading-relaxed">Bagaimana tim kecil membangun produk yang dipakai ribuan orang dalam enam bulan.</p></div></article>
<section data-component="posts" class="mt-12">{posts}</section></main>{foot(n)}'''

def L_auth(n, p, f):
    """Halaman login split-screen."""
    return f'''<div class="min-h-screen grid md:grid-cols-2">
<div data-component="auth-form" class="flex items-center justify-center p-8">
<div class="w-full max-w-sm">
<div class="flex items-center gap-2 font-bold tracking-tight">{sv(None)}{n}</div>
<h1 data-component="hero-title" class="text-3xl font-bold tracking-tight mt-10">Masuk ke akun</h1>
<p class="sub text-sm mt-2">Selamat datang kembali. Silakan lanjutkan.</p>
<div class="mt-8 space-y-3">
<button class="w-full border bd rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-2">{sv(None)}Lanjut dengan Google</button>
<button class="w-full border bd rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-2">{sv(None)}Lanjut dengan GitHub</button></div>
<div class="flex items-center gap-3 my-6"><div class="flex-1 h-px" style="background:var(--bd)"></div><span class="sub text-xs">atau</span><div class="flex-1 h-px" style="background:var(--bd)"></div></div>
<div class="space-y-3"><input class="w-full surf rounded-xl px-4 py-2.5 text-sm" placeholder="nama@email.com">
<input class="w-full surf rounded-xl px-4 py-2.5 text-sm" placeholder="Kata sandi" type="password"></div>
<button data-component="cta-primary" class="acc w-full rounded-full py-3 mt-5 font-medium text-sm">Masuk</button>
<p class="sub text-xs text-center mt-5">Belum punya akun? Daftar gratis</p></div></div>
<div data-component="auth-visual" class="hidden md:flex items-center justify-center grid-bg border-l bd p-12">
<div class="surf rounded-3xl p-8 max-w-sm"><div class="acc h-10 w-10 rounded-2xl grid place-items-center">{sv(None)}</div>
<p class="mt-5 leading-relaxed">"{n} memangkas waktu kerja tim kami hingga separuh. Alat wajib."</p>
<div class="sub text-sm mt-4">— Rina, Product Lead</div></div></div></div></body></html>'''

LAYOUTS = [
    ("hero-center", L_hero_center, "landing"),
    ("split",       L_split,       "landing"),
    ("bento",       L_bento,       "landing"),
    ("pricing",     L_pricing,     "pricing"),
    ("dashboard",   L_dashboard,   "app"),
    ("gallery",     L_gallery,     "portfolio"),
    ("docs",        L_docs,        "docs"),
    ("ecommerce",   L_ecommerce,   "ecommerce"),
    ("blog",        L_blog,        "blog"),
    ("auth",        L_auth,        "auth"),
]

NAMES = {
    "landing":  ["Nimbus","Vertex","Lumen","Atlas","Orbit","Zenith","Pulse","Quanta","Nova","Prisma"],
    "pricing":  ["Tarif","Ledger","Vault","Quota","Meter","Scale","Tier","Budget","Plan","Rate"],
    "app":      ["Console","Command","Metrics","Pilot","Radar","Signal","Beacon","Compass","Grid","Panel"],
    "portfolio":["Studio","Canvas","Frame","Portfolio","Gallery","Archive","Folio","Craft","Muse","Atelier"],
    "docs":     ["Manual","Handbook","Codex","Guide","Reference","Almanac","Primer","Compendium","Wiki","Notes"],
    "ecommerce":["Market","Bazaar","Depot","Emporium","Outlet","Shelf","Cart","Trade","Bodega","Stock"],
    "blog":     ["Journal","Dispatch","Chronicle","Gazette","Digest","Column","Post","Review","Press","Story"],
    "auth":     ["Gateway","Portal","Access","Ident","Keyring","Passage","Entry","Guard","Lock","Sentry"],
}
FEATS = ["Instant Deploy","Edge Runtime","Zero Config","Kolaborasi Tim","Analitik Real-time","Keamanan SOC2","Versi Otomatis","API Terbuka"]

import re as _re
def slugify(x):
    x = _re.sub(r"[^a-z0-9]+", "-", x.lower().strip())
    return _re.sub(r"-+", "-", x).strip("-")

rows = []
_seen = {}
tid = 0
for li, (lname, fn, cat) in enumerate(LAYOUTS):
    for k in range(10):                       # 10 layout x 10 varian = 100
        tid += 1
        pal = PALETTES[(li + k) % len(PALETTES)]
        base = NAMES[cat][k % len(NAMES[cat])]
        name = f"{base} {lname.replace('-', ' ').title()}"
        feats = random.sample(FEATS, 4)
        html = head(name, pal) + fn(name, pal, feats)
        # nama berkas deskriptif, bukan tpl-XXX
        base = f"{slugify(name)}-{pal[0]}"
        _seen[base] = _seen.get(base, 0) + 1
        slug = base if _seen[base] == 1 else f"{base}-{_seen[base]}"
        rows.append({
            "id": tid, "slug": slug, "template_name": name,
            "category": cat, "layout": lname, "palette": pal[0],
            "is_premium": tid > 40,
            "screenshot_url": f"/assets/thumbnails/{slug}.webp",
            "code_html": html,
        })

# Selang-seling per layout supaya template bersebelahan selalu beda arsitektur
from collections import OrderedDict
_g = OrderedDict()
for r in rows:
    _g.setdefault(r["layout"], []).append(r)
_inter = []
while any(_g.values()):
    for k in list(_g.keys()):
        if _g[k]:
            _inter.append(_g[k].pop(0))
for i, r in enumerate(_inter, start=1):
    r["id"] = i
    r["is_premium"] = i > 40      # 40 pertama gratis
rows = _inter

json.dump(rows, open("lib/templates.json", "w"))
uniq = len({r["code_html"].replace(r["template_name"], "X") for r in rows})
print(f"{len(rows)} template ditulis · kerangka unik: {uniq}")
