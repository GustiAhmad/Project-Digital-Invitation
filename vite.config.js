import { defineConfig, loadEnv } from 'vite';

/* =========================================================
   Plugin: ganti %SITE_URL% di index.html dengan URL absolut.

   Kenapa perlu:
     og:image untuk preview WhatsApp/Facebook WAJIB absolut.
     Kalau relatif ("./og-image.png"), crawler mengabaikannya dan
     link tampil tanpa gambar.

   Nilainya dari env VITE_SITE_URL (diisi di Vercel). Kalau kosong
   (dev lokal), pakai fallback domain produksi supaya build tetap
   menghasilkan meta yang valid.
   ========================================================= */
const FALLBACK_SITE_URL = 'https://undangan-irfani-parida.vercel.app';

function normalizeSiteUrl(raw) {
  const v = String(raw || '').trim();
  if (!v) return FALLBACK_SITE_URL;
  // Terima "domain.com" maupun "https://domain.com" -> selalu absolut.
  return /^https?:\/\//i.test(v) ? v.replace(/\/+$/, '') : `https://${v.replace(/\/+$/, '')}`;
}

function siteUrlPlugin(env) {
  const siteUrl = normalizeSiteUrl(env.VITE_SITE_URL);

  return {
    name: 'inject-site-url',
    // Crawler tidak menjalankan JS, jadi penggantian HARUS di tahap
    // transform HTML (bukan runtime).
    transformIndexHtml(html) {
      return html.replaceAll('%SITE_URL%', siteUrl);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Relative base = folder build bisa ditaruh di SUBDIRECTORY mana pun
    // (root domain, GitHub Pages /nama-repo/, Netlify subpath) tanpa edit lagi.
    // Kalau nanti deploy ke GitHub Pages dan repo tidak bernama "username.github.io",
    // ganti baris ini jadi:  base: '/nama-repo/',
    base: './',

    plugins: [siteUrlPlugin(env)],

    server: {
      // true = dev server bisa diakses dari HP lain di WiFi yang sama.
      // Ini dipakai untuk preview di perangkat asli.
      host: true,
      port: 5173,
      strictPort: false,
    },

    preview: {
      host: true,
      port: 4173,
      strictPort: false,
    },

    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      cssCodeSplit: false,
      reportCompressedSize: true,
      // Inlinekan aset kecil (<4KB) langsung ke HTML/CSS.
      // Potongan SVG placeholder kita ukurannya pas di ambang ini.
      assetsInlineLimit: 4096,
      // Catatan: pemecahan chunk vendor (swiper/photoswipe) akan
      // dikonfigurasi di Tahap 4, setelah dependency-nya benar-benar ada.
      // Vite 8 (Rolldown) menuntut bentuk FUNGSI, bukan object.
    },
  };
});
