/* =========================================================
   src/modules/share.js
   ---------------------------------------------------------------
   Tombol "Bagikan Undangan".
   Memakai Web Share API bila tersedia (native di HP), jatuh ke
   salin tautan bila tidak.
   ========================================================= */

import { $$ } from '../lib/dom.js';
import { copyText } from './clipboard.js';
import { toastSuccess, toastError, toastInfo } from '../lib/toast.js';
import { CONFIG } from '../config.js';

export function initShare() {
  const buttons = $$('[data-share]');
  if (!buttons.length) return;

  const url = CONFIG.meta.siteUrl || window.location.href;
  const shareData = {
    title: CONFIG.meta.title,
    text: CONFIG.meta.description,
    url,
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      // Web Share API hanya ada di HP / browser modern
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch (err) {
          // User menekan "Batal" - bukan error, jangan tampilkan apa-apa
          if (err?.name === 'AbortError') return;
        }
      }

      // Fallback: salin tautan
      const ok = await copyText(url);
      if (ok) toastSuccess('Tautan undangan berhasil disalin');
      else toastError('Gagal menyalin tautan. Silakan salin dari address bar.');
    });
  });
}

/* ---------- Penghitung karakter textarea ---------- */
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
  const forms = $$('#wishForm, #rsvpForm');
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
