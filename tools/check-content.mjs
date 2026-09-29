/**
 * tools/check-content.mjs
 * ---------------------------------------------------------------
 * Memastikan index.html dan src/config.js TIDAK berbeda.
 *
 * MASALAH YANG DISELESAIKAN:
 *   index.html sengaja berisi teks fallback (nama, tanggal, alamat)
 *   supaya crawler WhatsApp yang tidak menjalankan JS tetap bisa
 *   menampilkan preview yang benar.
 *
 *   Riskanya: kalau klien mengubah config.js lalu lupa mengubah
 *   HTML, preview di WhatsApp akan menampilkan TANGGAL LAMA
 *   sementara halamannya sendiri tampil tanggal baru. Itu sangat
 *   membingungkan dan sulit dideteksi.
 *
 *   Skrip ini menjadi penjaga: `npm run check` gagal kalau ada
 *   ketidakcocokan.
 *
 * Jalankan:  node tools/check-content.mjs
 * ---------------------------------------------------------------
 */

import { readFileSync, readdirSync } from 'node:fs';
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

/**
 * Ambil isi satu blok object dari config.js, dari titik `{` sampai
 * `}` PASANGANNYA. Dipakai untuk couple.groom / couple.bride supaya
 * `parents:` milik sisi lain tidak ikut terbaca.
 *
 * Jendela karakter tetap (slice) tidak bisa dipakai: config akan
 * grew setelah klien menambah field baru, dan window yang pas
 * sekarang bisa gagal diam-diam nanti.
 */
function cfgObjectBlock(marker) {
  const start = configSrc.indexOf(marker);
  if (start === -1) return '';
  const open = configSrc.indexOf('{', start);
  if (open === -1) return '';
  let depth = 0;
  for (let i = open; i < configSrc.length; i++) {
    if (configSrc[i] === '{') depth++;
    else if (configSrc[i] === '}') {
      depth--;
      if (depth === 0) return configSrc.slice(open + 1, i);
    }
  }
  return '';
}

/* ---------- Ambil isi satu blok array dari config.js ----------
   config.js tidak bisa di-import di Node (memakai import.meta.env),
   jadi blok diambil sebagai teks. Fungsi ini mencari pembatas `[`
   dan `]` yang PASANGAN, sehingga `parents: ['A','B']` di dalam
   event tidak ikut tertangkap sebagai array terpisah.
   ------------------------------------------------------------ */
