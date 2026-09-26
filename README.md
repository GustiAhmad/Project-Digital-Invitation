# Undangan Pernikahan Digital

Web undangan pernikahan interaktif untuk **Uswatun Hasanah & Muhammad**.
Mobile-first, real-time, dan gratis selamanya (free tier).

---

## Stack Teknologi

| Bagian | Teknologi | Biaya |
|---|---|---|
| Build | Vite 8 | Gratis |
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

### Perintah lain

| Perintah | Fungsi |
|---|---|
| `npm run dev:host` | Dev server yang bisa diakses dari **HP** di WiFi yang sama |
| `npm run check` | **Cek konsistensi konten** - HTML vs `config.js`, aset gambar, dan placeholder |
| `npm run check:content` | Cek HTML vs `config.js` saja |
| `npm run check:images` | Cek metadata EXIF/GPS, file `srcset`, dan dimensi gambar |
| `npm run check:placeholders` | Lihat daftar data yang **masih menunggu klien** |
| `npm run verify` | `check` + `build` (jalankan sebelum deploy) |
| `npm run placeholders` | Buat ulang gambar placeholder + OG image |
| `npm run optimize` | **Kompres foto** di `assets-src/` ke `public/img/` (WebP + JPEG fallback) |
| `npm run assets` | `placeholders` + `optimize` + `og` (jalankan sekali setelah dapat foto final) |
| `npm run og` | Buat ulang `public/og-image.png` (1200x630) dari `config.js` |

> **Penting:** selalu jalankan `npm run check` setiap kali mengubah
> `src/config.js`. Script ini menangkap kasus "klien ganti tanggal di
> config, tapi HTML masih tanggal lama" - yang akan membuat preview
> di WhatsApp menampilkan tanggal yang salah.

### Optimize Foto

`npm run optimize` membaca master JPEG di `assets-src/`, lalu menaruh
hasilnya di `public/img/` dengan pola nama:

```
assets-src/Muhammad.jpg   ->  public/img/couple-groom-480.webp
                               public/img/couple-groom-640.webp
                               public/img/couple-groom-768.webp
                               public/img/couple-groom-1200.webp
                               public/img/couple-groom-1800.webp
                               public/img/couple-groom.jpg   (fallback)
```

Yang dilakukan script ini:

- Memutar foto sesuai EXIF `Orientation`, lalu **membuang semua
  metadata** (termasuk GPS). Master tidak ikut di-commit.
- Membuat 5 lebar WebP (480 / 640 / 768 / 1200 / 1800) plus satu
  JPEG fallback untuk browser lama yang tidak mendukung WebP.
- Memakai `srcset` + `sizes` supaya HP hanya mengunduh varian yang
  pas dengan layarnya, bukan file terbesar.

> **Kenapa lebarnya tidak jarak sama?** Foto pengantin tampil
> di grid 2 kolom, jadi sekitar 224 px di HP. Dengan layar DPR 3 itu
> jadi 672 px. Kalau lebar yang tersedia cuma `[480, 960, 1600]`,
> browser harus memilih 960 - dan membayar 116 KB untuk gambar yang
> tampil 224 px. Lebar `[480, 640, 768, 1200, 1800]` membuat browser
> memilih 768, dan total halaman turun ke **~155 KB**
> (dari ~224 KB).

> **Penting:** kalau kamu menambah lebar baru di
> `tools/optimize-images.mjs`, ubah juga `WIDTHS` di
> `src/lib/responsive.js` dan `srcset` di `index.html`. Setelah
> itu jalankan `npm run check:images` - script itu akan gagal
> kalau ada `srcset` yang menunjuk file yang tidak ada.

### Mengganti foto

1. Letakkan foto baru di `assets-src/`.
2. Ubah `couple.groom.photo` / `couple.bride.photo` di
   `src/config.js` ke nama file di `public/img/`.
3. Kalau lebar/tinggi rasio foto berubah, sesuaikan `width` dan
   `height` di `index.html` (pakai nilai milik varian **fallback**
   JPEG), lalu jalankan `npm run check:images`.

### Kendala umum

