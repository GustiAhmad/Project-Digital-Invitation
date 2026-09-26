/* =========================================================
   src/modules/wishes.js
   ---------------------------------------------------------------
   Buku tamu / ucapan.

   TAHAP 1: masih lokal (hilang saat refresh).
   TAHAP 5: diisi ke Supabase + real-time + moderasi.

   MASALAH YANG DISELESAIKAN:
     Kode lama menulis:
         div.innerHTML = `<strong>${nama}</strong><p>${ucapan}</p>`
     Input mentah pengguna masuk ke innerHTML. Begitu fitur dibuat
     persisten, ini menjadi STORED XSS: satu pengunjung bisa
     menyisipkan <img onerror=...> yang dieksekusi di browser
     SEMUA pengunjung lain.

     Di sini semua teks dibuat lewat textContent, jadi HTML dari
     pengguna SELALU diperlakukan sebagai teks biasa.
   ========================================================= */

import { $, el, timeAgo } from '../lib/dom.js';
import { toastSuccess, toastError } from '../lib/toast.js';
import { CONFIG } from '../config.js';

const STORAGE_KEY = 'wedding:wishes';

/** Satu kartu ucapan. Teks selalu lewat textContent. */
export function createWishCard({ name, message, createdAt }) {
  const card = el('article', { class: 'wish' });

  const head = el('header', { class: 'wish__head' }, [
    el('span', { class: 'wish__avatar', 'aria-hidden': 'true', text: initials(name) }),
    el('div', { class: 'wish__meta' }, [
      el('strong', { class: 'wish__name', text: name }),
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
  const submit = form.querySelector('button[type="submit"]');

  // Ingat nama pengunjung supaya tidak perlu mengetik ulang
  const savedName = localStorage.getItem('wedding:name');
  if (savedName) nameInput.value = savedName;

  // Pulihkan ucapan lokal (FITUR SEMENTARA, sampai Tahap 5)
  loadLocalWishes();

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const message = msgInput.value.trim();

    if (!name || !message) {
      toastError('Nama dan ucapan tidak boleh kosong.');
      return;
    }

    if (name.length > CONFIG.wishes.nameMaxLength) {
      toastError(`Nama maksimal ${CONFIG.wishes.nameMaxLength} karakter.`);
      return;
    }
    if (message.length > CONFIG.wishes.messageMaxLength) {
      toastError(`Ucapan maksimal ${CONFIG.wishes.messageMaxLength} karakter.`);
      return;
    }

    const entry = { name, message, createdAt: new Date().toISOString() };

    prependWish(entry);
    saveLocalWishes();
    localStorage.setItem('wedding:name', name);

    nameInput.value = '';
    msgInput.value = '';
    msgInput.focus();

    toastSuccess('Terima kasih! Ucapan Anda telah terkirim.');
  });

  function prependWish(entry) {
    const placeholder = list.querySelector('.wish--empty');
    placeholder?.remove();
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
    const items = $$cards()
      .slice(0, 50)
      .map((node) => ({
        name: node.querySelector('.wish__name')?.textContent || '',
        message: node.querySelector('.wish__message')?.textContent || '',
        createdAt: node.querySelector('time')?.getAttribute('datetime')
          || new Date().toISOString(),
      }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function $$cards() {
    return [...list.querySelectorAll('.wish')];
  }
}
