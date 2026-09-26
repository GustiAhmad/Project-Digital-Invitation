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

import { CONFIG } from '../config.js';
import { $, $$, el } from './dom.js';
import { icon } from './icons.js';
import { applyResponsive } from './responsive.js';
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
    if (!value) return;
    node.setAttribute(attr, value);

    // Foto yang sumbernya diambil dari config ikut mendapat srcset,
    // supaya HP tidak mengunduh file 1600px cuma untuk thumbnail.
    if (attr === 'src' && node.tagName === 'IMG') {
      const sizeKey = node.dataset.responsive || 'couple';
      applyResponsive(node, value, sizeKey);
    }
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

  CONFIG.events.forEach((event) => {
    const card = el('div', { class: 'event-card' });
    // Tanggal dihitung dari event ini sendiri, bukan dari PRIMARY_EVENT,
    // supaya kalau klien menambah acara di tanggal berbeda ikut benar.
    const dateLong = formatDateLong(event.date);

    card.append(
      el('div', { class: 'event-icon' }, icon(event.icon, { size: 34 })),

      el('h3', { text: event.title }),

      el('p', { class: 'event-date' },
        el('span', { class: 'event-line' },
          el('span', { class: 'event-line__icon' }, icon('calendar', { size: 16 })),
          el('time', { datetime: toDateAttr(event), text: dateLong }))),

      el('p', { class: 'event-time' },
        el('span', { class: 'event-line' },
          el('span', { class: 'event-line__icon' }, icon('clock', { size: 16 })),
          el('span', { text: formatTimeRange(event) }))),

      el('p', { class: 'event-venue' },
        el('span', { class: 'event-line' },
          el('span', { class: 'event-line__icon' }, icon('pin', { size: 16 })),
          el('span', { text: event.venue }))),

      el('p', { class: 'event-address', text: `${event.address}, ${event.city}` }),

      // Langsung ke kartu venue milik acara ini, bukan ke section
      // "#location" generik - supaya pengunjung tidak harus menebak
      // peta mana yang benar.
      el('a', {
        class: 'btn btn--sm event-card__cta',
        href: `#venue-${event.id}`,
        dataset: { eventId: event.id },
      }, [
        el('span', { text: 'Lihat Lokasi' }),
        el('span', { class: 'btn__icon' }, icon('chevronRight', { size: 15 })),
      ]),
    );

    host.append(card);
  });
}

/* ---------- LOKASI ---------- */

/**
 * Satu venue = satu peta.
 *
 * Kenapa tidak satu peta untuk semua? Karena akad nikah dan resepsi
 * bisa di lokasi yang BERBEDA. Kalau cuma ada satu peta, pengunjung
 * yang mau menuju resepsi bisa salah klik dan arrive di masjid.
 * Satu kartu per acara membuat tiap tombol navigasi jelas milik
 * acara yang mana.
 */
function renderLocation() {
  // Ringkasan alamat (tanpa iframe) - ini yang dibaca crawler.
  const list = $('[data-render="venue-list"]');
  if (list) {
    list.textContent = '';
    CONFIG.events.forEach((ev) => {
      list.append(
        el('div', { class: 'venue' }, [
          el('span', { class: 'venue__icon' }, icon('pin', { size: 18 })),
          el('div', {}, [
            el('strong', { text: `${ev.title} - ${ev.venue}` }),
            el('span', { text: `${ev.address}, ${ev.city}` }),
          ]),
        ]),
      );
    });
  }

  // Kartu peta, satu per acara.
  const mapList = $('[data-render="map-list"]');
  if (!mapList) return;

  mapList.textContent = '';
  CONFIG.events.forEach((ev) => {
    const frame = el('iframe', {
      // src diisi setelah elemen masuk DOM (lihat catatan di bawah)
      title: `Peta lokasi ${ev.title} di ${ev.venue}`,
      loading: 'lazy',
      referrerpolicy: 'no-referrer-when-downgrade',
      allowfullscreen: true,
    });

    mapList.append(el('article', { class: 'map-card', id: `venue-${ev.id}` }, [
      el('header', { class: 'map-card__head' }, [
        el('h3', { text: ev.title }),
        el('p', { text: ev.venue }),
        el('p', { class: 'map-card__address', text: `${ev.address}, ${ev.city}` }),
      ]),
      el('div', { class: 'map-box' }, frame),
      el('div', { class: 'map-actions' }, [
        el('a', {
          class: 'btn',
          href: mapsDirectionsUrl(ev),
          target: '_blank',
          rel: 'noopener noreferrer',
          dataset: { navMaps: '', eventId: ev.id },
        }, [
          el('span', { class: 'btn__icon' }, icon('pin', { size: 16 })),
          el('span', { text: `Navigasi ke ${ev.venue}` }),
        ]),
      ]),
    ]));

    // src diisi setelah append: Google Maps embed butuh kontainer yang
    // sudah punya layout. Kalau src diisi sebelum masuk DOM, browser
    // bisa menghitung ukuran 0x0 dan peta tampil dengan zoom salah.
    frame.src = mapsEmbedUrl(ev);
  });
}

