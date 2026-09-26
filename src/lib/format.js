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

/** "08.00 - 10.00 WITA" */
export function formatTimeRange(event) {
  return `${formatTime(event.startTime)} - ${formatTime(event.endTime)} WITA`;
}

/** Nilai untuk atribut HTML datetime="..." */
export function toDateAttr(event) {
  return `${event.date}T${event.startTime}:00${UTC_OFFSET}`;
}

/** Nomor rekening dikelompokkan: "123456789012" -> "1234 5678 9012" */
export function groupNumber(value, size = 4) {
  return String(value).replace(/\D/g, '').replace(new RegExp(`\\B(?=(\\w{${size}})+(?!\\w))`, 'g'), ' ');
}

/**
 * Versi .ics dari tanggal ("2026-11-20T08:00:00+08:00")
 * Format .ics wajib "YYYYMMDDTHHMMSSZ" (UTC, tanpa tanda +/-, tanpa titik).
 */
export function toICSStamp(isoString) {
  return new Date(isoString)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}
