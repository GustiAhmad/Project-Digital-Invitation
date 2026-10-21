/* =========================================================
   src/modules/wishes.js
   ---------------------------------------------------------------
   DOA & UCAPAN (gabungan RSVP + Ucapan).

   KEPUTUSAN KLIEN: undangan ini murni undangan, bukan alat
   mempersiapkan acara. Jadi:
     - tamu menulis nama SEKALI saja,
     - tidak ada penghitungan jumlah tamu,
     - konfirmasi kehadiran cukup 3 pilihan,
     - begitu dikirim, ucapan langsung tampil di papan.

   TAHAP 1: masih lokal (localStorage).
   TAHAP 5: diisi ke Supabase + real-time + moderasi.

   KEAMANAN:
     Semua teks pengguna (nama, pesan) SELALU lewat textContent /
     createTextNode, tidak pernah innerHTML. Ini pertahanan utama
     terhadap stored XSS begitu data jadi persisten.
   ========================================================= */

import { $, $$, el, timeAgo } from '../lib/dom.js';
import { toastSuccess, toastError } from '../lib/toast.js';
import { CONFIG } from '../config.js';

const STORAGE_KEY = 'wedding:wishes';

const STATUS_CLASS = {
  hadir: 'wish__status--hadir',
  tidak_hadir: 'wish__status--tidak',
  belum_pasti: 'wish__status--ragu',
};

/** Label status dari config, dengan fallback aman. */
function statusLabel(status) {
  return CONFIG.wishes.statusLabel?.[status] || '';
}

/** Satu kartu ucapan. Teks selalu lewat textContent. */
export function createWishCard({ name, message, status, createdAt }) {
  const card = el('article', { class: 'wish' });

  const badge = statusLabel(status)
    ? el('span', {
        class: `wish__status ${STATUS_CLASS[status] || ''}`.trim(),
        text: statusLabel(status),
      })
    : null;

  const head = el('header', { class: 'wish__head' }, [
    el('span', { class: 'wish__avatar', 'aria-hidden': 'true', text: initials(name) }),
    el('div', { class: 'wish__meta' }, [
      el('div', { class: 'wish__meta-top' }, [
        el('strong', { class: 'wish__name', text: name }),
        badge,
      ]),
      el('time', {
        class: 'wish__time',
        datetime: createdAt,
        text: timeAgo(createdAt),
      }),
    ]),
  ]);

  const body = el('p', { class: 'wish__message', text: message });
  card.append(head, body);
  return card;
}

function initials(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();
}

export function initWishes() {
  const form = $('#wishForm');
  const list = $('#wishList');
  if (!form || !list) return;

  const nameInput = $('#namaUcapan');
  const msgInput = $('#isiUcapan');
  const statusGroup = $('#wishStatus');
  const submit = form.querySelector('button[type="submit"]');

  // Ingat nama pengunjung supaya tidak perlu mengetik ulang
  const savedName = localStorage.getItem('wedding:name');
  if (savedName) nameInput.value = savedName;

  // Pulihkan ucapan lokal (FITUR SEMENTARA, sampai Tahap 5)
  loadLocalWishes();

  /* ---- Tombol submit: nonaktif sampai form valid ----
     Ini mencegah data setengah jadi masuk, tanpa harus merepotkan
     tamu dengan popup error. Begitu nama, pesan, dan status terisi,
     tombol langsung aktif. */
  const currentStatus = () =>
    statusGroup?.querySelector('input[name="status"]:checked')?.value || '';

  function refreshSubmit() {
    const ok =
      nameInput.value.trim().length > 0 &&
      msgInput.value.trim().length > 0 &&
      currentStatus() !== '';
    submit.disabled = !ok;
  }

  form.addEventListener('input', refreshSubmit);
  form.addEventListener('change', refreshSubmit);
  refreshSubmit();

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const message = msgInput.value.trim();
    const status = currentStatus();

    if (!name || !message) {
      toastError('Nama dan pesan tidak boleh kosong.');
      return;
    }
    if (!status) {
      toastError('Mohon pilih konfirmasi kehadiran.');
      return;
    }
    if (name.length > CONFIG.wishes.nameMaxLength) {
      toastError(`Nama maksimal ${CONFIG.wishes.nameMaxLength} karakter.`);
      return;
    }
    if (message.length > CONFIG.wishes.messageMaxLength) {
      toastError(`Pesan maksimal ${CONFIG.wishes.messageMaxLength} karakter.`);
      return;
    }

    const entry = {
      name,
      message,
      status,
      createdAt: new Date().toISOString(),
    };

    prependWish(entry);
    saveLocalWishes();
    localStorage.setItem('wedding:name', name);

    // Form dibersihkan, tapi nama dipertahankan supaya tamu yang
    // ingin mengirim lagi tidak mengetik ulang.
    msgInput.value = '';
    const checked = statusGroup?.querySelector('input[name="status"]:checked');
    if (checked) checked.checked = false;
    refreshSubmit();
    msgInput.focus();

    toastSuccess('Terima kasih! Doa dan konfirmasi Anda telah terkirim.');
  });

  function prependWish(entry) {
    list.prepend(createWishCard(entry));
  }

  function loadLocalWishes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const items = JSON.parse(raw);
      if (!Array.isArray(items)) return;
      // Yang terbaru di atas
      items
        .slice()
        .reverse()
        .forEach((item) => {
          if (item?.name && item?.message) list.prepend(createWishCard(item));
        });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function saveLocalWishes() {
    const items = $$('.wish', list)
      .slice(0, 50)
      .map((node) => ({
        name: node.querySelector('.wish__name')?.textContent || '',
        message: node.querySelector('.wish__message')?.textContent || '',
        status: statusFromCard(node),
        createdAt: node.querySelector('time')?.getAttribute('datetime')
          || new Date().toISOString(),
      }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  /** Baca kembali status dari badge, dipakai saat menyimpan. */
  function statusFromCard(node) {
    const badge = node.querySelector('.wish__status');
    if (!badge) return '';
    const found = Object.entries(CONFIG.wishes.statusLabel || {})
      .find(([, label]) => label === badge.textContent);
    return found ? found[0] : '';
  }
}
