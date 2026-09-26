import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base = folder build bisa ditaruh di SUBDIRECTORY mana pun
  // (root domain, GitHub Pages /nama-repo/, Netlify subpath) tanpa edit lagi.
  // Kalau nanti deploy ke GitHub Pages dan repo tidak bernama "username.github.io",
  // ganti baris ini jadi:  base: '/nama-repo/',
  base: './',

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
});
