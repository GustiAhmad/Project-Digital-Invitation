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

   PENYIMPANAN:
     - Kalau VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY terisi
       (di Vercel / .env): ucapan disimpan di Supabase, dibaca oleh
       SEMUA tamu, dan muncul realtime tanpa refresh.
     - Kalau belum dikonfigurasi (dev lokal): otomatis jatuh ke
       localStorage supaya halaman tetap bisa direview.

   KEAMANAN:
     Semua teks pengguna (nama, pesan) SELALU lewat textContent /
     createTextNode, tidak pernah innerHTML. Pertahanan utama
     terhadap stored XSS. Batas panjang & nilai status juga
     ditegakkan di database (lihat supabase/schema.sql).
   ========================================================= */

import { $, $$, el, timeAgo } from '../lib/dom.js';
import { toastSuccess, toastError } from '../lib/toast.js';
import { CONFIG } from '../config.js';
import { supabase, isSupabaseConfigured, WISHES_TABLE } from '../lib/supabase.js';

const STORAGE_KEY = 'wedding:wishes';
const MAX_ITEMS = 100;

const STATUS_CLASS = {
  hadir: 'wish__status--hadir',
  tidak_hadir: 'wish__status--tidak',
  belum_pasti: 'wish__status--ragu',
};

/** Label status dari config, dengan fallback aman. */
function statusLabel(status) {
  return CONFIG.wishes.statusLabel?.[status] || '';
}

/**
 * Samakan bentuk data dari dua sumber (Supabase & localStorage)
 * menjadi satu bentuk internal: { id, name, message, status, createdAt }.
 * Supabase memakai snake_case (created_at); kita normalkan di sini
 * supaya sisa kode hanya berurusan dengan satu bentuk.
 */
function normalizeRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    message: row.message || '',
    status: row.status || '',
    createdAt: row.createdAt || row.created_at || '',
  };
}

/** Satu kartu ucapan. Teks selalu lewat textContent. */
export function createWishCard({ id, name, message, status, createdAt }) {
  const card = el('article', { class: 'wish' });
  if (id) card.dataset.id = id;

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

  /* ---- Muat & langganan ---- */
  if (isSupabaseConfigured) {
    loadRemoteWishes();
    subscribeRealtime();
  } else {
    loadLocalWishes();
  }

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

  form.addEventListener('submit', async (e) => {
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

    setBusy(true);

    let ok = true;
    if (isSupabaseConfigured) {
      ok = await sendRemote({ name, message, status });
    } else {
      addLocal({ name, message, status });
    }

    setBusy(false);

    if (!ok) {
      toastError('Gagal mengirim. Periksa koneksi lalu coba lagi.');
      return;
    }

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

  function setBusy(busy) {
    submit.disabled = busy;
    form.classList.toggle('is-sending', busy);
  }

  /* =====================================================
     Sumber remote (Supabase)
     ===================================================== */

  async function loadRemoteWishes() {
    const { data, error } = await supabase
      .from(WISHES_TABLE)
      .select('id, name, message, status, created_at')
      .order('created_at', { ascending: false })
      .limit(MAX_ITEMS);

    if (error) {
      // Jangan menakut-nakuti tamu; papan cukup kosong dan form
      // tetap bisa dipakai. Detailnya hanya untuk developer.
      console.warn('[wishes] gagal memuat dari Supabase:', error.message);
      return;
    }

    list.textContent = '';
    data.map(normalizeRow).forEach((item) => prependWish(item));
    updateEmptyState();
  }

  async function sendRemote(entry) {
    const { data, error } = await supabase
      .from(WISHES_TABLE)
      .insert({ name: entry.name, message: entry.message, status: entry.status })
      .select('id, name, message, status, created_at')
      .single();

    if (error) {
      console.warn('[wishes] gagal mengirim ke Supabase:', error.message);
      return false;
    }

    // Tampilkan langsung (optimistis). Realtime akan mencoba
    // menambahkan lagi; dedupe lewat id mencegah kartu ganda.
    prependWish(normalizeRow(data), { dedupe: true });
    updateEmptyState();
    return true;
  }

  /**
   * Dengarkan ucapan baru. Event INSERT dari database berisi baris
   * lengkap; kita tambahkan supaya semua tamu melihatnya tanpa
   * refresh.
   */
  function subscribeRealtime() {
    supabase
      .channel('wishes-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: WISHES_TABLE },
        (payload) => {
          if (!payload?.new) return;
          prependWish(normalizeRow(payload.new), { dedupe: true });
          updateEmptyState();
        },
      )
      .subscribe();
  }

  /* =====================================================
     Sumber lokal (fallback dev)
     ===================================================== */

  function addLocal(entry) {
    const item = { ...entry, id: `local-${Date.now()}`, createdAt: new Date().toISOString() };
    prependWish(item);
    saveLocalWishes();
    updateEmptyState();
    return true;
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
          if (item?.name && item?.message) prependWish(item);
        });
      updateEmptyState();
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function saveLocalWishes() {
    const items = $$('.wish', list)
      .slice(0, MAX_ITEMS)
      .map((node) => ({
        name: node.querySelector('.wish__name')?.textContent || '',
        message: node.querySelector('.wish__message')?.textContent || '',
        status: statusFromCard(node),
        createdAt: node.querySelector('time')?.getAttribute('datetime')
          || new Date().toISOString(),
      }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  /** Baca kembali status dari badge, dipakai saat menyimpan lokal. */
  function statusFromCard(node) {
    const badge = node.querySelector('.wish__status');
    if (!badge) return '';
    const found = Object.entries(CONFIG.wishes.statusLabel || {})
      .find(([, label]) => label === badge.textContent);
    return found ? found[0] : '';
  }

  /* =====================================================
     Util papan
     ===================================================== */

  /**
   * Tambahkan kartu ke atas papan.
   * `dedupe` = jangan tambah kalau id-nya sudah ada (mencegah kartu
   * ganda antara render optimistis dan event realtime).
   */
  function prependWish(entry, { dedupe = false } = {}) {
    if (dedupe && entry.id && list.querySelector(`[data-id="${entry.id}"]`)) {
      return;
    }
    removeEmptyState();
    list.prepend(createWishCard(entry));
  }

  /* Pesan "belum ada ucapan" supaya papan tidak terlihat rusak
     saat masih kosong. */
  function updateEmptyState() {
    const hasWish = list.querySelector('.wish');
    if (hasWish) {
      removeEmptyState();
      return;
    }
    if (list.querySelector('.wish-list__empty')) return;
    list.append(el('p', {
      class: 'wish-list__empty',
      text: CONFIG.wishes.emptyText || 'Jadilah yang pertama mengirim doa & ucapan.',
    }));
  }

  function removeEmptyState() {
    list.querySelector('.wish-list__empty')?.remove();
  }
}