/**
 * URL peta tertanam (read-only, tanpa tombol).
 * - Punya lat/lng  -> titik pin presisi di koordinat yang benar.
 * - Belum punya     -> pencarian berdasarkan nama venue.
 * Begitu klien mengisi koordinat, kode ini otomatis berubah tanpa
 * perlu disentuh.
 */
function mapsEmbedUrl(ev) {
  const q = (ev.lat != null && ev.lng != null)
    ? `${ev.lat},${ev.lng}`
    : `${ev.venue}, ${ev.address}, ${ev.city}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=17&output=embed`;
}

/** URL navigasi/petunjuk arah (membuka aplikasi peta di HP). */
function mapsDirectionsUrl(ev) {
  const dest = (ev.lat != null && ev.lng != null)
    ? `${ev.lat},${ev.lng}`
    : `${ev.venue}, ${ev.address}, ${ev.city}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
}

/* ---------- GALERI (masih grid; carousel di Tahap 4) ---------- */
function renderGallery() {
  const host = $('[data-render="gallery"]');
  if (!host) return;

  host.textContent = '';
  CONFIG.gallery.photos.forEach((photo, i) => {
    const img = el('img', {
      src: photo.src,
      alt: photo.alt,
      width: photo.width,
      height: photo.height,
      loading: 'lazy',
      dataset: { index: String(i) },
    });
    // srcset + sizes disusun dari konvensi nama file, lihat
    // lib/responsive.js. Foto placeholder SVG dilewati otomatis.
    applyResponsive(img, photo.src, 'gallery');
    host.append(img);
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
        el('span', { class: 'bank-card__icon' }, icon(bank.icon, { size: 22 })),
        el('h3', { text: bank.label }),
      ]),

      // Nomor yang DISALIN = bank.number (tanpa spasi).
      // Nomor yang DITAMPILKAN = bank.display.
      // `npm run check` memverifikasi keduanya konsisten.
      el('p', { class: 'bank-number', text: bank.display }),
      el('p', { class: 'bank-holder', text: `a.n. ${bank.holder}` }),

      // Tombol: ikon + teks lengkap, area sentuh >= 44px.
      // Label diambil dari config supaya klien bisa mengubahnya.
      el('button', {
        class: 'btn btn--sm btn--copy',
        type: 'button',
        dataset: {
          copy: bank.number,
          copyLabel: `Nomor ${bank.label}`,
          copySuccess: bank.copiedText,
        },
      }, [
        el('span', { class: 'btn__icon' }, icon('copy', { size: 16 })),
        el('span', { class: 'btn__label', text: bank.copyButton }),
      ]),

      el('p', { class: 'bank-hint', text: 'Nomor bisa disalin dengan sekali ketuk' }),
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
    node.textContent = '';
    node.append(icon(name, { size: Number(node.dataset.size) || 20 }));
  });
}

/* ---------- ENTRY ---------- */
export function renderAll() {
  bindText();
  renderCoupleNames();

  // Daftar-dinamis (acara, lokasi, kado) dibangun lebih dulu: elemennya
  // sudah membawa ikon sendiri lewat `icon()`.
  renderEvents();
  renderLocation();
  renderGallery();
  renderStory();
  renderBanks();
  renderRsvp();
  renderWishes();
  renderShare();

  // Terakhir: isi sisa `data-icon` yang ada di HTML statis.
  renderStaticIcons();}
