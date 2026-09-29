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

/* ---------- gradient yang dipakai bersama ---------- */
const defs = (id) => `
  <defs>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${C.goldLight}"/>
      <stop offset="50%"  stop-color="${C.gold}"/>
      <stop offset="100%" stop-color="${C.goldLight}"/>
    </linearGradient>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%"   stop-color="${C.olive}"/>
      <stop offset="55%"  stop-color="${C.forest}"/>
      <stop offset="100%" stop-color="#2e332b"/>
    </linearGradient>
    <linearGradient id="softGrad" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0%"   stop-color="${C.cream}"/>
      <stop offset="100%" stop-color="${C.sand}"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
      <stop offset="55%"  stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity=".28"/>
    </radialGradient>
  </defs>`;

/* =============================================================
   1. QR PLACEHOLDER (400x400)
   ------------------------------------------------------------
   Galeri, cover, dan story sudah dibatalkan klien, jadi generator
   ini hanya menghasilkan dua aset: QR placeholder dan favicon.
   ============================================================= */
console.log('Membuat placeholder...');

write(IMG, 'qr-placeholder.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="Placeholder QR code">
  ${defs()}
  <rect width="400" height="400" fill="${C.white}"/>
  <g fill="${C.forest}" opacity=".14">
    ${(() => {
      let out = '';
      for (let r = 0; r < 21; r++) {
        for (let c = 0; c < 21; c++) {
          if ((r * 7 + c * 13 + r * c) % 5 < 2) out += `<rect x="${24 + c * 17}" y="${24 + r * 17}" width="13" height="13"/>`;
        }
      }
      return out;
    })()}
  </g>
  <g fill="${C.forest}">
    <rect x="24"  y="24"  width="88" height="88" rx="8"/>
    <rect x="40"  y="40"  width="56" height="56" rx="4" fill="${C.white}"/>
    <rect x="54"  y="54"  width="28" height="28" rx="3"/>
    <rect x="288" y="24"  width="88" height="88" rx="8"/>
    <rect x="304" y="40"  width="56" height="56" rx="4" fill="${C.white}"/>
    <rect x="318" y="54"  width="28" height="28" rx="3"/>
    <rect x="24"  y="288" width="88" height="88" rx="8"/>
    <rect x="40"  y="304" width="56" height="56" rx="4" fill="${C.white}"/>
    <rect x="54"  y="318" width="28" height="28" rx="3"/>
  </g>
  <text x="200" y="418" text-anchor="middle" font-family="${FONT_SANS}" font-size="15"
        letter-spacing="3" fill="${C.olive}">PLACEHOLDER</text>
</svg>`);

/* =============================================================
   2. FAVICON (64x64)
   ------------------------------------------------------------
   Inisial diambil dari config.js supaya otomatis ikut nama
   pasangan yang baru. Kalau lupa diubah, favicon akan masih
   menampilkan inisial pasangan lama - itu sulit terdeteksi
   karena favicon kecil dan jarang dibuka developer.
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
