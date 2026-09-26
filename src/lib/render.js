/* =========================================================
   src/lib/render.js
   ---------------------------------------------------------------
   Mengisi halaman dari config.js.

   PRINSIP:
     1. HTML berisi teks fallback yang masuk akal. Kalau JavaScript
        gagal dimuat, pembaca tetap melihat konten (dan crawler
        WhatsApp/Facebook yang TIDAK menjalankan JS tetap bisa
        membaca nama & tanggal untuk preview).
     2. Setelah JS jalan, config.js yang jadi acuan.
     3. Script `npm run check` membandingkan fallback di HTML
        dengan config.js sehingga keduanya tidak bisa diam-diam
        berbeda.

   SEMUA penulisan teks lewat textContent / setAttribute.
   Tidak ada satu pun innerHTML untuk data dari config.
   ========================================================= */

import { CONFIG, PRIMARY_EVENT } from '../config.js';
import { $, $$, el } from './dom.js';
import { iconMarkup } from './icons.js';
import {
  formatDateLong, formatDateMedium, formatDatePlain,
  formatTimeRange, toDateAttr,
} from './format.js';

/* ---------- binding teks generik ---------- */

/**
 * Isi semua elemen bertanda `data-text="path"` dari object CONFIG.
 * Contoh: <span data-text="couple.bride.name"></span>
 */
function bindText() {
  $$('[data-text]').forEach((node) => {
    const value = resolve(node.dataset.text);
    if (typeof value === 'string' && value) node.textContent = value;
  });

  // Atribut: <img data-attr="src|couple.bride.photo">
  $$('[data-attr]').forEach((node) => {
    const [attr, path] = node.dataset.attr.split('|');
    const value = resolve(path);
    if (value) node.setAttribute(attr, value);
  });
}

function resolve(path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), CONFIG);
}

/* ----------Judul/nama pengantin ---------- */
function renderCoupleNames() {
  const { bride, groom } = CONFIG.couple;
  const scriptNodes = $$('[data-bind="couple-names-script"]');
  scriptNodes.forEach((n) => { n.textContent = `${bride.name} & ${groom.name}`; });
}

/* ---------- ACARA ---------- */
function renderEvents() {
  const host = $('[data-render="events"]');
  if (!host) return;

  host.textContent = '';
  const dateLong = formatDateLong(PRIMARY_EVENT.date);

  CONFIG.events.forEach((event, i) => {
    const card = el('div', { class: 'event-card' });

    card.append(
      el('div', { class: 'event-icon', 'aria-hidden': 'true' },
        el('span', { html: iconMarkup(event.icon, { size: 34 }) })),

      el('h3', { text: event.title }),

      el('p', { class: 'event-date' },
        el('span', { class: 'event-line' },
          el('span', { class: 'event-line__icon', html: iconMarkup('calendar', { size: 16 }) }),
          el('time', { datetime: toDateAttr(event), text: dateLong }))),

      el('p', { class: 'event-time' },
        el('span', { class: 'event-line' },
          el('span', { class: 'event-line__icon', html: iconMarkup('clock', { size: 16 }) }),
          el('span', { text: formatTimeRange(event) }))),

      el('p', { class: 'event-venue' },
        el('span', { class: 'event-line' },
          el('span', { class: 'event-line__icon', html: iconMarkup('pin', { size: 16 }) }),
          el('span', { text: event.venue }))),

      el('p', { class: 'event-address', text: `${event.address}, ${event.city}` }),

      el('a', {
        class: 'btn btn--sm event-card__cta',
        href: '#location',
        dataset: { eventId: event.id },
        html: `Lihat Lokasi ${iconMarkup('chevronRight', { size: 15 })}`,
      }),
    );

    // Spasi antar kartu diberi oleh CSS grid, jadi tidak perlu <br>
    if (i > 0) card.classList.add('event-card--offset');
    host.append(card);
  });
}

/* ---------- LOKASI ---------- */
function renderLocation() {
  const host = $('[data-render="location"]');
  if (!host) return;

  const event = PRIMARY_EVENT;
  const frame = $('[data-map-frame]');

  if (frame) {
    // Tanpa koordinat -> pakai pencarian teks. Begitu klien memberi
    // koordinat, kode ini otomatis berubah jadi titik pin yang tepat.
    const q = (event.lat != null && event.lng != null)
      ? `${event.lat},${event.lng}`
      : event.mapsQuery;
    frame.src = `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=17&output=embed`;
  }

  // Daftar venue (punya 2 lokasi, dan masing-masing punya peta sendiri
  // di Tahap 7)
  const list = $('[data-render="venue-list"]');
  if (list) {
    list.textContent = '';
    CONFIG.events.forEach((ev) => {
      list.append(
        el('div', { class: 'venue' }, [
          el('span', { class: 'venue__icon', html: iconMarkup('pin', { size: 18 }) }),
          el('div', {}, [
            el('strong', { text: `${ev.title} - ${ev.venue}` }),
            el('span', { text: `${ev.address}, ${ev.city}` }),
          ]),
        ]),
      );
    });
  }
}

