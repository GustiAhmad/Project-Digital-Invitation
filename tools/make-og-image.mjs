/* =========================================================
   tools/make-og-image.mjs
   ---------------------------------------------------------------
   Membuat public/og-image.png (1200 x 630) untuk preview
   ketika link undangan dibagikan di WhatsApp / Facebook /
   Instagram / Telegram.

   KENAPA HARUS ADA SCRIPT INI
     Gambar OG adalah PNG - teks nama & tanggal ikut "terbakar"
     di dalam file. Jadi kalau klien ganti tanggal, gambarnya
     TIDAK ikut berubah sendiri: WhatsApp akan tetap menampilkan
     tanggal lama sampai file PNG-nya di-generate ulang.

     tools/make-placeholders.mjs tidak menghasilkan gambar ini,
     karena og-image bukan placeholder - dia dipakai sungguhan.
     Karena itu butuh generator tersendiri.

   CARA PAKAI
     node tools/make-og-image.mjs
     npm run placeholders          (juga menjalankan ini)

   CARA KERJA
     1. Baca src/config.js untuk nama & tanggal (JANGAN hardcode,
        supaya tidak bisa berbeda dengan isi halaman).
     2. Susun HTML 1200x630 memakai design token yang sama
        dengan situs.
     3. Screenshot dengan Chrome headless.

   CATATAN
     Butuh Google Chrome. Kalau tidak ditemukan, script memberi
     instruksi dan berhenti - bukan gagal diam-diam.
   ========================================================= */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'og-image.png');
const TMP = join(ROOT, 'public', '.og-temp.html');

/* ---------- 1. Baca data dari config.js ---------- */

const configSrc = readFileSync(join(ROOT, 'src', 'config.js'), 'utf8');

/** Ambil nilai string pertama yang cocok dari config.js. */
function pick(re) {
  const m = configSrc.match(re);
  return m ? m[1].trim() : null;
}

const bride = pick(/bride:\s*\{[^}]*name:\s*'([^']+)'/);
const groom = pick(/groom:\s*\{[^}]*name:\s*'([^']+)'/);
const date = pick(/date:\s*'(\d{4}-\d{2}-\d{2})'/);
const startTime = pick(/startTime:\s*'([^']+)'/);
const city = pick(/city:\s*'([^']+)'/);
const timezone = pick(/timezone:\s*'([^']+)'/);

/* ---------- 2. Format tanggal (WAJIB pakai timezone eksplisit) ---------- */

/**
 * Nama hari dihitung dengan Intl + timezone, bukan Date.parse dari
 * teks "20 November 2026".
 *
 * Alasan: `new Date("November 20, 2026")` dibaca sebagai waktu
 * LOKAL perangkat. Di perangkat WIB hasilnya bergeser jadi
 * "Kamis, 19 November" - inilah bug yang pernah ada. Dengan
 * timezone eksplisit, hasilnya selalu "Jumat, 20 November 2026"
 * apa pun zona waktu perangkat pembuka.
 */
function formatTanggal(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  // Tanggal jatuh tengah hari UTC agar tidak bergeser di timezone
  // negatif maupun positif.
  const probe = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(probe);
}

const tanggalPanjang = formatTanggal(date);

/* Singkatan zona waktu untuk teks di gambar. */
const tzLabel = (timezone || 'Asia/Makassar') === 'Asia/Makassar' ? 'WITA' : timezone;
const jamLabel = startTime ? `${startTime} ${tzLabel}` : '';

/* ---------- 3. Escape XML ---------- */

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* ---------- 4. Susun HTML ---------- */

const nama = `${esc(bride)} &amp; ${esc(groom)}`;

