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
 * @param {...(string|Node|null|false|Array)} children
 *       (children opsional boleh banyak: el('div', {}, a, b, c). Nilai
 *        null/undefined/false dilewati, jadi conditional `cond ? el(..) : null`
 *        aman dipakai langsung tanpa filter manual.
 */
export function el(tag, attrs = {}, ...children) {
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

/**
 * Tambahkan anak ke `node`, melewati nilai kosong.
 * Dipakai juga sebagai pengganti `node.append(...)` native, karena
 * `append()` native tidak memfilter null dan akan menulis teks "null".
 */
export function addChildren(node, ...children) {
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

/** Format waktu relatif sederhana: "baru saja", "5 menit lalu". */
export function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
  return '';
}
