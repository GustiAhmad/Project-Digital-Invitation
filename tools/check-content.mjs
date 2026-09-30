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

import { readFileSync, readdirSync, existsSync } from 'node:fs';
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
   Klien minta tanpa rekening dan tanpa cerita. Galeri pre-wedding
   dan foto cover justru diminta KEMBALI, jadi keduanya tidak ada
   di daftar ini. Pemeriksaan ini mencegah section yang dibatalkan
   muncul kembali diam-diam - biasanya lewat copy-paste template
   lama.
   ------------------------------------------------------------ */
for (const [label, pattern] of [
  ['Rekening (donasi)', /data-copy="/],
  ['Cerita / love story', /class="story"|story-box/],
]) {
  add(`${label} tidak ada`, !pattern.test(html),
    pattern.test(html)
      ? 'Section ini sudah dibatalkan klien, hapus dari index.html.'
      : 'OK');
}

/* ---------- 3a. Cover: foto latar ----------
   Klien minta foto pasangan dipakai sebagai latar cover supaya
   nama pengantin lebih terbaca. Konfigurasinya ada di
   CONFIG.hero.backdrop dan disuntikkan renderHero() sebagai CSS
   custom property --hero-backdrop.

   Foto SENGAJA KOSONG buat sekarang: wadah (renderHero + CSS
   ::before) sudah siap, tapi klien belum mengirim foto
   pre-wedding. Jadi `src: ''` ADALAH keadaan yang sah - hanya
   perlu diingat sebagai data yang menunggu klien (lihat
   check-placeholders.mjs).

   Yang diperiksa:
     1. config hero.backdrop ada,
     2. kalau `src` diisi, file fotonya benar-benar ada di
        public/img/,
     3. kalau `src` kosong, lapor bahwa wadah siap tapi foto
        belum ada,
     4. opacity dibatasi (kalau terlalu tinggi, teks putih malah
        tenggelam - persis masalah yang mau diperbaiki).
   ------------------------------------------------------------ */
const heroBlock = cfgObjectBlock('hero: {');
const heroSrc = (heroBlock.match(/src:\s*'([^']*)'/) || [])[1];
const heroOpacity = Number((heroBlock.match(/opacity:\s*([\d.]+)/) || [])[1]);

if (!heroBlock) {
  add('Cover punya foto latar', false,
    'CONFIG.hero.backdrop tidak ditemukan di config.js. Tanpa itu, '
    + 'nama pengantin kembali menyatu dengan latar polos.');
} else if (!heroSrc) {
  add('Cover punya foto latar', true,
    'Wadah siap, foto sengaja kosong (menunggu foto pre-wedding klien). '
    + 'Saat foto datang, isi hero.backdrop.src lalu jalankan ulang.');
} else {
  const heroFile = heroSrc.replace(/^\.\//, 'public/');
  add('Cover punya foto latar', existsSync(join(ROOT, heroFile)),
    `${heroSrc} -> ${existsSync(join(ROOT, heroFile)) ? 'ada' : 'TIDAK ADA di public/img/'}`);

  add('Opacity foto cover aman (<= 0.6)',
    Number.isFinite(heroOpacity) && heroOpacity <= 0.6,
    Number.isFinite(heroOpacity)
      ? `opacity=${heroOpacity}`
      : 'opacity tidak terbaca; teks bisa tenggelam di foto terang.');
}

/* Komentar HTML ikut memuat kata "<iframe>". Kalau tidak dibuang,
   hitungan peta dan slot galeri jadi keliru. */
const htmlNoCommentLike = html.replace(/<!--[\s\S]*?-->/g, '');

/* ---------- 3b. Galeri pre-wedding ----------
   Klien meminta galeri dikembalikan. Jumlah slot di fallback HTML
   harus sama dengan jumlah foto di config.js, kalau tidak maka
   satu foto diam-diam tidak tampil - atau ada slot kosong yang
   tidak pernah diisi.
   ------------------------------------------------------------ */
const galleryBlock = cfgArrayBlock('photos: [');
const galleryConfigCount = galleryBlock
  ? (galleryBlock.match(/\bsrc:/g) || []).length
  : -1;

const galleryHtmlCount = (htmlNoCommentLike.match(/class="gallery-item"/g) || []).length;

if (galleryConfigCount < 0) {
  add('Galeri ada di config', false,
    'Tidak menemukan "photos: [" di config.js');
} else if (galleryConfigCount === 0) {
  add('Galeri ada di config', false,
    'gallery.photos kosong. Klien meminta galeri pre-wedding, '
    + 'minimal satu foto harus terdaftar.');
} else if (galleryHtmlCount === galleryConfigCount) {
  add('Jumlah slot galeri = jumlah foto', true,
    `${galleryConfigCount} foto di config, ${galleryHtmlCount} slot di HTML`);
} else {
  add('Jumlah slot galeri = jumlah foto', false,
    `config.js punya ${galleryConfigCount} foto, index.html punya `
    + `${galleryHtmlCount} slot. Samakan supaya tidak ada foto yang `
    + 'tidak tampil atau slot kosong.');
}

/* ---------- 3c. Tombol "Buka Undangan" ----------
   Tombol ini yang memulai musik, jadi harus ada dan harus menuju
   ke #intro. Kalau href-nya #couple, pengunjung melompati
   sambutan + countdown dan musik tetap tidak berbunyi.

   PENTING: urutan atribut di HTML tidak dijamin (mis. `href`
   boleh ditulis sebelum `class`). Regex yang bergantung urutan
   akan GAGAL COCOK, lalu check ini lolos diam-diam lewat cabang
   else. extractHref membaca seluruh tag <a> itu, bukan hanya
   sebagian, jadi aman terhadap urutan atribut.
   ------------------------------------------------------------ */

/** Ambil nilai href dari tag <a> pertama yang memuat `marker`. */
function extractHref(htmlSrc, marker) {
  const i = htmlSrc.indexOf(marker);
  if (i === -1) return null; // marker tidak ada sama sekali

  const open = htmlSrc.lastIndexOf('<a', i);
  if (open === -1) return null;

  const close = htmlSrc.indexOf('>', i);
  if (close === -1) return null;

  const m = htmlSrc.slice(open, close + 1).match(/href="([^"]*)"/);
  return m ? m[1] : ''; // '' = tag ada tapi href kosong
}

const openHref = extractHref(htmlNoCommentLike, 'id="openInvitation"');

if (openHref === null) {
  add('Tombol "Buka Undangan" ada', false,
    'Tidak ditemukan #openInvitation di index.html. Tanpa tombol ini '
    + 'musik tidak pernah mulai (browser memblokir autoplay).');
} else if (openHref !== '#intro') {
  add('Tombol "Buka Undangan" menuju #intro', false,
    `href="${openHref}" - harus "#intro" supaya sambutan dan countdown `
    + 'ikut terlihat.');
} else {
  add('Tombol "Buka Undangan" menuju #intro', true, 'href="#intro"');
}

// Panah di cover harus ke #intro juga. Dulu ke #couple sehingga
// section sambutan terlewat.
const arrowHref = extractHref(htmlNoCommentLike, 'class="hero-scroll"');

if (arrowHref === null) {
  add('Panah cover menuju #intro', false,
    'Tidak ditemukan .hero-scroll di cover.');
} else if (arrowHref !== '#intro') {
  add('Panah cover menuju #intro', false,
    `href="${arrowHref}" - harus "#intro".`);
} else {
  add('Panah cover menuju #intro', true, 'href="#intro"');
}

/* ---------- 3d. Section kontak tidak boleh di HTML ----------
   Klien minta bagian "Ada pertanyaan?" dihapus. Section kontak
   sekarang dibangun renderContact() hanya kalau
   contact.whatsapp sudah diisi.

   Kalau muncul lagi di index.html, artinya salah satu:
     - Judul ditulis statis padahal tombolnya tidak ada (persis
      keluhan klien), atau
     -nomor WhatsApp sudah diisi tapi section lupa dihapus dari
      HTML, sehingga muncul dua kali.

   Yang diperiksa di sini: tidak ada <section class="contact">
   di index.html, dan judul lama tidak ada di mana pun.
   ------------------------------------------------------------ */
add('Section kontak tidak ada di HTML',
  !/<section[^>]*class="[^"]*contact/.test(htmlNoCommentLike),
  /<section[^>]*class="[^"]*contact/.test(htmlNoCommentLike)
    ? 'Section kontak ditulis statis. Biarkan renderContact() yang '
      + 'membuatnya, atau hapus juga dari index.html.'
    : 'OK');

add('Judul "Ada pertanyaan?" dihapus',
  !/ada pertanyaan/i.test(htmlNoCommentLike),
  /ada pertanyaan/i.test(htmlNoCommentLike)
    ? 'Klien sudah minta judul ini dihapus.'
    : 'OK');

/* ---------- 3e. Petunjuk tombol kalender ----------
   Klien minta diperjelas mana tombol untuk Android dan mana untuk
   iPhone. Tanpa petunjuk, tamu iPhone salah klik tombol Google,
   diminta login, lalu menyerah.

   Tombolnya dibangun JavaScript (src/lib/render.js), jadi yang
   diperiksa di sini adalah kode render-nya - bukan index.html.
   ------------------------------------------------------------ */
const renderSrc = readFileSync(join(ROOT, 'src', 'lib', 'render.js'), 'utf8');

for (const [label, needle] of [
  ['ada label "Android"', "'Android'"],
  ['ada label "iPhone"', "'iPhone'"],
  ['ada judul petunjuk kalender', 'Simpan tanggal acara ke kalender'],
]) {
  add(`Petunjuk kalender: ${label}`, renderSrc.includes(needle),
    renderSrc.includes(needle) ? 'OK' : `Tidak ditemukan ${needle} di render.js`);
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
