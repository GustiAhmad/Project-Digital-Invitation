/* =========================================================
   src/config.js
   ---------------------------------------------------------------
   SATU-SATUNYA SUMBER KEBENARAN untuk seluruh konten situs.

   Semua teks yang tampil di halaman (nama, tanggal, alamat) berasal
   dari file ini.

   CARA MENGUBAH KONTEN:
     Ubah HANYA file ini. Tidak perlu menyentuh HTML/CSS/JS.
     Tombol Google Calendar, peta, navigasi, dan countdown akan
     otomatis menyesuaikan karena semuanya membaca dari sini.

   ---------------------------------------------------------------
   CARA MENGISI DATA ASLI DARI KLIEN:
     Cari tanda  "TODO-KLIEN"  lalu ganti nilai placeholder-nya.
     Jalankan  npm run check  untuk memastikan tidak ada yang
     tertinggal atau tidak sinkron.
   ========================================================= */

/** Zona waktu acara. WITA = UTC+8. */
export const TIMEZONE = 'Asia/Makassar';

/**
 * Offset ISO-8601 untuk disimpan di atribut datetime.
 * WAJIB eksplisit. Tanpa ini, tanggal akan dibaca sebagai
 * waktu lokal perangkat pengunjung dan countdown bisa meleset
 * berjam-jam untuk tamu yang berada di luar WITA.
 */
export const UTC_OFFSET = '+08:00';

