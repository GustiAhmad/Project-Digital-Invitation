/**
 * tools/make-placeholders.mjs
 * ---------------------------------------------------------------
 * Membuat gambar placeholder SVG untuk preview tahap pengembangan.
 * Dijalankan:  node tools/make-placeholders.mjs
 *
 * File hasil di-commit ke Git (kecil, dan sengaja terlihat
 * unprofessional supaya tidak sempat tertukar dengan file asli).
 * ---------------------------------------------------------------
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../src/config.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = join(ROOT, 'public', 'img');
const ICONS = join(ROOT, 'public', 'icons');

mkdirSync(IMG, { recursive: true });
mkdirSync(ICONS, { recursive: true });

const C = {
  cream: '#f7f3eb',
  sand: '#eee9df',
  olive: '#68745d',
  forest: '#3f453b',
  gold: '#b8964f',
  goldLight: '#d9c193',
  white: '#ffffff',
};

const FONT_SANS = "'Montserrat','Helvetica Neue',Arial,sans-serif";

const write = (dir, name, content) => {
  writeFileSync(join(dir, name), content.trim() + '\n', 'utf8');
  console.log('  +', name);
};

/* =============================================================
   1. GALLERY PLACEHOLDER
   ------------------------------------------------------------
   Hanya dibuat untuk foto yang `src`-nya MASIH .svg (foto asli
   belum ada). KEPUTUSAN KLIEN: satu foto pre-wedding. Begitu
   foto asli dipasang (src .jpg), placeholder tidak dibuat lagi -
   itu tanda galeri sudah final.

   Placeholder sengaja diberi garis putus-putus + label
   "PLACEHOLDER" supaya tidak mungkin tertukar dengan foto asli.
   ============================================================= */

const GALLERY_PLACEHOLDER_W = 400;
const GALLERY_PLACEHOLDER_H = 600; // rasio 2:3, sama dengan .gallery-item

console.log('Membuat placeholder...');

CONFIG.gallery.photos.forEach((photo, i) => {
  // Lewati foto yang sudah punya file asli (bukan .svg).
  if (!/\.svg$/i.test(photo.src)) return;

  const name = `gallery-${i + 1}.svg`;

  write(IMG, name, `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GALLERY_PLACEHOLDER_W} ${GALLERY_PLACEHOLDER_H}"
     width="${GALLERY_PLACEHOLDER_W}" height="${GALLERY_PLACEHOLDER_H}" role="img"
     aria-label="Placeholder foto pre-wedding">
  <rect width="${GALLERY_PLACEHOLDER_W}" height="${GALLERY_PLACEHOLDER_H}" fill="${C.cream}"/>
  <rect x="10" y="10" width="${GALLERY_PLACEHOLDER_W - 20}" height="${GALLERY_PLACEHOLDER_H - 20}"
        fill="none" stroke="${C.gold}" stroke-width="2" stroke-dasharray="10 8" opacity=".55"/>
  <circle cx="200" cy="250" r="46" fill="none" stroke="${C.olive}" stroke-width="2.5" opacity=".35"/>
  <path d="M170 285c0-16 13-29 30-29s30 13 30 29" fill="none" stroke="${C.olive}"
        stroke-width="2.5" stroke-linecap="round" opacity=".35"/>
  <text x="200" y="392" text-anchor="middle" font-family="${FONT_SANS}" font-size="16"
        letter-spacing="3" fill="${C.olive}" opacity=".6">PLACEHOLDER</text>
</svg>`);
});

/* =============================================================
   2. FAVICON (64x64)
   ------------------------------------------------------------
   Inisial diambil dari config.js supaya otomatis ikut nama
   pasangan yang baru. Kalau lupa diubah, favicon akan masih
   menampilkan inisial pasangan lama - itu sulit terdeteksi
   karena favicon kecil dan jarang dibuka developer.

   Catatan: placeholder QR SUDAH DIHAPUS (keputusan klien -
   section "Bagikan Undangan" tidak dipakai lagi).
   ============================================================= */
const INITIALS = `${CONFIG.meta.groom.charAt(0)}${CONFIG.meta.bride.charAt(0)}`.toUpperCase();

write(ICONS, 'favicon.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.olive}"/>
      <stop offset="100%" stop-color="${C.forest}"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.goldLight}"/>
      <stop offset="100%" stop-color="${C.gold}"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  <rect x="6" y="6" width="52" height="52" rx="11" fill="none"
        stroke="url(#goldGrad)" stroke-width="1" opacity=".4"/>
  <text x="32" y="42" text-anchor="middle" font-family="Georgia,serif" font-style="italic"
        font-size="26" fill="url(#goldGrad)" letter-spacing="1">${INITIALS}</text>
  <!-- dua cincin kecil, melambangkan pernikahan -->
  <g fill="none" stroke="${C.goldLight}" stroke-width="1.5" opacity=".85">
    <circle cx="22" cy="17" r="3.2"/>
    <circle cx="42" cy="17" r="3.2"/>
  </g>
</svg>`);

console.log('\nSelesai. Generated di public/img & public/icons.');
