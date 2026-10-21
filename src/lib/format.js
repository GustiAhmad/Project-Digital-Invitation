/* =========================================================
   src/lib/format.js
   ---------------------------------------------------------------
   Format tanggal, waktu, dan nomor.

   MASALAH YANG DISELESAIKAN:
     Kode lama menulis "Kamis, 20 November 2026" secara manual.
     Padahal 20 Nov 2026 adalah JUAT. Kesalahan muncul karena
     `new Date("November 20, 2026 08:00:00")` di-parse sebagai
     waktu lokal perangkat - di perangkat WIB hasilnya jadi
     "Kamis, 19 November".

   SOLUSI:
     Tanggal disimpan sebagai data (YYYY-MM-DD) + zona waktu
     eksplisit, lalu nama hari dihitung oleh Intl. Tidak ada lagi
     teks tanggal yang diketik manual, jadi tidak bisa salah.
   ========================================================= */

import { TIMEZONE, UTC_OFFSET } from '../config.js';

const cache = new Map();

function fmt(options) {
  const key = JSON.stringify(options);
  if (!cache.has(key)) {
    cache.set(key, new Intl.DateTimeFormat('id-ID', {
      timeZone: TIMEZONE,
      ...options,
    }));
  }
  return cache.get(key);
}

/** "Jumat, 20 November 2026" */
export function formatDateLong(dateISO) {
  return fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${dateISO}T00:00:00${UTC_OFFSET}`));
}

/** "Jumat, 20 November" */
export function formatDateMedium(dateISO) {
  return fmt({ weekday: 'long', day: 'numeric', month: 'long' })
    .format(new Date(`${dateISO}T00:00:00${UTC_OFFSET}`));
}

/** "20 November 2026" */
export function formatDatePlain(dateISO) {
  return fmt({ day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${dateISO}T00:00:00${UTC_OFFSET}`));
}

/** "08.00" (pakai titik, gaya Indonesia) */
export function formatTime(time) {
  return String(time).replace(':', '.');
}

/**
 * Rentang waktu yang DIPERLIHATKAN ke tamu, mis.
 * "08.00 s/d selesai WITA" atau "08.00 - 14.00 WITA".
 *
 * Yang dipakai adalah `endTimeLabel`, bukan `endTime`. Konfirmasi
 * klien: acara ditulis "s/d selesai" karena jam berakhirnya memang
 * sengaja tidak ditetapkan, sementara `endTime` tetap berisi jam
 * konkret (17:00) untuk file kalender (lihat eventEndISO).
 *
 * Kalau `endTimeLabel` diawali "s/d", pemisahnya spasi biasa supaya
 * tidak jadi "08.00 - s/d selesai" (ganda). Kalau label berupa jam
 * (mis. "14.00"), pemisahnya " - " biasa.
 *
 * Kalau `endTimeLabel` tidak diisi, jatuh ke `endTime` supaya
 * kartu acara tidak pernah tampil "08.00 - undefined".
 */
export function formatTimeRange(event) {
  const end = event.endTimeLabel || formatTime(event.endTime);
  const sep = /^\s*s\/d/i.test(end) ? ' ' : ' - ';
  return `${formatTime(event.startTime)}${sep}${end} WITA`;
}

/** Nilai untuk atribut HTML datetime="..." */
export function toDateAttr(event) {
  return `${event.date}T${event.startTime}:00${UTC_OFFSET}`;
}

/**
 * Versi .ics dari tanggal ("2026-10-25T08:00:00+08:00")
 * Format .ics wajib "YYYYMMDDTHHMMSSZ" (UTC, tanpa tanda +/-, tanpa titik).
 *
 * Konversi ke WAJIB: kalau tanggal lokal dikirim apa adanya,
 * Calendar membacanya sebagai waktu di zona TAMU. Tamu WIB akan
 * melihat acara mulai 1 jam lebih awal.
 */
export function toICSStamp(isoString) {
  return new Date(isoString)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}
