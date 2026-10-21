/* =========================================================
   tools/check-images.mjs
   ---------------------------------------------------------------
   Memastikan hasil optimize-images.mjs tetap konsisten:

     1. Tidak ada metadata pribadi yang bocor (EXIF / GPS / XMP)
     2. Setiap srcset di HTML menunjuk file yang BENAR-BENAR ada
     3. Dimensi,width/height, di HTML cocok dengan file asli,
        supaya browser tidak "bergeser" saat gambar selesai dimuat

   Yang paling penting adalah (2). srcset yang menunjuk file
   hilang tidak menghasilkan error di console - browser diam-diam
   menjatuhkan aturan itu. Akibatnya smartphone yang seharusnya
   dapat 480w malah terkunci di 960w, atau gambar tidak muncul
   sama sekali.
   ========================================================= */

import sharp from 'sharp';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

const checks = [];
const add = (name, ok, detail) => checks.push({ name, ok, detail });

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

/* ---------- 1. Metadata ---------- */

const imgDir = join(ROOT, 'public', 'img');
const files = existsSync(imgDir)
  ? readdirSync(imgDir).filter((f) => /\.(jpe?g|webp|png)$/i.test(f))
  : [];

let dirty = [];
for (const f of files) {
  const p = join(imgDir, f);
  const raw = readFileSync(p);
  const meta = await sharp(p).metadata();

  // Sumber kebenaran: metadata di level container. sharp membacanya
  // dari chunk EXIF/XMP/ICC yang memang punya struktur, jadi tidak
  // bisa salah tebak.
  const reasons = [];
  if ((meta.exif?.length || 0) > 0) reasons.push(`EXIF ${meta.exif.length}B`);
  if (meta.xmp) reasons.push(`XMP ${meta.xmp.length}B`);

  // Pemeriksaan byte mentah HANYA untuk JPEG, dan hanya untuk tanda
  // tangan APP1 yang eksak ("Exif\0\0").
  //
  // Kenapa tidak boleh pakai pencarian substring bebas seperti
  // raw.includes('GPS')? Karena data terkompres WebP is acak.
  // Peluang byte acak membentuk huruf "GPS" dalam 280.000 byte
  // sekitar 1,7% - jadi pemeriksa akan menuduh gambar yang bersih
  // ikut "menyimpan GPS". Itu FALSE POSITIVE, dan lebih buruk
  // daripada tidak memeriksa sama sekali.
  if (/\.jpe?g$/i.test(f)) {
    const sig = Buffer.from([0x45, 0x78, 0x69, 0x66, 0x00, 0x00]); // "Exif\0\0"
    if (raw.includes(sig)) reasons.push('APP1 EXIF');

    // Tag GPS IFD (0x8825) baru berarti sesuatu kalau berada di
    // dalam blok TIFF yang keberadaannya sudah dipastikan.
    if (reasons.length && raw.includes(Buffer.from([0x88, 0x25]))) {
      reasons.push('GPS IFD 0x8825');
    }
  }

  if (reasons.length) dirty.push(`${f} (${reasons.join(', ')})`);
}

if (!files.length) {
  add('Gambar hasil optimasi', false, 'public/img kosong - jalankan npm run optimize');
} else if (dirty.length) {
  add('Metadata pribadi terhapus', false,
    `Masih ada EXIF/GPS di: ${dirty.join(', ')}. `
    + 'Jalankan ulang npm run optimize.');
} else {
  add('Metadata pribadi terhapus', true,
    `${files.length} file, 0 EXIF/GPS`);
}

/* ---------- 2. srcset menunjuk file yang ada ---------- */

// srcset="a-480.webp 480w, a-768.webp 768w, a-1800.webp 1800w"
const srcsetRefs = [...html.matchAll(/srcset="([^"]+)"/g)]
  .flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0]))
  .filter(Boolean);

const missingRefs = [...new Set(srcsetRefs)]
  .filter((ref) => !existsSync(join(ROOT, 'public', ref.replace(/^\.\//, ''))));

if (!srcsetRefs.length) {
  add('srcset di HTML', false, 'Tidak ada srcset sama sekali di index.html');
} else if (missingRefs.length) {
  add('Semua file srcset ada', false,
    `Tidak ditemukan: ${missingRefs.join(', ')}. `
    + 'Jalankan npm run optimize.');
} else {
  add('Semua file srcset ada', true,
    `${new Set(srcsetRefs).size} file, semua ada`);
}

/* ---------- 3. Dimensi HTML cocok dengan file asli ---------- */

// <img src="couple-groom.jpg" ... width="1200" height="1594">
const imgTags = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
const dimProblems = [];

for (const tag of imgTags) {
  const src = (tag.match(/\ssrc="([^"]+)"/) || [])[1];
  const w = (tag.match(/\swidth="(\d+)"/) || [])[1];
  const h = (tag.match(/\sheight="(\d+)"/) || [])[1];
  if (!src || !w || !h) continue;

  // Hanya periksa raster yang benar-benar ada di disk.
  const p = join(ROOT, 'public', src.replace(/^\.\//, ''));
  if (!existsSync(p) || !/\.(jpe?g|png|webp)$/i.test(src)) continue;

  const meta = await sharp(p).metadata();
  // Toleransi 1px untuk pembulatan rasio.
  if (Math.abs(meta.width - Number(w)) > 1 || Math.abs(meta.height - Number(h)) > 1) {
    dimProblems.push(`${src}: HTML ${w}x${h} vs file ${meta.width}x${meta.height}`);
  }
}

if (dimProblems.length) {
  add('width/height HTML akurat', false, dimProblems.join(' | '));
} else {
  const sized = imgTags.filter((t) => /\swidth="\d+"/.test(t)).length;
  add('width/height HTML akurat', true, `${sized} gambar, semua cocok`);
}

/* ---------- 4. Berat total ---------- */

const total = files.reduce((sum, f) => sum + statSync(join(imgDir, f)).size, 0);
console.log(`\n  Berat public/img : ${kb(total)} (${files.length} file)\n`);

/* ---------- Laporan ---------- */

const failed = checks.filter((c) => !c.ok);

console.log('  PEMERIKSAAN GAMBAR');
console.log('  ' + '='.repeat(58));
for (const c of checks) {
  console.log(`${c.ok ? '  OK  ' : ' GAGAL'}  ${c.name}`);
  if (!c.ok) console.log(`        -> ${c.detail}`);
}
console.log('  ' + '='.repeat(58));
console.log(`  ${checks.length - failed.length} lolos, ${failed.length} gagal\n`);

if (failed.length) {
  console.error('  ASET GAMBAR BERMASALAH. Jalankan: npm run optimize\n');
  process.exit(1);
}
