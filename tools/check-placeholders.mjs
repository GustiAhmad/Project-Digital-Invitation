/**
 * tools/check-placeholders.mjs
 * ---------------------------------------------------------------
 * Melacak semua data yang MASIH placeholder dan menunggu klien.
 *
 * Tujuannya: tidak ada yang luput. Sebelum hari-H, daftar ini
 * harus kosong. Jalankan `npm run check:placeholders` kapan saja
 * untuk melihat progresrz.
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

if (missingAssets.length) {
  console.log('\n  PERINGATAN: aset placeholder hilang dari disk:');
  missingAssets.forEach((a) => console.log(`        ! ${a}`));
}

console.log('\n  ' + '='.repeat(58));

const total = todos.length + stillPlaceholder.length + nullCoords;
if (total === 0) {
  console.log('  SEMUA DATA SUDAH LENGKAP. Siap produksi.\n');
} else {
  console.log(`  ${total} item masih menunggu data klien.\n`);
  console.log('  Lihat tabel "Data yang Masih Menunggu Klien" di README.md.\n');
  process.exit(0); // bukan error - ini pengingat, bukan kegagalan
}