const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Montserrat:wght@300;400;500&family=Parisienne&display=swap" rel="stylesheet">
<style>
  /* Token yang SAMA dengan src/styles/tokens.css, supaya gambar
     OG terasa menyambung dengan situs. */
  :root {
    --cream:  #f7f3eb;
    --sand:   #eee9df;
    --olive:  #68745d;
    --forest: #3f453b;
    --ink:    #4d5147;
    --muted:  #8b8d84;
    --gold:   #b8964f;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    background: var(--cream);
    color: var(--forest);
    font-family: 'Montserrat', sans-serif;
    display: grid;
    place-items: center;
    position: relative;
  }
  /* Bingkai emas tipis, senada dengan section situs */
  body::before {
    content: '';
    position: absolute;
    inset: 26px;
    border: 1px solid var(--gold);
    opacity: .55;
    pointer-events: none;
  }
  .card {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 90px;
    gap: 6px;
  }
  .eyebrow {
    font-size: 15px;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 400;
  }
  .ornament {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 14px 0 6px;
  }
  .ornament span {
    display: block;
    width: 74px;
    height: 1px;
    background: var(--gold);
    opacity: .7;
  }
  .ornament i {
    display: block;
    width: 7px;
    height: 7px;
    border: 1px solid var(--gold);
    transform: rotate(45deg);
  }
  .script {
    font-family: 'Parisienne', cursive;
    font-size: 82px;
    line-height: 1.16;
    color: var(--forest);
  }
  .tanggal {
    font-family: 'Cormorant Garamond', serif;
    font-size: 38px;
    color: var(--ink);
    letter-spacing: 1px;
  }
  .meta {
    font-size: 16px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--olive);
    font-weight: 500;
  }
  .kota {
    margin-top: 18px;
    font-size: 14px;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: var(--muted);
  }
</style>
</head>
<body>
  <main class="card">
    <p class="eyebrow">The Wedding</p>
    <div class="ornament"><span></span><i></i><span></span></div>
    <h1 class="script">${nama}</h1>
    <p class="tanggal">${esc(tanggalPanjang)}</p>
    <p class="meta">${esc(jamLabel)}</p>
    <p class="kota">${esc(city)}</p>
  </main>
</body>
</html>`;

/* ---------- 5. Cari Chrome ---------- */

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

const chrome = CHROME_CANDIDATES.find((p) => p && existsSync(p));

if (!chrome) {
  console.error('\n  [GAGAL] Google Chrome tidak ditemukan.');
  console.error('  Script ini memakai Chrome headless untuk merender gambar.');
  console.error('  Pasang Chrome, atau delete public/og-image.png lalu');
  console.error('  ganti dengan gambar buatan desainer (1200 x 630, PNG).\n');
  process.exit(1);
}

/* ---------- 6. Render ---------- */

writeFileSync(TMP, html, 'utf8');

const profile = join(ROOT, 'node_modules', '.cache', 'og-profile');

try {
  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--user-data-dir=${profile}`,
    '--force-device-scale-factor=1',
    '--window-size=1200,630',
    // Beri jeda agar Google Fonts sempat selesai diunduh.
    '--virtual-time-budget=12000',
    `--screenshot=${OUT}`,
    `file:///${TMP.replace(/\\/g, '/')}`,
  ], { stdio: 'ignore', timeout: 90_000 });
} catch (err) {
  console.error('\n  [GAGAL] Chrome gagal merender:', err.message, '\n');
  process.exitCode = 1;
} finally {
  if (existsSync(TMP)) unlinkSync(TMP);
}

/* ---------- 7. Verifikasi ---------- */

if (existsSync(OUT)) {
  const size = (readFileSync(OUT).length / 1024).toFixed(0);
  console.log(`  + og-image.png (1200x630, ${size} KB)`);
  console.log(`      ${bride} & ${groom} - ${tanggalPanjang} - ${jamLabel} - ${city}`);
  if (/Kamis/.test(tanggalPanjang)) {
    console.warn('      [PERINGATAN] Nama hari "Kamis" - periksa format tanggal.');
  }
} else {
  console.error('  [GAGAL] public/og-image.png tidak terbentuk.');
  process.exitCode = 1;
}
