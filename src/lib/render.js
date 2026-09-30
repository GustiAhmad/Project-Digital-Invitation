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

import { CONFIG, eventStartISO, eventEndISO, eventFullAddress } from '../config.js';
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
    // supaya HP tidak mengunduh file sebesar layar penuh cuma untuk
    // thumbnail. Daftar lebar ikut diambil dari config yang sama.
    if (attr === 'src' && node.tagName === 'IMG') {
      const sizeKey = node.dataset.responsive || 'couple';
      // `data-widths-path` menunjuk ke array lebar di config,
      // contoh: "couple.bride.widths"
      const widthsPath = node.dataset.widthsPath;
      const widths = widthsPath ? resolve(widthsPath) : [];
      applyResponsive(node, value, sizeKey, widths);
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
    // Tanggal dihitung dari event ini sendiri, bukan dari PRIMARY_EVENT,
    // supaya kalau klien menambah acara di tanggal berbeda ikut benar.
    const dateLong = formatDateLong(event.date);

    const card = el('div', { class: 'event-card' },
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

      // Baris lokasi hanya muncul kalau ada nama lokasi. Kalau acara
      // di rumah, `venue` kosong dan alamat di bawah sudah cukup.
      // `el()` melompati null, jadi ": null" aman di sini.
      event.venue ? el('p', { class: 'event-venue' },
        el('span', { class: 'event-line' },
          el('span', { class: 'event-line__icon' }, icon('pin', { size: 16 })),
          el('span', { text: event.venue }))) : null,

      el('p', { class: 'event-address', text: addressLabel(event) }),

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

      // Dua jalan ke kalender, karena tidak semua orang pakai
      // Google Calendar. Lihat modules/calendar.js.
      //
      // Petunjuk per-perangkat WAJIB ada: tombol "Google Calendar"
      // dan "Simpan (.ics)" saja tidak menjelaskan ke tamu mana
      // yang benar untuk hapenya. Tamu iPhone yang salah klik akan
      // mendarat di halaman Google, diminta login, lalu menekan
      // tombol Simpan - dan banyak yang akhirnya menyerah tanpa
      // menyimpan tanggalnya.
      el('div', { class: 'event-card__calendar' }, [
        el('p', {
          class: 'event-card__calendar-hint',
          text: 'Simpan tanggal acara ke kalender',
        }),
        el('div', { class: 'event-card__calendar-row' }, [
          el('a', {
            class: 'btn btn--sm btn--ghost',
            href: '#',
            dataset: { calendar: 'google', eventId: event.id },
          }, [
            el('span', { class: 'btn__icon' }, icon('calendar', { size: 15 })),
            el('span', { text: 'Google Calendar' }),
          ]),
          el('span', { class: 'event-card__calendar-for', text: 'Android' }),
        ]),
        el('div', { class: 'event-card__calendar-row' }, [
          el('button', {
            class: 'btn btn--sm btn--ghost',
            type: 'button',
            dataset: { calendar: 'ics', eventId: event.id },
          }, [
            el('span', { class: 'btn__icon' }, icon('download', { size: 15 })),
            el('span', { text: 'Simpan (.ics)' }),
          ]),
          el('span', { class: 'event-card__calendar-for', text: 'iPhone' }),
        ]),
      ]),
    );

    host.append(card);
  });
}

/** Alamat satu baris tanpa bagian yang kosong. */
function addressLabel(event) {
  return [event.address, event.district, event.city, event.region]
    .filter(Boolean)
    .join(', ');
}

/* ---------- LOKASI ---------- */

