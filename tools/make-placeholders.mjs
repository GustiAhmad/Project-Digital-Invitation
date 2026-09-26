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
  ink: '#4d5147',
  gold: '#b8964f',
  goldLight: '#d9c193',
  white: '#ffffff',
};

const FONT_SANS = "'Montserrat','Helvetica Neue',Arial,sans-serif";
const FONT_SERIF = "'Cormorant Garamond',Georgia,serif";
const FONT_SCRIPT = "'Parisienne','Brush Script MT',cursive";

const write = (dir, name, content) => {
  writeFileSync(join(dir, name), content.trim() + '\n', 'utf8');
  console.log('  +', name);
};

/* ---------- ornamen bingkai emas ---------- */
const goldFrame = (w, h, inset, r = 8) => `
  <rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}"
        rx="${r}" fill="none" stroke="url(#goldGrad)" stroke-width="2"/>
  <rect x="${inset + 8}" y="${inset + 8}" width="${w - (inset + 8) * 2}" height="${h - (inset + 8) * 2}"
        rx="${r - 2}" fill="none" stroke="url(#goldGrad)" stroke-width="1" opacity=".45"/>`;

const cornerOrnament = (x, y, s = 34, flipX = 1, flipY = 1) => `
  <g transform="translate(${x},${y}) scale(${flipX},${flipY})" opacity=".75">
    <path d="M0 0 C 0 ${s * 0.5} ${s * 0.5} ${s} ${s} ${s}"
          fill="none" stroke="url(#goldGrad)" stroke-width="1.6"/>
    <path d="M0 ${s * 0.35} C ${s * 0.3} ${s * 0.4} ${s * 0.4} ${s * 0.3} ${s * 0.45} 0"
          fill="none" stroke="url(#goldGrad)" stroke-width="1.2" opacity=".8"/>
    <circle cx="0" cy="0" r="2.6" fill="url(#goldGrad)"/>
  </g>`;

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
   1. COVER PLACEHOLDER (1920x1080 landscape)
   ============================================================= */
console.log('Membuat placeholder...');

write(IMG, 'cover-placeholder.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" role="img" aria-label="Placeholder foto cover undangan">
  ${defs()}
  <rect width="1920" height="1080" fill="url(#bgGrad)"/>
  <rect width="1920" height="1080" fill="url(#vignette)"/>

  ${goldFrame(1920, 1080, 54, 6)}
  ${cornerOrnament(70, 70)}
  ${cornerOrnament(1850, 70, 34, -1, 1)}
  ${cornerOrnament(70, 1010, 34, 1, -1)}
  ${cornerOrnament(1850, 1010, 34, -1, -1)}

  <g text-anchor="middle">
    <text x="960" y="432" font-family="${FONT_SANS}" font-size="20" letter-spacing="11"
          fill="${C.goldLight}" opacity=".9">PLACEHOLDER</text>
    <line x1="790" y1="466" x2="1130" y2="466" stroke="url(#goldGrad)" stroke-width="1.5"/>
    <text x="960" y="576" font-family="${FONT_SCRIPT}" font-size="128" fill="${C.cream}">Foto Cover</text>
    <text x="960" y="642" font-family="${FONT_SERIF}" font-style="italic" font-size="40"
          fill="${C.goldLight}">Ganti dengan foto landscape pasangan</text>
    <text x="960" y="700" font-family="${FONT_SANS}" font-size="22" letter-spacing="3"
          fill="${C.sand}" opacity=".72">1920 &#215; 1080 px &#183; minimal 1600 px &#183; format JPG</text>
  </g>
</svg>`);

/* =============================================================
   2. GALLERY PLACEHOLDERS (1200x1500, 4:5)
   ============================================================= */
const galleryPalettes = [
  ['#e8e2d6', '#d9cfbb', C.olive],
  ['#dfd8c9', '#cbbf9f', C.forest],
  ['#eae6dd', '#d6cbb6', C.gold],
  ['#e2ddd1', '#c4bba6', C.olive],
  ['#eceadf', '#d3c9b1', C.forest],
  ['#e6e1d5', '#cbc0aa', C.olive],
];

for (let i = 0; i < galleryPalettes.length; i++) {
  const n = i + 1;
  const [c1, c2, accent] = galleryPalettes[i];

  write(IMG, `gallery-${n}.svg`, `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500" role="img" aria-label="Placeholder foto galeri ${n}">
  ${defs()}
  <linearGradient id="g${n}" x1="0" y1="0" x2="0.5" y2="1">
    <stop offset="0%"   stop-color="${c1}"/>
    <stop offset="100%" stop-color="${c2}"/>
  </linearGradient>

  <rect width="1200" height="1500" fill="url(#g${n})"/>

  <!-- siluet daun sebagai ornamen -->
  <g opacity=".16" fill="${accent}">
    <path d="M120 1320 C 40 1180 90 1020 250 960 C 300 1090 250 1240 120 1320 Z"/>
    <path d="M1080 200 C 1160 340 1110 500 950 560 C 900 430 950 280 1080 200 Z"/>
  </g>

  ${goldFrame(1200, 1500, 44, 6)}
  ${cornerOrnament(62, 62, 30)}
  ${cornerOrnament(1138, 62, 30, -1, 1)}
  ${cornerOrnament(62, 1438, 30, 1, -1)}
  ${cornerOrnament(1138, 1438, 30, -1, -1)}

  <g text-anchor="middle">
    <circle cx="600" cy="672" r="86" fill="none" stroke="url(#goldGrad)" stroke-width="2"/>
    <circle cx="600" cy="672" r="66" fill="none" stroke="url(#goldGrad)" stroke-width="1" opacity=".5"/>
    <text x="600" y="706" font-family="${FONT_SERIF}" font-size="86" font-style="italic"
          fill="${accent}" opacity=".85">${n}</text>

    <text x="600" y="852" font-family="${FONT_SANS}" font-size="19" letter-spacing="9"
          fill="${accent}" opacity=".85">GALERI ${n}</text>
    <line x1="480" y1="886" x2="720" y2="886" stroke="url(#goldGrad)" stroke-width="1.4"/>
    <text x="600" y="946" font-family="${FONT_SANS}" font-size="19" letter-spacing="2.5"
          fill="${accent}" opacity=".7">Foto Pre-Wedding &#8212; Placeholder</text>
    <text x="600" y="986" font-family="${FONT_SANS}" font-size="16" letter-spacing="2"
          fill="${accent}" opacity=".55">1200 &#215; 1500 px &#183; minimal 1200 px</text>
  </g>
</svg>`);
}

/* =============================================================
   3. QR PLACEHOLDER (400x400)
   ============================================================= */
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
   4. FAVICON (64x64)
   ============================================================= */
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
  <text x="32" y="30" text-anchor="middle" font-family="Georgia,serif" font-style="italic"
        font-size="26" fill="url(#goldGrad)">U</text>
  <text x="32" y="50" text-anchor="middle" font-family="Georgia,serif" font-style="italic"
        font-size="26" fill="url(#goldGrad)">M</text>
  <circle cx="20" cy="21" r="2.4" fill="${C.goldLight}"/>
  <circle cx="44" cy="21" r="2.4" fill="${C.goldLight}"/>
</svg>`);

console.log('\nSelesai. Generated di public/img & public/icons.');
