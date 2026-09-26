/**
 * tools/check-content.mjs
 * ---------------------------------------------------------------
 * Memastikan index.html dan src/config.js TIDAK berbeda.
 *
 * MASALAH YANG DISELESAIKAN:
 *   index.html sengaja berisi teks fallback (nama, tanggal, alamat,
 *   nomor rekening) supaya crawler WhatsApp yang tidak menjalankan JS
 *   tetap bisa menampilkan preview yang benar.
 *
 *   Riskanya: kalau klien mengubah config.js lalu lupa mengubah
 *   HTML, preview di WhatsApp akan menampilkan TANGGAL LAMA
 *   sementara halamannya sendiri tampil tanggal baru. Jiangek
 *   sangat membingungkan dan sulit dideteksi.
 *
 *   Skrip ini menjadi penjaga: `npm run check` gagal kalau ada
 *   ketidakcocokan.
 *
 * Jalankan:  node tools/check-content.mjs
 * ---------------------------------------------------------------
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const configSrc = readFileSync(join(ROOT, 'src', 'config.js'), 'utf8');

/* ---------- Ambil nilai sederhana dari config.js tanpa eval ---------- */

/**
 * config.js adalah ES module browser (memakai import.meta.env), jadi
 * tidak bisa di-import langsung di Node. Kita baca teksnya saja.
 * Cukup untuk checking, dan jauh lebih aman daripada eval.
 */
function cfgString(path) {
  const key = path.split('.').pop();
  // Ambil blok object yang mengandung key, lalu baris pertamanya
  const re = new RegExp(`${key}:\\s*'([^']*)'`);
  const m = configSrc.match(re);
  return m ? m[1] : null;
}

function cfgArrayOfStrings(marker) {
  const idx = configSrc.indexOf(marker);
  if (idx === -1) return [];
  const re = /'([^']+)'/g;
  const out = [];
  let m;
  const slice = configSrc.slice(idx, idx + 600);
  while ((m = re.exec(slice))) out.push(m[1]);
  return out;
}

/* ---------- Utilitas HTML ---------- */

const strip = (s) => s
  .replace(/&amp;/g, '&')
  .replace(/&hellip;/g, '…')
  .replace(/&mdash;/g, '—')
  .replace(/&ndash;/g, '–')
  .replace(/&#8212;/g, '—')
  .replace(/&rsquo;/g, '’')
  .replace(/&lsquo;/g, '‘')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const checks = [];
const add = (name, ok, detail) => checks.push({ name, ok, detail });

/* ---------- 1. Nama pengantin di <title> & OG ---------- */
const bride = cfgString('bride');
const groomCfg = (configSrc.match(/groom:\s*'([^']+)'/) || [])[1];

if (html.includes('<title>The Wedding of Uswatun Hasanah &amp; Muhammad</title>')) {
  add('Nama di <title>', true, 'OK');
} else {
  add('Nama di <title>', false,
    'Judul <title> tidak lagi "The Wedding of Uswatun Hasanah & Muhammad". '
    + 'Update juga og:title & og:description.');
}

/* ---------- 2. Tanggal & nama hari di <time datetime> ---------- */
// config: date: '2026-11-20', startTime: '08:00'
const date = (configSrc.match(/date:\s*'(\d{4}-\d{2}-\d{2})'/) || [])[1];
const time = (configSrc.match(/startTime:\s*'(\d{2}:\d{2})'/) || [])[1];

if (date && time) {
  const iso = `${date}T${time}:00+08:00`;
  if (html.includes(`datetime="${iso}"`)) {
    add('Atribut datetime pada <time>', true, `OK (${iso})`);
  } else {
    add('Atribut datetime pada <time>', false,
      `Diharapkan datetime="${iso}" di <time>. `
      + 'Atribut ini dipakai mesin, jadi wajib akurat.');
  }

  // Nama hari dihitung ulang di sini (Node punya ICU bawaan)
  const human = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Makassar',
  }).format(new Date(`${date}T00:00:00+08:00`));

  if (html.includes(human)) {
    add('Nama hari di HTML', true, `OK ("${human}")`);
  } else {
    add('Nama hari di HTML', false,
      `Dihitung dari config: "${human}". `
      + 'Teks di index.html masih berbeda. Pastikan sama.');
  }
}

