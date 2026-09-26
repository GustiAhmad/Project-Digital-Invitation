/* =========================================================
   src/lib/icons.js
   ---------------------------------------------------------------
   Ikon garis (line icon) gaya Lucide, lisensi MIT - bebas dipakai.

   Kenapa bukan FontAwesome / emoji?
     - Emoji: tampilan beda tiap OS, rasio kontras tidak
       terkontrol, dan screen reader membacakan nama emoji.
     - FontAwesome webfont: +90 KB, 1 request tambahan, 1 ikon
       = 1 glyph, sering tidak terpakai di halaman ini.
     - Inline SVG: 0 request, 0 byte CSS, warnanya bisa
       mengikuti tema, dan skalanya tajam di layar retina.
   ========================================================= */

const P = {
  rings: `
    <circle cx="9" cy="15" r="6"/><circle cx="15" cy="15" r="6"/>
    <path d="M9 9V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3"/>`,

  glass: `
    <path d="M4 3h16l-1.6 5.4a5 5 0 0 1-4.9 4.1h-3a5 5 0 0 1-4.9-4.1L4 3Z"/>
    <path d="M12 12.5V21"/>
    <path d="M8 21h8"/>`,

  calendar: `
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M8 3v4M16 3v4M3 11h18"/>`,

  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,

  pin: `
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>`,

  landmark: `
    <path d="M3 21h18M4 10v8M9 10v8M15 10v8M20 10v8M12 3 3 8h18l-9-5Z"/>`,

  smartphone: `
    <rect x="6" y="2" width="12" height="20" rx="3"/>
    <path d="M11 18h2"/>`,

  heart: `
    <path d="M12 20s-7-4.6-7-9.5A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.5C19 15.4 12 20 12 20Z"/>`,

  music: `
    <path d="M9 18V6l10-2v12"/>
    <circle cx="6.5" cy="18" r="2.5"/>
    <circle cx="16.5" cy="16" r="2.5"/>`,

  pause: `<rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/>`,

  play: `<path d="M7 4.5v15l13-7.5-13-7.5Z"/>`,

  copy: `
    <rect x="9" y="9" width="12" height="12" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`,

  check: `<path d="m5 13 4 4L19 7"/>`,

  x: `<path d="M6 6 18 18M18 6 6 18"/>`,

  chevronLeft: `<path d="m14 6-6 6 6 6"/>`,

  chevronRight: `<path d="m10 6 6 6-6 6"/>`,

  image: `
    <rect x="3" y="4" width="18" height="16" rx="2"/>
    <circle cx="9" cy="10" r="1.6"/>
    <path d="m4 18 5-5 4 4 3-3 4 4"/>`,

  share: `
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <path d="m8.6 10.6 6.8-4M8.6 13.4l6.8 4"/>`,

  users: `
    <circle cx="9" cy="8" r="3.2"/>
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0"/>
    <path d="M16.5 5.2a3.2 3.2 0 0 1 0 5.6M18 14.4A6.5 6.5 0 0 1 21.5 20"/>`,

  send: `<path d="M4 12 20 4l-4 16-4.5-6.2L4 12Z"/><path d="M11.5 13.8 20 4"/>`,

  sparkle: `<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>`,
};

/**
 * Buat elemen <svg> sebagai DOM node.
 *
 * Dipakai di semua tempat yang membangun UI lewat helper `el()`.
 * Mengembalikan Node, BUKAN string - jadi tidak ada jalur yang
 * memungkinkan markup tak sengaja masuk ke innerHTML.
 *
 * @param {string} name
 * @param {object} opts  { size, stroke, className, title }
 */
export function icon(name, { size = 24, stroke = 1.6, className = '' } = {}) {
  const path = P[name];
  if (!path) {
    console.warn(`[icons] Ikon tidak dikenal: "${name}"`);
    return document.createTextNode('');
  }

  const NS = 'http://www.w3.org/2000/svg';
  const node = document.createElementNS(NS, 'svg');
  node.setAttribute('viewBox', '0 0 24 24');
  node.setAttribute('width', size);
  node.setAttribute('height', size);
  node.setAttribute('fill', 'none');
  node.setAttribute('stroke', 'currentColor');
  node.setAttribute('stroke-width', stroke);
  node.setAttribute('stroke-linecap', 'round');
  node.setAttribute('stroke-linejoin', 'round');
  if (className) node.setAttribute('class', className);
  node.setAttribute('aria-hidden', 'true');
  node.setAttribute('focusable', 'false');

  // ---- Bangun isi ikon -----------------------------------------
  // PENTING: parse lewat DOMParser dengan 'image/svg+xml',
  // JANGAN lewat innerHTML pada <div>.
  //
  // Alasannya: kalau div.innerHTML = '<rect .../>', parser HTML tidak
  // tahu dia sedang berada di konteks SVG, sehingga yang dibuat adalah
  // HTMLUnknownElement pada namespace HTML. Elemen seperti itu di
  // dalam <svg> TIDAK tergambar - getBBox() mengembalikan 0 x 0,
  // dan ikonnya hanya berupa ruang kosong.
  //
  // parseFromString dengan 'image/svg+xml' membuat parser beralih ke
  // mode SVG, sehingga setiap path/rect/circle mendapat namespace
  // yang benar.
  const doc = new DOMParser().parseFromString(
    `<svg xmlns="${NS}">${path.trim()}</svg>`,
    'image/svg+xml',
  );
  const parsed = doc.documentElement;

  // Kalau parse gagal, jangan diam-diam menghasilkan ikon kosong.
  if (!parsed || parsed.nodeName === 'parsererror') {
    console.warn(`[icons] Gagal membuat SVG untuk ikon "${name}"`);
    return document.createTextNode('');
  }

  while (parsed.firstChild) node.append(parsed.firstChild);

  return node;
}

/**
 * Versi string untuk kasus yang benar-benar butuh string HTML
 * (mis. atribut data-* pada HTML statis).
 *
 * ⚠ JANGAN pernah memanggil ini dengan data dari pengguna.
 * Untuk UI yang dibangun dengan JS, pakai `icon()` di atas.
 */
export function iconMarkup(name, { size = 24, stroke = 1.6, className = '' } = {}) {
  const path = P[name];
  if (!path) {
    console.warn(`[icons] Ikon tidak dikenal: "${name}"`);
    return '';
  }
  return `<svg class="${className}" viewBox="0 0 24 24" width="${size}" height="${size}"
    fill="none" stroke="currentColor" stroke-width="${stroke}"
    stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true" focusable="false">${path.trim()}</svg>`;
}

export const ICON_NAMES = Object.keys(P);
