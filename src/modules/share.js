/* =========================================================
   src/modules/share.js
   ---------------------------------------------------------------
   Berisi dua util kecil yang memang TIDAK terkait "bagikan":
     - initCharCount()     : penghitung karakter textarea ucapan.
     - initUnsavedGuard()  : konfirmasi sebelum menutup tab.

   Fungsi "Bagikan Undangan" + tombol salin tautan sudah DIHAPUS
   (keputusan klien: tamu tidak perlu membagikan undangan - klien
   menyebar satu link umum sendiri). Sisa util di bawah tetap
   dipakai RSVP & ucapan, jadi file ini tidak dihapus.
   ========================================================= */

import { $$ } from '../lib/dom.js';
export function initCharCount() {
  const field = document.getElementById('isiUcapan');
  const counter = document.getElementById('wishCount');
  if (!field || !counter) return;

  const max = Number(field.getAttribute('maxlength')) || 500;

  const update = () => {
    const n = field.value.length;
    counter.textContent = String(n);
    counter.parentElement.classList.toggle('is-near-limit', n > max * 0.9);
  };

  field.addEventListener('input', update);
  update();
}

/* ---------- Peringatan sebelum menutup tab saat ada isian ---------- */
export function initUnsavedGuard() {
  const forms = $$('#wishForm');
  let dirty = false;

  forms.forEach((form) => {
    form.addEventListener('input', () => { dirty = true; });
    form.addEventListener('submit', () => { dirty = false; });
  });

  window.addEventListener('beforeunload', (e) => {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = '';
  });
}
