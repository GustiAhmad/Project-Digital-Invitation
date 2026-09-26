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

import { $$ } from '../lib/dom.js';
import { toastSuccess, toastError } from '../lib/toast.js';
import { iconMarkup } from '../lib/icons.js';

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
 * Pasang penangan salin pada semua elemen ber-atribut data-copy.
 */
export function initClipboard() {
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy;
      const label = btn.dataset.copyLabel || 'Nomor';
      if (!value) return;

      const ok = await copyText(value);

      if (ok) {
        toastSuccess(`${label} berhasil disalin`);
        flashIcon(btn, 'check');
      } else {
        toastError('Gagal menyalin otomatis. Silakan salin manual.');
      }
    });
  });
}

/** Tampilkan centang sebentar di tombol (umpan balik visual tambahan). */
function flashIcon(btn, iconName) {
  const target = btn.querySelector('.btn__icon') || btn;
  const original = target.innerHTML;
  target.innerHTML = iconMarkup(iconName, { size: 15 });
  setTimeout(() => { target.innerHTML = original; }, 1600);
}