/**
 * Satu acara = satu peta.
 *
 * Kenapa dipisah, padahal sekarang hanya ada satu acara? Karena saat
 * ini akad dan resepsi digabung, tapi tidak dijamin begitu selamanya.
 * Kalau nanti dipecah lagi dan lokasinya berbeda, struktur ini sudah
 * benar: tiap peta jelas milik acara yang mana, jadi tidak ada tamu
 * yang salah klik.
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
            el('strong', { text: ev.venue || ev.title }),
            el('span', { text: addressLabel(ev) }),
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
      title: `Peta lokasi ${ev.title}`,
      loading: 'lazy',
      referrerpolicy: 'no-referrer-when-downgrade',
      allowfullscreen: true,
    });

    mapList.append(el('article', { class: 'map-card', id: `venue-${ev.id}` }, [
      el('header', { class: 'map-card__head' }, [
        el('h3', { text: ev.title }),
        ev.venue ? el('p', { text: ev.venue }) : null,
        el('p', { class: 'map-card__address', text: addressLabel(ev) }),
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
          el('span', { text: 'Buka di Google Maps' }),
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
    : addressLabel(ev);
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=17&output=embed`;
}

/** URL navigasi/petunjuk arah (membuka aplikasi peta di HP). */
function mapsDirectionsUrl(ev) {
  const dest = (ev.lat != null && ev.lng != null)
    ? `${ev.lat},${ev.lng}`
    : addressLabel(ev);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
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

/* ---------- KONTAK / WHATSAPP ----------
   Tombol disembunyikan selama `contact.whatsapp` masih kosong,
   supaya tidak ada tautan wa.me yang tidak berguna.
   ------------------------------------------------------------------ */
/**
 * Section kontak dibangun seluruhnya di sini, bukan di index.html.
 *
 * Kenapa? Karena `contact.whatsapp` masih kosong. Versi sebelumnya
 * menuliskan section + judul "Ada pertanyaan?" langsung di HTML,
 * lalu hanya menyembunyikan tombolnya - jadi yang tertinggal di
 * halaman adalah judul itu sendiri dengan section kosong di
 * bawahnya. Klien minta bagian itu dihapus.
 *
 * Sekarang kalau `whatsapp` kosong, tidak ada apa pun yang dirender.
 * Begitu nomor diisi, section muncul lengkap dengan judul dari
 * config tanpa perlu menyentuh index.html.
 */
function renderContact() {
  const { title, label, whatsapp, message } = CONFIG.contact;
  if (!whatsapp) return;

  const host = el('section', { class: 'contact', ariaLabelledby: 'contact-title' },
    el('div', { class: 'container center' },
      el('h2', { class: 'title', id: 'contact-title', text: title }),
      el('div', { class: 'contact-actions' },
        el('a', {
          class: 'btn btn--block',
          href: `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`,
          target: '_blank',
          rel: 'noopener noreferrer',
        }, [
          el('span', { class: 'btn__icon' }, icon('smartphone', { size: 16 })),
          el('span', { text: label }),
        ]))));

  // Disisipkan sebelum section RSVP supaya urutan halaman tetap:
  // lokasi -> kontak -> RSVP.
  const rsvp = $('#rsvp');
  if (rsvp) rsvp.before(host);
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

/* ---------- GALERI ---------- */
/**
 * Galeri dibangun dari array di config.js supaya menambah/kurangi
 * foto cukup lewat config, bukan dengan menyunting HTML.
 *
 * `widths` dipakai src/modules/gallery.js untuk membangun srcset.
 * Foto yang belum punya file asli tetap dirender sebagai placeholder
 * bernomor, supaya jumlah slot dan tata letaknya bisa direview
 * sebelum klien mengirim fotonya.
 */
function renderGallery() {
  const host = $('[data-render="gallery"]');
  if (!host) return;

  const { photos } = CONFIG.gallery;
  host.textContent = '';

  if (!photos || !photos.length) {
    host.hidden = true;
    return;
  }

  host.hidden = false;
  photos.forEach((photo, i) => {
    host.append(el('div', { class: 'gallery-item' }, [
      el('img', {
        src: photo.src,
        alt: photo.alt,
        // width/height dummy: mencegah layout bergeser saat gambar
        // dimuat (CLS). Nanti gallery.js mengisinya dengan ukuran asli.
        loading: 'lazy',
        decoding: 'async',
        dataset: { galleryIndex: String(i) },
      }),
    ]));
  });
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
/* ---------- COVER ----------
   Foto latar diambil dari config lalu disuntikkan sebagai CSS
   custom property, bukan ditulis inline ke style atribut. Dengan
   begitu semua detail tampilannya (posisi, opacity, warna scrim)
   tetap di CSS, dan config hanya menentukan "foto mana".

   Nilai opacity dibatasi 0..0.6 di sini: kalau klien menaikkan
   opacity lewat config tanpa batas, teks putih bisa saja tenggelam
   di atas foto terang - persis masalah yang sebenarnya ingin
   diperbaiki.
   ------------------------------------------------------------------ */
function renderHero() {
  const bd = CONFIG.hero && CONFIG.hero.backdrop;
  const cover = $('#cover');
  if (!bd || !cover) return;

  // `src` kosong = wadah disiapkan tapi foto belum ada (klien belum
  // mengirim foto pre-wedding). Backdrop di-reset ke nilai default
  // CSS (tanpa foto), jadi cover kembali ke gradien solid.
  if (bd.src) {
    cover.style.setProperty('--hero-backdrop', `url("${bd.src}")`);
    cover.style.setProperty('--hero-backdrop-position', bd.position || '50% 30%');

    const raw = Number(bd.opacity);
    const safe = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 0.6) : 0.3;
    cover.style.setProperty('--hero-backdrop-opacity', String(safe));
  } else {
    cover.style.removeProperty('--hero-backdrop');
    cover.style.removeProperty('--hero-backdrop-position');
    cover.style.removeProperty('--hero-backdrop-opacity');
  }
}

export function renderAll() {
  bindText();
  renderHero();
  renderCoupleNames();

  // Daftar-dinamis (acara, lokasi) dibangun lebih dulu: elemennya
  // sudah membawa ikon sendiri lewat `icon()`.
  renderEvents();
  renderLocation();
  renderGallery();
  renderContact();
  renderRsvp();
  renderWishes();
  renderShare();

  // Terakhir: isi sisa `data-icon` yang ada di HTML statis.
  renderStaticIcons();}
