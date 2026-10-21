# Undangan Pernikahan Digital — Muhammad Irfani & Parida Paska

Undangan pernikahan digital statis (Vite + Vanilla JS) dengan fokus performa, aksesibilitas, dan UX mobile. Saat ini menggunakan **Supabase (Postgres + Realtime + RLS)** untuk papan **Doa & Ucapan** agar bisa dilihat lintas tamu secara real-time.

- **Live:** [https://undangan-irfani-parida.vercel.app](https://undangan-irfani-parida.vercel.app)
- **Repo:** [github.com/GustiAhmad/Project-Digital-Invitation](https://github.com/GustiAhmad/Project-Digital-Invitation)
- **Branch aktif:** `develop` (rilis stabil di `main`)

## Fitur Utama

- **Cover & Gate Musik** — Tombol "Buka Undangan" memulai musik (menghindari autoplay yang diblokir browser).
- **Sambutan + Countdown** — Hitung mundur menuju hari pernikahan.
- **Mempelai** — Foto pengantin + informasi singkat.
- **Acara & Kalender** — Detail akad/resepsi, tombol "Simpan ke Kalender" menghasilkan file `.ics` (support Google/Outlook/Apple Calendar) dengan pengingat.
- **Lokasi & Peta** — Tombol navigasi ke Google Maps berdasarkan koordinat.
- **Galeri** — Satu foto pre-wedding dengan layout `gallery-grid--single`.
- **Doa & Ucapan (Gabungan)** — Satu form (Nama + Pesan + Konfirmasi Kehadiran: Hadir / Tidak Hadir / Belum Pasti). Ucapan langsung tampil di papan, tersimpan di Supabase dan **muncul real-time** ke semua tamu tanpa refresh. Nama pengunjung diingat di `localStorage`.
- **Personalisasi Tamu** — Dukungan query `?to=Nama+Tamu` (XSS-safe, dirender via `textContent`).
- **Footer Kredit** — `© 2026 · Dibuat oleh Uswatun Hasanah & Gusti Ahmad`
- **SEO & OG** — Meta OG/Twitter, `canonical`, `og:image` absolut via `inject-site-url` (cocok untuk pratinjau WhatsApp).

## Stack Teknologi

| Bagian | Teknologi | Keterangan |
| --- | --- | --- |
| Build Tool | [Vite](https://vitejs.dev/) | Dev server + build + plugin kustom `inject-site-url` |
| Frontend | Vanilla JS (ES Modules) | Modular, tanpa framework berat |
| Styling | CSS custom (tokens, base, components, sections) | Desain kustom, mobile-first |
| Backend / DB | [Supabase](https://supabase.com/) (Postgres + Realtime + RLS) | Papan Doa & Ucapan real-time |
| Hosting | [Vercel](https://vercel.com/) | Production + preview, env var terpisah |

## Struktur Proyek

```text
Project-Digital-Invitation/
├── index.html
├── src/
│   ├── config.js        # Semua teks, foto, acara, lokasi, wishes, dll.
│   ├── main.js          # Inisialisasi modul
│   ├── lib/
│   │   ├── supabase.js  # Klien Supabase + isSupabaseConfigured
│   │   ├── dom.js, render.js, toast.js, ...
│   └── modules/
│       ├── music.js, countdown.js, calendar.js, gallery.js
│       ├── guest.js, wishes.js, share.js
│       └── ...
├── src/styles/          # tokens.css, base.css, components.css, sections.css, main.css
├── supabase/
│   └── schema.sql       # Skema tabel wishes + RLS + Realtime
├── tools/               # Checker, optimizer, og-image, dll.
├── public/              # Audio, gambar, ikon
└── vite.config.js
```

## Konfigurasi Lingkungan

Salin `.env.example` ke `.env` untuk pengembangan lokal:

```bash
cp .env.example .env
```

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Ya (untuk real-time) | URL project Supabase (`https://xxxxx.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | Ya (untuk real-time) | **Publishable key** (`sb_publishable_...`). Aman di frontend, dilindungi oleh RLS. |
| `VITE_SITE_URL` | Disarankan | Digunakan untuk generate `og:url`, `og:image`, `canonical` absolut. Fallback ke domain produksi. |

> Jika variabel Supabase kosong, `wishes.js` otomatis fallback ke `localStorage` (hanya untuk review lokal).

## Setup Supabase (Papan Ucapan)

1. Buat project di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** → jalankan isi `supabase/schema.sql`. Pastikan muncul `Success. No rows returned`.
3. Ambil **Project URL** & **Publishable key** dari `Settings > API Keys`
4. Tambahkan ke `.env` (lokal) atau **Vercel Environment Variables** (Production/Preview)

Skema yang dibuat:
- Tabel `wishes` (`id`, `name`, `message`, `status`, `created_at`)
- **Constraint**: batas panjang nama/pesan, hanya `hadir` | `tidak_hadir` | `belum_pasti`
- **RLS**: `SELECT` & `INSERT` untuk `anon`, **tanpa** `UPDATE/DELETE` untuk `anon`
- **Realtime**: publikasi `INSERT` diaktifkan agar ucapan muncul lintas sesi

## Perintah Pengembangan

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Dev server lokal |
| `npm run dev:host` | Dev server dengan akses jaringan (untuk tes di HP) |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Preview hasil build |
| `npm run preview:host` | Preview via jaringan |
| `npm run optimize` | Optimasi gambar (resize/webp) + bersihkan metadata |
| `npm run check` | Cek konsistensi konten (config vs HTML/JS/CSS) |
| `npm run check:images` | Cek gambar (ada/hilang/ukuran) |
| `npm run verify` | Jalankan semua checker + build (wajib sebelum commit) |

## Deployment (Vercel)

1. Hubungkan repo ke Vercel
2. Tambahkan env var `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` untuk **Production**
3. Tambahkan `VITE_SITE_URL` (opsional) sesuai domain
4. Deploy otomatis via push ke branch, atau manual: `vercel --prod`

## Keputusan Desain & Batasan

| Item | Status | Keterangan |
| --- | --- | --- |
| Personalisasi nama tamu | **Aktif** | Via `?to=`. Fallback sapaan umum jika kosong. |
| RSVP terpisah | **Dihapus** | Digabung ke **Doa & Ucapan**. Tanpa hitungan jumlah tamu. |
| Bagikan Undangan / QR | **Dihapus** | Klien menyebar link umum sendiri. `share.js` hanya dipakai untuk char-count & unsaved-guard form. |
| Section Kontak | **Kondisional** | Hanya dirender jika `contact.whatsapp` terisi. Saat ini tidak tampil. |
| Donasi / Rekening | **Dihapus** | Sesuai permintaan klien. |
| Love Story | **Dihapus** | Sesuai permintaan klien. |
| Galeri | **Final** | Hanya 1 foto (`gallery-1.jpg`), layout single, tanpa judul/deskripsi. |
| Musik | **Final** | `lagu.mp3`, diputar setelah interaksi user, `loop`. |
| Jam acara | **Final** | Ditampilkan "08.00 s/d selesai WITA". `DTEND` kalender tetap `17:00` untuk kompatibilitas. |
| Nama venue | **Tidak ditampilkan** | Acara di lingkungan perumahan, cukup alamat. |

## Catatan Keamanan

- **XSS-safe** — Semua teks pengguna (nama, pesan, `?to=`) dirender dengan `textContent`/`createTextNode`. Tidak ada `innerHTML` untuk input user.
- **Row Level Security** — Hanya `SELECT` dan `INSERT` untuk `anon`. Tidak ada izin `UPDATE`/`DELETE` dari frontend. Moderasi bisa dilakukan langsung via **Supabase Table Editor** oleh pemilik project.
- **Kunci publik** — Hanya `anon/publishable` key yang dipakai. **Service Role Key** tidak pernah digunakan di frontend.
- **Env aman** — `.env`, `.env.*` (kecuali `.env.example`) masuk `.gitignore`.
- **Optimasi gambar** — `npm run optimize` membersihkan metadata EXIF/GPS. Dicek oleh `npm run check:images`.
- **Audio** — Menggunakan `preload="metadata"`, bukan `preload="auto"`.
- **Aksesibilitas** — `lang="id"`, skip-link, `<main>`, `focus-visible`, `prefers-reduced-motion`, label form, `alt` pada semua gambar, target sentuh ≥44px. Kontras WCAG AA dijaga & diawasi oleh checker.

## Kredit

Dibuat dengan ❤️ oleh **Uswatun Hasanah** & **Gusti Ahmad**  
© 2026 Muhammad Irfani & Parida Paska
