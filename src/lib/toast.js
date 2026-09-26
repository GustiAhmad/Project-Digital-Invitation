/* =========================================================
   src/lib/toast.js
   ---------------------------------------------------------------
   Notifikasi ringan (pengganti alert()).

   Kenapa bukan alert()?
     - alert() memblokir seluruh main thread. Di HP, menekan OK
       akan MEMATIKAN layar beberapa detik.
     - alert() tidak selalu diumumkan screen reader.
     - Terlihat sangat "kasar" dan tidak sesuai desain wedding.

   Kenapa bukan SweetAlert2?
     SweetAlert2 (~70 KB) memang bagus, tapi berlebihan untuk
     feedback "tersalin" / "terkirim". Untuk itu cukup 60 baris
     CSS + JS tanpa dependency. SweetAlert2 kita pakai nanti
     hanya di panel admin (Tahap 5) untuk konfirmasi hapus.
   ========================================================= */

const MAX_VISIBLE = 3;
let region = null;

function ensureRegion() {
  if (region) return region;

  region = document.createElement('div');
  region.className = 'toast-region';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'false');
  document.body.append(region);
  return region;
}

const ICONS = {
  success: 'M20 6 9 17l-5-5',
  error: 'M12 8v5M12 16.5v.5M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  info: 'M12 16v-5M12 8v.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
};

/**
 * Tampilkan toast.
 * @param {string} message
 * @param {{type?: 'success'|'error'|'info', duration?: number}} opts
 */
export function toast(message, { type = 'success', duration = 3200 } = {}) {
  const host = ensureRegion();

  // Jangan menumpuk terlalu banyak
  while (host.children.length >= MAX_VISIBLE) {
    host.firstElementChild?.remove();
  }

  const item = document.createElement('div');
  item.className = `toast toast--${type}`;

  const icon = document.createElement('span');
  icon.className = 'toast__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[type] || ICONS.info}</svg>`;

  const text = document.createElement('span');
  text.className = 'toast__text';
  text.textContent = message;

  const close = document.createElement('button');
  close.className = 'toast__close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Tutup notifikasi');
  close.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6 18 18M18 6 6 18"/></svg>`;
  close.addEventListener('click', () => dismiss());

  item.append(icon, text, close);
  host.append(item);

  // Trigger animasi masuk
  requestAnimationFrame(() => item.classList.add('is-in'));

  let timer = setTimeout(dismiss, duration);

  // Jeda saat kursor di atas toast (desktop)
  item.addEventListener('mouseenter', () => clearTimeout(timer));
  item.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 1200); });

  function dismiss() {
    clearTimeout(timer);
    item.classList.remove('is-in');
    item.classList.add('is-out');
    item.addEventListener('animationend', () => item.remove(), { once: true });
    // Jaring pengaman bila animasi tidak berjalan
    setTimeout(() => item.remove(), 400);
  }

  return dismiss;
}

export const toastSuccess = (m, o) => toast(m, { ...o, type: 'success' });
export const toastError = (m, o) => toast(m, { ...o, type: 'error' });
export const toastInfo = (m, o) => toast(m, { ...o, type: 'info' });