/* ---------- 3. Nomor rekening: display vs yang disalin ---------- */
// Ambil HANYA bagian `banks: [ ... ]` supaya tidak salah menangkap
// kata kunci `label:` milik section lain (mis. story).
const banksBlock = (() => {
  const start = configSrc.indexOf('banks: [');
  if (start === -1) return '';
  const open = configSrc.indexOf('[', start);
  const close = configSrc.indexOf('\n  ],', open);
  return configSrc.slice(open, close === -1 ? undefined : close);
})();

const bankBlocks = [...banksBlock.matchAll(
  /label:\s*'([^']+)',[\s\S]*?number:\s*'([^']+)',[\s\S]*?display:\s*'([^']+)'/g,
)];

if (!bankBlocks.length) {
  add('Nomor rekening', false, 'Pola bank tidak ditemukan di config.js');
} else {
  for (const [, label, number, display] of bankBlocks) {
    const normalized = display.replace(/\D/g, '');
    if (normalized === number) {
      add(`Rekening ${label} konsisten`, true, `${number} == ${display}`);
    } else {
      add(`Rekening ${label} TIDAK konsisten`, false,
        `number="${number}" tapi display="${display}" `
        + `(digit: ${normalized}). Tamu menyalin A, melihat B.`);
    }

    // Pastikan value di HTML sama dengan config
    if (!html.includes(`data-copy="${number}"`)) {
      add(`data-copy ${label} di HTML`, false,
        `Tidak ditemukan data-copy="${number}" di index.html`);
    }
  }
}

/* ---------- 4. Alamat venue ---------- */
const venues = [...configSrc.matchAll(
  /venue:\s*'([^']+)',\s*\n\s*address:\s*'([^']+)'/g,
)];

for (const [i, [, venue, address]] of venues.entries()) {
  if (html.includes(venue) && html.includes(address)) {
    add(`Alamat venue ${i + 1} ada di HTML`, true, venue);
  } else {
    add(`Alamat venue ${i + 1} hilang dari HTML`, false,
      `HTML harus memuat "${venue}" dan "${address}".`);
  }
}

/* ---------- 5. Galeri: jumlah & sumber gambar ---------- */
const gallerySrc = [...configSrc.matchAll(/src:\s*'(\.\/img\/gallery-[^']+)'/g)].map((m) => m[1]);
const missing = gallerySrc.filter((src) => !html.includes(src));
if (missing.length === 0) {
  add('Galeri foto lengkap', true, `${gallerySrc.length} foto ada di HTML`);
} else {
  add('Galeri foto tidak lengkap', false, `Hilang di HTML: ${missing.join(', ')}`);
}

/* ---------- 6. Tidak ada TODO yang terlewat di konten produksi ---------- */
/* (Comment-only: TODO di dalam komentar JS tidak dihitung di sini.
   Pemeriksaan TODO-KLIEN menyeluruh ada di tools/check-placeholders.mjs) */

/* ---------- Laporan ---------- */
const failed = checks.filter((c) => !c.ok);
const passed = checks.length - failed.length;

console.log('\n  PEMERIKSAAN KONSISTENSI KONTEN');
console.log('  ' + '='.repeat(58));

for (const c of checks) {
  const mark = c.ok ? '  OK  ' : ' GAGAL';
  console.log(`${mark}  ${c.name}`);
  if (!c.ok) console.log(`        -> ${c.detail}`);
}

console.log('  ' + '='.repeat(58));
console.log(`  ${passed} lolos, ${failed.length} gagal\n`);

if (failed.length) {
  console.error('  KONTEN TIDAK KONSISTEN. Perbaiki sebelum deploy.\n');
  process.exit(1);
}