/* ---------- GALERI (masih grid; carousel di Tahap 4) ---------- */
function renderGallery() {
  const host = $('[data-render="gallery"]');
  if (!host) return;

  host.textContent = '';
  CONFIG.gallery.photos.forEach((photo, i) => {
    host.append(el('img', {
      src: photo.src,
      alt: photo.alt,
      width: photo.width,
      height: photo.height,
      loading: 'lazy',
      decoding: 'async',
      dataset: { index: String(i) },
    }));
  });
}

/* ---------- KISAH ---------- */
function renderStory() {
  const host = $('[data-render="story"]');
  if (!host) return;

  host.textContent = '';
  CONFIG.story.chapters.forEach((chapter) => {
    host.append(
      el('h3', { text: chapter.title }),
      el('p', { text: chapter.text }),
    );
  });
}

/* ---------- KADO ---------- */
function renderBanks() {
  const host = $('[data-render="banks"]');
  if (!host) return;

  host.textContent = '';
  CONFIG.banks.forEach((bank) => {
    host.append(el('div', { class: 'bank-card' }, [
      el('div', { class: 'bank-card__head' }, [
        el('span', { class: 'bank-card__icon', html: iconMarkup(bank.icon, { size: 22 }) }),
        el('h3', { text: bank.label }),
      ]),
      // Nomor yang DISALIN = bank.number (tanpa spasi).
      // Nomor yang DITAMPILKAN = bank.display.
      // `npm run check` memverifikasi keduanya konsisten.
      el('p', { class: 'bank-number', dataset: { copyValue: bank.number }, text: bank.display }),
      el('p', { class: 'bank-holder', text: `a.n. ${bank.holder}` }),
      el('button', {
        class: 'btn btn--sm',
        type: 'button',
        dataset: { copy: bank.number, copyLabel: `Nomor ${bank.label}` },
        html: `${iconMarkup('copy', { size: 15 })} Salin Nomor`,
      }),
    ]));
  });
}

/* ---------- RSVP ---------- */
function renderRsvp() {
  const select = $('#rsvpStatus');
  if (!select) return;

  select.textContent = '';
  select.append(el('option', { value: '', text: CONFIG.rsvp.placeholder, disabled: true, selected: true }));
  CONFIG.rsvp.statusOptions.forEach((opt) => {
    select.append(el('option', { value: opt.value, text: opt.label }));
  });

  const guest = $('#rsvpGuest');
  if (guest) guest.max = String(CONFIG.rsvp.maxGuest);
}

/* ---------- UCAPAN ---------- */
function renderWishes() {
  const name = $('#namaUcapan');
  const msg = $('#isiUcapan');
  if (!name || !msg) return;

  name.placeholder = CONFIG.wishes.namePlaceholder;
  name.maxLength = CONFIG.wishes.nameMaxLength;
  msg.placeholder = CONFIG.wishes.messagePlaceholder;
  msg.maxLength = CONFIG.wishes.messageMaxLength;
}

/* ---------- SHARE + QR ---------- */
function renderShare() {
  const urlNode = $('[data-render="share-url"]');
  if (!urlNode) return;

  const url = CONFIG.meta.siteUrl || window.location.origin;
  urlNode.textContent = url.replace(/^https?:\/\//, '');

  const img = $('[data-render="qr"]');
  if (img) img.src = CONFIG.share.qrPlaceholder;
}

/* ---------- IKON STATIS ---------- */
function renderStaticIcons() {
  $$('[data-icon]').forEach((node) => {
    const name = node.dataset.icon;
    if (!name || node.firstChild) return;
    node.innerHTML = iconMarkup(name, { size: Number(node.dataset.size) || 20 });
  });
}

/* ---------- ENTRY ---------- */
export function renderAll() {
  bindText();
  renderCoupleNames();
  renderStaticIcons();
  renderEvents();
  renderLocation();
  renderGallery();
  renderStory();
  renderBanks();
  renderRsvp();
  renderWishes();
  renderShare();
}
