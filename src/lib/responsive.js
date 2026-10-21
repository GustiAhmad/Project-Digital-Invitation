/* =========================================================
   src/lib/responsive.js
   ---------------------------------------------------------------
   Menyusun `srcset` + `sizes` untuk gambar foto.

   Kenapa perlu srcset? Tanpa itu, satu <img> hanya punya satu `src`.
   Di HP dengan layar tajam, foto yang tampil 224 px tetap diunduh
   pada lebar penuh - jadi pengguna membayar 4-9x lebih besar dari
   yang benar-benar dilihat.

   Dari mana daftar lebarnya?
     Dari `widths` di src/config.js, yang diisi `npm run optimize`.
     Script ini TIDAK punya daftar lebar sendiri. Kalau iya, kita
     akan punya dua daftar yang bisa diam-diam berbeda - dan galat
     seperti itu baru ketahuan saat satu foto gagal tampil.

   ========================================================= */

/**
 * Lebar tampilan yang dipakai untuk memilih srcset.
 * Nilai ini menggambarkan KONDISI LAYOUT di CSS, jadi kalau
 * layout berubah, sesuaikan juga di sini.
 */
export const SIZES = {
  // Potret pengantin di grid 2 kolom.
  couple: '(max-width: 700px) 46vw, 300px',
  // Tampil besar (lightbox / layar penuh).
  full: '100vw',
};

/**
 * Susun srcset dari path gambar + daftar lebar.
 *
 * @param {string} src  contoh: './img/couple-bride.jpg'
 * @param {number[]} widths  contoh: [320, 480, 520]
 * @returns {string}    contoh: './img/couple-bride-320.webp 320w, ...'
 *                       string kosong kalau src bukan foto raster
 *                       atau daftar lebarnya kosong.
 */
export function buildSrcSet(src, widths = []) {
  if (!isRaster(src) || !Array.isArray(widths) || !widths.length) return '';

  const stem = src.replace(/\.[^.]+$/, '');
  return widths
    .map((w) => `${stem}-${w}.webp ${w}w`)
    .join(', ');
}

function isRaster(src) {
  return typeof src === 'string' && /\.(jpe?g|png|webp)$/i.test(src);
}

/**
 * Pasang srcset + sizes + decoding ke sebuah <img>.
 * Aman dipanggil untuk gambar yang tidak punya varian (SVG):
 * hanya mengisi atribut yang tersedia.
 *
 * @param {HTMLImageElement} img
 * @param {string} src
 * @param {'couple'|'full'} sizeKey
 * @param {number[]} widths
 */
export function applyResponsive(img, src, sizeKey = 'couple', widths = []) {
  const srcset = buildSrcSet(src, widths);
  if (srcset) {
    img.setAttribute('srcset', srcset);
    img.setAttribute('sizes', SIZES[sizeKey] || SIZES.couple);
  }

  // async decode = browser boleh paint duluan tanpa menunggu decode.
  // Ini menghemat overhead untuk gambar yang di bawah fold.
  img.setAttribute('decoding', 'async');
}
