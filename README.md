# Undangan Pernikahan Digital

Web undangan pernikahan interaktif untuk **Muhammad Irfani & Parida Paska**.
Mobile-first, real-time, dan gratis selamanya (free tier).

Konsepnya sengaja simpel sesuai permintaan klien: satu halaman,
satu acara - tanpa love story, tanpa donasi, dan tanpa section
kontak selama nomor WhatsApp belum ada. Tamu bisa lihat tanggal,
buka Google Calendar, simpan `.ics`, dan buka Google Maps tanpa
signup.

---

## Stack Teknologi

| Bagian | Teknologi | Biaya |
|---|---|---|
| Build | Vite 8 | Gratis |
| Frontend | Vanilla JS (ES modules) + CSS Custom Properties | Gratis |
| Backend / DB | Supabase (Postgres + Realtime + Auth + RLS) | Gratis |
| Hosting | Vercel / Netlify / GitHub Pages | Gratis |
| Galeri | CSS Grid murni (tanpa library) | Gratis |
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

### Mengganti foto potret

Lihat bagian "Mengganti foto potret" di bawah. Ringkasnya:
taruh di `assets-src/` -> `npm run optimize` -> salin `widths`
ke `config.js` -> `npm run check:images`.

### Kendala umum

| Gejala | Penyebab & Solusi |
|---|---|
| `npm install` gagal / `ETIMEDOUT` | Koneksi lambat. Coba: `npm config set registry https://registry.npmjs.org/` lalu ulangi. |
| Port 5173 sudah dipakai | Vite otomatis pindah ke 5174. Lihat output terminal. |
| Halaman kosong, error di console | Tekan `F12` -> tab Console, baca pesan errornya. |
| Audio tidak berbunyi | Wajib klik dulu (kebijakan autoplay browser). Klik tombol "Buka Undangan" di cover. |
| Nama tamu tidak muncul | Coba URL dengan `?to=Nama+Tamu`, mis. `/?to=Bapak+H.+Rahman`. |
| `.env` tidak terbaca | Pastikan file bernama persis `.env` (bukan `.env.txt`) di root project. |
| Tanggal / nama hari di preview WhatsApp berbeda | Jalankan `npm run check` - akan menunjukkan letak masalahnya. |
| Preview WhatsApp masih nama/tanggal lama | `og-image.png` ikut berubah kalau `config.js` berubah. Jalankan `npm run og`. |
| Tombol "Simpan (.ics)" tidak muncul | Tombol dibangun JavaScript. Kalau tidak terlihat, cek error di Console. |
| Section kontak kosong | Itu memang disengaja selama `contact.whatsapp` masih `''`. |
| `npm run check` gagal soal rekening/cerita/kontak-statis | Rekening & cerita dibatalkan klien; section kontak statis ("Ada pertanyaan?") juga sudah dihapus atas permintaan klien. Kalau salah satunya muncul lagi, hapus dari `index.html` - jangan diabaikan. |

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
|   |-- styles/
|   |   |-- main.css        # Hanya meng-import 4 file di bawahnya
|   |   |-- tokens.css      # Design tokens (warna, font, spacing)
|   |   |-- base.css        # Reset, aksesibilitas, toast
|   |   |-- components.css  # Tombol, form, card
|   |   `-- sections.css    # Style per section
|   |-- lib/
|   |   |-- dom.js          # Helper DOM aman (anti-XSS)
|   |   |-- format.js       # Format tanggal/waktu (anti salah hari)
|   |   |-- icons.js        # Ikon SVG inline
|   |   |-- responsive.js   # Bangun srcset dari config
|   |   |-- render.js       # Isi halaman dari config.js
|   |   `-- toast.js        # Notifikasi (pengganti alert)
|   |-- modules/
|   |   |-- calendar.js     # Google Calendar + unduh .ics
|   |   |-- countdown.js
|   |   |-- music.js
|   |   |-- wishes.js
|   |   |-- rsvp.js
|   |   `-- share.js        # Web Share API + salin tautan
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

Di file itu tersimpan: nama pengantin, nama orang tua, tanggal & jam
acara, alamat & koordinat lokasi, nomor WhatsApp, teks RSVP, dan
pengaturan bagikan/QR.

```js
export const CONFIG = {
  couple: {
    bride: {
      name: 'Parida Paska',
      photo: './img/couple-bride.jpg',
      widths: [320, 480, 520],   // dari `npm run optimize`
      parents: ['Bapak Gurda', 'Ibu Rusimah'],
    },
    groom: {
      name: 'Muhammad Irfani',
      photo: './img/couple-groom.jpg',
      widths: [320, 480, 563],
      parents: ['Bapak Abdul Wahid', 'Ibu Deti Novia Susanti'],
    },
  },
  events: [{
    id: 'akad-resepsi',
    title: 'Akad & Resepsi',
    date: '2026-10-25',      // WAJIB format YYYY-MM-DD
    startTime: '08:00',
    // endTime = jam konkret untuk file kalender (DTEND .ics, dates
    // Google Calendar). TIDAK pernah ditampilkan ke tamu.
    endTime: '17:00',
    // endTimeLabel = yang DITAMPILKAN di halaman. "Selesai" sesuai
    // permintaan klien; kalau nanti pasti, isi jam mis. '17.00'.
    endTimeLabel: 'Selesai',
    venue: '',                // kosong = hanya tampilkan alamat
    address: 'Jl. Kuin Selatan RT 12',
    district: 'Kuin Selatan, Banjarmasin Barat',
    city: 'Kota Banjarmasin',
    region: 'Kalimantan Selatan',
    lat: -3.3004753589630127, // null = pakai pencarian teks
    lng: 114.58055877685547,
  }],
  contact: { whatsapp: '' },  // kosong = section kontak disembunyikan
};
```

Zona waktu diambil dari konstanta `TIMEZONE = 'Asia/Makassar'` (WITA)
di bagian atas file, jadi tidak perlu diulang per acara.

### Kenapa nama hari tidak ditulis manual

Jangan tulis `"Minggu, 25 Oktober 2026"` di config. Cukup tulis
`date: '2026-10-25'`, dan nama hari akan dihitung otomatis memakai
zona waktu `Asia/Makassar`.

Alasannya: kode lama memakai `new Date("November 20, 2026")` yang
dibaca sebagai waktu lokal perangkat - di perangkat WIB hasilnya
bergeser sehari, dan hari yang tampil menjadi salah. Dengan
`Intl.DateTimeFormat` + timezone eksplisit, kesalahan ini mustahil
terjadi lagi.

### Setelah mengubah config

```bash
npm run check     # pastikan HTML & config tetap sinkron
```

### Tombol kalender, peta, dan navigasi

Semua di-generate dari `config.js`, jadi **otomatis ikut berubah**.
Tidak perlu edit HTML.

Ada dua tombol kalender di setiap kartu acara, dan masing-masing
sudah diberi label perangkat supaya tamu tidak menebak:

| Tombol | Label | Untuk siapa | Cara kerja |
|---|---|---|---|
| **Google Calendar** | Android | Yang pakai Google Calendar / Gmail | Buka tab pratinjau resmi Google, tinggal tekan "Simpan" |
| **Simpan (.ics)** | iPhone | iOS Calendar, Outlook, Samsung Calendar | Unduh file `.ics` standar |

Kenapa dua-duanya? Kalau cuma ada tombol Google, tamu iPhone akan
bingung lalu mengetik ulang sendiri. `.ics` dibaca hampir semua
aplikasi kalender.

**Pengingat otomatis** (yang dibawa oleh file `.ics`):
- 3 hari sebelum acara dan 1 hari sebelum acara (VALARM `-P3D` dan
  `-P1D` di dalam file).
- Tombol **Google Calendar tidak bisa membawa pengingat** - URL
  template Google (`calendar/render?action=TEMPLATE`) tidak
  menerima parameter reminder, jadi Google selalu memakai default
  sendiri (30 menit). Kalau pengingat wajib ada, tamu harus pakai
  tombol "Simpan (.ics)".

> **Jam selesai wajib diisi (konkret).** Nilai `endTime` ikut
> ditulis ke `DTEND` di file `.ics` dan ke parameter `dates` di
> Google Calendar. Kalau `endTime` salah, semua tamu dapat
> pengingat yang salah waktunya. Di halaman, jam yang tampil justru
> `endTimeLabel` (mis. "Selesai") - dua-duanya di config.js, jadi
> mustahil tampil beda dari yang dikalenderkan.

### Mengganti foto potret

1. Taruh file baru di `assets-src/`, misalnya `Irfani.jpeg`.
2. Jalankan `npm run optimize`. Skrip memetakan nama file ke
   `couple-groom` / `couple-bride` secara otomatis.
3. Salin nilai `widths` yang dicetak ke `config.js`
   (`couple.groom.widths` / `couple.bride.widths`).
4. Jalankan `npm run check:images` untuk memastikan dimensi
   `width`/`height` di `index.html` sudah sesuai.

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

Jalankan `npm run check:placeholders` untuk melihat daftar ini dari
terminal, selalu mencerminkan kondisi terbaru.

| Item | Status | Catatan |
|---|---|---|
| Nama pengantin lengkap | **Ada** | Muhammad Irfani & Parida Paska |
| Nama orang tua pihak pria | **Ada** | Bapak Abdul Wahid & Ibu Deti Novia Susanti |
| Nama orang tua pihak wanita | **Ada** | Bapak Gurda & Ibu Rusimah |
| Tanggal & jam mulai | **Ada** | Minggu, 25 Oktober 2026, 08.00 WITA |
| **Jam selesai acara** | **Di halaman: "Selesai"; kalender: 17:00** | Sesuai permintaan klien, halaman menulis "08.00 - Selesai". File kalender butuh jam konkret, jadi `endTime: '17:00'` masih asumsi - wajib dikonfirmasi. Sudah dilacak `npm run check:placeholders`. |
| Alamat acara | **Ada** | Jl. Kuin Selatan RT 12, Kuin Selatan, Banjarmasin Barat, Kota Banjarmasin, Kalimantan Selatan |
| Koordinat lokasi | **Ada** | `-3.3004753589630127, 114.58055877685547` |
| Nama resmi venue | Kosong | Klien belum memberi nama bangunan. Halaman tampil alamat saja. |
| Foto potret pengantin | **Ada** | 2 file (563x751 & 520x693). Resolusi kecil, belum di-upscale. Backdrop cover sengaja di-kosongkan dulu - menunggu foto pre-wedding klien (lihat tabel di bawah). |
| Foto pre-wedding galeri | **Belum ada** | 6 slot masih placeholder SVG bernomor. Setelah klien kirim foto: taruh di `assets-src/`, jalankan `npm run optimize`, isi `src` + `widths` di config.js. |
| Nomor WhatsApp | Kosong | Sesuai permintaan klien, placeholder dulu. **Section kontak tidak dirender sama sekali** sampai nomor diisi (klien minta "Ada pertanyaan?" dihapus). |
| Lagu pengantin (mp3, 3-5 menit) | **File uji, 55 detik** | Wajib ganti dengan lagu asli klien. |
| URL domain final | Placeholder | Tahap 7 |
| QR code | Placeholder | Tahap 7 |

### Section yang dibatalkan klien

Sudah dihapus dari `config.js`, `render.js`, dan CSS. `npm run check`
gagal kalau salah satunya muncul lagi - biasanya karena copy-paste
dari template lama:

| Section | Alasan |
|---|---|
| Teks cerita / love story | Dihapus |
| Donasi / nomor rekening | Dihapus |
| Section kontak statis ("Ada pertanyaan?") | Klien minta dihapus. Sebagai gantinya, section kontak dibuat `renderContact()` hanya kalau `contact.whatsapp` sudah diisi - jadi tidak pernah tampil kosong yatim. |

### Section yang dikembalikan klien

| Section | Status |
|---|---|
| Galeri pre-wedding | **Kembali.** 6 slot, masih placeholder (lihat tabel data klien di atas). |
| Tombol "Buka Undangan" | **Kembali.** Dibutuhkan agar musik bisa mulai, karena browser memblokir autoplay. |
| Foto latar cover | **Kembali (wadahnya).** `hero.backdrop` di config.js + CSS `#cover::before` sudah siap, tapi `src` sengaja KOSONG karena klien belum mengirim foto pre-wedding. Saat foto datang: `npm run optimize`, isi `hero.backdrop.src`, cek kontras. Foto pre-wedding ideal jadi latar. |

