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

/* ---------- 2. Aset placeholder yang masih dipakai ---------- */
const fromConfig = [...configSrc.matchAll(/'(\.\/img\/[^']*(?:placeholder|gallery-\d)[^']*)'/g)]
  .map((m) => m[1]);
const fromHtml = [...indexHtml.matchAll(/(\.\/img\/(?:qr-)?placeholder[^"']*)/g)]
  .map((m) => m[1]);

const placeholderAssets = [...new Set([...fromConfig, ...fromHtml])];

const missingAssets = placeholderAssets.filter(
  (rel) => !existsSync(join(ROOT, 'public', rel.replace('./', ''))),
);

/* ---------- 3. Nilai yang masih Ellipsis / contoh ---------- */
const stillPlaceholder = [
  ...new Set(
    [...configSrc.matchAll(/'([^']*\u2026[^']*)'/g)].map((m) => m[1].trim()),
  ),
];

/* ---------- 4. Koordinat venue ---------- */
const nullCoords = (configSrc.match(/(lat|lng):\s*null/g) || []).length;
const venueCount = (configSrc.match(/venue:\s*'/g) || []).length;

/* ---------- 5. Tanggal masih perlu konfirmasi ---------- */
const date = (configSrc.match(/date:\s*'(\d{4}-\d{2}-\d{2})'/) || [])[1];

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

console.log(`\n  [${++group}] Koordinat venue  (${nullCoords} nilai null dari ${venueCount * 2} slot)`);
if (nullCoords === 0) console.log('        - Semua koordinat sudah diisi.');

console.log(`\n  [${++group}] Tanggal acara  (${date || 'tidak ditemukan'})`);
console.log(`        - Perlu konfirmasi klien. Nilai sekarang masih asumsi.`);
/* ---------- 6. Musik latar ---------- */
// Lagu pengantin sungguhan berdurasi 3-5 menit. File uji atau sampel
// library gratis biasanya di bawah 1 menit. Kalau durasinya mencurigakan
// pendek, hampir pasti itu belum lagu pilihan klien.
const audioPath = join(ROOT, 'public', 'audio', 'lagu.mp3');
let audioPending = 0;

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
    const tooShort = seconds < 120;
    if (tooShort) audioPending = 1;

    console.log(`\n  [${++group}] Musik latar  (${mins}m ${secs}d, ${bitrate / 1000} kbps, ${(buf.length / 1024).toFixed(0)} KB)`);
    if (tooShort) {
      console.log('        - Terlalu pendek untuk lagu pengantin (butuh >= 2 menit).');
      console.log('          Hampir pasti file uji - minta lagu asli dari klien.');
    } else {
      console.log('        - Durasi wajar. Pastikan ini lagu pilihan klien.');
    }
    console.log('        - 128 kbps sudah cukup untuk musik latar. Jangan re-encode');
    console.log('          ke bawah: kualitas turun tapi penghematannya sedikit.');
  }
} else {
  audioPending = 1;
  console.log(`\n  [${++group}] Musik latar  (TIDAK ADA)`);
  console.log('        ! public/audio/lagu.mp3 tidak ditemukan.');
}

if (missingAssets.length) {
  console.log('\n  PERINGATAN: aset placeholder hilang dari disk:');
  missingAssets.forEach((a) => console.log(`        ! ${a}`));
}

console.log('\n  ' + '='.repeat(58));

const total = todos.length + stillPlaceholder.length + nullCoords + audioPending;
if (total === 0) {
  console.log('  SEMUA DATA SUDAH LENGKAP. Siap produksi.\n');
} else {
  console.log(`  ${total} item masih menunggu data klien.\n`);
  console.log('  Lihat tabel "Data yang Masih Menunggu Klien" di README.md.\n');
  process.exit(0); // bukan error - ini pengingat, bukan kegagalan
}
