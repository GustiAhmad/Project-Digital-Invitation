/* =========================================================
   src/config.js
   ---------------------------------------------------------------
   SATU-SATUNYA SUMBER KEBENARAN untuk seluruh konten situs.

   Semua teks yang tampil di halaman (nama, tanggal, alamat,
   nomor rekening, cerita, daftar foto) berasal dari file ini.

   CARA MENGUBAH KONTEN:
     Ubah HANYA file ini. Tidak perlu menyentuh HTML/CSS/JS.
    _botom Google Calendar, peta, navigasi, dan countdown akan
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
    bride: 'Uswatun Hasanah',
    groom: 'Muhammad',
    title: 'The Wedding of Uswatun Hasanah & Muhammad',
    description:
      'Undangan pernikahan digital Uswatun Hasanah & Muhammad. Kami menanti kehadiran Bapak/Ibu/Saudara/i.',
    // TODO-KLIEN: URL produksi. Diisi otomatis saat deploy (Tahap 9).
    siteUrl: import.meta.env?.VITE_SITE_URL || '',
  },

  /* =======================================================
     PASANGAN
     ======================================================= */
  couple: {
    bride: {
      name: 'Uswatun Hasanah',
      photo: './img/couple-bride.jpg',
      photoAlt: 'Foto Uswatun Hasanah',
      // TODO-KLIEN: ganti dengan nama asli orang tua.
      parentLabel: 'Putri dari',
      parents: ['Bapak  …', 'Ibu  …'],
    },
    groom: {
      name: 'Muhammad  …',
      photo: './img/couple-groom.jpg',
      photoAlt: 'Foto Muhammad',
      // TODO-KLIEN: ganti dengan nama asli orang tua.
      parentLabel: 'Putra dari',
      parents: ['Bapak  …', 'Ibu  …'],
    },
  },

  /* =======================================================
     ACARA
     ------------------------------------------------------------
     PENTING: kolom `date` SELALU format YYYY-MM-DD.
     Nama hari (Jumat/Sabtu/dll) TIDAK ditulis manual -
     dihitung otomatis oleh lib/format.js memakai zona waktu
     di atas. Ini mencegah kesalahan "Kamis vs Jumat" yang
     terjadi di versi lama.
     ======================================================= */
  events: [
    {
      id: 'akad',
      title: 'Akad Nikah',
      icon: 'rings',
      date: '2026-11-20', // TODO-KLIEN: konfirmasi tanggal pasti
      startTime: '08:00', // TODO-KLIEN: konfirmasi jam
      endTime: '10:00', // TODO-KLIEN: konfirmasi jam
      venue: 'Masjid Al-Muttaqin',
      address: 'Jl. Melati No.12',
      city: 'Banjarmasin',
      // TODO-KLIEN: koordinat asli venue (cara memperolehnya ada di README)
      lat: null,
      lng: null,
      // Dipakai sebagai fallback bila koordinat belum tersedia.
      mapsQuery: 'Masjid Al-Muttaqin, Banjarmasin',
      isPrimary: true, //<Event yangShown peta di section Lokasi
    },
    {
      id: 'resepsi',
      title: 'Resepsi',
      icon: 'glass',
      date: '2026-11-20', // TODO-KLIEN: konfirmasi tanggal pasti
      startTime: '11:00',
      endTime: '15:00',
      venue: 'Gedung Serbaguna Harmoni',
      address: 'Jl. Sudirman No.45',
      city: 'Banjarmasin',
      lat: null, // TODO-KLIEN
      lng: null, // TODO-KLIEN
      mapsQuery: 'Gedung Serbaguna Harmoni, Banjarmasin',
      isPrimary: false,
    },
  ],

  /* =======================================================
     KISAH
     ======================================================= */
  story: {
    label: 'Our Story',
    title: 'Kisah Kami',
    chapters: [
      {
        title: 'Pertemuan',
        // TODO-KLIEN: ganti dengan cerita asli
        text: 'Setiap kisah memiliki awal. Begitu juga dengan kisah kami. Dari sebuah pertemuan sederhana, perlahan tumbuh menjadi sebuah perjalanan yang berarti.',
      },
      {
        title: 'Perjalanan',
        // TODO-KLIEN: ganti dengan cerita asli
        text: 'Kami belajar untuk saling memahami, saling mendukung dan tumbuh bersama.',
      },
      {
        title: 'Hari Istimewa',
        // TODO-KLIEN: ganti dengan cerita asli
        text: 'Dengan memohon ridha Allah SWT, kami melangkah menuju kehidupan baru bersama.',
      },
    ],
  },

  /* =======================================================
     GALERI
     ------------------------------------------------------------
    -gallery masih grid di Tahap 1. Struktur ini akan dipakai
     ulang oleh carousel Swiper di Tahap 4.
     ======================================================= */
  gallery: {
    label: 'Memories',
    title: 'Galeri Foto',
    // TODO-KLIEN: ganti dengan foto pre-wedding asli (min. 6).
    photos: [
      { src: './img/gallery-1.svg', alt: 'Foto pre-wedding 1', width: 1200, height: 1500 },
      { src: './img/gallery-2.svg', alt: 'Foto pre-wedding 2', width: 1200, height: 1500 },
      { src: './img/gallery-3.svg', alt: 'Foto pre-wedding 3', width: 1200, height: 1500 },
      { src: './img/gallery-4.svg', alt: 'Foto pre-wedding 4', width: 1200, height: 1500 },
      { src: './img/gallery-5.svg', alt: 'Foto pre-wedding 5', width: 1200, height: 1500 },
      { src: './img/gallery-6.svg', alt: 'Foto pre-wedding 6', width: 1200, height: 1500 },
    ],
  },

  /* =======================================================
     KADO / DONASI
     ------------------------------------------------------------
     `number` dipakai untuk fitur salin ke clipboard.
     Pastikan SELARAS dengan `display` yang dilihat pengunjung.
     Script `npm run check` akan memverifikasi ini.
     ======================================================= */
  banks: [
    {
      id: 'brimo',
      label: 'BRIMO',
      icon: 'landmark',
      number: '123456789012', // TODO-KLIEN: nomor rekening asli
      display: '1234 5678 9012', // TODO-KLIEN: sama seperti `number`, dikelompokkan
      holder: 'Uswatun Hasanah', // TODO-KLIEN: atas nama siapa
    },
    {
      id: 'dana',
      label: 'DANA',
      icon: 'smartphone',
      number: '082253112508', // TODO-KLIEN
      display: '0822 5311 2508', // TODO-KLIEN
      holder: 'Uswatun Hasanah', // TODO-KLIEN
    },
  ],

  /* =======================================================
     BAGIKAN / QR
     ======================================================= */
  share: {
    label: 'Digital Invitation',
    title: 'Bagikan Undangan',
    caption: 'Scan QR Code untuk membuka undangan.',
    // TODO-KLIEN: QR asli akan dibuat di Tahap 9 dari URL produksi.
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
 * Contoh: "2026-11-20T08:00:00+08:00"
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
  return [event.venue, event.address, event.city].filter(Boolean).join(', ');
}
