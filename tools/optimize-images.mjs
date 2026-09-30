/* =========================================================
   tools/optimize-images.mjs
   ---------------------------------------------------------------
   Mengubah foto master di `assets-src/` menjadi ukuran siap pakai
   untuk web: beberapa lebar, format WebP, dan TANPA metadata.

   MASALAH YANG DISELESAIKAN
     1. Bobot halaman
        Foto master yang besar membuat halaman berat, terutama
        untuk tamu yang pakai jaringan seluler.

     2. Metadata pribadi bocor
        Foto HP modern menyisipkan EXIF: koordinat GPS, tanggal &
        jam pengambilan, model kamera, nomor seri. Repository ini
        PUBLIK, jadi metadata itu bisa dibaca siapa pun, dan mesin
        pencari bisa ikut mengindeksnya bersama foto.

        Karena itu script ini TIDAK PERNAH memakai withMetadata().

   CARA PAKAI
     Taruh file master di `assets-src/`, lalu:
         npm run optimize

     Master TIDAK ikut di-commit (sudah ada di .gitignore).
     Yang di-commit hanya hasil olahannya di `public/img/`.

   KONVENSI NAMA
     assets-src/Parida.jpeg  ->  public/img/couple-bride-320.webp
                                public/img/couple-bride-480.webp
                                public/img/couple-bride-520.webp
                                public/img/couple-bride.jpg   (fallback)

     srcset halaman disusun dari daftar `widths` di src/config.js.
     Script ini mencetak lebar mana yang berhasil dibuat - salin
     ke `widths` di config.js, lalu jalankan `npm run check:images`
     untuk memastikan daftarnya cocok dengan file yang ada di disk.
   ========================================================= */

import sharp from 'sharp';
import { readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'assets-src');
const OUT_DIR = join(ROOT, 'public', 'img');

/* ---------- Kandidat lebar ----------
   Daftar ini HANYA kandidat. Lebar yang lebih besar dari foto
   sumber akan dilewati, karena memperbesar foto tidak menambah
   detail - hanya menambah bobot dan membuatAlgo terlihat buram.

   Kenapa 320 sebagai yang terkecil? Slot foto di HP sekitar
   224 CSS px, jadi DPR 1 hanya butuh 224. Varian 320 memberi
   sedikit ruang lega tanpa terbebani.

   Kenapa 480 wajib ada? Kebanyakan Android dan iPhone lama punya
   DPR 2, jadi 224 x 2 = 448 px - 480 adalah titik yang pas.
   ------------------------------------------------------------------ */
const WIDTH_CANDIDATES = [320, 480, 768, 1200, 1800];

/* ---------- Pengaturan kualitas ----------
   WebP q76 masih sulit dibedakan dari aslinya pada ukuran tampil
   di atas, dan mendukung alpha (dibutuhkan untuk logo transparent).
   ---------------------------------------------------------------- */
const WEBP = { quality: 76, effort: 6 };
const JPEG = { quality: 78, progressive: true, mozjpeg: true };

/* ---------- Master yang perlu diganti namanya ----------
   Nama file foto klien tidak rapi, sedangkan config.js memakai
   nama semantik. Peta ini satu-satunya tempat pemetaannya, supaya
   tidak ada tebakan.
   ------------------------------------------------------------- */
const RENAME = {
  'Irfani.jpeg': 'couple-groom',
  'Parida.jpeg': 'couple-bride',
};

/* ---------- Foto galeri ----------
   Dua foto pasangan dikenali lewat RENAME di atas. SELURUH file
   lain di assets-src/ diperlakukan sebagai foto galeri.

   Kenapa pakai urutan, bukan angka di nama file? Nama file dari
   kamera sering seperti "DSC_9999.jpg" atau "IMG_2026_0042.jpg" -
   angka di sana bukan nomor urut foto. Mengikutinya akan membuat
   nama seperti gallery-9999, dan nomor bisa bentrok kalau klien
   mengirim foto yang nomornya sama. Jadi nomornya selalu urut 1..N
   dari file yang sudah diurutkan, hasilnya stabil antar-jalankan.
   ------------------------------------------------------------------ */

/* ---------- Utilitas ---------- */

const kb = (n) => `${(n / 1024).toFixed(0).padStart(5)} KB`;

function humanBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${kb(n)}`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/** Buang file hasil lama agar tidak ada varian nyasar tertinggal. */
function cleanOldVariants(outBase) {
  if (!existsSync(OUT_DIR)) return;
  for (const f of readdirSync(OUT_DIR)) {
    const stem = basename(f, extname(f));
    // Hapus hanya milik outBase, mis. couple-bride-480.webp
    if (stem === outBase || stem.startsWith(`${outBase}-`)) {
      unlinkSync(join(OUT_DIR, f));
    }
  }
}

/**
 * Buang varian galeri yang nomornya sudah tidak dipakai.
 *
 * cleanOldVariants() di atas hanya membersihkan nama yang SEDANG
 * diproses. Kalau klien mengganti 6 foto jadi 5, maka gallery-6.*
 * darialyzer sebelumnya tidak ikut terhapus dan tertinggal di
 * public/img. gallery.photos di config.js juga jadi 5, jadi file
 * yatim itu tidak terpakai lagi - dan tidak ada yang tahu
 *.harUS dihapus.
 */
function cleanStaleGallerySlots(keepBases) {
  if (!existsSync(OUT_DIR)) return;
  const keep = new Set(keepBases);
  for (const f of readdirSync(OUT_DIR)) {
    // Hanya varian hasil optimizer (jpg/webp). Placeholder .svg
    // BUKAN hasil proses ini dan tidak boleh ikut terhapus -
    // tanpa placeholder, section galeri tampil dengan ikon gambar
    // rusak saat klien belum mengirim foto.
    if (!/\.(jpe?g|webp)$/i.test(f)) continue;

    const stem = basename(f, extname(f));
    const m = stem.match(/^(gallery-\d+)(-\d+)?$/);
    if (m && !keep.has(m[1])) {
      unlinkSync(join(OUT_DIR, f));
      console.log(`    dibuang (nomor tak terpakai)  ${f}`);
    }
  }
}

/**
 * Proses satu master menjadi beberapa lebar x 2 format.
 * Lebar yang dipakai = kandidat yang <= lebar sumber, ditambah
 * lebar sumber itu sendiri kalau belum termasuk kandidat.
 */
async function processOne(masterPath, outBase) {
  const masterSize = statSync(masterPath).size;

  // rotate() membaca orientasi dari EXIF lalu menerapkan perubahannya.
  // Tanpa ini, foto yang diambil dengan kamera yang dimiringkan ke
  // portrait akan tampil miring 90 derajat.
  const meta = await sharp(masterPath).rotate().metadata();

  // PENTING: jangan pernah memperbesar (upscale). Foto 563px yang
  // distretch jadi 768px tidak jadi lebih tajam - ia hanya lebih
  // besar dan lebih lambat dimuat.
  const widths = WIDTH_CANDIDATES.filter((w) => w < meta.width);
  if (!widths.includes(meta.width)) widths.push(meta.width);
  widths.sort((a, b) => a - b);

  const written = { master: masterSize, webp: {}, jpeg: 0, widths };

  for (const width of widths) {
    const out = join(OUT_DIR, `${outBase}-${width}.webp`);
    await sharp(masterPath)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp(WEBP)
      .toFile(out);
    written.webp[width] = statSync(out).size;
  }

  // Fallback JPEG untuk browser tanpa WebP (sekitar 2017 ke bawah).
  // Pakai lebar sumber penuh: browser ini sudah tua dan koneksi
  // sudah jelas lambat, jadi tidak perlu penghematan di sini.
  const jpgOut = join(OUT_DIR, `${outBase}.jpg`);
  await sharp(masterPath)
    .rotate()
    .jpeg(JPEG)
    .toFile(jpgOut);
  written.jpeg = statSync(jpgOut).size;

  written.dimensions = `${meta.width}x${meta.height}`;
  return written;
}

/* ---------- Jalan utama ---------- */

console.log('\n  OPTIMASI GAMBAR');
console.log('  ' + '='.repeat(62));

if (!existsSync(SRC_DIR)) {
  console.log('\n  Folder master tidak ditemukan: assets-src/');
  console.log('  Buat folder itu dan taruh foto master di dalamnya.\n');
  process.exit(0);
}

if (!existsSync(OUT_DIR)) {
  console.error('\n  [GAGAL] public/img tidak ditemukan.\n');
  process.exit(1);
}

const masters = readdirSync(SRC_DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));

if (!masters.length) {
  console.log('\n  Tidak ada file gambar di assets-src/. Tidak ada yang diproses.');
  console.log('  Taruh foto master (jpg/png) di folder itu, lalu ulangi.\n');
  process.exit(0);
}

let totalMaster = 0;
let totalWebp = 0;
let totalJpeg = 0;
const rows = [];

/* ---------- Penomoran foto galeri ----------
   Dua foto pasangan sudah dipetakan lewat RENAME. Semua file lain
   adalah foto galeri dan diberi nomor urut. RENAME diprioritaskan
   supaya file pasangan tidak ikut/workflow penomoran.
   ------------------------------------------------------------ */
let slot = 0;
const plan = masters.map((file) => {
  const known = RENAME[file];
  if (known) return { file, outBase: known, isGallery: false };
  slot += 1;
  return { file, outBase: `gallery-${slot}`, isGallery: true };
});

const dupe = plan
  .map((p) => p.outBase)
  .filter((b, i, a) => a.indexOf(b) !== i);
if (dupe.length) {
  console.error('\n  [GAGAL] Nama file master bentrok:');
  [...new Set(dupe)].forEach((d) => console.error(`    - ${d}`));
  console.error('  Beri nama unik di file master-nya, lalu ulangi.\n');
  process.exit(1);
}

for (const { file, outBase } of plan) {
  cleanOldVariants(outBase);
  const r = await processOne(join(SRC_DIR, file), outBase);

  totalMaster += r.master;
  for (const w of Object.values(r.webp)) totalWebp += w;
  totalJpeg += r.jpeg;

  rows.push({ file, outBase, ...r });
}

cleanStaleGallerySlots(plan.map((p) => p.outBase));

console.log('');
for (const r of rows) {
  const renamed = RENAME[r.file] ? `  ->  ${r.outBase}` : '';
  console.log(`  ${r.file}${renamed}`);
  console.log(`    master        ${r.dimensions}   ${humanBytes(r.master)}`);

  const parts = r.widths
    .filter((w) => r.webp[w])
    .map((w) => `${w}w=${humanBytes(r.webp[w])}`);
  console.log(`    webp          ${parts.join('  ')}`);
  console.log(`    jpeg fallback ${humanBytes(r.jpeg)}  (${r.dimensions}, tanpa EXIF)`);
  console.log('');

  // Disalin apa adanya ke `widths` di src/config.js.
  // Petunjuknya harus menyebut slot yang benar - dulu semua file
  // disuruh disalin ke couple.groom, termasuk foto galeri.
  const target = r.outBase === 'couple-bride' ? 'couple.bride'
    : r.outBase === 'couple-groom' ? 'couple.groom'
    : `gallery.photos[${/^gallery-(\d+)$/.exec(r.outBase)?.[1] - 1}]`;
  console.log(`    salin ke config.js ->  ${target}.widths`);
  console.log(`      widths: [${r.widths.join(', ')}],`);
  console.log('');
}

console.log('  ' + '='.repeat(62));
console.log(`  Total master            ${humanBytes(totalMaster)}`);
console.log(`  Total varian WebP      ${humanBytes(totalWebp)}  (${rows.length} foto x ${rows[0].widths.length} lebar)`);
console.log(`  Total fallback JPEG    ${humanBytes(totalJpeg)}  (${rows.length} foto, 1 lebar)`);
console.log('');

// Jangan pakai metrik "hemat" Percentage terhadap master. Master
// yang sudah dioptimasi sebelumnya (mis. hasil crop dari klien)
// bisa saja SUDAH kecil, sehingga menyimpan 3 varian WebP malah
// terlihat "lebih besar". Angka itu menyesatkan.
//
// Yang relevan justru: berapa yang benar-benar diunduh satu HP.
const perPhoto = rows.map((r) => {
  const smallest = r.widths.length ? r.webp[r.widths[0]] : 0;
  const largest = r.widths.length ? r.webp[r.widths[r.widths.length - 1]] : 0;
  return { base: r.outBase, smallest, largest, jpeg: r.jpeg, master: r.master };
});
console.log('  Yang benar-benar diunduh satu perangkat:');
for (const p of perPhoto) {
  const jpegSaving = p.master ? ((1 - p.jpeg / p.master) * 100).toFixed(0) : '-';
  console.log(`    ${p.base}`);
  console.log(`      DPR 1-2 (WebP)        ${humanBytes(p.smallest)} - ${humanBytes(p.largest)}`);
  console.log(`      DPR 3 atau fallback   ${humanBytes(p.jpeg)} JPEG  (-${jpegSaving}% vs master)`);
}
console.log('');
console.log('  CATATAN: salin daftar `widths` di atas ke src/config.js,');
console.log('  lalu jalankan  npm run check:images  untuk memverifikasi.');
console.log('');