| Gejala | Penyebab & Solusi |
|---|---|
| `npm install` gagal / `ETIMEDOUT` | Koneksi lambat. Coba: `npm config set registry https://registry.npmjs.org/` lalu ulangi. |
| Port 5173 sudah dipakai | Vite otomatis pindah ke 5174. Lihat output terminal. |
| Halaman kosong, error di console | Tekan `F12` -> tab Console, baca pesan errornya. |
| Audio tidak berbunyi | Wajib klik dulu (kebijakan autoplay browser). Ada tombol musik. |
| `.env` tidak terbaca | Pastikan file bernama persis `.env` (bukan `.env.txt`) di root project. |
| Tanggal / nama hari di preview WhatsApp berbeda | Jalankan `npm run check` - akan menunjukkan letak masalahnya. |

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
|   |-- og-image.png        # Preview saat link di-share (1200x630)
|   `-- manifest.webmanifest
|
|-- src/
|   |-- config.js           # <<< SATU-SATUNYA SUMBER KONTEN
|   |-- main.js             # Entry JS - hanya merakit modul
|   |-- assets/             # Aset yang diproses Vite (mis. foto cover)
|   |-- styles/
|   |   |-- main.css        # Hanya meng-import 4 file di bawahnya
|   |   |-- tokens.css      # Design tokens (warna, font, spacing)
|   |   |-- base.css        # Reset, aksesibilitas, toast
|   |   |-- components.css  # Tombol, form, card
|   |   `-- sections.css    # Style per section
|   |-- lib/
|   |   |-- dom.js          # Helper DOM aman (anti-XSS)
|   |   |-- format.js       # Format tanggal/wAngka (anti salah hari)
|   |   |-- icons.js        # Ikon SVG inline
|   |   |-- render.js       # Isi halaman dari config.js
|   |   `-- toast.js        # Notifikasi (pengganti alert)
|   |-- modules/
|   |   |-- countdown.js
|   |   |-- music.js
|   |   |-- clipboard.js
|   |   |-- wishes.js
|   |   |-- rsvp.js
|   |   `-- share.js
|   `-- lib/supabase.js     # (Tahap 3)
|
|-- admin/
|   `-- index.html          # Panel moderasi (butuh login)
|
|-- tools/
|   |-- make-placeholders.mjs
|   |-- make-og-image.mjs    # Render ulang preview WhatsApp (1200x630)
|   |-- check-content.mjs    # Pemeriksa konsistensi HTML vs config
|   `-- check-placeholders.mjs
|
`-- assets-src/             # Foto master resolusi penuh (di-ignore Git)
```

---

## Cara Mengubah Konten

**90% kebutuhan klien cukup lewat satu file: `src/config.js`.**

Di file itu tersimpan: nama pengantin, nama orang tua, tanggal & jam acara,
alamat & koordinat venue, nomor rekening, cerita, dan daftar foto galeri.

```js
export const CONFIG = {
  couple: {
    bride: { name: 'Uswatun Hasanah', photo: './img/couple-bride.jpg' },
    groom: { name: 'Muhammad',        photo: './img/couple-groom.jpg' }
  },
  events: [{
    title: 'Akad Nikah',
    date: '2026-11-20',      // WAJIB format YYYY-MM-DD
    startTime: '08:00',
    endTime: '10:00',
    timezone: 'Asia/Makassar',   // WITA
    venue: 'Masjid Al-Muttaqin',
    address: 'Jl. Melati No.12',
    city: 'Banjarmasin',
    lat: -3.4382,               // null = pakai pencarian teks
    lng: 114.8603
  }]
};
```

### Kenapa nama hari tidak ditulis manual

Jangan tulis `"Kamis, 20 November 2026"` di config. Cukup tulis
`date: '2026-11-20'`, dan nama hari akan dihitung otomatis memakai
zona waktu `Asia/Makassar`.

Alasannya: pada 20 November 2026, hari sebenarnya adalah **Jumat**.
Teks "Kamis" muncul karena kode lama memakai
`new Date("November 20, 2026")` yang dibaca sebagai waktu lokal
perangkat - di perangkat WIB hasilnya bergeser sehari. Dengan
`Intl.DateTimeFormat` + timezone eksplisit, kesalahan ini mustahil
terjadi lagi.

### Setelah mengubah config

```bash
npm run check     # pastikan HTML & config tetap sinkron
```

### Tombol calendar, peta, dan navigasi

Semua ini di-generate dari `config.js`, jadi **otomatis ikut berubah**.
Tidak perlu edit HTML.

### Mendapatkan koordinat venue (lat/lng)

1. Buka [Google Maps](https://maps.google.com)
2. Klik kanan tepat pada lokasi venue
3. Pilih angka di sisi paling atas - itu koordinatnya
4. Salin, lalu tempel ke `lat` dan `lng` di `config.js`

Kalau `lat`/`lng` masih `null`, situs otomatis memakai pencarian
berdasarkan nama. Begitu diisi, peta berubah menjadi titik pin presisi.

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
| Foto pasangan sudut (potret) | Ada (2 file) | - |
| Nomor rekening / e-wallet | Placeholder | Tahap 1 |
| Teks cerita / love story | Placeholder | Tahap 1 |
| Lagu pengantin (mp3, 3-5 menit) | **File uji, 55 detik** | Wajib ganti |
| URL domain final | Placeholder | Tahap 9 |
| QR code | Placeholder | Tahap 9 |

---

## Catatan Keamanan

- Semua input pengunjung dirender dengan `textContent`, bukan `innerHTML`
  (mencegah XSS).
- Penghapusan pesan hanya bisa dilakukan user yang sudah login
  (dijaga **Row Level Security** di sisi database, bukan di frontend).
- Semua `.env` sudah masuk `.gitignore`.
- Foto sudah dibersihkan dari metadata EXIF / GPS
  (`npm run optimize`, dicek otomatis oleh `npm run check:images`).
- `preload="metadata"` dipakai untuk audio, **bukan** `preload="auto"`.
  Dengan `auto`, browser mengunduh 860 KB lagu sebelum pengunjung
  menekan tombol musik. Dengan `metadata` hanya beberapa KB yang
  diambil, dan musik tetap berjalan setelah diklik.

> **Penting - riwayat Git:** commit awal `12efb40` masih menyimpan
> foto asli (4,4 MB + 2,8 MB) **beserta metadata GPS/EXIF**, karena
> `assets-src/` baru di-ignore di commit berikutnya. Working tree
> sekarang sudah bersih, tapi jika repo ini publik, metadata GPS
> masih bisa diambil siapa saja yang memakai
> `git show 12efb40:public/img/couple-groom.jpg`.
>
> Menghapus metadata lama dari history butuh
> `git filter-repo --path public/img/couple-groom.jpg --invert-paths`
> (atau `BFG`), lalu force-push. **Lakukan hanya kalau kamu paham
> akibatnya** -- Ruleset branch melindungi `main` dan `develop`, jadi
> history rewrite butuh menonaktifkan ruleset sementara.

---

© 2026 — Dibuat dengan penuh suka cita.
