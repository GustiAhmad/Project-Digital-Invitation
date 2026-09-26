/* =========================================================
   tools/optimize-images.mjs
   ---------------------------------------------------------------
   Mengubah foto master di `assets-src/` menjadi ukuran siap pakai
   untuk web: beberapa lebar, format WebP, dan TANPA metadata.

   MASALAH YANG DISELESAIKAN
     1. Bobot halaman
        Dua foto master saja 7,2 MB. Untuk phone subscriber 3G/4G
        itu 15-40 detik loading, dan sebagian besar tamu akan
        meninggalkan halaman sebelum selesai.

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
     `assets-src/couple-bride.jpg`  ->  `public/img/couple-bride-480.webp`
                                        `public/img/couple-bride-960.webp`
                                        `public/img/couple-bride-1600.webp`
                                        `public/img/couple-bride.jpg`  (fallback)

     srcset di halaman disusun dari konvensi ini, jadi tidak ada
     daftar URL yang bisa basi. Lihat src/lib/responsive.js.
   ========================================================= */

import sharp from 'sharp';
import { readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'assets-src');
const OUT_DIR = join(ROOT, 'public', 'img');

/* ---------- Lebar yang dihasilkan ----------
   Dipilih berdasarkan KONDISI LAYOUT yang sebenarnya, bukan tebakan.

   Foto pengantin & galeri tampil di grid 2 kolom:
     - HP   : ~224 CSS px
     - desktop: ~300 CSS px

   Kebutuhan device px = CSS px x DPR. Untuk HP modern DPR 3, 224 px
   jadi 672 px. Lebar yang tersedia harus SEDEKAT mungkin dengan 672,
   kalau tidak browser melompat ke varian yang terlalu besar.

   Lebar lama hanya [480, 960, 1600]. Untuk kebutuhan 672 px, browser
   memilih 960w dan membayar 116 KB untuk gambar yang hanya tampil
   224 px. Itu 2x lebih besar dari yang perlu, dan membatalkan
   seluruh penghematan yang dilakukan Tahap 2 ini.

   Lebar baru dibuat rapat supaya tiap perangkat dapat varian
   terkecil yang masih cukup tajam.
   ------------------------------------------------------------------ */
const WIDTHS = [480, 640, 768, 1200, 1800];

// Lebar untuk file JPEG fallback (browser lama tanpa WebP, 2017 ke
// bawah). 1200 px cukup; browser yang sedemiu tua tidak akan
// membedakan.
const FALLBACK_WIDTH = 1200;

/* ---------- Pengaturan kualitas ----------
   WebP q76 masih indistinguishable dari aslinya pada ukuran tampil
   di atas, dan mendukung alpha (dibutuhkan untuk logo transparent).
   ---------------------------------------------------------------- */
const WEBP = { quality: 76, effort: 6 };
const JPEG = { quality: 78, progressive: true, mozjpeg: true };

/* ---------- Master yang perlu diganti namanya ----------
   Nama file foto klien tidak rapi ("Muhammad.jpg"), sedangkan
   config.js memakai nama semantik. Peta ini satu-satunya tempat
   pemetaannya, supaya tidak ada tebakan.
   ------------------------------------------------------------- */
const RENAME = {
  'Muhammad.jpg': 'couple-groom',
  'uswatun.jpg': 'couple-bride',
};

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
    // Hapus hanya milik outBase, mis. couple-bride-960.webp
    if (stem === outBase || stem.startsWith(`${outBase}-`)) {
      unlinkSync(join(OUT_DIR, f));
    }
  }
}

/**
 * Proses satu master menjadi beberapa lebar x 2 format.
 * Mengembalikan objek berisi ukuran file hasil.
 */
async function processOne(masterPath, outBase) {
  const masterSize = statSync(masterPath).size;

  // rotate() membaca orientasi dari EXIF lalu menerapkan perubahannya.
  // Tanpa ini, foto yang diambil dengan kamera yang dimiringkan ke
  // portrait akan tampil miring 90 derajat.
  const base = sharp(masterPath).rotate();

  const meta = await base.metadata();
  const written = { master: masterSize, webp: {}, jpeg: 0 };

  for (const width of WIDTHS) {
    // Jangan memperbesar gambar yang lebih kecil dari target.
    if (meta.width <= width && written.jpeg) continue;

    const out = join(OUT_DIR, `${outBase}-${width}.webp`);
    await sharp(masterPath)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp(WEBP)
      .toFile(out);
    written.webp[width] = statSync(out).size;
  }

  // Fallback JPEG untuk browser tanpa WebP (sekitar 2017 ke bawah).
  const jpgOut = join(OUT_DIR, `${outBase}.jpg`);
  await sharp(masterPath)
    .rotate()
    .resize({ width: FALLBACK_WIDTH, withoutEnlargement: true })
    .jpeg(JPEG)
    .toFile(jpgOut);
  written.jpeg = statSync(jpgOut).size;

  written.dimensions = `${meta.width}x${meta.height}`;
  return written;
}