Semuanya dijaga `npm run check`:
- Galeri harus punya jumlah slot yang sama dengan `gallery.photos`.
- Tombol "Buka Undangan" dan panah harus menuju `#intro`.
- `hero.backdrop` harus ada; kalau `src` diisi, file-nya harus
  benar-benar ada; `opacity <= 0.6` supaya teks putih tidak
  tenggelam. `src` kosong = keadaan sah (menunggu foto).
- `endTimeLabel` / `endTime` konsisten (halaman vs kalender).
- Section kontak tidak boleh tertulis statis di `index.html`.

### Personalisasi nama tamu

Nama diambil dari query parameter `?to=`, jadi satu URL untuk semua tamu:

```
https://domain-anda/?to=Bapak+H.+Rahman
https://domain-anda/?to=Siti+Aminah
```

Kalau `?to=` kosong, tidak ada, atau hanya berisi spasi, halaman
otomatis menampilkan sapaan umum `Bapak/Ibu/Saudara/i` - tidak pernah
kosong. Nama dibersihkan dari karakter kontrol, dipotong 60 karakter,
lalu dirender dengan `textContent` (bukan `innerHTML`), jadi
`?to=<script>` hanya tampil sebagai teks biasa, tidak dieksekusi.

Musik sengaja **tidak** autoplay. Browser memblokir suara yang mulai
tanpa interaksi, jadi tombol "Buka Undangan" di cover sekaligus
memulai musik dan menggulir ke `#intro`.

Soal foto: master di `assets-src/` sengaja **tidak** di-upscale.
`tools/optimize-images.mjs` hanya membuat varian selebar file
aslinya. Kalau klien mengirim foto resolusi tinggi (minimal
sekitar 1200px sisi panjang), hasilnya langsung lebih tajam tanpa
perubahan kode.

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
