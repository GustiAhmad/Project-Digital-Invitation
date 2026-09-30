/* =========================================================
   src/modules/guest.js
   ---------------------------------------------------------------
   Personalisasi nama tamu dari parameter URL.

   CARA KERJA
     Satu build dipakai untuk banyak tamu. Klien cukup mengubah
     bagian URL saat mengirim tautan:

         https://domain/undangan?to=Bapak%20H.%20Rahman

     Nama itu lalu muncul di cover dan di halaman sambutan.

   KENAPA BUKAN SEPENUHNYA DINAMIS
     Undangan seperti ini biasanya dibagikan lewat WhatsApp, dan
     WhatsApp TIDAK menjalankan JavaScript saat membuat preview.
     Kalau nama hanya diisi lewat JS, preview-nya akan selalu versi
     umum - padahal share-nya justru yang paling sering dilihat.
     Karena itu teks statis di index.html tetap berupa sapaan umum
     (aman untuk crawler), dan modul ini meningkatkan pengalaman
     saat halaman benar-benar dibuka.

   KEAMANAN
     Nama berasal dari input yang sepenuhnya tidak tepercaya. Semua
     penulisan memakai textContent, TIDAK PERNAH innerHTML, jadi nama
     berisi "<script>" akan tampil sebagai teks dan tidak dieksekusi.
     Lihat juga catatan XSS di lib/dom.js.
   ========================================================= */

import { $$ } from '../lib/dom.js';
import { CONFIG } from '../config.js';

/**
 * Ambil nama tamu dari query string.
 *
 * Mengembalikan string yang sudah dibersihkan, atau '' kalau tidak
 * ada / tidak valid. Sengaja mengembalikan string kosong (bukan
 * null) supaya pemanggil cukup memeriksa satu kondisi.
 */
export function readGuestName(search = window.location.search) {
  const { queryParam, maxLength } = CONFIG.guest;

  let raw;
  try {
    raw = new URLSearchParams(search).get(queryParam);
  } catch {
    return ''; // search string rusak - abaikan, jangan lempar error
  }

  if (!raw) return '';

  const cleaned = raw
    // Buang karakter kontrol & baris baru: mencegah nama merusak
    // layout, dan mencegah nama yang menyamar dengan teks multi-baris.
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    // Rapatkan spasi berlebih jadi satu spasi.
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  // Potong sesuai config, lalu buang spasi sisa di ujung.
  return cleaned.slice(0, maxLength).trim();
}

/**
 * Tulis nama tamu ke semua elemen yang meminta.
 *
 * Elemen ditandai `data-guest="<place>"` di index.html. Place yang
 * dipakai saat ini: "cover" dan "intro".
 *
 * Tanpa nama, dipakai sapaan umum dari config supaya baris ini tidak
 * pernah terlihat kosong.
 */
export function renderGuestName() {
  const { genericSalutation } = CONFIG.guest;
  const name = readGuestName();

  $$('[data-guest]').forEach((node) => {
    const place = node.dataset.guest;

    // Tanpa nama: baris cover disembunyikan sepenuhnya (sapaan umum
    // sudah muncul di badan sambutan), baris intro memakai sapaan umum
    // supaya kalimatnya tetap lengkap.
    const text = name || (place === 'intro' ? genericSalutation : '');

    node.textContent = text;
    node.hidden = !text;
  });

  return name;
}
