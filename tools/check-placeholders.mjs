/**
 * tools/check-placeholders.mjs
 * ---------------------------------------------------------------
 * Melacak semua data yang MASIH placeholder dan menunggu klien.
 *
 * Tujuannya: tidak ada yang luput. Sebelum hari-H, daftar ini
 * harus kosong. Jalankan `npm run check:placeholders` kapan saja
 * untuk melihat progres.
 * ---------------------------------------------------------------
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const configSrc = readFileSync(join(ROOT, 'src', 'config.js'), 'utf8');
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8');

/* ---------- 1. TODO-KLIEN di config.js ---------- */
const todos = [...configSrc.matchAll(/TODO-KLIEN:\s*(.+)/g)]
  .map((m) => m[1].trim())
  // dedupe
  .filter((v, i, a) => a.indexOf(v) === i);

/* ---------- 2. Aset placeholder yang masih dipakai ----------
   Pola gallery-N ikut dilaporkan sebagai placeholder yang MASIH
   dipakai: klien meminta galeri dikembalikan, tapi foto aslinya
   belum dikirim. Selama masih placeholder, section tampil rapi dan
   bisa direview layout-nya (tidak ada ikon gambar rusak).
   --------------------------------------------------------------- */
const fromConfig = [...configSrc.matchAll(/'(\.\/img\/[^']*placeholder[^']*)'/g)]
  .map((m) => m[1]);
