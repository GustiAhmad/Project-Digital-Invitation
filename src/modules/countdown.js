/* =========================================================
   src/modules/countdown.js
   ========================================================= */

import { $ } from '../lib/dom.js';
import { eventStartISO, PRIMARY_EVENT } from '../config.js';

const MS = { second: 1000, minute: 60000, hour: 3600000, day: 86400000 };
/* Durasi acara tetap berjalan setelah mulai (untuk status "sedang berlangsung") */
const CELEBRATION_WINDOW = 4 * MS.hour;

export function initCountdown() {
  const box = $('#countdown');
  if (!box) return;

  const note = $('#countdownNote');
  const target = new Date(eventStartISO(PRIMARY_EVENT)).getTime();

  const cells = {
    days: $('#days'),
    hours: $('#hours'),
    minutes: $('#minutes'),
    seconds: $('#seconds'),
  };

  let timer = null;

  const pad = (n) => String(n).padStart(2, '0');

  function stop() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    timer = setInterval(render, 1000);
  }

  function render() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      // Selesai / sedang berlangsung: jangan biarkan angka terus
      // berputar 00. Tampilkan status yang jelas lalu hentikan timer.
      Object.values(cells).forEach((c) => { c.textContent = '00'; });
      stop();

      if (note) {
        note.textContent = (now - target) < CELEBRATION_WINDOW
          ? 'Hari-H sudah tiba!'
          : 'Acara telah berlalu. Terima kasih!';
        note.hidden = false;
      }
      box.classList.add('is-finished');
      return;
    }

    cells.days.textContent = pad(Math.floor(diff / MS.day));
    cells.hours.textContent = pad(Math.floor((diff % MS.day) / MS.hour));
    cells.minutes.textContent = pad(Math.floor((diff % MS.hour) / MS.minute));
    cells.seconds.textContent = pad(Math.floor((diff % MS.minute) / MS.second));
  }

  // Jalankan langsung. Versi lama menunggu 1 detik sehingga
  // menampilkan "00 00 00 00" selama satu detik penuh setiap page load.
  render();
  start();

  // Hemat baterai & hemat CPU: timer dihentikan saat tab disembunyikan.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else { render(); start(); }
  });
}