function cfgArrayBlock(marker) {
  const start = configSrc.indexOf(marker);
  if (start === -1) return '';
  const open = configSrc.indexOf('[', start);
  if (open === -1) return '';
  let depth = 0;
  for (let i = open; i < configSrc.length; i++) {
    if (configSrc[i] === '[') depth++;
    else if (configSrc[i] === ']') {
      depth--;
      if (depth === 0) return configSrc.slice(open, i + 1);
    }
  }
  return configSrc.slice(open);
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
/* Nama diambil dari config, BUKAN ditulis manual di sini. Kalau
   klien mengganti nama, checker ini otomatis mengikuti - dan akan
   menandai kalau index.html lupa diupdate. */
const brideName = (configSrc.match(/bride:\s*'([^']+)'/) || [])[1];
const groomName = (configSrc.match(/groom:\s*'([^']+)'/) || [])[1];

if (!brideName || !groomName) {
  add('Nama di config', false,
    'Tidak bisa membaca couple.bride.name / couple.groom.name dari config.js');
} else {
  // Urutan di halaman:оссиcalaki dulu, lalu perempuan.
  const expectedTitle = `<title>The Wedding of ${groomName} &amp; ${brideName}</title>`;
  if (html.includes(expectedTitle)) {
    add('Nama di <title>', true, expectedTitle);
  } else {
    add('Nama di <title>', false,
      `Diharapkan persis: ${expectedTitle} `
      + 'Update juga og:title, og:description, dan og:image:alt.');
  }

  for (const tag of ['og:title', 'og:image:alt', 'description']) {
    const ok = html.includes(`${groomName} &amp; ${brideName}`)
      || html.includes(`${groomName} dan ${brideName}`);
    if (!ok) {
      add(`Nama konsisten di <meta ${tag}>`, false,
        `Meta ${tag} tidak memuat "${groomName}" dan "${brideName}".`);
    } else {
      add(`Nama konsisten di <meta ${tag}>`, true, 'OK');
    }
  }

  // Nama lama harus benar-benar hilang dari HTML, kalau tidak maka
  // preview WhatsApp masih menampilkan pasangan sebelumnya.
  const stale = ['Uswatun', 'Hasanah'];
  const found = stale.filter((s) => html.includes(s));
  add('Nama pasangan lama dihapus', found.length === 0,
    found.length ? `Masih muncul: ${found.join(', ')}` : 'OK');
}

/* ---------- 2. Tanggal & nama hari di <time datetime> ---------- */
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

/* ---------- 3. Section yang dibatalkan klien ----------
   Klien minta tanpa rekening, tanpa galeri, dan tanpa cerita.
   Pemeriksaan ini mencegah section tersebut muncul kembali
   diam-diam - biasanya lewat copy-paste template lama.
   ------------------------------------------------------------ */
for (const [label, pattern] of [
  ['Rekening (donasi)', /data-copy="/],
  ['Galeri foto', /class="gallery"|gallery-\d\.svg/],
  ['Cerita / love story', /class="story"|story-box/],
  ['Gambar cover', /cover-placeholder|class="cover-content"/],
]) {
  add(`${label} tidak ada`, !pattern.test(html),
    pattern.test(html)
      ? 'Section ini sudah dibatalkan klien, hapus dari index.html.'
      : 'OK');
}

/* ---------- 4. Alamat acara ----------
   Venue resmi belum diberikan klien, jadi field `venue` masih kosong
   dan yang tampil hanya alamat. Checker ini mengikuti config:
   kalau nanti venue diisi, nilainya otomatis ikut di-check.
   ------------------------------------------------------------ */
const eventBlock = cfgArrayBlock('events:');

if (!eventBlock) {
  add('Blok acara di config', false, 'Tidak menemukan "events: [" di config.js');
} else {
  const venue = (eventBlock.match(/venue:\s*'([^']*)'/) || [])[1];
  const address = (eventBlock.match(/address:\s*'([^']+)'/) || [])[1];

  if (venue && !html.includes(venue)) {
    add('Nama venue ada di HTML', false,
      `Config: "${venue}". Wajib ada di index.html untuk preview WhatsApp.`);
  } else if (venue) {
    add('Nama venue ada di HTML', true, venue);
  } else {
    add('Nama venue (opsional)', true, 'Kosong - ditampilkan sebagai alamat saja');
  }

  if (address && html.includes(address)) {
    add('Alamat acara ada di HTML', true, address);
  } else {
    add('Alamat acara ada di HTML', false,
      address ? `Tidak ditemukan "${address}" di index.html.`
              : 'Tidak bisa membaca address dari events[]');
  }
}

/* ---------- 4b. Tiap acara punya peta & navigasi sendiri ----------
   Kalau suatu saat akad dan resepsi dipecah ke lokasi berbeda,
   jumlah <iframe>, kartu lokasi, dan tombol navigasi HARUS sama
   dengan jumlah event. Kalau tidak, tamu bisa salah datang.
   --------------------------------------------------------------- */

const eventCount = (eventBlock.match(/\bid:\s*'/g) || []).length;

// Komentar HTML ikut memuat kata "<iframe>". Kalau tidak dibuang,
// hitungan peta jadi keliru dan check ini selalu gagal.
const htmlNoComment = html.replace(/<!--[\s\S]*?-->/g, '');

const mapFrames = (htmlNoComment.match(/<iframe[\s>]/g) || []).length;
const navLinks = (htmlNoComment.match(/data-nav-maps/g) || []).length;
const mapCards = (htmlNoComment.match(/class="map-card"/g) || []).length;

if (eventCount === 0) {
  add('Jumlah acara terbaca', false, 'Tidak ada id: di dalam events[]');
} else {
  for (const [name, actual, unit] of [
    ['Satu peta per acara', mapFrames, 'peta'],
    ['Satu kartu lokasi per acara', mapCards, 'kartu'],
    ['Satu tombol navigasi per acara', navLinks, 'tombol'],
  ]) {
    if (actual === eventCount) {
      add(name, true, `${actual} ${unit} untuk ${eventCount} acara`);
    } else {
      add(name, false,
        `Diharapkan ${eventCount} ${unit}, ditemukan ${actual}. `
        + 'Tamu yang salah alamat akan sangat mungkin terjadi.');
    }
  }
}

/* ---------- 5. Nama orang tua sesuai config ---------- */
for (const [side, marker] of [
  ['pria', 'groom: {'],
  ['wanita', 'bride: {'],
]) {
  const block = cfgObjectBlock(marker);
  const parentsBlock = (block.match(/parents:\s*\[([^\]]*)\]/) || [])[1] || '';
  const names = [...parentsBlock.matchAll(/'([^']+)'/g)].map((m) => m[1]);

  if (names.length !== 2) {
    add(`Jumlah orang tua ${side}`, false,
      `Harus tepat 2 nama di couple.${side}.parents, ditemukan ${names.length}`);
    continue;
  }
  const missingParent = names.filter((n) => !html.includes(n));
  add(`Orang tua ${side} di HTML`, missingParent.length === 0,
    missingParent.length
      ? `Tidak ditemukan di index.html: ${missingParent.join(' & ')}`
      : `${names[0]} & ${names[1]}`);
}

/* ---------- 6. Signature el() harus menerima anak variabel ----------
   MASALAH YANG DISELESAIKAN:
     Signature lama `el(tag, attrs = {}, children = '')` hanya menerima
     TIGA argumen. Pemakaian seperti
     el('span', { class: 'x' }, ikon, el('time', {...}))
     membuat anak ke-4 DIBUANG DIAM-DIAM tanpa error, sehingga kartu
     acara hanya menampilkan ikon saja dan tanggal/jam hilang.

     Perbaikannya: `el(tag, attrs = {}, ...children)`, dan `el()`
     kini melompati null/undefined/false (appendChildren sudah begitu).

   Guard ini menjaga signature itu tidak dikembalikan diam-diam, karena
   akibatnya tidak terlihat di build maupun console.
   --------------------------------------------------------------- */
const domSrc = readFileSync(join(ROOT, 'src', 'lib', 'dom.js'), 'utf8');

const elSignature = domSrc.match(/export function el\(\s*tag[^)]*\)/);
const acceptsRest = elSignature
  && /(\.\.\.children|(\.\.\.[a-zA-Z]+)\s*[,)])/.test(elSignature[0]);

add('Signature el() menerima anak variabel', Boolean(acceptsRest),
  acceptsRest
    ? 'OK'
    : `Ditemukan: ${elSignature ? elSignature[0] : 'tidak bisa dibaca'}. `
      + 'Harus `el(tag, attrs = {}, ...children)`, kalau tidak anak ke-4+ '
      + 'akan hilang tanpa error.');

/* ---------- 7. append() native dengan nilai kosong ----------
   `node.append(null)` pada DOM native menulis TEKS "null" ke layar,
   karena append() tidak memfilter null seperti helper el() sendiri.
   Pola `kondisi ? el(..) : null` yang diteruskan ke append() adalah
   penyebab teks "null" pernah muncul di kartu acara.
   Di src/ ini append() hanya boleh dipanggil dengan anak yang
   dijamin tidak kosong.
   --------------------------------------------------------------- */
function listJsFiles(dir, acc = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) listJsFiles(p, acc);
    else if (name.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

/** Pecah argumen pemanggilan pada tingkat teratas, abaikan string & kurung. */
function splitCallArgs(src, from) {
  const args = [];
  let depth = 0;
  let quote = null;
  let cur = '';
  for (let i = from; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === quote && src[i - 1] !== '\\') quote = null;
      cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; cur += ch; continue; }
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) {
      if (depth === 0) { args.push(cur.trim()); return args; }
      depth--;
    } else if (ch === ',' && depth === 0) { args.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  return args;
}

const suspects = [];
for (const file of listJsFiles(join(ROOT, 'src'))) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\.append\(/g)) {
    const args = splitCallArgs(src, m.index + m[0].length);
    // null / false langsung, atau cabang ternary yang berakhiran ": null".
    const bad = args.filter((a) => a === 'null' || a === 'false' || /:\s*(null|false)\s*$/.test(a));
    if (bad.length) {
      const line = src.slice(0, m.index).split('\n').length;
      suspects.push(`${file.replace(ROOT + '\\', '').replace(ROOT + '/', '')}:${line}`);
    }
  }
}

add('append() tanpa nilai kosong', suspects.length === 0,
  suspects.length
    ? 'append() native dengan null/false akan menampilkan teks "null". '
      + `Perbaiki di: ${suspects.join(', ')}`
    : 'OK');

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