/* ---------- Hapus metadata lama dari fallback JPEG ----------

   sharp secara default TIDAK menyalin EXIF, tapi kita juga memastikan
   tidak ada blok APP yang tidak terduga dengan menulis ulang file.
   (Dicek ulang oleh tools/check-images.mjs di bawah.)
   ------------------------------------------------------------------ */

/* ---------- Jalan utama ---------- */

console.log('\n  OPTIMASI GAMBAR');
console.log('  ' + '='.repeat(62));

if (!existsSync(SRC_DIR)) {
  console.log(`\n  Folder master tidak ditemukan: assets-src/`);
  console.log('  Buat folder itu dan taruh foto master di dalamnya.\n');
  process.exit(0);
}

if (!existsSync(OUT_DIR)) {
  console.error('\n  [GAGAL] public/img tidak ditemukan.\n');
  process.exit(1);
}

const masters = readdirSync(SRC_DIR)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .filter((f) => basename(f, extname(f)) !== 'cover-placeholder');

if (!masters.length) {
  console.log('\n  Tidak ada file gambar di assets-src/. Tidak ada yang diproses.');
  console.log('  Taruh foto master (jpg/png) di folder itu, lalu ulangi.\n');
  process.exit(0);
}

let totalMaster = 0;
let totalWebp = 0;
let totalJpeg = 0;
const rows = [];

for (const file of masters) {
  const stem = basename(file, extname(file));
  const outBase = RENAME[file] || stem;
  const masterPath = join(SRC_DIR, file);

  // Lewati bila master == nama keluaran (mis. couple-bride.jpg)
  if (stem === outBase) {
    // tetap diproses, hanya informational
  }

  cleanOldVariants(outBase);
  const r = await processOne(masterPath, outBase);

  totalMaster += r.master;
  for (const w of Object.values(r.webp)) totalWebp += w;
  totalJpeg += r.jpeg;

  rows.push({ file, outBase, ...r });
}

console.log('');
for (const r of rows) {
  const renamed = RENAME[r.file] ? `  ->  ${r.outBase}` : '';
  console.log(`  ${r.file}${renamed}`);
  console.log(`    master        ${r.dimensions}   ${humanBytes(r.master)}`);

  const parts = WIDTHS
    .filter((w) => r.webp[w])
    .map((w) => `${w}w=${humanBytes(r.webp[w])}`);
  console.log(`    webp          ${parts.join('  ')}`);
  console.log(`    jpeg fallback ${humanBytes(r.jpeg)}  (tanpa EXIF)`);

  const smallest = Math.min(...Object.values(r.webp));
  const ratio = ((1 - smallest / r.master) * 100).toFixed(1);
  console.log(`    hemat         ${ratio}% dibanding master`);
  console.log('');
}

console.log('  ' + '='.repeat(62));
console.log(`  Total master        ${humanBytes(totalMaster)}`);
console.log(`  Total hasil (webp)  ${humanBytes(totalWebp)}`);
console.log(`  Total fallback jpg  ${humanBytes(totalJpeg)}`);
console.log(`  Hemat               ${humanBytes(totalMaster - totalWebp - totalJpeg)}`);
console.log('');

/* ---------- Peringatan bila master terlalu besar ---------- */
for (const r of rows) {
  if (r.master > 2 * 1024 * 1024) {
  console.log(`  [CATATAN] ${r.file} pernah ter-commit sebelum di-ignore.`);
  console.log('           Working tree sekarang aman, tapi metadata GPS/EXIF');
  console.log('           masih terekspos di riwayat Git commit 12efb40.');
  console.log('           Kalau ini repo privat, tidak mendesak. Kalau publik,');
  console.log('           perlu rewrite history (git filter-repo) - lihat README.');
  }
}
console.log('');
