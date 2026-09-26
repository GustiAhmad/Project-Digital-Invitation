/* =========================================================
   src/modules/rsvp.js
   ---------------------------------------------------------------
   Konfirmasi kehadiran.

   TAHAP 1: validasi + umpan balik, belum kirim ke database.
   TAHAP 6: kirim ke Supabase, tambah statistik & export CSV.

   MASALAH YANG DISELESAIKAN:
     Kode lama:
         function kirimRSVP() { alert("...berhasil..."); }
     Fungsi itu tidak membaca input apa pun, tidak menyimpan apa
     pun, dan selalu menampilkan "berhasil" walau form kosong.
     Tambahan: tidak ada atribut `name` di field mana pun, dan
     <option> pertama bernilai "Konfirmasi Kehadiran" yang ikut
     terkirim sebagai jawaban.
   ========================================================= */

import { $ } from '../lib/dom.js';
import { toastError, toastInfo } from '../lib/toast.js';

export function initRsvp() {
  const form = $('#rsvpForm');
  if (!form) return;

  const nameInput = $('#rsvpName');
  const statusInput = $('#rsvpStatus');
  const guestInput = $('#rsvpGuest');
  const submit = form.querySelector('button[type="submit"]');
  const note = $('#rsvpNote');

  // Simpan agar pengunjung tidak mengisi ulang
  const savedName = localStorage.getItem('wedding:name');
  if (savedName && nameInput) nameInput.value = savedName;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const status = statusInput.value;
    const guestCount = Number(guestInput.value) || 1;

    /* ---- Validasi ---- */
    if (name.length < 2) {
      toastError('Mohon isi nama lengkap Anda.');
      nameInput.focus();
      return;
    }
    if (!status) {
      toastError('Mohon pilih konfirmasi kehadiran.');
      statusInput.focus();
      return;
    }
    if (guestCount < 1 || guestCount > Number(guestInput.max)) {
      toastError(`Jumlah tamu harus antara 1 sampai ${guestInput.max}.`);
      guestInput.focus();
      return;
    }

    const payload = {
      name,
      status,
      guest_count: guestCount,
      submitted_at: new Date().toISOString(),
    };

    // Di Tahap 1 tombol sengaja dinonaktifkan supaya tidak memberi
    // harapan palsu bahwa data sudah tersimpan.
    setBusy(true, 'Tersimpan di Tahap 6');

    console.info('[Tahap 1] Data RSVP belum dikirim ke database:', payload);

    if (note) {
      note.hidden = false;
      note.textContent =
        'Mode pratinjau: data Anda belum disimpan. Fitur ini aktif penuh '
        + 'di Tahap 6 setelah database siap.';
    }

    toastInfo('Terima kasih! (mode pratinjau - belum tersimpan)');

    setTimeout(() => setBusy(false), 2400);
  });

  function setBusy(busy, label) {
    submit.disabled = busy;
    submit.textContent = busy ? label : submit.dataset.label || 'Kirim Konfirmasi';
  }

  // Simpan label asli supaya bisa dikembalikan
  submit.dataset.label = submit.textContent.trim();
}
