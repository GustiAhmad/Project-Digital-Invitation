/* =========================================================
   src/main.js
   ---------------------------------------------------------------
   Entry point. Hanya merakit modul - tidak ada logika bisnis
   di file ini.

   ========================================================= */

import './styles/main.css';

import { renderAll } from './lib/render.js';
import { initCountdown } from './modules/countdown.js';
import { initMusic } from './modules/music.js';
import { initClipboard } from './modules/clipboard.js';
import { initWishes } from './modules/wishes.js';
import { initRsvp } from './modules/rsvp.js';
import { initShare, initCharCount, initUnsavedGuard } from './modules/share.js';

function boot() {
  // 1. Isi konten dari config.js
  renderAll();

  // 2. Pasang fitur interaktif
  initCountdown();
  initMusic();
  initClipboard();
  initWishes();
  initRsvp();
  initShare();
  initCharCount();
  initUnsavedGuard();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
