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
      // TODO-KLIEN: konfirmasi jam selesai. Nilai ini dipakai untuk
      // batas akhir di file kalender (.ics & Google Calendar).
      endTime: '13:00',
      // TODO-KLIEN: nama resmi lokasi, bila ada.
      // Kalau acaranya di rumah, kosongkan saja: alamat di bawah
      // sudah cukup jelas tanpa nama bangunan.
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
     KONTAK
     ------------------------------------------------------------
     Kosongkan `whatsapp` untuk menyembunyikan tombolnya.
     Format internasional tanpa "+" dan tanpa spasi, contoh:
       6281234567890
     ======================================================= */
  contact: {
    label: 'Kontak Pengantin',
    // TODO-KLIEN: nomor WhatsApp pasangan (format internasional).
    whatsapp: '',
    message:
      'Assalamu\'alaikum, saya ingin mengonfirmasi kehadiran untuk pernikahan Muhammad Irfani & Parida Paska.',
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