export const CONFIG = {
  /* =======================================================
     META & SHARE
     ======================================================= */
  meta: {
    groom: 'Muhammad Irfani',
    bride: 'Parida Paska',
    // Urutan "pria & wanita" mengikuti kebiasaan Indonesia.
    title: 'The Wedding of Muhammad Irfani & Parida Paska',
    description:
      'Undangan pernikahan digital Muhammad Irfani & Parida Paska. Kami menanti kehadiran Bapak/Ibu/Saudara/i.',
    // TODO-KLIEN: URL produksi. Diisi otomatis saat deploy (Tahap 7).
    siteUrl: import.meta.env?.VITE_SITE_URL || '',
  },

  /* =======================================================
     PASANGAN
     ------------------------------------------------------------
     `photo` menunjuk file di public/img/ yang dihasilkan oleh
     `npm run optimize` dari master di assets-src/.

     Konvensi nama:
       assets-src/Parida.jpeg   -> couple-bride.jpg (+ varian WebP)
       assets-src/Irfani.jpeg   -> couple-groom.jpg (+ varian WebP)
     ======================================================= */
  couple: {
    bride: {
      name: 'Parida Paska',
      photo: './img/couple-bride.jpg',
      photoAlt: 'Foto Parida Paska',
      // Lebar varian WebP di public/img/.
      //
      // Diisi oleh `npm run optimize` (script mencetak daftar yang
      // siap disalin). tools/check-images.mjs memverifikasi daftar ini
      // cocok dengan file yang benar-benar ada di disk, jadi kalau
      // lupa menyalin, `npm run check` akan gagal.
      widths: [320, 480, 520],
      parentLabel: 'Putri dari',
      parents: ['Bapak Gurda', 'Ibu Rusimah'],
    },
    groom: {
      name: 'Muhammad Irfani',
      photo: './img/couple-groom.jpg',
      photoAlt: 'Foto Muhammad Irfani',
      widths: [320, 480, 563],
      parentLabel: 'Putra dari',
      parents: ['Bapak Abdul Wahid', 'Ibu Deti Novia Susanti'],
    },
  },

  /* =======================================================
     ACARA
     ------------------------------------------------------------
     PENTING: kolom `date` SELALU format YYYY-MM-DD.
     Nama hari (Minggu/Sabtu/dll) TIDAK ditulis manual -
     dihitung otomatis oleh lib/format.js memakai zona waktu
     di atas. Ini mencegah kesalahan nama hari.

     Klien memutuskan akad dan resepsi digabung jadi SATU acara
     di tempat yang sama, jadi `events` hanya berisi satu entri.
     Menambah acara kedua tetap bisa dilakukan nanti - semua
     bagian halaman (kartu acara, peta, kalender) dibangun
     berulang dari array ini.
     ======================================================= */
  events: [
    {
      id: 'akad-resepsi',
      title: 'Akad & Resepsi',
      icon: 'rings',
      date: '2026-10-25',
      startTime: '08:00',
      // Batas akhir untuk FILE KALENDER (.ics & Google Calendar).
      // Nilai ini tidak pernah ditampilkan ke tamu - yang tampil
      // adalah `endTimeLabel` di bawah.
      //
      // Dipakai 17:00 karena kalender butuh jam konkret: kalau
      // acaranya diisi "08:00 - Selesai", Google Calendar tidak bisa
      // mengaturnya dan akan membuat acara 0 menit.
      endTime: '17:00',
      // Yang benar-benar ditulis di halaman. Klien meminta ditulis
      // "08.00 - Selesai" karena jamンドanya memang belum pasti.
      endTimeLabel: 'Selesai',
      // TODO-KLIEN: konfirmasi jam selesai dengan klien sebelum deploy.
      // Kalau klien jadi memberi jam konkret, isi `endTimeLabel` dengan
      // jam itu (mis. '17.00') supaya halaman dan kalender konsisten.
      // TODO-KLIEN: nama resmi lokasi, bila ada. Kalau acaranya di
      // rumah, kosongkan saja: alamat di bawah sudah cukup jelas
      // tanpa nama bangunan.
      venue: '',
      address: 'Jl. Kuin Selatan RT 12',
      district: 'Kuin Selatan, Banjarmasin Barat',
      city: 'Kota Banjarmasin',
      region: 'Kalimantan Selatan',
      lat: -3.3004753589630127,
      lng: 114.58055877685547,
      // Dipakai sebagai fallback bila koordinat belum tersedia.
      mapsQuery: 'Jl. Kuin Selatan RT 12, Banjarmasin',
      isPrimary: true,
    },
  ],

  /* =======================================================
     GALERI PRE-WEDDING
     ------------------------------------------------------------
     Klien meminta galeri pre-wedding ditampilkan lagi.

     CARA MENGISI:
       1. Simpan foto ke assets-src/ (folder ini tidak masuk Git).
       2. Jalankan `npm run optimize` untuk membuat varian WebP.
       3. Update `widths` di bawah dengan lebar varian yang Benar-BENAR
          ada di disk - tools/check-images.mjs akan gagal kalau meleset,
          jadi tidak mungkin salah diam-diam.

     `src` masih menunjuk placeholder .svg yang dibuat oleh
     `npm run placeholders`. Setelah klien mengirim foto asli:
       1. simpan ke assets-src/,
       2. jalankan `npm run optimize`,
       3. ubah `src` di bawah ke .jpg + isi `widths` dengan lebar
          varian WebP yang benar-benar ada.
     ======================================================= */
  gallery: {
    label: 'Gallery',
    title: 'Pre-Wedding',
    caption: 'Detik-detik sebelum hari besar kami.',
    photos: [
      { src: './img/gallery-1.svg', alt: 'Foto pre-wedding 1', widths: [] },
      { src: './img/gallery-2.svg', alt: 'Foto pre-wedding 2', widths: [] },
      { src: './img/gallery-3.svg', alt: 'Foto pre-wedding 3', widths: [] },
      { src: './img/gallery-4.svg', alt: 'Foto pre-wedding 4', widths: [] },
      { src: './img/gallery-5.svg', alt: 'Foto pre-wedding 5', widths: [] },
      { src: './img/gallery-6.svg', alt: 'Foto pre-wedding 6', widths: [] },
    ],
  },

  /* =======================================================
     TAMU PER-UNDANGAN
     ------------------------------------------------------------
     Satu Undangan bisa dikirim ke banyak orang. Parameter ?to= pada
     URL menyebut nama tamu yang sedang membuka, lalu nama itu
     dipakai di cover dan di halaman sambutan:

         https://domain/undangan?to=Bapak%20H.%20Rahman

     Tanpa parameter, halaman tetap tampil dengan sapaan umum
     ("Bapak/Ibu/Saudara/i") - tidak ada elemen kosong.

     modules/guest.js membacanya. Penulisan lewat textContent, bukan
     innerHTML, jadi nama dari URL tidak bisa disisipkan sebagai HTML.
     ======================================================= */
  guest: {
    queryParam: 'to',
    // Sapaan umum dipakai kalau tidak ada ?to=.
    genericSalutation: 'Bapak/Ibu/Saudara/i',
    // Batas panjang nama: mencegah URL yang sangat panjang merusak
    // layout, dan menahan nama yang tidak wajar.
    maxLength: 60,
  },

  /* =======================================================
     KONTAK
     ------------------------------------------------------------
     Kosongkan `whatsapp` untuk menyembunyikan SELURUH section
     kontak - bukan cuma tombolnya. Klien meminta judul
     "Ada pertanyaan?" dihapus, jadi sekarang tidak ada teks
     yang tampil tanpa tombolnya (dulu leftover "Ada pertanyaan?"
     dengan section kosong di bawahnya).

     Section-nya sendiri dibangun renderContact() di
     src/lib/render.js, jadi tidak ada di index.html sama sekali
     kalau whatsapp kosong.

     Format internasional tanpa "+" dan tanpa spasi, contoh:
       6281234567890
     ======================================================= */
  contact: {
    // Dipakai sebagai judul section kalau whatsapp sudah diisi.
    title: 'Hubungi Kami',
    label: 'Kontak Pengantin',
    // TODO-KLIEN: nomor WhatsApp pasangan (format internasional).
    whatsapp: '',
    message:
      'Assalamu\'alaikum, saya ingin mengonfirmasi kehadiran untuk pernikahan Muhammad Irfani & Parida Paska.',
  },

  /* =======================================================
     BACKDROP COVER
     ------------------------------------------------------------
     Klien minta nama pengantin di cover sulit dibaca karena
     menyatu dengan latar. Solusinya:
       1. foto jadi latar, diredupkan (opacity) supaya teks
          tetap jadi elemen utama, dan
       2. scrim gelap + text-shadow (lihat styles/sections.css).

     WADAH-nya sudah disiapkan (renderHero + CSS ::before),
     tapi FOTO-nya sengaja dikosongkan buat sekarang - pakai
     foto mempelai pria cuma untuk prototipe, dan klien belum
     mengirim foto pre-wedding. Waktu foto datang, isi `src`
     di bawah (idealnya landscape 1200x1600 atau lebih supaya
     tidak pecah saat di-cover), lalu jalankan `npm run check`.
     ======================================================= */
  hero: {
    backdrop: {
      // Kosong = wadah siap, foto belum ada. Cover otomatis
      // kembali ke gradien solid (tanpa foto).
      src: '',
      alt: 'Foto pre-wedding Muhammad Irfani & Parida Paska',
      // 0..1. Jangan naikkan di atas ~0.45: teks putih di atas
      // foto terang akan jadi sulit dibaca lagi.
      opacity: 0.32,
      // Fokus saat foto dipotong oleh background-size: cover.
      // '50% 30%' = bagian atas foto, tempat wajah biasanya ada.
      position: '50% 30%',
    },
  },

  /* =======================================================
     BAGIKAN / QR
     ======================================================= */
  share: {
    label: 'Digital Invitation',
    title: 'Bagikan Undangan',
    caption: 'Scan QR Code untuk membuka undangan.',
    // TODO-KLIEN: QR asli akan dibuat di Tahap 7 dari URL produksi.
    qrPlaceholder: './img/qr-placeholder.svg',
  },

  /* =======================================================
     UCAPAN
     ======================================================= */
  wishes: {
    label: 'Wishes',
    title: 'Ucapan & Doa',
    namePlaceholder: 'Nama',
    messagePlaceholder: 'Tulis ucapan dan doa...',
    submitLabel: 'Kirim Ucapan',
    nameMaxLength: 60,
    messageMaxLength: 500,
  },

  /* =======================================================
     RSVP
     ======================================================= */
  rsvp: {
    label: 'RSVP',
    title: 'Konfirmasi Kehadiran',
    text: 'Mohon konfirmasi kehadiran Anda untuk membantu kami mempersiapkan acara.',
    namePlaceholder: 'Nama Lengkap',
    guestPlaceholder: 'Jumlah Tamu',
    submitLabel: 'Kirim Konfirmasi',
    // Opsi select. `value` = data yang dikirim ke database.
    statusOptions: [
      { value: 'hadir', label: 'Hadir' },
      { value: 'tidak_hadir', label: 'Tidak Hadir' },
    ],
    placeholder: 'Pilih konfirmasi',
    maxGuest: 10,
  },
};

/* =======================================================
   ACARA UTAMA
   Handy untuk countdown: ambil acara yang paling dekat.
   ======================================================= */
export const PRIMARY_EVENT =
  CONFIG.events.find((e) => e.isPrimary) || CONFIG.events[0];

/**
 * Tanggal acara sebagai string ISO-8601 dengan offset eksplisit.
 * Contoh: "2026-10-25T08:00:00+08:00"
 */
export function eventStartISO(event = PRIMARY_EVENT) {
  return `${event.date}T${event.startTime}:00${UTC_OFFSET}`;
}

/** Ujung waktu acara, untuk kalender (.ics & Google Calendar). */
export function eventEndISO(event = PRIMARY_EVENT) {
  return `${event.date}T${event.endTime}:00${UTC_OFFSET}`;
}

/** Alamat satu baris, untuk Google Calendar & peta. */
export function eventFullAddress(event) {
  return [event.venue, event.address, event.district, event.city, event.region]
    .filter(Boolean)
    .join(', ');
}
