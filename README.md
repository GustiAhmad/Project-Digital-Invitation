# Undangan Pernikahan Digital

Web undangan pernikahan interaktif untuk **Uswatun Hasanah & Muhammad**.
Mobile-first, real-time, dan gratis selamanya (free tier).

---

## Stack Teknologi

| Bagian | Teknologi | Biaya |
|---|---|---|
| Build | Vite 6 | Gratis |
| Frontend | Vanilla JS (ES modules) + CSS Custom Properties | Gratis |
| Backend / DB | Supabase (Postgres + Realtime + Auth + RLS) | Gratis |
| Hosting | Vercel / Netlify / GitHub Pages | Gratis |
| Galeri | Swiper 11 + PhotoSwipe 5 | Gratis |
| Ikon | Lucide | Gratis |
| Anti-spam | Cloudflare Turnstile | Gratis |
| Font | Google Fonts | Gratis |

---

## Menjalankan di Komputer Lokal

```bash
# 1. Install dependency (sekali saja)
npm install

# 2. Jalankan development server
npm run dev
#   -> buka http://localhost:5173

# 3. Build untuk produksi
npm run build
#   -> hasil di folder dist/

# 4. Preview hasil build
npm run preview
#   -> buka http://localhost:4173
```

### Kendala umum

| Gejala | Penyebab & Solusi |
|---|---|
| `npm install` gagal / `ETIMEDOUT` | Koneksi lambat. Coba: `npm config set registry https://registry.npmjs.org/` lalu ulangi. |
| Port 5173 sudah dipakai | Vite otomatis pindah ke 5174. Lihat output terminal. |
| Halaman kosong, error di console | Tekan `F12` -> tab Console, baca pesan errornya. |
| Audio tidak berbunyi | Wajib klik dulu (kebijakan autoplay browser). Ada tombol musik. |
| `.env` tidak terbaca | Pastikan file bernama persis `.env` (bukan `.env.txt`) di root project. |

---

## Struktur Folder

```
.
|-- index.html              # Entry point (Vite)
|-- package.json
|-- vite.config.js
|-- .env.example            # Contoh konfigurasi (AMAN di-commit)
|-- .env                    # Konfigurasi asli (JANGAN di-commit)
|
|-- public/                 # Aset statis, disalin apa adanya ke dist/
|   |-- audio/              # lagu.mp3
|   |-- img/                # Foto (sudah dioptimasi)
|   |-- icons/              # Favicon, PWA icons
|   |-- og-image.jpg        # Preview saat link di-share
|   `-- manifest.webmanifest
|
|-- src/
|   |-- config.js           # <<< SEMUA KONTEN DI SINI
|   |-- main.js             # Entry JS
|   |-- styles/
|   |   |-- tokens.css      # Design tokens (warna, font, spacing)
|   |   |-- base.css        # Reset + elemen dasar
|   |   |-- components.css  # Tombol, form, card, toast
|   |   `-- sections.css    # Style per section
|   |-- modules/
|   |   |-- countdown.js
|   |   |-- music.js
|   |   |-- gallery.js
|   |   |-- calendar.js
|   |   |-- maps.js
|   |   |-- clipboard.js
|   |   |-- wishes.js
|   |   `-- rsvp.js
|   `-- lib/
|       |-- supabase.js
|       |-- toast.js
|       `-- validation.js
|
|-- admin/
|   `-- index.html          # Panel moderasi (butuh login)
|
`-- assets-src/             # Foto master resolusi penuh (di-ignore Git)
```

---

## Cara Mengubah Konten

**90% kebutuhan klien cukup lewat satu file: `src/config.js`.**

Di file itu tersimpan: nama pengantin, nama orang tua, tanggal & jam acara,
alamat & koordinat venue, nomor rekening, cerita, dan daftar foto galeri.

Contoh:

```js
export const CONFIG = {
  couple: {
    bride: 'Uswatun Hasanah',
    groom: 'Muhammad'
  },
  events: [{
    title: 'Akad Nikah',
    date: '2026-11-20',      // format YYYY-MM-DD
    startTime: '08:00',
    endTime: '10:00',
    timezone: '+08:00',      // WAJIB. WITA = +08:00
    venue: 'Masjid Al-Muttaqin',
    address: 'Jl. Melati No.12, Banjarmasin',
    lat: -3.4382,
    lng: 114.8603
  }]
};
```

Tombol **Google Calendar**, **peta**, dan ** navigasi** otomatis menyesuaikan
karena semuanya dibaca dari `config.js`. Tidak perlu edit HTML.

---

## Environment Variables

Salin `.env.example` menjadi `.env`, lalu isi nilainya.

| Variabel | Dipakai di |
|---|---|
| `VITE_SUPABASE_URL` | Tahap 3 (setup database) |
| `VITE_SUPABASE_ANON_KEY` | Tahap 3 |
| `VITE_TURNSTILE_SITE_KEY` | Tahap 5 (anti-spam) |

> Kunci `anon` aman ditaruh di frontend.
> Kunci `service_role` **DILARANG** masuk project ini. Kalau bocor, database bisa dihapus siapa saja.

---

## Alur Kerja Git

```
main     <- produksi (protected, hanya lewat Pull Request)
  ^
develop  <--branch integrasi
  ^
feat/*   <- satu task satu branch
```

```bash
git checkout develop && git pull
git checkout -b feat/nama-fitur
# ... kerjakan ...
git add -A
git commit -m "feat: deskripsi singkat"
git push -u origin feat/nama-fitur
# -> buat Pull Request ke develop
```

---

## Data yang Masih Menunggu Klien

| Item | Status | Filling |
|---|---|---|
| Nama pengantin lengkap | Provisional | Tahap 1 |
| Nama orang tua pihak wanita | Placeholder | Tahap 1 |
| Nama orang tua pihak pria | Placeholder | Tahap 1 |
| Tanggal & jam pasti | Placeholder | Tahap 1 |
| Alamat + koordinat venue Akad | Placeholder | Tahap 1 |
| Alamat + koordinat venue Resepsi | Placeholder | Tahap 1 |
| Foto cover (landscape) | Placeholder | Tahap 2 |
| Foto pre-wedding (min. 6) | Placeholder | Tahap 2 |
| Foto pasangan sudut (potret) |ADA (2 file) | - |
| Nomor rekening / e-wallet | Placeholder | Tahap 1 |
| Teks cerita / love story | Placeholder | Tahap 1 |
| URL domain final | Placeholder | Tahap 9 |
| QR code | Placeholder | Tahap 9 |

---

## Catatan Keamanan

- Semua input pengunjung dirender dengan `textContent`, bukan `innerHTML`
  (mencegah XSS).
- Penghapusan pesan hanya bisa dilakukan user yang sudah login
  (dijaga **Row Level Security** di sisi database, bukan di frontend).
- Semua `.env` sudah masuk `.gitignore`.
- Foto sudah dibersihkan dari metadata EXIF / GPS.

---

© 2026 — Dibuat dengan penuh suka cita.
