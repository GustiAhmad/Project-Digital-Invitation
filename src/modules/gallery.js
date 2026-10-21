/* =========================================================
   src/modules/gallery.js
   ---------------------------------------------------------------
   Melengkapi galeri pre-wedding dari config.js.

   TUJUANNYA HANYA SATU: pasang srcset + ukuran asli pada tiap <img>
   galeri, dengan data yang sama persis dengan src/lib/render.js.

   Kenapa tidak langsung di render.js?
     render.js sudah menangani struktur, modul ini yang menangani
     responsive image. Dua hal itu dipisah agar tidak bercampur.
   ========================================================= */

import { $$ } from '../lib/dom.js';
import { CONFIG } from '../config.js';

/**
 * Pasang srcset + width pada tiap gambar galeri.
 *
 * `src` dan index-nya sudah dipasang renderGallery(); modul ini
 * menyelesaikannya dengan varian WebP dan dimensi.
 *
 * Kalau `widths` kosong (foto asli belum ada), gambar dibiarkan
 * memakai `src` saja tanpa srcset. Tidak ada yang error.
 */
export function initGallery() {
  const imgs = $$('[data-render="gallery"] .gallery-item img');
  if (!imgs.length) return;

  const photos = CONFIG.gallery?.photos || [];

  imgs.forEach((img) => {
    const photo = photos[Number(img.dataset.galleryIndex)];
    if (!photo) return;

    const widths = Array.isArray(photo.widths) ? photo.widths : [];
    if (!widths.length) return; // belum ada varian WebP

    // srcset dibangun dari lebar yang benar-benar ada di disk.
    // tools/check-images.mjs memverifikasi daftar widths di config
    // cocok dengan file di public/img, jadi width yang salah akan
    // menggagalkan `npm run check`, bukan diam-diam 404 di browser.
    const base = photo.src.replace(/\.(jpe?g|png)$/i, '');
    img.setAttribute('srcset', widths.map((w) => `${base}-${w}.webp ${w}w`).join(', '));

    // Lebar intrinsik = varian terbesar yang tersedia. Dipakai supaya
    // browser bisa menghitung rasio aspek sebelum gambar selesai
    // diunduh, mencegah halaman "bergoyang" (CLS).
    img.setAttribute('width', String(Math.max(...widths)));
  });
}
