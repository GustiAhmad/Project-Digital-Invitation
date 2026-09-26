/* =========================================================
   src/modules/clipboard.js
   ---------------------------------------------------------------
   Salin ke clipboard.

   MASALAH YANG DISELESAIKAN:
     Kode lama melakukan:
         navigator.clipboard.writeText("...");
         alert("Nomor rekening berhasil disalin.");
     Dua cacat:
       1. navigator.clipboard hanya ada di HTTPS/localhost.
          Buka lewat file:// atau HTTP biasa -> TypeError, dan
          karena tidak ada try/catch, error-nya tidak tertangani.
       2. alert() berjalan SEBELUM promise selesai, jadi pesan
          "berhasil" muncul aunque salinnya GAGAL.

     Perbaikan: coba Clipboard API, jatuh ke execCommand, dan
     hanya tampilkan "berhasil" bila benar-benar berhasil.

   CATATAN KEAMANAN: Clipboard API modern hanya jalan di secure
   context - ini perilaku browser, bukan bisa kita akali. O
   Fallback di bawah yang menutup celah tersebut.
   ========================================================= */

import { toastSuccess, toastError } from '../lib/toast.js';
import { icon } from '../lib/icons.js';

/**
 * Salin teks ke clipboard. Mengembalikan Promise<boolean>.
 */
export async function copyText(text) {
  // 1. Cara modern - butuh HTTPS atau localhost
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 2. Gagal (izin ditolak, dll) -> lanjut ke fallback
    }
  }

  // 3. Fallback untuk HTTP / file:// / browser lama
  return legacyCopy(text);
}

function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0';

  document.body.append(ta);

  let ok = false;
  try {
    ta.focus({ preventScroll: true });
    ta.select();
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    ta.remove();
  }
  return ok;
}

/**
 * Pasang penangan salin untuk semua elemen ber-atribut data-copy.
 *
 * Pakai DELEGASI di level document, bukan querySelectorAll lalu
 * addEventListener. Alasannya: tombol kado dibuat ulang oleh
 * renderAll() (render.js). Kalau listener ditempel sebelum render,
 * tombol barunya tidak punya handler sama sekali.
 */
export function initClipboard() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;

    const value = btn.dataset.copy;
    if (!value) return;
    if (btn.disabled) return;

    const ok = await copyText(value);

    if (ok) {
      flashCopied(btn, btn.dataset.copySuccess);
      toastSuccess(btn.dataset.copyLabel
        ? `${btn.dataset.copyLabel} berhasil disalin`
        : 'Nomor berhasil disalin');
    } else {
      toastError('Gagal menyalin otomatis. Silakan salin manual.');
    }
  });
}

/**
 * Umpan balik visual di dalam tombol: ikon jadi centang dan teks
 * jadi "Nomor Tersalin!", lalu kembali seperti semula setelah 2 detik.
 *
 * Hanya menyentuh <span class="btn__icon"> dan <span class="btn__label">.
 * Kalau kita menulis ke innerHTML tombol secara utuh, kedua span itu
 * ikut hilang dan tidak bisa dikembalikan lagi.
 */
function flashCopied(btn, successText) {
  const iconBox = btn.querySelector('.btn__icon');
  const label = btn.querySelector('.btn__label');
  const originalLabel = label ? label.textContent : '';

  if (iconBox) {
    iconBox.textContent = '';
    iconBox.append(icon('check', { size: 16 }));
  }
  if (label && successText) label.textContent = successText;

  btn.classList.add('btn--done');
  btn.disabled = true;

  clearTimeout(btn._copyTimer);
  btn._copyTimer = setTimeout(() => {
    if (iconBox) {
      iconBox.textContent = '';
      iconBox.append(icon('copy', { size: 16 }));
    }
    if (label) label.textContent = originalLabel;
    btn.classList.remove('btn--done');
    btn.disabled = false;
  }, 2000);
}
