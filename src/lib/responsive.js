/* =========================================================
   src/lib/responsive.js
   ---------------------------------------------------------------
   Menyusun atribut srcset / sizes untuk <img> berdasarkan
   KONVENSI NAMA, bukan daftar URL yang ditulis manual.

   Kenapa tidak menulis srcset langsung di config.js?

    (srcset="a-480.webp 480w, a-960.webp 960w, a-1600.webp 1600w")

   Karena itu daftar yang panjang itu bisa BASI diam-diam: klien
   ganti nama file, atau menambah lebar baru di tools/optimize-images.mjs,
   dan config.js tidak ikut menyesuaikan. srcset pointing to file
   yang tidak ada = browser menjatuhkan fallback dan gambar tampil
   pecah.

   Dengan derive dari nama file, satu-satunya sumber kebenaran
   tetap konvensi:

     assets-src/couple-bride.jpg
       -> public/img/couple-bride-480.webp
       -> public/img/couple-bride-960.webp
       -> public/img/couple-bride-1600.webp
       -> public/img/couple-bride.jpg   (fallback)

   Catatan: file ini khusus aturan responsive; format tanggal
   tetap di src/lib/format.js.
   ========================================================= */

/* Lebar yang dihasilkan tools/optimize-images.mjs.
   Harus sama dengan WIDTHS di sana.

   Kenapa lima lebar, bukan tiga? Karena foto tampil di grid 2 kolom
   (~224 CSS px di HP). Dengan DPR 3, kebutuhan sebenarnya 672 px.
   Kalau lebar yang tersedia [480, 960, 1600], browser harus memilih
   960 dan membayar 116 KB untuk gambar selebar 224 px. Kalau
   [480, 640, 768, 1200, 1800], ia memilih 768 - jauh lebih murah
   dan tetap tajam. */
const WIDTHS = [480, 640, 768, 1200, 1800];

/**
 * Lebar tampilan yang dipakai untuk memilih srcset.
 * Nilai ini menggambarkan KONDISI LAYOUT di CSS, jadi kalau
 * layout berubah, sesuaikan juga di sini.
 */
export const SIZES = {
  // Potret pengantin di grid 2 kolom.
  couple: '(max-width: 700px) 46vw, 300px',
  // Galeri 2-3 kolom.
  gallery: '(max-width: 700px) 46vw, (max-width: 1024px) 30vw, 300px',
  // Tampil besar (lightbox / layar penuh).
  full: '100vw',
};

/**
 * Susun srcset dari path gambar.
 *
 * @param {string} src  contoh: './img/couple-bride.jpg'
 * @returns {string}    contoh: './img/couple-bride-480.webp 480w, ...'
 *                       string kosong kalau src bukan foto raster.
 */
export function buildSrcSet(src) {
  if (!src) return '';
  // Hanya foto raster yang punya varian. SVG (mis. qr-placeholder)
  // tidak perlu srcset karena sudah vektor & kecil.
  if (!/\.(jpe?g|png)$/i.test(src)) return '';

  const base = src.replace(/\.(jpe?g|png)$/i, '');
  return WIDTHS
    .map((w) => `${base}-${w}.webp ${w}w`)
    .join(', ');
}

/**
 * Pasang srcset + sizes + decoding ke sebuah <img>.
 * Aman dipanggil untuk gambar yang tidak punya varian (SVG):
 * hanya mengisi atribut yang tersedia.
 *
 * @param {HTMLImageElement} img
 * @param {string} src
 * @param {'couple'|'gallery'|'full'} sizeKey
 */
export function applyResponsive(img, src, sizeKey = 'gallery') {
  const srcset = buildSrcSet(src);
  if (!srcset) return;

  img.setAttribute('srcset', srcset);
  img.setAttribute('sizes', SIZES[sizeKey] || SIZES.gallery);
  // async decode = browser boleh paint duluan tanpa menunggu decode.
  img.setAttribute('decoding', 'async');
  // fetchpriority hanya relevan untuk gambar besar di atas fold.
  // Foto pengantin & galeri TIDAK di atas fold, jadi tidak dipasang
  // (menghemat kuota dan tidak bersaing dengan elemen LCP).
}
