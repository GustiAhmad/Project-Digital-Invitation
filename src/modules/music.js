/* =========================================================
   src/modules/music.js
   ---------------------------------------------------------------
   Audio background.

   MASALAH YANG DISELESAIKAN:
     Tombol musik di kode lama memanggil `toggleMusic()` yang TIDAK
     PERNAH didefinisikan -> ReferenceError, tombol mati total.
     Selain itu ikon tidak pernah berubah, tidak ada kontrol volume,
     dan `alert()` muncul saat autoplay ditolak.

   CARA KERJA AUTOPLAY:
     Semua browser modern memblokir autoplay bersuara sampai ada
     interaksi pengguna. Karena itu musik HANYA mulai setelah
     pengunjung menekan "Buka Undangan" - itu juga gesture pertama
     yang sah. Tidak ada cara sah untuk troph circumvent ini.
   ========================================================= */

import { $ } from '../lib/dom.js';
import { iconMarkup } from '../lib/icons.js';

const DEFAULT_VOLUME = 0.45;

export function initMusic() {
  const audio = $('#music');
  const btn = $('#musicButton');
  if (!audio || !btn) return;

  let playing = false;
  let userStopped = false; // tamu sengaja mematikan -> jangan hidupkan lagi

  function paint() {
    const icon = btn.querySelector('.music-btn__icon');
    if (icon) {
      icon.innerHTML = iconMarkup(playing ? 'pause' : 'music', { size: 20, stroke: 1.8 });
    }
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', playing ? 'Jeda musik' : 'Putar musik');
    btn.title = playing ? 'Jeda musik' : 'Putar musik';
    btn.classList.toggle('is-playing', playing);
  }

  async function play() {
    try {
      audio.volume = DEFAULT_VOLUME;
      await audio.play();
      playing = true;
    } catch {
      // Autoplay diblokir, atau format tidak didukung di perangkat ini.
      // Tidak perlu alert - tombol tetap bisa diklik pengguna.
      playing = false;
    }
    paint();
  }

  function pause() {
    audio.pause();
    playing = false;
    paint();
  }

  function toggle() {
    if (audio.paused) {
      userStopped = false;
      play();
    } else {
      userStopped = true;
      pause();
    }
  }

  // Tombol musik
  btn.addEventListener('click', toggle);

  // "Buka Undangan" = gesture pertama pengguna, satu-satunya momen
  // browser mengizinkan pemutaran otomatis.
  const openBtn = $('#openInvitation');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      if (audio.paused && !userStopped) play();
    });
  }

  // Keadaan playback bisa berubah dari luar (mis. perangkat Anakin
  // menghentikan audio karena ada telepon).
  audio.addEventListener('play', () => { playing = true; paint(); });
  audio.addEventListener('pause', () => { playing = false; paint(); });
  audio.addEventListener('ended', () => { playing = false; paint(); });
  audio.addEventListener('error', () => {
    playing = false;
    paint();
    btn.title = 'Audio tidak dapat dimuat';
  });

  // Jeda otomatis saat pindah tab / layar mati.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !audio.paused) pause();
  });

  paint();
}
