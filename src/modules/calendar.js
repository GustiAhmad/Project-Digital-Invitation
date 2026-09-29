/* =========================================================
   src/modules/calendar.js
   ---------------------------------------------------------------
   Dua cara menaruh acara di kalender pengunjung:

     1. Tombol "Google Calendar"
        Membuka template Google Calendar di tab baru. Pengguna
        tinggal menekan "Simpan". Tidak perlu akun Google pun
        untuk melihat pratinjaunya.

     2. Tombol "Unduh .ics"
        File kalender standar yang dipahami iOS Calendar, Outlook,
        Samsung Calendar, dan aplikasi kalender desktop mana pun.
        Ini yang benar-benar berguna untuk tamu yang pakai iPhone.

   Kenapa dua-duanya? Karena tidak semua orang pakai Google Calendar.
   Kalau hanya ada tombol Google, tamu iPhone akan bingung lalu
   mengetik ulang sendiri - dan sebagian besar tidak mau repot.

   Kenapa URL, bukan form HTML ke Google?
     Form POST ke Google akan gagal di banyak browser (CORS + popup
     blocker). URL `calendar/render?action=TEMPLATE` bisa dibuka
     sebagai link biasa, jadi selalu berhasil di semua browser.

   CATATAN WAKTU
     Semua tanggal dikonversi ke UTC sebelum masuk ke Google/ICS.
     Kalau kita mengirim "20261025T080000" tanpa konversi, Calendar
     akan membacanya sebagai 08:00 di zona waktu TAMU - bukan 08:00
     WITA. Tamu di Jakarta (WIB) akan melihat acara Dimulai 1 jam
     lebih awal.
   ========================================================= */

import { CONFIG, eventStartISO, eventEndISO, eventFullAddress, PRIMARY_EVENT } from '../config.js';
import { formatDateLong, toICSStamp } from '../lib/format.js';
import { $$, el } from '../lib/dom.js';
import { icon } from '../lib/icons.js';

/** Ringkasan singkat yang dipakai di deskripsi acara. */
function eventDetails(event) {
  const { groom, bride } = CONFIG.meta;
  return [
    `${formatDateLong(event.date)} pukul ${event.startTime.replace(':', '.')} WITA`,
    // Pakai event.title, bukan teks hardcoded. Kalau nanti acara
    // dipecah jadi dua, deskripsi kalender ikut berubah sendiri.
    `${event.title} - ${groom} & ${bride}`,
    'Mohon konfirmasi kehadiran melalui undangan ini.',
  ].join('\n');
}

/** URL template Google Calendar (dibuka di tab baru). */
export function googleCalendarUrl(event = PRIMARY_EVENT) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.title} - ${CONFIG.meta.groom} & ${CONFIG.meta.bride}`,
    dates: `${toICSStamp(eventStartISO(event))}/${toICSStamp(eventEndISO(event))}`,
    details: eventDetails(event),
    location: eventFullAddress(event),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/**
 * Bangun isi file .ics sebagai teks.
 *
 * Panjang baris dibatasi 75 octet sesuai RFC 5545. Line folding
 * (baris lanjutan diawali spasi) dikerjakan di `foldLine` supaya
 * aplikasi kalender yang ketat tidak menolaknya.
 */
export function buildIcs(event = PRIMARY_EVENT) {
  const stamp = toICSStamp(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${CONFIG.meta.title}//Undangan Digital//ID`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    // UID harus STABIL selamanya. Kalau UID ikut berubah (mis. karena
    // tanggal acara diedit), aplikasi kalender menganggapnya acara
    // baru dan memunculkan dua entri untuk acara yang sama.
    `UID:${event.id}@undangan-${slugOf(CONFIG.meta.title)}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toICSStamp(eventStartISO(event))}`,
    `DTEND:${toICSStamp(eventEndISO(event))}`,
    `SUMMARY:${escapeIcs(`${event.title} - ${CONFIG.meta.groom} & ${CONFIG.meta.bride}`)}`,
    `DESCRIPTION:${escapeIcs(eventDetails(event))}`,
    `LOCATION:${escapeIcs(eventFullAddress(event))}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcs(event.title)} besok`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** Teks jadi slug untuk domain UID, mis. "the-wedding-of-muhammad". */
function slugOf(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    // Potong di batas kata, bukan di tengah kata. "parida-pa" jauh
    // lebih membingungkan daripada "parida".
    .split('-').reduce((acc, w) => (
      (acc + '-' + w).length <= 60 ? acc + '-' + w : acc
    ), '')
    .replace(/^-+|-+$/g, '') || 'undangan';
}

/** Escape karakter khusus di dalam nilai .ics. */
function escapeIcs(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Lipat baris .ics yang melebihi 75 octet (RFC 5545). */
function foldLine(line) {
  // Karakter multi-byte dihitung per byte UTF-8, bukan per unit JS.
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const out = [];
  let start = 0;
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Jangan sampai memotong di tengah karakter UTF-8.
    while (end > start && (bytes[end] & 0xc0) === 0x80) end--;
    out.push(new TextDecoder().decode(bytes.slice(start, end)));
    start = end;
    limit = 74; // baris lanjutan kehilangan 1 byte untuk spasi
  }
  // Baris selain pertama diawali spasi.
  return out.map((s, i) => (i === 0 ? s : ` ${s}`)).join('\r\n');
}

/** Pasang semua tombol kalender yang ada di halaman. */
export function initCalendar() {
  const buttons = $$('[data-calendar]');

  buttons.forEach((btn) => {
    const event = CONFIG.events.find((e) => e.id === btn.dataset.eventId) || PRIMARY_EVENT;
    const kind = btn.dataset.calendar;

    if (kind === 'google') {
      btn.setAttribute('href', googleCalendarUrl(event));
      btn.setAttribute('target', '_blank');
      btn.setAttribute('rel', 'noopener noreferrer');
      return;
    }

    if (kind === 'ics') {
      // Unduh lewat object URL. Revoke-nya DITUNDA satu tick: kalau
      // dicabut tepat setelah a.click(), beberapa browser (terutama
      // Firefox di Android) membatalkan download-nya karena blob
      // sudah tidak ada saat browser mulai membaca.
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = el('a', { href: url, download: `undangan-${event.id}.ics` });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    }
  });

  // Ikon tombol kalender, kalau ada.
  $$('[data-icon="calendar"]').forEach((node) => {
    if (node.firstChild) return;
    node.textContent = '';
    node.append(icon('calendar', { size: Number(node.dataset.size) || 16 }));
  });
}