const fromHtml = [...indexHtml.matchAll(/(\.\/img\/[^"']*placeholder[^"']*)/g)]
  .map((m) => m[1]);

const placeholderAssets = [...new Set([...fromConfig, ...fromHtml])];

const missingAssets = placeholderAssets.filter(
  (rel) => !existsSync(join(ROOT, 'public', rel.replace('./', ''))),
);

/* ---------- 2b. Galeri pre-wedding (menunggu klien) ----------
   Galeri sudah diminta klien, jadi ASETNYA SAH. Yang belum ada
   adalah foto aslinya. Bedakan dua hal ini, jangan sampai
   placeholder dianggap sebagai section yang dibatalkan.
   ------------------------------------------------------------ */
const galleryAssets = [...new Set([
  ...[...configSrc.matchAll(/'(\.\/img\/gallery-[^']*)'/g)].map((m) => m[1]),
  ...[...indexHtml.matchAll(/(\.\/img\/gallery-[^"']*)/g)].map((m) => m[1]),
])];

const galleryMissingOnDisk = galleryAssets.filter(
  (rel) => !existsSync(join(ROOT, 'public', rel.replace('./', ''))),
);

// Cover masih section yang benar-benar dibatalkan klien.
const removedSectionAssets = [...new Set(
  [...indexHtml.matchAll(/(\.\/img\/cover-[^"']*)/g)].map((m) => m[1]),
)];

/* ---------- 2c. Foto cover / backdrop (menunggu klien) ----------
   Wadahnya (renderHero + CSS ::before) sudah siap, tapi klien
   belum mengirim foto pre-wedding. `src: ''` itu keadaan yang
   sah, bukan bug - tapi harus terlihat di daftar ini supaya
   tidak menganggap cover sudah final. */
const heroBlock = (configSrc.match(/backdrop:\s*\{[^}]*\}/) || [''])[0];
const coverPhoto = (heroBlock.match(/src:\s*'([^']*)'/) || [])[1];
const coverPhotoEmpty = !coverPhoto;

/* ---------- 3. Nilai yang masih Ellipsis / contoh ---------- */
const stillPlaceholder = [
  ...new Set(
    [...configSrc.matchAll(/'([^']*\u2026[^']*)'/g)].map((m) => m[1].trim()),
  ),
];

/* ---------- 3b. Nomor WhatsApp organizer ----------
   Konfirmasi klien: TANPA nomor (privasi pengantin). Section kontak
   permanen tidak dirender. Tidak lagi jadi item menunggu klien -
   biarkan `whatsapp` kosong, jangan diisi. */
const whatsapp = (configSrc.match(/whatsapp:\s*'([^']*)'/) || [])[1];
const whatsappEmpty = !whatsapp;

/* ---------- 4. Koordinat venue ---------- */
const nullCoords = (configSrc.match(/(lat|lng):\s*null/g) || []).length;
const venueCount = (configSrc.match(/venue:\s*'/g) || []).length;

/* ---------- 4b. Nama resmi venue ----------
   Konfirmasi klien: acara di gang perumahan, jadi TIDAK ADA nama
   venue. `venue` memang kosong dengan sengaja; alamat sudah cukup.
   Tidak lagi jadi item menunggu klien. */
const venueName = (configSrc.match(/venue:\s*'([^']*)'/) || [])[1];
const venueNameEmpty = !venueName;

/* ---------- 5. Tanggal & jam selesai acara ---------- */
const date = (configSrc.match(/date:\s*'(\d{4}-\d{2}-\d{2})'/) || [])[1];

/* Halaman menulis "08.00 s/d selesai" (endTimeLabel, keputusan
   klien), sementara file kalender butuh jam konkret (endTime,
   17:00). DTEND 17:00 adalah ASUMSI TEKNIS - bukan lagi menunggu
   klien, karena klien sudah memilih tampilan "s/d selesai". Tetap
   ditampilkan di laporan supaya tidak dilupakan: kalau acara
   ternyata jauh lebih pagi selesai, blok di kalender tamu akan
   melebar sampai 17.00. */
const endTimeLabel = (configSrc.match(/endTimeLabel:\s*'([^']*)'/) || [])[1];
const endTime = (configSrc.match(/endTime:\s*'([^']*)'/) || [])[1];
const endTimeAssumed = !!endTimeLabel && !/^\d{1,2}[.:]\d{2}$/.test(endTimeLabel);

/* ---------- Laporan ---------- */
console.log('\n  DATA YANG MENUNGGU KLIEN');
console.log('  ' + '='.repeat(58));

let group = 0;
console.log(`\n  [${++group}] Catatan TODO di config.js  (${todos.length})`);
todos.forEach((t) => console.log(`        - ${t}`));

console.log(`\n  [${++group}] Nilai yang masih placeholder "..."  (${stillPlaceholder.length})`);
stillPlaceholder.forEach((t) => console.log(`        - "${t}"`));

console.log(`\n  [${++group}] Aset gambar placeholder  (${placeholderAssets.length})`);
placeholderAssets.forEach((t) => console.log(`        - ${t}`));

console.log(`\n  [${++group}] Foto galeri pre-wedding  (${galleryAssets.length} slot)`);
if (galleryMissingOnDisk.length) {
  console.log('        ! Slot galeri hilang dari disk:');
  galleryMissingOnDisk.forEach((t) => console.log(`          ! ${t}`));
} else {
  console.log('        - Semua slot ada, layout siap direview.');
}
console.log('        - Isinya masih PLACEHOLDER, bukan foto asli. Konfirmasi');
console.log('          klien: hanya ADA SATU foto pre-wedding. Keputusan layout');
console.log('          (satu foto besar vs tanpa section galeri) masih menunggu.');

if (coverPhotoEmpty) {
  console.log('\n  [' + (++group) + '] Foto cover (backdrop)');
  console.log('        - Wadah sudah siap, src sengaja kosong - menunggu foto');
  console.log('          pre-wedding klien. Saat foto datang: isi hero.backdrop.src');
  console.log('          di config.js (file hasil `npm run optimize`, mis.');
  console.log('          ./img/gallery-1.webp), lalu cek kontras teks di preview.');
}

console.log(`\n  [${++group}] Koordinat venue  (${nullCoords} nilai null dari ${venueCount * 2} slot)`);
if (nullCoords === 0) console.log('        - Semua koordinat sudah diisi.');

console.log(`\n  [${++group}] Nama resmi venue  (KEPUTUSAN KLIEN: tanpa venue)`);
if (venueNameEmpty) {
  console.log('        - Tidak ada nama venue (acara di gang perumahan). Alamat');
  console.log('          sudah cukup - tidak perlu diminta lagi ke klien.');
} else {
  console.log(`        - Terisi: ${venueName}`);
}

console.log(`\n  [${++group}] Nomor WhatsApp  (KEPUTUSAN KLIEN: tanpa nomor)`);
if (whatsappEmpty) {
  console.log('        - Tidak ada nomor WhatsApp (privasi pengantin). Section');
  console.log('          kontak permanen tidak dirender - tidak perlu diminta lagi.');
} else {
  console.log(`        - Terisi: ${whatsapp}`);
}

console.log(`\n  [${++group}] Tanggal acara  (${date || 'tidak ditemukan'})  (KEPUTUSAN KLIEN)`);
console.log('        - Tanggal & jam mulai sudah dari klien.');
console.log(`        - Di halaman ditulis "08.00 ${endTimeLabel || '?'}".`);
if (endTimeAssumed) {
  console.log(`        - Catatan teknis: file kalender memakai DTEND ${endTime || '?'} (asumsi).`);
  console.log('          Blok di kalender tamu akan membentang 08.00-17.00. Kalau');
  console.log('          ternyata acara selesai jauh lebih awal, samakan endTime.');
}

/* ---------- 7. Musik latar ----------
   Konfirmasi klien: lagu 55 detik (public/audio/lagu.mp3) DIPAKAI,
   bukan file uji yang harus diganti. Durasi pendek bukan lagi item
   menunggu klien - musik diputar dengan atribut `loop`, jadi tidak
   ada jeda hening. Blok ini tetap membaca bitrate & ukuran supaya
   file rusak / berubah diam-diam ketahuan. */
const audioPath = join(ROOT, 'public', 'audio', 'lagu.mp3');
let audioMissing = 0;

if (existsSync(audioPath)) {
  const buf = readFileSync(audioPath);
  let audioStart = 0;

  if (buf.slice(0, 3).toString('latin1') === 'ID3') {
    // Ukuran synchsafe ID3v2: 7 bit per byte, 4 byte terakhir.
    audioStart = 10 + ((buf[6] << 21) | (buf[7] << 14) | (buf[8] << 7) | buf[9]);
  }

  // Cari frame MPEG pertama untuk membaca bitrate.
  const BITRATE = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
  let bitrate = 0;
  for (let i = audioStart; i < Math.min(buf.length - 4, audioStart + 200000); i++) {
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
      const layer = (buf[i + 1] >> 1) & 0x03;
      const idx = (buf[i + 2] >> 4) & 0x0f;
      if (layer === 1 && idx !== 0 && idx !== 15) { bitrate = BITRATE[idx] * 1000; break; }
    }
  }

  if (bitrate) {
    const seconds = (buf.length - audioStart) / (bitrate / 8);
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);

    console.log(`\n  [${++group}] Musik latar  (${mins}m ${secs}d, ${bitrate / 1000} kbps, ${(buf.length / 1024).toFixed(0)} KB)  (KEPUTUSAN KLIEN: pakai lagu ini)`);
    if (seconds < 120) {
      console.log('        - Durasi pendek, tapi sudah dikonfirmasi klien: lagu ini');
      console.log('          dipakai apa adanya dan di-loop (atribut loop di <audio>).');
    } else {
      console.log('        - Durasi wajar untuk lagu pengantin.');
    }
    console.log('        - 128 kbps sudah cukup untuk musik latar. Jangan re-encode');
    console.log('          ke bawah: kualitas turun tapi penghematannya sedikit.');
  }
} else {
  audioMissing = 1;
  console.log(`\n  [${++group}] Musik latar  (TIDAK ADA)`);
  console.log('        ! public/audio/lagu.mp3 tidak ditemukan.');
}

if (removedSectionAssets.length) {
  console.log('\n  PERINGATAN: aset section yang sudah dibatalkan masih terpakai:');
  removedSectionAssets.forEach((a) => console.log(`        ! ${a}`));
}

if (galleryMissingOnDisk.length) {
  console.log('\n  PERINGATAN: slot galeri hilang dari disk (gambar rusak di halaman):');
  galleryMissingOnDisk.forEach((a) => console.log(`        ! ${a}`));
}

if (missingAssets.length) {
  console.log('\n  PERINGATAN: aset placeholder hilang dari disk:');
  missingAssets.forEach((a) => console.log(`        ! ${a}`));
}

console.log('\n  ' + '='.repeat(58));

// Keputusan klien (venue tanpa nama, WhatsApp kosong, lagu 55 dtk,
// jam selesai "s/d selesai") TIDAK dihitung lagi - semua sudah final.
const total = todos.length
  + stillPlaceholder.length
  + nullCoords
  + audioMissing
  + (galleryAssets.length ? 1 : 0)
  + galleryMissingOnDisk.length
  + removedSectionAssets.length
  + (coverPhotoEmpty ? 1 : 0);
if (total === 0) {
  console.log('  SEMUA DATA SUDAH LENGKAP. Siap produksi.\n');
} else {
  console.log(`  ${total} item masih menunggu (data klien / keputusan layout).\n`);
  console.log('  Lihat tabel "Data yang Masih Menunggu Klien" di README.md.\n');
  process.exit(0); // bukan error - ini pengingat, bukan kegagalan
}
