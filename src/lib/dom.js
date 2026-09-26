/* =========================================================
   src/lib/dom.js
   ---------------------------------------------------------------
   Helper DOM yang aman.

   RAHUNYA: untuk teks yang berasal dari pengguna (nama, ucapan),
   JANGAN PERNAH memakai innerHTML. Selalu lewat createTextNode /
   textContent. Inilah pertahanan utama terhadap XSS.
   ========================================================= */

export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/**
 * Buat elemen dengan aman.
 *
 * @param {string} tag
 * @param {object} attrs  - atribut biasa. Nilai null/undefined dilewati.
 *                         Key diawali "on" dianggap event listener.
 * @param {string|string|Node} children
 */
export function el(tag, attrs = {}, children = '') {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;

    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class') {
      node.className = value;
    } else if (key === 'dataset') {
      Object.assign(node.dataset, value);
    } else if (key === 'text') {
      node.textContent = value;
    } else {
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }

  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  if (children === null || children === undefined || children === false) return;

  if (Array.isArray(children)) {
    children.forEach((c) => appendChildren(node, c));
    return;
  }

  if (children instanceof Node) {
    node.append(children);
    return;
  }

  // String -> SELALU text node, bukan HTML.
  node.append(document.createTextNode(String(children)));
}

/** Buat elemen <svg> dari string path (path ini dari icons.js, bukan input user). */
export function svg(pathData, { size = 24, stroke = 2, fill = 'none' } = {}) {
  const NS = 'http://www.w3.org/2000/svg';
  const node = document.createElementNS(NS, 'svg');
  node.setAttribute('viewBox', '0 0 24 24');
  node.setAttribute('width', size);
  node.setAttribute('height', size);
  node.setAttribute('fill', fill);
  node.setAttribute('stroke', 'currentColor');
  node.setAttribute('stroke-width', stroke);
  node.setAttribute('stroke-linecap', 'round');
  node.setAttribute('stroke-linejoin', 'round');
  node.setAttribute('aria-hidden', 'true');
  node.setAttribute('focusable', 'false');
  node.innerHTML = pathData; // path originates from icons.js, not user input
  return node;
}

/** Format waktu relatif sederhana: "baru saja", "5 menit lalu". */
export function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
  return '';
}
